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

test('a clean build loses every marker and passes', async () => {
  const root = docsTree({
    'docs/api/card.md': PAGE,
    'build/docs/api/card.md': PAGE,
    'build/llms-full.txt': lines(PAGE, '---', '', PAGE),
  });
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 0, said.error.join('\n'));
  for (const file of ['build/docs/api/card.md', 'build/llms-full.txt']) {
    assert.ok(!readFileSync(join(root, file), 'utf8').includes('bestax:'));
  }
  assert.match(said.log[0], /removed 6 marker\(s\) from 2 file\(s\), of 2/);
});

test('a build the plugin already stripped passes, having checked it', async () => {
  const root = docsTree({
    'docs/api/card.md': PAGE,
    'build/docs/api/card.md': BARE,
    'build/llms-full.txt': BARE,
  });
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 0, said.error.join('\n'));
  assert.match(said.log[0], /removed 0 marker\(s\) from 0 file\(s\), of 2/);
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
  const root = docsTree({
    'docs/api/card.md': PAGE,
    'build/docs/api/card.md': BARE,
    'build/llms-full.txt': BARE,
    'build/.devto-publish/how-the-api-pages-are-generated.md': post,
    'build/img/LICENSE.md': 'Mentions bestax:generated too.\n',
  });
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
  const root = docsTree({
    'docs/api/card.md': PAGE,
    'build/docs/api/card.md': lines('# Card', '', escaped, '| Prop |', ''),
    'build/llms-full.txt': BARE,
  });
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
  const root = docsTree({
    'docs/guides/markers.mdx': guide,
    'docs/api/card.md': PAGE,
    'build/docs/guides/markers.md': guide,
    'build/docs/api/card.md': lines('# Card', '', escaped, '| Prop |', ''),
    'build/docs/api/box.md': lines('# Box', '', '```', open('props'), ''),
    'docs/api/box.md': PAGE,
    'build/llms-full.txt': lines(guide, '---', '', BARE, '---', '', BARE),
  });
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
  const root = docsTree({
    'docs/api/card.md': PAGE,
    'build/docs/api/card.md': PAGE,
    'build/llms-full.txt': lines('# A', '```jsx', '<Tabs>', '', '---', PAGE),
  });
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 1);
  assert.equal(said.error.length, 1);
  assert.match(
    said.error[0],
    /^strip-generated-markers: build\/llms-full\.txt: 2 marker line\(s\) are left inside code fences, and the fences in the source pages hold 0\./
  );
});

test('a marker a page shows inside a fence is accounted for', async () => {
  const shown = lines('# Markers', '', '```md', open('props'), '```', '');
  const root = docsTree({
    'docs/guides/markers.mdx': shown,
    'docs/api/card.md': PAGE,
    'build/docs/guides/markers.md': shown,
    'build/docs/api/card.md': PAGE,
    'build/llms-full.txt': lines(shown, '---', '', PAGE),
  });
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 0, said.error.join('\n'));
  assert.equal(
    readFileSync(join(root, 'build/docs/guides/markers.md'), 'utf8'),
    shown
  );
});

test('checking nothing while the sources carry markers fails, as does no build', async () => {
  const stale = docsTree({
    'docs/api/card.md': PAGE,
    'build/docs/api/card.md': '# Card\n',
  });
  const one = capture();
  assert.equal(await stripBuild(stale, one.io), 1);
  assert.match(
    one.said.error[0],
    /carry 2 marker\(s\), but the build has no llms-full\.txt\. /
  );

  const noTwins = docsTree({
    'docs/api/card.md': PAGE,
    'build/llms-full.txt': '# Card\n',
  });
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
  assert.equal(
    await stripBuild(docsTree({ 'build/index.md': '# Hi\n' }), empty.io),
    0
  );
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
  for (const name of ['card', 'box', 'tag', 'tile', 'hero']) {
    tree[`docs/api/${name}.md`] = PAGE;
  }
  const { said, io } = capture();
  assert.equal(await stripBuild(docsTree(tree), io), 1);
  assert.equal(said.error.length, 1);
  assert.match(
    said.error[0],
    /but the build has no \.md twin for 4 page\(s\) carrying them: (docs\/api\/\w+\.md \(expected build\/docs\/api\/\w+\.md\), ){3}1 more\. /
  );
  assert.doesNotMatch(said.error[0], /docs\/api\/card\.md/);
});

test('twinPath follows the routes Docusaurus gives the pages', () => {
  const page = '# Page\n';
  const front = fields => lines('---', ...fields, '---', '', '# Page', '');
  for (const [rel, text, twin] of [
    ['api/components/card.md', page, 'docs/api/components/card.md'],
    ['intro.md', page, 'docs/intro.md'],
    ['skills/theming.mdx', page, 'docs/skills/theming.md'],
    ['guides/FAQ.md', page, 'docs/guides/FAQ.md'],
    // A category index takes its folder's route.
    ['guides/llms/index.md', page, 'docs/guides/llms.md'],
    ['guides/library/README.mdx', page, 'docs/guides/library.md'],
    ['api/columns/columns.md', page, 'docs/api/columns.md'],
    ['index.md', page, 'docs.md'],
    // A frontmatter slug wins, absolute or relative to the page's folder.
    [
      'guides/getting-started/migration/index.md',
      front(['title: Migration', 'slug: /guides/getting-started/migration']),
      'docs/guides/getting-started/migration.md',
    ],
    ['guides/a.md', front(["slug: '/elsewhere/b/'"]), 'docs/elsewhere/b.md'],
    ['guides/a.md', front(['slug: b']), 'docs/guides/b.md'],
    // A slug outside the frontmatter is only text.
    ['guides/a.md', lines('# A', '', 'slug: /b', ''), 'docs/guides/a.md'],
  ]) {
    assert.equal(twinPath(rel, text), twin, rel);
  }
});
