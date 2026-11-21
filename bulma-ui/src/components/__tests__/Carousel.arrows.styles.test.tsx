// A focused arrow shows a focus indicator in every option: a transparent
// arrow, which has no border, no fill and no shadow, draws Bulma's focus
// outline, as a ghost Button does, and with `arrowHover` an arrow shows while
// keyboard focus is on it. jsdom puts no element in a state, so each sheet is
// read as it applies to a focused element, with `:focus-visible` and `:focus`
// taken out of it, and the value that wins is resolved with the shared
// cascade, with Bulma's CSS before the partial and after it, with no class
// prefix and under one.
import React from 'react';
import { render } from '@testing-library/react';
import { Carousel, CarouselItem } from '../Carousel';
import { ConfigProvider } from '../../helpers/Config';
import { bulmaCss, cascade, compilePartial } from '../../__tests__/css-cascade';

/** `css` as it applies to a focused element, which jsdom can't put one in. */
const focused = (css: string) =>
  css.replace(/:focus-visible/g, '').replace(/:focus(?![\w-])/g, '');

/** `css` as it applies to an element under the pointer. */
const hovered = (css: string) => css.split(':hover').join('');

const declared = (style: CSSStyleDeclaration, property: string) =>
  style.getPropertyValue(property).replace(/\s+/g, ' ').trim() || undefined;

const valueOf = (el: Element, css: string, ...properties: string[]) =>
  cascade(el, css, properties, declared);

/** Bulma's focus outline, as a ghost Button draws it. */
const OUTLINE = {
  'outline-color':
    'hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l))',
  'outline-offset': 'var(--bulma-focus-offset)',
  'outline-style': 'var(--bulma-focus-style)',
  'outline-width': 'var(--bulma-focus-width)',
};

/** The outline `el` gets from `css`, longhand by longhand. */
const outlineOf = (el: Element, css: string) =>
  Object.fromEntries(
    Object.keys(OUTLINE).map(longhand => [
      longhand,
      valueOf(el, css, longhand, 'outline'),
    ])
  );

const TRANSPARENT: [string, React.ComponentProps<typeof Carousel>][] = [
  ['plain', { arrowBackground: false }],
  ['in the overlay look', { arrowBackground: false, overlayControls: true }],
];

