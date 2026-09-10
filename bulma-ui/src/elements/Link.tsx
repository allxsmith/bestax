import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import type { PolymorphicComponent } from '../helpers/polymorphic';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * The Link component's own props — everything it adds on top of the attributes
 * of whatever element `as` renders.
 */
export interface LinkOwnProps extends Omit<
  BulmaClassesProps,
  'color' | 'backgroundColor'
> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Whether the link appears active. */
  isActive?: boolean;
  /** Content to render inside the link. */
  children?: React.ReactNode;
}

/**
 * Props for the Link component. The DOM attributes and the `ref` both follow
 * `as`: with the default `'a'` the anchor attributes (`href`, `target`, `rel`)
 * are accepted, with `as="span"` they are not.
 *
 * @extraProp {PolymorphicRef<T>} [ref] - Ref forwarded to the element `as` renders, typed from `as`: the DOM node for an intrinsic tag, or whatever handle a custom component exposes.
 */
export type LinkProps<T extends React.ElementType = 'a'> = LinkOwnProps &
  Omit<
    React.ComponentPropsWithoutRef<T>,
    keyof LinkOwnProps | 'as' | 'color'
  > & {
    /** Render as another intrinsic element (`'span'`, `'button'`) or a custom component (e.g. a router `Link`) instead of `<a>`. Defaults to `'a'`. */
    as?: T;
  };

/**
 * The shape the implementation destructures. The public contract is the generic
 * `LinkProps<T>` above — the body cannot see through `T`, so it reads the widest
 * form of the props it actually touches.
 */
type LinkImplProps = LinkOwnProps & { as?: React.ElementType };

/**
 * The `Link` component renders a styled anchor (`<a>`) element with Bulma helper class integration.
 *
 * @function
 * @param {LinkProps} props - Props for the Link component.
 * @param {React.Ref} ref - Forwarded ref to the element `as` renders.
 * @returns {JSX.Element} The rendered anchor, or whatever `as` names.
 * @see {@link https://bulma.io/documentation/elements/content/ | Bulma Content documentation}
 */
export const Link = forwardRef(function Link(
  linkProps: LinkProps,
  ref: React.Ref<HTMLElement>
) {
  const {
    className,
    textColor,
    bgColor,
    isActive,
    as: Component = 'a',
    children,
    ...props
  } = linkProps as LinkImplProps;
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  } as BulmaClassesProps & typeof props);

  const bulmaClasses = usePrefixedClassNames({
    'is-active': isActive,
  });
  const linkClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <Component ref={ref} className={linkClasses || undefined} {...rest}>
      {children}
    </Component>
  );
}) as PolymorphicComponent<LinkOwnProps, 'a'>;

Link.displayName = 'Link';
