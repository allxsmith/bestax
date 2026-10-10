/**
 * Guards on check-generated-markers.mjs, the docs build step that checks the
 * built markdown and LLM files for the marker keyword, run on temporary
 * trees.
 */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { checkBuild } from './check-generated-markers.mjs';

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
 * A docs package as `docusaurus build` leaves it: a twin, llms.txt and
 * llms-full.txt, all clean, with `tree` (path to text, or null to leave a
 * file out) laid over them.
 */
function site(tree = {}) {
  const root = mkdtempSync(join(tmpdir(), 'check-markers-'));
  temps.push(root);
  const files = {
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

/** Asserts that `text` at `file` fails the build, naming that file. */
async function fails(file, text) {
  const { code, error } = await run(site({ [file]: text }));
  assert.equal(code, 1, text);
  assert.deepEqual(error, [
    `check-generated-markers: ${file} contains bestax:generated. A marker ` +
      `reached the LLM output, or a page shows marker syntax with the ` +
      `keyword in it.`,
  ]);
}

test('a clean build passes, naming how many files it checked', async () => {
  const { code, log, error } = await run(site());
  assert.equal(code, 0, error.join('\n'));
  assert.deepEqual(log, ['check-generated-markers: checked 3 file(s)']);
});

test('a marker in a twin fails the build', async () => {
  await fails('build/docs/api/card.md', PAGE);
});

test('a marker in built markdown outside build/docs fails the build', async () => {
  await fails('build/.devto-publish/post.md', PAGE);
});

test('an HTML-escaped marker fails the build', async () => {
  await fails('build/docs/api/card.md', '&lt;!-- bestax:generated a --&gt;\n');
  await fails('build/docs/api/card.md', '&#x3c;!-- /bestax:generated a -->\n');
});

test('a marker in a twin with CRLF line endings fails the build', async () => {
  await fails('build/docs/api/card.md', PAGE.replace(/\n/g, '\r\n'));
});

test('the keyword in llms.txt or llms-full.txt fails the build', async () => {
  await fails('build/llms.txt', '- [Card](/card.md): bestax:generated\n');
  await fails('build/llms-full.txt', lines(BARE, '---', PAGE));
});

test('a build missing llms.txt, llms-full.txt or every twin fails', async () => {
  for (const [file, what] of [
    ['build/llms-full.txt', 'llms-full.txt'],
    ['build/llms.txt', 'llms.txt'],
    ['build/docs/api/card.md', '.md under build/docs'],
  ]) {
    // Markdown elsewhere in build/ is no sign the twins were written.
    const root = site({ [file]: null, 'build/blog/post.md': BARE });
    const { code, error } = await run(root);
    assert.equal(code, 1, file);
    assert.equal(error.length, 1);
    assert.ok(
      error[0].startsWith(
        `check-generated-markers: the build has no ${what}. `
      ),
      error[0]
    );
  }

  const root = mkdtempSync(join(tmpdir(), 'check-markers-'));
  temps.push(root);
  const none = await run(root);
  assert.equal(none.code, 1);
  assert.match(none.error[0], /build does not exist/);
});

test('an empty LLM file or page fails the build', async () => {
  for (const file of [
    'build/llms.txt',
    'build/llms-full.txt',
    'build/docs/api/card.md',
    'build/img/LICENSE.md',
  ]) {
    const { code, error } = await run(site({ [file]: '' }));
    assert.equal(code, 1, file);
    assert.deepEqual(error, [
      `check-generated-markers: ${file} is empty, so there is nothing in ` +
        `it to check. Refusing to pass silently.`,
    ]);
  }
});

test('a directory named like a page is not read', async () => {
  const root = site({ 'build/docs/x.md/index.html': '<!doctype html>\n' });
  const { code, log, error } = await run(root);
  assert.equal(code, 0, error.join('\n'));
  assert.deepEqual(log, ['check-generated-markers: checked 3 file(s)']);
});
