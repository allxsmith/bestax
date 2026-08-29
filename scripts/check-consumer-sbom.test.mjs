/**
 * Guards on check-consumer-sbom.mjs.
 *
 * The cases that matter most are regressions that really happened and were
 * found only by generating a document and reading it:
 *
 *   - a github-actions cataloger entry, from `.github/workflows` YAML shipped
 *     inside an upstream npm tarball (#529);
 *   - every package listed twice, from selecting the whole `javascript`
 *     cataloger group (#529);
 *   - a `type: file` component named with the runner's absolute path, from
 *     scanning the lockfile as a `file:` source — present in every CycloneDX
 *     document while every SPDX document was clean (#530).
 *
 * All three are reproduced below as documents this check must reject. The
 * third is why `inspect` reads both formats: the guard that existed when it
 * happened read SPDX only and passed the leak.
 *
 * The negative case is just as important: a document that has merely GROWN
 * must pass. The first version of this guard compared against hardcoded counts
 * and was reverted in 48c57d5 for exactly that reason — a live registry
 * closure drifts on somebody else's release, and a gate that reds every open
 * PR when nothing is wrong gets deleted (#391, #525).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  REGISTRY_PREFIX,
  NPM_PURL_PREFIX,
  MIN_EXPECTED_PACKAGES,
  structuralNames,
  normalize,
  readDocument,
  inspect,
  identities,
  crossCheck,
  forLog,
  parseArgs,
  main,
} from './check-consumer-sbom.mjs';

const PKG = '@allxsmith/bestax-bulma';
const SLUG = 'allxsmith-bestax-bulma';
const VERSION = '5.11.4';
const TARGET = {
  package: PKG,
  slug: SLUG,
  version: VERSION,
  minPackages: MIN_EXPECTED_PACKAGES,
};

// --- fixtures, shaped after the real run-33260691933 documents ---------------

const spdxDep = (name, version = '1.0.0') => ({
  name,
  versionInfo: version,
  downloadLocation: `${REGISTRY_PREFIX}${name}/-/${name}-${version}.tgz`,
});

/**
 * SPDX: five closure packages plus the two structural entries.
 *
 * `spdxVersion` is present because a real document has it and normalize() now
 * requires it — shape alone was a guess, and a document that had lost its
 * format marker is not the thing its filename promises.
 */
const healthySpdx = () => ({
  spdxVersion: 'SPDX-2.3',
  packages: [
    {
      name: `bestax-consumer-closure-${SLUG}`,
      versionInfo: '0.0.0',
      downloadLocation: 'NOASSERTION',
    },
    {
      name: `consumer-closure:${PKG}`,
      versionInfo: VERSION,
      downloadLocation: 'NOASSERTION',
    },
    spdxDep(PKG, VERSION),
    spdxDep('bulma', '1.0.4'),
    spdxDep('react', '19.2.8'),
    spdxDep('react-dom', '19.2.8'),
    spdxDep('scheduler', '0.27.0'),
  ],
});

const cdxDep = (name, version = '1.0.0') => ({
  name,
  version,
  purl: `${NPM_PURL_PREFIX}${name}@${version}`,
});

/** CycloneDX: the same closure, with the subject in metadata.component. */
const healthyCdx = () => ({
  bomFormat: 'CycloneDX',
  metadata: {
    component: {
      type: 'directory',
      name: `consumer-closure:${PKG}`,
      version: VERSION,
    },
  },
  components: [
    cdxDep(`bestax-consumer-closure-${SLUG}`, '0.0.0'),
    cdxDep(PKG, VERSION),
    cdxDep('bulma', '1.0.4'),
    cdxDep('react', '19.2.8'),
    cdxDep('react-dom', '19.2.8'),
    cdxDep('scheduler', '0.27.0'),
  ],
});

function writeDoc(doc) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-consumer-sbom-'));
  const file = path.join(dir, 'sbom.json');
  fs.writeFileSync(file, JSON.stringify(doc));
  return file;
}

// --- the happy path ----------------------------------------------------------

