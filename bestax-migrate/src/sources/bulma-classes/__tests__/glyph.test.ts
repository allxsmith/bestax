/**
 * `readGlyph` reads a `.icon`'s `<i>` as the props `Icon` builds it from.
 * That those props render the same `<i>` is the render truth test's job;
 * this holds which glyphs read, and as what, how they're written, and what
 * the advice for Font Awesome's script-drawn `<svg>` reads from it.
 */

import {
  glyphProps,
  readDrawnGlyph,
  readGlyph,
  readHiddenGlyph,
} from '../glyph.js';
import type { ChildFacts } from '../plan.js';

const glyph = (
  tokens: string[] | null | undefined,
  extra: Partial<ChildFacts> = {}
): ChildFacts => ({
  tag: 'i',
  ...(tokens !== undefined && { tokens }),
  attributes: new Map(),
  hasSpread: false,
  isEmpty: true,
  ...extra,
});

describe('readGlyph', () => {
  it('reads a Font Awesome glyph, with its style as the variant Icon renders it from', () => {
    expect(readGlyph(glyph(['fas', 'fa-home']))).toEqual({
      library: 'fa',
      name: 'home',
    });
    for (const [style, variant] of [
      ['far', 'regular'],
      ['fab', 'brands'],
      ['fal', 'light'],
      ['fad', 'duotone'],
      ['fat', 'thin'],
      // Font Awesome 4's, which 4 alone styles as written.
      ['fa', 'fa'],
    ]) {
      expect(readGlyph(glyph([style, 'fa-bell']))).toEqual({
        library: 'fa',
        name: 'bell',
        variant,
      });
    }
  });

  it("reads Font Awesome 6's long name for a style as the skill's variant, which renders the short one", () => {
    expect(readGlyph(glyph(['fa-solid', 'fa-house']))).toEqual({
      library: 'fa',
      name: 'house',
      longStyle: 'fa-solid',
    });
    for (const [style, variant] of [
      ['fa-regular', 'regular'],
      ['fa-brands', 'brands'],
      ['fa-light', 'light'],
      ['fa-thin', 'thin'],
      ['fa-duotone', 'duotone'],
    ]) {
      expect(readGlyph(glyph([style, 'fa-bell', 'fa-lg']))).toEqual({
        library: 'fa',
        name: 'bell',
        variant,
        features: ['fa-lg'],
        longStyle: style,
      });
    }
  });

  it('keeps the long name as written beside `fa-sharp`, whose family a short name would set back', () => {
    expect(readGlyph(glyph(['fa-sharp', 'fa-solid', 'fa-house']))).toEqual({
      library: 'fa',
      name: 'house',
      variant: 'fa-solid',
      features: ['fa-sharp'],
    });
    // A short name was written short, so it has nothing to keep.
    expect(readGlyph(glyph(['fa-sharp', 'far', 'fa-bell']))).toEqual({
      library: 'fa',
      name: 'bell',
      variant: 'regular',
      features: ['fa-sharp'],
    });
  });

  it('reads the classes that modify a glyph, and any other, as features', () => {
    expect(
      readGlyph(glyph(['fa-lg', 'fas', 'fa-spinner', 'fa-spin', 'my-glyph']))
    ).toEqual({
      library: 'fa',
      name: 'spinner',
      features: ['fa-lg', 'fa-spin', 'my-glyph'],
    });
  });

  it('reads a Material Design Icons glyph', () => {
    expect(readGlyph(glyph(['mdi', 'mdi-home']))).toEqual({
      library: 'mdi',
      name: 'home',
    });
    expect(readGlyph(glyph(['mdi', 'mdi-home', 'mdi-24px']))).toEqual({
      library: 'mdi',
      name: 'home',
      features: ['mdi-24px'],
    });
  });

  it('reads nothing that Icon would render differently', () => {
    const refused: Array<[string, ChildFacts | undefined]> = [
      ['no glyph', undefined],
      ['another tag', { ...glyph(['fas', 'fa-home']), tag: 'span' }],
      ['a computed class', glyph(null)],
      ['no class', glyph(undefined)],
      [
        'an attribute',
        glyph(['fas', 'fa-home'], {
          attributes: new Map([['aria-hidden', 'true']]),
        }),
      ],
      ['a spread', glyph(['fas', 'fa-home'], { hasSpread: true })],
      ['content', glyph(['fas', 'fa-home'], { isEmpty: false })],
      ['no style', glyph(['fa-home'])],
      ['two styles', glyph(['fas', 'far', 'fa-home'])],
      ['two libraries', glyph(['fas', 'fa-home', 'mdi', 'mdi-home'])],
      ['two names', glyph(['fas', 'fa-home', 'fa-house'])],
      ['no name', glyph(['fas', 'fa-lg'])],
      ['a name Icon would strip', glyph(['fas', 'fa-fa-home'])],
      ['no Material Design Icons name', glyph(['mdi', 'mdi-24px'])],
      ['another icon font', glyph(['bi', 'bi-house'])],
    ];
    for (const [label, facts] of refused) {
      expect({ label, glyph: readGlyph(facts) }).toEqual({
        label,
        glyph: undefined,
      });
    }
  });
});

