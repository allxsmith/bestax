import React, { forwardRef } from 'react';
import type { ConstrainedPolymorphicComponent } from '../helpers/polymorphic';
import {
  StackLayout,
  type LayoutElement,
  type LayoutOwnProps,
  type StackLayoutProps,
} from '../helpers/stackLayout';
import type { BulmaGapStep, validDisplays } from '../helpers/useBulmaClasses';

/**
 * The Center component's own props, beside the attributes of the element
 * `as` renders.
 */
export interface CenterOwnProps extends LayoutOwnProps {
  /** Space between children, when there are several. None by default. */
  gap?: BulmaGapStep;
  /**
   * `'inline-flex'` sizes it to its content, to center something inside a
   * line of text. Needs Bulma's helper classes, as every `display` does.
   */
  display?: (typeof validDisplays)[number] | 'none';
}

/**
 * Props for the Center component. The attributes and the `ref` follow `as`.
 *
 * @extraProp {PolymorphicRef<LayoutElement>} [ref] - Ref forwarded to the element `as` renders.
 */
export type CenterProps<T extends LayoutElement = LayoutElement> =
  CenterOwnProps &
    Omit<React.ComponentPropsWithoutRef<T>, keyof CenterOwnProps | 'as'> & {
      /**
       * The element to render. With `ul` or `ol`, give it `li` children: it
       * restates `role="list"`, which Bulma's list reset takes away in Safari.
       * @defaultValue 'div'
       */
      as?: T;
    };

/**
 * The `Center` component centers its content on both axes.
 *
 * Use it for a loader, an icon or an empty state in the middle of a box, a
 * card or a section. Give it a height, or put it in something that has one,
 * to center down the middle as well as across. Several children sit side by
 * side in the middle, with no gap unless you set one.
 *
 * @function
 * @param {CenterProps} props - Props for the Center component.
 * @param {React.Ref} ref - Forwarded ref to the element `as` renders.
 * @returns {JSX.Element} The rendered center.
 *
 * @example
 * <Center p="6">
 *   <Loader />
 * </Center>
 */
export const Center = forwardRef(function Center(
  props: CenterProps,
  ref: React.Ref<HTMLElement>
) {
  return (
    <StackLayout
      ref={ref}
      {...(props as StackLayoutProps)}
      // Centered both ways, in the children's own order.
      flexDirection={undefined}
      modifiers={{ 'is-centered': true }}
    />
  );
}) as ConstrainedPolymorphicComponent<CenterOwnProps, LayoutElement, 'div'>;

Center.displayName = 'Center';

export default Center;
