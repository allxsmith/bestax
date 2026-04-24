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

  describe('tooltip prop', () => {
    it('tooltip="auto" renders output and shows on hover', () => {
      const { container } = render(<Slider tooltip="auto" showOutput />);
      const input = container.querySelector('input')!;

      expect(container.querySelector('.slider-output')).toBeInTheDocument();
      expect(container.querySelector('.slider-output')).not.toHaveClass(
        'is-visible'
      );

      fireEvent.mouseEnter(input);
      expect(container.querySelector('.slider-output')).toHaveClass(
        'is-visible'
      );
    });

    it('tooltip="always" renders output with is-visible always', () => {
      const { container } = render(<Slider tooltip="always" showOutput />);
      expect(container.querySelector('.slider-output')).toHaveClass(
        'is-visible'
      );
      expect(container.querySelector('.slider')).toHaveClass(
        'has-output-always'
      );
    });

    it('tooltip="hidden" does not render output even with showOutput', () => {
      const { container } = render(<Slider tooltip="hidden" showOutput />);
      expect(container.querySelector('.slider-output')).not.toBeInTheDocument();
    });

    it('tooltip prop takes precedence over showOutput', () => {
      const { container } = render(<Slider tooltip="hidden" showOutput />);
      expect(container.querySelector('.slider-output')).not.toBeInTheDocument();
    });

    it('showOutput without tooltip defaults to auto behavior', () => {
      const { container } = render(<Slider showOutput />);
      expect(container.querySelector('.slider')).toHaveClass('has-output');
      expect(container.querySelector('.slider')).not.toHaveClass(
        'has-output-always'
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

    it('sets aria-valuetext via getAriaValueText', () => {
      const { container } = render(
        <Slider value={50} getAriaValueText={v => `${v} degrees`} />
      );
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-valuetext', '50 degrees');
    });

    it('sets aria-valuetext from scale when no getAriaValueText', () => {
      const { container } = render(<Slider value={3} scale={v => v * v} />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-valuetext', '9');
    });

    it('passes aria-label to input', () => {
      const { container } = render(<Slider ariaLabel="Volume" />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-label', 'Volume');
    });

    it('passes aria-labelledby to input', () => {
      const { container } = render(<Slider aria-labelledby="my-label" />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-labelledby', 'my-label');
    });

    it('sets aria-orientation for vertical', () => {
      const { container } = render(<Slider orientation="vertical" />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('does not set aria-orientation for horizontal', () => {
      const { container } = render(<Slider />);
      const input = container.querySelector('input');
      expect(input).not.toHaveAttribute('aria-orientation');
    });
  });

  describe('keyboard navigation', () => {
    it('Home key sets value to min', () => {
      const handleChange = jest.fn();
      const { container } = render(
        <Slider min={10} max={90} onChange={handleChange} />
      );
      const input = container.querySelector('input')!;

      fireEvent.keyDown(input, { key: 'Home' });
      expect(handleChange).toHaveBeenCalledWith(10);
    });

    it('End key sets value to max', () => {
      const handleChange = jest.fn();
      const { container } = render(
        <Slider min={10} max={90} onChange={handleChange} />
      );
      const input = container.querySelector('input')!;

      fireEvent.keyDown(input, { key: 'End' });
      expect(handleChange).toHaveBeenCalledWith(90);
    });

    it('Home key updates uncontrolled slider', () => {
      const { container } = render(
        <Slider defaultValue={50} min={0} max={100} />
      );
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.keyDown(input, { key: 'Home' });
      expect(input.value).toBe('0');
    });

    it('End key updates uncontrolled slider', () => {
      const { container } = render(
        <Slider defaultValue={50} min={0} max={100} />
      );
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.keyDown(input, { key: 'End' });
      expect(input.value).toBe('100');
    });
  });

  describe('ticks', () => {
    it('renders tick marks when ticks={true}, excluding endpoints', () => {
      const { container } = render(
        <Slider min={0} max={100} step={25} ticks />
      );
      const tickContainer = container.querySelector('.slider-ticks');
      expect(tickContainer).toBeInTheDocument();
      // 25, 50, 75 = 3 ticks (no ticks at 0 or 100)
      expect(tickContainer!.querySelectorAll('.slider-tick').length).toBe(3);
    });

    it('does not render ticks when ticks is false', () => {
      const { container } = render(<Slider />);
      expect(container.querySelector('.slider-ticks')).not.toBeInTheDocument();
    });

    it('applies has-ticks class when ticks present', () => {
      const { container } = render(
        <Slider min={0} max={100} step={50} ticks />
      );
      expect(container.querySelector('.slider')).toHaveClass('has-ticks');
    });

    it('positions ticks correctly, excluding endpoints', () => {
      const { container } = render(
        <Slider min={0} max={100} step={25} ticks />
      );
      const ticks = container.querySelectorAll('.slider-tick');
      // 3 ticks: 25%, 50%, 75% (no 0% or 100%)
      expect(ticks.length).toBe(3);
      expect(ticks[0]).toHaveStyle({ left: '25%' });
      expect(ticks[1]).toHaveStyle({ left: '50%' });
      expect(ticks[2]).toHaveStyle({ left: '75%' });
    });
  });

  describe('marks', () => {
    it('renders custom marks', () => {
      const marks = [
        { value: 0, label: 'Low' },
        { value: 50, label: 'Mid' },
        { value: 100, label: 'High' },
      ];
      const { container } = render(<Slider marks={marks} />);
      const tickContainer = container.querySelector('.slider-ticks');
      expect(tickContainer).toBeInTheDocument();
      expect(tickContainer!.querySelectorAll('.slider-tick').length).toBe(3);
    });

    it('renders mark labels', () => {
      const marks = [
        { value: 0, label: 'Start' },
        { value: 100, label: 'End' },
      ];
      const { container } = render(<Slider marks={marks} />);
      const labels = container.querySelectorAll('.slider-tick-label');
      expect(labels.length).toBe(2);
      expect(labels[0]).toHaveTextContent('Start');
      expect(labels[1]).toHaveTextContent('End');
    });

    it('applies has-tick-labels class when marks have labels', () => {
      const marks = [{ value: 50, label: 'Half' }];
      const { container } = render(<Slider marks={marks} />);
      expect(container.querySelector('.slider')).toHaveClass('has-tick-labels');
    });

    it('marks without labels do not add tick-label class', () => {
      const marks = [{ value: 50 }];
      const { container } = render(<Slider marks={marks} />);
      expect(container.querySelector('.slider')).not.toHaveClass(
        'has-tick-labels'
      );
    });

    it('marks take precedence over ticks', () => {
      const marks = [{ value: 0 }, { value: 100 }];
      const { container } = render(
        <Slider marks={marks} ticks min={0} max={100} step={25} />
      );
      // Should use marks (2), not step-based ticks (5)
      expect(container.querySelectorAll('.slider-tick').length).toBe(2);
    });
  });

  describe('scale', () => {
    it('applies scale to formatOutput display', () => {
      const { container } = render(
        <Slider
          value={3}
          scale={v => v * v}
          showOutput
          formatOutput={v => `${v} units`}
        />
      );
      // scale(3) = 9, then formatOutput(9) = "9 units"
      expect(container.querySelector('.slider-output')).toHaveTextContent(
        '9 units'
      );
    });

    it('applies scale to default output display', () => {
      const { container } = render(
        <Slider value={4} scale={v => v * 10} showOutput />
      );
      expect(container.querySelector('.slider-output')).toHaveTextContent('40');
    });

    it('sets aria-valuetext with scaled value when no getAriaValueText', () => {
      const { container } = render(<Slider value={5} scale={v => v * 2} />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-valuetext', '10');
    });
  });

  describe('orientation', () => {
    it('defaults to horizontal', () => {
      const { container } = render(<Slider />);
      expect(container.querySelector('.slider')).not.toHaveClass('is-vertical');
    });

    it('applies is-vertical class for vertical orientation', () => {
      const { container } = render(<Slider orientation="vertical" />);
      expect(container.querySelector('.slider')).toHaveClass('is-vertical');
    });

    it('sets wrapper height style for vertical', () => {
      const { container } = render(<Slider orientation="vertical" />);
      const wrapper = container.querySelector('.slider') as HTMLElement;
      expect(wrapper.style.height).toBe(
        'var(--bulma-slider-vertical-height, 200px)'
      );
    });

    it('positions output with bottom for vertical', () => {
      const { container } = render(
        <Slider orientation="vertical" value={50} showOutput />
      );
      const output = container.querySelector('.slider-output') as HTMLElement;
      // Bottom uses corrected thumb-inset formula (same as horizontal left)
      expect(output.style.bottom).toBe(
        'calc(var(--bulma-slider-thumb-size) / 2 + 0.5 * (100% - var(--bulma-slider-thumb-size)))'
      );
    });

    it('positions ticks with bottom for vertical', () => {
      const { container } = render(
        <Slider orientation="vertical" min={0} max={100} step={25} ticks />
      );
      const ticks = container.querySelectorAll('.slider-tick');
      // 25%, 50%, 75% (no endpoints)
      expect(ticks.length).toBe(3);
      expect(ticks[0]).toHaveStyle({ bottom: '25%' });
      expect(ticks[1]).toHaveStyle({ bottom: '50%' });
      expect(ticks[2]).toHaveStyle({ bottom: '75%' });
    });
  });

  describe('range mode', () => {
    it('renders two inputs when range is true', () => {
      const { container } = render(<Slider range defaultValue={[20, 80]} />);
      const inputs = container.querySelectorAll('input[type="range"]');
      expect(inputs.length).toBe(2);
    });

    it('renders slider-track element', () => {
      const { container } = render(<Slider range defaultValue={[20, 80]} />);
      expect(container.querySelector('.slider-track')).toBeInTheDocument();
    });

    it('applies is-range class', () => {
      const { container } = render(<Slider range />);
      expect(container.querySelector('.slider')).toHaveClass('is-range');
    });

    it('sets low and high values', () => {
      const { container } = render(<Slider range value={[25, 75]} />);
      const inputs = container.querySelectorAll(
        'input[type="range"]'
      ) as NodeListOf<HTMLInputElement>;
      expect(inputs[0].value).toBe('25');
      expect(inputs[1].value).toBe('75');
    });

    it('calls onChange with tuple', () => {
      const handleChange = jest.fn();
      const { container } = render(
        <Slider range value={[20, 80]} onChange={handleChange} />
      );
      const inputs = container.querySelectorAll('input[type="range"]');

      fireEvent.change(inputs[0], { target: { value: '30' } });
      expect(handleChange).toHaveBeenCalledWith([30, 80]);
    });

    it('calls onChange for high thumb', () => {
      const handleChange = jest.fn();
      const { container } = render(
        <Slider range value={[20, 80]} onChange={handleChange} />
      );
      const inputs = container.querySelectorAll('input[type="range"]');

      fireEvent.change(inputs[1], { target: { value: '90' } });
      expect(handleChange).toHaveBeenCalledWith([20, 90]);
    });

    it('enforces minDistance', () => {
      const handleChange = jest.fn();
      const { container } = render(
        <Slider
          range
          value={[30, 70]}
          minDistance={20}
          onChange={handleChange}
        />
      );
      const inputs = container.querySelectorAll('input[type="range"]');

      // Try to move low thumb to 60 (within 20 of high=70 would be 50 max)
      fireEvent.change(inputs[0], { target: { value: '60' } });
      expect(handleChange).toHaveBeenCalledWith([50, 70]);
    });

    it('enforces minDistance on high thumb', () => {
      const handleChange = jest.fn();
      const { container } = render(
        <Slider
          range
          value={[30, 70]}
          minDistance={20}
          onChange={handleChange}
        />
      );
      const inputs = container.querySelectorAll('input[type="range"]');

      // Try to move high thumb to 40 (must be at least 30+20=50)
      fireEvent.change(inputs[1], { target: { value: '40' } });
      expect(handleChange).toHaveBeenCalledWith([30, 50]);
    });

    it('renders two output tooltips', () => {
      const { container } = render(
        <Slider range value={[20, 80]} showOutput />
      );
      const outputs = container.querySelectorAll('.slider-output');
      expect(outputs.length).toBe(2);
      expect(outputs[0]).toHaveTextContent('20');
      expect(outputs[1]).toHaveTextContent('80');
    });

    it('sets aria-label on range thumbs', () => {
      const { container } = render(
        <Slider range ariaLabel={['Min price', 'Max price']} />
      );
      const inputs = container.querySelectorAll('input[type="range"]');
      expect(inputs[0]).toHaveAttribute('aria-label', 'Min price');
      expect(inputs[1]).toHaveAttribute('aria-label', 'Max price');
    });

    it('defaults aria-labels to "Minimum value" / "Maximum value"', () => {
      const { container } = render(<Slider range />);
      const inputs = container.querySelectorAll('input[type="range"]');
      expect(inputs[0]).toHaveAttribute('aria-label', 'Minimum value');
      expect(inputs[1]).toHaveAttribute('aria-label', 'Maximum value');
    });

    it('updates uncontrolled range values', () => {
      const { container } = render(<Slider range defaultValue={[10, 90]} />);
      const inputs = container.querySelectorAll(
        'input[type="range"]'
      ) as NodeListOf<HTMLInputElement>;

      fireEvent.change(inputs[0], { target: { value: '30' } });
      expect(inputs[0].value).toBe('30');
    });

    it('renders track with progress vars', () => {
      const { container } = render(<Slider range value={[25, 75]} />);
      const track = container.querySelector('.slider-track') as HTMLElement;
      expect(track.style.getPropertyValue('--slider-progress-low')).toBe('25%');
      expect(track.style.getPropertyValue('--slider-progress-high')).toBe(
        '75%'
      );
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Slider ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.type).toBe('range');
    });

    it('forwards ref to first input in range mode', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Slider range ref={ref} />);
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
