/**
 * Where a compiled stylesheet declares each CSS variable, and whether a value
 * set on an ancestor can reach the component that reads it.
 *
 * Custom properties inherit, but only as a fallback: an element that declares
 * a variable itself uses its own value, whatever its ancestors say. So whether
 * `:root`, a `Theme` wrapper or any other ancestor can set a Bulma variable is
 * decided by one thing, which selector the stylesheet declares it on. Bulma
 * declares `--bulma-delete-dimensions` on `.delete` itself, so a wrapper
 * setting it never reaches the button (#1021), while `--bulma-skeleton-radius`
 * lives on `:root` and is meant to be set from anywhere above.
 *
 * This reads the COMPILED stylesheet rather than the SCSS. The SCSS parser in
 * `scss-vars.mjs` has to guess where a mixin body or an `@each` lands; the
 * compiled CSS says it outright, which is what makes it the ground truth the
 * docs and `Theme` are checked against.
 *
 * The scanner is small because the input is: Bulma's expanded build has no
 * nesting, and no custom property sits in a rule whose selector holds a brace
 * or a semicolon. Strings and comments are skipped so a `content: "{"` cannot
 * shift the depth.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

/** Bulma's own compiled stylesheet, from the copy the workspace installs. */
export function bulmaCss() {
  let root;
  try {
    root = dirname(require.resolve('bulma/package.json'));
  } catch {
    throw new Error(
      'Cannot resolve the `bulma` package, so there is no compiled stylesheet ' +
        'to check against. Run `pnpm install --frozen-lockfile`.'
    );
  }
  return readFileSync(join(root, 'css', 'bulma.css'), 'utf8');
}

/** Index just past the string literal starting at `i`. */
function skipString(css, i) {
  const quote = css[i];
  for (let j = i + 1; j < css.length; j++) {
    if (css[j] === '\\') j++;
    else if (css[j] === quote) return j + 1;
  }
  return css.length;
}

/**
 * Every custom-property declaration in a stylesheet, with the selector list of
 * the rule it sits in and whether an at-rule makes it conditional.
 *
 * `@media`, `@container` and `@supports` are conditional: the declaration
 * holds at some viewports or in some browsers, not on the element as such.
 * `@layer` only orders rules, so it is transparent here.
 *
 * @returns {{name: string, selectors: string[], conditional: boolean}[]}
 */
export function customPropertyDeclarations(css) {
  const out = [];
  const stack = [];
  let buf = '';
  const flush = () => {
    const m = buf.trim().match(/^(--[\w-]+)\s*:/);
    buf = '';
    if (!m) return;
    const rule = stack.findLast(prelude => !prelude.startsWith('@'));
    if (rule === undefined) return;
    out.push({
      name: m[1],
      selectors: rule
        .split(',')
        .map(s => s.trim().replace(/\s+/g, ' '))
        .filter(Boolean),
      conditional: stack.some(
        prelude => prelude.startsWith('@') && !/^@layer\b/.test(prelude)
      ),
    });
  };
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 1;
    } else if (ch === '"' || ch === "'") {
      const end = skipString(css, i);
      buf += css.slice(i, end);
      i = end - 1;
    } else if (ch === '{') {
      stack.push(buf.trim());
      buf = '';
    } else if (ch === '}') {
      flush();
      stack.pop();
    } else if (ch === ';') {
      flush();
    } else {
      buf += ch;
    }
  }
  return out;
}

/**
 * Is this selector where Bulma hosts its global variables? That is
 * `$variables-host` (`:root` by default, configurable to `:where(html)`) and
 * the theme scopes (`[data-theme=dark]`, `.theme-dark`), which exist to be set
 * on an ancestor.
 */
export function isHostSelector(selector) {
  return /^(?::root|html|:where\(\s*html\s*\)|\[data-theme=["']?[\w-]+["']?\]|\.theme-[\w-]+)$/.test(
    selector.trim()
  );
}

/**
 * Does this selector match a component in its plain state: no modifier class
 * (`is-*`, `has-*`, `are-*`), no pseudo-class or pseudo-element, and no
 * attribute test? `.delete`, `.fixed-grid > .grid` and
 * `.control, .input, .textarea, .select` do; `.delete.is-small`,
 * `.tag:hover` and `.hero.is-white .title` do not.
 */
export function isPlainSelector(selector) {
  return !/[:[]/.test(selector) && !/\.(?:is|has|are)-/.test(selector);
}

/**
 * Variable name -> how the stylesheet declares it:
 *
 *   onHost   declared on a variables host (`isHostSelector`), at any viewport
 *   onPlain  declared unconditionally on a plain, non-host selector, so the
 *            component carries its own value before any modifier applies
 *
 * @returns {Map<string, {onHost: boolean, onPlain: boolean}>}
 */
export function variableHomes(css) {
  const homes = new Map();
  for (const { name, selectors, conditional } of customPropertyDeclarations(
    css
  )) {
    const home = homes.get(name) ?? { onHost: false, onPlain: false };
    for (const selector of selectors) {
      if (isHostSelector(selector)) home.onHost = true;
      else if (!conditional && isPlainSelector(selector)) home.onPlain = true;
    }
    homes.set(name, home);
  }
  return homes;
}

/**
 * Does a value set on an ancestor reach the plain component that reads this
 * variable? That is what decides whether `Theme` can set it.
 *
 * Yes when Bulma declares it on a variables host: that is how it is meant to
 * be set, and the host is an ancestor of everything. Yes, too, when nothing
 * plain declares it, because then only a modifier or a state does
 * (`--bulma-grid-cell-column-start` lives on `.cell.is-col-start-*` alone),
 * and an unmodified element inherits whatever its ancestors set. No when the
 * plain component declares its own value, which beats anything inherited.
 *
 * A host declaration wins the tie, and that is the known edge of this rule.
 * Bulma declares some variables on `:root` and again on one plain component,
 * so a value set above reaches every other element while that component
 * keeps its own. Counting them as reaching is the smaller error: calling
 * them component-scoped would make `Theme` warn that a value which works
 * almost everywhere does nothing. The component that keeps its own value
 * lists the variable on its API page as declared there, which is where a
 * reader looking at that component will find it.
 */
export function reachesFromAncestor(home) {
  return !home || home.onHost || !home.onPlain;
}
