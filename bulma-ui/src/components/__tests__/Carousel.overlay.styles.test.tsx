// What `indicatorInside`, `overlayControls` and `indicatorPosition` look like
// rests on the cascade in `_carousel.scss`: which rule's band, padding and
// colors win on the elements the component renders. jsdom resolves no
// cascade, so this compiles the partial, renders the component, and picks
// the winning declaration itself: the matching rule of highest specificity,
// the later one on a tie. `:where()` counts for nothing, as in a browser.
import React from 'react';
import { render } from '@testing-library/react';
import * as sass from 'sass';
import path from 'path';
import { Carousel, CarouselItem } from '../Carousel';

const SCSS = path.resolve(__dirname, '../../scss');
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const css = sass.compileString(`@use 'components/carousel';`, {
  loadPaths: [SCSS, path.dirname(BULMA)],
  quietDeps: true,
  logger: sass.Logger.silent,
}).css;

/** Splits a selector list at its top-level commas. */
const splitSelectors = (list: string): string[] => {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '(') depth++;
    else if (list[i] === ')') depth--;
    else if (list[i] === ',' && depth === 0) {
      out.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(list.slice(start).trim());
  return out;
};

/**
 * The (id, class) part of a selector's specificity, which is all these
 * rules differ in: `:where()` adds nothing, and `:not()` adds its argument.
 */
