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
} from './verify-attestation.mjs';

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

test('parseArgs takes --dir and --release in both spellings plus the package list', () => {
  assert.deepEqual(
    parseArgs(['--dir', '/t', '--release', 'a@1.0.0', 'a', 'b']),
    {
      dir: '/t',
      packages: ['a', 'b'],
      release: 'a@1.0.0',
      printSpec: false,
    }
  );
  assert.deepEqual(parseArgs(['--dir=/t', '--release=', '--print-spec', 'a']), {
    dir: '/t',
    packages: ['a'],
    release: '',
    printSpec: true,
  });
});

test('parseArgs requires --dir and rejects unknown options', () => {
  assert.throws(() => parseArgs(['--release', '', 'a', 'b']), /--dir/);
  // A typo must be a usage error, not a package named "--dirs" that then
  // fails verification for a package that never existed.
  assert.throws(() => parseArgs(['--dirs', '/t', 'a']), /unknown option/);
  assert.throws(
    () => parseArgs(['--dir=/t', '--release=', '--verbose', 'a']),
    /unknown option/
  );
});

test('parseArgs requires --release, and an empty one is not a missing one', () => {
  // Absent, the release check would be off with nothing reporting it, so the
  // flag is required; a run no release asked for passes it empty.
  assert.throws(
    () => parseArgs(['--dir', '/t']),
    /--release <tag> is required/
  );
  assert.throws(
    () => parseArgs(['--dir', '/t', '--release']),
    /--release <tag> is required/
  );
  assert.equal(parseArgs(['--dir', '/t', '--release', '']).release, '');
});

test('an omitted package list is allowed — the roster comes from the tree', () => {
  assert.deepEqual(parseArgs(['--dir', '/t', '--release', '']), {
    dir: '/t',
    packages: [],
    release: '',
    printSpec: false,
  });
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
    const code = await main(['--dir', dir, '--release', '', 'bestax-migrate'], {
      retryOptions: NO_WAIT,
    });
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
    const code = await main(['--dir', dir, '--release', '', 'bestax-migrate'], {
      retryOptions: NO_WAIT,
    });
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
      await main(['--dir', dir, '--release', ''], { retryOptions: NO_WAIT }),
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

test('an empty release tag means no release asked for this run', () => {
  assert.equal(releaseUnderTest(''), null);
  assert.equal(releaseUnderTest('  '), null);
  assert.equal(releaseUnderTest(undefined), null);
});

test('a release tag is split on its last @, so a scoped package survives', () => {
  assert.deepEqual(releaseUnderTest('@allxsmith/bestax-bulma@5.16.6'), {
    package: '@allxsmith/bestax-bulma',
    version: '5.16.6',
  });
});

test('a release tag that names nothing fails rather than checking the tree as-is', () => {
  assert.throws(() => releaseUnderTest('v5.16.6'), /does not name/);
  assert.throws(() => releaseUnderTest('bestax-migrate@'), /does not name/);
  assert.throws(
    () => releaseUnderTest('bestax-migrate@2.0.1.4'),
    /not a semver version/
  );
  // The complaint about a crafted tag must not itself be a workflow command.
  assert.throws(
    () => releaseUnderTest('bestax-migrate@2.0.1\n::error::forged'),
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
  // The shape run 35682756557 logged: `latest` still resolved the previous
  // version, whose attestation is valid, and the run went green on it.
  const lines = captureConsole(t);
  const dir = await fixtureTree({ version: '2.0.0' });
  const s = stubFetch(() => ({
    body: registryResponse(goodStatement({ version: '2.0.0' })),
  }));
  try {
    const code = await main(
      ['--dir', dir, '--release', 'bestax-migrate@2.0.1', 'bestax-migrate'],
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
      ['--dir', dir, '--release', 'bestax-migrate@2.0.1', 'bestax-migrate'],
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
      ['--dir', dir, '--release', 'bestax-migrate@2.0.1', 'bestax-migrate'],
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
      ['--dir', dir, '--release', 'v2.0.1', 'bestax-migrate'],
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
    '--release',
    '',
    '--print-spec',
    'bestax-migrate',
  ]);
  assert.equal(code, 0);
  assert.deepEqual(lines, []);
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
    '--release',
    'left-pad@1.3.0',
    '--print-spec',
  ]);
  assert.equal(code, 1);
  assert.deepEqual(lines, [
    '::error::verify-attestation: the release names "left-pad", which is not among the packages verified (bestax-migrate)',
  ]);
});
