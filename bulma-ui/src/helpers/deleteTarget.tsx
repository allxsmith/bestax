// INTERNAL: deliberately not exported from src/index.ts.
import { usePrefixedClassNames } from './classNames';

/**
 * The hit area of a `.delete` button, rendered inside it. Bulma draws the
 * button 20px across, 16px small, under WCAG 2.5.8's 24px minimum target,
 * and draws its cross on the button's `::before` and `::after`, so the target
 * is an element of its own: `_delete.scss` makes it a transparent box at
 * least 24px square, centred on the button, and a press on it is a press on
 * the button. The circle, and the layout around it, stay as Bulma draws them.
 * `Delete` renders it, and so does each `.delete` button a component writes by
 * hand rather than through `Delete`.
 *
 * @function DeleteTarget
 * @returns The hit area's `<span>`.
 */
export function DeleteTarget() {
  const className = usePrefixedClassNames('delete-target');
  return <span className={className} aria-hidden="true" />;
}
