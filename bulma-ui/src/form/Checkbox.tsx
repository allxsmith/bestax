import React, { forwardRef, useCallback, useRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { useCheckboxesGroup } from './FormContext';

/**
 * The values the Checkbox `color` prop accepts, as a readonly tuple.
 *
 * `CheckboxProps['color']` is typed from it, so the two list the same values.
 * Map over it to build a color picker, or check a value that arrives at
 * runtime before passing it in: the component adds no color class for a value
 * outside the tuple.
 *
 * @example
 * import { Checkbox, checkboxColors } from '@allxsmith/bestax-bulma';
 *
 * checkboxColors.map(color => (
 *   <Checkbox key={color} color={color}>
 *     {color}
 *   </Checkbox>
 * ));
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
 * The values the Checkbox `size` prop accepts, as a readonly tuple.
 *
 * `CheckboxProps['size']` is typed from it, so the two list the same values.
 * Use it to offer a size choice or to check a value that arrives at runtime:
 * the component adds no size class for a value outside the tuple. These are
 * element sizes, not the spacing scale in `validSizes`.
 *
 * @example
 * import { checkboxSizes } from '@allxsmith/bestax-bulma';
 *
 * type CheckboxSize = (typeof checkboxSizes)[number];
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
  /** Color of the checkbox. */
  color?: (typeof checkboxColors)[number];
  /** Size of the checkbox. */
  size?: (typeof checkboxSizes)[number];
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Whether the checkbox is disabled. */
  disabled?: boolean;
  /**
   * Shows the mixed state, as in a "Select all" box when some of what it
   * covers is checked. It's a look and an announcement only: `checked` is
   * still the value, and a click still toggles `checked`. Set to `true` or
   * `false`, it's controlled: a browser clears the mixed state on a click,
   * so the component sets it again from this prop after every click and
   * every render. Unset isn't `false`. The component leaves the input's own
   * `indeterminate` property alone, so a ref can set it, and going from set
   * to unset clears it once and hands it back. It has no HTML attribute, so
   * server-rendered markup can't carry it, and a mixed box renders unmixed
   * until hydration.
   */
  indeterminate?: boolean;
  /**
   * Additional CSS classes, on the outer `<label>`. That's the element that
   * declares the `--bulma-checkbox-*` variables, so a class is how to set
   * one: `style` and the other input attributes go to the `<input>`. Name
   * `.styled-checkbox` beside your class in the selector, so it beats the
   * label's own declaration whatever order the stylesheets load in. A
   * `color` prop declares the fills again on `.styled-checkbox.is-<color>`,
   * which ties that selector, so leave `color` unset when a class sets them.
   */
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
      indeterminate,
      onChange,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      ...props,
    });

    // The input's own ref, merged with the forwarded one. A callback ref's
    // return value is handed back, so React 19 still runs a cleanup it
    // returns, as it did when the ref went straight to the input.
    const inputRef = useRef<HTMLInputElement | null>(null);
    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') return ref(node);
        if (ref) ref.current = node;
      },
      [ref]
    );

    // `indeterminate` is a DOM property with no attribute, so it's set on the
    // input rather than rendered. A click clears it, so this runs after every
    // render, not only when the prop changes. Unset, it's left alone, so a
    // ref that sets the property itself still works. `ownsIndeterminateRef`
    // remembers that this component set it, so a prop that goes back to unset
    // clears the dash once instead of leaving it on.
    const ownsIndeterminateRef = useRef(false);
    useClientLayoutEffect(() => {
      if (indeterminate !== undefined) {
        ownsIndeterminateRef.current = true;
        inputRef.current!.indeterminate = indeterminate;
      } else if (ownsIndeterminateRef.current) {
        ownsIndeterminateRef.current = false;
        inputRef.current!.indeterminate = false;
      }
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
        // The click that got here cleared the mixed state. Put it back now,
        // since a click that changes no state renders nothing to do it.
        if (indeterminate !== undefined) e.target.indeterminate = indeterminate;
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
      [onChange, group, value, indeterminate]
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
          ref={setRefs}
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
