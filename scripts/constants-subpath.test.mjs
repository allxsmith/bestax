/**
 * Load bulma-ui's `./constants` export the way a consumer would, and assert
 * the exports actually arrive.
 *
 * This exists because prose was the only thing tying the rollup entry name to
 * the export-map target, and the same package proves that is not enough: the
 * root `require` condition pointed at `dist/index.cjs.js`, a `.js` file
 * carrying `exports.*` inside a `"type": "module"` package, so Node read it as
 * ESM, which no CommonJS bundle survives (#688). The `./constants` subpath had
 * the identical defect until it was emitted as `.cjs`. Both entries are loaded
 * by a test now — this one, and its counterpart in
 * `publishable-manifests.test.mjs` for the root.
 *
 * A file's extension decides its module type here, not the bundle's format, so
 * a rename that looks cosmetic silently empties an entry point. This test is
 * the thing that notices.
 *
 * The same rule governs the TYPES half, one step less obviously. A single
 * `types` target is read as ESM in a `"type": "module"` package however the
 * runtime file is spelled, so a `module: node16` CommonJS consumer answered
 * the subpath with TS1479 while the require condition it points at loaded
 * fine. Hence a `.d.cts` per condition, and hence the last case here
 * typechecking a real consumer rather than asserting the map's shape and
 * hoping.
 *
 * The root `.` entry is not loaded here: its bundle is not React-free, so the
 * last assertion below does not generalise to it. It has a load test of its
 * own in `publishable-manifests.test.mjs`, added with the #688 fix.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
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

/**
 * Every file the `./constants` entry names, as [label, path] pairs, whichever
 * shape the map is written in. Both conditions carry a `types` of their own,
 * so a flat read would miss half of them.
 */
const constantsTargets = () => {
  const entry = manifest.exports['./constants'];
  return ['import', 'require'].flatMap(condition =>
    ['types', 'default'].map(field => [
      `${condition}.${field}`,
      entry[condition][field],
    ])
  );
};

describe('bulma-ui export map', () => {
  it('declares the constants subpath with per-condition types', () => {
    const entry = manifest.exports['./constants'];
    assert.ok(entry, 'exports["./constants"] is missing');
    for (const condition of ['import', 'require']) {
      for (const field of ['types', 'default']) {
        assert.equal(
          typeof entry[condition]?.[field],
          'string',
          `exports["./constants"].${condition}.${field} is missing. Both ` +
            'conditions need their own `types`, because one target cannot ' +
            'describe an ESM and a CommonJS reading of the same module.'
        );
      }
    }
    // The extensions are the load-bearing part. Inside a `"type": "module"`
    // package only `.cjs` is read as CommonJS by Node, and only `.d.cts` is
    // read as CommonJS by TypeScript.
    assert.match(
      entry.require.default,
      /\.cjs$/,
      'the require condition must end in .cjs, or Node reads it as ESM and ' +
        'the CommonJS exports never land'
    );
    assert.match(
      entry.require.types,
      /\.d\.cts$/,
      "the require condition's types must end in .d.cts, or a node16 " +
        'CommonJS consumer gets TS1479 on an entry that loads fine'
    );
    assert.match(entry.import.default, /\.esm\.js$/);
    assert.match(entry.import.types, /(?<!\.c)\.d\.ts$/);
  });

  it('points every constants condition at a file that exists', () => {
    requireBuilt();
    for (const [label, spec] of constantsTargets()) {
      assert.ok(
        existsSync(target(spec)),
        `exports["./constants"].${label} points at a missing file: ${spec}`
      );
    }
  });

  it('serves the CommonJS types as a copy of the ESM ones', () => {
    requireBuilt();
    const entry = manifest.exports['./constants'];
    // The build copies the declaration rather than re-exporting from it,
    // which is sound only while the source module imports nothing: a `.d.cts`
    // re-exporting from a `.d.ts` reintroduces the same TS1479 one level
    // down. Byte equality is what holds the copy to that, and the absence of
    // specifiers is what makes the copy legitimate at all.
    const esm = readFileSync(target(entry.import.types), 'utf8');
    const cjs = readFileSync(target(entry.require.types), 'utf8');
    assert.equal(
      cjs,
      esm,
      'the .d.cts is not a copy of the .d.ts, so the two conditions describe ' +
        'different surfaces'
    );
    assert.doesNotMatch(
      esm,
      // The `from '…'` form and the `import('./x').Y` form tsc emits for a
      // type it reaches without an explicit import. Either resolves as
      // CommonJS inside a `.d.cts` and puts TS1479 back.
      /^\s*(?:import|export)\b[^\n]*\bfrom\b|\bimport\s*\(/m,
      'the constants declaration now has module specifiers, so copying it ' +
        'to a .d.cts no longer describes a CommonJS module. Keep ' +
        'bulmaClassHelpers.ts import-free, which the subpath depends on ' +
        'anyway.'
    );
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
      'the require condition produced no validColors, which is what a ' +
        'CommonJS bundle read as ESM looks like when it does not throw ' +
        'outright — a `.js` target here is read that way whatever it contains'
    );

    const esm = await import(pathToFileURL(target(entry.import.default)).href);
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
        target(manifest.exports['./constants'][condition].default),
        'utf8'
      );
      assert.doesNotMatch(
        source,
        /\breact\b/i,
        `${condition} bundle mentions react; the subpath must stay React-free`
      );
    }
  });

  it('typechecks from a node16 CommonJS consumer', () => {
    requireBuilt();
    // The case the per-condition `types` exists for, and the only one that
    // would have caught its absence: the map's shape can be right while
    // resolution still fails, and asserting the shape proves only the shape.
    // A plain `package.json` with no `type` makes the fixture CommonJS, which
    // is what turns a `.d.ts` target into TS1479.
    const dir = mkdtempSync(join(tmpdir(), 'bestax-constants-'));
    mkdirSync(join(dir, 'src'), { recursive: true });
    mkdirSync(join(dir, 'node_modules', '@allxsmith'), { recursive: true });
    symlinkSync(
      PKG_DIR,
      join(dir, 'node_modules', '@allxsmith', 'bestax-bulma'),
      'dir'
    );
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'cjs-consumer', version: '1.0.0', private: true })
    );
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          module: 'node16',
          moduleResolution: 'node16',
          target: 'es2022',
          strict: true,
          noEmit: true,
          types: [],
        },
        include: ['src'],
      })
    );
    writeFileSync(
      join(dir, 'src', 'index.ts'),
      "import { validColors } from '@allxsmith/bestax-bulma/constants';\n" +
        'export const first: string = validColors[0];\n'
    );

    const localRequire = createRequire(import.meta.url);
    const tsc = join(
      dirname(localRequire.resolve('typescript')),
      '..',
      'bin',
      'tsc'
    );
    const run = spawnSync(process.execPath, [tsc, '-p', dir], {
      encoding: 'utf8',
    });
    assert.equal(
      run.status,
      0,
      `a node16 CommonJS consumer does not typecheck against the subpath:\n${
        run.stdout || run.stderr
      }`
    );
  });
});
