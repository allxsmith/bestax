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
 * Internal like `focusTabStop`: `src/index.ts` names what it takes from here.
 */
export function isTabbableKind(el: Element): boolean {
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
  /** The stops from one end inward, the last first when `fromLast`. */
  from(fromLast: boolean): Generator<HTMLElement>;
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
  // Checked only as they're reached, and the checks are kept, so finding
  // both ends costs what it did when only the ends were looked for.
  function* from(fromLast: boolean): Generator<HTMLElement> {
    for (let i = 0; i < candidates.length; i++) {
      const el = candidates[fromLast ? candidates.length - 1 - i : i];
      if (isStop(el)) yield el;
    }
  }

  const first = from(false).next().value;
  if (!first) return null;
  return {
    first,
    last: from(true).next().value as HTMLElement,
    stopFor: node => (isGroupedRadio(node) && groupStop(node)) || node,
    from,
  };
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
 * Moves focus to the first tab stop inside `container`, or the last when
 * `fromLast`, and to the container when there is none. Every move a trap
 * makes goes through here: into the container as it opens, to the other end
 * on a wrap, and back in after a Tab the browser carried out.
 *
 * A stop that doesn't take focus is passed over for the next one in. An
 * `<object>` or `<embed>` with nothing to show is one: it counts as a stop by
 * its kind, but browsers refuse to focus it, and which ones they refuse
 * depends on the browser and on what has loaded, so only trying tells. A
 * stop took focus when focus moved, wherever it went (a stop can hand focus
 * on), or when focus was on it already. `src/index.ts` names its exports from
 * this module, so this one stays internal.
 */
export function focusTabStop(container: HTMLElement, fromLast = false): void {
  const doc = container.ownerDocument;
  for (const stop of findTabStops(container)?.from(fromLast) ?? []) {
    const before = focusedElement(doc);
    stop.focus();
    const now = focusedElement(doc);
    if (now !== before || inside(stop, now)) return;
  }
  container.focus();
}

/**
 * Handles a Tab for a trap on `container`. When the browser has no tab stop
 * left in that direction inside the container, focus goes to the stop at the
 * other end and the key is marked used, and with no stops at all the
 * container takes focus. Focus outside the container goes in at that end
 * too. Returns whether it moved focus; otherwise the browser does.
 */
function wrapTab(e: KeyboardEvent, container: HTMLElement): boolean {
  const stops = findTabStops(container);
  if (!stops) {
    e.preventDefault();
    container.focus();
    return true;
  }
  const focused = focusedElement(container.ownerDocument);
  const current = stops.stopFor(focused);
  // Wrap whenever the browser has no stop left in that direction inside the
  // container. Comparing positions rather than testing `=== first` also
  // covers focus resting on the container or on an element outside the tab
  // order, which the browser would otherwise walk straight out of.
  if (
    !inside(container, focused) ||
    (e.shiftKey
      ? !follows(container, stops.first, current)
      : !follows(container, current, stops.last))
  ) {
    e.preventDefault();
    focusTabStop(container, e.shiftKey);
    return true;
  }
  return false;
}

/**
 * Holds Tab inside the element `container` returns until the returned
 * function is called. Tab and Shift+Tab heard on `keyTarget` wrap at the
 * ends, unless something already marked the key used, and if a Tab the trap
 * let through still takes focus out, it sends focus back to the other end.
 *
 * `container` is read each time a key or a focus change arrives, so an
 * overlay whose nodes are remounted while it's open, as moving to another
 * portal target does, stays trapped without attaching again. `holds` is asked
 * on every Tab, and the trap leaves the key alone while it says no. Internal
 * like `focusTabStop`. It's for an overlay that holds Tab from a listener of
 * its own on `window` and asks the overlay stack first, so it stands aside
 * while another overlay is open over it, which a trap listening on the
 * container can't do.
 */
export function trapTab(
  container: () => HTMLElement | null,
  keyTarget: HTMLElement | Window,
  holds: () => boolean = () => true
): () => void {
  // The document focus moves in: the window's own, or the element's.
  const doc =
    'document' in keyTarget ? keyTarget.document : keyTarget.ownerDocument;
  // A window and an element type their listeners differently, so the trap
  // listens through the base type both share.
  const keys: EventTarget = keyTarget;
  // The end focus goes back to if a Tab the trap let the browser handle
  // takes it out (the last for Shift+Tab), held until that Tab has finished
  // moving focus, and `null` otherwise.
  let wrapFromLast: boolean | null = null;
  let wrapTimer: ReturnType<typeof setTimeout> | undefined;

  // `keyTarget` is any target, so the listener takes the base event type.
  const handleKeyDown = (event: Event) => {
    const e = event as KeyboardEvent;
    const box = container();
    // A trap nested inside this one has already wrapped focus.
    if (e.key !== 'Tab' || e.defaultPrevented || !box || !holds()) return;
    if (wrapTab(e, box)) return;
    wrapFromLast = e.shiftKey;
    clearTimeout(wrapTimer);
    wrapTimer = setTimeout(() => {
      wrapFromLast = null;
    });
  };

  // The browser moves focus as soon as the keydown is over, so focus that
  // lands outside while `wrapFromLast` is set got there by that Tab.
  const handleFocusIn = (e: FocusEvent) => {
    const box = container();
    if (wrapFromLast === null || !box) return;
    if (inside(box, e.composedPath()[0] as Node)) return;
    const fromLast = wrapFromLast;
    wrapFromLast = null;
    focusTabStop(box, fromLast);
  };

  keys.addEventListener('keydown', handleKeyDown);
  doc.addEventListener('focusin', handleFocusIn, true);
  return () => {
    keys.removeEventListener('keydown', handleKeyDown);
    doc.removeEventListener('focusin', handleFocusIn, true);
    clearTimeout(wrapTimer);
  };
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
   * The element inside the container to focus when the trap turns on. It has
   * to be one that can take focus, so a heading needs `tabIndex={-1}`. When
   * focusing it doesn't put focus inside the container (the ref is empty, or
   * its element is outside, disabled, hidden or can't take focus), focus goes
   * to the first tab stop inside the container that takes focus, and to the
   * container itself when none does.
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
      focusTabStop(container);
    }

    const releaseTab = trapTab(() => container, container);
    return () => {
      releaseTab();
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
