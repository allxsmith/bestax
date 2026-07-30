import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Valid colors for the Switch component.
 */
export const switchColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

/**
 * Valid sizes for the Switch component.
 */
export const switchSizes = ['small', 'normal', 'medium', 'large'] as const;

/**
 * Props for the Switch component.
 * @extraProp {boolean} [checked] - Controlled checked state.
 * @extraProp {boolean} [defaultChecked=false] - Default checked state for uncontrolled usage.
 * @extraProp {boolean} [disabled=false] - Whether the switch is disabled.
 * @extraProp {string} [className] - Additional CSS classes.
 * @extraProp {(event: React.ChangeEvent<HTMLInputElement>) => void} [onChange] - Callback when switch state changes.
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Ref forwarded to the input element.
 */
export interface SwitchProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'size' | 'type' | 'color'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  /** Color variant for the switch. */
  color?: (typeof switchColors)[number];
  /** Size of the switch. */
  size?: (typeof switchSizes)[number];
  /** Use rounded switch style. */
  isRounded?: boolean;
  /** Use thin switch style. */
  isThin?: boolean;
  /** Use outlined switch style. */
  isOutlined?: boolean;
  /** Right-to-left layout (label on left). */
  isRtl?: boolean;
  /** Color when the switch is in the off/passive state. */
  passiveType?: (typeof switchColors)[number];
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Label content for the switch. */
  children?: React.ReactNode;
}

/**
 * The `Switch` component provides a toggle switch for boolean on/off states.
 *
 * @function
 * @param {SwitchProps} props - Props for the Switch component.
 * @returns {JSX.Element} The rendered switch element.
 *
 * @example
 * // Basic switch
 * <Switch>Enable notifications</Switch>
 *
 * @example
 * // Colored and rounded switch
 * <Switch color="success" isRounded checked>
 *   Active
 * </Switch>
 *
 * @example
 * // Controlled switch
 * <Switch
 *   checked={isEnabled}
 *   onChange={(e) => setIsEnabled(e.target.checked)}
 * >
 *   Feature enabled
 * </Switch>
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      color,
      size,
      isRounded,
      isThin,
      isOutlined,
      isRtl,
      passiveType,
      className,
      children,
      textColor,
      disabled,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      ...props,
    });

    // Generate Bulma classes with prefix
    const switchClasses = usePrefixedClassNames('switch', {
      [`is-${color}`]: color && switchColors.includes(color),
      [`is-${size}`]: size && switchSizes.includes(size),
      'is-rounded': isRounded,
      'is-thin': isThin,
      'is-outlined': isOutlined,
      'is-rtl': isRtl,
      [`is-${passiveType}-passive`]:
        passiveType && switchColors.includes(passiveType),
    });

    // Combine prefixed Bulma classes with unprefixed user className and helper classes
    const labelClasses = classNames(
      switchClasses,
      bulmaHelperClasses,
      className
    );
    const checkClass = usePrefixedClassNames('check');
    const controlLabelClass = usePrefixedClassNames('control-label');

    return (
      <label className={labelClasses}>
        <input ref={ref} type="checkbox" disabled={disabled} {...rest} />
        <span className={checkClass} />
        {children && <span className={controlLabelClass}>{children}</span>}
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
