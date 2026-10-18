// A Radio draws its circle and its dot from _radio.scss, which jsdom never
// loads on its own. jsdom also evaluates no media query and computes no
// pseudo-element styles, so these compile the partial, with no prefix and
// under one, read its rules off the sheet, and resolve which one wins on the
// markup a Radio renders, the way a browser with forced colors on (or off)
// would.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Radio, type RadioProps } from '../Radio';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, resolved through package.json since jest
// maps any `.css` specifier to a stub.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/radio';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

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
 * The value `property` gets on `el`, or on its `::before`, from the rules:
 * the most specific matching rule, the later one on a tie. Forced colors adds
 * the rules in its media block and leaves out every other media block.
 */
function resolveIn(
  rules: Rule[],
  el: Element,
  property: string,
  {
    pseudo,
    forcedColors = false,
  }: { pseudo?: '::before'; forcedColors?: boolean } = {}
): string | undefined {
  let won: { value: string; rank: number[] } | undefined;
  for (const { selector, style, media } of rules) {
    if (media && !(forcedColors && media === '(forced-colors: active)')) {
      continue;
    }
    const target = pseudo
      ? selector.endsWith(pseudo) && selector.slice(0, -pseudo.length)
      : !selector.includes('::') && selector;
    if (!target || !el.matches(target)) continue;
    const value = style.getPropertyValue(property);
    if (!value) continue;
    const rank = specificity(target);
    if (!won || outranks(rank, won.rank)) won = { value, rank };
  }
  return won?.value;
}

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the Radio partial with %s', (_label, prefix) => {
  const RULES = rulesOf(compile(prefix));
  const resolve = (
    el: Element,
    property: string,
    options?: Parameters<typeof resolveIn>[3]
  ) => resolveIn(RULES, el, property, options);

  const renderRadio = (props: RadioProps) =>
    render(
      <ConfigProvider classPrefix={prefix}>
        <Radio name="plan" onChange={() => {}} {...props} />
      </ConfigProvider>
    ).container;

  const checkOf = (props: RadioProps) =>
    renderRadio(props).querySelector(`.${prefix}check`) as HTMLElement;

  it('selects every class by the prefix the Radio renders it with', () => {
    // A class the partial writes bare matches nothing in a prefixed build,
    // which is how the circle once went undrawn there.
    const classes = RULES.flatMap(({ selector }) =>
      Array.from(selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g), m => m[1])
    );
    expect(classes).toEqual(
      expect.arrayContaining([`${prefix}check`, `${prefix}control-label`])
    );
    expect(classes.filter(name => !name.startsWith(prefix))).toEqual([]);
  });

  it('draws the circle, with its dot hidden', () => {
    const check = checkOf({});
    expect(resolve(check, 'width')).toBe('var(--bulma-radio-size)');
    expect(resolve(check, 'height')).toBe('var(--bulma-radio-size)');
    expect(resolve(check, 'border-radius')).toBe('50%');
    expect(resolve(check, 'opacity', { pseudo: '::before' })).toBe('0');
  });

  it('rings the circle and shows the dot when checked', () => {
    const check = checkOf({ checked: true });
    expect(resolve(check, 'border-color')).toBe(
      'var(--bulma-radio-active-color)'
    );
    expect(resolve(check, 'opacity', { pseudo: '::before' })).toBe('1');
    expect(resolve(check, 'background-color', { pseudo: '::before' })).toBe(
      'var(--bulma-radio-active-color)'
    );
  });

  it('sets the label a gap from the circle', () => {
    const label = renderRadio({ children: 'Monthly' }).querySelector(
      `.${prefix}control-label`
    ) as HTMLElement;
    expect(resolve(label, 'margin-left')).toBe('var(--bulma-radio-label-gap)');
  });

  it('dims the circle and its label when disabled', () => {
    const container = renderRadio({ disabled: true, children: 'Yearly' });
    const check = container.querySelector(`.${prefix}check`) as HTMLElement;
    const label = container.querySelector(
      `.${prefix}control-label`
    ) as HTMLElement;
    expect(resolve(check, 'opacity')).toBe('0.5');
    expect(resolve(label, 'opacity')).toBe('0.5');
  });

  it('draws the circle and the dot in system colors in forced colors', () => {
    const forced = { forcedColors: true };
    expect(resolve(checkOf({}), 'border-color', forced)).toBe('ButtonText');
    const checked = checkOf({ checked: true });
    expect(resolve(checked, 'border-color', forced)).toBe('Highlight');
    expect(
      resolve(checked, 'background-color', { ...forced, pseudo: '::before' })
    ).toBe('Highlight');
    expect(resolve(checkOf({ disabled: true }), 'border-color', forced)).toBe(
      'GrayText'
    );
  });
});
