// A PinInput's boxes are Bulma `.input`s laid out by _pininput.scss, under an
// input the partial makes transparent. jsdom never loads the partial on its
// own, evaluates no media query and computes no pseudo-element styles, so
// these compile it, with no prefix and under one, read its rules off the
// sheet, and resolve which one wins on the markup a PinInput renders, the
// way a browser would with forced colors on or off, or with reduced motion.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { PinInput, type PinInputProps } from '../PinInput';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string, module = 'form/pininput') =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use '${module}';`,
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
  // An @charset is valid only at the very start, and two sheets joined put
  // one in the middle.
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

/** Specificity as [ids, classes, types], enough for these rules. */
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
 * Whether `el` matches `selector`, and false for one jsdom can't parse, such
 * as Bulma's vendor placeholder selectors, none of which reach these elements.
 */
const matches = (el: Element, selector: string) => {
  try {
    return el.matches(selector);
  } catch {
    return false;
  }
};

type Media = 'forced-colors' | 'reduced-motion';
const MEDIA: Record<Media, string> = {
  'forced-colors': '(forced-colors: active)',
  'reduced-motion': '(prefers-reduced-motion: reduce)',
};

/**
 * The value `property` gets on `el`, or on its `::after`, from the rules:
 * the most specific matching rule, the later one on a tie. A media query
 * adds the rules in its block and leaves out every other media block.
 */
