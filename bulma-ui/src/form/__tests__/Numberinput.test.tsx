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
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies numberinput class', () => {
      const { container } = render(<Numberinput defaultValue={5} />);
      expect(container.firstChild).toHaveClass('numberinput');
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
      expect(container.firstChild).toHaveClass('is-small');
    });

    it('applies medium size class', () => {
      const { container } = render(
        <Numberinput defaultValue={5} size="medium" />
      );
      expect(container.firstChild).toHaveClass('is-medium');
    });

    it('applies large size class', () => {
      const { container } = render(
        <Numberinput defaultValue={5} size="large" />
      );
      expect(container.firstChild).toHaveClass('is-large');
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
    it('applies controls-left class', () => {
      const { container } = render(
        <Numberinput defaultValue={5} controlsPosition="left" />
      );
      expect(container.firstChild).toHaveClass('controls-left');
    });

    it('applies controls-right class', () => {
      const { container } = render(
        <Numberinput defaultValue={5} controlsPosition="right" />
      );
      expect(container.firstChild).toHaveClass('controls-right');
    });

    it('applies controls-both class by default', () => {
      const { container } = render(<Numberinput defaultValue={5} />);
      expect(container.firstChild).toHaveClass('controls-both');
    });

    it('renders only decrement on left when controlsPosition is left', () => {
      render(<Numberinput defaultValue={5} controlsPosition="left" />);
      // Both buttons should still be rendered for left position
      expect(
        screen.getByRole('button', { name: /decrease/i })
      ).toBeInTheDocument();
    });

    it('renders only increment on right when controlsPosition is right', () => {
      render(<Numberinput defaultValue={5} controlsPosition="right" />);
      // Both buttons should still be rendered for right position (but positioned differently)
      expect(
        screen.getByRole('button', { name: /increase/i })
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
      expect(container.firstChild).toHaveClass('is-disabled');
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
