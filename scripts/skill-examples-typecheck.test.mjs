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
 * would: `react` to React's published types, each entry in the library's
 * `exports` map to the built declarations it names, which is why the library
 * has to be built first, and a stylesheet or asset import to the ambient
 * modules of the typings the template names in `types` (`vite/client`).
 *
 * The ported templates under `templates/<slug>/src` (templates/CLAUDE.md) go
 * through the same program. Each one is a vite-ts scaffold, and StackBlitz
 * runs its build, so a template that does not compile here does not open
 * there either. A template importing a package other than the library and
 * React fails here to resolve it; none is expected to.
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
import { describe, it } from 'vitest';
import ts from 'typescript';
import { appCompilerOptions } from './lib/template-tsconfig.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const BULMA_UI = join(REPO, 'bulma-ui');
const LIBRARY_TYPES = join(BULMA_UI, 'dist', 'types', 'index.d.ts');

/** Every `.ts` and `.tsx` file under `dir`, declarations only on request. */
function typeScriptFiles(dir, { declarations = false } = {}) {
  const out = [];
  const visit = current => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (
        /\.tsx?$/.test(entry.name) &&
        (declarations || !entry.name.endsWith('.d.ts'))
      ) {
        out.push(path);
      }
    }
  };
  visit(dir);
  return out.sort();
}

/**
 * Every TypeScript file anywhere under `skills/`, over the same tree the lint
 * gate in `eslint-plugin-docs.test.mjs` walks for its `.tsx`/`.jsx` examples.
 * A `.jsx` example is the one it reads that this leaves out: the vite-ts
 * project compiles no JavaScript (the template sets no `allowJs`), and the
 * vite template runs no type-check, so no scaffold checks one.
 */
function skillExamples() {
  return typeScriptFiles(join(REPO, 'skills'));
}

/**
 * Every TypeScript file in each template's `src/`, declarations included,
 * since the template's own project compiles all of `src/`. None while the
 * folder holds no template, which passes.
 */
function templateSources() {
  const root = join(REPO, 'templates');
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => join(root, entry.name, 'src'))
    .filter(src => existsSync(src))
    .flatMap(src => typeScriptFiles(src, { declarations: true }));
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

/**
 * The declaration file of each ambient package the template's `types` names,
 * resolved from bulma-ui's install the way the scaffold's tsconfig resolves it
 * from the app's. `vite/client` is what gives a stylesheet or image import
 * a module to resolve to.
 */
function scaffoldTypes(options) {
  return (options.types ?? []).map(name => {
    const { resolvedTypeReferenceDirective: resolved } =
      ts.resolveTypeReferenceDirective(
        name,
        join(BULMA_UI, 'package.json'),
        options,
        ts.sys
      );
    assert.ok(
      resolved?.resolvedFileName,
      `the template's tsconfig names ${name} in \`types\`, which does not ` +
        'resolve from bulma-ui, where this check looks for it'
    );
    return resolved.resolvedFileName;
  });
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

describe('skill examples and templates compile in a vite-ts scaffold', () => {
  const examples = skillExamples();
  const templates = templateSources();
  const checked = [...examples, ...templates];

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

  const templateOptions = appCompilerOptions();
  const options = {
    ...templateOptions,
    // The template's own src/ is not part of this program, and an
    // incremental build-info file would be written somewhere real.
    incremental: false,
    tsBuildInfoFile: undefined,
    // Ambient packages are the scaffold's, not this repo's: the ones its
    // `types` names go in as root files instead.
    types: [],
    paths: scaffoldPaths(),
  };
  const ambient = scaffoldTypes(templateOptions);
  const program = existsSync(LIBRARY_TYPES)
    ? ts.createProgram([...checked, ...ambient], options)
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

  // A scaffold's main.tsx imports stylesheets for their side effects, the
  // library's, an icon font's and its own, and TypeScript holds a side-effect
  // import to resolving like any other. Each resolves to the ambient modules
  // of the template's `types`, so a template's entry point compiles here only
  // while those typings are in the program, as it does in the app.
  it('resolves the stylesheet and asset imports a scaffold makes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'skill-examples-'));
    try {
      const file = join(dir, 'main.tsx');
      writeFileSync(
        file,
        [
          "import '@allxsmith/bestax-bulma/bestax.css';",
          "import '@fortawesome/fontawesome-free/css/all.min.css';",
          "import './index.css';",
          "import logo from './logo.svg';",
          'void logo;',
        ].join('\n')
      );
      const imports = ts.createProgram([file, ...ambient], options);
      assert.equal(
        ts.formatDiagnostics(ts.getPreEmitDiagnostics(imports), host),
        ''
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('raises nothing outside the examples and templates themselves', () => {
    const elsewhere = diagnostics.filter(
      d => !d.file || !checked.includes(d.file.fileName)
    );
    assert.equal(
      ts.formatDiagnostics(elsewhere, host),
      '',
      'the compile failed before reaching the examples'
    );
  });

  for (const file of checked) {
    it(relative(REPO, file), () => {
      const own = diagnostics.filter(d => d.file?.fileName === file);
      assert.equal(ts.formatDiagnostics(own, host), '');
    });
  }
});
