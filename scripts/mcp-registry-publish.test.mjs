/**
 * Guards on mcp-registry-publish.mjs, the logic behind
 * .github/workflows/mcp-registry.yml.
 *
 * That workflow runs on `release` and `workflow_dispatch` only, so no PR
 * exercises it and the publish path fires for real only after a release has
 * already gone to npm. These tests are the coverage it gets before then, and
 * the first group runs against the COMMITTED bestax-mcp/server.json and
 * package.json, so a mistake in either file fails a PR instead of a release.
 *
 * Nothing here reaches the network or spawns anything: fetch, the publisher,
 * the clock and the wait are all injected, so the whole retry budget costs no
 * time and the assertions are about what the policy spends, not about how
 * long it takes.
 *
 * `.mjs` and `node --test` rather than jest, matching the other root scripts.
 */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BUDGET_SECONDS,
  DESCRIPTION_MAX,
  LOGIN_ARGS,
  NPM_REGISTRY,
  REGISTRY_URL,
  SLEEP_SECONDS,
  VERSION_PLACEHOLDER,
  ATTEMPT_TIMEOUT_MS,
  LOOKUP_TIMEOUT_MS,
  checkServer,
  main,
  parseArgs,
  prepare,
  publishArgs,
  publishWithRetry,
  readPrepared,
  registryHasVersion,
  runPublisher,
  stampVersion,
  versionFromTag,
  versionUrl,
} from './mcp-registry-publish.mjs';
import { DEFAULT_BUDGET_SECONDS } from './npm-install-retry.mjs';
import {
  yamlGet,
  yamlItems,
  yamlMap,
  yamlScalar,
} from './check-conformance.mjs';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pkgDir = path.join(repoRoot, 'bestax-mcp');
const committedServer = () =>
  JSON.parse(fs.readFileSync(path.join(pkgDir, 'server.json'), 'utf8'));
const committedManifest = () =>
  JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));

// A minimal pair that passes checkServer, for the cases that break one field.
function fixture() {
  return {
    manifest: { name: 'pkg', version: '1.0.0', mcpName: 'io.github.o/pkg' },
    server: {
      name: 'io.github.o/pkg',
      description: 'A server',
      version: VERSION_PLACEHOLDER,
      packages: [
        {
          registryType: 'npm',
          identifier: 'pkg',
          version: VERSION_PLACEHOLDER,
          transport: { type: 'stdio' },
        },
      ],
    },
  };
}

const tempDirs = [];
after(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

function tempPackage(server, manifest) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-registry-'));
  tempDirs.push(dir);
  fs.writeFileSync(path.join(dir, 'server.json'), JSON.stringify(server));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(manifest));
  return dir;
}

// ---------------------------------------------------------------------------
// The committed files
// ---------------------------------------------------------------------------

test('the committed server.json and package.json pass every offline check', () => {
  assert.doesNotThrow(() =>
    checkServer(committedServer(), committedManifest())
  );
});

test('the committed server.json carries the placeholder in both version fields', () => {
  // A real version here would be stale from the next release on, because
  // semantic-release bumps package.json and nothing else. `prepare` writes
  // the release version in the runner; the committed file never carries one.
  const server = committedServer();
  assert.equal(server.version, VERSION_PLACEHOLDER);
  assert.equal(server.packages[0].version, VERSION_PLACEHOLDER);
});

