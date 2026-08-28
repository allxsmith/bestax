/**
 * Guards on the convergence hand-off message builder (handoff-message.mjs).
 *
 * This is the comment that tells a human an ai-loop PR is ready and asks for
 * the squash-merge, so the thing under test is not "does it read nicely" but
 * "does every one of the 1250 combinations still carry the action item". The
 * pools are prose and prose gets edited; these assertions are the contract
 * that editing them cannot quietly drop the merge ask, the iteration count,
 * the never-merges disclaimer, or the theme signature (#576).
 *
 * Combinations are ENUMERATED through assemble() rather than sampled through
 * buildBody(): the draw is not guaranteed to reach every tuple for any finite
 * set of PR numbers, and a fragment that only breaks in one pairing is exactly
 * the failure a sampled test would miss.
 *
 * The leading-whitespace assertions guard something the old shape got for
 * free. A YAML block scalar strips its own indentation, so the multi-line
 * literal this replaced decoded flush left no matter how it was indented;
 * assembled in JS, a stray leading space would instead reach the comment
 * verbatim, and >=4 of them after a blank line is an indented code block in
 * Markdown — which greys out the merge ask and silences the @-mention inside
 * it. Nothing in CI lints workflow YAML, which is why the assembly lives here
 * at all (.github/CLAUDE.md rule 9).
 *
 * `.mjs` and `node --test` rather than jest: these are root-level scripts with
 * no package of their own, matching auto-close-duplicates.test.mjs.
 */
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
import {
  ASKS,
  ITER_TOKEN,
  KICKERS,
  SNOW,
  SURF,
  THEMES,
  applyIter,
  assemble,
  buildBody,
  chooseSlots,
  draw,
  parseArgs,
} from './handoff-message.mjs';

const SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  'handoff-message.mjs'
);

/** Every (theme, opening, status, ask, kicker) pairing, with a stand-in iter. */
function* everyCombination(iter = 7) {
  for (const theme of THEMES)
    for (const opening of theme.openings)
      for (const status of theme.statuses)
        for (const ask of ASKS)
          for (const kicker of KICKERS)
            yield {
              theme,
              body: assemble({ opening, status, ask, kicker, iter }),
              iter,
            };
}

const ALL = [...everyCombination()];

test('the pools are the shape the draw and the maths assume', () => {
  assert.equal(THEMES.length, 2);
  assert.deepEqual(THEMES, [SURF, SNOW]);
  for (const theme of THEMES) {
    assert.equal(theme.openings.length, 5, `${theme.name} openings`);
    assert.equal(theme.statuses.length, 5, `${theme.name} statuses`);
  }
  assert.equal(ASKS.length, 5);
  assert.equal(KICKERS.length, 5);
  assert.equal(ALL.length, 1250, '2 x 5 x 5 x 5 x 5');
});

test('every fragment is a single trimmed line', () => {
  const all = [
    ...THEMES.flatMap(t => [...t.openings, ...t.statuses]),
    ...ASKS,
    ...KICKERS,
  ];
  assert.equal(all.length, 30);
  for (const fragment of all) {
    assert.ok(fragment.length > 0, 'fragment is non-empty');
    assert.ok(!/[\n\r]/.test(fragment), `single-line: ${fragment}`);
    assert.equal(fragment, fragment.trim(), `no edge whitespace: ${fragment}`);
    assert.ok(!fragment.includes('`'), `no backticks: ${fragment}`);
  }
});

test('each slot pool carries the job that slot exists to do', () => {
  for (const theme of THEMES) {
    for (const opening of theme.openings) {
      assert.ok(
        opening.startsWith(`${theme.emoji} **`),
        `themed + bold: ${opening}`
      );
      assert.ok(opening.endsWith('**'), `headline closes bold: ${opening}`);
    }
    for (const status of theme.statuses) {
      // The status is the slot that reports the loop's actual state.
      assert.equal(
        status.split(ITER_TOKEN).length - 1,
        1,
        `one ${ITER_TOKEN}: ${status}`
      );
      assert.ok(/\bCI\b/.test(status), `states CI: ${status}`);
      assert.ok(
        /AI review thread/.test(status),
        `states thread resolution: ${status}`
      );
    }
  }
  for (const ask of ASKS) {
    assert.ok(ask.includes('@allxsmith'), `mentions the owner: ${ask}`);
    assert.ok(
      ask.includes('squash-merge'),
      `asks for the squash-merge: ${ask}`
    );
  }
  for (const kicker of KICKERS) {
    assert.ok(
      /[Ll]oop never merges/.test(kicker),
      `states the loop never merges: ${kicker}`
    );
    assert.ok(kicker.endsWith('🤙'), `closes with the signature: ${kicker}`);
  }
});

test('no fragment writes a bot trigger string (.github/CLAUDE.md rule 8)', () => {
  // contains() matches raw substrings, and this body is posted with a PAT, so
  // a mention here would re-enter a write-capable session.
  for (const { body } of ALL) {
    assert.ok(!body.includes('@claude'), body);
    assert.ok(!body.includes('@coderabbitai'), body);
  }
});

test('every assembled body is two flush-left paragraphs', () => {
  for (const { body } of ALL) {
    const lines = body.split('\n');
    assert.equal(lines.length, 3, `headline / blank / ask: ${body}`);
    assert.equal(lines[1], '', `exactly one blank line: ${body}`);
    for (const line of [lines[0], lines[2]]) {
      // >=4 leading spaces would make GitHub render the paragraph as a code
      // block and silence its @-mention. JS does no stripping of its own.
      assert.ok(
        !/^\s/.test(line),
        `no leading whitespace: ${JSON.stringify(line)}`
      );
      assert.ok(
        !/\s$/.test(line),
        `no trailing whitespace: ${JSON.stringify(line)}`
      );
    }
  }
});

