import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useIsHydrated } from './useIsHydrated';
import { getDeepestActiveElement } from './shadowDom';

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
 * The node's parent in the flattened tree, the one the browser renders and
 * tabs through: the slot it is assigned to, else its parent, else the host of
 * the shadow root it tops, and nothing above the document. A closed shadow
 * root hides its slots (`assignedSlot` reads `null` under one), so a child of
 * its host goes straight to the host, whether a slot takes it or not.
 */
const flatParent = (node: Node): Node | null =>
  (node as Element).assignedSlot ??
  node.parentElement ??
  (node.parentNode as ShadowRoot | null)?.host ??
  null;

/**
 * The element's children in the flattened tree, in the order they render: a
 * host's shadow root content, a slot's assigned elements (or its fallback
 * content when nothing is assigned), anything else's own children. A host
 * whose shadow root is closed has no root to read, so its own children stand
 * in, including any that no slot takes and that aren't rendered.
 */
function flatChildren(el: Element): Element[] {
  if (el.shadowRoot) return Array.from(el.shadowRoot.children);
  if (el.localName === 'slot') {
    const assigned = (el as HTMLSlotElement).assignedNodes();
    if (assigned.length > 0) {
      return assigned.filter(
        (node): node is Element => node.nodeType === Node.ELEMENT_NODE
      );
    }
  }
  return Array.from(el.children);
}

const isShown = (el: Element): boolean =>
  !el.hasAttribute('inert') && getComputedStyle(el).display !== 'none';

const isVisible = (el: Element): boolean => {
  const { visibility } = getComputedStyle(el);
  return visibility !== 'hidden' && visibility !== 'collapse';
};

/**
 * Whether nothing from `el` up to `top` hides it: `inert`, `display: none`
 * (not inherited, so each element is checked) or a closed `<details>` it
 * isn't the summary of. `top` itself isn't checked, and `null` walks to the
 * top of the page.
 */
function isShownUpTo(el: Element, top: Node | null): boolean {
  let below: Element | null = null;
  for (
    let node: Element | null = el;
    node && node !== top;
    node = flatParent(node) as Element | null
  ) {
    if (!isShown(node)) return false;
    if (
      below &&
      node.localName === 'details' &&
      !node.hasAttribute('open') &&
      !isDetailsSummary(below)
    ) {
      return false;
    }
    below = node;
  }
  return true;
}

/**
 * The images that use the image map `area` belongs to. An image names its
 * map with `usemap="#…"`, matching the map's `name` or `id`.
 */
function imagesUsingMapOf(area: Element): Element[] {
  const map = area.closest('map');
  if (!map) return [];
  const names = [map.getAttribute('name'), map.id].filter(name => name);
  return Array.from(
    (area.getRootNode() as ParentNode).querySelectorAll('img[usemap]')
  ).filter(img => {
    const ref = img.getAttribute('usemap') as string;
    return ref.startsWith('#') && names.includes(ref.slice(1));
  });
}

/**
 * Whether an image map area is shown. An area has no box of its own: the
 * HTML rendering rules give it `display: none`, though a browser may not
 * report that. So it counts where an image using its map is shown, as long
 * as nothing makes it inert.
 */
function isAreaShown(area: Element, container: Element): boolean {
  for (
    let node: Element | null = area;
    node && node !== container;
    node = flatParent(node) as Element | null
  ) {
    if (node.hasAttribute('inert')) return false;
  }
  return imagesUsingMapOf(area).some(
    img => isShownUpTo(img, null) && isVisible(img)
  );
}

/**
 * Whether Tab can land on `el`, one of the kinds it visits. A disabled control
 * (including one inside a disabled `<fieldset>`), an inert subtree and
 * anything not rendered are skipped. `visibility` is inherited, so the
 * element's own computed value covers its ancestors.
 */
