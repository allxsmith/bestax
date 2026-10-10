/**
 * Guards on check-generated-markers.mjs, the docs build step that checks the
 * built LLM files for a generated-region marker comment outside code, run on
 * temporary trees.
 */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkBuild, findMarkers } from './check-generated-markers.mjs';
import { stripGeneratedMarkers } from './generated-markers-lib.mjs';

const temps = [];
after(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

const open = id => `<!-- bestax:generated ${id} -->`;
const close = id => `<!-- /bestax:generated ${id} -->`;
const lines = (...l) => l.join('\n');

const PAGE = lines('# Card', '', open('props'), '| Prop |', close('props'), '');
const BARE = lines('# Card', '', '| Prop |', '');

/**
 * A docs package as `docusaurus build` leaves it: a source page carrying
 * markers, its twin, llms.txt and llms-full.txt, all clean, with `tree` (path
 * to text, or null to leave a file out) laid over them.
 */
function site(tree = {}) {
  const root = mkdtempSync(join(tmpdir(), 'check-markers-'));
  temps.push(root);
  const files = {
    'docs/api/card.md': PAGE,
    'build/docs/api/card.md': BARE,
    'build/llms.txt': '- [Card](https://bestax.io/docs/api/card.md)\n',
    'build/llms-full.txt': BARE,
    ...tree,
  };
  for (const [rel, text] of Object.entries(files)) {
    if (text === null) continue;
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text);
  }
  return root;
}

async function run(root) {
  const said = { log: [], error: [] };
  const code = await checkBuild(root, {
    log: text => said.log.push(text),
    error: text => said.error.push(text),
  });
  return { code, ...said };
}

/** `run(site(tree))` for a twin that must pass, so the failure says why. */
async function passes(twin) {
  const { code, error } = await run(site({ 'build/docs/guides/x.md': twin }));
  assert.equal(code, 0, error.join('\n'));
}

const read = (root, rel) => readFileSync(join(root, rel), 'utf8');

test('a clean build passes, naming how many files it checked', async () => {
  const { code, log, error } = await run(site());
  assert.equal(code, 0, error.join('\n'));
  assert.deepEqual(log, ['check-generated-markers: checked 3 file(s)']);
});

test('a marker the plugin let through fails the build, and is left in place', async () => {
  const root = site({
    'build/docs/api/card.md': PAGE,
    'build/llms-full.txt': lines(BARE, `The props ${open('props')} follow.`),
  });
  const { code, error } = await run(root);
  assert.equal(code, 1);
  assert.deepEqual(error, [
    'check-generated-markers: build/docs/api/card.md: a bestax:generated ' +
      'marker comment outside code, on line(s) 3, 5, would ship.',
    'check-generated-markers: build/llms-full.txt: a bestax:generated ' +
      'marker comment outside code, on line(s) 5, would ship.',
  ]);
  assert.equal(read(root, 'build/docs/api/card.md'), PAGE);
});

test('a marker whose < is an HTML entity fails the build', async () => {
  for (const lt of ['&lt;', '&LT;', '&#60;', '&#060;', '&#x3c;', '&#X003C;']) {
    const { code, error } = await run(
      site({
        'build/docs/api/card.md': lines(
          '# Card',
          `${lt}!-- /bestax:generated props --&gt;`,
          ''
        ),
      })
    );
    assert.equal(code, 1, lt);
    assert.match(error[0], /card\.md: .* on line\(s\) 2, would ship\./, lt);
  }
});

test('a marker shown in a fence passes, at any indent or in a blockquote', async () => {
  await passes(lines('# Markers', '', '```md', open('a'), close('a'), '```'));
  await passes(lines('~~~', open('a'), '~~~', ''));
  // Indented four spaces inside a list item: code to the plugin, though
  // CommonMark would not open a fence there outside the item.
  await passes(
    lines('1. Step:', '', '    ```md', `    ${open('a')}`, '    ```')
  );
  // Inside a blockquote, nested or not, opened and closed the same way.
  await passes(lines('> ```md', `> ${open('a')}`, '> ```', ''));
  await passes(lines('> > ~~~~', `> > ${open('a')}`, '> > ~~~', '> > ~~~~'));
});

