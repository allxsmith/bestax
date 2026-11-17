/**
 * Hold every `Sidebar` in the examples to a dialog with a name (#1893).
 *
 * `Sidebar` renders a `role="dialog"`, and nothing names it on its own,
 * `Sidebar.Title` included: the caller gives the title an `id` and the
 * sidebar an `aria-labelledby` pointing at it, or an `aria-label`. Without
 * one a screen reader announces "dialog" as focus moves in, with nothing to
 * say what it's for. Every Sidebar example used to leave it out and rendered
 * fine, so nothing else caught it.
 *
 * A sidebar passes when it has `aria-label` or `aria-labelledby` with a
 * value, or a spread, which this can't see into. It checks that a name is
 * given, not that an `aria-labelledby` points at an element that exists. The
 * examples are read through `lib/example-sources.mjs`, as the other example
 * tests read them. A `Sidebar` without `isOpen`, which every sidebar takes, is
 * a fragment showing a prop, as an ESLint rule's example is, and is left out.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import { REPO, exampleFiles, sourcesOf } from './lib/example-sources.mjs';

const ts = createRequire(join(REPO, 'package.json'))('typescript');
const NAMES = ['aria-label', 'aria-labelledby'];
const PAGE = 'docs/docs/api/components/sidebar.md';

/**
 * Whether an attribute holds a value: a string that isn't blank, or an
 * expression other than `undefined`, `null` or `false`.
 */
function holdsValue(prop) {
  const value = prop.initializer;
  if (value === undefined) return false;
  if (ts.isStringLiteral(value)) return value.text.trim() !== '';
  const expr = value.expression;
  if (expr === undefined) return false;
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    return expr.text.trim() !== '';
  }
  return !(
    expr.kind === ts.SyntaxKind.NullKeyword ||
    expr.kind === ts.SyntaxKind.FalseKeyword ||
    (ts.isIdentifier(expr) && expr.text === 'undefined')
  );
}

/** Every `Sidebar` in one piece of code, with its line and verdict. */
function readCode(code) {
  const sf = ts.createSourceFile(
    'example.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const found = [];
  /** Whether an attribute names the sidebar. */
  const names = prop =>
    NAMES.includes(prop.name.getText(sf)) && holdsValue(prop);
  const visit = node => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      node.tagName.getText(sf) === 'Sidebar' &&
      node.attributes.properties.some(
        prop =>
          ts.isJsxSpreadAttribute(prop) || prop.name.getText(sf) === 'isOpen'
      )
    ) {
      found.push({
        offset: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line,
        ok: node.attributes.properties.some(
          prop => ts.isJsxSpreadAttribute(prop) || names(prop)
        ),
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

describe('Sidebar in the examples', () => {
  const found = exampleFiles().flatMap(rel =>
    sourcesOf(rel).flatMap(({ code, line }) =>
      readCode(code).map(({ offset, ok }) => ({
        at: `${rel}:${line + offset}`,
        ok,
      }))
    )
  );

  it('holds each way of naming a sidebar to whether it names it', () => {
    const verdicts = [
      ['<Sidebar isOpen aria-labelledby="nav-title">x</Sidebar>', true],
      ['<Sidebar isOpen aria-labelledby={titleId}>x</Sidebar>', true],
      ['<Sidebar isOpen aria-label="Filters">x</Sidebar>', true],
      ['<Sidebar isOpen aria-label={label}>x</Sidebar>', true],
      ['<Sidebar {...props}>x</Sidebar>', true],
      ['<Sidebar isOpen>x</Sidebar>', false],
      ['<Sidebar isOpen title="Filters">x</Sidebar>', false],
      ['<Sidebar isOpen aria-label="">x</Sidebar>', false],
      ['<Sidebar isOpen aria-label={undefined}>x</Sidebar>', false],
      ['<Sidebar isOpen aria-labelledby={null}>x</Sidebar>', false],
      ['<Sidebar.Title>Filters</Sidebar.Title>', undefined],
      ['<Sidebar fullWidth />', undefined],
      ['<Sidebar isOpen={open} children={menu} />', false],
    ];
    // Every shape the rule gets wrong, so a failure names all of them.
    const wrong = verdicts
      .filter(([code, ok]) => readCode(code)[0]?.ok !== ok)
      .map(([code]) => code);
    assert.deepEqual(wrong, []);
  });

  it('reads the pages the Sidebar examples live on', () => {
    // So a moved page or a parse that finds nothing can't pass by reading
    // no sidebars at all.
    for (const rel of [
      PAGE,
      'docs/docs/guides/library/components.md',
      'bulma-ui/src/components/Sidebar.stories.tsx',
    ]) {
      assert.ok(
        found.some(sidebar => sidebar.at.startsWith(`${rel}:`)),
        `found no Sidebar in ${rel}`
      );
    }
  });

  it('gives every sidebar a name', () => {
    const nameless = found.filter(sidebar => !sidebar.ok).map(s => s.at);
    assert.deepEqual(
      nameless,
      [],
      'These open a dialog with no name. Give the Sidebar.Title an id and ' +
        'the Sidebar an aria-labelledby pointing at it, or an aria-label:\n  ' +
        nameless.join('\n  ')
    );
  });
});
