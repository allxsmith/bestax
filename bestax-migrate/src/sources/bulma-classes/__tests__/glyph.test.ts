/**
 * `readGlyph` reads a `.icon`'s `<i>` as the props `Icon` builds it from.
 * That those props render the same `<i>` is the render truth test's job;
 * this holds which glyphs read, and as what.
 */

import { readGlyph } from '../glyph.js';
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
      ['fa', 'fa'],
      ['fa-solid', 'fa-solid'],
      ['fa-regular', 'fa-regular'],
    ]) {
      expect(readGlyph(glyph([style, 'fa-bell']))).toEqual({
        library: 'fa',
        name: 'bell',
        variant,
      });
    }
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
