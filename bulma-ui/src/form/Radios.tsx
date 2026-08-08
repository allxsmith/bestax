import React, { useCallback, useMemo, useState } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
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
import { useAutoLabelledBy } from './useAutoLabelId';
import { Radio } from './Radio';

/**
 * Props for the Radios component.
 */
export interface RadiosProps
  extends Omit<BulmaClassesProps, 'color'>, FormFieldProps {
  /** Field label naming the whole group. Automatically associated via `aria-labelledby` on the `role="radiogroup"` wrapper — uses your `labelProps.id` when provided, otherwise a generated one. Dropped inside an outer `Field` (label that `Field` yourself). */
  label?: React.ReactNode;
  /** Props for the label element. An explicit `id` here is used as the `aria-labelledby` target instead of a generated one; any `htmlFor` is ignored (a group label names the group, never a single control). */
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    [key: string]: unknown;
  };
  /** Additional CSS classes to apply. */
  className?: string;
  /** Form field name shared by every Radio in the group (via context). */
  name?: string;
  /** Currently-selected value (controlled mode). */
  value?: string;
  /** Initial selected value (uncontrolled mode). */
  defaultValue?: string;
  /** Fires when the selection changes. */
  onChange?: (value: string) => void;
  /** Radio elements to render in the group. */
  children: React.ReactNode;
}

/**
 * The `Radios` component wraps multiple `Radio` components in a Bulma-styled group.
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
const RadiosComponent: React.FC<RadiosProps> = ({
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
  const { ariaLabelledBy, fieldLabelProps } = useAutoLabelledBy({
    label,
    labelProps,
    rendersLabel: !insideField,
  });
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
    <div
      className={wrapperClass}
      role="radiogroup"
      aria-labelledby={ariaLabelledBy}
      {...rest}
    >
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
        labelProps={fieldLabelProps}
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

export const Radios = withSubComponents(RadiosComponent, { Radio }, 'Radios');

export default Radios;
