/**
 * Load every JavaScript target in bulma-ui's export map, the way a consumer
 * would, and assert the exports actually arrive.
 *
 * This exists because prose was the only thing tying the rollup entry name to
 * the export-map target, and the same package proves that is not enough: its
 * main `require` condition points at `dist/index.cjs.js`, a `.js` file
 * carrying `exports.*` inside a `"type": "module"` package, so Node reads it
 * as ESM and the assignments never land. That has been shipping green because
 * nothing loaded it (#688). The `./constants` subpath had the identical defect
 * until it was emitted as `.cjs`.
 *
 * A file's extension decides its module type here, not the bundle's format, so
 * a rename that looks cosmetic silently empties an entry point. This test is
 * the thing that notices.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, it } from 'node:test';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const PKG_DIR = join(REPO, 'bulma-ui');
const manifest = JSON.parse(
  readFileSync(join(PKG_DIR, 'package.json'), 'utf8')
);
const require = createRequire(import.meta.url);

/** Absolute path for an export-map target such as `./dist/constants.cjs`. */
const target = spec => resolve(PKG_DIR, spec);

const built = existsSync(join(PKG_DIR, 'dist'));

describe('bulma-ui export map', () => {
  it('declares the constants subpath with both conditions', () => {
    const entry = manifest.exports['./constants'];
    assert.ok(entry, 'exports["./constants"] is missing');
    for (const condition of ['types', 'import', 'require']) {
      assert.ok(
        typeof entry[condition] === 'string',
        `exports["./constants"].${condition} is missing`
      );
    }
    // The extension is the load-bearing part: inside a `"type": "module"`
    // package only `.cjs` is read as CommonJS.
    assert.match(
      entry.require,
      /\.cjs$/,
      'the require condition must end in .cjs, or Node reads it as ESM and ' +
        'the CommonJS exports never land'
    );
  });

  it('points every constants condition at a file that exists', t => {
    if (!built) {
      t.skip('bulma-ui/dist is absent; run the build first');
      return;
    }
    const entry = manifest.exports['./constants'];
    for (const condition of ['types', 'import', 'require']) {
      assert.ok(
        existsSync(target(entry[condition])),
        `exports["./constants"].${condition} points at a missing file: ${entry[condition]}`
      );
    }
  });

  it('really loads the constants tuples, by require and by import', async t => {
    if (!built) {
      t.skip('bulma-ui/dist is absent; run the build first');
      return;
    }
    const entry = manifest.exports['./constants'];

    const cjs = require(target(entry.require));
    assert.ok(
      Array.isArray(cjs.validColors) && cjs.validColors.length > 0,
      'the require condition produced no validColors — the symptom of a ' +
        'CommonJS bundle being read as ESM, which yields an empty namespace ' +
        'on a Node with require(esm) and throws on an older one'
    );

    const esm = await import(pathToFileURL(target(entry.import)).href);
    assert.ok(Array.isArray(esm.validColors) && esm.validColors.length > 0);

    // Both conditions must serve the same surface, or a consumer's behaviour
    // depends on how they happened to import it.
    assert.deepEqual(
      Object.keys(cjs).sort(),
      Object.keys(esm).sort(),
      'the require and import conditions export different names'
    );
    assert.deepEqual([...cjs.validColors], [...esm.validColors]);
  });

  it('carries no React in the constants bundle', t => {
    if (!built) {
      t.skip('bulma-ui/dist is absent; run the build first');
      return;
    }
    // The whole reason the subpath exists: tooling reads the tuples without
    // loading React or any component.
    for (const condition of ['import', 'require']) {
      const source = readFileSync(
        target(manifest.exports['./constants'][condition]),
        'utf8'
      );
      assert.doesNotMatch(
        source,
        /\breact\b/i,
        `${condition} bundle mentions react; the subpath must stay React-free`
      );
    }
  });
});
