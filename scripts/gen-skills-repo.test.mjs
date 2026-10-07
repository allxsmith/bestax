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
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { crc32, inflateSync } from 'node:zlib';
import {
  AGENT_MCP_SCHEMA,
  AGENT_PLUGIN_SCHEMA,
  CONTENT_PATHS,
  COPIED,
  FILES,
  ICON_LIMITS,
  INPUT_FILES,
  LIMITS,
  MCP_DIR,
  OUTPUT_FORMAT,
  PUBLISH_PATHS,
  README_REGIONS,
  REQUIRE_CHECKOUT,
  REQUIRE_PUBLISHED,
  SKILL_INDEX,
  SOURCE_REPOSITORY,
  TEMPLATE,
  TreeError,
  assertPublished,
  buildTree,
  checkTemplate,
  exactNpmSpec,
  fileMode,
  generate,
  iconViolations,
  inputCommitCount,
  inputProblems,
  launcherViolations,
  logoViolations,
  main,
  mcpLaunch,
  nameProblem,
  planEntries,
  planMismatch,
  pluginVersion,
  pngSize,
  readSources,
  readmeWordCount,
  renderAgentManifest,
  renderClaudeManifest,
  renderCursorManifest,
  renderGeminiExtension,
  renderMarketplace,
  renderMcpConfig,
  renderMcpServer,
  renderReadme,
  renderSkillList,
  scanTree,
  securityViolations,
  skillIndex,
  skillSummary,
  treeViolations,
  writeTree,
} from './gen-skills-repo.mjs';
import {
  yamlGet,
  yamlItems,
  yamlMap,
  yamlScalar,
} from './check-conformance.mjs';
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

/**
 * The commit count every run on the real repo is given, so its version is
 * the same on any clone, shallow ones included. inputCommitCount itself is
 * tested on fixture repositories below.
 */
const COMMITS = 42;
const counted = { inputCommits: COMMITS };

// --- PNG fixtures ---------------------------------------------------------------

/**
 * The chunks of a valid PNG of `width` by `height` px, every pixel black, as
 * [type, data] pairs. The pixels are 1-bit grey in stored deflate blocks,
 * written out here rather than by zlib, so the bytes are the same on any
 * Node, which the output snapshot needs.
 */
function pngChunks(width, height) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 1; // bit depth 1, colour type 0 (grey), the rest 0
  // Each row is a filter byte and the row's bits, all 0.
  const raw = Buffer.alloc((Math.ceil(width / 8) + 1) * height);
  const zlibStream = [Buffer.from([0x78, 0x01])];
  for (let at = 0; at < raw.length; at += 0xffff) {
    const part = raw.subarray(at, at + 0xffff);
    const head = Buffer.alloc(5);
    head[0] = at + 0xffff >= raw.length ? 1 : 0;
    head.writeUInt16LE(part.length, 1);
    head.writeUInt16LE(~part.length & 0xffff, 3);
    zlibStream.push(head, part);
  }
  // Adler-32 of all-zero bytes: a stays 1 and b counts them.
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE((raw.length % 65521) * 0x10000 + 1);
  zlibStream.push(adler);
  return [
    ['IHDR', ihdr],
    ['IDAT', Buffer.concat(zlibStream)],
    ['IEND', Buffer.alloc(0)],
  ];
}

/** The bytes of a PNG made of `chunks`, each with its length and CRC. */
function pngBytes(chunks) {
  return Buffer.concat([
    Buffer.from('\x89PNG\r\n\x1a\n', 'latin1'),
    ...chunks.map(([type, data]) => {
      const head = Buffer.alloc(8);
      head.writeUInt32BE(data.length, 0);
      head.write(type, 4, 'latin1');
      const crc = Buffer.alloc(4);
      crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])));
      return Buffer.concat([head, data, crc]);
    }),
  ]);
}

const png = (width, height) => pngBytes(pngChunks(width, height));

/** The icon every fixture tree and fixture repository carries. */
const ICON = png(512, 512);

/**
 * The logo every fixture tree and fixture repository carries. Grey with no
 * alpha, so opaque, and a different size from the icon so the two cannot be
 * swapped unnoticed.
 */
const LOGO = png(600, 600);

/** The SECURITY.md every fixture tree and fixture repository carries. */
const SECURITY = 'Report privately to [us](mailto:security@example.com).\n';

/** `chunks` with the IHDR colour type set to `type`. */
function withColourType(chunks, type) {
  const [[, ihdr], ...rest] = chunks;
  const changed = Buffer.from(ihdr);
  changed[9] = type;
  if (type !== 0) changed[8] = 8; // a bit depth every colour type allows
  return [['IHDR', changed], ...rest];
}

// --- the real tree ------------------------------------------------------------

test('generates the bestax-skills tree from the real repo', async () => {
  const out = path.join(tempDir(), 'bestax-skills');
  const files = await generate(out, REPO, counted);

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
    assert.equal(
      fs.statSync(path.join(out, file)).mode & 0o777,
      fileMode(fs.statSync(path.join(REPO, file)).mode),
      `${file} keeps its executable bit`
    );
  }
  assert.equal(
    fs.readFileSync(path.join(out, 'LICENSE'), 'utf8'),
    repoText('LICENSE')
  );
  const icon = fs.readFileSync(path.join(out, FILES.icon));
  assert.ok(
    icon.equals(fs.readFileSync(path.join(REPO, TEMPLATE.icon))),
    'the icon is copied byte for byte'
  );
  assert.equal(fs.statSync(path.join(out, FILES.icon)).mode & 0o777, 0o644);
  assert.deepEqual(iconViolations(icon), []);
  const logo = fs.readFileSync(path.join(out, FILES.logo));
  assert.ok(
    logo.equals(fs.readFileSync(path.join(REPO, TEMPLATE.logo))),
    'the logo is copied byte for byte'
  );
  assert.equal(fs.statSync(path.join(out, FILES.logo)).mode & 0o777, 0o644);
  assert.deepEqual(logoViolations(logo), []);
  assert.equal(
    fs.readFileSync(path.join(out, FILES.security), 'utf8'),
    repoText(TEMPLATE.security),
    'SECURITY.md is copied as written'
  );
});

test('the real manifests start the server server.json describes, at the release version', async () => {
  const out = path.join(tempDir(), 'bestax-skills');
  await generate(out, REPO, counted);
  const template = repoJson(TEMPLATE.manifest);

  const version = `${template.plugin.version}.${COMMITS + OUTPUT_FORMAT}`;
  const claude = readJson(out, FILES.claude);
  assert.deepEqual(claude.mcpServers, {
    bestax: { command: 'npx', args: ['-y', REAL_PIN] },
  });
  assert.equal(claude.version, version, 'Claude Code sees each update');
  assert.equal(claude.icon, './.claude-plugin/icon.png');
  assert.ok(fs.existsSync(path.join(out, claude.icon)));
  assert.equal(claude.name, 'bestax');

  const agent = readJson(out, FILES.agent);
  assert.equal(agent.$schema, AGENT_PLUGIN_SCHEMA);
  assert.equal(agent.version, version, 'every manifest carries one version');
  assert.equal(agent.mcpServers, './mcp.json');

  const cursor = readJson(out, FILES.cursor);
  assert.equal(cursor.name, 'bestax');
  assert.equal(cursor.displayName, 'Bestax');
  assert.equal(cursor.version, version, 'every manifest carries one version');
  assert.equal(cursor.logo, 'assets/logo.png');
  assert.equal(cursor.mcpServers, './mcp.json');
  for (const ref of [cursor.logo, cursor.skills, cursor.mcpServers]) {
    assert.ok(fs.existsSync(path.join(out, ref)), ref);
  }

  assert.deepEqual(readJson(out, FILES.gemini), {
    name: 'bestax',
    version,
    description: template.plugin.description,
    mcpServers: { bestax: { command: 'npx', args: ['-y', REAL_PIN] } },
  });

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
  await generate(out, REPO, counted);
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

/**
 * Whether `glob`, a paths-filter or git glob, matches `file`: `**` takes
 * any run of characters and `*` any run without a slash.
 */
const covers = (glob, file) =>
  new RegExp(
    `^${glob
      .split('**')
      .map(part =>
        part
          .split('*')
          .map(text => text.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
          .join('[^/]*')
      )
      .join('.*')}$`
  ).test(file);

test('covers matches a glob the way the paths filter and git do', () => {
  assert.ok(covers('skills/**', 'skills/README.md'));
  assert.ok(covers('skills/*/**', 'skills/demo/SKILL.md'));
  assert.ok(covers('skills/*/**', 'skills/demo/references/a.md'));
  assert.ok(!covers('skills/*/**', 'skills/README.md'));
  assert.ok(covers('LICENSE', 'LICENSE'));
  assert.ok(!covers('LICENSE', 'LICENSES'));
  assert.ok(!covers('a.md', 'aXmd'));
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
  assert.deepEqual(
    [...filters].sort(),
    [...PUBLISH_PATHS].sort(),
    'the paths filter in skills-publish.yml and PUBLISH_PATHS differ'
  );

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
      `the paths filter names ${filter}, which the generator does not ` +
        `need. Drop it here and from PUBLISH_PATHS.`
    );
  }

  // CONTENT_PATHS is exactly what the tree is built from: the tracked files
  // inside the skill directories and INPUT_FILES. It names none of the code,
  // nor skills/README.md or skills/CLAUDE.md, which do not ship, so a commit
  // to one of those alone does not raise the version.
  const skills = execFileSync(
    'git',
    ['-C', REPO, 'ls-files', '--', 'skills/'],
    {
      encoding: 'utf8',
    }
  )
    .split('\n')
    .filter(Boolean);
  const inSkill = file => /^skills\/[^/]+\//.test(file);
  const content = [...skills.filter(inSkill), ...INPUT_FILES];
  const unshipped = skills.filter(file => !inSkill(file));
  assert.ok(unshipped.includes('skills/README.md'));
  for (const file of content) {
    assert.ok(
      CONTENT_PATHS.some(p => covers(p, file)),
      `CONTENT_PATHS misses ${file}, so the version would not count it`
    );
    // The version counts it, so a change to it must also start a publish.
    assert.ok(
      filters.some(p => covers(p, file)),
      `the paths filter misses ${file}`
    );
  }
  for (const file of unshipped) {
    assert.ok(
      !CONTENT_PATHS.some(p => covers(p, file)),
      `CONTENT_PATHS takes ${file}, which does not ship, so a commit to it ` +
        `alone would raise the version`
    );
  }
  for (const p of CONTENT_PATHS) {
    assert.ok(
      content.some(file => covers(p, file)),
      `CONTENT_PATHS names ${p}, which the tree is not built from. Drop ` +
        `it, and bump the minor in ${TEMPLATE.manifest}, as the commit ` +
        `count can fall.`
    );
  }
});

