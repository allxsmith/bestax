/**
 * Guards on strip-generated-markers.mjs, the docs build step that strips the
 * generated-region markers from the built site, run on temporary trees.
 */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { stripBuild, twinPath } from './strip-generated-markers.mjs';

const temps = [];
after(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

const open = id => `<!-- bestax:generated ${id} -->`;
const close = id => `<!-- /bestax:generated ${id} -->`;
const lines = (...l) => l.join('\n');

/** A docs package whose files are `tree`, path to text. */
function docsTree(tree) {
  const root = mkdtempSync(join(tmpdir(), 'strip-markers-'));
  temps.push(root);
  for (const [rel, text] of Object.entries(tree)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text);
  }
  return root;
}

/** The metadata Docusaurus writes for the page at `source`. */
const pageData = (source, permalink) => [
  `.docusaurus/docusaurus-plugin-content-docs/default/site-${source.replace(/\W+/g, '-')}.json`,
  JSON.stringify({ id: source, source: `@site/${source}`, permalink }),
];

/**
 * `docsTree(tree)` as `docusaurus build` leaves it, having rendered `pages`,
 * each source path (relative to the site) to its permalink: the site config,
 * each page's metadata, and its HTML, at `<route>.html`, or with `dirs` at
 * `<route>/index.html`. `unrendered` pages get metadata and no HTML, as a page
 * made a draft since an earlier build does.
 */
function site(tree, pages = {}, { baseUrl = '/', dirs, unrendered = {} } = {}) {
  const files = {
    '.docusaurus/docusaurus.config.mjs': `export default ${JSON.stringify({ baseUrl })};\n`,
    ...tree,
  };
  for (const [source, permalink] of Object.entries(unrendered)) {
    const [path, text] = pageData(source, permalink);
    files[path] = text;
  }
  for (const [source, permalink] of Object.entries(pages)) {
    const [path, text] = pageData(source, permalink);
    files[path] = text;
    const route = permalink.slice(baseUrl.length).replace(/\/+$/, '');
    const html = !route
      ? 'index.html'
      : dirs
        ? `${route}/index.html`
        : `${route}.html`;
    files[`build/${html}`] = '<!doctype html>\n';
  }
  return docsTree(files);
}

function capture() {
  const said = { log: [], error: [] };
  return {
    said,
    io: {
      log: text => said.log.push(text),
      error: text => said.error.push(text),
    },
  };
}

const PAGE = lines('# Card', '', open('props'), '| Prop |', close('props'), '');
const BARE = lines('# Card', '', '| Prop |', '');
const CARD = { 'docs/api/card.md': '/docs/api/card' };

test('a clean build loses every marker and passes', async () => {
  const root = site(
    {
      'docs/api/card.md': PAGE,
      'build/docs/api/card.md': PAGE,
      'build/llms-full.txt': lines(PAGE, '---', '', PAGE),
    },
    CARD
  );
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 0, said.error.join('\n'));
  for (const file of ['build/docs/api/card.md', 'build/llms-full.txt']) {
    assert.ok(!readFileSync(join(root, file), 'utf8').includes('bestax:'));
  }
  assert.match(said.log[0], /removed 6 marker\(s\) from 2 file\(s\), of 2/);
});

test('a build the plugin already stripped passes, having checked it', async () => {
  const root = site(
    {
      'docs/api/card.md': PAGE,
      'build/docs/api/card.md': BARE,
      'build/llms.txt': '- [Card](https://bestax.io/docs/api/card.md)\n',
      'build/llms-full.txt': BARE,
    },
    CARD
  );
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 0, said.error.join('\n'));
  assert.match(said.log[0], /removed 0 marker\(s\) from 0 file\(s\), of 3/);
});

test('built markdown outside the LLM surface is neither checked nor stripped', async () => {
  // A blog post about the markers, cross-posted for dev.to, names one and
  // even shows one unfenced. Neither file is a twin or a joined file.
  const post = lines(
    '# How the API pages are generated',
    '',
    'Each region opens with a `bestax:generated` marker:',
    '',
    open('props'),
    ''
  );
  const root = site(
    {
      'docs/api/card.md': PAGE,
      'build/docs/api/card.md': BARE,
      'build/llms-full.txt': BARE,
      'build/.devto-publish/how-the-api-pages-are-generated.md': post,
      'build/img/LICENSE.md': 'Mentions bestax:generated too.\n',
    },
    CARD
  );
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 0, said.error.join('\n'));
  assert.equal(
    readFileSync(
      join(root, 'build/.devto-publish/how-the-api-pages-are-generated.md'),
      'utf8'
    ),
    post
  );
  assert.match(said.log[0], /of 2 checked/);
});

