import React from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Radios component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {React.ReactNode} children - Radio elements to render in the group.
 */
export interface RadiosProps extends Omit<BulmaClassesProps, 'color'> {
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
 */
export const Radios: React.FC<RadiosProps> = ({
  children,
  className,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    ...props,
  });

  const wrapperClass = classNames('radios', bulmaHelperClasses, className);

  return (
    <div className={wrapperClass} {...rest}>
      {children}
    </div>
  );
};

export default Radios;
