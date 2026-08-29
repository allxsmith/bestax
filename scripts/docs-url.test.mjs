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

test('collapses the index and README folder-index forms', () => {
  assert.equal(docsRoute('grid/index'), 'grid');
  assert.equal(docsRoute('grid/README'), 'grid');
  assert.equal(docsRoute('components/index'), 'components');
});

test('does not collapse index further up the path', () => {
  assert.equal(docsRoute('index/card'), 'index/card');
});

test('handles degenerate input without throwing', () => {
  assert.equal(docsRoute('grid'), 'grid');
  assert.equal(docsRoute(''), '');
  assert.equal(docsRoute('grid/'), 'grid');
});
