// Bulma's `has-text-<color>` paints text in the color's own lightness, and
// bestax's blue primary reads at about 3.2:1 on the dark scheme that way
// (#1638). helpers/_color.scss gives the helper, and the hover, focus and
// active colors Bulma gives a link or button with it, the color's on-scheme
// lightness where that's the lighter one.
//
// These resolve the helper's color across Bulma's CSS and the partial in
// either order with `css-cascade.ts`, which says how. jsdom resolves no
// `var()`, so the contrast checks read the variables bestax's own stylesheet
// declares for each scheme and resolve the color from them the way a browser
// does (`contrast.ts`).
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Paragraph } from '../../elements/Paragraph';
import { ConfigProvider } from '../Config';
import { compileSheet } from '../../__tests__/compile-scss';
import {
  bulmaCss,
  cascade,
  compilePartial,
  compileSource,
  rulesOf,
} from '../../__tests__/css-cascade';
import {
  contrast,
  schemesOf,
  substitute,
  type Vars,
} from '../../__tests__/contrast';

// The colors of Bulma's `$colors` map whose text helper the partial adjusts,
// and the fixed shades it leaves alone. It leaves `text` alone too, which
// `textColor` doesn't take, so that one is checked on a class of its own.
const ADJUSTED = ['primary', 'link', 'info', 'success', 'warning', 'danger'];
const FIXED = ['white', 'black', 'light', 'dark'];

/** Bulma's own helper: the color's lightness. */
const bulmaHelper = (color: string) =>
  `hsl(var(--bulma-${color}-h), var(--bulma-${color}-s), var(--bulma-${color}-l))`;

/** The partial's lightness: the lighter of the two. */
const lighter = (color: string) =>
  `max(var(--bulma-${color}-l), var(--bulma-${color}-on-scheme-l))`;

/** The partial's helper. */
const adjusted = (color: string) =>
  `hsl(var(--bulma-${color}-h), var(--bulma-${color}-s), ${lighter(color)})`;

/** The partial's hover or active color, from Bulma's delta for the state. */
const adjustedState = (color: string, state: 'hover' | 'active') =>
  `hsl(var(--bulma-${color}-h), var(--bulma-${color}-s), calc(${lighter(color)} + var(--bulma-${state}-color-l-delta)))`;

/** A value without its spaces, which jsdom doesn't always keep. */
const flat = (value: string | undefined) => value?.replace(/\s+/g, '');

/** The color the rules of `css` give `el`. */
const colorOf = (el: Element, css: string) =>
  flat(
    cascade(
      el,
      css,
      ['color'],
      (style, property) => style.getPropertyValue(property).trim() || undefined
    )
  );

/** The first `tag` rendered from `element`, under `prefix` when given. */
function renderOf(element: ReactElement, tag: string, prefix = '') {
  const { container } = render(
    prefix ? (
      <ConfigProvider classPrefix={prefix}>{element}</ConfigProvider>
    ) : (
      element
    )
  );
  return container.querySelector(tag) as HTMLElement;
}

/** A Paragraph with `textColor`, under `prefix` when one is given. */
const paragraphOf = (color: string, prefix = '') => {
  const el = renderOf(
    <Paragraph textColor={color as 'primary'}>Saved</Paragraph>,
    'p',
    prefix
  );
  expect(el).toHaveClass(`${prefix}has-text-${color}`);
  return el;
};

/** The stylesheets the suites read, each built once. */
const sheets = new Map<string, string>();
const sheet = (name: string, build: () => string) => {
  if (!sheets.has(name)) sheets.set(name, build());
  return sheets.get(name)!;
};

/** The partial compiled with `prefix`. */
const partial = (prefix = '') =>
  sheet(`partial ${prefix}`, () => compilePartial('helpers/color', prefix));

// Bulma's CSS can land on either side of the extras: an app linking
// extras.css can put it before or after its own Bulma.
const orders: [string, () => string][] = [
  [
    'the partial after Bulma',
    () => sheet('after', () => bulmaCss() + partial()),
  ],
  [
    'the partial before Bulma',
    () => sheet('before', () => partial() + bulmaCss()),
  ],
];

/** `css` as it applies to an element in `state`, which jsdom can't put one in. */
const inState = (css: string, state: 'hover' | 'focus-visible' | 'active') =>
  css.split(`:${state}`).join('');

