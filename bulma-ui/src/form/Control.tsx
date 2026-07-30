import React from 'react';
import {
  classNames,
  usePrefixedClassNames,
  prefixedClassNames,
} from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { Icon, IconProps } from '../elements/Icon';
import { useConfig } from '../helpers/Config';
import { ControlProvider } from './FormContext';

/**
 * Props for the Control component.
 */
export interface ControlBaseProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Adds left icon container. */
  hasIconsLeft?: boolean;
  /** Adds right icon container. */
  hasIconsRight?: boolean;
  /** Shows loading indicator. */
  isLoading?: boolean;
  /** Makes the control expand to fill available space. */
  isExpanded?: boolean;
  /** Sets the control size. */
  size?: 'small' | 'medium' | 'large';
  /** Sets text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color for the control. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Icon props for left icon. */
  iconLeft?: IconProps;
  /** Icon props for right icon. */
  iconRight?: IconProps;
  /** Shortcut for left icon name. */
  iconLeftName?: string;
  /** Shortcut for left icon size. */
  iconLeftSize?: 'small' | 'medium' | 'large';
  /** Shortcut for right icon name. */
  iconRightName?: string;
  /** Shortcut for right icon size. */
  iconRightSize?: 'small' | 'medium' | 'large';
  /** Additional CSS classes to apply. */
  className?: string;
  /** Content inside the control. */
  children?: React.ReactNode;
}

/** Props for the Control component, supporting either `div` or `p` as the root element. */
type ControlProps =
  | ({
      /** Element type for the control (`div` by default). */
      as?: 'div';
    } & ControlBaseProps & {
        /** Ref for the control element. */
        ref?: React.Ref<HTMLDivElement>;
      })
  | ({
      /** Element type for the control (`div` by default). */
      as: 'p';
    } & Omit<ControlBaseProps, keyof React.HTMLAttributes<HTMLDivElement>> &
      React.HTMLAttributes<HTMLParagraphElement> & {
        /** Ref for the control element. */
        ref?: React.Ref<HTMLParagraphElement>;
      });

const allowedColors = [...validColors, 'inherit', 'current'] as const;

/**
 * The `Control` component is a Bulma-styled wrapper for form controls (`Input`, `Select`, `TextArea`, etc.), supporting icons (left/right), loading state, expansion, size, and Bulma helper props for layout and color.
 *
 * @function
 * @param {ControlProps} props - Props for the Control component.
 * @returns {JSX.Element} The rendered control container.
 * @see {@link https://bulma.io/documentation/form/general/#control | Bulma Control documentation}
 *
 * @example
 * // Control with left icon
 * <Control iconLeftName="envelope" iconLeftSize="small">
 *   <input className="input" type="email" placeholder="Email" />
 * </Control>
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
    const { classPrefix } = useConfig();

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
      <ControlProvider value={true}>
        <Component
          className={controlClass}
          ref={ref as typeof ref}
          {...restProps}
          {...rest}
        >
          {children}
          {leftIconProps && leftIconProps.name && (
            <Icon
              {...leftIconProps}
              className={prefixedClassNames(classPrefix, 'is-left')}
            />
          )}
          {rightIconProps && rightIconProps.name && (
            <Icon
              {...rightIconProps}
              className={prefixedClassNames(classPrefix, 'is-right')}
            />
          )}
        </Component>
      </ControlProvider>
    );
  }
);

Control.displayName = 'Control';

export default Control;
