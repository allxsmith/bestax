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

  it('pins the node16 boundary: ESM resolves, CommonJS is the known #698 gap', () => {
    requireBuilt();
    // #696 names `node16` as well as `nodenext`, and the two fixtures below
    // cover only the latter. The pair is asserted together because the
    // interesting fact is the BOUNDARY: under `node16` an ESM consumer is fine,
    // and a CommonJS one meets TS1479 because a single ESM-flavoured `types`
    // target serves both conditions. That failure is #698 and pre-existing —
    // the same consumer got TS2305 before this change — and pinning it means
    // fixing #698 fails this test, which is when it should be revisited.
    const build = type => {
      const dir = mkdtempSync(join(tmpdir(), `bestax-node16-${type}-`));
      mkdirSync(join(dir, 'src'), { recursive: true });
      mkdirSync(join(dir, 'node_modules', '@allxsmith'), { recursive: true });
      symlinkSync(
        PKG_DIR,
        join(dir, 'node_modules', '@allxsmith', 'bestax-bulma'),
        'dir'
      );
      writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify({
          name: `node16-${type}`,
          version: '1.0.0',
          private: true,
          ...(type === 'esm' ? { type: 'module' } : {}),
        })
      );
      writeFileSync(
        join(dir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            module: 'node16',
            moduleResolution: 'node16',
            target: 'es2022',
            jsx: 'react-jsx',
            strict: true,
            noEmit: true,
          },
          include: ['src'],
        })
      );
      writeFileSync(
        join(dir, 'src', 'index.ts'),
        "import { Box } from '@allxsmith/bestax-bulma';\nexport { Box };\n"
      );
      const localRequire = createRequire(import.meta.url);
      const tsc = join(
        dirname(localRequire.resolve('typescript')),
        '..',
        'bin',
        'tsc'
      );
      return spawnSync(process.execPath, [tsc, '-p', dir], {
        encoding: 'utf8',
      });
    };

    const esm = build('esm');
    assert.equal(
      esm.status,
      0,
      `a node16 ESM consumer does not typecheck:\n${esm.stdout || esm.stderr}`
    );

    const cjs = build('cjs');
    assert.notEqual(
      cjs.status,
      0,
      'a node16 CommonJS consumer now typechecks — #698 may be fixed, in ' +
        'which case this expectation is what needs updating'
    );
    assert.match(
      cjs.stdout,
      /TS1479/,
      `expected the known #698 failure, got:\n${cjs.stdout || cjs.stderr}`
    );
  });

  it('typechecks the ROOT entry from an ESM consumer, and rejects a default import', () => {
    requireBuilt();
    // The other half of the matrix from the CommonJS case below, and the half
    // that a per-condition `types` split (#698) would keep green while ESM
    // consumers regressed.
    //
    // The default import is the point of the second assertion. The declarations
    // could be made to resolve by declaring `dist/types` CommonJS instead of
    // adding extensions, and that was tried: it resolves, and it also makes
    // `import pkg from '@allxsmith/bestax-bulma'` typecheck clean while the ESM
    // bundle underneath throws `does not provide an export named 'default'` at
    // runtime. Extensions keep the declarations honest about the module kind,
    // so the bad import is rejected where it is written — TS1192, not a crash.
    const dir = mkdtempSync(join(tmpdir(), 'bestax-root-esm-'));
    mkdirSync(join(dir, 'src'), { recursive: true });
    mkdirSync(join(dir, 'node_modules', '@allxsmith'), { recursive: true });
    symlinkSync(
      PKG_DIR,
      join(dir, 'node_modules', '@allxsmith', 'bestax-bulma'),
      'dir'
    );
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({
        name: 'esm-consumer',
        version: '1.0.0',
        private: true,
        type: 'module',
      })
    );
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          module: 'nodenext',
          moduleResolution: 'nodenext',
          target: 'es2022',
          jsx: 'react-jsx',
          strict: true,
          noEmit: true,
        },
        include: ['src'],
      })
    );
    // No `skipLibCheck`: the declarations themselves have to resolve, and the
    // first miss in this rewrite was visible only with it off.
    writeFileSync(
      join(dir, 'src', 'index.ts'),
      "import { Box } from '@allxsmith/bestax-bulma';\n" +
        "import type { ButtonProps } from '@allxsmith/bestax-bulma';\n" +
        "export const ok: ButtonProps = { color: 'primary' };\n" +
        '// @ts-expect-error a wrong colour must still be rejected\n' +
        "export const bad: ButtonProps = { color: 'not-a-colour' };\n" +
        '// @ts-expect-error the bundle is ESM and has no default export\n' +
        "import pkg from '@allxsmith/bestax-bulma';\n" +
        'export { Box, pkg };\n'
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
      `an ESM consumer does not typecheck against the root entry:\n${
        run.stdout || run.stderr
      }`
    );
  });

  it('typechecks the ROOT entry from a nodenext consumer', () => {
    requireBuilt();
    // The root's declarations are emitted by `tsc`, which writes relative
    // specifiers exactly as the source spells them — extensionless. Under
    // `"type": "module"` TypeScript reads a `.d.ts` as an ES module, where such
    // a specifier does not resolve, so every re-export in `dist/types/index.d.ts`
    // failed and the root's whole type surface came out empty: TS2305 on each
    // named import (#696). The build gives them extensions, which is what they
    // were always spelled for.
    //
    // Checked by TYPECHECKING rather than by reading the emitted files: their
    // contents say nothing about whether resolution succeeds, and a shape
    // assertion is what let this ship.
    const dir = mkdtempSync(join(tmpdir(), 'bestax-root-types-'));
    mkdirSync(join(dir, 'src'), { recursive: true });
    mkdirSync(join(dir, 'node_modules', '@allxsmith'), { recursive: true });
    symlinkSync(
      PKG_DIR,
      join(dir, 'node_modules', '@allxsmith', 'bestax-bulma'),
      'dir'
    );
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'root-consumer', version: '1.0.0', private: true })
    );
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          module: 'nodenext',
          moduleResolution: 'nodenext',
          target: 'es2022',
          jsx: 'react-jsx',
          strict: true,
          noEmit: true,
        },
        include: ['src'],
      })
    );
    // A named import proves resolution, and a wrong prop proves the types are
    // real rather than collapsed to `any` — an empty surface would pass a test
    // that only imported something.
    writeFileSync(
      join(dir, 'src', 'index.ts'),
      "import { Box } from '@allxsmith/bestax-bulma';\n" +
        "import type { ButtonProps } from '@allxsmith/bestax-bulma';\n" +
        "export const ok: ButtonProps = { color: 'primary' };\n" +
        '// @ts-expect-error a wrong colour must still be rejected\n' +
        "export const bad: ButtonProps = { color: 'not-a-colour' };\n" +
        'export { Box };\n'
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
      `a nodenext consumer does not typecheck against the root entry:\n${
        run.stdout || run.stderr
      }`
    );
  });
});

