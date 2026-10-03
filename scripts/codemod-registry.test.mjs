/**
 * Guards on codemod-registry.mjs, the logic behind
 * .github/workflows/codemod-registry.yml.
 *
 * That workflow runs on `workflow_dispatch` only, so no PR exercises it. These
 * tests are the coverage it gets before a dispatch, and the first group runs
 * against the COMMITTED bestax-migrate/codemod/ package, so a broken pin fails
 * a PR instead of a publish.
 *
 * The committed files are held to agreeing with each other and to naming no
 * release ahead of bestax-migrate/package.json, never to equalling it: every
 * bestax-migrate release bumps package.json, and an equality test here would
 * turn every open PR red until someone bumped the pins. The workflow's
 * `check` is where equality is required.
 *
 * The committed CLI lockfile in .github/codemod-cli/ is held to the same
 * offline rules `check` applies before the workflow runs `npm ci` on it.
 *
 * Nothing here reaches the network or spawns anything: fetch and the CLI are
 * stubbed or injected.
 */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BUMP_COMMAND,
  CLI_DIR,
  NPM_MANIFEST,
  OIDC_AUDIENCE,
  PACKAGE_DIR,
  PACKAGE_NAME,
  PUBLISH_TIMEOUT_MS,
  WITHHELD_FROM_CLI,
  bump,
  chooseCredential,
  cliProblems,
  compareVersions,
  findPins,
  main,
  npmProblems,
  packageProblems,
  publish,
  readCli,
  readPackage,
  requestOidcToken,
  topLevelScalars,
} from './codemod-registry.mjs';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const WORKFLOW = path.join(
  repoRoot,
  '.github',
  'workflows',
  'codemod-registry.yml'
);
const NO_BACKOFF = { backoffMs: [0, 0] };

const tempDirs = [];
after(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

/**
 * A repository root holding a copy of the committed registry package and a
 * bestax-migrate/package.json at `npmVersion`, so bump and check run on the
 * real files without touching them.
 */
function tempRepo(npmVersion) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codemod-registry-'));
  tempDirs.push(root);
  fs.cpSync(path.join(repoRoot, PACKAGE_DIR), path.join(root, PACKAGE_DIR), {
    recursive: true,
  });
  fs.cpSync(path.join(repoRoot, CLI_DIR), path.join(root, CLI_DIR), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, NPM_MANIFEST),
    JSON.stringify({ name: PACKAGE_NAME, version: npmVersion })
  );
  return root;
}

/** A minimal package that passes packageProblems, for single-field breaks. */
function fixture() {
  return {
    manifest:
      'schema_version: "1.0"\nname: "bestax-migrate"\nversion: "2.0.0"\n',
    texts: [
      ['workflow.yaml', 'run: npx --yes bestax-migrate@2.0.0 x'],
      ['workflows/preview.yaml', 'run: npx --yes bestax-migrate@2.0.0 x --dry'],
      ['README.md', 'Runs a pinned release.'],
    ],
    npmVersion: '2.0.0',
  };
}

const problemsOf = (pkg, opts) => packageProblems(pkg, opts).problems;

/** Stub globalThis.fetch for one test, recording each call. */
function stubFetch(t, respond) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return respond(String(url), init);
  });
  return calls;
}

const npmDoc = (overrides = {}) =>
  JSON.stringify({
    name: PACKAGE_NAME,
    version: '2.0.0',
    dist: {
      attestations: {
        url: 'https://registry.npmjs.org/-/npm/v1/attestations/bestax-migrate@2.0.0',
        provenance: { predicateType: 'https://slsa.dev/provenance/v1' },
      },
    },
    ...overrides,
  });

const capture = () => {
  const lines = [];
  return { lines, push: line => lines.push(String(line)) };
};

// ---------------------------------------------------------------------------
// The committed files
// ---------------------------------------------------------------------------

test('the committed package agrees with itself and names a released version', () => {
  const pkg = readPackage(repoRoot);
  assert.deepEqual(problemsOf(pkg, { requireCurrent: false }), []);
});

