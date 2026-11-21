/**
 * Hold the docs site's search to opening without a bare `/` key (#2223).
 *
 * DocSearch's `useDocSearchKeyboardEvents` opens the search on Ctrl/Cmd+K
 * and on `/`. A shortcut made of one printable key fires by accident for
 * someone using speech input, and WCAG 2.1.4 Character Key Shortcuts asks
 * that it can be turned off. The hook's `keyboardShortcuts` option does that,
 * and Docusaurus's own SearchBar doesn't pass it, so the site ejects
 * SearchBar (`docs/src/theme/SearchBar/index.js`) to pass `{ '/': false }`.
 *
 * This reads the source under `docs/src` and finds each call to
 * `useDocSearchKeyboardEvents` imported from `@docsearch/react`,
 * `@docsearch/core` or either's `useDocSearchKeyboardEvents` entry, by name,
 * alias or namespace. Each call's options must set `keyboardShortcuts` to an
 * object literal whose `'/'` is the literal `false`, with no spread or
 * computed key after either that could change it. So the option's removal
 * fails here, as does the ejected SearchBar's.
 *
 * An ejected component doesn't follow the theme when Docusaurus is upgraded,
 * so this also fails once the installed theme's SearchBar is no longer the
 * file the copy was ejected from, or once the copy and the theme load
 * different installs of the theme or of `@docsearch/react`.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';
import ts from 'typescript';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const DOCS_SRC = join(REPO, 'docs', 'src');
const SEARCH_BAR = join(DOCS_SRC, 'theme', 'SearchBar', 'index.js');
const THEME = '@docusaurus/theme-search-algolia';
const HOOK = 'useDocSearchKeyboardEvents';
const MODULES = new Set([
  '@docsearch/react',
  '@docsearch/react/useDocSearchKeyboardEvents',
  '@docsearch/core',
  '@docsearch/core/useDocSearchKeyboardEvents',
]);
// The SHA-256 of the theme's `lib/theme/SearchBar/index.js` the copy was
// ejected from.
const EJECTED_FROM =
  '0fe30dcb603307a500d96d6a4e951cd625054231ae3a2dbbcb99f1f918c3ba52';

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

/**
 * The local names a module binds the hook to: `named` for
 * `import { useDocSearchKeyboardEvents as X }`, `namespaces` for
 * `import * as X`, whose hook is called as `X.useDocSearchKeyboardEvents`.
 */
const hookBindings = source => {
  const named = new Set();
  const namespaces = new Set();
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !MODULES.has(statement.moduleSpecifier.text)
    ) {
      continue;
    }
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings)) {
      namespaces.add(bindings.name.text);
    } else if (bindings) {
      for (const element of bindings.elements) {
        if ((element.propertyName ?? element.name).text === HOOK) {
          named.add(element.name.text);
        }
      }
    }
  }
  return { named, namespaces };
};

const isHookCall = ({ expression }, { named, namespaces }) =>
  (ts.isIdentifier(expression) && named.has(expression.text)) ||
  (ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    namespaces.has(expression.expression.text) &&
    expression.name.text === HOOK);

const propertyName = property =>
  property.name &&
  (ts.isIdentifier(property.name) || ts.isStringLiteralLike(property.name))
    ? property.name.text
    : undefined;

/**
 * The value an object literal gives `key`. The last property, spread or
 * computed key that could set it wins, so a spread or computed key after it,
 * or a shorthand, gives none.
 */
const valueOf = (object, key) => {
  const last = object.properties.findLast(
    property =>
      ts.isSpreadAssignment(property) ||
      (property.name && ts.isComputedPropertyName(property.name)) ||
      propertyName(property) === key
  );
  return last && ts.isPropertyAssignment(last) ? last.initializer : undefined;
};

/** Whether a call's options turn off the bare `/` shortcut. */
const slashIsOff = call => {
  const options = call.arguments[0];
  if (!options || !ts.isObjectLiteralExpression(options)) return false;
  const shortcuts = valueOf(options, 'keyboardShortcuts');
  if (!shortcuts || !ts.isObjectLiteralExpression(shortcuts)) return false;
  return valueOf(shortcuts, '/')?.kind === ts.SyntaxKind.FalseKeyword;
};

/** Every call to the hook in docs/src, with where it is and whether it passes. */
const hookCalls = () =>
  sourcesUnder(DOCS_SRC).flatMap(file => {
    const source = parse(file);
    const bindings = hookBindings(source);
    if (bindings.named.size === 0 && bindings.namespaces.size === 0) return [];
    const found = [];
    const visit = node => {
      if (ts.isCallExpression(node) && isHookCall(node, bindings)) {
        const { line } = source.getLineAndCharacterOfPosition(
          node.getStart(source)
        );
        found.push({
          file,
          where: `${relative(REPO, file)}:${line + 1}`,
          passes: slashIsOff(node),
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    return found;
  });

/**
 * Where a module resolves from a file, by real path: the copy imports from
 * the docs package, and Docusaurus loads the theme through the classic preset.
 */
const resolveFrom = (from, module) => createRequire(from).resolve(module);
const DOCS = join(REPO, 'docs', 'package.json');
const themeFromDocs = () => resolveFrom(DOCS, THEME);
const themeFromPreset = () =>
  resolveFrom(resolveFrom(DOCS, '@docusaurus/preset-classic'), THEME);

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

  it("was ejected from the theme's SearchBar as installed", () => {
    const upstream = join(dirname(themeFromDocs()), 'theme', 'SearchBar');
    const installed = createHash('sha256')
      .update(readFileSync(join(upstream, 'index.js')))
      .digest('hex');
    assert.equal(
      installed,
      EJECTED_FROM,
      `The installed ${THEME}'s SearchBar (${upstream}) isn't the file ` +
        `${relative(REPO, SEARCH_BAR)} was ejected from. Eject it again ` +
        "(the copy's header has the command), pass " +
        "`keyboardShortcuts: { '/': false }` to the hook again, and set " +
        `EJECTED_FROM to ${installed}. If the theme now passes ` +
        '`keyboardShortcuts` from the `algolia` block through to the hook, ' +
        'set it there and delete the copy instead.'
    );
  });

  it('loads the same theme and DocSearch installs as the site', () => {
    assert.equal(
      themeFromDocs(),
      themeFromPreset(),
      `The docs package and the classic preset resolve different ${THEME} ` +
        'installs, so the ejected SearchBar and the theme around it can ' +
        'disagree. Give the docs package the range the preset installs.'
    );
    assert.equal(
      resolveFrom(DOCS, '@docsearch/react'),
      resolveFrom(themeFromDocs(), '@docsearch/react'),
      `The docs package and ${THEME} resolve different @docsearch/react ` +
        'installs, so the ejected SearchBar loads another DocSearch from the ' +
        "theme's. Give the docs package a range the theme's install meets."
    );
  });
});
