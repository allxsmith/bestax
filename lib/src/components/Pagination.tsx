import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Pagination component.
 *
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'|'black'|'dark'|'light'|'white'} [color] - Bulma color for the pagination.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color for the pagination.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color for the pagination.
 * @property {'small'|'medium'|'large'} [size] - Size modifier for the pagination.
 * @property {'centered'|'right'} [align] - Alignment for the pagination.
 * @property {boolean} [rounded] - Renders pagination with rounded corners.
 * @property {number} [total] - Total number of pages.
 * @property {number} [current] - Current page.
 * @property {(page: number) => void} [onPageChange] - Page change callback.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Custom pagination content.
 */
export interface PaginationProps
  extends React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
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
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  size?: 'small' | 'medium' | 'large';
  align?: 'centered' | 'right';
  rounded?: boolean;
  total?: number;
  current?: number;
  onPageChange?: (page: number) => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Props for PaginationPrevious and PaginationNext components.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {boolean} [disabled] - Whether previous/next is disabled.
 * @property {React.ReactNode} [children] - Button content.
 */
export interface PaginationPreviousNextProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Bulma Pagination previous button.
 */
export const PaginationPrevious: React.FC<PaginationPreviousNextProps> = ({
  className,
  disabled,
  children,
  ...props
}) => (
  <a
    className={classNames('pagination-previous', className, {
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
 * Bulma Pagination next button.
 */
export const PaginationNext: React.FC<PaginationPreviousNextProps> = ({
  className,
  disabled,
  children,
  ...props
}) => (
  <a
    className={classNames('pagination-next', className, {
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
 * Bulma Pagination navigation component.
 *
 * @function
 * @param {PaginationProps} props - Props for the Pagination component.
 * @returns {JSX.Element} The rendered pagination.
 * @see {@link https://bulma.io/documentation/components/pagination/ | Bulma Pagination documentation}
 */
export const Pagination: React.FC<PaginationProps> & {
  Link: typeof PaginationLink;
  List: typeof PaginationList;
  Ellipsis: typeof PaginationEllipsis;
  Previous: typeof PaginationPrevious;
  Next: typeof PaginationNext;
} = ({
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
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });
  const paginationClasses = classNames(
    'pagination',
    bulmaHelperClasses,
    className,
    {
      [`is-${color}`]: color,
      [`is-${size}`]: size,
      [`is-${align}`]: align,
      'is-rounded': rounded,
    }
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
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color for the list.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color modifier for the list.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color for the list.
 * @property {React.ReactNode} [children] - List items.
 */
export interface PaginationListProps
  extends React.HTMLAttributes<HTMLUListElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Bulma Pagination list container.
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
      className={classNames('pagination-list', bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </ul>
  );
};

/**
 * Props for the PaginationLink component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color modifier.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {boolean} [active] - Whether the link is for the current page.
 * @property {boolean} [disabled] - Whether the link is disabled.
 * @property {React.ReactNode} [children] - Link content.
 */
export interface PaginationLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  active?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Bulma Pagination link (page number).
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
          'pagination-link',
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
 * Bulma Pagination ellipsis element.
 *
 * @param props - Standard li props.
 * @returns {JSX.Element} The rendered ellipsis.
 */
export const PaginationEllipsis: React.FC<
  React.LiHTMLAttributes<HTMLLIElement>
> = props => (
  <li>
    <span className="pagination-ellipsis" {...props}>
      &hellip;
    </span>
  </li>
);

Pagination.Link = PaginationLink;
Pagination.List = PaginationList;
Pagination.Ellipsis = PaginationEllipsis;
Pagination.Previous = PaginationPrevious;
Pagination.Next = PaginationNext;

export default Pagination;
