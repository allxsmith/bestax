/**
 * An HTML element's attributes as the JSX props React renders back to them.
 *
 * Names and kinds come from `property-information`, the table
 * `hast-util-to-jsx-runtime` and MDX build JSX from: `class` is `className`,
 * `for` is `htmlFor`, `tabindex` is the number `tabIndex`, a boolean is
 * bare, and SVG keeps its casing (`viewBox`, `strokeWidth`, `xlinkHref`).
 * What it doesn't cover is React's own and written here: `style` is an
 * object, and a form control's starting state is `defaultValue` or
 * `defaultChecked`, since `value` and `checked` would make it controlled.
 *
 * An attribute React cannot carry is left out and reported as an
 * `HtmlNote`, never dropped quietly: an `onclick` holds code where React
 * wants a function, React blocks a `javascript:` URL, JSX cannot spell
 * `@click`, and React keeps `key` and `ref` for itself.
 */

import {
  find,
  hastToReact,
  html as htmlSchema,
  svg as svgSchema,
} from 'property-information';
import {
  attributeOf,
  childrenOf,
  isElement,
  isText,
  NS,
  type HtmlElement,
  type HtmlNode,
} from './parse.js';
import { parseStyle, styleKey } from './style.js';

/** Why the converter left something out. */
export type NoteReason =
  /** An `on…` attribute: code in a string, where React takes a function. */
  | 'event-handler'
  /** A `javascript:` URL, which React replaces with one that throws. */
  | 'javascript-url'
  /** An attribute name JSX cannot spell (`@click`, `:class`). */
  | 'attribute-name'
  /**
   * An attribute name React reads itself: `key`, `ref`, `children`, and a
   * `value` on a `<textarea>` or `<select>`, which React would show in place
   * of what the page shows.
   */
  | 'reserved-name'
  /** A style declaration marked `!important`, which a style object can't say. */
  | 'style-important'
  /** Text in a `style` that is not a declaration. */
  | 'style-invalid'
  /** A property a `style` gives twice, of which a style object keeps the last. */
  | 'style-repeated'
  /** A `<script>`, which React would never run. */
  | 'script'
  /** A `<noscript>`, whose content React never renders. */
  | 'noscript'
  /** A tag name JSX cannot spell. */
  | 'element-name';

export interface HtmlNote {
  readonly reason: NoteReason;
  /** The element the attribute was on, or the element left out. */
  readonly element: HtmlElement;
  /** The attribute or declaration, as written. */
  readonly text?: string;
  readonly line?: number;
}

export type JsxValue =
  | { readonly kind: 'string'; readonly value: string }
  | { readonly kind: 'true' }
  | { readonly kind: 'number'; readonly value: number }
  | {
      readonly kind: 'style';
      readonly entries: ReadonlyArray<readonly [string, string]>;
    }
  | { readonly kind: 'strings'; readonly values: readonly string[] };

export interface JsxAttribute {
  readonly name: string;
  readonly value: JsxValue;
}

/**
 * The `<input>` types whose `value` is not what the user types, so React
 * takes it as it is (a button's label, a checkbox's submitted value).
 */
const FIXED_VALUE = new Set([
  'button',
  'checkbox',
  'hidden',
  'image',
  'radio',
  'reset',
  'submit',
]);

/** Prop names React reads itself and never renders. */
const REACT_OWN = new Set(['children', 'key', 'ref']);

/** The names a JSX attribute can have: an identifier that may hold `-`. */
const JSX_NAME = /^[A-Za-z_$][\w$-]*$/;

/** The props React checks for a `javascript:` URL. */
const URL_PROPS = new Set(['action', 'formAction', 'href', 'src', 'xlinkHref']);

/**
 * A URL React would block: `javascript:` after any leading control
 * characters and spaces, with tabs and line breaks anywhere in it.
 */
function isJavascriptUrl(value: string): boolean {
  let start = 0;
  while (start < value.length && value.charCodeAt(start) <= 0x20) start += 1;
  return /^javascript:/i.test(value.slice(start).replace(/[\t\n\r]/g, ''));
}

/** A number written the way React writes it back, or undefined. */
function asNumber(value: string): number | undefined {
  const number = Number(value);
  return value !== '' && Number.isFinite(number) && String(number) === value
    ? number
    : undefined;
}

/** The text inside a node, as the DOM's `textContent` reads it. */
function textContent(node: HtmlNode): string {
  if (isText(node)) return node.value;
  return 'childNodes' in node
    ? childrenOf(node as HtmlElement)
        .map(textContent)
        .join('')
    : '';
}

/** The `<select>` an `<option>` belongs to, directly or through an `<optgroup>`. */
function selectOf(option: HtmlElement): HtmlElement | undefined {
  let parent = option.parentNode;
  if (parent && isElement(parent) && parent.tagName === 'optgroup') {
    parent = parent.parentNode;
  }
  return parent && isElement(parent) && parent.tagName === 'select'
    ? parent
    : undefined;
}

/** A `<select>`'s options, its own and those in its `<optgroup>`s. */
function optionsOf(select: HtmlElement): HtmlElement[] {
  return select.childNodes.filter(isElement).flatMap(child => {
    if (child.tagName === 'option') return [child];
    if (child.tagName !== 'optgroup') return [];
    return child.childNodes
      .filter(isElement)
      .filter(option => option.tagName === 'option');
  });
}

