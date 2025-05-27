import React from 'react';
import classNames from 'classnames';

export interface BlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional custom class name */
  className?: string;
}

export const Block: React.FC<BlockProps> = ({
  className,
  children,
  ...props
}) => {
  const classes = classNames('block', className);

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};
