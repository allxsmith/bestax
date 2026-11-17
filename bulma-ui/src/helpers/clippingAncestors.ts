import { flatParent } from './shadowDom';

/** An ancestor that clips what overflows it, and which ways it does. */
export interface Clipper {
  /** The ancestor. */
  element: Element;
  /** Its computed style. */
  style: CSSStyleDeclaration;
  /** Whether it clips what overflows it sideways. */
  clipsX: boolean;
  /** Whether it clips what overflows it up and down. */
  clipsY: boolean;
}

/** Whether an `overflow-x` or `overflow-y` value clips what overflows. */
export const clipsOverflow = (value: string): boolean =>
  /auto|scroll|hidden|clip/.test(value);

/**
 * Whether an `overflow-x` or `overflow-y` value lets the reader scroll what
 * overflows into view.
 */
export const scrollsOverflow = (value: string): boolean =>
  /auto|scroll/.test(value);

/**
 * The ancestors that clip what `element` draws, nearest first, each one in
 * the flattened tree, through slots and shadow roots, that clips what
 * overflows it one way or both. Only an ancestor the element is laid out in
 * clips it: a fixed element is laid out in the viewport, and an absolutely
 * positioned one in its nearest positioned ancestor, unless an ancestor on
 * the way holds it as `holdsPositioned` says, so it escapes every ancestor in
 * between. An ancestor with no box, as a slot is by default, clips nothing.
 *
 * It stops below `<body>`, whose overflow is the viewport's, unless
 * `throughBody` is set and `<html>` clips what overflows it, when `<body>`
 * scrolls on its own and counts like any other ancestor.
 *
 * @param element - The element to look above.
 * @param options - `throughBody` to take in `<body>` when it scrolls on its own.
 * @returns The ancestors that clip it, nearest first, as they're found.
 */
export function* clippingAncestors(
  element: Element,
  { throughBody = false }: { throughBody?: boolean } = {}
): Generator<Clipper> {
  const doc = element.ownerDocument;
  const page = throughBody ? getComputedStyle(doc.documentElement) : null;
  const top =
    page && (clipsOverflow(page.overflowX) || clipsOverflow(page.overflowY))
      ? doc.documentElement
      : doc.body;
  // How the element, or the last ancestor it's laid out in, is positioned.
  let position = getComputedStyle(element).position;
  for (
    let node = flatParent(element) as Element | null;
    node && node !== top && node !== doc.documentElement;
    node = flatParent(node) as Element | null
  ) {
    if (node.getClientRects().length === 0) continue;
    const style = getComputedStyle(node);
    const holds =
      position === 'fixed'
        ? holdsPositioned(style)
        : position !== 'absolute' ||
          style.position !== 'static' ||
          holdsPositioned(style);
    if (!holds) continue;
    position = style.position;
    // Each axis clips on its own: `overflow-x: clip` leaves the other one
    // visible.
    const clipsX = clipsOverflow(style.overflowX);
    const clipsY = clipsOverflow(style.overflowY);
    if (clipsX || clipsY) yield { element: node, style, clipsX, clipsY };
  }
}

/**
 * Whether an element holds its fixed and absolutely positioned descendants
 * whatever its own position, as a transform, a perspective, a filter, layout
 * or paint containment, a size container or a `will-change` naming one of
 * them makes it.
 */
const holdsPositioned = (style: CSSStyleDeclaration): boolean =>
  [
    style.transform,
    style.translate,
    style.scale,
    style.rotate,
    style.perspective,
    style.filter,
  ].some(value => !!value && value !== 'none') ||
  (!!style.containerType && style.containerType !== 'normal') ||
  /transform|translate|scale|rotate|perspective|filter/.test(
    style.willChange ?? ''
  ) ||
  /paint|layout|strict|content/.test(style.contain ?? '');
