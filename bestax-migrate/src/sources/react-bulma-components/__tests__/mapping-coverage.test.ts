/**
 * Coverage guard: every react-bulma-components v4 export (top-level and
 * compound) must have a mapping entry with a valid status. Extending the
 * supported surface is a table edit in mapping.ts; forgetting one is a test
 * failure, never a silent skip.
 */

import { MAPPING, RBC_EXPORTS, resolveMapping } from '../mapping.js';

const STATUSES = ['mapped', 'partial', 'todo'];

describe('react-bulma-components mapping coverage', () => {
  const allPaths: string[][] = Object.entries(RBC_EXPORTS).flatMap(
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
    for (const name of Object.keys(RBC_EXPORTS)) {
      const mapping = MAPPING[name];
      expect(mapping).toBeDefined();
      if (mapping.status === 'todo') {
        expect(mapping.todo).toBeTruthy();
      } else {
        // Namespace-only entries (Form) carry no target of their own but
        // must map all of their subs.
        expect(mapping.target ?? mapping.special ?? mapping.subs).toBeTruthy();
      }
    }
  });

  it('has no mapping entries outside the vendored RBC surface', () => {
    for (const name of Object.keys(MAPPING)) {
      expect(RBC_EXPORTS).toHaveProperty(name);
    }
  });
});
