/**
 * A `style` attribute, read into the declarations React's `style` object can
 * carry.
 *
 * React takes `style` as an object of camel-cased properties and writes each
 * one back as `property:value`, so a declaration survives the trip when it is
 * a plain `property: value`. What a style object cannot say (`!important`,
 * text that is no declaration at all, a property given twice) is returned
 * separately, so the caller can report it instead of losing it quietly.
 */

export interface Declaration {
  /** Lowercased, unless it is a custom property (`--brand`), which keeps its case. */
  readonly property: string;
  readonly value: string;
  readonly important: boolean;
}

export interface ParsedStyle {
  readonly declarations: readonly Declaration[];
  /** The parts that are not a declaration, as written. */
  readonly invalid: readonly string[];
}

const PROPERTY = /^(?:--[\w-]+|-?[a-zA-Z_][\w-]*)$/;
const IMPORTANT = /\s*!\s*important\s*$/i;

/**
 * Split `text` at each `separator` outside quotes and parentheses, with
 * comments removed, so a `;` inside `url("data:…;base64,…")` stays put.
 * With `once`, split at the first separator only.
 */
function split(text: string, separator: string, once = false): string[] {
  const parts: string[] = [];
  let current = '';
  let quote = '';
  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      current += char;
      if (char === '\\' && index + 1 < text.length) {
        index += 1;
        current += text[index];
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }
    if (char === '/' && text[index + 1] === '*') {
      const end = text.indexOf('*/', index + 2);
      index = end === -1 ? text.length : end + 1;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === '(') depth += 1;
    else if (char === ')') depth = Math.max(0, depth - 1);
    else if (char === separator && depth === 0) {
      parts.push(current);
      current = '';
      if (once) {
        parts.push(text.slice(index + 1));
        return parts;
      }
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts;
}

/** Read a `style` attribute. */
export function parseStyle(text: string): ParsedStyle {
  const declarations: Declaration[] = [];
  const invalid: string[] = [];
  for (const part of split(text, ';')) {
    if (part.trim() === '') continue;
    const pieces = split(part, ':', true);
    const name = pieces[0].trim();
    let value = pieces.length === 2 ? pieces[1].trim() : '';
    const important = IMPORTANT.test(value);
    if (important) value = value.replace(IMPORTANT, '');
    if (!PROPERTY.test(name) || value === '') {
      invalid.push(part.trim());
      continue;
    }
    declarations.push({
      property: name.startsWith('--') ? name : name.toLowerCase(),
      value,
      important,
    });
  }
  return { declarations, invalid };
}

/**
 * The key React's style object uses for a CSS property: camel case, with a
 * vendor prefix capitalised (`WebkitTransition`) except Microsoft's, which
 * React spells `msTransform`. A custom property keeps its name.
 */
export function styleKey(property: string): string {
  if (property.startsWith('--')) return property;
  const name = property.startsWith('-ms-') ? property.slice(1) : property;
  return name.replace(/-([a-z])/g, (_match, letter: string) =>
    letter.toUpperCase()
  );
}

/**
 * Every value an element's own `style` gives a property, lowercased. Which
 * one applies depends on `!important` and on what the browser supports, so
 * a caller that needs a safe answer weighs them all.
 */
export function styleValues(
  style: string | undefined,
  property: string
): string[] {
  if (style === undefined) return [];
  return parseStyle(style)
    .declarations.filter(declaration => declaration.property === property)
    .map(declaration => declaration.value.toLowerCase());
}
