// A Notification with a close button pads its end from _notification.scss,
// so its text clears the button Bulma places over that end (#1000), and a
// dark or light one gets its color's own lightness back from Bulma's
// `.notification.is-dark.is-dark` and `.notification.is-light.is-light`
// (#1461, #1464). These resolve each value across Bulma's CSS and the partial
// in either order with `css-cascade.ts`, which says how. The padding mixes a
// shorthand with a logical longhand, which `endPaddingOf` reads.
import { render } from '@testing-library/react';
import { Notification, type NotificationProps } from '../Notification';
import { Delete } from '../Delete';
import { Paragraph } from '../Paragraph';
import { ConfigProvider } from '../../helpers/Config';
import {
  bulmaCss,
  cascade,
  compilePartial,
  compileSource,
  customProperty,
  rulesOf,
} from '../../__tests__/css-cascade';

const compile = (prefix = '') =>
  compilePartial('elements/notification', prefix);

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

const PADDING = [
  'padding',
  'padding-inline',
  'padding-right',
  'padding-inline-end',
];

/** The inline-end padding of `el`, as the rules of `css` resolve it. */
const endPadding = (el: Element, css: string, options?: { has?: boolean }) =>
  cascade(el, css, PADDING, endPaddingOf, options);

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

// Bulma's CSS can land on either side of the extras: an app linking
// extras.css can put it before or after its own Bulma.
const orders: [string, () => string][] = [
  ['the partial after Bulma', () => bulmaCss() + compile()],
  ['the partial before Bulma', () => compile() + bulmaCss()],
];

/** Bulma's prefixed CSS and the partial compiled with the same prefix. */
const prefixedCss = () =>
  bulmaCss('versions/bulma-prefixed.css') + compile('bulma-');

/** A Notification rendered under the `bulma-` class prefix. */
const prefixedOf = (props: NotificationProps) =>
  notificationIn(
    render(
      <ConfigProvider classPrefix="bulma-">
        <Notification {...props} />
      </ConfigProvider>
    ).container,
    'bulma-'
  );