test('a clean SPDX closure has no problems', () => {
  assert.deepEqual(inspect(healthySpdx(), TARGET), []);
});

test('a clean CycloneDX closure has no problems', () => {
  assert.deepEqual(inspect(healthyCdx(), TARGET), []);
});

test('a closure that merely GREW still passes, in both formats', () => {
  // The whole reason there is no expected count. A transitive dependency
  // publishing must never red this job.
  const s = healthySpdx();
  const c = healthyCdx();
  for (let i = 0; i < 200; i += 1) {
    s.packages.push(spdxDep(`transitive-${i}`));
    c.components.push(cdxDep(`transitive-${i}`));
  }
  assert.deepEqual(inspect(s, TARGET), []);
  assert.deepEqual(inspect(c, TARGET), []);
});

// --- the three real regressions ----------------------------------------------

test('rejects a github-actions cataloger entry (#529)', () => {
  const doc = healthySpdx();
  doc.packages.push({
    name: 'actions/checkout',
    versionInfo: 'v4',
    downloadLocation: 'NOASSERTION',
  });
  const problems = inspect(doc, TARGET);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /actions\/checkout/);
  assert.match(problems[0], /not under https:\/\/registry\.npmjs\.org\//);
});

test("rejects a dependency's own yarn.lock dev closure leaking in (#529)", () => {
  // npm always excludes package-lock.json from a tarball but NOT yarn.lock, so
  // one dependency publishing without a `files:` field would inject its whole
  // dev tree. Those entries resolve to the yarn registry, a git URL, or
  // nothing — never to registry.npmjs.org via our lockfile's `resolved`.
  const doc = healthySpdx();
  doc.packages.push({
    name: 'some-dev-tool',
    versionInfo: '2.0.0',
    downloadLocation: 'https://registry.yarnpkg.com/some-dev-tool.tgz',
  });
  doc.packages.push({
    name: 'a-git-dep',
    versionInfo: '0.0.0',
    downloadLocation: 'git+https://github.com/someone/thing.git',
  });
  assert.equal(inspect(doc, TARGET).length, 2);
});

test('rejects the doubled-catalogers regression (#529)', () => {
  // Selecting the `javascript` GROUP enabled both javascript catalogers and
  // listed every package twice — bestax-migrate at 200. The package.json
  // cataloger carries no `resolved`, so the duplicates arrive with no registry
  // URL and are caught by the same assertion that catches everything else.
  const doc = healthySpdx();
  doc.packages.push({ name: 'bulma', versionInfo: '1.0.4' });
  const problems = inspect(doc, TARGET);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /"bulma"/);
});

test('rejects the runner-path file component a file: source emits (#530)', () => {
  // The exact document run 33260691933 produced. Every SPDX document was
  // clean, so the SPDX-only guard this replaces passed it, and the leaked
  // CycloneDX file was signed and attached.
  const doc = healthyCdx();
  doc.components.push({
    'bom-ref': 'fd71c2238fc07657',
    type: 'file',
    name: '/home/runner/work/_temp/consumer/package-lock.json',
    hashes: [{ alg: 'SHA-256', content: 'c3f5' }],
  });
  const problems = inspect(doc, TARGET);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /home\/runner/);
  assert.match(problems[0], /not under pkg:npm\//);
});

test("SPDX's files array tolerates a bare name and rejects anything with a path", () => {
  // syft writes a bare relative name today, which leaks nothing — a real
  // document from run 33262407242 carries `package-lock.json` and must pass.
  const ok = healthySpdx();
  ok.files = [{ fileName: 'package-lock.json', SPDXID: 'SPDXRef-File-1' }];
  assert.deepEqual(inspect(ok, TARGET), []);

  // `./name` is the same bare name and must also pass.
  const dotted = healthySpdx();
  dotted.files = [{ fileName: './package-lock.json' }];
  assert.deepEqual(inspect(dotted, TARGET), []);

  // A RELATIVE name that still discloses layout. Only absolute names were
  // rejected before, and `work/_temp/scan/…` leaks the same structure.
  const rel = healthySpdx();
  rel.files = [{ fileName: 'work/_temp/scan/package-lock.json' }];
  assert.match(inspect(rel, TARGET)[0], /carries a path/);

  // The same array is where an absolute path would land if the file config
  // changed, so it is checked rather than assumed to stay relative.
  const bad = healthySpdx();
  bad.files = [{ fileName: '/home/runner/work/_temp/scan/package-lock.json' }];
  const problems = inspect(bad, TARGET);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /carries a path/);
});

