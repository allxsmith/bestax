/**
 * Tests for the provenance-contents verifier (#526).
 *
 * The whole value of this script is that it FAILS when an attestation says the
 * wrong thing, so most of these are negative controls: mutate one field of a
 * known-good statement and assert that exactly that field is reported. A suite
 * that only proved the happy path would not distinguish this script from one
 * that returns 0 unconditionally.
 *
 * Fixtures are shaped from a real response — the payload below is the same
 * structure `registry.npmjs.org/-/npm/v1/attestations/bestax-migrate@2.0.0`
 * returns, including the purl percent-encoding of the npm scope.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  parseArgs,
  packagesInTree,
  STATEMENT_TYPE,
  installedVersion,
  installedDigest,
  extractProvenance,
  checkStatement,
  samePurl,
  attestationUrl,
  verifyPackage,
  main,
  releaseUnderTest,
  checkRelease,
  SLSA_PREDICATE,
  EXPECTED,
  ATTESTATION_BACKOFF_MS,
  RELEASE_ATTESTATION_RETRY,
} from './verify-attestation.mjs';
import {
  DEFAULT_BUDGET_SECONDS,
  DEFAULT_SLEEP_SECONDS,
} from './npm-install-retry.mjs';
import { DEFAULT_ATTEMPTS } from './lib/fetch-retry.mjs';

const NO_WAIT = { backoffMs: [0, 0] };

const DIGEST = 'a'.repeat(128);
const INTEGRITY = `sha512-${Buffer.from(DIGEST, 'hex').toString('base64')}`;

/** A statement that should pass every check. */
function goodStatement({ pkg = 'bestax-migrate', version = '2.0.0' } = {}) {
  return {
    _type: STATEMENT_TYPE,
    predicateType: SLSA_PREDICATE,
    subject: [
      { name: `pkg:npm/${pkg}@${version}`, digest: { sha512: DIGEST } },
    ],
    predicate: {
      buildDefinition: {
        externalParameters: {
          workflow: {
            ref: EXPECTED.ref,
            repository: EXPECTED.repository,
            path: EXPECTED.workflowPath,
          },
        },
        internalParameters: {
          github: {
            event_name: 'push',
            repository_id: EXPECTED.repositoryId,
            repository_owner_id: EXPECTED.repositoryOwnerId,
          },
        },
        resolvedDependencies: [
          {
            uri: `git+https://github.com/allxsmith/bestax@${EXPECTED.ref}`,
            digest: { gitCommit: 'a'.repeat(40) },
          },
        ],
      },
      runDetails: {
        builder: { id: EXPECTED.builder },
        metadata: {
          invocationId: `${EXPECTED.invocationIdPrefix}123/attempts/1`,
        },
      },
    },
  };
}

/** The registry response shape: npm's publish attestation plus the SLSA one. */
function registryResponse(statement) {
  return JSON.stringify({
    attestations: [
      {
        predicateType:
          'https://github.com/npm/attestation/tree/main/specs/publish/v0.1',
        bundle: { dsseEnvelope: { payload: 'ignored' } },
      },
      {
        predicateType: SLSA_PREDICATE,
        bundle: {
          dsseEnvelope: {
            payload: Buffer.from(JSON.stringify(statement)).toString('base64'),
          },
        },
      },
    ],
  });
}

async function fixtureTree({ pkg = 'bestax-migrate', version = '2.0.0' } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'attest-'));
  await mkdir(join(dir, 'node_modules', ...pkg.split('/')), {
    recursive: true,
  });
  await writeFile(
    join(dir, 'node_modules', ...pkg.split('/'), 'package.json'),
    JSON.stringify({ name: pkg, version })
  );
  await writeFile(
    join(dir, 'package-lock.json'),
    JSON.stringify({
      packages: { [`node_modules/${pkg}`]: { version, integrity: INTEGRITY } },
    })
  );
  return dir;
}

function stubFetch(handler) {
  const real = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method });
    const r = handler(String(url));
    if (r.throw) throw new Error(r.throw);
    return {
      status: r.status ?? 200,
      statusText: r.statusText ?? '',
      headers: { get: () => null },
      text: async () => r.body ?? '',
    };
  };
  return {
    calls,
    restore: () => {
      globalThis.fetch = real;
    },
  };
}

/**
 * Collect what main() prints, for the rest of the calling test.
 *
 * Its failures are `::error::` workflow commands. Left on the real console, a
 * runner files each one as a failure annotation against a green test run
 * (#723), so a test that drives one captures the lines and asserts on them
 * instead.
 */
function captureConsole(t) {
  const lines = [];
  const push = (...args) => lines.push(args.join(' '));
  t.mock.method(console, 'log', push);
  t.mock.method(console, 'error', push);
  return lines;
}

// --- argument parsing -------------------------------------------------------

