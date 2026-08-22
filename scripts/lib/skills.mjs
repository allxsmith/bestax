// The ONE definition of "what is a skill": a directory under `skills/` holding
// a SKILL.md. Before this file, four consumers each hand-rolled the predicate
// (create-bestax/scripts/sync-skills.mjs, bestax-mcp/scripts/sync-skills.mjs,
// scripts/gen-mcp-index.mjs, scripts/check-conformance.mjs) and had already
// drifted to three different sort comparators — the same shape of drift
// scripts/lib/shell-words.mjs (#436) exists to prevent. All four import from
// here now; a predicate change lands once or not at all.

import { readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
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

    let hasSkillFile = true;
    try {
      await access(join(dir, entry.name, 'SKILL.md'));
    } catch {
      hasSkillFile = false;
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
 * The names in `names` whose SKILL.md is not in `trackedPaths` (paths relative
 * to the skills dir, as `git ls-files` prints them). Pure so it can be tested
 * without a fixture repository.
 */
export function untrackedAgainst(trackedPaths, names) {
  const tracked = new Set(trackedPaths);
  return names.filter(name => !tracked.has(`${name}/SKILL.md`));
}

/**
 * The vetting gate the deleted allowlist used to be (#541 review): discovery
 * bundles whatever is on disk, so an untracked scratch directory with a
 * SKILL.md would ship in a local build or a manual publish with no gate in the
 * path — CI's skills-roster check only ever sees committed state. Bundlers
 * call this and refuse untracked skills; `git add` is the act of vetting.
 *
 * Returns [] when git is unavailable or the tree is not a repository (a
 * consumer building from an exported tarball has nothing to vet against).
 */
export function untrackedSkillDirs(skillsDir, names) {
  let output;
  try {
    output = execFileSync('git', ['-C', skillsDir, 'ls-files', '--', '.'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return [];
  }
  return untrackedAgainst(output.split('\n'), names);
}
