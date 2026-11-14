// Bulma's light variant of a tag reads its text's lightness from
// `--bulma-<color>-light-invert-l`, which Bulma doesn't define for white,
// black, light or dark, and its `.tag.is-light.is-light` matches every light
// tag. So _tag.scss gives a light tag (#1464), and a white, black or dark one
// with isLight (#1514), the text `.tag.is-light` sets, on Bulma's background.
// These resolve the tag's custom properties across Bulma's CSS and the
// partial in either order with `css-cascade.ts`, which says how.
import { render } from '@testing-library/react';
import { Tag, type TagProps } from '../Tag';
import { ConfigProvider } from '../../helpers/Config';
import {
  bulmaCss,
  compilePartial,
  compileSource,
  customProperty,
  rulesOf,
} from '../../__tests__/css-cascade';

const compile = (prefix = '') => compilePartial('elements/tag', prefix);

const BACKGROUND = '--bulma-tag-background-l';
const TEXT = '--bulma-tag-color-l';

/** The background and text lightness `el` gets from the rules of `css`. */
const colorsOf = (el: Element, css: string) => ({
  background: customProperty(el, css, BACKGROUND),
  text: customProperty(el, css, TEXT),
});

const LIGHT = {
  background: 'var(--bulma-light-l)',
  text: 'var(--bulma-light-invert-l)',
};

const tagIn = (container: HTMLElement, prefix = '') =>
  container.querySelector(`.${prefix}tag`) as HTMLElement;

const tagOf = (props: TagProps) => tagIn(render(<Tag {...props} />).container);

// Bulma's CSS can land on either side of the extras: an app linking
// extras.css can put it before or after its own Bulma.
const orders: [string, () => string][] = [
  ['the partial after Bulma', () => bulmaCss() + compile()],
  ['the partial before Bulma', () => compile() + bulmaCss()],
];

describe('the colors of a light Tag', () => {
  describe.each(orders)('with %s', (_order, css) => {
    it("gives color='light' the light color's own text", () => {
      const el = tagOf({ color: 'light', children: 'New' });
      expect(el).toHaveClass('is-light');
      expect(colorsOf(el, css())).toEqual(LIGHT);
    });

    it('gives it the same with isLight', () => {
      const el = tagOf({ color: 'light', isLight: true, children: 'New' });
      expect(colorsOf(el, css())).toEqual(LIGHT);
    });

    it('gives it the same as a delete tag', () => {
      const el = tagOf({ color: 'light', isDelete: true });
      expect(el.tagName).toBe('BUTTON');
      expect(colorsOf(el, css())).toEqual(LIGHT);
    });

    // Bulma's light variant already gives these the light color's
    // background, so the text is all the partial sets.
    it.each(['white', 'black', 'dark'] as const)(
      "gives color='%s' with isLight the light color's text",
      color => {
        const el = tagOf({ color, isLight: true, children: 'New' });
        expect(el).toHaveClass(`is-${color}`, 'is-light');
        expect(colorsOf(el, css())).toEqual(LIGHT);
      }
    );

    it("keeps color='dark' with isLight in the dark color's hue", () => {
      const el = tagOf({ color: 'dark', isLight: true, children: 'New' });
      expect(customProperty(el, css(), '--bulma-tag-h')).toBe(
        'var(--bulma-dark-h)'
      );
    });

    it.each(['white', 'black', 'dark'] as const)(
      "leaves color='%s' without isLight alone",
      color => {
        const el = tagOf({ color, children: 'New' });
        expect(colorsOf(el, css())).toEqual({
          background: `var(--bulma-${color}-l)`,
          text: `var(--bulma-${color}-invert-l)`,
        });
      }
    );

    it("leaves Bulma's light variant of another color alone", () => {
      const el = tagOf({ color: 'primary', isLight: true, children: 'New' });
      expect(colorsOf(el, css())).toEqual({
        background: 'var(--bulma-light-l)',
        text: 'var(--bulma-primary-light-invert-l)',
      });
    });

    it('leaves a plain tag alone', () => {
      const el = tagOf({ children: 'New' });
      expect(colorsOf(el, css())).toEqual({
        background: 'var(--bulma-background-l)',
        text: 'var(--bulma-text-l)',
      });
    });
  });

  describe('in a prefixed build', () => {
    const css = () =>
      bulmaCss('versions/bulma-prefixed.css') + compile('bulma-');
    const prefixedOf = (props: TagProps) =>
      tagIn(
        render(
          <ConfigProvider classPrefix="bulma-">
            <Tag {...props} />
          </ConfigProvider>
        ).container,
        'bulma-'
      );

    it("gives color='light' the light color's own text", () => {
      const el = prefixedOf({ color: 'light', children: 'New' });
      expect(el).toHaveClass('bulma-is-light');
      expect(colorsOf(el, css())).toEqual(LIGHT);
    });

    it.each(['white', 'black', 'dark'] as const)(
      "gives color='%s' with isLight the light color's text",
      color => {
        const el = prefixedOf({ color, isLight: true });
        expect(el).toHaveClass(`bulma-is-${color}`, 'bulma-is-light');
        expect(colorsOf(el, css())).toEqual(LIGHT);
      }
    );

    it("keeps color='dark' with isLight in the dark color's hue", () => {
      const el = prefixedOf({ color: 'dark', isLight: true });
      expect(customProperty(el, css(), '--bulma-tag-h')).toBe(
        'var(--bulma-dark-h)'
      );
    });

    it.each(['white', 'black', 'dark'] as const)(
      "leaves color='%s' without isLight alone",
      color => {
        const el = prefixedOf({ color });
        expect(colorsOf(el, css())).toEqual({
          background: `var(--bulma-${color}-l)`,
          text: `var(--bulma-${color}-invert-l)`,
        });
      }
    );

    it("leaves Bulma's light variant of another color alone", () => {
      const el = prefixedOf({ color: 'primary', isLight: true });
      expect(colorsOf(el, css()).text).toBe(
        'var(--bulma-primary-light-invert-l)'
      );
    });
  });

  it("skips every other color in Bulma's map, custom colors included", () => {
    const css = compileSource(
      `@use 'sass:map';
       @use 'bulma/sass/utilities/derived-variables' as dv with (
         $custom-colors: ('brand': #6b2fa3)
       );
       @use 'elements/tag';
       :root { --colors: #{map.keys(dv.$colors)}; }`
    );
    const { rules } = rulesOf(css);
    const keys = rules
      .find(rule => rule.selectorText === ':root')!
      .style.getPropertyValue('--colors')
      .split(/,\s*/);
    expect(keys).toEqual(expect.arrayContaining(['light', 'dark', 'brand']));

    const light = rules.filter(rule => rule.style.getPropertyValue(TEXT));
    expect(light).toHaveLength(1);
    const [, skipped] = /:not\((.*)\)$/.exec(light[0].selectorText)!;
    const grayscale = ['white', 'black', 'light', 'dark'];
    expect(skipped.split(/,\s*/)).toEqual(
      keys.filter(name => !grayscale.includes(name)).map(name => `.is-${name}`)
    );

    const el = document.createElement('span');
    el.className = 'tag is-brand is-light';
    expect(el.matches(light[0].selectorText)).toBe(false);
    el.className = 'tag is-primary is-dark is-light';
    expect(el.matches(light[0].selectorText)).toBe(false);
    for (const name of grayscale) {
      el.className = `tag is-${name} is-light`;
      expect(el.matches(light[0].selectorText)).toBe(true);
    }
  });
});
