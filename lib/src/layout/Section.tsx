import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

type SectionSize = 'medium' | 'large';

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';

  size?: SectionSize;
  className?: string;
  children?: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  size,
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const sectionClasses = classNames('section', className, bulmaHelperClasses, {
    [`is-${size}`]: size,
  });

  return (
    <section className={sectionClasses} {...rest}>
      {children}
    </section>
  );
};
