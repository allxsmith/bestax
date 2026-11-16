// INTERNAL: deliberately not exported from src/index.ts.

/**
 * A length in pixels: a number is pixels already, and a string can be `px`
 * or `rem`, given a rem's pixels. Anything else, or nothing, is `null`.
 */
export function lengthToPx(
  length: number | string | undefined,
  remPx: number
): number | null {
  if (typeof length === 'number') return length;
  // The number's two shapes don't overlap, so a long run of digits that
  // doesn't match fails in one pass.
  const match = /^\s*(\d+(?:\.\d+)?|\.\d+)\s*(px|rem)\s*$/.exec(length ?? '');
  if (!match) return null;
  return parseFloat(match[1]) * (match[2] === 'rem' ? remPx : 1);
}

/**
 * A rem in pixels, as the page `el` is in has it now, or Bulma's 16 when the
 * page gives none.
 */
export function remPxOf(el: Element): number {
  return (
    parseFloat(getComputedStyle(el.ownerDocument.documentElement).fontSize) ||
    16
  );
}
