import type { MockInstance } from 'vitest';
import { createRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  ColorPicker,
  ColorPickerAlphaSlider,
  ColorPickerArea,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerSwatches,
  type ColorPickerProps,
} from '../ColorPicker';
import { Field } from '../Field';
import { Control } from '../Control';
import { Fieldset } from '../Fieldset';
import { ConfigProvider } from '../../helpers/Config';
import { LocaleProvider } from '../../helpers/LocaleProvider';
import { resetDevWarnings } from '../../helpers/devWarnings';

// jsdom lays nothing out: the square is 200 by 100 and a slider 360 wide,
// both at the page's corner.
const RECTS: Record<string, { width: number; height: number }> = {
  'color-area': { width: 200, height: 100 },
  'color-slider': { width: 360, height: 24 },
};

let rtl = false;
let coarse = false;
let customProperty = '';
let warnSpy: MockInstance;

beforeEach(() => {
  rtl = false;
  coarse = false;
  customProperty = '';
  resetDevWarnings();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      const key = Object.keys(RECTS).find(name =>
        this.classList.contains(name)
      );
      const { width, height } = key ? RECTS[key] : { width: 0, height: 0 };
      return {
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
        toJSON() {},
      } as DOMRect;
    }
  );
  const real = window.getComputedStyle;
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
    const style = real(el, pseudo);
    return {
      ...style,
      direction: rtl ? 'rtl' : 'ltr',
      getPropertyValue: (name: string) =>
        name === '--color-swatch-color'
          ? customProperty
          : style.getPropertyValue(name),
    } as CSSStyleDeclaration;
  });
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('coarse') ? coarse : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  warnSpy.mockRestore();
  delete (window as { EyeDropper?: unknown }).EyeDropper;
});

/**
 * jsdom has no PointerEvent, so fireEvent's pointer events drop clientX and
 * clientY. A MouseEvent of the pointer type carries them, and React reads
 * the native event.
 */
const pointer = (
  el: Element,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  init: {
    clientX?: number;
    clientY?: number;
    button?: number;
    pointerType?: string;
  } = {}
) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
    button: init.button ?? 0,
  });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  Object.defineProperty(event, 'pointerType', {
    value: init.pointerType ?? 'mouse',
  });
  fireEvent(el, event);
  return event;
};

const field = () => screen.getByRole('textbox', { name: 'Color value' });
const area = (container: HTMLElement) =>
  container.querySelector('.color-area') as HTMLElement;
const areaInputs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLInputElement>('.color-area-input'));
const hue = () => screen.getByRole('slider', { name: 'Hue' });
const alpha = () => screen.getByRole('slider', { name: 'Alpha' });
const sliderOf = (input: HTMLElement) =>
  input.closest('.color-slider') as HTMLElement;

/** A picker whose value the test reads back, with every callback recorded. */
function setup(props: Partial<ColorPickerProps> = {}) {
  const onChange = vi.fn();
  const onChangeEnd = vi.fn();
  const utils = render(
    <ColorPicker
      aria-label="Brand"
      onChange={onChange}
      onChangeEnd={onChangeEnd}
      {...props}
    />
  );
  return { ...utils, onChange, onChangeEnd };
}

