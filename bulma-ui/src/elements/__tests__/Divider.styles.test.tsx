// Bulma draws an `<hr>` as a background color, which forced colors replaces
// with the page's own, so `_divider.scss` draws Divider's line as a CanvasText
// border there (#1851). jsdom evaluates no media query, so these compile the
// real partial, join it to Bulma's CSS on either side, and resolve the line
// with the shared cascade as a forced-colors page applies the sheet.
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Divider } from '../Divider';
import { Content } from '../Content';
import { ConfigProvider } from '../../helpers/Config';
import { bulmaCss, cascade, compilePartial } from '../../__tests__/css-cascade';

// Every declaration that can set the line's top border, so one that outranks
// the partial's shorthand, a longhand included, is the one that wins.
const TOP_BORDER = [
  'border',
  'border-top',
  'border-style',
  'border-width',
  'border-color',
  'border-top-style',
  'border-top-width',
  'border-top-color',
  'border-block',
  'border-block-start',
  'border-block-start-style',
  'border-block-start-width',
  'border-block-start-color',
];

/** The declaration that wins `properties` on `el`, as `name: value`. */
const winner = (
  css: string,
  el: Element,
  properties: string[],
  forcedColors = true
) =>
  cascade(
    el,
    css,
    properties,
    (style, name) => {
      const value = style.getPropertyValue(name).trim();
      return value ? `${name}: ${value}` : undefined;
    },
    { forcedColors }
  );

/** How the line is drawn, from `css`, on a forced-colors page or not. */
const look = (css: string, el: Element, forcedColors = true) => ({
  'top border': winner(css, el, TOP_BORDER, forcedColors),
  height: winner(css, el, ['height', 'block-size'], forcedColors),
  'forced-color-adjust': winner(css, el, ['forced-color-adjust'], forcedColors),
});

// jsdom keeps a shorthand that reads a variable as it's written.
const DRAWN = {
  'top border': 'border-top: var(--bulma-hr-height) solid CanvasText',
  height: 'height: 0px',
  'forced-color-adjust': undefined,
};

// Each sheet once: a Sass compile and Bulma's whole stylesheet are slow.
const sheets = new Map<string, string>();
const sheet = (key: string, build: () => string) => {
  if (!sheets.has(key)) sheets.set(key, build());
  return sheets.get(key)!;
};

describe('Divider on a forced-colors page', () => {
  // Bulma's CSS can land on either side of the extras: an app can link
  // `extras.css` before its own Bulma.
  describe.each([
    ['the partial after Bulma', '', 'bulma.css', 'after'],
    ['the partial before Bulma', '', 'bulma.css', 'before'],
    [
      'a prefixed build, the partial after Bulma',
      'bulma-',
      'versions/bulma-prefixed.css',
      'after',
    ],
    [
      'a prefixed build, the partial before Bulma',
      'bulma-',
      'versions/bulma-prefixed.css',
      'before',
    ],
  ])('with %s', (name, prefix, bulma, order) => {
    const css = () =>
      sheet(name, () => {
        const partial = compilePartial('elements/divider', prefix);
        return order === 'after'
          ? bulmaCss(bulma) + partial
          : partial + bulmaCss(bulma);
      });
    const renderIn = (ui: ReactElement) =>
      render(<ConfigProvider classPrefix={prefix}>{ui}</ConfigProvider>);

    it('draws the line as a CanvasText border, with no fill', () => {
      const { getByRole } = renderIn(<Divider />);
      expect(look(css(), getByRole('separator'))).toEqual(DRAWN);
    });

    it('draws it inside Content and with helper classes too', () => {
      const { getByRole } = renderIn(
        <Content>
          <Divider my="5" />
        </Content>
      );
      expect(look(css(), getByRole('separator'))).toEqual(DRAWN);
    });

    it('draws a Divider with a bgColor the same way', () => {
      const { getByRole } = renderIn(<Divider bgColor="white" />);
      const line = getByRole('separator');
      expect(line).toHaveClass(`${prefix}has-background-white`);
      expect(look(css(), line)).toEqual(DRAWN);
    });

    it('leaves an hr with a class of its own to its own rules', () => {
      const { container } = renderIn(
        <>
          <hr className={`${prefix}dropdown-divider`} />
          <hr className={`${prefix}navbar-divider`} />
        </>
      );
      // Bulma's own class rules win: `border: none` and their own heights.
      const [dropdown, navbar] = Array.from(container.querySelectorAll('hr'));
      for (const hr of [dropdown, navbar]) {
        expect(
          winner(css(), hr, ['border', 'border-top', 'border-top-style'])
        ).toBe('border-top-style: none');
      }
      expect(look(css(), dropdown).height).toBe('height: 1px');
      expect(look(css(), navbar).height).toBe(
        'height: var(--bulma-navbar-divider-height)'
      );
    });
  });

  it('sets nothing outside forced colors', () => {
    const { getByRole } = render(<Divider />);
    expect(
      look(compilePartial('elements/divider'), getByRole('separator'), false)
    ).toEqual({
      'top border': undefined,
      height: undefined,
      'forced-color-adjust': undefined,
    });
  });

  it('is a background with no border with Bulma alone, which is the bug', () => {
    const { getByRole } = render(<Divider />);
    const line = getByRole('separator');
    // Bulma's `border: none`, and its height, all of it background.
    expect(
      winner(bulmaCss(), line, ['border', 'border-top', 'border-top-style'])
    ).toBe('border-top-style: none');
    expect(look(bulmaCss(), line).height).toBe(
      'height: var(--bulma-hr-height)'
    );
  });
});
