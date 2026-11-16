/**
 * Hold every `Tabs.Item` (or `TabItem`, its flat export) in the examples to
 * the markup a keyboard and a screen reader can use (#1918).
 *
 * `Tabs.Item` renders a bare `<li>` and the caller writes the link inside, so
 * the examples are where that markup comes from. Four things are checked:
 *
 * - the item's first element is a link: an `<a>` with an `href`, or a
 *   component (a router's link) with an `href` or a `to`, since an `<a>`
 *   without one is skipped by the keyboard and isn't offered as a link;
 * - an item marked `active` has `aria-current="page"` on that link, since
 *   `active` only adds Bulma's class (an expression for it passes);
 * - a link whose item isn't marked `active` doesn't say it's the current page,
 *   and neither does one that says so always while its item's `active` is an
 *   expression;
 * - the item sits in a plain `<ul>`, not in a `Tabs.List`, which always
 *   renders `role="tablist"`, a tab list with no tabs in it here, nor in a
 *   `<ul>` given a role of its own.
 *
 * A link with a spread passes the link checks, and an item with one passes
 * the current-page checks, since this can't see into either, and an item whose
 * link is an expression (`{link}`) passes them all but where it sits. The
 * `bestax-migrate` references are left out, since their fences show the
 * markup a codemod keeps rather than markup to copy, and so is the blog,
 * whose posts are dated. So is the 2-to-3 migration guide, which shows 2.x
 * code as it was written, with a caution saying where it falls short.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import {
  REPO,
  attributesOf,
  exampleFiles,
  isElement,
  parseTsx,
  sourcesOf,
  tagOf,
  ts,
} from './lib/example-sources.mjs';

/** The guide whose 2.x example stays as written, under a caution. */
const LEGACY_GUIDE =
  'docs/docs/guides/getting-started/migration/bulma-ui-2-to-3.md';

/** The tags a `Tabs.Item` is written with. */
const TAGS = new Set(['Tabs.Item', 'TabItem']);

/**
 * How an attribute is set: not at all (`none`, which `false`, `null` and
 * `undefined` are too), bare or `true` (`on`), to a string (`text`), or to
 * anything else (`dynamic`).
 */
function settingOf(prop) {
  if (!prop) return { kind: 'none' };
  const value = prop.initializer;
  if (value === undefined) return { kind: 'on' };
  if (ts.isStringLiteral(value)) return { kind: 'text', text: value.text };
  const expr = value.expression;
  if (!expr) return { kind: 'none' };
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    return { kind: 'text', text: expr.text };
  }
  if (
    expr.kind === ts.SyntaxKind.FalseKeyword ||
    expr.kind === ts.SyntaxKind.NullKeyword ||
    (ts.isIdentifier(expr) && expr.text === 'undefined')
  ) {
    return { kind: 'none' };
  }
  if (expr.kind === ts.SyntaxKind.TrueKeyword) return { kind: 'on' };
  return { kind: 'dynamic' };
}

/** Whether an attribute is set to something other than an empty string. */
const isSet = prop => {
  const set = settingOf(prop);
  return set.kind !== 'none' && !(set.kind === 'text' && set.text === '');
};

/** The nearest JSX element around `node`, or undefined. */
function parentElement(node) {
  for (let up = node.parent; up; up = up.parent) {
    if (isElement(up)) return up;
  }
  return undefined;
}

/** The problems with one `Tabs.Item`, as short names. */
function problemsOf(item) {
  const problems = [];
  const list = parentElement(item);
  if (!list) problems.push('not in a list');
  else if (tagOf(list) === 'Tabs.List') problems.push('in Tabs.List');
  else if (tagOf(list) !== 'ul') problems.push('not in a <ul>');
  else if (attributesOf(list).byName.has('role')) problems.push('<ul> role');

  const children = ts.isJsxElement(item) ? item.children : [];
  // The first child that renders something: an element, or an expression
  // other than a string (`{' '}` is text, like the text around it).
  const first = children.find(
    child =>
      isElement(child) ||
      (ts.isJsxExpression(child) &&
        child.expression &&
        !ts.isStringLiteral(child.expression) &&
        !ts.isNoSubstitutionTemplateLiteral(child.expression))
  );
  // A link passed in as an expression is one this can't see into.
  if (first && !isElement(first)) return problems;
  const link = first
    ? attributesOf(first)
    : { byName: new Map(), spread: false };
  if (link.spread) return problems;
  const tag = first ? tagOf(first) : '';
  const component = /^[A-Z]/.test(tag);
  const target =
    isSet(link.byName.get('href')) ||
    (component && isSet(link.byName.get('to')));
  if (!target || !(tag === 'a' || component)) problems.push('no link');

  const own = attributesOf(item);
  if (own.spread) return problems;
  const active = settingOf(own.byName.get('active'));
  const current = settingOf(link.byName.get('aria-current'));
  const page = current.kind === 'text' && current.text === 'page';
  if (active.kind !== 'none' && !page && current.kind !== 'dynamic') {
    problems.push('active without aria-current="page"');
  }
  // What ARIA reads as a current item: anything but "false" or nothing.
  const claims =
    current.kind === 'on' ||
    (current.kind === 'text' && !['', 'false'].includes(current.text));
  if (active.kind === 'none' && claims) {
    problems.push('aria-current on an item that is not active');
  }
  if (active.kind === 'dynamic' && claims) {
    problems.push('aria-current fixed while active varies');
  }
  return problems;
}

