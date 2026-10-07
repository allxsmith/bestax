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
  numberAttrsOf,
  PLACED,
  ROOTS,
  WRAPPERS,
  WRAPPER_OWN_PROPS,
  type RootEntry,
} from '../src/sources/bulma-classes/class-map.js';
import {
  plan,
  type BuiltIcon,
  type ChildFacts,
  type ElementFacts,
} from '../src/sources/bulma-classes/plan.js';
import {
  fileChildren,
  fileProps,
  rawFrom,
  type FileTree,
} from './support/file-tree.js';
import {
  GLYPHS,
  iconChild,
  iconProps,
  textChild,
  type Attributes,
} from './support/icon-text.js';
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
  if (entry.as === 'any') {
    return [...new Set([entry.tag!, 'a', 'span', 'div', 'input', 'button'])];
  }
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
  const attributes = defaultsFor(entry, entry.tag!);
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
 * A child of an element whose target builds its icons from props, as
 * written: a `.icon` around its `<i>`, or a bare `<span>` of text.
 */
function rawChild(child: ChildFacts): unknown {
  return createElement(
    child.tag,
    {
      ...(child.tokens ? { className: child.tokens.join(' ') } : {}),
      ...Object.fromEntries(child.attributes),
    },
    child.soleChild
      ? createElement('i', { className: child.soleChild.tokens!.join(' ') })
      : child.text
  );
}

/**
 * The props that give a target the icons it builds: one icon's, or several
 * as `items`, each with its text.
 */
function builtProps(
  icons: BuiltIcon[],
  children: readonly ChildFacts[]
): Record<string, unknown> {
  const built = icons.map(icon => iconProps(icon, children[icon.index]));
  return icons.length === 1
    ? { iconProps: built[0] }
    : {
        items: icons.map((icon, index) => ({
          iconProps: built[index],
          ...(icon.text !== undefined && { text: icon.text }),
        })),
      };
}

/**
 * Render the raw element and, when the planner converts it, the bestax one.
 * Returns null when the planner leaves the element alone. An element whose
 * only child the target renders itself is rendered around that child, and
 * the target is given the child's attributes as the codemod writes them.
 */
function renderBoth(
  facts: ElementFacts,
  extra: Record<string, string | true> = {},
  child?: Child,
  when: Record<string, unknown> = {}
): { raw: string; converted: string } | null {
  const result = plan(facts);
  if (!result.conversion) return null;
  // A joiner adds each conditional class when its condition (`when`) is
  // truthy; a flag it became takes that condition as its value, and the rest
  // stay in the call.
  const flags = result.conversion.conditional ?? [];
  const added = (facts.conditional ?? []).filter(part => when[part.join(' ')]);
  const stays = added.filter(
    part => !flags.some(([, token]) => part.length === 1 && part[0] === token)
  );
  const children = VOID.has(facts.tag) ? undefined : 'x';
  const sole = facts.soleChild;
  const soleChildren = sole && !VOID.has(sole.tag) ? 'x' : undefined;
  const soleAttributes = Object.fromEntries(sole?.attributes ?? []) as Record<
    string,
    string | true
  >;
  // A target that renders the element's children itself: they are the
  // bare elements it counted, or the text it renders, and the component is
  // given none.
  const counted = result.conversion.rendersChildren
    ? (facts.childElements?.map(element => createElement(element.tag, null)) ??
      facts.text)
    : undefined;
  const soleElement =
    sole &&
    createElement(
      sole.tag,
      {
        // An empty className renders `class=""`, and a computed one some class.
        ...(sole.tokens?.length
          ? { className: sole.tokens.join(' ') }
          : sole.tokens === null
            ? { className: 'computed' }
            : sole.tokens
              ? { className: '' }
              : {}),
        ...soleAttributes,
      },
      soleChildren
    );
  const rawProps = {
    className: [...facts.tokens, ...added.flat()].join(' '),
    ...extra,
  };
  // A target that builds its icons from props: the children as written, and
  // the component given them as props, with one icon's text as its own.
  const icons = result.conversion.icons;
  // A target that renders the whole tree from props: the tree as written,
  // inside a `.field`, against the component inside a `Field`.
  const file = result.conversion.file;
  const rawChildren = icons
    ? facts.childElements!.map(rawChild)
    : file
      ? facts.childElements!.map(rawFrom)
      : (counted ?? soleElement ?? (child ? child.raw : children));
  // A target that renders the element around this one too is compared with
  // the raw element inside that one.
  const raw = result.conversion.replacesParent
    ? renderElement(
        facts.soleChildOf!.tag,
        null,
        createElement(facts.tag, rawProps, rawChildren)
      )
    : file
      ? renderElement(
          'div',
          { className: 'field' },
          createElement(facts.tag, rawProps, rawChildren)
        )
      : renderElement(facts.tag, rawProps, rawChildren);
  const { target, props, className, drop, numbers, absorbs } =
    result.conversion;
  const given = { ...extra };
  for (const [name, value] of Object.entries(absorbs ? soleAttributes : {})) {
    if (absorbs!.drop.includes(name)) continue;
    const renamed = absorbs!.renames.find(([from]) => from === name);
    given[renamed ? renamed[1] : name] = value;
  }
  const kept = Object.fromEntries(
    Object.entries(given)
      .filter(([name]) => !drop.includes(name))
      .map(([name, value]) => [
        name,
        numbers.includes(name) ? Number(value) : value,
      ])
  );
  const convertedProps = {
    ...kept,
    ...Object.fromEntries(
      [...props, ...(absorbs?.props ?? [])].map(([name, value]) => [
        name,
        numbers.includes(name) ? Number(value) : value,
      ])
    ),
    ...Object.fromEntries(flags.map(([prop, token]) => [prop, when[token]])),
    ...(className || stays.length > 0
      ? { className: [className ?? '', ...stays.flat()].join(' ').trim() }
      : {}),
    ...(icons && builtProps(icons, facts.childElements!)),
    ...(file && fileProps(file, facts.childElements!, numbers)),
  };
  // A target that couldn't absorb the child renders it as given.
  const convertedChildren = icons
    ? icons.length === 1
      ? icons[0].text
      : undefined
    : counted || file
      ? undefined
      : sole
        ? absorbs
          ? soleChildren
          : soleElement
        : child
          ? child.converted
          : children;
  const converted = file
    ? renderElement(
        'Field',
        {},
        createElement(target, convertedProps, convertedChildren)
      )
    : renderElement(target, convertedProps, convertedChildren);
  return { raw: normalizeHtml(raw), converted: normalizeHtml(converted) };
}

