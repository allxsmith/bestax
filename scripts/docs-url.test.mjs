import { test } from 'node:test';
import assert from 'node:assert/strict';

import { docsRoute } from './lib/docs-url.mjs';

test('collapses a page named after its own folder', () => {
  assert.equal(docsRoute('grid/grid'), 'grid');
  assert.equal(docsRoute('columns/columns'), 'columns');
});

test('leaves every other page alone', () => {
  assert.equal(docsRoute('components/card'), 'components/card');
  assert.equal(docsRoute('elements/button'), 'elements/button');
  assert.equal(docsRoute('helpers/config'), 'helpers/config');
});

test('collapses only the trailing pair, not repeats further up', () => {
  assert.equal(docsRoute('grid/grid/grid'), 'grid/grid');
  assert.equal(docsRoute('a/b/a'), 'a/b/a');
});

test('handles degenerate input without throwing', () => {
  assert.equal(docsRoute('grid'), 'grid');
  assert.equal(docsRoute(''), '');
  assert.equal(docsRoute('grid/'), 'grid');
});
