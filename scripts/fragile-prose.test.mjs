/**
 * Holds the `fragile-prose` scanner to the rule it enforces: a count, a run
 * id, or a line reference in prose is a hit; the same digits inside code, a
 * date, a version, a SHA, an issue number, a percentage, a duration, or a size
 * are not. The false-positive cases matter as much as the true ones, because
 * a rule that cries wolf gets marked `bestax:count-ok` reflexively, and a
 * reflexive marker is worth less than none.
 */
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { scanFragileProse, describeHit } from './lib/fragile-prose.mjs';
import { checkFragileProse } from './check-conformance.mjs';

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

test('the documented example shapes are all hits', () => {
  for (const text of [
    'that issue closed the group by measuring all six of its members',
    'the runs surfaced six application hosts',
    'Nineteen jobs; the command below is the check',
    'All 87 components fit in the catalog',
    'the SDK pulls dozens of transitive packages',
    'walks every file under node_modules, thousands of them',
    'forty hosts across the fleet',
    'completed all fifteen of its API calls under the firewall',
    'the repo ships seven Agent Skills today',
    'five icon libraries are supported',
    'the release uploads five artifacts',
  ]) {
    assert.deepEqual(whys(md(text)), ['count'], text);
  }
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

test('a bare filename is not a line reference', () => {
  assert.deepEqual(
    md('edit turbo.json and rerun, then see App.jsx and index.mjs'),
    []
  );
});

test('the remedy names something that would actually fix the finding', () => {
  const [ref] = md('the guard at foo.yml:42');
  assert.match(describeHit('x.md', ref), /cite a heading, a step id/);
  const [count] = md('nineteen jobs share this');
  assert.match(describeHit('x.md', count), /the command that produces it/);
});

test('a rule number or a step id is not a line reference', () => {
  assert.deepEqual(
    md("rule 10's grep, the `dedupe` step, and heading 3.2"),
    []
  );
  assert.deepEqual(
    md('it is step 4 of the anatomy rule in the component guide'),
    []
  );
});

test('a source path with any common extension is a line reference', () => {
  for (const text of [
    'the sequence is writeStatus (agent.go:307) and then a serve loop',
    'see App.jsx:42 for the callback',
    'the helper at scripts/lib/skills.mjs:88',
  ]) {
    assert.deepEqual(whys(md(text)), ['line reference'], text);
  }
});

test('a ticket excuses a count but never a line reference', () => {
  assert.deepEqual(
    md('deleted 868 lines on #613 and the suite stayed green'),
    []
  );
  assert.deepEqual(whys(md('the old guard at foo.yml:42 was fixed in #643')), [
    'line reference',
  ]);
});

test('a count wrapped across two lines is caught, at its first line', () => {
  const [hit] = md(
    'fine\nthe repo keeps three small pointer\nfiles for agents'
  );
  assert.equal(hit.line, 2);
  assert.equal(hit.why, 'count');
  assert.deepEqual(md('fine\nfine\nfine'), []);
});

test('the reason must sit inside the marker comment, and the token must end', () => {
  assert.deepEqual(
    whys(md('87 components <!-- bestax:count-ok --> trailing prose')),
    ['count']
  );
  assert.deepEqual(whys(md('87 components <!-- bestax:count-okfoo -->')), [
    'count',
  ]);
  assert.deepEqual(md('87 components <!-- bestax:count-ok generated -->'), []);
});

test('the allow marker needs a reason', () => {
  assert.deepEqual(
    md('87 components today <!-- bestax:count-ok: generated -->'),
    []
  );
  assert.deepEqual(whys(md('87 components today <!-- bestax:count-ok -->')), [
    'count',
  ]);
  assert.deepEqual(whys(yaml('# 19 jobs; bestax:count-ok')), ['count']);
});

test('a standalone ranged locator is a line reference', () => {
  assert.deepEqual(whys(md('see lines 224-229')), ['line reference']);
});

test('a ticket on the next line excuses only a count that wraps into it', () => {
  assert.deepEqual(md('deleted 868\nlines on #613 and it stayed green'), []);
  assert.deepEqual(whys(md('nineteen jobs remain\nSee #613 for details')), [
    'count',
  ]);
});

test('a comment delimiter inside inline code opens nothing', () => {
  assert.deepEqual(whys(md('write `{/*` in the page\nnineteen jobs remain')), [
    'count',
  ]);
});

test('the legacy HTML comment terminator closes a comment too', () => {
  assert.deepEqual(md('<!--\nnineteen jobs\n--!> fine'), []);
  assert.deepEqual(whys(md('87 components <!-- bestax:count-ok --!>')), [
    'count',
  ]);
});

test('a second comment on the line after one closes is still masked', () => {
  assert.deepEqual(md('{/* a */} fine {/*\nnineteen jobs\n*/} done'), []);
});

test('a tally standing alone as a sentence is a count', () => {
  assert.deepEqual(whys(md('Three. The first is the SDK, the second is zod')), [
    'count',
  ]);
  assert.deepEqual(md('Two. That is fine, since two is ordinary English'), []);
});

test('the ticket exemption reads across a wrapped line', () => {
  assert.deepEqual(
    md('deleted 868\nlines on #613 and the suite stayed green'),
    []
  );
  assert.deepEqual(whys(md('deleted 868\nlines and the suite stayed green')), [
    'count',
  ]);
});

test('a number word carrying the verb is a count', () => {
  assert.deepEqual(whys(md('Three are shipped: rbx, bloomer and RBC')), [
    'count',
  ]);
});

test('a code span needs a run of exactly its own length to close', () => {
  // A double-backtick span holds a single backtick; the inner one must not
  // close it, and the count after the real close is still prose.
  assert.deepEqual(whys(md('text ``a `b` c`` then 19 jobs')), ['count']);
  assert.deepEqual(md('a ``19 jobs`` span'), []);
});

test('a code span that opens on one line covers the next', () => {
  assert.deepEqual(md('run `command\n19 jobs` to see'), []);
  assert.deepEqual(whys(md('run `command`\n19 jobs remain')), ['count']);
});

test('a line reference is not capped at four digits', () => {
  for (const t of ['see large-file.ts:10000', 'see line 10000', 'see L10000']) {
    assert.deepEqual(whys(md(t)), ['line reference'], t);
  }
});

test('a reference-link definition is not prose', () => {
  assert.deepEqual(md('[nineteen jobs]: /archive'), []);
  assert.deepEqual(whys(md('the nineteen jobs are listed')), ['count']);
});

test('an HTTP status is not a count, but a bare error tally is', () => {
  assert.deepEqual(md('the page returns HTTP 404 when missing'), []);
  assert.deepEqual(md('watch for 404 responses'), []);
  assert.deepEqual(whys(md('the scan found 500 errors')), ['count']);
  assert.deepEqual(whys(md('the run logged nine errors')), ['count']);
});

test('an empty comment does not swallow the rest of the file', () => {
  assert.deepEqual(whys(md('<!-->\n19 jobs remain')), ['count']);
  assert.deepEqual(whys(md('<!--->\n19 jobs remain')), ['count']);
});

test('a backtick inside a comment does not leave either state open', () => {
  assert.deepEqual(whys(md('<!-- use ` here -->\n19 jobs remain')), ['count']);
  assert.deepEqual(whys(md('<!--\nuse ` here\n-->\n19 jobs remain')), [
    'count',
  ]);
});

test('a comment marker inside a code span stays inert', () => {
  assert.deepEqual(whys(md('a span `{/*\n*/}` then\n19 jobs remain')), [
    'count',
  ]);
  assert.deepEqual(whys(md('a span `<!--\n-->` then\n19 jobs remain')), [
    'count',
  ]);
});

test('a grouped number reads as one count', () => {
  const [hit] = md('a library with 2,500+ icons');
  assert.equal(hit.text, '2,500+ icons');
});

test('a determiner-led back-reference is a count', () => {
  for (const t of [
    'these five always resolve',
    'only one of the five',
    'its four live here',
    'must not hide the other three',
  ]) {
    assert.deepEqual(whys(md(t)), ['count'], t);
  }
  // A determiner in front of a value is not a tally.
  assert.deepEqual(md('the 30/14 sweep and the 1 rebuttal round'), []);
});

test('an all-N back-reference is a count', () => {
  assert.deepEqual(whys(md('All three are regenerated on every docs build')), [
    'count',
  ]);
  assert.deepEqual(whys(md('the three hosts stay; all four legs agree')), [
    'count',
  ]);
});

test('a count wrapped across several narrow lines is caught', () => {
  const [hit] = md('three\nsmall\npointer\nfiles for agents');
  assert.equal(hit.line, 1);
  assert.equal(hit.why, 'count');
});

test('an approximate count is a count, with or without a leading all', () => {
  assert.deepEqual(whys(md('500+ variables are exposed')), ['count']);
  assert.deepEqual(whys(md('all 500+ variables are exposed')), ['count']);
});

test('a large count is still a count, but an id is not', () => {
  assert.deepEqual(whys(md('10000 files are scanned')), ['count']);
  assert.deepEqual(whys(md('99999999 files are scanned')), ['count']);
  assert.deepEqual(whys(guide('see run 33586960606')), ['run id']);
});

test('the window stops at a new block', () => {
  assert.deepEqual(
    md('- set the size to 3 for large text\n- props are forwarded'),
    []
  );
});

test('only a real ticket excuses a count', () => {
  assert.deepEqual(whys(md('500 variables https://example.test/#613')), [
    'count',
  ]);
  assert.deepEqual(whys(md('500 variables `#613`')), ['count']);
  assert.deepEqual(md('500 variables, fixed in #613'), []);
});

test('a ticket below the match does not excuse it', () => {
  assert.deepEqual(whys(md('deleted 868\nlines today\nper #613')), ['count']);
  assert.deepEqual(md('deleted 868\nlines on #613 today'), []);
});

test('a maximally wrapped count is caught', () => {
  const [hit] = md('three\nvery\nsmall\npointer\nfiles for agents');
  assert.equal(hit.line, 1);
  assert.equal(hit.why, 'count');
});

test('a spelled-out line reference wrapped across lines is caught', () => {
  assert.deepEqual(whys(md('see line\n224 for the guard')), ['line reference']);
});

test('naming the marker in prose or code does not exempt', () => {
  assert.deepEqual(
    whys(md('Use `bestax:count-ok` when documenting 87 components')),
    ['count']
  );
  assert.deepEqual(md('87 components <!-- bestax:count-ok: generated -->'), []);
});

test('a count inside a link or emphasis is caught', () => {
  assert.deepEqual(
    whys(md('The seven [Agent Skills](/docs/skills) ship with it')),
    ['count']
  );
  assert.deepEqual(whys(md('**three levers**, cheapest first')), ['count']);
  assert.deepEqual(whys(md('The seven [Agent Skills][skills] ship with it')), [
    'count',
  ]);
  assert.deepEqual(whys(md('The seven [Agent Skills][] ship with it')), [
    'count',
  ]);
});

test('a run id is not read as a count of the words after it', () => {
  assert.deepEqual(
    whys(yaml('# run 33286967625 showed claude-review at block')),
    []
  );
});

test('a double-backtick code span is masked like a single one', () => {
  assert.deepEqual(
    md('Use ``nineteen jobs`` literally, and `87 components` too'),
    []
  );
});

test('a parenthesised line reference is a hit', () => {
  assert.deepEqual(
    whys(md('the serve loop (:313) calls RevertChanges (:315)')),
    ['line reference']
  );
});

// --- masking --------------------------------------------------------------------

test('fenced code, inline code, HTML comments and front matter are not scanned', () => {
  // Built as one string: a bare comment delimiter on its own line reads to a
  // static analyser like a hand-rolled HTML parser rather than test data.
  const text = `---
title: nineteen jobs
---
Prose before.
\`\`\`bash
grep -c "egress-policy: block" # prints 19 jobs
\`\`\`
Run \`gh api runs/33586960606\` yourself. <!-- 87 components -->
<!--
nineteen jobs in a comment
-->
~~~
87 components
~~~`;
  assert.deepEqual(md(text), []);
});

test('a comment spanning lines is masked in both spellings', () => {
  assert.deepEqual(md('<!--\nnineteen jobs\n--> fine'), []);
  assert.deepEqual(md('{/*\nnineteen jobs\nand 87 components\n*/} fine'), []);
  assert.deepEqual(md('{/* nineteen jobs */}\nfine'), []);
  // The text after a closing delimiter is still prose.
  assert.deepEqual(whys(md('{/*\nhidden\n*/} nineteen jobs remain')), [
    'count',
  ]);
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

// --- the walk ---------------------------------------------------------------------

test('walks a real tree: reports every target kind and honours every exclusion', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fragile-prose-'));
  const write = async (rel, body) => {
    await mkdir(join(root, dirname(rel)), { recursive: true });
    await writeFile(join(root, rel), body);
  };
  const count = 'nineteen jobs share this list\n';
  const runId = 'see run 33586960606\n';

  await write(
    '.github/workflows/a.yml',
    `jobs:\n  # ${count}  x: echo "nineteen jobs"\n`
  );
  await write('.github/CLAUDE.md', count + runId);
  await write('pkg/CLAUDE.md', count);
  await write('docs/docs/guides/g.md', runId);
  await write('docs/docs/guides/migration/m.md', count);
  await write('docs/docs/api/a.md', count);
  await write('docs/blog/post.md', count);
  await write('node_modules/dep/CLAUDE.md', count);
  await write('.claude/worktrees/other/CLAUDE.md', count);
  await write('pkg/dist/CLAUDE.md', count);
  await write('README.md', count);

  const violations = await checkFragileProse(root);
  const files = [...new Set(violations.map(v => v.split(' line ')[0]))].sort();

  assert.deepEqual(files, [
    '.github/CLAUDE.md',
    '.github/workflows/a.yml',
    'docs/docs/guides/g.md',
    'pkg/CLAUDE.md',
  ]);
  // The run id is a hit in the guide and a receipt in the contract.
  assert.equal(violations.filter(v => v.includes('run id')).length, 1);
  assert.ok(
    violations.find(
      v => v.startsWith('docs/docs/guides/g.md') && v.includes('run id')
    )
  );
  // The yaml file's shell string is not scanned, only its comment line.
  assert.equal(
    violations.filter(v => v.startsWith('.github/workflows/a.yml')).length,
    1
  );
});
