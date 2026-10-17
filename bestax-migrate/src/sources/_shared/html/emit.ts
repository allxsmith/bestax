/**
 * A parsed HTML tree → JSX source, laid out the way the HTML was.
 *
 * Each element keeps its tag (SVG's with the casing parse5 restores, so
 * `foreignObject`), its attributes become props (`attributes.ts`), and its
 * children follow the source's own lines: a run of whitespace with a line
 * break in it is a line break in the JSX, at two spaces an indent. JSX drops
 * such a run, so where the run renders (`whitespace.ts`) and a line break
 * would lose it, the space is written out as `{" "}`; between two texts JSX
 * joins the lines with a space already. Preformatted content is written on
 * the lines it has, with a template literal for text that spans several, and
 * a script's or stylesheet's text is always one.
 *
 * Void elements close themselves, and so does an element with nothing left
 * in it. A comment becomes a JSX comment, except Internet Explorer's
 * conditional ones, which no supported browser reads. What can't be written
 * as it was is reported, with the HTML line it is on, for the caller to turn
 * into TODOs: `HtmlIssue` lists the kinds, and which of them are emitted.
 */

import {
  convertAttributes,
  isCustomElement,
  printProp,
  type HtmlIssue,
} from './attributes.js';
import {
  isComment,
  type CommentNode,
  type Element,
  type ParentNode,
} from './parse.js';
import {
  isConditionalComment,
  jsxComment,
  jsxText,
  templateLiteral,
} from './text.js';
import {
  defaultDisplayOf,
  layoutWhitespace,
  type DisplayOf,
  type Piece,
} from './whitespace.js';

export interface EmitOptions {
  /** Each element's CSS display; the HTML UA stylesheet's by default. */
  displayOf?: DisplayOf;
  /**
   * Indent levels to start every line at, for code that goes inside more
   * code (a component's `return (…)`). Indenting the result afterwards
   * would change a multi-line template literal's text, so it is done here,
   * where those lines are known.
   */
  indent?: number;
}

export interface Reported extends HtmlIssue {
  /** The 1-based HTML line it is on, when the node has a location. */
  line: number | null;
}

export interface Emitted {
  /** One JSX expression: the content's only element, or a fragment. */
  code: string;
  /**
   * The HTML line an emitted line (1-based) came from, or null for a line
   * the emitter wrote itself (a fragment's tags) or a node with no location.
   */
  htmlLineOf(line: number): number | null;
  reported: Reported[];
}

const HTML = 'http://www.w3.org/1999/xhtml';

