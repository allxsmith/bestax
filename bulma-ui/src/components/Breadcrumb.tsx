import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

const validBreadcrumbAlignments = ['centered', 'right'] as const;
/**
 * Valid alignment values for the Breadcrumb component.
 */
export type BreadcrumbAlignment = (typeof validBreadcrumbAlignments)[number];

const validBreadcrumbSeparators = [
  'arrow',
  'bullet',
  'dot',
  'succeeds',
] as const;
/**
 * Valid separator values for the Breadcrumb component.
 */
export type BreadcrumbSeparator = (typeof validBreadcrumbSeparators)[number];

const validBreadcrumbSizes = ['small', 'medium', 'large'] as const;
/**
 * Valid size values for the Breadcrumb component.
 */
export type BreadcrumbSize = (typeof validBreadcrumbSizes)[number];

/**
 * Props for the Breadcrumb component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {BreadcrumbAlignment} [alignment] - Alignment modifier for the breadcrumb.
 * @property {BreadcrumbSeparator} [separator] - Separator style for the breadcrumb.
 * @property {BreadcrumbSize} [size] - Size modifier for the breadcrumb.
 * @property {React.ReactNode} [children] - Breadcrumb items (e.g., "a" or "span" html elements).
 */
export interface BreadcrumbProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  className?: string;
  alignment?: BreadcrumbAlignment;
  separator?: BreadcrumbSeparator;
  size?: BreadcrumbSize;
  children?: React.ReactNode;
}

/**
 * Breadcrumb component for rendering a styled Bulma breadcrumb navigation.
 *
 * Supports alignment, separator styles, and sizes.
 *
 * @function
 * @param {BreadcrumbProps} props - Props for the Breadcrumb component.
 * @returns {JSX.Element} The rendered breadcrumb element.
 * @see {@link https://bulma.io/documentation/components/breadcrumb/ | Bulma Breadcrumb documentation}
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  className,
  alignment,
  separator,
  size,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  // Generate Bulma classes with prefix
  const bulmaClasses = usePrefixedClassNames('breadcrumb', {
    [`is-${alignment}`]:
      alignment && validBreadcrumbAlignments.includes(alignment),
    [`has-${separator}-separator`]:
      separator && validBreadcrumbSeparators.includes(separator),
    [`is-${size}`]: size && validBreadcrumbSizes.includes(size),
  });

  // Combine prefixed Bulma classes with unprefixed user className and prefixed helper classes
  const breadcrumbClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
  );

  return (
    <nav className={breadcrumbClasses} aria-label="breadcrumbs" {...rest}>
      <ul>{children}</ul>
    </nav>
  );
};
