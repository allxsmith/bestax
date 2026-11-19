/**
 * `bulmaDisplay` reads an element's tag and classes against the display
 * tables the way the cascade would. That the tables say what `bulma.css`
 * says is the stylesheet test's job; this holds how the lookup reads and
 * weighs them.
 */

import { type BulmaDisplay, bulmaDisplay, rulesOf } from '../display.js';

/** The displays an element takes, `undefined` standing for its tag's. */
const displays = (...values: Array<BulmaDisplay | undefined>) =>
  new Set(values);

describe('bulmaDisplay', () => {
  it("answers nothing where Bulma's rules set no display, so the tag's holds", () => {
    expect(bulmaDisplay('div', [])).toBeUndefined();
    expect(bulmaDisplay('div', ['container', 'my-own'])).toBeUndefined();
  });

  it("reads a component's display, the same at every viewport", () => {
    expect(bulmaDisplay('button', ['button', 'is-primary'])).toEqual(
      displays('inline-flex')
    );
    expect(bulmaDisplay('div', ['grid'])).toEqual(displays('grid'));
    expect(bulmaDisplay('div', ['modal'])).toEqual(displays('none'));
  });

  it('weighs a selector with more classes over one with fewer', () => {
    expect(bulmaDisplay('button', ['button', 'is-fullwidth'])).toEqual(
      displays('flex')
    );
    expect(bulmaDisplay('div', ['modal', 'is-active'])).toEqual(
      displays('flex')
    );
    expect(bulmaDisplay('input', ['input', 'is-fullwidth'])).toEqual(
      displays('block')
    );
  });

  it('weighs a selector naming the tag over one that names none', () => {
    expect(bulmaDisplay('div', ['icon-text'])).toEqual(displays('flex'));
    expect(bulmaDisplay('DIV', ['icon-text'])).toEqual(displays('flex'));
    expect(bulmaDisplay('span', ['icon-text'])).toEqual(
      displays('inline-flex')
    );
  });

  it('weighs a display helper over any component rule', () => {
    expect(
      bulmaDisplay('button', ['button', 'is-fullwidth', 'is-block'])
    ).toEqual(displays('block'));
    expect(
      bulmaDisplay('textarea', ['textarea', 'is-fullwidth', 'is-inline'])
    ).toEqual(displays('inline'));
    expect(bulmaDisplay('a', ['navbar-item', 'is-flex'])).toEqual(
      displays('flex')
    );
    expect(bulmaDisplay('div', ['is-hidden'])).toEqual(displays('none'));
    expect(bulmaDisplay('div', ['is-display-grid'])).toEqual(displays('grid'));
  });

  it('adds the display a media query gives instead', () => {
    expect(bulmaDisplay('a', ['navbar-item'])).toEqual(
      displays('block', 'flex')
    );
    expect(bulmaDisplay('div', ['navbar-menu', 'is-active'])).toEqual(
      displays('none', 'flex', 'block')
    );
    expect(bulmaDisplay('div', ['is-flex', 'is-hidden-mobile'])).toEqual(
      displays('flex', 'none')
    );
  });

  it("keeps the tag's own where only a media query sets a display", () => {
    expect(bulmaDisplay('div', ['columns'])).toEqual(
      displays(undefined, 'flex')
    );
    expect(bulmaDisplay('div', ['columns', 'is-desktop'])).toEqual(
      displays(undefined, 'flex')
    );
    expect(bulmaDisplay('nav', ['navbar'])).toEqual(
      displays(undefined, 'flex')
    );
    expect(bulmaDisplay('div', ['is-flex-tablet'])).toEqual(
      displays(undefined, 'flex')
    );
  });

  it('keeps one display a media query only restates', () => {
    expect(bulmaDisplay('div', ['columns', 'is-mobile'])).toEqual(
      displays('flex')
    );
    expect(bulmaDisplay('div', ['is-flex', 'is-flex-tablet'])).toEqual(
      displays('flex')
    );
  });

  it('leaves out a media rule the winner outweighs', () => {
    expect(bulmaDisplay('a', ['navbar-item', 'is-block'])).toEqual(
      displays('block')
    );
  });

  it('counts both displays where equally weighty rules disagree', () => {
    expect(bulmaDisplay('div', ['is-hidden', 'is-flex'])).toEqual(
      displays('none', 'flex')
    );
    expect(bulmaDisplay('span', ['icon', 'image'])).toEqual(
      displays('inline-flex', 'block')
    );
  });

  it('takes any iterable of classes', () => {
    expect(bulmaDisplay('div', new Set(['box']))).toEqual(displays('block'));
  });
});

describe('rulesOf', () => {
  it('reads a tag whole, digits and all', () => {
    expect(
      rulesOf({ 'h1.title': 'block', '.title': 'inline' }, false)
    ).toMatchObject([
      { tag: 'h1', classes: ['title'], without: [] },
      { tag: undefined, classes: ['title'], without: [] },
    ]);
  });

  it('reads the classes a rule needs apart from the ones it must not have', () => {
    expect(
      rulesOf({ 'div.columns:not(.is-desktop)': { media: 'flex' } }, false)
    ).toMatchObject([
      {
        tag: 'div',
        classes: ['columns'],
        without: ['is-desktop'],
        display: 'flex',
        media: true,
      },
    ]);
  });
});
