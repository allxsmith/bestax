import { useEffect } from 'react';
import type { RefObject } from 'react';
import { useIsHydrated } from './useIsHydrated';

/**
 * Elements that can take keyboard focus. It over-matches on purpose (an
 * `<a href tabIndex={-1}>` matches `[href]`); `isTabStop` narrows the result to
 * the elements Tab actually visits.
 */
const FOCUSABLE_SELECTOR =
  'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]';

/**
 * Whether Tab can land on `el`. A negative `tabIndex` (the browser's resolved
 * value, so roving-tabindex items drop out), a disabled control (including one
 * inside a disabled `<fieldset>`), an inert subtree, and anything not rendered
 * are all skipped: `focus()` on those is a no-op or out of sequence, and a
 * trap that counted one as its last stop would let Tab walk out of the
 * container. `display: none` is not inherited, so the ancestors up to the
 * container are checked too; `visibility` is inherited, so the element's own
 * computed value covers its ancestors.
 */
function isTabStop(el: HTMLElement, container: HTMLElement): boolean {
  if (el.tabIndex < 0 || el.matches(':disabled') || el.closest('[inert]')) {
    return false;
  }
  for (
    let node: HTMLElement | null = el;
    node && node !== container;
    node = node.parentElement
  ) {
    if (getComputedStyle(node).display === 'none') return false;
  }
  const { visibility } = getComputedStyle(el);
  return visibility !== 'hidden' && visibility !== 'collapse';
}

/**
 * The first and last tab stops inside `container`, in document order, or
 * `null` when there are none. Only the ends matter for wrapping, so the
 * style checks run from each end until they find a stop rather than over
 * every candidate.
 */
function tabStopEdges(
  container: HTMLElement
): [first: HTMLElement, last: HTMLElement] | null {
  const candidates = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  );
  const first = candidates.find(el => isTabStop(el, container));
  if (!first) return null;
  let last = first;
  for (let i = candidates.length - 1; candidates[i] !== first; i--) {
    if (isTabStop(candidates[i], container)) {
      last = candidates[i];
      break;
    }
  }
  return [first, last];
}

/** `true` when `b` comes after `a` in document order, descendants included. */
const follows = (a: Node, b: Node): boolean =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

/**
 * The focused element. `document.activeElement` stops at a shadow host, so
 * this follows open shadow roots down to the element that really has focus;
 * a trap rendered inside a shadow root would otherwise only ever see the host.
 */
function focusedElement(): Element | null {
  let el = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

/**
 * Options for `useFocusTrap`.
 */
export interface UseFocusTrapOptions {
  /**
   * Whether the trap is on. Turning it on moves focus into the container;
   * turning it off (or unmounting) releases Tab and restores focus.
   * @defaultValue true
   */
  active?: boolean;
  /**
   * The element to focus when the trap turns on. Without it, or while it
   * points at nothing, focus goes to the first tab stop inside the container,
   * and to the container itself when there is none.
   */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /**
   * Where focus goes when the trap turns off. `true` returns it to the element
   * that had focus when the trap turned on; a ref sends it to that element
   * instead; `false` leaves it alone. Focus is only moved while the trap still
   * holds it, so a click that already put focus somewhere else outside the
   * container keeps it there.
   *
   * `true` reads focus after the container's content has mounted, so content
   * that focuses itself as it mounts (an `autoFocus` input) hides the element
   * that opened it. And some browsers don't focus a button when it is
   * clicked. For a panel opened from a button, pass the button's ref.
   * @defaultValue true
   */
  restoreFocus?: boolean | RefObject<HTMLElement | null>;
}

/**
 * Keeps keyboard focus inside a container while it is active: focus moves in
 * when the trap turns on, Tab and Shift+Tab wrap between the first and last
 * tab stops, and focus goes back where it came from when the trap turns off.
 *
 * Tab stops are taken in document order, skipping hidden, disabled, inert
 * and `tabIndex={-1}` elements, which the browser's Tab skips too. Give the
 * container `tabIndex={-1}` so it can hold focus itself when nothing inside
 * can. The trap listens on the container, so a trap nested inside another
 * handles Tab first and the outer one stands aside.
 *
 * The container has to be in the DOM when the trap turns on. A container
 * rendered through `Portal` counts: the trap waits for hydration the same way
 * `Portal` does, so it attaches in the commit where the portal's content
 * appears.
 *
 * @function useFocusTrap
 * @param containerRef - Ref to the element focus stays inside.
 * @param options - When the trap is on, and where focus starts and ends.
 *
 * @example
 * const panelRef = useRef<HTMLDivElement>(null);
 * useFocusTrap(panelRef, { active: isOpen });
 * return isOpen ? (
 *   <div ref={panelRef} role="dialog" aria-label="Filters" tabIndex={-1}>
 *     …
 *   </div>
 * ) : null;
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  options: UseFocusTrapOptions = {}
): void {
  const { active = true, initialFocusRef, restoreFocus = true } = options;
  // The server render and the hydrating render have no portaled content, so
  // a container inside `Portal` only exists from the commit after hydration.
  const hydrated = useIsHydrated();

  useEffect(() => {
    if (!active || !hydrated) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    const opener = focusedElement() as HTMLElement | null;

    (
      initialFocusRef?.current ??
      tabStopEdges(container)?.[0] ??
      container
    ).focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      // A trap nested inside this one has already wrapped focus.
      if (e.key !== 'Tab' || e.defaultPrevented) return;
      const edges = tabStopEdges(container);
      if (!edges) {
        e.preventDefault();
        container.focus();
        return;
      }
      const [first, last] = edges;
      const current = focusedElement() as Node;
      // Wrap whenever the browser has no stop left in that direction inside
      // the container. Comparing positions rather than testing `=== first`
      // also covers focus resting on the container or on an element outside
      // the tab order, which the browser would otherwise walk straight out of.
      if (e.shiftKey ? !follows(first, current) : !follows(current, last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      let target = restoreFocus ? opener : null;
      if (typeof restoreFocus === 'object') {
        // Read now rather than when the trap turned on: a trigger that
        // re-mounted in between has a new node.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        target = restoreFocus.current;
      }
      // Hand focus back only while the trap still holds it: inside the
      // container, or dropped to <body> because the container left the page.
      const now = focusedElement();
      if (target && (now === document.body || container.contains(now))) {
        target.focus();
      }
    };
  }, [active, hydrated, containerRef, initialFocusRef, restoreFocus]);
}
