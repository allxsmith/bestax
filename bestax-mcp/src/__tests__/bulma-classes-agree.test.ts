/**
 * lookup_bulma_classes answers from bestax-migrate's table by following its
 * planner class by class, so a prop it names is the prop the codemod writes.
 * This holds the two together. Over every mapped root on the tags it can
 * sit on, with each of its modifiers, each helper, and seeded mixes of
 * modifiers, helpers, legacy and app classes, the lookup must name the same
 * component, `as`, props and leftover classes the planner does, and must
 * leave as markup exactly what the planner leaves.
 *
 * The planner is imported from bestax-migrate's source, a test-only reach
 * across packages: a copy of it here would only agree with itself.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from '@jest/globals';
import { ROOTS } from '../../../bestax-migrate/src/sources/bulma-classes/class-map.js';
import { plan } from '../../../bestax-migrate/src/sources/bulma-classes/plan.js';
import { lookupClasses, type BulmaClassTable } from '../bulma-classes.js';
import { DATA_DIR } from '../data.js';

const table: BulmaClassTable = JSON.parse(
  readFileSync(join(DATA_DIR, 'bulma-classes.json'), 'utf8')
);

type Outcome =
  | {
      kind: 'component';
      target: string;
      as: string | undefined;
      props: string[];
      className: string[];
    }
  | { kind: 'wrong-tag' | 'markup' };

const propText = (prop: string, value: string | true | undefined) =>
  value === true || value === undefined ? prop : `${prop}=${value}`;

function planned(tag: string, tokens: string[]): Outcome {
  // Attributes decide some refusals, and the lookup leaves those to the
  // codemod: give the element the ones its roots render by default
  // (`Delete`'s `type` and `aria-label`), so only the classes are compared.
  // Children decide one too (`Card` converts only beside one of its parts),
  // which the lookup states as a condition: give each root those parts.
  const attributes = new Map<string, string>();
  const childTargets: string[] = [];
  for (const token of tokens) {
    const entry = Object.hasOwn(ROOTS, token) ? ROOTS[token] : undefined;
    for (const [name, value] of Object.entries(entry?.defaults ?? {})) {
      attributes.set(name, value);
    }
    childTargets.push(...(entry?.wrapsChildren?.unless ?? []));
  }
  const result = plan({
    tag,
    tokens,
    attributes,
    hasSpread: false,
    hasRef: false,
    hasChildren: true,
    childTargets,
  });
  if (result.conversion) {
    const { target, props, className } = result.conversion;
    const as = props.find(([name]) => name === 'as')?.[1];
    return {
      kind: 'component',
      target,
      as: typeof as === 'string' ? as : undefined,
      props: props
        .filter(([name]) => name !== 'as')
        .map(([name, value]) => propText(name, value))
        .sort(),
      className: (className?.split(' ') ?? []).sort(),
    };
  }
  return result.todos.some(todo => todo.rule.startsWith('tag:'))
    ? { kind: 'wrong-tag' }
    : { kind: 'markup' };
}

function looked(tag: string, tokens: string[]): Outcome {
  const { element, rows } = lookupClasses(table, tokens.join(' '), tag);
  if (element.kind === 'component') {
    return {
      kind: 'component',
      target: element.target,
      as: element.as,
      props: rows
        .flatMap(({ verdict }) =>
          verdict.kind === 'prop'
            ? verdict.writes.map(write => propText(write.prop, write.value))
            : []
        )
        .sort(),
      className: rows
        .filter(({ verdict }) => verdict.kind === 'class')
        .map(({ token }) => token)
        .sort(),
    };
  }
  return { kind: element.kind === 'wrong-tag' ? 'wrong-tag' : 'markup' };
}

const TAGS = [
  'div',
  'span',
  'a',
  'p',
  'button',
  'h1',
  'h2',
  'h4',
  'section',
  'footer',
  'progress',
  'table',
  'nav',
  'li',
];
const mapped = Object.entries(table.roots).filter(
  ([, entry]) => entry.status === 'mapped'
);
const helpers = Object.keys(table.helpers);
/** Classes that are neither a root's modifier nor a helper. */
const others = [
  'my-card',
  'tile',
  'card',
  'label',
  'box',
  'column',
  'is-disabled',
  'has-text-primary-dark',
  'is-12-touch',
  'toString',
];

function compare(cases: Array<[tag: string, tokens: string[]]>): string[] {
  const mismatches: string[] = [];
  for (const [tag, tokens] of cases) {
    const want = planned(tag, tokens);
    const got = looked(tag, tokens);
    if (JSON.stringify(want) !== JSON.stringify(got)) {
      mismatches.push(
        `<${tag} className="${tokens.join(' ')}">: planner ${JSON.stringify(want)}, lookup ${JSON.stringify(got)}`
      );
    }
  }
  return mismatches;
}

