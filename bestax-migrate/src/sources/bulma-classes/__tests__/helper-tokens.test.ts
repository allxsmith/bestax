/**
 * Every class a bestax helper prop renders is a helper token for that prop,
 * so the codemod converts it wherever the component takes helper props. The
 * classes are built here from bestax-bulma's own tuples, so a value the
 * library adds fails this until the table converts it too. Whether each
 * conversion renders the same markup is the truth test's job.
 */

import {
  validAspectRatios,
  validAxisOverflows,
  validGaps,
  validPositions,
  validRadii,
} from '@allxsmith/bestax-bulma/constants';
import { HELPER_TOKENS, type PropWrite } from '../class-map.js';

const rendered: Array<[string, PropWrite]> = [
  ...validGaps.flatMap(value =>
    (
      [
        ['is-gap', 'gap'],
        ['is-column-gap', 'columnGap'],
        ['is-row-gap', 'rowGap'],
      ] as const
    ).map(([stem, prop]): [string, PropWrite] => [
      `${stem}-${value}`,
      { prop, value },
    ])
  ),
  ['is-gapless', { prop: 'gapless' }],
  ...validPositions.map((value): [string, PropWrite] => [
    `is-position-${value}`,
    { prop: 'pos', value },
  ]),
  ['is-relative', { prop: 'relative' }],
  ['is-clipped', { prop: 'overflow', value: 'clipped' }],
  ...validAxisOverflows.flatMap(value =>
    (
      [
        ['is-overflow', 'overflow'],
        ['is-overflow-x', 'overflowX'],
        ['is-overflow-y', 'overflowY'],
      ] as const
    ).map(([stem, prop]): [string, PropWrite] => [
      `${stem}-${value}`,
      { prop, value },
    ])
  ),
  ...validRadii.map((value): [string, PropWrite] => [
    value === 'radiusless' ? 'is-radiusless' : `has-radius-${value}`,
    { prop: 'radius', value },
  ]),
  ...validAspectRatios.map((value): [string, PropWrite] => [
    `is-aspect-ratio-${value}`,
    { prop: 'aspectRatio', value },
  ]),
];

describe('a class a bestax helper prop renders', () => {
  it('finds classes to check', () => {
    expect(rendered.length).toBeGreaterThan(50);
  });

  it.each(rendered)('%s converts to its prop', (token, write) => {
    expect(HELPER_TOKENS.get(token)?.write).toEqual(write);
  });
});
