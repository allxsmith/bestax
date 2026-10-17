/**
 * A `style="…"` attribute as the object literal React takes.
 *
 * The declarations are split by hand, since a style attribute is a flat list
 * and the only syntax that matters is what can hide a `;` or a `:`: quoted
 * strings, parentheses (`url(a;b)`), and comments. Property names are camel
 * cased the way React hyphenates them back: `-ms-` becomes `ms`, any other
 * vendor prefix a capital (`WebkitTransition`), and a custom property keeps
 * its name, quoted. A later declaration of the same property wins, as it
 * does in CSS. What React can't carry is left out and handed back: an
 * `!important` declaration, and a style that can't be read at all.
 */

import { jsString } from './text.js';

export type StyleIssue =
  /** The whole attribute, which nothing could be read from. */
  | { kind: 'style'; detail: string }
  /** One declaration React can't apply: it sets each value without priority. */
  | { kind: 'style-important'; token: string; detail: string };

export interface StyleObject {
  /** The object literal's source, or null when there is nothing to write. */
  code: string | null;
  issues: StyleIssue[];
}

/** A property name CSS accepts: an identifier, or a custom property. */
const PROPERTY = /^(?:--[\w-]+|-?[a-z_][\w-]*)$/i;

/** Runs of whitespace as one space, except inside a quoted string. */
function collapse(value: string): string {
  let out = '';
  let quote: string | null = null;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (quote) {
      out += char;
      if (char === '\\' && i + 1 < value.length) out += value[++i];
      else if (char === quote) quote = null;
    } else if (/\s/.test(char)) {
      if (!out.endsWith(' ')) out += ' ';
    } else {
      if (char === '"' || char === "'") quote = char;
      out += char;
    }
  }
  return out;
}

/**
 * Split on `;` outside strings, parentheses and comments. A comment
 * separates tokens and is otherwise nothing, so it becomes a space. Null
 * when a string, a parenthesis or a comment is left open.
 */
function declarations(text: string): string[] | null {
  const out: string[] = [];
  let current = '';
  let quote: string | null = null;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quote) {
      current += char;
      if (char === '\\' && i + 1 < text.length) {
        current += text[++i];
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      if (end === -1) return null;
      i = end + 1;
      current += ' ';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '(') {
      depth++;
    } else if (char === ')') {
      if (depth === 0) return null;
      depth--;
    } else if (char === ';' && depth === 0) {
      out.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (quote || depth > 0) return null;
  out.push(current);
  return out.map(part => part.trim()).filter(Boolean);
}

/** The key React reads for a CSS property name. */
export function styleKey(property: string): string {
  if (property.startsWith('--')) return property;
  const name = property.toLowerCase();
  const camel = (rest: string) =>
    rest.replace(/-([a-z\d])/g, (_match, char: string) => char.toUpperCase());
  if (name.startsWith('-ms-')) return camel(`ms-${name.slice(4)}`);
  if (name.startsWith('-')) {
    const rest = camel(name.slice(1));
    return rest.charAt(0).toUpperCase() + rest.slice(1);
  }
  return camel(name);
}

function keySource(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : jsString(key);
}

export interface Declaration {
  /** As written, but for its case: lowercase unless a custom property. */
  property: string;
  value: string;
  important: boolean;
  /** The declaration's own text, for a report to quote. */
  text: string;
}

/** A style attribute's declarations in order, or null when it can't be read. */
export function readStyle(text: string): Declaration[] | null {
  const parts = declarations(text);
  if (!parts) return null;
  const out: Declaration[] = [];
  for (const part of parts) {
    const colon = part.indexOf(':');
    if (colon === -1) return null;
    const written = part.slice(0, colon).trim();
    let value = collapse(part.slice(colon + 1).trim());
    const important = /\s*!\s*important$/i.exec(value);
    if (important) value = value.slice(0, important.index);
    if (!PROPERTY.test(written) || value === '') return null;
    out.push({
      property: written.startsWith('--') ? written : written.toLowerCase(),
      value,
      important: Boolean(important),
      text: part,
    });
  }
  return out;
}

/** A style attribute's text as a React style object. */
export function styleObject(text: string): StyleObject {
  const read = readStyle(text);
  if (!read) return { code: null, issues: [{ kind: 'style', detail: text }] };
  const values = new Map<string, string>();
  const issues: StyleIssue[] = [];
  for (const { property, value, important, text: written } of read) {
    if (important) {
      issues.push({
        kind: 'style-important',
        token: property,
        detail: written,
      });
      continue;
    }
    const key = styleKey(property);
    // Re-set, so the key sits where its last declaration does.
    values.delete(key);
    values.set(key, value);
  }
  if (values.size === 0) return { code: null, issues };
  const entries = [...values].map(
    ([key, value]) => `${keySource(key)}: ${jsString(value)}`
  );
  return { code: `{ ${entries.join(', ')} }`, issues };
}