test('a closure carrying two versions of the target is not a mismatch', () => {
  // npm can carry more than one version of a package, and nothing orders the
  // document by depth. Checking only the FIRST entry with the target name
  // reported a mismatch while the stamped version sat further down the list —
  // a false red on a good release, which is the failure this guard exists to
  // avoid (48c57d5, #391, #525).
  const doc = healthySpdx();
  doc.packages.splice(2, 0, spdxDep(PKG, '5.10.0'));
  assert.deepEqual(inspect(doc, TARGET), []);

  // Still a mismatch when NO copy carries the stamped version, and the message
  // lists what was actually found.
  const wrong = healthySpdx();
  wrong.packages = wrong.packages.filter(p => p.name !== PKG);
  wrong.packages.push(spdxDep(PKG, '5.10.0'), spdxDep(PKG, '5.9.0'));
  const problems = inspect(wrong, TARGET);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /"5\.10\.0", "5\.9\.0"/);
});

test("normalize requires each format's own identifier, not just an array", () => {
  // A malformed exporter result that dropped its format marker is no longer
  // the thing its filename promises, and used to satisfy the --spdx/--cdx
  // role check on array shape alone.
  const noMarker = healthySpdx();
  delete noMarker.spdxVersion;
  assert.equal(normalize(noMarker), null);

  const noBomFormat = healthyCdx();
  delete noBomFormat.bomFormat;
  assert.equal(normalize(noBomFormat), null);

  // And the marker alone is not enough either — the array is still required.
  assert.equal(normalize({ spdxVersion: 'SPDX-2.3' }), null);
  assert.equal(normalize({ bomFormat: 'CycloneDX' }), null);

  assert.equal(normalize(healthySpdx()).format, 'spdx');
  assert.equal(normalize(healthyCdx()).format, 'cyclonedx');
});

test('rejects a CycloneDX subject naming a filesystem path (#529)', () => {
  // The metadata.component half of the same failure class.
  const doc = healthyCdx();
  doc.metadata.component = {
    type: 'directory',
    name: '/home/runner/work/_temp/consumer',
  };
  assert.ok(
    inspect(doc, TARGET).some(p => /metadata\.component names/.test(p))
  );
});

// --- the purl test is weaker than the downloadLocation test ------------------

test('a git dependency passes the CycloneDX purl test — by design, documented', () => {
  // syft builds `pkg:npm/name@version` from the name and version alone and
  // records `resolved` nowhere in a CycloneDX document, so the purl is an
  // ECOSYSTEM claim, not a provenance one. Asserted rather than assumed,
  // because the comments used to describe it as provenance and that is the
  // kind of overstatement that stops the next reader checking.
  const c = healthyCdx();
  c.components.push(cdxDep('a-git-dep', '0.0.0'));
  assert.deepEqual(inspect(c, TARGET), []);

  // The same dependency in SPDX carries its real origin and is rejected.
  const s = healthySpdx();
  s.packages.push({
    name: 'a-git-dep',
    versionInfo: '0.0.0',
    downloadLocation: 'git+https://github.com/someone/thing.git',
  });
  assert.equal(inspect(s, TARGET).length, 1);
});

test('the same-closure check is what stops the weak purl test being a hole', () => {
  // A git dep that syft put in BOTH documents is caught by SPDX. One that
  // somehow appeared only in CycloneDX — where nothing can origin-check it —
  // is caught by the disagreement instead. Neither path lets it through.
  const c = healthyCdx();
  c.components.push(cdxDep('a-git-dep', '0.0.0'));
  const problems = crossCheck(healthySpdx(), c, TARGET);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /CycloneDX document but not the SPDX one/);
  assert.match(problems[0], /a-git-dep@0\.0\.0/);
});

