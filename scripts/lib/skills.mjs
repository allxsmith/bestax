// The ONE definition of "what is a skill": a directory under `skills/` holding
// a SKILL.md. Before this file, four consumers each hand-rolled the predicate
// (create-bestax/scripts/sync-skills.mjs, bestax-mcp/scripts/sync-skills.mjs,
// scripts/gen-mcp-index.mjs, scripts/check-conformance.mjs) and had already
// drifted to three different sort comparators — the same shape of drift
// scripts/lib/shell-words.mjs (#436) exists to prevent. All four import from
// here now; a predicate change lands once or not at all.
// scripts/gen-skills-repo.mjs, a fifth consumer, imports from here too and
// takes its skill files from the same vetted walk as the two sync scripts.

import { lstat, readdir, stat } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * Skill directory names have to be expressible in every prose roster pattern,
 * all of which capture a kebab-case token. A name outside that shape would
 * make the skills-roster check permanently unsatisfiable: it would report the
 * skill missing, and the line it tells you to paste still would not match.
 */
export const SKILL_DIR_NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Deterministic, locale-independent comparator. Never localeCompare: ICU
 * collation varies with the machine's locale (punctuation can be ignorable at
 * primary strength), so localeCompare orderings differ across CI runners —
 * the flake gen-mcp-index.mjs banned for the same reason.
 */
export function byCodePoint(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Every candidate directory under `skills/`, with whether it actually holds a
 * SKILL.md. Returned together so callers can complain about the ones that do
 * not, instead of silently skipping them — a half-landed skill directory is
 * exactly the silent omission the roster check exists to end.
 *
 * A dotted directory WITHOUT a SKILL.md is tooling and is ignored; one WITH a
 * SKILL.md is reported, because every consumer of this predicate really would
 * bundle it.
 *
 * `isSymlink` marks a symbolic link to a directory. It stays in the skill set
 * so every tool sees the same skills, and every tool refuses it: the
 * conformance check reports it, and skillFiles throws on it for the sync
 * scripts and the MCP index.
 */
export async function readSkillDirs(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    // A symbolic link counts only when it points at a directory, so a linked
    // file such as `AGENTS.md -> CLAUDE.md` is not mistaken for a skill. A
    // linked directory is listed and marked rather than skipped, so every
    // consumer refuses it instead of quietly leaving it out.
    const isSymlink = entry.isSymbolicLink();
    const isDir = isSymlink
      ? await stat(join(dir, entry.name)).then(
          s => s.isDirectory(),
          () => false
        )
      : entry.isDirectory();
    if (!isDir) continue;

    // A regular file specifically: a directory named SKILL.md would satisfy
    // a bare existence probe and then break every consumer that reads it.
    let hasSkillFile = false;
    try {
      hasSkillFile = (await stat(join(dir, entry.name, 'SKILL.md'))).isFile();
    } catch {
      // missing → not a skill
    }

    if (entry.name.startsWith('.') && !hasSkillFile) continue;

    found.push({ name: entry.name, hasSkillFile, isSymlink });
  }
  return found.sort((a, b) => byCodePoint(a.name, b.name));
}

/**
 * The bundling view: what the sync scripts copy and gen-mcp-index indexes.
 * READ from the directory — never a hardcoded list (#540).
 */
export async function readSkillNames(dir) {
  return bundledSkillNames(await readSkillDirs(dir));
}

/**
 * readSkillNames for `dirs` already read with readSkillDirs, so a caller
 * holding both views does not walk the directory twice.
 */
export function bundledSkillNames(dirs) {
  return dirs.filter(d => d.hasSkillFile).map(d => d.name);
}

/**
 * A skill's slug, its directory name minus the `bestax-` prefix
 * (`bestax-theming` -> `theming`): the MCP prompt name, and the name of its
 * page under docs/docs/skills/ and its docs/sidebars.js entry.
 */
export function skillSlug(name) {
  return name.replace(/^bestax-/, '');
}

/**
 * The comparison view the skills-roster check holds prose to: bundled AND
 * expressible. An unexpressible name gets its own violation instead — asking
 * nine prose rosters to name something they cannot spell would bury it.
 * Exported so the check and its tests derive the set the same way.
 */
export function rosterSkillNames(dirs) {
  return dirs
    .filter(d => d.hasSkillFile && SKILL_DIR_NAME.test(d.name))
    .map(d => d.name);
}

/**
 * The paths in `candidatePaths` (relative to the skills dir, as git prints
 * them) that sit inside one of the bundled skill directories in `names`. Pure
 * so it can be tested without a fixture repository.
 */
export function pathsInsideSkills(candidatePaths, names) {
  const bundled = new Set(names);
  return candidatePaths.filter(p => p && bundled.has(p.split('/')[0]));
}

