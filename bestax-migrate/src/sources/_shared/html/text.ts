/**
 * Text, strings and comments, written so JSX reads them back as the HTML had
 * them.
 *
 * JSX text is not HTML text: `{` and `}` open and close an expression, `<`
 * and `>` are tags (TypeScript and Babel both refuse a bare `>`), and an
 * `&name;` is decoded as an entity. Everything else is literal. Whitespace is
 * not handled here: `whitespace.ts` decides which of it renders, and the
 * emitter writes what is left.
 */

/** An `&` that JSX would read as the start of an entity. */
const ENTITY_LIKE = /&(?=#\d+;|#x[\da-f]+;|[a-z][a-z\d]*;)/i;

/**
 * Characters that render as nothing, or as a space a reader can't tell from
 * an ordinary one: no-break and typographic spaces, joiners, direction
 * marks, fillers, the soft hyphen and the byte-order mark. They are written
 * as an entity or an escape, so the code shows them.
 */
const INVISIBLE_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0xa0, 0xa0],
  [0xad, 0xad],
  [0x34f, 0x34f],
  [0x61c, 0x61c],
  [0x115f, 0x1160],
  [0x17b4, 0x17b5],
  [0x180e, 0x180e],
  [0x2000, 0x200f],
  [0x2028, 0x202f],
  [0x205f, 0x2064],
  [0x2066, 0x206f],
  [0x3000, 0x3000],
  [0x3164, 0x3164],
  [0xfeff, 0xfeff],
  [0xffa0, 0xffa0],
];
const INVISIBLE_CLASS = `[${INVISIBLE_RANGES.map(
  ([from, to]) => `\\u{${from.toString(16)}}-\\u{${to.toString(16)}}`
).join('')}]`;
const INVISIBLE = new RegExp(INVISIBLE_CLASS, 'gu');

/** The two of those with a name every reader knows. */
const NAMED: Readonly<Record<string, string>> = {
  [String.fromCodePoint(0xa0)]: '&nbsp;',
  [String.fromCodePoint(0xad)]: '&shy;',
};

function hex(char: string): string {
  return char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Text as a JSX child. The caller passes text with no whitespace at either
 * edge that matters, since JSX trims whitespace next to a line break.
 */
export function jsxText(text: string): string {
  return text
    .replace(new RegExp(ENTITY_LIKE, 'gi'), '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(INVISIBLE, char => NAMED[char] ?? `&#x${hex(char)};`)
    .replace(/[{}]/g, brace => `{"${brace}"}`);
}

/** A double-quoted JavaScript string, with invisible characters escaped. */
export function jsString(value: string): string {
  return JSON.stringify(value).replace(INVISIBLE, char => `\\u${hex(char)}`);
}

/**
 * A template literal holding `value` exactly: what preformatted text with a
 * line break in it is written as, so its lines stay lines.
 */
export function templateLiteral(value: string): string {
  const body = value
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')
    .replace(/\r/g, '\\r')
    .replace(INVISIBLE, char => `\\u${hex(char)}`);
  return `\`${body}\``;
}

/**
 * A string attribute value: quoted as written when JSX reads it back the
 * same way, and as an expression otherwise. A JSX attribute string has no
 * escapes, so a `"` would end it, and it decodes entities, as text does.
 * A backslash and a line break are literal there, but a reprint can change
 * them, so they go in an expression too.
 */
export function attributeValue(value: string): string {
  const plain =
    !/["\\\r\n]/.test(value) &&
    !ENTITY_LIKE.test(value) &&
    value.replace(INVISIBLE, '') === value;
  return plain ? `"${value}"` : `{${jsString(value)}}`;
}

/**
 * An Internet Explorer conditional comment, either half of the revealed form
 * (`<!--[if !IE]><!-->` … `<!--<![endif]-->`) included. No browser React
 * supports reads them.
 */
export function isConditionalComment(data: string): boolean {
  return /^\s*\[if\s[^\]]*\]>/i.test(data) || /^\s*<!\[endif\]\s*$/i.test(data);
}

/**
 * An HTML comment as JSX comment lines, without indentation. One line stays
 * one line; more are dedented and set between the comment's own delimiters.
 * A `*\/` inside would end the comment, so it is escaped.
 */
export function jsxComment(data: string): string[] {
  const text = data.replace(/\*\//g, '*\\/');
  const lines = text.split(/\r\n|\r|\n/).map(line => line.trimEnd());
  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  if (lines.length === 0) return ['{/* */}'];
  if (lines.length === 1) return [`{/* ${lines[0].trim()} */}`];
  const margin = Math.min(
    ...lines
      .filter(line => line.trim() !== '')
      .map(line => line.match(/^[ \t]*/)![0].length)
  );
  return [
    '{/*',
    ...lines.map(line => (line.trim() === '' ? '' : `  ${line.slice(margin)}`)),
    '*/}',
  ];
}