test('crossCheck reports a package missing from CycloneDX too', () => {
  const s = healthySpdx();
  s.packages.push(spdxDep('only-in-spdx', '1.0.0'));
  const problems = crossCheck(s, healthyCdx(), TARGET);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /SPDX document but not the CycloneDX one/);
});

test('crossCheck is silent when the two agree', () => {
  assert.deepEqual(crossCheck(healthySpdx(), healthyCdx(), TARGET), []);
});

test('crossCheck compares multisets, not sets', () => {
  // With `Array.includes`, a package listed twice on one side and once on the
  // other looked identical to both listing it once, so asymmetric duplicate
  // inflation passed silently.
  const c = healthyCdx();
  c.components.push(cdxDep('bulma', '1.0.4'));
  const problems = crossCheck(healthySpdx(), c, TARGET);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /bulma@1\.0\.4/);

  // And the count is reported when more than one copy is extra.
  const c2 = healthyCdx();
  c2.components.push(cdxDep('bulma', '1.0.4'), cdxDep('bulma', '1.0.4'));
  assert.match(crossCheck(healthySpdx(), c2, TARGET)[0], /x2 extra/);
});

test('symmetric duplicates warn but do not fail', () => {
  // npm can place the same name@version at two paths when it cannot hoist, so
  // a duplicate is a real closure shape rather than a defect. Failing on it
  // would be the false-red generator 48c57d5 reverted (#391, #525).
  const s = healthySpdx();
  const c = healthyCdx();
  s.packages.push(spdxDep('bulma', '1.0.4'));
  c.components.push(cdxDep('bulma', '1.0.4'));

  assert.deepEqual(inspect(s, TARGET), []);
  assert.deepEqual(inspect(c, TARGET), []);
  // Symmetric, so the two documents still agree with each other.
  assert.deepEqual(crossCheck(s, c, TARGET), []);
});

test('identities excludes the structural entries from the comparison', () => {
  // SPDX carries the subject as an entry and CycloneDX does not, so comparing
  // raw entry lists would report a permanent, meaningless disagreement.
  const ids = identities(healthySpdx(), TARGET);
  assert.ok(!ids.some(i => i.startsWith('consumer-closure:')));
  assert.ok(!ids.some(i => i.startsWith('bestax-consumer-closure-')));
  assert.deepEqual(ids, identities(healthyCdx(), TARGET));
});

// --- the subject is checked in BOTH formats ----------------------------------

test('rejects an SPDX subject at the wrong version', () => {
  // SPDX states its subject as an ordinary package entry, which was exempted
  // by name and never validated — so the document could identify a different
  // release than its filename and closure while every dependency entry was
  // correct.
  const doc = healthySpdx();
  doc.packages.find(p => p.name === `consumer-closure:${PKG}`).versionInfo =
    '5.11.1';
  const problems = inspect(doc, TARGET);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /carries version "5\.11\.1", expected "5\.11\.4"/);
});

test('rejects an SPDX document with no subject entry at all', () => {
  const doc = healthySpdx();
  doc.packages = doc.packages.filter(p => p.name !== `consumer-closure:${PKG}`);
  assert.ok(
    inspect(doc, TARGET).some(p => /does not say which package/.test(p))
  );
});

test('the subject check is symmetric across the two formats', () => {
  // Same defect, same detection, whichever document it lands in — the
  // asymmetry is what let the SPDX side go unchecked.
  const s = healthySpdx();
  s.packages.find(p => p.name === `consumer-closure:${PKG}`).versionInfo =
    '9.9.9';
  const c = healthyCdx();
  c.metadata.component.version = '9.9.9';
  assert.equal(inspect(s, TARGET).length, 1);
  assert.equal(inspect(c, TARGET).length, 1);
});

