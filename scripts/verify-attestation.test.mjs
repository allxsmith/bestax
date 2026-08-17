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

// --- argument parsing -------------------------------------------------------

test('parseArgs takes --dir in both spellings plus the package list', () => {
  assert.deepEqual(parseArgs(['--dir', '/t', 'a', 'b']), {
    dir: '/t',
    packages: ['a', 'b'],
  });
  assert.deepEqual(parseArgs(['--dir=/t', 'a']), {
    dir: '/t',
    packages: ['a'],
  });
});

test('parseArgs requires --dir and rejects unknown options', () => {
  assert.throws(() => parseArgs(['a', 'b']), /--dir/);
  // A typo must be a usage error, not a package named "--dirs" that then
  // fails verification for a package that never existed.
  assert.throws(() => parseArgs(['--dirs', '/t', 'a']), /unknown option/);
  assert.throws(
    () => parseArgs(['--dir=/t', '--verbose', 'a']),
    /unknown option/
  );
});

test('an omitted package list is allowed — the roster comes from the tree', () => {
  assert.deepEqual(parseArgs(['--dir', '/t']), { dir: '/t', packages: [] });
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
    const code = await main(['--dir', dir, 'bestax-migrate'], {
      retryOptions: NO_WAIT,
    });
    assert.equal(code, 0);
  } finally {
    s.restore();
  }
});

test('main exits 1 when a package was built somewhere else', async () => {
  const dir = await fixtureTree();
  const bad = goodStatement();
  bad.predicate.buildDefinition.externalParameters.workflow.repository =
    'https://github.com/someone-else/evil';
  const s = stubFetch(() => ({ body: registryResponse(bad) }));
  try {
    const code = await main(['--dir', dir, 'bestax-migrate'], {
      retryOptions: NO_WAIT,
    });
    assert.equal(code, 1);
  } finally {
    s.restore();
  }
});

test('main exits 2 on bad usage, distinct from a failed verification', async () => {
  assert.equal(await main([]), 2);
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
    assert.equal(await main(['--dir', dir], { retryOptions: NO_WAIT }), 0);
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
