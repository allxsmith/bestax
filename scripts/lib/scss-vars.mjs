/**
 * Parse a SCSS partial into the CSS-variable table shown on an API page:
 * CSS Variable / Sass Variable / Default.
 *
 * Bulma's convention (and this repo's, in `bulma-ui/src/scss/`) is:
 *
 *     $footer-padding: 3rem 1.5rem 6rem !default;
 *
 *     .#{iv.$class-prefix}footer {
 *       @include cv.register-vars(("footer-padding": #{$footer-padding}));
 *     }
 *
 * so a row is: `--bulma-footer-padding` / `$footer-padding` / `3rem 1.5rem 6rem`.
 * The `--bulma-` prefix comes from `$cssvars-prefix` in
 * `bulma/sass/utilities/initial-variables.scss`, via `buildVarName()` in
 * `css-variables.scss`.
 *
 * The subtle part is WHICH registrations count. Only those on the component's
 * own root selector, at top level, are defaults. Nested ones are state
 * re-declarations or — worse — other components' variables: `hero.scss`
 * registers `navbar-item-*`, `tabs-*`, `title-*` and `subtitle-*` inside its
 * per-colour `@each`, which would put four other components' variables into
 * Hero's table. Hence the depth-1 + root-selector filter in `componentVars()`.
 *
 * The scanner is hand-rolled because `#{…}` interpolation embeds braces inside
 * selectors (`.#{iv.$class-prefix}hero {`), so brace counting has to understand
 * interpolation, strings and comments.
 */

const CSSVARS_PREFIX = 'bulma-';

/** Is `src[i]` the start of a `#{…}` interpolation? */
function atInterpolation(src, i) {
  return src[i] === '#' && src[i + 1] === '{';
}

/** Index just past the `}` closing the interpolation starting at `i`. */
function skipInterpolation(src, i) {
  let depth = 0;
  for (let j = i + 1; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') {
      depth--;
      if (depth === 0) return j + 1;
    } else if (src[j] === '"' || src[j] === "'") {
      j = skipString(src, j) - 1;
    }
  }
  return src.length;
}

/** Index just past the string literal starting at `i`. */
function skipString(src, i) {
  const quote = src[i];
  for (let j = i + 1; j < src.length; j++) {
    if (src[j] === '\\') j++;
    else if (src[j] === quote) return j + 1;
  }
  return src.length;
}

/**
 * Walk a SCSS source, emitting every statement (`… ;`) with the selector chain
 * it sits under. Comments and string bodies never reach the callback.
 */
function eachStatement(src, visit) {
  const stack = [];
  let buf = '';
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (ch === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? src.length : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const end = skipString(src, i);
      buf += src.slice(i, end);
      i = end;
      continue;
    }
    if (atInterpolation(src, i)) {
      const end = skipInterpolation(src, i);
      buf += src.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '{') {
      stack.push(buf.trim());
      buf = '';
      i++;
      continue;
    }
    if (ch === '}') {
      if (buf.trim()) visit(buf.trim(), stack);
      stack.pop();
      buf = '';
      i++;
      continue;
    }
    if (ch === ';') {
      if (buf.trim()) visit(buf.trim(), stack);
      buf = '';
      i++;
      continue;
    }
    buf += ch;
    i++;
  }
  if (buf.trim()) visit(buf.trim(), stack);
}

/** Split on top-level `sep`, ignoring parens, brackets, strings, interpolation. */
function splitTopLevel(text, sep) {
  const parts = [];
  let depth = 0;
  let start = 0;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      i = skipString(text, i);
      continue;
    }
    if (atInterpolation(text, i)) {
      i = skipInterpolation(text, i);
      continue;
    }
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (ch === sep && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
    i++;
  }
  parts.push(text.slice(start));
  return parts.map(p => p.trim()).filter(Boolean);
}

/** Body of the outermost parenthesised group in `text`, or null. */
function outerParens(text) {
  const open = text.indexOf('(');
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      i = skipString(text, i) - 1;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return text.slice(open + 1, i);
    }
  }
  return null;
}

