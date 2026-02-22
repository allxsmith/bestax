import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Slider } from '../Slider';

describe('Slider', () => {
  describe('rendering', () => {
    it('renders the slider container', () => {
      const { container } = render(<Slider />);
      expect(container.querySelector('.slider')).toBeInTheDocument();
    });

    it('renders the range input', () => {
      const { container } = render(<Slider />);
      expect(
        container.querySelector('input[type="range"]')
      ).toBeInTheDocument();
    });

    it('renders with slider-input class', () => {
      const { container } = render(<Slider />);
      expect(container.querySelector('.slider-input')).toBeInTheDocument();
    });
  });

  describe('values', () => {
    it('uses defaultValue for uncontrolled slider', () => {
      const { container } = render(<Slider defaultValue={30} />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('30');
    });

    it('uses value for controlled slider', () => {
      const { container } = render(<Slider value={60} />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('60');
    });

    it('defaults to 0 when no value provided', () => {
      const { container } = render(<Slider />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('0');
    });

    it('respects min prop', () => {
      const { container } = render(<Slider min={10} />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toHaveAttribute('min', '10');
    });

    it('respects max prop', () => {
      const { container } = render(<Slider max={200} />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toHaveAttribute('max', '200');
    });

    it('respects step prop', () => {
      const { container } = render(<Slider step={5} />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toHaveAttribute('step', '5');
    });

    it('defaults min to 0', () => {
      const { container } = render(<Slider />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toHaveAttribute('min', '0');
    });

    it('defaults max to 100', () => {
      const { container } = render(<Slider />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toHaveAttribute('max', '100');
    });

    it('defaults step to 1', () => {
      const { container } = render(<Slider />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toHaveAttribute('step', '1');
    });
  });

  describe('onChange', () => {
    it('calls onChange when value changes', () => {
      const handleChange = jest.fn();
      const { container } = render(<Slider onChange={handleChange} />);
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '50' } });
      expect(handleChange).toHaveBeenCalledWith(50);
    });

    it('updates internal value for uncontrolled slider', () => {
      const { container } = render(<Slider defaultValue={0} />);
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '75' } });
      expect(input.value).toBe('75');
    });

    it('does not update internal value for controlled slider', () => {
      const { container } = render(<Slider value={30} />);
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '50' } });
      // Controlled slider should still show the prop value
      expect(input.value).toBe('30');
    });
  });

  describe('sizes', () => {
    it.each(['small', 'medium', 'large'] as const)(
      'applies is-%s class when size="%s"',
      size => {
        const { container } = render(<Slider size={size} />);
        expect(container.querySelector('.slider')).toHaveClass(`is-${size}`);
      }
    );
  });

  describe('colors', () => {
    it.each([
      'primary',
      'link',
      'info',
      'success',
      'warning',
      'danger',
    ] as const)('applies is-%s class when color="%s"', color => {
      const { container } = render(<Slider color={color} />);
      expect(container.querySelector('.slider')).toHaveClass(`is-${color}`);
    });
  });

  describe('variants', () => {
    it('applies is-rounded class when isRounded is true', () => {
      const { container } = render(<Slider isRounded />);
      expect(container.querySelector('.slider')).toHaveClass('is-rounded');
    });

    it('applies is-circle class when isCircle is true', () => {
      const { container } = render(<Slider isCircle />);
      expect(container.querySelector('.slider')).toHaveClass('is-circle');
    });

    it('applies is-disabled class when disabled', () => {
      const { container } = render(<Slider disabled />);
      expect(container.querySelector('.slider')).toHaveClass('is-disabled');
    });

    it('applies has-output class when showOutput is true', () => {
      const { container } = render(<Slider showOutput />);
      expect(container.querySelector('.slider')).toHaveClass('has-output');
    });
  });

  describe('output tooltip', () => {
    it('renders output element when showOutput is true', () => {
      const { container } = render(<Slider showOutput />);
      expect(container.querySelector('.slider-output')).toBeInTheDocument();
    });

    it('does not render output element when showOutput is false', () => {
      const { container } = render(<Slider showOutput={false} />);
      expect(container.querySelector('.slider-output')).not.toBeInTheDocument();
    });

    it('displays current value in output', () => {
      const { container } = render(<Slider value={50} showOutput />);
      expect(container.querySelector('.slider-output')).toHaveTextContent('50');
    });

    it('formats output with formatOutput function', () => {
      const { container } = render(
        <Slider value={50} showOutput formatOutput={v => `${v}%`} />
      );
      expect(container.querySelector('.slider-output')).toHaveTextContent(
        '50%'
      );
    });

    it('shows output on mouse enter', () => {
      const { container } = render(<Slider showOutput />);
      const input = container.querySelector('input')!;

      fireEvent.mouseEnter(input);
      expect(container.querySelector('.slider-output')).toHaveClass(
        'is-visible'
      );
    });

    it('hides output on mouse leave', () => {
      const { container } = render(<Slider showOutput />);
      const input = container.querySelector('input')!;

      fireEvent.mouseEnter(input);
      fireEvent.mouseLeave(input);
      expect(container.querySelector('.slider-output')).not.toHaveClass(
        'is-visible'
      );
    });

    it('shows output on focus', () => {
      const { container } = render(<Slider showOutput />);
      const input = container.querySelector('input')!;

      fireEvent.focus(input);
      expect(container.querySelector('.slider-output')).toHaveClass(
        'is-visible'
      );
    });

    it('hides output on blur', () => {
      const { container } = render(<Slider showOutput />);
      const input = container.querySelector('input')!;

      fireEvent.focus(input);
      fireEvent.blur(input);
      expect(container.querySelector('.slider-output')).not.toHaveClass(
        'is-visible'
      );
    });
  });

  describe('disabled state', () => {
    it('input is disabled when disabled prop is true', () => {
      const { container } = render(<Slider disabled />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeDisabled();
    });

    it('input is not disabled by default', () => {
      const { container } = render(<Slider />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).not.toBeDisabled();
    });
  });

  describe('className handling', () => {
    it('applies custom className', () => {
      const { container } = render(<Slider className="custom-class" />);
      expect(container.querySelector('.slider')).toHaveClass('custom-class');
    });

    it('combines multiple classes correctly', () => {
      const { container } = render(
        <Slider
          size="medium"
          color="primary"
          isRounded
          className="custom-class"
        />
      );
      const slider = container.querySelector('.slider');
      expect(slider).toHaveClass(
        'slider',
        'is-medium',
        'is-primary',
        'is-rounded',
        'custom-class'
      );
    });
  });

  describe('Bulma helper classes', () => {
    it('applies Bulma helper classes from props', () => {
      const { container } = render(<Slider m="2" p="3" />);
      expect(container.querySelector('.slider')).toHaveClass('m-2', 'p-3');
    });
  });

  describe('accessibility', () => {
    it('has aria-valuenow', () => {
      const { container } = render(<Slider value={50} />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-valuenow', '50');
    });

    it('has aria-valuemin', () => {
      const { container } = render(<Slider min={10} />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-valuemin', '10');
    });

    it('has aria-valuemax', () => {
      const { container } = render(<Slider max={200} />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-valuemax', '200');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Slider ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.type).toBe('range');
    });
  });

  describe('CSS custom property', () => {
    it('sets --slider-progress style', () => {
      const { container } = render(<Slider value={50} min={0} max={100} />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.style.getPropertyValue('--slider-progress')).toBe('50%');
    });

    it('calculates progress correctly with custom range', () => {
      const { container } = render(<Slider value={250} min={100} max={500} />);
      const input = container.querySelector('input') as HTMLInputElement;
      // (250 - 100) / (500 - 100) = 150 / 400 = 0.375 = 37.5%
      expect(input.style.getPropertyValue('--slider-progress')).toBe('37.5%');
    });
  });
});
