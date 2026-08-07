import React from 'react';
import classNames, { usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Bulma container breakpoints.
 */
export type ContainerBreakpoint = 'tablet' | 'desktop' | 'widescreen';

/**
 * Props for the Container component.
 */
export interface ContainerProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /**
   * Text color alias: renders `has-text-<color>`, exactly like `textColor`.
   * Not a filled variant (no `.container.is-<color>` CSS exists). Prefer
   * `textColor`, which takes precedence when both are set; use `bgColor` for
   * a colored surface.
   */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Makes the container full-width with a 32px gap on each side. */
  fluid?: boolean;
  /** Makes the container full-width until the `widescreen` breakpoint. */
  widescreen?: boolean;
  /** Makes the container full-width until the `fullhd` breakpoint. */
  fullhd?: boolean;
  /** Responsive breakpoint for container (`is-tablet`, `is-desktop`, `is-widescreen`). */
  breakpoint?: ContainerBreakpoint;
  /** Uses Bulma's `is-max-*` class for the specified breakpoint, limiting max width. */
  isMax?: boolean;
  /** Content inside the container. */
  children?: React.ReactNode;
}

/**
 * The `Container` component provides a responsive and flexible layout wrapper for your Bulma React UI.
 *
 * @function
 * @param {ContainerProps} props - Props for the Container component.
 * @returns {JSX.Element} The rendered container.
 * @see {@link https://bulma.io/documentation/layout/container/ | Bulma Container documentation}
 */
export const Container: React.FC<ContainerProps> = ({
  className,
  textColor,
  color,
  bgColor,
  fluid,
  widescreen,
  fullhd,
  breakpoint,
  isMax,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor ?? color,
    backgroundColor: bgColor,
    ...props,
  });

  // Only allow isMax for supported breakpoints
  const validMaxBreakpoints: ContainerBreakpoint[] = [
    'tablet',
    'desktop',
    'widescreen',
  ];
  let breakpointClass: string | undefined;
  if (breakpoint) {
    if (isMax && validMaxBreakpoints.includes(breakpoint)) {
      breakpointClass = `is-max-${breakpoint}`;
    } else if (!isMax) {
      breakpointClass = `is-${breakpoint}`;
    }
  }

  const mainClass = usePrefixedClassNames('container');
  const containerModifiers = usePrefixedClassNames('', {
    'is-fluid': fluid,
    'is-widescreen': widescreen,
    'is-fullhd': fullhd,
  });
  const prefixedBreakpointClass = usePrefixedClassNames(breakpointClass || '');

  const containerClasses = classNames(
    mainClass,
    containerModifiers,
    prefixedBreakpointClass,
    className,
    bulmaHelperClasses
  );

  return (
    <div className={containerClasses} {...rest}>
      {children}
    </div>
  );
};

export default Container;
