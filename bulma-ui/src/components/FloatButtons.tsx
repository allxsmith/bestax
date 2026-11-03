import React, { forwardRef, useMemo } from 'react';
import { Affix, type AffixPosition } from './Affix';
import {
  FloatButtonContext,
  type FloatButtonPlacement,
  tooltipSide,
} from './floatButtonContext';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import type { BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for FloatButtons, several float buttons stacked in one corner. The
 * helper props, the other attributes and the `ref` land on its `<div>`.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the `<div>`, wherever it renders.
 */
export interface FloatButtonsProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * `FloatButton`s, a `FloatButton.SpeedDial`, a `FloatButton.BackToTop`, or
   * any of them inside a `Badge`, top to bottom.
   */
  children?: React.ReactNode;
  /**
   * The corner, as `Affix`'s. The buttons line up on its side.
   * @defaultValue 'bottom-right'
   */
  position?: AffixPosition;
  /**
   * As `Affix`'s `portal`.
   * @defaultValue false
   */
  portal?: boolean | string | HTMLElement;
}

/**
 * The `FloatButtons` component stacks several float buttons in one corner of the screen, so none covers another.
 *
 * It's an `Affix` laid out as a column, `--bulma-float-buttons-gap` apart,
 * top to bottom in the order they're written, which is also their reading
 * and Tab order, and lined up on its corner's side. The buttons inside take
 * no corner of their own, and their tooltips open away from that side.
 *
 * @function
 * @param {FloatButtonsProps} props - Props for the FloatButtons component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the `<div>`.
 * @returns {JSX.Element} The stack, in place or in its portal.
 *
 * @example
 * <FloatButtons>
 *   <FloatButton.BackToTop />
 *   <FloatButton aria-label="Help" icon="question" />
 * </FloatButtons>
 */
export const FloatButtons = forwardRef<HTMLDivElement, FloatButtonsProps>(
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
    const floatButtonsClass = usePrefixedClassNames('float-buttons');
    const placement = useMemo<FloatButtonPlacement>(
      () => ({
        position,
        tooltipPosition: tooltipSide(position),
        inMenu: false,
        showLabels: false,
      }),
      [position]
    );

    return (
      <Affix
        ref={ref}
        position={position}
        portal={portal}
        className={classNames(floatButtonsClass, className)}
        {...props}
      >
        <FloatButtonContext.Provider value={placement}>
          {children}
        </FloatButtonContext.Provider>
      </Affix>
    );
  }
);

FloatButtons.displayName = 'FloatButtons';

export default FloatButtons;
