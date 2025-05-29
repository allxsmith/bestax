import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

interface DeleteProps
  extends React.HTMLAttributes<HTMLButtonElement>,
    BulmaClassesProps {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  size?: 'small' | 'medium' | 'large';
  ariaLabel?: string;
  disabled?: boolean;
}

export const Delete: React.FC<DeleteProps> = ({
  className,
  textColor,
  bgColor,
  onClick,
  size,
  ariaLabel = 'Close',
  disabled = false,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const classes = classNames(
    'delete',
    {
      [`is-${size}`]: size,
      'is-disabled': disabled,
    },
    bulmaHelperClasses,
    className
  );

  return (
    <button
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      type="button"
      {...rest}
    />
  );
};
