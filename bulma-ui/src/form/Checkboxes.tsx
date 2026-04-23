import React, { useCallback, useMemo, useState } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import {
  useInsideField,
  useInsideControl,
  CheckboxesProvider,
  CheckboxesGroupContextValue,
} from './FormContext';
import { Field } from './Field';
import { Control } from './Control';
import { FormFieldProps } from './fieldProps';

/**
 * Props for the Checkboxes component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {string} [name] - Form field name shared by every Checkbox in the group.
 * @property {string[]} [value] - Currently-selected values (controlled mode).
 * @property {string[]} [defaultValue] - Initial selected values (uncontrolled mode).
 * @property {(values: string[]) => void} [onChange] - Fired when the selection changes. Receives the new array of selected values.
 * @property {React.ReactNode} [children] - Checkbox elements to render in the group.
 */
export interface CheckboxesProps
  extends Omit<BulmaClassesProps, 'color'>,
    FormFieldProps {
  className?: string;
  name?: string;
  value?: string[];
  defaultValue?: string[];
  onChange?: (values: string[]) => void;
  children?: React.ReactNode;
}

/**
 * Wraps Checkbox components inside a Bulma 'checkboxes' wrapper. Manages the
 * selected-values array for the entire group when given
 * `value`/`defaultValue`/`onChange`.
 *
 * Three usage modes:
 *
 * 1. **Name-only** — pass `name`. Each child Checkbox manages its own checked
 *    state via `defaultChecked` or `checked`. Backwards compatible.
 *
 * 2. **Controlled** — pass `value` (array) and `onChange`. The group owns
 *    selection; each child derives `checked` from `value.includes(my.value)`.
 *
 * 3. **Uncontrolled** — pass `defaultValue` (array) and optionally `onChange`.
 *    The group manages internal state; `onChange` fires with the new array.
 *
 * @function
 * @param {CheckboxesProps} props - Props for the Checkboxes component.
 * @returns {JSX.Element} The rendered checkboxes group.
 * @see {@link https://bulma.io/documentation/form/checkbox/#grouped-checkboxes | Bulma Checkboxes documentation}
 *
 * @example
 * // Controlled
 * const [tags, setTags] = useState(['react']);
 * <Checkboxes name="tags" value={tags} onChange={setTags}>
 *   <Checkbox value="react">React</Checkbox>
 *   <Checkbox value="vue">Vue</Checkbox>
 *   <Checkbox value="angular">Angular</Checkbox>
 * </Checkboxes>
 *
 * @example
 * // Uncontrolled
 * <Checkboxes name="tags" defaultValue={['react', 'vue']}>
 *   <Checkbox value="react">React</Checkbox>
 *   <Checkbox value="vue">Vue</Checkbox>
 *   <Checkbox value="angular">Angular</Checkbox>
 * </Checkboxes>
 */
export const Checkboxes: React.FC<CheckboxesProps> = ({
  label,
  labelSize,
  labelProps,
  horizontal,
  message,
  messageColor,
  fieldClassName,
  name,
  value,
  defaultValue,
  onChange,
  children,
  className,
  ...props
}) => {
  const insideField = useInsideField();
  const insideControl = useInsideControl();
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    ...props,
  });

  const mainClass = usePrefixedClassNames('checkboxes');
  const wrapperClass = classNames(mainClass, bulmaHelperClasses, className);

  const helpClass = usePrefixedClassNames('help', {
    [`is-${messageColor}`]: !!messageColor,
  });
  const messageEl = message ? <p className={helpClass}>{message}</p> : null;

  const groupActive =
    value !== undefined || defaultValue !== undefined || onChange !== undefined;

  const [internalValue, setInternalValue] = useState<string[] | undefined>(
    defaultValue
  );
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = useCallback(
    (newValues: string[]) => {
      if (!isControlled) setInternalValue(newValues);
      onChange?.(newValues);
    },
    [isControlled, onChange]
  );

  const ctx = useMemo<CheckboxesGroupContextValue>(
    () => ({
      name,
      ...(groupActive
        ? { value: currentValue, onChange: handleChange }
        : {}),
    }),
    [name, groupActive, currentValue, handleChange]
  );

  const checkboxesElement = (
    <div className={wrapperClass} {...rest}>
      <CheckboxesProvider value={ctx}>{children}</CheckboxesProvider>
    </div>
  );

  let content = checkboxesElement;

  if (!insideControl) {
    content = <Control>{content}</Control>;
  }

  if (!insideField) {
    return (
      <Field
        label={label}
        labelSize={labelSize}
        labelProps={labelProps}
        horizontal={horizontal}
        className={fieldClassName}
      >
        {content}
        {messageEl}
      </Field>
    );
  }

  return (
    <>
      {content}
      {messageEl}
    </>
  );
};

export default Checkboxes;