test('every workflow codemod.yaml lists exists, and each one pins a release', () => {
  const pkg = readPackage(repoRoot);
  const listed = [...pkg.manifest.matchAll(/^\s+path:\s*(\S+)\s*$/gm)].map(
    match => match[1]
  );
  assert.ok(listed.includes('workflow.yaml'));
  assert.ok(listed.includes('workflows/preview.yaml'));
  for (const rel of listed) {
    const entry = pkg.texts.find(([file]) => file === rel);
    assert.ok(entry, `${rel} is listed in codemod.yaml but missing`);
    assert.ok(findPins(entry[1]).length > 0, `${rel} pins nothing`);
  }
});

test('the preview workflow passes --dry and the main one does not', () => {
  // Codemod's own --dry-run skips shell steps, so the preview workflow is
  // the only dry run users get. Losing --dry would make "preview" write.
  const { texts } = readPackage(repoRoot);
  const runLines = rel =>
    texts
      .find(([file]) => file === rel)[1]
      .split('\n')
      .filter(line => /^\s+run: /.test(line));
  assert.match(runLines('workflows/preview.yaml').join('\n'), / --dry$/m);
  assert.ok(runLines('workflow.yaml').length > 0);
  assert.doesNotMatch(runLines('workflow.yaml').join('\n'), /--dry\b/);
});

