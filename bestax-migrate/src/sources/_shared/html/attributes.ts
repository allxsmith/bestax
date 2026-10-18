/**
 * HTML attributes → JSX props.
 *
 * Names and kinds come from `property-information`, the table
 * `hast-util-to-jsx-runtime` (and so MDX) reads: `class` is `className`,
 * `for` is `htmlFor`, `tabindex` is `tabIndex`, SVG's `stroke-width` is
 * `strokeWidth`, and it knows which attributes are boolean. What it can't
 * know is written here by hand, from the HTML spec and from React:
 *
 *   - a boolean attribute is on whatever its value (`disabled="false"` too),
 *     so it is written bare; one that is also a string (`download`,
 *     `hidden`) is bare only when empty or its own name;
 *   - a value React would make read-only is its default instead: an input's
 *     `value` and `checked`, a `<select>`'s selected options, a
 *     `<textarea>`'s text (an input whose `value` isn't what is typed in it,
 *     a button's or a checkbox's, keeps `value`);
 *   - every other value stays the string it was, numbers included, since the
 *     bulma-classes planner reads attributes as strings; `numberLiteral` is
 *     there to write a number-typed one as a number afterwards;
 *   - `data-*` and `aria-*` keep their names, and so does an attribute
 *     neither table knows, one React gets wrong under the table's name
 *     (`REACT_UNKNOWN`), and every attribute on a custom element, which React
 *     passes through as written (`class` aside);
 *   - an `on…` attribute is code React can't run from a string, and a name
 *     JSX can't spell (`@click`, `x-on:click`) can't be written at all; both
 *     are handed back to the caller instead of emitted.
 */

import { find, hastToReact, html, svg } from 'property-information';
import { isElement, isText, type Element } from './parse.js';
import { styleObject } from './style.js';
import { attributeValue, jsString } from './text.js';

export type PropValue = true | string | { expression: string };

export interface Prop {
  /** The JSX name (`className`, `aria-label`). */
  name: string;
  value: PropValue;
  /**
   * The attribute it was written as (`class`, `xlink:href`). A select's
   * `defaultValue` comes from its options' `selected`, and a textarea's from
   * its text, named `textarea`.
   */
  attribute: string;
}

/**
 * Something the converter can't carry over as written, for the caller to
 * report. Emitted: `unknown-attribute`, `javascript-url`, `style-important`
 * (without its priority), and the element kinds. Not emitted:
 * `attribute-name`, `event-handler`, `style` (the one declaration it
 * quotes), `element-name` (its children are), and a `conditional-comment`.
 */
export interface HtmlIssue {
  kind:
    | 'attribute-name'
    | 'event-handler'
    | 'unknown-attribute'
    | 'javascript-url'
    | 'style'
    | 'style-important'
    | 'custom-element'
    | 'obsolete-element'
    | 'unknown-element'
    | 'template'
    | 'element-name'
    | 'conditional-comment';
  /** The attribute, tag or CSS property it is about, as written. */
  token: string;
  /** The attribute it is on, for its line. */
  attribute?: string;
  /** What a report quotes: a handler's code, a style, a declaration. */
  detail?: string;
  /** For an `event-handler`, the React prop that takes a function. */
  prop?: string;
}

const SVG = 'http://www.w3.org/2000/svg';
const MATHML = 'http://www.w3.org/1998/Math/MathML';

/**
 * Names `property-information` gives that React gets wrong: it doesn't
 * recognize them (and drops a boolean one), takes a boolean one for a
 * string, or renders them as another attribute (`panose1`, `navDown`).
 * They are written with the attribute's own name and its string value,
 * which React passes through. `e2e/html-attributes-react.test.ts` holds this
 * list to React, both ways.
 */
export const REACT_UNKNOWN: ReadonlySet<string> = new Set([
  'aLink',
  'allowPaymentRequest',
  'allowTransparency',
  'allowUserMedia',
  'alpha',
  'bgColor',
  'borderColor',
  'bottomMargin',
  'charOff',
  'closedBy',
  'codeBase',
  'codeType',
  'colorSpace',
  'commandFor',
  'compact',
  'declare',
  'dirName',
  'exportParts',
  'hSpace',
  'isMap',
  'leftMargin',
  'longDesc',
  'lowSrc',
  'noHref',
  'noResize',
  'noShade',
  'noWrap',
  'rightMargin',
  'shadowRootClonable',
  'shadowRootCustomElementRegistry',
  'shadowRootDelegatesFocus',
  'shadowRootMode',
  'shadowRootSerializable',
  'topMargin',
  'typeMustMatch',
  'vAlign',
  'valueType',
  'vLink',
  'vSpace',
  'writingSuggestions',
  // SVG's, where the attribute's case is its name.
  'horizOriginY',
  'navDown',
  'navDownLeft',
  'navDownRight',
  'navLeft',
  'navNext',
  'navPrev',
  'navRight',
  'navUp',
  'navUpLeft',
  'navUpRight',
  'panose1',
  'playbackOrder',
  'timelineBegin',
]);

