/**
 * Guards on gen-skills-repo.mjs, the generator behind
 * .github/workflows/skills-publish.yml.
 *
 * That workflow runs only on main, so these tests are what a PR gets. The
 * first group runs the generator on the real tree, so a skill change that
 * would break the published plugin, or fail Anthropic's directory checks,
 * fails the PR instead of the publish run. The rest hold each rule with a
 * fixture, including a small git repository for the tracked-files reader.
 *
 * `.mjs` and `node --test` rather than jest, matching the other root scripts.
 */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AGENT_MCP_SCHEMA,
  AGENT_PLUGIN_SCHEMA,
  COPIED,
  FILES,
  LIMITS,
  MCP_PACKAGE,
  TEMPLATE,
  TreeError,
  buildTree,
  exactNpmSpec,
  generate,
  launcherViolations,
  main,
  mcpPin,
  nameProblem,
  parseTemplate,
  planMismatch,
  readSources,
  readmeWordCount,
  renderAgentManifest,
  renderClaudeManifest,
  renderMarketplace,
  renderMcpConfig,
  scanTree,
  trackedFiles,
  treeViolations,
  writeTree,
} from './gen-skills-repo.mjs';
import { readSkillNames } from './lib/skills.mjs';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoText = rel => fs.readFileSync(path.join(REPO, rel), 'utf8');

const temps = [];
function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-skills-repo-'));
  temps.push(dir);
  return dir;
}
after(() => {
  for (const dir of temps) fs.rmSync(dir, { recursive: true, force: true });
});

const readJson = (dir, rel) =>
  JSON.parse(fs.readFileSync(path.join(dir, rel), 'utf8'));

// --- the real tree ------------------------------------------------------------