test('the npm tarball does not ship the registry package', () => {
  // `files` decides the tarball. A catch-all entry or one naming codemod/
  // would put the registry package on npm with every release.
  const { files } = JSON.parse(
    fs.readFileSync(path.join(repoRoot, NPM_MANIFEST), 'utf8')
  );
  assert.ok(Array.isArray(files) && files.length > 0);
  for (const entry of files) {
    const first = entry.replace(/^\.\//, '').split('/')[0];
    assert.ok(
      first !== 'codemod' &&
        first !== '.' &&
        first !== '' &&
        !first.startsWith('*'),
      `files entry ${JSON.stringify(entry)} could ship ${PACKAGE_DIR}`
    );
  }
});

/** The workflow split into its jobs, comment lines dropped. */
function workflowJobs() {
  const code = fs
    .readFileSync(WORKFLOW, 'utf8')
    .split('\n')
    .filter(line => !/^\s*#/.test(line))
    .join('\n');
  const [head, publishJob] = code.split(/^ {2}publish:$/m);
  const [, validateJob] = head.split(/^ {2}validate:$/m);
  return { code, validateJob, publishJob };
}

test('the workflow calls the modes this script has, and installs the CLI from its lockfile', () => {
  const { code } = workflowJobs();
  assert.match(code, /node scripts\/codemod-registry\.mjs check$/m);
  assert.match(
    code,
    /node scripts\/codemod-registry\.mjs publish --cli "\$CODEMOD_BIN"$/m
  );
  const cp = `cp ${CLI_DIR}/package.json ${CLI_DIR}/package-lock.json "$dir/"`;
  const ci = 'npm ci --prefix "$dir" --ignore-scripts --no-audit --no-fund';
  for (const line of [cp, ci, 'npm audit signatures --prefix "$dir"']) {
    assert.equal(code.split(line).length - 1, 2, `both jobs run: ${line}`);
  }
  assert.doesNotMatch(code, /npm (install|i) /, 'no unlocked install');
});

test('only the publish job holds the environment, the secret and id-token: write', () => {
  const { validateJob, publishJob } = workflowJobs();
  assert.ok(validateJob && publishJob, 'both jobs are present');
  assert.doesNotMatch(validateJob, /id-token|environment:|secrets\./);
  assert.match(validateJob, /^ {6}contents: read\b/m);
  assert.match(publishJob, /^ {4}needs: validate$/m);
  assert.match(publishJob, /^ {4}if: inputs\.publish$/m);
  assert.match(publishJob, /^ {4}environment: codemod-registry$/m);
  assert.match(publishJob, /^ {6}id-token: write\b/m);
  assert.match(publishJob, /secrets\.CODEMOD_API_KEY/);
  assert.match(
    publishJob,
    /ref: \$\{\{ needs\.validate\.outputs\.sha \}\}/,
    'publish checks out the commit validate checked'
  );
  for (const job of [validateJob, publishJob]) {
    assert.match(job, /egress-policy: block$/m);
    assert.match(job, /Assert egress policy is enforced/);
  }
});

test('the committed CLI manifest and lockfile pass every offline check', () => {
  const { version, problems } = cliProblems(readCli(repoRoot));
  assert.deepEqual(problems, []);
  assert.match(version, /^\d+\.\d+\.\d+$/);
});

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

test('findPins reads every pin, in run lines and prose alike', () => {
  assert.deepEqual(
    findPins(
      'run: npx bestax-migrate@1.2.3 a\n# `bestax-migrate@^1` "bestax-migrate@latest"'
    ),
    ['1.2.3', '^1', 'latest']
  );
  assert.deepEqual(findPins('bestax-migrate@ alone'), ['']);
  assert.deepEqual(findPins('nothing here'), []);
});

test('topLevelScalars strips one pair of quotes and a trailing comment', () => {
  const yaml = [
    'schema_version: "1.0"',
    'version: "2.24.0" # pinned',
    "name: 'bestax-migrate'",
    'license: MIT',
    '  version: "9.9.9"',
  ].join('\n');
  assert.deepEqual(topLevelScalars(yaml, 'version'), ['2.24.0']);
  assert.deepEqual(topLevelScalars(yaml, 'name'), ['bestax-migrate']);
  assert.deepEqual(topLevelScalars(yaml, 'license'), ['MIT']);
  assert.deepEqual(topLevelScalars(yaml, 'missing'), []);
  assert.deepEqual(topLevelScalars('version: 1\nversion: 2', 'version'), [
    '1',
    '2',
  ]);
});

test('compareVersions orders by number, then a release above its prereleases', () => {
  assert.equal(compareVersions('2.24.0', '2.24.0'), 0);
  assert.equal(compareVersions('2.9.0', '2.10.0'), -1);
  assert.equal(compareVersions('3.0.0', '2.99.99'), 1);
  assert.equal(compareVersions('2.24.1', '2.24.0'), 1);
  assert.equal(compareVersions('2.25.0-rc.1', '2.25.0'), -1);
  assert.equal(compareVersions('2.25.0', '2.25.0-rc.1'), 1);
  assert.equal(compareVersions('2.25.0-rc.1', '2.25.0-rc.2'), -1);
  assert.equal(compareVersions('2.25.0-rc.2', '2.25.0-rc.1'), 1);
});

// ---------------------------------------------------------------------------
// packageProblems
// ---------------------------------------------------------------------------

test('the fixture passes', () => {
  const { version, problems } = packageProblems(fixture());
  assert.equal(version, '2.0.0');
  assert.deepEqual(problems, []);
});

test('a different or missing name is refused', () => {
  const pkg = fixture();
  pkg.manifest = pkg.manifest.replace(
    '"bestax-migrate"',
    '"@x/bestax-migrate"'
  );
  assert.match(problemsOf(pkg).join('\n'), /Trusted Publisher are keyed/);
  pkg.manifest = 'version: "2.0.0"\n';
  assert.match(problemsOf(pkg).join('\n'), /it has none/);
});

test('codemod.yaml needs exactly one valid, plain version', () => {
  const pkg = fixture();
  pkg.manifest = 'name: "bestax-migrate"\n';
  assert.match(problemsOf(pkg).join('\n'), /one top-level version; it has 0/);
  pkg.manifest = 'name: "bestax-migrate"\nversion: "2.0.0"\nversion: "2.0.0"\n';
  assert.match(problemsOf(pkg).join('\n'), /it has 2/);
  pkg.manifest = 'name: "bestax-migrate"\nversion: "two"\n';
  assert.match(problemsOf(pkg).join('\n'), /not a semver version/);
  pkg.manifest = 'name: "bestax-migrate"\nversion: "2.0.0+build.1"\n';
  assert.match(problemsOf(pkg).join('\n'), /build metadata/);
});

test('every pin must be codemod.yaml version exactly', () => {
  for (const pin of ['2.0.1', '^2.0.0', 'latest', '']) {
    const pkg = fixture();
    pkg.texts[1][1] = `run: npx --yes bestax-migrate@${pin} x --dry`;
    const problems = problemsOf(pkg);
    assert.equal(problems.length, 1, pin);
    assert.match(problems[0], /workflows\/preview\.yaml pins/);
  }
});

test('a pin in the README is held to the same version', () => {
  const pkg = fixture();
  pkg.texts[2][1] = 'Runs bestax-migrate@1.0.0.';
  assert.match(problemsOf(pkg).join('\n'), /README\.md pins/);
});

test('a workflow that pins nothing, or no workflow at all, is refused', () => {
  const pkg = fixture();
  pkg.texts[0][1] = 'run: npx --yes bestax-migrate x';
  assert.match(problemsOf(pkg).join('\n'), /workflow\.yaml runs no pinned/);
  pkg.texts = [['README.md', 'no workflows']];
  assert.match(problemsOf(pkg).join('\n'), /no workflow file/);
});

test('a value read from a file cannot add a line to the output', () => {
  // `check` prints problems as ::error:: commands, so a newline from a file
  // would start a workflow command of its own.
  const pkg = fixture();
  pkg.texts[0][1] = 'bestax-migrate@1\n::warning::forged';
  pkg.manifest = 'name: "x\n::notice::forged"\nversion: "2.0.0"\n';
  for (const problem of problemsOf(pkg)) {
    assert.doesNotMatch(problem, /[\r\n]/);
  }
});

test('the workflow rule requires the pins to equal package.json, and says how to fix it', () => {
  const pkg = fixture();
  pkg.npmVersion = '2.1.0';
  const [problem] = problemsOf(pkg);
  assert.match(problem, /names bestax-migrate 2\.0\.0, but .* is at 2\.1\.0/);
  assert.ok(problem.includes(BUMP_COMMAND));
});

test('the PR rule lets the pins trail package.json but never lead it', () => {
  const pkg = fixture();
  pkg.npmVersion = '2.1.0';
  assert.deepEqual(problemsOf(pkg, { requireCurrent: false }), []);
  pkg.npmVersion = '1.9.0';
  assert.match(
    problemsOf(pkg, { requireCurrent: false }).join('\n'),
    /ahead of/
  );
});

test('an unreadable package.json version is reported, not compared', () => {
  const pkg = fixture();
  pkg.npmVersion = undefined;
  assert.match(problemsOf(pkg).join('\n'), /package\.json version/);
});

// ---------------------------------------------------------------------------
// cliProblems
// ---------------------------------------------------------------------------

/** A minimal CLI manifest and lockfile that pass cliProblems. */
function cliFixture() {
  const entry = name => ({
    version: '1.0.0',
    resolved: `https://registry.npmjs.org/${name}/-/${name}-1.0.0.tgz`,
    integrity: 'sha512-AAAA+/==',
  });
  return {
    manifest: { private: true, dependencies: { codemod: '1.0.0' } },
    lock: {
      lockfileVersion: 3,
      packages: {
        '': { dependencies: { codemod: '1.0.0' } },
        'node_modules/codemod': entry('codemod'),
        'node_modules/detect-libc': entry('detect-libc'),
      },
    },
  };
}

const cliProblemsOf = pkg => cliProblems(pkg).problems.join('\n');

test('the CLI fixture passes', () => {
  assert.deepEqual(cliProblems(cliFixture()), {
    version: '1.0.0',
    problems: [],
  });
});

test('the CLI manifest must be private, codemod-only and free of scripts', () => {
  let pkg = cliFixture();
  delete pkg.manifest.private;
  assert.match(cliProblemsOf(pkg), /"private": true/);

  for (const field of ['scripts', 'devDependencies', 'overrides']) {
    pkg = cliFixture();
    pkg.manifest[field] = {};
    assert.match(cliProblemsOf(pkg), new RegExp(`must not have "${field}"`));
  }

  pkg = cliFixture();
  pkg.manifest.dependencies['left-pad'] = '1.0.0';
  assert.match(cliProblemsOf(pkg), /codemod and nothing else/);
  pkg.manifest.dependencies = {};
  assert.match(cliProblemsOf(pkg), /it names nothing/);

  assert.match(
    cliProblems({ manifest: [], lock: {} }).problems[0],
    /not a JSON object/
  );
});

test('the codemod pin must be one exact version, and the lockfile must agree', () => {
  let pkg = cliFixture();
  pkg.manifest.dependencies.codemod = '^1.0.0';
  pkg.lock.packages[''].dependencies.codemod = '^1.0.0';
  assert.match(cliProblemsOf(pkg), /one exact version/);

  pkg = cliFixture();
  pkg.lock.packages[''].dependencies.codemod = '1.0.1';
  assert.match(cliProblemsOf(pkg), /was not written from/);

  pkg = cliFixture();
  pkg.lock.packages['node_modules/codemod'].version = '1.0.1';
  assert.match(cliProblemsOf(pkg), /locks codemod "1\.0\.1", not 1\.0\.0/);

  pkg = cliFixture();
  pkg.lock.lockfileVersion = 2;
  assert.match(cliProblemsOf(pkg), /lockfileVersion 3; it is "2"/);
});

test('every locked package comes from npm with a sha512 integrity and nothing to run', () => {
  const cases = [
    [
      e => (e.resolved = 'https://evil.example/codemod.tgz'),
      /does not resolve/,
    ],
    [e => delete e.resolved, /does not resolve/],
    [e => delete e.integrity, /no sha512 integrity/],
    [e => (e.integrity = 'sha1-abc='), /no sha512 integrity/],
    [e => (e.link = true), /link or declares an install script/],
    [e => (e.hasInstallScript = true), /link or declares an install script/],
  ];
  for (const [mutate, expected] of cases) {
    const pkg = cliFixture();
    mutate(pkg.lock.packages['node_modules/detect-libc']);
    assert.match(cliProblemsOf(pkg), expected);
  }
  const pkg = cliFixture();
  pkg.lock.packages = { '': pkg.lock.packages[''] };
  assert.match(cliProblemsOf(pkg), /locks no packages/);
});

test('a lockfile key cannot add a line to the output', () => {
  const pkg = cliFixture();
  pkg.lock.packages['node_modules/x\n::warning::forged'] = {};
  for (const problem of cliProblems(pkg).problems) {
    assert.doesNotMatch(problem, /[\r\n]/);
  }
});

// ---------------------------------------------------------------------------
// npmProblems
// ---------------------------------------------------------------------------

test('npm serving the version with provenance passes, from one GET', async t => {
  const calls = stubFetch(t, () => new Response(npmDoc(), { status: 200 }));
  assert.deepEqual(await npmProblems('2.0.0', NO_BACKOFF), []);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://registry.npmjs.org/bestax-migrate/2.0.0');
  assert.equal(calls[0].init.method, 'GET');
});

test('a version npm does not have is refused', async t => {
  stubFetch(t, () => new Response('{}', { status: 404 }));
  const [problem] = await npmProblems('2.0.0', NO_BACKOFF);
  assert.match(problem, /npm has no bestax-migrate@2\.0\.0/);
});

test('npm never answering fails closed', async t => {
  const calls = stubFetch(t, () => new Response('', { status: 503 }));
  const [problem] = await npmProblems('2.0.0', NO_BACKOFF);
  assert.match(problem, /Could not ask npm/);
  assert.ok(calls.length > 1, 'a 503 is retried');
});

test("npm's answer must be JSON for the right version, with provenance, not deprecated", async t => {
  const cases = [
    ['not json', /was not JSON/],
    [npmDoc({ version: '2.0.1' }), /answered for/],
    [npmDoc({ dist: {} }), /no SLSA provenance/],
    [
      npmDoc({
        dist: { attestations: { provenance: { predicateType: 'other' } } },
      }),
      /no SLSA provenance/,
    ],
    [npmDoc({ deprecated: 'use 2.0.1' }), /deprecated: "use 2\.0\.1"/],
  ];
  let body;
  stubFetch(t, () => new Response(body, { status: 200 }));
  for (const [text, expected] of cases) {
    body = text;
    assert.match((await npmProblems('2.0.0', NO_BACKOFF)).join('\n'), expected);
  }
});

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

const OIDC_ENV = {
  ACTIONS_ID_TOKEN_REQUEST_URL:
    'https://runner.example/idtoken?api-version=2.0',
  ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'request-bearer',
};

test('the OIDC request keeps the runner query, adds the audience, and sends the bearer', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return new Response(JSON.stringify({ value: 'jwt' }), { status: 200 });
  };
  assert.equal(
    await requestOidcToken(OIDC_ENV, OIDC_AUDIENCE, fetchImpl),
    'jwt'
  );
  const [{ url, init }] = calls;
  assert.equal(url.searchParams.get('api-version'), '2.0');
  assert.equal(url.searchParams.get('audience'), OIDC_AUDIENCE);
  assert.equal(init.headers.Authorization, 'Bearer request-bearer');
});

