import React, { useCallback, useMemo, useState } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import {
  useInsideField,
  useInsideControl,
  rendersOwnField,
  rendersOwnControl,
  CheckboxesProvider,
  CheckboxesGroupContextValue,
} from './FormContext';
import { Field } from './Field';
import { Control } from './Control';
import { FormFieldProps } from './fieldProps';
import { useAutoLabelledBy } from './useAutoLabelId';
import { Checkbox } from './Checkbox';
import { GroupFieldset } from './groupFieldset';

/**
 * Props for the Checkboxes component.
 * Inside an existing `Control` it renders no `Control` of its own. Inside an
 * outer `Field`, or a `Control` with no `Field` around it, it renders no
 * `Field` of its own either. The exception is `label`, `message`, `horizontal`
 * or `fieldClassName` in that bare `Control`: it keeps a `Field` for them,
 * nested in the `.control`, and warns in development. Wrap the `Control` in a
 * `Field` instead, and set the `label`, `horizontal` and class name on that
 * `Field`.
 */
export interface CheckboxesProps
  extends Omit<BulmaClassesProps, 'color'>, FormFieldProps {
  /** Field label naming the whole group. Automatically associated via `aria-labelledby` on the `role="group"` wrapper — uses your `labelProps.id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label names the group instead through `aria-labelledby` when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`). An `aria-label` or `aria-labelledby` you set on the group wins over either label, which still renders but no longer names it. An `aria-labelledby` key counts even when undefined, since it is spread over the group's own. */
  label?: React.ReactNode;
  /** Props for the label element. An explicit `id` here is used as the `aria-labelledby` target instead of a generated one; any `htmlFor` is ignored (a group label names the group, never a single control). */
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
  /**
   * The element the group renders as. With `fieldset` it's a native
   * `<fieldset>`. Where the group renders a `Field` of its own, that `Field`
   * is the `<fieldset>` and the `label` is its `<legend>`, in the label
   * column when `horizontal`, so the legend names the group with no ids to
   * wire. Your other attributes then go on the `<fieldset>`, while
   * `className` and the helper props stay on the box that lays out the
   * checkboxes. Inside an outer `Field` there's no legend: the group element
   * itself is the `<fieldset>`, named by that `Field`'s label as before.
   * `div`, the default, renders the group as it always has.
   * @defaultValue 'div'
   */
  as?: 'div' | 'fieldset';
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
  as,
  ...props
}) => {
  const insideField = useInsideField();
  const insideControl = useInsideControl();
  const ownField = rendersOwnField('Checkboxes', {
    insideField,
    insideControl,
    label,
    message,
    horizontal,
    fieldClassName,
  });
  // As a fieldset with a Field of its own, the group's label is its legend,
  // which names it with no id, so nothing points `aria-labelledby` at it.
  const asFieldset = as === 'fieldset';
  const fieldsetField = asFieldset && ownField;
  const { ariaLabelledBy, fieldLabelProps } = useAutoLabelledBy({
    label,
    labelProps,
    rendersLabel: ownField && !fieldsetField,
    callerProps: props,
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

  const choices = (
    <CheckboxesProvider value={ctx}>{children}</CheckboxesProvider>
  );
  // A fieldset is a group already, so it takes no role of its own.
  const Group = asFieldset ? 'fieldset' : 'div';
  const checkboxesElement = fieldsetField ? (
    <div className={wrapperClass}>{choices}</div>
  ) : (
    <Group
      className={wrapperClass}
      role={asFieldset ? undefined : 'group'}
      aria-labelledby={ariaLabelledBy}
      {...rest}
    >
      {choices}
    </Group>
  );

  let content = checkboxesElement;

  if (rendersOwnControl('Checkboxes', { insideControl })) {
    content = <Control>{content}</Control>;
  }

  if (fieldsetField) {
    return (
      <GroupFieldset
        label={label}
        labelSize={labelSize}
        labelProps={labelProps}
        horizontal={horizontal}
        fieldClassName={fieldClassName}
        attributes={rest}
        message={messageEl}
      >
        {content}
      </GroupFieldset>
    );
  }

  if (ownField) {
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
