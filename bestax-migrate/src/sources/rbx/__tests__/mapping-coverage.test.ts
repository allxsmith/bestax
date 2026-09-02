/**
 * Coverage guard: every rbx v2 export (top-level and compound) must have a
 * mapping entry with a valid status. Extending the supported surface is a
 * table edit in mapping.ts; forgetting one is a test failure, never a silent
 * skip.
 *
 * `RBX_EXPORTS` is vendored from rbx's five `index.ts` barrels plus the
 * `Object.assign(…, { Sub })` tails that build its dot-notation compounds, at
 * the SHA `scripts/validate-corpus-rbx.mjs` pins.
 */

import { MAPPING, RBX_EXPORTS, resolveMapping } from '../mapping.js';

const STATUSES = ['mapped', 'partial', 'todo'];

describe('rbx mapping coverage', () => {
  const allPaths: string[][] = Object.entries(RBX_EXPORTS).flatMap(
    ([name, subs]) => [[name], ...subs.map(sub => [name, ...sub.split('.')])]
  );

  test.each(allPaths.map(p => [p.join('.'), p] as const))(
    '%s has a mapping entry',
    (_label, componentPath) => {
      const mapping = resolveMapping(componentPath);
      expect(mapping).toBeDefined();
      expect(STATUSES).toContain(mapping!.status);
    }
  );

  it('maps or annotates every top-level export', () => {
    for (const name of Object.keys(RBX_EXPORTS)) {
      const mapping = MAPPING[name];
      expect(mapping).toBeDefined();
      if (mapping.status === 'todo') {
        expect(mapping.todo).toBeTruthy();
      } else {
        expect(mapping.target ?? mapping.special ?? mapping.subs).toBeTruthy();
      }
    }
  });

  it('has no mapping entries outside the vendored rbx surface', () => {
    for (const name of Object.keys(MAPPING)) {
      expect(RBX_EXPORTS).toHaveProperty(name);
    }
  });

  it('gives every `todo` sub-mapping a hint', () => {
    const walk = (entry: (typeof MAPPING)[string], dotted: string): void => {
      if (entry.status === 'todo') {
        expect([dotted, entry.todo]).toEqual([dotted, expect.any(String)]);
      }
      for (const [name, sub] of Object.entries(entry.subs ?? {})) {
        walk(sub, `${dotted}.${name}`);
      }
    };
    for (const [name, entry] of Object.entries(MAPPING)) walk(entry, name);
  });
});
