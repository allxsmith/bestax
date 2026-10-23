import React, { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PinInput, type PinInputProps } from '../PinInput';
import { Field } from '../Field';
import { Control } from '../Control';
import { ConfigProvider } from '../../helpers/Config';

const boxesOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.pin-input-box'));

/** What the boxes show, a space for an empty one. */
const shown = (container: HTMLElement) =>
  boxesOf(container)
    .map(box => box.textContent || ' ')
    .join('');

/** The boxes drawn with the focus look. */
const focusedBoxes = (container: HTMLElement) =>
  boxesOf(container).flatMap((box, i) =>
    box.classList.contains('is-focused') ? [i] : []
  );

/** The box drawing the caret, or -1. */
const caretBox = (container: HTMLElement) =>
  boxesOf(container).findIndex(box => box.classList.contains('has-caret'));

/**
 * What a browser fires at the document when the caret moves in an input, and
 * jsdom doesn't.
 */
const selectionChanged = () =>
  act(() => {
    document.dispatchEvent(new Event('selectionchange'));
  });

const renderPin = (props: PinInputProps = {}) =>
  render(<PinInput label="Code" {...props} />);

describe('PinInput', () => {
  describe('Rendering', () => {
    it('renders one input named by its label, and a hidden box per character', () => {
      const { container } = renderPin();
      const input = screen.getByLabelText('Code');
      expect(input.tagName).toBe('INPUT');
      expect(screen.getAllByRole('textbox')).toEqual([input]);
      const boxes = boxesOf(container);
      expect(boxes).toHaveLength(6);
      for (const box of boxes) {
        expect(box).toHaveAttribute('aria-hidden', 'true');
        expect(box).toHaveClass('input', 'pin-input-box');
      }
    });

    it('sets the input up for a one-time code', () => {
      renderPin();
      const input = screen.getByLabelText('Code');
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('inputmode', 'numeric');
      expect(input).toHaveAttribute('autocomplete', 'one-time-code');
      expect(input).toHaveAttribute('maxlength', '6');
      expect(input).toHaveAttribute('spellcheck', 'false');
      expect(input).toHaveAttribute('autocorrect', 'off');
      expect(input).toHaveClass('pin-input-field');
    });

    it('lets those attributes be overridden', () => {
      renderPin({ autoComplete: 'off', inputMode: 'tel' });
      const input = screen.getByLabelText('Code');
      expect(input).toHaveAttribute('autocomplete', 'off');
      expect(input).toHaveAttribute('inputmode', 'tel');
    });

    it('draws a box for each character of length, and caps the input there', () => {
      const { container } = renderPin({ length: 4 });
      expect(boxesOf(container)).toHaveLength(4);
      expect(screen.getByLabelText('Code')).toHaveAttribute('maxlength', '4');
    });

    it('shows each character of the code in its box', () => {
      const { container } = renderPin({ defaultValue: '042' });
      expect(shown(container)).toBe('042   ');
      expect(screen.getByLabelText('Code')).toHaveValue('042');
    });

    it('puts className and the helper props on the row, the rest on the input', () => {
      const { container } = renderPin({
        className: 'custom',
        mt: '2',
        'aria-describedby': 'hint',
        placeholder: '000000',
      });
      const row = container.querySelector('.pin-input')!;
      expect(row).toHaveClass('custom', 'mt-2');
      const input = screen.getByLabelText('Code');
      expect(input).toHaveAttribute('aria-describedby', 'hint');
      expect(input).toHaveAttribute('placeholder', '000000');
      expect(input).not.toHaveClass('mt-2');
    });

    it('gives every box the color, size and rounded classes', () => {
      const { container } = renderPin({
        color: 'danger',
        size: 'large',
        isRounded: true,
      });
      for (const box of boxesOf(container)) {
        expect(box).toHaveClass('is-danger', 'is-large', 'is-rounded');
      }
    });

    it('adds no color, size or rounded class by default', () => {
      const { container } = renderPin();
      expect(boxesOf(container)[0].className).toBe('input pin-input-box');
    });
  });

  describe('Typing', () => {
    it('fills the boxes and calls onChange with the code', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = renderPin({ onChange });
      await user.type(screen.getByLabelText('Code'), '123');
      expect(onChange.mock.calls).toEqual([['1'], ['12'], ['123']]);
      expect(shown(container)).toBe('123   ');
    });

    it('drops what is not a digit, and keeps the caret where it was', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      renderPin({ defaultValue: '1234', onChange });
      const input = screen.getByLabelText('Code') as HTMLInputElement;
      await user.click(input);
      input.setSelectionRange(2, 2);
      await user.keyboard('a');
      expect(input).toHaveValue('1234');
      expect(input.selectionStart).toBe(2);
      expect(onChange).not.toHaveBeenCalled();
      await user.keyboard('9');
      expect(input).toHaveValue('12934');
      expect(onChange).toHaveBeenLastCalledWith('12934');
    });

    it('drops what is not a digit from a change with a digit in it', () => {
      const onChange = jest.fn();
      renderPin({ onChange });
      const input = screen.getByLabelText('Code') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '1-2' } });
      expect(onChange).toHaveBeenCalledWith('12');
      expect(input).toHaveValue('12');
    });

    it('takes no more than length characters', async () => {
      const user = userEvent.setup();
      const { container } = renderPin();
      await user.type(screen.getByLabelText('Code'), '1234567');
      expect(screen.getByLabelText('Code')).toHaveValue('123456');
      expect(shown(container)).toBe('123456');
    });

    it('cuts a change that comes in longer than length', () => {
      const onChange = jest.fn();
      renderPin({ length: 4, onChange });
      fireEvent.change(screen.getByLabelText('Code'), {
        target: { value: '123456' },
      });
      expect(onChange).toHaveBeenCalledWith('1234');
    });

    it('takes letters and digits with type="alphanumeric"', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = renderPin({ type: 'alphanumeric', onChange });
      const input = screen.getByLabelText('Code');
      expect(input).toHaveAttribute('inputmode', 'text');
      await user.type(input, 'aB-3 z');
      expect(onChange).toHaveBeenLastCalledWith('aB3z');
      expect(shown(container)).toBe('aB3z  ');
    });

    it('removes the character before the caret on Backspace', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = renderPin({ defaultValue: '1234', onChange });
      await user.type(screen.getByLabelText('Code'), '{Backspace}');
      expect(onChange).toHaveBeenLastCalledWith('123');
      expect(shown(container)).toBe('123   ');
    });
  });

  describe('Paste', () => {
    it('fills the boxes from a pasted code and completes it once', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const onComplete = jest.fn();
      const { container } = renderPin({ onChange, onComplete });
      await user.click(screen.getByLabelText('Code'));
      await user.paste('123456');
      expect(onChange.mock.calls).toEqual([['123456']]);
      expect(onComplete.mock.calls).toEqual([['123456']]);
      expect(shown(container)).toBe('123456');
    });

    it('keeps the digits of a code pasted with spaces or dashes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      renderPin({ onChange });
      await user.click(screen.getByLabelText('Code'));
      await user.paste(' 123-456 ');
      expect(onChange).toHaveBeenCalledWith('123456');
    });

    it('cuts an over-long paste to length', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      renderPin({ onChange });
      await user.click(screen.getByLabelText('Code'));
      await user.paste('1234567890');
      expect(onChange).toHaveBeenCalledWith('123456');
      expect(screen.getByLabelText('Code')).toHaveValue('123456');
    });

    it('replaces the whole code, wherever the caret is', async () => {
      const user = userEvent.setup();
      const { container } = renderPin({ defaultValue: '12' });
      await user.click(screen.getByLabelText('Code'));
      await user.paste('987654');
      expect(shown(container)).toBe('987654');
    });

    it('changes nothing for a paste with nothing the code takes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      renderPin({ defaultValue: '12', onChange });
      await user.click(screen.getByLabelText('Code'));
      await user.paste('abc');
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByLabelText('Code')).toHaveValue('12');
    });

    it('leaves the paste alone when your onPaste prevents it', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const onPaste = jest.fn((e: React.ClipboardEvent) => e.preventDefault());
      renderPin({ onChange, onPaste });
      await user.click(screen.getByLabelText('Code'));
      await user.paste('123456');
      expect(onPaste).toHaveBeenCalledTimes(1);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('takes no paste while read-only', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      renderPin({ readOnly: true, onChange });
      await user.click(screen.getByLabelText('Code'));
      await user.paste('123456');
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('onComplete', () => {
    it('fires once when the last box fills, and not on a later render', async () => {
      const user = userEvent.setup();
      const onComplete = jest.fn();
      const { rerender } = render(
        <PinInput label="Code" length={4} onComplete={onComplete} />
      );
      await user.type(screen.getByLabelText('Code'), '1234');
      expect(onComplete.mock.calls).toEqual([['1234']]);
      rerender(<PinInput label="Code" length={4} onComplete={onComplete} />);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('fires again for a new code typed after a correction', async () => {
      const user = userEvent.setup();
      const onComplete = jest.fn();
      renderPin({ length: 4, onComplete });
      const input = screen.getByLabelText('Code');
      await user.type(input, '1234{Backspace}5');
      expect(onComplete.mock.calls).toEqual([['1234'], ['1235']]);
    });

    it('does not fire for a value set from outside', () => {
      const onComplete = jest.fn();
      const { rerender } = render(
        <PinInput label="Code" length={4} value="12" onComplete={onComplete} />
      );
      rerender(
        <PinInput
          label="Code"
          length={4}
          value="1234"
          onComplete={onComplete}
        />
      );
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('Controlled and uncontrolled', () => {
    it('shows a controlled value and asks before changing it', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { container } = renderPin({ value: '12', onChange });
      await user.type(screen.getByLabelText('Code'), '3');
      expect(onChange).toHaveBeenCalledWith('123');
      expect(screen.getByLabelText('Code')).toHaveValue('12');
      expect(shown(container)).toBe('12    ');
    });

    it('follows the state that holds it', async () => {
      const user = userEvent.setup();
      function Held() {
        const [code, setCode] = useState('');
        return (
          <>
            <PinInput label="Code" value={code} onChange={setCode} />
            <output>{code}</output>
          </>
        );
      }
      const { container } = render(<Held />);
      await user.type(screen.getByLabelText('Code'), '42');
      expect(screen.getByRole('status')).toHaveTextContent('42');
      expect(shown(container)).toBe('42    ');
    });

    it('keeps its own code when uncontrolled', async () => {
      const user = userEvent.setup();
      const { container } = renderPin({ defaultValue: '1' });
      await user.type(screen.getByLabelText('Code'), '2');
      expect(shown(container)).toBe('12    ');
    });
  });

  describe('The boxes follow the selection', () => {
    it('marks no box until the input has focus', () => {
      const { container } = renderPin({ defaultValue: '12' });
      expect(focusedBoxes(container)).toEqual([]);
      expect(caretBox(container)).toBe(-1);
    });

    it('marks the empty box at the caret and draws the caret in it', async () => {
      const user = userEvent.setup();
      const { container } = renderPin({ defaultValue: '12' });
      await user.click(screen.getByLabelText('Code'));
      expect(focusedBoxes(container)).toEqual([2]);
      expect(caretBox(container)).toBe(2);
    });

    it('marks the last box, with no caret, once the code is full', async () => {
      const user = userEvent.setup();
      const { container } = renderPin({ length: 4 });
      await user.type(screen.getByLabelText('Code'), '1234');
      expect(focusedBoxes(container)).toEqual([3]);
      expect(caretBox(container)).toBe(-1);
    });

    it('moves with the arrow keys, and draws no caret in a filled box', async () => {
      const user = userEvent.setup();
      const { container } = renderPin({ defaultValue: '123' });
      await user.click(screen.getByLabelText('Code'));
      await user.keyboard('{ArrowLeft}{ArrowLeft}');
      selectionChanged();
      expect(focusedBoxes(container)).toEqual([1]);
      expect(caretBox(container)).toBe(-1);
      await user.keyboard('{Home}');
      selectionChanged();
      expect(focusedBoxes(container)).toEqual([0]);
    });

    it('marks every selected box', async () => {
      const user = userEvent.setup();
      const { container } = renderPin({ defaultValue: '123456' });
      const input = screen.getByLabelText('Code') as HTMLInputElement;
      await user.click(input);
      // What Shift with the Left Arrow three times leaves, which user-event
      // doesn't select itself.
      input.setSelectionRange(3, 6, 'backward');
      selectionChanged();
      expect(focusedBoxes(container)).toEqual([3, 4, 5]);
      expect(caretBox(container)).toBe(-1);
    });

    it('marks none once the input loses focus', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <>
          <PinInput label="Code" />
          <button>Next</button>
        </>
      );
      await user.click(screen.getByLabelText('Code'));
      expect(focusedBoxes(container)).toEqual([0]);
      await user.tab();
      expect(focusedBoxes(container)).toEqual([]);
    });

    it('ignores a selectionchange while the input has no focus', () => {
      const { container } = renderPin({ defaultValue: '1234' });
      const input = screen.getByLabelText('Code') as HTMLInputElement;
      input.setSelectionRange(1, 1);
      selectionChanged();
      expect(focusedBoxes(container)).toEqual([]);
    });

    it('follows a selectionchange fired at the input alone', () => {
      // Inside a shadow root, some browsers fire it there and not at the
      // document.
      const { container } = renderPin({ defaultValue: '1234' });
      const input = screen.getByLabelText('Code') as HTMLInputElement;
      act(() => input.focus());
      act(() => {
        input.setSelectionRange(1, 1);
        input.dispatchEvent(new Event('selectionchange'));
      });
      expect(focusedBoxes(container)).toEqual([1]);
    });

    it('stops listening once unmounted', () => {
      const { unmount } = renderPin();
      const input = screen.getByLabelText('Code');
      const fromInput = jest.spyOn(input, 'removeEventListener');
      const fromDocument = jest.spyOn(document, 'removeEventListener');
      try {
        unmount();
        const removed = (spy: jest.SpyInstance) =>
          spy.mock.calls.filter(([type]) => type === 'selectionchange');
        expect(removed(fromInput)).toHaveLength(1);
        expect(removed(fromDocument)).toHaveLength(1);
        expect(removed(fromInput)[0][1]).toBe(removed(fromDocument)[0][1]);
      } finally {
        fromDocument.mockRestore();
      }
    });

    it('still calls your onFocus, onBlur and onSelect', async () => {
      const user = userEvent.setup();
      const onFocus = jest.fn();
      const onBlur = jest.fn();
      const onSelect = jest.fn();
      render(
        <>
          <PinInput
            label="Code"
            defaultValue="12"
            onFocus={onFocus}
            onBlur={onBlur}
            onSelect={onSelect}
          />
          <button>Next</button>
        </>
      );
      await user.click(screen.getByLabelText('Code'));
      await user.keyboard('{ArrowLeft}');
      await user.tab();
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalled();
      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('isMasked', () => {
    it('shows a dot in each filled box and makes the input a password field', () => {
      const { container } = renderPin({ isMasked: true, defaultValue: '12' });
      expect(shown(container)).toBe('\u25CF\u25CF    ');
      expect(container.textContent).not.toContain('1');
      expect(screen.getByLabelText('Code')).toHaveAttribute('type', 'password');
    });
  });

  describe('disabled', () => {
    it('disables the input and draws every box disabled', () => {
      const { container } = renderPin({ disabled: true });
      expect(screen.getByLabelText('Code')).toBeDisabled();
      for (const box of boxesOf(container)) {
        expect(box).toHaveClass('is-disabled');
      }
    });
  });

  describe('Label, Field and Control', () => {
    it('renders its own Field and Control around the row', () => {
      const { container } = renderPin();
      const field = container.firstElementChild as HTMLElement;
      expect(field).toHaveClass('field');
      const label = field.querySelector('label.label')!;
      const input = screen.getByLabelText('Code');
      expect(label).toHaveAttribute('for', input.id);
      expect(field.querySelector(':scope > .control > .pin-input')).toBe(
        input.parentElement
      );
    });

    it('points the label at an id of your own', () => {
      renderPin({ id: 'otp' });
      expect(screen.getByLabelText('Code')).toHaveAttribute('id', 'otp');
    });

    it('takes the id a labeled Field offers, so its label names it', () => {
      const { container } = render(
        <Field label="One-time code">
          <PinInput label="Dropped" />
        </Field>
      );
      expect(screen.getByLabelText('One-time code')).toHaveClass(
        'pin-input-field'
      );
      expect(screen.queryByText('Dropped')).toBeNull();
      expect(container.querySelectorAll('.field')).toHaveLength(1);
    });

    it('renders no Control of its own inside one', () => {
      const { container } = render(
        <Field label="Code">
          <Control>
            <PinInput />
          </Control>
        </Field>
      );
      expect(container.querySelectorAll('.control')).toHaveLength(1);
      expect(screen.getByLabelText('Code')).toHaveClass('pin-input-field');
    });

    it('renders a message in its color, and a horizontal Field', () => {
      const { container } = renderPin({
        message: 'Check your messages',
        messageColor: 'info',
        horizontal: true,
        labelSize: 'normal',
        fieldClassName: 'custom-field',
      });
      expect(screen.getByText('Check your messages')).toHaveClass(
        'help',
        'is-info'
      );
      expect(container.firstElementChild).toHaveClass(
        'field',
        'is-horizontal',
        'custom-field'
      );
    });

    it('renders the message after the row inside a Field', () => {
      render(
        <Field label="Code">
          <PinInput message="Six digits" />
        </Field>
      );
      expect(screen.getByText('Six digits')).toHaveClass('help');
    });
  });

  describe('In a form', () => {
    it('submits the code under its name', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        return new FormData(e.currentTarget).get('otp');
      });
      render(
        <form onSubmit={onSubmit}>
          <PinInput label="Code" name="otp" length={4} />
          <button type="submit">Verify</button>
        </form>
      );
      await user.type(screen.getByLabelText('Code'), '2468');
      await user.click(screen.getByRole('button', { name: 'Verify' }));
      expect(onSubmit.mock.results[0].value).toBe('2468');
    });
  });

  describe('Ref forwarding', () => {
    it('forwards an object ref to the input', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<PinInput label="Code" ref={ref} />);
      expect(ref.current).toBe(screen.getByLabelText('Code'));
    });

    it('forwards a callback ref to the input', () => {
      const ref = jest.fn();
      render(<PinInput label="Code" ref={ref} />);
      expect(ref).toHaveBeenCalledWith(screen.getByLabelText('Code'));
    });
  });

  describe('Right to left', () => {
    it('keeps the row and the input left to right on a right-to-left page', () => {
      const { container } = render(
        <div dir="rtl">
          <PinInput label="رمز" defaultValue="12" />
        </div>
      );
      const row = container.querySelector('.pin-input')!;
      expect(row).toHaveAttribute('dir', 'ltr');
      expect(screen.getByLabelText('رمز').closest('[dir]')).toBe(row);
      expect(shown(container)).toBe('12    ');
    });
  });

  describe('ConfigProvider classPrefix', () => {
    it('prefixes every class it renders', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <PinInput
            label="Code"
            color="primary"
            size="small"
            isRounded
            message="Help"
          />
        </ConfigProvider>
      );
      const row = container.querySelector('.bestax-pin-input')!;
      expect(row).not.toBeNull();
      expect(row.closest('.bestax-control')).not.toBeNull();
      expect(container.querySelector('.bestax-pin-input-field')).not.toBeNull();
      expect(container.querySelectorAll('.bestax-pin-input-box')).toHaveLength(
        6
      );
      expect(container.querySelector('.bestax-pin-input-box')).toHaveClass(
        'bestax-input',
        'bestax-is-primary',
        'bestax-is-small',
        'bestax-is-rounded'
      );
      expect(container.querySelector('.pin-input')).toBeNull();
    });
  });
});