test('parseArgs takes --dir, --event and --release in both spellings plus the package list', () => {
  assert.deepEqual(
    parseArgs([
      '--dir',
      '/t',
      '--event',
      'release',
      '--release',
      'a@1.0.0',
      'a',
      'b',
    ]),
    {
      dir: '/t',
      packages: ['a', 'b'],
      event: 'release',
      release: 'a@1.0.0',
      printSpec: false,
      awaitAttestation: false,
    }
  );
  assert.deepEqual(
    parseArgs([
      '--dir=/t',
      '--event=schedule',
      '--release=',
      '--print-spec',
      'a',
    ]),
    {
      dir: '/t',
      packages: ['a'],
      event: 'schedule',
      release: '',
      printSpec: true,
      awaitAttestation: false,
    }
  );
  assert.equal(
    parseArgs([
      '--dir=/t',
      '--event=release',
      '--release=a@1.0.0',
      '--await-attestation',
    ]).awaitAttestation,
    true
  );
});

test('parseArgs requires --dir and rejects unknown options', () => {
  assert.throws(
    () => parseArgs(['--event', 'schedule', '--release', '', 'a', 'b']),
    /--dir/
  );
  // A typo must be a usage error, not a package named "--dirs" that then
  // fails verification for a package that never existed.
  assert.throws(() => parseArgs(['--dirs', '/t', 'a']), /unknown option/);
  assert.throws(
    () =>
      parseArgs(['--dir=/t', '--event=schedule', '--release=', '--verbose']),
    /unknown option/
  );
});

test('parseArgs requires --release, and an empty one is not a missing one', () => {
  // Absent, the release check would be off with nothing reporting it, so the
  // flag is required; a run no release asked for passes it empty.
  assert.throws(
    () => parseArgs(['--dir', '/t', '--event', 'release']),
    /--release <tag> is required/
  );
  assert.throws(
    () => parseArgs(['--dir', '/t', '--event', 'release', '--release']),
    /--release <tag> is required/
  );
  assert.equal(
    parseArgs(['--dir', '/t', '--event', 'schedule', '--release', '']).release,
    ''
  );
});

test('parseArgs requires a non-empty --event, since the event decides', () => {
  // The event is what turns the release check on, so an absent or empty one
  // would switch it off as silently as an empty tag once could.
  assert.throws(
    () => parseArgs(['--dir', '/t', '--release', 'a@1.0.0']),
    /--event <name> is required/
  );
  assert.throws(
    () => parseArgs(['--dir', '/t', '--event', '', '--release', 'a@1.0.0']),
    /--event <name> is required/
  );
  assert.throws(
    () => parseArgs(['--dir=/t', '--event=', '--release=a@1.0.0']),
    /--event <name> is required/
  );
});

test('parseArgs refuses --print-spec and --await-attestation together', () => {
  assert.throws(
    () =>
      parseArgs([
        '--dir=/t',
        '--event=release',
        '--release=a@1.0.0',
        '--print-spec',
        '--await-attestation',
      ]),
    /pass one/
  );
});

test('an omitted package list is allowed — the roster comes from the tree', () => {
  assert.deepEqual(
    parseArgs(['--dir', '/t', '--event', 'schedule', '--release', '']),
    {
      dir: '/t',
      packages: [],
      event: 'schedule',
      release: '',
      printSpec: false,
      awaitAttestation: false,
    }
  );
});

// --- reading the installed tree ---------------------------------------------

test('the version and digest come from the tree, not from the registry', async () => {
  const dir = await fixtureTree();
  assert.equal(installedVersion(dir, 'bestax-migrate'), '2.0.0');
  assert.equal(installedDigest(dir, 'bestax-migrate'), DIGEST);
});

test('a scoped package resolves through its nested directory', async () => {
  const dir = await fixtureTree({
    pkg: '@allxsmith/bestax-bulma',
    version: '5.11.1',
  });
  assert.equal(installedVersion(dir, '@allxsmith/bestax-bulma'), '5.11.1');
  assert.equal(installedDigest(dir, '@allxsmith/bestax-bulma'), DIGEST);
});

test('a missing package throws rather than resolving to something', async () => {
  const dir = await fixtureTree();
  assert.throws(() => installedVersion(dir, 'not-installed'));
  assert.throws(
    () => installedDigest(dir, 'not-installed'),
    /no sha512 integrity/
  );
});

// --- purl comparison --------------------------------------------------------

test('samePurl sees through the scope percent-encoding npm actually emits', () => {
  // The real bug: npm attests the scope as %40, so a naive string compare
  // failed on the one scoped package we publish.
  assert.ok(
    samePurl(
      'pkg:npm/%40allxsmith/bestax-bulma@5.11.1',
      'pkg:npm/@allxsmith/bestax-bulma@5.11.1'
    )
  );
  assert.ok(
    samePurl('pkg:npm/bestax-migrate@2.0.0', 'pkg:npm/bestax-migrate@2.0.0')
  );
});