/**
 * The declaration-extension guard (#696).
 *
 * The rewrite is a regex over raw declaration text, so what it does NOT match
 * is the whole risk. A post-pass re-reads the tree and fails the build on
 * anything still unresolvable, and until now that guard was described in a
 * comment and observed by hand rather than tested. Driven here against
 * synthetic trees, because the shapes that matter are ones this package's own
 * source does not produce.
 */
describe('the declaration-extension guard', () => {
  const tree = files => {
    const root = mkdtempSync(join(tmpdir(), 'bestax-decl-guard-'));
    for (const [name, body] of Object.entries(files)) {
      const full = join(root, name);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, body);
    }
    return root;
  };
  const run = async root => {
    const { declarationExtensions } = await import(
      pathToFileURL(join(PKG_DIR, 'rollup.config.js')).href
    );
    // Rollup calls these hooks with a plugin context; `meta` is the object the
    // failure guard reads, and it is shared across a build's hooks.
    const plugin = declarationExtensions(root);
    const ctx = { meta: {} };
    return plugin.closeBundle.call(ctx);
  };

  it('adds the extension a plain specifier is missing', async () => {
    const root = tree({
      'index.d.ts': "export * from './a';\n",
      'a.d.ts': 'export declare const a: number;\n',
    });
    await run(root);
    assert.match(readFileSync(join(root, 'index.d.ts'), 'utf8'), /'\.\/a\.js'/);
  });

  it('fails on a side-effect import, which the rewrite cannot match', async () => {
    // Neither a `from` nor an `import(` position, so only the post-pass sees
    // it. This is the shape that escaped both when the two shared a pattern.
    const root = tree({
      'index.d.ts': "import './side';\n",
      'side.d.ts': 'export {};\n',
    });
    await assert.rejects(run(root), /resolve to no declaration/);
  });

  it('fails on a specifier that carries an extension and resolves nowhere', async () => {
    // Caught by the rewrite's extensioned branch, and by the post-pass behind
    // it — both ask whether the specifier resolves.
    const root = tree({ 'index.d.ts': "export * from './gone.js';\n" });
    await assert.rejects(run(root), /resolves to no declaration/);
  });

  it('spares a reference path, which is correct as written', async () => {
    const root = tree({
      'index.d.ts': '/// <reference path="./x.d.ts" />\nexport {};\n',
      'x.d.ts': 'export {};\n',
    });
    await run(root);
    assert.match(
      readFileSync(join(root, 'index.d.ts'), 'utf8'),
      /"\.\/x\.d\.ts"/
    );
  });

  it('fails on a dangling specifier wherever it sits, not only after `from`', async () => {
    // The rewrite only probes `from`/`import(` positions, so these three are
    // the post-pass's alone — and testing for a missing extension rather than
    // for resolvability let each of them ship a specifier pointing nowhere.
    for (const body of [
      "import './gone.js';\n",
      "declare module './gone.js';\n",
      "import y = require('./gone.js');\n",
    ]) {
      await assert.rejects(
        run(tree({ 'index.d.ts': body })),
        /resolve to no declaration/,
        body.trim()
      );
    }
  });

  it('fails on a trailing-slash specifier that a stale sibling would mask', async () => {
    // `./dir/` with a stale `dir.d.ts` beside it became `./dir/.js`, which ends
    // in `.js` and so passed a check that only looked at the extension.
    const root = tree({
      'index.d.ts': "export * from './dir/';\n",
      'dir.d.ts': 'export {};\n',
    });
    await assert.rejects(run(root), /resolve to no declaration/);
  });

  it('accepts the directory and double-quoted forms a real build produces', async () => {
    // The two shapes the post-pass was written for, on their SUCCESS path —
    // every real build exercises both, but the synthetic suite had neither.
    const root = tree({
      'deep/index.d.ts':
        'export declare const via: import("..").Thing;\n' +
        "export * from '../shared';\n",
      'index.d.ts': 'export interface Thing { a: number }\n',
      'shared.d.ts': 'export {};\n',
    });
    await run(root);
    const out = readFileSync(join(root, 'deep/index.d.ts'), 'utf8');
    assert.match(out, /import\("\.\.\/index\.js"\)/);
    assert.match(out, /'\.\.\/shared\.js'/);
  });

  it('sends a non-bare directory specifier to its index', async () => {
    // The branch a real build never reaches: every directory import this
    // package emits is a bare `..`, which takes the shortcut above it. A
    // regression in the non-bare path would therefore be silent, since neither
    // the build nor the other fixtures exercise it.
    const root = tree({
      'index.d.ts': "export * from './dir';\n",
      'dir/index.d.ts': 'export {};\n',
    });
    await run(root);
    assert.match(
      readFileSync(join(root, 'index.d.ts'), 'utf8'),
      /'\.\/dir\/index\.js'/
    );
  });

  it('walks .d.cts and .d.mts, and probes the declaration each maps to', async () => {
    // Three coupled behaviours with nothing exercising them: the walk collects
    // all three declaration extensions, a `.cjs` specifier is declared by
    // `.d.cts`, and a `.mjs` by `.d.mts`. No `.mts`/`.cts` source exists, so no
    // real build reaches any of them — which is exactly why a regression here
    // would be invisible.
    const root = tree({
      'index.d.cts': "export * from './a.cjs';\nexport * from './plain';\n",
      'a.d.cts': 'export {};\n',
      'plain.d.ts': 'export {};\n',
      'esm.d.mts': "export * from './b.mjs';\n",
      'b.d.mts': 'export {};\n',
    });
    await run(root);
    // The extensioned specifiers are accepted because the declaration each
    // maps to exists, and the extensionless one in a .d.cts is still rewritten.
    assert.match(
      readFileSync(join(root, 'index.d.cts'), 'utf8'),
      /'\.\/plain\.js'/
    );
    assert.match(readFileSync(join(root, 'esm.d.mts'), 'utf8'), /'\.\/b\.mjs'/);
  });

  it('fails when a .cjs specifier has only a .d.ts beside it', async () => {
    // The mapping is the point: probing `.d.ts` for a `.cjs` would accept this
    // tree, and TypeScript would then find no declaration for the target.
    const root = tree({
      'index.d.cts': "export * from './a.cjs';\n",
      'a.d.ts': 'export {};\n',
    });
    await assert.rejects(run(root), /resolves to no declaration/);
  });

  it('fails when the declaration pass has not run, rather than passing quietly', async () => {
    // The ordering guard, and the only arm with no second net behind it: if
    // `dist/types` is empty when this runs, every later check has nothing to
    // look at, so a weakened guard leaves the build green while the published
    // declarations stay extensionless — which is #696 returning.
    const root = tree({ 'placeholder.txt': 'not a declaration\n' });
    await assert.rejects(run(root), /holds no declarations/);
  });

  it('stays out of the way when the build itself failed', async () => {
    // `closeBundle` fires on rollup's failure path too, where `dist/types` is
    // absent because the build never got that far. Without the `buildEnd`
    // guard this hook's error replaces the real one, and a compile failure is
    // reported as a missing declaration directory.
    const { declarationExtensions } = await import(
      pathToFileURL(join(PKG_DIR, 'rollup.config.js')).href
    );
    const plugin = declarationExtensions(join(tree({}), 'not-emitted'));
    // The same context object rollup carries between a build's hooks.
    const ctx = { meta: {} };
    plugin.buildEnd.call(ctx, new Error('the real build error'));
    // Returns quietly: the missing directory is a symptom of the failure, not
    // a finding of its own.
    await plugin.closeBundle.call(ctx);
  });

  it('fails the same way whether the declaration directory is empty or absent', async () => {
    // Absent and empty are one mistake — the declaration pass has not run — and
    // a raw ENOENT names neither the cause nor the fix.
    await assert.rejects(
      run(join(tree({ 'placeholder.txt': 'x\n' }), 'not-emitted')),
      /holds no declarations/
    );
  });

  it('resolves a reference path spelled .d.cts as well as .d.ts', async () => {
    // The declaration-extension arm of `resolvesToDeclaration` was driven only
    // by the `.d.ts` spelling, while its `.cjs`/`.mjs` sibling had cases.
    const root = tree({
      'index.d.cts': '/// <reference path="./x.d.cts" />\nexport {};\n',
      'x.d.cts': 'export {};\n',
    });
    await run(root);
    assert.match(
      readFileSync(join(root, 'index.d.cts'), 'utf8'),
      /"\.\/x\.d\.cts"/
    );
  });

  it('fails on a specifier naming neither a declaration nor a directory', async () => {
    // The rewrite's final throw. The post-pass would also catch this one, but
    // this is the earlier and more specific error, and nothing pinned it.
    const root = tree({ 'index.d.ts': "export * from './nowhere';\n" });
    await assert.rejects(run(root), /resolves to neither/);
  });

  it('fails on a bare dot naming a directory with no index', async () => {
    const root = tree({ 'deep/index.d.ts': "export * from '..';\n" });
    await assert.rejects(run(root), /no index declaration/);
  });
});