test('generates the bestax-skills tree from the real repo', async () => {
  const out = path.join(tempDir(), 'bestax-skills');
  const files = await generate(out);

  for (const file of [...Object.values(FILES), ...COPIED]) {
    assert.ok(files.includes(file), `${file} is generated`);
  }
  for (const name of await readSkillNames(path.join(REPO, 'skills'))) {
    assert.ok(files.includes(`skills/${name}/SKILL.md`), `${name} ships`);
  }
  assert.ok(!files.includes('skills/README.md'));
  assert.ok(!files.includes('skills/CLAUDE.md'));
  assert.deepEqual(files, [...files].sort());

  // Exactly the tracked files of the skill directories, nothing else.
  const tracked = execFileSync(
    'git',
    ['-C', REPO, 'ls-files', '--', 'skills/'],
    {
      encoding: 'utf8',
    }
  )
    .split('\n')
    .filter(p => /^skills\/[^/]+\//.test(p));
  assert.deepEqual(
    files.filter(f => f.startsWith('skills/')),
    tracked.sort()
  );
  assert.deepEqual(
    (await scanTree(out)).map(e => e.path),
    files,
    'nothing on disk beyond the file list'
  );
  for (const file of files.filter(f => f.startsWith('skills/'))) {
    assert.ok(
      fs
        .readFileSync(path.join(out, file))
        .equals(fs.readFileSync(path.join(REPO, file))),
      `${file} is copied byte for byte`
    );
  }
  assert.equal(
    fs.readFileSync(path.join(out, 'README.md'), 'utf8'),
    repoText(TEMPLATE.readme)
  );
  assert.equal(
    fs.readFileSync(path.join(out, 'LICENSE'), 'utf8'),
    repoText('LICENSE')
  );
});

test('the real manifests pin the exact bestax-mcp version and name the plugin', async () => {
  const out = path.join(tempDir(), 'bestax-skills');
  await generate(out);
  const { version } = JSON.parse(repoText(MCP_PACKAGE));
  const template = JSON.parse(repoText(TEMPLATE.manifest));
  const pin = `bestax-mcp@${version}`;

  const claude = readJson(out, FILES.claude);
  assert.deepEqual(claude.mcpServers, {
    bestax: { command: 'npx', args: ['-y', pin] },
  });
  assert.equal('version' in claude, false, 'updates follow commits');
  assert.equal(claude.name, 'bestax');

  const agent = readJson(out, FILES.agent);
  assert.equal(agent.$schema, AGENT_PLUGIN_SCHEMA);
  assert.equal(agent.version, template.plugin.version);
  assert.equal(agent.mcpServers, './mcp.json');

  assert.deepEqual(readJson(out, FILES.mcp), {
    $schema: AGENT_MCP_SCHEMA,
    mcpServers: {
      bestax: { type: 'stdio', command: 'npx', args: ['-y', pin] },
    },
  });

  const marketplace = readJson(out, FILES.marketplace);
  assert.equal(marketplace.name, 'bestax');
  assert.equal(marketplace.owner.name, 'Alex Smith');
  assert.deepEqual(marketplace.plugins, [{ name: 'bestax', source: './' }]);
});

test('the real README clears the directory word count', () => {
  assert.ok(readmeWordCount(repoText(TEMPLATE.readme)) >= LIMITS.readmeWords);
});

// --- the CLI --------------------------------------------------------------------

function capture() {
  const out = { stdout: '', stderr: '' };
  return {
    out,
    io: {
      stdout: { write: s => (out.stdout += s) },
      stderr: { write: s => (out.stderr += s) },
    },
  };
}

test('main prints usage without exactly one directory', async () => {
  for (const argv of [[], ['a', 'b'], ['--help']]) {
    const { out, io } = capture();
    assert.equal(await main(argv, io), 2);
    assert.match(out.stderr, /usage:/);
  }
});

test('main writes the tree and lists it', async () => {
  const { out, io } = capture();
  const dir = path.join(tempDir(), 'out');
  assert.equal(await main([dir], io), 0);
  assert.match(out.stdout, /\.claude-plugin\/plugin\.json/);
  assert.match(out.stdout, /skills\/bestax-form\/SKILL\.md/);
});

test('main reports a refusal and exits 1', async () => {
  const dir = tempDir();
  fs.writeFileSync(path.join(dir, 'stale.txt'), 'x');
  const { out, io } = capture();
  assert.equal(await main([dir], io), 1);
  assert.match(out.stderr, /failed its checks/);
  assert.match(out.stderr, /is not empty/);
});

// --- the template -----------------------------------------------------------------

const TEMPLATE_TEXT = repoText(TEMPLATE.manifest);
const realTemplate = () => JSON.parse(TEMPLATE_TEXT);
const problemsOf = fn => {
  try {
    fn();
  } catch (err) {
    return err instanceof TreeError ? err.problems : [err.message];
  }
  return [];
};

test('the real template parses', () => {
  assert.deepEqual(parseTemplate(TEMPLATE_TEXT), realTemplate());
});

test('a template that is not a JSON object is refused', () => {
  assert.match(problemsOf(() => parseTemplate('{'))[0], /not valid JSON/);
  assert.match(problemsOf(() => parseTemplate('[]'))[0], /not a JSON object/);
});

test('an unknown, missing or misplaced template key is refused', () => {
  const t = realTemplate();
  t.extra = {};
  t.plugin.icon = './logo.png';
  delete t.claude.supportUrl;
  const problems = problemsOf(() => parseTemplate(JSON.stringify(t)));
  assert.ok(problems.some(p => /section "extra"/.test(p)));
  assert.ok(problems.some(p => /plugin\.icon is not placed/.test(p)));
  assert.ok(problems.some(p => /claude\.supportUrl is missing/.test(p)));

  const u = realTemplate();
  u.marketplace = 'bestax';
  assert.ok(
    problemsOf(() => parseTemplate(JSON.stringify(u))).some(p =>
      /"marketplace" must be an object/.test(p)
    )
  );
});

test('template values of the wrong shape are refused', () => {
  const t = realTemplate();
  t.plugin.name = 'Bestax!';
  t.plugin.version = '^1.0.0';
  t.plugin.description = ' ';
  t.plugin.author = 'Alex';
  t.plugin.homepage = 'http://bestax.io';
  t.plugin.keywords = ['ok', 3];
  t.claude.privacyPolicyUrl = 42;
  t.marketplace.name = 'a..b';
  t.marketplace.owner = { url: 'https://example.com' };
  const problems = problemsOf(() => parseTemplate(JSON.stringify(t)));
  for (const want of [
    /plugin\.name "Bestax!"/,
    /plugin\.version must be a semantic version/,
    /plugin\.description must be a non-empty string/,
    /plugin\.author must be an object/,
    /plugin\.homepage must be an https/,
    /plugin\.keywords must be an array of strings/,
    /claude\.privacyPolicyUrl must be an https/,
    /marketplace\.name "a\.\.b"/,
    /marketplace\.owner\.name must be a non-empty string/,
  ]) {
    assert.ok(
      problems.some(p => want.test(p)),
      `${want} in ${problems.join(' | ')}`
    );
  }
});

// --- the MCP pin -----------------------------------------------------------------

test('the pin is the exact version in bestax-mcp/package.json', () => {
  assert.equal(
    mcpPin('{"name":"bestax-mcp","version":"1.14.0"}'),
    'bestax-mcp@1.14.0'
  );
  assert.equal(
    mcpPin('{"name":"bestax-mcp","version":"2.0.0-rc.1"}'),
    'bestax-mcp@2.0.0-rc.1'
  );
  assert.equal(
    mcpPin(repoText(MCP_PACKAGE)),
    `bestax-mcp@${JSON.parse(repoText(MCP_PACKAGE)).version}`
  );
});

test('a range, a missing version or another package is no pin', () => {
  assert.throws(
    () => mcpPin('{"name":"bestax-mcp","version":"^1.14.0"}'),
    /not an exact/
  );
  assert.throws(() => mcpPin('{"name":"bestax-mcp"}'), /not an exact/);
  assert.throws(
    () => mcpPin('{"name":"other","version":"1.0.0"}'),
    /not "bestax-mcp"/
  );
  assert.throws(() => mcpPin('nope'), /not valid JSON/);
});

// --- the renderers ---------------------------------------------------------------

test('each manifest takes its fields from the template', () => {
  const t = realTemplate();
  const pin = 'bestax-mcp@9.9.9';
  assert.deepEqual(renderMarketplace(t), {
    name: t.marketplace.name,
    description: t.marketplace.description,
    owner: t.marketplace.owner,
    plugins: [{ name: t.plugin.name, source: './' }],
  });
  const claude = renderClaudeManifest(t, pin);
  assert.equal(claude.version, undefined);
  assert.equal(claude.privacyPolicyUrl, t.claude.privacyPolicyUrl);
  assert.equal(claude.supportUrl, t.claude.supportUrl);
  assert.deepEqual(claude.mcpServers.bestax.args, ['-y', pin]);
  const agent = renderAgentManifest(t);
  assert.equal(agent.version, t.plugin.version);
  assert.equal(
    agent.privacyPolicyUrl,
    undefined,
    'Claude-only fields stay out'
  );
  assert.equal(renderMcpConfig(pin).mcpServers.bestax.type, 'stdio');
});

// --- the rules, on fixtures -------------------------------------------------------

const README = Buffer.from(
  'The bestax plugin gives coding agents the bestax Agent Skills and the ' +
    'bestax-mcp server. This text is long enough to clear the word count ' +
    'that the plugin directory asks of every README, which is forty words ' +
    'outside code blocks, so this sentence keeps going for a while longer.\n'
);

function fixtureSources(overrides = {}) {
  return {
    template: realTemplate(),
    readme: README,
    pin: 'bestax-mcp@1.2.3',
    copied: [
      ['LICENSE', Buffer.from('MIT License\n')],
      ['NOTICE', Buffer.from('Notice\n')],
    ],
    skillFiles: [
      {
        path: 'skills/demo/SKILL.md',
        content: Buffer.from('---\nname: demo\n---\n'),
      },
      { path: 'skills/demo/references/a.md', content: Buffer.from('# A\n') },
    ],
    problems: [],
    ...overrides,
  };
}

const entriesOf = tree =>
  [...tree].map(([p, content]) => ({ path: p, content, symlink: false }));

function violationsWith(mutate) {
  const tree = buildTree(fixtureSources());
  mutate(tree);
  return treeViolations(entriesOf(tree));
}

const has = (violations, re) =>
  assert.ok(
    violations.some(v => re.test(v)),
    `${re} in ${violations.join(' | ')}`
  );

test('a well-formed fixture tree has no violations', () => {
  assert.deepEqual(treeViolations(entriesOf(buildTree(fixtureSources()))), []);
});

test('the file limit, README, LICENSE and a skill are required', () => {
  has(
    violationsWith(tree => {
      for (let i = 0; i < LIMITS.files; i++) {
        tree.set(`skills/demo/references/f${i}.md`, Buffer.from('x'));
      }
    }),
    /over the directory's limit/
  );
  has(
    violationsWith(tree => tree.delete('README.md')),
    /README\.md: missing/
  );
  has(
    violationsWith(tree => tree.set('README.md', Buffer.from('Too short.\n'))),
    /words outside code/
  );
  has(
    violationsWith(tree => tree.delete('LICENSE')),
    /LICENSE: missing/
  );
  has(
    violationsWith(tree => {
      tree.delete('skills/demo/SKILL.md');
    }),
    /holds no skills/
  );
});

test('system files, links, hidden files and package config are refused', () => {
  const v = treeViolations([
    ...entriesOf(buildTree(fixtureSources())),
    {
      path: 'skills/demo/.DS_Store',
      content: Buffer.from('x'),
      symlink: false,
    },
    {
      path: 'skills/demo/Thumbs.db',
      content: Buffer.from('x'),
      symlink: false,
    },
    { path: '__MACOSX/a.md', content: Buffer.from('x'), symlink: false },
    { path: 'skills/demo/link.md', content: null, symlink: true },
    { path: 'skills/demo/.npmrc', content: Buffer.from('x'), symlink: false },
    { path: 'bunfig.toml', content: Buffer.from('x'), symlink: false },
    { path: 'package.json', content: Buffer.from('{}'), symlink: false },
    { path: '.gitattributes', content: Buffer.from('x'), symlink: false },
  ]);
  has(v, /skills\/demo\/\.DS_Store: is a macOS or Windows system file/);
  has(v, /Thumbs\.db: is a macOS or Windows system file/);
  has(v, /__MACOSX\/a\.md: is a macOS or Windows system file/);
  has(v, /link\.md: is a symbolic link/);
  has(v, /\.npmrc: is package-manager configuration/);
  has(v, /bunfig\.toml: is package-manager configuration/);
  has(v, /package\.json: at the plugin root/);
  has(v, /\.gitattributes: is hidden/);
});

test('names Windows or macOS refuse, and case-only twins, are refused', () => {
  const v = violationsWith(tree => {
    tree.set('skills/demo/a:b.md', Buffer.from('x'));
    tree.set('skills/demo/trailing.', Buffer.from('x'));
    tree.set('skills/demo/con.md', Buffer.from('x'));
    tree.set('skills/Demo/one.md', Buffer.from('x'));
    tree.set('skills/Demo/two.md', Buffer.from('x'));
  });
  has(v, /a:b\.md: has a character/);
  has(v, /trailing\.: ends in a dot/);
  has(v, /con\.md: is a Windows device name/);
  has(v, /skills\/Demo: differs from skills\/demo only by case/);
  assert.equal(
    v.filter(x => /only by case/.test(x)).length,
    1,
    'a directory twin is reported once'
  );
});

test('nameProblem covers each rule', () => {
  assert.equal(nameProblem('SKILL.md'), null);
  assert.equal(nameProblem('README.md'), null);
  assert.match(nameProblem(''), /empty/);
  assert.match(nameProblem('a\\b'), /character/);
  assert.match(nameProblem('a\u0001b'), /character/);
  assert.match(nameProblem('space '), /dot or a space/);
  assert.match(nameProblem('LPT1'), /device/);
  assert.match(nameProblem('aux.txt'), /device/);
  assert.equal(nameProblem('auxiliary.md'), null);
  assert.match(nameProblem('x'.repeat(256)), /255 bytes/);
});

test('sizes and binary content are held to the directory limits', () => {
  const v = violationsWith(tree => {
    tree.set('skills/demo/big.md', Buffer.alloc(LIMITS.textBytes, 'a'));
    tree.set('skills/demo/huge.png', Buffer.alloc(LIMITS.anyBytes, 1));
    tree.set('skills/demo/ok.png', Buffer.alloc(LIMITS.textBytes + 1, 1));
    tree.set('skills/demo/bin.dat', Buffer.from([0x66, 0x00, 0x67]));
    tree.set('skills/demo/latin1.md', Buffer.from([0xe9]));
  });
  has(v, /big\.md: is \d+ bytes, at or over the 256 KiB limit/);
  has(v, /huge\.png: is \d+ bytes, at or over the 5 MiB limit/);
  assert.ok(!v.some(x => /ok\.png/.test(x)), 'an image may pass 256 KiB');
  has(v, /bin\.dat: is not UTF-8 text/);
  has(v, /latin1\.md: is not UTF-8 text/);
});

test('broken or unpinned manifests are refused', () => {
  has(
    violationsWith(tree => tree.delete(FILES.claude)),
    /\.claude-plugin\/plugin\.json: missing/
  );
  has(
    violationsWith(tree => tree.set(FILES.agent, Buffer.from('{'))),
    /plugin\.json: is not valid JSON/
  );
  has(
    violationsWith(tree =>
      tree.set(
        FILES.claude,
        Buffer.from(JSON.stringify({ name: 'Bad Name', mcpServers: {} }))
      )
    ),
    /name "Bad Name" does not match/
  );
  has(
    violationsWith(tree =>
      tree.set(
        FILES.mcp,
        Buffer.from(JSON.stringify(renderMcpConfig('bestax-mcp@1')))
      )
    ),
    /mcp\.json: mcpServers\.bestax runs npx bestax-mcp@1, which is not pinned/
  );
  has(
    violationsWith(tree => tree.delete(FILES.mcp)),
    /mcpServers names \.\/mcp\.json, which is not in the tree/
  );
  has(
    violationsWith(tree =>
      tree.set(
        FILES.marketplace,
        Buffer.from(
          JSON.stringify({ plugins: [{ name: 'bestax', source: './other' }] })
        )
      )
    ),
    /must list exactly the one plugin/
  );
});

test('exactNpmSpec takes only an exact version', () => {
  assert.ok(exactNpmSpec('bestax-mcp@1.14.0'));
  assert.ok(exactNpmSpec('@scope/pkg@1.0.0-rc.1'));
  for (const spec of [
    'bestax-mcp',
    'bestax-mcp@1',
    'bestax-mcp@^1.0.0',
    'bestax-mcp@latest',
    '@scope/pkg',
  ]) {
    assert.equal(exactNpmSpec(spec), false, spec);
  }
});

test('launcherViolations reads npx and refuses launchers it cannot read', () => {
  assert.deepEqual(
    launcherViolations('f', {
      ok: { command: 'npx', args: ['-y', 'bestax-mcp@1.2.3'] },
      path: { command: '/usr/local/bin/npx', args: ['--yes', 'a@1.0.0'] },
      local: { command: 'node', args: ['server.js'] },
    }),
    []
  );
  const v = launcherViolations('f', {
    none: { command: 'npx', args: ['-y'] },
    latest: { command: 'npx', args: ['bestax-mcp@latest'] },
    flag: { command: 'npx', args: ['-p', 'a@1.0.0', 'a'] },
    noargs: { command: 'npx' },
    bun: { command: 'bunx', args: ['a@1.0.0'] },
    broken: 'npx',
  });
  has(v, /none runs npx \(no package\)/);
  has(v, /latest runs npx bestax-mcp@latest/);
  has(v, /flag passes npx a package flag/);
  has(v, /noargs runs npx \(no package\)/);
  has(v, /bun runs bunx, a package launcher this check cannot read/);
  has(v, /broken has no command/);
  assert.deepEqual(launcherViolations('f', []), [
    'f: mcpServers is not an object.',
  ]);
});

test('readmeWordCount skips code, comments and link targets', () => {
  assert.equal(readmeWordCount('one two three'), 3);
  assert.equal(
    readmeWordCount('one\n\n```bash\nnot counted here\n```\n\ntwo'),
    2
  );
  assert.equal(readmeWordCount('one\n~~~\nskip\n~~~\n'), 1);
  assert.equal(readmeWordCount('one `inline code` two'), 2);
  assert.equal(readmeWordCount('one <!-- hidden words --> two'), 2);
  assert.equal(
    readmeWordCount(
      '[the docs](https://bestax.io/docs/a-b) and https://x.io/y'
    ),
    3
  );
  assert.equal(readmeWordCount("it's well-known"), 2);
  assert.equal(readmeWordCount('one\n```\nunclosed fence words'), 1);
});

// --- reading and writing ----------------------------------------------------------

const git = (dir, ...args) =>
  execFileSync('git', ['-c', 'init.defaultBranch=main', '-C', dir, ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

function write(root, rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

/** A minimal repo with the generator's inputs, staged in git. */
function fixtureRepo() {
  const root = tempDir();
  write(root, TEMPLATE.manifest, TEMPLATE_TEXT);
  write(root, TEMPLATE.readme, README);
  write(root, MCP_PACKAGE, '{"name":"bestax-mcp","version":"1.2.3"}');
  write(root, 'LICENSE', 'MIT License\n');
  write(root, 'NOTICE', 'Notice\n');
  write(root, 'skills/README.md', '# monorepo only\n');
  write(root, 'skills/demo/SKILL.md', '---\nname: demo\n---\n');
  write(root, 'skills/demo/references/a.md', '# A\n');
  git(root, 'init', '-q');
  return root;
}

test('readSources copies tracked skill files only', async () => {
  const root = fixtureRepo();
  write(root, 'skills/demo/untracked.md', 'not vetted\n');
  git(
    root,
    'add',
    'plugin',
    'bestax-mcp',
    'LICENSE',
    'NOTICE',
    'skills/README.md',
    'skills/demo/SKILL.md',
    'skills/demo/references'
  );
  const sources = await readSources(root);
  assert.deepEqual(
    sources.skillFiles.map(f => f.path),
    ['skills/demo/SKILL.md', 'skills/demo/references/a.md']
  );
  assert.equal(sources.pin, 'bestax-mcp@1.2.3');
  assert.deepEqual(sources.problems, []);
  assert.deepEqual(
    sources.copied.map(([p]) => p),
    COPIED
  );

  const out = path.join(tempDir(), 'out');
  const files = await generate(out, root);
  assert.ok(!files.includes('skills/demo/untracked.md'));
  assert.ok(!files.includes('skills/README.md'));
});

test('a tracked hidden file or symbolic link in a skill stops the run', async () => {
  const root = fixtureRepo();
  write(root, 'skills/demo/.eslintrc', '{}');
  fs.symlinkSync('references/a.md', path.join(root, 'skills/demo/link.md'));
  git(root, 'add', '-A');
  const sources = await readSources(root);
  assert.deepEqual(sources.problems, [
    'skills/demo/.eslintrc: is hidden, and the plugin ships no hidden files.',
    'skills/demo/link.md: is a symbolic link. Commit a regular file.',
  ]);
  await assert.rejects(generate(path.join(tempDir(), 'out'), root), err => {
    assert.ok(err instanceof TreeError);
    assert.equal(err.problems.length, 2);
    return true;
  });
});

test('a repo without skills is refused', async () => {
  const root = fixtureRepo();
  fs.rmSync(path.join(root, 'skills/demo'), { recursive: true });
  await assert.rejects(readSources(root), /holds no skills/);
});

test('trackedFiles needs the top of a git checkout', () => {
  const plain = tempDir();
  assert.throws(
    () =>
      trackedFiles(plain, 'skills', () => {
        throw new Error('fatal: not a git repository');
      }),
    /not the top of a git checkout/
  );
  const other = tempDir();
  assert.throws(
    () => trackedFiles(plain, 'skills', () => `${other}\n`),
    /not the top of a git checkout/
  );
});

test('writeTree refuses a directory that is not empty, or not a directory', async () => {
  const dir = tempDir();
  fs.writeFileSync(path.join(dir, 'stale'), 'x');
  await assert.rejects(writeTree(dir, new Map()), /is not empty/);
  await assert.rejects(
    writeTree(path.join(dir, 'stale'), new Map()),
    /ENOTDIR/
  );
});

test('scanTree reports a symbolic link without following it', async () => {
  const dir = tempDir();
  write(dir, 'a/b.md', 'b');
  fs.symlinkSync('a', path.join(dir, 'link'));
  assert.deepEqual(
    (await scanTree(dir)).map(({ path: p, symlink }) => [p, symlink]),
    [
      ['a/b.md', false],
      ['link', true],
    ]
  );
});

test('planMismatch names files missing, changed or unplanned on disk', () => {
  const tree = new Map([
    ['a', Buffer.from('a')],
    ['b', Buffer.from('b')],
  ]);
  assert.deepEqual(
    planMismatch(tree, [
      { path: 'b', content: Buffer.from('B') },
      { path: 'c', content: Buffer.from('c') },
    ]),
    [
      'a: was planned but is not on disk.',
      'b: on disk differs from the plan.',
      'c: is on disk but was not planned.',
    ]
  );
});
