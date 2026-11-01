// INTERNAL: deliberately not exported from src/index.ts. The eye dropper
// button, shared by ColorPicker.Input and the panel ColorInput opens.

import { useContext } from 'react';
import { classNames, usePrefixedClassNames } from '../../helpers/classNames';
import { useIsHydrated } from '../../helpers/useIsHydrated';
import { parseColor } from './colorMath';
import {
  ColorPickerContext,
  ColorPickerContextValue,
  keepingChannels,
  noop,
} from './pickerState';

/** The browser's eye dropper, where it has one. */
interface EyeDropperLike {
  open: () => Promise<{ sRGBHex: string }>;
}
type EyeDropperConstructor = new () => EyeDropperLike;

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

/**
 * A button that picks a color from anywhere on the screen, for the picker
 * around it. It renders only once the page has hydrated, where the browser
 * has the EyeDropper API, and inside a picker that asked for it.
 */
export function EyeDropperButton({ className }: { className?: string }) {
  // Rendered only inside a picker's provider.
  const picker = useContext(ColorPickerContext) as ColorPickerContextValue;
  const buttonClass = usePrefixedClassNames('button', { 'is-small': true });
  const hydrated = useIsHydrated();
  const Dropper = hydrated
    ? (window as unknown as { EyeDropper?: EyeDropperConstructor }).EyeDropper
    : undefined;
  if (!picker.eyeDropper || !Dropper) return null;
  const { color, change, disabled, labels } = picker;

  // Escape, or a click away, cancels it, which rejects.
  const pickFromScreen = () =>
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

  return (
    <button
      type="button"
      className={classNames(buttonClass, className)}
      aria-label={labels.eyeDropper}
      title={labels.eyeDropper}
      disabled={disabled}
      onClick={pickFromScreen}
    >
      <EyeDropperIcon />
    </button>
  );
}
