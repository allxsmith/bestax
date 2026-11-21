// A star the value only partly fills draws its filled part from
// `.rate-star-fill`. It took the item's own color before, the empty star's
// gray, so 3.5 stars showed as 3 and a gray half. Right to left it fills from
// its right. These read the partial's rules, with no prefix and under one,
// the way RingProgress's are read.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Rate } from '../Rate';
import { ConfigProvider } from '../../helpers/Config';
import { cascade, compilePartial, rulesOf } from '../../__tests__/css-cascade';

describe.each([
  ['no prefix', ''],
  ['a prefix', 'bestax-'],
])('Rate’s partly filled star with %s', (_name, prefix) => {
  const p = (name: string) => `.${prefix}${name}`;
  const { rules, nested } = rulesOf(compilePartial('form/rate', prefix));
  /** The declaration of `property` in a rule whose list has `selector`. */
  const declared = (selector: string, property: string) =>
    rules
      .filter(rule =>
        rule.selectorText
          .split(/,(?![^(]*\))/)
          .map(part => part.trim())
          .includes(selector)
      )
      .map(rule => rule.style.getPropertyValue(property))
      .find(Boolean);
  const fill = p('rate-star-fill');

  it('fills its filled part in the active color, as a filled star', () => {
    expect(declared(fill, 'fill')).toBe('var(--bulma-rate-color-active)');
  });

  it('fades its fill as the star’s color fades, unless motion is reduced', () => {
    expect(declared(fill, 'transition')).toBe(
      'fill var(--bulma-rate-transition-duration) ease'
    );
    const still = nested.find(
      ({ rule, within }) =>
        within === '@media (prefers-reduced-motion: reduce)' &&
        rule.selectorText.split(/,\s*/).includes(fill)
    )?.rule;
    expect(still?.style.getPropertyValue('transition')).toBe('none');
  });

  it('fills it in the hover color while the pointer would fill it', () => {
    for (const state of [':hover', p('is-hovered')]) {
      expect(declared(`${p('rate-item')}${state} ${fill}`, 'fill')).toBe(
        'var(--bulma-rate-color-hover)'
      );
    }
  });

  // Right to left, a half star fills from its right, beside the filled
  // stars, where the pointer reads its fraction from (#1825).
  it('mirrors the built-in half star right to left, so it fills from its right', () => {
    expect(declared(`${p('rate-star-partial')}:dir(rtl)`, 'transform')).toBe(
      'scaleX(-1)'
    );
  });

  it('sets a font icon’s filled layer at its inline start, its right right to left', () => {
    expect(declared(p('rate-icon-fg'), 'inset-inline-start')).toMatch(
      /^0(px)?$/
    );
    expect(declared(p('rate-icon-fg'), 'left')).toBeUndefined();
  });

  it('fills it in the highlight color in forced colors, as a filled star', () => {
    const rule = nested.find(
      ({ rule, within }) =>
        within === '@media (forced-colors: active)' &&
        rule.selectorText === `${p('rate')} ${fill}`
    )?.rule;
    // jsdom lowercases a system color's name.
    expect(rule?.style.getPropertyValue('fill')).toBe('highlight');
    expect(rule?.style.getPropertyPriority('fill')).toBe('important');
  });

  // An `iconName` star a value only partly fills is two copies of the icon.
  // Forced colors repainted both in the text color, so it drew as an empty
  // star (#1967).
  it('draws a half-filled icon’s filled part in the highlight color in forced colors', () => {
    const forced = (selector: string) =>
      nested.find(
        ({ rule, within }) =>
          within === '@media (forced-colors: active)' &&
          rule.selectorText === selector
      )?.rule;
    // The filled part takes a filled star's color. It outranks the layer's
    // own color, a rule of one class, and the back layer keeps the star's.
    const fg = forced(`${p('rate')} ${p('rate-icon-fg')}`)?.style;
    expect(fg?.getPropertyValue('color')).toBe('highlight');
    expect(fg?.getPropertyPriority('color')).toBe('important');
    expect(declared(p('rate-icon-fg'), 'color')).toBe(
      'var(--bulma-rate-color-active)'
    );
    expect(forced(`${p('rate')} ${p('rate-icon-bg')}`)).toBeUndefined();
  });

  // A disabled Rate drew at half strength in forced colors, where GrayText
  // already says it's disabled (#1996).
  it('draws a disabled Rate at full strength in forced colors, its filled parts in the text color', () => {
    const forced = (selector: string) =>
      nested.find(
        ({ rule, within }) =>
          within === '@media (forced-colors: active)' &&
          rule.selectorText
            .split(/,(?![^(]*\))/)
            .map(s => s.trim())
            .includes(selector)
      )?.rule;
    const disabled = `${p('rate')}${p('is-disabled')}`;
    expect(declared(disabled, 'opacity')).toBe(
      'var(--bulma-rate-disabled-opacity)'
    );
    expect(forced(disabled)?.style.getPropertyValue('opacity')).toBe('1');
    for (const part of [
      p('rate-item'),
      p('rate-icon-bg'),
      p('rate-score'),
      p('rate-text'),
      p('rate-custom-text'),
    ]) {
      expect(
        forced(`${disabled} ${part}`)?.style.getPropertyValue('color')
      ).toBe('graytext');
    }
    // The filled parts take the text color, not the highlight, so it doesn't
    // draw as an enabled Rate, and an icon's filled stars still differ from
    // its empty ones.
    for (const part of [
      `${p('rate-item')}${p('is-active')}`,
      p('rate-icon-fg'),
    ]) {
      expect(
        forced(`${disabled} ${part}`)?.style.getPropertyValue('color')
      ).toBe('canvastext');
    }
    const fill = forced(`${disabled} ${p('rate-star-fill')}`)?.style;
    expect(fill?.getPropertyValue('fill')).toBe('canvastext');
    expect(fill?.getPropertyPriority('fill')).toBe('important');
  });

  // An `iconName` half star kept the active color in its filled part while
  // the pointer previewed a value, beside full stars in the hover color
  // (#2012). These render the real Rate and resolve the winning color with
  // the shared cascade, on a page in forced colors and on one that isn't.
  describe('an iconName half star’s filled part', () => {
    const css = compilePartial('form/rate', prefix);
    // jsdom puts no element under the pointer, so `:hover` reads as a class
    // the test sets, which ranks as `:hover` does.
    const POINTER = 'test-pointer';
    const hovered = css.split(':hover').join(`.${POINTER}`);
    const colorOf = (el: Element, sheet: string, forcedColors: boolean) =>
      cascade(
        el,
        sheet,
        ['color'],
        (style, property) => style.getPropertyValue(property) || undefined,
        { forcedColors }
      );
    const renderRate = (props: React.ComponentProps<typeof Rate>) =>
      render(
        <ConfigProvider classPrefix={prefix}>
          <Rate
            iconName="star"
            iconLibrary="fa"
            iconVariant="solid"
            precision={0.5}
            {...props}
          />
        </ConfigProvider>
      ).container;

    it('takes the hover color while the pointer previews a value, and the highlight in forced colors', () => {
      const container = renderRate({ defaultValue: 0 });
      const stars = screen.getAllByRole('radio');
      stars.forEach((star, index) => {
        star.getBoundingClientRect = () =>
          ({ left: index * 20, width: 20 }) as DOMRect;
      });
      // The left half of the third star.
      fireEvent.mouseEnter(stars[2]);
      fireEvent.mouseMove(stars[2], { clientX: 45 });
      expect(stars[2]).toHaveClass(`${prefix}is-hovered`);
      const fg = container.querySelector(p('rate-icon-fg'))!;
      expect(stars[2]).toContainElement(fg as HTMLElement);
      expect(colorOf(fg, css, false)).toBe('var(--bulma-rate-color-hover)');
      expect(colorOf(fg, css, true)).toBe('highlight');
    });

    it('takes the hover color under the pointer, and the highlight in forced colors', () => {
      const fg = renderRate({ defaultValue: 2.5 }).querySelector(
        p('rate-icon-fg')
      )!;
      fg.closest(p('rate-item'))!.classList.add(POINTER);
      expect(colorOf(fg, hovered, false)).toBe('var(--bulma-rate-color-hover)');
      expect(colorOf(fg, hovered, true)).toBe('highlight');
    });

    it('keeps the active color at rest, and the highlight in forced colors', () => {
      const fg = renderRate({ defaultValue: 2.5 }).querySelector(
        p('rate-icon-fg')
      )!;
      expect(colorOf(fg, css, false)).toBe('var(--bulma-rate-color-active)');
      expect(colorOf(fg, css, true)).toBe('highlight');
    });

    it('keeps the text color while disabled in forced colors', () => {
      const fg = renderRate({
        defaultValue: 2.5,
        disabled: true,
      }).querySelector(p('rate-icon-fg'))!;
      expect(colorOf(fg, css, true)).toBe('canvastext');
    });

    it('fades its color as the star’s fades, unless motion is reduced', () => {
      expect(declared(p('rate-icon-fg'), 'transition')).toBe(
        'color var(--bulma-rate-transition-duration) ease'
      );
      const still = nested.find(
        ({ rule, within }) =>
          within === '@media (prefers-reduced-motion: reduce)' &&
          rule.selectorText.split(/,\s*/).includes(p('rate-icon-fg'))
      )?.rule;
      expect(still?.style.getPropertyValue('transition')).toBe('none');
    });
  });
});
