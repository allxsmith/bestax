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
  validAlignItems,
  validJustifyContents,
} from '../helpers/useBulmaClasses';

/**
 * The Stack component's own props, beside the attributes of the element `as`
 * renders.
 */
export interface StackOwnProps extends LayoutOwnProps {
  /**
   * Space between children, a step of Bulma's gap scale (`'2'` is 1rem).
   * Unset, it's `--bulma-stack-gap`, Bulma's block spacing.
   */
  gap?: BulmaGapStep;
  /**
   * How each child sits across the column. `'stretch'` makes each as wide as
   * the Stack.
   * @defaultValue 'stretch'
   */
  alignItems?: (typeof validAlignItems)[number];
  /** Where the children sit down the column, when it's taller than they are. */
  justifyContent?: (typeof validJustifyContents)[number];
}

/**
 * Props for the Stack component. The attributes and the `ref` follow `as`, so
 * `as="form"` takes `action` and `as="fieldset"` takes `disabled`.
 *
 * @extraProp {PolymorphicRef<LayoutElement>} [ref] - Ref forwarded to the element `as` renders.
 */
export type StackProps<T extends LayoutElement = LayoutElement> =
  StackOwnProps &
    Omit<React.ComponentPropsWithoutRef<T>, keyof StackOwnProps | 'as'> & {
      /**
       * The element to render. With `ul` or `ol`, give it `li` children: it
       * restates `role="list"`, which Bulma's list reset takes away in Safari.
       * @defaultValue 'div'
       */
      as?: T;
    };

/**
 * The `Stack` component lays its children out in a column, with Bulma's block spacing between them and the bottom margins Bulma gives them zeroed.
 *
 * A Stack of Boxes, Cards or Notifications looks like Bulma's own stacked
 * blocks, spaced by the gap alone, so there are no margins to undo. A `gap`
 * step replaces the default spacing. It's always a column, top to bottom.
 *
 * @function
 * @param {StackProps} props - Props for the Stack component.
 * @param {React.Ref} ref - Forwarded ref to the element `as` renders.
 * @returns {JSX.Element} The rendered stack.
 *
 * @example
 * <Stack>
 *   <Notification color="info">Your changes are saved.</Notification>
 *   <Box>…</Box>
 * </Stack>
 */
export const Stack = forwardRef(function Stack(
  props: StackProps,
  ref: React.Ref<HTMLElement>
) {
  return (
    <StackLayout
      ref={ref}
      {...(props as StackLayoutProps)}
      // A column always: reading and Tab order follow the children's order,
      // and a reversed column would show them in another.
      flexDirection={undefined}
      modifiers={{ 'is-vertical': true }}
    />
  );
}) as ConstrainedPolymorphicComponent<StackOwnProps, LayoutElement, 'div'>;

Stack.displayName = 'Stack';

export default Stack;
