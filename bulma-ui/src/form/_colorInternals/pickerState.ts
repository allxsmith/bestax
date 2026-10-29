// INTERNAL: deliberately not exported from src/index.ts. The color a picker
// holds and the context its parts read, shared by ColorPicker and the panel
// ColorInput opens, so the panel needs no Field or Control of its own.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNumberFormat, NumberFormatter } from '../../helpers/localeFormat';
import { useClientLayoutEffect } from '../../helpers/useClientLayoutEffect';
import { warnOnce } from '../../helpers/devWarnings';
import { useNativeMobilePicker } from '../_pickerInternals/useNativeMobilePicker';
import {
  ColorFormat,
  Hsva,
  formatColor,
  namesHue,
  parseColor,
} from './colorMath';
import type { ColorPickerLabels, ColorPickerSwatch } from '../ColorPicker';

const DEFAULT_LABELS: Required<ColorPickerLabels> = {
  area: 'Saturation and brightness',
  areaRoleDescription: '2D slider',
  saturation: 'Saturation',
  brightness: 'Brightness',
  hue: 'Hue',
  alpha: 'Alpha',
  degrees: 'degrees',
  value: 'Color value',
  swatches: 'Swatches',
  eyeDropper: 'Pick a color from the screen',
};

/** The labels with each one left out, or empty, at its default. */
export const mergeColorLabels = (
  labels: ColorPickerLabels | undefined
): Required<ColorPickerLabels> => {
  const merged = { ...DEFAULT_LABELS };
  for (const [key, value] of Object.entries(labels ?? {})) {
    if (value) merged[key as keyof ColorPickerLabels] = value;
  }
  return merged;
};

export const BLACK: Hsva = { h: 0, s: 0, v: 0, a: 1 };

/**
 * A color read from outside the picker, written as `source`, with the hue
 * and saturation the picker had where the new color has none, so the thumbs
 * don't jump to 0. A gray written as hex, `rgb()` or a name has no hue, so
 * it keeps the picker's; one written as `hsl()` names its hue, which wins.
 * Black has no saturation in the square either way, and keeps the picker's,
 * which writes no differently.
 */
export const keepingChannels = (
  next: Hsva,
  previous: Hsva,
  source: string
): Hsva => ({
  ...next,
  h: (next.s === 0 || next.v === 0) && !namesHue(source) ? previous.h : next.h,
  s: next.v === 0 ? previous.s : next.s,
});

/** What a picker's parts read from the picker around them. */
export interface ColorPickerContextValue {
  /** The color shown, alpha at 1 unless the picker takes alpha. */
  color: Hsva;
  /** The color written in the picker's format. */
  text: string;
  format: ColorFormat;
  alpha: boolean;
  disabled: boolean;
  labels: Required<ColorPickerLabels>;
  swatches: ColorPickerSwatch[] | 'bulma' | undefined;
  eyeDropper: boolean;
  /** Whether a touch screen reader is likely, so both square inputs show. */
  touch: boolean;
  /** Writes a percentage, in the locale of a LocaleProvider when there is one. */
  percent: (value: number) => string;
  /** Writes a hue in degrees, in the locale of a LocaleProvider when there is one. */
  degrees: (value: number) => string;
  /** Sets the color: `onChange`, and `onChangeEnd` too when `end` is set. */
  change: (next: Hsva, end?: boolean) => void;
  /** Ends a drag: `onChangeEnd` with the latest value. */
  end: () => void;
}

export const ColorPickerContext = createContext<ColorPickerContextValue | null>(
  null
);

/** Does nothing, for a part outside a picker and a cancelled eye dropper. */
export const noop = () => {};

// What a part outside a ColorPicker reads, so its hooks run the same; it
// then renders nothing.
export const standalone: ColorPickerContextValue = {
  color: BLACK,
  text: '',
  format: 'hsl',
  alpha: false,
  disabled: true,
  labels: DEFAULT_LABELS,
  swatches: undefined,
  eyeDropper: false,
  touch: false,
  percent: String,
  degrees: String,
  change: noop,
  end: noop,
};

