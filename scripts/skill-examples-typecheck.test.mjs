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
 * that compiles `src/`, found by following the template's project references
 * rather than assuming which file holds them. Its imports resolve the way a
 * scaffold's would: `react` to React's published types, and the library to its
 * built declarations, which is why the library has to be built first.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import ts from 'typescript';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const TEMPLATE = join(REPO, 'create-bestax', 'templates', 'vite-ts');
const BULMA_UI = join(REPO, 'bulma-ui');
const LIBRARY_TYPES = join(BULMA_UI, 'dist', 'types', 'index.d.ts');

/** Every `skills/<skill>/examples/*.tsx`. */
function skillExamples() {
  const skills = join(REPO, 'skills');
  return readdirSync(skills, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .flatMap(entry => {
      const examples = join(skills, entry.name, 'examples');
      if (!existsSync(examples)) return [];
      return readdirSync(examples)
        .filter(name => name.endsWith('.tsx'))
        .map(name => join(examples, name));
    })
    .sort();
}

/** A tsconfig, parsed, failing loudly on anything unreadable. */
function parseConfig(configPath) {
  const parsed = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: diagnostic => {
        throw new Error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        );
      },
    }
  );
  assert.ok(parsed, `could not parse ${configPath}`);
  return parsed;
}

/**
 * The compiler options of the template project whose files include `src/`,
 * the project an example copied into the app is built by. Followed through
 * project references, so it holds whether the template keeps them in its root
 * tsconfig.json or in a referenced one.
 */
function appCompilerOptions() {
  const src = join(TEMPLATE, 'src') + sep;
  const queue = [join(TEMPLATE, 'tsconfig.json')];
  while (queue.length > 0) {
    const parsed = parseConfig(queue.shift());
    if (parsed.fileNames.some(file => file.startsWith(src))) {
      return parsed.options;
    }
    for (const ref of parsed.projectReferences ?? []) {
      queue.push(ts.resolveProjectReferencePath(ref));
    }
  }
  assert.fail(`no project under ${relative(REPO, TEMPLATE)} compiles src/`);
}

/** Where a scaffold's installed packages would resolve these imports. */
function scaffoldPaths() {
  const require = createRequire(join(BULMA_UI, 'package.json'));
  const typesOf = name =>
    dirname(require.resolve(`@types/${name}/package.json`));
  const react = typesOf('react');
  const reactDom = typesOf('react-dom');
  return {
    '@allxsmith/bestax-bulma': [LIBRARY_TYPES],
    react: [join(react, 'index.d.ts')],
    'react/*': [join(react, '*')],
    'react-dom': [join(reactDom, 'index.d.ts')],
    'react-dom/*': [join(reactDom, '*')],
  };
}

describe('skill examples compile in a vite-ts scaffold', () => {
  const examples = skillExamples();

  it('finds the examples', () => {
    assert.ok(examples.length > 0, 'no skills/*/examples/*.tsx found');
  });

  it('can see the library declarations', () => {
    assert.ok(
      existsSync(LIBRARY_TYPES),
      'bulma-ui/dist is absent, so the examples cannot be checked against the ' +
        "library's declarations. Build first, or run `pnpm all`."
    );
  });

  const program = existsSync(LIBRARY_TYPES)
    ? ts.createProgram(examples, {
        ...appCompilerOptions(),
        // The template's own src/ is not part of this program, and an
        // incremental build-info file would be written somewhere real.
        incremental: false,
        tsBuildInfoFile: undefined,
        // Ambient packages are the scaffold's, not this repo's.
        types: [],
        paths: scaffoldPaths(),
      })
    : null;
  const diagnostics = program ? ts.getPreEmitDiagnostics(program) : [];
  const host = {
    getCanonicalFileName: file => file,
    getCurrentDirectory: () => REPO,
    getNewLine: () => '\n',
  };

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
