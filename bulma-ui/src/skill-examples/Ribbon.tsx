// Skill example — a frozen snapshot of the component produced by following
// skills/bestax-custom-component. Showcased under "Skill Examples" in Storybook.
// Not exported from the library; styles live in ./ribbon.scss (Storybook-only).
import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export type RibbonColor =
  | 'primary'
  | 'link'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

/**
 * Props for the Ribbon component.
 *
 * @property {RibbonColor} [color] - Bulma color modifier.
 * @property {'small' | 'medium' | 'large'} [size] - Size modifier.
 */
export interface RibbonProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  color?: RibbonColor;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Ribbon — a small label/banner chip with Bulma color and size modifiers.
 *
 * @example
 * <Ribbon color="primary" size="large">New</Ribbon>
 */
export const Ribbon = forwardRef<HTMLSpanElement, RibbonProps>(
  ({ color, size, className, children, ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const mainClasses = usePrefixedClassNames('ribbon', {
      [`is-${color}`]: !!color,
      [`is-${size}`]: !!size,
    });
    const combined = classNames(mainClasses, bulmaHelperClasses, className);
    return (
      <span ref={ref} className={combined} {...rest}>
        {children}
      </span>
    );
  }
);

Ribbon.displayName = 'Ribbon';

export default Ribbon;