test('every way the OIDC request can fail throws with a reason', async () => {
  await assert.rejects(
    requestOidcToken({}, OIDC_AUDIENCE, async () => assert.fail('fetched')),
    /id-token: write/
  );
  const cases = [
    [async () => new Response('', { status: 403 }), /answered 403/],
    [
      async () => {
        throw new Error('ECONNREFUSED');
      },
      /request failed: "ECONNREFUSED"/,
    ],
    [async () => new Response('nope', { status: 200 }), /not JSON/],
    [async () => new Response('{}', { status: 200 }), /carried no token/],
  ];
  for (const [fetchImpl, expected] of cases) {
    await assert.rejects(
      requestOidcToken(OIDC_ENV, OIDC_AUDIENCE, fetchImpl),
      expected
    );
  }
});

test('the API key wins over OIDC, and a blank one does not count', async () => {
  const noFetch = async () => assert.fail('fetched');
  assert.deepEqual(
    await chooseCredential({ ...OIDC_ENV, CODEMOD_API_KEY: 'key' }, noFetch),
    { token: 'key', source: 'api-key' }
  );
  const oidc = async () =>
    new Response(JSON.stringify({ value: 'jwt' }), { status: 200 });
  assert.deepEqual(
    await chooseCredential({ ...OIDC_ENV, CODEMOD_API_KEY: '  ' }, oidc),
    { token: 'jwt', source: 'oidc', mask: 'jwt' }
  );
});