test('a marker in an inline code span passes, and one beside it fails', async () => {
  await passes(
    lines(
      `Each region opens with \`${open('<id>')}\` and closes`,
      `with \`\`${close('<id>')}\`\`, or \`&lt;!-- bestax:generated\` escaped.`,
      ''
    )
  );
  // A span ends at a run as long as the one that opened it.
  const { outside } = findMarkers(
    lines(`A span: \`a \`\` ${open('a')}\` then ${close('a')}.`, '')
  );
  assert.deepEqual(outside, [1]);
  // A backtick with no partner opens no span.
  assert.deepEqual(findMarkers(`It\`s ${open('a')}`).outside, [1]);
});

test('an HTML <code> element is not code', async () => {
  const { code } = await run(
    site({
      'build/docs/guides/x.md': `Shown as <code>${open('a')}</code>.\n`,
    })
  );
  assert.equal(code, 1);
});

test('prose that names bestax:generated without the comment syntax passes', async () => {
  const root = site({
    'build/docs/guides/markers.md': lines(
      '# Markers',
      '',
      'A bestax:generated region is owned by the generator.',
      '<!-- bestax:generatedx -->',
      ''
    ),
    'build/llms.txt':
      '- [Markers](/docs/guides/markers.md): bestax:generated\n',
  });
  const { code, error } = await run(root);
  assert.equal(code, 0, error.join('\n'));
});

test('a twin that ends inside an open fence fails, naming the line', async () => {
  const root = site({
    'build/docs/api/card.md': lines('# Card', '```jsx', '<Tabs>', '', PAGE),
  });
  const { code, error } = await run(root);
  assert.equal(code, 1);
  assert.deepEqual(error, [
    'check-generated-markers: build/docs/api/card.md: the code fence opened ' +
      'on line 2 is never closed, so everything after it reads as code and ' +
      'a marker there would ship unseen.',
  ]);
  // A fence closes only on a run of its own character, at least as long,
  // with nothing after it; a backtick fence's info string holds no backtick.
  assert.equal(findMarkers(lines('````md', '```', '~~~~', '')).unclosedAt, 1);
  assert.equal(findMarkers(lines('```js', '```js', '')).unclosedAt, 1);
  assert.equal(findMarkers(lines('``` a ` b', 'x', '')).unclosedAt, 0);
  assert.equal(findMarkers(lines('```', 'x', '```')).unclosedAt, 0);
});

test('a missing llms-full.txt or llms.txt fails the build', async () => {
  for (const name of ['llms-full.txt', 'llms.txt']) {
    const { code, error } = await run(site({ [`build/${name}`]: null }));
    assert.equal(code, 1, name);
    assert.equal(error.length, 1);
    assert.ok(
      error[0].startsWith(
        `check-generated-markers: the build has no ${name}. `
      ),
      error[0]
    );
  }
});

test('no twins while the source pages carry markers fails the build', async () => {
  const { code, error } = await run(site({ 'build/docs/api/card.md': null }));
  assert.equal(code, 1);
  assert.match(
    error[0],
    /^check-generated-markers: the build has no \.md under build\/docs, though the source pages carry markers\. /
  );

  // No managed pages yet: a quiet pass over the joined files.
  const quiet = await run(
    site({ 'docs/api/card.md': BARE, 'build/docs/api/card.md': null })
  );
  assert.equal(quiet.code, 0, quiet.error.join('\n'));
  assert.deepEqual(quiet.log, ['check-generated-markers: checked 2 file(s)']);
});

test('no build at all fails', async () => {
  const root = mkdtempSync(join(tmpdir(), 'check-markers-'));
  temps.push(root);
  const { code, error } = await run(root);
  assert.equal(code, 1);
  assert.match(error[0], /build does not exist/);
});

test('only files are read, and only under build/docs', async () => {
  // A directory named like a twin, and a dev.to copy of a blog post that
  // shows a marker unfenced: neither is part of the LLM surface.
  const post = lines('# How the API pages are generated', '', open('a'), '');
  const root = site({
    'build/docs/x.md/index.html': '<!doctype html>\n',
    'build/.devto-publish/post.md': post,
    'build/img/LICENSE.md': post,
  });
  const { code, log, error } = await run(root);
  assert.equal(code, 0, error.join('\n'));
  assert.deepEqual(log, ['check-generated-markers: checked 3 file(s)']);
});

test('the real docs pages, once the markers are gone, pass the check', () => {
  const docs = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs');
  const pages = readdirSync(docs, { recursive: true }).filter(name =>
    /\.mdx?$/.test(name)
  );
  assert.ok(pages.length > 0);
  for (const name of pages) {
    const src = stripGeneratedMarkers(readFileSync(join(docs, name), 'utf8'));
    assert.deepEqual(findMarkers(src), { outside: [], unclosedAt: 0 }, name);
  }
});