test('the committed name is in the namespace GitHub OIDC grants this repository', () => {
  // The registry's github-oidc exchange grants io.github.<repository_owner>/*
  // and nothing else, so a name outside it fails with 403 at publish time.
  assert.match(committedServer().name, /^io\.github\.allxsmith\//);
});

test('the committed server.json names a $schema', () => {
  assert.match(
    committedServer().$schema,
    /^https:\/\/static\.modelcontextprotocol\.io\/schemas\/\d{4}-\d{2}-\d{2}\/server\.schema\.json$/
  );
});

// ---------------------------------------------------------------------------
// checkServer
// ---------------------------------------------------------------------------

test('a server name that differs from mcpName is refused', () => {
  const { server, manifest } = fixture();
  manifest.mcpName = 'io.github.o/other';
  assert.throws(() => checkServer(server, manifest), /does not match/);
});

test('a package.json without mcpName is refused, and says why it matters', () => {
  const { server, manifest } = fixture();
  delete manifest.mcpName;
  assert.throws(() => checkServer(server, manifest), /prove ownership/);
});

test('the description limit is the schema maxLength, counted in characters', () => {
  const { server, manifest } = fixture();
  assert.equal(DESCRIPTION_MAX, 100);
  server.description = 'x'.repeat(100);
  assert.doesNotThrow(() => checkServer(server, manifest));
  server.description = 'x'.repeat(101);
  assert.throws(() => checkServer(server, manifest), /has 101/);
  // Code points, as JSON Schema counts them, not UTF-16 units.
  server.description = '\u{1F600}'.repeat(100);
  assert.doesNotThrow(() => checkServer(server, manifest));
  server.description = '';
  assert.throws(() => checkServer(server, manifest), /has 0/);
});

test('anything other than exactly one npm package for this manifest is refused', () => {
  const cases = [
    s => (s.packages = []),
    s => s.packages.push({ ...s.packages[0] }),
    s => (s.packages[0].registryType = 'pypi'),
    s => (s.packages[0].identifier = 'someone-else'),
    s => (s.packages[0].transport = { type: 'streamable-http' }),
    s => (s.packages[0].registryBaseUrl = 'https://npm.example.com'),
    s => delete s.packages,
  ];
  for (const breakIt of cases) {
    const { server, manifest } = fixture();
    breakIt(server);
    assert.throws(() => checkServer(server, manifest), undefined, `${breakIt}`);
  }
});

test('the default npm registry may be spelled out', () => {
  const { server, manifest } = fixture();
  server.packages[0].registryBaseUrl = NPM_REGISTRY;
  assert.doesNotThrow(() => checkServer(server, manifest));
});

test('a name outside the registry grammar is refused without echoing it raw', () => {
  const { server, manifest } = fixture();
  server.name = manifest.mcpName = 'io.github.o/pkg\n::error::forged';
  assert.throws(
    () => checkServer(server, manifest),
    err =>
      !err.message.includes('\n') && /not a registry name/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// The tag
// ---------------------------------------------------------------------------

test('a release tag yields its version', () => {
  assert.equal(versionFromTag('bestax-mcp@1.14.0', 'bestax-mcp'), '1.14.0');
});

test('a tag for another package, or no tag at all, is refused', () => {
  for (const tag of [
    'create-bestax@4.0.0',
    '@allxsmith/bestax-bulma@5.18.2',
    'bestax-mcp',
    'bestax-mcp@',
    '@1.0.0',
    '',
    undefined,
  ]) {
    assert.throws(() => versionFromTag(tag, 'bestax-mcp'), /release tag/);
  }
});

test('a tag whose version is not semver is refused', () => {
  for (const tag of [
    'bestax-mcp@1.2',
    'bestax-mcp@01.2.3',
    'bestax-mcp@v1.2.3',
  ]) {
    assert.throws(() => versionFromTag(tag, 'bestax-mcp'));
  }
});

test('a crafted tag cannot put a line break into the log', () => {
  assert.throws(
    () => versionFromTag('bestax-mcp@1.0.0\n::error::forged', 'bestax-mcp'),
    err => !err.message.includes('\n')
  );
});

// ---------------------------------------------------------------------------
// prepare and readPrepared
// ---------------------------------------------------------------------------

test('stampVersion writes both fields and leaves its input alone', () => {
  const { server } = fixture();
  const stamped = stampVersion(server, '2.3.4');
  assert.equal(stamped.version, '2.3.4');
  assert.equal(stamped.packages[0].version, '2.3.4');
  assert.equal(server.version, VERSION_PLACEHOLDER);
  assert.equal(server.packages[0].version, VERSION_PLACEHOLDER);
});

test('prepare stamps the committed server.json and changes nothing else', () => {
  const server = committedServer();
  const dir = tempPackage(server, committedManifest());
  const logs = [];
  const result = prepare({
    tag: 'bestax-mcp@1.14.0',
    dir,
    log: line => logs.push(line),
  });
  assert.deepEqual(result, { name: server.name, version: '1.14.0' });
  const written = JSON.parse(
    fs.readFileSync(path.join(dir, 'server.json'), 'utf8')
  );
  assert.deepEqual(written, stampVersion(server, '1.14.0'));
  // The log carries the document that will be sent.
  assert.match(logs.join('\n'), /"version": "1\.14\.0"/);
});

test('prepare checks the files before it trusts the tag', () => {
  const { server, manifest } = fixture();
  delete manifest.mcpName;
  const dir = tempPackage(server, manifest);
  assert.throws(
    () => prepare({ tag: 'pkg@1.0.0', dir, log: () => {} }),
    /mcpName/
  );
  // Nothing was written over the committed copy.
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(dir, 'server.json'), 'utf8')).version,
    VERSION_PLACEHOLDER
  );
});

test('readPrepared refuses a file prepare has not stamped', () => {
  const { server, manifest } = fixture();
  const dir = tempPackage(server, manifest);
  assert.throws(
    () => readPrepared(path.join(dir, 'server.json')),
    /placeholder/
  );
});

test('readPrepared refuses version fields that disagree', () => {
  const { server, manifest } = fixture();
  const stamped = stampVersion(server, '1.0.0');
  stamped.packages[0].version = '1.0.1';
  const dir = tempPackage(stamped, manifest);
  assert.throws(
    () => readPrepared(path.join(dir, 'server.json')),
    /but version/
  );
});

test('readPrepared returns what the publish step needs', () => {
  const { server, manifest } = fixture();
  const dir = tempPackage(stampVersion(server, '1.0.0'), manifest);
  assert.deepEqual(readPrepared(path.join(dir, 'server.json')), {
    name: 'io.github.o/pkg',
    version: '1.0.0',
    identifier: 'pkg',
  });
});

// ---------------------------------------------------------------------------
// The existence check
// ---------------------------------------------------------------------------

test('the detail URL encodes the slash in the name and asks for deleted versions too', () => {
  assert.equal(
    versionUrl('io.github.allxsmith/bestax-mcp', '1.14.0'),
    `${REGISTRY_URL}/v0.1/servers/io.github.allxsmith%2Fbestax-mcp/versions/1.14.0?include_deleted=true`
  );
});

function respond(status, body) {
  return async url => {
    respond.lastUrl = url;
    return {
      status,
      json: async () => {
        if (body instanceof Error) throw body;
        return body;
      },
    };
  };
}

test('registryHasVersion reads 404 as no and a matching 200 as yes', async () => {
  assert.equal(await registryHasVersion('a/b', '1.0.0', respond(404)), 'no');
  assert.equal(
    await registryHasVersion(
      'a/b',
      '1.0.0',
      respond(200, { server: { name: 'a/b', version: '1.0.0' } })
    ),
    'yes'
  );
  assert.equal(respond.lastUrl, versionUrl('a/b', '1.0.0'));
});

test('registryHasVersion reads anything unclear as unknown, never yes', async () => {
  const unclear = [
    respond(200, { server: { name: 'a/other', version: '1.0.0' } }),
    respond(200, { server: { name: 'a/b', version: '1.0.1' } }),
    respond(200, new SyntaxError('not json')),
    respond(500),
    respond(429),
    async () => {
      throw new TypeError('fetch failed');
    },
  ];
  for (const fetchImpl of unclear) {
    assert.equal(
      await registryHasVersion('a/b', '1.0.0', fetchImpl),
      'unknown'
    );
  }
});

// ---------------------------------------------------------------------------
// The retry policy
// ---------------------------------------------------------------------------

// A clock that only moves when the policy sleeps.
function harness({
  existsAt = () => 'no',
  succeedOnAttempt = Infinity,
  budgetSeconds = 120,
  sleepSeconds = 30,
}) {
  const state = { t: 0, attempts: 0, checks: 0, sleeps: [], logs: [] };
  return {
    state,
    promise: publishWithRetry({
      exists: async () => existsAt(state.checks++, state),
      attempt: async () => {
        state.attempts += 1;
        return state.attempts >= succeedOnAttempt;
      },
      budgetSeconds,
      sleepSeconds,
      now: () => state.t,
      sleep: async ms => {
        state.sleeps.push(ms);
        state.t += ms;
      },
      log: line => state.logs.push(line),
    }),
  };
}

test('a version already in the registry is not published again', async () => {
  const h = harness({ existsAt: () => 'yes' });
  assert.deepEqual(await h.promise, {
    ok: true,
    outcome: 'present',
    attempts: 0,
    waited: 0,
  });
  assert.equal(h.state.attempts, 0);
});

test('an unknown answer from the check still lets the attempt run', async () => {
  const h = harness({ existsAt: () => 'unknown', succeedOnAttempt: 1 });
  assert.equal((await h.promise).outcome, 'published');
});

test('a first-time publish costs one attempt and no wait', async () => {
  const h = harness({ succeedOnAttempt: 1 });
  assert.deepEqual(await h.promise, {
    ok: true,
    outcome: 'published',
    attempts: 1,
    waited: 0,
  });
  assert.deepEqual(h.state.sleeps, []);
  assert.deepEqual(h.state.logs, []);
});

test('npm catching up mid-wait is published, not abandoned', async () => {
  const h = harness({ succeedOnAttempt: 3 });
  const result = await h.promise;
  assert.equal(result.outcome, 'published');
  assert.equal(result.attempts, 3);
  assert.deepEqual(h.state.sleeps, [30_000, 30_000]);
  assert.equal(h.state.logs.length, 2);
});

test('the budget is spent and no wait ends past the deadline', async () => {
  const h = harness({ budgetSeconds: 120, sleepSeconds: 30 });
  const result = await h.promise;
  assert.equal(result.ok, false);
  assert.equal(result.outcome, 'exhausted');
  // Attempts at 0, 30, 60, 90 and 120 seconds; a sixth wait would end at 150.
  assert.equal(result.attempts, 5);
  assert.equal(h.state.t, 120_000);
});

test('a budget shorter than one interval still buys an attempt', async () => {
  const h = harness({ budgetSeconds: 5, sleepSeconds: 30 });
  assert.equal((await h.promise).attempts, 1);
  assert.deepEqual(h.state.sleeps, []);
});

test('an attempt that landed with its response lost is a success', async () => {
  // Attempts at 0, 30 and 60 seconds each report failure, and the checks
  // before them say no. Only the last look, after the final attempt, says
  // yes: that look is what turns this into exit 0 rather than a red job.
  const h = harness({
    budgetSeconds: 60,
    existsAt: n => (n === 3 ? 'yes' : 'no'),
  });
  const result = await h.promise;
  assert.equal(result.ok, true);
  assert.equal(result.outcome, 'present');
  assert.equal(result.attempts, 3);
  assert.equal(h.state.checks, 4);
});

test('without that last look the same run is exhausted', async () => {
  const h = harness({ budgetSeconds: 60 });
  const result = await h.promise;
  assert.equal(result.outcome, 'exhausted');
  assert.equal(result.attempts, 3);
  assert.equal(h.state.checks, 4);
});

test('a concurrent run publishing first ends this one cleanly', async () => {
  const h = harness({ existsAt: n => (n >= 2 ? 'yes' : 'no') });
  const result = await h.promise;
  assert.equal(result.outcome, 'present');
  assert.equal(result.attempts, 2);
});

// ---------------------------------------------------------------------------
// The publisher subprocess
// ---------------------------------------------------------------------------

test('login names the registry it mints its audience for, and publish takes the path', () => {
  assert.deepEqual(LOGIN_ARGS, [
    'login',
    'github-oidc',
    '--registry',
    'https://registry.modelcontextprotocol.io',
  ]);
  assert.equal(REGISTRY_URL, 'https://registry.modelcontextprotocol.io');
  assert.deepEqual(publishArgs('bestax-mcp/server.json'), [
    'publish',
    'bestax-mcp/server.json',
  ]);
});

test('runPublisher passes an argv array and a timeout, and reads the exit status', () => {
  const calls = [];
  const spawn = (cmd, args, opts) => {
    calls.push({ cmd, args, opts });
    return { status: calls.length === 1 ? 0 : 1 };
  };
  assert.equal(
    runPublisher('/bin/pub', ['a', 'b'], spawn, () => {}),
    true
  );
  assert.equal(
    runPublisher('/bin/pub', ['a'], spawn, () => {}),
    false
  );
  assert.deepEqual(calls[0].args, ['a', 'b']);
  assert.equal(calls[0].opts.stdio, 'inherit');
  assert.equal(calls[0].opts.timeout, ATTEMPT_TIMEOUT_MS);
  assert.equal(calls[0].opts.shell, undefined);
});

test('a publisher that cannot start is fatal; one that timed out is retried', () => {
  const failWith = code => () => ({
    error: Object.assign(new Error(code), { code }),
  });
  assert.throws(
    () => runPublisher('/bin/pub', [], failWith('ENOENT'), () => {}),
    /could not run/
  );
  const logs = [];
  assert.equal(
    runPublisher('/bin/pub', [], failWith('ETIMEDOUT'), line =>
      logs.push(line)
    ),
    false
  );
  assert.match(logs[0], /ETIMEDOUT/);
});

// ---------------------------------------------------------------------------
// The CLI
// ---------------------------------------------------------------------------

test('the propagation budget is the one consumer-sbom uses', () => {
  assert.equal(BUDGET_SECONDS, DEFAULT_BUDGET_SECONDS);
  assert.equal(SLEEP_SECONDS, 30);
});

test('parseArgs requires every flag and rejects unknown ones', () => {
  assert.deepEqual(parseArgs(['prepare', '--tag', 't', '--dir', 'd']), {
    mode: 'prepare',
    tag: 't',
    dir: 'd',
  });
  for (const argv of [
    [],
    ['deploy'],
    ['prepare', '--tag', 't'],
    ['prepare', '--tag', 't', '--dir', 'd', '--dri', 'x'],
    ['publish', '--server-json', 's'],
    ['publish', '--server-json', 's', '--publisher'],
    ['publish', 'server.json'],
  ]) {
    assert.throws(() => parseArgs(argv), undefined, argv.join(' '));
  }
});

test('a usage error exits 2', async () => {
  const logs = [];
  assert.equal(await main(['prepare'], { log: l => logs.push(l) }), 2);
  assert.match(logs[0], /^::error::/);
});

test('main prepares, then logs in and publishes with the same binary, in order', async () => {
  const { server, manifest } = fixture();
  const dir = tempPackage(server, manifest);
  const log = () => {};
  assert.equal(
    await main(['prepare', '--tag', 'pkg@3.1.0', '--dir', dir], { log }),
    0
  );

  const serverJson = path.join(dir, 'server.json');
  const calls = [];
  const fetches = [];
  const code = await main(
    ['publish', '--server-json', serverJson, '--publisher', '/bin/pub'],
    {
      log,
      fetch: async url => {
        fetches.push(url);
        return { status: 404, json: async () => ({}) };
      },
      spawn: (cmd, args) => {
        calls.push([cmd, ...args]);
        return { status: 0 };
      },
    }
  );
  assert.equal(code, 0);
  assert.deepEqual(calls, [
    ['/bin/pub', ...LOGIN_ARGS],
    ['/bin/pub', 'publish', serverJson],
  ]);
  assert.deepEqual(fetches, [versionUrl('io.github.o/pkg', '3.1.0')]);
});

test('a failed login skips the publish for that attempt', async () => {
  const { server, manifest } = fixture();
  const dir = tempPackage(stampVersion(server, '1.0.0'), manifest);
  const calls = [];
  let t = 0;
  const code = await main(
    [
      'publish',
      '--server-json',
      path.join(dir, 'server.json'),
      '--publisher',
      '/bin/pub',
    ],
    {
      log: () => {},
      fetch: async () => ({ status: 404, json: async () => ({}) }),
      spawn: (cmd, args) => {
        calls.push(args[0]);
        return { status: 1 };
      },
      now: () => t,
      sleep: async ms => {
        t += ms;
      },
    }
  );
  assert.equal(code, 1);
  assert.ok(calls.length > 1);
  assert.ok(calls.every(c => c === 'login'));
});

test('a version already listed exits 0 with a notice and runs nothing', async () => {
  const { server, manifest } = fixture();
  const dir = tempPackage(stampVersion(server, '1.0.0'), manifest);
  const logs = [];
  const code = await main(
    [
      'publish',
      '--server-json',
      path.join(dir, 'server.json'),
      '--publisher',
      '/bin/pub',
    ],
    {
      log: l => logs.push(l),
      fetch: async () => ({
        status: 200,
        json: async () => ({
          server: { name: 'io.github.o/pkg', version: '1.0.0' },
        }),
      }),
      spawn: () => assert.fail('nothing should be spawned'),
    }
  );
  assert.equal(code, 0);
  assert.match(logs.join('\n'), /^::notice::.*already in the MCP Registry/m);
});

test('an exhausted budget exits 1 and says where to look', async () => {
  const { server, manifest } = fixture();
  const dir = tempPackage(stampVersion(server, '1.0.0'), manifest);
  const logs = [];
  let t = 0;
  const code = await main(
    [
      'publish',
      '--server-json',
      path.join(dir, 'server.json'),
      '--publisher',
      '/bin/pub',
    ],
    {
      log: l => logs.push(l),
      fetch: async () => ({ status: 404, json: async () => ({}) }),
      spawn: () => ({ status: 1 }),
      now: () => t,
      sleep: async ms => {
        t += ms;
      },
    }
  );
  assert.equal(code, 1);
  const last = logs.at(-1);
  assert.match(last, /^::error::/);
  assert.match(last, /"pkg@1\.0\.0"/);
  assert.match(last, /dispatch this workflow with the same tag/);
});

test('a publisher binary that is missing exits 2, not 1', async () => {
  const { server, manifest } = fixture();
  const dir = tempPackage(stampVersion(server, '1.0.0'), manifest);
  const code = await main(
    [
      'publish',
      '--server-json',
      path.join(dir, 'server.json'),
      '--publisher',
      '/nope',
    ],
    {
      log: () => {},
      fetch: async () => ({ status: 404, json: async () => ({}) }),
      spawn: () => ({
        error: Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' }),
      }),
    }
  );
  assert.equal(code, 2);
});

// ---------------------------------------------------------------------------
// The job's timeout
// ---------------------------------------------------------------------------

const WORKFLOW = path.join(repoRoot, '.github/workflows/mcp-registry.yml');

/** The step that runs this script, bounded by its budget instead. */
const PUBLISH_STEP = 'Publish';

// Unit conversions, so every sum below is in seconds.
const fromMs = ms => ms / 1000;
const fromMinutes = minutes => minutes * 60;

/**
 * Runner setup and teardown: Set up job, the actions' pre and post hooks
 * (harden-runner installs its agent in one and prints its log in another),
 * and Complete job. No step's timeout-minutes is documented to cover these,
 * so they get a margin instead.
 */
const RUNNER_MARGIN_SECONDS = fromMinutes(3);

/** A positive whole number of minutes, or null when unset or not one. */
function minutesOf(entry) {
  const value = Number(yamlScalar(entry));
  return Number.isInteger(value) && value > 0 ? value : null;
}

/** The publish job's timeout-minutes, and each step's name and its own. */
function readPublishJob() {
  const lines = fs.readFileSync(WORKFLOW, 'utf8').split(/\r?\n/);
  const job = yamlGet(lines, 'jobs', 'publish');
  assert.ok(job, 'mcp-registry.yml has no publish job');
  const steps = yamlItems(yamlGet(job.lines, 'steps')?.lines ?? []);
  return {
    timeout: minutesOf(yamlGet(job.lines, 'timeout-minutes')),
    steps: steps.map(yamlMap).map(step => ({
      name: yamlScalar(step.get('name')),
      timeout: minutesOf(step.get('timeout-minutes')),
    })),
  };
}

test('the publish job timeout covers every step at its slowest', () => {
  const job = readPublishJob();
  assert.ok(job.timeout, 'mcp-registry.yml has no timeout-minutes on publish');
  assert.ok(
    job.steps.some(step => step.name === PUBLISH_STEP),
    `mcp-registry.yml has no "${PUBLISH_STEP}" step`
  );

  // Every other step is cut off at its own timeout-minutes, so their sum is
  // a bound, provided each has one.
  const others = job.steps.filter(step => step.name !== PUBLISH_STEP);
  const unbounded = others.filter(step => !step.timeout).map(step => step.name);
  assert.deepEqual(
    unbounded,
    [],
    `give each of these steps a timeout-minutes: ${unbounded.join(', ')}`
  );
  const stepsSeconds = others.reduce(
    (sum, step) => sum + fromMinutes(step.timeout),
    0
  );

  // publishWithRetry reads its deadline only between attempts and starts no
  // wait that would end past it, so every wait, and every pass before the
  // last, ends by the deadline: the budget covers them. The last pass can
  // begin as late as the deadline itself and then runs to the end, each step
  // bounded by its own timeout.
  const lastPassSeconds =
    fromMs(LOOKUP_TIMEOUT_MS) + // the existence check before the attempt
    fromMs(ATTEMPT_TIMEOUT_MS) + // the attempt's login
    fromMs(ATTEMPT_TIMEOUT_MS) + // the attempt's publish
    fromMs(LOOKUP_TIMEOUT_MS); // the last look before giving up
  const publishSeconds = BUDGET_SECONDS + lastPassSeconds;

  const worstCaseSeconds =
    RUNNER_MARGIN_SECONDS + stepsSeconds + publishSeconds;
  const timeoutSeconds = fromMinutes(job.timeout);
  assert.ok(
    worstCaseSeconds <= timeoutSeconds,
    `the publish job can need ${worstCaseSeconds}s (runner ` +
      `${RUNNER_MARGIN_SECONDS}s, other steps ${stepsSeconds}s, ` +
      `${PUBLISH_STEP} ${publishSeconds}s: budget ${BUDGET_SECONDS}s and ` +
      `last pass ${lastPassSeconds}s) but its timeout-minutes allows ` +
      `${timeoutSeconds}s. Raise the job's timeout-minutes in ` +
      `mcp-registry.yml, or give this script a budget of its own.`
  );
});