function isRenderedAndEnabled(el: Element, container: Element): boolean {
  if (el.matches(':disabled')) return false;
  if (el.localName === 'area') return isAreaShown(el, container);
  return isShownUpTo(el, container) && isVisible(el);
}

/** A radio button with a name, which shares one tab stop with its group. */
const isGroupedRadio = (el: Element): el is HTMLInputElement =>
  el.localName === 'input' &&
  (el as HTMLInputElement).type === 'radio' &&
  (el as HTMLInputElement).name !== '';

/** Whether two radio buttons are in one group: same name, form owner and tree. */
const sameGroup = (a: HTMLInputElement, b: Element): b is HTMLInputElement =>
  isGroupedRadio(b) &&
  b.name === a.name &&
  b.form === a.form &&
  b.getRootNode() === a.getRootNode();

/**
 * The checked button of `radio`'s group. The group isn't bounded by the trap,
 * so this looks through the radio's whole tree.
 */
const checkedInGroup = (radio: HTMLInputElement): Element | undefined =>
  Array.from(
    (radio.getRootNode() as ParentNode).querySelectorAll('input:checked')
  ).find(el => sameGroup(radio, el));

/** The flattened-tree ancestors of `node` below the container, outermost first, then `node`. */
function flatChain(node: Node, container: Node): Node[] {
  const chain: Node[] = [];
  for (let n: Node | null = node; n && n !== container; n = flatParent(n)) {
    chain.unshift(n);
  }
  return chain;
}

/**
 * Whether `node` is inside the container in the flattened tree: in it, in a
 * shadow root it holds, or slotted into it. A child of a closed-root host
 * counts as inside wherever the host is, as its slot can't be seen.
 */
function inside(container: Node, node: Node): boolean {
  for (let n: Node | null = node; n; n = flatParent(n)) {
    if (n === container) return true;
  }
  return false;
}

/**
 * `true` when Tab reaches `b` after `a`, which is their order in the
 * flattened tree: a shadow host comes before its shadow root's content, and
 * slotted content comes where its slot is. A closed root's slots can't be
 * seen, so its host's children keep their place in the light DOM. Two
 * flattened-tree siblings are always in one DOM tree, so their document
 * position decides between them.
 */