function resolveIn(
  rules: Rule[],
  el: Element,
  property: string,
  { pseudo, media }: { pseudo?: '::after'; media?: Media } = {}
): string | undefined {
  let won: { value: string; rank: number[] } | undefined;
  for (const { selector, style, media: within } of rules) {
    if (within && !(media && within === MEDIA[media])) continue;
    const target = pseudo
      ? selector.endsWith(pseudo) && selector.slice(0, -pseudo.length)
      : !selector.includes('::') && selector;
    if (!target || !matches(el, target)) continue;
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
])('the PinInput partial with %s', (_label, prefix) => {
  const CSS = compile(prefix);
  const RULES = rulesOf(CSS);
  // Bulma's input rules loaded after this partial, the order that tests
  // whether the partial's rules outrank them rather than follow them.
  const BULMA_LAST = rulesOf(
    CSS + compile(prefix, 'bulma/sass/form/input-textarea')
  );
  const resolve = (
    el: Element,
    property: string,
    options?: Parameters<typeof resolveIn>[3]
  ) => resolveIn(RULES, el, property, options);
  const caret = (el: Element, property: string, media?: Media) =>
    resolve(el, property, { pseudo: '::after', media });

  const renderPin = (props: PinInputProps = {}) => {
    const { container } = render(
      <ConfigProvider classPrefix={prefix}>
        <PinInput aria-label="Code" {...props} />
      </ConfigProvider>
    );
    const boxes = Array.from(
      container.querySelectorAll(`.${prefix}pin-input-box`)
    );
    return {
      field: container.querySelector(`.${prefix}pin-input-field`)!,
      row: container.querySelector(`.${prefix}pin-input`)!,
      boxes,
      // A box with the classes the selection gives it, which jsdom draws
      // only once the input has focus.
      boxWith: (...classes: string[]) => {
        boxes[0].classList.add(...classes.map(name => `${prefix}${name}`));
        return boxes[0];
      },
    };
  };

  it('selects every class by the prefix the PinInput renders it with', () => {
    const classes = RULES.flatMap(({ selector }) =>
      Array.from(selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g), m => m[1])
    );
    expect(classes).toEqual(
      expect.arrayContaining([
        `${prefix}pin-input`,
        `${prefix}pin-input-field`,
        `${prefix}pin-input-box`,
        `${prefix}input`,
        `${prefix}has-caret`,
        `${prefix}is-focused`,
        `${prefix}is-disabled`,
      ])
    );
    expect(classes.filter(name => !name.startsWith(prefix))).toEqual([]);
    // The caret's keyframes too, so a prefixed build doesn't share a name.
    expect(CSS).toContain(`@keyframes ${prefix}pin-input-caret-blink`);
  });

  it('lays the row out as wide as its boxes, and no wider than its container', () => {
    const { row } = renderPin();
    expect(resolve(row, 'display')).toBe('inline-flex');
    expect(resolve(row, 'position')).toBe('relative');
    expect(resolve(row, 'max-width')).toBe('100%');
  });

  it('draws square boxes with their character centered, a gap apart', () => {
    const { boxes } = renderPin();
    expect(resolve(boxes[0], 'width')).toBe('var(--bulma-pin-input-box-width)');
    expect(resolve(boxes[0], 'justify-content')).toBe('center');
    expect(resolve(boxes[0], 'padding-left')).toBe('0');
    expect(resolve(boxes[0], 'padding-right')).toBe('0');
    expect(resolve(boxes[0], 'min-width')).toBe('0');
    expect(resolve(boxes[0], 'margin-inline-start')).toBeUndefined();
    expect(resolve(boxes[1], 'margin-inline-start')).toBe(
      'var(--bulma-pin-input-gap)'
    );
  });

  it('keeps that layout over Bulma’s input rules whichever loads first', () => {
    // Bulma's `.input` sets the width and its `.input.is-rounded` the
    // padding, so the box's rule has to outrank both, not follow them.
    const { boxes } = renderPin({ isRounded: true });
    expect(resolveIn(BULMA_LAST, boxes[0], 'width')).toBe(
      'var(--bulma-pin-input-box-width)'
    );
    expect(resolveIn(BULMA_LAST, boxes[0], 'padding-left')).toBe('0');
    expect(resolveIn(BULMA_LAST, boxes[0], 'padding-right')).toBe('0');
  });

  it('lays the input over the whole row with its text, caret and selection transparent', () => {
    const { field } = renderPin();
    expect(resolve(field, 'position')).toBe('absolute');
    expect(resolve(field, 'top')).toBe('0');
    expect(resolve(field, 'left')).toBe('0');
    expect(resolve(field, 'width')).toBe('100%');
    expect(resolve(field, 'height')).toBe('100%');
    expect(resolve(field, 'z-index')).toBe('1');
    expect(resolve(field, 'color')).toBe('transparent');
    expect(resolve(field, 'caret-color')).toBe('transparent');
    expect(resolve(field, 'background')).toBe('transparent');
    // Never under 16px, or iOS zooms the page when it takes focus.
    expect(resolve(field, 'font-size')).toBe('max(1em, 16px)');
    const selection = RULES.find(
      ({ selector }) => selector === `.${prefix}pin-input-field::selection`
    );
    expect(selection?.style.getPropertyValue('color')).toBe('transparent');
  });

  it('hides the input under autofill, whose fill would cover the boxes', () => {
    const autofill = RULES.filter(({ selector }) =>
      selector.endsWith('autofill')
    );
    expect(autofill.map(({ selector }) => selector).sort()).toEqual([
      `.${prefix}pin-input-field:-webkit-autofill`,
      `.${prefix}pin-input-field:autofill`,
    ]);
    for (const { style } of autofill) {
      expect(style.getPropertyValue('opacity')).toBe('0');
    }
  });

  it('draws a blinking caret in the box that has it', () => {
    const { boxes, boxWith } = renderPin();
    expect(caret(boxes[1], 'content')).toBeUndefined();
    const box = boxWith('is-focused', 'has-caret');
    expect(caret(box, 'content')).toBe('""');
    expect(caret(box, 'width')).toBe('var(--bulma-pin-input-caret-width)');
    expect(caret(box, 'height')).toBe('var(--bulma-pin-input-caret-height)');
    expect(caret(box, 'background-color')).toBe(
      'var(--bulma-pin-input-caret-color)'
    );
    expect(caret(box, 'animation')).toBe(
      `${prefix}pin-input-caret-blink var(--bulma-pin-input-caret-blink-duration) step-end infinite`
    );
  });

  it('stops the caret blinking under reduced motion, and keeps it drawn', () => {
    const box = renderPin().boxWith('is-focused', 'has-caret');
    expect(caret(box, 'animation', 'reduced-motion')).toBe('none');
    expect(caret(box, 'content', 'reduced-motion')).toBe('""');
  });

  it('draws a disabled box the way Bulma draws a disabled input', () => {
    const { boxes } = renderPin({ disabled: true });
    expect(resolve(boxes[0], 'background-color')).toBe(
      'var(--bulma-input-disabled-background-color)'
    );
    expect(resolve(boxes[0], 'border-color')).toBe(
      'var(--bulma-input-disabled-border-color)'
    );
    expect(resolve(boxes[0], 'color')).toBe(
      'var(--bulma-input-disabled-color)'
    );
    expect(resolve(boxes[0], 'box-shadow')).toBe('none');
  });

  describe('in forced colors', () => {
    const forced = { media: 'forced-colors' as const };

    it('keeps the input’s text and caret transparent over the boxes', () => {
      const { field } = renderPin();
      expect(resolve(field, 'forced-color-adjust', forced)).toBe('none');
      expect(resolve(field, 'forced-color-adjust')).toBeUndefined();
    });

    it('outlines the box at the caret in Highlight, where Bulma’s ring is gone', () => {
      const { boxes, boxWith } = renderPin();
      const focused = boxWith('is-focused');
      expect(resolve(focused, 'outline', forced)).toBe('2px solid Highlight');
      expect(resolve(focused, 'border-color', forced)).toBe('Highlight');
      expect(resolve(boxes[1], 'outline', forced)).toBeUndefined();
      // Outranking Bulma's own focus border, whichever loads first.
      expect(resolveIn(BULMA_LAST, focused, 'border-color', forced)).toBe(
        'Highlight'
      );
    });

    it('draws the caret in the text color, not the forced background', () => {
      const box = renderPin().boxWith('is-focused', 'has-caret');
      expect(caret(box, 'background-color', 'forced-colors')).toBe(
        'CanvasText'
      );
      expect(caret(box, 'forced-color-adjust', 'forced-colors')).toBe('none');
    });

    it('draws a disabled box in GrayText', () => {
      const { boxes } = renderPin({ disabled: true });
      expect(resolve(boxes[0], 'color', forced)).toBe('GrayText');
      expect(resolve(boxes[0], 'border-color', forced)).toBe('GrayText');
    });
  });

  describe('on a right-to-left page', () => {
    it('writes no rule of its own for it, since the row stays left to right', () => {
      expect(RULES.filter(({ selector }) => /rtl|dir/.test(selector))).toEqual(
        []
      );
      const { container } = render(
        <div dir="rtl">
          <ConfigProvider classPrefix={prefix}>
            <PinInput aria-label="Code" />
          </ConfigProvider>
        </div>
      );
      const row = container.querySelector(`.${prefix}pin-input`)!;
      expect(row).toHaveAttribute('dir', 'ltr');
      // So the gap, a logical margin, falls on each box's left.
      const boxes = row.querySelectorAll(`.${prefix}pin-input-box`);
      expect(resolve(boxes[1], 'margin-inline-start')).toBe(
        'var(--bulma-pin-input-gap)'
      );
    });
  });
});
