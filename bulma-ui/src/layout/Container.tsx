import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

/**
 * Bulma container breakpoints.
 */
export type ContainerBreakpoint = 'tablet' | 'desktop' | 'widescreen';

/**
 * Props for the Container component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color modifier.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {boolean} [fluid] - Full-width container.
 * @property {boolean} [widescreen] - Container is widescreen.
 * @property {boolean} [fullhd] - Container is fullhd.
 * @property {ContainerBreakpoint} [breakpoint] - Responsive breakpoint.
 * @property {boolean} [isMax] - Use is-max-* class for breakpoint.
 * @property {React.ReactNode} [children] - Content inside the container.
 */
export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  fluid?: boolean;
  widescreen?: boolean;
  fullhd?: boolean;
  breakpoint?: ContainerBreakpoint;
  isMax?: boolean;
  children?: React.ReactNode;
}

/**
 * Container component for Bulma.
 * Adds optional responsive, fluid, and color support, including is-max-* and breakpoint classes.
 *
 * @function
 * @param {ContainerProps} props - Props for the Container component.
 * @returns {JSX.Element} The rendered container.
 * @see {@link https://bulma.io/documentation/layout/container/ | Bulma Container documentation}
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
  const { classPrefix } = useConfig();
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

  const mainClass = classPrefix ? `${classPrefix}container` : 'container';
  const containerClasses = classNames(
    mainClass,
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
