import { createRef, useState, type KeyboardEvent } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { ColorInput, type ColorInputProps } from '../ColorInput';
import { ColorInputBase } from '../ColorInputBase';
import { Field } from '../Field';
import { Control } from '../Control';
import { Fieldset } from '../Fieldset';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  resetDevWarnings();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
});

afterEach(() => {
  warnSpy.mockRestore();
  delete (window as { EyeDropper?: unknown }).EyeDropper;
});

const field = () => screen.getByRole('combobox');
const launcher = () => screen.getByRole('button', { name: 'Choose color' });
const swatchButton = (container: HTMLElement) =>
  container.querySelector('.colorinput-swatch') as HTMLButtonElement;
const panel = () => screen.queryByRole('dialog', { name: 'Choose color' });
const hue = () => screen.getByRole('slider', { name: 'Hue' });
const areaX = (container: HTMLElement) =>
  container.querySelector('.color-area-input') as HTMLInputElement;

/** A field whose callbacks the test reads back. */
function setup(props: Partial<ColorInputProps> = {}) {
  const onChange = jest.fn();
  const onChangeEnd = jest.fn();
  const onOpen = jest.fn();
  const onClose = jest.fn();
  const utils = render(
    <ColorInput
      label="Brand color"
      onChange={onChange}
      onChangeEnd={onChangeEnd}
      onOpen={onOpen}
      onClose={onClose}
      {...props}
    />
  );
  return { ...utils, onChange, onChangeEnd, onOpen, onClose };
}

const open = () =>
  fireEvent.keyDown(field(), { key: 'ArrowDown', altKey: true });