describe.each([
  ['no prefix', '', 'bulma.css'],
  ['a class prefix', 'bulma-', 'versions/bulma-prefixed.css'],
])('Carousel arrows with %s', (_name, prefix, bulmaFile) => {
  const partial = compilePartial('components/carousel', prefix);
  const bulma = bulmaCss(bulmaFile);
  const orders: [string, string][] = [
    ['Bulma first', bulma + partial],
    ['the partial first', partial + bulma],
  ];

  /** An arrow, Next unless `side` says, of a carousel rendered with `props`. */
  const nextArrow = (
    props: React.ComponentProps<typeof Carousel>,
    side: 'next' | 'prev' = 'next'
  ) => {
    const { container } = render(
      <ConfigProvider classPrefix={prefix}>
        <Carousel {...props}>
          <CarouselItem>One</CarouselItem>
          <CarouselItem>Two</CarouselItem>
          <CarouselItem>Three</CarouselItem>
        </Carousel>
      </ConfigProvider>
    );
    return container.querySelector(
      `.${prefix}carousel-arrow.${prefix}is-${side}`
    )!;
  };

  describe.each(orders)('with %s', (_order, css) => {
    /**
     * `css` as it applies with the pointer over `elements`. jsdom puts none
     * under it, so `:hover` reads as a class set on them, which ranks as
     * `:hover` does.
     */
    const pointerOn = (...elements: Element[]) => {
      elements.forEach(el => el.classList.add('test-pointer'));
      return css.split(':hover').join('.test-pointer');
    };

    it.each(TRANSPARENT)(
      "gives a focused transparent arrow Bulma's focus outline, %s, and nothing new at rest",
      (_look, props) => {
        const arrow = nextArrow(props);
        expect(outlineOf(arrow, focused(css))).toEqual(OUTLINE);
        // Under the pointer too.
        expect(outlineOf(arrow, hovered(focused(css)))).toEqual(OUTLINE);
        // No shadow, at rest or focused, as before, and none of the outline
        // at rest.
        expect(valueOf(arrow, css, 'box-shadow')).toBe('none');
        expect(valueOf(arrow, focused(css), 'box-shadow')).toBe('none');
        const atRest = outlineOf(arrow, css);
        for (const [longhand, value] of Object.entries(OUTLINE)) {
          expect(atRest[longhand]).not.toBe(value);
        }
      }
    );

    it('hides arrowHover arrows at rest and shows the one keyboard focus is on', () => {
      for (const props of [
        { arrowHover: true },
        { arrowHover: true, arrowBackground: false, overlayControls: true },
      ]) {
        const arrow = nextArrow(props);
        expect(valueOf(arrow, css, 'opacity')).toBe('0');
        expect(valueOf(arrow, focused(css), 'opacity')).toBe('1');
      }
    });

    it('draws a disabled arrow at full strength in GrayText in forced colors, and faded elsewhere', () => {
      // On the first slide, not looping, there's nothing before it.
      const prev = nextArrow({ repeat: false }, 'prev');
      expect(prev).toBeDisabled();
      const opacity = (forcedColors: boolean) =>
        cascade(prev, css, ['opacity'], declared, { forcedColors });
      expect(opacity(false)).toBe(
        'var(--bulma-carousel-arrow-disabled-opacity)'
      );
      // GrayText marks it there, which the opacity would only fade (#2049),
      // over Bulma's own disabled button's.
      expect(opacity(true)).toBe('1');
      expect(
        cascade(prev, css, ['color'], declared, { forcedColors: true })
      ).toBe('graytext');
    });

    // A disabled arrowHover arrow showed faded at rest, where the others
    // hide, and unfaded under the pointer, like an enabled one (#2145).
    it('hides a disabled arrowHover arrow at rest and shows it disabled under the pointer', () => {
      const prev = nextArrow({ repeat: false, arrowHover: true }, 'prev');
      expect(prev).toBeDisabled();
      const carousel = prev.closest(`.${prefix}carousel`)!;
      const next = carousel.querySelector(
        `.${prefix}carousel-arrow.${prefix}is-next`
      )!;
      const value = (
        el: Element,
        sheet: string,
        property: string,
        forcedColors: boolean
      ) => cascade(el, sheet, [property], declared, { forcedColors });
      for (const forcedColors of [false, true]) {
        expect(value(prev, css, 'opacity', forcedColors)).toBe('0');
      }
      // The pointer over the carousel, then over the disabled arrow itself.
      for (const pointed of [[], [prev]]) {
        const sheet = pointerOn(carousel, ...pointed);
        expect(value(prev, sheet, 'opacity', false)).toBe(
          'var(--bulma-carousel-arrow-disabled-opacity)'
        );
        // GrayText marks it in forced colors, at full strength, as without
        // arrowHover (#2049).
        expect(value(prev, sheet, 'opacity', true)).toBe('1');
        expect(value(prev, sheet, 'color', true)).toBe('graytext');
        // The arrow that works shows as before.
        expect(value(next, sheet, 'opacity', false)).toBe('1');
      }
    });

    it("leaves an arrow with its background Bulma's focus shadow", () => {
      expect(valueOf(nextArrow({}), focused(css), 'box-shadow')).toMatch(
        /^var\(--bulma-focus-shadow-size\) hsla\(/
      );
    });
  });

  it.each(TRANSPARENT)(
    'draws the outline from the partial alone, %s, so forced colors shows it whatever else loads',
    (_look, props) => {
      expect(outlineOf(nextArrow(props), focused(partial))).toEqual(OUTLINE);
    }
  );
});

describe.each([
  ['no prefix', '', 'bulma.css'],
  ['a class prefix', 'bulma-', 'versions/bulma-prefixed.css'],
])(
  'the Carousel partial under reduced motion, with %s',
  (_name, p, bulmaFile) => {
    const REDUCED = '@media (prefers-reduced-motion: reduce)';
    /**
     * `css` with the reduced-motion block's rules in its place when the
     * preference `holds`, and without them when it doesn't, as a browser
     * applies the block, since the shared cascade walks no `@media`.
     */
    const reduced = (css: string, holds: boolean) => {
      const start = css.indexOf(REDUCED);
      expect(start).toBeGreaterThanOrEqual(0);
      const open = css.indexOf('{', start);
      let depth = 1;
      let end = open + 1;
      for (; depth > 0 && end < css.length; end++) {
        if (css[end] === '{') depth++;
        else if (css[end] === '}') depth--;
      }
      expect(depth).toBe(0);
      return (
        css.slice(0, start) +
        (holds ? css.slice(open + 1, end - 1) : '') +
        css.slice(end)
      );
    };

    const partial = compilePartial('components/carousel', p);
    const bulma = bulmaCss(bulmaFile);

    it.each([
      ['Bulma first', (css: string) => bulma + css],
      ['the partial first', (css: string) => css + bulma],
    ])(
      'takes the transition off the arrows, the indicators and a fading slide, with %s',
      (_order, withBulma) => {
        const { container } = render(
          <ConfigProvider classPrefix={p}>
            <Carousel className={`${p}is-fade`}>
              <CarouselItem>One</CarouselItem>
              <CarouselItem>Two</CarouselItem>
            </Carousel>
          </ConfigProvider>
        );
        for (const part of [
          'carousel-arrow',
          'indicator-item',
          'carousel-item',
        ]) {
          const el = container.querySelector(`.${p}${part}`)!;
          const transition = (holds: boolean) =>
            valueOf(
              el,
              withBulma(reduced(partial, holds)),
              'transition',
              'transition-property'
            );
          expect(transition(false)).toMatch(/var\(--/);
          expect(transition(true)).toBe('none');
        }
      }
    );
  }
);
