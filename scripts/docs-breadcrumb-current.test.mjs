/**
 * Hold every `Breadcrumb` in the examples to the markup a screen reader can
 * use (#1943).
 *
 * `Breadcrumb` renders the `<nav>` and the `<ul>`, and the caller writes each
 * item, so the examples are where that markup comes from. Two things are
 * checked:
 *
 * - the current page's item, the `<li>` marked `is-active` in a string
 *   `className`, holds its link or `<span>` first, and that element has
 *   `aria-current="page"`, since the class only styles the item;
 * - an `Icon` beside a crumb's text has no name (`ariaLabel`, `aria-label` or
 *   `aria-labelledby` set to anything but an empty string), which would make
 *   it an image read as part of the link ("home icon Home"). An icon that is
 *   all a crumb shows is its name, so it's left alone.
 *
 * An element with a spread is passed, since this can't see into it. An item
 * is a crumb inside a `<Breadcrumb>`, and anywhere in Breadcrumb's own
 * stories, which pass their items as `children`. The `bestax-migrate`
 * references are left out, since their fences show the markup a codemod keeps
 * rather than markup to copy, and so is the blog, whose posts are dated.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import { REPO, exampleFiles, sourcesOf } from './lib/example-sources.mjs';

const ts = createRequire(join(REPO, 'package.json'))('typescript');
const STORIES = 'bulma-ui/src/components/Breadcrumb.stories.tsx';
/** What names an `Icon`, as `Icon` reads it. */
const NAMES = ['ariaLabel', 'aria-label', 'aria-labelledby'];

const isElement = node =>
  ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node);
const openingOf = node => (ts.isJsxElement(node) ? node.openingElement : node);
const tagOf = node => openingOf(node).tagName.getText();

/** An element's attributes by name, and whether any is a spread. */
function attributesOf(node) {
  const byName = new Map();
  let spread = false;
  for (const prop of openingOf(node).attributes.properties) {
    if (ts.isJsxSpreadAttribute(prop)) spread = true;
    else byName.set(prop.name.getText(), prop);
  }
  return { byName, spread };
}

/** An attribute's text when it's written as a string, else undefined. */
function textOf(prop) {
  const value = prop?.initializer;
  if (value === undefined) return undefined;
  if (ts.isStringLiteral(value)) return value.text;
  const expr = value.expression;
  return expr &&
    (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr))
    ? expr.text
    : undefined;
}

/** Whether a current item's link or `<span>` says it's the current page. */
function marksCurrent(item) {
  const first = item.children.find(isElement);
  if (!first) return false;
  const { byName, spread } = attributesOf(first);
  return spread || textOf(byName.get('aria-current')) === 'page';
}

/**
 * Whether an `Icon` is named: by an attribute, unless it's an empty string,
 * `{undefined}` or `{null}`, which `Icon` reads as none.
 */
function named(icon) {
  const { byName } = attributesOf(icon);
  return NAMES.some(name => {
    if (!byName.has(name)) return false;
    const prop = byName.get(name);
    const expr = prop.initializer?.expression;
    const nothing =
      expr &&
      (expr.kind === ts.SyntaxKind.NullKeyword ||
        (ts.isIdentifier(expr) && expr.text === 'undefined'));
    return !nothing && textOf(prop) !== '';
  });
}

/** Whether an element shows text of its own beside what else it holds. */
const hasText = element =>
  ts.isJsxElement(element) &&
  element.children.some(
    child =>
      (ts.isJsxText(child) && child.text.trim() !== '') ||
      (ts.isJsxExpression(child) &&
        child.expression &&
        ts.isStringLiteral(child.expression) &&
        child.expression.text.trim() !== '')
  );

/**
 * In one piece of code, every current-page item and whether it's marked, and
 * every `Icon` beside a crumb's text and whether it's unnamed, each with its
 * line within the code.
 */
