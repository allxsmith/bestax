/**
 * Which bestax-bulma release a migrated file can count on (#2178), read from
 * packages written to a temp directory.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BESTAX_FLOOR } from '../deps-common.js';
import { bestaxFloorFor, readBestaxPackages } from '../bestax-floor.js';
import { compareVersions } from '../semver-range.js';
import { CLASSNAME_SINCE } from '../../bloomer/mapping.js';
import { ROOTS } from '../../bulma-classes/class-map.js';

const dirs: string[] = [];
afterAll(() => {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
});

function project(files: Record<string, unknown>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bestax-floor-'));
  dirs.push(dir);
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(
      path.join(dir, file),
      typeof content === 'string' ? content : JSON.stringify(content)
    );
  }
  return dir;
}

const bestax = (range: string, section = 'dependencies') => ({
  [section]: { '@allxsmith/bestax-bulma': range },
});

describe('readBestaxPackages and bestaxFloorFor', () => {
  it('counts on the floor of the range a package declares', () => {
    const dir = project({ 'package.json': bestax('^5.80.0') });
    const file = path.join(dir, 'src/App.tsx');
    expect(bestaxFloorFor(file, readBestaxPackages([dir]), true)).toBe(
      '5.80.0'
    );
    // --no-deps leaves a declared range as it is, so it still counts.
    expect(bestaxFloorFor(file, readBestaxPackages([dir]), false)).toBe(
      '5.80.0'
    );
  });

  it('takes the lowest floor over every section that declares it', () => {
    const dir = project({
      'package.json': {
        ...bestax('^5.80.0'),
        ...bestax('^5', 'devDependencies'),
      },
    });
    expect(
      bestaxFloorFor(path.join(dir, 'a.tsx'), readBestaxPackages([dir]), true)
    ).toBe('5.0.0');
  });

  it("counts on nothing when a declared range can't be read", () => {
    const dir = project({
      'package.json': bestax('latest', 'devDependencies'),
    });
    expect(
      bestaxFloorFor(path.join(dir, 'a.tsx'), readBestaxPackages([dir]), true)
    ).toBeUndefined();
  });

  it('counts on the range the run adds to a package that declares none', () => {
    const dir = project({
      'package.json': { dependencies: { react: '^19' } },
      'src/App.tsx': '',
    });
    const file = path.join(dir, 'src/App.tsx');
    // A file named on the command line writes the package around it.
    const packages = readBestaxPackages([file]);
    expect(bestaxFloorFor(file, packages, true)).toBe(BESTAX_FLOOR);
    expect(bestaxFloorFor(file, packages, undefined)).toBe(BESTAX_FLOOR);
    // Under --no-deps nothing adds it.
    expect(bestaxFloorFor(file, packages, false)).toBeUndefined();
  });

  it("counts on nothing in a package below the target, which the run doesn't write", () => {
    const dir = project({
      'package.json': { private: true },
      'apps/web/package.json': { dependencies: { react: '^19' } },
    });
    const packages = readBestaxPackages([dir]);
    expect(
      bestaxFloorFor(path.join(dir, 'apps/web/src/App.tsx'), packages, true)
    ).toBeUndefined();
    // The root package is the one the run writes.
    expect(bestaxFloorFor(path.join(dir, 'App.tsx'), packages, true)).toBe(
      BESTAX_FLOOR
    );
  });

  it('reads the innermost package around the file', () => {
    const dir = project({
      'package.json': bestax('^5'),
      'apps/web/package.json': bestax('^5.79.0'),
    });
    const packages = readBestaxPackages([dir]);
    expect(
      bestaxFloorFor(path.join(dir, 'apps/web/src/App.tsx'), packages, true)
    ).toBe('5.79.0');
    expect(
      bestaxFloorFor(path.join(dir, 'apps/web-old/App.tsx'), packages, true)
    ).toBe('5.0.0');
  });

  it('counts on nothing with no package around the file, or no facts', () => {
    const dir = project({ 'package.json': bestax('^5.80.0') });
    expect(
      bestaxFloorFor('/elsewhere/App.tsx', readBestaxPackages([dir]), true)
    ).toBeUndefined();
    expect(bestaxFloorFor(path.join(dir, 'a.tsx'), undefined, true)).toBe(
      undefined
    );
  });

  it("counts on nothing in a package whose manifest doesn't parse", () => {
    const dir = project({
      'package.json': bestax('^5.80.0'),
      'apps/web/package.json': '{ "name": "web", }',
    });
    const packages = readBestaxPackages([dir]);
    // Not the root's floor: the broken package may resolve its own.
    expect(
      bestaxFloorFor(path.join(dir, 'apps/web/App.tsx'), packages, true)
    ).toBeUndefined();
  });

  it('reads bestax-bulma where the manifest step does, so a peer range adds no floor', () => {
    const dir = project({
      'package.json': bestax('^5.0.0', 'peerDependencies'),
      'src/App.tsx': '',
    });
    const file = path.join(dir, 'src/App.tsx');
    // The step adds the range to dependencies beside the peer one.
    expect(bestaxFloorFor(file, readBestaxPackages([file]), true)).toBe(
      BESTAX_FLOOR
    );
  });

  it("counts on nothing in a manifest the step can't parse either", () => {
    const dir = project({
      'package.json': '\uFEFF{ "dependencies": { "react": "^19" } }',
      'src/App.tsx': '',
    });
    const file = path.join(dir, 'src/App.tsx');
    expect(bestaxFloorFor(file, readBestaxPackages([file]), true)).toBe(
      undefined
    );
  });

  it('counts on nothing from a format-only manifest the run writes, which installs nothing', () => {
    const dir = project({
      'package.json': { name: 'app', ...bestax('^5.0.0') },
      'src/esm/package.json': { type: 'module' },
      'src/esm/a.tsx': '',
    });
    const target = path.join(dir, 'src/esm');
    expect(
      bestaxFloorFor(
        path.join(target, 'a.tsx'),
        readBestaxPackages([target]),
        true
      )
    ).toBeUndefined();
  });

  it('takes an empty manifest the run writes as the package', () => {
    const dir = project({ 'src/package.json': '{}', 'src/App.tsx': '' });
    const file = path.join(dir, 'src/App.tsx');
    expect(bestaxFloorFor(file, readBestaxPackages([file]), true)).toBe(
      BESTAX_FLOOR
    );
  });

  it('passes over a manifest that only marks a module format', () => {
    const dir = project({
      'package.json': { name: 'app', ...bestax('^5.80.0') },
      'src/esm/package.json': { type: 'module' },
    });
    expect(
      bestaxFloorFor(
        path.join(dir, 'src/esm/a.tsx'),
        readBestaxPackages([dir]),
        true
      )
    ).toBe('5.80.0');
  });

  it('adds a range that reaches every release a conversion waits for', () => {
    const releases = [
      ...Object.values(CLASSNAME_SINCE),
      ...Object.values(ROOTS).flatMap(entry =>
        entry.status === 'mapped' && entry.classNameSince
          ? [entry.classNameSince]
          : []
      ),
    ];
    expect(releases.length).toBeGreaterThan(0);
    for (const release of releases) {
      expect(compareVersions(BESTAX_FLOOR, release)).toBeGreaterThanOrEqual(0);
    }
  });
});
