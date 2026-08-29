/**
 * Guards on check-consumer-sbom.mjs.
 *
 * The two cases that matter most are regressions that really happened, on
 * #529's own branch, and were found only by dispatching the workflow and
 * reading the JSON:
 *
 *   - a github-actions cataloger entry, from `.github/workflows` YAML shipped
 *     inside an upstream npm tarball;
 *   - every package listed twice, from selecting the whole `javascript`
 *     cataloger group.
 *
 * Both are reproduced below as documents this check must reject. If either
 * test is ever relaxed, the corresponding syft config in supply-chain.yml is
 * the thing to look at first.
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
  MIN_EXPECTED_PACKAGES,
  structuralNames,
  readDocument,
  inspect,
  parseArgs,
  main,
} from './check-consumer-sbom.mjs';

const PKG = '@allxsmith/bestax-bulma';
const SLUG = 'allxsmith-bestax-bulma';
const TARGET = { package: PKG, slug: SLUG, minPackages: MIN_EXPECTED_PACKAGES };

const dep = (name, version = '1.0.0') => ({
  name,
  versionInfo: version,
  downloadLocation: `${REGISTRY_PREFIX}${name}/-/${name}-${version}.tgz`,
});

/** The two entries syft legitimately adds that are not dependencies. */
const structural = [
  { name: `bestax-consumer-closure-${SLUG}`, downloadLocation: 'NOASSERTION' },
  { name: `consumer-closure:${PKG}`, downloadLocation: 'NOASSERTION' },
];

/** A healthy bulma-ui closure: five packages plus the two structural entries. */
const healthy = () => ({
  packages: [
    ...structural,
    dep('bulma', '1.0.4'),
    dep('react'),
    dep('react-dom'),
    dep('scheduler'),
    dep('loose-envify'),
  ],
});

function writeDoc(doc) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-consumer-sbom-'));
  const file = path.join(dir, 'sbom.spdx.json');
  fs.writeFileSync(file, JSON.stringify(doc));
  return file;
}

// --- the happy path ----------------------------------------------------------

test('a clean closure has no problems', () => {
  assert.deepEqual(inspect(healthy(), TARGET), []);
});

test('a closure that merely GREW still passes', () => {
  // The whole reason there is no expected count. A transitive dependency
  // publishing must never red this job.
  const doc = healthy();
  for (let i = 0; i < 200; i += 1) doc.packages.push(dep(`transitive-${i}`));
  assert.deepEqual(inspect(doc, TARGET), []);
});

test('a closure that merely SHRANK, but is still a closure, passes', () => {
  const doc = { packages: [...structural, dep('a'), dep('b'), dep('c')] };
  assert.deepEqual(inspect(doc, TARGET), []);
});

// --- the two real regressions ------------------------------------------------

test('rejects a github-actions cataloger entry (#529)', () => {
  const doc = healthy();
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

test("rejects a dependency's own yarn.lock dev closure leaking in", () => {
  // npm always excludes package-lock.json from a tarball but NOT yarn.lock, so
  // one dependency publishing without a `files:` field would inject its whole
  // dev tree. Those entries resolve to the yarn registry, a git URL, or
  // nothing — never to registry.npmjs.org via our lockfile's `resolved`.
  const doc = healthy();
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
  const problems = inspect(doc, TARGET);
  assert.equal(problems.length, 2);
});

test('the doubled-catalogers regression is not silently tolerated', () => {
  // Selecting the `javascript` GROUP enabled both javascript catalogers and
  // listed every package twice — bestax-migrate at 200. The package.json
  // cataloger carries no `resolved`, so the duplicates arrive with no registry
  // URL and are caught by the same assertion that catches everything else.
  const doc = healthy();
  doc.packages.push({ name: 'bulma', versionInfo: '1.0.4' });
  const problems = inspect(doc, TARGET);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /"bulma"/);
});

// --- the floor ---------------------------------------------------------------

test('rejects a document that collapsed to the structural entries', () => {
  const problems = inspect({ packages: structural }, TARGET);
  assert.match(problems[0], /only 0 catalogued package/);
});

test('rejects an empty document', () => {
  assert.match(inspect({ packages: [] }, TARGET)[0], /only 0 catalogued/);
});

test('rejects a document with no packages array at all', () => {
  assert.match(inspect({}, TARGET)[0], /no `packages` array/);
  assert.match(inspect(null, TARGET)[0], /no `packages` array/);
});

test('the floor counts catalogued packages, not entries', () => {
  // A floor of 3 against ENTRIES would pass a document holding only the two
  // structural names plus one real package, which is the collapse this is for.
  const doc = { packages: [...structural, dep('only-one')] };
  assert.match(inspect(doc, TARGET)[0], /only 1 catalogued package/);
});

// --- exemptions --------------------------------------------------------------

test('the structural entries are exempt by NAME, not by NOASSERTION', () => {
  // A blanket "no download location is fine" exemption would readmit every
  // github-actions entry. Prove the exemption is name-scoped by renaming one.
  const doc = healthy();
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

// --- CLI ---------------------------------------------------------------------

test('readDocument names the file it could not read', () => {
  assert.throws(() => readDocument('/nope/missing.json'), /cannot read/);
  const bad = writeDoc({});
  fs.writeFileSync(bad, 'not json');
  assert.throws(() => readDocument(bad), /not valid JSON/);
});

test('parseArgs requires all three flags', () => {
  assert.throws(() => parseArgs([]), /--file is required/);
  assert.throws(
    () => parseArgs(['--file', 'x', '--package', 'y']),
    /--slug is required/
  );
});

test('main returns 0 on a clean document and 1 on a dirty one', () => {
  const clean = writeDoc(healthy());
  assert.equal(main(['--file', clean, '--package', PKG, '--slug', SLUG]), 0);

  const doc = healthy();
  doc.packages.push({
    name: 'actions/checkout',
    downloadLocation: 'NOASSERTION',
  });
  const dirty = writeDoc(doc);
  assert.equal(main(['--file', dirty, '--package', PKG, '--slug', SLUG]), 1);
});

test('main separates usage and read errors from assertion failures', () => {
  // Exit 2 must not be readable as "the SBOM is wrong".
  assert.equal(main([]), 2);
  assert.equal(
    main(['--file', '/nope/missing.json', '--package', PKG, '--slug', SLUG]),
    2
  );
});
