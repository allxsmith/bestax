/**
 * Rule ids for the bulma-classes source's TODOs.
 *
 * A rule id reaches opt-in telemetry (`todosByRule`), and this source reads
 * the app's own class strings, so an id must never carry one of those. Every
 * id is `kind:token`, where the token comes from a closed vocabulary: a Bulma
 * class this table knows, a bestax component, or an attribute or prop name
 * the table itself lists. A token outside it is dropped and the id is just the
 * kind, so a gap in the vocabulary costs detail, never the file. The planner
 * tests sweep every refusal the table can produce and hold each id to the
 * vocabulary, so a gap is still caught.
 */

import {
  HELPER_PROPS,
  LEGACY_09,
  ROOTS,
  WRAPPERS,
  WRAPPER_OWN_PROPS,
} from './class-map.js';

export const KINDS: ReadonlySet<string> = new Set([
  'attr',
  'children',
  'context',
  'defaults',
  'drops',
  'dynamic-class',
  'family',
  'legacy',
  'only-child',
  'ref',
  'spread',
  'tag',
]);

const VOCABULARY: ReadonlySet<string> = new Set([
  ...Object.keys(ROOTS),
  ...Object.keys(LEGACY_09),
  ...Object.values(ROOTS).flatMap(entry => [
    ...(entry.target ? [entry.target] : []),
    ...(entry.ownProps ?? []),
    ...(entry.passThrough ?? []),
    ...(entry.untypedAttrs ?? []),
    ...(entry.numberAttrs ?? []),
    ...Object.keys(entry.defaults ?? {}),
    ...Object.keys(entry.dropsAttr ?? {}),
  ]),
  ...Object.values(WRAPPERS),
  ...Object.values(WRAPPER_OWN_PROPS).flat(),
  ...HELPER_PROPS,
  // Refused on every target, so no entry lists it.
  'dangerouslySetInnerHTML',
  // Refused where the target drops its own class for one it is given.
  'className',
]);

export function inVocabulary(token: string): boolean {
  return VOCABULARY.has(token);
}

export function ruleId(kind: string, token: string): string {
  if (!KINDS.has(kind)) {
    throw new Error(`not a bulma-classes rule kind: ${kind}`);
  }
  return VOCABULARY.has(token) ? `${kind}:${token}` : kind;
}