/**
 * The attributes an element needs to convert on this tag: its root's
 * defaults, and the value the target writes there when none is given.
 */
function defaultsFor(entry: RootEntry, tag: string): Record<string, string> {
  return {
    ...(entry.defaults ?? {}),
    ...Object.fromEntries(
      Object.entries(entry.writesAttr ?? {})
        .filter(([, rule]) => rule.on.includes(tag))
        .map(([name, rule]) => [name, rule.fallback])
    ),
  };
}

/** A bare, empty child element, as the planner reads one. */
function bare(tag: string): ChildFacts {
  return { tag, attributes: new Map(), hasSpread: false, isEmpty: true };
}

/**
 * An element's facts. One whose root's target renders its only child itself
 * holds that child, bare but for the attributes the element's classes need
 * beside them (`multiple` inside `.select.is-multiple`). One whose target
 * renders its children from a count holds a few of the children it counts.
 */
function factsFor(
  tag: string,
  tokens: string[],
  attributes: Record<string, string | true> = {},
  child?: Child
): ElementFacts {
  const entries = tokens
    .map(token => (Object.hasOwn(ROOTS, token) ? ROOTS[token] : undefined))
    .filter(entry => entry?.status === 'mapped');
  const absorbs = entries.find(entry => entry?.absorbs)?.absorbs;
  const counts = entries.find(entry => entry?.countsChildren)?.countsChildren;
  return {
    tag,
    tokens,
    attributes: new Map(Object.entries(attributes)),
    hasSpread: false,
    hasRef: false,
    hasChildren: !VOID.has(tag),
    childTargets: child ? [child.target] : [],
    ...(absorbs && {
      soleChild: {
        ...bare(absorbs.tag),
        attributes: new Map(
          Object.entries(absorbs.pairs ?? {})
            .filter(([, token]) => tokens.includes(token))
            .map(([name]) => [name, true])
        ),
      },
    }),
    ...(counts && {
      childElements: [bare(counts.tag), bare(counts.tag), bare(counts.tag)],
    }),
    // One that builds its icons from props holds an icon and its text.
    ...(entries.some(entry => entry?.buildsIcons) && {
      childElements: [iconChild(['fas', 'fa-home']), textChild()],
    }),
    // One that renders the whole `.file` tree holds that tree, inside a
    // `.field`.
    ...(entries.some(entry => entry?.buildsFile) && {
      childElements: fileChildren({ iconLeft: ['fas', 'fa-upload'] }),
      classesAround: ['field'],
    }),
    // One that needs element children holds one (`Icon` around an <i>).
    ...(!absorbs &&
      entries.some(entry => entry?.needsElementChildren) && {
        soleChild: bare('i'),
      }),
    // One whose target renders the element around it sits in a bare one, and
    // one whose target renders its text holds that text.
    ...(entries.find(entry => entry?.parent) && {
      soleChildOf: {
        ...bare(entries.find(entry => entry?.parent)!.parent!.tag),
        isEmpty: false,
      },
    }),
    ...(entries.find(entry => entry?.rendersText !== undefined) && {
      text: entries.find(entry => entry?.rendersText !== undefined)!
        .rendersText,
    }),
  };
}

