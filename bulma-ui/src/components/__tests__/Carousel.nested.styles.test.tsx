// A carousel in another one's item took the outer one's indicator style, its
// overlay look and its `is-fade` class, since those rules reached the
// indicators and the items through descendant selectors (#2335), as the arrow
// rules did (#2278, in Carousel.arrows.styles.test.tsx). jsdom resolves no
// cascade, so this renders the nested markup and resolves each value with the
// shared cascade, with Bulma's CSS before the partial and after it, with no
// class prefix and under one, at the phone width too where a rule has a copy
// there.
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

type Props = React.ComponentProps<typeof Carousel>;

/** The media query Bulma's `mobile` mixin writes, below its tablet width. */
const PHONE = '@media screen and (max-width: 768px)';
const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)';

const declared = (style: CSSStyleDeclaration, property: string) =>
  style.getPropertyValue(property).replace(/\s+/g, ' ').trim() || undefined;

/** One of the carousel's own variables. */
const v = (name: string) => `var(--bulma-carousel-${name})`;

/** The resting ring every indicator draws, unless a rule takes it away. */
const RING = `${v('indicator-border-width')} solid ${v('indicator-border-color')}`;

describe.each([
  ['no prefix', '', 'bulma.css'],
  ['a class prefix', 'bulma-', 'versions/bulma-prefixed.css'],
])(
  'A Carousel in another Carousel’s item, with %s',
  (_name, prefix, bulmaFile) => {
    const partial = compilePartial('components/carousel', prefix);
    const bulma = bulmaCss(bulmaFile);
    const p = (name: string) => `.${prefix}${name}`;

    /**
     * A carousel rendered with `outerProps`, holding one rendered with
     * `innerProps` in its first item.
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
      const outer = container.querySelector(p('carousel'))!;
      const inner = outer.querySelector(p('carousel'))!;
      return { outer, inner };
    };

    /** The indicator row of `carousel`, a resting indicator and the current one. */
    const indicatorsOf = (carousel: Element) => {
      const row = carousel.querySelector(
        `:scope > ${p('carousel-indicator')}`
      )!;
      return {
        row,
        resting: row.querySelector(
          `:scope > ${p('indicator-item')}:not(${p('is-active')})`
        )!,
        current: row.querySelector(
          `:scope > ${p('indicator-item')}${p('is-active')}`
        )!,
      };
    };

    /** The track of `carousel`, an item out of view and the one in view. */
    const itemsOf = (carousel: Element) => {
      const slides = carousel.querySelector(
        `:scope > ${p('carousel-container')} > ${p('carousel-slides')}`
      )!;
      return {
        slides,
        resting: slides.querySelector(
          `:scope > ${p('carousel-item')}:not(${p('is-active')})`
        )!,
        current: slides.querySelector(
          `:scope > ${p('carousel-item')}${p('is-active')}`
        )!,
      };
    };

    describe.each([
      ['Bulma first', bulma + partial],
      ['the partial first', partial + bulma],
    ])('with %s', (_order, css) => {
      /** What `property`, or a shorthand of it, comes to on `el` in `sheet`. */
      const valueOf = (el: Element, sheet: string, ...properties: string[]) =>
        cascade(el, sheet, properties, declared, { forcedColors: false });
      const wide = atMedia(css, PHONE, false);
      const narrow = atMedia(css, PHONE, true);
      /** `css` at the phone width when `phone`, and wider when not. */
      const atWidth = (phone: boolean) => (phone ? narrow : wide);

      it.each([
        ['circles', 'indicator-circle-size', 'indicator-circle-size'],
        ['lines', 'indicator-line-width', 'indicator-line-width-mobile'],
        ['bars', 'indicator-bar-width', 'indicator-bar-width-mobile'],
      ] as const)(
        'draws a plain inner carousel’s dots as dots in one with %s, at either width',
        (style, wide, phoneWide) => {
          const { outer, inner } = nested({ indicatorStyle: style }, {});
          for (const phone of [false, true]) {
            const sheet = atWidth(phone);
            expect(valueOf(indicatorsOf(outer).resting, sheet, 'width')).toBe(
              v(phone ? phoneWide : wide)
            );
            expect(valueOf(indicatorsOf(inner).resting, sheet, 'width')).toBe(
              v(phone ? 'indicator-size-mobile' : 'indicator-size')
            );
          }
        }
      );

      it('fills a plain inner carousel’s dots, and leaves its current one ringless, in one with circles', () => {
        const { outer, inner } = nested({ indicatorStyle: 'circles' }, {});
        const sheet = atWidth(false);
        expect(
          valueOf(indicatorsOf(outer).resting, sheet, 'background-color')
        ).toBe('transparent');
        expect(
          valueOf(indicatorsOf(inner).resting, sheet, 'background-color')
        ).toBe(v('indicator-background'));
        expect(
          valueOf(indicatorsOf(outer).current, sheet, 'border-color', 'border')
        ).toBe(v('indicator-background-active'));
        expect(
          valueOf(indicatorsOf(inner).current, sheet, 'border-color', 'border')
        ).toBe('transparent');
      });

      it.each(['lines', 'bars'] as const)(
        'spaces a wrapped row of a plain inner carousel by its gap alone in one with %s, at either width',
        style => {
          const { outer, inner } = nested({ indicatorStyle: style }, {});
          for (const phone of [false, true]) {
            const sheet = atWidth(phone);
            expect(valueOf(indicatorsOf(outer).row, sheet, 'row-gap')).toMatch(
              /^max\(/
            );
            expect(
              valueOf(indicatorsOf(inner).row, sheet, 'row-gap')
            ).toBeUndefined();
          }
        }
      );

      it('keeps the ring on an inner carousel’s resting circles over its slides, in one with dots in the overlay look', () => {
        const { outer, inner } = nested(
          { indicatorInside: true },
          { indicatorInside: true, indicatorStyle: 'circles' }
        );
        const sheet = atWidth(false);
        expect(
          valueOf(indicatorsOf(outer).resting, sheet, 'border-color', 'border')
        ).toBe('transparent');
        expect(
          valueOf(indicatorsOf(inner).resting, sheet, 'border-color', 'border')
        ).toBe(RING);
      });

      it.each(['bottom', 'top'] as const)(
        'leaves an inner carousel’s indicators over its slides at the %s plain, band and all, in one with the overlay look',
        indicatorPosition => {
          const { outer, inner } = nested(
            { indicatorInside: true, indicatorPosition },
            { indicatorInside: true, indicatorPosition, overlayControls: false }
          );
          const sheet = atWidth(false);
          const own = indicatorsOf(outer);
          const theirs = indicatorsOf(inner);
          expect(valueOf(own.row, sheet, 'background')).toMatch(
            /^linear-gradient\(/
          );
          expect(valueOf(theirs.row, sheet, 'background')).toBeUndefined();
          expect(valueOf(own.resting, sheet, 'background-color')).toBe(
            v('overlay-indicator-background')
          );
          expect(valueOf(theirs.resting, sheet, 'background-color')).toBe(
            v('indicator-background')
          );
          expect(valueOf(own.current, sheet, 'background-color')).toBe(
            v('overlay-indicator-background-active')
          );
          expect(valueOf(theirs.current, sheet, 'background-color')).toBe(
            v('indicator-background-active')
          );
        }
      );

      it('keeps a plain inner carousel’s items on its track in one with is-fade', () => {
        const { outer, inner } = nested({ className: `${prefix}is-fade` }, {});
        const sheet = atWidth(false);
        const own = itemsOf(outer);
        const theirs = itemsOf(inner);
        expect(valueOf(own.slides, sheet, 'position')).toBe('relative');
        expect(valueOf(theirs.slides, sheet, 'position')).toBeUndefined();
        expect(valueOf(own.resting, sheet, 'position')).toBe('absolute');
        expect(valueOf(own.resting, sheet, 'opacity')).toBe('0');
        expect(valueOf(own.current, sheet, 'position')).toBe('relative');
        for (const item of [theirs.resting, theirs.current]) {
          expect(valueOf(item, sheet, 'position')).toBeUndefined();
          expect(valueOf(item, sheet, 'opacity')).toBeUndefined();
        }
        // With reduced motion, only the fading carousel's items stop moving.
        const reduced = atMedia(sheet, REDUCED_MOTION, true);
        expect(valueOf(own.resting, reduced, 'transition')).toBe('none');
        expect(valueOf(theirs.resting, reduced, 'transition')).toBeUndefined();
      });
    });
  }
);
