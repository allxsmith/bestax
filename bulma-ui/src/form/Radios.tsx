import React, { useCallback, useMemo, useState } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import {
  useInsideField,
  useInsideControl,
  RadiosProvider,
  RadiosGroupContextValue,
} from './FormContext';
import { Field } from './Field';
import { Control } from './Control';
import { FormFieldProps } from './fieldProps';

/**
 * Props for the Radios component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {string} [name] - Form field name shared by every Radio in the group.
 * @property {string} [value] - Currently-selected value (controlled mode).
 * @property {string} [defaultValue] - Initial selected value (uncontrolled mode).
 * @property {(value: string) => void} [onChange] - Fired when the selection changes. Receives the new value.
 * @property {React.ReactNode} children - Radio elements to render in the group.
 */
export interface RadiosProps
  extends Omit<BulmaClassesProps, 'color'>, FormFieldProps {
  className?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
}

/**
 * Wraps Radio components inside a Bulma 'radios' wrapper. Manages selection
 * state for the entire group when given `value`/`defaultValue`/`onChange`,
 * matching the pattern used by MUI's RadioGroup, Radix's RadioGroup, and React
 * Aria's RadioGroup.
 *
 * Three usage modes:
 *
 * 1. **Name-only** — pass `name`. Each child Radio manages its own checked
 *    state via `defaultChecked` or `checked`. Backwards compatible.
 *
 * 2. **Controlled** — pass `value` and `onChange`. The group owns selection;
 *    each child derives `checked` from `value === my.value`.
 *
 * 3. **Uncontrolled** — pass `defaultValue` (and optionally `onChange`). The
 *    group manages internal state; `onChange` fires on selection change.
 *
 * @function
 * @param {RadiosProps} props - Props for the Radios component.
 * @returns {JSX.Element} The rendered radios group.
 * @see {@link https://bulma.io/documentation/form/radio/#grouped-radios | Bulma Radios documentation}
 *
 * @example
 * // Controlled
 * const [color, setColor] = useState('red');
 * <Radios name="color" value={color} onChange={setColor}>
 *   <Radio value="red">Red</Radio>
 *   <Radio value="green">Green</Radio>
 *   <Radio value="blue">Blue</Radio>
 * </Radios>
 *
 * @example
 * // Uncontrolled
 * <Radios name="color" defaultValue="red" onChange={v => console.log(v)}>
 *   <Radio value="red">Red</Radio>
 *   <Radio value="green">Green</Radio>
 * </Radios>
 */
export const Radios: React.FC<RadiosProps> = ({
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

  const mainClass = usePrefixedClassNames('radios');
  const wrapperClass = classNames(mainClass, bulmaHelperClasses, className);

  const helpClass = usePrefixedClassNames('help', {
    [`is-${messageColor}`]: !!messageColor,
  });
  const messageEl = message ? <p className={helpClass}>{message}</p> : null;

  // The group is "active" (manages child selection) when the user opted in by
  // passing value, defaultValue, or onChange. Otherwise it's name-only and
  // children manage their own checked state (Stage 1 behavior).
  const groupActive =
    value !== undefined || defaultValue !== undefined || onChange !== undefined;

  const [internalValue, setInternalValue] = useState<string | undefined>(
    defaultValue
  );
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = useCallback(
    (newValue: string) => {
      if (!isControlled) setInternalValue(newValue);
      onChange?.(newValue);
    },
    [isControlled, onChange]
  );

  const ctx = useMemo<RadiosGroupContextValue>(
    () => ({
      name,
      ...(groupActive ? { value: currentValue, onChange: handleChange } : {}),
    }),
    [name, groupActive, currentValue, handleChange]
  );

  const radiosElement = (
    <div className={wrapperClass} {...rest}>
      <RadiosProvider value={ctx}>{children}</RadiosProvider>
    </div>
  );

  let content = radiosElement;

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

export default Radios;
