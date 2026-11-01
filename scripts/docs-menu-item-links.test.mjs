/**
 * Hold every `Menu.Item` in the examples to an element the keyboard can reach.
 *
 * `Menu.Item` renders an `<a>` by default, and an `<a>` with no `href` isn't a
 * link: Tab skips it, and assistive tech doesn't present it as one. Most of
 * the Menu examples were written that way, the way Bulma's own example is,
 * and they render fine, so nothing else caught it (#1095). This reads the jsx
 * and tsx fences under `docs/docs` and `skills`, the `.tsx` examples in
 * `skills`, and bulma-ui's stories.
 *
 * An item passes when it renders something the keyboard reaches:
 *
 * - an `href` holding a link, so not `""`, `{undefined}` or `{null}`, on the
 *   default `<a>` or an `as="a"`;
 * - an `as` naming a component, which owns its own props (a router link and
 *   its `to`), or `as="button"`;
 * - a spread, which this can't see into.
 *
 * A `to` counts only through an `as` component: on its own it lands on the
 * default `<a>` as an attribute the browser ignores. An `as` naming another
 * tag (`span`, `div`) renders an element Tab skips, `href` or not.
 *
 * The `bestax-migrate` references are left out. Their fences pair another
 * library's markup with what the codemod writes for it, and the codemod
 * keeps the source's markup on purpose, a static `<span>` item included, so
 * they show what it does rather than what to copy.
 *
 * The Menu page also writes its own `<a>`, the stand-in for a router link in
 * its Custom Link example, which a reader copies into an app. An `<a>` there
 * is held to the same `href` rule. A hand-written `<a>` anywhere else is out
 * of scope.
 *
 * Each source is parsed with TypeScript as a `.tsx` file and nothing is
 * compiled, so a fence that is only a fragment still reads.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';
import { fenceSpans, splitLines } from './lib/api-page.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const ts = createRequire(join(REPO, 'package.json'))('typescript');
const TAGS = new Set(['Menu.Item', 'MenuItem']);
const MENU_PAGE = 'docs/docs/api/components/menu.md';
const LEFT_OUT = 'skills/bestax-migrate/references/';

/** Repo-relative paths under `dir` whose name passes `keep`. */
function filesUnder(dir, keep) {
  return readdirSync(join(REPO, dir), { recursive: true })
    .map(name => join(dir, name).split(sep).join('/'))
    .filter(rel => !rel.includes('/node_modules/') && keep(rel));
}

