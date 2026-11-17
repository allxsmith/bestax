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

  /** The Next arrow of a carousel rendered with `props`. */
  const nextArrow = (props: React.ComponentProps<typeof Carousel>) => {
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
      `.${prefix}carousel-arrow.${prefix}is-next`
    )!;
  };

  describe.each(orders)('with %s', (_order, css) => {
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
