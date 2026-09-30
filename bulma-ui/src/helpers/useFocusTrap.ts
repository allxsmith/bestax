import { useEffect } from 'react';
import type { RefObject } from 'react';
import { useIsHydrated } from './useIsHydrated';

/**
 * Whether `el` is editable while its parent is not, which makes it an editing
 * host: the one tab stop an editable region gets. `contenteditable="false"`
 * turns editing off, and a missing or unknown value inherits the parent's.
 */
function isEditingHost(el: Element): boolean {
  const editable = (node: Element): boolean | null => {
    const value = node.getAttribute('contenteditable')?.toLowerCase();
    if (value === undefined) return null;
    if (value === '' || value === 'true' || value === 'plaintext-only') {
      return true;
    }
    return value === 'false' ? false : null;
  };
  if (editable(el) !== true) return false;
  for (let node = el.parentElement; node; node = node.parentElement) {
    const state = editable(node);
    if (state !== null) return !state;
  }
  return true;
}

/** Whether `el` is the summary of its `<details>`: the first one, not a stray. */
const isDetailsSummary = (el: Element): boolean =>
  el.parentElement?.localName === 'details' &&
  Array.from(el.parentElement.children).find(
    child => child.localName === 'summary'
  ) === el;

/**
 * Whether the browser puts `el` in the tab order, before anything that hides
 * or disables it. The `tabIndex` property can't answer this on its own: it
 * can read `-1` for an editable region or an `<embed>` that Tab still visits,
 * and `0` for a `<video>` without controls that it doesn't. So a valid
 * `tabindex` attribute decides, and otherwise the element's kind does.
 */
function isTabbableKind(el: Element): boolean {
  const tabindex = el.getAttribute('tabindex');
  if (tabindex !== null && /^\s*[+-]?\d/.test(tabindex)) {
    return (el as HTMLElement).tabIndex >= 0;
  }
  switch (el.localName) {
    case 'a':
    case 'area':
      return el.hasAttribute('href');
    case 'input':
      return (el as HTMLInputElement).type !== 'hidden';
    case 'button':
    case 'select':
    case 'textarea':
    case 'iframe':
    case 'embed':
    case 'object':
      return true;
    case 'audio':
    case 'video':
      return el.hasAttribute('controls');
    case 'summary':
      return isDetailsSummary(el);
    default:
      return isEditingHost(el);
  }
}

/**
 * The element's parent, stepping out of a shadow root to its host. Only
 * called on elements inside the container, below it, so there is always one.
 */
const composedParent = (el: Element): Element =>
  el.parentElement ?? (el.parentNode as ShadowRoot).host;

const isShown = (el: Element): boolean =>
  !el.hasAttribute('inert') && getComputedStyle(el).display !== 'none';

/**
 * Whether Tab can land on `el`, one of the kinds it visits. A disabled control
 * (including one inside a disabled `<fieldset>`), an inert subtree and
 * anything not rendered are skipped. Up to the container, that means
 * `display: none` (not inherited, so each ancestor is checked) and a closed
 * `<details>` anywhere but its summary. `visibility` is inherited, so the
 * element's own computed value covers its ancestors.
 */
function isRenderedAndEnabled(el: Element, container: Element): boolean {
  if (el.matches(':disabled') || !isShown(el)) return false;
  for (
    let below = el, node = composedParent(el);
    node !== container;
    below = node, node = composedParent(node)
  ) {
    if (!isShown(node)) return false;
    if (
      node.localName === 'details' &&
      !node.hasAttribute('open') &&
      !isDetailsSummary(below)
    ) {
      return false;
    }
  }
  const { visibility } = getComputedStyle(el);
  return visibility !== 'hidden' && visibility !== 'collapse';
}

/** A radio button with a name, which shares one tab stop with its group. */
const isGroupedRadio = (el: Element): el is HTMLInputElement =>
  el.localName === 'input' &&
  (el as HTMLInputElement).type === 'radio' &&
  (el as HTMLInputElement).name !== '';

/**
 * The shadow hosts between the container's own tree and `node`, outermost
 * first, then `node` itself. `contains` and `compareDocumentPosition` only
 * work within one tree, so a node in a shadow root the container holds is
 * compared through its host at the container's level, and by its own
 * position inside the root below that.
 */
function composedChain(node: Node, container: Node): Node[] {
  const chain = [node];
  const top = container.getRootNode();
  let root = node.getRootNode();
  while (root !== top) {
    const host = (root as ShadowRoot).host;
    if (!host) break;
    chain.unshift(host);
    root = host.getRootNode();
  }
  return chain;
}

/** Whether `node` is inside the container, shadow roots it holds included. */
const inside = (container: Element, node: Node): boolean =>
  container.contains(composedChain(node, container)[0]);

/**
 * `true` when Tab reaches `b` after `a`. Within one tree that is document
 * order. A shadow host comes before the content of its shadow root, and that
 * content before the host's own children: slots are not followed, so slotted
 * content keeps its place in the light DOM.
 */
function follows(container: Element, a: Node, b: Node): boolean {
  const chainA = composedChain(a, container);
  const chainB = composedChain(b, container);
  for (let i = 0; i < Math.max(chainA.length, chainB.length); i++) {
    const [x, y] = [chainA[i], chainB[i]];
    if (x === y) continue;
    if (!x) return true;
    if (!y) return false;
    return Boolean(
      x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING
    );
  }
  return false;
}

/** Every element of a tabbable kind under `root`, in the order Tab visits. */
function collectCandidates(root: Node, out: HTMLElement[] = []): HTMLElement[] {
  const walker = (root.ownerDocument as Document).createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT
  );
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node as HTMLElement;
    if (isTabbableKind(el)) out.push(el);
    if (el.shadowRoot) collectCandidates(el.shadowRoot, out);
  }
  return out;
}

