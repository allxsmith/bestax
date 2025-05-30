import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

const validTitleSizes = ['1', '2', '3', '4', '5', '6'] as const;
export type TitleSize = (typeof validTitleSizes)[number];

const validTitleElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'] as const;
export type TitleElement = (typeof validTitleElements)[number];

/**
 * Title component for rendering a styled Bulma title.
 *
 * Supports sizes, spacing, and rendering as different HTML elements.
 */
export interface TitleProps
  extends Omit<
      React.HTMLAttributes<HTMLHeadingElement | HTMLParagraphElement>,
      'color'
    >,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  className?: string;
  size?: TitleSize;
  isSpaced?: boolean;
  as?: TitleElement;
  children?: React.ReactNode;
}

export const Title: React.FC<TitleProps> = ({
  className,
  size,
  isSpaced,
  as = 'h1',
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  // Validate 'as' prop at runtime
  const element = validTitleElements.includes(as) ? as : 'h1';

  // Validate 'size' prop at runtime
  const validSize = size && validTitleSizes.includes(size) ? size : undefined;

  const titleClasses = classNames('title', className, bulmaHelperClasses, {
    [`is-${validSize}`]: validSize,
    'is-spaced': isSpaced,
  });

  // Determine the tag based on 'element' and 'validSize'
  const Tag: React.ElementType =
    element === 'p' ? 'p' : validSize ? `h${validSize}` : element;

  return (
    <Tag className={titleClasses} {...rest}>
      {children}
    </Tag>
  );
};
