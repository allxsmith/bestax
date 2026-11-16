import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useScrollRegion } from '../helpers/useScrollRegion';

/**
 * Props for the Pre component.
 *
 * @extraProp {string} [aria-label] - Names the block. While it overflows, it's a region you can tab to, and this is the name a screen reader says when it takes focus, such as "Install command".
 * @extraProp {string} [aria-labelledby] - The id of a visible heading or caption that names the block, in place of `aria-label`.
 * @extraProp {number} [tabIndex] - Replaces the tab stop `Pre` gives itself while it overflows: `-1` keeps it out of the Tab order.
 */
export interface PreProps
  extends
    React.HTMLAttributes<HTMLPreElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string | undefined;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Preformatted content to render. */
  children?: React.ReactNode;
}

/**
 * The `Pre` component renders a styled `<pre>` element with Bulma helper class integration.
 *
 * Bulma scrolls a line longer than the block sideways rather than wrapping
 * it. While the content overflows, the block is a region you can tab to and
 * scroll with the arrow keys, Safari included, as `ScrollArea`'s viewport and
 * a responsive `Table` are; while it fits, it's a plain `<pre>` with no tab
 * stop.
 *
 * @function
 * @param {PreProps} props - Props for the Pre component.
 * @returns {JSX.Element} The rendered pre element.
 */
export const Pre: React.FC<PreProps> = ({
  className,
  textColor,
  bgColor,
  role,
  tabIndex,
  onScroll,
  onFocus,
  onBlur,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  } as BulmaClassesProps & typeof props);

  const bulmaClasses = usePrefixedClassNames();
  const preClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  // A `<pre>` scrolls sideways, and Safari, unlike Chromium and Firefox,
  // gives a scroller no tab stop of its own, so the keyboard couldn't reach
  // the end of a long line there. A role, a tab stop or a name the caller
  // passes wins, and the name stays on whether or not it overflows.
  const { props: region } = useScrollRegion<HTMLPreElement>({
    orientation: 'both',
    onScroll,
    onFocus,
    onBlur,
    'aria-label': rest['aria-label'],
    'aria-labelledby': rest['aria-labelledby'],
  });

  return (
    <pre
      className={preClasses || undefined}
      {...rest}
      {...region}
      role={role ?? region.role}
      tabIndex={tabIndex ?? region.tabIndex}
      aria-label={rest['aria-label']}
      aria-labelledby={rest['aria-labelledby']}
    >
      {children}
    </pre>
  );
};
