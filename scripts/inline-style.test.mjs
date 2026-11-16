/**
 * Holds the `inline-style` conformance rule to its ratchet: a story or docs
 * file may hold no more inline `style={{}}` uses than its baseline row
 * allows, a row that allows more than its file holds is reported as a warning
 * naming the command that lowers it while the check still passes, and that
 * command only ever lowers the baseline (#1649, #1862).
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  inlineStyleViolations,
  inlineStyleWarning,
  lowerInlineStyleBaseline,
  staleInlineStyleRows,
} from './check-conformance.mjs';

const STORY = 'bulma-ui/src/components/Pagination.stories.tsx';
const DOC = 'docs/docs/api/form/radios.md';
const NEW = 'bulma-ui/src/components/Brand.stories.tsx';

test('a file at its row, and a file with no styles and no row, pass clean', () => {
  for (const [current, baseline] of [
    [{ [STORY]: 4 }, { [STORY]: 4 }],
    [{}, {}],
  ]) {
    assert.deepEqual(inlineStyleViolations(current, baseline), []);
    assert.deepEqual(staleInlineStyleRows(current, baseline), []);
  }
});

test('a file above its row fails, naming the file and the helper props', () => {
  const [above, unlisted] = inlineStyleViolations(
    { [STORY]: 5, [DOC]: 1 },
    { [STORY]: 4 }
  );
  assert.match(above, /Pagination\.stories\.tsx has 5 .*baseline allows 4/);
  assert.match(above, /helper props/);
  assert.match(unlisted, /radios\.md has 1 .*baseline allows 0/);
});

test("a row above its file's count, or for a file gone, is stale and doesn't fail", () => {
  const current = { [STORY]: 3 };
  const baseline = { [STORY]: 4, [DOC]: 2 };
  assert.deepEqual(inlineStyleViolations(current, baseline), []);
  assert.deepEqual(staleInlineStyleRows(current, baseline), [
    `${STORY}: the baseline allows 4, and it holds 3.`,
    `${DOC}: the baseline allows 2, and it holds none or is gone.`,
  ]);
});

test('the warning names the command and each row, and adds no annotation off CI', () => {
  assert.deepEqual(inlineStyleWarning([]), []);
  const rows = staleInlineStyleRows({ [STORY]: 3 }, { [STORY]: 4, [DOC]: 2 });
  const lines = inlineStyleWarning(rows);
  const text = lines.join('\n');
  assert.match(text, /⚠ inline-style: 2 row\(s\) in .*conformance-baseline/);
  assert.match(text, /--only=inline-style --update-baseline/);
  assert.match(text, /AI fix loop leaves this to a maintainer/);
  assert.match(text, /don't fail the check/);
  for (const row of rows) assert.ok(lines.includes(`  - ${row}`), row);
  assert.ok(!text.includes('::warning'), text);
});

test('on CI the warning adds one escaped annotation holding every row', () => {
  const rows = [
    `${STORY}: the baseline allows 4, and it holds 3.`,
    'docs/100%.md: the baseline allows 1, and it holds none or is gone.',
  ];
  const annotations = inlineStyleWarning(rows, { ci: true }).filter(l =>
    l.startsWith('::warning')
  );
  assert.equal(annotations.length, 1);
  const [annotation] = annotations;
  assert.match(
    annotation,
    /^::warning file=scripts\/conformance-baseline\.json,title=inline-style baseline::⚠ inline-style/
  );
  assert.ok(!/[\r\n]/.test(annotation), annotation);
  assert.match(annotation, /%0A- bulma-ui\/src\/components\/Pagination/);
  assert.match(annotation, /docs\/100%25\.md/);
});

test('--update-baseline lowers rows and drops empty ones, and never adds or raises one', () => {
  assert.deepEqual(
    lowerInlineStyleBaseline(
      { [STORY]: 3, [DOC]: 9, [NEW]: 2 },
      { [DOC]: 7, [STORY]: 4, 'docs/docs/gone.md': 2 }
    ),
    { [STORY]: 3, [DOC]: 7 }
  );
  // Sorted by path, so a refresh rewrites only the rows that changed.
  assert.deepEqual(
    Object.keys(
      lowerInlineStyleBaseline(
        { [STORY]: 1, [DOC]: 1 },
        { [DOC]: 1, [STORY]: 1 }
      )
    ),
    [STORY, DOC]
  );
});