test('every assembled body still carries the whole message', () => {
  for (const { theme, body, iter } of ALL) {
    assert.ok(body.startsWith(theme.emoji), `themed opening emoji: ${body}`);
    assert.ok(body.endsWith('🤙'), `signature closes the body: ${body}`);
    assert.ok(
      body.includes(`${iter} `),
      `reports the iteration count: ${body}`
    );
    assert.ok(!body.includes(ITER_TOKEN), `placeholder substituted: ${body}`);
    assert.ok(body.includes('@allxsmith'), body);
    assert.ok(body.includes('squash-merge'), body);
    assert.ok(/[Ll]oop never merges/.test(body), body);
    assert.ok(/\bCI\b/.test(body), body);
    assert.ok(/AI review thread/.test(body), body);
  }
});

test('applyIter substitutes every occurrence, including zero', () => {
  assert.equal(applyIter('$ITER iteration(s) in.', 0), '0 iteration(s) in.');
  assert.equal(
    applyIter('$ITER lap(s), $ITER run(s)', 4),
    '4 lap(s), 4 run(s)'
  );
  assert.equal(applyIter('no placeholder here', 3), 'no placeholder here');
});

test('the draw stays in range and is deterministic per PR', () => {
  for (let pr = 1; pr <= 400; pr++) {
    for (const [salt, n] of [
      ['theme', 2],
      ['open', 5],
      ['stat', 5],
      ['ask', 5],
      ['kick', 5],
    ]) {
      const index = draw(salt, pr, n);
      assert.ok(
        Number.isInteger(index) && index >= 0 && index < n,
        `${salt}@${pr} -> ${index}`
      );
      assert.equal(index, draw(salt, pr, n), 'same input, same index');
    }
    assert.equal(buildBody({ pr, iter: 2 }), buildBody({ pr, iter: 2 }));
  }
});

test("the draw is pinned — changing it rewrites every PR's message", () => {
  // A golden tuple, not a golden body: fragments may be reworded freely, but
  // swapping the hash, or reordering/resizing a pool, silently reassigns all
  // 1250. If you meant to do that, re-pin these indices in the same commit.
  const slots = chooseSlots(576);
  assert.equal(slots.theme.name, 'surf');
  assert.equal(SURF.openings.indexOf(slots.opening), 0);
  assert.equal(SURF.statuses.indexOf(slots.status), 1);
  assert.equal(ASKS.indexOf(slots.ask), 2);
  assert.equal(KICKERS.indexOf(slots.kicker), 4);
});

test('the draw decorrelates slots and both themes get used', () => {
  // One shared hash would rotate the slots in lockstep, so neighbouring PRs
  // would differ in a single fragment and the variety would be theatre.
  const prs = Array.from({ length: 241 }, (_, i) => 560 + i);
  const themes = new Set(prs.map(pr => chooseSlots(pr).theme.name));
  assert.deepEqual([...themes].sort(), ['snow', 'surf']);

  const tuple = pr =>
    ['open', 'stat', 'ask', 'kick'].map(s => draw(s, pr, 5)).join('');
  let changed = 0;
  for (let i = 1; i < prs.length; i++) {
    const [a, b] = [tuple(prs[i - 1]), tuple(prs[i])];
    changed += [...a].filter((c, j) => c !== b[j]).length;
  }
  const average = changed / (prs.length - 1);
  assert.ok(
    average > 2.5,
    `expected most slots to move between PRs, got ${average}`
  );

  const distinct = new Set(prs.map(pr => buildBody({ pr, iter: 1 })));
  assert.ok(
    distinct.size > 200,
    `expected near-collision-free coverage, got ${distinct.size}/241`
  );
});

test('parseArgs enforces the contract the workflow relies on', () => {
  assert.deepEqual(parseArgs(['--pr=576', '--iter=3']), { pr: 576, iter: 3 });
  assert.deepEqual(parseArgs(['--iter=0', '--pr=1']), { pr: 1, iter: 0 });
  for (const argv of [
    [],
    ['--pr=576'],
    ['--iter=3'],
    ['--pr=0', '--iter=3'],
    ['--pr=abc', '--iter=3'],
    ['--pr=576', '--iter=-1'],
    ['--pr=576', '--iter=x'],
    ['--pr=576', '--iter=3', '--bogus'],
    ['--pr', '576'],
  ]) {
    assert.throws(
      () => parseArgs(argv),
      Error,
      `should reject ${JSON.stringify(argv)}`
    );
  }
});

test('the CLI prints exactly the built body and fails loudly on bad input', () => {
  const ok = spawnSync(process.execPath, [SCRIPT, '--pr=576', '--iter=3'], {
    encoding: 'utf8',
  });
  assert.equal(ok.status, 0);
  assert.equal(ok.stderr, '');
  assert.equal(ok.stdout, `${buildBody({ pr: 576, iter: 3 })}\n`);

  // A non-zero exit is what stops `set -euo pipefail` posting an empty body.
  const bad = spawnSync(process.execPath, [SCRIPT, '--pr=576'], {
    encoding: 'utf8',
  });
  assert.notEqual(bad.status, 0);
  assert.equal(bad.stdout, '');
  assert.match(bad.stderr, /missing --iter/);
});
