/**
 * Resolves a portal target: an `HTMLElement` is used directly, a non-empty
 * `string` is treated as a `document.querySelector` selector (falling back to
 * `document.body` when it matches nothing), and any falsy value — `undefined`
 * or the empty string — resolves to `document.body`.
 *
 * The empty string is deliberately treated as "no target" rather than passed
 * through: `document.querySelector('')` throws a `SyntaxError`, and callers
 * building a selector from state can easily hand us `''`.
 *
 * @function resolvePortalContainer
 * @param container - The requested portal target, if any.
 * @returns The resolved DOM node to portal into.
 */
export function resolvePortalContainer(
  container?: string | HTMLElement
): HTMLElement {
  if (!container) {
    return document.body;
  }
  if (typeof container === 'string') {
    return (
      (document.querySelector(container) as HTMLElement | null) ?? document.body
    );
  }
  return container;
}
