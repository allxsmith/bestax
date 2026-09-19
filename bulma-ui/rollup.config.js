import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve as resolvePath } from 'node:path';
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
 * Whether `spec`, written inside `file`, names a declaration that exists.
 *
 * A declaration spells its imports the way the runtime will: `./x.js` is
 * declared by `./x.d.ts`, and the `.cjs`/`.mjs` forms by `.d.cts`/`.d.mts`. A
 * triple-slash `reference path` names the declaration directly. Anything else
 * is unresolved, which is the one question worth asking after the rewrite.
 */
const resolvesToDeclaration = (file, spec) => {
  const from = dirname(file);
  if (/\.d\.[cm]?ts$/.test(spec)) return existsSync(resolvePath(from, spec));
  const runtime = spec.match(/\.([cm]?)js$/);
  if (runtime) {
    const declared = `.d.${runtime[1]}ts`;
    return existsSync(resolvePath(from, spec).replace(/\.[cm]?js$/, declared));
  }
  return false;
};

/**
 * Give every relative specifier in the emitted declarations a `.js` extension.
 *
 * `tsc` writes specifiers exactly as the source spells them, so the
 * declarations say `export * from './columns/Column'`. This package is
 * `"type": "module"`, so TypeScript reads a `.d.ts` as an ES module, where an
 * extensionless relative specifier does not resolve — `node16`/`nodenext`
 * consumers got TS2834 on every re-export, the root's type surface came out
 * empty, and each named import failed with TS2305 (#696). `skipLibCheck` does
 * not help: it stops declarations being CHECKED, not RESOLVED.
 *
 * The extension is added rather than the directory being marked CommonJS,
 * which also makes them resolve. Marking would make the declarations describe
 * a CommonJS module while the bundle they describe is ESM, and TypeScript then
 * accepts `import pkg from '…'` — which typechecks clean and throws
 * `does not provide an export named 'default'` at runtime. Extensions keep the
 * declarations honest about the module kind, so that import is rejected where
 * it is written.
 *
 * Most specifiers name a file and take a `.js`; some name a directory and take
 * `/index.js`. Which it is, is resolved rather than assumed, and anything that
 * is neither throws — including a bare `.` or `..`, which skips the file probe
 * but is still held to having an index.
 */
