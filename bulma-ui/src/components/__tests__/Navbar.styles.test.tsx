// Chromium paints `.navbar-burger`'s bars in the page's Canvas color under
// forced colors, so `_navbar.scss` keeps them in ButtonText (#1466). jsdom
// evaluates no media query, and which background wins is a cascade across
// Bulma's sheet and the partial, in either order, so these compile the real
// partial, link it with Bulma's own CSS on either side, and resolve the bar
// the way a browser on a forced-colors page would: the rules at the top
// level and in a `forced-colors: active` block, ranked by importance, then
// specificity, then source order. A rule this can't rank, or one in a block
// it doesn't walk that sets a property it resolves, fails the test rather
// than dropping out.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import { Navbar } from '../Navbar';
import { Hero } from '../../layout/Hero';
import { ConfigProvider } from '../../helpers/Config';
import {
  cascade,
  customProperty,
  rulesOf as styleRulesOf,
} from '../../__tests__/css-cascade';
import {
  contrast,
  schemesOf,
  substitute,
  varsOn,
  type Vars,
} from '../../__tests__/contrast';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json. The partial
// compiles against its Sass and is checked against its CSS, so an upgrade
// moves the two together.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix = '') =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/navbar';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

const bulmaCss = (file = 'bulma.css') =>
  fs.readFileSync(path.join(BULMA, 'css', file), 'utf8');

const FORCED = '@media (forced-colors: active)';

interface Rule {
  /** The at-rules around it, outermost first, as written. */
  context: string[];
  selector: string;
  declarations: Record<string, string>;
}

/**
 * Every style rule in a sheet of Sass's expanded output, which Bulma's CSS
 * is too. Neither puts a brace or a semicolon inside a string.
 */
function rulesOf(css: string): Rule[] {
  const rules: Rule[] = [];
  const open: (string | Rule)[] = [];
  let buffer = '';
  for (const char of css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@charset "UTF-8";/g, '')) {
    if (char === '{') {
      const head = buffer.replace(/\s+/g, ' ').trim();
      buffer = '';
      if (head.startsWith('@')) {
        open.push(head);
      } else {
        const rule: Rule = {
          context: open.filter((o): o is string => typeof o === 'string'),
          selector: head,
          declarations: {},
        };
        rules.push(rule);
        open.push(rule);
      }
    } else if (char === '}') {
      const closed = open.pop();
      if (closed && typeof closed !== 'string') {
        for (const declaration of buffer.split(';')) {
          const at = declaration.indexOf(':');
          if (at < 0) continue;
          closed.declarations[declaration.slice(0, at).trim()] = declaration
            .slice(at + 1)
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
      buffer = '';
    } else {
      buffer += char;
    }
  }
  return rules;
}

/**
 * Specificity as [ids, classes, types]. `:not()` counts as its argument,
 * which is all the rules here need; any other functional pseudo-class, or an
 * argument that is a list, is refused.
 */
function specificity(selector: string): number[] {
  for (const [, name, arg] of selector.matchAll(/:([\w-]+)\(([^)]*)\)/g)) {
    if (name !== 'not' || arg.includes(',')) {
      throw new Error(
        `${selector} sets a property this test resolves with ` +
          `:${name}(${arg}), which it does not rank. Extend \`specificity\` ` +
          'before trusting a result.'
      );
    }
  }
  const flat = selector.replace(/:not\(([^)]*)\)/g, ' $1 ');
  return [
    (flat.match(/#[\w-]+/g) ?? []).length,
    (flat.match(/\.[\w-]+|\[[^\]]*\]|:[\w-]+/g) ?? []).length,
    (flat.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length,
  ];
}

const outranks = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
};

/** Whether one selector of a list matches `el`; a pseudo-element never does. */
const matches = (el: Element, part: string) => {
  if (part.includes('::')) return false;
  try {
    return el.matches(part);
  } catch {
    return false;
  }
};

/** Each property, and the shorthands that set it too. */
const SETTERS: Record<string, string[]> = {
  'background-color': ['background-color', 'background'],
  'forced-color-adjust': ['forced-color-adjust'],
};

/**
 * The value of `property` on `el`, as the rules of `css` resolve it on a
 * forced-colors page, or undefined if none sets it.
 */
function resolve(css: string, el: Element, property: string) {
  const setters = SETTERS[property];
  let won: { value: string; rank: number[] } | undefined;
  rulesOf(css).forEach((rule, order) => {
    const declared = Object.keys(rule.declarations).filter(name =>
      setters.includes(name)
    );
    if (declared.length === 0) return;
    const selectors = rule.selector
      .split(/,(?![^(]*\))/)
      .map(part => part.trim())
      .filter(part => matches(el, part));
    if (selectors.length === 0) return;
    const applies =
      rule.context.length === 0 ||
      (rule.context.length === 1 && rule.context[0] === FORCED);
    if (!applies) {
      if (rule.context.some(at => at.startsWith('@keyframes'))) return;
      throw new Error(
        `${rule.context.join(' ')} sets ${property} on ${rule.selector}, in a ` +
          'block this test does not walk. Extend `resolve` before trusting ' +
          'a result.'
      );
    }
    const specific = selectors
      .map(specificity)
      .reduce((best, next) => (outranks(next, best) ? next : best));
    declared.forEach(name => {
      const raw = rule.declarations[name];
      const important = /!important$/.test(raw) ? 1 : 0;
      const value = raw.replace(/\s*!important$/, '');
      const rank = [important, ...specific, order];
      if (!won || !outranks(won.rank, rank)) won = { value, rank };
    });
  });
  return won?.value;
}

