/**
 * Guards on strip-generated-markers.mjs, the docs build step that strips the
 * generated-region markers from the built LLM files and checks none is left
 * outside code, run on temporary trees.
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
import { stripBuild } from './strip-generated-markers.mjs';

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
  const root = mkdtempSync(join(tmpdir(), 'strip-markers-'));
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
  const code = await stripBuild(root, {
    log: text => said.log.push(text),
    error: text => said.error.push(text),
  });
  return { code, ...said };
}

const read = (root, rel) => readFileSync(join(root, rel), 'utf8');

test('a clean build passes, having checked every LLM file', async () => {
  const { code, log, error } = await run(site());
  assert.equal(code, 0, error.join('\n'));
  assert.deepEqual(log, [
    'strip-generated-markers: removed 0 marker(s) from 0 file(s), of 3 checked',
  ]);
});

test('a marker line that got through is stripped, and the build passes', async () => {
  const root = site({
    'build/docs/api/card.md': PAGE,
    'build/llms-full.txt': lines(PAGE, '---', '', PAGE),
  });
  const { code, log, error } = await run(root);
  assert.equal(code, 0, error.join('\n'));
  assert.equal(read(root, 'build/docs/api/card.md'), BARE);
  assert.ok(!read(root, 'build/llms-full.txt').includes('bestax:'));
  assert.match(log[0], /removed 6 marker\(s\) from 2 file\(s\), of 3 checked/);
});

test('a marker comment in prose fails the build, naming the file and line', async () => {
  const root = site({
    'build/docs/api/card.md': lines(
      '# Card',
      '',
      `The props ${open('props')} follow.`,
      ''
    ),
  });
  const { code, error } = await run(root);
  assert.equal(code, 1);
  assert.deepEqual(error, [
    'strip-generated-markers: build/docs/api/card.md: a bestax:generated ' +
      'marker comment outside code, on line(s) 3, would ship.',
  ]);
});

test('an HTML-escaped marker fails the build, opening or closing', async () => {
  const root = site({
    'build/docs/api/card.md': lines(
      '# Card',
      '&lt;!-- bestax:generated props --&gt;',
      '| Prop |',
      ''
    ),
    'build/llms-full.txt': lines(
      BARE,
      '&lt;!-- /bestax:generated props --&gt;',
      ''
    ),
  });
  const { code, error } = await run(root);
  assert.equal(code, 1);
  assert.deepEqual(error, [
    'strip-generated-markers: build/docs/api/card.md: a bestax:generated ' +
      'marker comment outside code, on line(s) 2, would ship.',
    'strip-generated-markers: build/llms-full.txt: a bestax:generated ' +
      'marker comment outside code, on line(s) 5, would ship.',
  ]);
});

test('a marker shown inside a fence stays, and the build passes', async () => {
  const shown = lines(
    '# Markers',
    '',
    '```md',
    open('props'),
    '&lt;!-- /bestax:generated props --&gt;',
    '```',
    ''
  );
  const root = site({
    'build/docs/guides/markers.md': shown,
    'build/llms-full.txt': lines(shown, '---', '', BARE),
  });
  const { code, error } = await run(root);
  assert.equal(code, 0, error.join('\n'));
  assert.equal(read(root, 'build/docs/guides/markers.md'), shown);
});

test('a marker inside inline code passes', async () => {
  const twin = lines(
    '# Markers',
    '',
    `Each region opens with \`${open('<id>')}\` and closes`,
    `with \`\`${close('<id>')}\`\`, or \`&lt;!-- bestax:generated\` escaped.`,
    ''
  );
  const root = site({ 'build/docs/guides/markers.md': twin });
  const { code, error } = await run(root);
  assert.equal(code, 0, error.join('\n'));
  assert.equal(read(root, 'build/docs/guides/markers.md'), twin);
});

test('prose that names bestax:generated without the comment syntax passes', async () => {
  const twin = lines(
    '# Markers',
    '',
    'A bestax:generated region is owned by the generator.',
    '',
    'Each `bestax:generated` marker comes in a pair.',
    ''
  );
  const root = site({
    'build/docs/guides/markers.md': twin,
    'build/llms.txt':
      '- [Markers](/docs/guides/markers.md): bestax:generated regions\n',
  });
  const { code, error } = await run(root);
  assert.equal(code, 0, error.join('\n'));
});

test('a fence left open fails the build, since it hides the markers after it', async () => {
  // One page's open fence in llms-full.txt makes the next page's markers
  // read as code.
  const root = site({
    'build/llms-full.txt': lines('# A', '```jsx', '<Tabs>', '', '---', PAGE),
  });
  const { code, error } = await run(root);
  assert.equal(code, 1);
  assert.deepEqual(error, [
    'strip-generated-markers: build/llms-full.txt: the code fence opened on ' +
      'line 2 is never closed, so everything after it reads as code and a ' +
      'marker there would ship unseen.',
  ]);
});

test('a missing llms-full.txt or llms.txt fails the build', async () => {
  for (const name of ['llms-full.txt', 'llms.txt']) {
    const { code, error } = await run(site({ [`build/${name}`]: null }));
    assert.equal(code, 1, name);
    assert.equal(error.length, 1);
    assert.ok(
      error[0].startsWith(
        `strip-generated-markers: the build has no ${name}. `
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
    /^strip-generated-markers: the build has no \.md under build\/docs, though the source pages carry markers\. /
  );

  // No managed pages yet: nothing to strip, and a quiet pass.
  const quiet = await run(
    site({ 'docs/api/card.md': BARE, 'build/docs/api/card.md': null })
  );
  assert.equal(quiet.code, 0, quiet.error.join('\n'));
  assert.match(quiet.log[0], /of 2 checked/);
});

test('no build at all fails', async () => {
  const root = mkdtempSync(join(tmpdir(), 'strip-markers-'));
  temps.push(root);
  const { code, error } = await run(root);
  assert.equal(code, 1);
  assert.match(error[0], /build does not exist/);
});

test('built markdown outside build/docs is neither checked nor stripped', async () => {
  // A blog post about the markers, cross-posted for dev.to, shows them in
  // every form the check refuses.
  const post = lines(
    '# How the API pages are generated',
    '',
    open('props'),
    `Each region opens with ${open('props')} in prose,`,
    '&lt;!-- /bestax:generated props --&gt;',
    ''
  );
  const root = site({
    'build/.devto-publish/how-the-api-pages-are-generated.md': post,
    'build/img/LICENSE.md': post,
  });
  const { code, log, error } = await run(root);
  assert.equal(code, 0, error.join('\n'));
  assert.equal(
    read(root, 'build/.devto-publish/how-the-api-pages-are-generated.md'),
    post
  );
  assert.equal(read(root, 'build/img/LICENSE.md'), post);
  assert.match(log[0], /of 3 checked/);
});
