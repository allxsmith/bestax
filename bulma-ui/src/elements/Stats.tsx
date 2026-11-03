import React, { forwardRef, useMemo } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import type { BulmaMinColValue } from '../grid/Grid';
import { Stat } from './Stat';
import { StatScopeContext } from './statContext';

/**
 * Props for the Stats component, a row of Stats on Bulma's smart grid. The
 * helper props, the other attributes and the `ref` land on its `<dl>`.
 *
 * @extraProp {React.Ref<HTMLDListElement>} [ref] - Ref forwarded to the `<dl>`.
 * @extraProp {BulmaGapStep} [gap] - The space between tiles (`is-gap-*`), the helper prop with the values Grid's `gap` takes.
 * @extraProp {string} [aria-labelledby] - The id of the heading above the row, which names it.
 */
export interface StatsProps
  extends
    Omit<React.HTMLAttributes<HTMLDListElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** `Stat`s, one per figure, and nothing else: they're the groups of its `<dl>`. */
  children?: React.ReactNode;
  /**
   * The narrowest a tile gets before the row wraps (`is-col-min-*`), as
   * Grid's `minCol`: 1.5rem a step. Unset, it's Bulma's 9rem.
   */
  minCol?: BulmaMinColValue;
  /**
   * Text color helper: `has-text-*` on the `<dl>`, as on Buttons. Each Stat
   * in the row without a `textColor` of its own takes it too, which colors
   * its figure, since a Stat sets its own color. The labels, the changes and
   * the notes keep theirs.
   */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * The `Stats` component lays out a row of `Stat`s, such as the key figures at the top of a dashboard, as one description list on Bulma's smart grid.
 *
 * It's a `<dl>` with a `<div>` for each Stat, so a screen reader announces
 * the row once, then each label with its values. The tiles fill the grid's
 * columns, each at least `minCol` wide, and wrap without media queries;
 * the `gap` helper prop sets the space between them. Name the row with
 * `aria-labelledby` pointing at the heading above it. `Stat` is also
 * `Stats.Stat`.
 *
 * @function
 * @param {StatsProps} props - Props for the Stats component.
 * @param {React.Ref<HTMLDListElement>} ref - Forwarded ref to the `<dl>`.
 * @returns {JSX.Element} The rendered row.
 *
 * @example
 * <Stats aria-labelledby="kpis" minCol={8} gap="4">
 *   <Stat label="Revenue" value={8456.4} format={{ style: 'currency', currency: 'USD' }} />
 *   <Stat label="New customers" value={1234} change={-0.019} />
 * </Stats>
 */
const StatsRoot = forwardRef<HTMLDListElement, StatsProps>(
  ({ className, minCol, textColor, bgColor, children, ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });
    const statsClass = usePrefixedClassNames('stats grid', {
      [`is-col-min-${minCol}`]: minCol !== undefined && minCol !== null,
    });
    const scope = useMemo(() => ({ row: true, textColor }), [textColor]);
    return (
      <dl
        ref={ref}
        className={classNames(statsClass, bulmaHelperClasses, className)}
        {...rest}
      >
        <StatScopeContext.Provider value={scope}>
          {children}
        </StatScopeContext.Provider>
      </dl>
    );
  }
);

StatsRoot.displayName = 'Stats';

export const Stats = withSubComponents(StatsRoot, { Stat }, 'Stats');

export default Stats;