// --- the target must be in its own closure -----------------------------------

test('rejects a well-formed closure of something else', () => {
  // Copilot's finding on #594: every other assertion passes on a document that
  // simply does not contain the package it claims to describe.
  const doc = healthySpdx();
  doc.packages = doc.packages.filter(p => p.name !== PKG);
  const problems = inspect(doc, TARGET);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /is not in its own closure/);
});

test('rejects a target present at the wrong version', () => {
  // Catches the document and its filename disagreeing about the release.
  const doc = healthySpdx();
  doc.packages.find(p => p.name === PKG).versionInfo = '5.11.1';
  const problems = inspect(doc, TARGET);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /present at "5\.11\.1".*stamped 5\.11\.4/);
});

test('rejects a CycloneDX subject at the wrong version', () => {
  const doc = healthyCdx();
  doc.metadata.component.version = '5.11.1';
  assert.ok(
    inspect(doc, TARGET).some(p =>
      /metadata\.component carries version/.test(p)
    )
  );
});

// --- the floor ---------------------------------------------------------------

test('rejects a document that collapsed to the structural entries', () => {
  const doc = healthySpdx();
  doc.packages = doc.packages.filter(p =>
    structuralNames({ package: PKG, slug: SLUG }).has(p.name)
  );
  const problems = inspect(doc, TARGET);
  assert.match(problems[0], /only 0 catalogued package/);
});

test('rejects an empty document in both formats', () => {
  // Markers present, arrays empty: a real document that catalogued nothing,
  // which the floor must catch rather than the format detection.
  assert.match(
    inspect({ spdxVersion: 'SPDX-2.3', packages: [] }, TARGET)[0],
    /only 0 catalogued/
  );
  assert.match(
    inspect({ bomFormat: 'CycloneDX', components: [] }, TARGET)[0],
    /only 0 catalogued/
  );
});

test('rejects a document that is neither format', () => {
  assert.match(inspect({}, TARGET)[0], /neither SPDX .* nor CycloneDX/);
  assert.match(inspect(null, TARGET)[0], /neither SPDX .* nor CycloneDX/);
});

test('the floor counts catalogued packages, not entries', () => {
  // A floor of 3 against ALL entries would pass a document holding only the
  // structural names plus one real package, which is the collapse this is for.
  const doc = {
    spdxVersion: 'SPDX-2.3',
    packages: [
      {
        name: `bestax-consumer-closure-${SLUG}`,
        downloadLocation: 'NOASSERTION',
      },
      { name: `consumer-closure:${PKG}`, downloadLocation: 'NOASSERTION' },
      spdxDep('only-one'),
    ],
  };
  assert.match(inspect(doc, TARGET)[0], /only 1 catalogued package/);
});

// --- exemptions and normalization --------------------------------------------

test('the structural entries are exempt by NAME, not by a missing origin', () => {
  // A blanket "no origin is fine" exemption would readmit every github-actions
  // entry and every file component. Prove it is name-scoped by renaming one.
  const doc = healthySpdx();
  doc.packages[0] = {
    name: 'bestax-consumer-closure-WRONG',
    downloadLocation: 'NOASSERTION',
  };
  const problems = inspect(doc, TARGET);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /bestax-consumer-closure-WRONG/);
});

test('structuralNames matches what supply-chain.yml configures', () => {
  // These two strings are built in the workflow: the scratch package.json
  // `name`, and syft's `source.name`. If either changes there, this fails.
  assert.deepEqual(
    [...structuralNames({ package: PKG, slug: SLUG })],
    [`bestax-consumer-closure-${SLUG}`, `consumer-closure:${PKG}`]
  );
});

test('normalize picks the format off the document, not a flag', () => {
  assert.equal(normalize(healthySpdx()).format, 'spdx');
  assert.equal(normalize(healthyCdx()).format, 'cyclonedx');
  assert.equal(normalize({}), null);
});

// --- CLI ---------------------------------------------------------------------