const WORKFLOW = '.github/workflows/skills-publish.yml';

/** Lines without YAML or shell comments, for matching what actually runs. */
const uncommented = lines =>
  lines.filter(line => !line.trim().startsWith('#')).join('\n');

/** An entry's scalar, with a folded (`>-`) one joined the way YAML folds it. */
const scalar = entry =>
  entry && /^>-?$/.test(entry.value)
    ? entry.lines
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .join(' ')
    : yamlScalar(entry);

/** skills-publish.yml's jobs by id, each with its keys and steps readable. */
function workflowJobs() {
  const lines = repoText(WORKFLOW).split('\n');
  const reader = entryLines => ({
    get: (...keys) => scalar(yamlGet(entryLines, ...keys)),
    code: uncommented(entryLines),
  });
  return new Map(
    [...yamlMap(yamlGet(lines, 'jobs')?.lines ?? [])].map(([id, job]) => [
      id,
      {
        ...reader(job.lines),
        steps: yamlItems(yamlGet(job.lines, 'steps')?.lines ?? []).map(reader),
      },
    ])
  );
}

test('only publish holds the deploy key, and it runs no repository code', () => {
  const jobs = workflowJobs();
  assert.deepEqual(
    [...jobs]
      .filter(([, job]) => job.get('environment') || /secrets\./.test(job.code))
      .map(([id]) => id),
    ['publish']
  );
  const publish = jobs.get('publish');
  assert.equal(publish.get('environment'), 'skills-publish');
  assert.deepEqual(
    publish.steps.filter(s => /secrets\./.test(s.code)).map(s => s.get('name')),
    ['Commit and push to allxsmith/bestax-skills'],
    'the key reaches the push step alone'
  );
  // No checkout, so no file of this repository is on its runner.
  assert.deepEqual(
    publish.steps.map(s => s.get('uses')?.split('@')[0]).filter(Boolean),
    ['step-security/harden-runner', 'actions/download-artifact']
  );
  for (const step of publish.steps) {
    assert.doesNotMatch(
      uncommented((step.get('run') ?? '').split('\n')),
      /\b(node|npm|npx|pnpm)\s|scripts\//,
      `${step.get('name')} runs repository code`
    );
  }
  const generate = jobs.get('generate');
  assert.ok(
    generate.steps.some(s =>
      s.get('uses')?.startsWith('actions/upload-artifact@')
    ),
    'generate hands the tree on as an artifact'
  );
});

test('a re-run of publish alone cannot find an earlier attempt’s tree', () => {
  const jobs = workflowJobs();
  const nameOf = (job, action) =>
    jobs
      .get(job)
      .steps.find(s => s.get('uses')?.startsWith(`${action}@`))
      .get('with', 'name');
  const uploaded = nameOf('generate', 'actions/upload-artifact');
  assert.equal(nameOf('publish', 'actions/download-artifact'), uploaded);
  assert.match(uploaded, /\$\{\{ github\.run_attempt \}\}/);
});

test('a run joins the shared concurrency group on the condition generate runs on', () => {
  const group = scalar(
    yamlGet(repoText(WORKFLOW).split('\n'), 'concurrency', 'group')
  );
  const shape =
    /^\$\{\{ (.+) && 'skills-publish' \|\| format\('skills-publish-\{0\}', github\.run_id\) \}\}$/;
  const [, joins] = group.match(shape) ?? [];
  assert.ok(joins, `the concurrency group keeps its shape: ${group}`);
  const jobs = workflowJobs();
  assert.equal(joins, jobs.get('generate').get('if'));
  // publish needs generate, so it skips when generate does.
  assert.equal(jobs.get('publish').get('needs'), 'generate');
  assert.equal(jobs.get('publish').get('if'), null);
});

/**
 * A ustar archive of `entries`, built here so a test can hold members that
 * tar would not write from a real tree, such as `../` names.
 */
function tarball(entries) {
  const blocks = [];
  for (const {
    name,
    type = '0',
    body = '',
    mode = 0o644,
    link = '',
  } of entries) {
    const data = Buffer.from(body);
    const header = Buffer.alloc(512);
    const put = (offset, size, text) => header.write(text, offset, size);
    put(0, 100, name);
    put(100, 8, `${mode.toString(8).padStart(7, '0')}\0`);
    put(108, 8, '0000000\0');
    put(116, 8, '0000000\0');
    put(124, 12, `${data.length.toString(8).padStart(11, '0')}\0`);
    put(136, 12, '00000000000\0');
    put(148, 8, ' '.repeat(8));
    put(156, 1, type);
    put(157, 100, link);
    put(257, 8, 'ustar\u000000');
    const sum = header.reduce((total, byte) => total + byte, 0);
    put(148, 8, `${sum.toString(8).padStart(6, '0')}\0 `);
    blocks.push(header, data, Buffer.alloc(-data.length & 511));
  }
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}

/** The `run:` script of the publish step named `name`. */
const publishScript = name =>
  workflowJobs()
    .get('publish')
    .steps.find(s => s.get('name') === name)
    .get('run');

/** Runs a step's script with RUNNER_TEMP at `work`, as the job would. */
const runStep = (script, work, env = {}) =>
  spawnSync('bash', ['-c', script], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, WORK: work, ...env },
  });

/**
 * Runs publish's unpack step on `archive` in a new RUNNER_TEMP, then its
 * check step if the unpack passed.
 */
function runUnpack(archive, env) {
  const work = tempDir();
  fs.mkdirSync(path.join(work, 'bestax-skills-artifact'));
  fs.writeFileSync(
    path.join(work, 'bestax-skills-artifact', 'bestax-skills-tree.tar'),
    archive
  );
  let run = runStep(publishScript('Unpack the tree'), work, env);
  if (run.status === 0) {
    run = runStep(publishScript('Check the unpacked tree'), work, env);
  }
  return { ...run, work, tree: path.join(work, 'bestax-skills-tree') };
}

test("publish's unpack step takes the packed tree with its modes", async () => {
  const out = path.join(tempDir(), 'tree');
  await generate(out, fixtureRepo(), counted);
  fs.chmodSync(path.join(out, 'skills/demo/references/a.md'), 0o755);
  // As generate's "Pack the tree" step does. GNU tar would reject the bogus
  // option if the step let TAR_OPTIONS through.
  const run = runUnpack(execFileSync('tar', ['-C', out, '-cf', '-', '.']), {
    TAR_OPTIONS: '--no-such-option',
  });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const packed = await scanTree(out);
  assert.deepEqual(await scanTree(run.tree), packed);
  assert.ok(packed.some(e => e.mode === 0o755));
  // The icon, the tree's one binary file, passes as a regular file.
  assert.ok(fs.readFileSync(path.join(run.tree, FILES.icon)).equals(ICON));
  assert.equal(
    fs.statSync(path.join(run.tree, FILES.icon)).mode & 0o777,
    0o644
  );
});

test("publish's unpack step refuses a link, a .git, an escape or a missing file", () => {
  const dir = name => ({ name, type: '5', mode: 0o755 });
  const good = [
    dir('./'),
    dir('./.claude-plugin/'),
    { name: './.claude-plugin/plugin.json', body: '{}\n' },
    { name: './.claude-plugin/icon.png', body: ICON },
    { name: './plugin.json', body: '{}\n' },
    { name: './mcp.json', body: '{}\n' },
    dir('./skills/'),
    dir('./skills/demo/'),
    { name: './skills/demo/SKILL.md', body: '# demo\n' },
  ];
  const sound = runUnpack(tarball(good));
  assert.equal(sound.status, 0, 'the fixture is sound');
  assert.ok(
    fs.readFileSync(path.join(sound.tree, FILES.icon)).equals(ICON),
    'the binary icon unpacks whole'
  );

  for (const [why, extra, said] of [
    [
      'a symbolic link',
      { name: './skills/demo/l', type: '2', link: '/etc' },
      /regular files and directories only/,
    ],
    [
      'a hard link',
      { name: './skills/demo/h', type: '1', link: './plugin.json' },
      /regular files and directories only/,
    ],
    ['a .git', { name: './.git/config', body: '[core]\n' }, /\.git part/],
    ['a .GIT', { name: './skills/.GIT/HEAD', body: 'x\n' }, /\.git part/],
    ['a ../ path', { name: './../escaped', body: 'x\n' }, /refused/],
    ['a bare ../ path', { name: '../escaped', body: 'x\n' }, /refused/],
    [
      'a nested ../',
      { name: './skills/../../escaped', body: 'x\n' },
      /refused/,
    ],
    ['an absolute path', { name: '/escaped', body: 'x\n' }, /refused/],
  ]) {
    const run = runUnpack(tarball([...good, extra]));
    assert.notEqual(run.status, 0, `${why} is refused`);
    assert.match(run.stdout, /::error::The tree from generate is refused/);
    assert.match(run.stdout, said, why);
    assert.ok(!fs.existsSync(run.tree), `${why}: nothing is unpacked`);
    assert.ok(!fs.existsSync(path.join(run.work, 'escaped')), why);
  }

  const missing = runUnpack(tarball(good.filter(e => e.name !== './mcp.json')));
  assert.notEqual(missing.status, 0);
  assert.match(missing.stdout, /refused: mcp\.json is missing/);
});

