/**
 * The copies of the docs that agents read keep a live example's site image
 * paths and say they stand for the reader's own: `noteSiteImagesInFences`
 * (src/theme/CodeBlock/sandbox/site-images.mjs) over a markdown document, and
 * plugins/llms-site-images.js, which runs it over the `.md` twins and
 * llms-full.txt once docusaurus-plugin-llms has written them. The MCP index's
 * half is held by scripts/gen-mcp-index.test.mjs at the repo root, and the
 * sandbox's, which points the paths at the site, by sandbox.test.mjs.
 */
import { afterAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  SITE_IMAGES_NOTE,
  hasSiteImages,
  noteSiteImagesInFences,
} from '../src/theme/CodeBlock/sandbox/site-images.mjs';

const require = createRequire(import.meta.url);
const llmsSiteImages = require('../plugins/llms-site-images.js');

const NOTE = `> ${SITE_IMAGES_NOTE}`;
const lines = (...l) => l.join('\n');
const notes = text => text.split(NOTE).length - 1;

const IMAGE = lines('```tsx', '<img src="/img/a.svg" alt="" />', '```');
/** A page as its twin carries it: sections ruled off from each other. */
const PAGES = lines(
  '## Usage',
  '',
  IMAGE,
  '',
  '---',
  '',
  '## Accessibility',
  '',
  IMAGE
);
/**
 * Three pages as llms-full.txt joins them, the page's own headings a level
 * down. The middle one leaves a fence open, closing it with too short a run.
 */
const JOINED = lines(
  '# Bestax',
  '',
  '## Image',
  '',
  IMAGE,
  '',
  '---',
  '',
  '### Accessibility',
  '',
  IMAGE,
  '',
  '---',
  '',
  '## Broken',
  '',
  '````tsx',
  '<img src="/img/b.svg" alt="" />',
  '```',
  '',
  '---',
  '',
  '## Figure',
  '',
  IMAGE
);

describe('hasSiteImages', () => {
  it('finds a path that opens a string or a CSS url(), as the sandbox does', () => {
    for (const code of [
      '<img src="/img/a.svg" />',
      "{ src: '/img/a.jpg' }",
      '<img src={`/img/b-${n}.jpg`} />',
      "{ backgroundImage: 'url(/img/f.jpg)' }",
      "{ backgroundImage: 'url( /img/h.jpg)' }",
    ]) {
      assert.ok(hasSiteImages(code), code);
    }
    for (const code of [
      '<img src="/images/c.png" />',
      '<img src="https://example.com/img/d.png" />',
      '<p>Put pictures in (/img/)</p>',
      '{/img/.source.length}',
    ]) {
      assert.ok(!hasSiteImages(code), code);
    }
  });
});

describe('noteSiteImagesInFences', () => {
  it('notes the first example on a page that uses a site image, once', () => {
    const md = lines(
      '# Image',
      '',
      '```tsx live',
      '<Button>Go</Button>',
      '```',
      '',
      '```tsx live',
      '<Image src="/img/logo.svg" alt="" />',
      '```',
      '',
      '~~~jsx',
      "const photos = [{ src: '/img/a.jpg' }];",
      '~~~'
    );
    assert.equal(
      noteSiteImagesInFences(md),
      lines(
        '# Image',
        '',
        '```tsx live',
        '<Button>Go</Button>',
        '```',
        '',
        NOTE,
        '',
        '```tsx live',
        '<Image src="/img/logo.svg" alt="" />',
        '```',
        '',
        '~~~jsx',
        "const photos = [{ src: '/img/a.jpg' }];",
        '~~~'
      )
    );
  });

  it('notes a document once, rules and headings and all', () => {
    assert.equal(notes(noteSiteImagesInFences(PAGES)), 1);
  });

  it('returns a document with no site image as it was', () => {
    const md = lines('```tsx', '<Button>Go</Button>', '```');
    assert.equal(noteSiteImagesInFences(md), md);
  });

  it('leaves prose, and a fence in another language, as written', () => {
    // A fence in another language can show the reader's own files, and a
    // ````md fence shows a document, fences and all, rather than running one.
    const md = lines(
      'Put a picture at `/img/logo.svg`, or "/img/logo.svg".',
      '',
      '```scss',
      ".hero { background: url('/img/hero.jpg'); }",
      '```',
      '````md',
      '```tsx',
      '<img src="/img/a.svg" alt="" />',
      '```',
      '````'
    );
    assert.equal(noteSiteImagesInFences(md), md);
  });

  it('reads fences the way CommonMark closes them', () => {
    const md = lines(
      '1. In a list item:',
      '   - nested deeper:',
      '     ````tsx',
      '     ```',
      '     <img src="/img/a.svg" alt="" />',
      '     ````'
    );
    // A shorter run inside a longer fence is code, not its close, and the
    // note sits at the indent of a fence in a nested list item.
    assert.deepEqual(noteSiteImagesInFences(md).split('\n').slice(2, 5), [
      '',
      `     ${NOTE}`,
      '',
    ]);
    // A backtick run with a backtick after it opens no fence, and a fence
    // never closed runs to the end.
    const open = lines(
      '```js` is inline code, "/img/b.svg"',
      '',
      '```tsx',
      '<img src="/img/c.svg" alt="" />'
    );
    assert.deepEqual(noteSiteImagesInFences(open).split('\n').slice(1, 4), [
      '',
      NOTE,
      '',
    ]);
  });
});

