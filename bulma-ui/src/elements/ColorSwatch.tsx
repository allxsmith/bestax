import React, { forwardRef, useEffect } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { warnOnce } from '../helpers/devWarnings';

const validColorSwatchSizes = ['small', 'medium', 'large'] as const;

/**
 * Props for the ColorSwatch component. The helper props, the other
 * attributes and the `ref` land on its `<span>`.
 *
 * @extraProp {React.Ref<HTMLSpanElement>} [ref] - Ref forwarded to the `<span>`.
 * @extraProp {string} [aria-label] - Names the swatch in place of `label`.
 * @extraProp {boolean} [aria-hidden] - Hides the swatch from assistive tech, for one beside text that already names the color.
 */
export interface ColorSwatchProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'color' | 'role'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * The color it shows: any CSS color, such as `#1e6b99`,
   * `hsl(202, 67%, 36%)` or `var(--bulma-primary)`. A see-through color
   * shows a checkerboard behind it.
   */
  color: string;
  /**
   * What the color is called, such as "Brand blue", read as the swatch's
   * name in place of `color` as written. A `var()` reads as nothing useful,
   * so a development build warns when one has no name.
   */
  label?: string;
  /** The swatch's size. */
  size?: (typeof validColorSwatchSizes)[number];
  /** Draws a circle in place of a rounded square. */
  isRounded?: boolean;
  /**
   * Drawn on the swatch, such as an icon. It's hidden from assistive tech,
   * since the swatch is an image named by its label.
   */
  children?: React.ReactNode;
  /** Text color helper, the color of anything drawn on the swatch. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * The `ColorSwatch` component shows a color as a small chip, named by its label or by the color itself.
 *
 * It's an image to assistive tech, so the color is always there in words.
 * In forced colors it keeps its color, edged in the system's text color.
 *
 * @function
 * @param {ColorSwatchProps} props - Props for the ColorSwatch component.
 * @param {React.Ref<HTMLSpanElement>} ref - Forwarded ref to the `<span>`.
 * @returns {JSX.Element} The rendered swatch.
 *
 * @example
 * <ColorSwatch color="#1e6b99" label="Brand blue" />
 */
export const ColorSwatch = forwardRef<HTMLSpanElement, ColorSwatchProps>(
  (
    {
      className,
      textColor,
      color,
      label,
      size,
      isRounded,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      ...props,
    });

    const unnamed =
      /^\s*var\(/i.test(color) &&
      !label &&
      !rest['aria-label'] &&
      !rest['aria-labelledby'] &&
      !rest['aria-hidden'];
    useEffect(() => {
      if (unnamed) {
        warnOnce(
          'ColorSwatch:unnamed-var',
          '[bestax-bulma] <ColorSwatch> shows a CSS variable with no label, ' +
            'so a screen reader reads the var() as its name. Pass label, ' +
            'such as "Primary".'
        );
      }
    }, [unnamed]);

    const swatchClass = usePrefixedClassNames('color-swatch', {
      [`is-${size}`]:
        !!size && (validColorSwatchSizes as readonly string[]).includes(size),
      'is-rounded': !!isRounded,
    });

    return (
      <span
        ref={ref}
        className={classNames(swatchClass, bulmaHelperClasses, className)}
        style={{ ...style, ['--color-swatch-color' as string]: color }}
        {...rest}
        role="img"
        aria-label={rest['aria-label'] || label || color}
      >
        {children !== undefined && children !== null && (
          <span aria-hidden="true">{children}</span>
        )}
      </span>
    );
  }
);

ColorSwatch.displayName = 'ColorSwatch';

export default ColorSwatch;