test("publish's check step refuses a link, a .git or a fifo already on disk", () => {
  // The listing check keeps these out of an unpacked tree, so this runs the
  // check step on its own, on trees made by hand.
  const check = publishScript('Check the unpacked tree');
  const unpacked = () => {
    const work = tempDir();
    const tree = path.join(work, 'bestax-skills-tree');
    for (const file of [
      '.claude-plugin/plugin.json',
      'plugin.json',
      'mcp.json',
      'skills/demo/SKILL.md',
    ]) {
      write(tree, file, '{}\n');
    }
    return { work, tree };
  };
  const sound = unpacked();
  assert.equal(runStep(check, sound.work).status, 0, 'the fixture is sound');

  for (const [why, tamper] of [
    ['a symbolic link', t => fs.symlinkSync('/etc', path.join(t, 'skills/l'))],
    ['a .git', t => fs.mkdirSync(path.join(t, 'skills/demo/.git'))],
    ['a .GIT file', t => write(t, '.GIT', 'x\n')],
    ['a fifo', t => execFileSync('mkfifo', [path.join(t, 'skills/demo/pipe')])],
  ]) {
    const { work, tree } = unpacked();
    tamper(tree);
    const run = runStep(check, work);
    assert.notEqual(run.status, 0, `${why} is refused`);
    assert.match(
      run.stdout,
      /refused: the unpacked tree holds a \.git, or an entry that is neither/,
      why
    );
  }
});

// --- the npm check ---------------------------------------------------------------

/**
 * Runs `fn` while globalThis.fetch answers from `respond`, and returns what
 * `fn` returned with every request it made.
 */
async function withFetch(respond, fn) {
  const real = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method });
    return respond(calls.length);
  };
  try {
    return { result: await fn(), calls };
  } finally {
    globalThis.fetch = real;
  }
}

const answer = status => ({
  status,
  statusText: status === 200 ? 'OK' : 'Not Found',
  headers: new Headers(),
  text: async () => '{}',
});
const NO_WAIT = { backoffMs: [0] };

test('assertPublished asks npm for the exact pin and takes a 200', async () => {
  const { calls } = await withFetch(
    () => answer(200),
    () => assertPublished('bestax-mcp@1.14.0', NO_WAIT)
  );
  assert.deepEqual(calls, [
    { url: 'https://registry.npmjs.org/bestax-mcp/1.14.0', method: 'GET' },
  ]);
  const scoped = await withFetch(
    () => answer(200),
    () => assertPublished('@scope/pkg@1.0.0-rc.1', NO_WAIT)
  );
  assert.equal(
    scoped.calls[0].url,
    'https://registry.npmjs.org/@scope%2fpkg/1.0.0-rc.1'
  );
});

test('assertPublished asks again after a 404, as a new release can lag', async () => {
  const { calls } = await withFetch(
    n => answer(n < 3 ? 404 : 200),
    () => assertPublished('bestax-mcp@1.14.0', NO_WAIT)
  );
  assert.equal(calls.length, 3);
});

test('assertPublished refuses a version npm keeps answering 404 for', async () => {
  await assert.rejects(
    withFetch(
      () => answer(404),
      () => assertPublished('bestax-mcp@9.9.9', NO_WAIT)
    ),
    err => {
      assert.ok(isSkillRefusal(err));
      assert.match(
        err.message,
        /^npm does not serve "bestax-mcp@9\.9\.9": https:\/\/registry\.npmjs\.org\/bestax-mcp\/9\.9\.9 answered "404 Not Found" on each of 5 asks\./
      );
      return true;
    }
  );
});

test('assertPublished refuses when npm cannot be reached', async () => {
  await assert.rejects(
    withFetch(
      () => {
        throw new TypeError('fetch failed', {
          cause: new Error('getaddrinfo ENOTFOUND registry.npmjs.org'),
        });
      },
      () => assertPublished('bestax-mcp@1.14.0', NO_WAIT)
    ),
    err => {
      assert.ok(isSkillRefusal(err));
      assert.match(
        err.message,
        /^could not ask npm whether it serves "bestax-mcp@1\.14\.0" \("getaddrinfo ENOTFOUND registry\.npmjs\.org"\), so nothing was published\./
      );
      return true;
    }
  );
});

test('main with --require-published writes the tree only when npm serves the pin', async () => {
  const served = capture();
  const dir = path.join(tempDir(), 'out');
  const ok = await withFetch(
    () => answer(200),
    () =>
      main([REQUIRE_PUBLISHED, REQUIRE_CHECKOUT, dir], served.io, {
        ...counted,
        fetchOptions: NO_WAIT,
      })
  );
  assert.equal(ok.result, 0, served.out.stderr);
  assert.equal(ok.calls[0].url.split('/').pop(), REAL_PIN.split('@').pop());

  const missing = capture();
  const none = path.join(tempDir(), 'out');
  const refused = await withFetch(
    () => answer(404),
    () =>
      main([REQUIRE_PUBLISHED, none], missing.io, {
        ...counted,
        fetchOptions: { ...NO_WAIT, attempts: 1 },
      })
  );
  assert.equal(refused.result, 1);
  assert.match(missing.out.stderr, /npm does not serve/);
  assert.ok(!fs.existsSync(none), 'nothing is written');
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

test('main prints usage without exactly one directory and known flags', async () => {
  for (const argv of [
    [],
    ['a', 'b'],
    ['--help'],
    [REQUIRE_CHECKOUT],
    ['--require-checkouts', 'a'],
    [REQUIRE_CHECKOUT, REQUIRE_CHECKOUT, 'a'],
  ]) {
    const { out, io } = capture();
    assert.equal(await main(argv, io, counted), 2, argv.join(' '));
    assert.match(
      out.stderr,
      /usage: .* \[--require-checkout\] \[--require-published\] <output/
    );
  }
});

test('main writes the tree and lists it', async () => {
  const { out, io } = capture();
  const dir = path.join(tempDir(), 'out');
  assert.equal(await main([dir], io, counted), 0);
  assert.match(out.stdout, /\.claude-plugin\/plugin\.json/);
  assert.match(out.stdout, /skills\/bestax-form\/SKILL\.md/);
  const flagged = path.join(tempDir(), 'out');
  assert.equal(
    await main([REQUIRE_CHECKOUT, flagged], capture().io, counted),
    0,
    'the real checkout passes the flag'
  );
});

test('main runs from a checkout reached through a symbolic link', () => {
  const linked = path.join(tempDir(), 'linked-checkout');
  fs.symlinkSync(REPO, linked);
  const run = spawnSync(
    process.execPath,
    [path.join(linked, 'scripts', 'gen-skills-repo.mjs')],
    { encoding: 'utf8' }
  );
  assert.equal(run.status, 2, 'main ran and printed its usage');
  assert.match(run.stderr, /usage:/);
});

test('main reports a refusal on one escaped line and exits 1', async () => {
  const dir = path.join(tempDir(), 'stale\n::error::forged');
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'stale.txt'), 'x');
  const { out, io } = capture();
  assert.equal(await main([dir], io, counted), 1);
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
  assert.equal(await main([path.join(file, 'out')], io, counted), 1);
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
  t.plugin.version = '1.0.0';
  t.plugin.description = ' ';
  t.plugin.author = 'Alex';
  t.plugin.homepage = 'http://bestax.io';
  t.plugin.keywords = ['ok', 3];
  t.claude.privacyPolicyUrl = 42;
  t.cursor.displayName = '';
  t.marketplace.name = 'a..b';
  t.marketplace.owner = { url: 'https://example.com' };
  const problems = problemsOf(() => checkTemplate(t));
  for (const want of [
    /plugin\.name "Bestax!"/,
    /plugin\.version must be MAJOR\.MINOR, such as 1\.0, not "1\.0\.0"/,
    /plugin\.description must be a non-empty string/,
    /plugin\.author must be an object/,
    /plugin\.homepage must be an https/,
    /plugin\.keywords must be an array of strings/,
    /claude\.privacyPolicyUrl must be an https/,
    /cursor\.displayName must be a non-empty string/,
    /marketplace\.name "a\.\.b"/,
    /marketplace\.owner\.name must be a non-empty string/,
  ]) {
    assert.ok(
      problems.some(p => want.test(p)),
      `${want} in ${problems.join(' | ')}`
    );
  }
});