/** Input types whose `value` React leaves alone: it isn't what is typed. */
const VALUE_NOT_TYPED = new Set([
  'button',
  'checkbox',
  'hidden',
  'image',
  'radio',
  'reset',
  'submit',
]);

/** What JSX can write as an attribute name (no namespace, no symbols). */
const JSX_NAME = /^[A-Za-z_$][\w$-]*$/;

/**
 * A `javascript:` URL, read the way a browser reads one (and React, which
 * replaces it with a URL that throws): leading control characters and
 * spaces skipped, tabs and line breaks anywhere ignored.
 */
const JAVASCRIPT_URL = new RegExp(
  `^[\\x00-\\x20]*${[...'javascript:'].join('[\\t\\n\\r]*')}`,
  'i'
);

/** The attributes React reads as a URL to follow. */
const URL_ATTRIBUTES = new Set([
  'href',
  'src',
  'action',
  'formaction',
  'xlink:href',
]);

function attributeOf(element: Element, name: string): string | undefined {
  return element.attrs.find(attr => attr.name === name && !attr.prefix)?.value;
}

/**
 * Whether React renders it as a custom element, passing its attributes
 * through as written: an HTML tag with a dash. A built-in extended with
 * `is` is not one to React's server renderer, which gives it a built-in's
 * props (a bare `disabled`, a textarea's `defaultValue`), and those are the
 * DOM properties React's client sets on it too.
 */
export function isCustomElement(element: Element): boolean {
  return (
    element.namespaceURI !== SVG &&
    element.namespaceURI !== MATHML &&
    element.tagName.includes('-')
  );
}

/** An element's text, its descendants' included, as `textContent` reads. */
function textContent(element: Element): string {
  return element.childNodes
    .map(child =>
      isText(child) ? child.value : isElement(child) ? textContent(child) : ''
    )
    .join('');
}

/** The options a `<select>` lists: its own, and its optgroups'. */
function optionsOf(select: Element): Element[] {
  return select.childNodes.filter(isElement).flatMap(child => {
    if (child.tagName === 'option') return [child];
    return child.tagName === 'optgroup'
      ? child.childNodes.filter(isElement).filter(o => o.tagName === 'option')
      : [];
  });
}

/**
 * The `<select>` that lists an option, if any: the one whose `defaultValue`
 * carries the option's `selected`. It is found through `optionsOf`, which
 * is what that default reads, so the option never drops a `selected` the
 * select doesn't take.
 */
function selectOf(option: Element): Element | undefined {
  const parent = option.parentNode;
  const grand = parent && isElement(parent) ? parent.parentNode : null;
  return [parent, grand].find(
    (node): node is Element =>
      !!node &&
      isElement(node) &&
      node.tagName === 'select' &&
      optionsOf(node).includes(option)
  );
}

/** An option's value: its `value`, else its text, stripped and collapsed. */
function optionValue(option: Element): string {
  return (
    attributeOf(option, 'value') ??
    textContent(option)
      .replace(/[ \t\n\f\r]+/g, ' ')
      .trim()
  );
}

/**
 * The `defaultValue` a `<select>` takes from the options marked `selected`:
 * the last of them, or all of them when it is `multiple`.
 */
function selectDefault(select: Element): PropValue | undefined {
  const selected = optionsOf(select)
    .filter(option => attributeOf(option, 'selected') !== undefined)
    .map(optionValue);
  if (selected.length === 0) return undefined;
  if (attributeOf(select, 'multiple') === undefined) return selected.pop()!;
  return { expression: `[${selected.map(jsString).join(', ')}]` };
}

/** A JSX prop as source: `name`, `name="value"` or `name={…}`. */
export function printProp(prop: Prop): string {
  const { name, value } = prop;
  if (value === true) return name;
  if (typeof value === 'string') return `${name}=${attributeValue(value)}`;
  return `${name}={${value.expression}}`;
}

