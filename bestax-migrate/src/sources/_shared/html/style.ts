/**
 * A `style="…"` attribute as the object literal React takes.
 *
 * The declarations are split by hand, since a style attribute is a flat list
 * and the only syntax that matters is what can hide a `;` or a `:`: quoted
 * strings, parentheses (`url(a;b)`), and comments. Property names are camel
 * cased the way React hyphenates them back: `-ms-` becomes `ms`, any other
 * vendor prefix a capital (`WebkitTransition`), and a custom property keeps
 * its name, quoted. Which declaration of a property applies is CSS's choice:
 * an `!important` one over the rest, else the last.
 *
 * As in CSS, a declaration that can't be read (an IE hack like `*zoom: 1`,
 * an empty value, a string or parenthesis left open) is skipped and the rest
 * apply; it is handed back for the caller to report. So is an `!important`
 * one, which is written without its priority, since React sets every value
 * without one.
 */

import { jsString } from './text.js';

export type StyleIssue =
  /** A declaration that can't be read, left out. */
  | { kind: 'style'; detail: string }
  /** A declaration written without the `!important` React can't set. */
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

interface Part {
  text: string;
  /** Whether its strings and parentheses close, and none closes unopened. */
  balanced: boolean;
}

/**
 * Split on `;` outside strings, parentheses and comments. A comment
 * separates tokens and is otherwise nothing, so it becomes a space, and one
 * left open runs to the end. A string or parenthesis left open does too,
 * taking every later declaration into the one it is in, as it does in CSS.
 */
function declarations(text: string): Part[] {
  const out: Part[] = [];
  let current = '';
  let balanced = true;
  let quote: string | null = null;
  let depth = 0;
  const end = () => {
    const trimmed = current.trim();
    if (trimmed) out.push({ text: trimmed, balanced });
    current = '';
    balanced = true;
  };
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
      const close = text.indexOf('*/', i + 2);
      if (close === -1) break;
      i = close + 1;
      current += ' ';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '(') {
      depth++;
    } else if (char === ')') {
      if (depth === 0) balanced = false;
      else depth--;
    } else if (char === ';' && depth === 0) {
      end();
      continue;
    }
    current += char;
  }
  if (quote || depth > 0) balanced = false;
  end();
  return out;
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

export interface Style {
  /** The declarations it could read, in order. */
  declarations: Declaration[];
  /** The text of each one it couldn't, which CSS skips too. */
  skipped: string[];
}

/** A style attribute's declarations, read one at a time. */
export function readStyle(text: string): Style {
  const style: Style = { declarations: [], skipped: [] };
  for (const part of declarations(text)) {
    const colon = part.text.indexOf(':');
    const written = colon === -1 ? '' : part.text.slice(0, colon).trim();
    let value = collapse(part.text.slice(colon + 1).trim());
    const important = /\s*!\s*important$/i.exec(value);
    if (important) value = value.slice(0, important.index);
    if (!part.balanced || !PROPERTY.test(written) || value === '') {
      style.skipped.push(part.text);
      continue;
    }
    style.declarations.push({
      property: written.startsWith('--') ? written : written.toLowerCase(),
      value,
      important: Boolean(important),
      text: part.text,
    });
  }
  return style;
}

/**
 * The declaration that applies for each property, as the cascade picks it
 * inside one attribute: an `!important` one over any other, else the last.
 * In the order of the declarations that apply.
 */
export function applied(declarations: Declaration[]): Map<string, Declaration> {
  const out = new Map<string, Declaration>();
  for (const declaration of declarations) {
    const before = out.get(declaration.property);
    if (before?.important && !declaration.important) continue;
    out.delete(declaration.property);
    out.set(declaration.property, declaration);
  }
  return out;
}

/** A style attribute's text as a React style object. */
export function styleObject(text: string): StyleObject {
  const { declarations: read, skipped } = readStyle(text);
  const issues: StyleIssue[] = skipped.map(detail => ({
    kind: 'style',
    detail,
  }));
  for (const { property, important, text: written } of read) {
    if (important) {
      issues.push({
        kind: 'style-important',
        token: property,
        detail: written,
      });
    }
  }
  const entries = [...applied(read).values()].map(
    ({ property, value }) =>
      `${keySource(styleKey(property))}: ${jsString(value)}`
  );
  return {
    code: entries.length === 0 ? null : `{ ${entries.join(', ')} }`,
    issues,
  };
}
