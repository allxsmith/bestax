import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  classNames,
  prefixedClassNames,
  usePrefixedClassNames,
} from '../helpers/classNames';
import { useClassPrefix } from '../helpers/Config';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useIsHydrated } from '../helpers/useIsHydrated';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { withSubComponents } from '../helpers/withSubComponents';
import { ColorSwatch } from '../elements/ColorSwatch';
import {
  ColorFormat,
  Hsva,
  formatColor,
  hsvaToRgba,
  parseColor,
  prefersDarkInk,
  sameColor,
} from './_colorInternals/colorMath';
import {
  ColorPickerContext,
  keepingChannels,
  noop,
  standalone,
  useColorPicker,
  usePicker,
} from './_colorInternals/pickerState';
import { Field } from './Field';
import { Control } from './Control';
import { FormFieldProps } from './fieldProps';
import {
  useInsideField,
  useInsideControl,
  rendersOwnField,
  rendersOwnControl,
  useFieldsetDisabled,
} from './FormContext';
import { useAutoLabelledBy } from './useAutoLabelId';

export type { ColorFormat } from './_colorInternals/colorMath';

/**
 * A preset color for a picker's swatches: a CSS color, or a CSS color with
 * a name. The name labels the swatch for a screen reader and shows as its
 * tooltip; without one, the color as written does.
 */
export type ColorPickerSwatch = string | { color: string; label?: string };

/**
 * The strings a color picker says, each with an English default. A key
 * left out, or set to an empty string, keeps its default.
 */
export interface ColorPickerLabels {
  /**
   * Names the saturation and brightness square.
   * @defaultValue 'Saturation and brightness'
   */
  area?: string;
  /**
   * What a screen reader calls the square in place of "slider".
   * @defaultValue '2D slider'
   */
  areaRoleDescription?: string;
  /**
   * The square's horizontal channel, in its value text.
   * @defaultValue 'Saturation'
   */
  saturation?: string;
  /**
   * The square's vertical channel, in its value text.
   * @defaultValue 'Brightness'
   */
  brightness?: string;
  /**
   * Names the hue slider.
   * @defaultValue 'Hue'
   */
  hue?: string;
  /**
   * Names the alpha slider.
   * @defaultValue 'Alpha'
   */
  alpha?: string;
  /**
   * The unit after the hue's number in its value text, "171 degrees".
   * Inside a `LocaleProvider` with a `locale`, that locale writes the number
   * and its unit, and this isn't used.
   * @defaultValue 'degrees'
   */
  degrees?: string;
  /**
   * Names the field that shows the value as text.
   * @defaultValue 'Color value'
   */
  value?: string;
  /**
   * Names the group of swatches.
   * @defaultValue 'Swatches'
   */
  swatches?: string;
  /**
   * Names the eye dropper button.
   * @defaultValue 'Pick a color from the screen'
   */
  eyeDropper?: string;
}

// The theme colors `swatches="bulma"` shows, read off the page.
const BULMA_SWATCHES: ReadonlyArray<{ color: string; label: string }> = [
  { color: 'var(--bulma-primary)', label: 'Primary' },
  { color: 'var(--bulma-link)', label: 'Link' },
  { color: 'var(--bulma-info)', label: 'Info' },
  { color: 'var(--bulma-success)', label: 'Success' },
  { color: 'var(--bulma-warning)', label: 'Warning' },
  { color: 'var(--bulma-danger)', label: 'Danger' },
];

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

/** Whether the element is laid out right to left. */
const isRtl = (element: Element | null) =>
  !!element && getComputedStyle(element).direction === 'rtl';

/** Where a pointer is across an element, from 0 to 1 each way. */
const pointIn = (element: HTMLElement, event: React.PointerEvent) => {
  const rect = element.getBoundingClientRect();
  const across =
    rect.width > 0 ? clamp((event.clientX - rect.left) / rect.width, 0, 1) : 0;
  const down =
    rect.height > 0 ? clamp((event.clientY - rect.top) / rect.height, 0, 1) : 0;
  return { x: isRtl(element) ? 1 - across : across, y: down };
};