/** In one piece of code, every `Tabs.Item` and its problems, by line. */
function readCode(code) {
  const sf = parseTsx(code);
  const items = [];
  const visit = node => {
    if (isElement(node) && TAGS.has(tagOf(node))) {
      items.push({
        offset: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line,
        problems: problemsOf(node),
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return items;
}

const FILES = exampleFiles().filter(
  rel =>
    rel !== LEGACY_GUIDE &&
    /<(Tabs\.Item|TabItem)\b/.test(readFileSync(join(REPO, rel), 'utf8'))
);

describe('Tabs.Item in the examples', () => {
  const items = FILES.flatMap(rel =>
    sourcesOf(rel).flatMap(({ code, line }) =>
      readCode(code).map(({ offset, problems }) => ({
        at: `${rel}:${line + offset}`,
        rel,
        problems,
      }))
    )
  );

  it('reads an item the way it renders', () => {
    const read = code => readCode(code).map(i => i.problems);
    const nav = item => `<Tabs><ul>${item}</ul></Tabs>`;
    const cases = [
      [
        '<Tabs.Item active><a href="#a" aria-current="page">A</a></Tabs.Item>',
        [],
      ],
      ['<Tabs.Item><a href="#b">B</a></Tabs.Item>', []],
      ['<Tabs.Item><a>B</a></Tabs.Item>', ['no link']],
      ['<Tabs.Item><a href="">B</a></Tabs.Item>', ['no link']],
      // Not a link, whatever it carries.
      ['<Tabs.Item><span href="#b">B</span></Tabs.Item>', ['no link']],
      ['<Tabs.Item></Tabs.Item>', ['no link']],
      // A router's link, by `to` or `href`.
      ['<Tabs.Item><Link to="/b">B</Link></Tabs.Item>', []],
      ['<Tabs.Item><NextLink href="/b">B</NextLink></Tabs.Item>', []],
      ['<Tabs.Item><Link>B</Link></Tabs.Item>', ['no link']],
      // The link is the item's first element: one deeper doesn't count.
      ['<Tabs.Item><span><a href="#a">A</a></span></Tabs.Item>', ['no link']],
      // A link this can't see into passes.
      ['<Tabs.Item active>{link}</Tabs.Item>', []],
      ['<Tabs.Item active><a {...link}>A</a></Tabs.Item>', []],
      // The current page, and only on the active item.
      [
        '<Tabs.Item active><a href="#a">A</a></Tabs.Item>',
        ['active without aria-current="page"'],
      ],
      [
        '<Tabs.Item active><a href="#a" aria-current="false">A</a></Tabs.Item>',
        ['active without aria-current="page"'],
      ],
      [
        '<Tabs.Item active={true}><a href="#a" aria-current="true">A</a></Tabs.Item>',
        ['active without aria-current="page"'],
      ],
      ['<Tabs.Item active={false}><a href="#a">A</a></Tabs.Item>', []],
      [
        '<Tabs.Item active={on}><a href="#a" aria-current={on ? \'page\' : undefined}>A</a></Tabs.Item>',
        [],
      ],
      [
        '<Tabs.Item><a href="#b" aria-current="page">B</a></Tabs.Item>',
        ['aria-current on an item that is not active'],
      ],
      ['<Tabs.Item><a href="#b" aria-current="false">B</a></Tabs.Item>', []],
      ['<Tabs.Item><a href="#b" aria-current="">B</a></Tabs.Item>', []],
      [
        '<Tabs.Item active={on}><a href="#a" aria-current="page">A</a></Tabs.Item>',
        ['aria-current fixed while active varies'],
      ],
      // A string child is text, not a link passed in.
      [
        '<Tabs.Item active>{\' \'}<a href="#a" aria-current="page">A</a></Tabs.Item>',
        [],
      ],
      ["<Tabs.Item>{'Home'}</Tabs.Item>", ['no link']],
      // An item whose own props come through a spread.
      [
        '<Tabs.Item {...tab}><a href="#a" aria-current="page">A</a></Tabs.Item>',
        [],
      ],
      // The flat export reads the same.
      ['<TabItem><a>B</a></TabItem>', ['no link']],
    ];
    for (const [item, problems] of cases) {
      assert.deepEqual(read(nav(item)), [problems], item);
    }
    // Where the item sits.
    const item = '<Tabs.Item><a href="#a">A</a></Tabs.Item>';
    assert.deepEqual(read(`<Tabs><Tabs.List>${item}</Tabs.List></Tabs>`), [
      ['in Tabs.List'],
    ]);
    assert.deepEqual(read(`<Tabs><ul role="tablist">${item}</ul></Tabs>`), [
      ['<ul> role'],
    ]);
    assert.deepEqual(read(`<Tabs>${item}</Tabs>`), [['not in a <ul>']]);
    assert.deepEqual(read(item), [['not in a list']]);
    assert.deepEqual(read(`<ul>{xs.map(x => (${item}))}</ul>`), [[]]);
  });

  it('finds the examples', () => {
    for (const rel of [
      'docs/docs/api/components/tabs.md',
      'docs/docs/guides/library/components.md',
      'docs/docs/api/layout/hero.md',
      'bulma-ui/src/components/Tabs.stories.tsx',
      'bulma-ui/src/layout/Hero.stories.tsx',
    ]) {
      assert.ok(
        items.some(i => i.rel === rel),
        `no Tabs.Item in ${rel}`
      );
    }
  });

  it('gives each item a link a keyboard reaches, marks the current one, and keeps it in a plain list', () => {
    assert.deepEqual(
      items
        .filter(i => i.problems.length > 0)
        .map(i => `${i.at} ${i.problems.join(', ')}`),
      []
    );
  });
});