describe('the end padding of a Notification', () => {
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
    it('clears the close button hasDelete renders', () => {
      const el = prefixedOf({ hasDelete: true, children: 'Saved' });
      expect(endPadding(el, prefixedCss())).toBe(DELETE_PADDING);
      expect(endPadding(el, prefixedCss(), { has: false })).toBe(
        DELETE_PADDING
      );
    });

    it('clears a Delete passed in as a child', () => {
      const el = prefixedOf({ children: <Delete /> });
      expect(endPadding(el, prefixedCss())).toBe(DELETE_PADDING);
    });

    it('makes room for the size of a Delete passed in', () => {
      const el = prefixedOf({ children: <Delete size="large" /> });
      expect(endPadding(el, prefixedCss())).toBe(
        sizedPadding('large', 'bulma-')
      );
    });

    it("keeps Bulma's padding without a close button", () => {
      const el = prefixedOf({ children: 'Saved' });
      expect(endPadding(el, prefixedCss())).toBe(BULMA_PADDING);
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

const BACKGROUND = '--bulma-notification-background-l';
const TEXT = '--bulma-notification-color-l';

/** The background and text lightness `el` gets from the rules of `css`. */
const colorsOf = (el: Element, css: string) => ({
  background: customProperty(el, css, BACKGROUND),
  text: customProperty(el, css, TEXT),
});

describe('the colors of a dark Notification', () => {
  // Bulma's `.notification.is-dark.is-dark` matches every dark notification,
  // with a 20% background and its text read from a variable Bulma doesn't
  // define. The partial puts back what `.notification.is-dark` sets.
  const DARK = {
    background: 'var(--bulma-dark-l)',
    text: 'var(--bulma-dark-invert-l)',
  };

  describe.each(orders)('with %s', (_order, css) => {
    it("gives color='dark' the dark color's own lightness", () => {
      const el = notificationOf({ color: 'dark', children: 'Saved' });
      expect(colorsOf(el, css())).toEqual(DARK);
    });

    // Bulma gives a dark button no light variant, and the partial leaves
    // `light` out of the colors it skips, so isLight keeps the dark look.
    it('gives it the same with isLight', () => {
      const el = notificationOf({
        color: 'dark',
        isLight: true,
        children: 'Saved',
      });
      expect(el).toHaveClass('is-dark', 'is-light');
      expect(colorsOf(el, css())).toEqual(DARK);
    });

    it("leaves Bulma's dark variant of another color alone", () => {
      const el = notificationOf({
        color: 'primary',
        className: 'is-dark',
        children: 'Saved',
      });
      expect(el).toHaveClass('is-primary', 'is-dark');
      expect(colorsOf(el, css())).toEqual({
        background: '20%',
        text: 'var(--bulma-primary-dark-invert-l)',
      });
    });

    it('leaves the other colors and their light variants alone', () => {
      expect(
        colorsOf(notificationOf({ color: 'primary', children: 'Saved' }), css())
      ).toEqual({
        background: 'var(--bulma-primary-l)',
        text: 'var(--bulma-primary-invert-l)',
      });
      expect(
        colorsOf(
          notificationOf({
            color: 'primary',
            isLight: true,
            children: 'Saved',
          }),
          css()
        )
      ).toEqual({
        background: '90%',
        text: 'var(--bulma-primary-light-invert-l)',
      });
    });
  });

  describe('in a prefixed build', () => {
    it("gives color='dark' the dark color's own lightness, with or without isLight", () => {
      const el = prefixedOf({ color: 'dark', children: 'Saved' });
      expect(colorsOf(el, prefixedCss())).toEqual(DARK);
      const light = prefixedOf({ color: 'dark', isLight: true });
      expect(colorsOf(light, prefixedCss())).toEqual(DARK);
    });

    it("leaves Bulma's dark variant of another color alone", () => {
      const el = prefixedOf({ color: 'primary', className: 'bulma-is-dark' });
      expect(el).toHaveClass('bulma-is-primary', 'bulma-is-dark');
      expect(colorsOf(el, prefixedCss())).toEqual({
        background: '20%',
        text: 'var(--bulma-primary-dark-invert-l)',
      });
    });
  });

  it("skips every other color in Bulma's map, custom colors included", () => {
    const css = compileSource(
      `@use 'sass:map';
       @use 'bulma/sass/utilities/derived-variables' as dv with (
         $custom-colors: ('brand': #6b2fa3)
       );
       @use 'elements/notification';
       :root { --colors: #{map.keys(dv.$colors)}; }`
    );
    const { rules } = rulesOf(css);
    const keys = rules
      .find(rule => rule.selectorText === ':root')!
      .style.getPropertyValue('--colors')
      .split(/,\s*/);
    expect(keys).toEqual(
      expect.arrayContaining(['white', 'dark', 'light', 'text', 'brand'])
    );

    /** The colors the partial's rule for `name`'s own variant skips. */
    const skippedBy = (name: string) => {
      const found = rules.filter(rule =>
        rule.selectorText.startsWith(`.notification.is-${name}.is-${name}:not(`)
      );
      expect(found).toHaveLength(1);
      return {
        selector: found[0].selectorText,
        skipped: /:not\((.*)\)$/.exec(found[0].selectorText)![1].split(/,\s*/),
      };
    };

    const dark = skippedBy('dark');
    expect(dark.skipped).toEqual(
      keys
        .filter(name => name !== 'dark' && name !== 'light')
        .map(name => `.is-${name}`)
    );
    const light = skippedBy('light');
    expect(light.skipped).toEqual(
      keys.filter(name => name !== 'light').map(name => `.is-${name}`)
    );

    const el = document.createElement('div');
    el.className = 'notification is-brand is-dark';
    expect(el.matches(dark.selector)).toBe(false);
    el.className = 'notification is-brand is-light';
    expect(el.matches(light.selector)).toBe(false);
    el.className = 'notification is-dark is-light';
    expect(el.matches(dark.selector)).toBe(true);
    expect(el.matches(light.selector)).toBe(false);
  });
});

describe('the colors of a light Notification', () => {
  // Bulma's `.notification.is-light.is-light` matches every light
  // notification, with a 90% background and its text read from a variable
  // Bulma doesn't define. The partial puts back what `.notification.is-light`
  // sets (#1464).
  const LIGHT = {
    background: 'var(--bulma-light-l)',
    text: 'var(--bulma-light-invert-l)',
  };

  describe.each(orders)('with %s', (_order, css) => {
    it("gives color='light' the light color's own lightness", () => {
      const el = notificationOf({ color: 'light', children: 'Saved' });
      expect(el).toHaveClass('is-light');
      expect(colorsOf(el, css())).toEqual(LIGHT);
    });

    it('gives it the same with isLight', () => {
      const el = notificationOf({
        color: 'light',
        isLight: true,
        children: 'Saved',
      });
      expect(colorsOf(el, css())).toEqual(LIGHT);
    });

    it("leaves Bulma's light variant of another color alone", () => {
      const el = notificationOf({
        color: 'primary',
        isLight: true,
        children: 'Saved',
      });
      expect(colorsOf(el, css())).toEqual({
        background: '90%',
        text: 'var(--bulma-primary-light-invert-l)',
      });
    });
  });

  describe('in a prefixed build', () => {
    it("gives color='light' the light color's own lightness", () => {
      const el = prefixedOf({ color: 'light', children: 'Saved' });
      expect(el).toHaveClass('bulma-is-light');
      expect(colorsOf(el, prefixedCss())).toEqual(LIGHT);
    });

    it("leaves Bulma's light variant of another color alone", () => {
      const el = prefixedOf({ color: 'primary', isLight: true });
      expect(colorsOf(el, prefixedCss())).toEqual({
        background: '90%',
        text: 'var(--bulma-primary-light-invert-l)',
      });
    });
  });
});
