import React, { useCallback, useMemo, useState } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
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
import { useAutoLabelledBy } from './useAutoLabelId';
import { Checkbox } from './Checkbox';

/**
 * Props for the Checkboxes component.
 */
export interface CheckboxesProps
  extends Omit<BulmaClassesProps, 'color'>, FormFieldProps {
  /** Field label naming the whole group. Automatically associated via `aria-labelledby` on the `role="group"` wrapper — uses your `labelProps.id` when provided, otherwise a generated one. Dropped inside an outer `Field` (label that `Field` yourself). */
  label?: React.ReactNode;
  /** Props for the label element. An explicit `id` here is used as the `aria-labelledby` target instead of a generated one. */
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    [key: string]: unknown;
  };
  /** Additional CSS classes to apply. */
  className?: string;
  /** Form field name shared by every Checkbox in the group (via context). */
  name?: string;
  /** Currently-selected values (controlled mode). */
  value?: string[];
  /** Initial selected values (uncontrolled mode). */
  defaultValue?: string[];
  /** Fires when the selection changes; receives the new array. */
  onChange?: (values: string[]) => void;
  /** Checkbox elements to render in the group. */
  children?: React.ReactNode;
}

/**
 * The `Checkboxes` component wraps multiple `Checkbox` components in a Bulma-styled group.
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
const CheckboxesComponent: React.FC<CheckboxesProps> = ({
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
      ...(groupActive ? { value: currentValue, onChange: handleChange } : {}),
    }),
    [name, groupActive, currentValue, handleChange]
  );

  const checkboxesElement = (
    <div
      className={wrapperClass}
      role="group"
      aria-labelledby={ariaLabelledBy}
      {...rest}
    >
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

export const Checkboxes = withSubComponents(
  CheckboxesComponent,
  { Checkbox },
  'Checkboxes'
);

export default Checkboxes;