/** The attributes each modifier among `tokens` needs beside it to convert. */
function neededFor(entry: RootEntry, tokens: string[]): Record<string, string> {
  return Object.fromEntries(
    tokens.flatMap(token => {
      const needs = Object.hasOwn(entry.modifiers ?? {}, token)
        ? entry.modifiers![token].needsAttr
        : undefined;
      return needs ? [[needs.name, needs.value]] : [];
    })
  );
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
      // A class left out on purpose stays in `className`, beside the rest.
      ...Object.keys(entry.omits ?? {}).map(token => [root, token]),
      ...[...HELPER_TOKENS.keys()].map(token => [root, token]),
    ];
    const onTag = defaultsFor(entry, tag);
    const omitted = new Set<string>();
    for (const tokens of candidates) {
      const given = { ...onTag, ...neededFor(entry, tokens) };
      const facts = factsFor(tag, tokens, given, child);
      const both = renderBoth(facts, given, child);
      if (!both) continue;
      if (Object.hasOwn(entry.omits ?? {}, tokens[1])) omitted.add(tokens[1]);
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
    // No row is dead: the root itself converts on its own tag, and so does
    // it beside each class it omits, which stays in `className`.
    if (tag === entry.tag) {
      expect(converts.has(root)).toBe(true);
      expect([...omitted].sort()).toEqual(
        Object.keys(entry.omits ?? {}).sort()
      );
    }
  });

  it('has no dead modifiers', () => {
    const dead = Object.keys(entry.modifiers ?? {}).filter(
      token => !converts.has(token)
    );
    expect(dead).toEqual([]);
  });

  if (entry.helpersLeftOut) {
    it('leaves out only helper props its target would not render as the helper', () => {
      const onTag = defaultsFor(entry, entry.tag!);
      const inside = child ? child.converted : 'x';
      for (const [prop, why] of Object.entries(entry.helpersLeftOut!)) {
        // The row names a helper prop, and says why.
        const helpers = [...HELPER_TOKENS].filter(
          ([, helper]) => helper.write.prop === prop
        );
        expect({ prop, helpers: helpers.length > 0, why: why !== '' }).toEqual({
          prop,
          helpers: true,
          why: true,
        });
        for (const [token, helper] of helpers) {
          // Each class that prop renders stays a class here...
          const facts = factsFor(entry.tag!, [root, token], onTag, child);
          expect({
            token,
            kept: plan(facts).conversion?.className?.split(' ') ?? [],
          }).toEqual({ token, kept: expect.arrayContaining([token]) });
          // ...because the target, given the prop, renders something else. A
          // target that renders the class from it makes the row dead.
          const given = normalizeHtml(
            renderElement(
              entry.target!,
              { ...onTag, [prop]: helper.write.value ?? true },
              inside
            )
          );
          const asClass = normalizeHtml(
            renderElement(entry.target!, { ...onTag, className: token }, inside)
          );
          expect({ token, same: given === asClass }).toEqual({
            token,
            same: false,
          });
        }
      }
    });
  }

  if (entry.defaults) {
    it('renders the same with each default given another value', () => {
      // A default is written only when none is given, so a given one renders
      // as given; the sweep above gives each only its default value. One the
      // props type rejects converts only at its default, so it stays out.
      const typed = Object.keys(entry.defaults!).filter(
        name => !entry.untypedAttrs?.includes(name)
      );
      for (const name of typed) {
        // One the target types as a number gets another number.
        const other = numberAttrsOf(entry).includes(name) ? '-1' : 'other';
        const given = { ...defaultsFor(entry, entry.tag!), [name]: other };
        const both = renderBoth(
          factsFor(entry.tag!, [root], given, child),
          given,
          child
        );
        expect({ name, converts: both !== null }).toEqual({
          name,
          converts: true,
        });
        expect({ name, html: both!.converted }).toEqual({
          name,
          html: both!.raw,
        });
      }
    });
  }

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

const folds = Object.entries(ROOTS).filter(
  ([, entry]) => entry.status === 'fold'
) as Array<[string, RootEntry]>;

describe.each(folds)(
  '`.%s` folds into the component inside it',
  (root, entry) => {
    const [innerRoot, innerEntry] = mapped.find(
      ([, found]) => found.target === entry.target
    )!;
    const around = (tokens: string[], attributes = {}) => ({
      ...factsFor(entry.tag!, tokens, attributes),
      soleChildTarget: entry.target,
    });

    it('renders the same as the component with its props, bare and with each modifier', () => {
      const candidates = [
        [root],
        ...Object.keys(entry.modifiers ?? {}).map(token => [root, token]),
      ];
      for (const tokens of candidates) {
        const fold = plan(around(tokens)).fold;
        expect({ tokens, folds: fold !== undefined }).toEqual({
          tokens,
          folds: true,
        });
        const raw = renderElement(
          entry.tag!,
          { className: tokens.join(' ') },
          createElement(innerEntry.tag!, { className: innerRoot }, 'x')
        );
        const converted = renderElement(
          fold!.target,
          Object.fromEntries(
            fold!.props.map(([name, value]) => [
              name,
              fold!.numbers.includes(name) ? Number(value) : value,
            ])
          ),
          'x'
        );
        expect({ tokens, html: normalizeHtml(converted) }).toEqual({
          tokens,
          html: normalizeHtml(raw),
        });
      }
    });

    it('stays markup around anything else, or with anything of its own', () => {
      expect(
        plan({ ...factsFor(entry.tag!, [root]), soleChildTarget: undefined })
          .fold
      ).toBeUndefined();
      expect(plan(around([root], { id: 'x' })).fold).toBeUndefined();
      expect(plan(around([root, 'my-app'])).fold).toBeUndefined();
      expect(plan(around([root, 'mt-2'])).fold).toBeUndefined();
    });
  }
);

const writing = mapped.filter(([, entry]) => entry.writesAttr);

describe.each(writing)(
  '`.%s` with an attribute its target writes',
  (root, entry) => {
    it('renders the same with each value the target keeps, and stays markup otherwise', () => {
      for (const [name, rule] of Object.entries(entry.writesAttr!)) {
        for (const tag of rule.on) {
          const onTag = defaultsFor(entry, tag);
          for (const value of rule.keeps) {
            const given = { ...onTag, [name]: value };
            const both = renderBoth(factsFor(tag, [root], given), given);
            expect({ tag, value, converts: both !== null }).toEqual({
              tag,
              value,
              converts: true,
            });
            expect({ tag, value, html: both!.converted }).toEqual({
              tag,
              value,
              html: both!.raw,
            });
          }
          const without = Object.fromEntries(
            Object.entries(onTag).filter(([key]) => key !== name)
          );
          const rules = (attributes: Record<string, string | true | null>) =>
            plan({
              ...factsFor(tag, [root]),
              attributes: new Map(Object.entries(attributes)),
            }).todos.map(todo => todo.rule);
          expect(rules(without)).toContain(`defaults:${entry.target}`);
          expect(rules({ ...without, [name]: 'text/html' })).toContain(
            `attr:${name}`
          );
          expect(rules({ ...without, [name]: null })).toContain(`attr:${name}`);
        }
      }
    });

    it('names only tags its target reaches, and writes nothing on the rest', () => {
      for (const [name, rule] of Object.entries(entry.writesAttr!)) {
        // A tag outside `as` would get a `defaults` TODO for a tag it can't
        // render, instead of the `tag` one.
        for (const tag of rule.on) expect(tagsFor(entry)).toContain(tag);
        // Elsewhere the attribute reaches the DOM as written, whatever it says.
        for (const tag of tagsFor(entry).filter(t => !rule.on.includes(t))) {
          const given = { ...defaultsFor(entry, tag), [name]: 'text/html' };
          const both = renderBoth(factsFor(tag, [root], given), given);
          expect({ tag, converts: both !== null }).toEqual({
            tag,
            converts: true,
          });
          expect({ tag, html: both!.converted }).toEqual({
            tag,
            html: both!.raw,
          });
        }
      }
    });
  }
);

