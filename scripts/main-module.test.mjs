/**
 * Guards on scripts/lib/main-module.mjs, the main-module check behind
 * scripts/gen-skills-repo.mjs. gen-skills-repo.test.mjs runs that script
 * through a linked checkout, end to end.
 */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isMainModule } from './lib/main-module.mjs';

const HERE = fileURLToPath(import.meta.url);
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'main-module-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));

test('a module is main when argv names its file', () => {
  assert.equal(isMainModule(import.meta.url, HERE), true);
});

test('a module is main when argv reaches it through a symbolic link', () => {
  const linkedDir = path.join(root, 'checkout');
  fs.symlinkSync(path.dirname(HERE), linkedDir);
  const linked = path.join(linkedDir, path.basename(HERE));
  assert.notEqual(
    pathToFileURL(linked).href,
    import.meta.url,
    'the URL comparison this replaces fails here'
  );
  assert.equal(isMainModule(import.meta.url, linked), true);

  const linkedFile = path.join(root, 'linked.mjs');
  fs.symlinkSync(HERE, linkedFile);
  assert.equal(isMainModule(import.meta.url, linkedFile), true);
});

test('another file, a missing path or no argv is not main', () => {
  const other = path.join(root, 'other.mjs');
  fs.writeFileSync(other, '');
  assert.equal(isMainModule(import.meta.url, other), false);
  assert.equal(isMainModule(import.meta.url, path.join(root, 'gone')), false);
  assert.equal(isMainModule(import.meta.url, null), false);
  assert.equal(isMainModule(import.meta.url, ''), false);
  assert.equal(
    isMainModule(pathToFileURL(path.join(root, 'gone')).href, HERE),
    false
  );
});

test('the default argv is the process’s own', () => {
  assert.equal(
    isMainModule(import.meta.url),
    isMainModule(import.meta.url, process.argv[1])
  );
});
