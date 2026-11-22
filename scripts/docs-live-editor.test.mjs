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
 *
 * Each editor also needs a focus ring and a name (#2180). react-live puts
 * `outline: none` inline on its editable `<pre>` and passes it no role or name
 * of ours, so both go on a wrapper of our own: each editor must sit right
 * inside a JSX element with `className="live-editor"`, `role="group"` and an
 * `aria-label` that is always some text, and `docs/src/css/custom.css` must
 * give `.live-editor:focus-within` an outline that isn't `none` or `0`.
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
const CUSTOM_CSS = join(DOCS_SRC, 'css', 'custom.css');
const RING_CLASS = 'live-editor';
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
 * The value an element gives attribute `name`: the expression inside `{}`, or
 * the string literal. In JSX the last attribute or spread to set a prop wins,
 * so a spread after it, or no attribute at all, gives undefined.
 */
const valueOf = (opening, name) => {
  const last = opening.attributes.properties.findLast(
    attribute =>
      ts.isJsxSpreadAttribute(attribute) || attribute.name.getText() === name
  );
  if (last === undefined || ts.isJsxSpreadAttribute(last)) return undefined;
  const value = last.initializer;
  return value && ts.isJsxExpression(value) ? value.expression : value;
};

/** Whether an element's attribute `name` is the string `text`. */
const isText = (opening, name, text) => {
  const value = valueOf(opening, name);
  return (
    value !== undefined && ts.isStringLiteralLike(value) && value.text === text
  );
};

/**
 * Whether an element's `tabMode` is `"focus"`: the last attribute or spread
 * that could set it must be the literal `tabMode="focus"`.
 */
const tabModeIsFocus = element => isText(element, 'tabMode', 'focus');

/**
 * The opening tag of the JSX element an editor is a direct child of, if that
 * element has the class `name`. An editor passed as a prop, or inside an
 * expression, has none.
 */
const wrapperOf = (node, name) => {
  const element = ts.isJsxOpeningElement(node) ? node.parent : node;
  const up = element.parent;
  return up &&
    ts.isJsxElement(up) &&
    isText(up.openingElement, 'className', name)
    ? up.openingElement
    : undefined;
};

/**
 * Whether an expression is always a non-empty string: a non-empty literal, a
 * template with text of its own, or a condition between two of those.
 */
const alwaysText = node => {
  if (ts.isParenthesizedExpression(node)) return alwaysText(node.expression);
  if (ts.isStringLiteralLike(node)) return node.text.trim() !== '';
  if (ts.isTemplateExpression(node)) {
    return [node.head, ...node.templateSpans.map(span => span.literal)].some(
      part => part.text.trim() !== ''
    );
  }
  if (ts.isConditionalExpression(node)) {
    return alwaysText(node.whenTrue) && alwaysText(node.whenFalse);
  }
  return false;
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
          node,
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

  it('draws a focus ring around each one', () => {
    const outside = editors
      .filter(editor => !wrapperOf(editor.node, RING_CLASS))
      .map(editor => editor.where);
    assert.deepEqual(
      outside,
      [],
      `These editors aren't right inside an element with className="${RING_CLASS}", ` +
        "which draws the focus ring react-live's inline `outline: none` " +
        'takes away (WCAG 2.4.7).'
    );
    const rule = new RegExp(
      `\\.${RING_CLASS}:focus-within\\s*\\{([^}]*)\\}`
    ).exec(readFileSync(CUSTOM_CSS, 'utf8'))?.[1];
    assert.match(
      rule ?? '',
      /(^|;)\s*outline\s*:(?!\s*(?:none|0)\b)[^;]+/,
      `${relative(REPO, CUSTOM_CSS)} needs a .${RING_CLASS}:focus-within rule ` +
        'with an outline, so the editor shows where focus is (WCAG 2.4.7).'
    );
  });

  it('names the group around each one', () => {
    const unnamed = editors
      .map(editor => ({
        ...editor,
        wrapper: wrapperOf(editor.node, RING_CLASS),
      }))
      .filter(
        ({ wrapper }) =>
          wrapper !== undefined &&
          !(
            isText(wrapper, 'role', 'group') &&
            valueOf(wrapper, 'aria-label') !== undefined &&
            alwaysText(valueOf(wrapper, 'aria-label'))
          )
      )
      .map(editor => editor.where);
    assert.deepEqual(
      unnamed,
      [],
      `These editors' className="${RING_CLASS}" wrappers need ` +
        '`role="group"` and an `aria-label` that is always some text, the ' +
        "name a screen reader gives on the way in, since react-live's " +
        'editable <pre> takes no role or name of ours (WCAG 4.1.2).'
    );
  });
});
