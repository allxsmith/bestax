/**
 * Hold every link in the layout, grid, columns and Navbar examples, and every
 * `Panel` block and tab link in any example, to an `href`.
 *
 * An `<a>` with no `href` isn't a link: Tab skips it, Enter does nothing on
 * it, and assistive tech reads it as text. The Hero and Level examples wrote
 * their navbars, tabs and toolbars that way, the way Bulma's own examples
 * are, and they render fine, so nothing else caught it (#2020), and the
 * Navbar examples did the same with a brand item and a router-link stand-in
 * (#2048), and the Panel's with its blocks and tabs (#1985). This reads the
 * jsx and tsx fences on the layout, grid and columns API pages and the Navbar
 * page, and those folders' stories and Navbar's, and for `Panel.Block` and
 * the links in a `Panel.Tabs`, every example. The active link in a
 * `Panel.Tabs` also says it's current with `aria-current`, since its
 * `is-active` class is only seen.
 *
 * An element renders an `<a>` when it's a hand-written `<a>`, when its `as`
 * is `"a"`, or when it's one of `ANCHOR_BY_DEFAULT` with no `as`. It passes
 * with an `href` that holds a link (`linkingHref`), or with a spread, which
 * this can't see into. A `Navbar.Link` in a `Navbar.Dropdown` is left out,
 * since with no `href` it makes itself a button there, and so is a
 * `Dropdown.Item`, a focusable menu item whatever its `as`. `Menu.Item` is
 * the Menu test's. Components are read by their dotted names, the way these
 * examples write them.
 *
 * Each source is parsed with TypeScript as a `.tsx` file and nothing is
 * compiled, so a fence that is only a fragment still reads.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import {
  REPO,
  attributeValue,
  attributesOf,
  exampleFiles,
  isNothing,
  linkingHref,
  sourcesOf,
} from './lib/example-sources.mjs';

const ts = createRequire(join(REPO, 'package.json'))('typescript');

/**
 * Components that render an `<a>` with no role or focus of its own when given
 * no `as` or `href`.
 */
const ANCHOR_BY_DEFAULT = new Set([
  'Link',
  'Navbar.Item',
  'Panel.Block',
  'Navbar.Link',
]);

/**
 * Focusable menu items whatever their `as`: `Menu.Item`, which the Menu test
 * holds, and `Dropdown.Item`.
 */
const LEFT_OUT = new Set(['Menu.Item', 'Dropdown.Item']);

/** Whether a `Navbar.Link` sits in a `Navbar.Dropdown`, where it's a button. */
function inDropdown(node) {
  for (let up = node.parent; up; up = up.parent) {
    if (
      ts.isJsxElement(up) &&
      up.openingElement.tagName.getText() === 'Navbar.Dropdown'
    ) {
      return true;
    }
  }
  return false;
}

/**
 * The examples this holds every link in: the layout, grid and columns pages
 * and stories, and the Navbar page and stories. A `Panel`'s are held in every
 * example.
 */
const IN_SCOPE =
  /^(docs\/docs\/api\/(layout|grid|columns)\/|bulma-ui\/src\/(layout|grid|columns)\/|docs\/docs\/api\/components\/navbar\.md$|bulma-ui\/src\/components\/Navbar\.stories\.tsx$)/;

/** Whether an `aria-current` says the element is current: not bare, `""`, `"false"`, `false` or nothing. */
function saysCurrent(prop) {
  const { bare, text, expr } = attributeValue(prop);
  if (bare) return false;
  if (text !== undefined) return text !== '' && text !== 'false';
  return !(expr.kind === ts.SyntaxKind.FalseKeyword || isNothing(expr));
}