/** How a burger's bar looks on a forced-colors page, from `css`. */
const look = (css: string, el: Element) => ({
  'background-color': resolve(css, el, 'background-color'),
  'forced-color-adjust': resolve(css, el, 'forced-color-adjust'),
});

const VISIBLE = {
  'background-color': 'ButtonText',
  'forced-color-adjust': 'none',
};

/** The burger `Navbar` renders, and one of its bars. */
function burgerOf(prefix: string, active = false) {
  const { getByRole } = render(
    <ConfigProvider classPrefix={prefix}>
      <Navbar aria-label="Site">
        <Navbar.Brand>
          <Navbar.Burger active={active} />
        </Navbar.Brand>
      </Navbar>
    </ConfigProvider>
  );
  const button = getByRole('button', { name: 'menu' });
  const bars = button.querySelectorAll('span');
  expect(bars).toHaveLength(4);
  return { button, bar: bars[0] };
}

describe('the burger bars on a forced-colors page', () => {
  // Bulma's CSS can land on either side of the extras: `bestax-no-dark-mode`
  // emits them first, and an app can link `extras.css` before its own Bulma.
  describe.each([
    ['the partial after Bulma', '', () => bulmaCss() + compile()],
    ['the partial before Bulma', '', () => compile() + bulmaCss()],
    [
      'a prefixed build, the partial after Bulma',
      'bulma-',
      () => bulmaCss('versions/bulma-prefixed.css') + compile('bulma-'),
    ],
    [
      'a prefixed build, the partial before Bulma',
      'bulma-',
      () => compile('bulma-') + bulmaCss('versions/bulma-prefixed.css'),
    ],
  ])('with %s', (_order, prefix, css) => {
    it('draws each bar in ButtonText, and leaves the button to the system', () => {
      const { button, bar } = burgerOf(prefix);
      expect(look(css(), bar)).toEqual(VISIBLE);
      expect(button.querySelectorAll('span')).toHaveLength(4);
      for (const span of button.querySelectorAll('span')) {
        expect(look(css(), span)).toEqual(VISIBLE);
      }
      // `forced-color-adjust` is inherited, so on the button it would take
      // the focus ring off the system's colors too.
      expect(resolve(css(), button, 'forced-color-adjust')).toBeUndefined();
    });

    it('draws the open burger’s X in ButtonText, since it is the same bars', () => {
      const { bar } = burgerOf(prefix, true);
      expect(bar.parentElement).toHaveClass(`${prefix}is-active`);
      expect(look(css(), bar)).toEqual(VISIBLE);
    });
  });

  it('is currentColor with Bulma alone, which is the bug', () => {
    const { bar, button } = burgerOf('');
    expect(look(bulmaCss(), bar)).toEqual({
      'background-color': 'currentColor',
      'forced-color-adjust': undefined,
    });
    expect(resolve(bulmaCss(), button, 'forced-color-adjust')).toBeUndefined();
  });
});

// What Bulma works out on `.navbar` for its items' text, and what the
// partial works out again on an active one.
const ITEM_COLOR =
  'hsl(var(--bulma-navbar-h), var(--bulma-navbar-s), var(--bulma-navbar-item-color-l))';

// While an overlay locks the page, the window takes back the room the page's
// scrollbar had and the lock sets it on <html>, so a fixed navbar takes it as
// margins to stay over the page. With no lock each falls back to 0.
const LOCK_MARGINS = {
  'margin-left': 'var(--bulma-scroll-lock-offset-left, 0px)',
  'margin-right': 'var(--bulma-scroll-lock-offset-right, 0px)',
};

/** The navbar `Navbar` renders, fixed to `fixed`. */
function fixedNavbarOf(prefix: string, fixed: 'top' | 'bottom') {
  const { getByRole } = render(
    <ConfigProvider classPrefix={prefix}>
      <Navbar aria-label="Site" fixed={fixed} />
    </ConfigProvider>
  );
  return getByRole('navigation');
}

/** Every rule of `css` that sets a margin on `el`, in any block. */
const marginRulesOn = (css: string, el: Element) =>
  rulesOf(css).filter(
    rule =>
      Object.keys(rule.declarations).some(name => name.startsWith('margin')) &&
      rule.selector.split(/,(?![^(]*\))/).some(part => matches(el, part.trim()))
  );

