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
  /**
   * The number of pages. Given `total` and no children, `Pagination` renders
   * the whole control itself: Previous, Next and a link for each page it
   * shows, with an ellipsis where it skips some. Given children, it renders
   * those as they are, and `total` and the other page props do nothing.
   */
  total?: number;
  /**
   * The page shown as current, counting from 1, when rendering from `total`.
   * Leave it out and `Pagination` keeps the page itself, starting at 1.
   */
  current?: number;
  /**
   * Called with the page chosen, when rendering from `total`. Choosing the
   * page already current doesn't call it.
   */
  onPageChange?: (page: number) => void;
  /** How many pages to show on each side of the current one, when rendering from `total`. */
  siblingCount?: number;
  /** How many pages to always show at the start and at the end, when rendering from `total`. */
  boundaryCount?: number;
  /** The Previous link's content, when rendering from `total`. */
  previousLabel?: React.ReactNode;
  /** The Next link's content, when rendering from `total`. */
  nextLabel?: React.ReactNode;
  /** Disables every link, when rendering from `total`. */
  disabled?: boolean;
  /**
   * The `href` for a page's link, when rendering from `total`, making each
   * one a real link (`page => '?page=' + page`). Without it the links
   * have no `href`, act as buttons, and Enter or Space chooses a page.
   */
  getPageHref?: (page: number) => string;
  /** Additional CSS classes. */
  className?: string;
  /** Custom pagination content (usually subcomponents). */
  children?: React.ReactNode;
}

/** A page's number, or a run of pages left out. */
type PageItem = number | 'start-gap' | 'end-gap';

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(to - from + 1, 0) }, (_, i) => from + i);
}

/**
 * The pages to show for `current` of `total`: the first and last
 * `boundaries`, `siblings` on each side of the current one, and a gap for
 * each run left out. A gap of a single page shows that page instead, and the
 * window around the current page slides inward near either end, so the row
 * keeps its length as the page moves.
 */
function pageItems(
  total: number,
  current: number,
  siblings: number,
  boundaries: number
): PageItem[] {
  const windowSize = siblings * 2 + 1;
  // Every page fits in the room the boundary pages, the window and two gaps take.
  if (total <= boundaries * 2 + windowSize + 2) return range(1, total);
  const lowest = boundaries + 2;
  const highest = total - boundaries - 1;
  const start = Math.min(
    Math.max(current - siblings, lowest),
    highest - windowSize + 1
  );
  const end = start + windowSize - 1;
  const gap = (from: number, to: number, name: PageItem): PageItem[] =>
    to === from ? [from] : [name];
  return [
    ...range(1, boundaries),
    ...gap(boundaries + 1, start - 1, 'start-gap'),
    ...range(start, end),
    ...gap(end + 1, total - boundaries, 'end-gap'),
    ...range(total - boundaries + 1, total),
  ];
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
  total,
  current,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  disabled,
  getPageHref,
  className,
  children,
  ...props
}) => {
  const [kept, setKept] = React.useState(1);
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

  const fromTotal = total !== undefined && children == null;
  let content: React.ReactNode = children;
  if (fromTotal) {
    const pages = Number.isFinite(total) ? Math.max(Math.floor(total), 0) : 0;
    const page = Math.min(
      Math.max(Math.floor(current ?? kept), 1),
      Math.max(pages, 1)
    );
    const choose = (next: number) => {
      if (next === page) return;
      if (current === undefined) setKept(next);
      onPageChange?.(next);
    };
    /**
     * What a link to `target` is given, beside what it renders. With no
     * `getPageHref` it's a button; a link that's `off` goes nowhere.
     */
    const linkTo = (target: number, off: boolean) => ({
      href: off || !getPageHref ? undefined : getPageHref(target),
      role: getPageHref ? undefined : 'button',
      // A link that's off is disabled too, and the parts drop its clicks.
      onClick: () => choose(target),
      onKeyDown: getPageHref
        ? undefined
        : (e: React.KeyboardEvent<HTMLAnchorElement>) => {
            if (off || (e.key !== 'Enter' && e.key !== ' ')) return;
            e.preventDefault();
            choose(target);
          },
    });
    const atStart = disabled || page <= 1;
    const atEnd = disabled || page >= pages;
    content = (
      <>
        <PaginationPrevious disabled={atStart} {...linkTo(page - 1, atStart)}>
          {previousLabel}
        </PaginationPrevious>
        <PaginationNext disabled={atEnd} {...linkTo(page + 1, atEnd)}>
          {nextLabel}
        </PaginationNext>
        <PaginationList>
          {pageItems(
            pages,
            page,
            Math.max(Math.floor(siblingCount), 0),
            Math.max(Math.floor(boundaryCount), 0)
          ).map(item =>
            typeof item === 'number' ? (
              <PaginationLink
                key={item}
                active={item === page}
                disabled={disabled}
                {...linkTo(item, Boolean(disabled))}
              >
                {item}
              </PaginationLink>
            ) : (
              <PaginationEllipsis key={item} />
            )
          )}
        </PaginationList>
      </>
    );
  }

  return (
    <nav
      className={paginationClasses}
      role="navigation"
      aria-label="pagination"
      {...rest}
    >
      {content}
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
