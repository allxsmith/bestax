import React from 'react';

// Define the props interface
interface BoxProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
  margin?: string;
  backgroundColor?: string;
  hasShadow?: boolean;
}

// Box component
const Box: React.FC<BoxProps> = ({
  children,
  className = '',
  padding = 'p-5',
  margin = 'm-4',
  backgroundColor = 'has-background-white',
  hasShadow = true,
}) => {
  // Combine classes dynamically
  const boxClasses = [
    'box',
    padding,
    margin,
    backgroundColor,
    hasShadow ? 'has-shadow' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={boxClasses}>{children}</div>;
};

export default Box;
