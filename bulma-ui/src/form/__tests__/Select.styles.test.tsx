// Bulma shows a focused select with a border in the focus color and a ring
// drawn as a box-shadow, and turns the outline off. Forced colors drops the
// shadow, so `_select.scss` draws Bulma's focus outline on a keyboard-focused
// select there (#2017). These resolve its rules beside Bulma's own select
// rules, in either order, the way a browser would. jsdom matches no
// `:focus-visible`, so the `is-focused` state the same rule selects stands in
// for focus.
//
// It also draws a disabled select's arrow, which is the wrapper's `::after`,
// in GrayText at full strength in forced colors (#2163). jsdom matches no
// pseudo-element, so these resolve the arrow's rules on the wrapper, with
// `::after` taken out of the sheet, which leaves every rule on the arrow and
// none on the wrapper that sets its border color or opacity.
import React from 'react';
import { render } from '@testing-library/react';
import { SelectBase } from '../SelectBase';
import { ConfigProvider } from '../../helpers/Config';
import {
  cascade,
  compilePartial,
  compileSource,
} from '../../__tests__/css-cascade';

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the Select partial with %s', (_label, prefix) => {
  const partial = compilePartial('form/select', prefix);
  const bulma = compileSource(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'bulma/sass/form/select';`
  );

  const selectOf = (isFocused: boolean) =>
    render(
      <ConfigProvider classPrefix={prefix}>
        <SelectBase isFocused={isFocused} aria-label="Country">
          <option>United States</option>
        </SelectBase>
      </ConfigProvider>
    ).container.querySelector('select') as HTMLSelectElement;

  /** What wins for `property`, among the outline's longhands and shorthand. */
  const outline = (
    el: Element,
    css: string,
    property: string,
    forcedColors: boolean
  ) =>
    cascade(
      el,
      css,
      // Bulma turns the outline off with the shorthand, so each longhand
      // competes with it.
      ['outline', property],
      (style, p) => style.getPropertyValue(p) || undefined,
      { forcedColors }
    );

  it.each([
    ['Bulma first', () => bulma + partial],
    ['the partial first', () => partial + bulma],
  ])('outlines a focused select in forced colors, with %s', (_order, sheet) => {
    const css = sheet();
    const focused = selectOf(true);
    expect(outline(focused, css, 'outline-style', true)).toBe(
      'var(--bulma-focus-style)'
    );
    expect(outline(focused, css, 'outline-width', true)).toBe(
      'var(--bulma-focus-width)'
    );
    expect(outline(focused, css, 'outline-offset', true)).toBe(
      'var(--bulma-focus-offset)'
    );
    expect(outline(focused, css, 'outline-color', true)).toBe(
      'hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l))'
    );
  });

  it('leaves the select as Bulma draws it outside forced colors, and at rest', () => {
    const css = bulma + partial;
    expect(outline(selectOf(true), css, 'outline-style', false)).toBe('none');
    expect(outline(selectOf(false), css, 'outline-style', true)).toBe('none');
  });

  /** The sheet with each `::after` taken off, so its rules match the wrapper. */
  const onArrow = (css: string) => css.replace(/::?after\b/g, '');
  const arrow = (
    wrapper: Element,
    css: string,
    property: string,
    forcedColors: boolean
  ) =>
    cascade(
      wrapper,
      onArrow(css),
      [property],
      (style, p) => style.getPropertyValue(p) || undefined,
      { forcedColors }
    );

  const wrapperOf = (ui: React.ReactElement) =>
    render(
      <ConfigProvider classPrefix={prefix}>{ui}</ConfigProvider>
    ).container.querySelector(`.${prefix}select`) as HTMLElement;

  describe.each([
    ['Bulma first', () => bulma + partial],
    ['the partial first', () => partial + bulma],
  ])('with %s', (_order, sheet) => {
    // Bulma fades only its is-disabled arrow, so a Select's has no opacity
    // to undo.
    it.each<[string, () => React.ReactElement, string | undefined]>([
      [
        'a disabled Select',
        () => (
          <SelectBase disabled aria-label="Country">
            <option>United States</option>
          </SelectBase>
        ),
        undefined,
      ],
      [
        'a Select in a disabled fieldset',
        () => (
          <fieldset disabled>
            <SelectBase aria-label="Country">
              <option>United States</option>
            </SelectBase>
          </fieldset>
        ),
        undefined,
      ],
      [
        "Bulma's is-disabled",
        () => (
          <div className={`${prefix}select ${prefix}is-disabled`}>
            <select disabled aria-label="Country">
              <option>United States</option>
            </select>
          </div>
        ),
        '1',
      ],
      [
        // The is-disabled rule on its own, with no disabled select for the
        // :has() rule to find.
        'is-disabled around an enabled select',
        () => (
          <div className={`${prefix}select ${prefix}is-disabled`}>
            <select aria-label="Country">
              <option>United States</option>
            </select>
          </div>
        ),
        '1',
      ],
    ])(
      "draws %s's arrow in GrayText at full strength in forced colors",
      (_case, ui, opacity) => {
        const css = sheet();
        const wrapper = wrapperOf(ui());
        expect(arrow(wrapper, css, 'border-color', true)?.toLowerCase()).toBe(
          'graytext'
        );
        expect(arrow(wrapper, css, 'opacity', true)).toBe(opacity);
      }
    );

    it("leaves Bulma's arrow outside forced colors, an enabled one's, and a loading one's spinner", () => {
      const css = sheet();
      const dimmed = wrapperOf(
        <div className={`${prefix}select ${prefix}is-disabled`}>
          <select disabled aria-label="Country">
            <option>United States</option>
          </select>
        </div>
      );
      expect(arrow(dimmed, css, 'opacity', false)).toBe('0.5');
      expect(arrow(dimmed, css, 'border-color', false)).toBe(
        'var(--bulma-text-weak)'
      );
      const enabled = wrapperOf(
        <SelectBase aria-label="Country">
          <option>United States</option>
        </SelectBase>
      );
      // The partial sets nothing on an enabled one's arrow, nor on a loading
      // one's spinner, which `_loader.scss` draws.
      expect(arrow(enabled, partial, 'border-color', true)).toBeUndefined();
      expect(arrow(enabled, partial, 'opacity', true)).toBeUndefined();
      const loading = wrapperOf(
        <SelectBase disabled isLoading aria-label="Country">
          <option>United States</option>
        </SelectBase>
      );
      expect(loading).toHaveClass(`${prefix}is-loading`);
      expect(arrow(loading, partial, 'border-color', true)).toBeUndefined();
      expect(arrow(loading, partial, 'opacity', true)).toBeUndefined();
      // Bulma's is-disabled one only loses Bulma's fade.
      const dimmedLoading = wrapperOf(
        <div
          className={`${prefix}select ${prefix}is-disabled ${prefix}is-loading`}
        >
          <select disabled aria-label="Country">
            <option>United States</option>
          </select>
        </div>
      );
      expect(
        arrow(dimmedLoading, partial, 'border-color', true)
      ).toBeUndefined();
      expect(arrow(dimmedLoading, css, 'opacity', true)).toBe('1');
      expect(arrow(dimmedLoading, css, 'opacity', false)).toBe('0.5');
    });
  });

  it('selects :focus-visible, and the is-focused state', () => {
    expect(partial).toMatch(
      new RegExp(
        `\\.${prefix}select\\.${prefix}select\\s+select\\.${prefix}is-focused`
      )
    );
    expect(partial).toMatch(
      new RegExp(`\\.${prefix}select\\.${prefix}select select:focus-visible`)
    );
  });
});