test('plugin.version is MAJOR.MINOR, and the patch is the commit count', () => {
  for (const version of ['0.0', '1.0', '2.13']) {
    const t = realTemplate();
    t.plugin.version = version;
    assert.deepEqual(
      problemsOf(() => checkTemplate(t)),
      [],
      version
    );
  }
  for (const version of ['1', '1.0.0', '01.0', '1.00', 'v1.0', 1.0, '']) {
    const t = realTemplate();
    t.plugin.version = version;
    assert.match(
      problemsOf(() => checkTemplate(t)).join('\n'),
      /plugin\.version must be MAJOR\.MINOR/,
      String(version)
    );
  }
  assert.equal(pluginVersion('1.0', 325, 0), '1.0.325');
  assert.equal(pluginVersion('2.1', 0, 3), '2.1.3');
  assert.equal(pluginVersion('1.0', 325), `1.0.${325 + OUTPUT_FORMAT}`);
  for (const bad of [-1, 1.5, NaN, '3', null, undefined, 2 ** 53]) {
    assert.throws(
      () => pluginVersion('1.0', bad),
      err => {
        assert.ok(isSkillRefusal(err));
        assert.match(err.message, /must be a whole number/);
        return true;
      },
      String(bad)
    );
  }
});

// --- the output format ------------------------------------------------------------

/**
 * Fixed inputs for the output snapshot, written out here in full so the
 * snapshot moves only when the generator does, never with the live skills,
 * manifests or server.json. They reach most rendering paths: skills listed
 * out of name order, a summary cut at a spaced em dash, one whose first
 * sentence is too short to stand alone, one with a trailing space and
 * period, variables with and without a format, references, examples, an
 * executable file, both README regions, the icon, the logo and SECURITY.md.
 * A variable marked required has no output path, as mcpLaunch refuses it.
 */
const SNAPSHOT_INPUTS = {
  'plugin/manifest.json': `${JSON.stringify(
    {
      plugin: {
        name: 'snapshot',
        version: '1.0',
        description: 'A fixed plugin the output snapshot builds',
        author: { name: 'Snapshot Author', url: 'https://example.com/author' },
        homepage: 'https://example.com/plugin',
        repository: 'https://example.com/plugin.git',
        license: 'MIT',
        keywords: ['snapshot', 'fixture'],
      },
      claude: {
        privacyPolicyUrl: 'https://example.com/privacy',
        supportUrl: 'https://example.com/support',
      },
      cursor: { displayName: 'Snapshot' },
      marketplace: {
        name: 'snapshot',
        description: 'The snapshot marketplace',
        owner: { name: 'Snapshot Author', url: 'https://example.com/author' },
      },
    },
    null,
    2
  )}\n`,
  'plugin/README.md': `# Snapshot plugin

This plugin exists only so a test can build the same tree every time and
notice when the generator writes it differently. It has enough words to
clear the README length rule of the plugin directory, which counts the
prose outside code blocks and wants forty or more of them.

## Skills

<!-- bestax:generated skills -->
<!-- /bestax:generated skills -->

## MCP server

<!-- bestax:generated mcp-server -->
<!-- /bestax:generated mcp-server -->

## Privacy Policy

The snapshot plugin sends nothing anywhere.
`,
  'plugin/icon.png': png(512, 512),
  'plugin/logo.png': png(600, 600),
  'plugin/SECURITY.md':
    '# Security Policy\n\nEmail [us](mailto:security@example.com).\n',
  'bestax-mcp/package.json': `${JSON.stringify({
    name: 'snapshot-mcp',
    version: '2.3.4',
    mcpName: 'io.github.example/snapshot-mcp',
  })}\n`,
  'bestax-mcp/server.json': `${JSON.stringify({
    $schema:
      'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',
    name: 'io.github.example/snapshot-mcp',
    title: 'Snapshot',
    description: 'A fixed server the output snapshot launches',
    websiteUrl: 'https://example.com/mcp',
    repository: {
      url: 'https://github.com/example/snapshot',
      source: 'github',
    },
    version: '0.0.0-set-from-release-tag',
    packages: [
      {
        registryType: 'npm',
        identifier: 'snapshot-mcp',
        version: '0.0.0-set-from-release-tag',
        runtimeHint: 'npx',
        transport: { type: 'stdio' },
        environmentVariables: [
          {
            name: 'SNAPSHOT_FLAG',
            description: 'A flag the README lists. ',
            format: 'boolean',
            isRequired: false,
          },
          {
            name: 'SNAPSHOT_HOME',
            description: 'Where the server keeps its cache',
          },
        ],
      },
    ],
  })}\n`,
  'bestax-mcp/data/skills.json': `${JSON.stringify({
    skills: [
      {
        name: 'zeta-forms',
        dir: 'zeta-forms',
        description:
          'Build accessible forms with every field type, validation and help text — inputs, selects and checkboxes. Then more.',
      },
      {
        name: 'alpha-layout',
        dir: 'alpha-layout',
        description:
          'Short start. Then the rest of a description that runs on.',
      },
      {
        name: 'mid-theme',
        dir: 'mid-theme',
        description:
          'Theme an app with CSS variables, dark mode and brand colours . ',
      },
    ],
  })}\n`,
  LICENSE: 'MIT License\n\nCopyright (c) Snapshot Author\n',
  NOTICE: 'Snapshot notice\n',
  'skills/README.md': '# Not shipped\n',
  'skills/CLAUDE.md': '# Not shipped either\n',
  'skills/zeta-forms/SKILL.md':
    '---\nname: zeta-forms\ndescription: Build forms.\n---\n\n# Forms\n',
  'skills/zeta-forms/references/api.md': '# API\n\nThe form fields.\n',
  'skills/zeta-forms/references/deep/nested.md': '# Nested\n',
  'skills/alpha-layout/SKILL.md':
    '---\nname: alpha-layout\ndescription: Lay out a page.\n---\n\n# Layout\n',
  'skills/alpha-layout/examples/page.tsx':
    'export const Page = () => <main>Hi</main>;\n',
  'skills/mid-theme/SKILL.md':
    '---\nname: mid-theme\ndescription: Theme an app.\n---\n\n# Theme\n',
  'skills/mid-theme/scripts/check.sh': '#!/bin/sh\necho ok\n',
  'skills/mid-theme/references/css-variables.md': '# Variables\n',
};

/**
 * The sha256 of the tree built from SNAPSHOT_INPUTS, and the OUTPUT_FORMAT it
 * was recorded at. Change both together, and only when a change to the
 * generator alters its output on purpose.
 */
const OUTPUT_SNAPSHOT = {
  format: 5,
  sha256: '8ce20d0121bd264e046987a2f772215e81abafe880610c352a674b24afeff273',
};

/**
 * The sha256 of every path, mode and byte the generator plans from
 * SNAPSHOT_INPUTS. The version is held fixed, so neither the commit count
 * nor OUTPUT_FORMAT moves it.
 */
async function snapshotHash() {
  const root = tempDir();
  for (const [rel, text] of Object.entries(SNAPSHOT_INPUTS)) {
    write(root, rel, text);
  }
  fs.chmodSync(path.join(root, 'skills/mid-theme/scripts/check.sh'), 0o755);
  const sources = await readSources(root, { inputCommits: 0 });
  const tree = buildTree({ ...sources, version: '0.0.0' });
  assert.deepEqual(
    treeViolations(planEntries(tree)),
    [],
    'the inputs are sound'
  );
  const hash = createHash('sha256');
  for (const [rel, { content, mode }] of tree) {
    hash.update(`${rel}\0${mode.toString(8)}\0${content.length}\0`);
    hash.update(content);
  }
  return hash.digest('hex');
}

test('the output from fixed inputs matches the hash pinned at OUTPUT_FORMAT', async () => {
  const sha256 = await snapshotHash();
  const next = Math.max(OUTPUT_FORMAT, OUTPUT_SNAPSHOT.format + 1);
  assert.equal(
    sha256,
    OUTPUT_SNAPSHOT.sha256,
    `The generator's output changed for the same inputs, so the plugin ` +
      `would publish a different tree under the same version. Set ` +
      `OUTPUT_FORMAT in scripts/gen-skills-repo.mjs to ${next}, and ` +
      `OUTPUT_SNAPSHOT in this file to { format: ${next}, sha256: ` +
      `'${sha256}' }.`
  );
  assert.equal(
    OUTPUT_FORMAT,
    OUTPUT_SNAPSHOT.format,
    `OUTPUT_FORMAT is ${OUTPUT_FORMAT}, but the output is the one pinned at ` +
      `${OUTPUT_SNAPSHOT.format}. Raise it only with a change to the ` +
      `output, together with OUTPUT_SNAPSHOT, and never lower it.`
  );
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
});