const absorbing = mapped.filter(([, entry]) => entry.absorbs);

describe.each(absorbing)(
  '`.%s` converts with the element inside it',
  (root, entry) => {
    const spec = entry.absorbs!;
    const defaults = { ...(entry.defaults ?? {}) };
    /** The element around a child with these classes and attributes. */
    const around = (
      tokens: string[],
      childTokens: string[] | null | undefined,
      childAttributes: Record<string, string | number | true | null>,
      attributes: Record<string, string | true> = defaults
    ): ElementFacts => ({
      ...factsFor(entry.tag!, [root, ...tokens], attributes),
      soleChild: {
        ...bare(spec.tag),
        tokens: childTokens,
        attributes: new Map(Object.entries(childAttributes)),
      },
    });
    const same = (facts: ElementFacts, label: string) => {
      const both = renderBoth(facts, Object.fromEntries(facts.attributes));
      expect({ label, converts: both !== null }).toEqual({
        label,
        converts: true,
      });
      expect({ label, html: both!.converted }).toEqual({
        label,
        html: both!.raw,
      });
    };

    it('renders the same with each class the child may carry', () => {
      for (const token of Object.keys(spec.modifiers ?? {})) {
        same(around([], [token], {}), token);
      }
      const all = Object.keys(spec.modifiers ?? {});
      same(around([], all.length > 0 ? all : undefined, {}), 'all of them');
    });

    if (spec.childProps) {
      it('takes as props only what its own props declare', () => {
        // They move onto the component without passing the attribute checks
        // an element's own attributes do, so each has to be one of its props.
        expect(entry.ownProps).toEqual(
          expect.arrayContaining(spec.childProps!)
        );
      });

      it("renders the same with the child's props on the component", () => {
        const given = Object.fromEntries(
          spec.childProps!.map(name => [name, `${name}-value`])
        );
        for (const [name, value] of Object.entries(given)) {
          same(around([], undefined, { [name]: value }), name);
        }
        same(around([], undefined, given), 'all of them');
      });
    }

    if (spec.attributesOn === 'child') {
      it("renders the same with the child's attributes on the component", () => {
        const pool: Record<string, string | true> = {
          id: 'x',
          name: 'pick',
          disabled: true,
          required: true,
          title: 'hint',
          'aria-label': 'Pick one',
          'data-test': 'y',
          form: 'f',
          tabIndex: '0',
        };
        for (const [name, value] of Object.entries(pool)) {
          same(around([], undefined, { [name]: value }), name);
        }
        same(around([], undefined, pool), 'all of them');
      });

      it('renders the same with each pair, and each rename beside it', () => {
        for (const [name, token] of Object.entries(spec.pairs ?? {})) {
          same(around([token], undefined, { [name]: true }), name);
        }
        for (const [name, { beside }] of Object.entries(spec.renames ?? {})) {
          const token = spec.pairs![beside];
          same(
            around([token], undefined, { [beside]: true, [name]: '4' }),
            name
          );
          same(
            around([token], undefined, { [beside]: true, [name]: 4 }),
            `${name} as a number literal`
          );
        }
      });
    }

    it('stays markup around anything else, or with anything it would lose', () => {
      const refusals: Array<[string, ElementFacts]> = [
        ['no child', { ...around([], undefined, {}), soleChild: undefined }],
        [
          'another tag',
          {
            ...around([], undefined, {}),
            soleChild: { ...around([], undefined, {}).soleChild!, tag: 'span' },
          },
        ],
        ['another class on the child', around([], ['my-app'], {})],
        ['an empty class on the child', around([], [], {})],
        ['a computed class on the child', around([], null, {})],
        [
          'a spread on the child',
          {
            ...around([], undefined, {}),
            soleChild: {
              ...around([], undefined, {}).soleChild!,
              hasSpread: true,
            },
          },
        ],
      ];
      if (spec.attributesOn === 'element') {
        refusals.push([
          'an attribute on the child',
          around([], undefined, { id: 'x' }),
        ]);
      } else {
        refusals.push(
          [
            'an attribute on the element',
            around([], undefined, {}, { id: 'x' }),
          ],
          ['a key on the child', around([], undefined, { key: 'k' })]
        );
        for (const [name, token] of Object.entries(spec.pairs ?? {})) {
          refusals.push(
            [
              `\`${token}\` without \`${name}\``,
              around([token], undefined, {}),
            ],
            [
              `\`${name}\` without \`${token}\``,
              around([], undefined, { [name]: true }),
            ],
            [
              `a \`${name}\` that is not bare`,
              around([token], undefined, { [name]: 'x' }),
            ]
          );
        }
        for (const [name, { beside }] of Object.entries(spec.renames ?? {})) {
          const token = spec.pairs![beside];
          refusals.push(
            [
              `\`${name}\` without \`${beside}\``,
              around([], undefined, { [name]: '4' }),
            ],
            [
              `a bare \`${name}\``,
              around([token], undefined, { [beside]: true, [name]: true }),
            ],
            [
              `a \`${name}\` the codemod cannot read as a number`,
              around([token], undefined, { [beside]: true, [name]: null }),
            ]
          );
        }
      }
      for (const [label, facts] of refusals) {
        // Around a written-out HTML element, that is. Anything else (no
        // element, text, an expression) could leave it with no children.
        if (spec.elseWraps && facts.soleChild) {
          // The target renders the child as given instead of absorbing it,
          // so the element converts around it.
          const both = renderBoth(facts, Object.fromEntries(facts.attributes));
          expect({
            label,
            converts: both !== null,
            absorbs: plan(facts).conversion?.absorbs ?? null,
          }).toEqual({ label, converts: true, absorbs: null });
          expect({ label, html: both!.converted }).toEqual({
            label,
            html: both!.raw,
          });
          continue;
        }
        expect({ label, conversion: plan(facts).conversion }).toEqual({
          label,
          conversion: null,
        });
      }
      if (spec.elseWraps) {
        // With nothing inside, the target would render the child itself.
        const empty = {
          ...around([], undefined, {}),
          soleChild: undefined,
          hasChildren: false,
        };
        expect(plan(empty).conversion).toBeNull();
        // Nor around children that aren't elements written out: an
        // expression can be falsy, and then the target renders its own child.
        const expression = {
          ...around([], undefined, {}),
          soleChild: undefined,
        };
        expect(plan(expression).conversion).toBeNull();
      }
    });

    it('takes no class on the child that would convert it by itself', () => {
      for (const token of Object.keys(spec.modifiers ?? {})) {
        expect(plan(factsFor(spec.tag, [token])).conversion).toBeNull();
      }
    });
  }
);

