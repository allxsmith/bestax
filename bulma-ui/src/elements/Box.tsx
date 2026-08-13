import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
  validSchemeColors,
} from '../helpers/useBulmaClasses';
import { mergeBulmaStyles } from '../helpers/mergeBulmaStyles';

/**
 * Props for the Box component.
 */
export interface BoxProps
  /** @ignore */
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /**
   * Text color alias: renders `has-text-<color>`, exactly like `textColor`.
   * Not a filled box variant (no `.box.is-<color>` CSS exists). Prefer
   * `textColor`, which takes precedence when both are set; use `bgColor` for
   * a colored surface.
   */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /**
   * Background color helper. `scheme-*` values render as a dark-mode-safe
   * inline `background-color: var(--bulma-scheme-*)` instead of a class. The
   * `scheme-invert*` values do not change text color — pair them with a
   * contrasting foreground.
   */
  bgColor?:
    | (typeof validColors)[number]
    | (typeof validSchemeColors)[number]
    | 'inherit'
    | 'current';
  /** Whether the box has a shadow (default: true). */
  hasShadow?: boolean;
  /** Content to render inside the box. */
  children?: React.ReactNode;
}

/**
 * The `Box` component renders a bordered, padded container with an optional shadow using Bulma's `.box` class.
 *
 * @function
 * @param {BoxProps} props - Props for the Box component.
 * @returns {JSX.Element} The rendered box element.
 * @see {@link https://bulma.io/documentation/elements/box/ | Bulma Box documentation}
 */
export const Box: React.FC<BoxProps> = ({
  className,
  textColor,
  color,
  bgColor,
  hasShadow = true,
  children,
  style,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, bulmaHelperStyles, rest } = useBulmaClasses({
    color: textColor ?? color,
    backgroundColor: bgColor,
    ...props,
  });

  const bulmaClasses = usePrefixedClassNames('box', {
    'is-shadowless': !hasShadow,
  });

  const boxClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <div
      className={boxClasses}
      style={mergeBulmaStyles(bulmaHelperStyles, style)}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Box;