test('a malformed README region is a refusal with the helper’s message', async () => {
  const open = id => `<!-- bestax:generated ${id} -->`;
  const close = id => `<!-- /bestax:generated ${id} -->`;
  for (const [src, want] of [
    [`${open('skills')}\n`, /plugin\/README\.md:1 opens .* never closed/],
    [
      `${open('skills')}\n${open('mcp-server')}\n`,
      /plugin\/README\.md:2 opens generated region "mcp-server" while "skills"/,
    ],
    [
      `${open('skills')}\n${close('skills')}\n${open('skills')}\n${close('skills')}\n`,
      /plugin\/README\.md:3 re-opens generated region "skills"/,
    ],
  ]) {
    let thrown;
    try {
      renderReadme(src, [], { pin: 'x@1.0.0', env: [] });
    } catch (err) {
      thrown = err;
    }
    assert.ok(isSkillRefusal(thrown), want.source);
    assert.match(thrown.message, want);
    assert.ok(thrown.cause instanceof Error, 'the original error is kept');
  }
  // A bug, rather than a template error, keeps its own type and stack.
  assert.throws(
    () => renderReadme(null, [], { pin: 'x@1.0.0', env: [] }),
    err => err instanceof TypeError && !isSkillRefusal(err)
  );

  // So main prints the message alone, with no stack.
  const root = fixtureRepo();
  write(root, TEMPLATE.readme, `${README}\n${open('skills')}\n`);
  const { out, io } = capture();
  const dir = path.join(tempDir(), 'out');
  assert.equal(await main([dir], io, { repo: root, inputCommits: 1 }), 1);
  assert.match(
    out.stderr,
    /opens generated region \\"skills\\" but it is never closed/
  );
  assert.doesNotMatch(out.stderr, /\n\s+at |\\n\s+at /);
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
  const claude = renderClaudeManifest(t, pin, '1.0.7');
  assert.equal(claude.version, '1.0.7');
  assert.equal(claude.icon, `./${FILES.icon}`);
  assert.equal(claude.privacyPolicyUrl, t.claude.privacyPolicyUrl);
  assert.equal(claude.supportUrl, t.claude.supportUrl);
  assert.deepEqual(claude.mcpServers.bestax.args, ['-y', pin]);
  const agent = renderAgentManifest(t, '1.0.7');
  assert.equal(agent.version, '1.0.7');
  assert.equal(
    agent.privacyPolicyUrl,
    undefined,
    'Claude-only fields stay out'
  );
  assert.equal(agent.icon, undefined);
  assert.equal(renderMcpConfig(pin).mcpServers.bestax.type, 'stdio');
  assert.deepEqual(renderCursorManifest(t, '1.0.7'), {
    name: t.plugin.name,
    displayName: t.cursor.displayName,
    version: '1.0.7',
    description: t.plugin.description,
    author: t.plugin.author,
    homepage: t.plugin.homepage,
    repository: t.plugin.repository,
    license: t.plugin.license,
    keywords: t.plugin.keywords,
    logo: FILES.logo,
    skills: './skills/',
    mcpServers: `./${FILES.mcp}`,
  });
  assert.deepEqual(renderGeminiExtension(t, pin, '1.0.7'), {
    name: t.plugin.name,
    version: '1.0.7',
    description: t.plugin.description,
    mcpServers: { bestax: { command: 'npx', args: ['-y', pin] } },
  });
});

// --- the rules, on fixtures -------------------------------------------------------

const README = Buffer.from(
  'The bestax plugin gives coding agents the bestax Agent Skills and the ' +
    'bestax-mcp server. This text is long enough to clear the word count ' +
    'that the plugin directory asks of every README, which is forty words ' +
    'outside code blocks, so this sentence keeps going for a while longer.\n'
);

const file = (p, text, mode = 0o644) => ({
  path: p,
  content: Buffer.from(text),
  mode,
});

function fixtureSources(overrides = {}) {
  return {
    template: realTemplate(),
    version: '1.0.7',
    readme: README,
    launch: { pin: 'bestax-mcp@1.2.3', env: [] },
    icon: file(FILES.icon, ICON),
    logo: file(FILES.logo, LOGO),
    security: file(FILES.security, SECURITY),
    copied: [file('LICENSE', 'MIT License\n'), file('NOTICE', 'Notice\n')],
    skillFiles: [
      file('skills/demo/SKILL.md', '---\nname: demo\n---\n'),
      file('skills/demo/references/a.md', '# A\n'),
      file('skills/demo/scripts/check.sh', '#!/bin/sh\n', 0o755),
    ],
    ...overrides,
  };
}

const entriesOf = tree => planEntries(tree);

/**
 * treeViolations for the fixture tree after `mutate`, which gets a Map of
 * path to bytes, so a rule test only says what it puts in or takes out.
 */
function violationsWith(mutate) {
  const files = new Map(
    [...buildTree(fixtureSources())].map(([p, { content }]) => [p, content])
  );
  mutate(files);
  return treeViolations(
    [...files].map(([p, content]) => ({ path: p, content, symlink: false }))
  );
}

const has = (violations, re) =>
  assert.ok(
    violations.some(v => re.test(v)),
    `${re} in ${violations.join(' | ')}`
  );

test('a well-formed fixture tree has no violations', () => {
  assert.deepEqual(treeViolations(entriesOf(buildTree(fixtureSources()))), []);
});

test('buildTree writes generated files 0644 and keeps each source mode', () => {
  const tree = buildTree(fixtureSources());
  for (const generated of Object.values(FILES)) {
    assert.equal(tree.get(generated).mode, 0o644, generated);
  }
  assert.equal(tree.get('LICENSE').mode, 0o644);
  assert.equal(tree.get('skills/demo/SKILL.md').mode, 0o644);
  assert.equal(tree.get('skills/demo/scripts/check.sh').mode, 0o755);
  for (const manifest of [
    FILES.agent,
    FILES.claude,
    FILES.cursor,
    FILES.gemini,
  ]) {
    assert.equal(
      JSON.parse(tree.get(manifest).content.toString('utf8')).version,
      '1.0.7',
      manifest
    );
  }
  assert.ok(tree.get(FILES.icon).content.equals(ICON));
  assert.ok(tree.get(FILES.logo).content.equals(LOGO));
});

// --- the icon ---------------------------------------------------------------------

test('the test PNGs are complete, so the icon rules are tested on real PNGs', () => {
  const [ihdr, idat] = pngChunks(1000, 3);
  assert.deepEqual(
    inflateSync(idat[1]),
    Buffer.alloc((Math.ceil(1000 / 8) + 1) * 3)
  );
  assert.equal(ihdr[1].readUInt32BE(0), 1000);
  // Wider than one stored block of 65535 bytes.
  assert.equal(
    inflateSync(pngChunks(2048, 300)[1][1]).length,
    (2048 / 8 + 1) * 300
  );
});

test('pngSize reads the chunk layout and refuses an incomplete PNG', () => {
  assert.deepEqual(pngSize(ICON), {
    width: 512,
    height: 512,
    transparent: false,
  });
  assert.deepEqual(pngSize(png(600, 520)), {
    width: 600,
    height: 520,
    transparent: false,
  });
  // Grey and RGB, plain or with a palette, are opaque. Their alpha
  // variants are not, and neither is any PNG with a tRNS chunk.
  for (const [type, transparent] of [
    [0, false],
    [2, false],
    [3, false],
    [4, true],
    [6, true],
  ]) {
    const bytes = pngBytes(withColourType(pngChunks(16, 16), type));
    assert.equal(
      pngSize(bytes).transparent,
      transparent,
      `colour type ${type}`
    );
  }
  const [ihdrChunk, idatChunk, iendChunk] = pngChunks(16, 16);
  assert.equal(
    pngSize(
      pngBytes([ihdrChunk, ['tRNS', Buffer.alloc(2)], idatChunk, iendChunk])
    ).transparent,
    true,
    'a tRNS chunk'
  );
  const [ihdr, idat, iend] = pngChunks(512, 512);
  for (const [why, bytes, said] of [
    ['empty', Buffer.alloc(0), /^is not a PNG$/],
    [
      'a JPEG',
      Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]),
      /^is not a PNG$/,
    ],
    ['a signature alone', ICON.subarray(0, 8), /does not end with an IEND/],
    ['IDAT first', pngBytes([idat, ihdr, iend]), /does not start with an IHDR/],
    [
      'a short IHDR',
      pngBytes([['IHDR', ihdr[1].subarray(0, 12)], idat, iend]),
      /does not start with an IHDR/,
    ],
    ['no IDAT', pngBytes([ihdr, iend]), /has no IDAT chunk/],
    ['cut in IDAT', ICON.subarray(0, 100), /does not end with an IEND/],
    ['no IEND', ICON.subarray(0, -12), /does not end with an IEND/],
    ['a cut IEND', ICON.subarray(0, -1), /does not end with an IEND/],
    [
      'bytes after IEND',
      Buffer.concat([ICON, Buffer.from('x')]),
      /does not end with an IEND/,
    ],
    [
      'an IEND with data',
      pngBytes([ihdr, idat, ['IEND', Buffer.from('x')]]),
      /does not end with an IEND/,
    ],
  ]) {
    const { problem, width } = pngSize(bytes);
    assert.match(problem ?? '', said, why);
    assert.equal(width, undefined, why);
  }
});

test('the icon must be a square PNG of 512 to 2048 px, under 2 MB', () => {
  const withIcon = bytes => violationsWith(tree => tree.set(FILES.icon, bytes));
  // The bounds pass, and the 256 KiB text rule does not apply.
  const largest = png(2048, 2048);
  assert.ok(largest.length > LIMITS.textBytes);
  assert.deepEqual(withIcon(largest), []);
  assert.deepEqual(withIcon(png(512, 512)), []);

  const rule =
    /The directory takes a square PNG, 512 to 2048 px a side and under 2 MB, as the icon\.$/;
  const icon = /^"\.claude-plugin\/icon\.png": /;
  const huge = pngChunks(512, 512);
  huge.splice(1, 0, ['tEXt', Buffer.alloc(ICON_LIMITS.bytes)]);
  for (const [why, bytes, said] of [
    ['not square', png(512, 600), /is 512 by 600 px\./],
    ['too small', png(511, 511), /is 511 by 511 px\./],
    ['too large', png(2049, 2049), /is 2049 by 2049 px\./],
    ['over 2 MB', pngBytes(huge), /is \d+ bytes, at or over 2000000\./],
    ['truncated', ICON.subarray(0, -12), /does not end with an IEND chunk/],
    [
      'a JPEG',
      Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46]),
      /is not a PNG\./,
    ],
    [
      'an SVG',
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>\n'),
      /is not a PNG\./,
    ],
    [
      'a WebP',
      Buffer.concat([
        Buffer.from('RIFF'),
        Buffer.from([0x1a, 0, 0, 0]),
        Buffer.from('WEBPVP8 '),
      ]),
      /is not a PNG\./,
    ],
  ]) {
    const v = withIcon(bytes);
    assert.equal(v.length, 1, `${why}: ${v.join(' | ')}`);
    assert.match(v[0], icon, why);
    assert.match(v[0], said, why);
    assert.match(v[0], rule, why);
    assert.deepEqual(iconViolations(bytes), v, why);
  }
  has(
    violationsWith(tree => tree.delete(FILES.icon)),
    /^\.claude-plugin\/icon\.png: missing\.$/
  );
  // A binary file anywhere else is still refused as before.
  has(
    violationsWith(tree => tree.set('skills/demo/icon.bin', ICON)),
    /icon\.bin": is not UTF-8 text/
  );
});

