/**
 * Holds the shared skill-discovery predicate to what the bundlers need
 * (#544's review round).
 *
 * Driven against a real temp directory rather than fixtures-in-memory,
 * because the finding it freezes is a filesystem one: Dirent.isDirectory()
 * is false for a symlink to a directory, so a symlinked skill silently
 * stopped bundling while the roster check told you to delete its entries.
 */
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  readSkillDirs,
  readSkillNames,
  rosterDiff,
} from './lib/skill-dirs.mjs';

async function scratch() {
  const dir = await mkdtemp(join(tmpdir(), 'skill-dirs-'));
  const skill = async name => {
    await mkdir(join(dir, name), { recursive: true });
    await writeFile(join(dir, name, 'SKILL.md'), '---\nname: x\n---\n');
  };
  return { dir, skill };
}

test('a symlinked skill directory is discovered', async () => {
  const { dir, skill } = await scratch();
  try {
    await skill('bestax-real');
    await symlink(join(dir, 'bestax-real'), join(dir, 'bestax-linked'));
    assert.deepEqual(await readSkillNames(dir), [
      'bestax-linked',
      'bestax-real',
    ]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a dangling symlink is not a skill', async () => {
  const { dir, skill } = await scratch();
  try {
    await skill('bestax-a');
    await symlink(join(dir, 'gone'), join(dir, 'bestax-dangling'));
    assert.deepEqual(await readSkillNames(dir), ['bestax-a']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('dot-directories: tooling is skipped, a dotted skill is reported', async () => {
  const { dir, skill } = await scratch();
  try {
    await skill('bestax-a');
    await mkdir(join(dir, '.cache'));
    await skill('.draft');
    const dirs = await readSkillDirs(dir);
    assert.deepEqual(
      dirs.map(d => d.name),
      ['.draft', 'bestax-a']
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('sorting is by code point, not locale', async () => {
  const { dir, skill } = await scratch();
  try {
    // Under a collation-sensitive sort these two can swap on some machines,
    // which flakes every regenerate-and-diff gate downstream.
    await skill('bestax-ch');
    await skill('bestax-c-x');
    const names = await readSkillNames(dir);
    assert.deepEqual(names, [...names].sort());
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('rosterDiff reports both directions by name', () => {
  const { missing, extra } = rosterDiff(['a', 'c'], ['a', 'b']);
  assert.deepEqual(missing, ['b']);
  assert.deepEqual(extra, ['c']);
  assert.deepEqual(rosterDiff(['a'], ['a']), { missing: [], extra: [] });
});