test('samePurl still distinguishes different packages and versions', () => {
  assert.ok(!samePurl('pkg:npm/a@1.0.0', 'pkg:npm/b@1.0.0'));
  assert.ok(!samePurl('pkg:npm/a@1.0.0', 'pkg:npm/a@1.0.1'));
  // A malformed escape fails to match rather than throwing.
  assert.ok(!samePurl('pkg:npm/%zz@1.0.0', 'pkg:npm/a@1.0.0'));
  assert.ok(!samePurl(undefined, 'pkg:npm/a@1.0.0'));
});

// --- extracting the payload -------------------------------------------------

test('the SLSA bundle is selected, not whichever comes first', () => {
  const statement = extractProvenance(registryResponse(goodStatement()));
  assert.equal(statement.subject[0].digest.sha512, DIGEST);
});

test('a response carrying no SLSA bundle is an error, not an empty pass', () => {
  const body = JSON.stringify({
    attestations: [{ predicateType: 'https://example.test/other', bundle: {} }],
  });
  assert.throws(() => extractProvenance(body), /no https:\/\/slsa\.dev/);
});

test('an empty or malformed attestation list fails closed', () => {
  assert.throws(() => extractProvenance('{}'), /no https:\/\/slsa\.dev/);
  assert.throws(
    () => extractProvenance('{"attestations":[]}'),
    /no https:\/\/slsa\.dev/
  );
  assert.throws(() => extractProvenance('not json'));
});

test('a SLSA bundle with no payload is an error', () => {
  const body = JSON.stringify({
    attestations: [{ predicateType: SLSA_PREDICATE, bundle: {} }],
  });
  assert.throws(() => extractProvenance(body), /no dsseEnvelope payload/);
});

// --- the assertions themselves ----------------------------------------------

const CTX = { pkg: 'bestax-migrate', version: '2.0.0', digest: DIGEST };

test('a well-formed statement from our own build has no problems', () => {
  assert.deepEqual(checkStatement(goodStatement(), CTX), []);
});

test('an attestation naming another repository is caught — the gap #526 exists for', () => {
  const s = goodStatement();
  s.predicate.buildDefinition.externalParameters.workflow.repository =
    'https://github.com/someone-else/evil';
  const problems = checkStatement(s, CTX);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /built from repository .*someone-else\/evil/);
});

test('a digest that does not match the installed tarball is caught', () => {
  const s = goodStatement();
  s.subject[0].digest.sha512 = 'b'.repeat(128);
  const problems = checkStatement(s, CTX);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /does not match the installed tarball/);
});

test('a build from another workflow or another ref is caught', () => {
  const wrongPath = goodStatement();
  wrongPath.predicate.buildDefinition.externalParameters.workflow.path =
    '.github/workflows/attacker.yml';
  assert.match(checkStatement(wrongPath, CTX)[0], /built by workflow/);

  const wrongRef = goodStatement();
  wrongRef.predicate.buildDefinition.externalParameters.workflow.ref =
    'refs/heads/some-branch';
  assert.match(checkStatement(wrongRef, CTX)[0], /built from ref/);
});

test('a builder that is not a GitHub-hosted runner is caught', () => {
  const s = goodStatement();
  s.predicate.runDetails.builder.id = 'https://evil.test/builder';
  assert.match(checkStatement(s, CTX)[0], /builder is/);
});

test('a subject naming a different package or version is caught', () => {
  const s = goodStatement({ pkg: 'something-else' });
  assert.match(checkStatement(s, CTX)[0], /no subject named/);
});

test('the matching subject is found even when it is not first', () => {
  // in-toto permits multiple subjects; indexing [0] would report a correct
  // package as wrong.
  const s = goodStatement();
  s.subject.unshift({
    name: 'pkg:npm/other@9.9.9',
    digest: { sha512: 'f'.repeat(128) },
  });
  assert.deepEqual(checkStatement(s, CTX), []);
});

test('an attestation from a renamed repo with our URL is still caught by the IDs', () => {
  // The URL is a name and names transfer; the numeric IDs do not.
  const s = goodStatement();
  s.predicate.buildDefinition.internalParameters.github.repository_id = '111';
  assert.match(checkStatement(s, CTX)[0], /repository_id is "111"/);
});

test('a self-hosted runner is caught, not just an obviously foreign builder', () => {
  const s = goodStatement();
  s.predicate.runDetails.builder.id =
    'https://github.com/actions/runner/self-hosted';
  assert.match(checkStatement(s, CTX)[0], /builder is/);
});

test('a run belonging to another repository is caught', () => {
  const s = goodStatement();
  s.predicate.runDetails.metadata.invocationId =
    'https://github.com/someone-else/evil/actions/runs/1/attempts/1';
  assert.match(checkStatement(s, CTX)[0], /invocationId/);
});

test('a missing source dependency is reported as such', () => {
  const s = goodStatement();
  s.predicate.buildDefinition.resolvedDependencies = [];
  assert.match(checkStatement(s, CTX)[0], /no resolved dependency/);
});

