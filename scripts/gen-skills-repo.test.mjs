/**
 * Guards on gen-skills-repo.mjs, the generator behind
 * .github/workflows/skills-publish.yml.
 *
 * That workflow runs only on main, so these tests are what a PR gets. The
 * first group runs the generator on the real tree, so a skill change that
 * would break the published plugin, or fail Anthropic's directory checks,
 * fails the PR instead of the publish run. The rest hold each rule with a
 * fixture, including small git repositories for the input gate. The shared
 * tracked-file helpers themselves are tested in skills-roster.test.mjs, next
 * to the rest of scripts/lib/skills.mjs.
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
  INPUT_FILES,
  LIMITS,
  MCP_DIR,
  README_REGIONS,
  SKILL_INDEX,
  TEMPLATE,
  TreeError,
  buildTree,
  checkTemplate,
  exactNpmSpec,
  generate,
  inputProblems,
  launcherViolations,
  main,
  mcpLaunch,
  nameProblem,
  planMismatch,
  readSources,
  readmeWordCount,
  renderAgentManifest,
  renderClaudeManifest,
  renderMarketplace,
  renderMcpConfig,
  renderMcpServer,
  renderReadme,
  renderSkillList,
  scanTree,
  skillIndex,
  skillSummary,
  treeViolations,
  writeTree,
} from './gen-skills-repo.mjs';
import { yamlGet, yamlItems, yamlScalar } from './check-conformance.mjs';
import {
  SKILL_REFUSAL,
  isSkillRefusal,
  readSkillNames,
} from './lib/skills.mjs';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoText = rel => fs.readFileSync(path.join(REPO, rel), 'utf8');
const repoJson = rel => JSON.parse(repoText(rel));

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

/** A first sentence long enough for firstSentence to cut after it. */
const DEMO_SUMMARY = 'Build a demo page with every bestax layout piece.';

const REAL_PIN = `${repoJson(`${MCP_DIR}/server.json`).packages[0].identifier}@${
  repoJson(`${MCP_DIR}/package.json`).version
}`;

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
    { encoding: 'utf8' }
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
    fs.readFileSync(path.join(out, 'LICENSE'), 'utf8'),
    repoText('LICENSE')
  );
});

test('the real manifests start the server server.json describes, at the release version', async () => {
  const out = path.join(tempDir(), 'bestax-skills');
  await generate(out);
  const template = repoJson(TEMPLATE.manifest);

  const claude = readJson(out, FILES.claude);
  assert.deepEqual(claude.mcpServers, {
    bestax: { command: 'npx', args: ['-y', REAL_PIN] },
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
      bestax: { type: 'stdio', command: 'npx', args: ['-y', REAL_PIN] },
    },
  });

  const marketplace = readJson(out, FILES.marketplace);
  assert.equal(marketplace.name, 'bestax');
  assert.equal(marketplace.owner.name, 'Alex Smith');
  assert.deepEqual(marketplace.plugins, [{ name: 'bestax', source: './' }]);
});

test('the real README lists every indexed skill and the launch, with no markers', async () => {
  const out = path.join(tempDir(), 'bestax-skills');
  await generate(out);
  const readme = fs.readFileSync(path.join(out, 'README.md'), 'utf8');
  assert.ok(!readme.includes('bestax:generated'));
  assert.ok(readmeWordCount(readme) >= LIMITS.readmeWords);
  for (const skill of repoJson(SKILL_INDEX).skills) {
    assert.ok(
      readme.includes(
        `- **${skill.name}**: ${skillSummary(skill.description)}\n`
      ),
      `${skill.name} is listed`
    );
  }
  assert.ok(readme.includes(`npx -y ${REAL_PIN}\n`));
  const pkg = repoJson(`${MCP_DIR}/server.json`).packages[0];
  for (const variable of pkg.environmentVariables ?? []) {
    assert.ok(readme.includes(`\`${variable.name}\``), variable.name);
  }
  // The hand-written text around the regions is kept as written.
  const template = repoText(TEMPLATE.readme);
  assert.equal(readme.split('\n')[0], template.split('\n')[0]);
  assert.ok(readme.includes('## Privacy Policy'));
});

