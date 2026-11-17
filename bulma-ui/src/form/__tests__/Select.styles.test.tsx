// Bulma shows a focused select with a border in the focus color and a ring
// drawn as a box-shadow, and turns the outline off. Forced colors drops the
// shadow, so `_select.scss` draws Bulma's focus outline on a keyboard-focused
// select there (#2017). These resolve its rules beside Bulma's own select
// rules, in either order, the way a browser would. jsdom matches no
// `:focus-visible`, so the `is-focused` state the same rule selects stands in
// for focus.
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