/** A small seeded PRNG, so a failure names a case that reproduces. */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('lookup_bulma_classes agrees with the codemod planner', () => {
  it('on each root alone, on every tag', () => {
    const cases = mapped.flatMap(([root]) =>
      TAGS.map(tag => [tag, [root]] as [string, string[]])
    );
    expect(compare(cases)).toEqual([]);
  });

  it("on each root with each of its modifiers, on the tags they're exact on", () => {
    const cases = mapped.flatMap(([root, entry]) =>
      Object.entries(entry.modifiers).flatMap(([token, modifier]) =>
        [entry.tag!, 'p', 'h2', ...(modifier.tagIn ?? [])].map(
          tag => [tag, [root, token]] as [string, string[]]
        )
      )
    );
    expect(cases.length).toBeGreaterThan(400);
    expect(compare(cases)).toEqual([]);
  });

  it('on each root with each helper, and on the plain tags bestax wraps', () => {
    const cases: Array<[string, string[]]> = [];
    for (const [root, entry] of mapped) {
      for (const helper of helpers) cases.push([entry.tag!, [root, helper]]);
    }
    for (const tag of [...Object.keys(table.wrappers), 'div']) {
      for (const helper of helpers) cases.push([tag, [helper]]);
    }
    expect(compare(cases)).toEqual([]);
  });

  // With no tag, the lookup answers for the tag the component renders on its
  // own. The planner needs a tag, so it runs on that one: a heading's on <p>,
  // where its size is exact, and classes with no root on <p>, whose
  // Paragraph takes the same color props the no-tag answer names.
  it('with no tag, on the tag the component renders by itself', () => {
    const mismatches: string[] = [];
    const check = (tag: string, tokens: string[]) => {
      const want = planned(tag, tokens);
      const got = looked(tag, tokens);
      const untagged = lookupClasses(table, tokens.join(' '));
      const props = untagged.rows
        .flatMap(({ verdict }) =>
          verdict.kind === 'prop'
            ? verdict.writes.map(write => propText(write.prop, write.value))
            : []
        )
        .sort();
      const className = untagged.rows
        .filter(({ verdict }) => verdict.kind === 'class')
        .map(({ token }) => token)
        .sort();
      const agrees =
        want.kind === 'component'
          ? JSON.stringify({ props, className }) ===
            JSON.stringify({ props: want.props, className: want.className })
          : untagged.element.kind === 'markup';
      if (!agrees || JSON.stringify(want) !== JSON.stringify(got)) {
        mismatches.push(
          `"${tokens.join(' ')}" (as on <${tag}>): planner ${JSON.stringify(want)}, lookup ${JSON.stringify({ element: untagged.element.kind, props, className })}`
        );
      }
    };
    for (const [root, entry] of mapped) {
      const tag = entry.sizeDrivesTag ? 'p' : entry.tag!;
      for (const token of Object.keys(entry.modifiers))
        check(tag, [root, token]);
      for (const helper of helpers) check(tag, [root, helper]);
    }
    const next = random(749);
    for (let i = 0; i < 1000; i += 1) {
      const tokens = new Set<string>();
      const count = 1 + Math.floor(next() * 4);
      while (tokens.size < count) {
        tokens.add(helpers[Math.floor(next() * helpers.length)]);
      }
      check('p', [...tokens]);
    }
    expect({ count: mismatches.length, first: mismatches.slice(0, 5) }).toEqual(
      { count: 0, first: [] }
    );
  });

  it('on seeded mixes of roots, modifiers, helpers and other classes', () => {
    const next = random(744);
    const pick = <T>(list: readonly T[]): T =>
      list[Math.floor(next() * list.length)];
    const cases: Array<[string, string[]]> = [];
    for (let i = 0; i < 4000; i += 1) {
      const rooted = next() < 0.75;
      const [root, entry] = pick(mapped);
      const pool = [
        ...(rooted ? Object.keys(entry.modifiers) : []),
        ...helpers,
        ...others,
      ];
      const tokens = new Set<string>(rooted ? [root] : []);
      const count = 1 + Math.floor(next() * 5);
      while (tokens.size < count + (rooted ? 1 : 0)) tokens.add(pick(pool));
      const shuffled = [...tokens].sort(() => next() - 0.5);
      const tag = pick([
        ...TAGS,
        ...Object.keys(table.wrappers),
        ...(rooted ? [entry.tag!] : []),
      ]);
      cases.push([tag, shuffled]);
    }
    const mismatches = compare(cases);
    expect({ count: mismatches.length, first: mismatches.slice(0, 5) }).toEqual(
      { count: 0, first: [] }
    );
  });
});