describe('ColorInput', () => {
  describe('The field', () => {
    it('is a combobox named by its label that opens a dialog', () => {
      const { container } = setup({ defaultValue: '#1e6b99' });
      const input = field();
      expect(input).toHaveAccessibleName('Brand color');
      expect(input).toHaveAttribute('aria-haspopup', 'dialog');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('aria-controls', `${input.id}-popover`);
      expect(input).toHaveAttribute('autocomplete', 'off');
      expect(input).toHaveClass('input');
      expect(launcher()).toHaveAttribute('aria-expanded', 'false');
      expect(launcher()).toHaveAttribute(
        'aria-controls',
        `${input.id}-popover`
      );
      const swatch = swatchButton(container);
      expect(swatch).toHaveAttribute('aria-hidden', 'true');
      expect(swatch).toHaveAttribute('tabindex', '-1');
      expect(container.querySelector('.colorinput')).toHaveClass('has-trigger');
    });

    it('shows the value in its format, and the color in the swatch', () => {
      const { container } = setup({ defaultValue: 'tomato', format: 'hex' });
      expect(field()).toHaveValue('#ff6347');
      const chip = swatchButton(container).querySelector(
        '.color-swatch'
      ) as HTMLElement;
      expect(chip.style.getPropertyValue('--color-swatch-color')).toBe(
        'tomato'
      );
    });

    it('drops alpha it was given when it takes none, and keeps a value it cannot read', () => {
      const { rerender } = render(
        <ColorInput value="rgba(255, 0, 0, 0.5)" format="rgb" />
      );
      expect(field()).toHaveValue('rgb(255, 0, 0)');
      rerender(<ColorInput value="rgba(255, 0, 0, 0.5)" format="rgb" alpha />);
      expect(field()).toHaveValue('rgba(255, 0, 0, 0.5)');
      rerender(<ColorInput value="var(--x)" />);
      expect(field()).toHaveValue('var(--x)');
    });

    it('starts empty, with a see-through swatch and the placeholder', () => {
      const { container } = setup({ placeholder: 'No color' });
      expect(field()).toHaveValue('');
      expect(field()).toHaveAttribute('placeholder', 'No color');
      const chip = swatchButton(container).querySelector(
        '.color-swatch'
      ) as HTMLElement;
      expect(chip.style.getPropertyValue('--color-swatch-color')).toBe(
        'transparent'
      );
    });

    it('takes color, size and rounding, and forwards its ref to the input', () => {
      const ref = createRef<HTMLInputElement>();
      render(
        <ColorInput ref={ref} color="info" size="large" isRounded m="2" />
      );
      expect(ref.current).toBe(field());
      expect(field()).toHaveClass('input', 'is-info', 'is-large', 'is-rounded');
      expect(field().closest('.colorinput')).toHaveClass('m-2');
    });

    it('takes a callback ref too', () => {
      let node: HTMLInputElement | null = null;
      render(
        <ColorInputBase
          ref={el => {
            node = el;
          }}
        />
      );
      expect(node).toBe(field());
    });

    it('puts its other attributes on the input', () => {
      render(
        <ColorInput name="brand" required aria-describedby="hint" autoFocus />
      );
      expect(field()).toHaveAttribute('name', 'brand');
      expect(field()).toBeRequired();
      expect(field()).toHaveAttribute('aria-describedby', 'hint');
      expect(field()).toHaveFocus();
    });
  });

  describe('Opening and closing', () => {
    it('opens on Alt+ArrowDown, moving focus to the square, and Escape brings it back', () => {
      const { container, onOpen, onClose } = setup({ defaultValue: 'red' });
      field().focus();
      open();
      expect(panel()).toBeInTheDocument();
      expect(panel()).toHaveAttribute('aria-modal', 'false');
      expect(field()).toHaveAttribute('aria-expanded', 'true');
      expect(areaX(container)).toHaveFocus();
      expect(onOpen).toHaveBeenCalledTimes(1);
      fireEvent.keyDown(areaX(container), { key: 'Escape' });
      expect(panel()).toBeNull();
      expect(field()).toHaveFocus();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('leaves plain ArrowDown to the field', () => {
      setup();
      expect(fireEvent.keyDown(field(), { key: 'ArrowDown' })).toBe(true);
      expect(panel()).toBeNull();
    });

    it('toggles from the launcher, and opens from the swatch', () => {
      const { container } = setup();
      fireEvent.click(launcher());
      expect(panel()).toBeInTheDocument();
      fireEvent.click(launcher());
      expect(panel()).toBeNull();
      const swatch = swatchButton(container);
      expect(fireEvent.mouseDown(swatch)).toBe(false);
      fireEvent.click(swatch);
      expect(panel()).toBeInTheDocument();
      // A second request to open changes nothing.
      fireEvent.click(swatch);
      expect(panel()).toBeInTheDocument();
    });

    it('opens on focus with openOnFocus, but not as focus comes back from it', () => {
      const { container, onOpen } = setup({ openOnFocus: true });
      act(() => field().focus());
      expect(panel()).toBeInTheDocument();
      fireEvent.keyDown(areaX(container), { key: 'Escape' });
      expect(field()).toHaveFocus();
      expect(panel()).toBeNull();
      expect(onOpen).toHaveBeenCalledTimes(1);
      act(() => field().blur());
      act(() => field().focus());
      expect(panel()).toBeInTheDocument();
    });

    it('opens on focus again once focus has been elsewhere', () => {
      render(
        <>
          <ColorInput label="Color" openOnFocus />
          <button>Elsewhere</button>
        </>
      );
      act(() => field().focus());
      expect(panel()).toBeInTheDocument();
      // Closed by the launcher while focus is in the panel, which hands it
      // back; then focus leaves and comes back.
      fireEvent.click(launcher());
      act(() => screen.getByRole('button', { name: 'Elsewhere' }).focus());
      act(() => field().focus());
      expect(panel()).toBeInTheDocument();
    });

    it('opens nothing disabled, read-only, or inside a disabled Fieldset', () => {
      const { container, rerender } = render(<ColorInput disabled />);
      expect(field()).toBeDisabled();
      expect(launcher()).toBeDisabled();
      open();
      fireEvent.click(swatchButton(container));
      expect(panel()).toBeNull();
      rerender(<ColorInput readOnly openOnFocus />);
      act(() => field().focus());
      open();
      fireEvent.click(launcher());
      expect(panel()).toBeNull();
      rerender(
        <Fieldset legend="Theme" disabled>
          <ColorInput />
        </Fieldset>
      );
      expect(field()).toBeDisabled();
    });

    it('hides the launcher with triggerIcon off, or while a Control is loading', () => {
      const { container, rerender } = render(
        <ColorInput triggerIcon={false} />
      );
      expect(screen.queryByRole('button', { name: 'Choose color' })).toBeNull();
      expect(container.querySelector('.colorinput')).not.toHaveClass(
        'has-trigger'
      );
      rerender(<ColorInput isLoading />);
      expect(screen.queryByRole('button', { name: 'Choose color' })).toBeNull();
      rerender(<ColorInput isLoading triggerIcon />);
      expect(launcher()).toBeInTheDocument();
      rerender(
        <Control isLoading>
          <ColorInputBase />
        </Control>
      );
      expect(screen.queryByRole('button', { name: 'Choose color' })).toBeNull();
    });

    it('takes its name and the launcher glyph from labels and triggerIconName', () => {
      const { container } = render(
        <ColorInput
          labels={{ chooseColor: 'Farbe wählen' }}
          triggerIconName="palette"
        />
      );
      expect(
        screen.getByRole('button', { name: 'Farbe wählen' })
      ).toBeInTheDocument();
      expect(container.querySelector('.fa-palette')).not.toBeNull();
    });
  });

  describe('The panel', () => {
    it('holds the square and the hue, with alpha, swatches and the eye dropper when asked', () => {
      (window as { EyeDropper?: unknown }).EyeDropper = jest.fn();
      const { container, rerender } = render(<ColorInput />);
      open();
      expect(container.querySelector('.color-area')).not.toBeNull();
      expect(hue()).toBeInTheDocument();
      expect(screen.queryByRole('slider', { name: 'Alpha' })).toBeNull();
      expect(screen.queryByRole('radiogroup')).toBeNull();
      expect(
        screen.queryByRole('button', { name: 'Pick a color from the screen' })
      ).toBeNull();
      rerender(<ColorInput alpha swatches={['red']} eyeDropper />);
      expect(screen.getByRole('slider', { name: 'Alpha' })).toBeInTheDocument();
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Pick a color from the screen' })
      ).toHaveClass('colorinput-eyedropper');
    });

    it('sets the value from the picker: onChange as it moves, onChangeEnd when done', () => {
      const { onChange, onChangeEnd } = setup({
        defaultValue: 'hsl(0, 100%, 50%)',
      });
      open();
      fireEvent.keyDown(hue(), { key: 'ArrowRight' });
      expect(onChange).toHaveBeenCalledWith('hsl(1, 100%, 50%)');
      expect(onChangeEnd).toHaveBeenCalledWith('hsl(1, 100%, 50%)');
      expect(field()).toHaveValue('hsl(1, 100%, 50%)');
    });

    it('closes on a swatch click with closeOnSwatchClick, and not on the arrows', () => {
      const { rerender } = render(
        <ColorInput swatches={['red', 'lime']} closeOnSwatchClick />
      );
      open();
      const group = screen.getByRole('radiogroup');
      fireEvent.click(group);
      expect(panel()).toBeInTheDocument();
      fireEvent.keyDown(screen.getAllByRole('radio')[0], {
        key: 'ArrowRight',
      });
      expect(panel()).toBeInTheDocument();
      fireEvent.click(screen.getAllByRole('radio')[0]);
      expect(panel()).toBeNull();
      expect(field()).toHaveValue('hsl(0, 100%, 50%)');
      rerender(<ColorInput swatches={['red', 'lime']} />);
      open();
      fireEvent.click(screen.getAllByRole('radio')[1]);
      expect(panel()).toBeInTheDocument();
    });

    it('opens on the last color it held after the field is cleared', () => {
      render(<ColorInput defaultValue="hsl(200, 100%, 50%)" />);
      fireEvent.change(field(), { target: { value: '' } });
      fireEvent.blur(field());
      expect(field()).toHaveValue('');
      open();
      expect(hue()).toHaveAttribute('aria-valuetext', '200 degrees');
    });

    it('opens on black with nothing to remember', () => {
      render(<ColorInput format="hex" />);
      open();
      expect(hue()).toHaveAttribute('aria-valuetext', '0 degrees');
    });

    it('names the picker group by the Field label', () => {
      render(<ColorInput label="Accent" />);
      open();
      expect(panel()).toBeInTheDocument();
      // The panel holds the parts directly, with no group or Field of its own.
      expect(screen.queryByRole('group')).toBeNull();
      expect(document.querySelectorAll('.field')).toHaveLength(1);
    });
  });

  describe('Typing', () => {
    it('commits a typed color on Enter, in the format', () => {
      const { onChange, onChangeEnd } = setup({ format: 'hex' });
      fireEvent.change(field(), { target: { value: ' rgb(0, 128, 255) ' } });
      expect(onChange).not.toHaveBeenCalled();
      expect(fireEvent.keyDown(field(), { key: 'Enter' })).toBe(false);
      expect(onChange).toHaveBeenCalledWith('#0080ff');
      expect(onChangeEnd).toHaveBeenCalledWith('#0080ff');
      expect(field()).toHaveValue('#0080ff');
    });

    it('previews a readable draft in the swatch', () => {
      const { container } = setup();
      fireEvent.change(field(), { target: { value: 'navy' } });
      const chip = swatchButton(container).querySelector(
        '.color-swatch'
      ) as HTMLElement;
      expect(chip.style.getPropertyValue('--color-swatch-color')).toBe('navy');
    });

    it('marks text it cannot read, keeps it on Enter, and Escape puts the value back', () => {
      const { onChange } = setup({ defaultValue: 'red' });
      fireEvent.change(field(), { target: { value: 'nope' } });
      expect(field()).toHaveAttribute('aria-invalid', 'true');
      expect(field()).toHaveClass('is-danger');
      fireEvent.keyDown(field(), { key: 'Enter' });
      expect(field()).toHaveValue('nope');
      const outer = jest.fn();
      document.addEventListener('keydown', outer);
      expect(fireEvent.keyDown(field(), { key: 'Escape' })).toBe(false);
      document.removeEventListener('keydown', outer);
      expect(outer).not.toHaveBeenCalled();
      expect(field()).toHaveValue('hsl(0, 100%, 50%)');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('leaves the field color alone while marking invalid text', () => {
      render(<ColorInput color="success" />);
      fireEvent.change(field(), { target: { value: 'nope' } });
      expect(field()).toHaveClass('is-success');
      expect(field()).not.toHaveClass('is-danger');
      expect(field()).toHaveAttribute('aria-invalid', 'true');
    });

    it('keeps an aria-invalid of its own', () => {
      render(<ColorInput aria-invalid="true" />);
      expect(field()).toHaveAttribute('aria-invalid', 'true');
    });

    it('commits on leaving the field, clears to empty, and puts back what it cannot read', () => {
      const { onChange, onChangeEnd } = setup({ defaultValue: 'red' });
      fireEvent.change(field(), { target: { value: 'zzz' } });
      fireEvent.blur(field());
      expect(field()).toHaveValue('hsl(0, 100%, 50%)');
      fireEvent.change(field(), { target: { value: '   ' } });
      fireEvent.blur(field());
      expect(field()).toHaveValue('');
      expect(onChange).toHaveBeenLastCalledWith('');
      expect(onChangeEnd).toHaveBeenLastCalledWith('');
      // Clearing an empty field again reports nothing.
      fireEvent.change(field(), { target: { value: ' ' } });
      fireEvent.blur(field());
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('keeps the panel hue for a gray typed as hex or a name, and takes one hsl() names', () => {
      render(<ColorInput defaultValue="hsl(200, 100%, 50%)" />);
      fireEvent.change(field(), { target: { value: '#808080' } });
      fireEvent.keyDown(field(), { key: 'Enter' });
      expect(field()).toHaveValue('hsl(200, 0%, 50%)');
      fireEvent.change(field(), { target: { value: 'silver' } });
      fireEvent.keyDown(field(), { key: 'Enter' });
      expect(field()).toHaveValue('hsl(200, 0%, 75%)');
      fireEvent.change(field(), { target: { value: 'hsl(300, 0%, 50%)' } });
      fireEvent.keyDown(field(), { key: 'Enter' });
      expect(field()).toHaveValue('hsl(300, 0%, 50%)');
      open();
      expect(hue()).toHaveAttribute('aria-valuetext', '300 degrees');
    });

    it('shows the hue a controlled hsl() gray names in the panel', () => {
      const { rerender } = render(<ColorInput value="hsl(100, 100%, 50%)" />);
      rerender(<ColorInput value="hsl(200, 0%, 50%)" />);
      expect(field()).toHaveValue('hsl(200, 0%, 50%)');
      open();
      expect(hue()).toHaveAttribute('aria-valuetext', '200 degrees');
    });

    it('keeps typed alpha with alpha, and needs no callbacks', () => {
      render(<ColorInput alpha format="rgb" />);
      fireEvent.change(field(), { target: { value: '#ff000080' } });
      fireEvent.keyDown(field(), { key: 'Enter' });
      expect(field()).toHaveValue('rgba(255, 0, 0, 0.5)');
    });

    it('reports only the end when the typed color is the value it has', () => {
      const { onChange, onChangeEnd } = setup({
        defaultValue: 'hsl(0, 100%, 50%)',
      });
      fireEvent.change(field(), { target: { value: 'red' } });
      fireEvent.keyDown(field(), { key: 'Enter' });
      expect(onChange).not.toHaveBeenCalled();
      expect(onChangeEnd).toHaveBeenCalledWith('hsl(0, 100%, 50%)');
    });

    it('leaves Enter, Escape and other keys alone with nothing typed', () => {
      setup();
      expect(fireEvent.keyDown(field(), { key: 'Enter' })).toBe(true);
      expect(fireEvent.keyDown(field(), { key: 'Escape' })).toBe(true);
      expect(fireEvent.keyDown(field(), { key: 'a' })).toBe(true);
      fireEvent.blur(field());
    });

    it('calls its own key, focus and blur handlers, and a prevented key does nothing more', () => {
      const onKeyDown = jest.fn((event: KeyboardEvent) => {
        if (event.key === 'ArrowDown') event.preventDefault();
      });
      const onFocus = jest.fn();
      const onBlur = jest.fn();
      setup({ onKeyDown, onFocus, onBlur });
      act(() => field().focus());
      open();
      expect(panel()).toBeNull();
      expect(onKeyDown).toHaveBeenCalled();
      expect(onFocus).toHaveBeenCalled();
      act(() => field().blur());
      expect(onBlur).toHaveBeenCalled();
    });

    it('is controlled by value', () => {
      function Controlled() {
        const [value, setValue] = useState('#1e6b99');
        return (
          <>
            <ColorInput value={value} onChange={setValue} format="hex" />
            <button onClick={() => setValue('')}>Clear</button>
          </>
        );
      }
      render(<Controlled />);
      fireEvent.change(field(), { target: { value: '#00d1b2' } });
      fireEvent.keyDown(field(), { key: 'Enter' });
      expect(field()).toHaveValue('#00d1b2');
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      expect(field()).toHaveValue('');
    });
  });

  describe('Field and Control', () => {
    it('wraps itself in a Field and a Control, with a message', () => {
      const { container } = render(
        <ColorInput
          label="Brand"
          message="Used for buttons"
          messageColor="info"
          fieldClassName="custom-field"
          controlClassName="custom-control"
          controlSize="small"
          isExpanded
          horizontal
          labelSize="small"
        />
      );
      const fieldEl = container.querySelector('.field.custom-field');
      expect(
        fieldEl?.querySelector('.control.custom-control > .colorinput')
      ).not.toBeNull();
      expect(container.querySelector('.control')).toHaveClass(
        'is-expanded',
        'is-small'
      );
      expect(screen.getByText('Used for buttons')).toHaveClass(
        'help',
        'is-info'
      );
    });

    it('is named by a Field around it, and renders none of its own', () => {
      const { container } = render(
        <Field label="Accent">
          <ColorInput />
        </Field>
      );
      expect(field()).toHaveAccessibleName('Accent');
      expect(container.querySelectorAll('.field')).toHaveLength(1);
    });

    it('renders no Control inside one, keeping the message', () => {
      const { container } = render(
        <Control>
          <ColorInput message="Help" />
        </Control>
      );
      expect(container.querySelectorAll('.control')).toHaveLength(1);
      expect(screen.getByText('Help')).toHaveClass('help');
    });

    it('uses an id of its own', () => {
      render(<ColorInput id="brand" label="Brand" />);
      expect(field()).toHaveAttribute('id', 'brand');
      expect(field()).toHaveAttribute('aria-controls', 'brand-popover');
      expect(field()).toHaveAccessibleName('Brand');
    });
  });

  describe('Server rendering', () => {
    const Input = () => (
      <ColorInput label="Brand" defaultValue="#1e6b99" swatches="bulma" />
    );

    it('hydrates without a mismatch', async () => {
      const container = document.createElement('div');
      container.innerHTML = renderToString(<Input />);
      document.body.appendChild(container);
      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      let unmountRoot = () => {};
      try {
        await act(async () => {
          const root = hydrateRoot(container, <Input />);
          unmountRoot = () => root.unmount();
        });
        expect(errorSpy).not.toHaveBeenCalled();
      } finally {
        errorSpy.mockRestore();
        await act(async () => unmountRoot());
        document.body.removeChild(container);
      }
    });
  });

  describe('Class prefix', () => {
    it('prefixes every class under ConfigProvider classPrefix', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <ColorInput label="Brand" size="small" defaultValue="red" />
        </ConfigProvider>
      );
      open();
      const classes = Array.from(document.querySelectorAll('[class]'))
        .flatMap(el => Array.from(el.classList))
        .filter(name => !name.startsWith('bestax-'))
        // Font Awesome's own classes, which no prefix reaches.
        .filter(name => !/^fa/.test(name));
      expect(classes).toEqual([]);
      expect(container.querySelector('.bestax-colorinput')).toHaveClass(
        'bestax-has-trigger'
      );
    });
  });
});
