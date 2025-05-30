import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

const validSubTitleSizes = ['1', '2', '3', '4', '5', '6'] as const;
export type SubTitleSize = (typeof validSubTitleSizes)[number];

const validSubTitleElements = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
] as const;
export type SubTitleElement = (typeof validSubTitleElements)[number];

/**
 * SubTitle component for rendering a styled Bulma subtitle.
 *
 * Supports sizes and rendering as different HTML elements.
 */
export interface SubTitleProps
  extends Omit<
      React.HTMLAttributes<HTMLHeadingElement | HTMLParagraphElement>,
      'color'
    >,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  className?: string;
  size?: SubTitleSize;
  as?: SubTitleElement;
  children?: React.ReactNode;
}

export const SubTitle: React.FC<SubTitleProps> = ({
  className,
  size,
  as = 'h1',
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  // Validate 'as' prop at runtime
  const element = validSubTitleElements.includes(as) ? as : 'h1';

  // Validate 'size' prop at runtime
  const validSize =
    size && validSubTitleSizes.includes(size) ? size : undefined;

  const subTitleClasses = classNames(
    'subtitle',
    className,
    bulmaHelperClasses,
    {
      [`is-${validSize}`]: validSize,
    }
  );

  // Determine the tag based on 'element' and 'validSize'
  const Tag: React.ElementType =
    element === 'p' ? 'p' : validSize ? `h${validSize}` : element;

  return (
    <Tag className={subTitleClasses} {...rest}>
      {children}
    </Tag>
  );
};