test('the icon input is read as bytes and published at .claude-plugin/icon.png', async () => {
  const root = fixtureRepo();
  const out = path.join(tempDir(), 'out');
  await generate(out, root, { inputCommits: 1 });
  assert.ok(fs.readFileSync(path.join(out, FILES.icon)).equals(ICON));
  assert.equal(fs.statSync(path.join(out, FILES.icon)).mode & 0o777, 0o644);
  assert.equal(readJson(out, FILES.claude).icon, `./${FILES.icon}`);
});

test('a symbolic link, an untracked file or a JPEG as the icon stops the run', async () => {
  const linked = fixtureRepo();
  fs.rmSync(path.join(linked, TEMPLATE.icon));
  write(linked, 'docs/logo.png', ICON);
  fs.symlinkSync('../docs/logo.png', path.join(linked, TEMPLATE.icon));
  git(linked, 'add', '-A');
  await assert.rejects(readSources(linked, counted), err => {
    assert.ok(err instanceof TreeError);
    assert.deepEqual(err.problems, [
      '"plugin/icon.png": is a symbolic link. Commit a regular file.',
    ]);
    return true;
  });

  const untracked = fixtureRepo();
  git(untracked, 'rm', '-q', '--cached', TEMPLATE.icon);
  await assert.rejects(
    readSources(untracked, counted),
    /"plugin\/icon\.png": is not tracked by git/
  );

  const jpeg = fixtureRepo();
  write(jpeg, TEMPLATE.icon, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]));
  git(jpeg, 'add', '-A');
  const out = path.join(tempDir(), 'out');
  await assert.rejects(generate(out, jpeg, counted), err => {
    assert.ok(err instanceof TreeError);
    assert.equal(err.problems.length, 1);
    assert.match(
      err.problems[0],
      /^"\.claude-plugin\/icon\.png": is not a PNG\./
    );
    return true;
  });
  assert.ok(!fs.existsSync(out), 'nothing is written');
});

// --- the Cursor logo and manifest ---------------------------------------------

test('the logo must be a square PNG that cannot hold a transparent pixel', () => {
  const withLogo = bytes => violationsWith(tree => tree.set(FILES.logo, bytes));
  assert.deepEqual(withLogo(LOGO), []);
  assert.deepEqual(
    withLogo(pngBytes(withColourType(pngChunks(64, 64), 2))),
    []
  );

  const rule =
    /The Cursor Marketplace takes a square logo with a background plate, as a PNG with no alpha channel and no transparent colour\.$/;
  const logo = /^"assets\/logo\.png": /;
  const [ihdr, idat, iend] = pngChunks(64, 64);
  for (const [why, bytes, said] of [
    ['not square', png(600, 500), /is 600 by 500 px\./],
    [
      'RGB with alpha',
      pngBytes(withColourType(pngChunks(64, 64), 6)),
      /can hold transparent pixels\./,
    ],
    [
      'grey with alpha',
      pngBytes(withColourType(pngChunks(64, 64), 4)),
      /can hold transparent pixels\./,
    ],
    [
      'a tRNS chunk',
      pngBytes([ihdr, ['tRNS', Buffer.alloc(2)], idat, iend]),
      /can hold transparent pixels\./,
    ],
    ['truncated', LOGO.subarray(0, -12), /does not end with an IEND chunk/],
    [
      'an SVG',
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>\n'),
      /is not a PNG\./,
    ],
  ]) {
    const v = withLogo(bytes);
    assert.equal(v.length, 1, `${why}: ${v.join(' | ')}`);
    assert.match(v[0], logo, why);
    assert.match(v[0], said, why);
    assert.match(v[0], rule, why);
    assert.deepEqual(logoViolations(bytes), v, why);
  }
  // Both faults at once are both reported.
  assert.equal(
    logoViolations(pngBytes(withColourType(pngChunks(64, 32), 6))).length,
    2
  );
  has(
    violationsWith(tree => tree.delete(FILES.logo)),
    /^assets\/logo\.png: missing\.$/
  );
});

test('the Cursor manifest must name a logo, skills and mcp.json in the tree', () => {
  const withCursor = change =>
    violationsWith(tree => {
      const manifest = JSON.parse(tree.get(FILES.cursor).toString('utf8'));
      change(manifest);
      tree.set(FILES.cursor, Buffer.from(JSON.stringify(manifest)));
    });
  assert.deepEqual(
    withCursor(() => {}),
    []
  );
  has(
    withCursor(m => (m.logo = 'assets/missing.png')),
    /^\.cursor-plugin\/plugin\.json: logo names "assets\/missing\.png", which is not in the tree\.$/
  );
  has(
    withCursor(m => (m.skills = './agents/')),
    /^\.cursor-plugin\/plugin\.json: skills names "\.\/agents\/", which is not in the tree\.$/
  );
  has(
    withCursor(m => delete m.mcpServers),
    /^\.cursor-plugin\/plugin\.json: mcpServers must name a path in the tree\.$/
  );
  has(
    withCursor(m => (m.name = 'Bestax')),
    /^\.cursor-plugin\/plugin\.json: name "Bestax" does not match/
  );
  has(
    violationsWith(tree => tree.delete(FILES.cursor)),
    /^\.cursor-plugin\/plugin\.json: missing\.$/
  );
  // The folder rule wants a file inside the folder, not a name that starts
  // the same way.
  has(
    violationsWith(tree => {
      const manifest = JSON.parse(tree.get(FILES.cursor).toString('utf8'));
      manifest.skills = './skill/';
      tree.set(FILES.cursor, Buffer.from(JSON.stringify(manifest)));
    }),
    /skills names "\.\/skill\/", which is not in the tree/
  );
});

test('the tree must carry a SECURITY.md that links a private channel', () => {
  has(
    violationsWith(tree => tree.delete(FILES.security)),
    /^SECURITY\.md: missing\.$/
  );
  const withSecurity = text =>
    violationsWith(tree => tree.set(FILES.security, Buffer.from(text)));
  for (const ok of [
    'Email [us](mailto:security@example.com).\n',
    `Report on the [Security tab](${SOURCE_REPOSITORY}/security).\n`,
    `See ${SOURCE_REPOSITORY}/security/advisories/new\n`,
    `${SOURCE_REPOSITORY}/security`,
  ]) {
    assert.deepEqual(withSecurity(ok), [], ok);
    assert.deepEqual(securityViolations(Buffer.from(ok)), [], ok);
  }
  for (const gutted of [
    '',
    '# Security Policy\n\nOpen an issue.\n',
    'Email security@example.com.\n',
    'See https://github.com/owner/repo/issues\n',
    'Write to [us](mailto:nobody).\n',
    // Another repository's Security page, or a path that only starts like
    // the right one.
    'Report on [GitHub](https://github.com/owner/repo/security).\n',
    `Report on [GitHub](${SOURCE_REPOSITORY}-skills/security).\n`,
    `See [the policy](${SOURCE_REPOSITORY}/security-policy).\n`,
  ]) {
    has(withSecurity(gutted), /^SECURITY\.md: links no private way to report/);
  }
});

test('SOURCE_REPOSITORY is the repository server.json names', () => {
  assert.equal(SOURCE_REPOSITORY, realServer().repository.url);
});

test('the Gemini manifest must keep the plugin name and an exact npx pin', () => {
  const withGemini = change =>
    violationsWith(tree => {
      const manifest = JSON.parse(tree.get(FILES.gemini).toString('utf8'));
      change(manifest);
      tree.set(FILES.gemini, Buffer.from(JSON.stringify(manifest)));
    });
  assert.deepEqual(
    withGemini(() => {}),
    []
  );
  has(
    withGemini(m => (m.mcpServers.bestax.args = ['-y', 'bestax-mcp@^1.2.3'])),
    /^gemini-extension\.json: mcpServers\."bestax" runs npx "bestax-mcp@\^1\.2\.3", which is not pinned/
  );
  has(
    withGemini(m => (m.name = 'Bestax')),
    /^gemini-extension\.json: name "Bestax" does not match/
  );
  has(
    violationsWith(tree => tree.delete(FILES.gemini)),
    /^gemini-extension\.json: missing\.$/
  );
});

