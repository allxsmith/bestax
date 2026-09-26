/**
 * Every conversion the bulma-classes table allows renders exactly the markup
 * it replaces. The raw element and the bestax component are both rendered
 * through the built library's React and compared after normalising
 * attribute and class order.
 *
 * Three layers:
 *   - every root on every tag it can reach, alone and with each of its
 *     modifiers and each helper class;
 *   - the table's own declarations about the library (refs, props);
 *   - a seeded fuzz of mixed tokens and attributes through the planner.
 *
 * A planner refusal is always safe (the markup stays as written), so the
 * tests assert only that what DOES convert is identical, plus that every
 * table entry converts somewhere, so no row is dead.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FORWARDS_REF,
  HELPER_TOKENS,
  ROOTS,
  WRAPPERS,
  WRAPPER_OWN_PROPS,
  type RootEntry,
} from '../src/sources/bulma-classes/class-map.js';
import { plan, type ElementFacts } from '../src/sources/bulma-classes/plan.js';
import {
  bestax,
  normalizeHtml,
  renderElement,
} from './support/render-module.js';

const repoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

/** Elements that must stay empty in HTML. */
const VOID = new Set(['input', 'hr', 'img', 'br']);

const mapped = Object.entries(ROOTS).filter(
  ([, entry]) => entry.status === 'mapped'
) as Array<[string, RootEntry]>;

function tagsFor(entry: RootEntry): string[] {
  if (entry.as === 'any') return [entry.tag!, 'a', 'span', 'div', 'input'];
  return [...new Set([entry.tag!, ...(entry.as ?? [])])];
}

/**
 * Render the raw element and, when the planner converts it, the bestax one.
 * Returns null when the planner leaves the element alone.
 */
function renderBoth(
  facts: ElementFacts,
  extra: Record<string, string | true> = {}
): { raw: string; converted: string } | null {
  const result = plan(facts);
  if (!result.conversion) return null;
  const children = VOID.has(facts.tag) ? undefined : 'x';
  const raw = renderElement(
    facts.tag,
    { className: facts.tokens.join(' '), ...extra },
    children
  );
  const { target, props, className, drop, numbers } = result.conversion;
  const kept = Object.fromEntries(
    Object.entries(extra)
      .filter(([name]) => !drop.includes(name))
      .map(([name, value]) => [
        name,
        numbers.includes(name) ? Number(value) : value,
      ])
  );
  const converted = renderElement(
    target,
    {
      ...kept,
      ...Object.fromEntries(props),
      ...(className ? { className } : {}),
    },
    children
  );
  return { raw: normalizeHtml(raw), converted: normalizeHtml(converted) };
}

function factsFor(
  tag: string,
  tokens: string[],
  attributes: Record<string, string | true> = {}
): ElementFacts {
  return {
    tag,
    tokens,
    attributes: new Map(Object.entries(attributes)),
    hasSpread: false,
    hasRef: false,
    hasChildren: !VOID.has(tag),
  };
}

// Silence the library's development warnings (unstyled colors and the like):
// they are about the app's choices, and this suite renders every choice.
const warn = console.warn;
const error = console.error;
beforeAll(() => {
  console.warn = () => {};
  console.error = () => {};
});
afterAll(() => {
  console.warn = warn;
  console.error = error;
});

describe.each(mapped)('`.%s`', (root, entry) => {
  const defaults = { ...(entry.defaults ?? {}) };
  const converts = new Set<string>();

  it.each(tagsFor(entry))('renders the same on a <%s>', tag => {
    const candidates = [
      [root],
      ...Object.keys(entry.modifiers ?? {}).map(token => [root, token]),
      ...[...HELPER_TOKENS.keys()].map(token => [root, token]),
    ];
    for (const tokens of candidates) {
      const both = renderBoth(factsFor(tag, tokens, defaults), defaults);
      if (!both) continue;
      expect({ tokens, tag, html: both.converted }).toEqual({
        tokens,
        tag,
        html: both.raw,
      });
      // Only a token that left `className` counts as converted.
      const result = plan(factsFor(tag, tokens, defaults));
      const kept = result.conversion!.className?.split(' ') ?? [];
      for (const token of tokens)
        if (!kept.includes(token)) converts.add(token);
    }
  });

  it('has no dead modifiers', () => {
    const dead = Object.keys(entry.modifiers ?? {}).filter(
      token => !converts.has(token)
    );
    expect(dead).toEqual([]);
  });
});

