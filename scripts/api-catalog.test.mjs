/**
 * Holds scripts/lib/api-catalog.mjs, the API page walk and completeness guard
 * that gen-component-catalog.mjs and gen-mcp-index.mjs share. The fixtures
 * build a small docs/docs/api tree, because the real one has no untitled page
 * and no unknown category, so the branches that matter would never run.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CATEGORY_ORDER,
  mdFiles,
  missingApiPages,
  missingApiPagesMessage,
  orderCategories,
  parseExportedComponents,
  readApiPages,
} from './lib/api-catalog.mjs';

const repo = rel => fileURLToPath(new URL(`../${rel}`, import.meta.url));

/** A docs/docs/api tree in a temp dir, from { 'cat/file.md': source }. */
function fixture(t, files) {
  const dir = mkdtempSync(join(tmpdir(), 'bestax-api-catalog-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [rel, src] of Object.entries(files)) {
    mkdirSync(join(dir, rel, '..'), { recursive: true });
    writeFileSync(join(dir, rel), src);
  }
  return dir;
}

const page = title => `---\ntitle: ${title}\n---\n\n## Overview\n`;

test('an untitled page documents nothing, in the catalog or the guard', async t => {
  // The catalog generator used to count a page for the guard before checking
  // its title, so an untitled page passed the guard and was dropped from the
  // catalog. One list now feeds both.
  const dir = fixture(t, {
    'elements/button.md': page('Button'),
    'elements/box.md': '# Box, with no frontmatter\n',
    'helpers/config.md': page('ConfigProvider'),
  });
  const categories = await readApiPages(dir);
  const elements = categories.find(c => c.dir === 'elements');
  assert.deepEqual(
    elements.pages.map(p => p.relPath),
    ['elements/button.md']
  );
  const barrel = [
    "export * from './elements/Button';",
    "export * from './elements/Box';",
    // Keyed on the file name, so a page titled differently still counts.
    "export * from './helpers/Config';",
  ].join('\n');
  assert.deepEqual(missingApiPages(barrel, categories), ['elements/Box']);
});

test('the guard exempts hooks, Base variants and pages documented elsewhere', async t => {
  const dir = fixture(t, { 'form/input.md': page('Input') });
  const barrel = [
    "export * from './form/Input';",
    "export * from './form/InputBase';",
    "export { useThing } from './helpers/useThing';",
    "export { Thead, Tr } from './elements/Table';",
    "export type { InputProps } from './form/Input';",
    "export { Missing } from './layout/Missing';",
  ].join('\r\n');
  assert.deepEqual(missingApiPages(barrel, await readApiPages(dir)), [
    'layout/Missing',
  ]);
});

test('the barrel parser reads both export forms and takes the alias', () => {
  assert.deepEqual(
    parseExportedComponents(
      [
        "export * from './elements/Button';",
        "export { A, B as C } from './components/Mod';",
        "export * from './index';",
      ].join('\n')
    ),
    [
      { name: 'Button', cat: 'elements' },
      { name: 'A', cat: 'components' },
      { name: 'C', cat: 'components' },
    ]
  );
});

test('the guard message states the rule the guard applies', () => {
  const msg = missingApiPagesMessage(['form/Foo', 'layout/Bar'], 'the index');
  assert.match(msg, /2 exported component\(s\)/);
  assert.match(msg, /missing from the index:\n {2}form\/Foo\n {2}layout\/Bar/);
  // It matches on the file name, so the message must not say title.
  assert.match(msg, /file name is the export's name/);
  assert.match(msg, /frontmatter title:/);
  assert.match(msg, /UNDOCUMENTED_EXPORTS in scripts\/lib\/api-catalog\.mjs/);
});

test('known categories keep their order and an unknown one is appended', async t => {
  assert.deepEqual(orderCategories(['zeta', 'helpers', 'elements', 'beta']), [
    ['elements', 'Elements'],
    ['helpers', 'Helpers'],
    ['beta', 'Beta'],
    ['zeta', 'Zeta'],
  ]);
  const dir = fixture(t, {
    'zeta/z.md': page('Z'),
    'elements/nested/deep.md': page('Deep'),
    'elements/a.md': page('A'),
  });
  const categories = await readApiPages(dir);
  assert.deepEqual(
    categories.map(c => [c.dir, c.label]),
    [
      ['elements', 'Elements'],
      ['zeta', 'Zeta'],
    ]
  );
  assert.deepEqual(
    categories[0].pages.map(p => p.slug),
    ['elements/a', 'elements/nested/deep']
  );
});

test('mdFiles walks every depth, sorts by code point, and takes a pattern', async t => {
  const dir = fixture(t, {
    'b.md': '',
    'a/Z.md': '',
    'a/c.mdx': '',
    'a/notes.txt': '',
  });
  const rel = files => files.map(f => f.slice(dir.length + 1));
  assert.deepEqual(rel(await mdFiles(dir)), ['a/Z.md', 'b.md']);
  assert.deepEqual(rel(await mdFiles(dir, /\.mdx?$/)), [
    'a/Z.md',
    'a/c.mdx',
    'b.md',
  ]);
});

test('every exported component of the real library has a page', async () => {
  const categories = await readApiPages(repo('docs/docs/api'));
  assert.deepEqual(
    categories.slice(0, CATEGORY_ORDER.length).map(c => c.dir),
    CATEGORY_ORDER.map(([dir]) => dir)
  );
  assert.deepEqual(
    missingApiPages(
      await readFile(repo('bulma-ui/src/index.ts'), 'utf8'),
      categories
    ),
    []
  );
});
