// The `overlay` and `pos` TSDoc and the helpers guide say what the two do
// together, and that rests on Bulma's cascade: `.is-overlay` sets `position:
// absolute` and zeroes the offsets without `!important`, while the position
// helpers set `position` with it and no offset. jsdom resolves no cascade, so this reads the
// declarations out of the stylesheets instead, so that a Bulma release that
// changes either side fails here rather than leaving the docs wrong.
import fs from 'fs';
import path from 'path';
import * as sass from 'sass';
import { validPositions } from '../bulmaClassHelpers';

const PKG = path.resolve(__dirname, '../../..');
const OFFSETS = ['top', 'right', 'bottom', 'left'];

type Declaration = { value: string; important: boolean };
type Rule = {
  selectors: string[];
  /** Every property the rule declares, shorthands such as `inset` included. */
  properties: string[];
  get: (property: string) => Declaration;
};

const splitSelectors = (list: string): string[] => {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const ch = list[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      out.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(list.slice(start).trim());
  return out;
};

/**
 * Every style rule of a stylesheet, read through jsdom's CSSOM, including
 * the ones inside `@media`, `@supports` and `@layer` blocks.
 */
function rulesOf(css: string): Rule[] {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const flatten = (list: CSSRuleList): CSSStyleRule[] =>
    Array.from(list).flatMap(rule =>
      rule instanceof CSSStyleRule
        ? [rule]
        : 'cssRules' in rule
          ? flatten((rule as CSSGroupingRule).cssRules)
          : []
    );
  const out = flatten(style.sheet!.cssRules).map(rule => {
    const decl = rule.style;
    const read = (property: string): Declaration => ({
      value: decl.getPropertyValue(property).trim(),
      important: decl.getPropertyPriority(property) === 'important',
    });
    const snapshot = Object.fromEntries(
      ['position', ...OFFSETS].map(p => [p, read(p)])
    );
    return {
      selectors: splitSelectors(rule.selectorText),
      properties: Array.from(decl),
      get: (property: string) => snapshot[property],
    };
  });
  style.remove();
  return out;
}

/** What each rule whose selector list has `selector` declares. */
const propertiesOf = (rules: Rule[], selector: string) =>
  rules
    .filter(rule => rule.selectors.includes(selector))
    .map(rule => rule.properties);

/** Every declaration of `property` in a rule whose selector list has `selector`. */
const declarationsOf = (rules: Rule[], selector: string, property: string) =>
  rules
    .filter(rule => rule.selectors.includes(selector))
    .map(rule => rule.get(property))
    .filter(declaration => declaration.value !== '');

// The position helpers are checked by what they declare, so a declaration
// this reader cannot see would pass as an absent one. This pins that it sees
// a rule inside an at-rule and the `inset` shorthand, which reading the
// longhands of top-level rules does not.
it('reads rules inside at-rules and the inset shorthand', () => {
  const rules = rulesOf(
    '@media (min-width: 1px) { @supports (top: 0) { .a { top: 0 } } }' +
      '.b { position: fixed !important; inset: 0 }'
  );
  expect(propertiesOf(rules, '.a')).toEqual([['top']]);
  expect(propertiesOf(rules, '.b')).toEqual([['position', 'inset']]);
});

const SHEETS: Array<[string, () => string]> = [
  [
    'bestax.css',
    () =>
      sass.compile(path.join(PKG, 'src', 'scss', 'bestax.scss'), {
        loadPaths: [path.resolve(PKG, '../node_modules')],
        quietDeps: true,
        logger: sass.Logger.silent,
      }).css,
  ],
  [
    // What an app linking extras.css beside Bulma's own CSS gets.
    "Bulma's bulma.css",
    () =>
      fs.readFileSync(
        path.join(
          path.dirname(require.resolve('bulma/package.json')),
          'css',
          'bulma.css'
        ),
        'utf8'
      ),
  ],
];

describe.each(SHEETS)('%s', (_label, css) => {
  let rules: Rule[];
  beforeAll(() => {
    rules = rulesOf(css());
  }, 60000);

  it('makes is-overlay absolute without !important and zeroes its offsets', () => {
    expect(declarationsOf(rules, '.is-overlay', 'position')).toEqual([
      { value: 'absolute', important: false },
    ]);
    for (const offset of OFFSETS) {
      expect(declarationsOf(rules, '.is-overlay', offset)).toEqual([
        { value: expect.stringMatching(/^0(px)?$/), important: false },
      ]);
    }
  });

  // The docs say a position beside `overlay` keeps the overlay's zero
  // offsets, which holds only while the position helpers set none. Pinning
  // that a helper declares `position` and nothing else catches an offset in
  // any form, `inset` included.
  it.each(validPositions.map(value => [value]))(
    'makes is-position-%s set only position, with !important',
    value => {
      const selector = `.is-position-${value}`;
      expect(declarationsOf(rules, selector, 'position')).toEqual([
        { value, important: true },
      ]);
      expect(propertiesOf(rules, selector)).toEqual([['position']]);
    }
  );

  it('makes is-relative set only position, with !important', () => {
    expect(declarationsOf(rules, '.is-relative', 'position')).toEqual([
      { value: 'relative', important: true },
    ]);
    expect(propertiesOf(rules, '.is-relative')).toEqual([['position']]);
  });
});
