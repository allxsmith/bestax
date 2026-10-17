/**
 * Print a parsed (and whitespace-collapsed) tree as JSX text.
 *
 * Every text renders exactly the string it holds. JSX trims a text where it
 * meets a line break, drops a line that is only whitespace, joins the rest
 * with one space, and turns a tab into a space, so a text goes on a line of
 * its own only when that leaves it as it is: a space at either end is
 * written as `{" "}`, and anything else JSX would change (a line break, a
 * tab, two spaces together, all of which only a `<pre>` keeps) goes in as a
 * string, `{"…"}`.
 *
 * An element that fits on one line is printed on one, where JSX keeps every
 * space as written. Characters JSX reads as syntax (`<`, `>`, `{`, `}`, and
 * a `&` that would start an entity) are written as entities.
 */

import {
  jsxAttributes,
  type HtmlNote,
  type JsxAttribute,
  type JsxValue,
} from './attributes.js';
import {
  childrenOf,
  isComment,
  isElement,
  isText,
  NS,
  type HtmlChild,
  type HtmlElement,
  type HtmlParent,
} from './parse.js';

export interface PrintOptions {
  /** Indentation every line starts with. */
  readonly indent: string;
  /** The width lines are fitted to, indentation included. */
  readonly width: number;
  /** Receives everything left out. */
  readonly note: (note: HtmlNote) => void;
  /** A comment to write for a note, in place of or above what it is about. */
  readonly comment?: (note: HtmlNote) => string | undefined;
}

/** A tag JSX can write as an HTML element: lowercase first, no `.` or `:`. */
const JSX_TAG = /^[a-z][\w$-]*$/;

const STEP = '  ';

/** One child of an element, ready to print. */
type Item =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'comment'; readonly text: string }
  | {
      readonly kind: 'element';
      readonly element: HtmlElement;
      readonly attributes: readonly JsxAttribute[];
    };

/**
 * Characters TypeScript reads as whitespace or a line break in JSX text,
 * and trims at a line's edge, where Babel trims only spaces and tabs. As
 * entities, both keep them.
 */
const UNICODE_SPACE =
  /[\v\f\u00a0\u1680\u2000-\u200b\u2028\u2029\u202f\u205f\u3000\ufeff]/g;