const temps = [];
afterAll(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

const FENCED = lines(
  '# Image',
  '',
  '```tsx',
  '<img src="/img/a.svg" />',
  '```'
);

/** A site's build directory, with `files` (path to text) written. */
function build(files) {
  const root = mkdtempSync(join(tmpdir(), 'llms-site-images-'));
  temps.push(root);
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text);
  }
  return root;
}

describe('llms-site-images', () => {
  it('notes the twins and llms-full.txt once the LLM plugin has written them', async () => {
    const outDir = build({ '.devto-publish/post.md': FENCED });
    const written = {
      'docs/api/elements/image.md': PAGES,
      'docs/guides/layout/index.md': PAGES,
      'llms-full.txt': JOINED,
    };
    const plugin = llmsSiteImages.afterLlms({
      name: 'docusaurus-plugin-llms',
      async postBuild() {
        // Written after a turn of the event loop, as real file writes are.
        await new Promise(resolve => setTimeout(resolve, 10));
        for (const [rel, text] of Object.entries(written)) {
          mkdirSync(dirname(join(outDir, rel)), { recursive: true });
          writeFileSync(join(outDir, rel), text);
        }
      },
    });
    assert.equal(plugin.name, 'docusaurus-plugin-llms');
    await plugin.postBuild({
      outDir,
      siteConfig: { url: 'https://bestax.io' },
    });
    const read = rel => readFileSync(join(outDir, rel), 'utf8');
    // A twin is one page, and llms-full.txt is many, each noted on its own, so
    // the page that leaves a fence open does not hide the one after it.
    assert.equal(
      read('docs/api/elements/image.md'),
      noteSiteImagesInFences(PAGES)
    );
    assert.equal(notes(read('docs/guides/layout/index.md')), 1);
    const full = read('llms-full.txt');
    assert.equal(notes(full), 3);
    assert.match(full, /## Figure\n\n> A path under \/img\//);
    // dev.to's copies are another plugin's.
    assert.equal(read('.devto-publish/post.md'), FENCED);
  });

  it('says so when llms-full.txt stops joining its pages the way it did', async () => {
    const outDir = build({
      'docs/a.md': PAGES,
      'docs/b.md': PAGES,
      'llms-full.txt': JOINED.replaceAll('\n---\n', '\n***\n'),
    });
    const plugin = llmsSiteImages.afterLlms({
      name: 'docusaurus-plugin-llms',
      async postBuild() {},
    });
    await assert.rejects(
      plugin.postBuild({ outDir, siteConfig: { url: 'https://bestax.io' } }),
      /joins them another way now/
    );
  });

  it('says so when the LLM plugin stops writing in postBuild', () => {
    assert.throws(
      () => llmsSiteImages.afterLlms({ name: 'docusaurus-plugin-llms' }),
      /no longer writes its files in postBuild/
    );
  });

  it('is the LLM plugin the site builds with', async () => {
    const { default: config } = await import('../docusaurus.config.js');
    const entries = config.plugins.filter(
      entry => Array.isArray(entry) && /llms/.test(entry[0])
    );
    assert.deepEqual(
      entries.map(([name]) => name),
      ['./plugins/llms-site-images.js']
    );
    const plugin = llmsSiteImages(
      { siteDir: '/site', siteConfig: config, outDir: '/site/build' },
      entries[0][1]
    );
    assert.equal(plugin.name, 'docusaurus-plugin-llms');
    assert.equal(typeof plugin.postBuild, 'function');
  });
});
