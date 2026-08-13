import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

const validTitleSizes = ['1', '2', '3', '4', '5', '6'] as const;
/**
 * Valid size values for the Title component (Bulma title sizes): `'1'`–`'6'` as a string or number (`3` and `'3'` are equivalent).
 */
export type TitleSize =
  '1' | '2' | '3' | '4' | '5' | '6' | 1 | 2 | 3 | 4 | 5 | 6;

const validTitleElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'] as const;
/**
 * Valid HTML elements for the Title component.
 */
export type TitleElement = (typeof validTitleElements)[number];

/**
 * Props for the Title component.
 * @extraProp {boolean} [skeleton] - Applies the `is-skeleton` class to the entire component.
 */
export interface TitleProps
  extends
    Omit<
      React.HTMLAttributes<HTMLHeadingElement | HTMLParagraphElement>,
      'color'
    >,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Size of the title (Bulma sizes `1`-`6`, as a string or number). */
  size?: TitleSize;
  /** Adds margin below the title. */
  isSpaced?: boolean;
  /** HTML element to render as (h1-h6 or p). */
  as?: TitleElement;
  /** Applies the `has-skeleton` class to part of the content. */
  hasSkeleton?: boolean;
  /** Title content. */
  children?: React.ReactNode;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * The `Title` component renders a Bulma-styled title (heading), supporting sizes `1`-`6`, spacing, and rendering as any heading or paragraph element (`h1`-`h6`, `p`).
 *
 * @function
 * @param {TitleProps} props - Props for the Title component.
 * @returns {JSX.Element} The rendered title element.
 * @see {@link https://bulma.io/documentation/elements/title/ | Bulma Title documentation}
 */
export const Title: React.FC<TitleProps> = ({
  className,
  size,
  isSpaced,
  as = 'h1',
  hasSkeleton,
  textColor,
  bgColor,
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

  // Validate 'as' prop at runtime
  const element = validTitleElements.includes(as) ? as : 'h1';

  // Validate 'size' prop at runtime (numeric sizes normalize to strings)
  const normalized = size == null ? undefined : String(size);
  const validSize =
    normalized && (validTitleSizes as readonly string[]).includes(normalized)
      ? (normalized as (typeof validTitleSizes)[number])
      : undefined;

  const bulmaClasses = usePrefixedClassNames('title', {
    [`is-${validSize}`]: validSize,
    'is-spaced': isSpaced,
    'has-skeleton': hasSkeleton,
  });

  const titleClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  // Determine the tag based on 'element' and 'validSize'
  const Tag: React.ElementType =
    element === 'p' ? 'p' : validSize ? `h${validSize}` : element;

  return (
    <Tag className={titleClasses} {...rest}>
      {children}
    </Tag>
  );
};

export default Title;