test('a key with whitespace around it is refused, not trimmed', async () => {
  const noFetch = async () => assert.fail('fetched');
  for (const key of [' key', 'key ', ' key ']) {
    await assert.rejects(
      chooseCredential({ ...OIDC_ENV, CODEMOD_API_KEY: key }, noFetch),
      /whitespace around it/
    );
  }
});

test('a credential spanning lines is refused, since masking covers one line', async () => {
  await assert.rejects(
    chooseCredential({ CODEMOD_API_KEY: 'a\nb' }),
    /api-key credential spans lines/
  );
  const twoLines = async () =>
    new Response(JSON.stringify({ value: 'j\nwt' }), { status: 200 });
  await assert.rejects(
    chooseCredential(OIDC_ENV, twoLines),
    /oidc credential spans lines/
  );
});

// ---------------------------------------------------------------------------
// publish
// ---------------------------------------------------------------------------

function fakeSpawn(result = { status: 0 }) {
  const calls = [];
  const spawn = (cmd, args, opts) => {
    calls.push({ cmd, args, opts });
    return result;
  };
  return { calls, spawn };
}

test('publish leaves the key to the runner, then runs the CLI without the withheld variables', async () => {
  const { calls, spawn } = fakeSpawn();
  const out = capture();
  const env = { ...OIDC_ENV, CODEMOD_API_KEY: 'sk-sentinel', PATH: '/bin' };
  const code = await publish({
    cli: '/tmp/codemod',
    root: '/repo',
    env,
    spawn,
    log: out.push,
    warn: out.push,
  });
  assert.equal(code, 0);
  assert.ok(
    out.lines.every(line => !line.includes('sk-sentinel')),
    'the key is never written out'
  );
  assert.match(out.lines[0], /::notice::.*delete the secret/);
  const [{ cmd, args, opts }] = calls;
  assert.equal(cmd, '/tmp/codemod');
  assert.deepEqual(args, ['publish', path.join('/repo', PACKAGE_DIR)]);
  assert.equal(opts.env.CODEMOD_AUTH_TOKEN, 'sk-sentinel');
  assert.equal(opts.env.PATH, '/bin');
  for (const name of WITHHELD_FROM_CLI) assert.ok(!(name in opts.env), name);
  assert.equal(opts.timeout, PUBLISH_TIMEOUT_MS);
  assert.equal(
    env.CODEMOD_API_KEY,
    'sk-sentinel',
    'the caller env is left alone'
  );
});

