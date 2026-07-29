import React, { forwardRef, useCallback } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useCheckboxesGroup } from './FormContext';

/**
 * Valid colors for the Checkbox component.
 */
export const checkboxColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

/**
 * Valid sizes for the Checkbox component.
 */
export const checkboxSizes = ['small', 'normal', 'medium', 'large'] as const;

/**
 * Props for the Checkbox component.
 */
export interface CheckboxProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'size' | 'type' | 'color'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  /** Color variant for the checkbox. */
  color?: (typeof checkboxColors)[number];
  /** Size of the checkbox. */
  size?: (typeof checkboxSizes)[number];
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Whether the checkbox is disabled. */
  disabled?: boolean;
  /** Additional CSS classes to apply. */
  className?: string;
  /** The label/content for the checkbox. */
  children?: React.ReactNode;
}

/**
 * The `Checkbox` component provides a Bulma-styled checkbox input.
 *
 * @function
 * @param {CheckboxProps} props - Props for the Checkbox component.
 * @returns {JSX.Element} The rendered checkbox element.
 *
 * @example
 * // Basic checkbox
 * <Checkbox>Accept terms</Checkbox>
 *
 * @example
 * // Inside a group
 * <Checkboxes name="tags" defaultValue={['react']}>
 *   <Checkbox value="react">React</Checkbox>
 *   <Checkbox value="vue">Vue</Checkbox>
 * </Checkboxes>
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      color,
      size,
      className,
      children,
      textColor,
      disabled,
      name,
      value,
      checked,
      defaultChecked,
      onChange,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      ...props,
    });

    // Inherit name + selection state from a surrounding <Checkboxes> group.
    // Local props always win over the group (explicit > implicit).
    const group = useCheckboxesGroup();
    const effectiveName = name ?? group?.name;

    // Group-managed checked state — only when the group is in
    // controlled/uncontrolled mode (group.value is defined) AND this Checkbox
    // has a value to compare against. Local `checked` always wins.
    const groupManaged = group?.value !== undefined && value !== undefined;
    const groupHas = groupManaged && group!.value!.includes(String(value));
    const effectiveChecked =
      checked !== undefined ? checked : groupManaged ? groupHas : undefined;
    // When the group manages checked, suppress local defaultChecked to avoid
    // the controlled/uncontrolled React warning.
    const effectiveDefaultChecked = groupManaged ? undefined : defaultChecked;

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        // Local onChange always fires.
        onChange?.(e);
        // Dispatch to the group additionally — toggle this value's
        // membership in the group's array.
        if (group?.onChange && value !== undefined) {
          const valStr = String(value);
          const currentArr = group.value ?? [];
          const next = e.target.checked
            ? currentArr.includes(valStr)
              ? currentArr
              : [...currentArr, valStr]
            : currentArr.filter(v => v !== valStr);
          group.onChange(next);
        }
      },
      [onChange, group, value]
    );

    const mainClass = usePrefixedClassNames('styled-checkbox', 'checkbox', {
      [`is-${color}`]: color && checkboxColors.includes(color),
      [`is-${size}`]: size && checkboxSizes.includes(size),
    });
    const checkboxClass = classNames(mainClass, bulmaHelperClasses, className);
    const checkClass = usePrefixedClassNames('check');
    const controlLabelClass = usePrefixedClassNames('control-label');

    return (
      <label className={checkboxClass}>
        <input
          ref={ref}
          type="checkbox"
          disabled={disabled}
          name={effectiveName}
          value={value}
          checked={effectiveChecked}
          defaultChecked={effectiveDefaultChecked}
          onChange={handleChange}
          {...rest}
        />
        <span className={checkClass} />
        {children && <span className={controlLabelClass}>{children}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