describe('the Navbar partial', () => {
  it.each([
    ['no prefix', ''],
    ['a class prefix', 'bestax-'],
  ])(
    'keeps the burger in forced colors, a fixed navbar’s lock margins and an active item’s text at no weight, and a prefixed dropdown’s active row over Bulma’s row rules, with %s, naming only prefixed classes',
    (_label, prefix) => {
      const rules = rulesOf(compile(prefix));
      expect(
        rules.slice(0, 2).map(rule => [rule.selector, rule.context])
      ).toEqual([
        [`.${prefix}navbar-burger.${prefix}navbar-burger span`, [FORCED]],
        [
          `:where(.${prefix}navbar.${prefix}is-fixed-top, .${prefix}navbar.${prefix}is-fixed-bottom)`,
          [],
        ],
      ]);
      // Then the colored hero's navbar, at the top level but for the menu's
      // rows under the burger and a bold hero's menu on a phone.
      // A prefixed build ends with one more rule, for a dropdown's active row.
      const extra = prefix ? 1 : 0;
      const hero = rules.slice(2, -1 - extra);
      expect(hero.map(rule => rule.context)).toEqual([
        [],
        ['@media screen and (max-width: 1023px)'],
        ['@media screen and (max-width: 768px)'],
        [],
        [],
      ]);
      for (const { selector } of hero) {
        expect(selector).toMatch(
          new RegExp(
            `^(:where\\()?\\.${prefix}hero(\\.${prefix}is-bold)?:is\\(`
          )
        );
      }
      expect(rules[0].declarations).toEqual({
        'forced-color-adjust': 'none',
        'background-color': 'ButtonText',
      });
      expect(rules[1].declarations).toEqual(LOCK_MARGINS);
      // Then an active item's text color, at no weight either.
      const last = rules[rules.length - 1 - extra];
      expect([last.selector, last.context]).toEqual([
        `:where(a.${prefix}navbar-item, .${prefix}navbar-link):where(.${prefix}is-active, .${prefix}is-selected):where(:not([class^=${prefix}has-background-], [class*=" ${prefix}has-background-"]))`,
        [],
      ]);
      expect(last.declarations).toEqual({
        '--bulma-navbar-item-color': ITEM_COLOR,
      });
      if (prefix) {
        // Last, a dropdown's active link row, one class over Bulma's.
        const row = rules[rules.length - 1];
        expect([row.selector, row.context]).toEqual([
          `.${prefix}navbar-dropdown a.${prefix}navbar-item:is(a):is(.${prefix}is-active, .${prefix}is-selected):where(:not(.${prefix}is-tab))`,
          [],
        ]);
      }
      // A class written bare matches nothing in a prefixed build.
      const classes = rules.flatMap(({ selector }) =>
        Array.from(selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g), m => m[1])
      );
      expect(classes.filter(name => !name.startsWith(prefix))).toEqual([]);
    }
  );

  describe.each([
    ['no prefix', '', 'bulma.css'],
    ['a class prefix', 'bulma-', 'versions/bulma-prefixed.css'],
  ])('with %s', (_label, prefix, bulmaFile) => {
    it.each(['top', 'bottom'] as const)(
      'gives a navbar fixed to the %s the lock’s margins, which nothing in Bulma sets',
      fixed => {
        // So `:where()`, which keeps the margins under anything an app
        // writes, still holds them wherever Bulma's sheet loads.
        const nav = fixedNavbarOf(prefix, fixed);
        const rules = marginRulesOn(bulmaCss(bulmaFile) + compile(prefix), nav);
        expect(rules.map(rule => [rule.selector, rule.context])).toEqual([
          [
            `:where(.${prefix}navbar.${prefix}is-fixed-top, .${prefix}navbar.${prefix}is-fixed-bottom)`,
            [],
          ],
        ]);
      }
    );

    it('leaves a navbar that isn’t fixed alone', () => {
      const { getByRole } = render(
        <ConfigProvider classPrefix={prefix}>
          <Navbar aria-label="Site" />
        </ConfigProvider>
      );
      expect(
        marginRulesOn(
          bulmaCss(bulmaFile) + compile(prefix),
          getByRole('navigation')
        )
      ).toEqual([]);
    });
  });

  it('is in the components index, so bestax.css and extras.css carry it', () => {
    const index = fs.readFileSync(
      path.join(SCSS, 'components/_index.scss'),
      'utf8'
    );
    expect(index).toMatch(/^@use 'navbar';$/m);
  });
});

