// `_loading.scss` draws Loading's spinner as a conic-gradient background, and
// forced colors (Windows' contrast themes) drops background images, so the
// partial redraws the spinner as a border there. jsdom evaluates no media
// query, so these compile the partial, with no prefix and under one, read its
// rules off the sheet, and resolve which one wins on the icon Loading renders,
// the way a browser would: by specificity, then source order.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Loading, type LoadingProps } from '../Loading';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, resolved through package.json since jest
// maps any `.css` specifier to a stub.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/loading';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

const FORCED = '(forced-colors: active)';

type Found = {
  /** One selector of the rule's list. */
  selector: string;
  /** The media query the rule sits in, or '' for none. */
  media: string;
  style: CSSStyleDeclaration;
  order: number;
};

/** Every style rule in `css`, one entry per selector, in source order. */
function rulesOf(css: string): Found[] {
  const sheet = document.createElement('style');
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  const out: Found[] = [];
  let order = 0;
  const walk = (list: CSSRuleList, media: string) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSMediaRule) {
        walk(rule.cssRules, rule.media.mediaText);
      } else if (rule instanceof CSSStyleRule) {
        order++;
        for (const selector of rule.selectorText.split(/\s*,\s*/)) {
          out.push({ selector, media, style: rule.style, order });
        }
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

/** The declarations that set each longhand checked here, shorthands included. */
const SETS: Record<string, string[]> = {
  'background-image': ['background-image', 'background'],
  'border-top-color': [
    'border-top-color',
    'border-top',
    'border-color',
    'border',
  ],
  'border-right-color': [
    'border-right-color',
    'border-right',
    'border-color',
    'border',
  ],
  'border-bottom-color': [
    'border-bottom-color',
    'border-bottom',
    'border-color',
    'border',
  ],
  'box-sizing': ['box-sizing'],
};

/** Classes, attributes and pseudo-classes, then elements, as one number. */
function specificity(selector: string) {
  const classes = (selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) ?? [])
    .length;
  const elements = (selector.match(/(^|[\s>+~])[a-z][\w-]*/gi) ?? []).length;
  return classes * 10 + elements;
}

/**
 * The declaration that wins `longhand` on the element, with forced colors on
 * or off, as the property it was written with and its value, or null when
 * the partial sets nothing there. Within a rule, the last declaration that
 * sets the longhand is the one that counts. A shorthand is kept whole, so a
 * border written as one reads as the whole border.
 */
function winning(
  found: Found[],
  el: Element,
  longhand: keyof typeof SETS,
  forced: boolean
) {
  let best: { rank: number[]; property: string; value: string } | null = null;
  for (const rule of found) {
    if (rule.media !== '' && !(forced && rule.media === FORCED)) continue;
    if (!el.matches(rule.selector)) continue;
    const names = Array.from(rule.style).filter(name =>
      SETS[longhand].includes(name)
    );
    const property = names[names.length - 1];
    if (!property) continue;
    const rank = [specificity(rule.selector), rule.order];
    if (
      !best ||
      rank[0] > best.rank[0] ||
      (rank[0] === best.rank[0] && rank[1] > best.rank[1])
    ) {
      best = {
        rank,
        property,
        value: rule.style.getPropertyValue(property).trim(),
      };
    }
  }
  return best && { property: best.property, value: best.value };
}

const VARIANTS: Array<[string, Partial<LoadingProps>]> = [
  ['the default spinner', {}],
  ['a small spinner', { size: 'small' }],
  ['a large primary spinner', { size: 'large', color: 'primary' }],
  ['a danger spinner on a dark overlay', { overlay: 'dark', color: 'danger' }],
];

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the Loading partial with %s', (_label, prefix) => {
  const iconOf = (props: Partial<LoadingProps>) => {
    const { container, unmount } = render(
      <ConfigProvider classPrefix={prefix}>
        <Loading active {...props}>
          Loading data
        </Loading>
      </ConfigProvider>
    );
    return {
      icon: container.querySelector(`.${prefix}loading-icon`)!,
      unmount,
    };
  };

  it.each(VARIANTS)(
    'draws %s as a gradient normally, with no border',
    (_name, props) => {
      const found = rulesOf(compile(prefix));
      const { icon, unmount } = iconOf(props);
      expect(icon).not.toBeNull();
      expect(winning(found, icon, 'background-image', false)?.value).toMatch(
        /^conic-gradient\(/
      );
      for (const side of ['border-top-color', 'border-right-color'] as const) {
        expect(winning(found, icon, side, false)).toBeNull();
      }
      unmount();
    }
  );

  it.each(VARIANTS)(
    'redraws %s in forced colors as a CanvasText border, open at the top',
    (_name, props) => {
      const found = rulesOf(compile(prefix));
      const { icon, unmount } = iconOf(props);
      // The gradient goes, since forced colors would drop it anyway.
      expect(winning(found, icon, 'background-image', true)).toEqual({
        property: 'background',
        value: 'none',
      });
      // A ring at the width the mask keeps, which each size sets.
      const ring = {
        property: 'border',
        value: 'var(--bulma-loading-icon-border-width) solid CanvasText',
      };
      expect(winning(found, icon, 'border-right-color', true)).toEqual(ring);
      expect(winning(found, icon, 'border-bottom-color', true)).toEqual(ring);
      // Canvas is the page's own color, which forced colors leaves alone, so
      // the top stays open and the ring still reads as a spinner.
      expect(winning(found, icon, 'border-top-color', true)).toEqual({
        property: 'border-top-color',
        value: 'Canvas',
      });
      // The border sits inside the icon's width and height rather than
      // adding to them, whatever box-sizing an ancestor hands down, so the
      // spinner keeps its size when a contrast theme comes on.
      expect(winning(found, icon, 'box-sizing', true)?.value).toBe(
        'border-box'
      );
      unmount();
    }
  );

  it('keeps every border on the spinner inside the forced-colors block', () => {
    // A border drawn, that is: the icon's `border-radius` makes the circle
    // in every mode.
    const draws =
      /^border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-(color|style|width))?$/;
    const found = rulesOf(compile(prefix));
    const borders = found.filter(
      ({ selector, style }) =>
        selector.includes(`${prefix}loading-icon`) &&
        Array.from(style).some(name => draws.test(name))
    );
    expect(borders.length).toBeGreaterThan(0);
    expect(new Set(borders.map(({ media }) => media))).toEqual(
      new Set([FORCED])
    );
  });
});
