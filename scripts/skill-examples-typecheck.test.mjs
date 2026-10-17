/**
 * Every skill example compiles in the app create-bestax scaffolds.
 *
 * The skills hand an agent their `examples/*.tsx` to copy into the user's app,
 * and the vite-ts scaffold's build starts with `tsc -b` under the template's
 * own compiler options, `noUnusedLocals` and the automatic JSX runtime among
 * them. An example that compiles only somewhere looser breaks that build the
 * moment it is copied in: a default `import React` that the automatic runtime
 * never reads is a TS6133 error there (#951).
 *
 * So each example is type-checked with the options of the template project
 * that compiles `src/`, as `appCompilerOptions` in lib/template-tsconfig.mjs
 * reads them from the template. Its imports resolve the way a scaffold's
 * would: `react` to React's published types, and each entry in the library's
 * `exports` map to the built declarations it names, which is why the library
 * has to be built first.
 */
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import ts from 'typescript';
import { appCompilerOptions } from './lib/template-tsconfig.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const BULMA_UI = join(REPO, 'bulma-ui');
const LIBRARY_TYPES = join(BULMA_UI, 'dist', 'types', 'index.d.ts');

/**
 * Every TypeScript file anywhere under `skills/`, over the same tree the lint
 * gate in `eslint-plugin-docs.test.mjs` walks for its `.tsx`/`.jsx` examples.
 * A `.jsx` example is the one it reads that this leaves out: the vite-ts
 * project compiles no JavaScript (the template sets no `allowJs`), and the
 * vite template runs no type-check, so no scaffold checks one.
 */
function skillExamples() {
  const out = [];
  const visit = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        out.push(path);
      }
    }
  };
  visit(join(REPO, 'skills'));
  return out.sort();
}

/**
 * Each specifier the library publishes typings for, with the declaration file
 * a bundler-mode import of it reads, taken from its own `exports` map so a new
 * subpath reaches this program with no edit here.
 */
function libraryEntries() {
  const pkg = JSON.parse(readFileSync(join(BULMA_UI, 'package.json'), 'utf8'));
  return Object.entries(pkg.exports)
    .filter(([, target]) => target?.import?.types)
    .map(([subpath, target]) => [
      subpath === '.' ? pkg.name : `${pkg.name}/${subpath.slice(2)}`,
      join(BULMA_UI, target.import.types),
    ]);
}

/** Where a scaffold's installed packages would resolve these imports. */
function scaffoldPaths() {
  const require = createRequire(join(BULMA_UI, 'package.json'));
  const typesOf = name =>
    dirname(require.resolve(`@types/${name}/package.json`));
  const react = typesOf('react');
  const reactDom = typesOf('react-dom');
  return {
    ...Object.fromEntries(
      libraryEntries().map(([specifier, types]) => [specifier, [types]])
    ),
    react: [join(react, 'index.d.ts')],
    'react/*': [join(react, '*')],
    'react-dom': [join(reactDom, 'index.d.ts')],
    'react-dom/*': [join(reactDom, '*')],
  };
}

describe('skill examples compile in a vite-ts scaffold', () => {
  const examples = skillExamples();

  it('finds the examples', () => {
    assert.ok(examples.length > 0, 'no .ts or .tsx file under skills/');
  });

  it('can see the library declarations', () => {
    assert.ok(
      existsSync(LIBRARY_TYPES),
      'bulma-ui/dist is absent, so the examples cannot be checked against the ' +
        "library's declarations. Build first, or run `pnpm all`."
    );
  });

  const options = {
    ...appCompilerOptions(),
    // The template's own src/ is not part of this program, and an
    // incremental build-info file would be written somewhere real.
    incremental: false,
    tsBuildInfoFile: undefined,
    // Ambient packages are the scaffold's, not this repo's.
    types: [],
    paths: scaffoldPaths(),
  };
  const program = existsSync(LIBRARY_TYPES)
    ? ts.createProgram(examples, options)
    : null;
  const diagnostics = program ? ts.getPreEmitDiagnostics(program) : [];
  const host = {
    getCanonicalFileName: file => file,
    getCurrentDirectory: () => REPO,
    getNewLine: () => '\n',
  };

  // A scaffold resolves every typed entry in the library's `exports`, so an
  // example importing a subpath such as `/constants` must resolve here too,
  // or it fails this gate while compiling in the app.
  it('resolves every entry the library publishes typings for', () => {
    const specifiers = Object.entries(
      JSON.parse(readFileSync(join(BULMA_UI, 'package.json'), 'utf8')).exports
    )
      .filter(([, target]) => target?.import?.types)
      .map(([subpath]) =>
        subpath === '.'
          ? '@allxsmith/bestax-bulma'
          : `@allxsmith/bestax-bulma/${subpath.slice(2)}`
      );
    assert.ok(specifiers.includes('@allxsmith/bestax-bulma'));
    const dir = mkdtempSync(join(tmpdir(), 'skill-examples-'));
    try {
      const file = join(dir, 'imports.ts');
      writeFileSync(
        file,
        specifiers
          .map((s, i) => `import * as entry${i} from '${s}';\nvoid entry${i};`)
          .join('\n')
      );
      const imports = ts.createProgram([file], options);
      assert.equal(
        ts.formatDiagnostics(ts.getPreEmitDiagnostics(imports), host),
        ''
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('raises nothing outside the examples themselves', () => {
    const elsewhere = diagnostics.filter(
      d => !d.file || !examples.includes(d.file.fileName)
    );
    assert.equal(
      ts.formatDiagnostics(elsewhere, host),
      '',
      'the compile failed before reaching the examples'
    );
  });

  for (const example of examples) {
    it(relative(REPO, example), () => {
      const own = diagnostics.filter(d => d.file?.fileName === example);
      assert.equal(ts.formatDiagnostics(own, host), '');
    });
  }
});
