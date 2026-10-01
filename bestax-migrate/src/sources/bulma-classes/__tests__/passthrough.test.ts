/**
 * A class this source leaves in `className` carries a reason, and the MCP
 * server's `lookup_bulma_classes` answers with it. When bestax gained helper
 * props for Bulma's position, overflow, radius and aspect-ratio helpers, the
 * reason for their classes still said "a Bulma helper with no bestax prop",
 * which sent an agent away from the prop that renders them. The classes each
 * prop renders are built here from bestax-bulma's own tuples, so a value the
 * library adds is held to the same rule.
 */

import {
  validAspectRatios,
  validAxisOverflows,
  validPositions,
  validRadii,
} from '@allxsmith/bestax-bulma/constants';
import { HELPER_TOKENS, passthroughReason } from '../class-map.js';

const rendered: Array<[string, string]> = [
  ...validPositions.map(v => [`is-position-${v}`, '`pos`'] as [string, string]),
  ...validAxisOverflows.flatMap(v =>
    [`is-overflow-${v}`, `is-overflow-x-${v}`, `is-overflow-y-${v}`].map(
      cls => [cls, '`overflow`'] as [string, string]
    )
  ),
  // `radiusless` is the one radius class the codemod already converts.
  ...validRadii
    .filter(v => v !== 'radiusless')
    .map(v => [`has-radius-${v}`, '`radius`'] as [string, string]),
  ...validAspectRatios.map(
    v => [`is-aspect-ratio-${v}`, '`aspectRatio`'] as [string, string]
  ),
];

describe('a class a bestax helper prop renders', () => {
  it('finds classes to check', () => {
    expect(rendered.length).toBeGreaterThan(20);
  });

  it.each(rendered)(
    '%s is converted, or its reason names %s',
    (token, prop) => {
      // Once the codemod converts a class it is a helper token, and the
      // reason is never consulted.
      if (HELPER_TOKENS.has(token)) return;
      const why = passthroughReason(token);
      expect(why).toContain(prop);
      expect(why).not.toContain('no bestax prop');
    }
  );
});
