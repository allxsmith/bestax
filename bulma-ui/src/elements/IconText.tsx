import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { Icon, IconProps } from './Icon';

/**
 * Represents an item for the IconText component, containing icon props and optional text.
 */
interface IconTextItem {
  /** Props for the Icon component. */
  iconProps: IconProps;
  /** Optional text to display next to the icon. */
  text?: string;
}

/**
 * Props for the IconText component.
 */
interface IconTextProps
  extends React.HTMLAttributes<HTMLSpanElement>, BulmaClassesProps {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the icon text group. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Props for a single Icon component (for single icon mode). */
  iconProps?: IconProps; // For single icon
  /** Text for a single icon (for single icon mode). */
  children?: React.ReactNode; // Text for single icon
  /** Array of icon/text pairs (for multiple icons mode). */
  items?: IconTextItem[]; // For multiple icons
}

/**
 * The `IconText` component provides a Bulma-styled horizontal arrangement of one or more `Icon` components and optional text.
 *
 * @function
 * @param {IconTextProps} props - Props for the IconText component.
 * @returns {JSX.Element} The rendered icon text element.
 * @see {@link https://bulma.io/documentation/elements/icon/#icon-text | Bulma IconText documentation}
 */
const IconTextComponent: React.FC<IconTextProps> = ({
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

export const IconText = withSubComponents(
  IconTextComponent,
  { Icon },
  'IconText'
);
