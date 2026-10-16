// A mixed Checkbox draws its dash from _checkbox.scss, which jsdom never loads
// on its own. jsdom also evaluates no media query and computes no
// pseudo-element styles, so these compile the partial, read its rules off the
// sheet, and resolve which one wins on the markup a Checkbox renders, the way
// a browser with forced colors on (or off) would.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Checkbox, type CheckboxProps } from '../Checkbox';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const css = sass.compile(path.join(SCSS, 'form/_checkbox.scss'), {
  loadPaths: [NODE_MODULES],
  quietDeps: true,
  logger: sass.Logger.silent,
}).css;

type Rule = { selector: string; style: CSSStyleDeclaration; media: string };

/** Every style rule in the sheet, in source order, with its media query. */
function rulesOf(source: string): Rule[] {
  const sheet = document.createElement('style');
  sheet.textContent = source.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  const out: Rule[] = [];
  const walk = (list: CSSRuleList, media: string) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSStyleRule) {
        for (const selector of rule.selectorText.split(/,(?![^(]*\))/)) {
          out.push({ selector: selector.trim(), style: rule.style, media });
        }
      } else if (rule instanceof CSSMediaRule) {
        walk(rule.cssRules, rule.media.mediaText);
      }
    }
  };
  try {
    walk((sheet.sheet as CSSStyleSheet).cssRules, '');
  } finally {
    sheet.remove();
  }
  return out;
}

const RULES = rulesOf(css);

/** Specificity as [ids, classes, types], enough for this partial's rules. */
const specificity = (selector: string): number[] => [
  (selector.match(/#[\w-]+/g) ?? []).length,
  (selector.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length,
  (selector.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length,
];

const outranks = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true; // equal: the later declaration wins
};

/**
 * The value `property` gets on `el`, or on its `::before`, from the partial:
 * the most specific matching rule, the later one on a tie. Forced colors adds
 * the rules in its media block and leaves out every other media block.
 */
function resolve(
  el: Element,
  property: string,
  { before = false, forcedColors = false } = {}
): string | undefined {
  let won: { value: string; rank: number[] } | undefined;
  for (const { selector, style, media } of RULES) {
    if (media && !(forcedColors && media === '(forced-colors: active)')) {
      continue;
    }
    const target = before
      ? selector.endsWith('::before') && selector.slice(0, -'::before'.length)
      : !selector.includes('::') && selector;
    if (!target || !el.matches(target)) continue;
    const value = style.getPropertyValue(property);
    if (!value) continue;
    const rank = specificity(target);
    if (!won || outranks(rank, won.rank)) won = { value, rank };
  }
  return won?.value;
}

const checkOf = (props: CheckboxProps) =>
  render(<Checkbox onChange={() => {}} {...props} />).container.querySelector(
    '.check'
  ) as HTMLElement;

describe('a mixed Checkbox', () => {
  it('draws its dash with a background color', () => {
    // Which forced colors repaints, so the dash needs a rule of its own there.
    const check = checkOf({ indeterminate: true });
    expect(resolve(check, 'background-color', { before: true })).toBe(
      'var(--bulma-checkbox-check-color)'
    );
    expect(resolve(check, 'background-color')).toBe(
      'var(--bulma-checkbox-indeterminate-color)'
    );
  });

  it.each([
    ['unchecked', false],
    ['checked', true],
  ])('keeps its dash in forced colors when %s', (_label, checked) => {
    const check = checkOf({ indeterminate: true, checked });
    expect(
      resolve(check, 'background-color', { before: true, forcedColors: true })
    ).toBe('CanvasText');
    expect(resolve(check, 'background-color', { forcedColors: true })).toBe(
      'Canvas'
    );
  });
});

describe('a checked Checkbox that is not mixed, in forced colors', () => {
  it('keeps the Highlight fill', () => {
    const check = checkOf({ checked: true });
    expect(resolve(check, 'background-color', { forcedColors: true })).toBe(
      'Highlight'
    );
    expect(
      resolve(check, 'background-color', { before: true, forcedColors: true })
    ).toBeUndefined();
  });
});