test('a marker in a form the strip does not recognize fails the build', async () => {
  const escaped = '&lt;!-- bestax:generated props --&gt;';
  const root = site(
    {
      'docs/api/card.md': PAGE,
      'build/docs/api/card.md': lines('# Card', '', escaped, '| Prop |', ''),
      'build/llms-full.txt': BARE,
    },
    CARD
  );
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 1);
  assert.equal(said.error.length, 1);
  assert.match(
    said.error[0],
    /^strip-generated-markers: build\/docs\/api\/card\.md: 1 line\(s\) still name bestax:generated, against 0 such line\(s\) outside the marker lines in docs\/api\/card\.md\./
  );
});

test('a twin is held to its own page, not to what other pages show', async () => {
  // The guide names the marker in prose twice and shows one inside a fence,
  // so the site-wide totals would let the card's twin keep both of its leaks.
  const guide = lines(
    '# Markers',
    '',
    'A `bestax:generated` marker opens each region,',
    'and a `/bestax:generated` marker closes it:',
    '',
    '```md',
    open('props'),
    '```',
    ''
  );
  const escaped = '&lt;!-- bestax:generated props --&gt;';
  const root = site(
    {
      'docs/guides/markers.mdx': guide,
      'docs/api/card.md': PAGE,
      'docs/api/box.md': PAGE,
      'build/docs/guides/markers.md': guide,
      'build/docs/api/card.md': lines('# Card', '', escaped, '| Prop |', ''),
      'build/docs/api/box.md': lines('# Box', '', '```', open('props'), ''),
      'build/llms-full.txt': lines(guide, '---', '', BARE, '---', '', BARE),
    },
    {
      ...CARD,
      'docs/guides/markers.mdx': '/docs/guides/markers',
      'docs/api/box.md': '/docs/api/box',
    }
  );
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 1);
  assert.deepEqual(said.error.sort(), [
    'strip-generated-markers: build/docs/api/box.md: 1 marker line(s) are ' +
      'left inside code fences, and the fences in docs/api/box.md hold 0. ' +
      'A code fence left open earlier in the file hides the rest, so they ' +
      'would ship.',
    'strip-generated-markers: build/docs/api/card.md: 1 line(s) still name ' +
      'bestax:generated, against 0 such line(s) outside the marker lines in ' +
      'docs/api/card.md. A marker reached this file in a form the strip ' +
      'does not recognize, so it would ship.',
  ]);
});

test('a fence left open in llms-full.txt fails the build, naming the file', async () => {
  const root = site(
    {
      'docs/api/card.md': PAGE,
      'build/docs/api/card.md': PAGE,
      'build/llms-full.txt': lines('# A', '```jsx', '<Tabs>', '', '---', PAGE),
    },
    CARD
  );
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 1);
  assert.equal(said.error.length, 1);
  assert.match(
    said.error[0],
    /^strip-generated-markers: build\/llms-full\.txt: 2 marker line\(s\) are left inside code fences, and the fences in the twins it joins hold 0\./
  );
});

test('the joined files are held to the twins in the build, not to every source page', async () => {
  // A draft shows a marker in a fence and names one in prose. Counted with
  // the rest of the source pages, as the joined files once were, it would
  // let llms-full.txt hide a marker behind an open fence and llms.txt name
  // one, though no twin in the build shows or names any.
  const draft = lines(
    '---',
    'draft: true',
    '---',
    '',
    '# Draft',
    '',
    'Explains bestax:generated.',
    '',
    '```md',
    open('props'),
    '```',
    ''
  );
  const root = site(
    {
      'docs/guides/draft.md': draft,
      'docs/api/card.md': PAGE,
      'build/docs/api/card.md': BARE,
      'build/llms.txt': lines(
        '- [Card](https://bestax.io/docs/api/card.md)',
        '- [Draft](https://bestax.io/docs/guides/draft.md): Explains bestax:generated.',
        ''
      ),
      'build/llms-full.txt': lines('# Card', '', '```', '---', PAGE),
    },
    CARD,
    { unrendered: { 'docs/guides/draft.md': '/docs/guides/draft' } }
  );
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 1);
  assert.deepEqual(said.error.sort(), [
    'strip-generated-markers: build/llms-full.txt: 2 marker line(s) are ' +
      'left inside code fences, and the fences in the twins it joins hold ' +
      '0. A code fence left open earlier in the file hides the rest, so ' +
      'they would ship.',
    'strip-generated-markers: build/llms.txt: 1 line(s) still name ' +
      'bestax:generated, against 0 such line(s) outside the marker lines in ' +
      'the twins it joins. A marker reached this file in a form the strip ' +
      'does not recognize, so it would ship.',
  ]);
});

