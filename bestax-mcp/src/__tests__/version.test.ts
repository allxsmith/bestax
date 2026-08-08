/**
 * Version drift detection.
 *
 * This is the deliberate divergence from a remote-fetch server: because the
 * index is pinned, the server can tell the user when it does not describe what
 * they have installed. Getting it wrong in either direction is costly — a
 * missed major bump means confidently documenting props that do not exist, and
 * a warning on every response is a warning a model learns to ignore.
 */
import { describe, expect, it, afterEach } from '@jest/globals';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  findInstalledVersion,
  resolveVersions,
  versionNote,
  type VersionInfo,
} from '../version.js';

const temps: string[] = [];

async function projectWith(version: string | null, depth = 0) {
  const root = await mkdtemp(join(tmpdir(), 'bestax-mcp-'));
  temps.push(root);
  if (version) {
    const pkgDir = join(root, 'node_modules', '@allxsmith', 'bestax-bulma');
    await mkdir(pkgDir, { recursive: true });
    await writeFile(
      join(pkgDir, 'package.json'),
      JSON.stringify({ name: '@allxsmith/bestax-bulma', version })
    );
  }
  // A nested working directory, to prove the walk goes up.
  let cwd = root;
  for (let i = 0; i < depth; i++) {
    cwd = join(cwd, `nested${i}`);
  }
  if (depth) await mkdir(cwd, { recursive: true });
  return cwd;
}

afterEach(async () => {
  delete process.env.BESTAX_MCP_NO_VERSION_CHECK;
  await Promise.all(
    temps.splice(0).map(d => rm(d, { recursive: true, force: true }))
  );
});

describe('findInstalledVersion', () => {
  it('finds the package in the nearest node_modules', async () => {
    const cwd = await projectWith('5.8.3');
    expect(await findInstalledVersion(cwd)).toBe('5.8.3');
  });

  it('walks up from a nested working directory', async () => {
    const cwd = await projectWith('4.1.0', 3);
    expect(await findInstalledVersion(cwd)).toBe('4.1.0');
  });

  it('returns null when the library is not installed', async () => {
    const cwd = await projectWith(null);
    // Walks to the filesystem root without finding one. Not an error: someone
    // may be evaluating the library before installing it.
    expect(await findInstalledVersion(cwd)).toBeNull();
  });
});

describe('resolveVersions', () => {
  it('reports no drift when the versions agree', async () => {
    const cwd = await projectWith('5.8.3');
    expect(await resolveVersions('5.8.3', cwd)).toMatchObject({
      installed: '5.8.3',
      drift: 'none',
    });
  });

  it.each([
    ['5.8.3', '5.8.1', 'patch'],
    ['5.8.3', '5.2.0', 'minor'],
    ['5.8.3', '4.9.9', 'major'],
  ])('classifies %s vs %s as %s drift', async (indexed, installed, drift) => {
    const cwd = await projectWith(installed);
    expect((await resolveVersions(indexed, cwd)).drift).toBe(drift);
  });

  it('reports no drift when the library is absent', async () => {
    const cwd = await projectWith(null);
    expect(await resolveVersions('5.8.3', cwd)).toMatchObject({
      installed: null,
      drift: 'none',
    });
  });

  it('skips the check entirely when opted out', async () => {
    process.env.BESTAX_MCP_NO_VERSION_CHECK = '1';
    const cwd = await projectWith('1.0.0');
    expect(await resolveVersions('5.8.3', cwd)).toMatchObject({
      installed: null,
      drift: 'none',
    });
  });
});

describe('versionNote', () => {
  const info = (over: Partial<VersionInfo>): VersionInfo => ({
    indexed: '5.8.3',
    installed: '5.8.3',
    drift: 'none',
    ...over,
  });

  it('warns on a major mismatch, naming both versions', () => {
    const note = versionNote(info({ installed: '4.0.0', drift: 'major' }));
    expect(note).toContain('5.8.3');
    expect(note).toContain('4.0.0');
  });

  it('warns on a minor mismatch, where props can move', () => {
    expect(versionNote(info({ installed: '5.2.0', drift: 'minor' }))).toContain(
      '⚠'
    );
  });

  it('stays quiet on patch drift, so the real warnings keep their weight', () => {
    expect(
      versionNote(info({ installed: '5.8.1', drift: 'patch' }))
    ).toBeNull();
  });

  it('stays quiet when the versions agree or nothing is installed', () => {
    expect(versionNote(info({}))).toBeNull();
    expect(versionNote(info({ installed: null, drift: 'unknown' }))).toBeNull();
  });
});
