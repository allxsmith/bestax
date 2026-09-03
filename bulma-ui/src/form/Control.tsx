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
 * Distinguishes an `IconProps` object from a plain custom node (an inline SVG, a `react-icons`
 * component, …) passed to a slot that accepts either.
 */
function isIconProps(value: IconProps | React.ReactNode): value is IconProps {
  return (
    typeof value === 'object' &&
    value !== null &&
    !React.isValidElement(value) &&
    ('name' in value || 'children' in value)
  );
}

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
  /** Icon props for left icon, or a custom node (an inline SVG, a `react-icons` component, …) rendered in place of a class-based glyph. */
  iconLeft?: IconProps | React.ReactNode;
  /** Icon props for right icon, or a custom node (an inline SVG, a `react-icons` component, …) rendered in place of a class-based glyph. */
  iconRight?: IconProps | React.ReactNode;
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

    // Prepare icon props for the shortcut. A truthiness test (not `!== undefined`)
    // so a falsy node from the idiomatic `iconLeft={cond && <Node/>}` / `iconLeft={maybe ?? null}`
    // pattern counts as "no icon" — otherwise `false`/`null` would reserve the icon column and
    // mount an empty `.icon` span. A falsy `iconLeft` also correctly falls through to the
    // `iconLeftName` shortcut, matching the pre-node behavior.
    const leftIconValue: IconProps | React.ReactNode | undefined =
      iconLeft ||
      (iconLeftName
        ? {
            name: iconLeftName,
            size: iconLeftSize,
          }
        : undefined);

    const rightIconValue: IconProps | React.ReactNode | undefined =
      iconRight ||
      (iconRightName
        ? {
            name: iconRightName,
            size: iconRightSize,
          }
        : undefined);

    const mainClass = usePrefixedClassNames('control', {
      'has-icons-left': hasIconsLeft || !!leftIconValue,
      'has-icons-right': hasIconsRight || !!rightIconValue,
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
          {leftIconValue &&
            (isIconProps(leftIconValue) ? (
              <Icon
                {...leftIconValue}
                className={prefixedClassNames(classPrefix, 'is-left')}
              />
            ) : (
              <Icon className={prefixedClassNames(classPrefix, 'is-left')}>
                {leftIconValue}
              </Icon>
            ))}
          {rightIconValue &&
            (isIconProps(rightIconValue) ? (
              <Icon
                {...rightIconValue}
                className={prefixedClassNames(classPrefix, 'is-right')}
              />
            ) : (
              <Icon className={prefixedClassNames(classPrefix, 'is-right')}>
                {rightIconValue}
              </Icon>
            ))}
        </Component>
      </ControlProvider>
    );
  }
);

Control.displayName = 'Control';

export default Control;
