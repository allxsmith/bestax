// A Switch draws its track and its knob from _switch.scss, which jsdom never
// loads on its own. jsdom also evaluates no media query and computes no
// pseudo-element styles, so these compile the partial, with no prefix and
// under one, read its rules off the sheet, and resolve which one wins on the
// markup a Switch renders, the way a browser with forced colors on (or off)
// would.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Switch, type SwitchProps } from '../Switch';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/switch';`,
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
 * The value `property` gets on `el`, or on its `::before` (the knob), from
 * the rules: the most specific matching rule, the later one on a tie. Forced
 * colors adds the rules in its media block and leaves out every other media
 * block.
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
])('the Switch partial with %s', (_label, prefix) => {
  const RULES = rulesOf(compile(prefix));
  const resolve = (
    el: Element,
    property: string,
    options?: Parameters<typeof resolveIn>[3]
  ) => resolveIn(RULES, el, property, options);
  const knob = (el: Element, property: string) =>
    resolve(el, property, { pseudo: '::before' });

  const renderSwitch = (props: SwitchProps) =>
    render(
      <ConfigProvider classPrefix={prefix}>
        <Switch onChange={() => {}} {...props} />
      </ConfigProvider>
    ).container;

  const trackOf = (props: SwitchProps) =>
    renderSwitch(props).querySelector(`.${prefix}check`) as HTMLElement;

  const labelOf = (props: SwitchProps) =>
    renderSwitch({ children: 'Notifications', ...props }).querySelector(
      `.${prefix}control-label`
    ) as HTMLElement;

  it('selects every class by the prefix the Switch renders it with', () => {
    // A class the partial writes bare matches nothing in a prefixed build,
    // which is how the track once went undrawn there.
    const classes = RULES.flatMap(({ selector }) =>
      Array.from(selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g), m => m[1])
    );
    expect(classes).toEqual(
      expect.arrayContaining([`${prefix}check`, `${prefix}control-label`])
    );
    expect(classes.filter(name => !name.startsWith(prefix))).toEqual([]);
  });

  it('draws the track, and fills it when checked', () => {
    const track = trackOf({});
    expect(resolve(track, 'width')).toBe('var(--bulma-switch-width)');
    expect(resolve(track, 'height')).toBe('var(--bulma-switch-height)');
    expect(resolve(track, 'background-color')).toBe(
      'var(--bulma-switch-background)'
    );
    expect(resolve(trackOf({ checked: true }), 'background-color')).toBe(
      'var(--bulma-switch-active-color)'
    );
  });

  it('draws the thin, outlined and passive tracks', () => {
    expect(resolve(trackOf({ isThin: true }), 'height')).toBe(
      'var(--bulma-switch-thin-height)'
    );
    expect(
      resolve(trackOf({ isOutlined: true, checked: true }), 'border-color')
    ).toBe('var(--bulma-switch-active-color)');
    expect(
      resolve(trackOf({ passiveType: 'danger' }), 'background-color')
    ).toBe('var(--bulma-danger)');
  });

  it('sets the label a gap from the track, on the other side in RTL', () => {
    expect(resolve(labelOf({}), 'margin-left')).toBe(
      'var(--bulma-switch-label-gap)'
    );
    const rtl = labelOf({ isRtl: true });
    expect(resolve(rtl, 'margin-left')).toBe('0');
    expect(resolve(rtl, 'margin-right')).toBe('var(--bulma-switch-label-gap)');
  });

  it('dims the track and its label when disabled', () => {
    expect(resolve(trackOf({ disabled: true }), 'opacity')).toBe('0.5');
    expect(resolve(labelOf({ disabled: true }), 'opacity')).toBe('0.5');
  });

  it('draws the track in system colors in forced colors', () => {
    const forced = { forcedColors: true };
    expect(resolve(trackOf({}), 'border-color', forced)).toBe('ButtonText');
    expect(
      resolve(trackOf({ checked: true }), 'background-color', forced)
    ).toBe('Highlight');
    expect(resolve(trackOf({ disabled: true }), 'border-color', forced)).toBe(
      'GrayText'
    );
  });

  describe('the knob', () => {
    it('draws a round knob at the start of the track', () => {
      const track = trackOf({});
      expect(knob(track, 'content')).toBe('""');
      expect(knob(track, 'border-radius')).toBe('50%');
      expect(knob(track, 'top')).toBe('var(--bulma-switch-padding)');
      expect(knob(track, 'left')).toBe('var(--bulma-switch-padding)');
      expect(knob(track, 'background-color')).toBe(
        'var(--bulma-switch-circle-color)'
      );
      expect(knob(track, 'transform')).toBeUndefined();
    });

    it('moves the knob to the end when checked', () => {
      expect(knob(trackOf({ checked: true }), 'transform')).toBe(
        'translateX(calc(var(--bulma-switch-width) - var(--bulma-switch-height)))'
      );
    });

    it('draws the thin knob, and colors and moves it when checked', () => {
      const thin = trackOf({ isThin: true });
      expect(knob(thin, 'width')).toBe('var(--bulma-switch-thin-circle-size)');
      expect(knob(thin, 'background-color')).toBe(
        'var(--bulma-switch-background)'
      );
      const checked = trackOf({ isThin: true, checked: true });
      expect(knob(checked, 'background-color')).toBe(
        'var(--bulma-switch-active-color)'
      );
      expect(knob(checked, 'transform')).toBe(
        'translateX(calc(var(--bulma-switch-width) - var(--bulma-switch-thin-circle-size) - var(--bulma-switch-padding) * 2))'
      );
    });

    it('colors the outlined and passive knobs', () => {
      expect(knob(trackOf({ isOutlined: true }), 'background-color')).toBe(
        'var(--bulma-switch-background)'
      );
      expect(
        knob(trackOf({ isOutlined: true, checked: true }), 'background-color')
      ).toBe('var(--bulma-switch-active-color)');
      expect(
        knob(
          trackOf({ isOutlined: true, passiveType: 'danger' }),
          'background-color'
        )
      ).toBe('var(--bulma-danger)');
      expect(knob(trackOf({ isRounded: true }), 'border-radius')).toBe('50%');
    });
  });
});