/**
 * Finder's `.DS_Store`, the one path the vetting gate exempts. Every bundler
 * filters it out of its copy, and the MCP index out of its listing, so the
 * exemption never becomes shipped content.
 */
export function isDsStore(path) {
  return path.endsWith('.DS_Store');
}

/**
 * The error code a refusal carries: a skill file that is untracked or a
 * symbolic link, or a sync that cannot start. Its message says what to do.
 * Callers tell it apart from an unexpected failure, such as a permission
 * error, which should keep its own message and stack.
 */
export const SKILL_REFUSAL = 'ESKILLREFUSAL';

/** An Error with `message` and `options` that carries SKILL_REFUSAL. */
export function skillRefusal(message, options) {
  return Object.assign(new Error(message, options), { code: SKILL_REFUSAL });
}

export function isSkillRefusal(err) {
  return err?.code === SKILL_REFUSAL;
}

/**
 * What a command line prints when it fails: the message alone for a refusal,
 * which already says what to do, and the full stack for anything else, a
 * filesystem or programming error someone has to debug. The sync scripts and
 * gen-mcp-index all print through this, so they classify a failure the same
 * way, by its code.
 */
export function failureText(err) {
  if (isSkillRefusal(err)) return String(err.message);
  return String(err?.stack ?? err?.message ?? err);
}

/**
 * The files under `dir` a bundler ships, as paths relative to it with
 * forward slashes: depth first, each directory's entries in code-point
 * order, and nothing isDsStore matches. What the MCP index lists, so it
 * cannot list a file the sync scripts leave out. Throws a refusal on a
 * symbolic link, at `dir` itself or anywhere below it.
 */
export async function skillFiles(dir) {
  if ((await lstat(dir)).isSymbolicLink()) {
    throw skillRefusal(`${dir} is a symbolic link. Commit the real directory.`);
  }
  const out = [];
  const walk = async rel => {
    const entries = await readdir(join(dir, rel), { withFileTypes: true });
    for (const e of entries.sort((a, b) => byCodePoint(a.name, b.name))) {
      const next = rel ? `${rel}/${e.name}` : e.name;
      // .DS_Store is skipped first, file or link alike, since
      // `ln -s /dev/null .DS_Store` is a common way to stop Finder writing
      // one. Skipping a link is safe because the bundlers copy only the
      // files this walk lists, so nothing under that name can ship.
      if (isDsStore(next)) continue;
      // Any other symbolic link is refused, not skipped. Copied as a link it
      // would point at this checkout and dangle once the package leaves this
      // machine. Followed, it would ship whatever it points at, which the
      // vetting gate never saw.
      if (e.isSymbolicLink()) {
        throw skillRefusal(
          `${join(dir, next)} is a symbolic link. ` +
            'Commit the real file or directory.'
        );
      }
      if (e.isDirectory()) await walk(next);
      else if (e.isFile()) out.push(next);
    }
  };
  await walk('');
  return out;
}

/**
 * Throws when untrackedSkillPaths finds anything in the skills `names`: the
 * refusal both sync scripts and the MCP index give, so none of them can
 * carry a file that the others refuse. `verb` names what was refused.
 */
export function assertSkillsVetted(skillsDir, names, verb, options) {
  const untracked = untrackedSkillPaths(skillsDir, names, options);
  if (untracked.length) {
    throw skillRefusal(
      `refusing to ${verb} untracked file(s) under skills/: ` +
        `${untracked.join(', ')}. \`git add\` them to vet them, or remove them.`
    );
  }
}

/**
 * Each skill in `names` under `skillsDir` with the files a bundler ships,
 * once the checks every bundler makes pass: `{ name, dir, files }`, where
 * `files` is skillFiles' list for `dir`. A caller copies exactly that list,
 * so what was checked is what ships, and each skill is walked once.
 *
 * The walk comes first and the vetting gate second, so every listed file
 * already existed when git was asked about it. Throws the refusal skillFiles
 * or assertSkillsVetted gives. `verb` names what was refused, and `options`
 * go to untrackedSkillPaths. The sync scripts and scripts/gen-skills-repo.mjs
 * all take their files from here.
 */
export async function vettedSkillFiles(skillsDir, names, verb, options) {
  const skills = [];
  for (const name of names) {
    const dir = join(skillsDir, name);
    skills.push({ name, dir, files: await skillFiles(dir) });
  }
  assertSkillsVetted(skillsDir, names, verb, options);
  return skills;
}

