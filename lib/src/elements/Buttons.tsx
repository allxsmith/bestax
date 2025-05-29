import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

interface ButtonsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    BulmaClassesProps {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  isCentered?: boolean;
  isRight?: boolean;
  hasAddons?: boolean;
  children: React.ReactNode;
}

export const Buttons: React.FC<ButtonsProps> = ({
  className,
  textColor,
  bgColor,
  isCentered,
  isRight,
  hasAddons,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const buttonsClasses = classNames('buttons', className, bulmaHelperClasses, {
    'is-centered': isCentered,
    'is-right': isRight,
    'has-addons': hasAddons,
  });

  return (
    <div className={buttonsClasses} {...rest}>
      {children}
    </div>
  );
};