interface TabStops {
  first: HTMLElement;
  last: HTMLElement;
  /** The stop that stands for `node`: its group's stop for a radio button. */
  stopFor(node: Element): Element;
}

/**
 * The first and last tab stops inside `container`, or `null` when there are
 * none. Only the ends matter for wrapping, so the style checks run from each
 * end until they find a stop rather than over every candidate.
 *
 * A radio group is one stop, the way the browser treats it: its checked
 * button, or its first when none is checked. Counting every button would make
 * the group's last one an end, and Tab from the checked one would leave.
 */
function findTabStops(container: HTMLElement): TabStops | null {
  const candidates = collectCandidates(container);
  const checked = new Map<Element, boolean>();
  const usable = (el: Element): boolean => {
    let ok = checked.get(el);
    if (ok === undefined) {
      ok = isRenderedAndEnabled(el, container);
      checked.set(el, ok);
    }
    return ok;
  };
  const groupStop = (radio: HTMLInputElement): HTMLElement | undefined => {
    const group = candidates.filter(
      (el): el is HTMLInputElement =>
        isGroupedRadio(el) &&
        el.name === radio.name &&
        el.form === radio.form &&
        el.getRootNode() === radio.getRootNode()
    );
    return group.find(el => el.checked && usable(el)) ?? group.find(usable);
  };
  const isStop = (el: HTMLElement): boolean =>
    usable(el) && (!isGroupedRadio(el) || groupStop(el) === el);

  const first = candidates.find(isStop);
  if (!first) return null;
  let last = first;
  for (let i = candidates.length - 1; candidates[i] !== first; i--) {
    if (isStop(candidates[i])) {
      last = candidates[i];
      break;
    }
  }
  return {
    first,
    last,
    stopFor: node => (isGroupedRadio(node) && groupStop(node)) || node,
  };
}

/**
 * The focused element. `activeElement` stops at a shadow host, so this
 * follows open shadow roots down to the element that has focus; the
 * comparisons above know how to place it.
 */
function focusedElement(doc: Document): Element {
  let el = doc.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  // Browsers fall back to <body>. jsdom, where consumers run their tests,
  // reports nothing once focus was inside a shadow root that was removed.
  return el ?? doc.body;
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
 * Tab stops are what the browser's Tab visits, in document order: links,
 * form controls, frames, media with controls, a `<details>` summary, editable
 * regions, anything with `tabIndex={0}`, and the content of open shadow
 * roots. Hidden, disabled, inert and `tabIndex={-1}` elements are skipped,
 * and a radio group counts once. Give the container `tabIndex={-1}` so it can
 * hold focus itself when nothing inside can. The trap listens on the
 * container, so a trap nested inside another handles Tab first and the outer
 * one stands aside.
 *
 * The trap is about Tab. If a Tab it let through still takes focus out (a
 * browser can leave out a stop the page has, such as links when its settings
 * say to), it sends focus back to the other end. A pointer or a script moving
 * focus out is left alone, because pulling focus back from a click is modal
 * behaviour, and a modal also has to block the page behind it, which `Modal`
 * does. Content the container renders through a nested `Portal` lives
 * elsewhere in the DOM, so it is outside the trap: render nested overlays
 * inside the container, or give them a trap of their own.
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
    const doc = container.ownerDocument;

    const opener = focusedElement(doc) as HTMLElement;

    (
      initialFocusRef?.current ??
      findTabStops(container)?.first ??
      container
    ).focus();

    // Where focus goes if a Tab the trap let the browser handle takes it out,
    // held until that Tab has finished moving focus.
    let wrapTo: HTMLElement | null = null;
    let wrapTimer: ReturnType<typeof setTimeout> | undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      // A trap nested inside this one has already wrapped focus.
      if (e.key !== 'Tab' || e.defaultPrevented) return;
      const stops = findTabStops(container);
      if (!stops) {
        e.preventDefault();
        container.focus();
        return;
      }
      const current = stops.stopFor(focusedElement(doc));
      // Wrap whenever the browser has no stop left in that direction inside
      // the container. Comparing positions rather than testing `=== first`
      // also covers focus resting on the container or on an element outside
      // the tab order, which the browser would otherwise walk straight out of.
      if (
        e.shiftKey
          ? !follows(container, stops.first, current)
          : !follows(container, current, stops.last)
      ) {
        e.preventDefault();
        (e.shiftKey ? stops.last : stops.first).focus();
        return;
      }
      wrapTo = e.shiftKey ? stops.last : stops.first;
      clearTimeout(wrapTimer);
      wrapTimer = setTimeout(() => {
        wrapTo = null;
      });
    };

    // The browser moves focus as soon as the keydown is over, so focus that
    // lands outside while `wrapTo` is set got there by that Tab.
    const handleFocusIn = (e: FocusEvent) => {
      if (!wrapTo || inside(container, e.composedPath()[0] as Node)) return;
      const target = wrapTo;
      wrapTo = null;
      target.focus();
    };

    container.addEventListener('keydown', handleKeyDown);
    doc.addEventListener('focusin', handleFocusIn, true);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      doc.removeEventListener('focusin', handleFocusIn, true);
      clearTimeout(wrapTimer);
      let target = restoreFocus ? opener : null;
      if (typeof restoreFocus === 'object') {
        // Read now rather than when the trap turned on: a trigger that
        // re-mounted in between has a new node.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        target = restoreFocus.current;
      }
      // Hand focus back only while the trap still holds it: inside the
      // container, or dropped to <body> because the container left the page.
      const now = focusedElement(doc);
      if (target && (now === doc.body || inside(container, now))) {
        target.focus();
      }
    };
  }, [active, hydrated, containerRef, initialFocusRef, restoreFocus]);
}
