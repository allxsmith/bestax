#!/usr/bin/env node
// Guard for the skill-path harvest. Run before and after touching the regex:
//
//   node eval/agent-loop/bin/test-skill-paths.mjs
//
// Exits non-zero on any failure. Every case below is a shape that either shipped a bug or
// was claimed correct without being executed — four separate revisions of this pattern each
// certified a partial recovery as complete, so it gets an executable guard rather than a
// second careful read.

import { harvestSkillPaths } from './lib/skill-paths.mjs';

const serialize = command => JSON.stringify({ command });

// [label, shell command, expected unresolved, expected resolved paths]
const CASES = [
  [
    'literal file read',
    'cat .claude/skills/theming/SKILL.md',
    0,
    ['theming/SKILL.md'],
  ],
  [
    'nested reference',
    'cat .claude/skills/a/references/b.md',
    0,
    ['a/references/b.md'],
  ],
  ['full interpolation', 'cat .claude/skills/${skill}/SKILL.md', 1, []],
  [
    'partial interpolation',
    'cat .claude/skills/bestax-${name}/SKILL.md',
    1,
    [],
  ],
  ['interpolation, later segment', 'cat .claude/skills/theming/${file}', 1, []],
  [
    'interpolation mid-segment',
    'cat .claude/skills/theming/ref-${n}.md',
    1,
    [],
  ],
  ['bracket glob', 'cat .claude/skills/[ab]/SKILL.md', 1, []],
  ['star glob', 'cat .claude/skills/*/SKILL.md', 1, []],
  ['brace expansion', 'cat .claude/skills/{a,b}/SKILL.md', 1, []],
  ['tilde', 'cat .claude/skills/~a/SKILL.md', 1, []],
  ['backtick command sub', 'cat .claude/skills/`n`/SKILL.md', 1, []],
  ['root directory listing', 'ls .claude/skills/', 1, []],
  ['sub-directory listing', 'ls .claude/skills/theming/', 1, []],
  ['grep of the literal', "grep -c '.claude/skills/' t.jsonl", 1, []],
  [
    'two literals, space separated',
    'cat .claude/skills/a/S.md .claude/skills/b/S.md',
    0,
    ['a/S.md', 'b/S.md'],
  ],
  [
    'two literals, comma separated',
    'cat .claude/skills/a/S.md,.claude/skills/b/S.md',
    0,
    ['a/S.md', 'b/S.md'],
  ],
  [
    'two literals, semicolon separated',
    'cat .claude/skills/a/S.md;cat .claude/skills/b/S.md',
    0,
    ['a/S.md', 'b/S.md'],
  ],
  [
    'literal mixed with interpolation',
    'cat .claude/skills/a/S.md .claude/skills/${s}/S.md',
    1,
    ['a/S.md'],
  ],
  ['piped literal', 'cat .claude/skills/a/S.md | head -50', 0, ['a/S.md']],
  ['quoted literal', 'cat ".claude/skills/a/S.md"', 0, ['a/S.md']],
];

// No separator at all: the two references merge into one greedy capture. Conservative by
// design — it must report unresolved > 0 rather than falsely certify the list as complete.
const NO_SEPARATOR = 'cat .claude/skills/a/S.md.claude/skills/b/S.md';

let failed = 0;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

for (const [label, command, wantUnresolved, wantPaths] of CASES) {
  const got = harvestSkillPaths(serialize(command));
  const ok =
    got.unresolved === wantUnresolved &&
    eq(got.paths.sort(), [...wantPaths].sort());
  if (!ok) {
    failed++;
    console.error(`FAIL  ${label}`);
    console.error(`        input      ${command}`);
    console.error(
      `        expected   unresolved=${wantUnresolved} paths=${JSON.stringify(wantPaths)}`
    );
    console.error(
      `        got        unresolved=${got.unresolved} paths=${JSON.stringify(got.paths)}`
    );
  } else {
    console.log(`ok    ${label}`);
  }
}

// Invariants, checked across every case rather than asserted per-case.
for (const [label, command] of CASES) {
  const { refs, paths, unresolved } = harvestSkillPaths(serialize(command));
  if (unresolved < 0) {
    failed++;
    console.error(
      `FAIL  ${label}: unresolved went NEGATIVE (refs=${refs} paths=${paths.length})`
    );
  }
  if (paths.some(p => /[$*?[{~`]/.test(p) || p.endsWith('/'))) {
    failed++;
    console.error(
      `FAIL  ${label}: kept a fragment or directory — ${JSON.stringify(paths)}`
    );
  }
}

const noSep = harvestSkillPaths(serialize(NO_SEPARATOR));
if (noSep.unresolved <= 0) {
  failed++;
  console.error(
    `FAIL  no-separator concatenation must stay conservative, got unresolved=${noSep.unresolved}`
  );
} else if (noSep.paths.length > 0) {
  // Flagging it as unresolved is not enough: the merged capture is not a file anyone read,
  // so it must not appear in skill_files either.
  failed++;
  console.error(
    `FAIL  no-separator concatenation must resolve NO paths, got ${JSON.stringify(noSep.paths)}`
  );
} else {
  console.log(
    'ok    no-separator concatenation stays conservative and records no path'
  );
}

console.log(
  failed === 0
    ? `\n${CASES.length + 1} cases pass, invariants hold`
    : `\n${failed} FAILURES`
);
process.exit(failed === 0 ? 0 : 1);
