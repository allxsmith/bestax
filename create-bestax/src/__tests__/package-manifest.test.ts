import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'node:fs';

interface Manifest {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
}

function readManifest(relativePath: string): Manifest {
  return JSON.parse(
    readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  ) as Manifest;
}

const cli = readManifest('../../package.json');
// The installed library's own manifest, so the ranges compared are the ones
// a consumer's installer is asked to satisfy.
const library = readManifest(
  '../../node_modules/@allxsmith/bestax-bulma/package.json'
);

describe('package manifest', () => {
  it('provides every required peer of @allxsmith/bestax-bulma, with its range (#950)', () => {
    // npm installs these peers by itself, but Yarn 1 does not: without them
    // here, `yarn create bestax` warns that each one is unmet.
    const optional = library.peerDependenciesMeta ?? {};
    const required = Object.entries(library.peerDependencies ?? {}).filter(
      ([name]) => optional[name]?.optional !== true
    );

    expect(required.map(([name]) => name)).toEqual(
      expect.arrayContaining(['react', 'react-dom'])
    );
    for (const [name, range] of required) {
      expect({ name, range: cli.dependencies?.[name] }).toEqual({
        name,
        range,
      });
    }
  });
});
