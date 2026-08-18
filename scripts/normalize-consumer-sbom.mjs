#!/usr/bin/env node
/**
 * Trim Syft's scan scaffolding back out of the published consumer SBOMs (#424).
 *
 * Scanning a scratch directory is the right way to resolve a consumer closure,
 * but Syft then reports two things that are artifacts of how we collected the
 * evidence rather than packages in the consumer closure:
 *
 * - the scratch root package we created only to hold `npm install`
 * - a second "source" representation of that same scan subject
 *
 * The exact shape differs by format. SPDX emits a duplicate package for the
 * configured source alias; CycloneDX emits the scanned `package-lock.json` as a
 * file component. Both formats also include the scratch-project root package.
 *
 * This script keeps the document naming benefit of `source.name/version` while
 * removing those scan-only entries, then asserts the measured closure count so
 * a future Syft change cannot silently re-inflate the artifact.
 */
import fs from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export function parseArgs(argv) {
  let pkg = null;
  let version = null;
  let expectedCount = null;
  let spdxPath = null;
  let cdxPath = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--package') {
      pkg = argv[++i] ?? null;
    } else if (arg.startsWith('--package=')) {
      pkg = arg.slice('--package='.length);
    } else if (arg === '--version') {
      version = argv[++i] ?? null;
    } else if (arg.startsWith('--version=')) {
      version = arg.slice('--version='.length);
    } else if (arg === '--expected-count') {
      expectedCount = Number(argv[++i]);
    } else if (arg.startsWith('--expected-count=')) {
      expectedCount = Number(arg.slice('--expected-count='.length));
    } else if (arg === '--spdx') {
      spdxPath = argv[++i] ?? null;
    } else if (arg.startsWith('--spdx=')) {
      spdxPath = arg.slice('--spdx='.length);
    } else if (arg === '--cdx') {
      cdxPath = argv[++i] ?? null;
    } else if (arg.startsWith('--cdx=')) {
      cdxPath = arg.slice('--cdx='.length);
    } else if (arg.startsWith('-')) {
      throw new Error(`unknown option "${arg}"`);
    } else {
      throw new Error(`unexpected positional argument "${arg}"`);
    }
  }

  if (!pkg) throw new Error('--package is required');
  if (!version) throw new Error('--version is required');
  if (!Number.isInteger(expectedCount) || expectedCount < 1) {
    throw new Error('--expected-count must be a positive integer');
  }
  if (!spdxPath) throw new Error('--spdx is required');
  if (!cdxPath) throw new Error('--cdx is required');

  return { pkg, version, expectedCount, spdxPath, cdxPath };
}

function isScratchContainer(name, version) {
  return (
    typeof name === 'string' &&
    name.startsWith('bestax-consumer-closure-') &&
    version === '0.0.0'
  );
}

function assertSingle(items, why) {
  if (items.length !== 1) {
    throw new Error(`${why}: expected 1 match, found ${items.length}`);
  }
  return items[0];
}

export function normalizeSpdxDocument(
  document,
  { pkg, version, expectedCount }
) {
  const packages = Array.isArray(document.packages) ? document.packages : [];
  const target = assertSingle(
    packages.filter(
      entry =>
        entry?.name === pkg &&
        entry?.versionInfo === version &&
        entry?.downloadLocation !== 'NOASSERTION'
    ),
    `${pkg}@${version}: real SPDX package`
  );

  const removeIds = new Set(
    packages
      .filter(
        entry =>
          isScratchContainer(entry?.name, entry?.versionInfo) ||
          (entry?.name === pkg &&
            entry?.versionInfo === version &&
            entry?.downloadLocation === 'NOASSERTION')
      )
      .map(entry => entry.SPDXID)
  );

  const normalizedPackages = packages.filter(
    entry => !removeIds.has(entry.SPDXID)
  );
  const relationships = Array.isArray(document.relationships)
    ? document.relationships
    : [];
  const normalizedRelationships = relationships
    .filter(
      rel =>
        rel?.relationshipType !== 'DESCRIBES' &&
        !removeIds.has(rel?.spdxElementId) &&
        !removeIds.has(rel?.relatedSpdxElement)
    )
    .concat({
      spdxElementId: 'SPDXRef-DOCUMENT',
      relationshipType: 'DESCRIBES',
      relatedSpdxElement: target.SPDXID,
    });

  if (normalizedPackages.length !== expectedCount) {
    throw new Error(
      `${pkg}@${version}: expected ${expectedCount} SPDX packages after normalization, found ${normalizedPackages.length}`
    );
  }

  return {
    ...document,
    packages: normalizedPackages,
    relationships: normalizedRelationships,
  };
}

export function normalizeCycloneDxDocument(
  document,
  { pkg, version, expectedCount }
) {
  const components = Array.isArray(document.components)
    ? document.components
    : [];
  const target = assertSingle(
    components.filter(
      entry => entry?.name === pkg && entry?.version === version && entry?.purl
    ),
    `${pkg}@${version}: real CycloneDX component`
  );

  const removeRefs = new Set(
    components
      .filter(
        entry =>
          isScratchContainer(entry?.name, entry?.version) ||
          (entry?.type === 'file' &&
            typeof entry?.name === 'string' &&
            entry.name.endsWith('/package-lock.json'))
      )
      .map(entry => entry['bom-ref'])
  );

  const normalizedComponents = components.filter(
    entry =>
      entry['bom-ref'] !== target['bom-ref'] &&
      !removeRefs.has(entry['bom-ref'])
  );
  const dependencies = Array.isArray(document.dependencies)
    ? document.dependencies
    : [];
  const normalizedDependencies = dependencies
    .filter(entry => !removeRefs.has(entry?.ref))
    .map(entry => ({
      ...entry,
      dependsOn: Array.isArray(entry.dependsOn)
        ? entry.dependsOn.filter(ref => !removeRefs.has(ref))
        : [],
    }));

  if (normalizedComponents.length + 1 !== expectedCount) {
    throw new Error(
      `${pkg}@${version}: expected ${expectedCount} CycloneDX closure packages after normalization, found ${normalizedComponents.length + 1}`
    );
  }

  return {
    ...document,
    metadata: {
      ...document.metadata,
      component: target,
    },
    components: normalizedComponents,
    dependencies: normalizedDependencies,
  };
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const metadata = {
    pkg: args.pkg,
    version: args.version,
    expectedCount: args.expectedCount,
  };

  writeJson(
    args.spdxPath,
    normalizeSpdxDocument(readJson(args.spdxPath), metadata)
  );
  writeJson(
    args.cdxPath,
    normalizeCycloneDxDocument(readJson(args.cdxPath), metadata)
  );

  console.log(
    `normalized consumer SBOMs for ${args.pkg}@${args.version} to ${args.expectedCount} closure packages`
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
