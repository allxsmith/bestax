import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  main,
  normalizeCycloneDxDocument,
  normalizeSpdxDocument,
  parseArgs,
} from './normalize-consumer-sbom.mjs';

const PKG = '@allxsmith/bestax-bulma';
const VERSION = '5.11.1';
const TARGET_ID = 'SPDXRef-Package-target';
const ROOT_ID = 'SPDXRef-DocumentRoot';
const SCRATCH_ID = 'SPDXRef-Package-scratch';
const DEP_ID = 'SPDXRef-Package-bulma';
const FILE_ID = 'SPDXRef-File-package-lock';

function sampleSpdx() {
  return {
    SPDXID: 'SPDXRef-DOCUMENT',
    name: PKG,
    packages: [
      {
        SPDXID: TARGET_ID,
        name: PKG,
        versionInfo: VERSION,
        downloadLocation: `https://registry.npmjs.org/${PKG}/-/${PKG.split('/').at(-1)}-${VERSION}.tgz`,
      },
      {
        SPDXID: SCRATCH_ID,
        name: 'bestax-consumer-closure-allxsmith-bestax-bulma',
        versionInfo: '0.0.0',
        downloadLocation: 'NOASSERTION',
      },
      {
        SPDXID: DEP_ID,
        name: 'bulma',
        versionInfo: '1.0.4',
        downloadLocation: 'https://registry.npmjs.org/bulma/-/bulma-1.0.4.tgz',
      },
      {
        SPDXID: ROOT_ID,
        name: PKG,
        versionInfo: VERSION,
        downloadLocation: 'NOASSERTION',
      },
    ],
    relationships: [
      {
        spdxElementId: DEP_ID,
        relationshipType: 'OTHER',
        relatedSpdxElement: FILE_ID,
      },
      {
        spdxElementId: ROOT_ID,
        relationshipType: 'CONTAINS',
        relatedSpdxElement: TARGET_ID,
      },
      {
        spdxElementId: ROOT_ID,
        relationshipType: 'CONTAINS',
        relatedSpdxElement: SCRATCH_ID,
      },
      {
        spdxElementId: 'SPDXRef-DOCUMENT',
        relationshipType: 'DESCRIBES',
        relatedSpdxElement: ROOT_ID,
      },
    ],
  };
}

function sampleCycloneDx() {
  return {
    metadata: {
      component: {
        'bom-ref': 'source-ref',
        type: 'file',
        name: PKG,
        version: VERSION,
      },
    },
    components: [
      {
        'bom-ref': 'target-ref',
        type: 'library',
        name: PKG,
        version: VERSION,
        purl: 'pkg:npm/%40allxsmith/bestax-bulma@5.11.1',
      },
      {
        'bom-ref': 'scratch-ref',
        type: 'library',
        name: 'bestax-consumer-closure-allxsmith-bestax-bulma',
        version: '0.0.0',
        purl: 'pkg:npm/bestax-consumer-closure-allxsmith-bestax-bulma@0.0.0',
      },
      {
        'bom-ref': 'dep-ref',
        type: 'library',
        name: 'bulma',
        version: '1.0.4',
        purl: 'pkg:npm/bulma@1.0.4',
      },
      {
        'bom-ref': 'file-ref',
        type: 'file',
        name: '/home/runner/work/_temp/consumer/package-lock.json',
      },
    ],
    dependencies: [
      { ref: 'scratch-ref', dependsOn: ['target-ref'] },
      { ref: 'target-ref', dependsOn: ['dep-ref'] },
      { ref: 'file-ref', dependsOn: [] },
    ],
  };
}

test('parseArgs requires the expected named options', () => {
  assert.deepEqual(
    parseArgs([
      '--package',
      PKG,
      '--version',
      VERSION,
      '--expected-count',
      '2',
      '--spdx',
      'a.json',
      '--cdx',
      'b.json',
    ]),
    {
      pkg: PKG,
      version: VERSION,
      expectedCount: 2,
      spdxPath: 'a.json',
      cdxPath: 'b.json',
    }
  );
  assert.throws(() => parseArgs(['--package', PKG]), /--version is required/);
  assert.throws(
    () => parseArgs(['--package', PKG, '--version', VERSION, '--bogus']),
    /unknown option/
  );
});

test('normalizeSpdxDocument removes scan-only packages and rewrites DESCRIBES', () => {
  const normalized = normalizeSpdxDocument(sampleSpdx(), {
    pkg: PKG,
    version: VERSION,
    expectedCount: 2,
  });

  assert.deepEqual(
    normalized.packages.map(entry => entry.name),
    [PKG, 'bulma']
  );
  assert.deepEqual(normalized.relationships, [
    {
      spdxElementId: DEP_ID,
      relationshipType: 'OTHER',
      relatedSpdxElement: FILE_ID,
    },
    {
      spdxElementId: 'SPDXRef-DOCUMENT',
      relationshipType: 'DESCRIBES',
      relatedSpdxElement: TARGET_ID,
    },
  ]);
});

test('normalizeCycloneDxDocument hoists the real target and drops scan scaffolding', () => {
  const normalized = normalizeCycloneDxDocument(sampleCycloneDx(), {
    pkg: PKG,
    version: VERSION,
    expectedCount: 2,
  });

  assert.equal(normalized.metadata.component['bom-ref'], 'target-ref');
  assert.deepEqual(
    normalized.components.map(entry => entry.name),
    ['bulma']
  );
  assert.deepEqual(normalized.dependencies, [
    { ref: 'target-ref', dependsOn: ['dep-ref'] },
  ]);
});

test('main rewrites both files in place', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'consumer-sbom-'));
  const spdxPath = join(dir, 'a.spdx.json');
  const cdxPath = join(dir, 'a.cdx.json');

  await writeFile(spdxPath, JSON.stringify(sampleSpdx()));
  await writeFile(cdxPath, JSON.stringify(sampleCycloneDx()));

  main([
    '--package',
    PKG,
    '--version',
    VERSION,
    '--expected-count',
    '2',
    '--spdx',
    spdxPath,
    '--cdx',
    cdxPath,
  ]);

  const spdx = JSON.parse(await readFile(spdxPath, 'utf8'));
  const cdx = JSON.parse(await readFile(cdxPath, 'utf8'));

  assert.deepEqual(
    spdx.packages.map(entry => entry.name),
    [PKG, 'bulma']
  );
  assert.equal(cdx.metadata.component.name, PKG);
  assert.deepEqual(
    cdx.components.map(entry => entry.name),
    ['bulma']
  );
});
