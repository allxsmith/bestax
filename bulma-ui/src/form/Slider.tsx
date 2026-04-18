import React, { forwardRef, useState, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useInsideField, useInsideControl } from './FormContext';
import { Field } from './Field';
import { Control } from './Control';
import { FormFieldProps } from './fieldProps';

/** Valid sizes for the Slider component. */
export type SliderSize = 'small' | 'medium' | 'large';

/** Valid colors for the Slider component. */
export type SliderColor =
  | 'primary'
  | 'link'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

/** Tooltip display mode for the Slider component. */
export type SliderTooltip = 'auto' | 'always' | 'hidden';

/** Orientation of the Slider component. */
export type SliderOrientation = 'horizontal' | 'vertical';

/**
 * A tick mark displayed along the Slider track.
 *
 * @property {number} value - Position of the mark along the slider range.
 * @property {React.ReactNode} [label] - Optional label rendered below the tick mark.
 */
export interface SliderMark {
  value: number;
  label?: React.ReactNode;
}

/**
 * Shared base props for single and range Slider modes.
 *
 * @property {number} [min] - Minimum slider value (default: 0).
 * @property {number} [max] - Maximum slider value (default: 100).
 * @property {number} [step] - Step increment (default: 1).
 * @property {SliderSize} [size] - Size of the slider.
 * @property {SliderColor} [color] - Color of the slider.
 * @property {boolean} [isRounded] - Whether the slider thumb is rounded.
 * @property {boolean} [isCircle] - Whether the slider thumb is circular.
 * @property {boolean} [showOutput] - Whether to show a tooltip with the current value (maps to tooltip 'auto').
 * @property {SliderTooltip} [tooltip] - Tooltip display mode (overrides showOutput).
 * @property {boolean} [ticks] - Whether to display tick marks at each step.
 * @property {SliderMark[]} [marks] - Custom tick mark positions and labels.
 * @property {SliderOrientation} [orientation] - Slider orientation (default: 'horizontal').
 * @property {(value: number) => number} [scale] - Non-linear scale function for displayed values.
 * @property {(value: number) => string} [getAriaValueText] - Custom aria-valuetext formatter.
 * @property {(value: number) => string} [formatOutput] - Custom formatter for the tooltip output.
 */
interface SliderBaseProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'color' | 'size' | 'onChange' | 'value' | 'defaultValue'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'>,
    FormFieldProps {
  min?: number;
  max?: number;
  step?: number;
  size?: SliderSize;
  color?: SliderColor;
  isRounded?: boolean;
  isCircle?: boolean;
  showOutput?: boolean;
  tooltip?: SliderTooltip;
  ticks?: boolean;
  marks?: SliderMark[];
  orientation?: SliderOrientation;
  scale?: (value: number) => number;
  getAriaValueText?: (value: number) => string;
  formatOutput?: (value: number) => string;
}

/**
 * Props for the Slider in single-value mode.
 *
 * @property {false} [range] - Must be false or omitted for single-value mode.
 * @property {number} [value] - Controlled slider value.
 * @property {number} [defaultValue] - Initial value for uncontrolled mode.
 * @property {(value: number) => void} [onChange] - Callback when the value changes.
 * @property {never} [minDistance] - Not applicable in single-value mode.
 * @property {string} [ariaLabel] - Accessible label for the slider input.
 */
export interface SliderSingleProps extends SliderBaseProps {
  range?: false;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  minDistance?: never;
  ariaLabel?: string;
}

/**
 * Props for the Slider in range (dual-thumb) mode.
 *
 * @property {true} range - Must be true to enable range mode.
 * @property {[number, number]} [value] - Controlled range value as [low, high].
 * @property {[number, number]} [defaultValue] - Initial range for uncontrolled mode.
 * @property {(value: [number, number]) => void} [onChange] - Callback when the range changes.
 * @property {number} [minDistance] - Minimum distance between the two thumbs.
 * @property {[string, string]} [ariaLabel] - Accessible labels for the low and high thumb inputs.
 */
export interface SliderRangeProps extends SliderBaseProps {
  range: true;
  value?: [number, number];
  defaultValue?: [number, number];
  onChange?: (value: [number, number]) => void;
  minDistance?: number;
  ariaLabel?: [string, string];
}

/** Props for the Slider component — a discriminated union of single and range modes. */
export type SliderProps = SliderSingleProps | SliderRangeProps;

/**
 * Helper to compute tick positions.
 * If `marks` are provided, those positions are used.
 * If `ticks` is true, generates ticks at every step (capped at 100).
 */
