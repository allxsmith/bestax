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
type Rule = { selectors: string[]; get: (property: string) => Declaration };

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

/** The top-level style rules of a stylesheet, read through jsdom's CSSOM. */
function rulesOf(css: string): Rule[] {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const out = Array.from(style.sheet!.cssRules)
    .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
    .map(rule => {
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
        get: (property: string) => snapshot[property],
      };
    });
  style.remove();
  return out;
}

/** Every declaration of `property` in a rule whose selector list has `selector`. */
const declarationsOf = (rules: Rule[], selector: string, property: string) =>
  rules
    .filter(rule => rule.selectors.includes(selector))
    .map(rule => rule.get(property))
    .filter(declaration => declaration.value !== '');

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
  // offsets, which holds only while the position helpers set none.
  it.each(validPositions.map(value => [value]))(
    'makes is-position-%s set position with !important and no offset',
    value => {
      const selector = `.is-position-${value}`;
      expect(declarationsOf(rules, selector, 'position')).toEqual([
        { value, important: true },
      ]);
      for (const offset of OFFSETS) {
        expect(declarationsOf(rules, selector, offset)).toEqual([]);
      }
    }
  );

  it('makes is-relative set position with !important and no offset', () => {
    expect(declarationsOf(rules, '.is-relative', 'position')).toEqual([
      { value: 'relative', important: true },
    ]);
    for (const offset of OFFSETS) {
      expect(declarationsOf(rules, '.is-relative', offset)).toEqual([]);
    }
  });
});
