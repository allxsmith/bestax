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
import { stripBuild } from './strip-generated-markers.mjs';

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

test('a clean build loses every marker and passes', async () => {
  const root = docsTree({
    'docs/api/card.md': PAGE,
    'build/api/card.md': PAGE,
    'build/llms-full.txt': lines(PAGE, '---', '', PAGE),
  });
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 0, said.error.join('\n'));
  for (const file of ['build/api/card.md', 'build/llms-full.txt']) {
    assert.ok(!readFileSync(join(root, file), 'utf8').includes('bestax:'));
  }
  assert.match(said.log[0], /removed 6 marker\(s\) from 2 file\(s\), of 2/);
});

test('a build the plugin already stripped passes, having checked it', async () => {
  const bare = lines('# Card', '', '| Prop |', '');
  const root = docsTree({
    'docs/api/card.md': PAGE,
    'build/api/card.md': bare,
    'build/llms-full.txt': bare,
  });
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 0, said.error.join('\n'));
  assert.match(said.log[0], /removed 0 marker\(s\) from 0 file\(s\), of 2/);
});

test('a marker in a form the strip does not recognize fails the build', async () => {
  const escaped = '&lt;!-- bestax:generated props --&gt;';
  const root = docsTree({
    'docs/api/card.md': PAGE,
    'build/api/card.md': lines('# Card', '', escaped, '| Prop |', ''),
    'build/llms-full.txt': lines('# Card', '', '| Prop |', ''),
  });
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 1);
  assert.equal(said.error.length, 1);
  assert.match(
    said.error[0],
    /^strip-generated-markers: api\/card\.md: 1 line\(s\) still name bestax:generated/
  );
});

test('a fence left open in llms-full.txt fails the build, naming the file', async () => {
  const root = docsTree({
    'docs/api/card.md': PAGE,
    'build/api/card.md': PAGE,
    'build/llms-full.txt': lines('# A', '```jsx', '<Tabs>', '', '---', PAGE),
  });
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 1);
  assert.equal(said.error.length, 1);
  assert.match(
    said.error[0],
    /^strip-generated-markers: llms-full\.txt: 2 marker line\(s\) are left inside code fences/
  );
});

test('a marker a page shows inside a fence is accounted for', async () => {
  const shown = lines('# Markers', '', '```md', open('props'), '```', '');
  const root = docsTree({
    'docs/guides/markers.mdx': shown,
    'docs/api/card.md': PAGE,
    'build/guides/markers.md': shown,
    'build/api/card.md': PAGE,
    'build/llms-full.txt': lines(shown, '---', '', PAGE),
  });
  const { said, io } = capture();
  assert.equal(await stripBuild(root, io), 0, said.error.join('\n'));
  assert.equal(
    readFileSync(join(root, 'build/guides/markers.md'), 'utf8'),
    shown
  );
});

test('checking nothing while the sources carry markers fails, as does no build', async () => {
  const stale = docsTree({
    'docs/api/card.md': PAGE,
    'build/api/card.md': '# Card\n',
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
    /but the build has 0 \.md file\(s\) for 1 page\(s\) carrying them\./
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
