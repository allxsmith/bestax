import React from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

/**
 * Props for the Checkboxes component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {React.ReactNode} [children] - Checkbox elements to render in the group.
 */
export interface CheckboxesProps extends Omit<BulmaClassesProps, 'color'> {
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
 */
export const Checkboxes: React.FC<CheckboxesProps> = ({
  children,
  className,
  ...props
}) => {
  const { classPrefix } = useConfig();
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    ...props,
  });

  const mainClass = classPrefix ? `${classPrefix}checkboxes` : 'checkboxes';
  const wrapperClass = classNames(mainClass, bulmaHelperClasses, className);

  return (
    <div className={wrapperClass} {...rest}>
      {children}
    </div>
  );
};

export default Checkboxes;