const specificity = (selector: string): number => {
  const s = selector
    .replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '')
    .replace(/:not\(/g, '(');
  const ids = (s.match(/#[\w-]+/g) ?? []).length;
  const classes = (s.match(/\.[\w-]+|\[[^\]]*\]|(?<!:):(?!:)[\w-]+/g) ?? [])
    .length;
  return ids * 1000 + classes;
};

type Rule = { selectors: string[]; style: CSSStyleDeclaration };

/** The top-level style rules of a stylesheet, in source order. */
function rulesOf(...sheets: string[]): Rule[] {
  return sheets.flatMap(text => {
    const style = document.createElement('style');
    style.textContent = text;
    document.head.appendChild(style);
    const rules = Array.from(style.sheet!.cssRules)
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
      .map(rule => ({
        selectors: splitSelectors(rule.selectorText),
        style: rule.style,
      }));
    style.remove();
    return rules;
  });
}

/** What `property` comes to on `el`, reading `shorthand` too when given. */
function resolve(
  el: Element,
  rules: Rule[],
  property: string,
  shorthand?: string
): string | undefined {
  let best: { rank: number; value: string } | undefined;
  for (const { selectors, style } of rules) {
    const matching = selectors.filter(s => el.matches(s));
    if (!matching.length) continue;
    const rank = Math.max(...matching.map(specificity));
    let value = style.getPropertyValue(property).trim();
    if (!value && shorthand) {
      // `padding: 1rem` and `padding: 1rem 2rem` both start with the top
      value = style.getPropertyValue(shorthand).trim().split(/\s+/)[0] ?? '';
    }
    if (value && (!best || rank >= best.rank)) best = { rank, value };
  }
  return best?.value;
}

const renderCarousel = (props: React.ComponentProps<typeof Carousel> = {}) =>
  render(
    <Carousel {...props}>
      <CarouselItem>Slide 1</CarouselItem>
      <CarouselItem>Slide 2</CarouselItem>
    </Carousel>
  ).container;

const indicatorOf = (container: HTMLElement) =>
  container.querySelector('.carousel-indicator')!;

const BAND_DOWN = /^linear-gradient\(transparent,/;
const BAND_UP = /^linear-gradient\(hsla\(.*\), transparent\)$/;

describe('Carousel overlay stylesheet', () => {
  const rules = rulesOf(css);

  it('puts indicatorInside alone over the slides on the band, as before', () => {
    const indicator = indicatorOf(renderCarousel({ indicatorInside: true }));
    expect(resolve(indicator, rules, 'position')).toBe('absolute');
    expect(resolve(indicator, rules, 'background')).toMatch(BAND_DOWN);
    expect(resolve(indicator, rules, 'padding-bottom', 'padding')).toBe(
      '1.5rem'
    );
  });

  it('runs the band from the top edge with indicatorPosition top', () => {
    const indicator = indicatorOf(
      renderCarousel({ indicatorInside: true, indicatorPosition: 'top' })
    );
    expect(resolve(indicator, rules, 'top')).toBe('0');
    expect(resolve(indicator, rules, 'bottom')).toBe('auto');
    expect(resolve(indicator, rules, 'background')).toMatch(BAND_UP);
    expect(resolve(indicator, rules, 'padding-top', 'padding')).toBe('1.5rem');
  });

  it('keeps the indicators over the slides without the band when overlayControls is false', () => {
    for (const indicatorPosition of ['bottom', 'top'] as const) {
      const indicator = indicatorOf(
        renderCarousel({
          indicatorInside: true,
          indicatorPosition,
          overlayControls: false,
        })
      );
      expect(resolve(indicator, rules, 'position')).toBe('absolute');
      expect(resolve(indicator, rules, 'background')).toBeUndefined();
    }
  });

  it('adds no band or padding to top indicators below the slides', () => {
    const indicator = indicatorOf(renderCarousel({ indicatorPosition: 'top' }));
    expect(resolve(indicator, rules, 'background')).toBeUndefined();
    expect(resolve(indicator, rules, 'top')).toBeUndefined();
    expect(resolve(indicator, rules, 'padding-top', 'padding')).toBe('1rem');
  });

  it('leaves indicators below the slides plain when overlayControls is set alone', () => {
    const container = renderCarousel({ overlayControls: true });
    const indicator = indicatorOf(container);
    expect(resolve(indicator, rules, 'background')).toBeUndefined();
    expect(
      resolve(
        indicator.querySelector('.indicator-item:not(.is-active)')!,
        rules,
        'background-color'
      )
    ).toBe('var(--bulma-carousel-indicator-background)');
    expect(
      resolve(container.querySelector('.carousel-arrow')!, rules, 'color')
    ).toBe('var(--bulma-carousel-overlay-arrow-color)');
  });

  it('colors the arrows plainly, and from arrowColor, when overlayControls is false', () => {
    const container = renderCarousel({
      indicatorInside: true,
      overlayControls: false,
      arrowColor: 'dark',
    });
    expect(
      resolve(container.querySelector('.carousel-arrow')!, rules, 'color')
    ).toBe('var(--bulma-text-strong)');
    expect(
      resolve(
        container.querySelector('.indicator-item:not(.is-active)')!,
        rules,
        'background-color'
      )
    ).toBe('var(--bulma-carousel-indicator-background)');
  });

  it("lets a page's own rule still take the band off", () => {
    // A rule at the band's old specificity, loaded after the library, as the
    // Tropico template's is
    const page = rulesOf(
      css,
      '.my-carousel .carousel-indicator.is-inside { background: none; }'
    );
    const indicator = indicatorOf(
      renderCarousel({ indicatorInside: true, className: 'my-carousel' })
    );
    expect(resolve(indicator, page, 'background')).toBe('none');
  });

  it('keeps the overlay arrows and indicators light in either scheme', () => {
    // `scheme-main` is white in Bulma's light theme and dark in its dark one,
    // so a foreground built on it lands dark on the dark band in dark mode
    const root = rules.find(r => r.selectors.includes('.carousel'))!.style;
    for (const name of [
      'overlay-arrow-color',
      'overlay-indicator-background',
      'overlay-indicator-background-hover',
      'overlay-indicator-background-active',
    ]) {
      const value = root.getPropertyValue(`--bulma-carousel-${name}`);
      expect(value).toMatch(/--bulma-white/);
      expect(value).not.toMatch(/scheme-main/);
    }
  });
});