const VOID = new Set([
  'area',
  'base',
  'basefont',
  'bgsound',
  'br',
  'col',
  'embed',
  'frame',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/** Elements whose text is code, never markup. */
const RAW_TEXT = new Set(['script', 'style']);

/** The current elements of the HTML standard. */
const KNOWN = new Set(
  (
    'a abbr address area article aside audio b base bdi bdo blockquote body ' +
    'br button canvas caption cite code col colgroup data datalist dd del ' +
    'details dfn dialog div dl dt em embed fieldset figcaption figure footer ' +
    'form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ' +
    'ins kbd label legend li link main map mark menu meta meter nav noscript ' +
    'object ol optgroup option output p picture pre progress q rp rt ruby s ' +
    'samp script search section select selectedcontent slot small source ' +
    'span strong style sub summary sup table tbody td template textarea ' +
    'tfoot th thead time title tr track u ul var video wbr'
  ).split(' ')
);

/** Its obsolete ones, which still parse. */
const OBSOLETE = new Set(
  (
    'acronym applet basefont bgsound big blink center dir font frame ' +
    'frameset isindex keygen listing marquee menuitem multicol nextid nobr ' +
    'noembed noframes param plaintext rb rtc spacer strike tt xmp'
  ).split(' ')
);

/** A tag JSX reads as an intrinsic element: lowercase first, no `.` or `:`. */
const JSX_TAG = /^[a-z][\w$-]*$/;

const INDENT = '  ';

interface Line {
  /** Its indent, or null for a template literal's own line, which has none. */
  depth: number | null;
  text: string;
  html: number | null;
}

/** Lines of output, each write going on the end of the open one. */
class Writer {
  readonly lines: Line[] = [];
  private open: Line | null = null;

  /**
   * Write on the open line, or open one at `depth`. A line break in `text`
   * (a template literal's) is kept as it is, with no indent after it.
   */
  write(text: string, depth: number, html: number | null): void {
    const [first, ...rest] = text.split('\n');
    if (!this.open) {
      this.open = { depth, text: '', html };
      this.lines.push(this.open);
    }
    this.open.text += first;
    this.open.html ??= html;
    rest.forEach((part, index) => {
      this.open = {
        depth: null,
        text: part,
        html: html === null ? null : html + index + 1,
      };
      this.lines.push(this.open);
    });
  }

  /** End the line; the next write starts a new one. */
  break(): void {
    this.open = null;
  }

  blank(): void {
    this.break();
    this.lines.push({ depth: 0, text: '', html: null });
  }
}

/** What an element's children are written as, between its tags. */
type Item =
  | { kind: 'node'; node: Element | CommentNode }
  | { kind: 'text'; text: string; line: number | null }
  /** A run of whitespace with a line break: one space when `kept`. */
  | { kind: 'break'; kept: boolean; blank: boolean };

/**
 * Pieces as items: words and the spaces between them on one line joined
 * into texts, a run with a line break in it as a break, and a run that
 * renders nothing on one line dropped.
 */
function itemsOf(pieces: Piece[]): Item[] {
  const items: Item[] = [];
  for (const piece of pieces) {
    const last = items[items.length - 1];
    if (piece.kind === 'node') {
      items.push({ kind: 'node', node: piece.node });
    } else if (piece.kind === 'space' && piece.newlines > 0) {
      const blank = piece.newlines > 1;
      // Two runs meet where a dropped comment was between them.
      if (last?.kind === 'break') {
        last.kept ||= piece.kept;
        last.blank ||= blank;
      } else {
        items.push({ kind: 'break', kept: piece.kept, blank });
      }
    } else if (piece.kind !== 'space' || piece.kept) {
      const text = piece.kind === 'space' ? ' ' : piece.text;
      if (last?.kind === 'text') last.text += text;
      else items.push({ kind: 'text', text, line: piece.line });
    }
  }
  return items;
}

/**
 * Items that run over several lines, given a line break at each end too, so
 * the tags sit on lines of their own. JSX drops a line break beside a tag,
 * so that changes nothing, except that a space a text starts or ends with
 * would go with it: that space becomes the break's.
 */
function framed(items: Item[]): Item[] {
  if (!items.some(item => item.kind === 'break')) return items;
  const out = [...items];
  const edge = (at: 'start' | 'end') => {
    const index = at === 'start' ? 0 : out.length - 1;
    const item = out[index];
    if (item.kind === 'break') return;
    let kept = false;
    if (item.kind === 'text') {
      const space = at === 'start' ? /^ / : / $/;
      kept = space.test(item.text);
      const text = item.text.replace(space, '');
      if (text === '') out.splice(index, 1);
      else out[index] = { ...item, text };
    }
    const added: Item = { kind: 'break', kept, blank: false };
    if (at === 'start') out.unshift(added);
    else out.push(added);
  };
  edge('start');
  edge('end');
  return out;
}

export function emitJsx(root: ParentNode, options: EmitOptions = {}): Emitted {
  const layout = layoutWhitespace(root, options.displayOf ?? defaultDisplayOf);
  const out = new Writer();
  const reported: Reported[] = [];
  const report = (issue: HtmlIssue, line: number | null) => {
    reported.push({ ...issue, line });
  };

  /** A parent's pieces, minus (and reporting) the comments no browser reads. */
  const piecesOf = (parent: ParentNode): Piece[] =>
    (layout.get(parent) ?? []).filter(piece => {
      if (piece.kind !== 'node' || !isComment(piece.node)) return true;
      if (!isConditionalComment(piece.node.data)) return true;
      report(
        { kind: 'conditional-comment', token: 'comment' },
        piece.node.sourceCodeLocation?.startLine ?? null
      );
      return false;
    });

  const comment = (node: CommentNode, depth: number) => {
    const line = node.sourceCodeLocation?.startLine ?? null;
    jsxComment(node.data).forEach((text, index) => {
      if (index > 0) out.break();
      out.write(text, depth, line);
    });
  };

  /** Preformatted children: every character, on the lines it has. */
  const exact = (parent: Element, pieces: Piece[], depth: number) => {
    for (const piece of pieces) {
      if (piece.kind === 'node') {
        if (isComment(piece.node)) comment(piece.node, depth);
        else element(piece.node, depth);
      } else if (piece.kind === 'exact' && piece.text !== '') {
        const literal =
          RAW_TEXT.has(parent.tagName) || piece.text.includes('\n');
        out.write(
          literal ? `{${templateLiteral(piece.text)}}` : jsxText(piece.text),
          depth,
          piece.line
        );
      }
    }
  };

  /** Children laid out on the source's lines, one indent in from `depth`. */
  const flow = (items: Item[], depth: number): void => {
    items.forEach((item, index) => {
      if (item.kind === 'break') {
        const before = items[index - 1];
        const after = items[index + 1];
        const betweenTexts = before?.kind === 'text' && after?.kind === 'text';
        // JSX joins two texts across a line break with a space, so a run
        // that renders nothing between them stays on one line.
        if (betweenTexts && !item.kept) return;
        if (item.kept && !betweenTexts) out.write('{" "}', depth + 1, null);
        if (item.blank && before && after) out.blank();
        out.break();
      } else if (item.kind === 'text') {
        out.write(jsxText(item.text), depth + 1, item.line);
      } else if (isComment(item.node)) {
        comment(item.node, depth + 1);
      } else {
        element(item.node, depth + 1);
      }
    });
  };

  /** Report an element that is written as it was but isn't plain HTML. */
  const reportElement = (node: Element, line: number | null) => {
    if (node.namespaceURI !== HTML) return;
    const tag = node.tagName;
    if (tag === 'template') {
      report({ kind: 'template', token: tag }, line);
    } else if (tag.includes('-') && isCustomElement(node)) {
      report({ kind: 'custom-element', token: tag }, line);
    } else if (OBSOLETE.has(tag)) {
      report({ kind: 'obsolete-element', token: tag }, line);
    } else if (!KNOWN.has(tag)) {
      report({ kind: 'unknown-element', token: tag }, line);
    }
  };

  const element = (node: Element, depth: number): void => {
    const tag = node.tagName;
    const location = node.sourceCodeLocation;
    const line = location?.startLine ?? null;
    const pieces = piecesOf(node);
    if (!JSX_TAG.test(tag)) {
      // Nothing can name it, so its children are written in its place.
      report({ kind: 'element-name', token: tag }, line);
      flow(itemsOf(pieces), depth - 1);
      return;
    }
    reportElement(node, line);

    const { props, issues } = convertAttributes(node);
    for (const issue of issues) {
      const at = issue.attribute && location?.attrs?.[issue.attribute];
      report(issue, at ? at.startLine : line);
    }
    const preformatted = pieces.some(piece => piece.kind === 'exact');
    const items = preformatted ? [] : framed(itemsOf(pieces));
    const empty =
      VOID.has(tag) ||
      tag === 'textarea' ||
      pieces.every(
        piece =>
          (piece.kind === 'space' && !piece.kept) ||
          (piece.kind === 'exact' && piece.text === '')
      );

    const startTag = location?.startTag;
    const tall =
      props.length > 1 &&
      startTag !== undefined &&
      startTag.endLine > startTag.startLine;
    out.write(`<${tag}`, depth, line);
    for (const prop of props) {
      const at = location?.attrs?.[prop.attribute]?.startLine ?? line;
      if (tall) {
        out.break();
        out.write(printProp(prop), depth + 1, at);
      } else {
        out.write(` ${printProp(prop)}`, depth, at);
      }
    }
    if (tall) out.break();
    const close = tall ? '' : ' ';
    out.write(empty ? `${close}/>` : '>', depth, startTag?.endLine ?? line);
    if (empty) return;

    if (preformatted) exact(node, pieces, depth);
    else flow(items, depth);
    const end = location?.endTag?.startLine ?? location?.endLine ?? null;
    out.write(`</${tag}>`, depth, end);
  };

  const items = itemsOf(piecesOf(root));
  const content = items.filter(item => item.kind !== 'break');
  const only = content.length === 1 ? content[0] : undefined;
  if (only?.kind === 'node' && !isComment(only.node)) {
    element(only.node, 0);
  } else {
    // A block holds the content, so whitespace at either end renders
    // nothing, and the fragment's tags can sit on lines of their own.
    while (items[0]?.kind === 'break') items.shift();
    while (items[items.length - 1]?.kind === 'break') items.pop();
    out.write('<>', 0, null);
    if (items.length > 0) {
      out.break();
      flow(items, 0);
      out.break();
    }
    out.write('</>', 0, null);
  }

  const base = options.indent ?? 0;
  const code = out.lines
    .map(entry =>
      entry.depth === null || entry.text === ''
        ? entry.text
        : INDENT.repeat(base + entry.depth) + entry.text
    )
    .join('\n');
  return {
    code,
    htmlLineOf: line => out.lines[line - 1]?.html ?? null,
    reported,
  };
}
