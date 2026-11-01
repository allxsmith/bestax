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
  validFlexWraps,
  validJustifyContents,
} from '../helpers/useBulmaClasses';
import type { ContainerBreakpoint } from './Container';

/**
 * The Group component's own props, beside the attributes of the element `as`
 * renders.
 */
export interface GroupOwnProps extends LayoutOwnProps {
  /**
   * Space between children, a step of Bulma's gap scale. Unset, it's
   * `--bulma-stack-horizontal-gap`, half of Bulma's block spacing.
   */
  gap?: BulmaGapStep;
  /**
   * How each child sits across the row. While `breakpoint` stacks them, it's
   * where each sits across the column.
   * @defaultValue 'center'
   */
  alignItems?: (typeof validAlignItems)[number];
  /** Where the children sit along the row: `'space-between'` pushes the ends apart. */
  justifyContent?: (typeof validJustifyContents)[number];
  /**
   * Whether children move to a new row when they don't fit.
   * @defaultValue 'wrap'
   */
  flexWrap?: (typeof validFlexWraps)[number];
  /**
   * The children share the row equally, and fill the column while
   * `breakpoint` stacks them (Bulma's `is-fullwidth`).
   */
  isFullwidth?: boolean;
  /**
   * Stacks the children below this Bulma breakpoint and sets them in a row
   * from it up, the breakpoints Container's `breakpoint` takes. Unset, a row
   * at every width.
   */
  breakpoint?: ContainerBreakpoint;
}

/**
 * Props for the Group component. The attributes and the `ref` follow `as`, so
 * `as="form"` takes `action` and `as="fieldset"` takes `disabled`.
 *
 * @extraProp {PolymorphicRef<LayoutElement>} [ref] - Ref forwarded to the element `as` renders.
 */
export type GroupProps<T extends LayoutElement = LayoutElement> =
  GroupOwnProps &
    Omit<React.ComponentPropsWithoutRef<T>, keyof GroupOwnProps | 'as'> & {
      /**
       * The element to render. With `ul` or `ol`, give it `li` children: it
       * restates `role="list"`, which Bulma's list reset takes away in Safari.
       * @defaultValue 'div'
       */
      as?: T;
    };

const BREAKPOINTS: readonly ContainerBreakpoint[] = [
  'tablet',
  'desktop',
  'widescreen',
];

/**
 * The `Group` component lays its children out in a row that wraps, centered on each other, with half of Bulma's block spacing between them.
 *
 * Use it for a row of buttons, tags or avatars beside some text, or a toolbar
 * with `justifyContent="space-between"` pushing its ends apart. The children's
 * own block margins are zeroed, so the gap is the only space. With
 * `breakpoint`, it's a column on narrow screens and a row from that
 * breakpoint up. For controls joined into one, with no gap and shared
 * borders, use `hasAddons` on Field or Buttons instead.
 *
 * @function
 * @param {GroupProps} props - Props for the Group component.
 * @param {React.Ref} ref - Forwarded ref to the element `as` renders.
 * @returns {JSX.Element} The rendered group.
 *
 * @example
 * <Group justifyContent="space-between">
 *   <Title as="h2" size="4">Invoices</Title>
 *   <Button color="primary">New invoice</Button>
 * </Group>
 */
export const Group = forwardRef(function Group(
  props: GroupProps,
  ref: React.Ref<HTMLElement>
) {
  const { isFullwidth, breakpoint, ...rest } = props as GroupOwnProps &
    StackLayoutProps;
  return (
    <StackLayout
      ref={ref}
      {...rest}
      // A row always, or a column below `breakpoint`: never reversed, so
      // reading and Tab order follow what's seen.
      flexDirection={undefined}
      modifiers={{
        'is-horizontal': true,
        'is-fullwidth': isFullwidth,
        [`is-${breakpoint}`]: !!breakpoint && BREAKPOINTS.includes(breakpoint),
      }}
    />
  );
}) as ConstrainedPolymorphicComponent<GroupOwnProps, LayoutElement, 'div'>;

Group.displayName = 'Group';

export default Group;
