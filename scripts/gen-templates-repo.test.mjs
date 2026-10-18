/**
 * Guards on gen-templates-repo.mjs, the generator behind the publish of
 * templates/ to allxsmith/bestax-templates.
 *
 * The publish runs only on main, so these tests are what a PR gets. The
 * first group runs the generator on the real tree, so a change that would
 * break the published mirror fails the PR instead of the publish run. The
 * rest hold each rule with small git repositories, since the tree is defined
 * as what git tracks.
 */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COPIED,
  DATA_FILE,
  INPUT_FILES,
  PUBLISH_PATHS,
  buildTree,
  creditedTemplates,
  generate,
  main,
  renderReadme,
  repoLabel,
  treeProblems,
} from './gen-templates-repo.mjs';
import { scanTree } from './gen-skills-repo.mjs';
import { loadTemplatesData, templatePaths } from './lib/templates.mjs';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const temps = [];
function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-templates-repo-'));
  temps.push(dir);
  return dir;
}
after(() => {
  for (const dir of temps) fs.rmSync(dir, { recursive: true, force: true });
});

function write(root, rel, content, mode) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  if (mode) fs.chmodSync(file, mode);
}

const git = (dir, ...args) =>
  execFileSync('git', ['-c', 'init.defaultBranch=main', '-C', dir, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const TAGS = {
  form: { label: 'Form', description: 'A form', color: '#0c8599' },
};

const ENTRY = {
  slug: 'login',
  title: 'Login',
  description: 'A sign-in page.',
  author: { name: 'Aldi Duzha', url: 'https://github.com/aldi' },
  source: 'https://github.com/aldi/bulma-login-template',
  sourceSha: 'abcdef1'.padEnd(40, '0'),
  demo: 'https://aldi.github.io/bulma-login-template/',
  license: 'MIT',
  copyright: 'Copyright (c) 2018 Aldi Duzha',
  tags: ['form'],
};

/** A data module of the shape docs/src/data/templates.js has. */
function dataModule(templates, { link = true } = {}) {
  return [
    `export const Tags = ${JSON.stringify(TAGS)};`,
    "export const TEMPLATES_REPO = 'allxsmith/bestax-templates';",
    link
      ? 'export const stackblitzUrl = slug => `https://stackblitz.com/github/${TEMPLATES_REPO}/tree/main/${slug}?file=src/App.tsx`;'
      : '',
    `export const templates = ${JSON.stringify(templates)};`,
    'export const sortedTemplates = templates;',
    '',
  ].join('\n');
}

/**
 * A git repository laid out like this one: the data file, LICENSE and
 * NOTICE, templates/'s own CLAUDE.md and eslint.config.js, and a tracked
 * folder per entry unless `folders` is false. Everything is staged, which
 * is all `git ls-files` reads.
 */
function fixtureRepo({ templates = [ENTRY], folders = true, data } = {}) {
  const repo = tempDir();
  git(repo, 'init', '--quiet');
  write(repo, DATA_FILE, data ?? dataModule(templates));
  write(repo, 'LICENSE', 'MIT License\n\nCopyright (c) Alex Smith\n');
  write(repo, 'NOTICE', 'This project uses Bulma.\n');
  write(repo, 'templates/CLAUDE.md', '# the porting guide\n');
  write(repo, 'templates/eslint.config.js', 'export default [];\n');
  if (folders) {
    for (const { slug } of templates) {
      write(repo, `templates/${slug}/package.json`, '{}\n');
      write(repo, `templates/${slug}/src/App.tsx`, 'export {};\n');
      write(repo, `templates/${slug}/.gitignore`, 'node_modules\n');
      write(repo, `templates/${slug}/bin/run.sh`, '#!/bin/sh\n', 0o755);
    }
  }
  git(repo, 'add', '--all');
  return repo;
}

const failureOf = async promise => {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  assert.fail('expected the generator to refuse');
};

// --- the real tree ---------------------------------------------------------

test('the real repository generates a tree', async () => {
  const out = path.join(tempDir(), 'tree');
  const files = await generate(out);
  for (const file of ['README.md', ...COPIED]) assert.ok(files.includes(file));
  for (const file of COPIED) {
    assert.ok(
      fs
        .readFileSync(path.join(out, file))
        .equals(fs.readFileSync(path.join(REPO, file))),
      `${file} is the monorepo's`
    );
  }
  const { slugs } = templatePaths(
    git(REPO, 'ls-files', '--', 'templates').split('\n').filter(Boolean)
  );
  for (const file of files) {
    assert.ok(
      ['README.md', ...COPIED].includes(file) ||
        slugs.includes(file.split('/')[0]),
      `${file} is a root file or a template's`
    );
  }
  assert.ok(!files.includes('CLAUDE.md'));
  assert.ok(!files.includes('eslint.config.js'));
});

test('the page and the README open a template at the same mirror URL', async () => {
  const data = await loadTemplatesData(REPO);
  assert.equal(
    data.stackblitzUrl('login'),
    `https://stackblitz.com/github/${data.TEMPLATES_REPO}/tree/main/login?file=src/App.tsx`
  );
  assert.match(data.TEMPLATES_REPO, /^allxsmith\/[a-z-]+$/);
  assert.match(
    renderReadme([ENTRY], data.stackblitzUrl),
    new RegExp(
      `\\(https://stackblitz\\.com/github/${data.TEMPLATES_REPO}/tree/main/login`
    )
  );
});

/** Whether `glob`, with `*` stopping at a slash, covers repo path `file`. */
function covers(glob, file) {
  const re = glob
    .split('**')
    .map(part =>
      part
        .split('*')
        .map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
        .join('[^/]*')
    )
    .join('.*');
  return new RegExp(`^${re}$`).test(file);
}

test('PUBLISH_PATHS covers the inputs and every module the generator imports', () => {
  const needed = new Set(['templates/', ...INPUT_FILES]);
  const queue = ['scripts/gen-templates-repo.mjs'];
  const text = rel => fs.readFileSync(path.join(REPO, rel), 'utf8');
  while (queue.length) {
    const file = queue.pop();
    if (needed.has(file)) continue;
    needed.add(file);
    for (const [, spec] of text(file).matchAll(
      /^\s*(?:import|export)[^'"]*?from\s+'(\.[^']+)'/gm
    )) {
      queue.push(
        path.posix.normalize(path.posix.join(path.posix.dirname(file), spec))
      );
    }
  }
  for (const file of needed) {
    assert.ok(
      PUBLISH_PATHS.some(p => covers(p, file)),
      `PUBLISH_PATHS misses ${file}`
    );
  }
  for (const p of PUBLISH_PATHS) {
    if (p === '.github/workflows/templates-publish.yml') continue;
    assert.ok(
      [...needed].some(file => covers(p, file)),
      `PUBLISH_PATHS names ${p}, which the generator does not need`
    );
  }
  assert.ok(covers('templates/**', 'templates/login/src/App.tsx'));
  assert.ok(!covers('scripts/*.mjs', 'scripts/lib/skills.mjs'));
});

// --- fixtures ----------------------------------------------------------------

test('the tree holds each template as tracked, and the root files', async () => {
  const repo = fixtureRepo();
  // Untracked, so none of it ships: a local install, a build, a stray note.
  write(repo, 'templates/login/node_modules/x/index.js', 'x\n');
  write(repo, 'templates/login/dist/index.html', '<p>\n');
  write(repo, 'templates/login/NOTES.md', 'scratch\n');
  const out = path.join(tempDir(), 'tree');
  const files = await generate(out, repo);
  assert.deepEqual(files, [
    'LICENSE',
    'NOTICE',
    'README.md',
    'login/.gitignore',
    'login/bin/run.sh',
    'login/package.json',
    'login/src/App.tsx',
  ]);
  const modes = Object.fromEntries(
    (await scanTree(out)).map(e => [e.path, e.mode])
  );
  assert.equal(modes['login/bin/run.sh'], 0o755);
  assert.equal(modes['login/package.json'], 0o644);
  const readme = fs.readFileSync(path.join(out, 'README.md'), 'utf8');
  assert.match(readme, /awesome-bulma-templates/);
  assert.match(readme, /### Login/);
  assert.match(
    readme,
    /\[Open in StackBlitz\]\(https:\/\/stackblitz\.com\/github\/allxsmith\/bestax-templates\/tree\/main\/login\?file=src\/App\.tsx\)/
  );
  assert.match(
    readme,
    /Ported from \[aldi\/bulma-login-template\]\(https:\/\/github\.com\/aldi\/bulma-login-template\) by \[Aldi Duzha\]\(https:\/\/github\.com\/aldi\), at commit `abcdef1`/
  );
  assert.match(readme, /Open issues and pull\s+requests in allxsmith\/bestax/);
  assert.match(
    readme,
    /- License: MIT, the upstream's, in \[LICENSE\]\(login\/LICENSE\)/
  );
});

test("the README names each template's own license and claims none for all", async () => {
  const apache = {
    ...ENTRY,
    slug: 'hotel',
    title: 'Hotel',
    license: 'Apache-2.0',
  };
  const repo = fixtureRepo({ templates: [ENTRY, apache] });
  const out = path.join(tempDir(), 'tree');
  await generate(out, repo);
  const readme = fs.readFileSync(path.join(out, 'README.md'), 'utf8');
  assert.match(
    readme,
    /### Hotel[\s\S]*- License: Apache-2\.0, the upstream's/
  );
  assert.match(readme, /### Login[\s\S]*- License: MIT, the upstream's/);
  const license = readme.slice(readme.indexOf('## License'));
  assert.doesNotMatch(license, /\bMIT\b|Apache/, 'no blanket license claim');
  assert.match(license, /under its upstream's license/);
});

test('an entry whose license is not on the allowlist is refused', async () => {
  const repo = fixtureRepo({ templates: [{ ...ENTRY, license: 'GPL-3.0' }] });
  const err = await failureOf(generate(path.join(tempDir(), 't'), repo));
  assert.match(err.message, /`license` must be the upstream's SPDX identifier/);
});

test('a repository with no template still makes a valid tree', async () => {
  const repo = fixtureRepo({ templates: [] });
  const out = path.join(tempDir(), 'tree');
  assert.deepEqual(await generate(out, repo), [
    'LICENSE',
    'NOTICE',
    'README.md',
  ]);
  assert.match(
    fs.readFileSync(path.join(out, 'README.md'), 'utf8'),
    /## Templates\n\nNone yet\./
  );
});

test('a folder and its entry come together, or the run refuses', async () => {
  const noEntry = fixtureRepo({ templates: [] });
  write(noEntry, 'templates/stray/index.html', '<p>\n');
  git(noEntry, 'add', '--all');
  const a = await failureOf(generate(path.join(tempDir(), 't'), noEntry));
  assert.match(a.message, /"templates\/stray\/" has no entry/);
  assert.match(a.message, /pnpm test:scripts/);

  const noFolder = fixtureRepo({ folders: false });
  const b = await failureOf(generate(path.join(tempDir(), 't'), noFolder));
  assert.match(
    b.message,
    /"login" has no tracked files under "templates\/login\/"/
  );
});

test('an entry is held to the docs schema', async () => {
  const repo = fixtureRepo({ templates: [{ ...ENTRY, sourceSha: 'abc' }] });
  const err = await failureOf(generate(path.join(tempDir(), 't'), repo));
  assert.match(err.message, /sourceSha/);
});

test('the data must say where a template opens', async () => {
  const repo = fixtureRepo({ data: dataModule([ENTRY], { link: false }) });
  const err = await failureOf(generate(path.join(tempDir(), 't'), repo));
  assert.match(err.message, /exports no stackblitzUrl/);
  const broken = fixtureRepo({ data: 'export const = ;\n' });
  const bad = await failureOf(generate(path.join(tempDir(), 't'), broken));
  assert.match(bad.message, /could not be read/);
});

test('creditedTemplates names a data file with no list', () => {
  assert.throws(
    () => creditedTemplates({ stackblitzUrl: () => '' }, []),
    /exports no sortedTemplates array/
  );
});

test('a tracked link, a deleted file and an untracked input are refused', async () => {
  const repo = fixtureRepo();
  fs.symlinkSync('/etc/hosts', path.join(repo, 'templates/login/hosts'));
  git(repo, 'add', '--all');
  fs.rmSync(path.join(repo, 'templates/login/package.json'));
  // A tracked file replaced by a directory on disk.
  fs.rmSync(path.join(repo, 'templates/login/src/App.tsx'));
  fs.mkdirSync(path.join(repo, 'templates/login/src/App.tsx'));
  git(repo, 'rm', '--cached', '--quiet', 'NOTICE');
  const err = await failureOf(generate(path.join(tempDir(), 't'), repo));
  assert.match(err.message, /"login\/hosts": is a symbolic link/);
  assert.match(err.message, /"login\/package\.json": is tracked but missing/);
  assert.match(err.message, /"login\/src\/App\.tsx": is not a regular file/);
  assert.match(err.message, /NOTICE: is not tracked by git/);
});

test('a data file that is not a regular file is refused', async () => {
  const repo = fixtureRepo();
  fs.rmSync(path.join(repo, DATA_FILE));
  fs.mkdirSync(path.join(repo, DATA_FILE));
  const err = await failureOf(generate(path.join(tempDir(), 't'), repo));
  assert.match(err.message, /templates\.js: is not a regular file/);
});

test('a run outside a git checkout is refused', async () => {
  const repo = tempDir();
  write(repo, DATA_FILE, dataModule([]));
  const err = await failureOf(generate(path.join(tempDir(), 't'), repo));
  assert.match(err.message, /requires a git checkout/);
});

test('treeProblems refuses a .git part, a link, a bad name and a case clash', () => {
  const root = ['README.md', ...COPIED].map(p => ({ path: p, symlink: false }));
  assert.deepEqual(treeProblems(root), []);
  const problems = treeProblems([
    ...root,
    { path: 'login/.GIT/config', symlink: false },
    { path: 'login/link', symlink: true },
    { path: 'login/con.txt', symlink: false },
    { path: 'Login/x', symlink: false },
  ]);
  assert.ok(problems.some(p => /\.git part/.test(p)));
  assert.ok(problems.some(p => /symbolic link/.test(p)));
  assert.ok(problems.some(p => /Windows device name/.test(p)));
  assert.ok(problems.some(p => /only by case/.test(p)));
  assert.deepEqual(treeProblems([]), [
    'README.md: missing.',
    'LICENSE: missing.',
    'NOTICE: missing.',
  ]);
});

test('buildTree sorts the tree and writes the README 0644', () => {
  const tree = buildTree({
    readme: '# x\n',
    copied: [{ path: 'LICENSE', content: Buffer.from('l'), mode: 0o644 }],
    templateFiles: [{ path: 'a/b', content: Buffer.from('b'), mode: 0o755 }],
  });
  assert.deepEqual([...tree.keys()], ['LICENSE', 'README.md', 'a/b']);
  assert.equal(tree.get('README.md').mode, 0o644);
});

test('repoLabel shortens a GitHub URL and keeps any other', () => {
  assert.equal(repoLabel('https://github.com/aldi/x/'), 'aldi/x');
  assert.equal(repoLabel('https://gitlab.com/a/b'), 'https://gitlab.com/a/b');
});

/** Captures what main writes. */
function io() {
  const out = { stdout: '', stderr: '' };
  return {
    out,
    stdout: { write: s => (out.stdout += s) },
    stderr: { write: s => (out.stderr += s) },
  };
}

test('main takes one directory, and reports success and failure', async () => {
  for (const argv of [[], ['a', 'b'], ['--force']]) {
    const sink = io();
    assert.equal(await main(argv, sink), 2, String(argv));
    assert.match(sink.out.stderr, /^usage: /);
  }
  const ok = io();
  const out = path.join(tempDir(), 'tree');
  assert.equal(await main([out], ok, { repo: fixtureRepo() }), 0);
  assert.match(ok.out.stdout, /Wrote the bestax-templates tree/);
  assert.match(ok.out.stdout, /login\/src\/App\.tsx/);

  // Not empty now, so a second run refuses rather than mix trees.
  const again = io();
  assert.equal(await main([out], again, { repo: fixtureRepo() }), 1);
  assert.match(again.out.stderr, /failed its checks:\n {2}.*is not empty/);

  const refused = io();
  const repo = fixtureRepo({ folders: false });
  assert.equal(await main([path.join(tempDir(), 't')], refused, { repo }), 1);
  assert.match(refused.out.stderr, /has no tracked files/);
});
