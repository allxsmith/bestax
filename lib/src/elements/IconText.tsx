import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { Icon, IconProps } from './Icon';

interface IconTextItem {
  iconProps: IconProps;
  text?: string;
}

interface IconTextProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    BulmaClassesProps {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  iconProps?: IconProps; // For single icon
  children?: React.ReactNode; // Text for single icon
  items?: IconTextItem[]; // For multiple icons
}

export const IconText: React.FC<IconTextProps> = ({
  className,
  textColor,
  bgColor,
  iconProps,
  children,
  items,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const iconTextClasses = classNames(
    'icon-text',
    bulmaHelperClasses,
    className
  );

  return (
    <span className={iconTextClasses} {...rest}>
      {items ? (
        items.map((item, index) => (
          <React.Fragment key={index}>
            <Icon {...item.iconProps} />
            {item.text && <span>{item.text}</span>}
          </React.Fragment>
        ))
      ) : (
        <>
          {iconProps && <Icon {...iconProps} />}
          {children && <span>{children}</span>}
        </>
      )}
    </span>
  );
};
