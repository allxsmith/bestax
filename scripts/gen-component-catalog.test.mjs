/**
 * Guards on the skill component catalog generator.
 *
 * The catalog is what an agent scans before writing markup, so its failures
 * are quiet: a dropped component gets reinvented by hand, and output that is
 * not a prettier fixpoint turns the staleness gate into noise the first time
 * someone formats the repo. The completeness guard and the page walk are
 * tested with fixtures in api-catalog.test.mjs. This file holds the
 * rendering and the real output.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import {
  build,
  overviewSentence,
  renderCatalog,
} from './gen-component-catalog.mjs';

const require = createRequire(import.meta.url);
const OUT = fileURLToPath(
  new URL(
    '../skills/bestax-custom-component/references/component-catalog.md',
    import.meta.url
  )
);

const page = (relPath, title, overview) => ({
  relPath,
  slug: relPath.replace(/\.md$/, ''),
  fm: { title },
  src: `---\ntitle: ${title}\n---\n\n## Overview\n\n${overview}\n`,
});

test('the one-liner is the first prose sentence under Overview', () => {
  const src = [
    '---',
    'title: Box',
    '---',
    '',
    '### Overview',
    '',
    "import Box from './box';",
    '<Badge />',
    '![Box](box.png)',
    '',
    'The `Box` component wraps content in a padded, bordered white panel. It is simple.',
  ].join('\r\n');
  assert.equal(
    overviewSentence(src),
    'The `Box` component wraps content in a padded, bordered white panel.'
  );
  assert.equal(overviewSentence('---\ntitle: X\n---\n\n## Usage\n'), '');
  assert.equal(overviewSentence('## Overview\n\n- only a list\n'), '');
});

test('the catalog lists titled pages by title, linking the served route', () => {
  const { markdown, total } = renderCatalog([
    {
      dir: 'grid',
      label: 'Grid',
      pages: [
        page(
          'grid/grid.md',
          'Grid',
          'The `Grid` lays out cells in a CSS grid.'
        ),
        page('grid/cell.md', 'Cell', ''),
      ],
    },
    { dir: 'empty', label: 'Empty', pages: [] },
  ]);
  assert.equal(total, 2);
  assert.match(
    markdown,
    /## Grid\n\n- \[Cell\]\(https:\/\/bestax\.io\/docs\/api\/grid\/cell\)\n- \[Grid\]\(https:\/\/bestax\.io\/docs\/api\/grid\) — The `Grid`/
  );
  assert.ok(!markdown.includes('## Empty'), 'an empty category is skipped');
  assert.match(markdown, /^2 documented components\./m);
  assert.match(markdown, /Regenerate with `pnpm gen:catalog`/);
});

test('the real catalog covers every export and is a prettier fixpoint', async () => {
  const { text, total, missing } = await build();
  assert.deepEqual(missing, []);
  assert.ok(total >= 80, `only ${total} components`);
  assert.equal(
    (text.match(/^- \[/gm) || []).length,
    total,
    'one row per component'
  );
  const prettier = require('prettier');
  const formatted = await prettier.format(text, {
    ...(await prettier.resolveConfig(OUT)),
    filepath: OUT,
  });
  assert.equal(formatted, text, 'formatting the catalog must not change it');
});
