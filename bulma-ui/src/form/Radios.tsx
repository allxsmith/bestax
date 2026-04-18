import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useInsideField, useInsideControl } from './FormContext';
import { Field } from './Field';
import { Control } from './Control';
import { FormFieldProps } from './fieldProps';

/**
 * Props for the Radios component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {React.ReactNode} children - Radio elements to render in the group.
 */
export interface RadiosProps extends Omit<BulmaClassesProps, 'color'>, FormFieldProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Wraps Radio components inside a Bulma 'radios' wrapper.
 * Leverages useBulmaClasses for consistency with other components.
 *
 * @function
 * @param {RadiosProps} props - Props for the Radios component.
 * @returns {JSX.Element} The rendered radios group.
 * @see {@link https://bulma.io/documentation/form/radio/#grouped-radios | Bulma Radios documentation}
 *
 * @example
 * // Group of radios
 * <Radios>
 *   <Radio name="choice" value="a">Option A</Radio>
 *   <Radio name="choice" value="b">Option B</Radio>
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

  const radiosElement = (
    <div className={wrapperClass} {...rest}>
      {children}
    </div>
  );

  let content = radiosElement;

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

export default Radios;
