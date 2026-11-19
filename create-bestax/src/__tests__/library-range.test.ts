import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import os from 'os';
import path from 'path';

const { LIBRARY, libraryRange } = await import('../library-range.js');

function readVersion(relativePath: string): string {
  return (
    JSON.parse(
      readFileSync(new URL(relativePath, import.meta.url), 'utf8')
    ) as { version: string }
  ).version;
}

function writeManifest(dir: string, manifest: object): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify(manifest));
}

describe('libraryRange (#1240)', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(path.join(os.tmpdir(), 'create-bestax-range-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('floors a scaffold from this checkout at the bulma-ui release it links', () => {
    const linked = readVersion(
      '../../node_modules/@allxsmith/bestax-bulma/package.json'
    );
    expect(linked).toBe(readVersion('../../../bulma-ui/package.json'));
    expect(libraryRange()).toBe(`^${linked}`);
  });

  it("returns a published manifest's range as written, reading nothing else", () => {
    // What pnpm publish leaves in the tarball, with no node_modules beside it.
    writeManifest(root, {
      version: '4.2.18',
      dependencies: { [LIBRARY]: '^5.37.0' },
    });

    expect(libraryRange(root)).toBe('^5.37.0');
  });

  it.each([
    ['workspace:^', '^5.43.0'],
    ['workspace:~', '~5.43.0'],
    ['workspace:*', '5.43.0'],
    ['workspace:^5.1.0', '^5.1.0'],
  ])('resolves %s as pnpm publish does, to %s', (declared, expected) => {
    writeManifest(root, {
      version: '0.0.0',
      dependencies: { [LIBRARY]: declared },
    });
    writeManifest(path.join(root, 'node_modules', LIBRARY), {
      version: '5.43.0',
    });

    expect(libraryRange(root)).toBe(expected);
  });

  it('names the manifest when it declares no library', () => {
    writeManifest(root, { version: '0.0.0', dependencies: {} });

    expect(() => libraryRange(root)).toThrow(
      `${path.join(root, 'package.json')} declares no ${LIBRARY} dependency.`
    );
  });
});