test('the logo input is read as bytes and published at assets/logo.png', async () => {
  const root = fixtureRepo();
  const out = path.join(tempDir(), 'out');
  await generate(out, root, { inputCommits: 1 });
  assert.ok(fs.readFileSync(path.join(out, FILES.logo)).equals(LOGO));
  assert.equal(fs.statSync(path.join(out, FILES.logo)).mode & 0o777, 0o644);
  assert.equal(readJson(out, FILES.cursor).logo, FILES.logo);

  const transparent = fixtureRepo();
  write(
    transparent,
    TEMPLATE.logo,
    pngBytes(withColourType(pngChunks(64, 64), 6))
  );
  git(transparent, 'add', '-A');
  const refused = path.join(tempDir(), 'out');
  await assert.rejects(generate(refused, transparent, counted), err => {
    assert.ok(err instanceof TreeError);
    assert.deepEqual(err.problems.length, 1);
    assert.match(err.problems[0], /^"assets\/logo\.png": can hold transparent/);
    return true;
  });
  assert.ok(!fs.existsSync(refused), 'nothing is written');

  const untracked = fixtureRepo();
  git(untracked, 'rm', '-q', '--cached', TEMPLATE.logo);
  await assert.rejects(
    readSources(untracked, counted),
    /"plugin\/logo\.png": is not tracked by git/
  );
});

test('fileMode keeps only the owner execute bit, as git does', () => {
  assert.equal(fileMode(0o100644), 0o644);
  assert.equal(fileMode(0o100755), 0o755);
  assert.equal(fileMode(0o600), 0o644);
  assert.equal(fileMode(0o700), 0o755);
  assert.equal(fileMode(0o655), 0o644, 'group and other execute do not count');
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

test('a README or manifest that is a link is reported, not a crash', () => {
  const links = new Set([FILES.readme, FILES.claude]);
  const v = treeViolations(
    entriesOf(buildTree(fixtureSources())).map(entry =>
      links.has(entry.path) ? { ...entry, content: null, symlink: true } : entry
    )
  );
  has(v, /"README\.md": is a symbolic link/);
  has(v, /"\.claude-plugin\/plugin\.json": is a symbolic link/);
  assert.ok(!v.some(p => p.startsWith('README.md: has')), 'no word count');
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
  for (const problem of planMismatch(
    new Map([[evil, { content: Buffer.from('x'), mode: 0o644 }]]),
    []
  )) {
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
      bare: { command: 'npx', args: ['@scope/a@1.0.0', '--port', '3'] },
      dashes: { command: 'npx', args: ['-y', '--', 'a@1.0.0'] },
    }),
    []
  );
  const v = launcherViolations('f', {
    none: { command: 'npx', args: ['-y'] },
    latest: { command: 'npx', args: ['bestax-mcp@latest'] },
    flag: { command: 'npx', args: ['-p', 'a@1.0.0', 'a'] },
    noargs: { command: 'npx' },
    broken: 'npx',
  });
  has(v, /"none" runs npx \(no package\)/);
  has(v, /"latest" runs npx "bestax-mcp@latest"/);
  has(v, /"flag" passes npx "-p", an option this check does not read/);
  has(v, /"noargs" runs npx \(no package\)/);
  has(v, /"broken" has no command/);
  assert.deepEqual(launcherViolations('f', []), [
    'f: mcpServers is not an object.',
  ]);
});

test('an npx option or argument this check does not read is refused', () => {
  const v = launcherViolations('f', {
    pkg: { command: 'npx', args: ['--package=a@1.0.0', 'a'] },
    call: { command: 'npx', args: ['-c', 'a@1.0.0'] },
    // --cache takes a value, so its value would pass for the package.
    cache: { command: 'npx', args: ['--cache', 'x@1.0.0', 'a'] },
    registry: {
      command: 'npx',
      args: ['--registry=https://evil.example', 'a@1.0.0'],
    },
    number: { command: 'npx', args: [1, 'a@1.0.0'] },
    notlist: { command: 'npx', args: 'a@1.0.0' },
    trailing: { command: 'npx', args: ['-y', '--'] },
  });
  has(v, /"pkg" passes npx "--package=a@1\.0\.0", an option/);
  has(v, /"call" passes npx "-c", an option/);
  has(v, /"cache" passes npx "--cache", an option/);
  has(v, /"registry" passes npx "--registry=https:\/\/evil\.example"/);
  has(v, /"number" passes npx an argument that is not a string/);
  has(v, /"notlist" has args that are not a list/);
  has(v, /"trailing" runs npx \(no package\)/);
  assert.equal(v.length, 7);
});

test('every launcher other than npx is refused, pinned or not', () => {
  const launches = {
    'npm-exec': ['npm', ['exec', '--yes', 'a@1.0.0']],
    'npm-x': ['npm', ['x', 'a']],
    'npm-exec-win': ['C:\\nodejs\\npm.cmd', ['exec', 'a@1.0.0']],
    pnpx: ['pnpx', ['a@1.0.0']],
    'pnpm-dlx': ['pnpm', ['dlx', 'a@1.0.0']],
    'yarn-dlx': ['yarn', ['dlx', 'a@1.0.0']],
    bunx: ['bunx', ['a@1.0.0']],
    'bun-x': ['bun', ['x', 'a']],
    'bunx-exe': ['BUNX.EXE', ['a']],
    uvx: ['uvx', ['a==1.0.0']],
    pipx: ['pipx', ['run', 'a']],
    deno: ['deno', ['run', 'npm:a@1.0.0']],
    env: ['/usr/bin/env', ['npx', 'a']],
    sh: ['sh', ['-c', 'npx a']],
    cmd: ['cmd', ['/c', 'npx', 'a']],
    spaced: ['npx -y a', []],
    node: ['node', ['server.js']],
  };
  const v = launcherViolations(
    'f',
    Object.fromEntries(
      Object.entries(launches).map(([name, [command, args]]) => [
        name,
        { command, args },
      ])
    )
  );
  assert.equal(v.length, Object.keys(launches).length);
  for (const name of Object.keys(launches)) {
    has(v, new RegExp(`"${name}" runs ".+", and this check reads only npx`));
  }
  has(v, /"npm-exec-win" runs "npm"/);
  has(v, /"bunx-exe" runs "bunx"/);
  has(v, /"spaced" runs "npx -y a"/);
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
  write(root, TEMPLATE.icon, ICON);
  write(root, TEMPLATE.logo, LOGO);
  write(root, TEMPLATE.security, SECURITY);
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
  const sources = await readSources(root, { inputCommits: 5 });
  assert.equal(sources.version, `1.0.${5 + OUTPUT_FORMAT}`);
  assert.deepEqual(
    sources.skillFiles.map(f => f.path),
    ['skills/demo/SKILL.md', 'skills/demo/references/a.md']
  );
  assert.equal(sources.launch.pin, 'demo-mcp@1.2.3');
  assert.deepEqual(
    sources.copied.map(f => f.path),
    COPIED
  );
  assert.equal(sources.icon.path, FILES.icon);
  assert.ok(sources.icon.content.equals(ICON));
  assert.equal(sources.icon.mode, 0o644);
  assert.equal(sources.logo.path, FILES.logo);
  assert.equal(sources.security.path, FILES.security);
  assert.equal(sources.security.content.toString(), SECURITY);
  assert.ok(sources.logo.content.equals(LOGO));
  const readme = sources.readme.toString('utf8');
  assert.ok(readme.includes(`- **demo**: ${DEMO_SUMMARY}\n`));
  assert.ok(readme.includes('npx -y demo-mcp@1.2.3\n'));
  assert.ok(readme.includes('BESTAX_MCP_NO_VERSION_CHECK'));

  const files = await generate(path.join(tempDir(), 'out'), root, {
    inputCommits: 5,
  });
  assert.ok(!files.includes('skills/README.md'));
});

test('an executable skill file stays executable, and only it', async () => {
  const root = fixtureRepo();
  write(root, 'skills/demo/scripts/run.sh', '#!/bin/sh\necho hi\n');
  fs.chmodSync(path.join(root, 'skills/demo/scripts/run.sh'), 0o755);
  fs.chmodSync(path.join(root, 'skills/demo/references/a.md'), 0o600);
  git(root, 'add', '-A');
  const out = path.join(tempDir(), 'out');
  await generate(out, root, { inputCommits: 1 });
  const mode = rel => fs.statSync(path.join(out, rel)).mode & 0o777;
  assert.equal(mode('skills/demo/scripts/run.sh'), 0o755);
  assert.equal(mode('skills/demo/references/a.md'), 0o644);
  assert.equal(mode('skills/demo/SKILL.md'), 0o644);
  assert.equal(mode(FILES.agent), 0o644);
  const written = await scanTree(out);
  assert.equal(
    written.find(e => e.path === 'skills/demo/scripts/run.sh').mode,
    0o755
  );
});

