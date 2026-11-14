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
import { ConfigProvider } from '../../helpers/Config';

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
    'keeps the burger in forced colors and a fixed navbar’s lock margins at no weight, with %s, naming only prefixed classes',
    (_label, prefix) => {
      const rules = rulesOf(compile(prefix));
      expect(rules.map(rule => [rule.selector, rule.context])).toEqual([
        [`.${prefix}navbar-burger.${prefix}navbar-burger span`, [FORCED]],
        [
          `:where(.${prefix}navbar.${prefix}is-fixed-top, .${prefix}navbar.${prefix}is-fixed-bottom)`,
          [],
        ],
      ]);
      expect(rules[0].declarations).toEqual({
        'forced-color-adjust': 'none',
        'background-color': 'ButtonText',
      });
      expect(rules[1].declarations).toEqual(LOCK_MARGINS);
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