/** Escape what JSX text would read as syntax, or trim. */
function escapeText(text: string): string {
  return text
    .replace(/&(?=#\d+;|#x[\da-f]+;|[a-z\d]+;)/gi, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;')
    .replace(UNICODE_SPACE, char =>
      char === '\u00a0' ? '&nbsp;' : `&#x${char.charCodeAt(0).toString(16)};`
    );
}

/** Whether JSX keeps a text as it is when it sits alone on its own line. */
function plainText(text: string): boolean {
  return !/[\t\n\r]| {2}/.test(text);
}

function stringLiteral(text: string): string {
  return JSON.stringify(text);
}

function printValue(value: JsxValue): string {
  switch (value.kind) {
    case 'true':
      return '';
    case 'number':
      return `={${value.value}}`;
    case 'strings':
      return `={[${value.values.map(stringLiteral).join(', ')}]}`;
    case 'style':
      return `={{ ${value.entries
        .map(([key, entry]) => `${styleProperty(key)}: ${stringLiteral(entry)}`)
        .join(', ')} }}`;
    default:
      // A `"` ends the string, and JSX reads entities in one, so either
      // makes it an expression instead; so does a line break, to show it.
      return /["\n\r]|&(?=#\d+;|#x[\da-f]+;|[a-z\d]+;)/i.test(value.value)
        ? `={${stringLiteral(value.value)}}`
        : `="${value.value}"`;
  }
}

/** A style key as an object key: bare when it is an identifier. */
function styleProperty(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : stringLiteral(key);
}

function printAttribute(attribute: JsxAttribute): string {
  return `${attribute.name}${printValue(attribute.value)}`;
}

/** A comment's text as a JSX comment's, which can't hold `*\/`. */
function commentLines(text: string): string[] {
  const lines = text.replace(/\*\//g, '*\\/').split(/\r\n|\n|\r/);
  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  if (lines.length <= 1) return [lines[0]?.trim() ?? ''];
  // Dedent the lines after the first, which starts right after `<!--`.
  const margin = Math.min(
    ...lines
      .slice(1)
      .filter(line => line.trim() !== '')
      .map(line => line.match(/^[ \t]*/)![0].length)
  );
  return [
    lines[0].trim(),
    ...lines.slice(1).map(line => line.slice(margin).trimEnd()),
  ];
}

export class JsxPrinter {
  private readonly oneLine = new Map<object, string | null>();
  /** Each parent's items, built once, so each note is reported once. */
  private readonly built = new Map<object, Item[]>();

  constructor(private readonly options: PrintOptions) {}

  /** The JSX for `root`'s children: one element alone, else a fragment. */
  print(root: HtmlParent): string | null {
    const items = this.items(root);
    if (items.length === 0) return null;
    const { indent } = this.options;
    if (items.length === 1 && items[0].kind === 'element') {
      return this.itemLines(items[0], indent).join('\n');
    }
    return [
      `${indent}<>`,
      ...items.flatMap(item => this.itemLines(item, indent + STEP)),
      `${indent}</>`,
    ].join('\n');
  }

  /**
   * An element's children as items: its text, its comments, and its
   * elements with their props, with a note's comment above whatever it is
   * about, and in place of an element left out.
   */
  private items(parent: HtmlParent): Item[] {
    const cached = this.built.get(parent);
    if (cached) return cached;
    const items: Item[] = [];
    this.built.set(parent, items);
    const commentFor = (note: HtmlNote) => {
      this.options.note(note);
      const text = this.options.comment?.(note);
      if (text !== undefined) items.push({ kind: 'comment', text });
    };
    for (const child of this.childrenOf(parent)) {
      if (isText(child)) {
        items.push({ kind: 'text', value: child.value });
      } else if (isComment(child)) {
        items.push({ kind: 'comment', text: child.data });
      } else if (isElement(child)) {
        const left = this.leftOut(child);
        if (left) {
          commentFor({
            reason: left,
            element: child,
            line: child.sourceCodeLocation?.startLine,
          });
          continue;
        }
        const notes: HtmlNote[] = [];
        const attributes = jsxAttributes(child, note => notes.push(note));
        notes.forEach(commentFor);
        items.push({ kind: 'element', element: child, attributes });
      }
    }
    return items;
  }

  /**
   * The children an element prints. A void element has none to print, and
   * an element with none is written self-closed; a `<textarea>`'s text is
   * its `defaultValue`.
   */
  private childrenOf(parent: HtmlParent): HtmlChild[] {
    return isElement(parent) &&
      parent.namespaceURI === NS.HTML &&
      parent.tagName === 'textarea'
      ? []
      : childrenOf(parent);
  }

  /** Why an element is left out of the JSX, if it is. */
  private leftOut(element: HtmlElement): HtmlNote['reason'] | undefined {
    if (!JSX_TAG.test(element.tagName)) return 'element-name';
    // An SVG `<script>` no more runs from React than an HTML one does.
    if (element.tagName === 'script') return 'script';
    if (element.namespaceURI === NS.HTML && element.tagName === 'noscript') {
      return 'noscript';
    }
    return undefined;
  }

  /** An item on one line, or null when it can't fit on one. */
  private single(item: Item): string | null {
    if (item.kind === 'text') {
      return plainText(item.value)
        ? escapeText(item.value)
        : `{${stringLiteral(item.value)}}`;
    }
    if (item.kind === 'comment') {
      const lines = commentLines(item.text);
      return lines.length === 1 ? `{/* ${lines[0]} */}` : null;
    }
    const cached = this.oneLine.get(item.element);
    if (cached !== undefined) return cached;
    const open = this.openTag(item);
    const children = this.items(item.element);
    let line: string | null;
    if (children.length === 0) {
      line = `${open} />`;
    } else {
      const inner = children.map(child => this.single(child));
      line = inner.every(part => part !== null)
        ? `${open}>${inner.join('')}</${item.element.tagName}>`
        : null;
    }
    // Nothing wider than the line fits at any indent.
    if (line !== null && line.length > this.options.width) line = null;
    this.oneLine.set(item.element, line);
    return line;
  }

  private openTag(item: Extract<Item, { kind: 'element' }>): string {
    return [
      `<${item.element.tagName}`,
      ...item.attributes.map(printAttribute),
    ].join(' ');
  }

  /** An item's lines at `indent`. */
  private itemLines(item: Item, indent: string): string[] {
    const fits = (line: string | null): line is string =>
      line !== null && indent.length + line.length <= this.options.width;
    if (item.kind === 'text') return this.textLines(item.value, indent);
    if (item.kind === 'comment') {
      const lines = commentLines(item.text);
      if (lines.length === 1) return [`${indent}{/* ${lines[0]} */}`];
      return [
        `${indent}{/*`,
        ...lines.map(line => (line ? `${indent}${STEP}${line}` : '')),
        `${indent}*/}`,
      ];
    }
    const single = this.single(item);
    if (fits(single)) return [`${indent}${single}`];
    const children = this.items(item.element);
    const tag = item.element.tagName;
    const open = this.openTag(item);
    const closing = children.length === 0 ? ' />' : '>';
    const head = fits(open + closing)
      ? [`${indent}${open}${closing}`]
      : [
          `${indent}<${tag}`,
          ...item.attributes.flatMap(attribute =>
            this.attributeLines(attribute, indent + STEP)
          ),
          `${indent}${closing.trim()}`,
        ];
    if (children.length === 0) return head;
    return [
      ...head,
      ...children.flatMap(child => this.itemLines(child, indent + STEP)),
      `${indent}</${tag}>`,
    ];
  }

  /** An attribute's lines, breaking a style object that doesn't fit. */
  private attributeLines(attribute: JsxAttribute, indent: string): string[] {
    const line = `${indent}${printAttribute(attribute)}`;
    if (line.length <= this.options.width || attribute.value.kind !== 'style') {
      return [line];
    }
    return [
      `${indent}${attribute.name}={{`,
      ...attribute.value.entries.map(
        ([key, value]) =>
          `${indent}${STEP}${styleProperty(key)}: ${stringLiteral(value)},`
      ),
      `${indent}}}`,
    ];
  }

  /**
   * A text on lines of its own: its end spaces as `{" "}`, and the rest
   * wrapped at its spaces, which JSX joins back with one space each.
   */
  private textLines(text: string, indent: string): string[] {
    if (!plainText(text)) return [`${indent}{${stringLiteral(text)}}`];
    const space = `${indent}{" "}`;
    const body = text.replace(/^ /, '').replace(/ $/, '');
    const lines: string[] = [];
    let line = '';
    for (const word of body.split(' ').map(escapeText)) {
      if (
        line &&
        indent.length + line.length + 1 + word.length > this.options.width
      ) {
        lines.push(`${indent}${line}`);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    if (line) lines.push(`${indent}${line}`);
    return [
      ...(text.startsWith(' ') ? [space] : []),
      ...lines,
      ...(text.endsWith(' ') && body !== '' ? [space] : []),
    ];
  }
}
