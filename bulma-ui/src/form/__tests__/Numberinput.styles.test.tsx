// A disabled Numberinput fades as a whole, and a stepper button disabled at a
// limit fades on its own. In forced colors (Windows' contrast themes) the
// disabled parts are drawn in GrayText, which those opacities would only fade,
// so there they draw at full strength (#2049). jsdom loads no partial on its
// own and evaluates no media query, so this compiles `_numberinput.scss`,
// links it with Bulma's CSS on either side, with no class prefix and under
// one, and resolves the values with the shared cascade, on a forced-colors
// page and on any other.
import { render, screen } from '@testing-library/react';
import { Numberinput } from '../Numberinput';
import type { NumberinputProps } from '../Numberinput';
import { ConfigProvider } from '../../helpers/Config';
import { bulmaCss, cascade, compilePartial } from '../../__tests__/css-cascade';

describe.each([
  ['no prefix', '', 'bulma.css'],
  ['a class prefix', 'bulma-', 'versions/bulma-prefixed.css'],
])('Numberinput while disabled, with %s', (_name, prefix, bulmaFile) => {
  const partial = compilePartial('form/numberinput', prefix);
  const bulma = bulmaCss(bulmaFile);

  describe.each([
    ['Bulma first', bulma + partial],
    ['the partial first', partial + bulma],
  ])('with %s', (_order, css) => {
    const resolve = (el: Element, property: string, forcedColors: boolean) =>
      cascade(
        el,
        css,
        [property],
        (style, p) => style.getPropertyValue(p) || undefined,
        { forcedColors }
      );

    const renderInput = (props: NumberinputProps) =>
      render(
        <ConfigProvider classPrefix={prefix}>
          <Numberinput aria-label="Count" {...props} />
        </ConfigProvider>
      ).container.querySelector(`.${prefix}numberinput`)!;

    it.each([
      ['plus and minus buttons', {}],
      ['a stepper', { variant: 'stepper' as const }],
    ])(
      'draws a disabled one with %s at full strength in forced colors, and faded elsewhere',
      (_variant, props) => {
        const root = renderInput({ ...props, disabled: true });
        expect(resolve(root, 'opacity', false)).toBe(
          'var(--bulma-numberinput-disabled-opacity)'
        );
        expect(resolve(root, 'opacity', true)).toBe('1');
      }
    );

    it('draws a stepper button disabled at a limit at full strength in GrayText in forced colors', () => {
      renderInput({ variant: 'stepper', max: 3, defaultValue: 3 });
      const increase = screen.getByRole('button', { name: 'Increase value' });
      const decrease = screen.getByRole('button', { name: 'Decrease value' });
      expect(increase).toBeDisabled();
      expect(decrease).toBeEnabled();
      expect(resolve(increase, 'opacity', false)).toBe(
        'var(--bulma-numberinput-disabled-opacity)'
      );
      expect(resolve(increase, 'opacity', true)).toBe('1');
      expect(resolve(increase, 'color', true)).toBe('graytext');
      expect(resolve(decrease, 'opacity', true)).toBeUndefined();
    });
  });
});
