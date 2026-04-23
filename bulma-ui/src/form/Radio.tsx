import React, { forwardRef, useCallback } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useRadiosGroup } from './FormContext';

/**
 * Valid colors for the Radio component.
 */
export const radioColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

/**
 * Valid sizes for the Radio component.
 */
export const radioSizes = ['small', 'normal', 'medium', 'large'] as const;

/**
 * Props for the Radio component.
 *
 * @property {(typeof radioColors)[number]} [color] - Color variant for the radio.
 * @property {(typeof radioSizes)[number]} [size] - Size of the radio.
 * @property {boolean} [disabled] - Whether the radio is disabled.
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {React.ReactNode} [children] - The label/content for the radio.
 * @see Bulma Radio documentation: https://bulma.io/documentation/form/radio/
 */
export interface RadioProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'size' | 'type' | 'color'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  color?: (typeof radioColors)[number];
  size?: (typeof radioSizes)[number];
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bulma Radio component with themed styling support.
 *
 * Renders a custom-styled radio button with a visual indicator,
 * supporting colors, sizes, and various states. Inside a `<Radios>` group,
 * Radio inherits `name` and (when the group is in controlled or uncontrolled
 * mode) derives its `checked` state from the group's `value` and dispatches
 * the group's `onChange` when clicked.
 *
 * Local props always win over group context (`name`, `checked`, `onChange`
 * on Radio override the group). Required for opt-out scenarios.
 *
 * @function
 * @param {RadioProps} props - Props for the Radio component.
 * @returns {JSX.Element} The rendered radio element.
 *
 * @example
 * // Basic radio
 * <Radio name="option">Option A</Radio>
 *
 * @example
 * // Inside a group
 * <Radios name="color" defaultValue="red">
 *   <Radio value="red">Red</Radio>
 *   <Radio value="blue">Blue</Radio>
 * </Radios>
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
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

    // Inherit name + selection state from a surrounding <Radios> group.
    // Local props always win over the group (explicit > implicit).
    const group = useRadiosGroup();
    const effectiveName = name ?? group?.name;

    // Group-managed checked state — only when the group is in
    // controlled/uncontrolled mode (group.value is defined) AND this Radio
    // has a value to compare against. Local `checked` always wins.
    const groupManaged =
      group?.value !== undefined && value !== undefined;
    const effectiveChecked =
      checked !== undefined
        ? checked
        : groupManaged
          ? group!.value === value
          : undefined;
    // When the group manages checked, suppress local defaultChecked to avoid
    // the controlled/uncontrolled React warning.
    const effectiveDefaultChecked = groupManaged ? undefined : defaultChecked;

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        // Local onChange always fires.
        onChange?.(e);
        // Dispatch to the group additionally — keeps group state in sync.
        if (group?.onChange && value !== undefined) {
          group.onChange(String(value));
        }
      },
      [onChange, group, value]
    );

    const mainClass = usePrefixedClassNames('styled-radio', 'radio', {
      [`is-${color}`]: color && radioColors.includes(color),
      [`is-${size}`]: size && radioSizes.includes(size),
    });
    const radioClass = classNames(mainClass, bulmaHelperClasses, className);

    return (
      <label className={radioClass}>
        <input
          ref={ref}
          type="radio"
          disabled={disabled}
          name={effectiveName}
          value={value}
          checked={effectiveChecked}
          defaultChecked={effectiveDefaultChecked}
          onChange={handleChange}
          {...rest}
        />
        <span className="check" />
        {children && <span className="control-label">{children}</span>}
      </label>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;