/**
 * What a condition can be at runtime. A joiner adds the class for any truthy
 * one, so the prop has to render it for exactly those too: a component that
 * rendered `{isX && …}` would print the `0`.
 */
const CONDITIONS: readonly unknown[] = [
  true,
  false,
  undefined,
  null,
  0,
  '',
  1,
  'yes',
];

describe.each(mapped)('`.%s` with a class a condition adds', (root, entry) => {
  const defaults = { ...(entry.defaults ?? {}) };
  const child = childFor(entry);

  it('renders each of its flags exactly when the condition is truthy, on every tag', () => {
    const differ: string[] = [];
    const flagged = new Set<string>();
    for (const tag of tagsFor(entry)) {
      for (const token of Object.keys(entry.modifiers ?? {})) {
        // Beside the attribute its prop also renders, when it needs one.
        const onTag = {
          ...defaultsFor(entry, tag),
          ...neededFor(entry, [token]),
        };
        const facts: ElementFacts = {
          ...factsFor(tag, [root], onTag, child),
          conditional: [[token]],
        };
        const conversion = plan(facts).conversion;
        if (!conversion) continue;
        if (conversion.conditional?.length) flagged.add(token);
        for (const value of CONDITIONS) {
          const both = renderBoth(facts, onTag, child, { [token]: value });
          if (both!.converted !== both!.raw) {
            differ.push(
              `<${tag}> ${token} = ${JSON.stringify(value)}: ${both!.converted}`
            );
          }
        }
      }
    }
    expect(differ).toEqual([]);
    // A flag that needs an attribute beside it is one of those rendered.
    const needing = Object.entries(entry.modifiers ?? {})
      .filter(([, modifier]) => modifier.needsAttr)
      .map(([token]) => token);
    expect(needing.filter(token => !flagged.has(token))).toEqual([]);
  });

  it('renders a flag the same beside each other modifier, fixed or conditional', () => {
    const differ: string[] = [];
    const modifiers = Object.keys(entry.modifiers ?? {});
    const flags = modifiers.filter(
      token =>
        plan({
          ...factsFor(entry.tag!, [root], defaults, child),
          conditional: [[token]],
        }).conversion?.conditional?.length
    );
    for (const flag of flags) {
      for (const other of modifiers) {
        if (other === flag) continue;
        const cases: Array<[ElementFacts, Array<Record<string, boolean>>]> = [
          [
            {
              ...factsFor(entry.tag!, [root, other], defaults, child),
              conditional: [[flag]],
            },
            [{ [flag]: true }, { [flag]: false }],
          ],
          [
            {
              ...factsFor(entry.tag!, [root], defaults, child),
              conditional: [[flag], [other]],
            },
            [true, false].flatMap(a =>
              [true, false].map(b => ({ [flag]: a, [other]: b }))
            ),
          ],
        ];
        for (const [facts, whens] of cases) {
          for (const when of whens) {
            const both = renderBoth(facts, defaults, child, when);
            if (both && both.converted !== both.raw) {
              differ.push(`${JSON.stringify(when)}: ${both.converted}`);
            }
          }
        }
      }
    }
    expect(differ).toEqual([]);
  });

  it('keeps a condition on anything else in the call, and renders the same', () => {
    for (const token of [...HELPER_TOKENS.keys()].slice(0, 40)) {
      const facts: ElementFacts = {
        ...factsFor(entry.tag!, [root], defaults, child),
        conditional: [[token], ['my-app', token]],
      };
      for (const value of [true, false]) {
        const both = renderBoth(facts, defaults, child, {
          [token]: value,
          [`my-app ${token}`]: value,
        });
        if (!both) continue;
        expect({ token, value, html: both.converted }).toEqual({
          token,
          value,
          html: both.raw,
        });
      }
    }
  });
});