describe('readHiddenGlyph', () => {
  const hidden = (value: string | true = 'true', extra = {}) =>
    glyph(['fas', 'fa-home'], {
      attributes: new Map<string, string | true>([
        ['aria-hidden', value],
        ...Object.entries(extra as Record<string, string>),
      ]),
    });

  it("reads Font Awesome's own hidden <i>, either spelling", () => {
    expect(readHiddenGlyph(hidden())).toEqual({ library: 'fa', name: 'home' });
    expect(readHiddenGlyph(hidden(true))).toEqual({
      library: 'fa',
      name: 'home',
    });
  });

  it('reads no other <i>', () => {
    for (const [label, facts] of Object.entries({
      'no glyph': undefined,
      'a bare <i>': glyph(['fas', 'fa-home']),
      'not hidden': hidden('false'),
      'carrying more': hidden('true', { id: 'x' }),
      'holding content': { ...hidden(), isEmpty: false },
      'naming no glyph': { ...hidden(), tokens: ['material-icons'] },
    })) {
      expect({ label, glyph: readHiddenGlyph(facts) }).toEqual({
        label,
        glyph: undefined,
      });
    }
  });
});

describe('glyphProps', () => {
  it("writes a glyph as Icon is given it, with no library for Icon's default and one feature as a string, more as a list", () => {
    expect(glyphProps({ library: 'fa', name: 'home' })).toEqual([
      ['name', 'home'],
    ]);
    expect(
      glyphProps({
        library: 'fa',
        name: 'bell',
        variant: 'regular',
        features: ['fa-lg'],
      })
    ).toEqual([
      ['name', 'bell'],
      ['variant', 'regular'],
      ['features', 'fa-lg'],
    ]);
    // What the render tests read is no prop.
    expect(
      glyphProps({
        library: 'fa',
        name: 'bell',
        variant: 'brands',
        longStyle: 'fa-brands',
      })
    ).toEqual([
      ['name', 'bell'],
      ['variant', 'brands'],
    ]);
    expect(
      glyphProps({ library: 'mdi', name: 'home', features: ['a', 'b'] })
    ).toEqual([
      ['library', 'mdi'],
      ['name', 'home'],
      ['features', ['a', 'b']],
    ]);
  });
});

describe('readDrawnGlyph', () => {
  const svg = (
    tokens: string[] | null | undefined,
    attributes: Record<string, string | null> = {}
  ): ChildFacts => ({
    ...glyph(tokens),
    tag: 'svg',
    attributes: new Map(Object.entries(attributes)),
    isEmpty: false,
  });

  it('reads the <i> Font Awesome drew an <svg> for, from its data attributes', () => {
    expect(
      readDrawnGlyph(
        svg(['svg-inline--fa', 'fa-search', 'fa-w-16'], {
          'data-prefix': 'fas',
          'data-icon': 'search',
          'aria-hidden': 'true',
        })
      )
    ).toEqual({ library: 'fa', name: 'search' });
    expect(
      readDrawnGlyph(
        svg(['svg-inline--fa', 'fa-github', 'fa-lg'], {
          'data-prefix': 'fab',
          'data-icon': 'github',
        })
      )
    ).toEqual({
      library: 'fa',
      name: 'github',
      variant: 'brands',
      features: ['fa-lg'],
    });
    // Font Awesome 4's `fa`, which the script keeps as it was written. The
    // script is 5's or later, which draws it solid, `Icon`'s default.
    expect(
      readDrawnGlyph(
        svg(['svg-inline--fa', 'fa-search'], {
          'data-prefix': 'fa',
          'data-icon': 'search',
        })
      )
    ).toEqual({ library: 'fa', name: 'search' });
  });

  it('falls back to its one class naming a glyph, in the default style', () => {
    expect(
      readDrawnGlyph(
        svg(['svg-inline--fa', 'fa-search', 'fa-fw'], { 'data-icon': null })
      )
    ).toEqual({ library: 'fa', name: 'search', features: ['fa-fw'] });
    expect(
      readDrawnGlyph(
        svg(['svg-inline--fa', 'fa-search'], { 'data-prefix': 'nope' })
      )
    ).toEqual({ library: 'fa', name: 'search' });
  });

  it('reads nothing from any other <svg> or element', () => {
    for (const [label, facts] of Object.entries({
      'no svg': undefined,
      'an <i>': glyph(['svg-inline--fa', 'fa-search']),
      'another <svg>': svg(['my-icon', 'fa-search']),
      'a computed class': svg(null),
      'no class': svg(undefined),
      'no name': svg(['svg-inline--fa', 'fa-w-16']),
      'two names': svg(['svg-inline--fa', 'fa-search', 'fa-home']),
    })) {
      expect({ label, glyph: readDrawnGlyph(facts) }).toEqual({
        label,
        glyph: undefined,
      });
    }
  });
});