function getTickPositions(
  min: number,
  max: number,
  step: number,
  ticks?: boolean,
  marks?: SliderMark[]
): SliderMark[] {
  if (marks && marks.length > 0) return marks;
  if (!ticks) return [];
  const positions: SliderMark[] = [];
  const count = Math.round((max - min) / step);
  if (count > 100) {
    // Cap at 100 ticks to prevent perf issues
    const tickStep = (max - min) / 100;
    // Skip first (i=0) and last (i=100) — no ticks at endpoints
    for (let i = 1; i < 100; i++) {
      positions.push({ value: min + i * tickStep });
    }
  } else {
    // Skip first (i=0) and last (i=count) — no ticks at endpoints
    for (let i = 1; i < count; i++) {
      positions.push({ value: min + i * step });
    }
  }
  return positions;
}

/**
 * Slider component for selecting a value or range from a range.
 *
 * A styled range input that supports different sizes, colors,
 * optional value display, ticks/marks, range mode (dual thumb),
 * vertical orientation, and non-linear scale.
 *
 * @function
 * @param {SliderProps} props - Props for the Slider component.
 * @returns {JSX.Element} The rendered slider element.
 *
 * @example
 * // Basic slider
 * <Slider defaultValue={50} />
 *
 * @example
 * // Range slider
 * <Slider range defaultValue={[20, 80]} onChange={([low, high]) => {}} />
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (props, ref) => {
    const {
      label,
      labelSize,
      labelProps,
      horizontal,
      message,
      messageColor,
      fieldClassName,
      value: controlledValue,
      defaultValue,
      min = 0,
      max = 100,
      step = 1,
      size,
      color,
      isRounded = false,
      isCircle = false,
      disabled = false,
      showOutput = false,
      tooltip,
      ticks,
      marks,
      orientation = 'horizontal',
      scale,
      getAriaValueText,
      onChange,
      formatOutput,
      range,
      minDistance = 0,
      ariaLabel,
      className,
      ...restProps
    } = props as SliderRangeProps & SliderSingleProps;

    const insideField = useInsideField();
    const insideControl = useInsideControl();
    const { bulmaHelperClasses, rest } = useBulmaClasses(restProps);

    // Resolve tooltip mode: explicit tooltip prop takes precedence, else showOutput maps to 'auto'
    const tooltipMode: SliderTooltip = tooltip ?? (showOutput ? 'auto' : 'hidden');

    // --- Range mode state ---
    const [internalRange, setInternalRange] = useState<[number, number]>(
      () => (range ? (defaultValue as [number, number]) ?? [min, max] : [min, min])
    );
    const [internalSingle, setInternalSingle] = useState<number>(
      () => (!range ? (defaultValue as number) ?? 0 : 0)
    );
    const [showTooltip, setShowTooltip] = useState(false);
    const [showTooltipHigh, setShowTooltipHigh] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const inputHighRef = useRef<HTMLInputElement>(null);
    const outputRef = useRef<HTMLOutputElement>(null);
    const outputHighRef = useRef<HTMLOutputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [flipped, setFlipped] = useState(false);
    const [flippedHigh, setFlippedHigh] = useState(false);
    const [nudgeX, setNudgeX] = useState(0);
    const [nudgeXHigh, setNudgeXHigh] = useState(0);
    const [verticalFlippedLeft, setVerticalFlippedLeft] = useState(false);

    const isControlled = controlledValue !== undefined;

    // Current values
    const currentRange: [number, number] = range
      ? (isControlled ? (controlledValue as [number, number]) : internalRange)
      : [0, 0];
    const currentSingle: number = !range
      ? (isControlled ? (controlledValue as number) : internalSingle)
      : 0;

    // Progress percentages
    const progressSingle = !range ? ((currentSingle - min) / (max - min)) * 100 : 0;
    const progressLow = range ? ((currentRange[0] - min) / (max - min)) * 100 : 0;
    const progressHigh = range ? ((currentRange[1] - min) / (max - min)) * 100 : 0;

    // Scale helper
    const scaleValue = useCallback(
      (v: number) => (scale ? scale(v) : v),
      [scale]
    );

    // Format helper
    const formatValue = useCallback(
      (v: number) => {
        const scaled = scaleValue(v);
        return formatOutput ? formatOutput(scaled) : scaled.toString();
      },
      [formatOutput, scaleValue]
    );

    // --- Handlers ---
    const handleSingleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        if (!isControlled) setInternalSingle(newValue);
        (onChange as ((v: number) => void) | undefined)?.(newValue);
      },
      [isControlled, onChange]
    );

    const handleRangeLowChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = parseFloat(e.target.value);
        const clamped = Math.min(raw, currentRange[1] - minDistance);
        const newRange: [number, number] = [clamped, currentRange[1]];
        if (!isControlled) setInternalRange(newRange);
        (onChange as ((v: [number, number]) => void) | undefined)?.(newRange);
      },
      [isControlled, onChange, currentRange, minDistance]
    );

    const handleRangeHighChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = parseFloat(e.target.value);
        const clamped = Math.max(raw, currentRange[0] + minDistance);
        const newRange: [number, number] = [currentRange[0], clamped];
        if (!isControlled) setInternalRange(newRange);
        (onChange as ((v: [number, number]) => void) | undefined)?.(newRange);
      },
      [isControlled, onChange, currentRange, minDistance]
    );

    // Key handler for Home/End
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Home') {
          e.preventDefault();
          if (!range) {
            if (!isControlled) setInternalSingle(min);
            (onChange as ((v: number) => void) | undefined)?.(min);
          }
        } else if (e.key === 'End') {
          e.preventDefault();
          if (!range) {
            if (!isControlled) setInternalSingle(max);
            (onChange as ((v: number) => void) | undefined)?.(max);
          }
        }
      },
      [range, isControlled, onChange, min, max]
    );

    // Tick positions
    const tickPositions = useMemo(
      () => getTickPositions(min, max, step, ticks, marks),
      [min, max, step, ticks, marks]
    );

    const hasLabels = tickPositions.some(t => t.label !== undefined);
    const isVertical = orientation === 'vertical';

    // Compute corrected thumb position CSS calc expression.
    // The browser insets the range input thumb by half its size from each edge,
    // so the tooltip left must account for this to align with the thumb center.
    const thumbVarName = size ? `slider-thumb-size-${size}` : 'slider-thumb-size';
    const thumbCssVar = `var(--bulma-${thumbVarName})`;
    const effectiveThumbExpr = isCircle ? `(${thumbCssVar} * 1.2)` : thumbCssVar;

    const getThumbLeft = (progressPct: number) => {
      const fraction = progressPct / 100;
      return `calc(${effectiveThumbExpr} / 2 + ${fraction} * (100% - ${effectiveThumbExpr}))`;
    };

    // Vertical tooltip offset: position to the right or left of the thumb
    const verticalTooltipOffset = `calc(50% + ${effectiveThumbExpr} / 2 + 0.5rem)`;

    // Get effective thumb size in px for nudge computation
    const getThumbSizePx = (): number => {
      const el = inputRef.current;
      if (!el) return 0;
      const style = getComputedStyle(el);
      const raw = style.getPropertyValue(`--bulma-${thumbVarName}`).trim();
      const value = parseFloat(raw);
      if (isNaN(value)) return 0;
      let px: number;
      if (raw.includes('rem')) {
        const rootFs = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        px = value * rootFs;
      } else {
        px = value;
      }
      return isCircle ? px * 1.2 : px;
    };

    // Generate wrapper classes
    const sliderClasses = usePrefixedClassNames('slider', {
      [`is-${size}`]: size,
      [`is-${color}`]: color,
      'is-rounded': isRounded,
      'is-circle': isCircle,
      'is-disabled': disabled,
      'has-output': tooltipMode !== 'hidden',
      'has-output-always': tooltipMode === 'always',
      'is-vertical': isVertical,
      'is-range': range,
      'has-ticks': tickPositions.length > 0,
      'has-tick-labels': hasLabels,
    });

    const combinedClasses = classNames(
      sliderClasses,
      bulmaHelperClasses,
      className
    );

    // Combined ref for the first (or only) input
    const combinedRef = (node: HTMLInputElement | null) => {
      (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    };

    // Tooltip show/hide for auto mode
    const showTipLow = tooltipMode === 'always' || (tooltipMode === 'auto' && showTooltip);
    const showTipHigh = tooltipMode === 'always' || (tooltipMode === 'auto' && showTooltipHigh);

    // Aria value text
    const getAriaProps = (value: number) => {
      const ariaProps: Record<string, string> = {};
      if (getAriaValueText) {
        ariaProps['aria-valuetext'] = getAriaValueText(value);
      } else if (scale) {
        ariaProps['aria-valuetext'] = scaleValue(value).toString();
      }
      return ariaProps;
    };

    // Detect tooltip overflow: flip vertically if clipped at top,
    // nudge horizontally if clipped at left/right edge.
    // We compute the un-nudged tooltip position from the progress %
    // and wrapper rect to avoid feedback loops.
    const computeNudge = useCallback(
      (el: HTMLElement, wrapper: HTMLElement, progressPct: number, thumbSizePx: number): number => {
        const wr = wrapper.getBoundingClientRect();
        const tooltipWidth = el.offsetWidth;
        // Corrected center: accounts for thumb inset from track edges
        const fraction = progressPct / 100;
        const centerX = wr.left + thumbSizePx / 2 + fraction * (wr.width - thumbSizePx);
        const tooltipLeft = centerX - tooltipWidth / 2;
        const tooltipRight = centerX + tooltipWidth / 2;
        if (tooltipLeft < wr.left) {
          return wr.left - tooltipLeft; // nudge right
        }
        if (tooltipRight > wr.right) {
          return wr.right - tooltipRight; // nudge left (negative)
        }
        return 0;
      },
      []
    );

    useLayoutEffect(() => {
      if (isVertical) return;
      const wrapper = wrapperRef.current;
      const el = outputRef.current;
      if (wrapper && el) {
        const wrapperTop = wrapper.getBoundingClientRect().top;
        const tooltipHeight = el.offsetHeight + 10;
        setFlipped(wrapperTop < tooltipHeight);
        const pct = range ? progressLow : progressSingle;
        const thumbPx = getThumbSizePx();
        setNudgeX(computeNudge(el, wrapper, pct, thumbPx));
      }
    });

    useLayoutEffect(() => {
      if (isVertical || !range) return;
      const wrapper = wrapperRef.current;
      const el = outputHighRef.current;
      if (wrapper && el) {
        const wrapperTop = wrapper.getBoundingClientRect().top;
        const tooltipHeight = el.offsetHeight + 10;
        setFlippedHigh(wrapperTop < tooltipHeight);
        const thumbPx = getThumbSizePx();
        setNudgeXHigh(computeNudge(el, wrapper, progressHigh, thumbPx));
      }
    });

    // Detect vertical tooltip overflow: flip to left if no space on right
    useLayoutEffect(() => {
      if (!isVertical) return;
      const wrapper = wrapperRef.current;
      const el = outputRef.current;
      if (!wrapper || !el) return;
      const wrapperRect = wrapper.getBoundingClientRect();
      const tooltipWidth = el.offsetWidth;
      const thumbPx = getThumbSizePx();
      const gap = 8; // 0.5rem
      // Tooltip right edge if placed to the right of the thumb
      const tooltipRightEdge = wrapperRect.left + wrapperRect.width / 2 + thumbPx / 2 + gap + tooltipWidth;
      setVerticalFlippedLeft(tooltipRightEdge > window.innerWidth);
    });

    // Vertical wrapper style
    const wrapperStyle = isVertical
      ? { height: 'var(--bulma-slider-vertical-height, 200px)' } as React.CSSProperties
      : undefined;

    // Render ticks
    const renderTicks = () => {
      if (tickPositions.length === 0) return null;
      return (
        <div className="slider-ticks">
          {tickPositions.map((tick, i) => {
            const pct = ((tick.value - min) / (max - min)) * 100;
            const posStyle = isVertical
              ? { bottom: `${pct}%` }
              : { left: `${pct}%` };
            const isEndpoint = tick.value === min || tick.value === max;
            return (
              <span
                key={i}
                className={classNames('slider-tick', { 'is-endpoint': isEndpoint })}
                style={posStyle}
              >
                {tick.label !== undefined && (
                  <span className="slider-tick-label">{tick.label}</span>
                )}
              </span>
            );
          })}
        </div>
      );
    };

    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });
    const messageEl = message ? <p className={helpClass}>{message}</p> : null;

    // --- Single slider ---
    const sliderElement = !range ? (
      <div ref={wrapperRef} className={combinedClasses} style={wrapperStyle}>
        <input
          ref={combinedRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentSingle}
          disabled={disabled}
          onChange={handleSingleChange}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          className="slider-input"
          style={
            {
              '--slider-progress': `${progressSingle}%`,
            } as React.CSSProperties
          }
          aria-valuenow={currentSingle}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-orientation={isVertical ? 'vertical' : undefined}
          aria-label={ariaLabel as string | undefined}
          {...getAriaProps(currentSingle)}
          {...rest}
        />
        {tooltipMode !== 'hidden' && (
          <output
            ref={outputRef}
            className={classNames('slider-output', {
              'is-visible': showTipLow,
              'is-flipped': flipped,
              'is-flipped-left': isVertical && verticalFlippedLeft,
            })}
            style={
              isVertical
                ? (verticalFlippedLeft
                    ? { bottom: getThumbLeft(progressSingle), right: verticalTooltipOffset, left: 'auto' }
                    : { bottom: getThumbLeft(progressSingle), left: verticalTooltipOffset, right: 'auto' }
                  ) as React.CSSProperties
                : {
                    left: getThumbLeft(progressSingle),
                    transform: `translateX(calc(-50% + ${nudgeX}px))`,
                    '--slider-output-arrow-offset': `calc(50% - ${nudgeX}px)`,
                  } as React.CSSProperties
            }
          >
            {formatValue(currentSingle)}
          </output>
        )}
        {renderTicks()}
      </div>
    ) : (
      // --- Range slider ---
      <div ref={wrapperRef} className={combinedClasses} style={wrapperStyle}>
        {/* Visible track background */}
        <div
          className="slider-track"
          style={
            isVertical
              ? ({
                  '--slider-progress-low': `${progressLow}%`,
                  '--slider-progress-high': `${progressHigh}%`,
                } as React.CSSProperties)
              : ({
                  '--slider-progress-low': `${progressLow}%`,
                  '--slider-progress-high': `${progressHigh}%`,
                } as React.CSSProperties)
          }
        />
        {/* Low thumb */}
        <input
          ref={combinedRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentRange[0]}
          disabled={disabled}
          onChange={handleRangeLowChange}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          className="slider-input slider-input-low"
          aria-valuenow={currentRange[0]}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-orientation={isVertical ? 'vertical' : undefined}
          aria-label={(ariaLabel as [string, string] | undefined)?.[0] ?? 'Minimum value'}
          {...getAriaProps(currentRange[0])}
          {...rest}
        />
        {/* High thumb */}
        <input
          ref={inputHighRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentRange[1]}
          disabled={disabled}
          onChange={handleRangeHighChange}
          onMouseEnter={() => setShowTooltipHigh(true)}
          onMouseLeave={() => setShowTooltipHigh(false)}
          onFocus={() => setShowTooltipHigh(true)}
          onBlur={() => setShowTooltipHigh(false)}
          className="slider-input slider-input-high"
          aria-valuenow={currentRange[1]}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-orientation={isVertical ? 'vertical' : undefined}
          aria-label={(ariaLabel as [string, string] | undefined)?.[1] ?? 'Maximum value'}
          {...getAriaProps(currentRange[1])}
        />
        {/* Low tooltip */}
        {tooltipMode !== 'hidden' && (
          <output
            ref={outputRef}
            className={classNames('slider-output slider-output-low', {
              'is-visible': showTipLow,
              'is-flipped': flipped,
              'is-flipped-left': isVertical && verticalFlippedLeft,
            })}
            style={
              isVertical
                ? (verticalFlippedLeft
                    ? { bottom: getThumbLeft(progressLow), right: verticalTooltipOffset, left: 'auto' }
                    : { bottom: getThumbLeft(progressLow), left: verticalTooltipOffset, right: 'auto' }
                  ) as React.CSSProperties
                : {
                    left: getThumbLeft(progressLow),
                    transform: `translateX(calc(-50% + ${nudgeX}px))`,
                    '--slider-output-arrow-offset': `calc(50% - ${nudgeX}px)`,
                  } as React.CSSProperties
            }
          >
            {formatValue(currentRange[0])}
          </output>
        )}
        {/* High tooltip */}
        {tooltipMode !== 'hidden' && (
          <output
            ref={outputHighRef}
            className={classNames('slider-output slider-output-high', {
              'is-visible': showTipHigh,
              'is-flipped': flippedHigh,
              'is-flipped-left': isVertical && verticalFlippedLeft,
            })}
            style={
              isVertical
                ? (verticalFlippedLeft
                    ? { bottom: getThumbLeft(progressHigh), right: verticalTooltipOffset, left: 'auto' }
                    : { bottom: getThumbLeft(progressHigh), left: verticalTooltipOffset, right: 'auto' }
                  ) as React.CSSProperties
                : {
                    left: getThumbLeft(progressHigh),
                    transform: `translateX(calc(-50% + ${nudgeXHigh}px))`,
                    '--slider-output-arrow-offset': `calc(50% - ${nudgeXHigh}px)`,
                  } as React.CSSProperties
            }
          >
            {formatValue(currentRange[1])}
          </output>
        )}
        {renderTicks()}
      </div>
    );

    let content = sliderElement;

    if (!insideControl) {
      content = <Control>{content}</Control>;
    }

    if (!insideField) {
      return (
        <Field label={label} labelSize={labelSize} labelProps={labelProps}
               horizontal={horizontal} className={fieldClassName}>
          {content}
          {messageEl}
        </Field>
      );
    }

    return <>{content}{messageEl}</>;
  }
);

Slider.displayName = 'Slider';

export default Slider;
