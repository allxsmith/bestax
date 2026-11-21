/**
 * Hold the docs site's search to opening without a bare `/` key (#2223).
 *
 * DocSearch's `useDocSearchKeyboardEvents` opens the search on Ctrl/Cmd+K
 * and on `/`. A shortcut made of one printable key fires by accident for
 * someone using speech input, and WCAG 2.1.4 Character Key Shortcuts asks
 * that it can be turned off. The hook's `keyboardShortcuts` option does that,
 * and Docusaurus's own SearchBar never passes it, so the site ejects
 * SearchBar (`docs/src/theme/SearchBar/index.js`) to pass `{ '/': false }`.
 *
 * This reads the source under `docs/src` and finds each call to
 * `useDocSearchKeyboardEvents` imported from `@docsearch/react` or its
 * `useDocSearchKeyboardEvents` entry, by name or alias. Each call's options
 * must set `keyboardShortcuts` to an object literal, written in place or in a
 * module-level `const`, whose `'/'` is the literal `false`, with no spread
 * after either that could change it. So the option's removal fails here, as
 * does the ejected SearchBar's.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';
import ts from 'typescript';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const DOCS_SRC = join(REPO, 'docs', 'src');
const SEARCH_BAR = join(DOCS_SRC, 'theme', 'SearchBar', 'index.js');
const HOOK = 'useDocSearchKeyboardEvents';
const MODULES = new Set([
  '@docsearch/react',
  '@docsearch/react/useDocSearchKeyboardEvents',
]);

const SCRIPT_KIND = {
  '.js': ts.ScriptKind.JSX,
  '.jsx': ts.ScriptKind.JSX,
  '.mjs': ts.ScriptKind.JSX,
  '.ts': ts.ScriptKind.TS,
  '.tsx': ts.ScriptKind.TSX,
};

const sourcesUnder = dir =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && extname(entry.name) in SCRIPT_KIND)
    .map(entry => join(entry.parentPath, entry.name));

const parse = file =>
  ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    SCRIPT_KIND[extname(file)]
  );

/** The local names a module binds the hook to. */
const hookBindings = source => {
  const names = new Set();
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !MODULES.has(statement.moduleSpecifier.text)
    ) {
      continue;
    }
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      if ((element.propertyName ?? element.name).text === HOOK) {
        names.add(element.name.text);
      }
    }
  }
  return names;
};

/** A module-level `const name = …`'s initializer, if there is one. */
const moduleConst = (source, name) => {
  for (const statement of source.statements) {
    if (
      !ts.isVariableStatement(statement) ||
      !(statement.declarationList.flags & ts.NodeFlags.Const)
    ) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
        return declaration.initializer;
      }
    }
  }
  return undefined;
};

const propertyName = property =>
  property.name &&
  (ts.isIdentifier(property.name) || ts.isStringLiteralLike(property.name))
    ? property.name.text
    : undefined;

/**
 * The expression an object literal gives `key`: a property's value, or a
 * shorthand's name. The last property or spread that could set it wins, so
 * a spread after it gives none.
 */
const valueOf = (object, key) => {
  const last = object.properties.findLast(
    property =>
      ts.isSpreadAssignment(property) || propertyName(property) === key
  );
  if (last && ts.isPropertyAssignment(last)) return last.initializer;
  if (last && ts.isShorthandPropertyAssignment(last)) return last.name;
  return undefined;
};

/** Whether a call's options turn off the bare `/` shortcut. */
const slashIsOff = (call, source) => {
  const options = call.arguments[0];
  if (!options || !ts.isObjectLiteralExpression(options)) return false;
  let shortcuts = valueOf(options, 'keyboardShortcuts');
  if (shortcuts && ts.isIdentifier(shortcuts)) {
    shortcuts = moduleConst(source, shortcuts.text);
  }
  if (!shortcuts || !ts.isObjectLiteralExpression(shortcuts)) return false;
  return valueOf(shortcuts, '/')?.kind === ts.SyntaxKind.FalseKeyword;
};

/** Every call to the hook in docs/src, with where it is and whether it passes. */
const hookCalls = () =>
  sourcesUnder(DOCS_SRC).flatMap(file => {
    const source = parse(file);
    const names = hookBindings(source);
    if (names.size === 0) return [];
    const found = [];
    const visit = node => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        names.has(node.expression.text)
      ) {
        const { line } = source.getLineAndCharacterOfPosition(
          node.getStart(source)
        );
        found.push({
          file,
          where: `${relative(REPO, file)}:${line + 1}`,
          passes: slashIsOff(node, source),
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    return found;
  });

describe('docs search shortcuts', () => {
  const calls = hookCalls();

  it('finds the hook call in the ejected SearchBar', () => {
    assert.ok(
      calls.some(call => call.file === SEARCH_BAR),
      `No ${HOOK} call was found in ${relative(REPO, SEARCH_BAR)}, so the ` +
        "navbar search may be Docusaurus's own again, which opens on a bare " +
        '`/` (WCAG 2.1.4). If the theme now passes `keyboardShortcuts` from ' +
        'the `algolia` block in docusaurus.config.js, set it there and ' +
        'change this test to read it.'
    );
  });

  it('turns off the bare `/` shortcut in each call', () => {
    const open = calls.filter(call => !call.passes).map(call => call.where);
    assert.deepEqual(
      open,
      [],
      'These calls leave the search opening on a bare `/` key, which ' +
        'someone using speech input can fire by accident (WCAG 2.1.4). ' +
        "Pass `keyboardShortcuts: { '/': false }`, after any spread."
    );
  });
});
