import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

export type ContainerBreakpoint = 'tablet' | 'desktop' | 'widescreen';

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /**
   * Bulma color modifier for the cell text
   */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  fluid?: boolean;
  widescreen?: boolean;
  fullhd?: boolean;
  /** Bulma container breakpoint ('tablet', 'desktop', or 'widescreen') */
  breakpoint?: ContainerBreakpoint;
  /** If true, applies the is-max-* class for the breakpoint (only if breakpoint is tablet, desktop, or widescreen) */
  isMax?: boolean;
}

/**
 * Container component for Bulma.
 * Adds optional responsive, fluid, and color support, including is-max-* and breakpoint classes.
 */
export const Container: React.FC<ContainerProps> = ({
  className,
  textColor,
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
    color: textColor,
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

  const containerClasses = classNames(
    'container',
    {
      'is-fluid': fluid,
      'is-widescreen': widescreen,
      'is-fullhd': fullhd,
    },
    breakpointClass,
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
