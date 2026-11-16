// How a styles suite resolves what a partial that adjusts stock Bulma does
// next to Bulma's own CSS. jsdom never loads the partial on its own, and which
// value wins is a cascade across Bulma's sheet and the partial, in either
// order, which jsdom doesn't compute. So a suite compiles the real partial,
// links it with Bulma's CSS on either side, and resolves the values itself,
// the way a browser would: importance, then specificity, then source order. A
// rule this can't rank, or one in a block it doesn't walk, fails the test
// rather than dropping out.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';

const SCSS = path.resolve(__dirname, '../scss');

// The Bulma bulma-ui depends on, found once, through its package.json. A
// partial compiles against its Sass and is checked against its CSS, so an
// upgrade moves the two together.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

/** The CSS a Sass source compiles to, with `src/scss` and Bulma to load. */
export const compileSource = (source: string) =>
  sass.compileString(source, {
    // The directory holding that Bulma, so `bulma/…` resolves to it.
    loadPaths: [SCSS, path.dirname(BULMA)],
    quietDeps: true,
    logger: sass.Logger.silent,
  }).css;

/** The partial at `partial` under `src/scss`, compiled with a class prefix. */
export const compilePartial = (partial: string, prefix = '') =>
  compileSource(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use '${partial}';`
  );

/** One of Bulma's own stylesheets. */
export const bulmaCss = (file = 'bulma.css') =>
  fs.readFileSync(path.join(BULMA, 'css', file), 'utf8');

/**
 * The sheet's top-level style rules, in source order, and the style rules
 * nested in an at-rule, each with the outermost at-rule it sits in. `all`
 * holds every style rule in source order, each with every at-rule around it,
 * outermost first.
 */
export function rulesOf(css: string) {
  const sheet = document.createElement('style');
  // An @charset is valid only at the very start, and two sheets joined put
  // one in the middle.
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  const rules: CSSStyleRule[] = [];
  const nested: { rule: CSSStyleRule; within: string }[] = [];
  const all: { rule: CSSStyleRule; within: string[] }[] = [];
  const walk = (list: CSSRuleList, within: string[]) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSStyleRule) {
        if (within.length) nested.push({ rule, within: within[0] });
        else rules.push(rule);
        all.push({ rule, within });
      } else if ('cssRules' in rule) {
        walk((rule as CSSGroupingRule).cssRules, [
          ...within,
          rule.cssText.split('{')[0].trim(),
        ]);
      }
    }
  };
  try {
    walk((sheet.sheet as CSSStyleSheet).cssRules, []);
  } finally {
    sheet.remove();
  }
  return { rules, nested, all };
}

/** The at-rule a forced-colors page applies, as `rulesOf` reports it. */
const FORCED_COLORS = /^@media\s*\(forced-colors:\s*active\)$/;

// The last sheet `cascade` parsed. A suite resolves several properties on
// several elements from one sheet, and parsing Bulma's whole stylesheet into
// jsdom each time is slow.
let lastParsed: { css: string; parsed: ReturnType<typeof rulesOf> } | undefined;
const parse = (css: string) => {
  if (lastParsed?.css !== css) lastParsed = { css, parsed: rulesOf(css) };
  return lastParsed.parsed;
};

/** Whether `el` matches `selector`; a pseudo-element never does. */
export const matches = (el: Element, selector: string) => {
  if (selector.includes('::')) return false;
  try {
    return el.matches(selector);
  } catch {
    return false;
  }
};

/** Whether one rank comes before another, comparing from the front. */
const outranks = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
};

/** A selector list split at its own commas, not those inside parentheses. */
export function splitList(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let part = '';
  for (const char of list) {
    if (char === ',' && depth === 0) {
      parts.push(part.trim());
      part = '';
      continue;
    }
    if (char === '(') depth++;
    else if (char === ')') depth--;
    part += char;
  }
  parts.push(part.trim());
  return parts;
}

/**
 * Specificity as [ids, classes, types], as browsers count it: `:is()`,
 * `:has()` and `:not()` count as their most specific argument, and
 * `:where()` as nothing. Any other functional pseudo-class is refused.
 */
function specificity(selector: string): number[] {
  const total = [0, 0, 0];
  let rest = '';
  for (let i = 0; i < selector.length;) {
    const fn = /^:([\w-]+)\(/.exec(selector.slice(i));
    if (!fn) {
      rest += selector[i++];
      continue;
    }
    const open = i + fn[0].length - 1;
    let close = open;
    for (let depth = 0; close < selector.length; close++) {
      if (selector[close] === '(') depth++;
      else if (selector[close] === ')' && --depth === 0) break;
    }
    const arg = selector.slice(open + 1, close);
    if (['is', 'has', 'not'].includes(fn[1])) {
      splitList(arg)
        .map(specificity)
        .reduce((most, next) => (outranks(next, most) ? next : most))
        .forEach((count, k) => (total[k] += count));
    } else if (fn[1] !== 'where') {
      throw new Error(
        `${selector} uses :${fn[1]}(${arg}), which this resolver does not ` +
          'rank. Extend `specificity` before trusting a result.'
      );
    }
    rest += ' ';
    i = close + 1;
  }
  return [
    total[0] + (rest.match(/#[\w-]+/g) ?? []).length,
    total[1] + (rest.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length,
    total[2] + (rest.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length,
  ];
}

/** The selectors in a rule's list that match `el`. */
const matching = (el: Element, rule: CSSStyleRule) =>
  splitList(rule.selectorText).filter(part => matches(el, part));

/**
 * The value `el` gets from the rules of `css` for one property, which
 * `properties` names along with any shorthand that sets it. `valueOf` reads
 * what a declaration of one of those sets the property to, or undefined when
 * it sets nothing. Only rules that match `el` count, so a value it would
 * inherit is left out.
 * With `has: false` it resolves them as a browser without `:has()` does,
 * which drops every rule whose selector uses it. With `forcedColors: true` it
 * resolves them as a forced-colors page does, where the rules in a
 * `@media (forced-colors: active)` block apply in their place in the sheet,
 * and with `forcedColors: false` as any other page does, where they don't.
 * Left out, a rule in that block fails like one in any other at-rule.
 */
export function cascade(
  el: Element,
  css: string,
  properties: string[],
  valueOf: (style: CSSStyleDeclaration, property: string) => string | undefined,
  { has = true, forcedColors }: { has?: boolean; forcedColors?: boolean } = {}
): string | undefined {
  const parsed = parse(css);
  const supported = (rule: CSSStyleRule) =>
    has || !rule.selectorText.includes(':has(');
  // Inside a forced-colors block that no other at-rule wraps, at any depth.
  const forced = (within: string[]) =>
    within.length > 0 && FORCED_COLORS.test(within[0]);
  // Applies at the top level, and directly in a forced-colors block on a
  // forced-colors page. Another at-rule inside that block isn't modelled.
  const applies = (within: string[]) =>
    within.length === 0 ||
    (forcedColors === true && within.length === 1 && forced(within));
  const rules = parsed.all
    .filter(({ rule, within }) => supported(rule) && applies(within))
    .map(({ rule }) => rule);
  const nested = parsed.all
    .filter(
      ({ rule, within }) =>
        supported(rule) &&
        !applies(within) &&
        !(forcedColors === false && forced(within))
    )
    .map(({ rule, within }) => ({ rule, within: within.join(' ') }));
  // `@media`, `@supports`, `@layer` and the like change when or in what
  // order their rules apply, which this file doesn't model, so a value set
  // in one fails rather than being read as if it always applied.
  for (const { rule, within } of nested) {
    if (
      properties.some(p => rule.style.getPropertyValue(p)) &&
      matching(el, rule).length > 0
    ) {
      throw new Error(
        `${within} sets ${properties.join(' or ')} on ${rule.selectorText}, ` +
          'in a block this resolver does not walk. Extend `cascade` before ' +
          'trusting a result.'
      );
    }
  }
  let won: { value: string; rank: number[] } | undefined;
  rules.forEach((rule, order) => {
    const { style } = rule;
    // In the order the rule declares them, so a later one wins a tie. jsdom's
    // sheet declarations index like an array but have no item().
    const declared = Array.from(
      { length: style.length },
      (_, i) => style[i]
    ).filter(property => properties.includes(property));
    if (declared.length === 0) return;
    const selectors = matching(el, rule);
    if (selectors.length === 0) return;
    const specific = selectors
      .map(specificity)
      .reduce((best, next) => (outranks(next, best) ? next : best));
    declared.forEach((property, index) => {
      const value = valueOf(style, property);
      if (!value) return;
      const rank = [
        style.getPropertyPriority(property) === 'important' ? 1 : 0,
        ...specific,
        order,
        index,
      ];
      if (!won || outranks(rank, won.rank)) won = { value, rank };
    });
  });
  return won?.value;
}

/** The custom property `name` declared on `el`, as the rules of `css` resolve it. */
export const customProperty = (el: Element, css: string, name: string) =>
  cascade(
    el,
    css,
    [name],
    (style, property) => style.getPropertyValue(property).trim() || undefined
  );