/**
 * An option's value: its `value`, or its text with its ASCII whitespace
 * stripped and collapsed, as the HTML standard reads it. A non-breaking
 * space stays, as it does in the text React matches the value against.
 */
function optionValue(option: HtmlElement): string {
  return (
    attributeOf(option, 'value') ??
    textContent(option)
      .replace(/[ \t\n\f\r]+/g, ' ')
      .replace(/^ | $/g, '')
  );
}

/**
 * The JSX props for an element's attributes, in the order written, with
 * each one left out passed to `note`.
 */
export function jsxAttributes(
  element: HtmlElement,
  note: (note: HtmlNote) => void
): JsxAttribute[] {
  const attributes: JsxAttribute[] = [];
  const html = element.namespaceURI === NS.HTML;
  // A custom element takes its attributes as written; React renders them so.
  const custom = html && element.tagName.includes('-');
  const schema = element.namespaceURI === NS.SVG ? svgSchema : htmlSchema;
  const tag = html ? element.tagName : '';
  const inputType = (attributeOf(element, 'type') ?? 'text').toLowerCase();
  const location = element.sourceCodeLocation;
  const report = (reason: NoteReason, text: string, attribute: string) =>
    note({
      reason,
      element,
      text,
      line: location?.attrs?.[attribute]?.startLine ?? location?.startLine,
    });

  for (const attribute of element.attrs) {
    const written = attribute.prefix
      ? `${attribute.prefix}:${attribute.name}`
      : attribute.name;
    const value = attribute.value;
    const asWritten = `${written}="${value}"`;
    if (/^on/i.test(written)) {
      report('event-handler', asWritten, written);
      continue;
    }
    if (written === 'class') {
      attributes.push({
        name: 'className',
        value: {
          kind: 'string',
          value: value
            .split(/[ \t\n\f\r]+/)
            .filter(Boolean)
            .join(' '),
        },
      });
      continue;
    }
    if (written === 'style') {
      const style = parseStyle(value);
      for (const text of style.invalid) report('style-invalid', text, written);
      const entries = new Map<string, string>();
      const writtenAs = new Map<string, string>();
      for (const declaration of style.declarations) {
        const text = `${declaration.property}: ${declaration.value}`;
        if (declaration.important) {
          report('style-important', `${text} !important`, written);
          continue;
        }
        const key = styleKey(declaration.property);
        if (entries.has(key)) {
          report('style-repeated', writtenAs.get(key)!, written);
        }
        entries.set(key, declaration.value);
        writtenAs.set(key, text);
      }
      if (entries.size > 0) {
        attributes.push({
          name: 'style',
          value: { kind: 'style', entries: [...entries] },
        });
      }
      continue;
    }

    let name = written;
    let jsx: JsxValue = { kind: 'string', value };
    if (!custom) {
      const info = find(schema, written);
      // Known to the table under this very name, not just matched by its
      // property's (an attribute spelled `htmlfor` is not `for`).
      if (
        info.space &&
        info.attribute.toLowerCase() === written.toLowerCase()
      ) {
        name = hastToReact[info.property] ?? info.property;
      }
      const number = info.number ? asNumber(value) : undefined;
      if (
        info.boolean ||
        (info.overloadedBoolean &&
          (value === '' || value.toLowerCase() === written.toLowerCase()))
      ) {
        jsx = { kind: 'true' };
      } else if (number !== undefined) {
        jsx = { kind: 'number', value: number };
      }
    }
    if (tag === 'input' && name === 'value' && !FIXED_VALUE.has(inputType)) {
      name = 'defaultValue';
    } else if (tag === 'input' && name === 'checked') {
      name = 'defaultChecked';
    } else if (tag === 'option' && name === 'selected' && selectOf(element)) {
      // The `<select>` carries it, as its `defaultValue`.
      continue;
    }
    if (!JSX_NAME.test(name)) {
      report('attribute-name', asWritten, written);
    } else if (
      REACT_OWN.has(name) ||
      // The page ignores it; React would show it in place of the content.
      ((tag === 'textarea' || tag === 'select') && name === 'value')
    ) {
      report('reserved-name', asWritten, written);
    } else if (URL_PROPS.has(name) && isJavascriptUrl(value)) {
      report('javascript-url', asWritten, written);
    } else {
      attributes.push({ name, value: jsx });
    }
  }

  if (tag === 'select') {
    const chosen = optionsOf(element)
      .filter(option => attributeOf(option, 'selected') !== undefined)
      .map(optionValue);
    if (chosen.length > 0) {
      // A single select shows the last option marked, as a browser does.
      attributes.push({
        name: 'defaultValue',
        value:
          attributeOf(element, 'multiple') !== undefined
            ? { kind: 'strings', values: chosen }
            : { kind: 'string', value: chosen[chosen.length - 1] },
      });
    }
  }
  if (tag === 'textarea') {
    const text = textContent(element);
    if (text !== '') {
      attributes.push({
        name: 'defaultValue',
        value: { kind: 'string', value: text },
      });
    }
  }
  return attributes;
}
