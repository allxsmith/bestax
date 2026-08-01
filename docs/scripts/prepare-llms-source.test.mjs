/**
 * Guard the invariant the LLM pipeline actually depends on: by the time
 * `docusaurus-plugin-llms` reads the mirror, no tab JSX is left for it to strip.
 *
 * This exists because the previous design failed silently. The plugin gained, in
 * 0.5.0:
 *
 *     // Remove MDX/JSX component tags (PascalCase element names such as <Tabs>,
 *     // <TabItem>, <Admonition>), keeping their inner text content.
 *     cleaned = cleaned.replace(/<\/?[A-Z][A-Za-z0-9.]*\b[^>]*\/?>/g, '');
 *
 * Keeping *inner text* is not keeping *props*. `<PackageManagerTabs command="…" />`
 * is self-closing, so its whole payload went with the tag; `<TabItem label="…">`
 * kept its body but lost the label. Both dropped content from llms.txt while the
 * build stayed green, because the post-build check looked for JSX that *survived*
 * and never for content that had *vanished*.
 *
 * So these tests assert the precondition rather than the symptom: prop-borne
 * content is materialized into ordinary markdown, and nothing tab-shaped remains.
 * The last test applies the plugin's own regex to prove the strip is now a no-op.
 *
 * Source-only, no build required — same fast `pnpm test` as its siblings.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepare } from './prepare-llms-source.mjs';
import { transform } from './flatten-llms-tabs.mjs';

/** The exact strip `docusaurus-plugin-llms` applies (content.ts, v0.5.x). */
const PLUGIN_JSX_STRIP = /<\/?[A-Z][A-Za-z0-9.]*\b[^>]*\/?>/g;

const DOCS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../docs'
);

async function withTempTree(files, run) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'llms-src-'));
  try {
    const source = path.join(root, 'docs');
    for (const [relative, body] of Object.entries(files)) {
      const full = path.join(source, relative);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, body);
    }
    const target = path.join(root, '.llms-src');
    const written = await prepare(source, target);
    await run(target, written);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.mdx?$/.test(entry.name)) yield full;
  }
}

test('a self-closing PackageManagerTabs becomes a real pnpm fence', async () => {
  await withTempTree(
    {
      'guides/intro.md':
        '### Install\n\n<PackageManagerTabs command="add @allxsmith/bestax-bulma" />\n',
    },
    async target => {
      const out = await readFile(path.join(target, 'guides/intro.md'), 'utf8');
      assert.match(out, /```bash\npnpm add @allxsmith\/bestax-bulma\n```/);
      assert.doesNotMatch(out, /<PackageManagerTabs/);
    }
  );
});

test('a TabItem label survives as a heading, not just its body', async () => {
  await withTempTree(
    {
      'skills/theming.mdx':
        '<Tabs>\n<TabItem value="root" label="App root (global)">\n\nbody one\n\n</TabItem>\n</Tabs>\n',
    },
    async target => {
      const out = await readFile(
        path.join(target, 'skills/theming.mdx'),
        'utf8'
      );
      assert.match(out, /#### App root \(global\)/);
      assert.match(out, /body one/);
    }
  );
});

test('the mirror is rebuilt from scratch, dropping deleted pages', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'llms-src-stale-'));
  try {
    const source = path.join(root, 'docs');
    const target = path.join(root, '.llms-src');
    await mkdir(source, { recursive: true });
    await writeFile(path.join(source, 'keep.md'), '# Keep\n');
    await mkdir(target, { recursive: true });
    await writeFile(path.join(target, 'gone.md'), '# Removed page\n');

    await prepare(source, target);

    const remaining = await readdir(target);
    assert.deepEqual(remaining, ['keep.md']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('prepare refuses a source file the flattener cannot handle', async () => {
  // A mid-line tag is the shape `transform` deliberately skips, so it would reach
  // the plugin verbatim. Better to fail naming the source file than to publish it.
  await assert.rejects(
    () =>
      withTempTree(
        {
          'guides/bad.md':
            'Install it with <PackageManagerTabs command="add foo" /> today.\n',
        },
        () => {}
      ),
    /bad\.md/
  );
});

test('the real corpus leaves the plugin nothing to strip', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'llms-src-corpus-'));
  try {
    const target = path.join(root, '.llms-src');
    const written = await prepare(DOCS_DIR, target);
    assert.ok(written > 100, `expected >100 pages, mirrored ${written}`);

    const offenders = [];
    for await (const file of walk(target)) {
      const body = await readFile(file, 'utf8');
      // `transform` is the authority on what counts as code; re-running it is a
      // no-op on an already-flattened file, so any tab tag it would still act on
      // is one that reached the mirror outside code.
      if (transform(body) !== body) {
        offenders.push(path.relative(target, file));
      }
    }
    assert.deepEqual(offenders, [], 'tab JSX reached the mirror unflattened');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("the plugin's own JSX strip cannot delete tab content from the mirror", async () => {
  await withTempTree(
    {
      'a.md': '<PackageManagerTabs command="add foo" />\n',
      'b.mdx':
        '<Tabs>\n<TabItem value="x" label="Label X">\n\nbody\n\n</TabItem>\n</Tabs>\n',
    },
    async target => {
      for await (const file of walk(target)) {
        const body = await readFile(file, 'utf8');
        assert.equal(
          body.replace(PLUGIN_JSX_STRIP, ''),
          body,
          `${path.basename(file)} still contains PascalCase JSX the plugin would strip`
        );
      }
    }
  );
});