test('the source descriptor is found even when it is not first', () => {
  // resolvedDependencies is unordered, so indexing [0] would false-fail here.
  const s = goodStatement();
  s.predicate.buildDefinition.resolvedDependencies.unshift({
    uri: 'git+https://github.com/unrelated/thing@refs/heads/main',
    digest: { gitCommit: 'b'.repeat(40) },
  });
  assert.deepEqual(checkStatement(s, CTX), []);
});

test('a near-collision repository name is not accepted as our source', () => {
  // `includes` would select bestax-evil here and let its digest satisfy the
  // source-commit assertion while nothing describes this repository.
  const s = goodStatement();
  s.predicate.buildDefinition.resolvedDependencies = [
    {
      uri: 'git+https://github.com/allxsmith/bestax-evil@refs/heads/main',
      digest: { gitCommit: 'd'.repeat(40) },
    },
  ];
  assert.match(checkStatement(s, CTX)[0], /no resolved dependency/);
});

test('an unrelated dependency cannot stand in for a missing source commit', () => {
  // The other half of the [0] bug: a foreign entry with a valid-looking sha
  // must not satisfy the check.
  const s = goodStatement();
  s.predicate.buildDefinition.resolvedDependencies = [
    {
      uri: 'git+https://github.com/unrelated/thing',
      digest: { gitCommit: 'c'.repeat(40) },
    },
  ];
  assert.match(checkStatement(s, CTX)[0], /no resolved dependency/);
});

test('an empty statement fails every check rather than passing any', () => {
  // The fail-closed case: absent fields must never satisfy an assertion.
  const problems = checkStatement({}, CTX);
  assert.equal(problems.length, 9);
});

test('every problem is reported at once, not one per run', () => {
  const s = goodStatement();
  s.predicate.buildDefinition.externalParameters.workflow.repository =
    'https://x.test/y';
  s.subject[0].digest.sha512 = 'c'.repeat(128);
  assert.equal(checkStatement(s, CTX).length, 2);
});

// --- end to end -------------------------------------------------------------

test('verifyPackage passes for a good package and requests the right URL', async () => {
  const dir = await fixtureTree();
  const s = stubFetch(() => ({ body: registryResponse(goodStatement()) }));
  try {
    const r = await verifyPackage('bestax-migrate', {
      dir,
      retryOptions: NO_WAIT,
    });
    assert.deepEqual(r, {
      pkg: 'bestax-migrate',
      version: '2.0.0',
      ok: true,
      problems: [],
    });
    assert.equal(s.calls[0].url, attestationUrl('bestax-migrate', '2.0.0'));
    assert.equal(s.calls[0].method, 'GET', 'needs the body, so never HEAD');
  } finally {
    s.restore();
  }
});

test('a registry that will not answer fails closed rather than passing', async () => {
  const dir = await fixtureTree();
  const s = stubFetch(() => ({ status: 503 }));
  try {
    const r = await verifyPackage('bestax-migrate', {
      dir,
      retryOptions: NO_WAIT,
    });
    assert.equal(r.ok, false);
    assert.match(r.problems[0], /could not fetch the attestation/);
  } finally {
    s.restore();
  }
});

test('a 404 from the registry fails closed too', async () => {
  const dir = await fixtureTree();
  const s = stubFetch(() => ({ status: 404, statusText: 'Not Found' }));
  try {
    const r = await verifyPackage('bestax-migrate', {
      dir,
      retryOptions: NO_WAIT,
    });
    assert.equal(r.ok, false);
  } finally {
    s.restore();
  }
});

test('main exits 0 when every package checks out', async () => {
  const dir = await fixtureTree();
  const s = stubFetch(() => ({ body: registryResponse(goodStatement()) }));
  try {
    const code = await main(
      ['--dir', dir, '--event', 'schedule', '--release', '', 'bestax-migrate'],
      {
        retryOptions: NO_WAIT,
      }
    );
    assert.equal(code, 0);
  } finally {
    s.restore();
  }
});

test('main exits 1 when a package was built somewhere else', async t => {
  const lines = captureConsole(t);
  const dir = await fixtureTree();
  const bad = goodStatement();
  bad.predicate.buildDefinition.externalParameters.workflow.repository =
    'https://github.com/someone-else/evil';
  const s = stubFetch(() => ({ body: registryResponse(bad) }));
  try {
    const code = await main(
      ['--dir', dir, '--event', 'schedule', '--release', '', 'bestax-migrate'],
      {
        retryOptions: NO_WAIT,
      }
    );
    assert.equal(code, 1);
  } finally {
    s.restore();
  }
  // The annotation names the package, and the problem under it names the
  // repository that actually built it.
  const at = lines.indexOf(
    '::error::bestax-migrate@2.0.0 provenance does not check out'
  );
  assert.ok(at >= 0, lines.join('\n'));
  assert.match(lines[at + 1], /^ {2}- .*someone-else\/evil/);
});