describe('ColorPicker', () => {
  describe('Default layout', () => {
    it('renders a named group with the square, the hue, the value and no extras', () => {
      const { container } = render(<ColorPicker label="Brand color" />);
      const group = screen.getByRole('group', { name: 'Brand color' });
      expect(group).toHaveClass('color-picker');
      expect(areaInputs(container)).toHaveLength(2);
      expect(hue()).toBeInTheDocument();
      expect(screen.queryByRole('slider', { name: 'Alpha' })).toBeNull();
      expect(screen.queryByRole('radiogroup')).toBeNull();
      expect(field()).toHaveValue('hsl(0, 0%, 0%)');
      expect(container.querySelector('input[type="hidden"]')).toBeNull();
    });

    it('adds the alpha slider and writes alpha with alpha', () => {
      render(<ColorPicker alpha defaultValue="rgba(255, 0, 0, 0.5)" />);
      expect(alpha()).toHaveAttribute('aria-valuetext', '50%');
      expect(field()).toHaveValue('hsla(0, 100%, 50%, 0.5)');
    });

    it('drops alpha it was given when it takes none', () => {
      render(<ColorPicker defaultValue="rgba(255, 0, 0, 0.5)" format="rgb" />);
      expect(field()).toHaveValue('rgb(255, 0, 0)');
    });

    it.each([
      ['hex', '#ff6347'],
      ['rgb', 'rgb(255, 99, 71)'],
      ['hsl', 'hsl(9, 100%, 64%)'],
    ] as const)('writes the value as %s', (format, expected) => {
      render(<ColorPicker defaultValue="tomato" format={format} />);
      expect(field()).toHaveValue(expected);
    });

    it('starts black when given a value it cannot read', () => {
      render(<ColorPicker defaultValue="var(--x)" />);
      expect(field()).toHaveValue('hsl(0, 0%, 0%)');
    });

    it('renders its parts in place of the standard layout', () => {
      const { container } = render(
        <ColorPicker swatches={['red']} alpha>
          <ColorPicker.Swatches />
          <ColorPicker.HueSlider />
          <p>Between</p>
        </ColorPicker>
      );
      expect(container.querySelector('.color-area')).toBeNull();
      expect(screen.queryByRole('slider', { name: 'Alpha' })).toBeNull();
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getByText('Between')).toBeInTheDocument();
    });
  });

  describe('The square', () => {
    it('is two native ranges with one tab stop, read as one 2D slider', () => {
      const { container } = render(<ColorPicker defaultValue="#1e6b99" />);
      const [x, y] = areaInputs(container);
      for (const input of [x, y]) {
        expect(input).toHaveAttribute('type', 'range');
        expect(input).toHaveAttribute(
          'aria-label',
          'Saturation and brightness'
        );
        expect(input).toHaveAttribute('aria-roledescription', '2D slider');
      }
      expect(x).toHaveAttribute('aria-orientation', 'horizontal');
      expect(y).toHaveAttribute('aria-orientation', 'vertical');
      expect(x).toHaveValue('80');
      expect(y).toHaveValue('60');
      expect(x).toHaveAttribute(
        'aria-valuetext',
        'Saturation 80%, Brightness 60%'
      );
      expect(y).toHaveAttribute(
        'aria-valuetext',
        'Brightness 60%, Saturation 80%'
      );
      expect(x).toHaveAttribute('tabindex', '0');
      expect(x).not.toHaveAttribute('aria-hidden');
      expect(y).toHaveAttribute('tabindex', '-1');
      expect(y).toHaveAttribute('aria-hidden', 'true');
      // Unrounded, so a drag moves the thumb smoothly.
      expect(area(container).style.getPropertyValue('--color-area-x')).toMatch(
        /^80\.39\d*%$/
      );
    });

    it('moves by key, a step, ten with Shift, and pages', () => {
      const { container, onChange, onChangeEnd } = setup({
        defaultValue: 'hsl(0, 100%, 25%)',
        format: 'hex',
      });
      const [x] = areaInputs(container);
      // Saturation 100, brightness 50.
      fireEvent.keyDown(x, { key: 'ArrowLeft' });
      expect(x).toHaveValue('99');
      fireEvent.keyDown(x, { key: 'ArrowLeft', shiftKey: true });
      expect(x).toHaveValue('89');
      fireEvent.keyDown(x, { key: 'ArrowRight' });
      expect(x).toHaveValue('90');
      fireEvent.keyDown(x, { key: 'Home' });
      expect(x).toHaveValue('80');
      fireEvent.keyDown(x, { key: 'End' });
      expect(x).toHaveValue('90');
      const [, y] = areaInputs(container);
      fireEvent.keyDown(x, { key: 'PageUp' });
      expect(y).toHaveValue('60');
      fireEvent.keyDown(y, { key: 'PageDown' });
      fireEvent.keyDown(y, { key: 'ArrowDown' });
      fireEvent.keyDown(y, { key: 'ArrowUp', shiftKey: true });
      expect(y).toHaveValue('59');
      expect(onChange).toHaveBeenCalledTimes(9);
      expect(onChangeEnd).toHaveBeenCalledTimes(9);
      expect(onChangeEnd).toHaveBeenLastCalledWith('#960f0f');
    });

    it('moves focus and the tab stop to the axis a key moved, and shows both until focus leaves', () => {
      const { container } = render(
        <>
          <ColorPicker defaultValue="#808080" />
          <button>After</button>
        </>
      );
      const [x, y] = areaInputs(container);
      x.focus();
      // The input taking focus is already shown as it does.
      let hiddenAtFocus: string | null = 'unset';
      y.addEventListener('focus', () => {
        hiddenAtFocus = y.getAttribute('aria-hidden');
      });
      fireEvent.keyDown(x, { key: 'ArrowUp' });
      expect(y).toHaveFocus();
      expect(hiddenAtFocus).toBeNull();
      expect(y).toHaveAttribute('tabindex', '0');
      expect(x).toHaveAttribute('tabindex', '-1');
      expect(x).not.toHaveAttribute('aria-hidden');
      expect(y).not.toHaveAttribute('aria-hidden');
      // Back across, still inside the square: both stay shown.
      fireEvent.keyDown(y, { key: 'ArrowRight' });
      expect(x).toHaveFocus();
      expect(y).not.toHaveAttribute('aria-hidden');
      // A second key on the same axis keeps focus where it is.
      fireEvent.keyDown(x, { key: 'ArrowRight' });
      expect(x).toHaveFocus();
      act(() => screen.getByRole('button', { name: 'After' }).focus());
      expect(y).toHaveAttribute('aria-hidden', 'true');
    });

    it('takes the tab stop to the input that gets focus', () => {
      const { container } = render(<ColorPicker />);
      const [x, y] = areaInputs(container);
      act(() => y.focus());
      expect(y).toHaveAttribute('tabindex', '0');
      expect(x).toHaveAttribute('tabindex', '-1');
    });

    it('leaves other keys alone and stops at the edges', () => {
      const { container, onChange, onChangeEnd } = setup({
        defaultValue: 'black',
      });
      const [x] = areaInputs(container);
      expect(fireEvent.keyDown(x, { key: 'a' })).toBe(true);
      fireEvent.keyDown(x, { key: 'ArrowLeft' });
      expect(x).toHaveValue('0');
      // Nothing changed, so only the end of the change is reported.
      expect(onChange).not.toHaveBeenCalled();
      expect(onChangeEnd).toHaveBeenCalledWith('hsl(0, 0%, 0%)');
    });

    it('follows the screen right to left', () => {
      rtl = true;
      const { container } = render(<ColorPicker defaultValue="#808080" />);
      const [x] = areaInputs(container);
      fireEvent.keyDown(x, { key: 'ArrowLeft' });
      expect(x).toHaveValue('1');
      fireEvent.keyDown(x, { key: 'ArrowRight' });
      expect(x).toHaveValue('0');
    });

    it('sets the color where a press lands and follows a drag', () => {
      const { container, onChange, onChangeEnd } = setup({ format: 'hex' });
      const square = area(container);
      const [x] = areaInputs(container);
      const down = pointer(square, 'pointerdown', { clientX: 200, clientY: 0 });
      expect(down.defaultPrevented).toBe(true);
      expect(x).toHaveFocus();
      expect(onChange).toHaveBeenLastCalledWith('#ff0000');
      pointer(square, 'pointermove', { clientX: 100, clientY: 50 });
      expect(onChange).toHaveBeenLastCalledWith('#804040');
      expect(onChangeEnd).not.toHaveBeenCalled();
      pointer(square, 'pointerup');
      expect(onChangeEnd).toHaveBeenCalledWith('#804040');
      // Moves after the drag, and a second release, do nothing.
      pointer(square, 'pointermove', { clientX: 0, clientY: 0 });
      pointer(square, 'pointercancel');
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChangeEnd).toHaveBeenCalledTimes(1);
    });

    it('ignores a mouse button other than the main one, but not a touch', () => {
      const { container, onChange } = setup({ format: 'hex' });
      const square = area(container);
      pointer(square, 'pointerdown', { clientX: 200, button: 2 });
      expect(onChange).not.toHaveBeenCalled();
      pointer(square, 'pointerdown', {
        clientX: 200,
        button: 2,
        pointerType: 'touch',
      });
      expect(onChange).toHaveBeenCalledWith('#ff0000');
    });

    it('mirrors a press right to left, and clamps outside', () => {
      rtl = true;
      const { container, onChange } = setup({ format: 'hex' });
      pointer(area(container), 'pointerdown', { clientX: -50, clientY: -10 });
      expect(onChange).toHaveBeenLastCalledWith('#ff0000');
    });

    it('reads a square with no size as its corner', () => {
      RECTS['color-area'] = { width: 0, height: 0 };
      try {
        const { container, onChange } = setup({ defaultValue: 'red' });
        pointer(area(container), 'pointerdown', { clientX: 50, clientY: 50 });
        expect(onChange).toHaveBeenCalledWith('hsl(0, 0%, 100%)');
      } finally {
        RECTS['color-area'] = { width: 200, height: 100 };
      }
    });

    it('takes a value a touch screen reader sets on either input', () => {
      const { container, onChange, onChangeEnd } = setup({
        defaultValue: '#808080',
        format: 'hex',
      });
      const [x, y] = areaInputs(container);
      fireEvent.change(x, { target: { value: '100' } });
      expect(onChange).toHaveBeenLastCalledWith('#800000');
      fireEvent.change(y, { target: { value: '100' } });
      expect(onChangeEnd).toHaveBeenLastCalledWith('#ff0000');
    });

    it('shows both inputs, both tabbable, on a touch device', async () => {
      coarse = true;
      const { container } = render(<ColorPicker />);
      await act(async () => {});
      for (const input of areaInputs(container)) {
        expect(input).toHaveAttribute('tabindex', '0');
        expect(input).not.toHaveAttribute('aria-hidden');
      }
    });
  });

  describe('The sliders', () => {
    it('says the hue in degrees and the alpha in percent', () => {
      render(<ColorPicker alpha defaultValue="hsla(171, 100%, 41%, 0.5)" />);
      expect(hue()).toHaveAttribute('aria-valuetext', '171 degrees');
      expect(hue()).toHaveAttribute('max', '360');
      expect(hue()).toHaveAttribute('tabindex', '0');
      expect(alpha()).toHaveAttribute('aria-valuetext', '50%');
      expect(alpha()).toHaveAttribute('max', '100');
      expect(sliderOf(hue())).toHaveClass('color-slider', 'is-hue');
      expect(sliderOf(alpha())).toHaveClass('color-slider', 'is-alpha');
      expect(
        sliderOf(hue()).style.getPropertyValue('--color-slider-position')
      ).toBe('47.5%');
    });

    it('steps by key, ten with Shift or a page, and goes to the ends', () => {
      const { onChangeEnd } = setup({ defaultValue: 'hsl(100, 50%, 50%)' });
      const keys: Array<[string, boolean, string]> = [
        ['ArrowRight', false, '101 degrees'],
        ['ArrowUp', true, '111 degrees'],
        ['ArrowLeft', false, '110 degrees'],
        ['ArrowDown', true, '100 degrees'],
        ['PageUp', false, '110 degrees'],
        ['PageDown', false, '100 degrees'],
        ['End', false, '360 degrees'],
        ['Home', false, '0 degrees'],
      ];
      for (const [key, shiftKey, text] of keys) {
        fireEvent.keyDown(hue(), { key, shiftKey });
        expect(hue()).toHaveAttribute('aria-valuetext', text);
      }
      expect(fireEvent.keyDown(hue(), { key: 'x' })).toBe(true);
      expect(onChangeEnd).toHaveBeenCalledTimes(keys.length);
    });

    it('follows the screen right to left', () => {
      rtl = true;
      render(<ColorPicker alpha />);
      fireEvent.keyDown(alpha(), { key: 'ArrowRight' });
      expect(alpha()).toHaveAttribute('aria-valuetext', '99%');
      fireEvent.keyDown(alpha(), { key: 'ArrowLeft' });
      expect(alpha()).toHaveAttribute('aria-valuetext', '100%');
    });

    it('sets the value where a press lands and follows a drag', () => {
      const { onChange, onChangeEnd } = setup({ defaultValue: 'red' });
      const slider = sliderOf(hue());
      pointer(slider, 'pointerdown', { clientX: 120 });
      expect(hue()).toHaveFocus();
      expect(onChange).toHaveBeenLastCalledWith('hsl(120, 100%, 50%)');
      pointer(slider, 'pointermove', { clientX: 240 });
      pointer(slider, 'pointerup');
      expect(onChangeEnd).toHaveBeenCalledWith('hsl(240, 100%, 50%)');
      pointer(slider, 'pointermove', { clientX: 0 });
      pointer(slider, 'pointerup');
      expect(onChangeEnd).toHaveBeenCalledTimes(1);
    });

    it('ignores a press with another mouse button, and right to left mirrors', () => {
      const { onChange } = setup({ defaultValue: 'red', alpha: true });
      pointer(sliderOf(alpha()), 'pointerdown', { clientX: 0, button: 1 });
      expect(onChange).not.toHaveBeenCalled();
      rtl = true;
      pointer(sliderOf(alpha()), 'pointerdown', { clientX: 0 });
      expect(onChange).not.toHaveBeenCalled();
      pointer(sliderOf(alpha()), 'pointercancel');
      pointer(sliderOf(alpha()), 'pointerdown', { clientX: 360 });
      expect(onChange).toHaveBeenLastCalledWith('hsla(0, 100%, 50%, 0)');
    });

    it('takes a value set on the input itself', () => {
      const { onChangeEnd } = setup({ alpha: true, defaultValue: 'red' });
      fireEvent.change(hue(), { target: { value: '60' } });
      fireEvent.change(alpha(), { target: { value: '25' } });
      expect(onChangeEnd).toHaveBeenLastCalledWith('hsla(60, 100%, 50%, 0.25)');
    });

    it('writes numbers in the locale of a LocaleProvider', () => {
      render(
        <LocaleProvider locale="de">
          <ColorPicker alpha defaultValue="hsla(171, 50%, 50%, 0.5)" />
        </LocaleProvider>
      );
      expect(hue()).toHaveAttribute('aria-valuetext', '171 Grad');
      expect(alpha()).toHaveAttribute('aria-valuetext', '50\u00a0%');
    });

    it('takes its words from labels, an empty one keeping its default', () => {
      const { container } = render(
        <ColorPicker
          labels={{
            hue: 'Farbton',
            degrees: 'Grad',
            saturation: '',
            area: 'Fläche',
            areaRoleDescription: '2D-Regler',
          }}
        />
      );
      expect(screen.getByRole('slider', { name: 'Farbton' })).toHaveAttribute(
        'aria-valuetext',
        '0 Grad'
      );
      const [x] = areaInputs(container);
      expect(x).toHaveAttribute('aria-label', 'Fläche');
      expect(x).toHaveAttribute('aria-roledescription', '2D-Regler');
      expect(x.getAttribute('aria-valuetext')).toMatch(/^Saturation 0%/);
    });
  });

  describe('Swatches', () => {
    const radios = () => screen.getAllByRole('radio');

    it('is a named radio group of swatches, named by label or color', () => {
      render(
        <ColorPicker
          defaultValue="#00d1b2"
          swatches={['#1e6b99', { color: '#00d1b2', label: 'Turquoise' }, '']}
        />
      );
      const group = screen.getByRole('radiogroup', { name: 'Swatches' });
      expect(group).toHaveClass('color-picker-swatches');
      expect(radios().map(r => r.getAttribute('aria-label'))).toEqual([
        '#1e6b99',
        'Turquoise',
        '',
      ]);
      expect(radios()[1]).toHaveAttribute('title', 'Turquoise');
      expect(radios()[1]).toHaveAttribute('aria-checked', 'true');
      expect(radios()[1]).toHaveClass('color-picker-swatch', 'is-checked');
      expect(radios()[1].querySelector('svg')).not.toBeNull();
      expect(radios().map(r => r.tabIndex)).toEqual([-1, 0, -1]);
    });

    it('puts the tab stop on the first when none is chosen', () => {
      render(<ColorPicker swatches={['red', 'lime']} />);
      expect(radios().map(r => r.tabIndex)).toEqual([0, -1]);
    });

    it('marks a light swatch for dark ink', () => {
      render(<ColorPicker swatches={['#ffdd57', '#1e6b99']} />);
      expect(radios()[0]).toHaveClass('is-dark-ink');
      expect(radios()[1]).not.toHaveClass('is-dark-ink');
      expect(radios()[0]).not.toHaveClass('is-see-through');
    });

    it('gives a see-through swatch the scheme ink, not black or white', () => {
      render(
        <ColorPicker
          alpha
          swatches={['transparent', 'rgba(255, 255, 255, 0.3)', '#ffdd5780']}
        />
      );
      for (const radio of radios()) {
        expect(radio).toHaveClass('is-see-through');
        expect(radio).not.toHaveClass('is-dark-ink');
      }
    });

    it('draws the check with a ring under it', () => {
      render(<ColorPicker defaultValue="#1e6b99" swatches={['#1e6b99']} />);
      const paths = radios()[0].querySelectorAll('svg path');
      expect(paths).toHaveLength(2);
      expect(paths[0]).toHaveClass('color-picker-check-halo');
      expect(paths[0]).toHaveAttribute('stroke-width', '4.5');
      expect(paths[1]).not.toHaveAttribute('class');
      expect(paths[1]).toHaveAttribute('stroke-width', '2');
    });

    it('chooses a swatch on a click, in the picker format', () => {
      const { onChange, onChangeEnd } = setup({
        swatches: ['#1e6b99'],
        format: 'hsl',
      });
      fireEvent.click(radios()[0]);
      expect(onChange).toHaveBeenCalledWith('hsl(202, 67%, 36%)');
      expect(onChangeEnd).toHaveBeenCalledWith('hsl(202, 67%, 36%)');
      expect(radios()[0]).toHaveAttribute('aria-checked', 'true');
    });

    it('keeps the hue for a gray swatch', () => {
      render(
        <ColorPicker defaultValue="hsl(200, 100%, 50%)" swatches={['white']} />
      );
      fireEvent.click(radios()[0]);
      expect(field()).toHaveValue('hsl(200, 0%, 100%)');
      expect(hue()).toHaveAttribute('aria-valuetext', '200 degrees');
      expect(radios()[0]).toHaveAttribute('aria-checked', 'true');
    });

    it('takes the hue a gray swatch names in hsl()', () => {
      render(
        <ColorPicker
          defaultValue="hsl(100, 100%, 50%)"
          swatches={['hsl(200, 0%, 50%)']}
        />
      );
      fireEvent.click(radios()[0]);
      expect(field()).toHaveValue('hsl(200, 0%, 50%)');
      expect(hue()).toHaveAttribute('aria-valuetext', '200 degrees');
    });

    it('moves and chooses with the arrows, wrapping, and Home and End', () => {
      render(<ColorPicker swatches={['red', 'lime', 'blue']} format="hex" />);
      const [first, second, third] = radios();
      act(() => first.focus());
      fireEvent.keyDown(first, { key: 'ArrowRight' });
      expect(second).toHaveFocus();
      expect(second).toHaveAttribute('aria-checked', 'true');
      fireEvent.keyDown(second, { key: 'ArrowDown' });
      expect(third).toHaveFocus();
      fireEvent.keyDown(third, { key: 'ArrowRight' });
      expect(first).toHaveFocus();
      fireEvent.keyDown(first, { key: 'ArrowUp' });
      expect(third).toHaveFocus();
      fireEvent.keyDown(third, { key: 'Home' });
      expect(first).toHaveFocus();
      fireEvent.keyDown(first, { key: 'End' });
      expect(third).toHaveFocus();
      expect(field()).toHaveValue('#0000ff');
      expect(fireEvent.keyDown(third, { key: 'Enter' })).toBe(true);
      act(() => third.blur());
      expect(radios().map(r => r.tabIndex)).toEqual([-1, -1, 0]);
    });

    it('swaps Left and Right right to left', () => {
      rtl = true;
      render(<ColorPicker swatches={['red', 'lime', 'blue']} />);
      const [first, second] = radios();
      fireEvent.keyDown(first, { key: 'ArrowLeft' });
      expect(second).toHaveFocus();
      fireEvent.keyDown(second, { key: 'ArrowRight' });
      expect(first).toHaveFocus();
    });

    it('shows the page theme colors for "bulma", read after it renders', () => {
      customProperty = 'hsla(171deg, 100%, 41%, 1)';
      const { onChange } = setup({ swatches: 'bulma' });
      expect(radios().map(r => r.getAttribute('aria-label'))).toEqual([
        'Primary',
        'Link',
        'Info',
        'Success',
        'Warning',
        'Danger',
      ]);
      fireEvent.click(radios()[0]);
      expect(onChange).toHaveBeenCalledWith('hsl(171, 100%, 41%)');
      // Each of them reads the same here, so the first one is checked.
      expect(radios()[0]).toHaveAttribute('aria-checked', 'true');
    });

    it('reads the theme again as it renders, so the chosen one follows a change', () => {
      customProperty = 'hsla(171deg, 100%, 41%, 1)';
      const { rerender } = render(
        <ColorPicker value="hsl(171, 100%, 41%)" swatches="bulma" />
      );
      expect(radios()[0]).toHaveAttribute('aria-checked', 'true');
      // The theme changes while the picker is open.
      customProperty = 'hsla(348deg, 86%, 61%, 1)';
      rerender(<ColorPicker value="hsl(171, 100%, 41%)" swatches="bulma" />);
      expect(radios()[0]).toHaveAttribute('aria-checked', 'false');
      rerender(<ColorPicker value="hsl(348, 86%, 61%)" swatches="bulma" />);
      expect(radios()[0]).toHaveAttribute('aria-checked', 'true');
    });

    it('picks the color the theme has now, even before a render', () => {
      customProperty = 'hsla(171deg, 100%, 41%, 1)';
      const { onChange } = setup({ swatches: 'bulma' });
      customProperty = 'hsla(348deg, 86%, 61%, 1)';
      fireEvent.click(radios()[1]);
      expect(onChange).toHaveBeenCalledWith('hsl(348, 86%, 61%)');
    });

    it('chooses nothing from a swatch it cannot read', () => {
      const { onChange } = setup({ swatches: ['var(--nothing)'] });
      expect(radios()[0]).toHaveAttribute('aria-checked', 'false');
      fireEvent.click(radios()[0]);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('takes its own list over the picker’s, and renders nothing with none', () => {
      const { rerender } = render(
        <ColorPicker swatches={['red']}>
          <ColorPicker.Swatches swatches={['lime', 'blue']} />
        </ColorPicker>
      );
      expect(radios()).toHaveLength(2);
      rerender(
        <ColorPicker>
          <ColorPicker.Swatches />
        </ColorPicker>
      );
      expect(screen.queryByRole('radiogroup')).toBeNull();
    });
  });

  describe('The value as text', () => {
    it('commits a typed color on Enter, in the picker format', () => {
      const { onChange, onChangeEnd } = setup({ format: 'hex' });
      fireEvent.change(field(), { target: { value: 'rgb(0, 128, 255)' } });
      expect(onChange).not.toHaveBeenCalled();
      const enter = fireEvent.keyDown(field(), { key: 'Enter' });
      expect(enter).toBe(false);
      expect(onChange).toHaveBeenCalledWith('#0080ff');
      expect(onChangeEnd).toHaveBeenCalledWith('#0080ff');
      expect(field()).toHaveValue('#0080ff');
    });

    it('marks text it cannot read, keeps it on Enter, and puts the value back on Escape', () => {
      const { onChange } = setup();
      fireEvent.change(field(), { target: { value: 'not a color' } });
      expect(field()).toHaveAttribute('aria-invalid', 'true');
      expect(field()).toHaveClass('input', 'is-small', 'is-danger');
      fireEvent.keyDown(field(), { key: 'Enter' });
      expect(field()).toHaveValue('not a color');
      const outer = vi.fn();
      document.addEventListener('keydown', outer);
      const escape = fireEvent.keyDown(field(), { key: 'Escape' });
      document.removeEventListener('keydown', outer);
      expect(escape).toBe(false);
      expect(outer).not.toHaveBeenCalled();
      expect(field()).toHaveValue('hsl(0, 0%, 0%)');
      expect(field()).not.toHaveAttribute('aria-invalid');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('commits on leaving the field, or puts the value back', () => {
      const { onChange } = setup();
      fireEvent.change(field(), { target: { value: 'hsl(120, 100%, 25%)' } });
      fireEvent.blur(field());
      expect(onChange).toHaveBeenCalledWith('hsl(120, 100%, 25%)');
      fireEvent.change(field(), { target: { value: 'zzz' } });
      fireEvent.blur(field());
      expect(field()).toHaveValue('hsl(120, 100%, 25%)');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it.each(['#808080', 'gray', 'rgb(128, 128, 128)'])(
      'keeps the hue when a gray is typed as %s',
      gray => {
        render(<ColorPicker defaultValue="hsl(200, 100%, 50%)" />);
        fireEvent.change(field(), { target: { value: gray } });
        fireEvent.blur(field());
        expect(hue()).toHaveAttribute('aria-valuetext', '200 degrees');
        expect(field()).toHaveValue('hsl(200, 0%, 50%)');
      }
    );

    it('takes the hue a typed hsl() gray names', () => {
      const { container } = render(
        <ColorPicker defaultValue="hsl(100, 100%, 50%)" name="tone" />
      );
      fireEvent.change(field(), { target: { value: 'hsl(200, 0%, 50%)' } });
      fireEvent.keyDown(field(), { key: 'Enter' });
      expect(field()).toHaveValue('hsl(200, 0%, 50%)');
      expect(hue()).toHaveAttribute('aria-valuetext', '200 degrees');
      expect(container.querySelector('input[type="hidden"]')).toHaveValue(
        'hsl(200, 0%, 50%)'
      );
    });

    it('leaves Enter, Escape and leaving alone when nothing was typed', () => {
      const { onChangeEnd } = setup();
      expect(fireEvent.keyDown(field(), { key: 'Enter' })).toBe(true);
      expect(fireEvent.keyDown(field(), { key: 'Escape' })).toBe(true);
      fireEvent.blur(field());
      fireEvent.change(field(), { target: { value: 'red' } });
      expect(fireEvent.keyDown(field(), { key: 'a' })).toBe(true);
      expect(onChangeEnd).not.toHaveBeenCalled();
    });

    it('shows a preview swatch hidden from assistive tech', () => {
      const { container } = render(<ColorPicker defaultValue="red" />);
      const preview = container.querySelector(
        '.color-picker-preview'
      ) as HTMLElement;
      expect(preview).toHaveClass('color-swatch');
      expect(preview).toHaveAttribute('aria-hidden', 'true');
      expect(preview.style.getPropertyValue('--color-swatch-color')).toBe(
        'hsl(0, 100%, 50%)'
      );
    });
  });

  describe('The eye dropper', () => {
    const eyeDropper = (result: Promise<{ sRGBHex: string }>) => {
      const open = vi.fn(() => result);
      // A `function`, not an arrow: the code under test calls it with `new`.
      (window as { EyeDropper?: unknown }).EyeDropper = vi.fn(function () {
        return { open };
      });
      return open;
    };

    it('is not there without the browser API, or without eyeDropper', () => {
      const { rerender } = render(<ColorPicker eyeDropper />);
      expect(screen.queryByRole('button')).toBeNull();
      eyeDropper(Promise.resolve({ sRGBHex: '#ff0000' }));
      rerender(<ColorPicker eyeDropper={false} />);
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('picks a color from the screen, keeping the alpha', async () => {
      const open = eyeDropper(Promise.resolve({ sRGBHex: '#ff0000' }));
      const { onChangeEnd } = setup({
        eyeDropper: true,
        alpha: true,
        defaultValue: 'rgba(0, 0, 0, 0.5)',
      });
      const button = screen.getByRole('button', {
        name: 'Pick a color from the screen',
      });
      expect(button).toHaveClass('button', 'is-small');
      await act(async () => {
        fireEvent.click(button);
      });
      expect(open).toHaveBeenCalled();
      expect(onChangeEnd).toHaveBeenCalledWith('hsla(0, 100%, 50%, 0.5)');
    });

    it('keeps the hue for a gray from the screen', async () => {
      eyeDropper(Promise.resolve({ sRGBHex: '#808080' }));
      setup({ eyeDropper: true, defaultValue: 'hsl(200, 100%, 50%)' });
      await act(async () => {
        fireEvent.click(screen.getByRole('button'));
      });
      expect(field()).toHaveValue('hsl(200, 0%, 50%)');
    });

    it('does nothing when it is cancelled or gives back nothing readable', async () => {
      const open = eyeDropper(Promise.resolve({ sRGBHex: 'nope' }));
      open.mockReturnValueOnce(Promise.reject(new DOMException('', 'Abort')));
      const { onChange } = setup({ eyeDropper: true });
      for (let i = 0; i < 2; i += 1) {
        await act(async () => {
          fireEvent.click(screen.getByRole('button'));
        });
      }
      expect(open).toHaveBeenCalledTimes(2);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Value', () => {
    function Controlled({ start = '#1e6b99' }: { start?: string }) {
      const [value, setValue] = useState(start);
      return (
        <>
          <ColorPicker value={value} onChange={setValue} format="hex" />
          <button onClick={() => setValue('#808080')}>Gray</button>
          <button onClick={() => setValue('garbage')}>Garbage</button>
          <output>{value}</output>
        </>
      );
    }

    it('shows a controlled value and takes back what it handed out', () => {
      const { container } = render(<Controlled />);
      const [x] = areaInputs(container);
      fireEvent.keyDown(x, { key: 'ArrowRight' });
      expect(screen.getByRole('status')).toHaveTextContent('#1d6b99');
      expect(x).toHaveValue('81');
    });

    it('keeps the hue and saturation for a gray value, and the last good one for garbage', () => {
      const { container } = render(<Controlled />);
      fireEvent.click(screen.getByRole('button', { name: 'Gray' }));
      expect(hue()).toHaveAttribute('aria-valuetext', '202 degrees');
      expect(field()).toHaveValue('#808080');
      fireEvent.click(screen.getByRole('button', { name: 'Garbage' }));
      expect(field()).toHaveValue('#808080');
      const [x] = areaInputs(container);
      expect(x).toHaveValue('0');
    });

    it('takes the hue a controlled hsl() gray names, however late it comes', () => {
      const { container, rerender } = render(
        <ColorPicker value="hsl(100, 100%, 50%)" name="tone" />
      );
      rerender(<ColorPicker value="hsl(200, 0%, 50%)" name="tone" />);
      expect(field()).toHaveValue('hsl(200, 0%, 50%)');
      expect(container.querySelector('input[type="hidden"]')).toHaveValue(
        'hsl(200, 0%, 50%)'
      );
      expect(hue()).toHaveAttribute('aria-valuetext', '200 degrees');
      // A hex or named gray still keeps the hue the picker had.
      rerender(<ColorPicker value="#666666" name="tone" />);
      expect(hue()).toHaveAttribute('aria-valuetext', '200 degrees');
      rerender(<ColorPicker value="silver" name="tone" />);
      expect(field()).toHaveValue('hsl(200, 0%, 75%)');
    });

    it('keeps the saturation for a black value', () => {
      const { container, rerender } = render(
        <ColorPicker value="#1e6b99" format="hex" />
      );
      rerender(<ColorPicker value="#000000" format="hex" />);
      const [x, y] = areaInputs(container);
      expect(x).toHaveValue('80');
      expect(y).toHaveValue('0');
    });

    it('stays put when the parent turns a change down', () => {
      const onChange = vi.fn();
      const { container } = render(
        <ColorPicker value="#ff0000" format="hex" onChange={onChange} />
      );
      const [x] = areaInputs(container);
      fireEvent.keyDown(x, { key: 'ArrowLeft' });
      expect(onChange).toHaveBeenCalledWith('#ff0303');
      expect(field()).toHaveValue('#ff0000');
    });

    it('moves the thumb for a step that writes the same text', () => {
      // At this brightness, a step of saturation changes no 8-bit channel.
      const onChange = vi.fn();
      const { container } = render(
        <ColorPicker defaultValue="#000000" format="hex" onChange={onChange} />
      );
      const [, y] = areaInputs(container);
      fireEvent.keyDown(y, { key: 'ArrowUp' });
      const [x] = areaInputs(container);
      fireEvent.keyDown(x, { key: 'ArrowRight' });
      expect(x).toHaveValue('1');
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled', () => {
    it('disables every part and changes nothing', () => {
      const { container, onChange } = setup({
        disabled: true,
        swatches: ['red'],
        name: 'brand',
      });
      expect(container.querySelector('.color-picker')).toHaveClass(
        'is-disabled'
      );
      for (const input of areaInputs(container)) expect(input).toBeDisabled();
      expect(hue()).toBeDisabled();
      expect(field()).toBeDisabled();
      expect(screen.getByRole('radio')).toBeDisabled();
      expect(screen.getByRole('radiogroup')).toHaveAttribute(
        'aria-disabled',
        'true'
      );
      expect(container.querySelector('input[type="hidden"]')).toBeDisabled();
      pointer(area(container), 'pointerdown', { clientX: 100 });
      pointer(sliderOf(hue()), 'pointerdown', { clientX: 100 });
      fireEvent.change(hue(), { target: { value: '50' } });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('takes a disabled Fieldset around it', () => {
      render(
        <Fieldset legend="Theme" disabled>
          <ColorPicker />
        </Fieldset>
      );
      expect(hue()).toBeDisabled();
    });
  });

  describe('Forms and Field', () => {
    it('submits the value from a hidden input', () => {
      const { container } = render(
        <ColorPicker name="brand" form="settings" defaultValue="red" />
      );
      const hidden = container.querySelector(
        'input[type="hidden"]'
      ) as HTMLInputElement;
      expect(hidden).toHaveAttribute('name', 'brand');
      expect(hidden).toHaveAttribute('form', 'settings');
      expect(hidden).toHaveValue('hsl(0, 100%, 50%)');
    });

    it('wraps itself in a Field and a Control, with a message', () => {
      const { container } = render(
        <ColorPicker
          label="Brand"
          labelProps={{ id: 'brand-label' }}
          message="Used for buttons"
          messageColor="info"
          fieldClassName="custom-field"
        />
      );
      const fieldEl = container.querySelector('.field.custom-field');
      expect(fieldEl?.querySelector('.control > .color-picker')).not.toBeNull();
      expect(screen.getByRole('group', { name: 'Brand' })).toHaveAttribute(
        'aria-labelledby',
        'brand-label'
      );
      expect(screen.getByText('Used for buttons')).toHaveClass(
        'help',
        'is-info'
      );
    });

    it('is named by a Field around it, and an aria-label wins', () => {
      const { rerender } = render(
        <Field label="Accent">
          <ColorPicker />
        </Field>
      );
      expect(screen.getByRole('group', { name: 'Accent' })).toBeInTheDocument();
      rerender(
        <Field label="Accent">
          <ColorPicker aria-label="Own name" />
        </Field>
      );
      expect(
        screen.getByRole('group', { name: 'Own name' })
      ).toBeInTheDocument();
    });

    it('renders no Control of its own inside one, and the message stays', () => {
      const { container } = render(
        <Control>
          <ColorPicker message="Help" />
        </Control>
      );
      expect(container.querySelectorAll('.control')).toHaveLength(1);
      expect(screen.getByText('Help')).toHaveClass('help');
    });
  });

  describe('Parts outside a ColorPicker', () => {
    it.each([
      ['Area', ColorPickerArea],
      ['HueSlider', ColorPickerHueSlider],
      ['AlphaSlider', ColorPickerAlphaSlider],
      ['Swatches', ColorPickerSwatches],
      ['Input', ColorPickerInput],
    ] as const)('%s warns and renders nothing', (name, Part) => {
      const { container } = render(<Part />);
      expect(container).toBeEmptyDOMElement();
      // Given swatches it can't read, it still renders nothing.
      render(<Part swatches={['var(--bulma-primary)']} />);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(`<ColorPicker.${name}>`)
      );
    });
  });

  describe('Compound components', () => {
    it('attaches each part as a static', () => {
      expect(ColorPicker.Area).toBe(ColorPickerArea);
      expect(ColorPicker.HueSlider).toBe(ColorPickerHueSlider);
      expect(ColorPicker.AlphaSlider).toBe(ColorPickerAlphaSlider);
      expect(ColorPicker.Swatches).toBe(ColorPickerSwatches);
      expect(ColorPicker.Input).toBe(ColorPickerInput);
    });

    it('forwards refs and helper props to each part', () => {
      const refs = {
        root: createRef<HTMLDivElement>(),
        area: createRef<HTMLDivElement>(),
        hue: createRef<HTMLDivElement>(),
        alpha: createRef<HTMLDivElement>(),
        swatches: createRef<HTMLDivElement>(),
        input: createRef<HTMLDivElement>(),
      };
      let callbackNode: HTMLDivElement | null = null;
      render(
        <ColorPicker ref={refs.root} swatches={['red']} p="1">
          <ColorPicker.Area ref={refs.area} m="1" style={{ height: 50 }} />
          <ColorPicker.HueSlider ref={refs.hue} m="2" />
          <ColorPicker.AlphaSlider
            ref={node => {
              callbackNode = node;
            }}
            m="3"
          />
          <ColorPicker.AlphaSlider ref={refs.alpha} />
          <ColorPicker.Swatches ref={refs.swatches} mt="4" />
          <ColorPicker.Input ref={refs.input} className="extra" />
        </ColorPicker>
      );
      expect(refs.root.current).toHaveClass('color-picker', 'p-1');
      expect(refs.area.current).toHaveClass('color-area', 'm-1');
      expect(refs.area.current?.style.height).toBe('50px');
      expect(refs.hue.current).toHaveClass('color-slider', 'm-2');
      expect(callbackNode).toHaveClass('is-alpha', 'm-3');
      expect(refs.alpha.current).toHaveClass('is-alpha');
      expect(refs.swatches.current).toHaveClass('mt-4');
      expect(refs.input.current).toHaveClass('color-picker-value', 'extra');
    });
  });

  describe('Server rendering', () => {
    const Picker = () => (
      <ColorPicker
        label="Brand"
        alpha
        swatches={['red', 'var(--bulma-primary)']}
        eyeDropper
        defaultValue="#1e6b99"
      />
    );

    it('renders from the props alone', () => {
      const html = renderToString(<Picker />);
      expect(html).toContain('aria-roledescription="2D slider"');
      expect(html).toContain('aria-valuetext="202 degrees"');
      expect(html).not.toContain('Pick a color');
    });

    it('hydrates without a mismatch, then shows the eye dropper', async () => {
      (window as { EyeDropper?: unknown }).EyeDropper = vi.fn();
      const container = document.createElement('div');
      container.innerHTML = renderToString(<Picker />);
      document.body.appendChild(container);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let unmountRoot = () => {};
      try {
        await act(async () => {
          const root = hydrateRoot(container, <Picker />);
          unmountRoot = () => root.unmount();
        });
        expect(errorSpy).not.toHaveBeenCalled();
        expect(
          container.querySelector('[aria-label="Pick a color from the screen"]')
        ).not.toBeNull();
      } finally {
        await act(async () => unmountRoot());
        document.body.removeChild(container);
      }
    });
  });

  describe('Class prefix', () => {
    it('prefixes every class under ConfigProvider classPrefix', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <ColorPicker
            label="Brand"
            alpha
            disabled
            eyeDropper
            swatches={['#ffdd57']}
            defaultValue="#ffdd57"
          />
        </ConfigProvider>
      );
      const classes = Array.from(container.querySelectorAll('[class]'))
        .flatMap(el => Array.from(el.classList))
        .filter(name => !name.startsWith('bestax-'));
      expect(classes).toEqual([]);
      expect(container.querySelector('.bestax-color-picker')).toHaveClass(
        'bestax-is-disabled'
      );
      expect(
        container.querySelector('.bestax-color-picker-swatch')
      ).toHaveClass('bestax-is-checked', 'bestax-is-dark-ink');
    });
  });
});
