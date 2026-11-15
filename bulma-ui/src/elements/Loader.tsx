import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Loader component.
 *
 * There is no color prop, and the text and background color helpers aren't
 * offered. The ring is drawn in the text color around the loader, so it shows
 * on whatever the loader sits on: the page, a dark hero, a colored
 * notification. Bulma draws it in its border gray, which hardly shows on the
 * page, and bestax's stylesheets change that, `extras.css` included, so a
 * `--bulma-border` set on the page or an ancestor no longer reaches it. To
 * recolor one, put it in an element with that text color, or set `color` on
 * the loader itself. For a colored spinner over a region, use `Loading`.
 *
 * @extraProp {React.Ref<HTMLSpanElement>} [ref] - Ref forwarded to the loader element.
 */
export interface LoaderProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'color' | 'children'>,
    Omit<
      BulmaClassesProps,
      'color' | 'colorShade' | 'backgroundColor' | 'backgroundColorShade'
    > {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * Accessible name of the progress indicator. Name what is loading
   * (`"Saving row"`) when more than one loader can be on screen at once.
   */
  ariaLabel?: string;
}

/**
 * The `Loader` component renders Bulma's `.loader`, a small spinning ring for inline loading states.
 *
 * The ring is `1em` square, so `textSize` scales it. It is exposed as an
 * indeterminate `progressbar` named by `ariaLabel`, and it stops spinning
 * under `prefers-reduced-motion: reduce` while staying drawn. In forced
 * colors its two open sides take the page's color, so it stays open.
 *
 * @function
 * @param {LoaderProps} props - Props for the Loader component.
 * @param {React.Ref<HTMLSpanElement>} ref - Forwarded ref to the loader element.
 * @returns {JSX.Element} The rendered loader element.
 *
 * @example
 * <Loader />
 *
 * @example
 * <Loader textSize="3" ariaLabel="Saving" />
 */
export const Loader = forwardRef<HTMLSpanElement, LoaderProps>(
  ({ className, ariaLabel = 'Loading', ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const loaderClass = usePrefixedClassNames('loader');

    // role="progressbar", not role="status": a status region mounted together
    // with its text is not reliably announced, so the loader claims only what
    // it can deliver, a named indicator found by reading the page. No
    // aria-valuenow, because the progress is indeterminate.
    return (
      <span
        ref={ref}
        className={classNames(loaderClass, bulmaHelperClasses, className)}
        role="progressbar"
        aria-label={ariaLabel}
        {...rest}
      />
    );
  }
);

Loader.displayName = 'Loader';