test('a marker a page shows inside a fence is accounted for', async () => {
  const shown = lines('# Markers', '', '```md', open('props'), '```', '');
  const root = site(
    {
      'docs/guides/markers.mdx': shown,
      'docs/api/card.md': PAGE,
      'build/docs/guides/markers.md': shown,
      'build/docs/api/card.md': PAGE,
      'build/llms-full.txt': lines(shown, '---', '', PAGE),
    },
    { ...CARD, 'docs/guides/markers.mdx': '/docs/guides/markers' }
  );
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 0, said.error.join('\n'));
  assert.equal(
    readFileSync(join(root, 'build/docs/guides/markers.md'), 'utf8'),
    shown
  );
});

test('only pages Docusaurus rendered are checked', async () => {
  // A draft keeps the metadata an earlier build wrote, and a partial never
  // had any. Both carry markers and have no twin, and neither fails the
  // build. Metadata whose source has gone, though its route is now another
  // page's, is not that page twice.
  const root = site(
    {
      'docs/guides/draft.md': lines('---', 'draft: true', '---', PAGE),
      'docs/guides/_partial.md': PAGE,
      'docs/guides/new.md': PAGE,
      'docs/api/card.md': PAGE,
      'build/docs/api/card.md': PAGE,
      'build/docs/guides/new.md': PAGE,
      'build/llms-full.txt': BARE,
    },
    { ...CARD, 'docs/guides/new.md': '/docs/guides/new' },
    {
      unrendered: { 'docs/guides/draft.md': '/docs/guides/draft' },
    }
  );
  const [stale, text] = pageData('docs/guides/old.md', '/docs/guides/new');
  writeFileSync(join(root, stale), text);
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 0, said.error.join('\n'));
  assert.match(said.log[0], /removed 4 marker\(s\) from 2 file\(s\), of 3/);
});

test('a twin is found at the route Docusaurus gave its page', async () => {
  // Number prefixes stripped from the path, an `id` in front matter, and a
  // slug that keeps its number prefix, which the plugin then strips, with the
  // HTML in folders as `trailingSlash: true` writes it. The old path-based
  // routing put each of these twins somewhere else.
  const root = site(
    {
      'docs/guides/01-start/02-install.md': PAGE,
      'docs/guides/a.md': lines('---', 'id: custom', '---', PAGE),
      'docs/b.md': lines('---', 'slug: /03-setup', '---', PAGE),
      'build/docs/guides/start/install.md': PAGE,
      'build/docs/guides/custom.md': PAGE,
      'build/docs/setup.md': PAGE,
      'build/llms-full.txt': BARE,
    },
    {
      'docs/guides/01-start/02-install.md': '/docs/guides/start/install',
      'docs/guides/a.md': '/docs/guides/custom',
      'docs/b.md': '/docs/03-setup',
    },
    { dirs: true }
  );
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 0, said.error.join('\n'));
  assert.match(said.log[0], /removed 6 marker\(s\) from 3 file\(s\), of 4/);
});

test('a site under a baseUrl finds its pages and twins below it', async () => {
  const root = site(
    {
      'docs/index.md': PAGE,
      'docs/api/card.md': PAGE,
      'build/index.md': PAGE,
      'build/docs/api/card.md': PAGE,
      'build/llms-full.txt': BARE,
    },
    {
      'docs/index.md': '/bestax/',
      'docs/api/card.md': '/bestax/docs/api/card',
    },
    { baseUrl: '/bestax/' }
  );
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 0, said.error.join('\n'));
  assert.match(said.log[0], /removed 4 marker\(s\) from 2 file\(s\), of 3/);
});

test('two pages that would share a twin fail the build, naming both', async () => {
  const root = site(
    {
      'docs/guides/FAQ.md': BARE,
      'docs/guides/questions.md': BARE,
      'docs/a/intro.md': BARE,
      'docs/a/other.md': BARE,
      'build/llms-full.txt': BARE,
    },
    {
      'docs/guides/FAQ.md': '/docs/guides/FAQ',
      'docs/guides/questions.md': '/docs/guides/faq',
      'docs/a/intro.md': '/docs/a/intro',
      'docs/a/other.md': '/docs/a/01-intro',
    }
  );
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 1);
  assert.equal(said.error.length, 2);
  assert.match(
    said.error.find(e => e.includes('FAQ')),
    /^strip-generated-markers: docs\/guides\/(FAQ|questions)\.md, docs\/guides\/(FAQ|questions)\.md would all have the twin build\/docs\/guides\/(FAQ|faq)\.md\. /
  );
  assert.match(
    said.error.find(e => e.includes('intro')),
    /docs\/a\/(intro|other)\.md, docs\/a\/(intro|other)\.md would all have the twin build\/docs\/a\/intro\.md\. /
  );
});