const counting = mapped.filter(([, entry]) => entry.countsChildren);

describe.each(counting)(
  '`.%s` renders its children from a count',
  (root, entry) => {
    const { tag } = entry.countsChildren!;
    const holding = (children: ChildFacts[] | undefined): ElementFacts => ({
      ...factsFor(entry.tag!, [root]),
      childElements: children,
    });

    it('renders the same for each count, from none up', () => {
      for (let count = 0; count <= 5; count += 1) {
        const both = renderBoth(
          holding(Array.from({ length: count }, () => bare(tag)))
        );
        expect({ count, converts: both !== null }).toEqual({
          count,
          converts: true,
        });
        expect({ count, html: both!.converted }).toEqual({
          count,
          html: both!.raw,
        });
      }
    });

    it('stays markup around anything but those bare, empty elements', () => {
      const refusals: Array<[string, ChildFacts[] | undefined]> = [
        ['text or an expression beside them', undefined],
        ['another tag', [bare(tag), bare('span')]],
        ['a class on one', [{ ...bare(tag), tokens: ['is-wide'] }]],
        ['an empty class on one', [{ ...bare(tag), tokens: [] }]],
        ['a computed class on one', [{ ...bare(tag), tokens: null }]],
        [
          'an attribute on one',
          [{ ...bare(tag), attributes: new Map([['id', 'x']]) }],
        ],
        ['a spread on one', [{ ...bare(tag), hasSpread: true }]],
        ['something inside one', [{ ...bare(tag), isEmpty: false }]],
      ];
      for (const [label, children] of refusals) {
        expect({
          label,
          conversion: plan(holding(children)).conversion,
        }).toEqual({ label, conversion: null });
      }
    });
  }
);

/**
 * An element whose target builds its icons from props, around each glyph
 * it reads, each class and attribute an icon may carry, and each shape of
 * children it converts: the markup and the component given what it builds
 * render the same.
 */
describe.each(mapped.filter(([, entry]) => entry.buildsIcons))(
  'the icons `.%s` builds',
  (root, entry) => {
    const same = (
      label: string,
      children: ChildFacts[],
      tokens: string[] = [],
      attributes: Attributes = {}
    ) => {
      const facts: ElementFacts = {
        ...factsFor(entry.tag!, [root, ...tokens], attributes),
        childElements: children,
      };
      const found = renderBoth(facts, attributes);
      expect({ label, converts: found !== null }).toEqual({
        label,
        converts: true,
      });
      expect({ label, html: found!.converted }).toEqual({
        label,
        html: found!.raw,
      });
    };

    it('renders each glyph the same, with a text and without', () => {
      for (const glyph of GLYPHS) {
        same(glyph.join(' '), [iconChild(glyph)]);
        same(`${glyph.join(' ')} and a text`, [iconChild(glyph), textChild()]);
      }
    });

    it("renders an icon's own classes and attributes the same", () => {
      for (const token of [
        'is-small',
        'is-medium',
        'is-large',
        'has-text-info',
        'mt-2',
        'my-icon',
      ]) {
        same(token, [iconChild(['fas', 'fa-home'], [token]), textChild()]);
      }
      for (const [name, value] of Object.entries({
        id: 'x',
        title: 'hint',
        role: 'img',
        tabIndex: '0',
        'aria-describedby': 'y',
      })) {
        same(name, [
          iconChild(['fas', 'fa-home'], [], {
            'aria-hidden': 'true',
            [name]: value,
          }),
        ]);
      }
      // A named icon is an image, as `Icon` renders one, and an empty name
      // is none.
      for (const [label, attributes] of Object.entries({
        'a name': { 'aria-label': 'x', role: 'img' },
        'a name by reference': { 'aria-labelledby': 'x', role: 'img' },
        'an empty name': { 'aria-label': '', 'aria-hidden': 'true' },
      })) {
        same(label, [iconChild(['fas', 'fa-home'], [], attributes)]);
      }
    });

    it('renders several icons, each with at most one text, the same', () => {
      const home = iconChild(['fas', 'fa-home']);
      const bell = iconChild(['far', 'fa-bell']);
      same('two with texts', [home, textChild('a'), bell, textChild('b')]);
      same('two, the first bare', [home, bell, textChild('b')]);
      same('two, the last bare', [home, textChild('a'), bell]);
      same(
        'with its own classes and attributes',
        [home, bell],
        ['has-text-success', 'mb-2'],
        {
          id: 'x',
          title: 'hint',
        }
      );
    });
  }
);

/**
 * An element whose target renders its whole tree from props, around each
 * shape of tree it reads, inside a `.field`: the markup and the component
 * given what it builds, inside a `Field`, render the same.
 */
describe.each(mapped.filter(([, entry]) => entry.buildsFile))(
  'the tree `.%s` renders',
  (root, entry) => {
    const same = (label: string, tree: FileTree, tokens: string[] = []) => {
      const facts: ElementFacts = {
        ...factsFor(entry.tag!, [root, ...tokens]),
        childElements: fileChildren(tree),
        classesAround: ['field'],
      };
      const found = renderBoth(facts);
      expect({ label, converts: found !== null }).toEqual({
        label,
        converts: true,
      });
      expect({ label, html: found!.converted }).toEqual({
        label,
        html: found!.raw,
      });
    };

    it('renders each shape of tree the same', () => {
      same('bare', {});
      same('with the text it renders by default', {
        label: 'Choose a file\u2026',
      });
      same('with an icon on each side', {
        iconLeft: ['fas', 'fa-upload'],
        iconRight: ['fas', 'fa-check'],
      });
      same('with the input its attributes and classes', {
        input: { name: 'cv', accept: 'image/*', multiple: true, id: 'x' },
        inputTokens: ['my-input'],
      });
      same('with a number attribute on the input', {
        input: { tabIndex: '0' },
      });
      same('with a name', { name: 'cv.pdf' }, ['has-name']);
      same('with a name slot and no name', {}, ['has-name']);
      same('with its modifiers together', { iconLeft: ['fas', 'fa-upload'] }, [
        'is-boxed',
        'is-fullwidth',
        'is-right',
        'is-small',
        'mt-2',
      ]);
    });
  }
);

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