export const declarationExtensions = (root = 'dist/types') => ({
  name: 'bestax-declaration-extensions',
  async writeBundle() {
    const files = [];
    const walk = async dir => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) await walk(full);
        // `.d.cts` and `.d.mts` are declarations too, and skipping them left
        // their specifiers neither rewritten nor checked.
        else if (/\.d\.[cm]?ts$/.test(entry.name)) files.push(full);
      }
    };
    await walk(root);
    if (!files.length) {
      throw new Error(
        `${root} holds no declarations, so the emitted specifiers cannot be ` +
          'rewritten. The declaration pass has to run before this entry.'
      );
    }

    // Both shapes a specifier takes in a declaration: a real `from '…'`, and
    // the `import('./x').Y` form tsc emits for a type it reaches without an
    // explicit import. BOTH quote styles, because tsc writes the inline form
    // with double quotes — missing that left a TS2834 visible only with
    // `skipLibCheck` off, which is how most consumers would first meet it.
    // `.` and `..` on their own are specifiers too — a bare parent-directory
    // import resolves to that directory's `index`, and a pattern requiring a
    // `/` after the dots skipped them silently.
    const SPECIFIER = /((?:from|import\()\s*(['"]))(\.\.?(?:\/[^'"]*)?)(\2)/g;
    for (const file of files) {
      const before = await readFile(file, 'utf8');
      const after = before.replace(SPECIFIER, (whole, head, _q, spec, tail) => {
        // An extension already present is still checked. The post-pass would
        // catch a dangling one too, since it asks about resolution rather than
        // about extensions — this is the earlier and better-worded of the two
        // errors, not the only net. Nothing in `src/` spells an extension
        // today; the point is that no branch is held to a weaker test.
        const extensioned = spec.match(/\.([cm]?)js$/);
        if (extensioned) {
          // `.cjs` is declared by `.d.cts` and `.mjs` by `.d.mts`; probing
          // `.d.ts` for either verifies a file TypeScript will not consult.
          const declared = `.d.${extensioned[1]}ts`;
          const asFile = resolvePath(dirname(file), spec).replace(
            /\.[cm]?js$/,
            declared
          );
          if (existsSync(asFile)) return whole;
          throw new Error(
            `${file}: '${spec}' already carries an extension but resolves to ` +
              'no declaration, so it would ship pointing nowhere.'
          );
        }
        // A bare `.` or `..` names a directory by definition, so it skips the
        // file probe. Probing first would let a stale declaration — `dist` is
        // never cleaned — send it down the file branch and emit a specifier
        // ending in `.js` that resolves nowhere, which the post-pass would then
        // pass through untouched. The index is still checked: this branch has
        // to throw like the others, or it becomes the one path that can emit
        // something unresolvable in silence.
        if (/^\.\.?$/.test(spec)) {
          if (
            existsSync(join(resolvePath(dirname(file), spec), 'index.d.ts'))
          ) {
            return `${head}${spec}/index.js${tail}`;
          }
          throw new Error(
            `${file}: '${spec}' names a directory with no index declaration, ` +
              'so no extension can be chosen for it.'
          );
        }
        const resolved = resolvePath(dirname(file), spec);
        if (existsSync(`${resolved}.d.ts`)) return `${head}${spec}.js${tail}`;
        if (existsSync(join(resolved, 'index.d.ts'))) {
          return `${head}${spec}/index.js${tail}`;
        }
        throw new Error(
          `${file}: '${spec}' resolves to neither a declaration nor a ` +
            'directory holding one, so no extension can be chosen for it.'
        );
      });
      if (after !== before) await writeFile(file, after, 'utf8');
    }

    // The rewrite can only fix shapes its pattern matches, and several escaped
    // it in the writing — the double-quoted `import("./x")` form, a bare `..`,
    // and a side-effect `import './x';` in neither position. An unmatched
    // specifier fails silently, so the tree is re-read here.
    for (const file of files) {
      const text = await readFile(file, 'utf8');
      // EVERY quoted relative string, and the question is whether it RESOLVES.
      //
      // Both halves of that are deliberate. Reading only the positions the
      // rewrite matches makes this a restatement of the rewrite rather than a
      // check on it — narrowing the two to the same `from`/`import(` prefix let
      // a side-effect import escape both at once. And asking merely whether an
      // extension is present let three shapes ship a specifier pointing
      // nowhere: one outside those positions, one already carrying an
      // extension, and a `./dir/` that a stale sibling turned into `./dir/.js`.
      // Resolvability is one question covering all of them, and it is the
      // property a consumer actually depends on.
      //
      // The cost of reading raw text is that neither pass can tell a specifier
      // from anything else quoted beside it. A string-literal type such as
      // `export type P = './foo.js'`, or a relative `./data.json` import, fails
      // the build; and in the other direction the rewrite will happily edit a
      // relative path quoted inside a preserved TSDoc `@example`, which this
      // tree carries plenty of. No source here quotes a relative path anywhere
      // but a specifier. The two directions are not equally safe, which is
      // worth stating plainly: a false failure is loud and stops the build,
      // while an edit inside a comment is silent and ships. Narrowing the scan
      // is what opened the hole it was widened to close, so the answer if this
      // ever bites is to exempt comment bodies, not to re-anchor it.
      const broken = [
        ...new Set(
          [...text.matchAll(/['"](\.\.?(?:\/[^'"]*)?)['"]/g)]
            .map(m => m[1])
            .filter(spec => !resolvesToDeclaration(file, spec))
        ),
      ];
      if (broken.length) {
        throw new Error(
          `${file} has relative specifiers that resolve to no declaration ` +
            `after the rewrite: ${broken.join(', ')}. They would ship ` +
            'pointing nowhere.'
        );
      }
    }
  },
});

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
          // Chunks need the extension for the same reason the entry does. This
          // build emits one chunk today, so nothing is currently wrong — but
          // the first dynamic import would split it, and the default
          // `[name]-[hash].js` would have `index.cjs` requiring `.js` files
          // that Node reads as ESM. That is #688 again in a shape neither the
          // manifest rule nor the artifact test can see, since neither looks
          // past the entry points.
          chunkFileNames: '[name]-[hash].cjs',
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
          // reading. What a caller SEES varies with the bundle's own code and
          // the runtime, so it is not worth predicting here: this package's
          // bundles throw on both, and packages exist that load with a
          // populated namespace instead. The reason to use `.cjs` does not
          // depend on which.
          entryFileNames: 'constants.cjs',
          // Same reason as the main bundle's: a split chunk under rollup's
          // default `[name]-[hash].js` would be required by a `.cjs` and read
          // as ESM.
          chunkFileNames: '[name]-[hash].cjs',
          banner: aiBanner,
          // Both run after the declaration pass, which is what they read and
          // rewrite; rollup builds the config array in order, so this output is
          // simply the first place they can run. `constantsCjsTypes` serves the
          // `require` condition specifically, `declarationExtensions` the
          // shared root `types` target.
          plugins: [declarationExtensions(), constantsCjsTypes()],
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
