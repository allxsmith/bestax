// A star the value only partly fills draws its filled part from
// `.rate-star-fill`. It took the item's own color before, the empty star's
// gray, so 3.5 stars showed as 3 and a gray half. Right to left it fills from
// its right. These read the partial's rules, with no prefix and under one,
// the way RingProgress's are read.
import { compilePartial, rulesOf } from '../../__tests__/css-cascade';

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
        rule.selectorText === fill
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
});