test('publish falls back to OIDC and masks that token too', async () => {
  const { calls, spawn } = fakeSpawn();
  const out = capture();
  const fetchImpl = async () =>
    new Response(JSON.stringify({ value: 'jwt' }), { status: 200 });
  const code = await publish({
    cli: 'codemod',
    env: OIDC_ENV,
    spawn,
    fetchImpl,
    log: out.push,
    warn: out.push,
  });
  assert.equal(code, 0);
  assert.equal(out.lines[0], '::add-mask::jwt');
  assert.equal(calls[0].opts.env.CODEMOD_AUTH_TOKEN, 'jwt');
});

test('no credential means no CLI run', async () => {
  const { calls, spawn } = fakeSpawn();
  const out = capture();
  const code = await publish({
    cli: 'codemod',
    env: {},
    spawn,
    log: out.push,
    warn: out.push,
  });
  assert.equal(code, 1);
  assert.equal(calls.length, 0);
  assert.match(out.lines.join('\n'), /::error::.*no GitHub OIDC context/);
});

test('a failed, timed-out or unstartable CLI is reported with the right exit code', async () => {
  const cases = [
    [{ status: 1 }, 1, /exited 1.*already exists/],
    [{ status: null, signal: 'SIGKILL' }, 1, /exited SIGKILL/],
    [
      { error: Object.assign(new Error('t'), { code: 'ETIMEDOUT' }) },
      1,
      /"ETIMEDOUT"/,
    ],
    [
      { error: Object.assign(new Error('e'), { code: 'ENOENT' }) },
      2,
      /"ENOENT"/,
    ],
  ];
  for (const [result, expected, message] of cases) {
    const { spawn } = fakeSpawn(result);
    const out = capture();
    const code = await publish({
      cli: 'codemod',
      env: { CODEMOD_API_KEY: 'key' },
      spawn,
      log: out.push,
      warn: out.push,
    });
    assert.equal(code, expected);
    assert.match(out.lines.join('\n'), message);
  }
});