function readCode(code, crumbs = false) {
  const sf = ts.createSourceFile(
    'example.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const current = [];
  const icons = [];
  const lineOf = node =>
    sf.getLineAndCharacterOfPosition(node.getStart(sf)).line;
  const visit = (node, inCrumbs, parent) => {
    const tag = isElement(node) ? tagOf(node) : undefined;
    if (tag === 'Breadcrumb') inCrumbs = true;
    if (inCrumbs && tag === 'li' && ts.isJsxElement(node)) {
      const classes = textOf(attributesOf(node).byName.get('className')) ?? '';
      if (classes.split(/\s+/).includes('is-active')) {
        current.push({ offset: lineOf(node), ok: marksCurrent(node) });
      }
    }
    if (inCrumbs && tag === 'Icon' && parent && hasText(parent)) {
      icons.push({
        offset: lineOf(node),
        ok: attributesOf(node).spread || !named(node),
      });
    }
    const holder = isElement(node) ? node : parent;
    ts.forEachChild(node, child => visit(child, inCrumbs, holder));
  };
  visit(sf, crumbs, undefined);
  return { current, icons };
}

/** The same, for a whole file, each found as `{ at, ok }` (`file:line`). */
function readFile(rel) {
  const current = [];
  const icons = [];
  for (const { code, line } of sourcesOf(rel)) {
    const found = readCode(code, rel === STORIES);
    const place = ({ offset, ok }) => ({ at: `${rel}:${line + offset}`, ok });
    current.push(...found.current.map(place));
    icons.push(...found.icons.map(place));
  }
  return { current, icons };
}

const FILES = exampleFiles().filter(
  rel =>
    rel === STORIES ||
    readFileSync(join(REPO, rel), 'utf8').includes('<Breadcrumb')
);

describe('Breadcrumb in the examples', () => {
  const found = new Map(FILES.map(rel => [rel, readFile(rel)]));
  const current = [...found.values()].flatMap(f => f.current);
  const icons = [...found.values()].flatMap(f => f.icons);

  it('reads a current item and an icon the way they render', () => {
    const marked = code => readCode(code).current.map(c => c.ok);
    const unnamed = code => readCode(code).icons.map(i => i.ok);
    const crumb = item => `<Breadcrumb>${item}</Breadcrumb>`;
    assert.deepEqual(
      marked(
        crumb(
          '<li className="is-active"><a href="#" aria-current="page">I</a></li>'
        )
      ),
      [true]
    );
    assert.deepEqual(
      marked(crumb('<li className="is-active"><a href="#">I</a></li>')),
      [false]
    );
    // A current crumb with no link marks its <span>, and one inside the link
    // doesn't count, since the link is what a screen reader reads.
    assert.deepEqual(
      marked(
        crumb(
          '<li className="is-active"><span aria-current="page">I</span></li>'
        )
      ),
      [true]
    );
    assert.deepEqual(
      marked(
        crumb(
          '<li className="is-active"><a href="#"><span aria-current="page">I</span></a></li>'
        )
      ),
      [false]
    );
    assert.deepEqual(
      marked(crumb('<li className="is-active"><a {...current}>I</a></li>')),
      [true]
    );
    // An item that isn't the current one, or a list outside a Breadcrumb,
    // isn't held to it, and Breadcrumb's stories pass their items outside one.
    assert.deepEqual(marked(crumb('<li><a href="#">I</a></li>')), []);
    assert.deepEqual(
      marked('<ul><li className="is-active"><a href="#">I</a></li></ul>'),
      []
    );
    assert.deepEqual(
      readCode(
        '<><li className="is-active"><a href="#">I</a></li></>',
        true
      ).current.map(c => c.ok),
      [false]
    );
    // An icon beside text: named by any of Icon's names, unnamed by none or
    // an empty one.
    for (const [attribute, ok] of [
      ['', true],
      [' ariaLabel="home"', false],
      [' aria-label="home"', false],
      [' aria-labelledby="h"', false],
      [' ariaLabel=""', true],
      [' ariaLabel={undefined}', true],
      [' ariaLabel={null}', true],
      [' {...p}', true],
    ]) {
      assert.deepEqual(
        unnamed(
          crumb(`<li><a href="#"><Icon name="home"${attribute} /> H</a></li>`)
        ),
        [ok],
        attribute
      );
    }
    // An icon that is all the crumb shows is its name.
    assert.deepEqual(
      unnamed(
        crumb('<li><a href="/"><Icon name="home" ariaLabel="Home" /></a></li>')
      ),
      []
    );
  });

  it('finds the examples', () => {
    for (const rel of [
      'docs/docs/api/components/breadcrumb.md',
      'docs/docs/guides/library/components.md',
      STORIES,
    ]) {
      assert.ok(found.get(rel)?.current.length, `no current crumb in ${rel}`);
    }
  });

  it('marks the current page with aria-current="page"', () => {
    assert.deepEqual(
      current.filter(c => !c.ok).map(c => c.at),
      []
    );
  });

  it('leaves an icon beside a crumb unnamed', () => {
    assert.deepEqual(
      icons.filter(i => !i.ok).map(i => i.at),
      []
    );
  });
});
