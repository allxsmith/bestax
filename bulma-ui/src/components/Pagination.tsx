import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { warnDeprecatedColorProp } from '../helpers/colorDeprecations';

/**
 * Props for the Pagination component.
 */
export interface PaginationProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * Color modifier for the pagination (renders `is-<color>`).
   *
   * Bulma ships no pagination color CSS, so this prop has never had a visual
   * effect for any value. Passing it logs a console warning in development.
   * Use `textColor` / `bgColor` instead.
   * @deprecated No `.pagination.is-<color>` CSS exists; the prop renders
   * unstyled and will be removed in the next major version.
   */
  color?:
    | 'primary'
    | 'link'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'black'
    | 'dark'
    | 'light'
    | 'white';
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Size modifier for the pagination. */
  size?: 'small' | 'medium' | 'large';
  /** Alignment for the pagination. */
  align?: 'centered' | 'right';
  /** Renders pagination with rounded corners. */
  rounded?: boolean;
  /** Total number of pages (for custom implementations). */
  total?: number;
  /** Current page (for controlled implementations). */
  current?: number;
  /** Callback when a page is selected. */
  onPageChange?: (page: number) => void;
  /** Additional CSS classes. */
  className?: string;
  /** Custom pagination content (usually subcomponents). */
  children?: React.ReactNode;
}

/**
 * Props for PaginationPrevious and PaginationNext components.
 */
export interface PaginationPreviousNextProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Additional CSS classes. */
  className?: string;
  /** Whether previous/next is disabled. */
  disabled?: boolean;
  /** Button content. */
  children?: React.ReactNode;
}

/**
 * "Previous" navigation button.
 *
 * @function
 * @param {PaginationPreviousNextProps} props - Props for the PaginationPrevious component.
 * @returns {JSX.Element} The rendered previous button.
 */
export const PaginationPrevious: React.FC<PaginationPreviousNextProps> = ({
  className,
  disabled,
  children,
  ...props
}) => (
  <a
    className={classNames(
      usePrefixedClassNames('pagination-previous'),
      className,
      {
        'is-disabled': disabled,
      }
    )}
    aria-disabled={disabled}
    tabIndex={disabled ? -1 : 0}
    {...props}
    onClick={
      disabled
        ? e => {
            e.preventDefault();
            e.stopPropagation();
          }
        : props.onClick
    }
  >
    {children}
  </a>
);

/**
 * "Next" navigation button.
 *
 * @function
 * @param {PaginationPreviousNextProps} props - Props for the PaginationNext component.
 * @returns {JSX.Element} The rendered next button.
 */
export const PaginationNext: React.FC<PaginationPreviousNextProps> = ({
  className,
  disabled,
  children,
  ...props
}) => (
  <a
    className={classNames(usePrefixedClassNames('pagination-next'), className, {
      'is-disabled': disabled,
    })}
    aria-disabled={disabled}
    tabIndex={disabled ? -1 : 0}
    {...props}
    onClick={
      disabled
        ? e => {
            e.preventDefault();
            e.stopPropagation();
          }
        : props.onClick
    }
  >
    {children}
  </a>
);

/**
 * The `Pagination` component provides a flexible, composable Bulma pagination navigation for your Bulma React UI.
 *
 * @function
 * @param {PaginationProps} props - Props for the Pagination component.
 * @returns {JSX.Element} The rendered pagination.
 * @see {@link https://bulma.io/documentation/components/pagination/ | Bulma Pagination documentation}
 */
const PaginationComponent: React.FC<PaginationProps> = ({
  color,
  textColor,
  bgColor,
  size,
  align,
  rounded,
  className,
  children,
  ...props
}) => {
  warnDeprecatedColorProp(
    'Pagination',
    color,
    'Use the textColor / bgColor helper props instead.'
  );

  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  // Generate Bulma classes with prefix
  const bulmaClasses = usePrefixedClassNames('pagination', {
    [`is-${color}`]: color,
    [`is-${size}`]: size,
    [`is-${align}`]: align,
    'is-rounded': rounded,
  });

  const paginationClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
  );

  return (
    <nav
      className={paginationClasses}
      role="navigation"
      aria-label="pagination"
      {...rest}
    >
      {children}
    </nav>
  );
};

/**
 * Props for the PaginationList component.
 */
export interface PaginationListProps
  extends
    React.HTMLAttributes<HTMLUListElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes. */
  className?: string;
  /** Text color for the list. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the list. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color for the list. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** List items. */
  children?: React.ReactNode;
}

/**
 * Container for page links and ellipsis.
 *
 * @function
 * @param {PaginationListProps} props - Props for the PaginationList component.
 * @returns {JSX.Element} The rendered pagination list.
 */
export const PaginationList: React.FC<PaginationListProps> = ({
  className,
  textColor,
  bgColor,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });
  return (
    <ul
      className={classNames(
        usePrefixedClassNames('pagination-list'),
        bulmaHelperClasses,
        className
      )}
      {...rest}
    >
      {children}
    </ul>
  );
};

/**
 * Props for the PaginationLink component.
 */
export interface PaginationLinkProps
  extends
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes. */
  className?: string;
  /** Bulma color modifier. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Whether the link is for the current page. */
  active?: boolean;
  /** Whether the link is disabled. */
  disabled?: boolean;
  /** Link content. */
  children?: React.ReactNode;
}

/**
 * Page number or navigation link.
 *
 * @function
 * @param {PaginationLinkProps} props - Props for the PaginationLink component.
 * @returns {JSX.Element} The rendered pagination link.
 */
export const PaginationLink: React.FC<PaginationLinkProps> = ({
  className,
  textColor,
  bgColor,
  active,
  disabled,
  onClick,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <li>
      <a
        className={classNames(
          usePrefixedClassNames('pagination-link'),
          bulmaHelperClasses,
          className,
          {
            'is-current': active,
            'is-disabled': disabled,
          }
        )}
        aria-current={active ? 'page' : undefined}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        {...rest}
      >
        {children}
      </a>
    </li>
  );
};

/**
 * Ellipsis separator.
 *
 * @function
 * @param {React.LiHTMLAttributes<HTMLLIElement>} props - Standard li props.
 * @returns {JSX.Element} The rendered ellipsis.
 */
export const PaginationEllipsis: React.FC<
  React.LiHTMLAttributes<HTMLLIElement>
> = props => (
  <li>
    <span className={usePrefixedClassNames('pagination-ellipsis')} {...props}>
      &hellip;
    </span>
  </li>
);

export const Pagination = withSubComponents(
  PaginationComponent,
  {
    Link: PaginationLink,
    List: PaginationList,
    Ellipsis: PaginationEllipsis,
    Previous: PaginationPrevious,
    Next: PaginationNext,
  },
  'Pagination'
);

export default Pagination;
