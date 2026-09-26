/**
 * A rule id reaches opt-in telemetry, so none may carry an app's own class
 * names. `ruleId` drops any token outside the table's vocabulary; this pins
 * that, sweeps every refusal the planner can produce to show none of its ids
 * falls back (a fallback means a gap in the vocabulary), and holds the
 * transform's other rule ids to the fixed file-level ones.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HELPER_PROPS, ROOTS, type RootEntry } from '../class-map.js';
import { plan, type ChildFacts, type ElementFacts } from '../plan.js';
import { inVocabulary, KINDS, ruleId } from '../rules.js';

describe('ruleId', () => {
  it('builds an id from a known kind and a Bulma or bestax name', () => {
    expect(ruleId('family', 'card')).toBe('family:card');
    expect(ruleId('tag', 'Section')).toBe('tag:Section');
    expect(ruleId('attr', 'size')).toBe('attr:size');
    expect(ruleId('legacy', 'tile')).toBe('legacy:tile');
  });

  it("drops an app's own class name, keeping only the kind", () => {
    expect(ruleId('family', 'my-hero-banner')).toBe('family');
    expect(ruleId('dynamic-class', 'pricing-card')).toBe('dynamic-class');
    expect(ruleId('legacy', 'toString')).toBe('legacy');
  });

  it('refuses a kind it does not know', () => {
    expect(() => ruleId('whatever', 'card')).toThrow(/not a/);
  });
});

describe('every refusal the planner can produce', () => {
  function tagsFor(entry: RootEntry): string[] {
    if (entry.as === 'any') return [entry.tag!, 'a', 'span', 'div'];
    return [...new Set([entry.tag!, 'div', 'span', ...(entry.as ?? [])])];
  }

  function facts(
    tag: string,
    tokens: string[],
    attributes: Array<[string, string | true | null]>,
    extra: Partial<ElementFacts> = {}
  ): ElementFacts {
    return {
      tag,
      tokens,
      attributes: new Map(attributes),
      hasSpread: false,
      hasRef: false,
      hasChildren: true,
      ...extra,
    };
  }

  it('names a token from the vocabulary, never falling back to the kind', () => {
    const rules = new Set<string>();
    const messages = new Set<string>();
    const collect = (input: ElementFacts) => {
      for (const todo of plan(input).todos) {
        rules.add(todo.rule);
        messages.add(todo.message);
      }
    };
    const values: Array<string | true | null> = [true, 'x', '4', '040', null];
    for (const [root, entry] of Object.entries(ROOTS)) {
      collect(facts('div', [root], []));
      collect(facts('div', [root, 'box'], []));
      if (entry.status !== 'mapped') continue;
      const names = new Set([
        ...(entry.ownProps ?? []),
        ...(entry.passThrough ?? []),
        ...(entry.untypedAttrs ?? []),
        ...(entry.numberAttrs ?? []),
        ...Object.keys(entry.defaults ?? {}),
        ...Object.keys(entry.dropsAttr ?? {}),
        ...HELPER_PROPS,
      ]);
      for (const tag of tagsFor(entry)) {
        collect(facts(tag, [root], []));
        collect(facts(tag, [root], [], { hasSpread: true }));
        collect(facts(tag, [root], [['ref', null]], { hasRef: true }));
        collect(facts(tag, [root], [], { hasChildren: false }));
        collect(facts(tag, [root], [], { onlyChildOf: 'Link' }));
        collect(facts(tag, [root], [['dangerouslySetInnerHTML', null]]));
        for (const name of names) {
          for (const value of values) {
            collect(facts(tag, [root], [[name, value]]));
          }
        }
      }
      // The element inside, for a target that renders it itself.
      const spec = entry.absorbs;
      if (!spec) continue;
      const tag = entry.tag!;
      const around = (
        tokens: string[],
        attributes: Array<[string, string | true | null]>,
        child: Partial<ChildFacts> = {}
      ) =>
        facts(tag, tokens, attributes, {
          soleChild: {
            tag: spec.tag,
            attributes: new Map(),
            hasSpread: false,
            ...child,
          },
        });
      collect(around([root], [], { tag: 'span' }));
      collect(around([root], [], { hasSpread: true }));
      collect(around([root], [], { tokens: null }));
      collect(around([root], [], { tokens: ['box'] }));
      collect(around([root], [], { tokens: [] }));
      collect(around([root], [], { attributes: new Map([['key', 'k']]) }));
      for (const name of names) {
        for (const value of values) {
          collect(around([root], [[name, value]]));
          collect(around([root], [], { attributes: new Map([[name, value]]) }));
        }
      }
      for (const [name, token] of Object.entries(spec.pairs ?? {})) {
        collect(around([root, token], []));
        collect(around([root], [], { attributes: new Map([[name, true]]) }));
      }
      for (const [name, { to, beside }] of Object.entries(spec.renames ?? {})) {
        const token = spec.pairs![beside];
        for (const value of values) {
          collect(
            around([root, token], [], {
              attributes: new Map([
                [beside, true],
                [name, value],
              ]),
            })
          );
        }
        collect(
          around([root, token], [], {
            attributes: new Map([
              [beside, true],
              [name, '4'],
              [to, '4'],
            ]),
          })
        );
      }
    }
    for (const token of ['tile', 'toString', 'constructor', '__proto__']) {
      collect(facts('div', [token], []));
    }
    expect(rules.size).toBeGreaterThan(0);
    const bad = [...rules].filter(rule => {
      const [kind, token] = rule.split(':');
      return !KINDS.has(kind) || token === undefined || !inVocabulary(token);
    });
    expect(bad).toEqual([]);
    // The transform drops every element TODO in a non-React file, on the
    // grounds that each is advice about a bestax component it cannot use:
    // hold each to naming bestax or one of its components.
    expect(
      [...messages].filter(message => !/bestax|`[A-Z]/.test(message))
    ).toEqual([]);
  });
});

describe('the transform', () => {
  const source = fs.readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
      'transform.ts'
    ),
    'utf8'
  );

  it('names no rule by hand beyond the file-level ones', () => {
    const literal = [
      ...source.matchAll(
        /(?:addTodo\(\s*ctx,\s*[^,]+,|\bblock\()\s*'([^']+)'/g
      ),
    ].map(match => match[1]);
    expect([...new Set(literal)].sort()).toEqual([
      'imports',
      'jsx-runtime',
      'rsc',
      'styled-jsx',
    ]);
  });
});
