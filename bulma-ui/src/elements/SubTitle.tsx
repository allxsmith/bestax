import React from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

const validSubTitleSizes = ['1', '2', '3', '4', '5', '6'] as const;
/**
 * Valid size values for the SubTitle component (Bulma subtitle sizes).
 */
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
/**
 * Valid HTML elements for the SubTitle component.
 */
export type SubTitleElement = (typeof validSubTitleElements)[number];

/**
 * Props for the SubTitle component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {SubTitleSize} [size] - Size of the subtitle (1-6).
 * @property {SubTitleElement} [as='h1'] - HTML element to render as (h1-h6 or p).
 * @property {boolean} [hasSkeleton] - Adds the has-skeleton CSS class.
 * @property {React.ReactNode} [children] - Subtitle content.
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
  hasSkeleton?: boolean;
  children?: React.ReactNode;
}

/**
 * SubTitle component for rendering a styled Bulma subtitle.
 *
 * Supports Bulma subtitle sizes and rendering as different HTML elements (h1-h6, p).
 *
 * @function
 * @param {SubTitleProps} props - Props for the SubTitle component.
 * @returns {JSX.Element} The rendered subtitle element.
 * @see {@link https://bulma.io/documentation/elements/title/#subtitle | Bulma Subtitle documentation}
 */
export const SubTitle: React.FC<SubTitleProps> = ({
  className,
  size,
  as = 'h1',
  hasSkeleton,
  children,
  ...props
}) => {
  const { classPrefix } = useConfig();

  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  // Validate 'as' prop at runtime
  const element = validSubTitleElements.includes(as) ? as : 'h1';

  // Validate 'size' prop at runtime
  const validSize =
    size && validSubTitleSizes.includes(size) ? size : undefined;

  const mainClass = classPrefix ? `${classPrefix}subtitle` : 'subtitle';
  const subTitleClasses = classNames(mainClass, className, bulmaHelperClasses, {
    [`is-${validSize}`]: validSize,
    'has-skeleton': hasSkeleton,
  });

  // Determine the tag based on 'element' and 'validSize'
  const Tag: React.ElementType =
    element === 'p' ? 'p' : validSize ? `h${validSize}` : element;

  return (
    <Tag className={subTitleClasses} {...rest}>
      {children}
    </Tag>
  );
};

export default SubTitle;
