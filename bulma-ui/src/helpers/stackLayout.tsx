// INTERNAL: only `LayoutElement` is exported from src/index.ts.
//
// The element Stack, Group, Center and Flex share. Each is a `.stack`, which
// `scss/layout/_stack.scss` makes a flex container, with a modifier class
// for its own layout, so the helper props reach it as they reach any flex
// container, with no `display` prop.

import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from './classNames';
import {
  useBulmaClasses,
  type BulmaClassesProps,
  type validColors,
  type validFlexDirections,
} from './useBulmaClasses';

/**
 * The elements Stack, Group, Center and Flex can render as: Container's
 * landmarks and sections, a list, a form or a fieldset.
 */
export type LayoutElement =
  | 'div'
  | 'main'
  | 'section'
  | 'article'
  | 'aside'
  | 'header'
  | 'footer'
  | 'nav'
  | 'ul'
  | 'ol'
  | 'form'
  | 'fieldset';

/**
 * What Stack, Group, Center and Flex take in common. The helper props, the
 * other attributes and the `ref` land on the root.
 */
export interface LayoutOwnProps extends Omit<
  BulmaClassesProps,
  'color' | 'backgroundColor' | 'flexDirection'
> {
  /**
   * Not accepted. `color` here would be the deprecated presentational HTML
   * attribute. Use `textColor`.
   * @internal
   */
  color?: never;
  /**
   * Not accepted under this name. Use `bgColor`.
   * @internal
   */
  backgroundColor?: never;
  /** Additional CSS classes. */
  className?: string;
  /** What it lays out, with `gap` between and their own Bulma block margins zeroed. */
  children?: React.ReactNode;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/** The props `StackLayout` reads, from whichever of the four renders it. */
export interface StackLayoutProps
  extends LayoutOwnProps, Omit<React.HTMLAttributes<HTMLElement>, 'color'> {
  /** The element to render. */
  as?: LayoutElement;
  /** Flex's direction. The other three pass `undefined`, so they never reorder. */
  flexDirection?: (typeof validFlexDirections)[number];
  /** The modifier classes beside `stack`, as `usePrefixedClassNames` takes them. */
  modifiers?: Record<string, boolean | undefined>;
}

/**
 * The `.stack` element behind Stack, Group, Center and Flex.
 *
 * With `as="ul"` or `as="ol"` it renders `role="list"`, which Safari needs:
 * WebKit stops exposing a list as one once its markers are hidden, and
 * Bulma's reset hides a `<ul>`'s. Menu.List restates it for the same reason.
 */
export const StackLayout = forwardRef<HTMLElement, StackLayoutProps>(
  function StackLayout(
    {
      as = 'div',
      className,
      textColor,
      bgColor,
      modifiers,
      children,
      ...props
    },
    ref
  ) {
    // The partial makes the element a flex container, so the container
    // helpers (alignItems and the rest) apply without a `display` prop.
    const { bulmaHelperClasses, rest } = useBulmaClasses(
      { color: textColor, backgroundColor: bgColor, ...props },
      { flexContainer: true }
    );
    const stackClasses = usePrefixedClassNames('stack', modifiers);
    const Component = as as React.ElementType;
    const isList = as === 'ul' || as === 'ol';

    return (
      <Component
        ref={ref}
        className={classNames(stackClasses, bulmaHelperClasses, className)}
        {...rest}
        // After the spread, reading through it, so a spread carrying
        // `role: undefined` can't erase the list's role. A role you pass wins.
        {...(isList ? { role: rest.role || 'list' } : {})}
      >
        {children}
      </Component>
    );
  }
);