function git(cwd, args) {
  // stderr is captured, not shown, so a refusal can quote it.
  return execFileSync('git', ['-C', cwd, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/** Why a git call failed, in one line: git is missing, or git's own words. */
function gitCause(err) {
  if (err?.code === 'ENOENT') return 'git is not installed or not on PATH';
  const said = String(err?.stderr ?? '')
    .trim()
    .split('\n')[0];
  return said || String(err?.message ?? err);
}

/**
 * The output of `git -C <cwd> <args>`, when git speaks for the repository
 * whose top is `root`. Otherwise it throws a refusal naming the cause:
 * - git is unavailable, or `cwd` is not inside any repository, or
 * - git resolves some OTHER repository than `root`. An exported (git-less)
 *   bestax tree nested under a git-managed directory would otherwise report
 *   every skill untracked and hard-fail the build (#550 review). The gate only
 *   speaks for the repository whose root actually contains these files, or
 * - the command itself fails.
 *
 * Behind both views below and scripts/gen-skills-repo.mjs's commit count, so
 * none of them can disagree about which repository they are reading.
 */
export function rootGit(cwd, root, args) {
  let toplevel;
  try {
    toplevel = git(cwd, ['rev-parse', '--show-toplevel']).trim();
  } catch (err) {
    throw skillRefusal(`git cannot read ${cwd}: ${gitCause(err)}`, {
      cause: err,
    });
  }
  let same;
  try {
    // realpath both sides: git prints physical paths (macOS /tmp → /private/tmp).
    same = realpathSync(toplevel) === realpathSync(resolve(root));
  } catch (err) {
    throw skillRefusal(`cannot resolve ${root}: ${err.message}`, {
      cause: err,
    });
  }
  if (!same) {
    throw skillRefusal(
      `git reads ${cwd} as part of the repository at ${toplevel}, not ${root}`
    );
  }
  try {
    return git(cwd, args);
  } catch (err) {
    throw skillRefusal(`git ${args[0]} failed in ${cwd}: ${gitCause(err)}`, {
      cause: err,
    });
  }
}

/**
 * The paths `git -C <cwd> ls-files -z <args>` prints, relative to `cwd`.
 * When git cannot speak for this tree, for any of rootGit's reasons, it
 * returns null, so an exported tree has nothing to vet against. With
 * `requireCheckout` it throws a refusal naming the cause instead, for a
 * caller such as the plugin workflow's generate job, where a missing gate
 * must stop the run rather than let every file through.
 *
 * `-z` so a path git would quote, such as one with a non-ASCII name, still
 * starts with its skill directory.
 */
function gitListing(cwd, root, args, { requireCheckout = false } = {}) {
  try {
    return rootGit(cwd, root, ['ls-files', '-z', ...args])
      .split('\0')
      .filter(Boolean);
  } catch (err) {
    if (!requireCheckout) return null;
    throw skillRefusal(
      `this run requires a git checkout to vet its files, and ${err.message}`,
      { cause: err }
    );
  }
}

/**
 * The vetting gate the deleted allowlist used to be (#541 review): discovery
 * bundles whatever is on disk, so untracked content would ship in a local
 * build or a manual publish with no gate in the path — CI's skills-roster
 * check only ever sees committed state. Bundlers call this and refuse
 * untracked FILES, not just directories: sync copies whole skill directories
 * off disk, so a scratch note dropped into a tracked skill ships exactly like
 * a scratch skill would. `git add` is the act of vetting; `.gitignore`d noise
 * (`.DS_Store`) stays exempt via --exclude-standard.
 *
 * Returns [] when there is nothing to vet against, in the cases gitListing
 * returns null for. With `{ requireCheckout: true }` those cases throw
 * gitListing's refusal instead.
 */
export function untrackedSkillPaths(skillsDir, names, options) {
  // No --exclude-standard: sync copies everything on disk, so gitignored
  // content inside a skill (.env, *.log, a stray node_modules) would ship
  // right past an exclude-standard gate. The one exemption is .DS_Store —
  // Finder drops it everywhere and the sync scripts filter it out of the
  // copy instead, so it neither blocks builds nor ships.
  const others = gitListing(
    skillsDir,
    dirname(skillsDir),
    ['--others', '--', '.'],
    options
  );
  if (!others) return [];
  return pathsInsideSkills(
    others.filter(p => !isDsStore(p)),
    names
  );
}

/**
 * Which of `paths` (relative to `root`, the top of the repository) git
 * tracks, or null when git cannot speak for the tree, as above, and the
 * same refusal with `{ requireCheckout: true }`. For a bundler's inputs
 * outside skills/, held to the same gate as the skills:
 * scripts/gen-skills-repo.mjs reads its plugin template and bestax-mcp's
 * manifests only when git tracks them.
 */
export function trackedRepoPaths(root, paths, options) {
  return gitListing(root, root, ['--', ...paths], options);
}
