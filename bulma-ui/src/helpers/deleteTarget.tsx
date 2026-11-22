// INTERNAL: deliberately not exported from src/index.ts.
import type { ReactNode } from 'react';
import { usePrefixedClassNames } from './classNames';

/**
 * The hit area of a close button Bulma draws with its delete mixin, rendered
 * inside it. Bulma draws a `.delete` 20px across, 16px small, under WCAG
 * 2.5.8's 24px minimum target, and draws its cross on the button's `::before`
 * and `::after`, so the target is an element of its own: `_delete.scss` makes
 * it a transparent box at least 24px square, centred on the button, and a
 * press on it is a press on the button. The circle, and the layout around it,
 * stay as Bulma draws them. `Delete` renders it, and so does each such button
 * a component writes by hand rather than through `Delete`.
 *
 * @function DeleteTarget
 * @returns The hit area's `<span>`.
 */
export function DeleteTarget() {
  const className = usePrefixedClassNames('delete-target');
  return <span className={className} aria-hidden="true" />;
}

/**
 * What goes inside a close button that takes a caller's props: their
 * children, then the hit area. Nothing at all beside a
 * `dangerouslySetInnerHTML`, which React refuses with children, so that
 * button keeps the caller's markup and goes without the hit area.
 *
 * @param props - The props the button spreads.
 * @returns The button's children.
 */
export function deleteContent(props: {
  children?: ReactNode;
  dangerouslySetInnerHTML?: unknown;
}): ReactNode {
  if (props.dangerouslySetInnerHTML) return undefined;
  return (
    <>
      {props.children}
      <DeleteTarget />
    </>
  );
}
