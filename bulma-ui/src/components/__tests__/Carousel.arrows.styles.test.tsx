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
import {
  atMedia,
  bulmaCss,
  cascade,
  compilePartial,
} from '../../__tests__/css-cascade';

/** `css` as it applies to a focused element, which jsdom can't put one in. */
const focused = (css: string) =>
  css.replace(/:focus-visible/g, '').replace(/:focus(?![\w-])/g, '');

/** `css` as it applies to an element under the pointer. */
const hovered = (css: string) => css.split(':hover').join('');

/** The media query Bulma's `mobile` mixin writes, below its tablet width. */
const PHONE = '@media screen and (max-width: 768px)';

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
    side: 'next' | 'prev' | 'rotation' = 'next'
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
     * Runs `check` on `css` as it applies with `elements` in `state`. jsdom
     * puts no element in a state, so while `check` runs the pseudo-class
     * reads as a class set on them, which ranks as the pseudo-class does.
     */
    const inState = (
      state: ':hover' | ':focus-visible',
      elements: Element[],
      check: (sheet: string) => void
    ) => {
      const stand = `test-${state.slice(1)}`;
      elements.forEach(el => el.classList.add(stand));
      try {
        check(css.split(state).join(`.${stand}`));
      } finally {
        elements.forEach(el => el.classList.remove(stand));
      }
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
      // Disabled as it renders, with the attribute and `is-disabled`, then
      // with the class alone.
      for (const attribute of [true, false]) {
        if (!attribute) prev.removeAttribute('disabled');
        expect(prev).toHaveClass(`${prefix}is-disabled`);
        for (const forcedColors of [false, true]) {
          expect(value(prev, css, 'opacity', forcedColors)).toBe('0');
        }
        // It keeps GrayText while it fades out as the pointer leaves.
        expect(value(prev, css, 'color', true)).toBe('graytext');
        // The pointer over the carousel, then over the disabled arrow, which
        // puts it over the carousel too.
        for (const pointed of [[carousel], [carousel, prev]]) {
          inState(':hover', pointed, sheet => {
            expect(value(prev, sheet, 'opacity', false)).toBe(
              'var(--bulma-carousel-arrow-disabled-opacity)'
            );
            // GrayText marks it in forced colors, at full strength, as
            // without arrowHover (#2049).
            expect(value(prev, sheet, 'opacity', true)).toBe('1');
            expect(value(prev, sheet, 'color', true)).toBe('graytext');
            // The arrow that works shows as before.
            expect(value(next, sheet, 'opacity', false)).toBe('1');
          });
        }
      }
      // Marked by the class alone it can take focus, and shows while it has
      // it, as any arrowHover arrow does.
      expect(prev).not.toHaveAttribute('disabled');
      inState(':focus-visible', [prev], sheet => {
        expect(value(prev, sheet, 'opacity', false)).toBe('1');
      });
    });

    // The button that stops autoplay (#1925) is drawn as the arrows are, at
    // the top center of the slides.
    it('keeps the rotation button in view with arrowHover, where the arrows hide', () => {
      const props = { autoplay: true, rotationControl: true, arrowHover: true };
      expect(valueOf(nextArrow(props, 'rotation'), css, 'opacity')).toBe('1');
      expect(valueOf(nextArrow(props), css, 'opacity')).toBe('0');
    });

    it('draws the rotation button as an arrow, at the top center of the slides', () => {
      const rotation = nextArrow(
        { autoplay: true, rotationControl: true },
        'rotation'
      );
      expect(rotation).not.toHaveClass(`${prefix}is-bottom`);
      expect(valueOf(rotation, css, 'background-color')).toBe(
        'var(--bulma-carousel-arrow-background)'
      );
      // Its translate centers it across, and takes back the arrows'
      // centering on `top`, so `top` is its top edge.
      expect(valueOf(rotation, css, 'left')).toBe('50%');
      expect(valueOf(rotation, css, 'transform')).toBe('translateY(-50%)');
      expect(valueOf(rotation, css, 'translate')).toBe('-50% 50%');
      for (const side of ['inset-inline-start', 'inset-inline-end', 'right']) {
        expect(valueOf(rotation, css, side)).toBeUndefined();
      }
      // A phone width moves it in, as it does the arrows, in a media query
      // the shared cascade doesn't walk, so these read what's declared.
      for (const [phone, offset] of [
        [false, 'var(--bulma-carousel-arrow-offset)'],
        [true, 'var(--bulma-carousel-arrow-offset-mobile)'],
      ] as const) {
        const sheet = atMedia(css, PHONE, phone);
        expect(valueOf(rotation, sheet, 'top')).toBe(offset);
        expect(valueOf(rotation, sheet, 'bottom')).toBeUndefined();
      }
    });

    it('moves the rotation button to the bottom center while the indicators sit over the slides at the top', () => {
      const rotation = nextArrow(
        {
          autoplay: true,
          rotationControl: true,
          indicatorInside: true,
          indicatorPosition: 'top',
        },
        'rotation'
      );
      expect(rotation).toHaveClass(`${prefix}is-bottom`);
      // The values that win, on a wider screen and on a phone.
      for (const [phone, offset] of [
        [false, 'var(--bulma-carousel-arrow-offset)'],
        [true, 'var(--bulma-carousel-arrow-offset-mobile)'],
      ] as const) {
        const sheet = atMedia(css, PHONE, phone);
        expect(valueOf(rotation, sheet, 'top')).toBe('auto');
        expect(valueOf(rotation, sheet, 'bottom')).toBe(offset);
      }
      // Over the slides at the bottom, the indicators leave the top free.
      expect(
        nextArrow(
          { autoplay: true, rotationControl: true, indicatorInside: true },
          'rotation'
        )
      ).not.toHaveClass(`${prefix}is-bottom`);
    });

    it("leaves an arrow with its background Bulma's focus shadow", () => {
      expect(valueOf(nextArrow({}), focused(css), 'box-shadow')).toMatch(
        /^var\(--bulma-focus-shadow-size\) hsla\(/
      );
    });

    // A carousel in another one's item took the outer one's arrowHover,
    // arrowColor and overlay look, and its forced-colors disabled arrow
    // (#2278).
    describe('in an item of another carousel', () => {
      type Props = React.ComponentProps<typeof Carousel>;

      /**
       * A carousel rendered with `outerProps`, holding one rendered with
       * `innerProps` in its first item, and the Next or Previous arrow, or
       * the rotation button, of each.
       */
      const nested = (outerProps: Props, innerProps: Props) => {
        const { container } = render(
          <ConfigProvider classPrefix={prefix}>
            <Carousel {...outerProps}>
              <CarouselItem>
                <Carousel {...innerProps}>
                  <CarouselItem>One</CarouselItem>
                  <CarouselItem>Two</CarouselItem>
                  <CarouselItem>Three</CarouselItem>
                </Carousel>
              </CarouselItem>
              <CarouselItem>Two</CarouselItem>
              <CarouselItem>Three</CarouselItem>
            </Carousel>
          </ConfigProvider>
        );
        const outer = container.querySelector(`.${prefix}carousel`)!;
        const inner = outer.querySelector(`.${prefix}carousel`)!;
        const arrowOf = (
          carousel: Element,
          side: 'next' | 'prev' | 'rotation'
        ) =>
          carousel.querySelector(
            `:scope > .${prefix}carousel-container > .${prefix}carousel-arrow.${prefix}is-${side}`
          )!;
        return { outer, inner, arrowOf };
      };

      const PLAIN_COLOR = 'var(--bulma-carousel-arrow-color)';
      const LIGHT = 'var(--bulma-scheme-main)';
      const DARK = 'var(--bulma-text-strong)';

      it.each([
        ['arrowColor light', { arrowColor: 'light' }, {}, LIGHT, PLAIN_COLOR],
        ['arrowColor dark', { arrowColor: 'dark' }, {}, DARK, PLAIN_COLOR],
        [
          'arrowColor dark around arrowColor light',
          { arrowColor: 'dark' },
          { arrowColor: 'light' },
          DARK,
          LIGHT,
        ],
        [
          'the overlay look',
          { overlayControls: true },
          {},
          'var(--bulma-carousel-overlay-arrow-color)',
          PLAIN_COLOR,
        ],
        [
          'the overlay look around transparent arrows',
          { overlayControls: true },
          { arrowBackground: false },
          'var(--bulma-carousel-overlay-arrow-color)',
          PLAIN_COLOR,
        ],
      ] as [string, Props, Props, string, string][])(
        'colors each carousel’s arrows from its own props, with %s',
        (_case, outerProps, innerProps, outerColor, innerColor) => {
          const { outer, inner, arrowOf } = nested(outerProps, innerProps);
          expect(valueOf(arrowOf(outer, 'next'), css, 'color')).toBe(
            outerColor
          );
          expect(valueOf(arrowOf(inner, 'next'), css, 'color')).toBe(
            innerColor
          );
        }
      );

      it('fills the inner arrows and rotation button plainly in an outer carousel with the overlay look', () => {
        const { inner, arrowOf } = nested(
          { overlayControls: true },
          { autoplay: true, rotationControl: true }
        );
        for (const side of ['next', 'rotation'] as const) {
          const arrow = arrowOf(inner, side);
          expect(valueOf(arrow, css, 'background-color')).toBe(
            'var(--bulma-carousel-arrow-background)'
          );
          inState(':hover', [arrow], sheet => {
            expect(valueOf(arrow, sheet, 'background-color')).toBe(
              'var(--bulma-carousel-arrow-background-hover)'
            );
          });
        }
      });

      it('shows the inner arrows at rest in an outer carousel with arrowHover', () => {
        const { outer, inner, arrowOf } = nested({ arrowHover: true }, {});
        expect(valueOf(arrowOf(outer, 'next'), css, 'opacity')).toBe('0');
        expect(valueOf(arrowOf(inner, 'next'), css, 'opacity')).toBe('1');
      });

      it('keeps an inner arrowHover carousel’s rotation button in view, and a focused arrow', () => {
        const { inner, arrowOf } = nested(
          { arrowHover: true },
          { arrowHover: true, autoplay: true, rotationControl: true }
        );
        const next = arrowOf(inner, 'next');
        expect(valueOf(next, css, 'opacity')).toBe('0');
        expect(valueOf(arrowOf(inner, 'rotation'), css, 'opacity')).toBe('1');
        inState(':focus-visible', [next], sheet => {
          expect(valueOf(next, sheet, 'opacity')).toBe('1');
        });
      });

      it('shows inner arrowHover arrows only under the pointer on the inner carousel', () => {
        const { outer, inner, arrowOf } = nested(
          { arrowHover: true },
          { arrowHover: true, repeat: false }
        );
        const next = arrowOf(inner, 'next');
        const prev = arrowOf(inner, 'prev');
        expect(prev).toBeDisabled();
        const value = (
          el: Element,
          sheet: string,
          property: string,
          forcedColors: boolean
        ) => cascade(el, sheet, [property], declared, { forcedColors });
        // Over the outer carousel alone, its arrows show and the inner
        // ones stay hidden, the disabled one in forced colors too.
        inState(':hover', [outer], sheet => {
          expect(value(arrowOf(outer, 'next'), sheet, 'opacity', false)).toBe(
            '1'
          );
          expect(value(next, sheet, 'opacity', false)).toBe('0');
          for (const forcedColors of [false, true]) {
            expect(value(prev, sheet, 'opacity', forcedColors)).toBe('0');
          }
        });
        // Over the inner one, which puts it over the outer one too.
        inState(':hover', [outer, inner], sheet => {
          expect(value(next, sheet, 'opacity', false)).toBe('1');
          expect(value(prev, sheet, 'opacity', false)).toBe(
            'var(--bulma-carousel-arrow-disabled-opacity)'
          );
          expect(value(prev, sheet, 'opacity', true)).toBe('1');
        });
      });

      it('hides a disabled inner arrowHover arrow at rest in forced colors, in a plain carousel', () => {
        const { inner, arrowOf } = nested(
          {},
          { arrowHover: true, repeat: false }
        );
        const prev = arrowOf(inner, 'prev');
        expect(prev).toBeDisabled();
        for (const forcedColors of [false, true]) {
          expect(
            cascade(prev, css, ['opacity'], declared, { forcedColors })
          ).toBe('0');
        }
        expect(
          cascade(prev, css, ['color'], declared, { forcedColors: true })
        ).toBe('graytext');
      });
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
