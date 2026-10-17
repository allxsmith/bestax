/**
 * HTML to JSX: a page or a partial in, its body as JSX text out.
 *
 * Library-agnostic. The JSX renders the DOM the page's own body parsed to,
 * up to the whitespace CSS would not render anyway (see `whitespace.ts`),
 * and it is plain JSX, so a source's transform can run on it as it runs on
 * any component. What React cannot carry comes back as notes, and a caller
 * that wants a comment for one in the JSX passes `comment`.
 *
 * The tree in the result has been collapsed in place, so a caller reading
 * the `<head>` or the `<body>`'s attributes after this sees the same tree
 * the JSX came from.
 */

import type { HtmlNote } from './attributes.js';
import { BLOCK, displayOf, type Display, type DisplayOf } from './display.js';
import { parseHtml, type ParsedHtml } from './parse.js';
import { JsxPrinter } from './print.js';
import { collapseWhitespace } from './whitespace.js';

export interface HtmlToJsxOptions {
  /** Read the text as a whole document or a partial; by default, as it looks. */
  readonly kind?: ParsedHtml['kind'];
  /** The display a library's classes give an element, beyond its tag's. */
  readonly display?: DisplayOf;
  /** Indentation every line of the JSX starts with. */
  readonly indent?: string;
  /** The width the JSX is fitted to. */
  readonly width?: number;
  /** A comment to write in the JSX for a note, beside what it is about. */
  readonly comment?: (note: HtmlNote) => string | undefined;
}

export interface HtmlToJsxResult extends ParsedHtml {
  /** The body's content as one JSX expression, or null when it has none. */
  readonly jsx: string | null;
  /** What was left out of the JSX, in the order it appears. */
  readonly notes: readonly HtmlNote[];
}

/**
 * How the JSX's root lays out its content. A page's body becomes the
 * content of the element the app renders it into, a block. A partial could
 * be included anywhere, even mid-line, so the spaces at its own edges stay.
 */
export function rootInside(kind: ParsedHtml['kind']): Display['inside'] {
  return kind === 'document' ? BLOCK.inside : 'inline';
}

export function htmlToJsx(
  source: string,
  options: HtmlToJsxOptions = {}
): HtmlToJsxResult {
  const parsed = parseHtml(source, options.kind);
  collapseWhitespace(parsed.body, rootInside(parsed.kind), element =>
    displayOf(element, options.display)
  );
  const notes: HtmlNote[] = [];
  const jsx = new JsxPrinter({
    indent: options.indent ?? '',
    width: options.width ?? 80,
    note: note => notes.push(note),
    comment: options.comment,
  }).print(parsed.body);
  // Reported as the printer reaches them, which is not reading order.
  notes.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
  return { ...parsed, jsx, notes };
}
