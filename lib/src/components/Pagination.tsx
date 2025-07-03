import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

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

export interface PaginationPreviousNextProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

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

export interface PaginationListProps
  extends React.HTMLAttributes<HTMLUListElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

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
