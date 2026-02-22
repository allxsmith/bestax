import React, { forwardRef, useState, useCallback, useRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export type SliderSize = 'small' | 'medium' | 'large';
export type SliderColor =
  | 'primary'
  | 'link'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

/**
 * Props for the Slider component.
 *
 * @property {number} [value] - Controlled value.
 * @property {number} [defaultValue] - Default value for uncontrolled usage.
 * @property {number} [min] - Minimum value. Default: 0.
 * @property {number} [max] - Maximum value. Default: 100.
 * @property {number} [step] - Step increment. Default: 1.
 * @property {SliderSize} [size] - Size variant.
 * @property {SliderColor} [color] - Color variant.
 * @property {boolean} [isRounded] - Use rounded track ends.
 * @property {boolean} [isCircle] - Use circular thumb.
 * @property {boolean} [disabled] - Whether the slider is disabled.
 * @property {boolean} [showOutput] - Show current value tooltip.
 * @property {(value: number) => void} [onChange] - Callback when value changes.
 * @property {(value: number) => string} [formatOutput] - Format function for output display.
 */
export interface SliderProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'color' | 'size' | 'onChange' | 'value' | 'defaultValue'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  size?: SliderSize;
  color?: SliderColor;
  isRounded?: boolean;
  isCircle?: boolean;
  showOutput?: boolean;
  onChange?: (value: number) => void;
  formatOutput?: (value: number) => string;
}

/**
 * Slider component for selecting a value from a range.
 *
 * A styled range input that supports different sizes, colors, and
 * optional value display. Works in both controlled and uncontrolled modes.
 *
 * @function
 * @param {SliderProps} props - Props for the Slider component.
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the input element.
 * @returns {JSX.Element} The rendered slider component.
 *
 * @example
 * // Basic slider
 * <Slider defaultValue={50} />
 *
 * @example
 * // Controlled slider with output
 * const [value, setValue] = useState(50);
 * <Slider
 *   value={value}
 *   onChange={setValue}
 *   showOutput
 *   color="primary"
 * />
 *
 * @example
 * // Custom range
 * <Slider min={0} max={1000} step={10} defaultValue={500} />
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value: controlledValue,
      defaultValue = 0,
      min = 0,
      max = 100,
      step = 1,
      size,
      color,
      isRounded = false,
      isCircle = false,
      disabled = false,
      showOutput = false,
      onChange,
      formatOutput,
      className,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const [internalValue, setInternalValue] = useState(defaultValue);
    const [showTooltip, setShowTooltip] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Determine if controlled
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    // Calculate progress percentage
    const progress = ((currentValue - min) / (max - min)) * 100;

    // Handle change
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        if (!isControlled) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);
      },
      [isControlled, onChange]
    );

    // Format output value
    const formattedValue = formatOutput
      ? formatOutput(currentValue)
      : currentValue.toString();

    // Generate classes
    const sliderClasses = usePrefixedClassNames('slider', {
      [`is-${size}`]: size,
      [`is-${color}`]: color,
      'is-rounded': isRounded,
      'is-circle': isCircle,
      'is-disabled': disabled,
      'has-output': showOutput,
    });

    const combinedClasses = classNames(
      sliderClasses,
      bulmaHelperClasses,
      className
    );

    // Use combined ref
    const combinedRef = (node: HTMLInputElement | null) => {
      (inputRef as React.MutableRefObject<HTMLInputElement | null>).current =
        node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    };

    return (
      <div className={combinedClasses}>
        <input
          ref={combinedRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          disabled={disabled}
          onChange={handleChange}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          className="slider-input"
          style={
            {
              '--slider-progress': `${progress}%`,
            } as React.CSSProperties
          }
          aria-valuenow={currentValue}
          aria-valuemin={min}
          aria-valuemax={max}
          {...rest}
        />
        {showOutput && (
          <output
            className={classNames('slider-output', {
              'is-visible': showTooltip,
            })}
            style={{
              left: `${progress}%`,
            }}
          >
            {formattedValue}
          </output>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export default Slider;