test('main exits 2 on bad usage, distinct from a failed verification', async t => {
  const lines = captureConsole(t);
  assert.equal(await main([]), 2);
  assert.deepEqual(lines, [
    '::error::verify-attestation: --dir <scratch-tree> is required',
  ]);
});

// --- roster derived from the tree -------------------------------------------

test('packagesInTree reads the roster the install step actually produced', async () => {
  const dir = await fixtureTree();
  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify({ dependencies: { b: '^1', a: '^2' } })
  );
  assert.deepEqual(packagesInTree(dir), ['a', 'b']);
});

test('an empty tree refuses to report success on a run that checks nothing', async () => {
  const dir = await fixtureTree();
  await writeFile(join(dir, 'package.json'), JSON.stringify({}));
  assert.throws(() => packagesInTree(dir), /nothing to verify/);
});

test('main derives the roster when no packages are named', async () => {
  const dir = await fixtureTree();
  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify({ dependencies: { 'bestax-migrate': '^2' } })
  );
  const s = stubFetch(() => ({ body: registryResponse(goodStatement()) }));
  try {
    assert.equal(
      await main(['--dir', dir, '--event', 'schedule', '--release', ''], {
        retryOptions: NO_WAIT,
      }),
      0
    );
    assert.equal(s.calls.length, 1);
  } finally {
    s.restore();
  }
});

// --- registry propagation lag ------------------------------------------------

test('a 404 from the attestations route is retried, not believed on sight', async () => {
  // The job runs seconds after npm publish and that route propagates
  // separately from the packument, so a first-try 404 is usually lag.
  const dir = await fixtureTree();
  let call = 0;
  const s = stubFetch(() => {
    call += 1;
    return call < 3
      ? { status: 404, statusText: 'Not Found' }
      : { body: registryResponse(goodStatement()) };
  });
  try {
    const r = await verifyPackage('bestax-migrate', {
      dir,
      retryOptions: NO_WAIT,
    });
    assert.equal(r.ok, true);
    assert.equal(s.calls.length, 3);
  } finally {
    s.restore();
  }
});

test('a 404 that never clears still fails closed', async () => {
  const dir = await fixtureTree();
  const s = stubFetch(() => ({ status: 404, statusText: 'Not Found' }));
  try {
    const r = await verifyPackage('bestax-migrate', {
      dir,
      retryOptions: NO_WAIT,
    });
    assert.equal(r.ok, false);
    assert.match(r.problems[0], /could not fetch the attestation/);
  } finally {
    s.restore();
  }
});

// --- statement type is re-checked after decoding -----------------------------

test('a payload whose decoded type disagrees with the envelope label is rejected', () => {
  // The outer predicateType is unsigned metadata; the decoded statement's own
  // fields are what make the selection self-verifying.
  const s = goodStatement();
  s.predicateType = 'https://example.test/not-slsa';
  assert.throws(
    () => extractProvenance(registryResponse(s)),
    /decoded predicateType/
  );

  const s2 = goodStatement();
  s2._type = 'https://example.test/not-in-toto';
  assert.throws(
    () => extractProvenance(registryResponse(s2)),
    /decoded statement is/
  );
});

// --- lockfile integrity validation -------------------------------------------

test('a corrupted integrity is reported as a lockfile problem, not a mismatch', async () => {
  const dir = await fixtureTree();
  await writeFile(
    join(dir, 'package-lock.json'),
    JSON.stringify({
      packages: { 'node_modules/bestax-migrate': { integrity: 'sha512-!!!!' } },
    })
  );
  assert.throws(
    () => installedDigest(dir, 'bestax-migrate'),
    /decoded to \d+ bytes/
  );
});

// --- which release (#719) ----------------------------------------------------

/** What a release event carrying `tag` holds the tree to. */
const onRelease = tag =>
  releaseUnderTest({ eventName: 'release', tagName: tag });

test('a scheduled or dispatched run holds no release, and its tag is not read', () => {
  for (const eventName of ['schedule', 'workflow_dispatch']) {
    assert.equal(releaseUnderTest({ eventName, tagName: '' }), null);
    assert.equal(releaseUnderTest({ eventName, tagName: undefined }), null);
    // Not read at all, as installSpec does not read it: the event decided.
    assert.equal(releaseUnderTest({ eventName, tagName: 'v-not-a-tag' }), null);
  }
});

test('a release event with an empty tag fails rather than reading as no release', () => {
  // The off-switch review found on #719: when the tag alone decided, an empty
  // one passed the run with no release held and nothing saying so.
  for (const tagName of ['', '  ', undefined]) {
    assert.throws(
      () => releaseUnderTest({ eventName: 'release', tagName }),
      /a release event arrived with an empty release tag/
    );
  }
});

