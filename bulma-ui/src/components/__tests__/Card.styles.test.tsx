// Bulma draws a card's edge as a shadow, which forced colors drops, so
// `_card.scss` draws it as a CanvasText outline there (#1860). jsdom evaluates
// no media query, so these compile the real partial, join it to Bulma's CSS on
// either side, and resolve the edge with the shared cascade as a
// forced-colors page applies the sheet.
import { render } from '@testing-library/react';
import { Card } from '../Card';
import { CheckboxCard } from '../../form/CheckboxCard';
import { RadioCard } from '../../form/RadioCard';
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

/** How the card's edge is drawn, from `css`, on a forced-colors page or not. */
const edge = (css: string, el: Element, forcedColors = true) => ({
  outline: winner(css, el, OUTLINE, forcedColors),
  offset: winner(css, el, ['outline-offset'], forcedColors),
});

// Outside the card, so its image doesn't paint over the edge.
const DRAWN = { outline: 'outline: 1px solid CanvasText', offset: undefined };

const NONE = { outline: undefined, offset: undefined };

// Each sheet once: a Sass compile and Bulma's whole stylesheet are slow.
const sheets = new Map<string, string>();
const sheet = (key: string, build: () => string) => {
  if (!sheets.has(key)) sheets.set(key, build());
  return sheets.get(key)!;
};

describe('Card on a forced-colors page', () => {
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
      sheet(`partial ${prefix}`, () =>
        compilePartial('components/card', prefix)
      );
    const css = () =>
      sheet(name, () =>
        order === 'after'
          ? bulmaCss(bulma) + partial()
          : partial() + bulmaCss(bulma)
      );

    it('draws the edge as a CanvasText outline', () => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <Card>
            <Card.Content>Inside</Card.Content>
          </Card>
        </ConfigProvider>
      );
      const card = container.querySelector(`.${prefix}card`)!;
      expect(card).not.toBeNull();
      expect(edge(css(), card)).toEqual(DRAWN);
    });

    it('leaves CheckboxCard and RadioCard to their own edge', () => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <CheckboxCard title="Email" />
          <RadioCard name="plan" value="pro" title="Pro" />
        </ConfigProvider>
      );
      const cards = Array.from(container.querySelectorAll(`.${prefix}card`));
      expect(cards).toHaveLength(2);
      for (const card of cards) expect(edge(css(), card)).toEqual(NONE);
    });

    it('steps aside for the focus ring while the card has keyboard focus', () => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <Card tabIndex={0}>
            <Card.Content>Focusable</Card.Content>
          </Card>
        </ConfigProvider>
      );
      const card = container.querySelector<HTMLElement>(`.${prefix}card`)!;
      card.focus();
      expect(card.matches(':focus-visible')).toBe(true);
      expect(edge(css(), card)).toEqual(NONE);
    });

    it('steps aside for keyboard focus alone, so a clicked card keeps its edge', () => {
      // jsdom's focus() matches :focus and :focus-visible alike, so the
      // selector is read off the sheet: only :focus-visible may remove it.
      expect(partial()).toMatch(/:not\(:focus-visible\)\s*\{/);
      expect(partial()).not.toMatch(/:not\(:focus\)/);
    });
  });

  it('sets nothing outside forced colors', () => {
    const { container } = render(
      <Card>
        <Card.Content>Inside</Card.Content>
      </Card>
    );
    expect(
      edge(
        compilePartial('components/card'),
        container.querySelector('.card')!,
        false
      )
    ).toEqual(NONE);
  });

  it('has no edge with Bulma alone, which is the bug', () => {
    const { container } = render(
      <Card>
        <Card.Content>Inside</Card.Content>
      </Card>
    );
    expect(edge(bulmaCss(), container.querySelector('.card')!)).toEqual(NONE);
  });
});
