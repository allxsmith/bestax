/**
 * Every attribute `property-information` knows converts to a prop React
 * renders back as that attribute.
 *
 * For each HTML and SVG property in its table, an element carrying the
 * attribute is parsed, converted, and rendered through the built library's
 * React (see `support/render-module.ts`). The rendered element must carry
 * the same attribute and value, and React must not warn about the prop. The
 * other way round, every name in `REACT_UNKNOWN` must still be one React
 * gets wrong when it is written the table's way, so the list can't keep an
 * entry React has since learned.
 */

import { format } from 'node:util';
import { find, hastToReact, html, svg, type Info } from 'property-information';
import {
  convertAttributes,
  REACT_UNKNOWN,
} from '../src/sources/_shared/html/attributes.js';
import {
  childrenOf,
  isElement,
  parseHtml,
  type Element,
} from '../src/sources/_shared/html/parse.js';
import { createElement, renderElement } from './support/render-module.js';

/** Run `render`, collecting what React writes to the console as it does. */
function warningsOf(render: () => string): {
  markup: string;
  warnings: string[];
} {
  const original = console.error;
  const warnings: string[] = [];
  console.error = (...args: unknown[]) => warnings.push(format(...args));
  try {
    return { markup: render(), warnings };
  } finally {
    console.error = original;
  }
}

/** The element the markup's first element holds, or that element itself. */
function target(markup: string, inSvg: boolean): Element {
  const root = childrenOf(parseHtml(markup).root).filter(isElement)[0];
  return inSvg ? root.childNodes.filter(isElement)[0] : root;
}

function nameOf(attr: Element['attrs'][number]): string {
  return attr.prefix ? `${attr.prefix}:${attr.name}` : attr.name;
}

function attributeOf(element: Element, name: string): string | undefined {
  return element.attrs.find(attr => nameOf(attr) === name)?.value;
}

/**
 * An element with this one attribute, parsed. Its name is the one the
 * parser read, which for an SVG attribute outside the HTML parser's own
 * list is lowercase, as it is in any page.
 */
function parsedWith(attribute: string, value: string, inSvg: boolean) {
  const element = target(
    inSvg
      ? `<svg><path ${attribute}="${value}"></path></svg>`
      : `<div ${attribute}="${value}"></div>`,
    inSvg
  );
  return { element, name: nameOf(element.attrs[0]) };
}

/** A value of the kind the table says the attribute takes. */
function sample(info: Info): string {
  if (info.boolean || info.overloadedBoolean) return '';
  return info.number ? '1' : 'x';
}

function render(props: Record<string, unknown>, inSvg: boolean): string {
  return inSvg
    ? renderElement('svg', {}, createElement('path', props))
    : renderElement('div', props);
}

/**
 * Properties React reads on one element only, which the converter writes
 * for that element: an input's `checked` becomes `defaultChecked`, and a
 * selected option its select's `defaultValue`. The round trip covers both.
 */
const ELEMENT_ONLY = new Set(['checked', 'selected']);

/** Every property of a schema an attribute converts through. */
function propertiesOf(schema: typeof html): Info[] {
  return Object.values(schema.property).filter(
    info =>
      info.space !== undefined &&
      info.property !== 'style' &&
      !ELEMENT_ONLY.has(info.attribute) &&
      // `is` makes the element a custom one, whose attributes are kept as
      // written; an `on…` attribute is handed back, never written.
      info.attribute !== 'is' &&
      !/^on/i.test(info.attribute)
  );
}

describe('converted attributes render back as themselves', () => {
  for (const [space, schema] of [
    ['HTML', html],
    ['SVG', svg],
  ] as const) {
    const inSvg = space === 'SVG';
    test.each(
      propertiesOf(schema).map(info => [info.attribute, info] as const)
    )(`${space} %s`, (attribute, info) => {
      const value = sample(info);
      const { element, name } = parsedWith(attribute, value, inSvg);
      const { props } = convertAttributes(element);
      expect(props).toHaveLength(1);
      const [prop] = props;
      expect(typeof prop.value).not.toBe('object');
      const rendered = warningsOf(() =>
        render({ [prop.name]: prop.value }, inSvg)
      );
      expect(attributeOf(target(rendered.markup, inSvg), name)).toBe(value);
      // An attribute written as its own name has no better spelling, so a
      // warning about that (SVG's camel-cased attributes React never
      // learned, `panose-1`) is React's to fix.
      const unavoidable = (warning: string) =>
        prop.name === info.attribute && warning.includes(`\`${prop.name}\``);
      expect(
        rendered.warnings.filter(warning => !unavoidable(warning))
      ).toEqual([]);
    });
  }
});

describe('REACT_UNKNOWN', () => {
  test.each([...REACT_UNKNOWN])('React still gets %s wrong', name => {
    const htmlInfo = find(html, name);
    const inSvg = !htmlInfo.space;
    const info = inSvg ? find(svg, name) : htmlInfo;
    expect(info.space).toBeDefined();
    expect(hastToReact[info.property] ?? info.property).toBe(name);
    const value = sample(info);
    const parsed = parsedWith(info.attribute, value, inSvg);
    const rendered = warningsOf(() =>
      render({ [name]: info.boolean ? true : value }, inSvg)
    );
    const right =
      attributeOf(target(rendered.markup, inSvg), parsed.name) === value &&
      rendered.warnings.length === 0;
    expect(right).toBe(false);
  });
});
