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
 */
export interface BreadcrumbProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Alignment of the breadcrumb (`is-centered`, `is-right`). */
  alignment?: BreadcrumbAlignment;
  /** Type of separator between breadcrumb items. */
  separator?: BreadcrumbSeparator;
  /** Breadcrumb size. */
  size?: BreadcrumbSize;
  /** Breadcrumb items (`<li>`s with `<a>` or `<span>`). */
  children?: React.ReactNode;
}

/**
 * The `Breadcrumb` component renders a Bulma-styled breadcrumb navigation.
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