describe('wrappers', () => {
  it.each(Object.entries(WRAPPERS))(
    '<%s> with helper classes renders the same as bestax `%s`',
    tag => {
      for (const token of HELPER_TOKENS.keys()) {
        const both = renderBoth(factsFor(tag, [token, 'my-app-class']));
        if (!both) continue;
        expect({ token, html: both.converted }).toEqual({
          token,
          html: both.raw,
        });
      }
    }
  );

  it('leaves a wrapper tag with no helper class alone', () => {
    expect(plan(factsFor('p', ['my-app-class'])).conversion).toBeNull();
  });
});

describe("the table's claims about the library", () => {
  const targets = [
    ...mapped.map(([, entry]) => entry.target!),
    ...Object.values(WRAPPERS),
  ];

  it('names exactly the targets that forward refs', () => {
    const forwarding = targets.filter(target => {
      const component = target
        .split('.')
        .reduce<unknown>(
          (owner, key) => (owner as Record<string, unknown> | undefined)?.[key],
          bestax
        ) as { $$typeof?: symbol } | undefined;
      return component?.$$typeof === Symbol.for('react.forward_ref');
    });
    expect([...new Set(forwarding)].sort()).toEqual([...FORWARDS_REF].sort());
  });

  it('classifies every prop each target declares, and nothing else', () => {
    const declared = new Map<string, string[]>();
    const dir = path.join(repoRoot, 'bestax-mcp', 'data', 'components');
    for (const file of fs.readdirSync(dir)) {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      for (const part of data.parts ?? []) {
        declared.set(
          part.path,
          part.props
            .map((prop: { name: string }) => prop.name)
            .filter((name: string) => !['className', 'children'].includes(name))
        );
      }
    }
    const classified = new Map<string, string[]>([
      ...mapped.map(([, entry]): [string, string[]] => [
        entry.target!,
        [...(entry.ownProps ?? []), ...(entry.passThrough ?? [])],
      ]),
      ...Object.entries(WRAPPER_OWN_PROPS).map(
        ([target, props]): [string, string[]] => [target, [...props]]
      ),
    ]);
    for (const [target, props] of classified) {
      expect({ target, props: [...props].sort() }).toEqual({
        target,
        props: [...(declared.get(target) ?? ['<not in the MCP index>'])].sort(),
      });
    }
  });
});

describe('a seeded fuzz through the planner', () => {
  // mulberry32: small, seedable, and good enough to spread cases around.
  function rng(seed: number): () => number {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const random = rng(20260925);
  const pick = <T>(list: readonly T[]): T =>
    list[Math.floor(random() * list.length)];

  const helpers = [...HELPER_TOKENS.keys()];
  const attributePool: Array<[string, string | true]> = [
    ['id', 'x'],
    ['href', '/x'],
    ['disabled', true],
    ['type', 'button'],
    ['aria-label', 'Close'],
    ['data-test', 'y'],
    ['title', 'hint'],
    ['role', 'note'],
    ['target', '_blank'],
    ['rel', 'noopener'],
    ['download', true],
    ['value', '40'],
    // Numeric, but not spelled the way a number renders: these must refuse.
    ['value', '040'],
    ['max', '1.50'],
    ['formAction', '/submit'],
  ];

  it('never converts to different markup', () => {
    let conversions = 0;
    for (let i = 0; i < 4000; i += 1) {
      const [root, entry] = pick(mapped);
      const tag = pick(tagsFor(entry));
      const modifiers = Object.keys(entry.modifiers ?? {});
      const tokens = [root];
      const extra = Math.floor(random() * 5);
      for (let k = 0; k < extra; k += 1) {
        const bucket = random();
        tokens.push(
          bucket < 0.4 && modifiers.length > 0
            ? pick(modifiers)
            : bucket < 0.9
              ? pick(helpers)
              : pick(['my-app', 'is-selected', 'has-ratio'])
        );
      }
      const attributes: Record<string, string | true> = {
        ...(entry.defaults ?? {}),
      };
      while (random() < 0.35) {
        const [name, value] = pick(attributePool);
        attributes[name] = value;
      }
      const deduped = [...new Set(tokens)];
      const both = renderBoth(factsFor(tag, deduped, attributes), attributes);
      if (!both) continue;
      conversions += 1;
      expect({
        tag,
        tokens: deduped,
        attributes,
        html: both.converted,
      }).toEqual({ tag, tokens: deduped, attributes, html: both.raw });
    }
    // Most cases should convert; a planner that refuses everything passes
    // the equality check trivially.
    expect(conversions).toBeGreaterThan(2000);
  });
});
