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
import {
  bulmaCss,
  cascade,
  compilePartial,
  rulesOf,
} from '../../__tests__/css-cascade';

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

// A stepper button is half the input's height, 19px at the default size and
// 14px small, under WCAG 2.5.8's 24px minimum target (#1974). Each takes a
// transparent box on its `::before` that makes up the rest out past the
// stepper: up from the increase button and down from the decrease one, so
// neither covers the other. jsdom computes no pseudo-element, so this reads
// the rules off the compiled partial, with no prefix and under one.
describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bulma-'],
])('Numberinput stepper hit areas, with %s', (_name, prefix) => {
  const { all } = rulesOf(compilePartial('form/numberinput', prefix));
  const p = (name: string) => `.${prefix}${name}`;
  const button = `${p('numberinput')}${p('is-stepper')} ${p('numberinput-stepper-button')}`;

  /** What the rules for exactly `selector` declare, outside any at-rule. */
  const declared = (selector: string) =>
    Object.fromEntries(
      all
        .filter(
          ({ rule, within }) => !within.length && rule.selectorText === selector
        )
        .flatMap(({ rule }) =>
          Array.from(
            { length: rule.style.length },
            (_, i) => rule.style[i]
          ).map(property => [property, rule.style.getPropertyValue(property)])
        )
    );

  it('gives each button a transparent box as wide as it, making up 24px', () => {
    expect(declared(button).position).toBe('relative');
    // The sheet says `24px - 100%`, which jsdom writes the other way round.
    expect(declared(`${button}::before`)).toEqual({
      content: '""',
      position: 'absolute',
      left: '0px',
      width: '100%',
      height: 'max(0px, -100% + 24px)',
    });
  });

  it('reaches up from the increase button and down from the decrease one', () => {
    expect(declared(`${button}:first-child::before`)).toEqual({
      bottom: '100%',
    });
    expect(declared(`${button}:last-child::before`)).toEqual({ top: '100%' });
    render(
      <ConfigProvider classPrefix={prefix}>
        <Numberinput aria-label="Count" variant="stepper" />
      </ConfigProvider>
    );
    const increase = screen.getByRole('button', { name: 'Increase value' });
    const decrease = screen.getByRole('button', { name: 'Decrease value' });
    expect(increase.matches(`${button}:first-child`)).toBe(true);
    expect(decrease.matches(`${button}:last-child`)).toBe(true);
  });

  it('sets the boxes outside every media query', () => {
    const boxes = all.filter(
      ({ rule }) =>
        rule.selectorText.includes(`${p('numberinput-stepper-button')}`) &&
        rule.selectorText.includes('::before')
    );
    expect(boxes.length).toBeGreaterThan(0);
    expect(boxes.every(({ within }) => within.length === 0)).toBe(true);
  });

  it('leaves the stepper unclipped, so the boxes reach past it, and rounds the buttons to its inner corners', () => {
    // The stepper clipped its overflow to round the buttons' hover shade to
    // its corners, which would cut the boxes off at its edge.
    const stepper = `${p('numberinput')}${p('is-stepper')} ${p('numberinput-stepper')}`;
    expect(declared(stepper).overflow).toBeUndefined();
    expect(declared(stepper)['border-top-right-radius']).toBe(
      'var(--bulma-radius)'
    );
    expect(declared(`${button}:first-child`)['border-top-right-radius']).toBe(
      'calc(var(--bulma-radius) - 1px)'
    );
    expect(declared(`${button}:last-child`)['border-bottom-right-radius']).toBe(
      'calc(var(--bulma-radius) - 1px)'
    );
  });
});
