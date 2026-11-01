import React, { forwardRef } from 'react';
import type { ConstrainedPolymorphicComponent } from '../helpers/polymorphic';
import {
  StackLayout,
  type LayoutElement,
  type LayoutOwnProps,
  type StackLayoutProps,
} from '../helpers/stackLayout';
import type {
  BulmaGapStep,
  validAlignContents,
  validAlignItems,
  validFlexDirections,
  validFlexWraps,
  validJustifyContents,
} from '../helpers/useBulmaClasses';

/**
 * The Flex component's own props, beside the attributes of the element `as`
 * renders.
 */
export interface FlexOwnProps extends LayoutOwnProps {
  /**
   * The main axis, a row unless set. `row-reverse` and `column-reverse`
   * change only what's seen: reading and Tab order still follow the
   * children's order (WCAG 1.3.2 and 2.4.3).
   */
  flexDirection?: (typeof validFlexDirections)[number];
  /** Whether children move to a new line when they don't fit. Unset, CSS's own `nowrap`. */
  flexWrap?: (typeof validFlexWraps)[number];
  /** How each child sits across the main axis. Unset, CSS's own `stretch`. */
  alignItems?: (typeof validAlignItems)[number];
  /** Where the children sit along the main axis. */
  justifyContent?: (typeof validJustifyContents)[number];
  /** How wrapped lines share the space across the main axis. */
  alignContent?: (typeof validAlignContents)[number];
  /** Space between children, a step of Bulma's gap scale. None by default. */
  gap?: BulmaGapStep;
  /** Space between wrapped lines, when it differs from `gap`. */
  rowGap?: BulmaGapStep;
  /** Space between children along a row, when it differs from `gap`. */
  columnGap?: BulmaGapStep;
}

/**
 * Props for the Flex component. The attributes and the `ref` follow `as`, so
 * `as="form"` takes `action` and `as="fieldset"` takes `disabled`.
 *
 * @extraProp {PolymorphicRef<LayoutElement>} [ref] - Ref forwarded to the element `as` renders.
 */
export type FlexProps<T extends LayoutElement = LayoutElement> = FlexOwnProps &
  Omit<React.ComponentPropsWithoutRef<T>, keyof FlexOwnProps | 'as'> & {
    /**
     * The element to render. With `ul` or `ol`, give it `li` children: it
     * restates `role="list"`, which Bulma's list reset takes away in Safari.
     * @defaultValue 'div'
     */
    as?: T;
  };

/**
 * The `Flex` component is a flex container with CSS's own defaults, taking the flex container's properties as props.
 *
 * It's a row that doesn't wrap, with its children stretched across it and no
 * gap, until you set otherwise. Use it for a layout of your own, such as a
 * fixed side beside a growing one, with `flexGrow` and `flexShrink` on the
 * children. Its children's own block margins are zeroed, so the gap is the
 * only space. For a column of blocks or a row of controls with Bulma's
 * spacing already in place, `Stack` and `Group` start closer.
 *
 * @function
 * @param {FlexProps} props - Props for the Flex component.
 * @param {React.Ref} ref - Forwarded ref to the element `as` renders.
 * @returns {JSX.Element} The rendered flex container.
 *
 * @example
 * <Flex gap="4" alignItems="flex-start">
 *   <Box flexShrink="0">…</Box>
 *   <Box flexGrow="1">…</Box>
 * </Flex>
 */
export const Flex = forwardRef(function Flex(
  props: FlexProps,
  ref: React.Ref<HTMLElement>
) {
  return <StackLayout ref={ref} {...(props as StackLayoutProps)} />;
}) as ConstrainedPolymorphicComponent<FlexOwnProps, LayoutElement, 'div'>;

Flex.displayName = 'Flex';

export default Flex;