test('an untracked skill file stops the run, as it stops the syncs', async () => {
  const root = fixtureRepo();
  write(root, 'skills/demo/untracked.md', 'not vetted\n');
  write(root, 'skills/demo/.DS_Store', 'finder\n');
  await assert.rejects(readSources(root, counted), err => {
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
  await assert.rejects(readSources(root, counted), err => {
    assert.ok(isSkillRefusal(err));
    assert.match(err.message, /skills\/demo\/link\.md is a symbolic link/);
    return true;
  });
});

test('a tracked hidden file in a skill fails the directory checks', async () => {
  const root = fixtureRepo();
  write(root, 'skills/demo/.eslintrc', '{}');
  git(root, 'add', '-A');
  const sources = await readSources(root, counted);
  assert.ok(sources.skillFiles.some(f => f.path === 'skills/demo/.eslintrc'));
  await assert.rejects(
    generate(path.join(tempDir(), 'out'), root, counted),
    err => {
      assert.ok(err instanceof TreeError);
      assert.equal(err.code, SKILL_REFUSAL);
      assert.deepEqual(err.problems, [
        '"skills/demo/.eslintrc": is hidden, and the plugin ships no hidden files.',
      ]);
      return true;
    }
  );
});

test('every input must be a tracked regular file', async () => {
  const root = fixtureRepo();
  fs.rmSync(path.join(root, 'LICENSE'));
  fs.symlinkSync('NOTICE', path.join(root, 'LICENSE'));
  fs.rmSync(path.join(root, SKILL_INDEX));
  fs.mkdirSync(path.join(root, SKILL_INDEX));
  git(root, 'rm', '-q', '--cached', `${MCP_DIR}/server.json`);
  fs.rmSync(path.join(root, TEMPLATE.manifest));
  await assert.rejects(readSources(root, counted), err => {
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
  const sources = await readSources(root, counted);
  assert.deepEqual(
    sources.skillFiles.map(f => f.path),
    [
      'skills/demo/SKILL.md',
      'skills/demo/extra.md',
      'skills/demo/references/a.md',
    ]
  );
  fs.symlinkSync('extra.md', path.join(root, 'skills/demo/link.md'));
  await assert.rejects(
    readSources(root, counted),
    /link\.md is a symbolic link/
  );
});

test('without git, the version cannot be counted, so the run stops', async () => {
  const root = fixtureRepo({ init: false });
  await assert.rejects(readSources(root), err => {
    assert.ok(isSkillRefusal(err));
    assert.match(
      err.message,
      /^git cannot read .*: fatal: not a git repository/
    );
    return true;
  });
  const { out, io } = capture();
  assert.equal(
    await main([path.join(tempDir(), 'out')], io, { repo: root }),
    1
  );
  assert.match(out.stderr, /git cannot read/);
});

test('with --require-checkout, a failed git listing stops the run and says why', async () => {
  const exported = fixtureRepo({ init: false });
  await assert.rejects(
    readSources(exported, { requireCheckout: true, inputCommits: 1 }),
    err => {
      assert.ok(isSkillRefusal(err));
      assert.match(
        err.message,
        /^this run requires a git checkout to vet its files, and git cannot read .*not a git repository/
      );
      return true;
    }
  );
  const { out, io } = capture();
  assert.equal(
    await main([REQUIRE_CHECKOUT, path.join(tempDir(), 'out')], io, {
      repo: exported,
      inputCommits: 1,
    }),
    1
  );
  assert.match(out.stderr, /requires a git checkout/);

  // Nested in some other repository, git speaks for that one instead.
  const outer = tempDir();
  git(outer, 'init', '-q');
  const nested = path.join(outer, 'exported');
  fs.cpSync(exported, nested, { recursive: true });
  await assert.rejects(
    readSources(nested, { requireCheckout: true, inputCommits: 1 }),
    /requires a git checkout to vet its files, and git reads .* as part of the repository at /
  );
  // Without the flag the same trees keep the exported-tree behaviour.
  assert.equal(
    (await readSources(nested, { inputCommits: 1 })).version,
    `1.0.${1 + OUTPUT_FORMAT}`
  );

  // The skill gate is held to it too, not only the inputs outside skills/:
  // a skills/ that is a repository of its own is not the one being read.
  const root = fixtureRepo();
  git(path.join(root, 'skills'), 'init', '-q');
  write(root, 'skills/demo/unvetted.md', 'x\n');
  await assert.rejects(
    readSources(root, { requireCheckout: true, inputCommits: 1 }),
    /requires a git checkout to vet its files, and git reads .*skills as part of the repository at .*skills, not /
  );
  assert.ok(
    (await readSources(root, { inputCommits: 1 })).skillFiles.some(f =>
      f.path.endsWith('unvetted.md')
    ),
    'without the flag the gate has nothing to vet against'
  );
});

/** Commits everything staged in `root`, with no signing and no hooks. */
const commit = (root, message) =>
  git(
    root,
    '-c',
    'user.name=t',
    '-c',
    'user.email=t@t',
    '-c',
    'commit.gpgsign=false',
    '-c',
    'core.hooksPath=/dev/null',
    'commit',
    '-q',
    '--allow-empty',
    '-m',
    message
  );

test('inputCommitCount counts the commits that touched CONTENT_PATHS only', async () => {
  const root = fixtureRepo();
  commit(root, 'inputs');
  assert.equal(inputCommitCount(root), 1);
  write(root, 'unrelated.txt', 'x\n');
  git(root, 'add', '-A');
  commit(root, 'not an input');
  commit(root, 'empty');
  assert.equal(inputCommitCount(root), 1, 'other paths do not count');

  // The generator's code and the workflow start a publish but do not
  // count, so an edit to them alone leaves the version where it was.
  const code = PUBLISH_PATHS.filter(
    p => !p.includes('*') && !CONTENT_PATHS.includes(p)
  );
  assert.ok(code.includes('scripts/gen-skills-repo.mjs'));
  for (const file of code) write(root, file, '// x\n');
  git(root, 'add', '-A');
  commit(root, 'the generator and the workflow');
  assert.equal(inputCommitCount(root), 1, 'code paths do not count');

  // Nor do the files in skills/ outside a skill directory, which do not ship.
  write(root, 'skills/README.md', '# changed\n');
  write(root, 'skills/CLAUDE.md', '# notes\n');
  git(root, 'add', '-A');
  commit(root, 'skills/README.md and skills/CLAUDE.md');
  assert.equal(
    inputCommitCount(root),
    1,
    'unshipped skills files do not count'
  );

  // Each content path counts, one commit each.
  const content = [
    'skills/demo/references/b.md',
    ...CONTENT_PATHS.filter(p => !p.endsWith('/**')),
    'plugin/README.md',
  ];
  for (const file of content) {
    fs.appendFileSync(path.join(root, file), '\n');
    git(root, 'add', '-A');
    commit(root, file);
  }
  assert.equal(inputCommitCount(root), 1 + content.length);

  // The real count reaches both manifests when nothing is injected.
  const out = path.join(tempDir(), 'out');
  await generate(out, root);
  for (const manifest of [FILES.agent, FILES.claude]) {
    assert.equal(
      readJson(out, manifest).version,
      `1.0.${1 + content.length + OUTPUT_FORMAT}`,
      manifest
    );
  }
});

test('inputCommitCount refuses a shallow clone, no HEAD and no repository', () => {
  const root = fixtureRepo();
  commit(root, 'one');
  write(root, 'skills/demo/references/b.md', '# B\n');
  git(root, 'add', '-A');
  commit(root, 'two');
  const shallow = path.join(tempDir(), 'shallow');
  execFileSync(
    'git',
    ['clone', '-q', '--depth', '1', pathToFileURL(root).href, shallow],
    { stdio: 'ignore' }
  );
  assert.throws(
    () => inputCommitCount(shallow),
    err => {
      assert.ok(isSkillRefusal(err));
      assert.match(err.message, /is a shallow clone, .* fetch-depth: 0/);
      return true;
    }
  );
  assert.throws(
    () => inputCommitCount(fixtureRepo()),
    /git rev-list failed in .*: fatal: /
  );
  assert.throws(
    () => inputCommitCount(fixtureRepo({ init: false })),
    /git cannot read .*not a git repository/
  );
});

test('a server.json that stops describing an npm stdio package is refused', async () => {
  const root = fixtureRepo();
  const server = JSON.parse(
    fs.readFileSync(path.join(root, MCP_DIR, 'server.json'), 'utf8')
  );
  server.packages[0].transport = { type: 'streamable-http' };
  write(root, `${MCP_DIR}/server.json`, JSON.stringify(server));
  await assert.rejects(
    readSources(root, counted),
    /server\.json no longer gives the plugin an npm package to start over stdio: .*transport\.type must be stdio/
  );
});

test('an input that is not valid JSON is refused, naming the file', async () => {
  const root = fixtureRepo();
  write(root, TEMPLATE.manifest, '{ not json');
  await assert.rejects(readSources(root, counted), err => {
    assert.ok(isSkillRefusal(err));
    assert.match(err.message, /plugin\/manifest\.json is not valid JSON/);
    return true;
  });
});

test('a stale skill index or a repo without skills is refused', async () => {
  const stale = fixtureRepo();
  write(stale, SKILL_INDEX, JSON.stringify({ skills: [] }));
  await assert.rejects(readSources(stale, counted), /Run pnpm gen:mcp/);
  const empty = fixtureRepo();
  fs.rmSync(path.join(empty, 'skills/demo'), { recursive: true });
  await assert.rejects(readSources(empty, counted), /holds no skills/);
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
  const at = (text, mode = 0o644) => ({ content: Buffer.from(text), mode });
  const tree = new Map([
    ['a', at('a')],
    ['b', at('b')],
    ['d', at('d', 0o755)],
    ['e', at('e')],
    ['f', at('f')],
  ]);
  assert.deepEqual(
    planMismatch(tree, [
      { path: 'b', ...at('B') },
      { path: 'c', ...at('c') },
      { path: 'd', ...at('d') },
      { path: 'e', ...at('e', 0o755) },
      { path: 'f', content: null, symlink: true },
    ]),
    [
      '"a": was planned but is not on disk.',
      '"b": on disk differs from the plan.',
      '"d": has mode 0644 on disk, and the plan has 0755.',
      '"e": has mode 0755 on disk, and the plan has 0644.',
      '"f": was planned but is not on disk.',
      '"c": is on disk but was not planned.',
    ]
  );
});
