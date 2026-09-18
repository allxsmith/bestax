import { readFile, writeFile } from 'node:fs/promises';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { visualizer } from 'rollup-plugin-visualizer';
import scss from 'rollup-plugin-scss';

const scssBase = {
  outputStyle: 'compressed',
  includePaths: ['src/scss', '../node_modules'],
  sourceMap: true,
  silenceDeprecations: ['import', 'global-builtin', 'if-function'],
  // The plugin doesn't track @use'd partials, so without this `rollup --watch`
  // never rebuilds the CSS bundles when a partial changes.
  watch: 'src/scss',
};

const aiBanner =
  '/* @allxsmith/bestax-bulma — AI agents: see AGENTS.md in the package root, or https://bestax.io/llms.txt */';

/**
 * Write `dist/constants.d.cts`, the `types` target for the `require`
 * condition of the `./constants` export.
 *
 * One `types` target cannot describe both conditions here. This package is
 * `"type": "module"`, so TypeScript reads a `.d.ts` as ESM, and a
 * `module: node16` CommonJS consumer answers
 * `import { validColors } from '@allxsmith/bestax-bulma/constants'` with
 * TS1479 — "the referenced file is an ECMAScript module and cannot be
 * imported with 'require'" — even though the file the require condition
 * points at is genuine CommonJS and loads fine. The same shape as the
 * `constants.cjs` naming below: the runtime and the types each need the
 * extension that says what they are.
 *
 * Copying the declaration verbatim is sound only because
 * `bulmaClassHelpers.ts` imports nothing, so its declaration has no
 * specifiers to resolve. A `.d.cts` that re-exported from the `.d.ts`
 * would reintroduce TS1479 one level down.
 * `scripts/constants-subpath.test.mjs` asserts the copy byte for byte and
 * typechecks a real node16 CommonJS consumer against it.
 *
 * Three different things enforce the import-free property, which is worth
 * knowing before relying on any one of them. This entry has no `resolve()`,
 * so an extensionless relative import fails the bundle outright. A bare
 * package import is externalised, and React specifically is caught by the
 * React-free assertion in that same test. Only an import rollup can resolve
 * on its own reaches the check below, which is why the check is here rather
 * than being left to the test.
 */