test('an event nobody classified fails, so a new trigger cannot pass unheld', () => {
  for (const eventName of ['push', 'workflow_run', '', undefined]) {
    assert.throws(
      () => releaseUnderTest({ eventName, tagName: '' }),
      /is neither a release nor one of schedule, workflow_dispatch/
    );
  }
  // The event name reaches the message, so it goes through forLog like a tag.
  assert.throws(
    () => releaseUnderTest({ eventName: 'push\n::error::forged', tagName: '' }),
    err => !err.message.includes('\n')
  );
});

test('a release tag is split on its last @, so a scoped package survives', () => {
  assert.deepEqual(onRelease('@allxsmith/bestax-bulma@5.16.6'), {
    package: '@allxsmith/bestax-bulma',
    version: '5.16.6',
  });
});

test('a release tag that names nothing fails rather than checking the tree as-is', () => {
  assert.throws(() => onRelease('v5.16.6'), /does not name/);
  assert.throws(() => onRelease('bestax-migrate@'), /does not name/);
  assert.throws(
    () => onRelease('bestax-migrate@2.0.1.4'),
    /not a semver version/
  );
  // The complaint about a crafted tag must not itself be a workflow command.
  assert.throws(
    () => onRelease('bestax-migrate@2.0.1\n::error::forged'),
    err => !err.message.includes('\n')
  );
});

test('checkRelease passes a tree that carries the release', async () => {
  const dir = await fixtureTree({ version: '2.0.1' });
  const release = { package: 'bestax-migrate', version: '2.0.1' };
  assert.deepEqual(checkRelease(release, ['bestax-migrate'], dir), []);
});

test('checkRelease catches the previous version standing in for the release', async () => {
  const dir = await fixtureTree({ version: '2.0.0' });
  const release = { package: 'bestax-migrate', version: '2.0.1' };
  const [problem, ...rest] = checkRelease(release, ['bestax-migrate'], dir);
  assert.deepEqual(rest, []);
  assert.match(
    problem,
    /release is bestax-migrate@2\.0\.1 but the tree carries "2\.0\.0"/
  );
});

test('checkRelease catches a release for a package the roster does not verify', async () => {
  const dir = await fixtureTree();
  const release = { package: 'create-bestax', version: '4.3.0' };
  assert.match(
    checkRelease(release, ['bestax-migrate'], dir)[0],
    /names "create-bestax", which is not among the packages verified \(bestax-migrate\)/
  );
});

test('checkRelease reports a rostered package missing from the tree', async () => {
  const dir = await fixtureTree();
  const release = { package: 'create-bestax', version: '4.3.0' };
  assert.match(
    checkRelease(release, ['bestax-migrate', 'create-bestax'], dir)[0],
    /ENOENT/
  );
});

test('main fails a release run whose tree holds the previous version, the #719 pass', async t => {
  // The shape #719 recorded: `latest` still resolved the previous version,
  // whose attestation is valid, and the verification passed on it.
  const lines = captureConsole(t);
  const dir = await fixtureTree({ version: '2.0.0' });
  const s = stubFetch(() => ({
    body: registryResponse(goodStatement({ version: '2.0.0' })),
  }));
  try {
    const code = await main(
      [
        '--dir',
        dir,
        '--event',
        'release',
        '--release',
        'bestax-migrate@2.0.1',
        'bestax-migrate',
      ],
      { retryOptions: NO_WAIT }
    );
    assert.equal(code, 1);
    assert.deepEqual(
      s.calls.map(c => c.url),
      [attestationUrl('bestax-migrate', '2.0.0')]
    );
  } finally {
    s.restore();
  }
  // The older tarball itself checks out, which is why this was silent.
  assert.ok(
    lines.includes(`ok: bestax-migrate@2.0.0 — built by ${EXPECTED.repository}`)
  );
  const at = lines.indexOf(
    '::error::the tree is not the release this run was asked about'
  );
  assert.ok(at >= 0, lines.join('\n'));
  assert.match(lines[at + 1], /^ {2}- the release is bestax-migrate@2\.0\.1/);
});

test('main passes a release run whose tree is that release, and says so', async t => {
  const lines = captureConsole(t);
  const dir = await fixtureTree({ version: '2.0.1' });
  const s = stubFetch(() => ({
    body: registryResponse(goodStatement({ version: '2.0.1' })),
  }));
  try {
    const code = await main(
      [
        '--dir',
        dir,
        '--event',
        'release',
        '--release',
        'bestax-migrate@2.0.1',
        'bestax-migrate',
      ],
      { retryOptions: NO_WAIT }
    );
    assert.equal(code, 0);
  } finally {
    s.restore();
  }
  assert.equal(
    lines.at(-1),
    'verify-attestation: 1 package(s) check out, including the release bestax-migrate@2.0.1'
  );
});