function follows(container: Element, a: Node, b: Node): boolean {
  const chainA = flatChain(a, container);
  const chainB = flatChain(b, container);
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

/**
 * Every element of a tabbable kind under `el` in the flattened tree, depth
 * first, which is the order Tab visits them. Under a host whose shadow root
 * is closed, that takes in the host's own children instead, rendered or not.
 */
function collectCandidates(
  el: Element,
  out: HTMLElement[] = []
): HTMLElement[] {
  for (const child of flatChildren(el)) {
    if (isTabbableKind(child)) out.push(child as HTMLElement);
    collectCandidates(child, out);
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
 * the group's last one an end, and Tab from the checked one would leave. The
 * group goes by name, form owner and tree, not by the trap, so a checked
 * button outside the container that Tab can land on leaves the group no stop
 * inside. One that Tab can't land on leaves the group as if none were checked.
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
  // Resolved once per group, filed under each of its buttons, since finding
  // the checked one scans the radio's whole tree.
  const groupStops = new Map<Element, HTMLElement | undefined>();
  const groupStop = (radio: HTMLInputElement): HTMLElement | undefined => {
    if (groupStops.has(radio)) return groupStops.get(radio);
    const group = candidates.filter(el => sameGroup(radio, el));
    const on = checkedInGroup(radio);
    const stop =
      on && isTabbableKind(on) && usable(on)
        ? group.find(el => el === on)
        : group.find(usable);
    for (const el of [radio, ...group]) groupStops.set(el, stop);
    return stop;
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
 * The first tab stop inside `container`, found the way the trap finds it, or
 * `null` when there is none. For a component that moves focus into a panel
 * without trapping it there. `src/index.ts` names its exports from this
 * module, so this one stays internal.
 */
export function firstTabStop(container: HTMLElement): HTMLElement | null {
  return findTabStops(container)?.first ?? null;
}

/**
 * The element that has focus in the container's own document (an iframe's,
 * when it renders into one), inside open shadow roots too. Focus inside a
 * closed one reads as its host, which the comparisons above place like any
 * other element. Browsers fall back to <body> when nothing has
 * focus. jsdom, where consumers run their tests, reports nothing once focus
 * was inside a shadow root that was removed, so this falls back for it.
 */
const focusedElement = (doc: Document): Element =>
  getDeepestActiveElement(doc) ?? doc.body;

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
   * The element inside the container to focus when the trap turns on. It has
   * to be one that can take focus, so a heading needs `tabIndex={-1}`. When
   * focusing it doesn't put focus inside the container (the ref is empty, or
   * its element is outside, disabled, hidden or can't take focus), focus goes
   * to the first tab stop inside the container, and to the container itself
   * when there is none.
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
 * does. Content the container renders through a portal lives elsewhere in
 * the DOM, so it is outside the trap: render nested overlays inside the
 * container, or give them a trap of their own. To trap content a `Portal`
 * renders, pass a ref to the element inside the `Portal` as `containerRef`.
 *
 * The trap looks at `containerRef` again each time the component calling it
 * renders. A container that mounts after the trap turns on, such as a panel
 * waiting for a `Portal` target held in state, has it attach once that
 * component renders with the container in the DOM. When the container leaves
 * or is replaced, the trap lets go of it as it would turning off, handing
 * focus back, and attaches to the next one.
 * A child that mounts the container in a render of its own (from its own
 * state, or as a `Suspense` boundary resolves) goes unseen until the
 * component calling the hook renders again. The trap waits for hydration, so
 * that component renders again when the page hydrates, and portaled content,
 * which first appears then, is found.
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
  // Portaled content has no server-rendered counterpart, so a portaled
  // container only exists from the commit after hydration.
  const hydrated = useIsHydrated();
  // The container the trap is attached to, or `null` while it has none.
  const heldRef = useRef<HTMLElement | null>(null);
  // Bumped to run the trap again when the container in the ref changes.
  const [refChanges, setRefChanges] = useState(0);

  useEffect(() => {
    heldRef.current = null;
    if (!active || !hydrated) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;
    heldRef.current = container;
    const doc = container.ownerDocument;

    const opener = focusedElement(doc) as HTMLElement;

    // `initialFocusRef` counts only when focusing it puts focus inside. Focus
    // put outside would stay out, as Tab there never reaches the container's
    // listener, and focusing something that can't take focus (a heading
    // without `tabIndex`, a disabled control) leaves focus where it was.
    const initial = initialFocusRef?.current;
    const inTrap = initial && inside(container, initial) ? initial : null;
    inTrap?.focus();
    if (!inTrap || !inside(container, focusedElement(doc))) {
      (findTabStops(container)?.first ?? container).focus();
    }

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
      // `null` is an object too, and a caller without types can pass it.
      if (restoreFocus && typeof restoreFocus === 'object') {
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
  }, [
    active,
    hydrated,
    containerRef,
    initialFocusRef,
    restoreFocus,
    refChanges,
  ]);

  // Nothing says when a ref is set, so after every render, a ref that no
  // longer matches what the trap holds (a container that mounted, left or was
  // replaced) runs it again. Effects run in order, so whenever the effect
  // above ran in this commit, it read the ref just before this does, and a
  // mismatch means the ref changed in a render it didn't run for. The render
  // a bump asks for runs it, so the two match and the trap settles. An empty
  // ref matches a trap holding nothing, so a container that never mounts
  // costs no render.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- after every render on purpose
  useEffect(() => {
    if (active && hydrated && containerRef.current !== heldRef.current) {
      setRefChanges(n => n + 1);
    }
  });
}