const constantsCjsTypes = () => ({
  name: 'bestax-constants-cjs-types',
  async writeBundle() {
    const from = 'dist/types/helpers/bulmaClassHelpers.d.ts';
    const to = 'dist/constants.d.cts';
    let declaration;
    try {
      declaration = await readFile(from, 'utf8');
    } catch {
      // The main bundle's declaration pass writes this, and an array of
      // rollup configs is built in order, so it is already there. Fail loudly
      // rather than shipping an export whose types resolve to nothing.
      throw new Error(
        `${from} is missing, so ${to} cannot be written. It comes from the ` +
          "main bundle's declaration pass, which has to run before this " +
          'entry.'
      );
    }
    // Both shapes a specifier can take in a declaration: a real
    // `from '…'`, and the `import('./x').Y` form tsc emits for a type it
    // reaches without an explicit import. Either one resolves as CommonJS
    // inside a `.d.cts` and puts TS1479 back.
    if (
      /^\s*(?:import|export)\b[^\n]*\bfrom\b|\bimport\s*\(/m.test(declaration)
    ) {
      throw new Error(
        `${from} now has module specifiers, so copying it to a .d.cts no ` +
          'longer describes a CommonJS module. Keep that file import-free, ' +
          'which the ./constants export depends on anyway.'
      );
    }
    await writeFile(to, declaration, 'utf8');
  },
});

const variationBuild = name => ({
  input: `src/scss/versions/${name}.scss`,
  output: { file: `dist/versions/${name}.js`, format: 'es' },
  plugins: [scss({ ...scssBase, fileName: `${name}.css` })],
  onwarn(warning, warn) {
    if (warning.code === 'EMPTY_BUNDLE') return;
    warn(warning);
  },
});

export default commandLineArgs => {
  const isVisualizerEnabled = commandLineArgs.configPlugin === 'visualizer';
  return [
    // Main JS bundle
    {
      input: 'src/index.ts',
      output: [
        {
          dir: 'dist',
          format: 'cjs',
          sourcemap: true,
          // `.cjs`, not `.cjs.js`: this package is `"type": "module"`, so
          // Node reads a `.js` file as ESM whatever format rollup wrote into
          // it, and this bundle's `require(...)` calls are then evaluated in
          // module scope where `require` does not exist. The extension is the
          // only thing that overrides `type` (#688).
          entryFileNames: 'index.cjs',
          banner: aiBanner,
        },
        {
          dir: 'dist',
          format: 'esm',
          sourcemap: true,
          entryFileNames: 'index.esm.js',
          banner: aiBanner,
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
        typescript({
          tsconfig: './tsconfig.json',
          declaration: true,
          declarationDir: 'dist/types',
          rootDir: 'src',
          exclude: [
            '**/__tests__/**/*',
            '**/*.test.tsx',
            '**/__typetests__/**/*',
          ],
        }),
        isVisualizerEnabled &&
          visualizer({
            filename: 'dist/stats.html',
            title: 'Bundle Stats - @allxsmith/bestax',
            sourcemap: true,
            gzipSize: true,
          }),
      ].filter(Boolean),
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    // Constants bundle — the helper value tuples with no React and no
    // component code, so tooling (the ESLint plugin) can read them without
    // loading the library. Declarations come from the main bundle's pass,
    // which already emits dist/types/helpers/bulmaClassHelpers.d.ts.
    {
      input: 'src/helpers/bulmaClassHelpers.ts',
      output: [
        {
          dir: 'dist',
          format: 'cjs',
          sourcemap: true,
          // `.cjs`, not `.cjs.js`: this package is `"type": "module"`, so Node
          // reads a `.js` file as ESM whatever the bundle's format is, and a
          // bundle writing `exports.x = …` cannot load as CommonJS under that
          // reading. What a caller sees depends on the Node version — both a
          // load-time throw and an empty namespace object have been observed —
          // and the empty one is the worse case, because nothing fails.
          entryFileNames: 'constants.cjs',
          banner: aiBanner,
          // On this output rather than the entry's, because what it writes
          // serves the `require` condition specifically.
          plugins: [constantsCjsTypes()],
        },
        {
          dir: 'dist',
          format: 'esm',
          sourcemap: true,
          entryFileNames: 'constants.esm.js',
          banner: aiBanner,
        },
      ],
      plugins: [
        typescript({
          tsconfig: './tsconfig.json',
          declaration: false,
          declarationMap: false,
          declarationDir: undefined,
          outDir: undefined,
          // This entry is one file; compiling the whole program for it cost
          // seconds and pulled in the tests.
          include: ['src/helpers/bulmaClassHelpers.ts'],
          exclude: [
            '**/__tests__/**/*',
            '**/*.test.tsx',
            '**/__typetests__/**/*',
          ],
        }),
      ],
      // No resolve()/commonjs(): this module imports nothing, so bundling
      // node_modules is work with no output. `external` still matters — the
      // file also exports runtime helpers, and the first one to reach for
      // `useMemo` would otherwise inline React into a bundle whose whole
      // purpose is not needing it.
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    // SCSS extras bundle
    {
      input: 'src/scss/extras.scss',
      output: {
        file: 'dist/extras.js',
        format: 'es',
      },
      plugins: [scss({ ...scssBase, fileName: 'extras.css' })],
      onwarn(warning, warn) {
        // Suppress empty bundle warning for SCSS-only build
        if (warning.code === 'EMPTY_BUNDLE') return;
        warn(warning);
      },
    },
    // Combined Bulma + extras bundle
    {
      input: 'src/scss/bestax.scss',
      output: {
        file: 'dist/bestax.js',
        format: 'es',
      },
      plugins: [scss({ ...scssBase, fileName: 'bestax.css' })],
      onwarn(warning, warn) {
        if (warning.code === 'EMPTY_BUNDLE') return;
        warn(warning);
      },
    },
    // CSS variation builds
    variationBuild('bestax-prefixed'),
    variationBuild('bestax-no-helpers'),
    variationBuild('bestax-no-helpers-prefixed'),
    variationBuild('bestax-no-dark-mode'),
  ];
};
