/**
 * Guards on check-generated-markers.mjs, the docs build step that checks the
 * built markdown, llms.txt and llms-full.txt for the marker keyword, run on
 * temporary trees.
 */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
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

const leaked = file =>
  `check-generated-markers: ${file} contains bestax:generated, so the ` +
  `keyword reached built output: a marker got through, or a page shows ` +
  `marker syntax with the keyword in it.`;

const empty = file =>
  `check-generated-markers: ${file} is empty, so there is nothing in it to ` +
  `check.`;

const missing = file =>
  `check-generated-markers: ${file} is missing, so docusaurus-plugin-llms ` +
  `did not write it, or this step ran before it.`;

const notChecked = file =>
  `check-generated-markers: ${file} is not a regular file or directory, so ` +
  `it was not checked.`;

const NO_TWINS =
  'check-generated-markers: build/docs holds no twin, a .md that is not a ' +
  'copy of one in static/, so docusaurus-plugin-llms wrote none, or this ' +
  'step ran before it.';

/** Asserts that `tree` fails the build with exactly `errors`, in any order. */
async function fails(tree, errors) {
  const { code, error } = await run(site(tree));
  error.sort();
  errors.sort();
  assert.equal(code, 1, JSON.stringify(tree));
  assert.deepEqual(error, errors);
}

test('a clean build passes, naming how many files it checked', async () => {
  const { code, log, error } = await run(site());
  assert.equal(code, 0, error.join('\n'));
  assert.deepEqual(log, ['check-generated-markers: checked 3 file(s)']);
});

test('a marker in a twin fails the build', async () => {
  const file = 'build/docs/api/card.md';
  await fails({ [file]: PAGE }, [leaked(file)]);
});

test('a marker in a blog syndication copy fails the build', async () => {
  const file = 'build/.devto-publish/post.md';
  await fails({ [file]: PAGE }, [leaked(file)]);
});

test('an HTML-escaped marker fails the build', async () => {
  const file = 'build/docs/api/card.md';
  await fails({ [file]: '&lt;!-- bestax:generated a --&gt;\n' }, [
    leaked(file),
  ]);
  await fails({ [file]: '&#x3c;!-- /bestax:generated a -->\n' }, [
    leaked(file),
  ]);
});

test('a marker in a twin with CRLF line endings fails the build', async () => {
  const file = 'build/docs/api/card.md';
  await fails({ [file]: PAGE.replace(/\n/g, '\r\n') }, [leaked(file)]);
});

test('the keyword in llms.txt or llms-full.txt fails the build', async () => {
  await fails({ 'build/llms.txt': '- [Card](/card.md): bestax:generated\n' }, [
    leaked('build/llms.txt'),
  ]);
  await fails({ 'build/llms-full.txt': lines(BARE, '---', PAGE) }, [
    leaked('build/llms-full.txt'),
  ]);
});

test('a build missing llms.txt, llms-full.txt or every twin fails', async () => {
  for (const [file, error] of [
    ['build/llms-full.txt', missing('build/llms-full.txt')],
    ['build/llms.txt', missing('build/llms.txt')],
    ['build/docs/api/card.md', NO_TWINS],
  ]) {
    // Markdown elsewhere in build/ is no sign the twins were written.
    await fails({ [file]: null, 'build/blog/post.md': BARE }, [error]);
  }

  const root = mkdtempSync(join(tmpdir(), 'check-markers-'));
  temps.push(root);
  const none = await run(root);
  assert.equal(none.code, 1);
  assert.match(none.error[0], /build does not exist/);
});

test('a copy of static/ under build/docs is no twin', async () => {
  // Docusaurus copies static/docs/notes.md to build/docs/notes.md as is.
  await fails(
    {
      'build/docs/api/card.md': null,
      'static/docs/notes.md': BARE,
      'build/docs/notes.md': BARE,
    },
    [NO_TWINS]
  );
});

test(
  'an unreadable file is reported with the rest',
  {
    skip: process.getuid?.() === 0 && 'root reads any file',
  },
  async () => {
    const root = site({ 'build/llms.txt': null });
    chmodSync(join(root, 'build/llms-full.txt'), 0o000);
    const { code, error } = await run(root);
    assert.equal(code, 1);
    assert.deepEqual(error.sort(), [
      'check-generated-markers: build/llms-full.txt could not be read: EACCES.',
      missing('build/llms.txt'),
    ]);
  }
);