/** The color's red, green and blue, rounded, as a CSS `rgb()` takes them. */
const rgbChannels = (color: Hsva) => {
  const { r, g, b } = hsvaToRgba(color);
  return `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;
};

/** Whether a press should start a drag: any touch or pen, a mouse's main button. */
const startsDrag = (event: React.PointerEvent) =>
  event.pointerType !== 'mouse' || event.button === 0;

/** Hands a node to a forwarded ref and to one of the part's own. */
function setRefs<T>(
  node: T | null,
  own: React.MutableRefObject<T | null>,
  forwarded: React.ForwardedRef<T>
) {
  own.current = node;
  if (typeof forwarded === 'function') forwarded(node);
  else if (forwarded) forwarded.current = node;
}

// ---------------------------------------------------------------------------
// ColorPicker.Area
// ---------------------------------------------------------------------------

/**
 * Props for ColorPicker.Area. The helper props, the other attributes and the
 * `ref` land on the square's `<div>`.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the square's `<div>`.
 */
export interface ColorPickerAreaProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
}

/**
 * The saturation and brightness square, operated by pointer or by keyboard as one 2D slider.
 *
 * @function
 * @param {ColorPickerAreaProps} props - Props for ColorPicker.Area.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the square's `<div>`.
 * @returns {JSX.Element | null} The square, or nothing outside a ColorPicker.
 */
export const ColorPickerArea = forwardRef<HTMLDivElement, ColorPickerAreaProps>(
  ({ className, style, ...props }, ref) => {
    const picker = usePicker('Area');
    const live = picker ?? standalone;
    const { color, change, end, disabled, labels, touch, percent } = live;
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);

    const rootRef = useRef<HTMLDivElement | null>(null);
    const xRef = useRef<HTMLInputElement>(null);
    const yRef = useRef<HTMLInputElement>(null);
    // The axis whose input holds the tab stop: the one focused or moved last.
    const [axis, setAxis] = useState<'x' | 'y'>('x');
    // Once a key has moved the square, both inputs are exposed until focus
    // leaves it, so the one that moved can be read.
    const [keyed, setKeyed] = useState(false);
    const draggingRef = useRef(false);

    const areaClass = usePrefixedClassNames('color-area', {
      'is-disabled': disabled,
    });
    const thumbClass = usePrefixedClassNames('color-area-thumb');
    const inputClass = usePrefixedClassNames('color-area-input');

    const s = Math.round(color.s);
    const v = Math.round(color.v);
    const saturationText = `${labels.saturation} ${percent(s)}`;
    const brightnessText = `${labels.brightness} ${percent(v)}`;

    const focusAxis = (which: 'x' | 'y') =>
      (which === 'x' ? xRef : yRef).current?.focus({ preventScroll: true });
    // The axis a key moved to, focused once the render that shows its input
    // is on the page, so it's no longer aria-hidden as it takes focus.
    const focusNextRef = useRef<'x' | 'y' | null>(null);
    useClientLayoutEffect(() => {
      if (!focusNextRef.current) return;
      focusAxis(focusNextRef.current);
      focusNextRef.current = null;
    });

    const moveTo = (event: React.PointerEvent<HTMLDivElement>) => {
      const { x, y } = pointIn(event.currentTarget, event);
      change({ ...color, s: x * 100, v: (1 - y) * 100 });
    };

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || !startsDrag(event)) return;
      // No text selection, and focus goes where the square puts it.
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      draggingRef.current = true;
      moveTo(event);
      focusAxis(axis);
    };
    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      if (draggingRef.current) moveTo(event);
    };
    const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      end();
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      const by = event.shiftKey ? 10 : 1;
      // The horizontal arrows follow the screen: right to left, saturation
      // grows to the left.
      const right = isRtl(rootRef.current) ? -by : by;
      const moves: Record<string, [number, number]> = {
        ArrowRight: [right, 0],
        ArrowLeft: [-right, 0],
        ArrowUp: [0, by],
        ArrowDown: [0, -by],
        PageUp: [0, 10],
        PageDown: [0, -10],
        Home: [-10, 0],
        End: [10, 0],
      };
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      const [dx, dy] = move;
      change(
        {
          ...color,
          s: clamp(s + dx, 0, 100),
          v: clamp(v + dy, 0, 100),
        },
        true
      );
      const moved = dx !== 0 ? 'x' : 'y';
      setAxis(moved);
      setKeyed(true);
      if (moved !== axis) focusNextRef.current = moved;
    };

    // A touch screen reader, or a browser's own stepping, sets an input's
    // value without a key the square handled.
    const onInput =
      (which: 'x' | 'y') => (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        change(
          which === 'x' ? { ...color, s: value } : { ...color, v: value },
          true
        );
      };

    const onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      const next = event.relatedTarget;
      if (next !== xRef.current && next !== yRef.current) setKeyed(false);
    };

    // What both inputs share; each adds its axis, and the handlers.
    const shared = {
      type: 'range',
      className: inputClass,
      min: 0,
      max: 100,
      step: 1,
      disabled,
      'aria-label': labels.area,
      'aria-roledescription': labels.areaRoleDescription,
    } as const;
    // The one not holding the tab stop is hidden until a key moves the
    // square, so a screen reader lists one control; both show on touch.
    const tabIndexOf = (which: 'x' | 'y') => (touch || axis === which ? 0 : -1);
    const hiddenOf = (which: 'x' | 'y') =>
      touch || keyed || axis === which ? undefined : true;

    if (!picker) return null;

    return (
      <div
        ref={node => setRefs(node, rootRef, ref)}
        className={classNames(areaClass, bulmaHelperClasses, className)}
        style={
          {
            ...style,
            '--color-picker-hue': Math.round(color.h),
            '--color-picker-rgb': rgbChannels(color),
            '--color-area-x': `${color.s}%`,
            '--color-area-y': `${100 - color.v}%`,
          } as React.CSSProperties
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        {...rest}
      >
        <div className={thumbClass} role="presentation">
          <input
            ref={xRef}
            {...shared}
            value={s}
            aria-valuetext={`${saturationText}, ${brightnessText}`}
            aria-orientation="horizontal"
            tabIndex={tabIndexOf('x')}
            aria-hidden={hiddenOf('x')}
            onChange={onInput('x')}
            onKeyDown={onKeyDown}
            onFocus={() => setAxis('x')}
            onBlur={onBlur}
          />
          <input
            ref={yRef}
            {...shared}
            value={v}
            aria-valuetext={`${brightnessText}, ${saturationText}`}
            aria-orientation="vertical"
            tabIndex={tabIndexOf('y')}
            aria-hidden={hiddenOf('y')}
            onChange={onInput('y')}
            onKeyDown={onKeyDown}
            onFocus={() => setAxis('y')}
            onBlur={onBlur}
          />
        </div>
      </div>
    );
  }
);

ColorPickerArea.displayName = 'ColorPicker.Area';

// ---------------------------------------------------------------------------
// ColorPicker.HueSlider and ColorPicker.AlphaSlider
// ---------------------------------------------------------------------------

/**
 * Props for ColorPicker.HueSlider and ColorPicker.AlphaSlider. The helper
 * props, the other attributes and the `ref` land on the slider's `<div>`.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the slider's `<div>`.
 */
export interface ColorPickerSliderProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
}

interface ChannelSliderProps extends ColorPickerSliderProps {
  channel: 'hue' | 'alpha';
}

/** The hue or the alpha slider: a hidden native range under a drawn track. */
const ChannelSlider = forwardRef<HTMLDivElement, ChannelSliderProps>(
  ({ channel, className, style, ...props }, ref) => {
    const picker = usePicker(channel === 'hue' ? 'HueSlider' : 'AlphaSlider');
    const live = picker ?? standalone;
    const { color, change, end, disabled, labels, percent, degrees } = live;
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const draggingRef = useRef(false);

    const isHue = channel === 'hue';
    const max = isHue ? 360 : 100;
    const value = Math.round(isHue ? color.h : color.a * 100);
    const withValue = (next: number): Hsva =>
      isHue ? { ...color, h: next } : { ...color, a: next / 100 };

    const sliderClass = usePrefixedClassNames('color-slider', {
      'is-hue': isHue,
      'is-alpha': !isHue,
      'is-disabled': disabled,
    });
    const trackClass = usePrefixedClassNames('color-slider-track');
    const thumbClass = usePrefixedClassNames('color-slider-thumb');
    const inputClass = usePrefixedClassNames('color-slider-input');

    const moveTo = (event: React.PointerEvent<HTMLDivElement>) => {
      const { x } = pointIn(event.currentTarget, event);
      change(withValue(x * max));
    };
    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || !startsDrag(event)) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      draggingRef.current = true;
      moveTo(event);
      rootRef.current?.querySelector('input')?.focus({ preventScroll: true });
    };
    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      if (draggingRef.current) moveTo(event);
    };
    const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      end();
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      const by = event.shiftKey ? 10 : 1;
      const right = isRtl(rootRef.current) ? -by : by;
      const steps: Record<string, number> = {
        ArrowRight: right,
        ArrowLeft: -right,
        ArrowUp: by,
        ArrowDown: -by,
        PageUp: 10,
        PageDown: -10,
        Home: -max,
        End: max,
      };
      const step = steps[event.key];
      if (step === undefined) return;
      event.preventDefault();
      change(withValue(clamp(value + step, 0, max)), true);
    };

    if (!picker) return null;

    return (
      <div
        ref={node => setRefs(node, rootRef, ref)}
        className={classNames(sliderClass, bulmaHelperClasses, className)}
        style={
          {
            ...style,
            '--color-picker-hue': Math.round(color.h),
            '--color-picker-rgb': rgbChannels(color),
            '--color-slider-position': `${(value / max) * 100}%`,
          } as React.CSSProperties
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        {...rest}
      >
        <div className={trackClass} />
        <div className={thumbClass} role="presentation">
          <input
            type="range"
            className={inputClass}
            min={0}
            max={max}
            step={1}
            value={value}
            disabled={disabled}
            // Spelled out, as the square's is, so Safari's Tab reaches it
            // with its default settings, which skip a range input without
            // one.
            tabIndex={0}
            aria-label={isHue ? labels.hue : labels.alpha}
            aria-valuetext={isHue ? degrees(value) : percent(value)}
            onChange={event =>
              change(withValue(Number(event.target.value)), true)
            }
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    );
  }
);

ChannelSlider.displayName = 'ChannelSlider';

/**
 * The hue slider, from red round the spectrum and back to red.
 *
 * @function
 * @param {ColorPickerSliderProps} props - Props for ColorPicker.HueSlider.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the slider's `<div>`.
 * @returns {JSX.Element | null} The slider, or nothing outside a ColorPicker.
 */
export const ColorPickerHueSlider = forwardRef<
  HTMLDivElement,
  ColorPickerSliderProps
>((props, ref) => <ChannelSlider ref={ref} {...props} channel="hue" />);

ColorPickerHueSlider.displayName = 'ColorPicker.HueSlider';

/**
 * The alpha slider, from see-through to solid.
 *
 * @function
 * @param {ColorPickerSliderProps} props - Props for ColorPicker.AlphaSlider.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the slider's `<div>`.
 * @returns {JSX.Element | null} The slider, or nothing outside a ColorPicker.
 */
export const ColorPickerAlphaSlider = forwardRef<
  HTMLDivElement,
  ColorPickerSliderProps
>((props, ref) => <ChannelSlider ref={ref} {...props} channel="alpha" />);

ColorPickerAlphaSlider.displayName = 'ColorPicker.AlphaSlider';

// ---------------------------------------------------------------------------
// ColorPicker.Swatches
// ---------------------------------------------------------------------------

/**
 * Props for ColorPicker.Swatches. The helper props, the other attributes and
 * the `ref` land on the group's `<div>`.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the group's `<div>`.
 */
export interface ColorPickerSwatchesProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * The colors to offer, in place of the picker's own `swatches`: a list,
   * or `"bulma"` for the page's theme colors.
   */
  swatches?: ColorPickerSwatch[] | 'bulma';
}

/** Arrow keys and how far they move along the swatches. */
const SWATCH_STEPS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/**
 * The swatches, a radio group of preset colors that sets the picker's color.
 *
 * @function
 * @param {ColorPickerSwatchesProps} props - Props for ColorPicker.Swatches.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the group's `<div>`.
 * @returns {JSX.Element | null} The swatches, or nothing outside a ColorPicker or with none to show.
 */
export const ColorPickerSwatches = forwardRef<
  HTMLDivElement,
  ColorPickerSwatchesProps
>(({ className, swatches: ownSwatches, ...props }, ref) => {
  const picker = usePicker('Swatches');
  const live = picker ?? standalone;
  const { color, change, disabled, labels, format, alpha } = live;
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const classPrefix = useClassPrefix();
  const groupClass = usePrefixedClassNames('color-picker-swatches');
  const rootRef = useRef<HTMLDivElement | null>(null);

  const given = ownSwatches ?? live.swatches;
  const list = useMemo(
    () =>
      (given === 'bulma' ? BULMA_SWATCHES : (given ?? [])).map(entry =>
        typeof entry === 'string' ? { color: entry } : entry
      ),
    [given]
  );

  // A color the picker can't read as written, such as a var(), is read off
  // the page, as the text the swatch's own custom property resolves to.
  const chipsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const textOf = useCallback(
    (i: number): string => {
      const chip = chipsRef.current[i];
      if (parseColor(list[i].color) || !chip) return list[i].color;
      return getComputedStyle(chip)
        .getPropertyValue('--color-swatch-color')
        .trim();
    },
    [list]
  );
  // Those texts, read after every render rather than once: a Theme can
  // change the variables behind them while the picker is open, and the
  // chosen swatch has to follow. A read that changes nothing renders
  // nothing more.
  const [resolved, setResolved] = useState<string[]>([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- after every render on purpose; the updater keeps the state when nothing changed, so it settles
  useEffect(() => {
    const next = list.map((_, i) => textOf(i));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a var() color can only be read off the page once its swatch is on it
    setResolved(previous =>
      previous.length === next.length &&
      previous.every((text, i) => text === next[i])
        ? previous
        : next
    );
  });

  const colorOf = (i: number) =>
    parseColor(list[i].color) ?? parseColor(resolved[i]);
  // The same color, as far as the picker's value can tell: the same 8-bit
  // color, or the same text, since an HSL value is rounded.
  const shownText = formatColor(color, format, alpha);
  const checked = list.findIndex((_, i) => {
    const swatch = colorOf(i);
    if (!swatch) return false;
    const solid = alpha ? swatch : { ...swatch, a: 1 };
    return (
      sameColor(solid, color) || formatColor(solid, format, alpha) === shownText
    );
  });
  const [focused, setFocused] = useState<number | null>(null);
  const tabStop = focused ?? (checked >= 0 ? checked : 0);

  // Read afresh, so a theme that changed since the last render counts.
  const pick = (i: number) => {
    const text = textOf(i);
    const swatch = parseColor(text);
    if (swatch) change(keepingChannels(swatch, color, text), true);
  };

  const onKeyDown = (i: number) => (event: React.KeyboardEvent) => {
    const buttons = Array.from(
      (rootRef.current as HTMLDivElement).querySelectorAll<HTMLButtonElement>(
        '[role="radio"]'
      )
    );
    let next: number | undefined;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else if (SWATCH_STEPS[event.key]) {
      // Left and Right follow the screen, so right to left they swap.
      const sideways = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
      const flip = sideways && isRtl(rootRef.current) ? -1 : 1;
      next =
        (i + SWATCH_STEPS[event.key] * flip + buttons.length) % buttons.length;
    }
    if (next === undefined) return;
    event.preventDefault();
    buttons[next]?.focus();
    pick(next);
  };

  if (!picker || list.length === 0) return null;

  return (
    <div
      ref={node => setRefs(node, rootRef, ref)}
      className={classNames(groupClass, bulmaHelperClasses, className)}
      role="radiogroup"
      aria-label={labels.swatches}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      {list.map((entry, i) => {
        const swatch = colorOf(i);
        const isChecked = i === checked;
        // The check is drawn in black or white with a ring of the other, so
        // it shows on any color. On a see-through swatch the page shows
        // through, so it takes the scheme's text color and background,
        // which follow dark mode, in place of the swatch's own.
        const seeThrough = !!swatch && swatch.a < 1;
        return (
          <button
            key={`${entry.color}-${i}`}
            type="button"
            role="radio"
            aria-checked={isChecked}
            aria-label={entry.label || entry.color}
            title={entry.label}
            tabIndex={i === tabStop ? 0 : -1}
            disabled={disabled}
            className={prefixedClassNames(classPrefix, 'color-picker-swatch', {
              'is-checked': isChecked,
              'is-see-through': seeThrough,
              'is-dark-ink': !!swatch && !seeThrough && prefersDarkInk(swatch),
            })}
            onClick={() => pick(i)}
            onKeyDown={onKeyDown(i)}
            onFocus={() => setFocused(i)}
            onBlur={() => setFocused(null)}
          >
            <ColorSwatch
              ref={node => {
                chipsRef.current[i] = node;
              }}
              color={entry.color}
              aria-hidden="true"
            >
              {isChecked && (
                <CheckIcon
                  haloClass={prefixedClassNames(
                    classPrefix,
                    'color-picker-check-halo'
                  )}
                />
              )}
            </ColorSwatch>
          </button>
        );
      })}
    </div>
  );
});

ColorPickerSwatches.displayName = 'ColorPicker.Swatches';

/**
 * The check on the chosen swatch: a ring in `haloClass`, and the check over
 * it in the current color.
 */
const CheckIcon = ({ haloClass }: { haloClass: string }) => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true">
    {['halo', 'ink'].map(part => (
      <path
        key={part}
        className={part === 'halo' ? haloClass : undefined}
        d="M3.5 8.5l3 3 6-7"
        fill="none"
        stroke="currentColor"
        strokeWidth={part === 'halo' ? 4.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ))}
  </svg>
);

// ---------------------------------------------------------------------------
// ColorPicker.Input
// ---------------------------------------------------------------------------

/**
 * Props for ColorPicker.Input. The helper props, the other attributes and
 * the `ref` land on the row's `<div>`.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the row's `<div>`.
 */
export interface ColorPickerInputProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
}

/** The browser's eye dropper, where it has one. */
interface EyeDropperLike {
  open: () => Promise<{ sRGBHex: string }>;
}
type EyeDropperConstructor = new () => EyeDropperLike;

/**
 * The value as text you can type in, beside a preview swatch, with the eye dropper when the picker has `eyeDropper`.
 *
 * @function
 * @param {ColorPickerInputProps} props - Props for ColorPicker.Input.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the row's `<div>`.
 * @returns {JSX.Element | null} The row, or nothing outside a ColorPicker.
 */
export const ColorPickerInput = forwardRef<
  HTMLDivElement,
  ColorPickerInputProps
>(({ className, ...props }, ref) => {
  const picker = usePicker('Input');
  const live = picker ?? standalone;
  const { color, text, change, disabled, labels, eyeDropper } = live;
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const rowClass = usePrefixedClassNames('color-picker-value');
  const previewClass = usePrefixedClassNames('color-picker-preview');
  // What's been typed and not yet committed, or null while the field
  // shows the value.
  const [draft, setDraft] = useState<string | null>(null);
  const invalid = draft !== null && !parseColor(draft);
  const inputClass = usePrefixedClassNames('input', {
    'is-small': true,
    'is-danger': invalid,
  });
  const buttonClass = usePrefixedClassNames('button', { 'is-small': true });
  const hydrated = useIsHydrated();
  const EyeDropper = hydrated
    ? (window as unknown as { EyeDropper?: EyeDropperConstructor }).EyeDropper
    : undefined;

  const commit = () => {
    if (draft === null) return;
    const parsed = parseColor(draft);
    setDraft(null);
    if (parsed) change(keepingChannels(parsed, color, draft), true);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (draft === null) return;
    if (event.key === 'Enter') {
      // Commits rather than submitting a form; an unreadable value stays
      // to be fixed.
      event.preventDefault();
      if (!invalid) commit();
    } else if (event.key === 'Escape') {
      // Puts the value back, and keeps the key from closing a popover too.
      event.preventDefault();
      event.stopPropagation();
      setDraft(null);
    }
  };

  // Escape, or a click away, cancels it, which rejects.
  const pickFromScreen = (Dropper: EyeDropperConstructor) =>
    new Dropper().open().then(({ sRGBHex }) => {
      const parsed = parseColor(sRGBHex);
      // The screen gives a solid color as hex; the alpha stays as it was,
      // and a gray keeps the hue the picker had.
      if (parsed) {
        change(
          keepingChannels({ ...parsed, a: color.a }, color, sRGBHex),
          true
        );
      }
    }, noop);

  if (!picker) return null;

  return (
    <div
      ref={ref}
      className={classNames(rowClass, bulmaHelperClasses, className)}
      {...rest}
    >
      <ColorSwatch color={text} className={previewClass} aria-hidden="true" />
      <input
        type="text"
        className={inputClass}
        value={draft ?? text}
        disabled={disabled}
        aria-label={labels.value}
        aria-invalid={invalid || undefined}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        onChange={event => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
      />
      {eyeDropper && EyeDropper && (
        <button
          type="button"
          className={buttonClass}
          aria-label={labels.eyeDropper}
          title={labels.eyeDropper}
          disabled={disabled}
          onClick={() => pickFromScreen(EyeDropper)}
        >
          <EyeDropperIcon />
        </button>
      )}
    </div>
  );
});

ColorPickerInput.displayName = 'ColorPicker.Input';

/** A pipette. */
const EyeDropperIcon = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true">
    <path
      d="M10.5 2.5l3 3M9 4l3 3-6.5 6.5H3v-3z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// ColorPicker (root)
// ---------------------------------------------------------------------------

/**
 * Props for the ColorPicker component. The helper props, the other
 * attributes and the `ref` land on the picker's `<div>`, inside the `Field`
 * and `Control` it renders when it isn't already in them.
 *
 * Inside an existing `Control` it renders no `Control` of its own. Inside an
 * outer `Field`, or a `Control` with no `Field` around it, it renders no
 * `Field` of its own either. The exception is `label`, `message`,
 * `horizontal` or `fieldClassName` in that bare `Control`: it keeps a
 * `Field` for them, nested in the `.control`, and warns in development.
 * Wrap the `Control` in a `Field` instead, and set the `label`, `horizontal`
 * and class name on that `Field`.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the picker's `<div>`.
 * @extraProp {string} [aria-label] - Names the picker's group when there's no `label`.
 */
export interface ColorPickerProps
  extends
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'onChange' | 'defaultValue' | 'color' | 'role'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'>,
    FormFieldProps {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Field label naming the picker's group, through `aria-labelledby`. Dropped inside an outer `Field`, whose own label names it instead. An `aria-label` or `aria-labelledby` you set wins over either. */
  label?: React.ReactNode;
  /** Props for the label element. An explicit `id` here is used as the `aria-labelledby` target instead of a generated one; any `htmlFor` is ignored (a group label names the group, never a single control). */
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    [key: string]: unknown;
  };
  /**
   * The color, controlled: any CSS color the picker reads (hex, `rgb()`,
   * `hsl()` or a color name), in any format, since `onChange` hands back
   * the `format` asked for. One it can't read leaves the picker showing the
   * last color it could. A value it gave you comes back without moving the
   * thumbs, and a gray or black keeps the hue and saturation the user had.
   */
  value?: string;
  /** The color to start with, uncontrolled. Black without one. */
  defaultValue?: string;
  /**
   * Called with the color, in `format`, as it changes: on every step of a
   * drag, and on a key, a swatch, a typed value or the eye dropper.
   */
  onChange?: (value: string) => void;
  /**
   * Called with the color, in `format`, once a change is done: when a drag
   * ends, and with `onChange` for a key, a swatch, a typed value or the eye
   * dropper. The place to save it.
   */
  onChangeEnd?: (value: string) => void;
  /**
   * How the value is written: `'hsl'` (`hsl(171, 100%, 41%)`), Bulma's own
   * color space and what `Theme`'s `primaryH`, `primaryS` and `primaryL`
   * take, `'hex'` (`#00d1b2`) or `'rgb'` (`rgb(0, 209, 178)`). With `alpha`,
   * `hsla()`, `#rrggbbaa` and `rgba()`.
   * @defaultValue 'hsl'
   */
  format?: ColorFormat;
  /**
   * Adds an alpha slider and writes the alpha into the value. Without it,
   * the value is always solid.
   */
  alpha?: boolean;
  /**
   * Preset colors shown as a radio group under the picker: a list of CSS
   * colors, each a string or `{ color, label }`, or `"bulma"` for the page's
   * primary, link, info, success, warning and danger, from Bulma's CSS
   * variables, so a themed app shows its own. A color the picker can't read
   * as written, such as a `var()`, is read off the page each time the picker
   * renders, so after a theme change the swatches show the new colors at
   * once and the chosen one is marked again on the picker's next render,
   * which a `Theme` around it causes. The `"bulma"` names are English; for
   * others, pass the list yourself, such as
   * `{ color: 'var(--bulma-primary)', label: 'Primär' }`.
   */
  swatches?: ColorPickerSwatch[] | 'bulma';
  /**
   * Adds a button that picks a color from anywhere on the screen, where the
   * browser has the EyeDropper API (desktop Chromium today). Elsewhere, and
   * until the page hydrates, it isn't shown.
   */
  eyeDropper?: boolean;
  /** Disables every part. A disabled `Fieldset` around it does too. */
  disabled?: boolean;
  /** Form field name. When set, a hidden input carries the value. */
  name?: string;
  /** The id of the form the hidden input belongs to. */
  form?: string;
  /** The strings it says, each with an English default. */
  labels?: ColorPickerLabels;
  /**
   * Parts for a layout of your own: `ColorPicker.Area`,
   * `ColorPicker.HueSlider`, `ColorPicker.AlphaSlider`,
   * `ColorPicker.Swatches` and `ColorPicker.Input`, with anything else
   * between them. Without children, the picker shows the square, the hue
   * slider, the alpha slider with `alpha`, the value, and the swatches when
   * there are some.
   */
  children?: React.ReactNode;
}