/** The picker around a part, or null with a development warning. */
export function usePicker(part: string): ColorPickerContextValue | null {
  const picker = useContext(ColorPickerContext);
  const outside = !picker;
  useEffect(() => {
    if (outside) {
      warnOnce(
        `ColorPicker:${part}:outside`,
        `[bestax-bulma] <ColorPicker.${part}> needs a <ColorPicker> around ` +
          'it, which holds the color, and renders nothing without one.'
      );
    }
  }, [outside, part]);
  return picker;
}

/** A percentage, in the provider's locale when there is one. */
const writePercent =
  (formatNumber: NumberFormatter | null) => (value: number) =>
    formatNumber
      ? formatNumber(value / 100, { style: 'percent' })
      : `${value}%`;

/** Degrees, in the provider's locale when there is one, else with `unit`. */
const writeDegrees =
  (formatNumber: NumberFormatter | null, unit: string) => (value: number) =>
    formatNumber
      ? formatNumber(value, {
          style: 'unit',
          unit: 'degree',
          unitDisplay: 'long',
        })
      : `${value} ${unit}`;

/** What a picker is given: ColorPicker's props, or the ones ColorInput passes on. */
export interface PickerOptions {
  value: string | undefined;
  defaultValue: string | undefined;
  onChange: ((value: string) => void) | undefined;
  onChangeEnd: ((value: string) => void) | undefined;
  format: ColorFormat;
  alpha: boolean;
  disabled: boolean;
  swatches: ColorPickerSwatch[] | 'bulma' | undefined;
  eyeDropper: boolean;
  labels: ColorPickerLabels | undefined;
}

/**
 * Holds a picker's color and builds what its parts read. Controlled, the
 * color shown follows `value`; a value the picker handed out comes back as
 * the exact color it was, thumbs and all.
 */
export function useColorPicker({
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
}: PickerOptions): ColorPickerContextValue {
  const isControlled = value !== undefined;
  // The color the picker last set or started with, and its text. While
  // `value` is that text, this is the color shown.
  const [own, setOwn] = useState(() => {
    const start = isControlled ? value : defaultValue;
    return { text: start ?? '', color: parseColor(start) ?? BLACK };
  });
  // A controlled value from outside becomes the color held, during this
  // render, keeping the hue and saturation a gray or black has none of.
  // One the picker can't read changes nothing, so the last good color
  // stays on screen.
  if (isControlled && value !== own.text) {
    const parsed = parseColor(value);
    if (parsed) {
      setOwn({
        text: value,
        color: keepingChannels(parsed, own.color, value),
      });
    }
  }
  const color = alpha ? own.color : { ...own.color, a: 1 };
  const text = formatColor(color, format, alpha);

  // The latest text handed out, so a step that writes the same text
  // doesn't call onChange again, and a drag's end reports the last one.
  const lastTextRef = useRef(text);
  useClientLayoutEffect(() => {
    lastTextRef.current = text;
  });

  const change = useCallback(
    (next: Hsva, finished = false) => {
      if (disabled) return;
      const solid = alpha ? next : { ...next, a: 1 };
      const nextText = formatColor(solid, format, alpha);
      setOwn({ text: nextText, color: solid });
      if (nextText !== lastTextRef.current) {
        lastTextRef.current = nextText;
        onChange?.(nextText);
      }
      if (finished) onChangeEnd?.(nextText);
    },
    [disabled, alpha, format, onChange, onChangeEnd]
  );
  const end = useCallback(
    () => onChangeEnd?.(lastTextRef.current),
    [onChangeEnd]
  );

  const formatNumber = useNumberFormat();
  const { isCoarsePointer } = useNativeMobilePicker();
  const merged = mergeColorLabels(labels);
  return {
    color,
    text,
    format,
    alpha,
    disabled,
    labels: merged,
    swatches,
    eyeDropper,
    touch: isCoarsePointer,
    percent: writePercent(formatNumber),
    degrees: writeDegrees(formatNumber, merged.degrees),
    change,
    end,
  };
}
