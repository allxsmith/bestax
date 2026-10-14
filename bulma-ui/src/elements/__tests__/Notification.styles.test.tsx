// A Notification with a close button pads its end from _notification.scss,
// so its text clears the button Bulma places over that end (#1000). jsdom
// never loads the partial on its own, and which padding wins is a cascade
// across Bulma's sheet and the partial, in either order, mixing a shorthand
// with a logical longhand, which jsdom doesn't compute. So these compile the
// real partial, link it with Bulma's own CSS on either side, and resolve the
// end padding themselves, the way a browser would: importance, then
// specificity, then source order. A rule this can't rank, or one in a block
// it doesn't walk, fails the test rather than dropping out.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import { Notification, type NotificationProps } from '../Notification';
import { Delete } from '../Delete';
import { Paragraph } from '../Paragraph';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, resolved once, through package.json since
// jest maps any `.css` specifier to a stub. The partial compiles against its
// Sass and is checked against its CSS, so an upgrade moves the two together.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix = '') =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'elements/notification';`,
    {
      // The directory holding that Bulma, so `bulma/…` resolves to it.
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

const bulmaCss = (file = 'bulma.css') =>
  fs.readFileSync(path.join(BULMA, 'css', file), 'utf8');

/**
 * The sheet's top-level style rules, in source order, and the style rules
 * nested in an at-rule, each with the at-rule it sits in.
 */
function rulesOf(css: string) {
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

/** The words of a value, keeping each `var(…)` whole. */
const words = (value: string) => value.match(/(?:[^\s(]+|\([^)]*\))+/g) ?? [];

/**
 * The inline-end padding a declaration sets, in a left-to-right, horizontal
 * page, or undefined when it sets none.
 */
function endPaddingOf(style: CSSStyleDeclaration, property: string) {
  const value = style.getPropertyValue(property).trim();
  switch (property) {
    case 'padding': {
      // CSS's one-to-four values: the second is the right, or the first.
      const [top, right = top] = words(value);
      return right;
    }
    case 'padding-inline': {
      const [start, end = start] = words(value);
      return end;
    }
    case 'padding-right':
    case 'padding-inline-end':
      return value;
    default:
      return undefined;
  }
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

/**
 * Specificity as [ids, classes, types]. `:has()` and `:not()` count as their
 * argument, which is all the rules here need; any other functional
 * pseudo-class, or an argument that is a list, is refused.
 */
function specificity(selector: string): number[] {
  for (const [, name, arg] of selector.matchAll(/:([\w-]+)\(([^)]*)\)/g)) {
    if (!['has', 'not'].includes(name) || arg.includes(',')) {
      throw new Error(
        `${selector} sets a notification's padding with :${name}(${arg}), ` +
          'which this test does not rank. Extend `specificity` before ' +
          'trusting a result.'
      );
    }
  }
  const flat = selector.replace(/:(?:has|not)\(([^)]*)\)/g, ' $1 ');
  return [
    (flat.match(/#[\w-]+/g) ?? []).length,
    (flat.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length,
    (flat.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length,
  ];
}

const outranks = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
};

const PADDING = [
  'padding',
  'padding-inline',
  'padding-right',
  'padding-inline-end',
];

/** The selectors in a rule's list that match `el`. */
const matching = (el: Element, rule: CSSStyleRule) =>
  rule.selectorText
    .split(/,(?![^(]*\))/)
    .map(part => part.trim())
    .filter(part => matches(el, part));

/**
 * The inline-end padding of `el`, as the rules of `css` resolve it. With
 * `has: false` it resolves them as a browser without `:has()` does, which
 * drops every rule whose selector uses it.
 */
function endPadding(
  el: Element,
  css: string,
  { has = true } = {}
): string | undefined {
  const parsed = rulesOf(css);
  const supported = (rule: CSSStyleRule) =>
    has || !rule.selectorText.includes(':has(');
  const rules = parsed.rules.filter(supported);
  const nested = parsed.nested.filter(({ rule }) => supported(rule));
  // `@media`, `@supports`, `@layer` and the like change when or in what
  // order their rules apply, which this file doesn't model, so a padding set
  // in one fails rather than being read as if it always applied.
  for (const { rule, within } of nested) {
    if (
      PADDING.some(p => rule.style.getPropertyValue(p)) &&
      matching(el, rule).length > 0
    ) {
      throw new Error(
        `${within} pads ${rule.selectorText}, in a block this test does not ` +
          'walk. Extend `endPadding` before trusting a result.'
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
    ).filter(property => PADDING.includes(property));
    if (declared.length === 0) return;
    const selectors = matching(el, rule);
    if (selectors.length === 0) return;
    const specific = selectors
      .map(specificity)
      .reduce((best, next) => (outranks(next, best) ? next : best));
    declared.forEach((property, index) => {
      const value = endPaddingOf(style, property);
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

const DELETE_PADDING = 'var(--bulma-notification-delete-padding-inline-end)';
const BULMA_PADDING = 'var(--bulma-notification-padding)';

/** The one declaration of `property` on the rule whose selector is `selector`. */
const declared = (css: string, selector: string, property: string) => {
  const found = rulesOf(css)
    .rules.filter(rule => rule.selectorText.split(/,\s*/).includes(selector))
    .map(rule => rule.style.getPropertyValue(property).trim())
    .filter(Boolean);
  expect(found).toHaveLength(1);
  return found[0];
};

/**
 * The end padding the partial gives a notification whose close button has
 * Bulma's `is-<size>` modifier.
 */
const sizedPadding = (size: string, prefix = '') =>
  declared(
    compile(prefix),
    `.${prefix}notification:has(> .${prefix}delete.${prefix}is-${size})`,
    'padding-inline-end'
  );

const notificationIn = (container: HTMLElement, prefix = '') =>
  container.querySelector(`.${prefix}notification`) as HTMLElement;

const notificationOf = (props: NotificationProps) =>
  notificationIn(render(<Notification {...props} />).container);

describe('the end padding of a Notification', () => {
  // Bulma's CSS can land on either side of the extras: an app linking
  // extras.css can put it before or after its own Bulma.
  const orders: [string, () => string][] = [
    ['the partial after Bulma', () => bulmaCss() + compile()],
    ['the partial before Bulma', () => compile() + bulmaCss()],
  ];

  describe.each(orders)('with %s', (_order, css) => {
    it('clears the close button hasDelete renders', () => {
      const el = notificationOf({ hasDelete: true, children: 'Saved' });
      expect(endPadding(el, css())).toBe(DELETE_PADDING);
    });

    // The class Notification adds is what does it there, so this holds in a
    // browser that drops the :has() rule.
    it('clears the close button hasDelete renders without :has()', () => {
      const el = notificationOf({ hasDelete: true, children: 'Saved' });
      expect(endPadding(el, css(), { has: false })).toBe(DELETE_PADDING);
    });

    it('clears it in a colored, light notification', () => {
      const el = notificationOf({
        hasDelete: true,
        color: 'danger',
        isLight: true,
        children: 'Saved',
      });
      expect(endPadding(el, css())).toBe(DELETE_PADDING);
    });

    it("keeps Bulma's padding without a close button", () => {
      const el = notificationOf({ children: 'Saved' });
      expect(endPadding(el, css())).toBe(BULMA_PADDING);
    });

    it('clears a Delete passed in as a child', () => {
      const el = notificationOf({
        children: (
          <>
            <Delete ariaLabel="Close notification" />
            Saved
          </>
        ),
      });
      expect(endPadding(el, css())).toBe(DELETE_PADDING);
    });

    // Bulma sizes the button on the button itself, where the notification
    // can't read it, so the partial reads the modifier instead.
    it('makes room for the size of a Delete passed in', () => {
      const el = notificationOf({ children: <Delete size="large" /> });
      expect(endPadding(el, css())).toBe(sizedPadding('large'));
    });

    // Bulma moves only a close button that is a direct child to the corner.
    it("keeps Bulma's padding for a Delete further in", () => {
      const el = notificationOf({
        children: (
          <Paragraph>
            Saved <Delete />
          </Paragraph>
        ),
      });
      expect(endPadding(el, css())).toBe(BULMA_PADDING);
    });

    it('lets a spacing helper set the padding', () => {
      const el = notificationOf({ hasDelete: true, p: '3', children: 'Saved' });
      expect(endPadding(el, css())).toBe('0.75rem');
    });
  });

  describe('in a prefixed build', () => {
    const css = () =>
      bulmaCss('versions/bulma-prefixed.css') + compile('bulma-');
    const prefixed = (props: NotificationProps) =>
      notificationIn(
        render(
          <ConfigProvider classPrefix="bulma-">
            <Notification {...props} />
          </ConfigProvider>
        ).container,
        'bulma-'
      );

    it('clears the close button hasDelete renders', () => {
      const el = prefixed({ hasDelete: true, children: 'Saved' });
      expect(endPadding(el, css())).toBe(DELETE_PADDING);
      expect(endPadding(el, css(), { has: false })).toBe(DELETE_PADDING);
    });

    it('clears a Delete passed in as a child', () => {
      const el = prefixed({ children: <Delete /> });
      expect(endPadding(el, css())).toBe(DELETE_PADDING);
    });

    it('makes room for the size of a Delete passed in', () => {
      const el = prefixed({ children: <Delete size="large" /> });
      expect(endPadding(el, css())).toBe(sizedPadding('large', 'bulma-'));
    });

    it("keeps Bulma's padding without a close button", () => {
      const el = prefixed({ children: 'Saved' });
      expect(endPadding(el, css())).toBe(BULMA_PADDING);
    });
  });
});

describe('the default end padding', () => {
  /** A length in rem, refusing any other unit. */
  const rem = (value: string) => {
    const m = /^([\d.]+)rem$/.exec(value);
    if (!m) {
      throw new Error(
        `${value} is not in rem, which this test does not compare. Extend ` +
          '`rem` before trusting a result.'
      );
    }
    return Number(m[1]);
  };

  /**
   * A sized rule's padding in rem, given the default: the variable plus or
   * minus a length in rem, refusing any other form.
   */
  const plus = (padding: number, value: string) => {
    const m =
      /^calc\(var\(--bulma-notification-delete-padding-inline-end\) ([+-]) ([\d.]+)rem\)$/.exec(
        value
      );
    if (!m) {
      throw new Error(
        `${value} is not the default padding plus a length in rem, which ` +
          'this test does not compare. Extend `plus` before trusting a result.'
      );
    }
    return padding + (m[1] === '-' ? -1 : 1) * Number(m[2]);
  };

  // Bulma's numbers are read from its own CSS, so an upgrade that moves or
  // grows the button fails here rather than putting it back over the text.
  const bulma = () => bulmaCss();
  const inset = () =>
    rem(declared(bulma(), '.notification > .delete', 'inset-inline-end'));
  const dimensions = (selector: string) =>
    rem(declared(bulma(), selector, '--bulma-delete-dimensions'));
  const padding = () =>
    rem(
      declared(
        compile(),
        '.notification',
        '--bulma-notification-delete-padding-inline-end'
      )
    );

  it("leaves a gap past the close button's inset and size", () => {
    expect(padding()).toBeGreaterThan(inset() + dimensions('.delete'));
  });

  // Every size modifier Bulma's CSS has, so one an upgrade adds fails here
  // until the partial pads for it too.
  it('leaves the same gap past a close button of any size', () => {
    const sizes = rulesOf(bulma())
      .rules.filter(rule =>
        rule.style.getPropertyValue('--bulma-delete-dimensions')
      )
      .flatMap(rule => rule.selectorText.split(/,\s*/))
      .map(selector => /^\.delete\.is-([\w-]+)$/.exec(selector)?.[1])
      .filter((size): size is string => size !== undefined);
    expect(sizes).toContain('large');

    const gap = padding() - inset() - dimensions('.delete');
    const gaps = Object.fromEntries(
      sizes.map(size => [
        size,
        plus(padding(), sizedPadding(size)) -
          inset() -
          dimensions(`.delete.is-${size}`),
      ])
    );
    expect(gaps).toEqual(
      Object.fromEntries(sizes.map(size => [size, expect.closeTo(gap)]))
    );
  });
});