/**
 * The `ColorPicker` component is a panel for choosing a color: a saturation and brightness square, a hue slider, and the value as text, with alpha and swatches when asked for.
 *
 * Every part is operable by keyboard, and the square is two native range
 * inputs, one per axis, with one tab stop. The value is a CSS color string
 * in `format`, HSL by default.
 *
 * @function
 * @param {ColorPickerProps} props - Props for the ColorPicker component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the picker's `<div>`.
 * @returns {JSX.Element} The rendered picker.
 *
 * @example
 * <ColorPicker label="Brand color" defaultValue="#1e6b99" swatches="bulma" />
 */
const ColorPickerRoot = forwardRef<HTMLDivElement, ColorPickerProps>(
  (
    {
      className,
      label,
      labelSize,
      labelProps,
      horizontal,
      message,
      messageColor,
      fieldClassName,
      value,
      defaultValue,
      onChange,
      onChangeEnd,
      format = 'hsl',
      alpha = false,
      swatches,
      eyeDropper = false,
      disabled: disabledProp,
      name,
      form,
      labels,
      children,
      ...props
    },
    ref
  ) => {
    const disabled = useFieldsetDisabled(disabledProp);
    const insideField = useInsideField();
    const insideControl = useInsideControl();
    const ownField = rendersOwnField('ColorPicker', {
      insideField,
      insideControl,
      label,
      message,
      horizontal,
      fieldClassName,
    });
    const { ariaLabelledBy, fieldLabelProps } = useAutoLabelledBy({
      label,
      labelProps,
      rendersLabel: ownField,
      callerProps: props,
    });
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const pickerClass = usePrefixedClassNames('color-picker', {
      'is-disabled': disabled,
    });
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    const context = useColorPicker({
      value,
      defaultValue,
      onChange,
      onChangeEnd,
      format,
      alpha,
      disabled,
      swatches,
      eyeDropper,
      labels,
    });

    const picker = (
      <div
        ref={ref}
        className={classNames(pickerClass, bulmaHelperClasses, className)}
        role="group"
        aria-labelledby={ariaLabelledBy}
        {...rest}
      >
        <ColorPickerContext.Provider value={context}>
          {children ?? (
            <>
              <ColorPickerArea />
              <ColorPickerHueSlider />
              {alpha && <ColorPickerAlphaSlider />}
              <ColorPickerInput />
              {swatches && <ColorPickerSwatches />}
            </>
          )}
        </ColorPickerContext.Provider>
        {name && (
          <input
            type="hidden"
            name={name}
            form={form}
            value={context.text}
            disabled={disabled}
          />
        )}
      </div>
    );

    let content: React.ReactNode = picker;
    if (rendersOwnControl('ColorPicker', { insideControl })) {
      content = <Control>{content}</Control>;
    }
    const messageEl = message ? <p className={helpClass}>{message}</p> : null;

    if (ownField) {
      return (
        <Field
          label={label}
          labelSize={labelSize}
          labelProps={fieldLabelProps}
          horizontal={horizontal}
          className={fieldClassName}
        >
          {content}
          {messageEl}
        </Field>
      );
    }
    return (
      <>
        {content}
        {messageEl}
      </>
    );
  }
);

ColorPickerRoot.displayName = 'ColorPicker';

export const ColorPicker = withSubComponents(ColorPickerRoot, {
  Area: ColorPickerArea,
  HueSlider: ColorPickerHueSlider,
  AlphaSlider: ColorPickerAlphaSlider,
  Swatches: ColorPickerSwatches,
  Input: ColorPickerInput,
});

export default ColorPicker;
