/**
 * Covers bulma-ui/scripts/pack-pointer-files.mjs (#344, #1718): the prepack /
 * postpack pair that ships the consumer copy of AGENTS.md as the tarball's
 * CLAUDE.md and puts the contributor file back.
 *
 * `pnpm pack --dry-run` runs prepack and never postpack, so the case that
 * matters is a prepack with no postpack after it, then another pack. Each test
 * runs a copy of the script in a package directory of its own, since the
 * script finds CLAUDE.md beside the `scripts/` folder it sits in.
 */
import { onTestFinished, test } from 'vitest';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(
  new URL('../bulma-ui/scripts/pack-pointer-files.mjs', import.meta.url)
);
const CONTRIBUTOR = '# bulma-ui\n\nThe contributor guide.\n';
const CONSUMER = '# @allxsmith/bestax-bulma\n\nThe consumer guide.\n';

/** A package directory holding CLAUDE.md, AGENTS.md and the script. */
function makePackage() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-pointer-files-'));
  onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'scripts'));
  fs.copyFileSync(SCRIPT, path.join(dir, 'scripts', 'pack-pointer-files.mjs'));
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), CONTRIBUTOR);
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), CONSUMER);
  const run = mode =>
    spawnSync(
      process.execPath,
      [path.join(dir, 'scripts', 'pack-pointer-files.mjs'), mode],
      { encoding: 'utf8' }
    );
  const read = name => {
    const file = path.join(dir, name);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  };
  return { dir, run, read };
}

test('a pack swaps in the consumer copy and puts the contributor file back', () => {
  const pkg = makePackage();
  assert.equal(pkg.run('prepack').status, 0);
  assert.equal(pkg.read('CLAUDE.md'), CONSUMER);
  assert.equal(pkg.read('CLAUDE.md.bak'), CONTRIBUTOR);
  assert.equal(pkg.run('postpack').status, 0);
  assert.equal(pkg.read('CLAUDE.md'), CONTRIBUTOR);
  assert.equal(pkg.read('CLAUDE.md.bak'), null);
});

test('a pack after a dry run goes on from the swap the dry run left', () => {
  const pkg = makePackage();
  // The dry run: prepack with no postpack after it.
  assert.equal(pkg.run('prepack').status, 0);
  const written = name => fs.statSync(path.join(pkg.dir, name)).mtimeMs;
  const before = [written('CLAUDE.md'), written('CLAUDE.md.bak')];
  const next = pkg.run('prepack');
  assert.equal(next.status, 0, next.stderr);
  // The swap it wants is already there, so it writes neither file.
  assert.deepEqual([written('CLAUDE.md'), written('CLAUDE.md.bak')], before);
  assert.equal(pkg.read('CLAUDE.md'), CONSUMER);
  assert.equal(pkg.read('CLAUDE.md.bak'), CONTRIBUTOR);
  assert.equal(pkg.run('postpack').status, 0);
  assert.equal(pkg.read('CLAUDE.md'), CONTRIBUTOR);
  assert.equal(pkg.read('CLAUDE.md.bak'), null);
});

test('a pack refuses, and changes nothing, once the swapped file was edited', () => {
  const pkg = makePackage();
  assert.equal(pkg.run('prepack').status, 0);
  const edited = `${CONSUMER}\nAn edit made while it was swapped.\n`;
  fs.writeFileSync(path.join(pkg.dir, 'CLAUDE.md'), edited);
  const next = pkg.run('prepack');
  assert.equal(next.status, 1);
  assert.match(next.stderr, /CLAUDE\.md\.bak holds the contributor CLAUDE\.md/);
  assert.equal(pkg.read('CLAUDE.md'), edited);
  assert.equal(pkg.read('CLAUDE.md.bak'), CONTRIBUTOR);
});

test('a pack refuses, and changes nothing, when only the backup is left', () => {
  const pkg = makePackage();
  assert.equal(pkg.run('prepack').status, 0);
  fs.rmSync(path.join(pkg.dir, 'CLAUDE.md'));
  const next = pkg.run('prepack');
  assert.equal(next.status, 1);
  assert.match(next.stderr, /CLAUDE\.md\.bak holds the contributor CLAUDE\.md/);
  assert.equal(pkg.read('CLAUDE.md'), null);
  assert.equal(pkg.read('CLAUDE.md.bak'), CONTRIBUTOR);
});