test('main reports a bad attestation and a wrong release together', async t => {
  const lines = captureConsole(t);
  const dir = await fixtureTree({ version: '2.0.0' });
  const bad = goodStatement({ version: '2.0.0' });
  bad.predicate.runDetails.builder.id = 'https://example.test/self-hosted';
  const s = stubFetch(() => ({ body: registryResponse(bad) }));
  try {
    const code = await main(
      [
        '--dir',
        dir,
        '--event',
        'release',
        '--release',
        'bestax-migrate@2.0.1',
        'bestax-migrate',
      ],
      { retryOptions: NO_WAIT }
    );
    assert.equal(code, 1);
  } finally {
    s.restore();
  }
  assert.ok(
    lines.includes(
      '::error::bestax-migrate@2.0.0 provenance does not check out'
    )
  );
  assert.ok(
    lines.includes(
      '::error::the tree is not the release this run was asked about'
    )
  );
});

test('main refuses an unparsable release tag before fetching anything', async t => {
  const lines = captureConsole(t);
  const dir = await fixtureTree();
  const s = stubFetch(() => ({ body: registryResponse(goodStatement()) }));
  try {
    const code = await main(
      [
        '--dir',
        dir,
        '--event',
        'release',
        '--release',
        'v2.0.1',
        'bestax-migrate',
      ],
      { retryOptions: NO_WAIT }
    );
    assert.equal(code, 1);
    assert.equal(s.calls.length, 0);
  } finally {
    s.restore();
  }
  assert.deepEqual(lines, [
    '::error::verify-attestation: release tag "v2.0.1" does not name <package>@<version>',
  ]);
});

test('--print-spec prints the release spec alone, and fetches nothing', async t => {
  const lines = captureConsole(t);
  const dir = await fixtureTree({ version: '2.0.0' });
  const s = stubFetch(() => ({ body: '' }));
  try {
    const code = await main([
      '--dir',
      dir,
      '--event',
      'release',
      '--release',
      'bestax-migrate@2.0.1',
      '--print-spec',
      'bestax-migrate',
    ]);
    assert.equal(code, 0);
    assert.equal(s.calls.length, 0);
  } finally {
    s.restore();
  }
  // The tree still holds 2.0.0 here, and that is the point: this runs before
  // the pin, so only the roster is checked, not the version.
  assert.deepEqual(lines, ['bestax-migrate@2.0.1']);
});

test('--print-spec prints nothing when no release asked', async t => {
  const lines = captureConsole(t);
  const dir = await fixtureTree();
  const code = await main([
    '--dir',
    dir,
    '--event',
    'schedule',
    '--release',
    '',
    '--print-spec',
    'bestax-migrate',
  ]);
  assert.equal(code, 0);
  assert.deepEqual(lines, []);
});

test('--print-spec fails a release event whose tag is empty, so the install step goes red', async t => {
  // Printing nothing here would skip the pin and leave the tree on `latest`,
  // the #719 shape, with the later assertion the only thing left to notice.
  const lines = captureConsole(t);
  const dir = await fixtureTree();
  const code = await main([
    '--dir',
    dir,
    '--event',
    'release',
    '--release',
    '',
    '--print-spec',
    'bestax-migrate',
  ]);
  assert.equal(code, 1);
  assert.deepEqual(lines, [
    '::error::verify-attestation: a release event arrived with an empty release tag, so there is no release to hold the tree to',
  ]);
});

test('main fails a release event whose tag is empty before fetching anything', async t => {
  const lines = captureConsole(t);
  const dir = await fixtureTree();
  const s = stubFetch(() => ({ body: registryResponse(goodStatement()) }));
  try {
    const code = await main(
      ['--dir', dir, '--event', 'release', '--release', '', 'bestax-migrate'],
      { retryOptions: NO_WAIT }
    );
    assert.equal(code, 1);
    assert.equal(s.calls.length, 0);
  } finally {
    s.restore();
  }
  assert.match(lines.join('\n'), /empty release tag/);
  assert.ok(!lines.some(l => /check out/.test(l)), lines.join('\n'));
});

test('main fails a run whose event nobody classified', async t => {
  const lines = captureConsole(t);
  const dir = await fixtureTree();
  const code = await main(
    ['--dir', dir, '--event', 'push', '--release', '', 'bestax-migrate'],
    { retryOptions: NO_WAIT }
  );
  assert.equal(code, 1);
  assert.match(
    lines[0],
    /^::error::verify-attestation: event "push" is neither/
  );
});

test('--print-spec refuses a release for a package the roster does not install', async t => {
  // Otherwise a tag could put any package on npm into the tree.
  const lines = captureConsole(t);
  const dir = await fixtureTree();
  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify({ dependencies: { 'bestax-migrate': '^2' } })
  );
  const code = await main([
    '--dir',
    dir,
    '--event',
    'release',
    '--release',
    'left-pad@1.3.0',
    '--print-spec',
  ]);
  assert.equal(code, 1);
  assert.deepEqual(lines, [
    '::error::verify-attestation: the release names "left-pad", which is not among the packages verified (bestax-migrate)',
  ]);
});

// --- waiting for the release's own attestation (#719) ------------------------

