// INTERNAL: deliberately not exported from src/index.ts.
import { getActiveElementInTree } from './shadowDom';

/** Focuses `el`, and says whether it took focus. */
const takesFocus = (el: HTMLElement) => {
  el.focus();
  return getActiveElementInTree(el) === el;
};

/**
 * Moves focus out of parts that are about to hide, when one of them holds
 * it. Without this, the browser drops focus to the page once they hide, and
 * the next Tab starts from the top.
 *
 * Focus goes to `target`, the control that stays, even one that Tab passes
 * over, since it can still take focus. When it can't take any, as a link
 * with no `href` can't, focus goes to `fallback`, given `tabindex="-1"` for
 * as long as it keeps focus, unless it has a `tabindex` of its own. When
 * neither can take focus, it drops as it would have.
 *
 * Call it in a layout effect, in the commit that hides the parts, while
 * focus is still in them.
 *
 * @param hiding - The parts about to hide.
 * @param target - Where focus goes.
 * @param fallback - Where focus goes when `target` can't take it.
 */
export function moveFocusOut(
  hiding: readonly Element[],
  target: HTMLElement | null,
  fallback: HTMLElement | null
): void {
  if (!hiding.some(part => part.contains(getActiveElementInTree(part)))) {
    return;
  }
  if (target && takesFocus(target)) return;
  if (!fallback) return;
  if (fallback.hasAttribute('tabindex')) {
    fallback.focus();
    return;
  }
  fallback.setAttribute('tabindex', '-1');
  // One that can't take focus either, such as a hidden one, gets no blur to
  // take the tabindex off again, so it goes now.
  if (!takesFocus(fallback)) {
    fallback.removeAttribute('tabindex');
    return;
  }
  fallback.addEventListener(
    'blur',
    () => fallback.removeAttribute('tabindex'),
    { once: true }
  );
}