describe('the text color helper', () => {
  describe.each(orders)('with %s', (_order, css) => {
    it.each(ADJUSTED)('gives has-text-%s the lighter lightness', color => {
      expect(colorOf(paragraphOf(color), css())).toBe(flat(adjusted(color)));
    });

    it.each(FIXED)('leaves has-text-%s as Bulma draws it', color => {
      expect(colorOf(paragraphOf(color), css())).toBe(flat(bulmaHelper(color)));
    });

    it("leaves has-text-text, the scheme's own text color, as Bulma draws it", () => {
      const el = renderOf(<p className="has-text-text">Saved</p>, 'p');
      expect(colorOf(el, css())).toBe(flat(bulmaHelper('text')));
    });

    it.each(['a', 'button'])(
      'gives <%s> with the helper the lighter lightness when hovered, focused and pressed',
      tag => {
        const Tag = tag as 'a';
        const el = renderOf(<Tag className="has-text-primary">Go</Tag>, tag);
        expect(colorOf(el, inState(css(), 'hover'))).toBe(
          flat(adjustedState('primary', 'hover'))
        );
        expect(colorOf(el, inState(css(), 'focus-visible'))).toBe(
          flat(adjustedState('primary', 'hover'))
        );
        expect(colorOf(el, inState(css(), 'active'))).toBe(
          flat(adjustedState('primary', 'active'))
        );
      }
    );
  });

  it("adjusts a custom color in Bulma's map when built from Sass", () => {
    const css = compileSource(
      `@use 'bulma/sass/utilities/derived-variables' with (
         $custom-colors: ('brand': #6b2fa3)
       );
       @use 'helpers/color';`
    );
    const el = renderOf(<p className="has-text-brand">Saved</p>, 'p');
    expect(colorOf(el, css)).toBe(flat(adjusted('brand')));
  });

  it('keys on the prefixed class in the prefixed build', () => {
    const css = sheet(
      'prefixed',
      () => bulmaCss('versions/bulma-prefixed.css') + partial('bulma-')
    );
    expect(colorOf(paragraphOf('primary', 'bulma-'), css)).toBe(
      flat(adjusted('primary'))
    );
    expect(colorOf(paragraphOf('dark', 'bulma-'), css)).toBe(
      flat(bulmaHelper('dark'))
    );
  });
});

describe("the text color helper's contrast in bestax.css", () => {
  let css = '';
  let schemes: Record<string, Vars>;

  // A hook keeps Vitest's 10s default rather than `testTimeout`, and
  // sass-embedded's start can take longer than that on a loaded machine.
  beforeAll(() => {
    css = compileSheet('bestax.scss');
    schemes = schemesOf(rulesOf(css).rules);
  }, 30_000);

  /** The page's background on `scheme`. */
  const page = (scheme: string) =>
    substitute(
      'hsl(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-main-l))',
      schemes[scheme]
    );

  /** The contrast of `value`, resolved on `scheme`, on the page. */
  const onPage = (scheme: string, value: string) =>
    contrast(substitute(value, schemes[scheme]), page(scheme));

  /** The color bestax.css gives a Paragraph with `textColor`. */
  const bestax = (color: string) => {
    const value = colorOf(paragraphOf(color), css);
    if (!value) throw new Error(`bestax.css gives has-text-${color} no color`);
    return value;
  };

  it("measures Bulma's primary under 4.5:1 on the dark scheme, so the check can fail", () => {
    expect(onPage('dark', bulmaHelper('primary'))).toBeLessThan(4.5);
  });

  it.each(['primary', 'link'])(
    'holds 4.5:1 for %s on the dark scheme, at rest and hovered',
    color => {
      expect(onPage('dark', bestax(color))).toBeGreaterThanOrEqual(4.5);
      const link = renderOf(<a className={`has-text-${color}`}>Go</a>, 'a');
      const hovered = colorOf(link, inState(css, 'hover'));
      expect(hovered).toBe(flat(adjustedState(color, 'hover')));
      expect(onPage('dark', hovered!)).toBeGreaterThanOrEqual(4.5);
    }
  );

  it.each(ADJUSTED)('keeps %s as it was on the light scheme', color => {
    expect(onPage('light', bestax(color))).toBe(
      onPage('light', bulmaHelper(color))
    );
  });

  // Bulma's own info, success, warning and danger already read on the dark
  // page, so their on-scheme lightness there is their own.
  it.each(['info', 'success', 'warning', 'danger'])(
    'keeps %s as it was on the dark scheme, where it already read',
    color => {
      const before = onPage('dark', bulmaHelper(color));
      expect(before).toBeGreaterThanOrEqual(4.5);
      expect(onPage('dark', bestax(color))).toBe(before);
    }
  );
});