/** Whether a `className` can carry `is-active`: a literal holding it, or an expression naming it. */
function canBeActive(prop, sf) {
  const { text, expr } = attributeValue(prop);
  const source = text ?? expr?.getText(sf) ?? '';
  return /(^|[\s'"`])is-active([\s'"`]|$)/.test(source);
}

/**
 * Every element in one piece of code that renders an `<a>`, each with its
 * line within the code, whether it has an `href`, whether it's a `Panel`'s
 * (a `Panel.Block`, or a link in a `Panel.Tabs`), and for the active link in
 * a `Panel.Tabs`, whether it says it's current.
 */
function readCode(code) {
  const sf = ts.createSourceFile(
    'example.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const anchors = [];
  const visit = (node, inTabs) => {
    const tabs =
      inTabs ||
      (ts.isJsxElement(node) &&
        node.openingElement.tagName.getText(sf) === 'Panel.Tabs');
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sf);
      const { byName, spread } = attributesOf(node.attributes);
      const as = byName.has('as')
        ? attributeValue(byName.get('as')).text
        : undefined;
      const navbarLink = tag === 'Navbar.Link';
      const anchor =
        !LEFT_OUT.has(tag) &&
        !(navbarLink && inDropdown(node)) &&
        (tag === 'a' ||
          as === 'a' ||
          (ANCHOR_BY_DEFAULT.has(tag) && !byName.has('as')));
      if (anchor) {
        const tab = tabs;
        const active =
          tab &&
          byName.has('className') &&
          canBeActive(byName.get('className'), sf);
        anchors.push({
          offset: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line,
          ok: spread || (byName.has('href') && linkingHref(byName.get('href'))),
          panel: tag === 'Panel.Block' || tab,
          ...(active && {
            current:
              spread ||
              (byName.has('aria-current') &&
                saysCurrent(byName.get('aria-current'))),
          }),
        });
      }
    }
    ts.forEachChild(node, child => visit(child, tabs));
  };
  visit(sf, false);
  return anchors;
}

/** The same, for a whole file, each found with its place as `at` (`file:line`). */
function readFile(rel) {
  return sourcesOf(rel).flatMap(({ code, line }) =>
    readCode(code).map(({ offset, ...found }) => ({
      at: `${rel}:${line + offset}`,
      ...found,
    }))
  );
}

describe('links in the layout, grid, columns and Navbar examples, and the Panel’s', () => {
  // Outside the layout pages only a Panel's links are held, so a file that
  // names no Panel part isn't parsed.
  const anchors = exampleFiles()
    .filter(
      rel =>
        IN_SCOPE.test(rel) ||
        readFileSync(join(REPO, rel), 'utf8').includes('Panel.')
    )
    .flatMap(rel =>
      readFile(rel).filter(anchor => anchor.panel || IN_SCOPE.test(rel))
    );

  it('holds each way of writing a link to what it renders', () => {
    const verdicts = [
      ['<a href="#d">D</a>', true],
      ['<a href={`#d`}>D</a>', true],
      ['<a href={"#d"}>D</a>', true],
      ['<a href>D</a>', false],
      ['<a href={}>D</a>', false],
      ['<a href={url}>D</a>', true],
      ['<a {...props}>D</a>', true],
      ['<Link href="#d">D</Link>', true],
      ['<Navbar.Item href="#d">D</Navbar.Item>', true],
      ['<Navbar.Item as="a" href="#d">D</Navbar.Item>', true],
      ['<Button as="a" href="#d">D</Button>', true],
      ['<Level.Item as="a" href="#d">D</Level.Item>', true],
      ['<Panel.Block href="#d">D</Panel.Block>', true],
      ['<Panel.Block>D</Panel.Block>', false],
      ['<Navbar.Link href="#d">D</Navbar.Link>', true],
      ['<Navbar.Link>D</Navbar.Link>', false],
      ['<a>D</a>', false],
      ['<a href="">D</a>', false],
      ['<a href={undefined}>D</a>', false],
      ['<a href={null}>D</a>', false],
      ['<Link>D</Link>', false],
      ['<Link textColor="info">D</Link>', false],
      ['<Navbar.Item>D</Navbar.Item>', false],
      ['<Navbar.Item as="a">D</Navbar.Item>', false],
      ['<Button as="a">D</Button>', false],
      ['<Level.Item as="a">D</Level.Item>', false],
    ];
    // Every shape the rule gets wrong, so a failure names all of them.
    const wrong = verdicts
      .filter(([code, ok]) => readCode(code)[0]?.ok !== ok)
      .map(([code]) => code);
    assert.deepEqual(wrong, []);
  });

  it('leaves alone what renders no <a>', () => {
    for (const code of [
      '<Navbar.Item as="span">D</Navbar.Item>',
      '<Link as="button">D</Link>',
      '<Level.Item as="p">D</Level.Item>',
      '<Button>D</Button>',
      '<Navbar.Dropdown><Navbar.Link>D</Navbar.Link></Navbar.Dropdown>',
      '<Navbar.Dropdown><Navbar.Link as="a">D</Navbar.Link></Navbar.Dropdown>',
      '<Menu.Item>D</Menu.Item>',
      '<Dropdown.Item>D</Dropdown.Item>',
      '<Dropdown.Item as="a">D</Dropdown.Item>',
      '<Panel.Block as="label">D</Panel.Block>',
    ]) {
      assert.deepEqual(readCode(code), [], code);
    }
  });

  it('reads the pages and stories the Hero, Level, Navbar and Panel links live on', () => {
    // So a moved page or a parse that finds nothing can't pass by reading
    // no links at all.
    for (const rel of [
      'docs/docs/api/layout/hero.md',
      'docs/docs/api/layout/level.md',
      'bulma-ui/src/layout/Hero.stories.tsx',
      'bulma-ui/src/layout/Level.stories.tsx',
      'docs/docs/api/components/navbar.md',
      'bulma-ui/src/components/Navbar.stories.tsx',
      'docs/docs/api/components/panel.md',
      'bulma-ui/src/components/Panel.stories.tsx',
    ]) {
      assert.ok(
        anchors.some(anchor => anchor.at.startsWith(`${rel}:`)),
        `found no link in ${rel}`
      );
    }
  });

  it('gives every link an href', () => {
    const hrefless = anchors.filter(anchor => !anchor.ok).map(a => a.at);
    assert.deepEqual(
      hrefless,
      [],
      'These render an <a> with no href, which Tab skips. Give each an ' +
        '`href` (a `#` fragment is enough in an example):\n  ' +
        hrefless.join('\n  ')
    );
  });

  it('reads an active Panel tab and whether it says it is current', () => {
    const tab = attrs => `<Panel.Tabs><a href="#a" ${attrs}>A</a></Panel.Tabs>`;
    const verdicts = [
      [tab('className="is-active" aria-current="true"'), [true]],
      [
        tab(
          `className={on ? 'is-active' : ''} aria-current={on ? 'true' : undefined}`
        ),
        [true],
      ],
      [tab('className="is-active" {...props}'), [true]],
      [tab('className="is-active"'), [false]],
      [tab('className="is-active" aria-current'), [false]],
      [tab('className="is-active" aria-current=""'), [false]],
      [tab('className="is-active" aria-current="false"'), [false]],
      [tab('className="is-active" aria-current={false}'), [false]],
      [tab('className="is-active" aria-current={undefined}'), [false]],
      [tab(`className={on ? 'is-active' : ''}`), [false]],
      [tab(''), [undefined]],
      ['<Tabs><a href="#a" className="is-active">A</a></Tabs>', [undefined]],
      [
        '<Panel.Tabs><Link href="#a" className="is-active">A</Link></Panel.Tabs>',
        [false],
      ],
      [tab(`className={cx('is-active-tab', on)}`), [undefined]],
    ];
    // Every shape the rule gets wrong, so a failure names all of them.
    const wrong = verdicts
      .filter(
        ([code, current]) =>
          JSON.stringify(readCode(code).map(a => a.current)) !==
          JSON.stringify(current)
      )
      .map(([code]) => code);
    assert.deepEqual(wrong, []);
  });

  it('marks the active tab in each Panel.Tabs with aria-current', () => {
    const tabs = anchors.filter(anchor => 'current' in anchor);
    for (const rel of [
      'docs/docs/api/components/panel.md',
      'bulma-ui/src/components/Panel.stories.tsx',
    ]) {
      assert.ok(
        tabs.some(tab => tab.at.startsWith(`${rel}:`)),
        `found no active Panel tab in ${rel}`
      );
    }
    const unmarked = tabs.filter(tab => !tab.current).map(tab => tab.at);
    assert.deepEqual(
      unmarked,
      [],
      'These active Panel tabs are marked by their class alone. Give each ' +
        '`aria-current="true"` beside `is-active`:\n  ' +
        unmarked.join('\n  ')
    );
  });
});
