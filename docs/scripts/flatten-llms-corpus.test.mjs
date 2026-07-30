/**
 * Run the flattener over the real docs corpus.
 *
 * The unit tests use hand-written fixtures, so they only ever cover shapes
 * someone thought to write down. This walks every page we actually ship and
 * asserts the invariants that matter for the published artifacts — which means a
 * future page that nests a component somewhere awkward fails here rather than
 * silently corrupting llms-full.txt.
 *
 * Source-only: no build required, so it runs in the same fast `pnpm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform, verifyArtifact } from './flatten-llms-tabs.mjs';

const DOCS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../docs'
);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.mdx?$/.test(entry.name)) yield full;
  }
}

const pages = [];
for await (const file of walk(DOCS_DIR)) pages.push(file);

test('the corpus is non-empty (guards a bad DOCS_DIR)', () => {
  assert.ok(pages.length > 100, `expected >100 pages, found ${pages.length}`);
});

test('every page survives the flattener cleanly', async () => {
  const failures = [];

  for (const file of pages) {
    const src = await readFile(file, 'utf8');
    const out = transform(src);
    const rel = path.relative(DOCS_DIR, file);

    for (const problem of verifyArtifact(out)) {
      failures.push(`${rel}: ${problem}`);
    }

    // An empty emitted block means a command was swallowed. Anchored to line
    // starts and to the indentation we emit — a loose regex false-positives on
    // the inner fence of a ```` block (docs/tutorial-basics/markdown-features).
    if (/^([ \t]*)```bash\n\1```$/m.test(out)) {
      failures.push(`${rel}: emitted an empty bash fence`);
    }

    // Idempotency on real content, not just fixtures.
    if (transform(out) !== out) {
      failures.push(`${rel}: transform is not idempotent`);
    }
  }

  assert.deepEqual(failures, []);
});

test('pages with no tab JSX are passed through untouched', async () => {
  const changed = [];

  for (const file of pages) {
    const src = await readFile(file, 'utf8');
    if (/<Tabs|<TabItem|<PackageManagerTabs/.test(src)) continue;
    if (transform(src) !== src) changed.push(path.relative(DOCS_DIR, file));
  }

  assert.deepEqual(changed, []);
});
