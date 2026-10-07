import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'node:fs';
import semver from 'semver';

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

/**
 * Whether every version the CLI's range can install also satisfies the
 * library's peer range, which is all Yarn 1 checks. A narrower range passes on
 * purpose: the React matrix legs (.github/scripts/pin-react.mjs) rewrite this
 * manifest's react entries to a single major.
 */
function satisfiesPeer(cliRange: string | undefined, peerRange: string) {
  return cliRange !== undefined && semver.subset(cliRange, peerRange);
}

const cli = readManifest('../../package.json');
// The installed library's own manifest, so the ranges compared are the ones
// a consumer's installer is asked to satisfy.
const library = readManifest(
  '../../node_modules/@allxsmith/bestax-bulma/package.json'
);

describe('package manifest', () => {
  it('provides every required peer of @allxsmith/bestax-bulma within its range (#950)', () => {
    // npm installs these peers by itself, but Yarn 1 does not: without them
    // here, `yarn create bestax` warns that each one is unmet.
    const optional = library.peerDependenciesMeta ?? {};
    const required = Object.entries(library.peerDependencies ?? {}).filter(
      ([name]) => optional[name]?.optional !== true
    );

    expect(required.map(([name]) => name)).toEqual(
      expect.arrayContaining(['react', 'react-dom'])
    );
    for (const [name, peerRange] of required) {
      const cliRange = cli.dependencies?.[name];
      // Named in the object so a failure says which peer and which ranges.
      expect({
        name,
        cliRange,
        peerRange,
        withinPeer: satisfiesPeer(cliRange, peerRange),
      }).toEqual({ name, cliRange, peerRange, withinPeer: true });
    }
  });

  it('accepts a single pinned major and rejects a range the peer has dropped', () => {
    const peer = '^18.0.0 || ^19.0.0';
    expect(satisfiesPeer(peer, peer)).toBe(true);
    expect(satisfiesPeer('^18', peer)).toBe(true);
    expect(satisfiesPeer('^19', peer)).toBe(true);
    expect(satisfiesPeer(peer, '^19.0.0')).toBe(false);
    expect(satisfiesPeer('^20', peer)).toBe(false);
    expect(satisfiesPeer(undefined, peer)).toBe(false);
  });
});
