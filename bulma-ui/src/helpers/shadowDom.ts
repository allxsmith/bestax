/**
 * Event and focus checks that still hold when a component renders inside a
 * shadow root.
 *
 * Code outside a shadow root cannot see into it. A listener on `document`
 * reads an event from inside one with its `target` set to the shadow host,
 * and `document.activeElement` names the host instead of the element that has
 * focus. A component asking either question from `document` then takes a
 * click on its own menu for an outside click, or cannot tell which of its
 * items is focused. A web component or a sandboxed preview puts a component
 * in exactly that position.
 *
 * Focus comes in two questions, and each has its own function here. "Is focus
 * inside me, and on which of my elements?" is `getActiveElementInTree`. "Which
 * element has focus, wherever it is?", the one to record before moving focus
 * away and restore to later, is `getDeepestActiveElement`.
 */

/**
 * Whether `event` happened inside `node`. The event's composed path still
 * holds the element that was really clicked, where a `document` listener
 * reads the shadow host as the event's `target`.
 *
 * @param event - An event read by a listener outside `node`, usually on `document`.
 * @param node - The component's element, or nothing while it is unmounted.
 * @returns True when `node` is on the event's path.
 */
export function isEventInside(
  event: Event,
  node: Node | null | undefined
): boolean {
  return !!node && event.composedPath().includes(node);
}

/**
 * The focused element as `node`'s own tree sees it: its shadow root's
 * `activeElement` when `node` is inside one, `document.activeElement` when it
 * is not. The result is comparable with `node` and its descendants, which
 * live in that same tree, so use it to ask whether focus is inside `node`.
 * Focus inside a shadow root nested within `node` reads as that root's host,
 * which `node` contains.
 *
 * A shadow root with nothing focused inside reports `null`, and a detached
 * node has no document above it. Both fall back to `document.activeElement`,
 * so focus elsewhere on the page still reads as outside `node`.
 *
 * @param node - An element of the component, or nothing while it is unmounted.
 * @returns The focused element in `node`'s tree, or the document's.
 */
export function getActiveElementInTree(
  node: Node | null | undefined
): Element | null {
  const root = node?.getRootNode() as Partial<DocumentOrShadowRoot> | undefined;
  return root?.activeElement ?? document.activeElement;
}

/**
 * The element that really has focus, followed down from
 * `document.activeElement` through every open shadow root on the way. Use it
 * to record where focus was before moving it, so it can be restored to that
 * element later: the tree a component renders into need not be the tree its
 * opener sits in. A closed shadow root cannot be entered, so focus inside one
 * reads as its host.
 *
 * @param doc - The document to start from: the component's own, when it may
 * render into one other than the page's (an iframe's). Defaults to `document`.
 * @returns The focused element, or `null` when the document has none.
 */
export function getDeepestActiveElement(
  doc: Document = document
): Element | null {
  let active = doc.activeElement;
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
}