// ---------------------------------------------------------------------------
// bump
// ---------------------------------------------------------------------------

test('bump moves codemod.yaml and every pin to package.json, and only those', () => {
  const root = tempRepo('2.99.0');
  const pkgDir = path.join(root, PACKAGE_DIR);
  const before = fs.readFileSync(path.join(pkgDir, 'workflow.yaml'), 'utf8');

  assert.deepEqual(bump(root), [
    'codemod.yaml',
    'workflow.yaml',
    'workflows/preview.yaml',
  ]);
  const pkg = readPackage(root);
  assert.deepEqual(topLevelScalars(pkg.manifest, 'version'), ['2.99.0']);
  assert.deepEqual(topLevelScalars(pkg.manifest, 'schema_version'), ['1.0']);
  assert.deepEqual(problemsOf(pkg, { requireCurrent: true }), []);

  const after = fs.readFileSync(path.join(pkgDir, 'workflow.yaml'), 'utf8');
  assert.equal(
    after,
    before.replace(/bestax-migrate@[\d.]+/g, 'bestax-migrate@2.99.0'),
    'nothing but the pins changed'
  );
  assert.deepEqual(bump(root), [], 'a second run changes nothing');
});

test('bump refuses a package.json version that is not one', () => {
  const root = tempRepo('next');
  assert.throws(() => bump(root), /not a semver version/);
});

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