test('readDocument names the file it could not read', () => {
  assert.throws(() => readDocument('/nope/missing.json'), /cannot read/);
  const bad = writeDoc({});
  fs.writeFileSync(bad, 'not json');
  assert.throws(() => readDocument(bad), /not valid JSON/);
});

test('parseArgs requires both documents and the target', () => {
  assert.throws(() => parseArgs([]), /--spdx is required/);
  assert.throws(() => parseArgs(['--spdx', 'a']), /--cdx is required/);
  assert.throws(
    () =>
      parseArgs(['--spdx', 'a', '--cdx', 'b', '--package', 'y', '--slug', 'z']),
    /--version is required/
  );
});

const cli = (spdx, cdx) => [
  '--spdx',
  spdx,
  '--cdx',
  cdx,
  '--package',
  PKG,
  '--slug',
  SLUG,
  '--version',
  VERSION,
];

test('main returns 0 on a clean pair and 1 on a dirty one', () => {
  assert.equal(main(cli(writeDoc(healthySpdx()), writeDoc(healthyCdx()))), 0);

  const doc = healthySpdx();
  doc.packages.push({
    name: 'actions/checkout',
    downloadLocation: 'NOASSERTION',
  });
  assert.equal(main(cli(writeDoc(doc), writeDoc(healthyCdx()))), 1);
});

test('main fails when the two documents disagree, though each is clean alone', () => {
  // The case two separate invocations could not catch: both documents satisfy
  // every per-document assertion and still describe different closures. This
  // is the shape a git dependency takes in CycloneDX, where nothing can
  // origin-check it.
  const c = healthyCdx();
  c.components.push(cdxDep('ghost-package', '9.9.9'));
  assert.deepEqual(inspect(healthySpdx(), TARGET), []);
  assert.deepEqual(inspect(c, TARGET), []);
  assert.equal(main(cli(writeDoc(healthySpdx()), writeDoc(c))), 1);
});

test('main rejects a document whose contents contradict its flag', () => {
  // The flags are a claim about each file; normalize() reads the format off
  // the document. Until those are compared the flags are decoration — the same
  // CycloneDX file passed twice satisfies every per-document assertion and
  // agrees with itself, while the release ships a `.spdx.json` that is not
  // SPDX. A `format:` typo on either sbom-action step produces exactly that.
  const cdx = writeDoc(healthyCdx());
  assert.equal(main(cli(cdx, cdx)), 1);

  const spdx = writeDoc(healthySpdx());
  assert.equal(main(cli(spdx, spdx)), 1);

  // Swapped, each individually well-formed.
  assert.equal(main(cli(cdx, spdx)), 1);
});

test('main separates usage and read errors from assertion failures', () => {
  // Exit 2 must not be readable as "the SBOM is wrong".
  assert.equal(main([]), 2);
  assert.equal(main(cli('/nope/missing.json', writeDoc(healthyCdx()))), 2);
});

// --- log injection through the rejection message -----------------------------

test('a rejected value cannot forge an Actions workflow command', () => {
  // The sharp version of this defect: the guard rejects the entry, and then
  // hands the attacker's newline straight back to the runner inside its own
  // `::error::` complaint, emitting a second forged command. Rejecting is not
  // enough if the rejection message re-introduces the value verbatim.
  const doc = healthySpdx();
  doc.packages.push({
    name: 'evil\n::error::FORGED',
    versionInfo: '1.0.0\n::notice::ALSO FORGED',
    downloadLocation: 'NOASSERTION',
  });
  for (const p of inspect(doc, TARGET)) {
    assert.ok(!p.includes('\n'), `problem carries a raw newline: ${p}`);
    assert.ok(!/^::/m.test(p), `problem could start a workflow command: ${p}`);
  }
});

test('forLog neutralises every value read out of a document', () => {
  assert.equal(forLog('1.0.0\n::error::x'), '"1.0.0\\n::error::x"');
  assert.equal(forLog('a\r\nb'), '"a\\r\\nb"');
  assert.equal(forLog(undefined), '""');
  assert.ok(!forLog('x\ny').includes('\n'));
});
