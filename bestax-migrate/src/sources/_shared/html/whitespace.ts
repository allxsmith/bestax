/**
 * Collapse a page's whitespace the way CSS renders it, so the JSX carries
 * the spaces that show and none of the indentation that doesn't.
 *
 * Under `white-space: normal` a browser renders each run of spaces, tabs and
 * line breaks as one space, and none at all at the start or end of a line.
 * A box that sits on lines of its own starts and ends them, and so do the
 * edges of a block container; in a flex, grid or table container every child
 * is a box of its own, so the same goes for each of them. This pass applies
 * exactly that to the parsed tree, one text node at a time:
 *
 *   - every run in a text becomes one space;
 *   - a text made only of whitespace is dropped where a line starts or ends
 *     on either side of it, and is one space otherwise;
 *   - any other text loses its space on a side where a line starts or ends.
 *
 * Each step is one CSS takes too, so the page renders as it did. The point
 * is the JSX: a kept space is a `{" "}`, and one beside a block would stop
 * the bulma-classes planner folding an element into its only child.
 *
 * A side counts as a line's edge only when every display its box could
 * have makes it one. A comment and a box that never renders (`<script>`)
 * are not boxes, so the side reaches past them. A box that is only
 * sometimes shown (`hidden`) is no edge, since when it is hidden the text on
 * either side of it runs together. Whitespace inside `<pre>`, `<textarea>`,
 * a box whose own style preserves it, and a box that never renders is left
 * exactly as written.
 *
 * Besides display (see `display.ts`), one more thing author CSS can tell
 * apart: an element whose only content was whitespace now matches `:empty`.
 */

import type { Display } from './display.js';
import {
  attributeOf,
  childrenOf,
  isComment,
  isElement,
  isText,
  NS,
  type HtmlElement,
  type HtmlParent,
} from './parse.js';
import { styleValues } from './style.js';

/** The whitespace CSS collapses: spaces, tabs and line breaks. */
const RUN = /[ \t\n\r]+/g;
const ONLY_RUNS = /^[ \t\n\r]*$/;

/** Elements whose content keeps its whitespace as written. */
const PREFORMATTED = new Set([
  'listing',
  'plaintext',
  'pre',
  'textarea',
  'xmp',
]);

/** Whether an element keeps the whitespace inside it as written. */
export function preservesWhitespace(element: HtmlElement): boolean {
  if (element.namespaceURI === NS.HTML && PREFORMATTED.has(element.tagName)) {
    return true;
  }
  if (attributeOf(element, 'xml:space') === 'preserve') return true;
  const style = attributeOf(element, 'style');
  return (
    styleValues(style, 'white-space').some(
      value => !/^(?:normal|nowrap)\b/.test(value)
    ) ||
    styleValues(style, 'white-space-collapse').some(
      value => !/^collapse\b/.test(value)
    )
  );
}

/**
 * Collapse the whitespace in `root`'s subtree in place. `inside` is how the
 * root lays out its children, and `displayOf` gives each element's display.
 */
export function collapseWhitespace(
  root: HtmlParent,
  inside: Display['inside'],
  displayOf: (element: HtmlElement) => Display
): void {
  const children = childrenOf(root);
  const boxes = children.map(child =>
    isElement(child) ? displayOf(child) : undefined
  );
  // Whether a line starts or ends on this side of the child at `index`,
  // before anything visible. Whitespace alone is never visible: it would
  // only collapse into the space beside it.
  const edge = (index: number, step: 1 | -1): boolean => {
    for (let at = index + step; at >= 0 && at < children.length; at += step) {
      const child = children[at];
      const box = boxes[at];
      if (isComment(child) || box?.shown === 'never') continue;
      if (isText(child) && ONLY_RUNS.test(child.value)) continue;
      if (!box) return false;
      return (
        box.shown === 'always' &&
        (box.outside === 'block' || inside === 'items')
      );
    }
    return inside !== 'inline';
  };
  const kept = children.filter((child, index) => {
    if (isText(child)) {
      const before = edge(index, -1);
      const after = edge(index, 1);
      if (ONLY_RUNS.test(child.value)) {
        if (before || after) return false;
        child.value = ' ';
        return true;
      }
      let value = child.value.replace(RUN, ' ');
      if (before) value = value.replace(/^ /, '');
      if (after) value = value.replace(/ $/, '');
      child.value = value;
      return true;
    }
    const box = boxes[index];
    if (
      isElement(child) &&
      box!.shown !== 'never' &&
      !preservesWhitespace(child)
    ) {
      collapseWhitespace(child, box!.inside, displayOf);
    }
    return true;
  });
  children.splice(0, children.length, ...kept);
}
