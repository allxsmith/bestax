// Bulma draws a box's edge as a shadow, which forced colors drops, so
// `_box.scss` draws it as a CanvasText outline there (#1853). jsdom evaluates
// no media query, so these compile the real partial, join it to Bulma's CSS on
// either side, and resolve the edge with the shared cascade as a
// forced-colors page applies the sheet.
import { render } from '@testing-library/react';
import { Box } from '../Box';
import { ConfigProvider } from '../../helpers/Config';
import { bulmaCss, cascade, compilePartial } from '../../__tests__/css-cascade';

// Every declaration that can set the outline's style, width or color, so one
// that outranks the partial's, a longhand included, is the one that wins.
const OUTLINE = ['outline', 'outline-style', 'outline-width', 'outline-color'];

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

/** How the box's edge is drawn, from `css`, on a forced-colors page or not. */
const edge = (css: string, el: Element, forcedColors = true) => ({
  outline: winner(css, el, OUTLINE, forcedColors),
  offset: winner(css, el, ['outline-offset'], forcedColors),
});

const DRAWN = {
  outline: 'outline: 1px solid CanvasText',
  offset: 'outline-offset: -1px',
};

const NONE = { outline: undefined, offset: undefined };

// Each sheet once: a Sass compile and Bulma's whole stylesheet are slow.
const sheets = new Map<string, string>();
const sheet = (key: string, build: () => string) => {
  if (!sheets.has(key)) sheets.set(key, build());
  return sheets.get(key)!;
};

describe('Box on a forced-colors page', () => {
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
    const partial = () =>
      sheet(`partial ${prefix}`, () => compilePartial('elements/box', prefix));
    const css = () =>
      sheet(name, () =>
        order === 'after'
          ? bulmaCss(bulma) + partial()
          : partial() + bulmaCss(bulma)
      );

    it('draws the edge as a CanvasText outline', () => {
      const { getByText } = render(
        <ConfigProvider classPrefix={prefix}>
          <Box>Inside</Box>
        </ConfigProvider>
      );
      const box = getByText('Inside');
      expect(box).toHaveClass(`${prefix}box`);
      expect(edge(css(), box)).toEqual(DRAWN);
    });

    it('draws it on a box with a bgColor too', () => {
      const { getByText } = render(
        <ConfigProvider classPrefix={prefix}>
          <Box bgColor="primary">Colored</Box>
        </ConfigProvider>
      );
      expect(edge(css(), getByText('Colored'))).toEqual(DRAWN);
    });

    it('draws it on a shadowless box too', () => {
      const { getByText } = render(
        <ConfigProvider classPrefix={prefix}>
          <Box hasShadow={false}>Flat</Box>
        </ConfigProvider>
      );
      expect(edge(css(), getByText('Flat'))).toEqual(DRAWN);
    });

    it('steps aside for the focus ring while the box has keyboard focus', () => {
      const { getByText } = render(
        <ConfigProvider classPrefix={prefix}>
          <Box tabIndex={0}>Focusable</Box>
        </ConfigProvider>
      );
      const box = getByText('Focusable');
      box.focus();
      expect(box.matches(':focus-visible')).toBe(true);
      expect(edge(css(), box)).toEqual(NONE);
    });

    it('steps aside for keyboard focus alone, so a clicked box keeps its edge', () => {
      // jsdom's focus() matches :focus and :focus-visible alike, so the
      // selector is read off the sheet: only :focus-visible may remove it.
      expect(partial()).toContain(`.${prefix}box:not(:focus-visible)`);
      expect(partial()).not.toMatch(/:not\(:focus\)/);
    });
  });

  it('sets nothing outside forced colors', () => {
    const { getByText } = render(<Box>Inside</Box>);
    expect(
      edge(compilePartial('elements/box'), getByText('Inside'), false)
    ).toEqual(NONE);
  });

  it('has no edge with Bulma alone, which is the bug', () => {
    const { getByText } = render(<Box>Inside</Box>);
    expect(edge(bulmaCss(), getByText('Inside'))).toEqual(NONE);
  });
});