test('checking nothing while the sources carry markers fails, as does no build', async () => {
  const stale = site(
    { 'docs/api/card.md': PAGE, 'build/docs/api/card.md': '# Card\n' },
    CARD
  );
  const one = capture();
  assert.equal(await stripBuild(stale, one.io), 1);
  assert.match(
    one.said.error[0],
    /carry 2 marker\(s\), but the build has no llms-full\.txt\. /
  );

  const noTwins = site(
    { 'docs/api/card.md': PAGE, 'build/llms-full.txt': '# Card\n' },
    CARD
  );
  const two = capture();
  assert.equal(await stripBuild(noTwins, two.io), 1);
  assert.match(
    two.said.error[0],
    /but the build has no \.md twin for 1 page\(s\) carrying them: docs\/api\/card\.md \(expected build\/docs\/api\/card\.md\)\. /
  );

  const none = capture();
  assert.equal(await stripBuild(docsTree({}), none.io), 1);
  assert.match(none.said.error[0], /does not exist/);

  // No managed pages yet, and nothing to strip: a quiet pass.
  const empty = capture();
  const quiet = site(
    {
      'docs/intro.md': '# Hi\n',
      'build/docs/intro.md': '# Hi\n',
      'build/llms-full.txt': '# Hi\n',
    },
    { 'docs/intro.md': '/docs/intro' }
  );
  assert.equal(await stripBuild(quiet, empty.io), 0, empty.said.error[0]);
});

test('a build with no rendered page to check fails, whatever its markdown', async () => {
  // No metadata at all, and metadata for pages this build did not render:
  // either way there is nothing to hold the twins to.
  const files = {
    'docs/api/card.md': PAGE,
    'build/docs/api/card.md': PAGE,
    'build/llms-full.txt': PAGE,
  };
  for (const root of [docsTree(files), site(files, {}, { unrendered: CARD })]) {
    const { said, io } = capture();
    assert.equal(await stripBuild(root, io), 1);
    assert.equal(said.error.length, 1);
    assert.match(
      said.error[0],
      /^strip-generated-markers: found no doc page this build rendered in \.docusaurus\/docusaurus-plugin-content-docs\/default\. /
    );
    assert.equal(readFileSync(join(root, 'build/llms-full.txt'), 'utf8'), PAGE);
  }
});

test('a missing twin fails by name, however many other .md files the build has', async () => {
  // As many .md files as marker pages, but only one of them is the twin of
  // such a page: a count would pass this build.
  const tree = {
    'build/llms-full.txt': BARE,
    'build/docs/api/card.md': BARE,
    'build/.devto-publish/post.md': '# Post\n',
    'build/img/LICENSE.md': '# License\n',
    'build/docs/intro.md': '# Intro\n',
    'build/docs/guides/start.md': '# Start\n',
  };
  const pages = {};
  for (const name of ['card', 'box', 'tag', 'tile', 'hero']) {
    tree[`docs/api/${name}.md`] = PAGE;
    pages[`docs/api/${name}.md`] = `/docs/api/${name}`;
  }
  const { said, io } = capture();
  assert.equal(await stripBuild(site(tree, pages), io), 1);
  assert.equal(said.error.length, 1);
  assert.match(
    said.error[0],
    /but the build has no \.md twin for 4 page\(s\) carrying them: (docs\/api\/\w+\.md \(expected build\/docs\/api\/\w+\.md\), ){3}1 more\. /
  );
  assert.doesNotMatch(said.error[0], /docs\/api\/card\.md/);
});

test('twinPath names a twin from its permalink as the plugin does', () => {
  for (const [permalink, baseUrl, twin] of [
    ['/docs/api/components/card', '/', 'docs/api/components/card.md'],
    ['/docs/guides/llms', '/', 'docs/guides/llms.md'],
    ['/docs/guides/llms/', '/', 'docs/guides/llms.md'],
    ['/docs/guides/FAQ', '/', 'docs/guides/FAQ.md'],
    ['/docs', '/', 'docs.md'],
    ['/', '/', 'index.md'],
    // Below the baseUrl, which the build leaves out of its paths.
    ['/bestax/docs/intro', '/bestax/', 'docs/intro.md'],
    ['/bestax/', '/bestax/', 'index.md'],
    ['/bestax', '/bestax/', 'index.md'],
    ['/elsewhere/intro', '/bestax/', 'elsewhere/intro.md'],
    // Number prefixes go, unless what is left reads as a version.
    ['/docs/01-guides/02-intro', '/', 'docs/guides/intro.md'],
    ['/docs/7.0-notes', '/', 'docs/7.0-notes.md'],
    // A route already ending in .md or .mdx is not given a second ending.
    ['/docs/notes.md', '/', 'docs/notes.md'],
    ['/docs/notes.MDX', '/', 'docs/notes.md'],
    // No segment climbs out of build/.
    ['/docs/../intro', '/', 'docs/intro.md'],
  ]) {
    assert.equal(twinPath(permalink, baseUrl), twin, permalink);
  }
  assert.equal(twinPath('/docs/intro'), 'docs/intro.md');
});