/** The jsx and tsx in one file, each with the line its code starts on. */
function sourcesOf(rel) {
  const src = readFileSync(join(REPO, rel), 'utf8');
  if (rel.endsWith('.tsx')) return [{ code: src, line: 1 }];
  const { lines } = splitLines(src);
  return fenceSpans(lines)
    .filter(({ open }) =>
      /^ {0,3}(`{3,}|~{3,})\s*(jsx|tsx)\b/.test(lines[open])
    )
    .map(({ open, close }) => ({
      code: lines.slice(open + 1, close).join('\n'),
      line: open + 2,
    }));
}

/** An attribute's value as written: a string, an expression, or nothing. */
function valueOf(prop) {
  const value = prop.initializer;
  if (value === undefined) return { bare: true };
  if (ts.isStringLiteral(value)) return { text: value.text };
  const expr = value.expression;
  if (expr === undefined) return { bare: true };
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    return { text: expr.text };
  }
  return { expr };
}

/** Whether an `href` holds something a browser can follow. */
function linkHref(prop) {
  const { bare, text, expr } = valueOf(prop);
  if (bare) return false;
  if (text !== undefined) return text !== '';
  return !(
    expr.kind === ts.SyntaxKind.NullKeyword ||
    (ts.isIdentifier(expr) && expr.text === 'undefined')
  );
}

/** What an `as` names: a tag, or a component (`'component'`). */
function asTarget(prop) {
  const { text, expr } = valueOf(prop);
  if (text !== undefined) return text;
  return expr && (ts.isIdentifier(expr) || ts.isPropertyAccessExpression(expr))
    ? 'component'
    : undefined;
}

/** The attributes by name, and whether any is a spread. */
function attributesOf(attributes) {
  const byName = new Map();
  let spread = false;
  for (const prop of attributes.properties) {
    if (ts.isJsxSpreadAttribute(prop)) spread = true;
    else byName.set(prop.name.getText(), prop);
  }
  return { byName, spread };
}

/** Whether a `Menu.Item` renders something the keyboard can reach. */
function reachableItem(attributes) {
  const { byName, spread } = attributesOf(attributes);
  if (spread) return true;
  const as = byName.has('as') ? asTarget(byName.get('as')) : 'a';
  if (as === 'component' || as === 'button') return true;
  return as === 'a' && byName.has('href') && linkHref(byName.get('href'));
}

/** Whether a hand-written `<a>` has an `href` that links somewhere. */
function linkingAnchor(attributes) {
  const { byName, spread } = attributesOf(attributes);
  return spread || (byName.has('href') && linkHref(byName.get('href')));
}

/**
 * Every `Menu.Item` and every hand-written `<a>` in one piece of code, each
 * with its line within the code and whether it passes.
 */
function readCode(code) {
  const sf = ts.createSourceFile(
    'example.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const items = [];
  const anchors = [];
  const visit = node => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sf);
      const offset = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line;
      if (TAGS.has(tag)) {
        items.push({ offset, ok: reachableItem(node.attributes) });
      } else if (tag === 'a') {
        anchors.push({ offset, ok: linkingAnchor(node.attributes) });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { items, anchors };
}

/** The same, for a whole file, each found as `{ at, ok }` (`file:line`). */
function readFile(rel) {
  const items = [];
  const anchors = [];
  for (const { code, line } of sourcesOf(rel)) {
    const found = readCode(code);
    const place = ({ offset, ok }) => ({ at: `${rel}:${line + offset}`, ok });
    items.push(...found.items.map(place));
    anchors.push(...found.anchors.map(place));
  }
  return { items, anchors };
}

const FILES = [
  ...filesUnder('docs/docs', rel => /\.mdx?$/.test(rel)),
  ...filesUnder(
    'skills',
    rel => /\.(mdx?|tsx)$/.test(rel) && !rel.startsWith(LEFT_OUT)
  ),
  ...filesUnder('bulma-ui/src', rel => rel.endsWith('.stories.tsx')),
];

describe('Menu.Item in the examples', () => {
  const items = FILES.flatMap(rel => readFile(rel).items);

  it('holds each way of writing an item to what it renders', () => {
    const verdicts = [
      ['<Menu.Item href="#d">D</Menu.Item>', true],
      ['<Menu.Item href={url}>D</Menu.Item>', true],
      ['<Menu.Item as="a" href="#d">D</Menu.Item>', true],
      ['<Menu.Item as={Link} to="/d">D</Menu.Item>', true],
      ['<Menu.Item as={Router.Link} to="/d">D</Menu.Item>', true],
      ['<Menu.Item as="button">D</Menu.Item>', true],
      ['<Menu.Item {...props}>D</Menu.Item>', true],
      ['<Menu.Item>D</Menu.Item>', false],
      ['<Menu.Item to="/d">D</Menu.Item>', false],
      ['<Menu.Item href="">D</Menu.Item>', false],
      ['<Menu.Item href={undefined}>D</Menu.Item>', false],
      ['<Menu.Item href={null}>D</Menu.Item>', false],
      ['<Menu.Item as="a">D</Menu.Item>', false],
      ['<Menu.Item as="span">D</Menu.Item>', false],
      ['<Menu.Item as="div" onClick={go}>D</Menu.Item>', false],
      ['<Menu.Item as="span" href="#d">D</Menu.Item>', false],
    ];
    // Every shape the rule gets wrong, so a failure names all of them.
    const wrong = verdicts
      .filter(([code, ok]) => readCode(code).items[0].ok !== ok)
      .map(([code]) => code);
    assert.deepEqual(wrong, []);
  });

  it('reads the pages the Menu examples live on', () => {
    // So a moved page or a parse that finds nothing can't pass by reading
    // no items at all.
    for (const rel of [
      MENU_PAGE,
      'docs/docs/guides/library/components.md',
      'bulma-ui/src/components/Menu.stories.tsx',
    ]) {
      assert.ok(
        items.some(item => item.at.startsWith(`${rel}:`)),
        `found no Menu.Item in ${rel}`
      );
    }
  });

  it('gives every item an href, a router link or a button', () => {
    const unreachable = items.filter(item => !item.ok).map(item => item.at);
    assert.deepEqual(
      unreachable,
      [],
      'These render an element Tab skips. Give each an `href`, a router ' +
        'link through `as` and its `to`, or `as="button"`:\n  ' +
        unreachable.join('\n  ')
    );
  });
});

describe('the Menu page’s own links', () => {
  const { anchors } = readFile(MENU_PAGE);

  it('holds a hand-written <a> to the same href rule', () => {
    const verdicts = [
      ['<a href={props.to}>x</a>', true],
      ['<a {...props}>x</a>', true],
      ['<a>{props.children}</a>', false],
      ['<a href="">x</a>', false],
    ];
    const wrong = verdicts
      .filter(([code, ok]) => readCode(code).anchors[0].ok !== ok)
      .map(([code]) => code);
    assert.deepEqual(wrong, []);
  });

  it('reads the Custom Link stand-in', () => {
    assert.ok(anchors.length > 0, `found no <a> in ${MENU_PAGE}`);
  });

  it('gives every <a> it writes an href', () => {
    const hrefless = anchors.filter(anchor => !anchor.ok).map(a => a.at);
    assert.deepEqual(
      hrefless,
      [],
      'These render an <a> with no href, which Tab skips. A stand-in for a ' +
        "router link should render the `to` it's given as the `href`:\n  " +
        hrefless.join('\n  ')
    );
  });
});
