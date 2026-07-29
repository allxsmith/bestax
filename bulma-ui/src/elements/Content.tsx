import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Content component.
 */
interface ContentProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper (e.g., `'danger'` for `has-text-danger`). */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the content. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color helper (e.g., `'info'` for `has-background-info`). */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Size modifier for the content. */
  size?: 'small' | 'normal' | 'medium' | 'large';
  /** Content to be rendered inside the block. */
  children?: React.ReactNode;
}

// Valid size modifiers for the content class
const validSizes = ['small', 'medium', 'large'] as const;

/**
 * The `Content` component applies Bulma’s typographic styles to its children, enhancing the appearance of HTML elements like paragraphs, headings, lists, and tables.
 *
 * @function
 * @param {ContentProps} props - Props for the Content component.
 * @returns {JSX.Element} The rendered content block.
 * @see {@link https://bulma.io/documentation/elements/content/ | Bulma Content documentation}
 */
export const Content: React.FC<ContentProps> = ({
  className,
  textColor,
  bgColor,
  size,
  children,
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

  const bulmaClasses = usePrefixedClassNames('content', {
    [`is-${size}`]: size && size !== 'normal' && validSizes.includes(size),
  });

  const contentClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
  );

  return (
    <div className={contentClasses} {...rest}>
      {children}
    </div>
  );
};

export default Content;
