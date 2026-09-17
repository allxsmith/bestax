/**
 * Load bulma-ui's `./constants` export the way a consumer would, and assert
 * the exports actually arrive.
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
 *
 * The main `.` entry is deliberately not loaded here: it carries the same
 * defect, it is tracked as #688, and its bundle is not React-free, so the last
 * assertion below does not generalise to it. Extending this file is the shape
 * that fix should take.
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

/** Absolute path for an export-map target such as `./dist/constants.cjs`. */
const target = spec => resolve(PKG_DIR, spec);

/**
 * These cases load built artifacts, so they need the build. They ASSERT that
 * rather than skipping: a guard against an entry point that silently exports
 * nothing must not itself be silenceable, and `node --test` exits 0 on a
 * skip. `pnpm all` and ci.yml both build before testing, and turbo's
 * `@allxsmith/eslint-plugin-bestax#test` edge builds `bulma-ui` for the
 * package suite too.
 */
const requireBuilt = () =>
  assert.ok(
    existsSync(join(PKG_DIR, 'dist')),
    'bulma-ui/dist is absent, so this suite cannot load what it exists to ' +
      'check. Run `pnpm --filter @allxsmith/bestax-bulma build` first, or ' +
      'the whole gate with `pnpm all`.'
  );

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

  it('points every constants condition at a file that exists', () => {
    requireBuilt();
    const entry = manifest.exports['./constants'];
    for (const condition of ['types', 'import', 'require']) {
      assert.ok(
        existsSync(target(entry[condition])),
        `exports["./constants"].${condition} points at a missing file: ${entry[condition]}`
      );
    }
  });

  it('really loads the constants tuples, by require and by import', async () => {
    requireBuilt();
    const entry = manifest.exports['./constants'];

    // Resolve by SPECIFIER, not by path, so Node's own condition matching is
    // what picks the file. Loading `target(entry.require)` directly proves the
    // file works and says nothing about the map choosing it: a `"default"`
    // inserted above `"require"` would keep a path-based assertion green while
    // handing consumers something else. The require anchor has to sit in a
    // package that declares the dependency, since the linker is isolated.
    const consumerRequire = createRequire(
      pathToFileURL(join(REPO, 'eslint-plugin', 'package.json')).href
    );
    const cjs = consumerRequire('@allxsmith/bestax-bulma/constants');
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

  it("loads the plugin's own published entry", async () => {
    requireBuilt();
    const dist = join(REPO, 'eslint-plugin', 'dist', 'index.js');
    assert.ok(
      existsSync(dist),
      'eslint-plugin/dist is absent; run its build first'
    );
    // Same gap as the subpath, one package over: `moduleResolution: bundler`
    // accepts an extensionless relative import and `tsc` emits it verbatim,
    // which Node ESM rejects — while jest's moduleNameMapper strips `.js` and
    // so passes either spelling. Nothing else in the repo loads this file.
    const plugin = await import(pathToFileURL(dist).href);
    const p = plugin.default;
    assert.equal(typeof p.meta?.version, 'string');
    assert.deepEqual(Object.keys(p.rules).sort(), [
      'no-color-as-surface',
      'no-deprecated-props',
      'no-inert-flex-props',
      'valid-helper-value',
    ]);
    // Loading it also exercises `@allxsmith/bestax-bulma/constants` through
    // Node's own resolver, since values.ts imports it by specifier.
    assert.ok(Array.isArray(p.configs.recommended.files));
  });

  it('carries no React in the constants bundle', () => {
    requireBuilt();
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
