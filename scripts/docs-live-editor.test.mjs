/**
 * Hold the docs site's live code editors to letting Tab move focus (#2177).
 *
 * react-live's editors default to `tabMode="indentation"`, which catches Tab
 * and Shift+Tab to indent and outdent the code. Neither key then moves focus,
 * so a keyboard user who tabs into an example can't leave it: a WCAG 2.1.2
 * No Keyboard Trap failure, on every page with a live fence. Passing
 * `tabMode="focus"` hands both keys back to the browser.
 *
 * This reads the source under `docs/src` and finds each JSX element rendering
 * one of react-live's editors (`LiveEditor` or `Editor`) imported from
 * `react-live` by name, alias or namespace. Each must carry
 * `tabMode="focus"` as a literal attribute, with no spread after it that
 * could replace it. So an editor imported that way without it fails here, as
 * does the attribute's removal from the one every live fence renders through
 * (`docs/src/theme/CodeBlock/index.js`).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';
import ts from 'typescript';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const DOCS_SRC = join(REPO, 'docs', 'src');
const CODE_BLOCK = join(DOCS_SRC, 'theme', 'CodeBlock', 'index.js');
const EDITORS = new Set(['LiveEditor', 'Editor']);

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
 * The local names a module binds react-live's editors to: `named` for
 * `import { LiveEditor }` or `import { Editor as X }`, `namespaces` for
 * `import * as X`, whose editors render as `<X.LiveEditor>`.
 */
const editorBindings = source => {
  const named = new Set();
  const namespaces = new Set();
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== 'react-live'
    ) {
      continue;
    }
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings)) {
      namespaces.add(bindings.name.text);
    } else if (bindings) {
      for (const element of bindings.elements) {
        const imported = (element.propertyName ?? element.name).text;
        if (EDITORS.has(imported)) named.add(element.name.text);
      }
    }
  }
  return { named, namespaces };
};

const isEditorTag = (tag, { named, namespaces }) =>
  (ts.isIdentifier(tag) && named.has(tag.text)) ||
  (ts.isPropertyAccessExpression(tag) &&
    ts.isIdentifier(tag.expression) &&
    namespaces.has(tag.expression.text) &&
    EDITORS.has(tag.name.text));

/**
 * Whether an element's `tabMode` is `"focus"`. In JSX the last attribute or
 * spread to set a prop wins, so the last one that could set `tabMode` must be
 * the literal `tabMode="focus"`.
 */
const tabModeIsFocus = element => {
  const last = element.attributes.properties.findLast(
    attribute =>
      ts.isJsxSpreadAttribute(attribute) ||
      attribute.name.getText() === 'tabMode'
  );
  if (last === undefined || ts.isJsxSpreadAttribute(last)) return false;
  const value = last.initializer;
  const literal = value && ts.isJsxExpression(value) ? value.expression : value;
  return (
    literal !== undefined &&
    ts.isStringLiteralLike(literal) &&
    literal.text === 'focus'
  );
};

/** Every editor element in docs/src, with where it is and whether it passes. */
const editorElements = () =>
  sourcesUnder(DOCS_SRC).flatMap(file => {
    const source = parse(file);
    const bindings = editorBindings(source);
    if (bindings.named.size === 0 && bindings.namespaces.size === 0) return [];
    const found = [];
    const visit = node => {
      if (
        (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
        isEditorTag(node.tagName, bindings)
      ) {
        const { line } = source.getLineAndCharacterOfPosition(
          node.getStart(source)
        );
        found.push({
          file,
          where: `${relative(REPO, file)}:${line + 1}`,
          passes: tabModeIsFocus(node),
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    return found;
  });

describe('docs live code editors', () => {
  const editors = editorElements();

  it('finds the editor every live fence renders through', () => {
    assert.ok(
      editors.some(editor => editor.file === CODE_BLOCK),
      `No react-live editor element was found in ${relative(REPO, CODE_BLOCK)}, ` +
        'so this suite would check nothing there. If live fences render ' +
        'their editor somewhere else now, point CODE_BLOCK at it.'
    );
  });

  it('lets Tab move focus out of each one', () => {
    const trapping = editors
      .filter(editor => !editor.passes)
      .map(editor => editor.where);
    assert.deepEqual(
      trapping,
      [],
      'These react-live editors catch Tab to indent, so a keyboard user ' +
        'cannot leave them (WCAG 2.1.2). Give each `tabMode="focus"`, ' +
        'after any spread props.'
    );
  });
});
