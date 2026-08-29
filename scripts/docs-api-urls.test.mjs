/**
 * Failing-case coverage for the `docs-api-urls` conformance rule.
 *
 * The tree is clean by construction, so a full run only ever exercises the
 * passing branch: a broken regex, root list or skip condition would leave the
 * guard vacuous while CI stayed green. These tests drive the violation branch
 * directly, which is the only way the rule is known to still work.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  docsUrlViolations,
  isSkippedDocsUrlPath,
} from './check-conformance.mjs';

test('flags a URL that repeats its path segment', () => {
  const v = docsUrlViolations(
    'README.md',
    'see [Grid](https://bestax.io/docs/api/grid/grid) for more\n'
  );
  assert.equal(v.length, 1);
  assert.match(v[0], /^README\.md:1 /);
  assert.match(v[0], /404s/);
  assert.match(v[0], /\/docs\/api\/grid\b/);
});

test('reports the line the URL is actually on', () => {
  const src = ['one', 'two', 'https://bestax.io/docs/api/columns/columns'].join(
    '\n'
  );
  const v = docsUrlViolations('a/b.md', src);
  assert.equal(v.length, 1);
  assert.match(v[0], /^a\/b\.md:3 /);
});

test('accepts the collapsed URL and other real pages', () => {
  const src = [
    'https://bestax.io/docs/api/grid',
    'https://bestax.io/docs/api/columns',
    'https://bestax.io/docs/api/components/card',
    'https://bestax.io/docs/api/helpers/usebulmaclasses',
  ].join('\n');
  assert.deepEqual(docsUrlViolations('x.md', src), []);
});

test('does not fire on a segment that merely starts the same', () => {
  const src = 'https://bestax.io/docs/api/grid/gridcell\n';
  assert.deepEqual(docsUrlViolations('x.md', src), []);
});

test('finds every occurrence, including two on one line', () => {
  const src =
    'https://bestax.io/docs/api/grid/grid and https://bestax.io/docs/api/columns/columns\n' +
    'https://bestax.io/docs/api/grid/grid\n';
  const v = docsUrlViolations('x.md', src);
  assert.equal(v.length, 3);
  assert.equal(v.filter(m => m.startsWith('x.md:1 ')).length, 2);
  assert.equal(v.filter(m => m.startsWith('x.md:2 ')).length, 1);
});

test('skips the gitignored copies of skills/, and nothing else', () => {
  assert.ok(isSkippedDocsUrlPath('bestax-mcp/data/skills'));
  assert.ok(
    isSkippedDocsUrlPath('bestax-mcp/data/skills/bestax-migrate/SKILL.md')
  );
  assert.ok(
    isSkippedDocsUrlPath('create-bestax/templates/skills/bestax-form/SKILL.md')
  );
  assert.ok(isSkippedDocsUrlPath('scripts/docs-api-urls.test.mjs'));
  assert.equal(isSkippedDocsUrlPath('skills/bestax-migrate/SKILL.md'), false);
  assert.equal(
    isSkippedDocsUrlPath('bestax-mcp/data/components/Grid.json'),
    false
  );
});
