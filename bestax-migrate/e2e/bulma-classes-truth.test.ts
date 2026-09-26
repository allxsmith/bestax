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

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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
  createElement,
  normalizeHtml,
  renderElement,
} from './support/render-module.js';

const repoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

/**
 * Elements rendered with no children: the void ones, and `<textarea>`, whose
 * text React refuses beside a `value`.
 */
const VOID = new Set(['input', 'hr', 'img', 'br', 'textarea']);

const mapped = Object.entries(ROOTS).filter(
  ([, entry]) => entry.status === 'mapped'
) as Array<[string, RootEntry]>;

function tagsFor(entry: RootEntry): string[] {
  if (entry.as === 'any') return [entry.tag!, 'a', 'span', 'div', 'input'];
  return [...new Set([entry.tag!, ...(entry.as ?? [])])];
}

/** A child element as written and as converted, with the part it becomes. */
interface Child {
  target: string;
  raw: unknown;
  converted: unknown;
}

/**
 * The raw markup of a bestax part, and the part itself, holding a part of its
 * own when it too wraps its children (`Card.Header` around its title).
 */
function partChild(target: string): Child {
  const [root, entry] = mapped.find(([, found]) => found.target === target)!;
  const attributes = { ...(entry.defaults ?? {}) };
  const inner = childFor(entry);
  return {
    target,
    raw: createElement(
      entry.tag!,
      { className: root, ...attributes },
      inner ? inner.raw : 'x'
    ),
    converted: createElement(target, attributes, inner ? inner.converted : 'x'),
  };
}

/** For a root that wraps its children unless one is a part: its first part. */
function childFor(entry: RootEntry): Child | undefined {
  return entry.wrapsChildren
    ? partChild(entry.wrapsChildren.unless[0])
    : undefined;
}

/**
 * Render the raw element and, when the planner converts it, the bestax one.
 * Returns null when the planner leaves the element alone.
 */
function renderBoth(
  facts: ElementFacts,
  extra: Record<string, string | true> = {},
  child?: Child
): { raw: string; converted: string } | null {
  const result = plan(facts);
  if (!result.conversion) return null;
  const children = VOID.has(facts.tag) ? undefined : 'x';
  const raw = renderElement(
    facts.tag,
    { className: facts.tokens.join(' '), ...extra },
    child ? child.raw : children
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
    child ? child.converted : children
  );
  return { raw: normalizeHtml(raw), converted: normalizeHtml(converted) };
}

function factsFor(
  tag: string,
  tokens: string[],
  attributes: Record<string, string | true> = {},
  child?: Child
): ElementFacts {
  return {
    tag,
    tokens,
    attributes: new Map(Object.entries(attributes)),
    hasSpread: false,
    hasRef: false,
    hasChildren: !VOID.has(tag),
    childTargets: child ? [child.target] : [],
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
  const child = childFor(entry);
  const converts = new Set<string>();

  it.each(tagsFor(entry))('renders the same on a <%s>', tag => {
    const candidates = [
      [root],
      ...Object.keys(entry.modifiers ?? {}).map(token => [root, token]),
      ...[...HELPER_TOKENS.keys()].map(token => [root, token]),
    ];
    for (const tokens of candidates) {
      const facts = factsFor(tag, tokens, defaults, child);
      const both = renderBoth(facts, defaults, child);
      if (!both) continue;
      expect({ tokens, tag, html: both.converted }).toEqual({
        tokens,
        tag,
        html: both.raw,
      });
      // Only a token that left `className` counts as converted.
      const kept = plan(facts).conversion!.className?.split(' ') ?? [];
      for (const token of tokens)
        if (!kept.includes(token)) converts.add(token);
    }
    // No row is dead: the root itself converts on its own tag.
    if (tag === entry.tag) expect(converts.has(root)).toBe(true);
  });

  it('has no dead modifiers', () => {
    const dead = Object.keys(entry.modifiers ?? {}).filter(
      token => !converts.has(token)
    );
    expect(dead).toEqual([]);
  });

  if (entry.wrapsChildren) {
    const { unless, whenEmpty, when } = entry.wrapsChildren;
    // The classes that switch the wrapping on (`Field` wraps when horizontal).
    const wrapping = [root, ...(when ? [when] : [])];

    it.each(unless)('renders the same around a %s', part => {
      const inside = partChild(part);
      const both = renderBoth(
        factsFor(entry.tag!, wrapping, defaults, inside),
        defaults,
        inside
      );
      expect(both).not.toBeNull();
      expect(both!.converted).toEqual(both!.raw);
    });

    it(`${whenEmpty ? 'refuses' : 'converts'} with no children`, () => {
      const facts = { ...factsFor(entry.tag!, wrapping), hasChildren: false };
      const result = plan(facts);
      expect(result.conversion === null).toBe(Boolean(whenEmpty));
      if (whenEmpty) return;
      expect(normalizeHtml(renderElement(entry.target!, {}))).toEqual(
        normalizeHtml(renderElement(entry.tag!, { className: root }))
      );
    });

    if (when) {
      it(`wraps only with \`${when}\``, () => {
        const facts = factsFor(entry.tag!, [root]);
        expect(plan(facts).conversion?.target).toBe(entry.target);
        expect(plan(factsFor(entry.tag!, wrapping)).conversion).toBeNull();
      });
    }
  }
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
    // A public component with no API page of its own (`InputBase`) is not in
    // the index, so read its props the way the index would.
    const unindexed = [...classified.keys()].filter(
      target => !declared.has(target)
    );
    if (unindexed.length > 0) {
      const extractor = pathToFileURL(
        path.join(repoRoot, 'scripts', 'lib', 'props-extract.mjs')
      ).href;
      const script = `
        const { extractComponent } = await import(${JSON.stringify(extractor)});
        const out = {};
        for (const name of ${JSON.stringify(unindexed)}) {
          for (const table of extractComponent(name, { markdown: false }).tables) {
            out[table.path] = table.rows.map(row => row.name);
          }
        }
        console.log(JSON.stringify(out));`;
      const extracted: Record<string, string[]> = JSON.parse(
        execFileSync(process.execPath, ['--input-type=module', '-e', script], {
          encoding: 'utf8',
        })
      );
      for (const [target, props] of Object.entries(extracted)) {
        declared.set(
          target,
          props.filter(name => !['className', 'children'].includes(name))
        );
      }
    }
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
      const child = childFor(entry);
      const both = renderBoth(
        factsFor(tag, deduped, attributes, child),
        attributes,
        child
      );
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
