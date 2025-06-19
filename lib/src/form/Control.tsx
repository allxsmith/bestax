import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { Icon, IconProps } from '../elements/Icon';

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

const Control = React.forwardRef<
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

    const controlClass = classNames(
      'control',
      bulmaHelperClasses,
      {
        'has-icons-left': hasIconsLeft || !!leftIconProps,
        'has-icons-right': hasIconsRight || !!rightIconProps,
        'is-loading': isLoading,
        'is-expanded': isExpanded,
        [`is-${size}`]: !!size,
      },
      className
    );

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
