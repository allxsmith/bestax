// With `animation="fade"` the track holds still, and the stylesheet's
// `is-fade` rules keep the items in view on it and take the rest off it,
// faded out, so the shown slide stays in view (#2368). jsdom resolves no
// cascade, so this renders the component and resolves each value with the
// shared cascade, with Bulma's CSS before the partial and after it, with no
// class prefix and under one.
import { render, fireEvent, screen } from '@testing-library/react';
import { Carousel, CarouselItem } from '../Carousel';
import { ConfigProvider } from '../../helpers/Config';
import { bulmaCss, cascade, compilePartial } from '../../__tests__/css-cascade';

const declared = (style: CSSStyleDeclaration, property: string) =>
  style.getPropertyValue(property).replace(/\s+/g, ' ').trim() || undefined;

describe.each([
  ['no prefix', '', 'bulma.css'],
  ['a class prefix', 'bulma-', 'versions/bulma-prefixed.css'],
])('A fading Carousel, with %s', (_name, prefix, bulmaFile) => {
  const partial = compilePartial('components/carousel', prefix);
  const bulma = bulmaCss(bulmaFile);
  const p = (name: string) => `.${prefix}${name}`;

  describe.each([
    ['Bulma first', bulma + partial],
    ['the partial first', partial + bulma],
  ])('with %s', (_order, css) => {
    const valueOf = (el: Element, property: string) =>
      cascade(el, css, [property], declared, { forcedColors: false });

    it('keeps the slide shown on the still track, and the rest off it, faded out', () => {
      render(
        <ConfigProvider classPrefix={prefix}>
          <Carousel animation="fade">
            <CarouselItem>One</CarouselItem>
            <CarouselItem>Two</CarouselItem>
            <CarouselItem>Three</CarouselItem>
          </Carousel>
        </ConfigProvider>
      );
      const slides = document.querySelector<HTMLElement>(p('carousel-slides'))!;
      const shown = () =>
        slides.querySelector(
          `:scope > ${p('carousel-item')}${p('is-active')}`
        )!;
      const others = () =>
        slides.querySelectorAll(
          `:scope > ${p('carousel-item')}:not(${p('is-active')})`
        );

      for (const step of [0, 1]) {
        if (step) fireEvent.click(screen.getByLabelText('Next slide'));
        expect(shown()).toHaveTextContent(step ? 'Two' : 'One');
        expect(slides.style.transform).toBe('');
        expect(valueOf(slides, 'position')).toBe('relative');
        expect(valueOf(shown(), 'position')).toBe('relative');
        expect(valueOf(shown(), 'opacity')).toBe('1');
        for (const item of others()) {
          expect(valueOf(item, 'position')).toBe('absolute');
          expect(valueOf(item, 'opacity')).toBe('0');
        }
      }
    });
  });
});
