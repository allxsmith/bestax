// Two rules in _tag.scss, resolved across Bulma's CSS and the partial in
// either order with `css-cascade.ts`, which says how. Bulma's light variant of
// a tag reads its text's lightness from `--bulma-<color>-light-invert-l`,
// which Bulma doesn't define for white, black, light or dark, and its
// `.tag.is-light.is-light` matches every light tag. So the partial gives a
// light tag (#1464), and a white, black or dark one with isLight (#1514), the
// text `.tag.is-light` sets, on Bulma's background. And a tag in a table cell
// sits at the bottom of its line rather than on the baseline, so it doesn't
// make its row taller than a row of text (#1634).
import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { Tag, type TagProps } from '../Tag';
import { Table } from '../Table';
import { Title } from '../Title';
import { SubTitle } from '../SubTitle';
import { ConfigProvider } from '../../helpers/Config';
import {
  bulmaCss,
  cascade,
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

// Bulma's tag is an `inline-flex` box on the text's baseline and as tall as a
// line of body text, so the room the line keeps under its baseline made a
// cell holding one taller than a row of plain text (#1634). In a cell it sits
// at the line's bottom. The rule weighs one class, so Bulma's `.title .tag`
// and `.subtitle .tag`, which center a tag in a heading, still win there.
describe('a Tag in a table cell', () => {
  describe.each([
    ['the partial after Bulma', '', () => bulmaCss() + compile()],
    ['the partial before Bulma', '', () => compile() + bulmaCss()],
    [
      'a prefixed build',
      'bulma-',
      () => bulmaCss('versions/bulma-prefixed.css') + compile('bulma-'),
    ],
  ])('with %s', (_order, prefix, sheet) => {
    const css = sheet();
    const alignOf = (el: Element) =>
      cascade(
        el,
        css,
        ['vertical-align'],
        (style, property) => style.getPropertyValue(property) || undefined
      );

    const tagsOf = (ui: ReactNode) =>
      Array.from(
        render(
          <ConfigProvider classPrefix={prefix}>{ui}</ConfigProvider>
        ).container.querySelectorAll(`.${prefix}tag`)
      );

    const inCell = (tag: ReactNode) => (
      <Table>
        <tbody>
          <tr>
            <td>{tag}</td>
          </tr>
        </tbody>
      </Table>
    );

    it('sits at the bottom of the line in a body or a header cell', () => {
      const tags = tagsOf(
        <Table>
          <thead>
            <tr>
              <th>
                <Tag>Role</Tag>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                Role <Tag color="primary">Admin</Tag>
              </td>
            </tr>
          </tbody>
        </Table>
      );
      expect(tags).toHaveLength(2);
      for (const el of tags) expect(alignOf(el)).toBe('bottom');
    });

    it('keeps the baseline for a tag made larger, which grows the line either way', () => {
      const tags = tagsOf(
        inCell(
          <>
            <Tag size="medium">Admin</Tag>
            <Tag size="large">Admin</Tag>
            <Tag textSize="5">Admin</Tag>
          </>
        )
      );
      expect(tags).toHaveLength(3);
      for (const el of tags) expect(alignOf(el)).toBeUndefined();
    });

    it('weighs nothing, so an app’s own rule for a tag wins in either order', () => {
      const [el] = tagsOf(inCell(<Tag className="status">Admin</Tag>));
      const own = '.status { vertical-align: middle; }';
      for (const sheetWithOwn of [own + css, css + own]) {
        expect(
          cascade(
            el,
            sheetWithOwn,
            ['vertical-align'],
            (style, property) => style.getPropertyValue(property) || undefined
          )
        ).toBe('middle');
      }
    });

    it('leaves Bulma to center a tag in a title or a subtitle in a cell', () => {
      const tags = tagsOf(
        inCell(
          <>
            <Title size="5">
              Users <Tag>3</Tag>
            </Title>
            <SubTitle size="6">
              Admins <Tag>1</Tag>
            </SubTitle>
          </>
        )
      );
      expect(tags).toHaveLength(2);
      for (const el of tags) expect(alignOf(el)).toBe('middle');
    });

    it('leaves a tag outside a table on the baseline', () => {
      const [el] = tagsOf(<Tag>Admin</Tag>);
      expect(alignOf(el)).toBeUndefined();
    });
  });
});

// A tag rendered as a button takes the text a span takes from the text around
// it, not the browser's own for a button: its weight, style, spacing,
// transform, indent, shadow and alignment (#1841). Chromium's computed styles
// matched a span tag's for a link and a button tag, in both builds and
// schemes, once these held.
describe('a Tag rendered as a button', () => {
  const TEXT_PROPERTIES = [
    'font-feature-settings',
    'font-kerning',
    'font-language-override',
    'font-optical-sizing',
    'font-palette',
    'font-size-adjust',
    'font-stretch',
    'font-style',
    'font-synthesis',
    'font-variant',
    'font-variation-settings',
    'font-weight',
    'letter-spacing',
    'text-align',
    'text-indent',
    'text-rendering',
    'text-shadow',
    'text-transform',
    'word-spacing',
  ];

  describe.each([
    ['the partial after Bulma', '', () => bulmaCss() + compile()],
    ['the partial before Bulma', '', () => compile() + bulmaCss()],
    [
      'a prefixed build',
      'bulma-',
      () => bulmaCss('versions/bulma-prefixed.css') + compile('bulma-'),
    ],
  ])('with %s', (_order, prefix, sheet) => {
    const css = sheet();
    const valueOf = (el: Element, property: string) =>
      cascade(
        el,
        css,
        [property],
        (style, name) => style.getPropertyValue(name) || undefined
      );
    const tagOfProps = (props: TagProps) =>
      tagIn(
        render(
          <ConfigProvider classPrefix={prefix}>
            <Tag {...props} />
          </ConfigProvider>
        ).container,
        prefix
      );

    it.each(TEXT_PROPERTIES)('takes %s from the text around it', property => {
      const el = tagOfProps({ as: 'button', children: 'Filter' });
      expect(el.tagName).toBe('BUTTON');
      expect(valueOf(el, property)).toBe('inherit');
    });

    it('does the same for a delete tag', () => {
      const el = tagOfProps({ isDelete: true });
      expect(valueOf(el, 'font-weight')).toBe('inherit');
    });

    it('sets none of them on a span or a link tag', () => {
      const partial = compile(prefix);
      for (const as of ['span', 'a'] as const) {
        const el = tagOfProps({ as, href: '#topic', children: 'Topic' });
        for (const property of TEXT_PROPERTIES) {
          expect(
            cascade(
              el,
              partial,
              [property],
              (style, name) => style.getPropertyValue(name) || undefined
            )
          ).toBeUndefined();
        }
      }
    });
  });
});
