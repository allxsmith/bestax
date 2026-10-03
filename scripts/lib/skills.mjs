// The ONE definition of "what is a skill": a directory under `skills/` holding
// a SKILL.md. Before this file, four consumers each hand-rolled the predicate
// (create-bestax/scripts/sync-skills.mjs, bestax-mcp/scripts/sync-skills.mjs,
// scripts/gen-mcp-index.mjs, scripts/check-conformance.mjs) and had already
// drifted to three different sort comparators — the same shape of drift
// scripts/lib/shell-words.mjs (#436) exists to prevent. All four import from
// here now; a predicate change lands once or not at all.
// scripts/gen-skills-repo.mjs, a fifth consumer, imports from here too and
// shares the vetting gate below with the two sync scripts.

import { readdir, stat } from 'node:fs/promises';
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
 */
export async function readSkillDirs(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    // A regular file specifically: a directory named SKILL.md would satisfy
    // a bare existence probe and then break every consumer that reads it.
    let hasSkillFile = false;
    try {
      hasSkillFile = (await stat(join(dir, entry.name, 'SKILL.md'))).isFile();
    } catch {
      // missing → not a skill
    }

    if (entry.name.startsWith('.') && !hasSkillFile) continue;

    found.push({ name: entry.name, hasSkillFile });
  }
  return found.sort((a, b) => byCodePoint(a.name, b.name));
}

/**
 * The bundling view: what the sync scripts copy and gen-mcp-index indexes.
 * READ from the directory — never a hardcoded list (#540).
 */
export async function readSkillNames(dir) {
  return (await readSkillDirs(dir))
    .filter(d => d.hasSkillFile)
    .map(d => d.name);
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

function git(cwd, args) {
  return execFileSync('git', ['-C', cwd, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

/**
 * The paths `git -C <cwd> ls-files -z <args>` prints, relative to `cwd`, or
 * null when git cannot speak for this tree:
 * - git is unavailable, or the tree is not inside any repository, or
 * - git resolves some OTHER repository than `root`. An exported (git-less)
 *   bestax tree nested under a git-managed directory would otherwise report
 *   every skill untracked and hard-fail the build (#550 review). The gate only
 *   speaks for the repository whose root actually contains these files.
 *
 * One helper behind every view below, so they cannot disagree about which
 * repository they are reading.
 */
function gitListing(cwd, root, args) {
  try {
    const toplevel = git(cwd, ['rev-parse', '--show-toplevel']).trim();
    // realpath both sides: git prints physical paths (macOS /tmp → /private/tmp).
    if (realpathSync(toplevel) !== realpathSync(resolve(root))) return null;
    return git(cwd, ['ls-files', '-z', ...args])
      .split('\0')
      .filter(Boolean);
  } catch {
    return null;
  }
}

/** gitListing for a skills directory that sits at its repository's root. */
function gitSkillFiles(skillsDir, args) {
  return gitListing(skillsDir, dirname(skillsDir), [...args, '--', '.']);
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
 * returns null for.
 */
export function untrackedSkillPaths(skillsDir, names) {
  // No --exclude-standard: sync copies everything on disk, so gitignored
  // content inside a skill (.env, *.log, a stray node_modules) would ship
  // right past an exclude-standard gate. The one exemption is .DS_Store —
  // Finder drops it everywhere and the sync scripts filter it out of the
  // copy instead, so it neither blocks builds nor ships.
  const others = gitSkillFiles(skillsDir, ['--others']);
  if (!others) return [];
  return pathsInsideSkills(
    others.filter(p => !p.endsWith('.DS_Store')),
    names
  );
}

/**
 * The tracked files of the bundled skill directories in `names`, relative to
 * `skillsDir`: what a bundler that copies file by file should copy. Null, not
 * [], when git cannot speak for the tree (gitListing), so a caller can
 * tell "nothing is tracked" from "nothing to ask" and fall back to the disk,
 * the way the sync scripts do when untrackedSkillPaths returns [].
 */
export function trackedSkillPaths(skillsDir, names) {
  const tracked = gitSkillFiles(skillsDir, []);
  return tracked && pathsInsideSkills(tracked, names);
}

/**
 * Which of `paths` (relative to `root`, the top of the repository) git
 * tracks, or null when git cannot speak for the tree, as above. For a
 * bundler's inputs outside skills/, held to the same gate as the skills.
 */
export function trackedRepoPaths(root, paths) {
  return gitListing(root, root, ['--', ...paths]);
}
