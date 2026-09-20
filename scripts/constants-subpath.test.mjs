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

  it('serves the CommonJS types as a copy of the ESM ones', async () => {
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
    // The same predicate the build gates on, rather than a second copy of its
    // pattern: spelled twice, widening one left the other checking less than
    // it claimed.
    const { hasModuleSpecifiers } = await import(
      pathToFileURL(join(PKG_DIR, 'rollup.config.js')).href
    );
    assert.equal(
      hasModuleSpecifiers(esm),
      false,
      'the constants declaration now has module specifiers, so copying it ' +
        'to a .d.cts no longer describes a CommonJS module. Keep ' +
        'bulmaClassHelpers.ts import-free, which the subpath depends on ' +
        'anyway.'
    );
  });

  it('rejects every shape that would make the .d.cts copy unsound', async () => {
    const { hasModuleSpecifiers } = await import(
      pathToFileURL(join(PKG_DIR, 'rollup.config.js')).href
    );
    // An ENUMERATION rather than a sample. The predicate this replaced grew one
    // alternative per review round, which is how it ended up wanting `from` on
    // the same line as its `import` and missing a wrapped import list entirely.
    // Listing the ways a declaration can name another module is what found that,
    // so the list is the test.
    //
    // Two reasons a shape belongs here. It resolves as CommonJS inside the copy,
    // putting TS1479 back; or its target is relative and the copy lands a
    // directory up, so the target moves. Most qualify on both counts.
    for (const body of [
      "import { A } from './a';\n",
      "import A from './a';\n",
      "import * as A from './a';\n",
      "import type { A } from './a';\n",
      "import type A from './a';\n",
      "export { A } from './a';\n",
      "export * from './a';\n",
      "export * as ns from './a';\n",
      "export type { A } from './a';\n",
      "export { default as A } from './a';\n",
      // No binding at all, so nothing with `from` in it.
      "import './a';\n",
      'export type P = import("./a").A;\n',
      "export type P = import('./a', { with: { 'resolution-mode': 'import' } }).A;\n",
      "import A = require('./a');\n",
      // Valid since TS 4.2, and declaration emit prints `type` between the
      // keyword and the name, so a pattern matching an identifier straight
      // after `import` cannot span it.
      "import type A = require('./a');\n",
      "export import A = require('./a');\n",
      // Not first on its line: tsc emits a leading block comment followed by a
      // space rather than a newline, so an anchored pattern misses the whole
      // statement.
      "/** doc */ export * from './a';\n",
      "declare module './a' {}\n",
      'declare module "./a";\n',
      '/// <reference path="./a.d.ts" />\n',
      '/// <reference types="node" />\n',
      '/// <reference lib="es2015" />\n',
      "import { A } from './a' with { type: 'json' };\n",
      // The two the old pattern could not see: `from` is not on the `import`
      // line. tsc does not wrap this today, which is why it was never live.
      "import {\n  A,\n} from './a';\n",
      "export {\n  A,\n} from './a';\n",
    ]) {
      assert.equal(hasModuleSpecifiers(body), true, `not caught: ${body}`);
    }
    // The other half of asking the parser: a keyword is not a specifier. These
    // name no module, and flagging any of them would fail the build on a
    // declaration that is perfectly safe to copy.
    for (const body of [
      'export declare const A: number;\n',
      "/**\n * @example\n * import { A } from './a';\n */\nexport {};\n",
      // A package augmentation names no path, so nothing moves when the file is
      // copied. `src/elements/Icon.tsx` carries exactly this shape.
      "declare module 'react' {}\n",
      "declare module '@scope/pkg' {}\n",
      // `export` with no module specifier — the shape a naive AST check flags.
      'export {};\n',
      'declare const A = 1;\nexport { A };\n',
      'declare const A = 1;\nexport = A;\n',
    ]) {
      assert.equal(hasModuleSpecifiers(body), false, `false alarm: ${body}`);
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
    // Driven through the hooks rollup calls, in the order it calls them.
    // TWO outputs, started and finished — the shape the real config presents,
    // and the reason this runs from `closeBundle` rather than per output.
    const plugin = declarationExtensions(root);
    plugin.buildStart();
    plugin.buildEnd();
    plugin.renderStart();
    plugin.renderStart();
    plugin.writeBundle();
    plugin.writeBundle();
    return plugin.closeBundle();
  };

  it('adds the extension a plain specifier is missing', async () => {
    const root = tree({
      'index.d.ts': "export * from './a';\n",
      'a.d.ts': 'export declare const a: number;\n',
    });
    await run(root);
    assert.match(readFileSync(join(root, 'index.d.ts'), 'utf8'), /'\.\/a\.js'/);
  });

  it('answers a declaration-spelled specifier by position, not by name', async () => {
    // The rewrite and the post-pass disagreed about `./a.d.ts`: one refused
    // every spelling, the other accepted every spelling, and TypeScript does
    // neither. Measured rather than assumed — TS2846 fires on a VALUE import of
    // a declaration file and not on a type-only one, so the position is the
    // whole question:
    //
    //   import type { T } from './a.d.ts'      accepted
    //   export type X = import('./a.d.ts').T   accepted
    //   export type { T } from './a.d.ts'      accepted
    //   import { A } from './a.d.ts'           TS2846
    //   export * from './a.d.ts'               TS2846
    //
    // A type-only position resolves the declaration directly, so there is no
    // extension to add and nothing to fix.
    const beside = {
      'a.d.ts': 'export declare const A: number;\nexport type T = string;\n',
    };
    for (const body of [
      "import type { T } from './a.d.ts';\nexport type X = T;\n",
      "import type * as ns from './a.d.ts';\nexport type X = ns.T;\n",
      "export type X = import('./a.d.ts').T;\n",
      "export type X = typeof import('./a.d.ts');\n",
      "export type { T } from './a.d.ts';\n",
      "export type * from './a.d.ts';\n",
      // The two with no clause to read, which is where naming this
      // "type-only" went wrong. TS2846 turns on whether the import BINDS A
      // VALUE: a side-effect import binds nothing, and the type-only
      // import-equals form carries its flag on the declaration rather than on
      // the reference below it. Both are accepted by tsc and were refused here.
      "import './a.d.ts';\n",
      "import type a = require('./a.d.ts');\nexport type X = a.T;\n",
    ]) {
      const root = tree({ 'index.d.ts': body, ...beside });
      await run(root);
      assert.equal(
        readFileSync(join(root, 'index.d.ts'), 'utf8'),
        body,
        `a type-only position was edited: ${body.trim()}`
      );
    }
    for (const body of [
      "import { A } from './a.d.ts';\nexport declare const x: typeof A;\n",
      // An inline `{ type T }` reads type-only and is not; an EMPTY clause is
      // still a clause. Both are TS2846, measured.
      "import { type T } from './a.d.ts';\nexport type X = T;\n",
      "import {} from './a.d.ts';\n",
      "export * from './a.d.ts';\n",
      "export { A } from './a.d.ts';\n",
      "import a = require('./a.d.ts');\nexport = a;\n",
    ]) {
      await assert.rejects(
        run(tree({ 'index.d.ts': body, ...beside })),
        /names a declaration file/,
        body.trim()
      );
    }
    // Type-only does not mean unchecked: a dangling one still fails.
    await assert.rejects(
      run(
        tree({
          'index.d.ts':
            "import type { T } from './gone.d.ts';\nexport type X = T;\n",
        })
      ),
      /does not exist/
    );
    // And a reference path names a declaration directly in any position.
    const root = tree({
      'index.d.ts': '/// <reference path="./a.d.ts" />\nexport {};\n',
      ...beside,
    });
    await run(root);
    assert.match(
      readFileSync(join(root, 'index.d.ts'), 'utf8'),
      /"\.\/a\.d\.ts"/
    );
  });

  it('rewrites an import-equals-require specifier', async () => {
    // The only collected node kind with no success-path case: it appeared only
    // as a dangling one, which throws before any offset is used, so the offsets
    // for this shape were never exercised.
    const root = tree({
      'index.d.ts': "import a = require('./a');\nexport = a;\n",
      'a.d.ts': 'export {};\n',
    });
    await run(root);
    assert.match(
      readFileSync(join(root, 'index.d.ts'), 'utf8'),
      /import a = require\('\.\/a\.js'\);/
    );
  });

  it('leaves a bare package specifier alone', async () => {
    // The rewrite asks the parser for module specifiers, which includes bare
    // ones — `react` is in the real emitted tree. Only relative specifiers name
    // a file this pass can give an extension to; a bare one names a package and
    // resolves through node_modules, so probing it against the declaration root
    // finds nothing and would fail the build on every declaration that imports
    // React. The filter that prevents this had no case behind it.
    const root = tree({
      'index.d.ts':
        "import { FC } from 'react';\n" +
        "export * from '@scope/pkg';\n" +
        "export * from './local';\n",
      'local.d.ts': 'export {};\n',
    });
    await run(root);
    const out = readFileSync(join(root, 'index.d.ts'), 'utf8');
    assert.match(out, /from 'react';/);
    assert.match(out, /from '@scope\/pkg';/);
    // And the relative one beside them is still rewritten, so this pins the
    // filter rather than the pass being switched off.
    assert.match(out, /from '\.\/local\.js';/);
  });

  it('rewrites a side-effect import like any other specifier', async () => {
    // It used to FAIL the build. Neither a `from` nor an `import(` position, so
    // the regex rewrite could not match it, it kept its missing extension, and
    // the post-pass rejected it — a real specifier the pass could see was wrong
    // and could not fix. Asking the parser removes the distinction: a module
    // specifier is a module specifier wherever it sits.
    const root = tree({
      'index.d.ts': "import './side';\n",
      'side.d.ts': 'export {};\n',
    });
    await run(root);
    assert.match(
      readFileSync(join(root, 'index.d.ts'), 'utf8'),
      /import '\.\/side\.js';/
    );
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

  it('leaves a relative path in a comment alone, both directions', async () => {
    // Both passes read raw text, so a path quoted in a preserved TSDoc
    // `@example` read exactly like a specifier. This tree emits `@example`
    // blocks in quantity, so the only thing standing between that and a live
    // bug was none of them happening to quote a relative path.
    //
    // The two directions failed differently and both are pinned here. A path
    // that RESOLVES was silently rewritten, which ships; one that does not
    // failed the build, naming a `dist/types` file rather than the source
    // comment it came from.
    const root = tree({
      'index.d.ts':
        "/**\n * @example\n * import { B } from './B';\n" +
        " * import { theme } from './my-app/theme';\n */\n" +
        "export * from './B';\n",
      'B.d.ts': 'export {};\n',
    });
    await run(root);
    const out = readFileSync(join(root, 'index.d.ts'), 'utf8');
    // The example keeps BOTH of its paths verbatim: the resolvable one is not
    // rewritten, and the unresolvable one does not throw.
    assert.match(out, /\* import \{ B \} from '\.\/B';/);
    assert.match(out, /\* import \{ theme \} from '\.\/my-app\/theme';/);
    // The real specifier on the line below still gets its extension, so the
    // exemption is scoped to comments rather than switching the pass off.
    assert.match(out, /^export \* from '\.\/B\.js';$/m);
  });

  it('still checks a reference path, the one specifier inside a comment', async () => {
    // `reference path` is a line comment that TypeScript follows, so exempting
    // comment bodies had to spare it. Without that exemption-to-the-exemption
    // a dangling reference ships: the case below is the same tree as the
    // dangling-reference test, and it passes only because the post-pass reads
    // reference directives specifically.
    const root = tree({
      'index.d.ts':
        "/**\n * @example\n * import x from './nope';\n */\n" +
        '/// <reference path="./gone.d.ts" />\nexport {};\n',
    });
    // The `@example` beside it is ignored, so the reference is the only thing
    // this can be complaining about.
    await assert.rejects(run(root), /\.\/gone\.d\.ts/);
  });

  it('does not mistake a string or a nested template for a comment', async () => {
    // A FALSE comment range is the worst thing this file can get wrong, because
    // both passes consult it: the specifier inside would be neither rewritten
    // nor checked, and would ship. Both inputs below produced one under a
    // hand-rolled scan over quotes and slashes, which is why the tokenising is
    // TypeScript's now.
    //
    // The second is the one that matters. A hand-rolled pass counts the
    // backticks of `a${`/*`}b` wrong, decides a block comment opens at the
    // `/*`, finds no `*/`, and swallows the REST OF THE FILE — including the
    // specifier on the next line. Declarations can carry template literal
    // types, so it is not a shape to wave off.
    for (const body of [
      "export type Odd = '/* not a comment';\nexport * from './B';\n",
      "export type T = `a${`/*`}b`;\nexport * from './B';\n",
      // The third is the one only a PARSER gets right. A bare scanner does not
      // re-scan the brace closing a substitution as template continuation, so
      // everything after it is read as code, and the `/*` there opens a comment
      // that runs to the end of the file.
      "export type T = `a${string}/*b`;\nexport * from './B';\n",
    ]) {
      const root = tree({ 'index.d.ts': body, 'B.d.ts': 'export {};\n' });
      await run(root);
      assert.match(
        readFileSync(join(root, 'index.d.ts'), 'utf8'),
        /export \* from '\.\/B\.js';/,
        `the specifier was not rewritten, so the scan swallowed it: ${body}`
      );
    }
  });

  it('fails on a dangling specifier wherever it sits, not only after `from`', async () => {
    // Every position a specifier can occupy, each pointing nowhere. These used
    // to be the post-pass's alone, because the rewrite's pattern could not
    // reach them; now the rewrite sees them too and throws first, with the
    // better-worded of the two errors. Both messages are accepted here so the
    // case pins that the build STOPS rather than which pass stopped it.
    for (const body of [
      "import './gone.js';\n",
      "import y = require('./gone.js');\n",
      "export * from './gone.js';\n",
      "export type P = import('./gone.js').Q;\n",
    ]) {
      await assert.rejects(
        run(tree({ 'index.d.ts': body })),
        /resolves? to no declaration/,
        body.trim()
      );
    }
  });

  it('fails on a dangling ambient module name, which is never rewritten', async () => {
    // A relative ambient name is TS2436, so tsc cannot emit one and there is no
    // correct extension to give it — it is checked but never rewritten. `dist`
    // is never cleaned, so a stale declaration carrying one is still held to
    // resolving.
    await assert.rejects(
      run(tree({ 'index.d.ts': "declare module './gone.js';\n" })),
      /resolve to no declaration/
    );
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
      // The `.d.mts` carries an EXTENSIONLESS specifier, so the file has to be
      // rewritten rather than merely read: narrowing the walk to `.d.c?ts`
      // leaves this one untouched, which an assertion on already-extensioned
      // content would not notice.
      //
      // What it is rewritten TO is pinned here as `.js` probed against
      // `.d.ts`, which is what the code does — and is arguably not what a
      // `.d.cts` should get, since in a `"type": "module"` package a `.d.cts`
      // importing `./plain.js` is TS1479 under `module: node16`. A
      // `module: nodenext` consumer accepts the same import, so the answer is
      // wrong against the older setting rather than wrong outright. Unreachable today: no `.cts`
      // or `.mts` source exists and `dist/types` carries none, so this records
      // the current answer rather than endorsing it.
      'esm.d.mts': "export * from './b.mjs';\nexport * from './plain';\n",
      'b.d.mts': 'export {};\n',
    });
    await run(root);
    // The extensioned specifiers are accepted because the declaration each
    // maps to exists, and the extensionless ones in both files are rewritten.
    assert.match(
      readFileSync(join(root, 'index.d.cts'), 'utf8'),
      /'\.\/plain\.js'/
    );
    const mts = readFileSync(join(root, 'esm.d.mts'), 'utf8');
    assert.match(mts, /'\.\/b\.mjs'/);
    assert.match(mts, /'\.\/plain\.js'/);
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
    const missing = join(tree({}), 'not-emitted');

    // Build-phase failure.
    const onBuildEnd = declarationExtensions(missing);
    onBuildEnd.buildStart();
    onBuildEnd.buildEnd(new Error('the real build error'));
    onBuildEnd.renderStart();
    onBuildEnd.writeBundle();
    await onBuildEnd.closeBundle();

    // Output-phase failure, which reaches a different hook — `meta` could not
    // have carried this, since every output hook gets its own. The output is
    // started AND written here so the count check cannot short-circuit: the
    // earlier version of this case passed with `renderError` emptied out.
    const onRender = declarationExtensions(missing);
    onRender.buildStart();
    onRender.buildEnd();
    onRender.renderStart();
    onRender.renderError(new Error('the real output error'));
    onRender.writeBundle();
    await onRender.closeBundle();

    // Two outputs, one of which never finished: a sibling completing its write
    // must not unlatch the one that failed, which a single boolean allowed.
    const partial = declarationExtensions(missing);
    partial.buildStart();
    partial.buildEnd();
    partial.renderStart();
    partial.renderStart();
    partial.writeBundle();
    await partial.closeBundle();

    // A sibling plugin's throw: this plugin's `buildEnd` is called with
    // nothing, and the error arrives at `closeBundle` instead — the one route
    // neither latch can see.
    const onSibling = declarationExtensions(missing);
    onSibling.buildStart();
    onSibling.buildEnd();
    onSibling.renderStart();
    onSibling.writeBundle();
    await onSibling.closeBundle(new Error('a sibling plugin threw'));

    // Nothing written at all: the write phase failed after `renderError`'s
    // window closed, so no latch is set and no error arrives.
    const noOutput = declarationExtensions(missing);
    noOutput.buildStart();
    noOutput.buildEnd();
    noOutput.renderStart();
    await noOutput.closeBundle();

    // The COUNTERS reset too, not just `failed`. Without that, a rebuild whose
    // output started and never finished leaves `started` ahead of `wrote` for
    // the life of the process, so every later rebuild is skipped — `--watch`
    // silenced permanently by one failure.
    const valid = tree({
      'index.d.ts': "export * from './a';\n",
      'a.d.ts': 'export declare const a: number;\n',
    });
    const watching = declarationExtensions(valid);
    watching.buildStart();
    watching.buildEnd();
    watching.renderStart();
    await watching.closeBundle();
    watching.buildStart();
    watching.buildEnd();
    watching.renderStart();
    watching.writeBundle();
    await watching.closeBundle();
    assert.match(
      readFileSync(join(valid, 'index.d.ts'), 'utf8'),
      /'\.\/a\.js'/,
      'the rebuild after an unfinished one was skipped'
    );

    // And the failure latch resets, so a failed build does not silence the
    // next rebuild either.
    const reused = declarationExtensions(missing);
    reused.buildStart();
    reused.buildEnd(new Error('first build failed'));
    reused.renderStart();
    reused.writeBundle();
    await reused.closeBundle();
    reused.buildStart();
    reused.buildEnd();
    reused.renderStart();
    reused.writeBundle();
    await assert.rejects(reused.closeBundle(), /holds no declarations/);
  });

  it('does nothing when no output was ever started', async () => {
    // The skip side of the counted latch that no arm reached: a build that
    // produced no output at all has nothing for this pass to run against, and
    // the tree must come back untouched rather than rewritten or rejected.
    const root = tree({
      'index.d.ts': "export * from './a';\n",
      'a.d.ts': 'export declare const a: number;\n',
    });
    const before = readFileSync(join(root, 'index.d.ts'), 'utf8');
    const { declarationExtensions } = await import(
      pathToFileURL(join(PKG_DIR, 'rollup.config.js')).href
    );
    const plugin = declarationExtensions(root);
    plugin.buildStart();
    plugin.buildEnd();
    await plugin.closeBundle();
    assert.equal(readFileSync(join(root, 'index.d.ts'), 'utf8'), before);
  });

  it('fails the same way whether the declaration directory is empty or absent', async () => {
    // Absent and empty are one mistake — the declaration pass has not run — and
    // a raw ENOENT names neither the cause nor the fix.
    await assert.rejects(
      run(join(tree({ 'placeholder.txt': 'x\n' }), 'not-emitted')),
      /holds no declarations/
    );
  });

  it('catches a dangling reference however it is spelled', async () => {
    // The post-pass reads reference directives with a pattern of its own,
    // because exempting comment bodies would otherwise have hidden them. That
    // pattern is deliberately LOOSER than the one TypeScript honours — it is
    // not anchored to the start of a line — so that every directive TypeScript
    // would follow is a subset of what this checks. Tightening it to match
    // TypeScript exactly is the plausible future edit, and these are the
    // spellings that would start shipping if it were.
    for (const head of [
      '///<reference path="./gone.d.ts"/>\n',
      '///   <reference   path  =  "./gone.d.ts"   />\n',
      "/// <reference path='./gone.d.ts' />\n",
      '///\t<reference\tpath\t=\t"./gone.d.ts" />\n',
      '/// <reference path="./gone.d.ts" resolution-mode="import" />\n',
      '  /// <reference path="./gone.d.ts" />\n',
      '/** doc */\n/// <reference path="./gone.d.ts" />\n',
      // These two are why the list comes from TypeScript's parse rather than a
      // pattern of ours. TypeScript honours both, and a pattern anchored on
      // `path` right after `<reference` matched neither, so they shipped.
      '/// <reference resolution-mode="import" path="./gone.d.ts" />\n',
      '/// <Reference Path="./gone.d.ts" />\n',
      // And these two are why the list carries NO filter of our own. A
      // reference target is a path relative to the containing file, never a
      // package name, so both are as real as `./gone.d.ts` — and a
      // relative-looking prefix test discarded exactly them.
      '/// <reference path="gone.d.ts" />\n',
      '/// <reference path="sub/gone.d.ts" />\n',
    ]) {
      const root = tree({ 'index.d.ts': `${head}export {};\n` });
      await assert.rejects(
        run(root),
        /gone\.d\.ts/,
        `a dangling reference spelled this way shipped: ${head}`
      );
    }
  });

  it('does not fail the build that superseded it', async () => {
    // The rewrite throws on a specifier it cannot resolve, so the generation
    // check has to sit before that work and not only before the write —
    // otherwise an abandoned pass reports the previous build's problem against
    // the rebuild that replaced it, which is the confusing shape the whole
    // latch exists to avoid.
    const root = tree({ 'index.d.ts': "export * from './nowhere';\n" });
    const { declarationExtensions } = await import(
      pathToFileURL(join(PKG_DIR, 'rollup.config.js')).href
    );
    const plugin = declarationExtensions(root);
    plugin.buildStart();
    plugin.buildEnd();
    plugin.renderStart();
    plugin.writeBundle();
    const pass = plugin.closeBundle();
    plugin.buildStart();
    // Resolves rather than rejects: the unresolvable specifier belongs to a
    // build nobody is waiting on any more.
    await pass;
  });

  it('sees a comment wherever trivia can attach, not just before a node', async () => {
    // Missing a comment is NOT the harmless direction it looks like. The
    // post-pass then reads the comment as code and fails the build over a
    // relative path written in prose. `forEachChild` skips punctuation, so a
    // comment before a closing brace — or alone inside an empty interface — was
    // leading trivia of a token nothing visited, and both failed the build.
    // Each body below carries an unresolvable path inside a comment, so a
    // missed range shows up as a rejection.
    for (const body of [
      "/** see './nope/x' */\nexport declare const A: 1;\n",
      "export declare const A: 1; // see './nope/x'\n",
      "export interface I {\n  a: 1;\n  // see './nope/x'\n}\n",
      "export interface I {\n  // see './nope/x'\n}\n",
      "export /* see './nope/x' */ declare const A: 1;\n",
      "export declare const A: 1;\n// see './nope/x'\n",
      "export declare function f(\n  // see './nope/x'\n  a: 1\n): void;\n",
      "export declare const A: 1;\n/* see './nope/x' */\nexport declare const B: 2;\n",
    ]) {
      const root = tree({ 'index.d.ts': body });
      await run(root);
    }
  });

  it('abandons its writes when a rebuild starts mid-pass', async () => {
    // `rollup --watch` does not await `result.close()`, so a rebuild can begin
    // while this pass is still walking. Without a generation check the pass
    // finishes writing rewrites of text the new emit has already replaced,
    // leaving a stale declaration on disk until the rebuild after that.
    const root = tree({
      'index.d.ts': "export * from './a';\n",
      'a.d.ts': "export * from './b';\n",
      'b.d.ts': 'export {};\n',
    });
    const { declarationExtensions } = await import(
      pathToFileURL(join(PKG_DIR, 'rollup.config.js')).href
    );
    const plugin = declarationExtensions(root);
    plugin.buildStart();
    plugin.buildEnd();
    plugin.renderStart();
    plugin.writeBundle();
    // Start the pass, then let a rebuild begin before it can write.
    const pass = plugin.closeBundle();
    plugin.buildStart();
    await pass;
    // Nothing rewritten: every specifier is still extensionless.
    assert.equal(
      readFileSync(join(root, 'index.d.ts'), 'utf8'),
      "export * from './a';\n",
      'the abandoned pass wrote anyway, so a rebuild can be overwritten by it'
    );
  });

  it('refuses a specifier that resolves outside the published tree', async () => {
    // `existsSync` answers a question about the build machine; only what sits
    // under the declaration root is published. A specifier climbing out can
    // resolve here and dangle for every consumer, so each probe asks about
    // containment as well as existence.
    const outer = tree({
      'outside.d.ts': 'export {};\n',
      'types/placeholder.d.ts': 'export {};\n',
    });
    const root = join(outer, 'types');
    for (const body of [
      "export * from '../outside.js';\n",
      "export * from '../outside';\n",
      '/// <reference path="../outside.d.ts" />\nexport {};\n',
    ]) {
      writeFileSync(join(root, 'index.d.ts'), body);
      await assert.rejects(
        run(root),
        /outside/,
        `a specifier leaving the published tree was certified: ${body}`
      );
    }
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

  it('fails on a reference path that resolves nowhere', async () => {
    // The `.d.ts` arm of `resolvesToDeclaration` is the only probe a reference
    // path ever gets, and only its acceptance was pinned: stubbing that arm to
    // `true` left every case green while a dangling reference shipped.
    const root = tree({
      'index.d.ts': '/// <reference path="./gone.d.ts" />\nexport {};\n',
    });
    await assert.rejects(run(root), /resolve to no declaration/);
  });

  it('prefers the index for a bare dot even when a sibling declaration exists', async () => {
    // Pins the bare-dot branch's POSITION ahead of the file probe, not just its
    // result. With the order reversed, `..` from `pkg/deep` finds the stale
    // `pkg.d.ts` and emits `'...js'` — `..` with `.js` appended, a specifier the
    // post-pass pattern cannot match at all, so the build stays green and ships
    // this issue's own shape.
    const root = tree({
      'pkg.d.ts': 'export {};\n',
      'pkg/index.d.ts': 'export declare const a: number;\n',
      'pkg/deep/index.d.ts': "export * from '..';\n",
    });
    await run(root);
    const out = readFileSync(join(root, 'pkg/deep/index.d.ts'), 'utf8');
    assert.match(out, /'\.\.\/index\.js'/);
    // The shape the reversal actually produces. An earlier version of this
    // guard looked for `'..js'`, which the reversal never emits, so it could
    // not have failed — the positive assertion above was doing all the work.
    assert.doesNotMatch(out, /'\.\.\.js'/);
  });

  it('prefers a file over a same-named directory, as TypeScript does', async () => {
    // The file probe sits ahead of the index probe and that order is
    // load-bearing: when `./dir` can resolve BOTH ways, TypeScript takes
    // `dir.d.ts`. Reversing the probes emits `'./dir/index.js'`, which resolves
    // — so the post-pass waves it through and the build ships a specifier
    // pointing at the wrong declaration. Only this ordering case catches it.
    const root = tree({
      'index.d.ts': "export * from './dir';\n",
      'dir.d.ts': 'export declare const fromFile: number;\n',
      'dir/index.d.ts': 'export declare const fromIndex: number;\n',
    });
    await run(root);
    const out = readFileSync(join(root, 'index.d.ts'), 'utf8');
    assert.match(out, /'\.\/dir\.js'/);
    assert.doesNotMatch(out, /'\.\/dir\/index\.js'/);
  });

  it('fails on a bare dot naming a directory with no index', async () => {
    const root = tree({ 'deep/index.d.ts': "export * from '..';\n" });
    await assert.rejects(run(root), /no index declaration/);
  });
});