test('check passes on agreeing files and npm provenance', async t => {
  stubFetch(
    t,
    () => new Response(npmDoc({ version: '2.24.0' }), { status: 200 })
  );
  const root = tempRepo('2.24.0');
  bump(root);
  const out = capture();
  const code = await main(['check'], {
    root,
    log: out.push,
    warn: out.push,
    fetchOptions: NO_BACKOFF,
  });
  assert.equal(code, 0, out.lines.join('\n'));
  assert.match(out.lines[0], /npm serves it with provenance/);
  assert.match(out.lines[0], /locks codemod \d+\.\d+\.\d+\.$/);
});

test('check fails, before npm, when the CLI lockfile is missing', async t => {
  const calls = stubFetch(t, () => assert.fail('fetched'));
  const root = tempRepo('2.24.0');
  bump(root);
  fs.rmSync(path.join(root, CLI_DIR, 'package-lock.json'));
  const out = capture();
  const code = await main(['check'], { root, log: out.push, warn: out.push });
  assert.equal(code, 1);
  assert.equal(calls.length, 0);
  assert.match(
    out.lines.join('\n'),
    /::error::\.github\/codemod-cli could not be read/
  );
});

test('check prints each problem as an error annotation and skips npm when the files are wrong', async t => {
  const calls = stubFetch(t, () => assert.fail('fetched'));
  const root = tempRepo('2.99.0');
  const out = capture();
  const code = await main(['check'], { root, log: out.push, warn: out.push });
  assert.equal(code, 1);
  assert.equal(calls.length, 0);
  assert.ok(out.lines.length > 0);
  for (const line of out.lines) assert.match(line, /^::error::/);
});

test('check fails when npm does', async t => {
  stubFetch(t, () => new Response('{}', { status: 404 }));
  const root = tempRepo('2.24.0');
  bump(root);
  const out = capture();
  const code = await main(['check'], {
    root,
    log: out.push,
    warn: out.push,
    fetchOptions: NO_BACKOFF,
  });
  assert.equal(code, 1);
  assert.match(out.lines.join('\n'), /::error::npm has no/);
});

test('check --offline stops before npm', async t => {
  const calls = stubFetch(t, () => assert.fail('fetched'));
  const root = tempRepo('2.24.0');
  bump(root);
  const out = capture();
  const code = await main(['check', '--offline'], {
    root,
    log: out.push,
    warn: out.push,
  });
  assert.equal(code, 0);
  assert.equal(calls.length, 0);
  assert.doesNotMatch(out.lines[0], /npm serves/);
});

test('publish and bump run through main', async () => {
  const { calls, spawn } = fakeSpawn();
  const out = capture();
  const code = await main(['publish', '--cli', '/x/codemod'], {
    root: '/repo',
    env: { CODEMOD_API_KEY: 'key' },
    spawn,
    log: out.push,
    warn: out.push,
  });
  assert.equal(code, 0);
  assert.equal(calls[0].cmd, '/x/codemod');

  const root = tempRepo('2.99.0');
  assert.equal(await main(['bump'], { root, log: out.push }), 0);
  assert.match(out.lines.at(-1), /^Rewrote /);
  assert.equal(await main(['bump'], { root, log: out.push }), 0);
  assert.match(out.lines.at(-1), /already names/);
});

test('anything else prints usage and exits 2', async () => {
  for (const argv of [
    [],
    ['nope'],
    ['check', '--online'],
    ['publish'],
    ['publish', '--cli'],
    ['bump', 'extra'],
  ]) {
    const out = capture();
    assert.equal(await main(argv, { warn: out.push }), 2, argv.join(' '));
    assert.match(out.lines[0], /^Usage:/);
  }
});
