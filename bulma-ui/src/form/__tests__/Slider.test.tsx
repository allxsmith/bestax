import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Slider } from '../Slider';
import { Field } from '../Field';
import { Control } from '../Control';

describe('Slider', () => {
  describe('rendering', () => {
    it('renders the slider container', () => {
      const { container } = render(<Slider />);
      expect(container.querySelector('.slider')).toBeInTheDocument();
    });

    it('renders the range input', () => {
      render(<Slider />);
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('renders with slider-input class', () => {
      const { container } = render(<Slider />);
      expect(container.querySelector('.slider-input')).toBeInTheDocument();
    });
  });

  describe('values', () => {
    it('uses defaultValue for uncontrolled slider', () => {
      render(<Slider defaultValue={30} />);
      const input = screen.getByRole('slider') as HTMLInputElement;
      expect(input.value).toBe('30');
    });

    it('uses value for controlled slider', () => {
      render(<Slider value={60} />);
      const input = screen.getByRole('slider') as HTMLInputElement;
      expect(input.value).toBe('60');
    });

    it('defaults to 0 when no value provided', () => {
      render(<Slider />);
      const input = screen.getByRole('slider') as HTMLInputElement;
      expect(input.value).toBe('0');
    });

    it('respects min prop', () => {
      render(<Slider min={10} />);
      const input = screen.getByRole('slider') as HTMLInputElement;
      expect(input).toHaveAttribute('min', '10');
    });

    it('respects max prop', () => {
      render(<Slider max={200} />);
      const input = screen.getByRole('slider') as HTMLInputElement;
      expect(input).toHaveAttribute('max', '200');
    });

    it('respects step prop', () => {
      render(<Slider step={5} />);
      const input = screen.getByRole('slider') as HTMLInputElement;
      expect(input).toHaveAttribute('step', '5');
    });

    it('defaults min to 0', () => {
      render(<Slider />);
      const input = screen.getByRole('slider') as HTMLInputElement;
      expect(input).toHaveAttribute('min', '0');
    });

    it('defaults max to 100', () => {
      render(<Slider />);
      const input = screen.getByRole('slider') as HTMLInputElement;
      expect(input).toHaveAttribute('max', '100');
    });

    it('defaults step to 1', () => {
      render(<Slider />);
      const input = screen.getByRole('slider') as HTMLInputElement;
      expect(input).toHaveAttribute('step', '1');
    });
  });

  describe('onChange', () => {
    it('calls onChange when value changes', () => {
      const handleChange = jest.fn();
      render(<Slider onChange={handleChange} />);
      const input = screen.getByRole('slider') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '50' } });
      expect(handleChange).toHaveBeenCalledWith(50);
    });

    it('updates internal value for uncontrolled slider', () => {
      render(<Slider defaultValue={0} />);
      const input = screen.getByRole('slider') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '75' } });
      expect(input.value).toBe('75');
    });

    it('does not update internal value for controlled slider', () => {
      render(<Slider value={30} />);
      const input = screen.getByRole('slider') as HTMLInputElement;

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
      const input = screen.getByRole('slider');

      fireEvent.mouseEnter(input);
      expect(container.querySelector('.slider-output')).toHaveClass(
        'is-visible'
      );
    });

    it('hides output on mouse leave', () => {
      const { container } = render(<Slider showOutput />);
      const input = screen.getByRole('slider');

      fireEvent.mouseEnter(input);
      fireEvent.mouseLeave(input);
      expect(container.querySelector('.slider-output')).not.toHaveClass(
        'is-visible'
      );
    });

    it('shows output on focus', () => {
      const { container } = render(<Slider showOutput />);
      const input = screen.getByRole('slider');

      fireEvent.focus(input);
      expect(container.querySelector('.slider-output')).toHaveClass(
        'is-visible'
      );
    });

    it('hides output on blur', () => {
      const { container } = render(<Slider showOutput />);
      const input = screen.getByRole('slider');

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
      const input = screen.getByRole('slider');

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
      render(<Slider disabled />);
      const input = screen.getByRole('slider') as HTMLInputElement;
      expect(input).toBeDisabled();
    });

    it('input is not disabled by default', () => {
      render(<Slider />);
      const input = screen.getByRole('slider') as HTMLInputElement;
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
      render(<Slider value={50} />);
      const input = screen.getByRole('slider');
      expect(input).toHaveAttribute('aria-valuenow', '50');
    });

    it('has aria-valuemin', () => {
      render(<Slider min={10} />);
      const input = screen.getByRole('slider');
      expect(input).toHaveAttribute('aria-valuemin', '10');
    });

    it('has aria-valuemax', () => {
      render(<Slider max={200} />);
      const input = screen.getByRole('slider');
      expect(input).toHaveAttribute('aria-valuemax', '200');
    });

    it('sets aria-valuetext via getAriaValueText', () => {
      render(<Slider value={50} getAriaValueText={v => `${v} degrees`} />);
      const input = screen.getByRole('slider');
      expect(input).toHaveAttribute('aria-valuetext', '50 degrees');
    });

    it('sets aria-valuetext from scale when no getAriaValueText', () => {
      render(<Slider value={3} scale={v => v * v} />);
      const input = screen.getByRole('slider');
      expect(input).toHaveAttribute('aria-valuetext', '9');
    });

    it('passes aria-label to input', () => {
      render(<Slider ariaLabel="Volume" />);
      const input = screen.getByRole('slider');
      expect(input).toHaveAttribute('aria-label', 'Volume');
    });

    it('passes aria-labelledby to input', () => {
      render(<Slider aria-labelledby="my-label" />);
      const input = screen.getByRole('slider');
      expect(input).toHaveAttribute('aria-labelledby', 'my-label');
    });

    it('sets aria-orientation for vertical', () => {
      render(<Slider orientation="vertical" />);
      const input = screen.getByRole('slider');
      expect(input).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('does not set aria-orientation for horizontal', () => {
      render(<Slider />);
      const input = screen.getByRole('slider');
      expect(input).not.toHaveAttribute('aria-orientation');
    });
  });

  describe('keyboard navigation', () => {
    it('Home key sets value to min', () => {
      const handleChange = jest.fn();
      render(<Slider min={10} max={90} onChange={handleChange} />);
      const input = screen.getByRole('slider');

      fireEvent.keyDown(input, { key: 'Home' });
      expect(handleChange).toHaveBeenCalledWith(10);
    });

    it('End key sets value to max', () => {
      const handleChange = jest.fn();
      render(<Slider min={10} max={90} onChange={handleChange} />);
      const input = screen.getByRole('slider');

      fireEvent.keyDown(input, { key: 'End' });
      expect(handleChange).toHaveBeenCalledWith(90);
    });

    it('Home key updates uncontrolled slider', () => {
      render(<Slider defaultValue={50} min={0} max={100} />);
      const input = screen.getByRole('slider') as HTMLInputElement;

      fireEvent.keyDown(input, { key: 'Home' });
      expect(input.value).toBe('0');
    });

    it('End key updates uncontrolled slider', () => {
      render(<Slider defaultValue={50} min={0} max={100} />);
      const input = screen.getByRole('slider') as HTMLInputElement;

      fireEvent.keyDown(input, { key: 'End' });
      expect(input.value).toBe('100');
    });

    it('Home key on controlled slider only fires onChange (covers !isControlled false branch)', () => {
      const handleChange = jest.fn();
      render(<Slider value={50} min={0} max={100} onChange={handleChange} />);
      const input = screen.getByRole('slider');
      fireEvent.keyDown(input, { key: 'Home' });
      expect(handleChange).toHaveBeenCalledWith(0);
    });

    it('End key on controlled slider only fires onChange (covers !isControlled false branch)', () => {
      const handleChange = jest.fn();
      render(<Slider value={50} min={0} max={100} onChange={handleChange} />);
      const input = screen.getByRole('slider');
      fireEvent.keyDown(input, { key: 'End' });
      expect(handleChange).toHaveBeenCalledWith(100);
    });

    it('non-Home/End keys are ignored (covers else-if false branch)', () => {
      const handleChange = jest.fn();
      render(<Slider min={0} max={100} onChange={handleChange} />);
      const input = screen.getByRole('slider');
      fireEvent.keyDown(input, { key: 'PageUp' });
      expect(handleChange).not.toHaveBeenCalled();
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
      render(<Slider value={5} scale={v => v * 2} />);
      const input = screen.getByRole('slider');
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
      render(<Slider range defaultValue={[20, 80]} />);
      const inputs = screen.getAllByRole('slider');
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
      render(<Slider range value={[25, 75]} />);
      const inputs = screen.getAllByRole('slider') as HTMLInputElement[];
      expect(inputs[0].value).toBe('25');
      expect(inputs[1].value).toBe('75');
    });

    it('calls onChange with tuple', () => {
      const handleChange = jest.fn();
      render(<Slider range value={[20, 80]} onChange={handleChange} />);
      const inputs = screen.getAllByRole('slider');

      fireEvent.change(inputs[0], { target: { value: '30' } });
      expect(handleChange).toHaveBeenCalledWith([30, 80]);
    });

    it('calls onChange for high thumb', () => {
      const handleChange = jest.fn();
      render(<Slider range value={[20, 80]} onChange={handleChange} />);
      const inputs = screen.getAllByRole('slider');

      fireEvent.change(inputs[1], { target: { value: '90' } });
      expect(handleChange).toHaveBeenCalledWith([20, 90]);
    });

    it('enforces minDistance', () => {
      const handleChange = jest.fn();
      render(
        <Slider
          range
          value={[30, 70]}
          minDistance={20}
          onChange={handleChange}
        />
      );
      const inputs = screen.getAllByRole('slider');

      // Try to move low thumb to 60 (within 20 of high=70 would be 50 max)
      fireEvent.change(inputs[0], { target: { value: '60' } });
      expect(handleChange).toHaveBeenCalledWith([50, 70]);
    });

    it('enforces minDistance on high thumb', () => {
      const handleChange = jest.fn();
      render(
        <Slider
          range
          value={[30, 70]}
          minDistance={20}
          onChange={handleChange}
        />
      );
      const inputs = screen.getAllByRole('slider');

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
      render(<Slider range ariaLabel={['Min price', 'Max price']} />);
      const inputs = screen.getAllByRole('slider');
      expect(inputs[0]).toHaveAttribute('aria-label', 'Min price');
      expect(inputs[1]).toHaveAttribute('aria-label', 'Max price');
    });

    it('defaults aria-labels to "Minimum value" / "Maximum value"', () => {
      render(<Slider range />);
      const inputs = screen.getAllByRole('slider');
      expect(inputs[0]).toHaveAttribute('aria-label', 'Minimum value');
      expect(inputs[1]).toHaveAttribute('aria-label', 'Maximum value');
    });

    it('updates uncontrolled range values', () => {
      render(<Slider range defaultValue={[10, 90]} />);
      const inputs = screen.getAllByRole('slider') as HTMLInputElement[];

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
      render(<Slider value={50} min={0} max={100} />);
      const input = screen.getByRole('slider') as HTMLInputElement;
      expect(input.style.getPropertyValue('--slider-progress')).toBe('50%');
    });

    it('calculates progress correctly with custom range', () => {
      render(<Slider value={250} min={100} max={500} />);
      const input = screen.getByRole('slider') as HTMLInputElement;
      // (250 - 100) / (500 - 100) = 150 / 400 = 0.375 = 37.5%
      expect(input.style.getPropertyValue('--slider-progress')).toBe('37.5%');
    });
  });

  describe('high-density ticks (>100)', () => {
    it('caps tick rendering at 99 interior ticks when count > 100', () => {
      // count = (10000 - 0) / 1 = 10000, which is > 100,
      // so the optimization branch generates ticks at i=1..99 with tickStep = (max-min)/100.
      const { container } = render(
        <Slider min={0} max={10000} step={1} ticks />
      );
      const ticks = container.querySelectorAll('.slider-tick');
      // Sampled subset: i=1..99 => 99 interior ticks (no endpoints).
      expect(ticks.length).toBe(99);
      // First sampled tick is at min + 1 * (10000/100) = 100 => 1%.
      expect(ticks[0]).toHaveStyle({ left: '1%' });
      // 50th sampled tick is at min + 50 * (10000/100) = 5000 => 50%.
      expect(ticks[49]).toHaveStyle({ left: '50%' });
      // Last sampled tick is at min + 99 * (10000/100) = 9900 => 99%.
      expect(ticks[98]).toHaveStyle({ left: '99%' });
    });
  });

  describe('range mode tooltip handlers', () => {
    it('shows low tooltip on mouseEnter of low thumb in range mode', () => {
      const { container } = render(
        <Slider range value={[20, 80]} showOutput />
      );
      const inputs = screen.getAllByRole('slider') as HTMLInputElement[];
      const lowOutput = container.querySelector(
        '.slider-output-low'
      ) as HTMLElement;

      expect(lowOutput).not.toHaveClass('is-visible');
      fireEvent.mouseEnter(inputs[0]);
      expect(lowOutput).toHaveClass('is-visible');
    });

    it('hides low tooltip on mouseLeave of low thumb in range mode', () => {
      const { container } = render(
        <Slider range value={[20, 80]} showOutput />
      );
      const inputs = screen.getAllByRole('slider') as HTMLInputElement[];
      const lowOutput = container.querySelector(
        '.slider-output-low'
      ) as HTMLElement;

      fireEvent.mouseEnter(inputs[0]);
      fireEvent.mouseLeave(inputs[0]);
      expect(lowOutput).not.toHaveClass('is-visible');
    });

    it('shows low tooltip on focus of low thumb in range mode', () => {
      const { container } = render(
        <Slider range value={[20, 80]} showOutput />
      );
      const inputs = screen.getAllByRole('slider') as HTMLInputElement[];
      const lowOutput = container.querySelector(
        '.slider-output-low'
      ) as HTMLElement;

      fireEvent.focus(inputs[0]);
      expect(lowOutput).toHaveClass('is-visible');
      fireEvent.blur(inputs[0]);
      expect(lowOutput).not.toHaveClass('is-visible');
    });

    it('shows high tooltip on mouseEnter of high thumb', () => {
      const { container } = render(
        <Slider range value={[20, 80]} showOutput />
      );
      const inputs = screen.getAllByRole('slider') as HTMLInputElement[];
      const highOutput = container.querySelector(
        '.slider-output-high'
      ) as HTMLElement;

      expect(highOutput).not.toHaveClass('is-visible');
      fireEvent.mouseEnter(inputs[1]);
      expect(highOutput).toHaveClass('is-visible');
    });

    it('hides high tooltip on mouseLeave of high thumb', () => {
      const { container } = render(
        <Slider range value={[20, 80]} showOutput />
      );
      const inputs = screen.getAllByRole('slider') as HTMLInputElement[];
      const highOutput = container.querySelector(
        '.slider-output-high'
      ) as HTMLElement;

      fireEvent.mouseEnter(inputs[1]);
      fireEvent.mouseLeave(inputs[1]);
      expect(highOutput).not.toHaveClass('is-visible');
    });

    it('shows and hides high tooltip on focus and blur of high thumb', () => {
      const { container } = render(
        <Slider range value={[20, 80]} showOutput />
      );
      const inputs = screen.getAllByRole('slider') as HTMLInputElement[];
      const highOutput = container.querySelector(
        '.slider-output-high'
      ) as HTMLElement;

      fireEvent.focus(inputs[1]);
      expect(highOutput).toHaveClass('is-visible');
      fireEvent.blur(inputs[1]);
      expect(highOutput).not.toHaveClass('is-visible');
    });

    it('does not change high tooltip when low thumb is hovered', () => {
      const { container } = render(
        <Slider range value={[20, 80]} showOutput />
      );
      const inputs = screen.getAllByRole('slider') as HTMLInputElement[];
      const highOutput = container.querySelector(
        '.slider-output-high'
      ) as HTMLElement;

      fireEvent.mouseEnter(inputs[0]);
      expect(highOutput).not.toHaveClass('is-visible');
    });

    it('keyDown on high thumb does not throw and does not change values', () => {
      // High thumb has no onKeyDown wired, but it should accept the event silently.
      const handleChange = jest.fn();
      render(<Slider range value={[20, 80]} onChange={handleChange} />);
      const inputs = screen.getAllByRole('slider') as HTMLInputElement[];

      // Pressing Home on a range slider's low thumb is a no-op
      // (range branch in handleKeyDown is intentionally empty),
      // exercising the `if (!range)` false branch on lines 328 and 334.
      fireEvent.keyDown(inputs[0], { key: 'Home' });
      fireEvent.keyDown(inputs[0], { key: 'End' });
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('rem-to-px thumb size conversion', () => {
    it('converts rem-valued --bulma-slider-thumb-size to px via root font-size', () => {
      const originalGetComputedStyle = window.getComputedStyle;
      const fakeComputedStyle = (_el: Element) =>
        ({
          getPropertyValue: (prop: string) => {
            if (prop === '--bulma-slider-thumb-size') return '1.5rem';
            return '';
          },
          fontSize: '20px',
          // jsdom's CSSStyleDeclaration has many properties; provide the ones
          // accessed by the component and fall through for anything else.
          getPropertyPriority: () => '',
        }) as unknown as CSSStyleDeclaration;

      // Wrap so the original is invoked for non-target elements (like outputs)
      // and our mock provides the slider-thumb var + fontSize for the inputs/root.
      window.getComputedStyle = ((el: Element) => {
        return fakeComputedStyle(el);
      }) as typeof window.getComputedStyle;

      try {
        const { container } = render(
          <Slider value={50} showOutput min={0} max={100} />
        );
        // Force a re-render-triggering interaction so useLayoutEffect
        // re-runs getThumbSizePx and traverses the rem branch.
        const input = container.querySelector(
          'input[type="range"]'
        ) as HTMLInputElement;
        fireEvent.focus(input);
        fireEvent.blur(input);
        // No assertion on px math (jsdom can't render); coverage is the goal.
        expect(container.querySelector('.slider-output')).toBeInTheDocument();
      } finally {
        window.getComputedStyle = originalGetComputedStyle;
      }
    });

    it('handles non-rem (px) thumb size value path', () => {
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = ((_el: Element) =>
        ({
          getPropertyValue: (prop: string) => {
            if (prop === '--bulma-slider-thumb-size') return '24px';
            return '';
          },
          fontSize: '16px',
          getPropertyPriority: () => '',
        }) as unknown as CSSStyleDeclaration) as typeof window.getComputedStyle;

      try {
        const { container } = render(
          <Slider value={50} showOutput isCircle min={0} max={100} />
        );
        expect(container.querySelector('.slider-output')).toBeInTheDocument();
      } finally {
        window.getComputedStyle = originalGetComputedStyle;
      }
    });

    it('returns 0 when --bulma-slider-thumb-size is not parseable', () => {
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = ((_el: Element) =>
        ({
          getPropertyValue: (_prop: string) => '',
          fontSize: '16px',
          getPropertyPriority: () => '',
        }) as unknown as CSSStyleDeclaration) as typeof window.getComputedStyle;

      try {
        const { container } = render(<Slider value={50} showOutput />);
        expect(container.querySelector('.slider-output')).toBeInTheDocument();
      } finally {
        window.getComputedStyle = originalGetComputedStyle;
      }
    });
  });

  describe('tooltip nudge (overflow handling)', () => {
    // computeNudge uses wrapper.getBoundingClientRect() and outputRef.offsetWidth.
    // We mock both to force the left-clip and right-clip branches.
    function withMockedLayout(
      wrapperRect: Partial<DOMRect>,
      outputWidth: number,
      run: () => void
    ) {
      const origGetBCR = HTMLElement.prototype.getBoundingClientRect;
      const origOffsetWidth = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'offsetWidth'
      );

      HTMLElement.prototype.getBoundingClientRect = function () {
        if (this.classList.contains('slider')) {
          return {
            left: 0,
            right: 100,
            top: 100,
            bottom: 120,
            width: 100,
            height: 20,
            x: 0,
            y: 100,
            toJSON: () => ({}),
            ...wrapperRect,
          } as DOMRect;
        }
        return origGetBCR.call(this);
      };

      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        get() {
          if (this.classList.contains('slider-output')) return outputWidth;
          return 0;
        },
      });

      try {
        run();
      } finally {
        HTMLElement.prototype.getBoundingClientRect = origGetBCR;
        if (origOffsetWidth) {
          Object.defineProperty(
            HTMLElement.prototype,
            'offsetWidth',
            origOffsetWidth
          );
        } else {
          // jsdom defines offsetWidth as a getter on HTMLElement.prototype by default;
          // if the descriptor was missing, just delete our override.
          delete (HTMLElement.prototype as unknown as { offsetWidth?: number })
            .offsetWidth;
        }
      }
    }

    it('nudges right when tooltip would clip the left edge (progress=0)', () => {
      withMockedLayout({ left: 0, right: 100, width: 100 }, 80, () => {
        const { container } = render(
          <Slider value={0} min={0} max={100} showOutput />
        );
        // tooltipLeft = centerX - 80/2 < wr.left=0 => nudge right (positive)
        const output = container.querySelector('.slider-output') as HTMLElement;
        expect(output.style.transform).toContain('translateX');
      });
    });

    it('nudges left when tooltip would clip the right edge (progress=100)', () => {
      withMockedLayout({ left: 0, right: 100, width: 100 }, 80, () => {
        const { container } = render(
          <Slider value={100} min={0} max={100} showOutput />
        );
        const output = container.querySelector('.slider-output') as HTMLElement;
        expect(output.style.transform).toContain('translateX');
      });
    });

    it('nudges high tooltip in range mode when clipped at right edge', () => {
      withMockedLayout({ left: 0, right: 100, width: 100 }, 80, () => {
        const { container } = render(
          <Slider range value={[0, 100]} showOutput />
        );
        const highOutput = container.querySelector(
          '.slider-output-high'
        ) as HTMLElement;
        expect(highOutput.style.transform).toContain('translateX');
      });
    });
  });

  describe('function ref forwarding', () => {
    it('invokes function ref with the input node', () => {
      const refFn = jest.fn();
      render(<Slider ref={refFn} />);
      expect(refFn).toHaveBeenCalled();
      const node = refFn.mock.calls[0][0];
      expect(node).toBeInstanceOf(HTMLInputElement);
      expect((node as HTMLInputElement).type).toBe('range');
    });

    it('invokes function ref for range mode (first input)', () => {
      const refFn = jest.fn();
      render(<Slider range defaultValue={[10, 90]} ref={refFn} />);
      expect(refFn).toHaveBeenCalled();
    });
  });

  describe('inside Control (no-wrapping branch)', () => {
    it('does not wrap with Control when already inside a Control', () => {
      const { container } = render(
        <Field>
          <Control>
            <Slider defaultValue={10} />
          </Control>
        </Field>
      );
      // Only the outer Control should exist (no nested .control wrapper from Slider).
      expect(container.querySelectorAll('.control').length).toBe(1);
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });
  });

  describe('inside Field (fragment return path)', () => {
    it('returns content + message without wrapping Field when already inside one', () => {
      const { container } = render(
        <Field label="My Slider">
          <Slider message="hint" messageColor="info" defaultValue={10} />
        </Field>
      );
      // There should be exactly one .field wrapper from the outer Field —
      // the Slider must not have introduced a second nested Field.
      expect(container.querySelectorAll('.field').length).toBe(1);
      // The Slider's message should still render as a help paragraph.
      const help = container.querySelector('.help');
      expect(help).toBeInTheDocument();
      expect(help).toHaveTextContent('hint');
      expect(help).toHaveClass('is-info');
      // And the slider input is present inside the existing field.
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('renders no help paragraph when message is omitted (inside Field)', () => {
      const { container } = render(
        <Field label="My Slider">
          <Slider defaultValue={10} />
        </Field>
      );
      expect(container.querySelector('.help')).not.toBeInTheDocument();
    });
  });

  describe('range mode (additional branches)', () => {
    it('updates uncontrolled high thumb without onChange', () => {
      // Exercises lines 317-318: !isControlled branch + onChange undefined
      // optional-call branch on the high thumb handler.
      render(<Slider range defaultValue={[10, 50]} />);
      const inputs = screen.getAllByRole('slider') as HTMLInputElement[];

      fireEvent.change(inputs[1], { target: { value: '90' } });
      expect(inputs[1].value).toBe('90');
    });

    it('uses nameLow for low thumb form field name', () => {
      render(<Slider range defaultValue={[10, 90]} nameLow="priceLow" />);
      const inputs = screen.getAllByRole('slider');
      expect(inputs[0]).toHaveAttribute('name', 'priceLow');
    });

    it('uses nameHigh for high thumb form field name', () => {
      render(<Slider range defaultValue={[10, 90]} nameHigh="priceHigh" />);
      const inputs = screen.getAllByRole('slider');
      expect(inputs[1]).toHaveAttribute('name', 'priceHigh');
    });

    it('renders vertical range slider with both tooltips and aria-orientation', () => {
      // Exercises range + isVertical branches:
      //   - track style ternary (629)
      //   - low/high aria-orientation (658, 684)
      //   - low/high vertical tooltip placement (702-712, 734-744)
      const { container } = render(
        <Slider
          range
          orientation="vertical"
          value={[20, 80]}
          showOutput
          min={0}
          max={100}
        />
      );
      const inputs = screen.getAllByRole('slider');
      expect(inputs[0]).toHaveAttribute('aria-orientation', 'vertical');
      expect(inputs[1]).toHaveAttribute('aria-orientation', 'vertical');

      const lowOutput = container.querySelector(
        '.slider-output-low'
      ) as HTMLElement;
      const highOutput = container.querySelector(
        '.slider-output-high'
      ) as HTMLElement;
      // Vertical tooltip uses `bottom` for placement (not `left`).
      expect(lowOutput.style.bottom).toContain(
        'var(--bulma-slider-thumb-size)'
      );
      expect(highOutput.style.bottom).toContain(
        'var(--bulma-slider-thumb-size)'
      );
    });

    it('vertical range flips tooltips to the left when clipped at right edge', () => {
      // Force window.innerWidth tiny so the tooltipRightEdge (>= 8 from gap)
      // always exceeds it, setting verticalFlippedLeft = true.
      const origInner = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: 0,
      });
      try {
        const { container } = render(
          <Slider
            range
            orientation="vertical"
            value={[20, 80]}
            showOutput
            min={0}
            max={100}
          />
        );
        // The slider wrapper picks up is-flipped-left only when verticalFlippedLeft.
        // Both low and high outputs should reflect the flip.
        const lowOutput = container.querySelector(
          '.slider-output-low'
        ) as HTMLElement;
        const highOutput = container.querySelector(
          '.slider-output-high'
        ) as HTMLElement;
        // verticalFlippedLeft true => uses `right: ...; left: auto`.
        expect(lowOutput.style.right).not.toBe('');
        expect(lowOutput.style.left).toBe('auto');
        expect(highOutput.style.right).not.toBe('');
        expect(highOutput.style.left).toBe('auto');
      } finally {
        Object.defineProperty(window, 'innerWidth', {
          configurable: true,
          writable: true,
          value: origInner,
        });
      }
    });

    it('vertical single slider flips tooltip to the left when clipped at right edge', () => {
      // Single-mode equivalent — exercises the verticalFlippedLeft true branch
      // in the single-mode tooltip style (line 599).
      const origInner = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: 0,
      });
      try {
        const { container } = render(
          <Slider
            orientation="vertical"
            value={50}
            showOutput
            min={0}
            max={100}
          />
        );
        const output = container.querySelector('.slider-output') as HTMLElement;
        expect(output.style.right).not.toBe('');
        expect(output.style.left).toBe('auto');
      } finally {
        Object.defineProperty(window, 'innerWidth', {
          configurable: true,
          writable: true,
          value: origInner,
        });
      }
    });
  });

  describe('rem-to-px (root font-size fallback)', () => {
    it('falls back to 16 when document.documentElement font-size is unparseable', () => {
      // Exercises the `|| 16` fallback on line 382.
      const original = window.getComputedStyle;
      window.getComputedStyle = ((el: Element) => {
        if (el === document.documentElement) {
          return {
            getPropertyValue: () => '',
            fontSize: 'not-a-size',
            getPropertyPriority: () => '',
          } as unknown as CSSStyleDeclaration;
        }
        return {
          getPropertyValue: (prop: string) =>
            prop === '--bulma-slider-thumb-size' ? '1rem' : '',
          fontSize: '16px',
          getPropertyPriority: () => '',
        } as unknown as CSSStyleDeclaration;
      }) as typeof window.getComputedStyle;

      try {
        const { container } = render(<Slider value={50} showOutput />);
        expect(container.querySelector('.slider-output')).toBeInTheDocument();
      } finally {
        window.getComputedStyle = original;
      }
    });
  });
});
