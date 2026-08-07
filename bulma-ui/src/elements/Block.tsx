import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Block component.
 */
export interface BlockProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /**
   * Text color alias: renders `has-text-<color>`, exactly like `textColor`.
   * Not a filled variant (no `.block.is-<color>` CSS exists). Prefer
   * `textColor`, which takes precedence when both are set; use `bgColor` for
   * a colored surface.
   */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Content to render inside the block. */
  children?: React.ReactNode;
}

/**
 * The `Block` component renders a simple container with Bulma's `.block` class, adding vertical margin between sections of content.
 *
 * @function
 * @param {BlockProps} props - Props for the Block component.
 * @returns {JSX.Element} The rendered block element.
 * @see {@link https://bulma.io/documentation/elements/block/ | Bulma Block documentation}
 */
export const Block: React.FC<BlockProps> = ({
  className,
  textColor,
  color,
  bgColor,
  children,
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

  const bulmaClasses = usePrefixedClassNames('block');
  const blockClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <div className={blockClasses} {...rest}>
      {children}
    </div>
  );
};
