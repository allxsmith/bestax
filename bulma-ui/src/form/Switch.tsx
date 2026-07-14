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
 *
 * @property {(typeof switchColors)[number]} [color] - Color variant for the switch.
 * @property {(typeof switchSizes)[number]} [size] - Size of the switch.
 * @property {boolean} [isRounded] - Use rounded switch style.
 * @property {boolean} [isThin] - Use thin switch style.
 * @property {boolean} [isOutlined] - Use outlined switch style.
 * @property {boolean} [isRtl] - Right-to-left layout (label on left).
 * @property {(typeof switchColors)[number]} [passiveType] - Color for the unchecked (inactive) state.
 * @property {boolean} [checked] - Whether the switch is checked.
 * @property {boolean} [defaultChecked] - Default checked state for uncontrolled usage.
 * @property {boolean} [disabled] - Whether the switch is disabled.
 * @property {string} [className] - Additional CSS classes.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {React.ReactNode} [children] - Label content for the switch.
 * @property {(event: React.ChangeEvent<HTMLInputElement>) => void} [onChange] - Change handler.
 */
export interface SwitchProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'size' | 'type' | 'color'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  color?: (typeof switchColors)[number];
  size?: (typeof switchSizes)[number];
  isRounded?: boolean;
  isThin?: boolean;
  isOutlined?: boolean;
  isRtl?: boolean;
  passiveType?: (typeof switchColors)[number];
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Switch component for toggling between on/off states.
 *
 * A styled checkbox that appears as a toggle switch, commonly used for
 * settings and preferences. Supports various colors, sizes, and styles.
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