/** An element's attributes as JSX props, and what couldn't be carried. */
export function convertAttributes(element: Element): {
  props: Prop[];
  issues: HtmlIssue[];
} {
  const props: Prop[] = [];
  const issues: HtmlIssue[] = [];
  const tag = element.tagName;
  const schema = element.namespaceURI === SVG ? svg : html;
  const custom = isCustomElement(element);
  const type = attributeOf(element, 'type')?.toLowerCase() ?? 'text';
  const add = (name: string, value: PropValue, attribute: string) => {
    if (!JSX_NAME.test(name) || props.some(prop => prop.name === name)) {
      issues.push({ kind: 'attribute-name', token: attribute, attribute });
      return;
    }
    props.push({ name, value, attribute });
  };

  for (const attr of element.attrs) {
    const attribute = attr.prefix ? `${attr.prefix}:${attr.name}` : attr.name;
    const { value } = attr;
    if (/^on./i.test(attribute)) {
      const info = find(schema, attribute);
      issues.push({
        kind: 'event-handler',
        token: attribute,
        attribute,
        detail: value,
        prop: info.space ? info.property : attribute,
      });
      continue;
    }
    if (URL_ATTRIBUTES.has(attribute) && JAVASCRIPT_URL.test(value)) {
      issues.push({ kind: 'javascript-url', token: attribute, attribute });
    }
    if (attribute === 'style') {
      const style = styleObject(value);
      for (const issue of style.issues) {
        issues.push(
          issue.kind === 'style'
            ? { kind: 'style', token: 'style', attribute, detail: issue.detail }
            : { ...issue, attribute }
        );
      }
      if (style.code) add('style', { expression: style.code }, attribute);
      continue;
    }
    if (custom) {
      add(attribute === 'class' ? 'className' : attribute, value, attribute);
      continue;
    }
    if (tag === 'option' && attribute === 'selected' && selectOf(element)) {
      continue; // The select carries it, as its `defaultValue`.
    }
    if (tag === 'input' && attribute === 'checked') {
      add('defaultChecked', true, attribute);
      continue;
    }
    if (
      tag === 'input' &&
      attribute === 'value' &&
      !VALUE_NOT_TYPED.has(type)
    ) {
      add('defaultValue', value, attribute);
      continue;
    }

    const info = find(schema, attribute);
    if (!info.space) {
      // `data-*`, `aria-*`, `role`, and names neither table knows.
      const unknown =
        !info.defined &&
        !attribute.includes('-') &&
        JSX_NAME.test(attribute) &&
        element.namespaceURI !== MATHML;
      if (unknown) {
        issues.push({ kind: 'unknown-attribute', token: attribute, attribute });
      }
      add(attribute, value, attribute);
      continue;
    }
    const name = hastToReact[info.property] ?? info.property;
    if (REACT_UNKNOWN.has(name)) {
      issues.push({ kind: 'unknown-attribute', token: attribute, attribute });
      add(info.attribute, value, attribute);
    } else if (info.boolean) {
      add(name, true, attribute);
    } else if (info.overloadedBoolean) {
      const on = value === '' || value.toLowerCase() === info.attribute;
      add(name, on ? true : value, attribute);
    } else {
      add(name, value, attribute);
    }
  }

  const selected = tag === 'select' ? selectDefault(element) : undefined;
  if (selected !== undefined) add('defaultValue', selected, 'selected');
  const text = tag === 'textarea' ? textContent(element) : '';
  if (text !== '') add('defaultValue', text, 'textarea');
  return { props, issues };
}

/**
 * Whether a JSX prop on a plain element takes a number (`tabIndex`,
 * `colSpan`, `aria-valuenow`), by the same table.
 */
export function isNumberProp(
  name: string,
  space: 'html' | 'svg' = 'html'
): boolean {
  return find(space === 'svg' ? svg : html, name).number;
}

/**
 * A string value as a number literal's source, when the number is spelled
 * the way it renders: not `040`, `1.50` or ` 4`, which a number would turn
 * into `40`, `1.5` and `4`. Null otherwise, and the value stays a string.
 */
export function numberLiteral(value: string): string | null {
  return /^-?\d+(?:\.\d+)?$/.test(value) && String(Number(value)) === value
    ? value
    : null;
}