function unquote(text) {
  const t = text.trim();
  return /^(['"]).*\1$/.test(t) ? t.slice(1, -1) : t;
}

/**
 * All `$name: value !default;` declarations. Multi-line values are handled for
 * free — the statement scanner reads to the `;`, so `media.scss`'s six-line
 * `$media-border-color` hsla() arrives as one string.
 */
export function defaultDeclarations(src) {
  const out = new Map();
  eachStatement(src, (stmt, stack) => {
    if (stack.length) return; // top-level declarations only
    const m = stmt.match(/^\$([a-zA-Z0-9_-]+)\s*:\s*([\s\S]+)$/);
    if (!m) return;
    const value = m[2].replace(/\s*!default\s*$/, '').trim();
    out.set(m[1], value);
  });
  return out;
}

/**
 * Every `cv.register-vars` / `cv.register-var` entry, with the selector chain
 * it appeared under.
 *
 * @returns {{key: string, rawValue: string, chain: string[]}[]}
 */
export function registerVarsEntries(src) {
  const out = [];
  eachStatement(src, (stmt, stack) => {
    const plural = stmt.match(/@include\s+[\w.-]*register-vars\b/);
    const singular = stmt.match(/@include\s+[\w.-]*register-var\b(?!s)/);
    if (plural) {
      const args = outerParens(stmt.slice(plural.index));
      if (!args) return;
      // First arg is the map — itself parenthesised: register-vars((k: v, …)).
      const map = outerParens(args) ?? args;
      for (const entry of splitTopLevel(map, ',')) {
        const parts = splitTopLevel(entry, ':');
        if (parts.length < 2) continue;
        out.push({
          key: unquote(parts[0]),
          rawValue: parts.slice(1).join(':').trim(),
          chain: [...stack],
        });
      }
    } else if (singular) {
      const args = outerParens(stmt.slice(singular.index));
      if (!args) return;
      const parts = splitTopLevel(args, ',');
      if (parts.length < 2) return;
      out.push({
        key: unquote(parts[0]),
        rawValue: parts.slice(1).join(',').trim(),
        chain: [...stack],
      });
    }
  });
  return out;
}

/**
 * Keys registered via `@include cv.register-vars((...))`, at any nesting depth.
 *
 * Kept deliberately identical to the original implementation in
 * check-conformance.mjs (plural form only, all depths) — `scss-conformance` and
 * `skills-sync` are ratcheted against this exact behaviour, and widening it
 * would newly fail partials that were already passing.
 */
export function registerVarsKeys(src) {
  const keys = new Set();
  const re = /cv\.register-vars\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < src.length && depth > 0) {
      if (src[i] === '(') depth++;
      else if (src[i] === ')') depth--;
      i++;
    }
    const block = src.slice(re.lastIndex, i);
    for (const k of block.matchAll(/['"]([a-z0-9-]+)['"][ \t]*:/g))
      keys.add(k[1]);
  }
  return keys;
}

/** `.#{iv.$class-prefix}hero` (or a list of them) -> ['hero']. */
function selectorClasses(selector) {
  return splitTopLevel(selector, ',')
    .map(s =>
      s
        .trim()
        .replace(/^\.#\{\s*iv\.\$class-prefix\s*\}/, '')
        .trim()
    )
    .filter(s => /^[a-z][a-z0-9-]*$/.test(s));
}

/**
 * Render a raw sass value as it will reach the browser: `cv.getVar("x")`
 * becomes `var(--bulma-x)`, interpolation wrappers are dropped, and whitespace
 * collapses to one line.
 *
 * Only the single-argument `getVar("literal")` form is rewritten. The 3-arg
 * form (`cv.getVar($name, "", "-h")`) depends on a loop variable and has no
 * fixed answer — it only appears in nested blocks we exclude anyway.
 */
export function renderValue(raw) {
  let text = String(raw).trim();

  // Strip a wrapper that is exactly one interpolation: `#{$foo}` -> `$foo`.
  if (text.startsWith('#{') && skipInterpolation(text, 0) === text.length) {
    text = text.slice(2, -1).trim();
  }

  text = text.replace(
    /\b[\w.-]*getVar\(\s*(['"])([a-z0-9-]+)\1\s*\)/g,
    (_, __, name) => `var(--${CSSVARS_PREFIX}${name})`
  );
  // Remaining interpolations are pass-through wrappers around a value.
  text = text.replace(/#\{([^{}]*)\}/g, '$1');

  return text
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+,/g, ',')
    .trim();
}

/**
 * The CSS-variable rows for one component.
 *
 * @param {string} src   SCSS partial source.
 * @param {string} root  Root class, e.g. `hero` (from usePrefixedClassNames).
 * @returns {{cssVar: string, sassVar: string|null, value: string}[]}
 */
export function componentVars(src, root) {
  const defaults = defaultDeclarations(src);
  const rows = [];
  const seen = new Set();

  for (const { key, rawValue, chain } of registerVarsEntries(src)) {
    // Depth-1 registrations on the component's own root selector only. Anything
    // deeper is a state re-declaration (`&:hover`) or another component's
    // variables nested inside this one (hero.scss's navbar/tabs/title blocks).
    if (chain.length !== 1) continue;
    if (!selectorClasses(chain[0]).includes(root)) continue;
    if (seen.has(key)) continue;
    seen.add(key);

    const inner =
      rawValue.startsWith('#{') &&
      skipInterpolation(rawValue, 0) === rawValue.length
        ? rawValue.slice(2, -1).trim()
        : rawValue;
    const varRef = inner.match(/^\$([a-zA-Z0-9_-]+)$/);
    const sassVar = varRef && defaults.has(varRef[1]) ? `$${varRef[1]}` : null;

    rows.push({
      cssVar: `--${CSSVARS_PREFIX}${key}`,
      sassVar,
      value: renderValue(sassVar ? defaults.get(varRef[1]) : rawValue),
    });
  }
  return rows;
}
