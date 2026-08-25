/**
 * Holds the extra-root attribution mechanism (#543) to its contract: a
 * component can claim CSS variables from more than one of its OWN root
 * classes, not just its primary `rootClass`/`varPrefix`.
 *
 * The bug this file exists to freeze: DateInputBase's root is overridden to
 * `input` for PROPS purposes (the trigger a reader restyles really is an
 * `.input`), but its calendar grid — an internal, unexported helper
 * (`form/_pickerInternals/Calendar.tsx`) — registers a whole partial's worth
 * of variables under `.dateinput`, a class that reaches neither
 * `pickRootClass` (it never appears in DateInputBase's own source) nor the
 * override (which points at `input` instead). `_dateinput.scss`,
 * `_timeinput.scss` and `_datetimeinput.scss` registered 36 variables no API
 * page could ever show. `resolveScssHits` (which decides `SCSS_SOURCES`) and
 * `varRootCandidates` (which both gen-api-docs.mjs and gen-mcp-index.mjs use
 * to render rows from a claimed partial) have to agree on the same candidate
 * list, or a claimed file renders zero rows on the page that claims it.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { resolveScssHits } from './gen-api-sources.mjs';
import { varRootCandidates } from './lib/props-extract.mjs';
import { componentVars } from './lib/scss-vars.mjs';

const repoFile = rel =>
  readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8');

const DATEINPUT = 'bulma-ui/src/scss/form/_dateinput.scss';
const TIMEINPUT = 'bulma-ui/src/scss/form/_timeinput.scss';
const DATETIMEINPUT = 'bulma-ui/src/scss/form/_datetimeinput.scss';

// --- varRootCandidates ---------------------------------------------------

test('varRootCandidates tries the primary root/prefix before any extra', () => {
  const cands = varRootCandidates('DateInput', 'input', 'input');
  assert.deepEqual(cands[0], { root: 'input', prefix: 'input' });
  assert.deepEqual(cands.slice(1), [
    { root: 'dateinput', prefix: 'dateinput' },
  ]);
});

test('a component with no extra roots gets exactly its own candidate', () => {
  assert.deepEqual(varRootCandidates('Button', 'button', 'button'), [
    { root: 'button', prefix: 'button' },
  ]);
});

test('DateTimeInput probes its own panel class plus the calendar and wheels', () => {
  const cands = varRootCandidates('DateTimeInput', 'input', 'input');
  assert.deepEqual(
    cands.map(c => c.root),
    ['input', 'datetimeinput', 'dateinput', 'timeinput']
  );
});

// --- resolveScssHits, on the real partials -------------------------------

test('DateInput claims its own repo partial only once the extra root is tried', () => {
  const partials = [{ path: DATEINPUT, src: repoFile(DATEINPUT) }];
  const primary = { root: 'input', prefix: 'input' };
  const extras = varRootCandidates('DateInput', 'input', 'input').slice(1);

  // The bug, pinned directly: DateInputBase's props-purposes root alone
  // finds nothing in the calendar's own partial.
  assert.deepEqual(resolveScssHits([primary], partials), []);

  // The fix: adding the extra root claims the file.
  const hits = resolveScssHits([primary, ...extras], partials);
  assert.deepEqual(
    hits.map(h => h.path),
    [DATEINPUT]
  );
});

test('TimeInput claims its own repo partial the same way', () => {
  const partials = [{ path: TIMEINPUT, src: repoFile(TIMEINPUT) }];
  const candidates = varRootCandidates('TimeInput', 'input', 'input');
  const hits = resolveScssHits(candidates, partials);
  assert.deepEqual(
    hits.map(h => h.path),
    [TIMEINPUT]
  );
});

test('DateTimeInput claims all three internal partials it renders', () => {
  const partials = [
    { path: DATEINPUT, src: repoFile(DATEINPUT) },
    { path: DATETIMEINPUT, src: repoFile(DATETIMEINPUT) },
    { path: TIMEINPUT, src: repoFile(TIMEINPUT) },
  ];
  const candidates = varRootCandidates('DateTimeInput', 'input', 'input');
  const hits = resolveScssHits(candidates, partials);
  assert.deepEqual(
    hits.map(h => h.path).sort(),
    [DATEINPUT, DATETIMEINPUT, TIMEINPUT].sort()
  );
});

test('a partial is claimed once even when more than one candidate matches it', () => {
  const partials = [{ path: DATEINPUT, src: repoFile(DATEINPUT) }];
  const candidates = [
    { root: 'dateinput', prefix: 'dateinput' },
    { root: 'dateinput', prefix: 'dateinput' },
  ];
  assert.equal(resolveScssHits(candidates, partials).length, 1);
});

// --- Tabs: no extra root needed, just a stale generated entry ------------

test('Tabs already attributes .tabs-root to its primary root — the gap was stale data', () => {
  // Unlike the date/time pickers, Tabs' vertical-tabs vars register directly
  // under `.tabs-root`, which componentVars' constituent-element rule (#544)
  // already connects to root `tabs` with no extra candidate. The #543 gap
  // here was a stale generated SCSS_SOURCES entry, not a matcher gap.
  const src = repoFile('bulma-ui/src/scss/components/_tabs.scss');
  const rows = componentVars(src, 'tabs', 'tabs');
  assert.deepEqual(rows.map(r => r.cssVar).sort(), [
    '--bulma-tabs-content-padding',
    '--bulma-tabs-vertical-border-color',
    '--bulma-tabs-vertical-border-width',
    '--bulma-tabs-vertical-min-width',
  ]);
});