test('the release wait borrows the packument propagation budget, at its interval', () => {
  // Imported rather than restated, so this pins the relation: the sleeps
  // between attempts add up to npm-install-retry's budget, at its interval.
  const { attempts, backoffMs } = RELEASE_ATTESTATION_RETRY;
  assert.deepEqual(backoffMs, [DEFAULT_SLEEP_SECONDS * 1000]);
  assert.equal(
    (attempts - 1) * backoffMs[0],
    DEFAULT_BUDGET_SECONDS * 1000,
    'the waits between attempts should add up to the budget'
  );
  // And it is the long one: the assertion's own lookups stay short.
  assert.ok(attempts > DEFAULT_ATTEMPTS);
  assert.ok(backoffMs[0] > ATTESTATION_BACKOFF_MS.at(-1));
});

/** Run --await-attestation for `tag` against a tree that already carries it. */
async function awaitRun(tag, opts = {}) {
  const dir = await fixtureTree({ version: '2.0.1' });
  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify({ dependencies: { 'bestax-migrate': '^2' } })
  );
  return main(
    [
      '--dir',
      dir,
      '--event',
      opts.event ?? 'release',
      '--release',
      tag,
      '--await-attestation',
    ],
    { retryOptions: NO_WAIT, ...opts.deps }
  );
}

test('--await-attestation waits out a lagging attestations route and says how long', async t => {
  const lines = captureConsole(t);
  let call = 0;
  const s = stubFetch(() => {
    call += 1;
    return call < 4
      ? { status: 404, statusText: 'Not Found' }
      : { body: registryResponse(goodStatement({ version: '2.0.1' })) };
  });
  let clock = 1_000_000;
  try {
    const code = await awaitRun('bestax-migrate@2.0.1', {
      // Every reading moves the clock on by a minute, so the figure printed
      // is the one the injected clock produced, not the wall clock's.
      deps: { now: () => (clock += 60_000) },
    });
    assert.equal(code, 0);
    // Only the release's own attestation, and only until it was served.
    assert.deepEqual(
      s.calls.map(c => c.url),
      Array(4).fill(attestationUrl('bestax-migrate', '2.0.1'))
    );
  } finally {
    s.restore();
  }
  assert.deepEqual(lines, [
    'verify-attestation: the registry serves the attestation for bestax-migrate@2.0.1, after 60s and 4 attempt(s)',
  ]);
});

test('--await-attestation spends the release budget, not the assertion one, before failing', async t => {
  const lines = captureConsole(t);
  const s = stubFetch(() => ({ status: 404, statusText: 'Not Found' }));
  try {
    assert.equal(await awaitRun('bestax-migrate@2.0.1'), 1);
    // Every attempt the release budget buys, which is what a release whose
    // attestation is merely slow is owed. Three would be the short budget.
    assert.equal(s.calls.length, RELEASE_ATTESTATION_RETRY.attempts);
  } finally {
    s.restore();
  }
  assert.equal(lines.length, 1);
  assert.match(
    lines[0],
    /^::error::verify-attestation: could not fetch the attestation for bestax-migrate@2\.0\.1 \(404 Not Found\) after \d+s and \d+ attempt\(s\)\./
  );
});

test('--await-attestation does nothing on a run no release asked about', async t => {
  const lines = captureConsole(t);
  const s = stubFetch(() => ({ status: 404 }));
  try {
    assert.equal(await awaitRun('', { event: 'schedule' }), 0);
    assert.equal(s.calls.length, 0);
  } finally {
    s.restore();
  }
  assert.deepEqual(lines, []);
});

test('--await-attestation is held to the roster, like the pin', async t => {
  const lines = captureConsole(t);
  const s = stubFetch(() => ({ status: 404 }));
  try {
    assert.equal(await awaitRun('left-pad@1.3.0'), 1);
    assert.equal(s.calls.length, 0);
  } finally {
    s.restore();
  }
  assert.match(lines[0], /the release names "left-pad"/);
});

test('--await-attestation fails a release event whose tag is empty', async t => {
  const lines = captureConsole(t);
  const s = stubFetch(() => ({ status: 404 }));
  try {
    assert.equal(await awaitRun(''), 1);
    assert.equal(s.calls.length, 0);
  } finally {
    s.restore();
  }
  assert.match(lines[0], /empty release tag/);
});

test('the assertion keeps its short budget on a release run', async t => {
  // The long wait belongs to the install step. Here the release has already
  // been waited for, so a route that stops answering fails at the short
  // budget rather than stalling the step a second time.
  captureConsole(t);
  const dir = await fixtureTree({ version: '2.0.1' });
  const s = stubFetch(() => ({ status: 404, statusText: 'Not Found' }));
  try {
    const code = await main(
      [
        '--dir',
        dir,
        '--event',
        'release',
        '--release',
        'bestax-migrate@2.0.1',
        'bestax-migrate',
      ],
      { retryOptions: NO_WAIT }
    );
    assert.equal(code, 1);
    assert.equal(s.calls.length, DEFAULT_ATTEMPTS);
  } finally {
    s.restore();
  }
});