// Bulma's hero sets the colors its navbar's items take on hover and when
// active, but Bulma's navbar reads only their rest color, so in a colored hero
// the active item and the burger came out in the link color, a hovered item
// in the scheme's fill under the hero's text, and the menu the burger opens in
// the scheme's background (#1641). The partial reads the hero's colors there.
// jsdom has no hover, and the partial styles focus with it, so focus stands
// in.
describe('a navbar in a colored hero', () => {
  describe.each([
    ['the partial after Bulma', '', () => bulmaCss() + compile()],
    ['the partial before Bulma', '', () => compile() + bulmaCss()],
    [
      'a prefixed build, the partial after Bulma',
      'bulma-',
      () => bulmaCss('versions/bulma-prefixed.css') + compile('bulma-'),
    ],
    [
      'a prefixed build, the partial before Bulma',
      'bulma-',
      () => compile('bulma-') + bulmaCss('versions/bulma-prefixed.css'),
    ],
  ])('with %s', (_order, prefix, sheet) => {
    const css = sheet();
    const partial = compile(prefix);

    /**
     * A navbar in a Hero, with an active item, a plain one, a tab and a
     * dropdown, and an item placed straight in the navbar.
     */
    const heroNavbar = (
      color?: 'primary' | 'warning' | 'white' | 'dark',
      navbarColor?: 'dark'
    ) => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <Hero color={color}>
            <Hero.Head>
              <Navbar aria-label="Site" color={navbarColor}>
                <Navbar.Item as="a" href="#loose" active>
                  Loose
                </Navbar.Item>
                <Navbar.Brand>
                  <Navbar.Burger />
                </Navbar.Brand>
                <Navbar.Menu>
                  <Navbar.Start>
                    <Navbar.Item as="a" href="#active" active>
                      Active
                    </Navbar.Item>
                    <Navbar.Item as="a" href="#plain">
                      Plain
                    </Navbar.Item>
                    <Navbar.Item
                      as="a"
                      href="#tab"
                      className={`${prefix}is-tab`}
                    >
                      Tab
                    </Navbar.Item>
                    <Navbar.Dropdown hoverable>
                      <Navbar.Link>More</Navbar.Link>
                      <Navbar.DropdownMenu>
                        <Navbar.Item as="a" href="#inside">
                          Inside
                        </Navbar.Item>
                        <div>
                          <Navbar.Item as="a" href="#deeper">
                            Deeper
                          </Navbar.Item>
                          <a className={`${prefix}navbar-link`} href="#sublink">
                            Sub
                          </a>
                        </div>
                      </Navbar.DropdownMenu>
                    </Navbar.Dropdown>
                  </Navbar.Start>
                </Navbar.Menu>
              </Navbar>
            </Hero.Head>
          </Hero>
        </ConfigProvider>
      );
      const find = (selector: string) =>
        container.querySelector(selector) as HTMLElement;
      return {
        navbar: find(`.${prefix}navbar`),
        loose: find('[href="#loose"]'),
        active: find('[href="#active"]'),
        plain: find('[href="#plain"]'),
        tab: find('[href="#tab"]'),
        link: find(`.${prefix}navbar-link`),
        inside: find('[href="#inside"]'),
        deeper: find('[href="#deeper"]'),
        sublink: find('[href="#sublink"]'),
      };
    };

    /** `property` on `el`, as the rules of `from` resolve it. */
    const style = (el: Element, property: string, from = css) =>
      cascade(
        el,
        from,
        [property],
        (declared, name) => declared.getPropertyValue(name) || undefined
      );

    it.each(['primary', 'warning', 'white', 'dark'] as const)(
      'draws the active item in a %s hero’s active colors',
      color => {
        const { active, loose } = heroNavbar(color);
        for (const el of [active, loose]) {
          expect(style(el, 'background-color')).toBe(
            'var(--bulma-navbar-item-active-background-color)'
          );
          expect(style(el, 'color')).toBe(
            'var(--bulma-navbar-item-active-color)'
          );
        }
      }
    );

    it('draws a focused item and a dropdown link in the hero’s hover colors', () => {
      const { plain, link, sublink } = heroNavbar('primary');
      for (const el of [plain, link, sublink]) {
        el.tabIndex = 0;
        el.focus();
        expect(el).toHaveFocus();
        expect(style(el, 'background-color')).toBe(
          'var(--bulma-navbar-item-hover-background-color)'
        );
        expect(style(el, 'color')).toBe('var(--bulma-navbar-item-hover-color)');
      }
    });

    it('leaves the items inside a dropdown, however deep, and a tab to Bulma', () => {
      // A dropdown on a large screen is a box of its own, and a tab draws no
      // fill, so the partial sets nothing of the hero's on them, focused or
      // active. In a prefixed build an active link row in the dropdown takes
      // back the fill and text Bulma gives it without a prefix (#1805).
      const bulmaOwn: Record<string, string> = {
        'background-color':
          'hsla(var(--bulma-navbar-h), var(--bulma-navbar-s), calc(var(--bulma-navbar-item-background-l) + var(--bulma-navbar-item-background-l-delta)), var(--bulma-navbar-item-background-a))',
        color: 'var(--bulma-navbar-item-color)',
      };
      const { inside, deeper, tab } = heroNavbar('primary');
      for (const el of [inside, deeper, tab]) {
        el.classList.add(`${prefix}is-active`);
        el.focus();
        expect(el).toHaveFocus();
        for (const property of ['background-color', 'color']) {
          expect(style(el, property, partial)).toBe(
            prefix && el !== tab ? bulmaOwn[property] : undefined
          );
        }
      }
    });

    it('gives the burger, the dropdown arrow, a tab and the phone menu the hero’s colors', () => {
      const { navbar } = heroNavbar('primary');
      // The arrow is the link's own `::after`, so it follows the link's text
      // at rest, hovered and active, staying visible on the fill.
      expect(customProperty(navbar, css, '--bulma-navbar-dropdown-arrow')).toBe(
        'currentColor'
      );
      for (const name of [
        '--bulma-navbar-burger-color',
        '--bulma-navbar-tab-hover-border-bottom-color',
        '--bulma-navbar-tab-active-color',
        '--bulma-navbar-tab-active-border-bottom-color',
      ]) {
        expect(customProperty(navbar, css, name)).toBe(
          'var(--bulma-navbar-item-color)'
        );
      }
      expect(
        customProperty(navbar, css, '--bulma-navbar-background-color')
      ).toMatch(
        /^hsl\(var\(--bulma-hero-h\), ?var\(--bulma-hero-s\), ?var\(--bulma-hero-background-l\)\)$/
      );
    });

    it('gives the dropdown’s rows in the phone menu the hero’s colors', () => {
      // On a phone the dropdown's rows sit in the open menu, which now takes
      // the hero's background, so they take its colors too. jsdom evaluates
      // no media query, so this reads the block itself.
      const { navbar } = heroNavbar('primary');
      const touch = rulesOf(partial).filter(
        rule =>
          rule.context.join(' ') === '@media screen and (max-width: 1023px)' &&
          matches(navbar, rule.selector)
      );
      expect(touch.map(rule => rule.declarations)).toEqual([
        {
          '--bulma-navbar-dropdown-item-h': 'var(--bulma-hero-h)',
          '--bulma-navbar-dropdown-item-s': 'var(--bulma-hero-s)',
          '--bulma-navbar-dropdown-item-background-l':
            'var(--bulma-hero-background-l)',
          '--bulma-navbar-dropdown-item-color-l': 'var(--bulma-hero-color-l)',
        },
      ]);
    });

    it('draws a bold hero’s phone menu in the hero’s own gradient', () => {
      // Bulma's runs through the hero's text color, which the menu's items
      // are drawn in. jsdom evaluates no media query, so this reads the block.
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <Hero color="primary" className={`${prefix}is-bold`}>
            <Hero.Head>
              <Navbar aria-label="Site">
                <Navbar.Menu active />
              </Navbar>
            </Hero.Head>
          </Hero>
        </ConfigProvider>
      );
      const menu = container.querySelector(
        `.${prefix}navbar-menu`
      ) as HTMLElement;
      const mobile = rulesOf(partial).filter(
        rule =>
          rule.context.join(' ') === '@media screen and (max-width: 768px)' &&
          matches(menu, rule.selector)
      );
      expect(mobile.map(rule => rule.declarations)).toEqual([
        {
          'background-image':
            'linear-gradient(141deg, ' +
            'hsl(calc(var(--bulma-hero-h) - var(--bulma-hero-gradient-h-offset)), ' +
            'calc(var(--bulma-hero-s) + var(--bulma-hero-gradient-s-offset)), ' +
            'calc(var(--bulma-hero-background-l) + var(--bulma-hero-gradient-l-offset))) 0%, ' +
            'hsl(var(--bulma-hero-h), var(--bulma-hero-s), var(--bulma-hero-background-l)) 71%, ' +
            'hsl(calc(var(--bulma-hero-h) + var(--bulma-hero-gradient-h-offset)), ' +
            'calc(var(--bulma-hero-s) - var(--bulma-hero-gradient-s-offset)), ' +
            'calc(var(--bulma-hero-background-l) - var(--bulma-hero-gradient-l-offset))) 100%)',
        },
      ]);
      // A hero that isn't bold keeps the plain background.
      const plainMenu = heroNavbar('primary').navbar.querySelector(
        `.${prefix}navbar-menu`
      ) as Element;
      expect(
        rulesOf(partial).filter(
          rule => rule.context.length && matches(plainMenu, rule.selector)
        )
      ).toEqual([]);
    });

    it('leaves a navbar in a hero with no color, or with a color of its own, to Bulma', () => {
      for (const { navbar, active } of [
        heroNavbar(),
        heroNavbar('primary', 'dark'),
      ]) {
        expect(style(active, 'background-color', partial)).toBeUndefined();
        for (const name of [
          '--bulma-navbar-burger-color',
          '--bulma-navbar-background-color',
        ]) {
          expect(customProperty(navbar, partial, name)).toBeUndefined();
        }
        expect(
          rulesOf(partial).filter(
            rule => rule.context.length && matches(navbar, rule.selector)
          )
        ).toEqual([]);
      }
    });
  });
});

