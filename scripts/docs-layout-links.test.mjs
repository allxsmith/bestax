/**
 * Hold every link in the layout, grid, columns and Navbar examples to an `href`.
 *
 * An `<a>` with no `href` isn't a link: Tab skips it, Enter does nothing on
 * it, and assistive tech reads it as text. The Hero and Level examples wrote
 * their navbars, tabs and toolbars that way, the way Bulma's own examples
 * are, and they render fine, so nothing else caught it (#2020), and the
 * Navbar examples did the same with a brand item and a router-link stand-in
 * (#2048). This reads the jsx and tsx fences on the layout, grid and columns
 * API pages and the Navbar page, and those folders' stories and Navbar's.
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
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import {
  REPO,
  attributeValue,
  attributesOf,
  exampleFiles,
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
 * The examples this holds: the layout, grid and columns pages and stories,
 * and the Navbar page and stories.
 */
const IN_SCOPE =
  /^(docs\/docs\/api\/(layout|grid|columns)\/|bulma-ui\/src\/(layout|grid|columns)\/|docs\/docs\/api\/components\/navbar\.md$|bulma-ui\/src\/components\/Navbar\.stories\.tsx$)/;

/**
 * Every element in one piece of code that renders an `<a>`, each with its
 * line within the code and whether it has an `href`.
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
  const visit = node => {
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
        anchors.push({
          offset: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line,
          ok: spread || (byName.has('href') && linkingHref(byName.get('href'))),
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return anchors;
}

/** The same, for a whole file, each found as `{ at, ok }` (`file:line`). */
function readFile(rel) {
  return sourcesOf(rel).flatMap(({ code, line }) =>
    readCode(code).map(({ offset, ok }) => ({
      at: `${rel}:${line + offset}`,
      ok,
    }))
  );
}

const FILES = exampleFiles().filter(rel => IN_SCOPE.test(rel));

describe('links in the layout, grid, columns and Navbar examples', () => {
  const anchors = FILES.flatMap(readFile);

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

  it('reads the pages and stories the Hero, Level and Navbar links live on', () => {
    // So a moved page or a parse that finds nothing can't pass by reading
    // no links at all.
    for (const rel of [
      'docs/docs/api/layout/hero.md',
      'docs/docs/api/layout/level.md',
      'bulma-ui/src/layout/Hero.stories.tsx',
      'bulma-ui/src/layout/Level.stories.tsx',
      'docs/docs/api/components/navbar.md',
      'bulma-ui/src/components/Navbar.stories.tsx',
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
});
