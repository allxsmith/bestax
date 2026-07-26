// Skill-path harvesting from a serialized tool input.
//
// Extracted so `bin/test-skill-paths.mjs` exercises the SAME code the collector runs. A
// test carrying its own copy of the pattern would drift from the implementation, which is
// precisely the failure this guard exists to catch: every prior revision of this regex
// shipped a hole, each one a partial recovery that still reported itself complete.

/**
 * @param {string} inputStr JSON.stringify of a tool_use block's input.
 * @returns {{refs: number, paths: string[], unresolved: number}}
 *   refs       how many `.claude/skills/` references the input mentions
 *   paths      those that resolved to a whole file path
 *   unresolved refs that did not — an interpolation, a glob, or a directory
 */
export function harvestSkillPaths(inputStr) {
  const refs = (inputStr.match(/\.claude\/skills\//g) ?? []).length;
  const paths = [];
  for (const m of inputStr.matchAll(
    /\.claude\/skills\/([A-Za-z0-9._/-]+)(.|$)/g
  )) {
    // A capture is only trustworthy if it stopped at a real delimiter. Stopping at a shell
    // metacharacter means the path was interpolated or globbed and the capture is a
    // fragment: `.claude/skills/bestax-${name}/SKILL.md` yields "bestax-". Keeping it would
    // both pollute the list and certify it as complete.
    if (/[$*?[{~`]/.test(m[2])) continue;
    // A trailing slash means the reference named a directory, not a file:
    // `ls .claude/skills/theming/` identifies no file to read, exactly like the bare
    // `ls .claude/skills/` that already counts unresolved.
    if (m[1].endsWith('/')) continue;
    paths.push(m[1]);
  }
  return { refs, paths, unresolved: refs - paths.length };
}