/**
 * Helpers whose props render differently beside each other than alone: a
 * `gap` drops `gapless`, a `pos` drops `relative`, and an axis overflow
 * writes both axes per axis. Every ordered pair from those families, and
 * from the helpers they sit beside, on a component, a wrapper, and the two
 * components with gap props of their own.
 */
describe('helpers beside each other', () => {
  const tokens = [
    'is-gap-0',
    'is-gap-0.5',
    'is-gap-8',
    'is-column-gap-1.5',
    'is-row-gap-3',
    'is-gapless',
    'is-position-absolute',
    'is-position-fixed',
    'is-position-relative',
    'is-position-static',
    'is-position-sticky',
    'is-relative',
    'is-overlay',
    'is-clipped',
    'is-overflow-hidden',
    'is-overflow-auto',
    'is-overflow-x-auto',
    'is-overflow-x-hidden',
    'is-overflow-y-scroll',
    'is-overflow-y-clip',
    'is-radiusless',
    'has-radius-small',
    'has-radius-rounded',
    'is-aspect-ratio-16by9',
    'is-aspect-ratio-1by1',
  ];
  const pairs = tokens.flatMap(first =>
    tokens.filter(second => second !== first).map(second => [first, second])
  );

  it.each([
    ['div', 'box'],
    ['p', ''],
    ['div', 'grid'],
    ['div', 'columns'],
  ])('renders the same on a <%s> %s', (tag, root) => {
    for (const pair of pairs) {
      const both = renderBoth(factsFor(tag, root ? [root, ...pair] : pair));
      expect({ pair, converts: both !== null }).toEqual({
        pair,
        converts: true,
      });
      expect({ pair, html: both!.converted }).toEqual({
        pair,
        html: both!.raw,
      });
    }
  });
});

/**
 * An item of a list `PLACED` names, as written inside that list and as the
 * codemod converts it: its `<li>`, the `<a>` its target renders, and a bare
 * nested list the target renders after that.
 */
