import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Numberinput } from '../Numberinput';

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
      expect(container.querySelector('.numberinput')).toHaveClass('custom-class');
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
      const handleChange = jest.fn();
      render(<Numberinput value={5} onChange={handleChange} />);

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      expect(handleChange).toHaveBeenCalledWith(6);
    });

    it('decrements value when - button clicked', async () => {
      const handleChange = jest.fn();
      render(<Numberinput value={5} onChange={handleChange} />);

      const decrementBtn = screen.getByRole('button', { name: /decrease/i });
      await userEvent.click(decrementBtn);

      expect(handleChange).toHaveBeenCalledWith(4);
    });

    it('respects step value when incrementing', async () => {
      const handleChange = jest.fn();
      render(<Numberinput value={10} step={5} onChange={handleChange} />);

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      expect(handleChange).toHaveBeenCalledWith(15);
    });

    it('respects step value when decrementing', async () => {
      const handleChange = jest.fn();
      render(<Numberinput value={10} step={5} onChange={handleChange} />);

      const decrementBtn = screen.getByRole('button', { name: /decrease/i });
      await userEvent.click(decrementBtn);

      expect(handleChange).toHaveBeenCalledWith(5);
    });

    it('calls onChange when input value changes', () => {
      const handleChange = jest.fn();
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
      const handleChange = jest.fn();
      render(<Numberinput value={1} min={0} onChange={handleChange} />);

      const decrementBtn = screen.getByRole('button', { name: /decrease/i });
      await userEvent.click(decrementBtn);

      expect(handleChange).toHaveBeenCalledWith(0);
    });

    it('clamps value to max', async () => {
      const handleChange = jest.fn();
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
      expect(container.querySelector('.numberinput')).toHaveClass('controls-left');
    });

    it('applies controls-right class', () => {
      const { container } = render(
        <Numberinput defaultValue={5} controlsPosition="right" />
      );
      expect(container.querySelector('.numberinput')).toHaveClass('controls-right');
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
      const { container } = render(
        <Numberinput defaultValue={5} compact />
      );
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
      expect(stepperButtons[0]).toHaveAttribute(
        'aria-label',
        'Increase value'
      );
      expect(stepperButtons[1]).toHaveAttribute(
        'aria-label',
        'Decrease value'
      );
      // Each button should contain an SVG
      stepperButtons.forEach(btn => {
        expect(btn.querySelector('svg')).toBeInTheDocument();
      });
    });

    it('increments via stepper up button', async () => {
      const handleChange = jest.fn();
      render(
        <Numberinput value={5} variant="stepper" onChange={handleChange} />
      );

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      expect(handleChange).toHaveBeenCalledWith(6);
    });

    it('decrements via stepper down button', async () => {
      const handleChange = jest.fn();
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
      expect(container.querySelector('.numberinput')).toHaveClass('is-disabled');
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

    it('allows typing by default', () => {
      render(<Numberinput defaultValue={5} />);
      const input = screen.getByRole('spinbutton');
      expect(input).not.toHaveAttribute('readonly');
    });
  });

  describe('Keyboard Support', () => {
    it('increments on ArrowUp', () => {
      const handleChange = jest.fn();
      render(<Numberinput value={5} onChange={handleChange} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(handleChange).toHaveBeenCalledWith(6);
    });

    it('decrements on ArrowDown', () => {
      const handleChange = jest.fn();
      render(<Numberinput value={5} onChange={handleChange} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(handleChange).toHaveBeenCalledWith(4);
    });

    it('respects step on keyboard navigation', () => {
      const handleChange = jest.fn();
      render(<Numberinput value={10} step={5} onChange={handleChange} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(handleChange).toHaveBeenCalledWith(15);
    });

    it('supports keyboard in stepper variant', () => {
      const handleChange = jest.fn();
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

    it('buttons have tabIndex -1 to keep focus on input', () => {
      render(<Numberinput defaultValue={5} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabindex', '-1');
      });
    });

    it('stepper buttons have tabIndex -1', () => {
      render(<Numberinput defaultValue={5} variant="stepper" />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabindex', '-1');
      });
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
      const handleChange = jest.fn();
      render(<Numberinput value={1} step={0.5} onChange={handleChange} />);

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      expect(handleChange).toHaveBeenCalledWith(1.5);
    });

    it('handles decimal input values', () => {
      const handleChange = jest.fn();
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
      const handleChange = jest.fn();
      render(
        <Numberinput value={10} step={1} onChange={handleChange} />
      );

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      expect(handleChange).toHaveBeenCalledWith(11);
    });

    it('scales step with value magnitude when exponential is true', async () => {
      const handleChange = jest.fn();
      render(
        <Numberinput
          value={10}
          step={1}
          exponential
          onChange={handleChange}
        />
      );

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      // effectiveStep = 1 * max(1, floor(abs(10))) = 10
      expect(handleChange).toHaveBeenCalledWith(20);
    });

    it('uses minimum step of 1 at value 0 when exponential', async () => {
      const handleChange = jest.fn();
      render(
        <Numberinput
          value={0}
          step={1}
          exponential
          onChange={handleChange}
        />
      );

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);

      // effectiveStep = 1 * max(1, floor(abs(0))) = 1 * max(1, 0) = 1
      expect(handleChange).toHaveBeenCalledWith(1);
    });

    it('scales step with negative value magnitude when exponential', async () => {
      const handleChange = jest.fn();
      render(
        <Numberinput
          value={-5}
          step={1}
          exponential
          onChange={handleChange}
        />
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
      const handleChange = jest.fn();
      render(<Numberinput value={5} bare onChange={handleChange} />);

      const incrementBtn = screen.getByRole('button', { name: /increase/i });
      await userEvent.click(incrementBtn);
      expect(handleChange).toHaveBeenCalledWith(6);

      handleChange.mockClear();
      const decrementBtn = screen.getByRole('button', { name: /decrease/i });
      await userEvent.click(decrementBtn);
      expect(handleChange).toHaveBeenCalledWith(4);
    });
  });

  describe('Integration', () => {
    it('handles negative values', () => {
      const handleChange = jest.fn();
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
      const handleChange = jest.fn();
      render(<Numberinput value={5} onChange={handleChange} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: 'not a number' } });

      expect(handleChange).not.toHaveBeenCalled();
    });
  });
});
