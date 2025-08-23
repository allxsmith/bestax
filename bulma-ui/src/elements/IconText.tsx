import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { Icon, IconProps } from './Icon';

/**
 * Represents an item for the IconText component, containing icon props and optional text.
 *
 * @property {IconProps} iconProps - Props for the Icon component.
 * @property {string} [text] - Optional text to display next to the icon.
 */
interface IconTextItem {
  iconProps: IconProps;
  text?: string;
}

/**
 * Props for the IconText component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [color] - Bulma color modifier for the icon text.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {IconProps} [iconProps] - Props for a single Icon component.
 * @property {React.ReactNode} [children] - Text for a single icon.
 * @property {IconTextItem[]} [items] - Array of icon/text pairs for multiple icons.
 */
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

/**
 * IconText component for rendering one or more icons with optional text, styled with Bulma.
 *
 * Supports Bulma helper classes for styling, color, and layout. Can render a single icon with text or multiple icon/text pairs.
 *
 * @function
 * @param {IconTextProps} props - Props for the IconText component.
 * @returns {JSX.Element} The rendered icon text element.
 * @see {@link https://bulma.io/documentation/elements/icon/#icon-text | Bulma IconText documentation}
 */
export const IconText: React.FC<IconTextProps> = ({
  className,
  textColor,
  bgColor,
  iconProps,
  children,
  items,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const bulmaClasses = usePrefixedClassNames('icon-text');
  const iconTextClasses = classNames(
    bulmaClasses,
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
