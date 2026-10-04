// Copy the canonical Agent Skills from the monorepo's top-level `skills/` into
// a package. create-bestax/scripts/sync-skills.mjs (into templates/skills, so
// scaffolded apps get them) and bestax-mcp/scripts/sync-skills.mjs (into
// data/skills, so the server can serve their bodies offline) each used to
// carry a near-identical copy of this. They are thin callers now, and each
// says why it does or does not take the lock below.
//
// `/skills` is the single source of truth, and every destination is generated
// and gitignored. The roster is READ, not listed (#540): every directory
// holding a SKILL.md is copied, through the shared predicate in skills.mjs.
import {
  copyFile,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { dirname, join } from 'node:path';

import {
  assertSkillsVetted,
  isSkillRefusal,
  readSkillNames,
  skillFiles,
  skillRefusal,
} from './skills.mjs';

const TAG = '[sync-skills]';

/**
 * An expected failure: tagged, and carrying the refusal code, so a caller
 * printing failureText shows this message alone.
 */
function refusal(message, options) {
  return skillRefusal(`${TAG} ${message}`, options);
}

// A sync is ~390 KB of file copies and takes tens of milliseconds. A lock held
// longer than this is a crashed run, not a slow one.
const LOCK = { staleMs: 60_000, timeoutMs: 120_000, pollMs: 50 };

const SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'];

/**
 * Copy every skill under `src` into `dest`, after the checks every bundler
 * makes, and log one line saying what happened. On any expected failure it
 * throws an Error whose message starts with `[sync-skills]` and that carries
 * the refusal code, so the caller prints it with failureText.
 *
 * - `label` is how the success line names `dest` (`templates/skills`).
 * - `stateDir`, when given, holds a lock and a fingerprint of the source.
 *   Concurrent callers then take turns, and a run whose source matches the
 *   last copy changes nothing. Without it every run empties `dest` and copies
 *   afresh, which is only safe when no two callers ever overlap.
 * - `lock` overrides the lock timings, for tests.
 */
export async function syncSkills({
  src,
  dest,
  label,
  stateDir,
  lock = {},
  log = console.log,
}) {
  if (!existsSync(src)) throw refusal(`source not found: ${src}`);

  const names = await readSkillNames(src);

  // Checked BEFORE emptying the destination. Reading a roster off disk means
  // a wrong path or a renamed directory yields zero skills instead of an
  // error, and emptying first would ship an empty bundle rather than failing.
  if (!names.length) throw refusal(`no skills found in ${src}`);

  if (!stateDir) {
    await copySkills(dest, await vettedSkills(src, names));
    log(`${TAG} copied ${names.length} skills -> ${label}`);
    return;
  }

  const timing = { ...LOCK, ...lock };
  const stampFile = join(stateDir, 'fingerprint');
  const held = { dir: join(stateDir, 'lock'), held: false };

  await mkdir(stateDir, { recursive: true });

  // Release on interrupt. Ctrl-C during `pnpm all` is the realistic way a lock
  // gets abandoned, and node does not run `finally` blocks on a signal, so
  // without this the next run would meet a lock nobody holds. The handlers go
  // again once the run ends, so a caller that syncs twice does not stack them.
  const onSignal = () => {
    release(held);
    process.exit(130);
  };
  for (const signal of SIGNALS) process.once(signal, onSignal);

  try {
    await acquireLock(held, timing);
    // Vetted only once the lock is held. A run can wait on it for minutes,
    // and a file or link added meanwhile is caught here, because the
    // fingerprint and the copy both use this list and nothing else.
    const skills = await vettedSkills(src, names);
    const want = await fingerprint(skills);
    const have = await readFile(stampFile, 'utf8').catch(() => '');

    // The freshness check is load-bearing, not an optimisation. Without it a
    // second and third caller would re-run the destructive copy below while
    // the FIRST caller's jest is already reading the copy, and `rm` would
    // delete the tree out from under it. Skipping the work when it is already
    // done is what actually makes concurrent callers safe. The lock alone
    // would not.
    if (have.trim() === want && existsSync(dest)) {
      log(`${TAG} up to date (${names.length} skills)`);
    } else {
      await copySkills(dest, skills);
      // Stamped last: a run killed mid-copy leaves no stamp, so the next
      // caller redoes the work rather than trusting a half-populated tree.
      await writeFile(stampFile, `${want}\n`);
      log(`${TAG} copied ${names.length} skills -> ${label}`);
    }
  } finally {
    release(held);
    for (const signal of SIGNALS) process.off(signal, onSignal);
  }
}

/**
 * Each skill in `names` with the files a copy ships, once every bundler's
 * checks pass: `{ name, dir, files }`, where `files` is skillFiles' list for
 * `dir`. The fingerprint and the copy both take this list, so what was
 * checked is exactly what ships, and each skill is walked once.
 *
 * skillFiles leaves every `.DS_Store` out and refuses any other symbolic
 * link in a skill, the skill directory included. The vetting gate is the
 * one the deleted allowlist used to be: discovery bundles whatever is on
 * disk, and CI's skills-roster check only sees committed state, so an
 * untracked scratch file would ship in a local build or a manual publish
 * with no gate anywhere in the path. `git add` is the act of vetting, and a
 * tree without git (an exported tarball) skips the gate. It runs after the
 * walk, so every listed file already existed when git was asked about it.
 *
 * Only those refusals get the tag. Anything else, such as a permission error,
 * passes through with its own message and stack.
 */
async function vettedSkills(src, names) {
  try {
    const skills = [];
    for (const name of names) {
      const dir = join(src, name);
      skills.push({ name, dir, files: await skillFiles(dir) });
    }
    assertSkillsVetted(src, names, 'bundle');
    return skills;
  } catch (err) {
    if (!isSkillRefusal(err)) throw err;
    throw refusal(err.message, { cause: err });
  }
}

/**
 * Empty `dest`, then copy exactly the files vettedSkills listed into it. A
 * file that appeared on disk after the walk is not in the list, so it is not
 * copied. Exported for its test.
 */
export async function copySkills(dest, skills) {
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  for (const { name, dir, files } of skills) {
    for (const rel of files) {
      const to = join(dest, name, rel);
      await mkdir(dirname(to), { recursive: true });
      await copyFile(join(dir, rel), to);
    }
  }
}

// Hash of every source path and its bytes, over the files a copy ships.
// Content rather than mtime on purpose: a fresh clone or a branch switch
// rewrites mtimes without changing what should be copied, and re-copying is
// the cheap half. It is the destructive `rm` that has to be avoided while
// another process is reading.
async function fingerprint(skills) {
  const hash = createHash('sha256');
  for (const { name, dir, files } of skills) {
    for (const rel of files) {
      hash.update(`${name}/${rel}`);
      hash.update(await readFile(join(dir, rel)));
    }
  }
  return hash.digest('hex');
}

// Sync calls only: on a signal the process is on its way out and async
// cleanup would not finish.
function release(lock) {
  if (!lock.held) return;
  lock.held = false;
  try {
    rmSync(lock.dir, { recursive: true, force: true });
  } catch {
    // Best effort, since we are already exiting.
  }
}

// `mkdir` without `recursive` is atomic and fails with EEXIST if the directory
// exists, which makes it a usable mutex with no dependency.
//
// There is deliberately NO automatic stale-lock reclaim, and that is the
// subtle part. The obvious version (stat the lock, and if it looks old enough
// delete it and retry) has a time-of-check/time-of-use hole: nothing ties the
// delete to the *specific* lock that was observed. Two waiters can both see
// the same abandoned lock, the first deletes it and takes ownership, and the
// second then deletes the *fresh* lock the first is holding. Both proceed into
// the destructive copy, which is precisely the concurrent rm-while-copying
// bug this lock exists to prevent, now reachable only after a crash and
// therefore much harder to reproduce.
//
// The freshness stamp does not rescue that case either: a killed run leaves a
// lock but no stamp (the stamp is written last, on purpose), so both waiters
// see a mismatch and both rebuild.
//
// Every cheap repair keeps a window. Owner tokens, rename-to-unique, put-it-
// back-if-it-was-not-mine all still race on the recreate. Crash-safe mutual
// exclusion on a POSIX filesystem is genuinely hard, and a build script is the
// wrong place to hand-roll it. So an abandoned lock is reported with the exact
// command to fix it rather than guessed at. The signal handlers above mean the
// common interrupt never gets here in the first place.
async function acquireLock(lock, { staleMs, timeoutMs, pollMs }) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      await mkdir(lock.dir);
      lock.held = true;
      return;
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;

      let ageMs;
      try {
        ageMs = Date.now() - (await stat(lock.dir)).mtimeMs;
      } catch {
        // Released between our mkdir and our stat. Retry immediately.
        continue;
      }

      // Held far longer than a sync can legitimately take, so the holder is
      // gone. Report it now instead of burning the full timeout first.
      if (ageMs > staleMs) {
        throw refusal(
          `the lock at ${lock.dir} has been held for ` +
            `${Math.round(ageMs / 1000)}s, which means an earlier run was killed ` +
            `before it could clean up. Remove that directory and re-run:\n` +
            `  rm -rf ${lock.dir}`,
          { cause: err }
        );
      }

      if (Date.now() > deadline) {
        throw refusal(`timed out waiting for lock: ${lock.dir}`, {
          cause: err,
        });
      }
      await sleep(pollMs);
    }
  }
}

// Concurrency
// -----------
// `pnpm all` runs `turbo run build typecheck test test:coverage`, and
// bestax-mcp's build, test and test:coverage scripts each invoke its sync. On
// a cold turbo cache all three start within milliseconds of each other, and the
// original implementation went straight to `rm -rf data/skills` followed by a
// per-skill copy. Interleaving those produced a different error every run
// (ENOENT on copyfile, EEXIST on mkdir, ENOTEMPTY on rmdir), which read as three
// unrelated flakes rather than one race.
//
// It stayed hidden because a warm cache means only one of the three actually
// executes. It surfaces reliably right after a merge, on a fresh clone, and in
// CI, which is the worst possible time for it.
//
// Fixed here rather than in turbo.json because `pnpm --filter bestax-mcp test`
// has to keep working on its own (bestax-mcp/CLAUDE.md documents it), so the
// script cannot rely on a task graph to serialise its callers.
