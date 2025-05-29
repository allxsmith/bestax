import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

export interface IconProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    BulmaClassesProps {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  name: string; // e.g., 'fas fa-star' for Font Awesome
  size?: 'small' | 'medium' | 'large';
  ariaLabel?: string;
}

export const Icon: React.FC<IconProps> = ({
  className,
  textColor,
  bgColor,
  name,
  size,
  ariaLabel = 'icon',
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const iconContainerClasses = classNames(
    'icon',
    {
      [`is-${size}`]: size,
    },
    bulmaHelperClasses,
    className
  );

  return (
    <span className={iconContainerClasses} aria-label={ariaLabel} {...rest}>
      <i className={name} />
    </span>
  );
};
