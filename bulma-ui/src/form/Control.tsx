import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { Icon, IconProps } from '../elements/Icon';

/**
 * Props for the Control component.
 *
 * @property {boolean} [hasIconsLeft] - Adds left icon container.
 * @property {boolean} [hasIconsRight] - Adds right icon container.
 * @property {boolean} [isLoading] - Shows loading indicator.
 * @property {boolean} [isExpanded] - Makes the control expand to fill available space.
 * @property {'small'|'medium'|'large'} [size] - Sets the control size.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Sets text color.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color for the control.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {IconProps} [iconLeft] - Icon props for left icon.
 * @property {IconProps} [iconRight] - Icon props for right icon.
 * @property {string} [iconLeftName] - Shortcut for left icon name.
 * @property {'small'|'medium'|'large'} [iconLeftSize] - Shortcut for left icon size.
 * @property {string} [iconRightName] - Shortcut for right icon name.
 * @property {'small'|'medium'|'large'} [iconRightSize] - Shortcut for right icon size.
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {React.ReactNode} [children] - Content inside the control.
 * @property {'div'|'p'} [as] - Element type for the control (default: 'div').
 * @property {React.Ref<HTMLDivElement|HTMLParagraphElement>} [ref] - Ref for the control element.
 */
export interface ControlBaseProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  hasIconsLeft?: boolean;
  hasIconsRight?: boolean;
  isLoading?: boolean;
  isExpanded?: boolean;
  size?: 'small' | 'medium' | 'large';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  iconLeft?: IconProps;
  iconRight?: IconProps;
  iconLeftName?: string;
  iconLeftSize?: 'small' | 'medium' | 'large';
  iconRightName?: string;
  iconRightSize?: 'small' | 'medium' | 'large';
  className?: string;
  children?: React.ReactNode;
}

type ControlProps =
  | ({ as?: 'div' } & ControlBaseProps & { ref?: React.Ref<HTMLDivElement> })
  | ({ as: 'p' } & Omit<
      ControlBaseProps,
      keyof React.HTMLAttributes<HTMLDivElement>
    > &
      React.HTMLAttributes<HTMLParagraphElement> & {
        ref?: React.Ref<HTMLParagraphElement>;
      });

const allowedColors = [...validColors, 'inherit', 'current'] as const;

/**
 * Bulma Control component for form controls, with icons, loading, and Bulma helper support.
 *
 * @function
 * @param {ControlProps} props - Props for the Control component.
 * @returns {JSX.Element} The rendered control container.
 * @see {@link https://bulma.io/documentation/form/general/#control | Bulma Control documentation}
 */
export const Control = React.forwardRef<
  HTMLDivElement | HTMLParagraphElement,
  ControlProps
>(
  (
    {
      as = 'div',
      hasIconsLeft,
      hasIconsRight,
      isLoading,
      isExpanded,
      size,
      textColor,
      bgColor,
      iconLeft,
      iconRight,
      iconLeftName,
      iconLeftSize,
      iconRightName,
      iconRightSize,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Component = (as === 'p' ? 'p' : 'div') as 'div' | 'p';

    // Remove textColor/bgColor from props before spreading
    const {
      textColor: _ignoredTextColor,
      bgColor: _ignoredBgColor,
      ...restProps
    } = props as Record<string, unknown>;

    const safeTextColor = allowedColors.includes(
      textColor as (typeof allowedColors)[number]
    )
      ? textColor
      : undefined;

    const safeBgColor = allowedColors.includes(
      bgColor as (typeof allowedColors)[number]
    )
      ? bgColor
      : undefined;

    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: safeTextColor,
      backgroundColor: safeBgColor,
      ...restProps,
    });

    // Prepare icon props for the shortcut
    const leftIconProps: IconProps | undefined =
      iconLeft ||
      (iconLeftName
        ? {
            name: iconLeftName,
            size: iconLeftSize,
          }
        : undefined);

    const rightIconProps: IconProps | undefined =
      iconRight ||
      (iconRightName
        ? {
            name: iconRightName,
            size: iconRightSize,
          }
        : undefined);

    const mainClass = usePrefixedClassNames('control', {
      'has-icons-left': hasIconsLeft || !!leftIconProps,
      'has-icons-right': hasIconsRight || !!rightIconProps,
      'is-loading': isLoading,
      'is-expanded': isExpanded,
      [`is-${size}`]: !!size,
    });
    const controlClass = classNames(mainClass, bulmaHelperClasses, className);

    // --- FIX: Spread both restProps (for data-testid, etc) AND rest (from useBulmaClasses) ---
    return (
      <Component
        className={controlClass}
        ref={ref as typeof ref}
        {...restProps}
        {...rest}
      >
        {children}
        {leftIconProps && leftIconProps.name && (
          <Icon {...leftIconProps} className="is-left" />
        )}
        {rightIconProps && rightIconProps.name && (
          <Icon {...rightIconProps} className="is-right" />
        )}
      </Component>
    );
  }
);

Control.displayName = 'Control';

export default Control;
