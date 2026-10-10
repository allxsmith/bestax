import React, { forwardRef, useCallback } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useRadiosGroup, useReportFieldLabelFor } from './FormContext';

/**
 * The values the Radio `color` prop accepts, as a readonly tuple.
 *
 * `RadioProps['color']` is typed from it, so the two list the same values.
 * Map over it to build a color picker, or check a value that arrives at
 * runtime before passing it in: the component adds no color class for a value
 * outside the tuple.
 *
 * @example
 * import { Radio, Radios, radioColors } from '@allxsmith/bestax-bulma';
 *
 * <Radios name="accent" defaultValue="primary">
 *   {radioColors.map(color => (
 *     <Radio key={color} value={color} color={color}>
 *       {color}
 *     </Radio>
 *   ))}
 * </Radios>;
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
 * The values the Radio `size` prop accepts, as a readonly tuple.
 *
 * `RadioProps['size']` is typed from it, so the two list the same values. Use
 * it to offer a size choice or to check a value that arrives at runtime: the
 * component adds no size class for a value outside the tuple. These are
 * element sizes, not the spacing scale in `validSizes`.
 *
 * @example
 * import { radioSizes } from '@allxsmith/bestax-bulma';
 *
 * type RadioSize = (typeof radioSizes)[number];
 */
export const radioSizes = ['small', 'normal', 'medium', 'large'] as const;

/**
 * Props for the Radio component.
 */
export interface RadioProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'size' | 'type' | 'color'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  /** Color of the radio button. */
  color?: (typeof radioColors)[number];
  /** Size of the radio button. */
  size?: (typeof radioSizes)[number];
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Whether the radio is disabled. */
  disabled?: boolean;
  /** Additional CSS classes to apply. */
  className?: string;
  /** The label/content for the radio. */
  children?: React.ReactNode;
}

/**
 * The `Radio` component provides a Bulma-styled radio button input with flexible labels and helper classes.
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
    // Named by its own children, so it takes no generated `for` from a
    // labeled Field, which then drops it unless other content takes it (#1004).
    useReportFieldLabelFor(false);

    // Inherit name + selection state from a surrounding <Radios> group.
    // Local props always win over the group (explicit > implicit).
    const group = useRadiosGroup();
    const effectiveName = name ?? group?.name;

    // Group-managed checked state — only when the group is in
    // controlled/uncontrolled mode (group.value is defined) AND this Radio
    // has a value to compare against. Local `checked` always wins.
    const groupManaged = group?.value !== undefined && value !== undefined;
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
    const checkClass = usePrefixedClassNames('check');
    const controlLabelClass = usePrefixedClassNames('control-label');

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
        <span className={checkClass} />
        {children && <span className={controlLabelClass}>{children}</span>}
      </label>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;