describe.each(Object.entries(PLACED))('an item of `.%s`', (list, entry) => {
  const spec = entry.absorbs!;
  const after = spec.after!;
  const listEntry = ROOTS[list];
  type Attributes = Record<string, string | number | true | null>;
  interface Item {
    tokens?: string[];
    attributes?: Record<string, string | true>;
    childTokens?: string[] | null;
    childAttributes?: Attributes;
    nested?: boolean;
  }
  const factsOf = (item: Item): ElementFacts => {
    const child: ChildFacts = {
      ...bare(spec.tag),
      tokens: item.childTokens,
      attributes: new Map(Object.entries(item.childAttributes ?? {})),
      isEmpty: false,
    };
    const nested: ChildFacts = { ...bare(after.tag), isEmpty: false };
    return {
      ...factsFor(entry.tag!, item.tokens ?? [], item.attributes ?? {}),
      itemOf: list,
      childElements: item.nested ? [child, nested] : [child],
      ...(!item.nested && { soleChild: child }),
    };
  };
  /** The item inside its list, raw and converted, or null when it stays. */
  const both = (item: Item): { raw: string; converted: string } | null => {
    const result = plan(factsOf(item));
    const conversion = result.conversion;
    if (!conversion) return null;
    const childAttributes = item.childAttributes ?? {};
    const inner = (tag: string) =>
      createElement(listEntry.tag!, null, createElement(tag, null, 'y'));
    const raw = renderElement(
      listEntry.tag!,
      { className: list },
      createElement(
        entry.tag!,
        {
          ...(item.tokens ? { className: item.tokens.join(' ') } : {}),
          ...item.attributes,
        },
        createElement(
          spec.tag,
          {
            ...(item.childTokens
              ? { className: item.childTokens.join(' ') }
              : {}),
            ...childAttributes,
          },
          'x'
        ),
        ...(item.nested ? [inner(entry.tag!)] : [])
      )
    );
    const given = { ...(item.attributes ?? {}), ...childAttributes };
    const props = Object.fromEntries(
      [...conversion.props, ...(conversion.absorbs?.props ?? [])].map(
        ([name, value]) => [name, value]
      )
    );
    const converted = renderElement(
      listEntry.target!,
      null,
      createElement(
        conversion.target,
        {
          ...Object.fromEntries(
            Object.entries(given).map(([name, value]) => [
              name,
              conversion.numbers.includes(name) ? Number(value) : value,
            ])
          ),
          ...props,
          ...(conversion.className ? { className: conversion.className } : {}),
        },
        'x',
        ...(item.nested
          ? [
              createElement(
                after.target,
                null,
                createElement(entry.tag!, null, 'y')
              ),
            ]
          : [])
      )
    );
    return { raw: normalizeHtml(raw), converted: normalizeHtml(converted) };
  };
  const same = (item: Item, label: string) => {
    const found = both(item);
    expect({ label, converts: found !== null }).toEqual({
      label,
      converts: true,
    });
    expect({ label, html: found!.converted }).toEqual({
      label,
      html: found!.raw,
    });
  };

  it('renders the same bare, with each class its link may carry, and nested', () => {
    same({}, 'bare');
    for (const token of Object.keys(spec.modifiers ?? {})) {
      same({ childTokens: [token] }, token);
    }
    same({ nested: true }, 'with a nested list');
  });

  it('renders the same with each attribute where the target puts it', () => {
    const onElement: Record<string, string | true> = {
      id: 'x',
      title: 'hint',
      role: 'menuitem',
      tabIndex: '0',
      'data-testid': 'item',
    };
    expect(Object.keys(onElement).sort()).toEqual(
      spec.elementProps!.filter(name => name !== 'style').sort()
    );
    for (const [name, value] of Object.entries(onElement)) {
      same({ attributes: { [name]: value } }, name);
    }
    same({ tokens: ['my-item', 'has-text-danger'] }, 'classes of its own');
    const onChild: Record<string, string | true> = {
      href: '/x',
      target: '_blank',
      rel: 'noopener',
      'aria-current': 'page',
      'data-test': 'y',
    };
    for (const [name, value] of Object.entries(onChild)) {
      same({ childAttributes: { [name]: value } }, name);
    }
    same(
      {
        attributes: onElement,
        childTokens: ['is-active'],
        childAttributes: onChild,
        nested: true,
      },
      'all of them'
    );
  });

  it('stays markup with anything the target would render elsewhere', () => {
    const refusals: Array<[string, ElementFacts]> = [
      ['an attribute of its own', factsOf({ attributes: { onClick: 'f' } })],
      ['an empty class', { ...factsOf({}), emptyClass: true }],
      [
        'a ref on the item',
        { ...factsOf({ attributes: { ref: 'r' } }), hasRef: true },
      ],
      ...spec.elementProps!.map((name): [string, ElementFacts] => [
        `\`${name}\` on the link`,
        factsOf({ childAttributes: { [name]: 'x' } }),
      ]),
      ['a key on the link', factsOf({ childAttributes: { key: 'k' } })],
      ['another class on the link', factsOf({ childTokens: ['my-link'] })],
      [
        'a helper class on the link',
        factsOf({ childTokens: ['has-text-danger'] }),
      ],
      ['an empty class on the link', factsOf({ childTokens: [] })],
      ['a computed class on the link', factsOf({ childTokens: null })],
      [
        'an empty link',
        {
          ...factsOf({}),
          childElements: [bare(spec.tag)],
          soleChild: bare(spec.tag),
        },
      ],
      [
        'no link',
        { ...factsOf({}), childElements: undefined, soleChild: undefined },
      ],
      [
        'another tag',
        {
          ...factsOf({}),
          childElements: [{ ...bare('button'), isEmpty: false }],
        },
      ],
      [
        'a nested list with a class',
        {
          ...factsOf({ nested: true }),
          childElements: [
            factsOf({}).childElements![0],
            { ...bare(after.tag), tokens: ['mt-2'], isEmpty: false },
          ],
        },
      ],
      [
        'an empty nested list',
        {
          ...factsOf({ nested: true }),
          childElements: [factsOf({}).childElements![0], bare(after.tag)],
        },
      ],
      [
        'two nested lists',
        {
          ...factsOf({ nested: true }),
          childElements: [
            ...factsOf({ nested: true }).childElements!,
            { ...bare(after.tag), isEmpty: false },
          ],
        },
      ],
    ];
    for (const [label, facts] of refusals) {
      expect({ label, conversion: plan(facts).conversion }).toEqual({
        label,
        conversion: null,
      });
    }
  });
});

describe("the table's claims about the library", () => {
  const targets = [
    ...mapped.map(([, entry]) => entry.target!),
    ...Object.values(PLACED).map(entry => entry.target!),
    ...Object.values(WRAPPERS),
  ];

  it('names every spelling of each component whose context a root provides', () => {
    // A component reaches a file under its export and under each part name
    // it is attached as (`TabContentItem`, `TabsContent.Item`,
    // `Tabs.Content.Item`); the planner compares names, so each must be here.
    const spellings = new Map<unknown, string[]>();
    const walk = (value: unknown, name: string, depth: number): void => {
      if (!value || (typeof value !== 'object' && typeof value !== 'function'))
        return;
      spellings.set(value, [...(spellings.get(value) ?? []), name]);
      if (depth === 2) return;
      for (const key of Object.keys(value)) {
        if (/^[A-Z]/.test(key)) {
          walk(
            (value as Record<string, unknown>)[key],
            `${name}.${key}`,
            depth + 1
          );
        }
      }
    };
    for (const [key, value] of Object.entries(bestax)) {
      if (/^[A-Z]/.test(key)) walk(value, key, 0);
    }
    const resolve = (name: string): unknown =>
      name
        .split('.')
        .reduce<unknown>(
          (owner, key) => (owner as Record<string, unknown> | undefined)?.[key],
          bestax
        );
    for (const [root, entry] of mapped) {
      const readBy = entry.providesContext?.readBy;
      if (!readBy) continue;
      const every = new Set(
        readBy.flatMap(name => spellings.get(resolve(name)) ?? [])
      );
      expect({ root, readBy: [...readBy].sort() }).toEqual({
        root,
        readBy: [...every].sort(),
      });
    }
  });

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
      ...[...mapped.map(([, entry]) => entry), ...Object.values(PLACED)].map(
        (entry): [string, string[]] => [
          entry.target!,
          [...(entry.ownProps ?? []), ...(entry.passThrough ?? [])],
        ]
      ),
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
    ['tabIndex', '0'],
    ['tabIndex', '-1'],
    // Numeric, but not spelled the way a number renders: these must refuse.
    ['value', '040'],
    ['tabIndex', '00'],
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
        ...defaultsFor(entry, tag),
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
