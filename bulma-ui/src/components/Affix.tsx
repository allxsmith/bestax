import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { Portal } from '../helpers/portal';
import { useIsHydrated } from '../helpers/useIsHydrated';

/** A corner of the viewport: the same four values as `BadgePosition`. */
export type AffixPosition =
  'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/**
 * Props for the Affix component. The helper props, the other attributes and
 * the `ref` land on its `<div>`.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the `<div>`, wherever it renders.
 */
export interface AffixProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** What stays in the corner. */
  children?: React.ReactNode;
  /**
   * The corner of the viewport it's fixed to. Physical, as Badge's and
   * Toast's are: `'bottom-right'` stays on the right in right-to-left text.
   * Its distance from the edges is `--bulma-affix-offset-vertical` and
   * `--bulma-affix-offset-horizontal` plus the device's safe-area inset; a
   * margin from the spacing helpers (`mb`, `mr`, …) adds to it.
   * @defaultValue 'bottom-right'
   */
  position?: AffixPosition;
  /**
   * Renders it into another container, for a page where an ancestor's
   * `transform`, `filter` or `contain` would capture `position: fixed`.
   * `true` portals to the `portalContainer` a `ConfigProvider` sets,
   * `document.body` by default; a string is used as a
   * `document.querySelector` selector; an element is used directly. Renders
   * in place on the server and while hydrating, moving into the portal once
   * the client takes over, so hydration matches. Portaled, it comes last in
   * the reading and Tab order of that container.
   * @defaultValue false
   */
  portal?: boolean | string | HTMLElement;
}

/**
 * The `Affix` component keeps its content fixed to a corner of the viewport while the page scrolls under it.
 *
 * It's a `<div>` with no role, so what's inside keeps its own. It sits
 * `--bulma-affix-offset-vertical` and `--bulma-affix-offset-horizontal`
 * from its corner's edges, plus the device's safe-area inset, and stacks at
 * `--bulma-affix-z-index`, over the page and under Bulma's modal, the
 * Sidebar, Tooltip and Toast. It's as wide as its content and never wider
 * than the viewport less its offsets. Its place in the reading and Tab
 * order is its place in the DOM, whatever corner it shows in.
 *
 * @function
 * @param {AffixProps} props - Props for the Affix component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the `<div>`.
 * @returns The `<div>`, in place or in its portal.
 *
 * @example
 * <Affix position="bottom-left">
 *   <Button color="primary">Feedback</Button>
 * </Affix>
 */
export const Affix = forwardRef<HTMLDivElement, AffixProps>(
  (
    {
      position = 'bottom-right',
      portal = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const affixClasses = usePrefixedClassNames('affix', {
      [`is-${position}`]: true,
    });
    // A portal has no server-rendered counterpart, so it renders in place on
    // the server and while hydrating, and moves once the client takes over,
    // as Modal does. The move remounts the `<div>`.
    const isHydrated = useIsHydrated();

    return (
      <Portal
        disabled={!portal || !isHydrated}
        container={typeof portal === 'boolean' ? undefined : portal}
      >
        <div
          ref={ref}
          className={classNames(affixClasses, bulmaHelperClasses, className)}
          {...rest}
        >
          {children}
        </div>
      </Portal>
    );
  }
);

Affix.displayName = 'Affix';

export default Affix;
