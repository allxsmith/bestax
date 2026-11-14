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
 * nested in an at-rule, each with the at-rule it sits in.
 */
export function rulesOf(css: string) {
  const sheet = document.createElement('style');
  // An @charset is valid only at the very start, and two sheets joined put
  // one in the middle.
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  const rules: CSSStyleRule[] = [];
  const nested: { rule: CSSStyleRule; within: string }[] = [];
  const walk = (list: CSSRuleList, within?: string) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSStyleRule) {
        if (within) nested.push({ rule, within });
        else rules.push(rule);
      } else if ('cssRules' in rule) {
        walk(
          (rule as CSSGroupingRule).cssRules,
          within ?? rule.cssText.split('{')[0].trim()
        );
      }
    }
  };
  try {
    walk((sheet.sheet as CSSStyleSheet).cssRules);
  } finally {
    sheet.remove();
  }
  return { rules, nested };
}

/** Whether `el` matches `selector`; a pseudo-element never does. */
const matches = (el: Element, selector: string) => {
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

/**
 * Specificity as [ids, classes, types]. `:has()` and `:not()` count as their
 * most specific argument, which is all the rules here need; any other
 * functional pseudo-class, or one inside another, is refused.
 */
function specificity(selector: string): number[] {
  for (const [, name, arg] of selector.matchAll(/:([\w-]+)\(([^)]*)\)/g)) {
    if (!['has', 'not'].includes(name) || arg.includes('(')) {
      throw new Error(
        `${selector} uses :${name}(${arg}), which this resolver does not ` +
          'rank. Extend `specificity` before trusting a result.'
      );
    }
  }
  const flat = selector.replace(
    /:(?:has|not)\(([^)]*)\)/g,
    (_, arg: string) =>
      ` ${arg
        .split(',')
        .map(part => part.trim())
        .reduce((most, next) =>
          outranks(specificity(next), specificity(most)) ? next : most
        )} `
  );
  return [
    (flat.match(/#[\w-]+/g) ?? []).length,
    (flat.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length,
    (flat.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length,
  ];
}

/** The selectors in a rule's list that match `el`. */
const matching = (el: Element, rule: CSSStyleRule) =>
  rule.selectorText
    .split(/,(?![^(]*\))/)
    .map(part => part.trim())
    .filter(part => matches(el, part));

/**
 * The value `el` gets from the rules of `css` for one property, which
 * `properties` names along with any shorthand that sets it. `valueOf` reads
 * what a declaration of one of those sets the property to, or undefined when
 * it sets nothing. Only rules that match `el` count, so a value it would
 * inherit is left out.
 * With `has: false` it resolves them as a browser without `:has()` does,
 * which drops every rule whose selector uses it.
 */
export function cascade(
  el: Element,
  css: string,
  properties: string[],
  valueOf: (style: CSSStyleDeclaration, property: string) => string | undefined,
  { has = true } = {}
): string | undefined {
  const parsed = rulesOf(css);
  const supported = (rule: CSSStyleRule) =>
    has || !rule.selectorText.includes(':has(');
  const rules = parsed.rules.filter(supported);
  const nested = parsed.nested.filter(({ rule }) => supported(rule));
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
