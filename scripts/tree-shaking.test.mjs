/**
 * Bundle bulma-ui's build the way an app does, and hold a single-component
 * import to a small slice of the library (#937).
 *
 * The ESM build used to be one file, and a consumer's bundler drops code
 * inside a file only where it can prove a statement pure. A top-level
 * `forwardRef(...)` call or `X.displayName = ...` assignment is not provably
 * pure to Rollup, rolldown or esbuild, so an app importing `Button` alone
 * shipped nearly the whole library, while the docs promised it shipped only
 * what it imported. The build now emits one file per source module, and
 * `"sideEffects"` in package.json lets a bundler skip every module whose
 * exports go unused.
 *
 * Two checks hold that. The first bundles with Vite, the bundler the
 * create-bestax templates ship, through the package's own manifest, so the
 * exports map and `"sideEffects"` are read as a consumer's would be. It
 * compares against the whole library rather than a byte budget, so it does
 * not need raising every time a component grows; a component that starts
 * carrying the rest of the library fails it at any size.
 *
 * The second is what makes the first safe. With per-module files,
 * `"sideEffects"` stops being a formality: a bundler skips a module whose
 * exports an app does not use, so anything that module did on import, and
 * that another module relied on, silently stops happening. So the emitted
 * modules may do nothing at the top level beyond building components, contexts
 * and constant tables, and setting `displayName` on their own components.
 */
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { after, before, describe, it } from 'node:test';
import ts from 'typescript';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const PKG_DIR = join(REPO, 'bulma-ui');
const PKG_NAME = '@allxsmith/bestax-bulma';

/**
 * Asserted rather than skipped, like the other suites that read the build:
 * `node --test` exits 0 on a skip, and a size guard that can be silenced by
 * not building is no guard.
 */
const requireBuilt = () =>
  assert.ok(
    existsSync(join(PKG_DIR, 'dist')),
    'bulma-ui/dist is absent, so this suite cannot bundle what it exists to ' +
      'check. Run `pnpm --filter @allxsmith/bestax-bulma build` first, or ' +
      'the whole gate with `pnpm all`.'
  );

/**
 * Calls a module may make while it loads. Each builds the value it is
 * assigned to and touches nothing else: React's component and context
 * factories, `withSubComponents` (whose base is checked below), and the
 * collections and lookup tables a module builds from its own constants.
 * Matched on the name called, so `React.forwardRef` counts as `forwardRef`.
 */
const LOAD_TIME_CALLS = new Set([
  'forwardRef',
  'memo',
  'createContext',
  'withSubComponents',
  'Set',
  'Map',
  'fromEntries',
  'map',
  'filter',
]);

const calledName = callee =>
  ts.isPropertyAccessExpression(callee)
    ? callee.name.text
    : ts.isIdentifier(callee)
      ? callee.text
      : undefined;

/**
 * Whether evaluating `node` on import does anything beyond building a value:
 * a call outside `LOAD_TIME_CALLS`, a `withSubComponents` on an imported
 * base, or a write. A function's body runs when the function is called, so
 * it is skipped, unless the function is called on the spot.
 */
const doesWork = (node, isLocal) => {
  if (ts.isFunctionLike(node)) return false;
  if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
    let callee = node.expression;
    while (ts.isParenthesizedExpression(callee)) callee = callee.expression;
    if (ts.isArrowFunction(callee) || ts.isFunctionExpression(callee)) {
      return (
        doesWork(callee.body, isLocal) ||
        (node.arguments ?? []).some(arg => doesWork(arg, isLocal))
      );
    }
    const name = calledName(callee);
    if (!LOAD_TIME_CALLS.has(name)) return true;
    // `withSubComponents` attaches statics by mutating its base, which is
    // only safe while the base belongs to this module: a base imported from
    // another would gain its statics only in apps that import this one too.
    if (name === 'withSubComponents' && !isLocal(node.arguments[0])) {
      return true;
    }
  }
  if (ts.isTaggedTemplateExpression(node)) return true;
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
  ) {
    return true;
  }
  if (
    (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
    (node.operator === ts.SyntaxKind.PlusPlusToken ||
      node.operator === ts.SyntaxKind.MinusMinusToken)
  ) {
    return true;
  }
  if (ts.isDeleteExpression(node)) return true;
  return Boolean(ts.forEachChild(node, child => doesWork(child, isLocal)));
};