test('the workflow runs on every input and every module the generator imports', () => {
  const lines = repoText('.github/workflows/skills-publish.yml').split('\n');
  const filters = yamlItems(
    yamlGet(lines, 'on', 'push', 'paths')?.lines ?? []
  ).map(item =>
    yamlScalar({
      value: item
        .filter(line => !line.trim().startsWith('#'))
        .join('\n')
        .trim(),
      lines: [],
      indent: 0,
    })
  );
  assert.ok(filters.length, 'the push trigger has a paths filter');

  // Every local module reachable from the generator, by its imports.
  const needed = new Set(['skills/', ...INPUT_FILES]);
  const queue = ['scripts/gen-skills-repo.mjs'];
  while (queue.length) {
    const file = queue.pop();
    if (needed.has(file)) continue;
    needed.add(file);
    for (const [, spec] of repoText(file).matchAll(
      /^\s*(?:import|export)[^'"]*?from\s+'(\.[^']+)'/gm
    )) {
      queue.push(
        path.posix.normalize(path.posix.join(path.posix.dirname(file), spec))
      );
    }
  }
  const covers = (filter, file) =>
    filter.endsWith('/**')
      ? file.startsWith(filter.slice(0, -2))
      : filter === file;
  for (const file of needed) {
    assert.ok(
      filters.some(f => covers(f, file)),
      `the paths filter in skills-publish.yml misses ${file}`
    );
  }
  for (const filter of filters) {
    if (filter === '.github/workflows/skills-publish.yml') continue;
    assert.ok(
      [...needed].some(file => covers(filter, file)),
      `the paths filter names ${filter}, which the generator does not need`
    );
  }
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

test('main reports a refusal on one escaped line and exits 1', async () => {
  const dir = path.join(tempDir(), 'stale\n::error::forged');
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'stale.txt'), 'x');
  const { out, io } = capture();
  assert.equal(await main([dir], io), 1);
  assert.match(out.stderr, /failed its checks/);
  assert.match(out.stderr, /is not empty/);
  assert.ok(
    !out.stderr.split('\n').some(line => line.startsWith('::')),
    'no line of the output can start a workflow command'
  );
});

test('main prints an unexpected error with its stack, still on one line', async () => {
  const file = path.join(tempDir(), 'a-file');
  fs.writeFileSync(file, 'x');
  const { out, io } = capture();
  assert.equal(await main([path.join(file, 'out')], io), 1);
  assert.match(out.stderr, /ENOTDIR/);
  assert.match(out.stderr, /\\n\s+at /, 'the stack, escaped by forLog');
  assert.equal(out.stderr.trimEnd().split('\n').length, 2);
});

// --- the template -----------------------------------------------------------------

const realTemplate = () => repoJson(TEMPLATE.manifest);
const problemsOf = fn => {
  try {
    fn();
  } catch (err) {
    return err instanceof TreeError ? err.problems : [err.message];
  }
  return [];
};

test('the real template passes', () => {
  assert.deepEqual(checkTemplate(realTemplate()), realTemplate());
});

test('a template that is not a JSON object is refused', () => {
  assert.match(problemsOf(() => checkTemplate([]))[0], /not a JSON object/);
  assert.match(problemsOf(() => checkTemplate(null))[0], /not a JSON object/);
});

test('an unknown, missing or misplaced template key is refused', () => {
  const t = realTemplate();
  t.extra = {};
  t.plugin.icon = './logo.png';
  delete t.claude.supportUrl;
  const problems = problemsOf(() => checkTemplate(t));
  assert.ok(problems.some(p => /section "extra"/.test(p)));
  assert.ok(problems.some(p => /plugin\."icon" is not placed/.test(p)));
  assert.ok(problems.some(p => /claude\.supportUrl is missing/.test(p)));

  const u = realTemplate();
  u.marketplace = 'bestax';
  assert.ok(
    problemsOf(() => checkTemplate(u)).some(p =>
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
  const problems = problemsOf(() => checkTemplate(t));
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

// --- the MCP launch, from server.json ---------------------------------------------

const realServer = () => repoJson(`${MCP_DIR}/server.json`);
const realManifest = () => repoJson(`${MCP_DIR}/package.json`);

test('the launch is server.json’s package at package.json’s version', () => {
  const launch = mcpLaunch(realServer(), realManifest());
  assert.equal(launch.pin, REAL_PIN);
  assert.deepEqual(
    launch.env,
    realServer().packages[0].environmentVariables ?? []
  );
  const server = realServer();
  server.packages[0].runtimeHint = 'npx';
  delete server.packages[0].environmentVariables;
  assert.deepEqual(
    mcpLaunch(server, { ...realManifest(), version: '2.0.0-rc.1' }),
    { pin: `${server.packages[0].identifier}@2.0.0-rc.1`, env: [] }
  );
});

test('a launch the plugin would not reproduce is refused', () => {
  const withPkg = patch => {
    const server = realServer();
    Object.assign(server.packages[0], patch);
    return server;
  };
  assert.throws(
    () =>
      mcpLaunch(
        withPkg({ runtimeHint: 'bunx', packageArguments: [] }),
        realManifest()
      ),
    /sets runtimeHint, packageArguments/
  );
  assert.throws(
    () =>
      mcpLaunch(
        withPkg({
          environmentVariables: [{ name: 'lower', description: 'x' }],
        }),
        realManifest()
      ),
    /environmentVariables must be a list/
  );
  assert.throws(
    () =>
      mcpLaunch(
        withPkg({
          environmentVariables: [
            { name: 'TOKEN', description: 'x', isRequired: true },
          ],
        }),
        realManifest()
      ),
    /TOKEN is required/
  );
  assert.throws(
    () => mcpLaunch(realServer(), { ...realManifest(), version: '1.14' }),
    /not a semver version/
  );
  assert.throws(
    () =>
      mcpLaunch(realServer(), {
        ...realManifest(),
        version: '1.0.0\n::error::x',
      }),
    /unexpected characters/
  );
});

test('renderMcpServer gives the command and each variable', () => {
  const body = renderMcpServer({
    pin: 'bestax-mcp@1.2.3',
    env: [
      { name: 'A_FLAG', description: 'Turn a thing off.', format: 'boolean' },
      { name: 'B_NAME', description: 'Name a thing ' },
    ],
  });
  assert.equal(
    body,
    [
      '',
      '```text',
      'npx -y bestax-mcp@1.2.3',
      '```',
      '',
      'The server reads these environment variables, all optional:',
      '',
      '- `A_FLAG` (boolean): Turn a thing off.',
      '- `B_NAME`: Name a thing.',
      '',
    ].join('\n')
  );
  assert.ok(!renderMcpServer({ pin: 'x@1.0.0', env: [] }).includes('reads'));
});

// --- the skill list, from bestax-mcp's index --------------------------------------

test('skillSummary keeps the first sentence and cuts its em dash clause', () => {
  assert.equal(
    skillSummary(
      'Build a custom component in the Bulma style. In an app, use it.'
    ),
    'Build a custom component in the Bulma style.'
  );
  assert.equal(
    skillSummary('Build forms with bestax \u2014 Field and Control. Use when.'),
    'Build forms with bestax.'
  );
  assert.equal(
    skillSummary('Migrate an app from an old library (bloomer 0.6). Run it.'),
    'Migrate an app from an old library (bloomer 0.6).'
  );
  assert.equal(skillSummary('  No period at all  '), 'No period at all.');
  assert.equal(skillSummary('Ends twice.. '), 'Ends twice.');
  // firstSentence keeps a first sentence under 40 characters whole, so an
  // early abbreviation cannot cut a summary short. The catalogs cut the same.
  assert.equal(skillSummary('Do a demo. More.'), 'Do a demo. More.');
  for (const skill of repoJson(SKILL_INDEX).skills) {
    const summary = skillSummary(skill.description);
    assert.ok(summary.length <= skill.description.length + 1, skill.name);
    assert.ok(!summary.includes('\u2014'), `${skill.name} has no em dash`);
  }
});

test('skillIndex holds the index to the skill directories', () => {
  const index = {
    skills: [
      { name: 'b-skill', dir: 'b-skill', description: 'B.' },
      { name: 'a-skill', dir: 'a-skill', description: 'A.' },
    ],
  };
  assert.deepEqual(
    skillIndex(index, ['b-skill', 'a-skill']).map(s => s.name),
    ['a-skill', 'b-skill']
  );
  assert.throws(() => skillIndex(index, ['a-skill']), /Run pnpm gen:mcp/);
  assert.throws(
    () => skillIndex(index, ['a-skill', 'b-skill', 'c-skill']),
    /lists "a-skill, b-skill", but skills\/ holds/
  );
  assert.throws(() => skillIndex({}, []), /needs a skills array/);
  assert.throws(
    () =>
      skillIndex({ skills: [{ name: 'x', dir: 'x', description: ' ' }] }, [
        'x',
      ]),
    /needs a skills array/
  );
  const real = repoJson(SKILL_INDEX);
  assert.equal(
    skillIndex(
      real,
      real.skills.map(s => s.dir)
    ).length,
    real.skills.length
  );
});

test('renderReadme fills both regions and strips every marker', () => {
  const src = [
    '# Title',
    '',
    `<!-- bestax:generated ${README_REGIONS.skills} -->`,
    'stale',
    `<!-- /bestax:generated ${README_REGIONS.skills} -->`,
    '',
    'Middle text.',
    '',
    `<!-- bestax:generated ${README_REGIONS.mcp} -->`,
    `<!-- /bestax:generated ${README_REGIONS.mcp} -->`,
    '',
  ].join('\n');
  const out = renderReadme(
    src,
    [{ name: 'demo', description: `${DEMO_SUMMARY} More.` }],
    { pin: 'demo@1.0.0', env: [] }
  );
  assert.equal(
    out,
    [
      '# Title',
      '',
      `- **demo**: ${DEMO_SUMMARY}`,
      '',
      'Middle text.',
      '',
      '```text',
      'npx -y demo@1.0.0',
      '```',
      '',
    ].join('\n')
  );
  assert.equal(
    renderSkillList([{ name: 'x', description: 'Y' }]),
    '\n- **x**: Y.\n'
  );
});

test('a README template without its regions is refused', () => {
  assert.throws(
    () => renderReadme('# Title\n', [], { pin: 'x@1.0.0', env: [] }),
    /no <!-- bestax:generated skills \/ mcp-server --> marker pair/
  );
  assert.throws(
    () =>
      renderReadme('<!-- bestax:generated skills -->\n', [], {
        pin: 'x@1.0.0',
        env: [],
      }),
    /never closed/
  );
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
    launch: { pin: 'bestax-mcp@1.2.3', env: [] },
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
    violationsWith(tree =>
      tree.set(
        'README.md',
        Buffer.concat([README, Buffer.from('<!-- bestax:generated x -->\n')])
      )
    ),
    /still carries a bestax:generated marker/
  );
  has(
    violationsWith(tree => tree.delete('LICENSE')),
    /LICENSE: missing/
  );
  has(
    violationsWith(tree => tree.delete('skills/demo/SKILL.md')),
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
  has(v, /"skills\/demo\/\.DS_Store": is a macOS or Windows system file/);
  has(v, /Thumbs\.db": is a macOS or Windows system file/);
  has(v, /"__MACOSX\/a\.md": is a macOS or Windows system file/);
  has(v, /link\.md": is a symbolic link/);
  has(v, /\.npmrc": is package-manager configuration/);
  has(v, /"bunfig\.toml": is package-manager configuration/);
  has(v, /"package\.json": at the plugin root/);
  has(v, /"\.gitattributes": is hidden/);
});

test('a path with a newline cannot start a line of a problem', () => {
  const evil = 'skills/demo/x\n::error::forged.md';
  const v = treeViolations([
    ...entriesOf(buildTree(fixtureSources())),
    { path: evil, content: Buffer.from('x'), symlink: false },
  ]);
  has(v, /has a character Windows or macOS refuses/);
  for (const problem of v) assert.ok(!problem.includes('\n'), problem);
  assert.ok(v.some(p => p.includes(JSON.stringify(evil))));
  for (const problem of planMismatch(new Map([[evil, Buffer.from('x')]]), [])) {
    assert.ok(!problem.includes('\n'), problem);
  }
});

test('names Windows or macOS refuse, and case-only twins, are refused', () => {
  const v = violationsWith(tree => {
    tree.set('skills/demo/a:b.md', Buffer.from('x'));
    tree.set('skills/demo/trailing.', Buffer.from('x'));
    tree.set('skills/demo/con.md', Buffer.from('x'));
    tree.set('skills/Demo/one.md', Buffer.from('x'));
    tree.set('skills/Demo/two.md', Buffer.from('x'));
  });
  has(v, /a:b\.md": has a character/);
  has(v, /trailing\.": ends in a dot/);
  has(v, /con\.md": is a Windows device name/);
  has(v, /"skills\/Demo": differs from "skills\/demo" only by case/);
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
  has(v, /big\.md": is \d+ bytes, at or over the 256 KiB limit/);
  has(v, /huge\.png": is \d+ bytes, at or over the 5 MiB limit/);
  assert.ok(!v.some(x => /ok\.png/.test(x)), 'an image may pass 256 KiB');
  has(v, /bin\.dat": is not UTF-8 text/);
  has(v, /latin1\.md": is not UTF-8 text/);
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
    violationsWith(tree => tree.set(FILES.agent, Buffer.from('[]'))),
    /plugin\.json: is not a JSON object/
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
    /mcp\.json: mcpServers\."bestax" runs npx "bestax-mcp@1", which is not pinned/
  );
  has(
    violationsWith(tree => tree.delete(FILES.mcp)),
    /mcpServers names "\.\/mcp\.json", which is not in the tree/
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
    // Off-registry specs also end in @<version>, and none is a registry pin.
    'github:someone/repo@1.0.0',
    'https://host/x.tgz@1.0.0',
    'file:../x@1.0.0',
    'git+ssh://git@github.com/a/b.git@1.0.0',
    'Bestax-MCP@1.0.0',
  ]) {
    assert.equal(exactNpmSpec(spec), false, spec);
  }
});

test('launcherViolations knows npx by its program name on any platform', () => {
  const unpinned = command =>
    launcherViolations('f', { s: { command, args: ['-y', 'bestax-mcp'] } });
  for (const command of [
    'npx',
    '/usr/local/bin/npx',
    'npx.cmd',
    'NPX.EXE',
    'C:\\Program Files\\nodejs\\npx.cmd',
  ]) {
    const found = unpinned(command);
    assert.equal(found.length, 1, command);
    assert.match(found[0], /is not pinned to an exact version/, command);
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
  has(v, /"none" runs npx \(no package\)/);
  has(v, /"latest" runs npx "bestax-mcp@latest"/);
  has(v, /"flag" passes npx a package flag/);
  has(v, /"noargs" runs npx \(no package\)/);
  has(v, /"bun" runs "bunx", a package launcher this check cannot read/);
  has(v, /"broken" has no command/);
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

const FIXTURE_README = `${README}
<!-- bestax:generated skills -->
<!-- /bestax:generated skills -->

<!-- bestax:generated mcp-server -->
<!-- /bestax:generated mcp-server -->
`;

/**
 * A minimal repo holding every input, with a server.json that differs from
 * the real one only in its package name. Staged in git unless `git` is false.
 */
function fixtureRepo({ init = true } = {}) {
  const root = tempDir();
  const server = realServer();
  server.name = 'io.github.example/demo-mcp';
  server.packages[0].identifier = 'demo-mcp';
  write(root, TEMPLATE.manifest, repoText(TEMPLATE.manifest));
  write(root, TEMPLATE.readme, FIXTURE_README);
  write(
    root,
    `${MCP_DIR}/package.json`,
    JSON.stringify({
      name: 'demo-mcp',
      version: '1.2.3',
      mcpName: 'io.github.example/demo-mcp',
    })
  );
  write(root, `${MCP_DIR}/server.json`, JSON.stringify(server));
  write(
    root,
    SKILL_INDEX,
    JSON.stringify({
      skills: [
        { name: 'demo', dir: 'demo', description: `${DEMO_SUMMARY} More.` },
      ],
    })
  );
  write(root, 'LICENSE', 'MIT License\n');
  write(root, 'NOTICE', 'Notice\n');
  write(root, 'skills/README.md', '# monorepo only\n');
  write(root, 'skills/demo/SKILL.md', '---\nname: demo\n---\n');
  write(root, 'skills/demo/references/a.md', '# A\n');
  if (init) {
    git(root, 'init', '-q');
    git(root, 'add', '-A');
  }
  return root;
}

test('readSources builds the launch and README from the fixture inputs', async () => {
  const root = fixtureRepo();
  const sources = await readSources(root);
  assert.deepEqual(
    sources.skillFiles.map(f => f.path),
    ['skills/demo/SKILL.md', 'skills/demo/references/a.md']
  );
  assert.equal(sources.launch.pin, 'demo-mcp@1.2.3');
  assert.deepEqual(
    sources.copied.map(([p]) => p),
    COPIED
  );
  const readme = sources.readme.toString('utf8');
  assert.ok(readme.includes(`- **demo**: ${DEMO_SUMMARY}\n`));
  assert.ok(readme.includes('npx -y demo-mcp@1.2.3\n'));
  assert.ok(readme.includes('BESTAX_MCP_NO_VERSION_CHECK'));

  const files = await generate(path.join(tempDir(), 'out'), root);
  assert.ok(!files.includes('skills/README.md'));
});

test('an untracked skill file stops the run, as it stops the syncs', async () => {
  const root = fixtureRepo();
  write(root, 'skills/demo/untracked.md', 'not vetted\n');
  write(root, 'skills/demo/.DS_Store', 'finder\n');
  await assert.rejects(readSources(root), err => {
    assert.ok(isSkillRefusal(err));
    assert.equal(
      err.message,
      'refusing to publish untracked file(s) under skills/: ' +
        'demo/untracked.md. `git add` them to vet them, or remove them.'
    );
    return true;
  });
});

test('a symbolic link in a skill stops the run, as it stops the syncs', async () => {
  const root = fixtureRepo();
  fs.symlinkSync('references/a.md', path.join(root, 'skills/demo/link.md'));
  git(root, 'add', '-A');
  await assert.rejects(readSources(root), err => {
    assert.ok(isSkillRefusal(err));
    assert.match(err.message, /skills\/demo\/link\.md is a symbolic link/);
    return true;
  });
});

test('a tracked hidden file in a skill fails the directory checks', async () => {
  const root = fixtureRepo();
  write(root, 'skills/demo/.eslintrc', '{}');
  git(root, 'add', '-A');
  const sources = await readSources(root);
  assert.ok(sources.skillFiles.some(f => f.path === 'skills/demo/.eslintrc'));
  await assert.rejects(generate(path.join(tempDir(), 'out'), root), err => {
    assert.ok(err instanceof TreeError);
    assert.equal(err.code, SKILL_REFUSAL);
    assert.deepEqual(err.problems, [
      '"skills/demo/.eslintrc": is hidden, and the plugin ships no hidden files.',
    ]);
    return true;
  });
});

test('every input must be a tracked regular file', async () => {
  const root = fixtureRepo();
  fs.rmSync(path.join(root, 'LICENSE'));
  fs.symlinkSync('NOTICE', path.join(root, 'LICENSE'));
  fs.rmSync(path.join(root, SKILL_INDEX));
  fs.mkdirSync(path.join(root, SKILL_INDEX));
  git(root, 'rm', '-q', '--cached', `${MCP_DIR}/server.json`);
  fs.rmSync(path.join(root, TEMPLATE.manifest));
  await assert.rejects(readSources(root), err => {
    assert.ok(err instanceof TreeError);
    assert.deepEqual(err.problems, [
      `"${TEMPLATE.manifest}": is missing.`,
      `"${MCP_DIR}/server.json": is not tracked by git. \`git add\` it to ` +
        'vet it, as the skill syncs require.',
      `"${SKILL_INDEX}": is not a regular file.`,
      '"LICENSE": is a symbolic link. Commit a regular file.',
    ]);
    return true;
  });
  assert.deepEqual(await inputProblems(fixtureRepo(), null), []);
});

test('without git, the tree is read from disk the way the syncs read it', async () => {
  const root = fixtureRepo({ init: false });
  write(root, 'skills/demo/.DS_Store', 'finder\n');
  write(root, 'skills/demo/extra.md', '# on disk\n');
  const sources = await readSources(root);
  assert.deepEqual(
    sources.skillFiles.map(f => f.path),
    [
      'skills/demo/SKILL.md',
      'skills/demo/extra.md',
      'skills/demo/references/a.md',
    ]
  );
  fs.symlinkSync('extra.md', path.join(root, 'skills/demo/link.md'));
  await assert.rejects(readSources(root), /link\.md is a symbolic link/);
});

test('a server.json that stops describing an npm stdio package is refused', async () => {
  const root = fixtureRepo();
  const server = JSON.parse(
    fs.readFileSync(path.join(root, MCP_DIR, 'server.json'), 'utf8')
  );
  server.packages[0].transport = { type: 'streamable-http' };
  write(root, `${MCP_DIR}/server.json`, JSON.stringify(server));
  await assert.rejects(
    readSources(root),
    /server\.json no longer gives the plugin an npm package to start over stdio: .*transport\.type must be stdio/
  );
});

test('an input that is not valid JSON is refused, naming the file', async () => {
  const root = fixtureRepo();
  write(root, TEMPLATE.manifest, '{ not json');
  await assert.rejects(readSources(root), err => {
    assert.ok(isSkillRefusal(err));
    assert.match(err.message, /plugin\/manifest\.json is not valid JSON/);
    return true;
  });
});

test('a stale skill index or a repo without skills is refused', async () => {
  const stale = fixtureRepo();
  write(stale, SKILL_INDEX, JSON.stringify({ skills: [] }));
  await assert.rejects(readSources(stale), /Run pnpm gen:mcp/);
  const empty = fixtureRepo();
  fs.rmSync(path.join(empty, 'skills/demo'), { recursive: true });
  await assert.rejects(readSources(empty), /holds no skills/);
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
      '"a": was planned but is not on disk.',
      '"b": on disk differs from the plan.',
      '"c": is on disk but was not planned.',
    ]
  );
});