test(
  'an unreadable directory is reported, and the walk carries on past it',
  {
    skip: process.getuid?.() === 0 && 'root reads any directory',
  },
  async () => {
    const root = site({
      'build/llms.txt': null,
      'build/docs/guides/intro.md': PAGE,
    });
    const locked = join(root, 'build/docs/api');
    chmodSync(locked, 0o000);
    try {
      const { code, error } = await run(root);
      assert.equal(code, 1);
      assert.deepEqual(error.sort(), [
        'check-generated-markers: build/docs/api could not be read: EACCES.',
        leaked('build/docs/guides/intro.md'),
        missing('build/llms.txt'),
      ]);
    } finally {
      chmodSync(locked, 0o755);
    }
  }
);

test(
  'an unreadable build/docs is reported, with no claim about twins',
  {
    skip: process.getuid?.() === 0 && 'root reads any directory',
  },
  async () => {
    const root = site();
    const locked = join(root, 'build/docs');
    chmodSync(locked, 0o000);
    try {
      const { code, error } = await run(root);
      assert.equal(code, 1);
      assert.deepEqual(error, [
        'check-generated-markers: build/docs could not be read: EACCES.',
      ]);
    } finally {
      chmodSync(locked, 0o755);
    }
  }
);

test('a build/ that is a file is reported, and nothing it hides', async () => {
  const root = mkdtempSync(join(tmpdir(), 'check-markers-'));
  temps.push(root);
  writeFileSync(join(root, 'build'), 'not a directory\n');
  const { code, error } = await run(root);
  assert.equal(code, 1);
  assert.deepEqual(error, [
    'check-generated-markers: build could not be read: ENOTDIR.',
  ]);
});

test('a link under build/ is reported, not followed', async () => {
  // Both links point at markers outside build/, which a followed link
  // would report as leaks.
  const root = site({
    'build/llms.txt': null,
    'elsewhere/page.md': PAGE,
    'elsewhere/dir/page.md': PAGE,
  });
  symlinkSync(join(root, 'elsewhere/page.md'), join(root, 'build/docs/a.md'));
  symlinkSync(join(root, 'elsewhere/dir'), join(root, 'build/docs/dir'));
  const { code, error } = await run(root);
  assert.equal(code, 1);
  assert.deepEqual(error.sort(), [
    notChecked('build/docs/a.md'),
    notChecked('build/docs/dir'),
    missing('build/llms.txt'),
  ]);
});

test('a link that may be the only twin leaves out the no-twin claim', async () => {
  const root = site({
    'build/docs/api/card.md': null,
    'elsewhere/page.md': BARE,
  });
  mkdirSync(join(root, 'build/docs'));
  symlinkSync(join(root, 'elsewhere/page.md'), join(root, 'build/docs/a.md'));
  const { code, error } = await run(root);
  assert.equal(code, 1);
  assert.deepEqual(error, [notChecked('build/docs/a.md')]);
});

test('a linked llms-full.txt is reported as a link and nothing else', async () => {
  // Its target names the keyword, which a followed link would report, and
  // a link is not a missing file either.
  const root = site({
    'build/llms-full.txt': null,
    'elsewhere/llms-full.txt': lines(BARE, '---', PAGE),
  });
  symlinkSync(
    join(root, 'elsewhere/llms-full.txt'),
    join(root, 'build/llms-full.txt')
  );
  const { code, error } = await run(root);
  assert.equal(code, 1);
  assert.deepEqual(error, [notChecked('build/llms-full.txt')]);
});

test('an empty or whitespace-only file fails the build', async () => {
  for (const file of [
    'build/llms.txt',
    'build/llms-full.txt',
    'build/docs/api/card.md',
    'build/img/LICENSE.md',
  ]) {
    await fails({ [file]: '' }, [empty(file)]);
    await fails({ [file]: ' \n\t\r\n' }, [empty(file)]);
  }
});

test('every problem is reported before the build fails', async () => {
  await fails(
    {
      'build/llms.txt': null,
      'build/img/LICENSE.md': '',
      'build/docs/api/card.md': PAGE,
    },
    [
      missing('build/llms.txt'),
      leaked('build/docs/api/card.md'),
      empty('build/img/LICENSE.md'),
    ]
  );
});

test('a directory named like a page is not read', async () => {
  const root = site({ 'build/docs/x.md/index.html': '<!doctype html>\n' });
  const { code, log, error } = await run(root);
  assert.equal(code, 0, error.join('\n'));
  assert.deepEqual(log, ['check-generated-markers: checked 3 file(s)']);
});