describe('bulma-ui tree shaking', () => {
  let consumer;
  let build;

  before(async () => {
    requireBuilt();
    // A consumer directory whose node_modules links the package, so the
    // bundler resolves it by name and reads its manifest.
    consumer = mkdtempSync(join(tmpdir(), 'bestax-tree-shaking-'));
    const scope = join(consumer, 'node_modules', '@allxsmith');
    mkdirSync(scope, { recursive: true });
    symlinkSync(PKG_DIR, join(scope, 'bestax-bulma'), 'dir');
    // Vite is bulma-ui's dependency, not the root's, and the linker is
    // isolated, so it is resolved from there.
    const vite = createRequire(join(PKG_DIR, 'package.json')).resolve('vite');
    ({ build } = await import(pathToFileURL(vite).href));
  });

  after(() => {
    if (consumer) rmSync(consumer, { recursive: true, force: true });
  });

  /** Gzipped bytes of an app whose only code is `source`, React excluded. */
  const bundledSize = async (name, source) => {
    const entry = join(consumer, `${name}.js`);
    writeFileSync(entry, source);
    const output = await build({
      configFile: false,
      root: consumer,
      logLevel: 'silent',
      build: {
        write: false,
        minify: true,
        lib: { entry, formats: ['es'], fileName: name },
        // React is the app's cost either way, and leaving it out keeps the
        // comparison to bestax's own code.
        rolldownOptions: { external: [/^react(-dom)?(\/|$)/] },
      },
    });
    const chunks = [output]
      .flat()
      .flatMap(result => result.output)
      .filter(file => file.type === 'chunk');
    assert.ok(chunks.length > 0, `bundling ${name} produced no chunks`);
    return chunks.reduce(
      (total, chunk) => total + gzipSync(chunk.code, { level: 9 }).length,
      0
    );
  };

  it('ships a small slice of the library for a single-component import', async () => {
    // Exported from the entry, so the bundler keeps what the app imports and
    // has no reason to keep anything else.
    const button = await bundledSize(
      'button',
      `export { Button } from '${PKG_NAME}';\n`
    );
    const library = await bundledSize(
      'library',
      `export * from '${PKG_NAME}';\n`
    );
    // Button plus the helpers every component shares came to well under a
    // tenth of the library when this was written, and nearly all of it
    // before. A tenth leaves room for both to grow.
    const ceiling = library / 10;
    assert.ok(
      button <= ceiling,
      `importing only Button bundles ${button} bytes gzipped, against ` +
        `${library} for the whole library: over the ceiling of a tenth ` +
        `(${Math.round(ceiling)}). An app importing one component is ` +
        'carrying others it never uses. Look for a module that imports ' +
        'something it does not need, or a change to the ESM output in ' +
        'bulma-ui/rollup.config.js (#937).'
    );
  });

  it('emits ESM modules that do nothing on import a bundler may skip', () => {
    const esm = join(PKG_DIR, 'dist', 'esm');
    assert.ok(
      existsSync(esm),
      'bulma-ui/dist/esm is absent, so the ESM build is one file again and ' +
        'a bundler cannot skip the modules an app does not import (#937).'
    );
    const files = readdirSync(esm, { recursive: true })
      .filter(file => file.endsWith('.js'))
      .map(file => join(esm, file));
    assert.ok(files.length > 0, 'bulma-ui/dist/esm holds no modules');

    const problems = [];
    for (const file of files) {
      const source = ts.createSourceFile(
        file,
        readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.JS
      );
      const imported = new Set();
      for (const statement of source.statements) {
        const bindings = statement.importClause?.namedBindings;
        if (statement.importClause?.name) {
          imported.add(statement.importClause.name.text);
        }
        if (bindings && ts.isNamespaceImport(bindings)) {
          imported.add(bindings.name.text);
        } else if (bindings) {
          for (const element of bindings.elements) {
            imported.add(element.name.text);
          }
        }
      }
      const at = statement =>
        `${relative(REPO, file)}: ${statement.getText().split('\n')[0]}`;
      const isLocal = node => ts.isIdentifier(node) && !imported.has(node.text);

      for (const statement of source.statements) {
        if (
          ts.isImportDeclaration(statement) ||
          ts.isExportDeclaration(statement) ||
          ts.isFunctionDeclaration(statement) ||
          ts.isClassDeclaration(statement)
        ) {
          continue;
        }
        if (ts.isVariableStatement(statement)) {
          // A declaration runs its initializer on import, so it can do work
          // as easily as a bare statement can.
          const work = statement.declarationList.declarations.some(
            declaration =>
              declaration.initializer &&
              doesWork(declaration.initializer, isLocal)
          );
          if (work) problems.push(at(statement));
          continue;
        }
        // A component's own displayName is the one assignment allowed: it
        // runs whenever the component is imported, which is the only time
        // anything can read it.
        const expression = ts.isExpressionStatement(statement)
          ? statement.expression
          : undefined;
        if (
          expression &&
          ts.isBinaryExpression(expression) &&
          expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          ts.isPropertyAccessExpression(expression.left) &&
          expression.left.name.text === 'displayName' &&
          isLocal(expression.left.expression)
        ) {
          continue;
        }
        problems.push(at(statement));
      }
    }
    assert.deepEqual(
      problems,
      [],
      'these modules do something when imported. package.json declares the ' +
        "library's JavaScript free of side effects, so a bundler skips a " +
        'module whose exports an app does not use, and anything it did on ' +
        'import would not happen. Move the work into the code that needs it. ' +
        'A call that only builds the value it is assigned to belongs in ' +
        'LOAD_TIME_CALLS instead.'
    );
  });
});
