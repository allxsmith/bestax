// Forced colors takes away the open dropdown's shadow and the highlighted
// option's fill, so `_autocomplete.scss` gives them an edge and an outline
// there, and nothing at rest (#2003). jsdom loads no partial on its own and
// evaluates no media query, so this compiles the partial, with no prefix and
// under one, and reads what its rules declare for the elements the
// Autocomplete renders, inside the forced-colors block and outside it.
import { fireEvent, render, screen } from '@testing-library/react';
import { Autocomplete } from '../Autocomplete';
import { ConfigProvider } from '../../helpers/Config';
import {
  cascade,
  compilePartial,
  declaredFor,
} from '../../__tests__/css-cascade';

const OUTLINE = ['outline', 'outline-offset'];
const FORCED = '@media (forced-colors: active)';

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the open dropdown in forced colors, with %s', (_n, prefix) => {
  const css = compilePartial('form/autocomplete', prefix);

  const open = (typed: string) => {
    render(
      <ConfigProvider classPrefix={prefix}>
        <Autocomplete
          label="Fruit"
          data={['Apple', 'Apricot', 'Avocado']}
          header="Fruit we have"
          empty="No fruit"
        />
      </ConfigProvider>
    );
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: typed } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    return input;
  };

  it('outlines the highlighted option, and only it', () => {
    const input = open('A');
    const [highlighted, other] = screen.getAllByRole('option');
    // The arrow put the highlight on the first option.
    expect(input).toHaveAttribute('aria-activedescendant', highlighted.id);
    expect(declaredFor(highlighted, css, OUTLINE)).toEqual({
      atRest: [],
      [FORCED]: ['outline: 2px solid Highlight', 'outline-offset: -2px'],
    });
    expect(declaredFor(other, css, OUTLINE)).toEqual({ atRest: [] });
  });

  it('draws a disabled option at full strength in GrayText, hovered or not', () => {
    render(
      <ConfigProvider classPrefix={prefix}>
        <Autocomplete
          label="Fruit"
          data={[{ value: 'Apple' }, { value: 'Apricot', disabled: true }]}
        />
      </ConfigProvider>
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'A' } });
    const [enabled, disabled] = screen.getAllByRole('option');
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    // The opacity that fades it at rest would only fade GrayText (#2049).
    const STATE = ['color', 'opacity'];
    expect(declaredFor(disabled, css, STATE)).toEqual({
      atRest: [
        'color: var(--bulma-autocomplete-item-color)',
        'color: var(--bulma-autocomplete-item-disabled-color)',
        'opacity: var(--bulma-autocomplete-item-disabled-opacity)',
      ],
      [FORCED]: ['opacity: 1', 'color: graytext'],
    });
    // Under the pointer too, where the rule that recolors a hovered one ranks
    // a pseudo-class higher. jsdom puts nothing under the pointer, so `:hover`
    // reads as an attribute, which ranks the same, on the option.
    disabled.setAttribute('data-hovered', '');
    const hovered = css.split(':hover').join('[data-hovered]');
    const color = (sheet: string) =>
      cascade(
        disabled,
        sheet,
        ['color'],
        (style, property) => style.getPropertyValue(property) || undefined,
        { forcedColors: true }
      );
    expect(color(css)).toBe('graytext');
    expect(color(hovered)).toBe('graytext');
    expect(declaredFor(enabled, css, STATE)[FORCED]).toBeUndefined();
  });

  it.each([
    ['the options and the header', 'A'],
    ['only the empty message and the header', 'zz'],
  ])('draws an edge around the dropdown showing %s', (_m, typed) => {
    open(typed);
    const box = document.querySelector(
      `.${prefix}autocomplete .${prefix}dropdown-content`
    ) as HTMLElement;
    expect(box).toHaveTextContent('Fruit we have');
    expect(declaredFor(box, css, OUTLINE)).toEqual({
      atRest: [],
      [FORCED]: ['outline: 1px solid CanvasText', 'outline-offset: -1px'],
    });
  });
});
