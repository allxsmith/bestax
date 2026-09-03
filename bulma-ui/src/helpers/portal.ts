/**
 * Resolves a portal target: an `HTMLElement` is used directly, a `string` is
 * treated as a `document.querySelector` selector (falling back to
 * `document.body` when it matches nothing), and `undefined` resolves to
 * `document.body`.
 *
 * @function resolvePortalContainer
 * @param container - The requested portal target, if any.
 * @returns The resolved DOM node to portal into.
 */
export function resolvePortalContainer(
  container?: string | HTMLElement
): HTMLElement {
  if (container && typeof container !== 'string') {
    return container;
  }
  if (typeof container === 'string') {
    return (
      (document.querySelector(container) as HTMLElement | null) ?? document.body
    );
  }
  return document.body;
}
