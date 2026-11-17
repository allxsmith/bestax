import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Numberinput, NumberInput } from '../Numberinput';
import { Field } from '../Field';
import { Control } from '../Control';

describe('Numberinput', () => {
  describe('Rendering', () => {
    it('renders with default value', () => {
      render(<Numberinput defaultValue={5} />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(5);
    });

    it('renders with controlled value', () => {
      render(<Numberinput value={10} onChange={() => {}} />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(10);
    });

    it('renders increment and decrement buttons by default', () => {
      render(<Numberinput defaultValue={5} />);
      expect(
        screen.getByRole('button', { name: /increase/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /decrease/i })
      ).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <Numberinput defaultValue={5} className="custom-class" />
      );
      expect(container.querySelector('.numberinput')).toHaveClass(
        'custom-class'
      );
    });

    it('applies numberinput and field classes', () => {
      const { container } = render(<Numberinput defaultValue={5} />);
      const numberinput = container.querySelector('.numberinput');
      expect(numberinput).toHaveClass('numberinput');
      expect(numberinput).toHaveClass('field');
      expect(numberinput).toHaveClass('is-grouped');
    });
  });

  describe('Value Changes', () => {
    it('increments value when + button clicked', async () => {
      const handleChange = vi.fn();
      render(<Numberinput value={5} onChange={handleChange} />);

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      expect(handleChange).toHaveBeenCalledWith(6);
    });

    it('decrements value when - button clicked', async () => {
      const handleChange = vi.fn();
      render(<Numberinput value={5} onChange={handleChange} />);

      const decrementBtn = screen.getByRole('button', { name: /decrease/i });
      await userEvent.click(decrementBtn);

      expect(handleChange).toHaveBeenCalledWith(4);
    });

    it('respects step value when incrementing', async () => {
      const handleChange = vi.fn();
      render(<Numberinput value={10} step={5} onChange={handleChange} />);

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      expect(handleChange).toHaveBeenCalledWith(15);
    });

    it('respects step value when decrementing', async () => {
      const handleChange = vi.fn();
      render(<Numberinput value={10} step={5} onChange={handleChange} />);

      const decrementBtn = screen.getByRole('button', { name: /decrease/i });
      await userEvent.click(decrementBtn);

      expect(handleChange).toHaveBeenCalledWith(5);
    });

    it('calls onChange when input value changes', () => {
      const handleChange = vi.fn();
      render(<Numberinput value={5} onChange={handleChange} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '10' } });

      expect(handleChange).toHaveBeenCalledWith(10);
    });

    it('updates uncontrolled value internally', async () => {
      render(<Numberinput defaultValue={5} />);

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(6);
    });
  });

  describe('Min/Max Constraints', () => {
    it('clamps value to min', async () => {
      const handleChange = vi.fn();
      render(<Numberinput value={1} min={0} onChange={handleChange} />);

      const decrementBtn = screen.getByRole('button', { name: /decrease/i });
      await userEvent.click(decrementBtn);

      expect(handleChange).toHaveBeenCalledWith(0);
    });

    it('clamps value to max', async () => {
      const handleChange = vi.fn();
      render(<Numberinput value={9} max={10} onChange={handleChange} />);

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      expect(handleChange).toHaveBeenCalledWith(10);
    });

    it('disables decrement button at min', () => {
      render(<Numberinput value={0} min={0} onChange={() => {}} />);

      const decrementBtn = screen.getByRole('button', { name: /decrease/i });
      expect(decrementBtn).toBeDisabled();
    });

    it('disables increment button at max', () => {
      render(<Numberinput value={10} max={10} onChange={() => {}} />);

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      expect(incrementBtn).toBeDisabled();
    });

    it('does not disable buttons when within range', () => {
      render(<Numberinput value={5} min={0} max={10} onChange={() => {}} />);

      expect(
        screen.getByRole('button', { name: /increase/i })
      ).not.toBeDisabled();
      expect(
        screen.getByRole('button', { name: /decrease/i })
      ).not.toBeDisabled();
    });

    it('clamps below-min value during decrement (covers if-true min branch)', async () => {
      const handleChange = vi.fn();
      // step=2, value=1, min=0 -> decrement gives -1 -> clamp to 0.
      render(
        <Numberinput value={1} min={0} step={2} onChange={handleChange} />
      );
      const decrementBtn = screen.getByRole('button', { name: /decrease/i });
      await userEvent.click(decrementBtn);
      expect(handleChange).toHaveBeenCalledWith(0);
    });

    it('clamps above-max value during increment (covers if-true max branch)', async () => {
      const handleChange = vi.fn();
      // step=2, value=9, max=10 -> increment gives 11 -> clamp to 10.
      render(
        <Numberinput value={9} max={10} step={2} onChange={handleChange} />
      );
      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);
      expect(handleChange).toHaveBeenCalledWith(10);
    });

    it('decrement falls back to 0 when value is undefined (covers ?? falsy branch)', async () => {
      const handleChange = vi.fn();
      // No defaultValue, no value -> internal currentValue is undefined.
      // Decrement should treat it as 0 - 1 = -1.
      render(<Numberinput onChange={handleChange} />);
      const decrementBtn = screen.getByRole('button', { name: /decrease/i });
      await userEvent.click(decrementBtn);
      expect(handleChange).toHaveBeenCalledWith(-1);
    });
  });

  describe('Sizes', () => {
    it('applies small size class', () => {
      const { container } = render(
        <Numberinput defaultValue={5} size="small" />
      );
      expect(container.querySelector('.numberinput')).toHaveClass('is-small');
    });

    it('applies medium size class', () => {
      const { container } = render(
        <Numberinput defaultValue={5} size="medium" />
      );
      expect(container.querySelector('.numberinput')).toHaveClass('is-medium');
    });

    it('applies large size class', () => {
      const { container } = render(
        <Numberinput defaultValue={5} size="large" />
      );
      expect(container.querySelector('.numberinput')).toHaveClass('is-large');
    });

    it('applies size class to buttons', () => {
      render(<Numberinput defaultValue={5} size="large" />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('is-large');
      });
    });
  });

  describe('Colors', () => {
    it('applies primary color to buttons', () => {
      render(<Numberinput defaultValue={5} color="primary" />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('is-primary');
      });
    });

    it('applies success color to buttons', () => {
      render(<Numberinput defaultValue={5} color="success" />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('is-success');
      });
    });

    it('applies danger color to buttons', () => {
      render(<Numberinput defaultValue={5} color="danger" />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('is-danger');
      });
    });

    it('applies warning color to buttons', () => {
      render(<Numberinput defaultValue={5} color="warning" />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('is-warning');
      });
    });

    it('applies info color to buttons', () => {
      render(<Numberinput defaultValue={5} color="info" />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('is-info');
      });
    });

    it('applies link color to buttons', () => {
      render(<Numberinput defaultValue={5} color="link" />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('is-link');
      });
    });
  });

  describe('Controls Position', () => {
    it('uses is-grouped by default (both sides)', () => {
      const { container } = render(<Numberinput defaultValue={5} />);
      const numberinput = container.querySelector('.numberinput');
      expect(numberinput).toHaveClass('is-grouped');
      expect(numberinput).not.toHaveClass('controls-left');
      expect(numberinput).not.toHaveClass('controls-right');
    });

    it('applies controls-left class', () => {
      const { container } = render(
        <Numberinput defaultValue={5} controlsPosition="left" />
      );
      expect(container.querySelector('.numberinput')).toHaveClass(
        'controls-left'
      );
    });

    it('applies controls-right class', () => {
      const { container } = render(
        <Numberinput defaultValue={5} controlsPosition="right" />
      );
      expect(container.querySelector('.numberinput')).toHaveClass(
        'controls-right'
      );
    });

    it('renders both buttons on left when controlsPosition is left', () => {
      const { container } = render(
        <Numberinput defaultValue={5} controlsPosition="left" />
      );
      const controls = container.querySelectorAll('.control');
      // [dec control] [inc control] [input control]
      expect(controls).toHaveLength(3);
      expect(controls[0].querySelector('button')).toHaveAttribute(
        'aria-label',
        'Decrease value'
      );
      expect(controls[1].querySelector('button')).toHaveAttribute(
        'aria-label',
        'Increase value'
      );
      expect(controls[2].querySelector('input')).toBeInTheDocument();
    });

    it('renders both buttons on right when controlsPosition is right', () => {
      const { container } = render(
        <Numberinput defaultValue={5} controlsPosition="right" />
      );
      const controls = container.querySelectorAll('.control');
      // [input control] [dec control] [inc control]
      expect(controls).toHaveLength(3);
      expect(controls[0].querySelector('input')).toBeInTheDocument();
      expect(controls[1].querySelector('button')).toHaveAttribute(
        'aria-label',
        'Decrease value'
      );
      expect(controls[2].querySelector('button')).toHaveAttribute(
        'aria-label',
        'Increase value'
      );
    });

    it('renders default order: dec, input, inc', () => {
      const { container } = render(<Numberinput defaultValue={5} />);
      const controls = container.querySelectorAll('.control');
      expect(controls).toHaveLength(3);
      expect(controls[0].querySelector('button')).toHaveAttribute(
        'aria-label',
        'Decrease value'
      );
      expect(controls[1].querySelector('input')).toBeInTheDocument();
      expect(controls[2].querySelector('button')).toHaveAttribute(
        'aria-label',
        'Increase value'
      );
    });
  });

  describe('Compact Mode', () => {
    it('applies has-addons and is-compact classes', () => {
      const { container } = render(<Numberinput defaultValue={5} compact />);
      const numberinput = container.querySelector('.numberinput');
      expect(numberinput).toHaveClass('has-addons');
      expect(numberinput).toHaveClass('is-compact');
      expect(numberinput).not.toHaveClass('is-grouped');
    });
  });

  describe('Stepper Variant', () => {
    it('applies is-stepper and is-compact classes', () => {
      const { container } = render(
        <Numberinput defaultValue={5} variant="stepper" />
      );
      const numberinput = container.querySelector('.numberinput');
      expect(numberinput).toHaveClass('is-stepper');
      expect(numberinput).toHaveClass('is-compact');
      expect(numberinput).toHaveClass('has-addons');
    });

    it('renders stepper buttons with chevron SVGs', () => {
      const { container } = render(
        <Numberinput defaultValue={5} variant="stepper" />
      );
      const stepperButtons = container.querySelectorAll(
        '.numberinput-stepper-button'
      );
      expect(stepperButtons).toHaveLength(2);
      expect(stepperButtons[0]).toHaveAttribute('aria-label', 'Increase value');
      expect(stepperButtons[1]).toHaveAttribute('aria-label', 'Decrease value');
      // Each button should contain an SVG
      stepperButtons.forEach(btn => {
        expect(btn.querySelector('svg')).toBeInTheDocument();
      });
    });

    it('increments via stepper up button', async () => {
      const handleChange = vi.fn();
      render(
        <Numberinput value={5} variant="stepper" onChange={handleChange} />
      );

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      expect(handleChange).toHaveBeenCalledWith(6);
    });

    it('decrements via stepper down button', async () => {
      const handleChange = vi.fn();
      render(
        <Numberinput value={5} variant="stepper" onChange={handleChange} />
      );

      const decrementBtn = screen.getByRole('button', { name: /decrease/i });
      await userEvent.click(decrementBtn);

      expect(handleChange).toHaveBeenCalledWith(4);
    });

    it('renders stepper container', () => {
      const { container } = render(
        <Numberinput defaultValue={5} variant="stepper" />
      );
      expect(
        container.querySelector('.numberinput-stepper')
      ).toBeInTheDocument();
    });

    it('renders input before stepper (always right-aligned)', () => {
      const { container } = render(
        <Numberinput defaultValue={5} variant="stepper" />
      );
      const controls = container.querySelectorAll('.control');
      expect(controls).toHaveLength(2);
      expect(controls[0].querySelector('input')).toBeInTheDocument();
      expect(
        controls[1].querySelector('.numberinput-stepper')
      ).toBeInTheDocument();
    });
  });

  describe('Rounded Buttons', () => {
    it('applies rounded class to buttons when controlsRounded is true', () => {
      render(<Numberinput defaultValue={5} controlsRounded />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('is-rounded');
      });
    });

    it('does not apply rounded class by default', () => {
      render(<Numberinput defaultValue={5} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveClass('is-rounded');
      });
    });
  });

  describe('Disabled State', () => {
    it('disables all buttons when disabled', () => {
      render(<Numberinput defaultValue={5} disabled />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('disables input when disabled', () => {
      render(<Numberinput defaultValue={5} disabled />);
      const input = screen.getByRole('spinbutton');
      expect(input).toBeDisabled();
    });

    it('applies is-disabled class to container', () => {
      const { container } = render(<Numberinput defaultValue={5} disabled />);
      expect(container.querySelector('.numberinput')).toHaveClass(
        'is-disabled'
      );
    });

    it('disables stepper buttons when disabled', () => {
      render(<Numberinput defaultValue={5} variant="stepper" disabled />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Editable', () => {
    it('makes input readonly when editable is false', () => {
      render(<Numberinput defaultValue={5} editable={false} />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('readonly');
    });

    // #1978: the documented behavior, that only typing stops.
    it('still steps with the arrow keys and the buttons when not editable', async () => {
      const user = userEvent.setup();
      render(<Numberinput label="Seats" defaultValue={5} editable={false} />);
      const input = screen.getByRole('spinbutton', { name: 'Seats' });
      input.focus();
      await user.keyboard('{ArrowUp}');
      expect(input).toHaveValue(6);
      await user.click(screen.getByRole('button', { name: 'Decrease value' }));
      expect(input).toHaveValue(5);
    });

    it('allows typing by default', () => {
      render(<Numberinput defaultValue={5} />);
      const input = screen.getByRole('spinbutton');
      expect(input).not.toHaveAttribute('readonly');
    });
  });

  describe('Keyboard Support', () => {
    it('increments on ArrowUp', () => {
      const handleChange = vi.fn();
      render(<Numberinput value={5} onChange={handleChange} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(handleChange).toHaveBeenCalledWith(6);
    });

    it('decrements on ArrowDown', () => {
      const handleChange = vi.fn();
      render(<Numberinput value={5} onChange={handleChange} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(handleChange).toHaveBeenCalledWith(4);
    });

    it('respects step on keyboard navigation', () => {
      const handleChange = vi.fn();
      render(<Numberinput value={10} step={5} onChange={handleChange} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(handleChange).toHaveBeenCalledWith(15);
    });

    it('supports keyboard in stepper variant', () => {
      const handleChange = vi.fn();
      render(
        <Numberinput value={5} variant="stepper" onChange={handleChange} />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(handleChange).toHaveBeenCalledWith(6);
    });
  });

  describe('Accessibility', () => {
    it('has aria-valuenow attribute', () => {
      render(<Numberinput value={5} onChange={() => {}} />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('aria-valuenow', '5');
    });

    it('has aria-valuemin attribute when min is set', () => {
      render(<Numberinput value={5} min={0} onChange={() => {}} />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('aria-valuemin', '0');
    });

    it('has aria-valuemax attribute when max is set', () => {
      render(<Numberinput value={5} max={10} onChange={() => {}} />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('aria-valuemax', '10');
    });

    it('buttons have aria-labels', () => {
      render(<Numberinput defaultValue={5} />);
      expect(
        screen.getByRole('button', { name: /increase/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /decrease/i })
      ).toBeInTheDocument();
    });

    it('buttons have tabIndex -1, out of the Tab order', () => {
      render(<Numberinput defaultValue={5} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabindex', '-1');
      });
    });

    // #1971: tabIndex -1 keeps a button out of the Tab order, but a click
    // still focused it, so the arrow keys stopped working, and a button that
    // disabled at a limit took focus with it.
    it.each(['plusminus', 'stepper'] as const)(
      'keeps focus in the input when a %s button is clicked',
      async variant => {
        const user = userEvent.setup();
        render(
          <Numberinput
            label="Quantity"
            defaultValue={8}
            max={10}
            variant={variant}
          />
        );
        const input = screen.getByRole('spinbutton', { name: 'Quantity' });
        const increase = screen.getByRole('button', { name: 'Increase value' });
        input.focus();
        await user.click(increase);
        expect(input).toHaveFocus();
        await user.click(increase);
        expect(increase).toBeDisabled();
        expect(input).toHaveFocus();
        await user.keyboard('{ArrowDown}');
        expect(input).toHaveValue(9);
        await user.click(
          screen.getByRole('button', { name: 'Decrease value' })
        );
        expect(input).toHaveFocus();
      }
    );

    it('cancels the mouse down on every button', () => {
      render(<Numberinput defaultValue={5} />);
      render(<Numberinput defaultValue={5} variant="stepper" />);
      for (const button of screen.getAllByRole('button')) {
        expect(fireEvent.mouseDown(button)).toBe(false);
      }
    });

    // #1975: the buttons' names can be translated.
    it.each(['plusminus', 'stepper'] as const)(
      'names the %s buttons from labels',
      variant => {
        render(
          <Numberinput
            variant={variant}
            labels={{ increase: 'Augmenter', decrease: 'Diminuer' }}
          />
        );
        expect(
          screen.getByRole('button', { name: 'Augmenter' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: 'Diminuer' })
        ).toBeInTheDocument();
      }
    );

    it('keeps the English name for a label left out or empty', () => {
      render(<Numberinput labels={{ increase: 'Augmenter' }} />);
      render(<Numberinput labels={{ decrease: 'Diminuer' }} />);
      render(
        <Numberinput
          variant="stepper"
          labels={{ increase: '', decrease: '' }}
        />
      );
      expect(
        screen.getAllByRole('button', { name: 'Decrease value' })
      ).toHaveLength(2);
      expect(
        screen.getAllByRole('button', { name: 'Increase value' })
      ).toHaveLength(2);
    });

    it('stepper buttons have tabIndex -1', () => {
      render(<Numberinput defaultValue={5} variant="stepper" />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabindex', '-1');
      });
    });
  });

  // #1976: deleting the last digit put the value straight back, so the
  // field could never be cleared to type a new number.
  describe('Editing', () => {
    it('empties on Backspace and takes a new number', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Numberinput label="Quantity" defaultValue={8} onChange={onChange} />
      );
      const input = screen.getByRole('spinbutton', { name: 'Quantity' });
      await user.click(input);
      await user.keyboard('{End}{Backspace}');
      expect(input).toHaveValue(null);
      expect(onChange).not.toHaveBeenCalled();
      await user.keyboard('3');
      expect(input).toHaveValue(3);
      expect(onChange).toHaveBeenLastCalledWith(3);
    });

    it('takes a number typed over a selected one', async () => {
      const user = userEvent.setup();
      render(<Numberinput label="Quantity" defaultValue={8} />);
      const input = screen.getByRole('spinbutton', { name: 'Quantity' });
      await user.tripleClick(input);
      await user.keyboard('5');
      expect(input).toHaveValue(5);
    });

    it('puts the last value back when left empty', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onBlur = vi.fn();
      render(
        <Numberinput
          label="Quantity"
          value={8}
          onChange={onChange}
          onBlur={onBlur}
        />
      );
      const input = screen.getByRole('spinbutton', { name: 'Quantity' });
      await user.click(input);
      await user.clear(input);
      expect(input).toHaveValue(null);
      await user.tab();
      expect(input).toHaveValue(8);
      expect(onChange).not.toHaveBeenCalled();
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('submits the last value when Enter is pressed in an emptied field', async () => {
      const user = userEvent.setup();
      let submitted: FormDataEntryValue | null = null;
      render(
        <form
          onSubmit={event => {
            event.preventDefault();
            submitted = new FormData(event.currentTarget).get('qty');
          }}
        >
          <Numberinput label="Quantity" name="qty" defaultValue={8} />
          <button type="submit">Save</button>
        </form>
      );
      const input = screen.getByRole('spinbutton', { name: 'Quantity' });
      await user.click(input);
      await user.clear(input);
      await user.keyboard('{Enter}');
      expect(submitted).toBe('8');
      expect(input).toHaveValue(8);
    });

    it('shows a new value set from outside over a draft', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Numberinput label="Quantity" value={8} onChange={() => {}} />
      );
      const input = screen.getByRole('spinbutton', { name: 'Quantity' });
      await user.click(input);
      await user.clear(input);
      expect(input).toHaveValue(null);
      rerender(<Numberinput label="Quantity" value={20} onChange={() => {}} />);
      expect(input).toHaveValue(20);
    });

    it('keeps a value set from outside after it changes back', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Numberinput label="Quantity" value={8} onChange={() => {}} />
      );
      const input = screen.getByRole('spinbutton', { name: 'Quantity' });
      await user.click(input);
      await user.clear(input);
      rerender(<Numberinput label="Quantity" value={20} onChange={() => {}} />);
      rerender(<Numberinput label="Quantity" value={8} onChange={() => {}} />);
      expect(input).toHaveValue(8);
      expect(input).toHaveAttribute('aria-valuenow', '8');
    });

    it("puts the last value back on Enter beside a caller's onKeyDown", async () => {
      const user = userEvent.setup();
      const onKeyDown = vi.fn();
      render(
        <Numberinput label="Quantity" defaultValue={8} onKeyDown={onKeyDown} />
      );
      const input = screen.getByRole('spinbutton', { name: 'Quantity' });
      await user.click(input);
      await user.clear(input);
      expect(input).not.toHaveAttribute('aria-valuenow');
      await user.keyboard('{Enter}');
      expect(input).toHaveValue(8);
      expect(onKeyDown).toHaveBeenCalled();
    });

    it("gives a caller's onBlur the value it puts back", async () => {
      const user = userEvent.setup();
      let seen = '';
      render(
        <Numberinput
          label="Quantity"
          defaultValue={8}
          onBlur={event => {
            seen = event.target.value;
          }}
        />
      );
      const input = screen.getByRole('spinbutton', { name: 'Quantity' });
      await user.click(input);
      await user.clear(input);
      await user.tab();
      expect(seen).toBe('8');
    });

    it('waits for a number after a lone minus sign', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Numberinput label="Change" defaultValue={3} onChange={onChange} />
      );
      const input = screen.getByRole('spinbutton', { name: 'Change' });
      await user.tripleClick(input);
      await user.keyboard('-');
      expect(onChange).not.toHaveBeenCalled();
      await user.keyboard('5');
      expect(onChange).toHaveBeenLastCalledWith(-5);
      expect(input).toHaveValue(-5);
    });

    it('steps from the last value while empty', async () => {
      const user = userEvent.setup();
      render(<Numberinput label="Quantity" defaultValue={8} />);
      const input = screen.getByRole('spinbutton', { name: 'Quantity' });
      await user.click(input);
      await user.clear(input);
      await user.keyboard('{ArrowUp}');
      expect(input).toHaveValue(9);
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Numberinput defaultValue={5} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('can focus input via ref', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Numberinput defaultValue={5} ref={ref} />);
      ref.current?.focus();
      expect(document.activeElement).toBe(ref.current);
    });
  });

  describe('Decimal Values', () => {
    it('handles decimal step values', async () => {
      const handleChange = vi.fn();
      render(<Numberinput value={1} step={0.5} onChange={handleChange} />);

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      expect(handleChange).toHaveBeenCalledWith(1.5);
    });

    it('handles decimal input values', () => {
      const handleChange = vi.fn();
      render(<Numberinput value={1} onChange={handleChange} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '2.5' } });

      expect(handleChange).toHaveBeenCalledWith(2.5);
    });
  });

  describe('Loading State', () => {
    it('applies is-loading class to control div when isLoading is true', () => {
      const { container } = render(<Numberinput defaultValue={5} isLoading />);
      const expandedControl = container.querySelector('.control.is-expanded');
      expect(expandedControl).toHaveClass('is-loading');
    });

    it('does not apply is-loading class by default', () => {
      const { container } = render(<Numberinput defaultValue={5} />);
      const expandedControl = container.querySelector('.control.is-expanded');
      expect(expandedControl).not.toHaveClass('is-loading');
    });
  });

  describe('Input Color', () => {
    it('applies is-danger class to input when inputColor is danger', () => {
      render(<Numberinput defaultValue={5} inputColor="danger" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveClass('is-danger');
    });

    it('applies is-success class to input when inputColor is success', () => {
      render(<Numberinput defaultValue={5} inputColor="success" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveClass('is-success');
    });

    it('does not apply input color class by default', () => {
      render(<Numberinput defaultValue={5} />);
      const input = screen.getByRole('spinbutton');
      expect(input).not.toHaveClass('is-danger');
      expect(input).not.toHaveClass('is-success');
    });
  });

  describe('Exponential Step', () => {
    it('uses normal step when exponential is false', async () => {
      const handleChange = vi.fn();
      render(<Numberinput value={10} step={1} onChange={handleChange} />);

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      expect(handleChange).toHaveBeenCalledWith(11);
    });

    it('scales step with value magnitude when exponential is true', async () => {
      const handleChange = vi.fn();
      render(
        <Numberinput value={10} step={1} exponential onChange={handleChange} />
      );

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      // effectiveStep = 1 * max(1, floor(abs(10))) = 10
      expect(handleChange).toHaveBeenCalledWith(20);
    });

    it('uses minimum step of 1 at value 0 when exponential', async () => {
      const handleChange = vi.fn();
      render(
        <Numberinput value={0} step={1} exponential onChange={handleChange} />
      );

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      // effectiveStep = 1 * max(1, floor(abs(0))) = 1 * max(1, 0) = 1
      expect(handleChange).toHaveBeenCalledWith(1);
    });

    it('scales step with negative value magnitude when exponential', async () => {
      const handleChange = vi.fn();
      render(
        <Numberinput value={-5} step={1} exponential onChange={handleChange} />
      );

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      // effectiveStep = 1 * max(1, floor(abs(-5))) = 1 * 5 = 5
      expect(handleChange).toHaveBeenCalledWith(0);
    });
  });

  describe('Light and Dark Colors', () => {
    it('applies is-light class to buttons', () => {
      render(<Numberinput defaultValue={5} color="light" />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('is-light');
      });
    });

    it('applies is-dark class to buttons', () => {
      render(<Numberinput defaultValue={5} color="dark" />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('is-dark');
      });
    });
  });

  describe('Bare Mode', () => {
    it('renders without field wrapper in bare mode', () => {
      const { container } = render(<Numberinput defaultValue={5} bare />);
      expect(container.firstChild).not.toHaveClass('field');
      expect(container.firstChild).toHaveClass('numberinput');
      expect(container.firstChild).toHaveStyle({ display: 'contents' });
    });

    it('renders controls as layout children', () => {
      const { container } = render(<Numberinput defaultValue={5} bare />);
      const controls = container.querySelectorAll('.control');
      expect(controls).toHaveLength(3);
    });

    it('still functions in bare mode (increment/decrement)', async () => {
      const handleChange = vi.fn();
      render(<Numberinput value={5} bare onChange={handleChange} />);

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);
      expect(handleChange).toHaveBeenCalledWith(6);

      handleChange.mockClear();
      const decrementBtn = screen.getByRole('button', { name: /decrease/i });
      await userEvent.click(decrementBtn);
      expect(handleChange).toHaveBeenCalledWith(4);
    });

    it('renders bare mode with controls on the left in dec/inc/input order', () => {
      const { container } = render(
        <Numberinput defaultValue={5} bare controlsPosition="left" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('numberinput');
      expect(wrapper).toHaveClass('controls-left');
      expect(wrapper).toHaveStyle({ display: 'contents' });
      const controls = wrapper.querySelectorAll('.control');
      expect(controls).toHaveLength(3);
      expect(controls[0].querySelector('button')).toHaveAttribute(
        'aria-label',
        'Decrease value'
      );
      expect(controls[1].querySelector('button')).toHaveAttribute(
        'aria-label',
        'Increase value'
      );
      expect(controls[2].querySelector('input')).toBeInTheDocument();
    });

    it('renders bare mode with controls on the right in input/dec/inc order', () => {
      const { container } = render(
        <Numberinput defaultValue={5} bare controlsPosition="right" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('numberinput');
      expect(wrapper).toHaveClass('controls-right');
      expect(wrapper).toHaveStyle({ display: 'contents' });
      const controls = wrapper.querySelectorAll('.control');
      expect(controls).toHaveLength(3);
      expect(controls[0].querySelector('input')).toBeInTheDocument();
      expect(controls[1].querySelector('button')).toHaveAttribute(
        'aria-label',
        'Decrease value'
      );
      expect(controls[2].querySelector('button')).toHaveAttribute(
        'aria-label',
        'Increase value'
      );
    });

    // A `.control` stacks its children, so bare controls inside one sit in a
    // column instead of joining the Field's row.
    it.each([
      ['plusminus', {}, 'is-grouped'],
      ['compact', { compact: true }, 'has-addons'],
    ])(
      'keeps its own %s row inside Field > Control',
      (_name, props, rowClass) => {
        const { container } = render(
          <Field>
            <Control>
              <Numberinput defaultValue={5} {...props} />
            </Control>
          </Field>
        );
        const root = container.querySelector('.numberinput') as HTMLElement;
        expect(root.parentElement).toHaveClass('control');
        expect(root).toHaveClass('field', rowClass);
        expect(root).not.toHaveStyle({ display: 'contents' });
        expect(root.querySelectorAll(':scope > .control')).toHaveLength(3);
        expect(container.querySelectorAll('.field')).toHaveLength(2);
      }
    );

    it('still goes bare inside Field > Control when bare is set', () => {
      const { container } = render(
        <Field>
          <Control>
            <Numberinput defaultValue={5} bare />
          </Control>
        </Field>
      );
      const root = container.querySelector('.numberinput') as HTMLElement;
      expect(root).not.toHaveClass('field');
      expect(root).toHaveStyle({ display: 'contents' });
    });

    // The docs and stories pass `bare={false}` where the Field lays out no row.
    it.each([
      [
        'a plain Field',
        (child: React.ReactElement) => <Field>{child}</Field>,
        'field',
      ],
      [
        'Field.Body',
        (child: React.ReactElement) => (
          <Field horizontal label="Quantity">
            <Field.Body>{child}</Field.Body>
          </Field>
        ),
        'field-body',
      ],
    ])(
      'keeps its own row in %s when bare is false',
      (_name, wrap, parentClass) => {
        const { container } = render(
          wrap(<Numberinput defaultValue={5} bare={false} />)
        );
        const root = container.querySelector('.numberinput') as HTMLElement;
        expect(root.parentElement).toHaveClass(parentClass);
        expect(root).toHaveClass('field', 'is-grouped');
        expect(root).not.toHaveStyle({ display: 'contents' });
        expect(root.querySelectorAll(':scope > .control')).toHaveLength(3);
      }
    );

    it('still joins the row of a Field it sits in directly', () => {
      const { container } = render(
        <Field hasAddons>
          <Numberinput defaultValue={5} />
        </Field>
      );
      const root = container.querySelector('.numberinput') as HTMLElement;
      expect(root.parentElement).toHaveClass('field', 'has-addons');
      expect(root).not.toHaveClass('field');
      expect(root).toHaveStyle({ display: 'contents' });
    });

    it('keeps its Field and row in a Control with no Field around it', () => {
      const { container } = render(
        <Control>
          <Numberinput defaultValue={5} />
        </Control>
      );
      const root = container.querySelector('.numberinput') as HTMLElement;
      expect(root).toHaveClass('field', 'is-grouped');
      expect(root.parentElement).toHaveClass('field');
      expect(root.parentElement?.parentElement).toHaveClass('control');
    });
  });

  describe('Message (help text)', () => {
    it('renders message as a help paragraph', () => {
      const { container } = render(
        <Numberinput defaultValue={5} message="Helpful hint" />
      );
      const help = container.querySelector('p.help');
      expect(help).toBeInTheDocument();
      expect(help).toHaveTextContent('Helpful hint');
    });

    it('applies messageColor class to help paragraph', () => {
      const { container } = render(
        <Numberinput
          defaultValue={5}
          message="Bad value"
          messageColor="danger"
        />
      );
      const help = container.querySelector('p.help');
      expect(help).toHaveClass('is-danger');
    });

    it('renders message inline (no extra Field) when inside an existing Field', () => {
      const { container } = render(
        <Field>
          <Numberinput defaultValue={5} bare={false} message="Inline help" />
        </Field>
      );
      // Only one .field wrapper — the outer Field — and the help is inside it.
      const fields = container.querySelectorAll('.field');
      // The Numberinput itself adds .field class to its wrapper too,
      // but since insideField=true and bare=false, no extra <Field> is rendered.
      // We just assert the help text is present once.
      expect(fields.length).toBeGreaterThanOrEqual(1);
      const helps = container.querySelectorAll('p.help');
      expect(helps).toHaveLength(1);
      expect(helps[0]).toHaveTextContent('Inline help');
    });

    it('renders stepper message inline when inside an existing Field', () => {
      const { container } = render(
        <Field>
          <Numberinput
            defaultValue={5}
            variant="stepper"
            message="Stepper hint"
          />
        </Field>
      );
      const helps = container.querySelectorAll('p.help');
      expect(helps).toHaveLength(1);
      expect(helps[0]).toHaveTextContent('Stepper hint');
    });
  });

  describe('Combined Ref Callback', () => {
    it('invokes function refs with the input node', () => {
      const refFn = vi.fn();
      render(<Numberinput defaultValue={5} ref={refFn} />);
      expect(refFn).toHaveBeenCalled();
      const lastCallArg = refFn.mock.calls[refFn.mock.calls.length - 1][0];
      expect(lastCallArg).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Branch Coverage Edge Cases', () => {
    it('renders with no value or defaultValue (currentValue undefined)', () => {
      render(<Numberinput />);
      const input = screen.getByRole('spinbutton');
      expect(input).toBeInTheDocument();
      // value falls back to '' when currentValue is undefined
      expect(input).toHaveValue(null);
      expect(input).not.toHaveAttribute('aria-valuenow');
    });

    it('uses exponential step when currentValue is undefined', async () => {
      const handleChange = vi.fn();
      render(<Numberinput step={1} exponential onChange={handleChange} />);
      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);
      // (currentValue ?? 0) + step * max(1, floor(abs(0))) = 0 + 1 = 1
      expect(handleChange).toHaveBeenCalledWith(1);
    });

    it('does not clamp value when no min/max is set', async () => {
      const handleChange = vi.fn();
      render(<Numberinput value={5} onChange={handleChange} />);
      const decrementBtn = screen.getByRole('button', { name: /decrease/i });
      await userEvent.click(decrementBtn);
      // No min, no max — value passes through untouched
      expect(handleChange).toHaveBeenCalledWith(4);
    });

    it('does not clamp when min is set but value is above min', async () => {
      const handleChange = vi.fn();
      render(<Numberinput value={10} min={0} onChange={handleChange} />);
      const decrementBtn = screen.getByRole('button', { name: /decrease/i });
      await userEvent.click(decrementBtn);
      expect(handleChange).toHaveBeenCalledWith(9);
    });

    it('does not clamp when max is set but value is below max', async () => {
      const handleChange = vi.fn();
      render(<Numberinput value={1} max={10} onChange={handleChange} />);
      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);
      expect(handleChange).toHaveBeenCalledWith(2);
    });

    it('ignores keys other than ArrowUp/ArrowDown', () => {
      const handleChange = vi.fn();
      render(<Numberinput value={5} onChange={handleChange} />);
      const input = screen.getByRole('spinbutton');
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.keyDown(input, { key: 'a' });
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('handles negative values', () => {
      const handleChange = vi.fn();
      render(<Numberinput value={-5} onChange={handleChange} />);

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      fireEvent.click(incrementBtn);

      expect(handleChange).toHaveBeenCalledWith(-4);
    });

    it('handles zero value', () => {
      render(<Numberinput defaultValue={0} />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(0);
    });

    it('ignores NaN input', () => {
      const handleChange = vi.fn();
      render(<Numberinput value={5} onChange={handleChange} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: 'not a number' } });

      expect(handleChange).not.toHaveBeenCalled();
    });
  });
});

describe('Numberinput label association (#368)', () => {
  it('associates the label with the number input (plusminus)', () => {
    const { container } = render(<Numberinput label="Quantity" />);
    const input = screen.getByLabelText('Quantity');
    expect(input).toHaveAttribute('type', 'number');
    expect(input.id).toBeTruthy();
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      input.id
    );
  });

  it('associates the label in the stepper variant', () => {
    const { container } = render(
      <Numberinput label="Quantity" variant="stepper" />
    );
    const input = screen.getByLabelText('Quantity');
    expect(input).toHaveAttribute('type', 'number');
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      input.id
    );
  });

  it('renders no label and injects no id in bare mode', () => {
    const { container } = render(<Numberinput bare label="Quantity" />);
    expect(container.querySelector('label')).not.toBeInTheDocument();
    expect(container.querySelector('input[type="number"]')).not.toHaveAttribute(
      'id'
    );
  });

  it('injects no id without a label', () => {
    const { container } = render(<Numberinput />);
    expect(container.querySelector('input[type="number"]')).not.toHaveAttribute(
      'id'
    );
  });

  it("takes the outer Field's label in place of its own, which it drops (#939)", () => {
    const { container } = render(
      <Field label="Outer">
        <Numberinput label="Dropped" />
      </Field>
    );
    expect(container.querySelectorAll('label').length).toBe(1);
    expect(screen.getByRole('spinbutton', { name: 'Outer' })).toBe(
      container.querySelector('input[type="number"]')
    );
  });
});

describe('NumberInput deprecated alias', () => {
  it('is the same component as Numberinput', () => {
    expect(NumberInput).toBe(Numberinput);
  });

  it('renders via the alias', () => {
    const { container } = render(<NumberInput value={5} />);
    expect(container.querySelector('input[type="number"]')).toHaveValue(5);
  });
});
