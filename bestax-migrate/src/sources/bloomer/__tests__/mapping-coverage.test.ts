/**
 * Coverage guard: every bloomer export must have a mapping entry with a valid
 * status. Extending the supported surface is a table edit in mapping.ts;
 * forgetting one is a test failure, never a silent skip.
 *
 * `BLOOMER_EXPORTS` is vendored from bloomer's `src/index.ts` at the SHA
 * `scripts/validate-corpus-bloomer.mjs` pins.
 */

import { BLOOMER_EXPORTS, MAPPING, resolveMapping } from '../mapping.js';
import { SPECIAL_NAMES } from '../specials.js';

const STATUSES = ['mapped', 'partial', 'todo'];

/**
 * Specials that never leave the rename step without a target: they either
 * replace the node or return one. An entry that names any other special
 * must carry its own `target`, or a flat bloomer element would be left in
 * place while its import is pruned.
 */
const TARGET_PROVIDING_SPECIALS = [
  'heading',
  'help',
  'label',
  'breadcrumb-item',
  'page',
  'page-control',
  'panel-tab',
  'tab-link',
  'hero-video',
  'navbar-item',
  'navbar-dropdown',
];

/**
 * Every bloomer component whose props include `isSize`. Its type differs per
 * component (numeric on Title/Subtitle, sizes-or-fractions on Column, pixel
 * squares on Image), so it must be claimed per component and never fall
 * through to the universal table — where a single rename would be wrong for
 * at least one of them.
 */
const SIZE_HOLDERS = [
  'Breadcrumb',
  'Button',
  'Column',
  'Content',
  'Delete',
  'FieldLabel',
  'Hero',
  'Icon',
  'Image',
  'Input',
  'Label',
  'Media',
  'ModalClose',
  'Pagination',
  'Progress',
  'Section',
  'Select',
  'Subtitle',
  'Tabs',
  'Tag',
  'TextArea',
  'Tile',
  'Title',
];

describe('bloomer mapping coverage', () => {
  const names = Object.keys(BLOOMER_EXPORTS);

  it('vendors all 108 bloomer exports, every one of them flat', () => {
    expect(names).toHaveLength(108);
    for (const subs of Object.values(BLOOMER_EXPORTS)) expect(subs).toEqual([]);
  });

  test.each(names)('%s has a mapping entry', name => {
    const mapping = resolveMapping([name]);
    expect(mapping).toBeDefined();
    expect(STATUSES).toContain(mapping!.status);
  });

  it('maps or annotates every export', () => {
    for (const name of names) {
      const mapping = MAPPING[name];
      if (mapping.status === 'todo') {
        expect({ name, todo: mapping.todo }).toEqual({
          name,
          todo: expect.any(String),
        });
      } else {
        expect({
          name,
          ok: Boolean(mapping.target ?? mapping.special),
        }).toEqual({ name, ok: true });
      }
    }
  });

  it('has no mapping entries outside the vendored bloomer surface', () => {
    for (const name of Object.keys(MAPPING)) {
      expect(BLOOMER_EXPORTS).toHaveProperty(name);
    }
  });

  it('names only special handlers that exist', () => {
    for (const [name, entry] of Object.entries(MAPPING)) {
      if (entry.special) {
        expect({ name, known: SPECIAL_NAMES.includes(entry.special) }).toEqual({
          name,
          known: true,
        });
      }
    }
  });

  it('gives every target-less entry a special that provides one', () => {
    for (const [name, entry] of Object.entries(MAPPING)) {
      if (entry.status === 'todo' || entry.target) continue;
      expect({ name, special: entry.special }).toEqual({
        name,
        special: expect.toBeOneOf(TARGET_PROVIDING_SPECIALS),
      });
    }
  });

  it('claims `isSize` on every component that has one', () => {
    for (const name of SIZE_HOLDERS) {
      const entry = MAPPING[name];
      if (entry.status === 'todo') continue;
      // Column, Image and Label consume it structurally; the rest name it.
      const claimed =
        Boolean(entry.props?.isSize) ||
        entry.special === 'column' ||
        entry.special === 'image' ||
        entry.special === 'label';
      expect({ name, claimed }).toEqual({ name, claimed: true });
    }
  });
});

expect.extend({
  toBeOneOf(received: unknown, allowed: unknown[]) {
    const pass = allowed.includes(received);
    return {
      pass,
      message: () =>
        `expected ${String(received)} ${pass ? 'not ' : ''}to be one of ${allowed.join(', ')}`,
    };
  },
});

declare module 'expect' {
  interface AsymmetricMatchers {
    toBeOneOf(allowed: unknown[]): void;
  }
  interface Matchers<R> {
    toBeOneOf(allowed: unknown[]): R;
  }
}