// Bulma's `.is-active` and `.is-selected` set an item's `--bulma-navbar-h`,
// `-s` and `-item-color-l` to the selected ones, and its background reads them
// there, but its text reads `--bulma-navbar-item-color`, which Bulma works out
// on `.navbar`. The item inherits that worked-out value, so it drew the
// navbar's own text color on the link color (#1712). The partial works the
// variable out again on the item. jsdom resolves no `var()` and inherits no
// worked-out value, so this does: the navbar's value from the navbar's
// variables, then the item's from its own, over that.
describe('an active navbar item', () => {
  const sheets = [
    ['the partial after Bulma', '', 'bulma.css', true],
    ['the partial before Bulma', '', 'bulma.css', false],
    [
      'a prefixed build, the partial after Bulma',
      'bulma-',
      'versions/bulma-prefixed.css',
      true,
    ],
    [
      'a prefixed build, the partial before Bulma',
      'bulma-',
      'versions/bulma-prefixed.css',
      false,
    ],
  ] as const;

  /**
   * A navbar with active, selected and plain items, an active item with a
   * background helper, an active tab, and a dropdown.
   */
  const navbarOf = (prefix: string, color?: 'primary' | 'link' | 'white') => {
    const { container } = render(
      <ConfigProvider classPrefix={prefix}>
        <Navbar aria-label="Site" color={color}>
          <Navbar.Menu active>
            <Navbar.Start>
              <Navbar.Item href="#home" active>
                Home
              </Navbar.Item>
              <Navbar.Item href="#docs" className={`${prefix}is-selected`}>
                Docs
              </Navbar.Item>
              <Navbar.Item href="#plain">Plain</Navbar.Item>
              <Navbar.Item href="#filled" active bgColor="white">
                Filled
              </Navbar.Item>
              <Navbar.Item href="#tab" className={`${prefix}is-tab`} active>
                Tab
              </Navbar.Item>
              <Navbar.Dropdown active>
                <Navbar.Link className={`${prefix}is-active`}>More</Navbar.Link>
                <Navbar.DropdownMenu>
                  <Navbar.Item href="#inside" active>
                    Inside
                  </Navbar.Item>
                </Navbar.DropdownMenu>
              </Navbar.Dropdown>
            </Navbar.Start>
          </Navbar.Menu>
        </Navbar>
      </ConfigProvider>
    );
    const find = (selector: string) =>
      container.querySelector(selector) as HTMLElement;
    return {
      navbar: find(`.${prefix}navbar`),
      home: find('[href="#home"]'),
      docs: find('[href="#docs"]'),
      plain: find('[href="#plain"]'),
      filled: find('[href="#filled"]'),
      tab: find('[href="#tab"]'),
      link: find(`.${prefix}navbar-link`),
      inside: find('[href="#inside"]'),
    };
  };

  // Each Bulma sheet's top-level rules, parsed once.
  const parsed = new Map<string, CSSStyleRule[]>();
  const bulmaRules = (file: string) => {
    if (!parsed.has(file)) parsed.set(file, styleRulesOf(bulmaCss(file)).rules);
    return parsed.get(file) as CSSStyleRule[];
  };

  const flat = (value: string) => value.replace(/\s+/g, ' ');
  // jsdom drops the spaces in a custom property's value.
  const bare = (value: string | undefined) => value?.replace(/\s+/g, '');

  /**
   * The text and the background of `item`, an active or selected link item, in
   * `scheme`, from Bulma's sheet `bulmaFile` and the sheet `css` that links
   * it. The item's own variables come from the rules of Bulma's that match it.
   */
  function drawn(
    css: string,
    bulmaFile: string,
    prefix: string,
    navbar: Element,
    item: Element,
    scheme: 'light' | 'dark'
  ) {
    const rules = bulmaRules(bulmaFile);
    const navbarSelectors = new Set(
      Array.from(navbar.classList, name => `.${prefix}navbar.${name}`).concat(
        `.${prefix}navbar`
      )
    );
    const onNavbar: Vars = {
      ...schemesOf(rules)[scheme],
      ...varsOn(rules, s => navbarSelectors.has(s)),
    };
    const onItem: Vars = {
      ...onNavbar,
      // Inherited as the navbar worked it out.
      '--bulma-navbar-item-color': substitute(
        onNavbar['--bulma-navbar-item-color'],
        onNavbar
      ),
      ...varsOn(rules, s => matches(item, s)),
    };
    const own = customProperty(item, css, '--bulma-navbar-item-color');
    if (own) onItem['--bulma-navbar-item-color'] = own;
    return {
      text: substitute('var(--bulma-navbar-item-color)', onItem),
      // Bulma's background at rest, its delta 0% and its alpha 1 on an
      // active item, which the pinned formula below holds it to.
      background: substitute(
        'hsl(var(--bulma-navbar-h), var(--bulma-navbar-s), var(--bulma-navbar-item-background-l))',
        onItem
      ),
    };
  }

  it('draws on Bulma’s formulas for an item’s text and background', () => {
    const css = flat(bulmaCss());
    expect(css).toContain(
      '.navbar-item, .navbar-link { color: var(--bulma-navbar-item-color);'
    );
    expect(css).toContain(
      'a.navbar-item, .navbar-link { background-color: hsla(var(--bulma-navbar-h), var(--bulma-navbar-s), calc(var(--bulma-navbar-item-background-l) + var(--bulma-navbar-item-background-l-delta)), var(--bulma-navbar-item-background-a));'
    );
    expect(css).toContain('--bulma-navbar-item-background-l-delta: 0%;');
    const { rules } = styleRulesOf(bulmaCss());
    expect(varsOn(rules, 'a.navbar-item.is-active')).toMatchObject({
      '--bulma-navbar-item-background-a': '1',
      '--bulma-navbar-item-color-l':
        'var(--bulma-navbar-item-selected-color-l)',
    });
    expect(bare(varsOn(rules, '.navbar')['--bulma-navbar-item-color'])).toBe(
      bare(ITEM_COLOR)
    );
  });

  describe.each(sheets)('with %s', (_order, prefix, bulmaFile, after) => {
    const partial = compile(prefix);
    const css = after
      ? bulmaCss(bulmaFile) + partial
      : partial + bulmaCss(bulmaFile);

    it('works the text color out again on an active or selected item and link', () => {
      const { home, docs, link, inside } = navbarOf(prefix);
      for (const el of [home, docs, link, inside]) {
        expect(bare(customProperty(el, css, '--bulma-navbar-item-color'))).toBe(
          bare(ITEM_COLOR)
        );
      }
    });

    it('leaves an item that isn’t active, or whose fill a bgColor replaces, to inherit the navbar’s', () => {
      // The helper's `!important` background replaces Bulma's selected fill,
      // and the navbar's own text reads on it as it did.
      const { plain, filled } = navbarOf(prefix);
      expect(filled).toHaveClass(`${prefix}has-background-white`);
      for (const el of [plain, filled]) {
        expect(
          customProperty(el, css, '--bulma-navbar-item-color')
        ).toBeUndefined();
      }
    });

    it.each(['light', 'dark'] as const)(
      'draws an active or selected item’s and link’s text at 4.5:1 or better on the link color, on the %s scheme',
      scheme => {
        const { navbar, home, docs, link } = navbarOf(prefix);
        for (const item of [home, docs, link]) {
          const { text, background } = drawn(
            css,
            bulmaFile,
            prefix,
            navbar,
            item,
            scheme
          );
          expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
        }
      }
    );

    it('leaves an active tab’s text to Bulma’s tab color, the link color', () => {
      // The tab is an active link item too, so the variable is set on it, but
      // Bulma's tab rule sets its `color` from a variable of its own.
      const { navbar, tab } = navbarOf(prefix);
      expect(
        cascade(
          tab,
          css,
          ['color'],
          (declared, name) => declared.getPropertyValue(name) || undefined
        )
      ).toBe('var(--bulma-navbar-tab-active-color)');
      expect(
        varsOn(bulmaRules(bulmaFile), s => matches(navbar, s))[
          '--bulma-navbar-tab-active-color'
        ]
      ).toBe('var(--bulma-link)');
    });

    it('still lets a value an app sets on an item win, wherever it loads', () => {
      const { home } = navbarOf(prefix);
      const app = `.${prefix}navbar-item.${prefix}is-active { --bulma-navbar-item-color: red; }`;
      for (const sheet of [css + app, app + css]) {
        expect(customProperty(home, sheet, '--bulma-navbar-item-color')).toBe(
          'red'
        );
      }
    });

    it.each(['primary', 'link', 'white'] as const)(
      'leaves the active item in a %s navbar as Bulma draws it',
      color => {
        // A colored navbar's selected color is its own invert, which its
        // items already inherit, so the text comes out the same.
        const { navbar, home } = navbarOf(prefix, color);
        for (const scheme of ['light', 'dark'] as const) {
          expect(drawn(css, bulmaFile, prefix, navbar, home, scheme).text).toBe(
            drawn(bulmaCss(bulmaFile), bulmaFile, prefix, navbar, home, scheme)
              .text
          );
        }
      }
    );
  });

  it('reads under 4.5:1 with Bulma alone, which is the bug', () => {
    const { navbar, home } = navbarOf('');
    for (const scheme of ['light', 'dark'] as const) {
      const { text, background } = drawn(
        bulmaCss(),
        'bulma.css',
        '',
        navbar,
        home,
        scheme
      );
      expect(contrast(text, background)).toBeLessThan(4.5);
    }
  });

  it('draws an active item inside a dropdown the same way, without a prefix', () => {
    // In the prefixed build Bulma's rule for a dropdown's rows names
    // `.is-active` and `.is-selected` without the prefix in its `:not()`, so
    // it draws an active row as a plain one, in the dropdown's own colors.
    const { navbar, inside } = navbarOf('');
    const css = bulmaCss() + compile();
    for (const scheme of ['light', 'dark'] as const) {
      const { text, background } = drawn(
        css,
        'bulma.css',
        '',
        navbar,
        inside,
        scheme
      );
      expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

// Bulma's rule for a dropdown's rows names `.is-active` and `.is-selected`
// without the class prefix in its `:not()`, so in a prefixed build it matches
// an active row too and draws it as a plain one (#1805). The partial gives an
// active link row back the fill and the text the unprefixed build gives it.
// These resolve the row's text and fill in each build, as a large and a small
// screen see the sheets, and compare them.
describe('an active dropdown row in a prefixed build', () => {
  /**
   * `css` as a screen `width` pixels wide sees it: each `@media screen and`
   * block of widths it falls in is unwrapped, and each other one dropped,
   * Bulma's `, print` form included. Other at-rules stay as they are.
   */
  function atWidth(css: string, width: number): string {
    const head =
      /@media screen and ((?:\((?:min|max)-width: \d+px\)(?: and )?)+)(?:, print)?\s*\{/g;
    let out = '';
    let from = 0;
    for (let m = head.exec(css); m; m = head.exec(css)) {
      out += css.slice(from, m.index);
      let close = head.lastIndex;
      for (let depth = 1; depth > 0; close++) {
        if (css[close] === '{') depth++;
        else if (css[close] === '}') depth--;
      }
      const fits = Array.from(
        m[1].matchAll(/\((min|max)-width: (\d+)px\)/g)
      ).every(([, side, px]) =>
        side === 'min' ? width >= Number(px) : width <= Number(px)
      );
      if (fits) out += atWidth(css.slice(head.lastIndex, close - 1), width);
      from = close;
      head.lastIndex = close;
    }
    return out + css.slice(from);
  }

  const widthRules = new Map<string, CSSStyleRule[]>();
  /** Bulma's top-level rules as a screen `width` pixels wide sees them. */
  const bulmaAt = (file: string, width: number) => {
    const key = `${file}@${width}`;
    if (!widthRules.has(key)) {
      widthRules.set(key, styleRulesOf(atWidth(bulmaCss(file), width)).rules);
    }
    return widthRules.get(key) as CSSStyleRule[];
  };

  type Setup = { color?: 'primary'; transparent?: boolean; hero?: boolean };

  /**
   * A navbar whose open dropdown has an active link row, a selected one and a
   * filled one.
   */
  const dropdownOf = (prefix: string, setup: Setup = {}) => {
    const navbar = (
      <Navbar
        aria-label="Site"
        color={setup.color}
        transparent={setup.transparent}
      >
        <Navbar.Menu active>
          <Navbar.Start>
            <Navbar.Dropdown active>
              <Navbar.Link>More</Navbar.Link>
              <Navbar.DropdownMenu>
                <Navbar.Item href="#row" active>
                  Row
                </Navbar.Item>
                <Navbar.Item
                  href="#selected"
                  className={`${prefix}is-selected`}
                >
                  Selected
                </Navbar.Item>
                <Navbar.Item href="#filled" active bgColor="white">
                  Filled
                </Navbar.Item>
              </Navbar.DropdownMenu>
            </Navbar.Dropdown>
          </Navbar.Start>
        </Navbar.Menu>
      </Navbar>
    );
    const { container } = render(
      <ConfigProvider classPrefix={prefix}>
        {setup.hero ? (
          <Hero color="primary">
            <Hero.Head>{navbar}</Hero.Head>
          </Hero>
        ) : (
          navbar
        )}
      </ConfigProvider>
    );
    const find = (selector: string) =>
      container.querySelector(selector) as HTMLElement;
    return {
      navbar: find(`.${prefix}navbar`),
      row: find('[href="#row"]'),
      selected: find('[href="#selected"]'),
      filled: find('[href="#filled"]'),
    };
  };

  /**
   * The row's text and fill, with every variable worked out, as the sheet
   * `css` over Bulma's sheet `bulmaFile` draws them in `scheme` on a screen
   * `width` pixels wide. The variables come from Bulma's sheet, and the one
   * the partial declares that the row reads, `--bulma-navbar-item-color`,
   * through the cascade.
   */
  function drawnRow(
    css: string,
    bulmaFile: string,
    navbar: Element,
    row: Element,
    scheme: 'light' | 'dark',
    width: number
  ) {
    const sheet = atWidth(css, width);
    const rules = bulmaAt(bulmaFile, width);
    /** The variables Bulma declares on `from`'s ancestors down to `to`. */
    const down = (from: Element | null, to: Element): Vars => {
      const chain: Element[] = [];
      for (
        let el: Element | null = to;
        el && el !== from;
        el = el.parentElement
      )
        chain.unshift(el);
      return Object.assign(
        {},
        ...chain.map(el => varsOn(rules, s => matches(el, s)))
      );
    };
    const onNavbar: Vars = {
      ...schemesOf(rules)[scheme],
      ...down(null, navbar),
    };
    const onRow: Vars = {
      ...onNavbar,
      // Inherited as the navbar worked it out.
      '--bulma-navbar-item-color': substitute(
        onNavbar['--bulma-navbar-item-color'],
        onNavbar
      ),
      ...down(navbar, row),
    };
    const own = customProperty(row, sheet, '--bulma-navbar-item-color');
    if (own) onRow['--bulma-navbar-item-color'] = own;
    const declared = (property: string) =>
      cascade(
        row,
        sheet,
        [property],
        (style, name) => style.getPropertyValue(name) || undefined
      ) as string;
    return {
      text: substitute(declared('color'), onRow),
      fill: substitute(declared('background-color'), onRow),
    };
  }

  it('restates Bulma’s own fill and text for a link item', () => {
    const css = bulmaCss('versions/bulma-prefixed.css').replace(/\s+/g, ' ');
    expect(css).toContain(
      '.bulma-navbar-dropdown .bulma-navbar-item:not(.is-active, .is-selected) {'
    );
    const partial = rulesOf(compile('bulma-'));
    const row = partial[partial.length - 1];
    expect(css).toContain(
      `a.bulma-navbar-item, .bulma-navbar-link { background-color: ${row.declarations['background-color']};`
    );
    expect(css).toContain(
      `.bulma-navbar-item, .bulma-navbar-link { color: ${row.declarations.color};`
    );
  });

  it('adds nothing to a build without a prefix', () => {
    // The rule's own text, which nothing else in the partial sets.
    expect(
      rulesOf(compile()).filter(
        rule => rule.declarations.color === 'var(--bulma-navbar-item-color)'
      )
    ).toEqual([]);
    expect(
      rulesOf(compile('bulma-')).filter(
        rule => rule.declarations.color === 'var(--bulma-navbar-item-color)'
      )
    ).toHaveLength(1);
  });

  describe.each([
    ['the partial after Bulma', true],
    ['the partial before Bulma', false],
  ])('with %s', (_order, after) => {
    const link = (bulma: string, partial: string) =>
      after ? bulma + partial : partial + bulma;
    const unprefixed = link(bulmaCss(), compile());
    const prefixed = link(
      bulmaCss('versions/bulma-prefixed.css'),
      compile('bulma-')
    );

    /** Whether `pick`'s row draws the same in both builds, everywhere. */
    const sameInBoth = (
      setup: Setup,
      pick: (rows: ReturnType<typeof dropdownOf>) => HTMLElement,
      focus = false
    ) => {
      const plain = dropdownOf('', setup);
      const withPrefix = dropdownOf('bulma-', setup);
      for (const width of [1280, 800]) {
        for (const scheme of ['light', 'dark'] as const) {
          if (focus) pick(plain).focus();
          const want = drawnRow(
            unprefixed,
            'bulma.css',
            plain.navbar,
            pick(plain),
            scheme,
            width
          );
          if (focus) pick(withPrefix).focus();
          const got = drawnRow(
            prefixed,
            'versions/bulma-prefixed.css',
            withPrefix.navbar,
            pick(withPrefix),
            scheme,
            width
          );
          // The same color measures 1:1 against itself.
          expect(contrast(got.text, want.text)).toBeCloseTo(1, 6);
          expect(contrast(got.fill, want.fill)).toBeCloseTo(1, 6);
        }
      }
    };

    it.each([
      ['a navbar with no color', {}],
      ['a primary navbar', { color: 'primary' }],
      ['a transparent navbar', { transparent: true }],
      ['a navbar in a primary hero', { hero: true }],
    ] as [string, Setup][])(
      'draws the active row in %s as the unprefixed build does',
      (_label, setup) => sameInBoth(setup, rows => rows.row)
    );

    it('draws a focused active row as the unprefixed build does', () => {
      sameInBoth({}, rows => rows.row, true);
    });

    it.each([
      ['a navbar with no color', {}],
      ['a primary navbar', { color: 'primary' }],
    ] as [string, Setup][])(
      'draws a selected row in %s as the unprefixed build does',
      (_label, setup) => sameInBoth(setup, rows => rows.selected)
    );

    it.each([
      ['a navbar with no color', {}],
      ['a primary navbar', { color: 'primary' }],
    ] as [string, Setup][])(
      'draws an active row with a bgColor in %s as the unprefixed build does',
      (_label, setup) => sameInBoth(setup, rows => rows.filled)
    );
  });

  it('draws the active row as a plain one with Bulma’s prefixed CSS alone, which is the bug', () => {
    const plain = dropdownOf('');
    const withPrefix = dropdownOf('bulma-');
    const want = drawnRow(
      bulmaCss() + compile(),
      'bulma.css',
      plain.navbar,
      plain.row,
      'light',
      1280
    );
    const got = drawnRow(
      bulmaCss('versions/bulma-prefixed.css'),
      'versions/bulma-prefixed.css',
      withPrefix.navbar,
      withPrefix.row,
      'light',
      1280
    );
    expect(contrast(got.fill, want.fill)).toBeGreaterThan(1.5);
  });
});
