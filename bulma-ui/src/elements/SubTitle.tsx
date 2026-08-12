import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

const validSubTitleSizes = ['1', '2', '3', '4', '5', '6'] as const;
/**
 * Valid size values for the SubTitle component (Bulma subtitle sizes): `'1'`–`'6'` as a string or number (`3` and `'3'` are equivalent).
 */
export type SubTitleSize =
  (typeof validSubTitleSizes)[number] | 1 | 2 | 3 | 4 | 5 | 6;

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
 * @extraProp {boolean} [skeleton] - Applies the `is-skeleton` class to the entire component.
 */
export interface SubTitleProps
  extends
    Omit<
      React.HTMLAttributes<HTMLHeadingElement | HTMLParagraphElement>,
      'color'
    >,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Size of the subtitle (Bulma sizes `1`-`6`, as a string or number). */
  size?: SubTitleSize;
  /** HTML element to render as (h1-h6 or p). */
  as?: SubTitleElement;
  /** Applies the `has-skeleton` class to part of the content. */
  hasSkeleton?: boolean;
  /** Subtitle content. */
  children?: React.ReactNode;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * The `SubTitle` component renders a Bulma-styled subtitle (secondary heading), supporting sizes `1-6` and rendering as any heading or paragraph element (`h1-h6`, `p`).
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
  const element = validSubTitleElements.includes(as) ? as : 'h1';

  // Validate 'size' prop at runtime (numeric sizes normalize to strings)
  const normalized = size == null ? undefined : String(size);
  const validSize =
    normalized && (validSubTitleSizes as readonly string[]).includes(normalized)
      ? (normalized as (typeof validSubTitleSizes)[number])
      : undefined;

  const bulmaClasses = usePrefixedClassNames('subtitle', {
    [`is-${validSize}`]: validSize,
    'has-skeleton': hasSkeleton,
  });

  const subTitleClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
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

export default SubTitle;
