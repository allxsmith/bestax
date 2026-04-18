import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useInsideField, useInsideControl } from './FormContext';
import { Field } from './Field';
import { Control } from './Control';
import { FormFieldProps } from './fieldProps';

/**
 * Props for the Checkboxes component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {React.ReactNode} [children] - Checkbox elements to render in the group.
 */
export interface CheckboxesProps extends Omit<BulmaClassesProps, 'color'>, FormFieldProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Wraps Checkbox components inside a Bulma 'checkboxes' wrapper.
 * Leverages useBulmaClasses for consistency with other components.
 *
 * @function
 * @param {CheckboxesProps} props - Props for the Checkboxes component.
 * @returns {JSX.Element} The rendered checkboxes group.
 * @see {@link https://bulma.io/documentation/form/checkbox/#grouped-checkboxes | Bulma Checkboxes documentation}
 *
 * @example
 * // Group of checkboxes
 * <Checkboxes>
 *   <Checkbox>Option A</Checkbox>
 *   <Checkbox>Option B</Checkbox>
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

  const checkboxesElement = (
    <div className={wrapperClass} {...rest}>
      {children}
    </div>
  );

  let content = checkboxesElement;

  if (!insideControl) {
    content = <Control>{content}</Control>;
  }

  if (!insideField) {
    return (
      <Field label={label} labelSize={labelSize} labelProps={labelProps}
             horizontal={horizontal} className={fieldClassName}>
        {content}
        {messageEl}
      </Field>
    );
  }

  return <>{content}{messageEl}</>;
};

export default Checkboxes;
