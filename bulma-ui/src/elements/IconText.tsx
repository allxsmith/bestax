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
 * Distinguishes an `IconProps` object from a plain custom node (an inline SVG, a `react-icons`
 * component, …) passed to a slot that accepts either.
 */
function isIconProps(value: IconProps | React.ReactNode): value is IconProps {
  return (
    typeof value === 'object' &&
    value !== null &&
    !React.isValidElement(value) &&
    ('name' in value || 'children' in value)
  );
}

/**
 * Represents an item for the IconText component, containing icon props and optional text.
 */
interface IconTextItem {
  /** Props for the Icon component, or a custom node (an inline SVG, a `react-icons` component, …) rendered in place of a class-based glyph. */
  iconProps: IconProps | React.ReactNode;
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
  /**
   * Text color alias: renders `has-text-<color>`, exactly like `textColor`.
   * Not a filled variant (no `.icon-text.is-<color>` CSS exists). Prefer
   * `textColor`, which takes precedence when both are set; use `bgColor` for
   * a colored surface.
   */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Props for a single Icon component, or a custom node, for single icon mode. */
  iconProps?: IconProps | React.ReactNode; // For single icon
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
  color,
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
    color: textColor ?? color,
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
            {isIconProps(item.iconProps) ? (
              <Icon {...item.iconProps} />
            ) : (
              <Icon>{item.iconProps}</Icon>
            )}
            {item.text && <span>{item.text}</span>}
          </React.Fragment>
        ))
      ) : (
        <>
          {iconProps !== undefined &&
            (isIconProps(iconProps) ? (
              <Icon {...iconProps} />
            ) : (
              <Icon>{iconProps}</Icon>
            ))}
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
