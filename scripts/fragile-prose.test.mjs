/**
 * Holds the `fragile-prose` scanner to the rule it enforces: a count, a run
 * id, or a line reference in prose is a hit; the same digits inside code, a
 * date, a version, a SHA, an issue number, a percentage, a duration, or a size
 * are not. The false-positive cases matter as much as the true ones, because
 * a rule that cries wolf gets marked `bestax:count-ok` reflexively, and a
 * reflexive marker is worth less than none.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { scanFragileProse, describeHit } from './lib/fragile-prose.mjs';

const md = text => scanFragileProse(text, { kind: 'markdown' });
const guide = text => scanFragileProse(text, { kind: 'guide' });
const yaml = text => scanFragileProse(text, { kind: 'yaml' });
const whys = hits => hits.map(h => h.why);

// --- counts -------------------------------------------------------------------

test('a number word before a counted noun is a count', () => {
  assert.deepEqual(
    whys(md('Without it a vendor outage fails nineteen jobs at once.')),
    ['count']
  );
  assert.deepEqual(whys(md('All six now use the same nine-host allowlist.')), [
    'count',
  ]);
});

test('digits before a counted noun are a count', () => {
  assert.deepEqual(whys(md('There are 87 documented components.')), ['count']);
  assert.deepEqual(whys(md('the pin appears in 9 occurrences, one SHA')), [
    'count',
  ]);
});

test('a counting idiom without the noun is a count', () => {
  assert.deepEqual(whys(md('nineteen of them as of the inventory below')), [
    'count',
  ]);
  assert.deepEqual(whys(md('twelve so far, and the list keeps growing')), [
    'count',
  ]);
});

test('one and two are ordinary English, not counts', () => {
  assert.deepEqual(
    md('Two lists name the reviewer. One home per fact, in one line.'),
    []
  );
});

test('a number with no counted noun nearby is not a count', () => {
  assert.deepEqual(md('The cap is 4 and the sweep is 2-hourly.'), []);
  assert.deepEqual(
    md('Node 22 locally, React 19 in the matrix, port 3000.'),
    []
  );
});

// --- things that look like numbers but are not counts ----------------------------

test('dates, versions, SHAs, issue refs, percentages, durations, sizes are skipped', () => {
  assert.deepEqual(
    md(
      'Since 2026-09-06 at 15:28 UTC, pnpm@11.9.0 on #643 at c46324d kept 99% ' +
        'coverage (78% branches) after 30 days and ~800KB of CSS.'
    ),
    []
  );
});

test('a 40-hex SHA is not a run id', () => {
  assert.deepEqual(
    md('pinned at 51c47629174b5dbca955cf93690fd39c8a41dadf'),
    []
  );
});

// --- run ids ------------------------------------------------------------------

test('a bare integer of nine or more digits is a run id, in a guide', () => {
  assert.deepEqual(whys(guide('see run 33586960606 for the six jobs')), [
    'count',
  ]);
  assert.deepEqual(whys(guide('see run 33586960606')), ['run id']);
});

test('a run id in a workflow comment or a CLAUDE.md is a receipt, not a hit', () => {
  assert.deepEqual(
    yaml('# audit run was 33260691933; the flip is built on it'),
    []
  );
  assert.deepEqual(
    md('run 33221210633 is the evidence that omitting them is right'),
    []
  );
});

test('a line citing an issue or PR records history and is not a hit', () => {
  assert.deepEqual(
    md('#361 shipped two workflows pinned twelve commits behind'),
    []
  );
  assert.deepEqual(
    md('deleted 868 lines on #613 and the suite stayed green'),
    []
  );
  assert.deepEqual(whys(md('deleted 868 lines and the suite stayed green')), [
    'count',
  ]);
});

test('a URL is not scanned, so an issue-comment anchor is not a run id', () => {
  assert.deepEqual(
    guide(
      'evidence is on https://github.com/x/y/issues/612#issuecomment-5563800114 today'
    ),
    []
  );
});

test('a hyphenated duration is not a count', () => {
  assert.deepEqual(md('the 30-day workflow and the 2-hourly sweep'), []);
});

// --- line references ----------------------------------------------------------

test('path:line and "line N" references are hits', () => {
  assert.deepEqual(
    whys(md('the guard at claude-pr-loop.yml:224 and again at :758')),
    ['line reference']
  );
  assert.deepEqual(whys(md('see line 224, lines 224-229, and L42')), [
    'line reference',
  ]);
});

test('a rule number or a step id is not a line reference', () => {
  assert.deepEqual(
    md("rule 10's grep, the `dedupe` step, and heading 3.2"),
    []
  );
});

// --- masking --------------------------------------------------------------------

test('fenced code, inline code, HTML comments and front matter are not scanned', () => {
  const text = [
    '---',
    'title: nineteen jobs',
    '---',
    'Prose before.',
    '```bash',
    'grep -c "egress-policy: block" # prints 19 jobs',
    '```',
    'Run `gh api runs/33586960606` yourself. <!-- 87 components -->',
    '<!--',
    'nineteen jobs in a comment',
    '-->',
    '~~~',
    '87 components',
    '~~~',
  ].join('\n');
  assert.deepEqual(md(text), []);
});

test('an unterminated fence masks to end of file', () => {
  assert.deepEqual(md('```\nnineteen jobs\nstill code'), []);
});

test('yaml scans whole-line comments only', () => {
  const text = [
    'jobs:',
    '  gate:',
    '    # nineteen jobs share this allowlist',
    '    run: |',
    '      echo "nineteen jobs" # 87 components',
    '      COUNT=19 # the 19 jobs above',
    '      # and 87 components in a shell comment',
    '    prompt: |',
    '      Read all 87 components.',
  ].join('\n');
  const hits = yaml(text);
  assert.deepEqual(
    hits.map(h => [h.line, h.why]),
    [
      [3, 'count'],
      [7, 'count'],
    ]
  );
});

// --- the allow token ------------------------------------------------------------

test('bestax:count-ok on the line skips it', () => {
  assert.deepEqual(
    md(
      '87 components today. <!-- bestax:count-ok: gen:mcp will write this -->'
    ),
    []
  );
  assert.deepEqual(
    yaml('# 19 jobs; bestax:count-ok — a scale, not a checksum'),
    []
  );
});

// --- reporting ----------------------------------------------------------------

test('a hit reports its line and the first pattern that matched', () => {
  const [hit] = md('fine\nfine\nnineteen jobs here');
  assert.equal(hit.line, 3);
  assert.equal(hit.text, 'nineteen jobs');
  assert.match(
    describeHit('docs/x.md', hit),
    /^docs\/x\.md line 3: "nineteen jobs" — a count in prose/
  );
  assert.match(describeHit('docs/x.md', hit), /bestax:count-ok/);
});
