/**
 * `lookup_bulma_classes`: what bestax renders for each class in a Bulma class
 * string, answered from bestax-migrate's own table (`data/bulma-classes.json`,
 * generated from its `class-map.ts`).
 *
 * The lookup follows the codemod's planner class by class: a family bestax
 * converts as a whole, then the element's root by precedence, then each
 * other class as that root's modifier or a helper prop, with the same rules
 * for a prop two classes both set and for helpers that only render beside
 * another. So a prop it names is the prop the codemod writes. It stops where
 * the planner looks past the classes: attributes, children, refs and spreads
 * also decide whether an element converts, and only the codemod checks
 * those. A component that needs one of its parts inside says so, and so does
 * one that renders the element inside it.
 * `__tests__/bulma-classes-agree.test.ts` runs the planner beside it.
 */

import { table } from './format.js';

export interface PropWrite {
  prop: string;
  /** Omitted for a bare boolean prop. */
  value?: string;
  /** The prop is typed as a number, so the value is written as one. */
  numeric?: boolean;
}

export interface Modifier {
  writes: PropWrite[];
  /** The tags the writes are exact on (Title's size picks its heading). */
  tagIn?: string[];
  /**
   * The prop renders this attribute too, unless the element sets its own,
   * so the class converts only beside one written out.
   */
  needsAttr?: { name: string; value: string };
}

export interface RootRecord {
  status: 'mapped' | 'todo' | 'plain' | 'fold';
  target: string | null;
  tag: string | null;
  as: string[] | 'any' | null;
  sizeDrivesTag: boolean;
  textColor: string | null;
  bgColor: string | null;
  part: boolean;
  why: string | null;
  modifiers: Record<string, Modifier>;
  /** Modifiers left out on purpose, with the prop that renders more. */
  omits: Record<string, string>;
  /**
   * The component renders its children inside an element of its own unless
   * one of them is one of these parts (`Card` inside `.card-content`).
   */
  wrapsChildren: Wraps | null;
  /** The component takes no helper props, so helper classes stay classes. */
  noHelpers: boolean;
  /** On a tag the component doesn't render, why the element stays markup. */
  otherTagsStay: { tags: string[]; why: string } | null;
  /**
   * The component renders its class only when no other of itself is around
   * it (`Menu.List` drops `.menu-list` when nested).
   */
  topLevelOnly: boolean;
  /** For a `fold` root: the props that render it on the target inside. */
  folds: PropWrite[] | null;
  /** The component renders the element's only child itself. */
  absorbs: Absorbs | null;
  /** Props the component needs to render this class at all. */
  writes: PropWrite[] | null;
  /**
   * The component renders the element's children itself, `prop` of them,
   * each a bare, empty `<tag>`.
   */
  countsChildren: Counts | null;
  /** What each item in a list with this class becomes, found by where it sits. */
  items: Items | null;
  /** The component renders a bare `<tag>` around the element too. */
  parent: { tag: string } | null;
  /** The component renders this text as its content, whatever it's given. */
  rendersText: string | null;
  /** A `className` the component is given replaces its own class. */
  classNameReplaces: boolean;
}

export interface Items {
  /** The component each item becomes. */
  target: string;
  /** The item's tag. */
  tag: string;
  /** The element inside the item that the component renders itself. */
  child: string;
  /** The attributes the component puts on the item; the rest go on `child`. */
  itemProps: string[];
  /** The child's classes, as the component's props. */
  modifiers: Record<string, Modifier>;
  /** A list after the child that the component renders, as `target`. */
  after: { tag: string; target: string } | null;
}

export interface Counts {
  tag: string;
  prop: string;
}

export interface Absorbs {
  /** The child's tag. */
  tag: string;
  /**
   * Where the component puts the attributes it is given: on the child, so
   * the child's become the component's, or on the element, so the child
   * carries none.
   */
  attributesOn: 'child' | 'element';
  /**
   * With the attributes on the element: the child's the component takes as
   * props and writes back on the child.
   */
  childProps?: string[];
  /**
   * When the child can't be absorbed, the component renders the element's
   * children as given, so the element converts around them instead.
   */
  elseWraps?: boolean;
  /** The child's classes, as the component's props. */
  modifiers?: Record<string, Modifier>;
  /** A bare child attribute one of the element's modifiers writes. */
  pairs?: Record<string, string>;
  /** A child attribute the component reads under another name. */
  renames?: Record<string, { to: string; beside: string }>;
}

export interface Wraps {
  in: string;
  unless: string[];
  /** It renders that element with no children too. */
  whenEmpty?: boolean;
  /** Only when the element carries this class (`Field` with `is-horizontal`). */
  when?: string;
}

export interface HelperRecord {
  group: string;
  write: PropWrite;
}

export interface BulmaClassTable {
  schemaVersion: number;
  roots: Record<string, RootRecord>;
  precedence: string[];
  wrappers: Record<string, string>;
  helpers: Record<string, HelperRecord>;
  legacy: Record<string, string>;
  passthrough: { why: string; match: string }[];
}

export type Verdict =
  /** This class is the element's component. */
  | { kind: 'component'; target: string }
  /** A family bestax converts as a whole, by hand. */
  | { kind: 'family'; why: string }
  | { kind: 'prop'; writes: PropWrite[]; condition?: string }
  | { kind: 'class'; why: string };

export type Element =
  | {
      kind: 'component';
      target: string;
      as?: string;
      renders?: string;
      /** Converts only beside one of its parts. */
      wraps?: Wraps;
      /** Converts together with the one element inside it. */
      absorbs?: Absorbs;
      /** Props it needs for this class at all. */
      writes?: PropWrite[];
      /** Renders the element's children itself, from a count. */
      counts?: Counts;
      /** Renders this class only when no other of itself is around it. */
      topLevel?: string;
      /** What each item inside it becomes. */
      items?: Items;
      /** Renders a bare element of this tag around the element too. */
      parent?: string;
      /** Renders this text as its content. */
      rendersText?: string;
      /** A `className` it's given replaces its class. */
      classNameReplaces?: boolean;
    }
  /** The component cannot render this tag. */
  | { kind: 'wrong-tag'; target: string; tag: string; reaches: string }
  | { kind: 'markup'; why: string }
  /** A wrapper the component inside it renders from these props. */
  | { kind: 'fold'; target: string; writes: PropWrite[] }
  /** No root and no tag: helpers land on whichever component you use. */
  | { kind: 'any' };

export interface Lookup {
  tag?: string;
  element: Element;
  rows: { token: string; verdict: Verdict }[];
}

/** The table's own entry for a key: classes come from users, `toString` too. */
function own<T>(record: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

const compiled = new WeakMap<BulmaClassTable, RegExp[]>();

function passthroughReason(
  table: BulmaClassTable,
  token: string
): string | undefined {
  let patterns = compiled.get(table);
  if (!patterns) {
    patterns = table.passthrough.map(group => new RegExp(group.match));
    compiled.set(table, patterns);
  }
  const index = patterns.findIndex(pattern => pattern.test(token));
  return index === -1 ? undefined : table.passthrough[index].why;
}

const PART =
  'a part of a Bulma family bestax converts as a whole; its outermost class says how';

/** Why a class nothing converts stays in `className`. */
function leftoverReason(table: BulmaClassTable, token: string): string {
  const legacy = own(table.legacy, token);
  if (legacy) return legacy;
  const root = own(table.roots, token);
  if (root?.status === 'mapped') {
    return 'another class on this element picks its component';
  }
  if (root?.part) return PART;
  if (root?.why) return root.why;
  return (
    passthroughReason(table, token) ?? 'not a Bulma class bestax has a prop for'
  );
}

/** The classes in what a caller passed: a class string, or a selector. */
export function classTokens(input: string): string[] {
  const text = input
    .trim()
    .replace(/^(?:class(?:Name)?\s*=\s*)?[{"'`]*/, '')
    .replace(/["'`}]*$/, '');
  const tokens = text
    .split(/\s+/)
    .flatMap(token =>
      token.startsWith('.') ? token.split('.').filter(Boolean) : [token]
    )
    .filter(Boolean);
  return [...new Set(tokens)];
}

function listTags(tags: readonly string[]): string {
  const named = tags.map(tag => `<${tag}>`);
  return named.length > 1
    ? `${named.slice(0, -1).join(', ')} or ${named[named.length - 1]}`
    : named[0];
}

function reaches(entry: RootRecord): string {
  if (entry.as === 'any') return `<${entry.tag}>, or any tag through \`as\``;
  if (entry.sizeDrivesTag && entry.as) {
    return `the heading its \`size\` names (<${entry.tag}> with none), or ${listTags(entry.as)} through \`as\``;
  }
  if (entry.as) return `${listTags(entry.as)} through \`as\``;
  return `only <${entry.tag}>`;
}

/**
 * With no component to go by, a color helper's usual prop, and the
 * components that name it differently or take none, read from the table.
 */
function colorCondition(table: BulmaClassTable, key: 'textColor' | 'bgColor') {
  const renamed = new Map<string, string[]>();
  const none: string[] = [];
  for (const entry of Object.values(table.roots)) {
    if (entry.status !== 'mapped' || !entry.target) continue;
    const prop = entry[key];
    if (prop === null) none.push(entry.target);
    else if (prop !== key) {
      renamed.set(prop, [...(renamed.get(prop) ?? []), entry.target]);
    }
  }
  const takes = (names: string[], what: string) => {
    const quoted = names.map(name => `\`${name}\``);
    const list =
      quoted.length > 1
        ? `${quoted.slice(0, -1).join(', ')} and ${quoted[quoted.length - 1]}`
        : quoted[0];
    return `${list} ${quoted.length > 1 ? 'take' : 'takes'} ${what}`;
  };
  const parts = [...renamed].map(([prop, targets]) =>
    takes(targets, `\`${prop}\``)
  );
  if (none.length > 0) parts.push(takes(none, 'none'));
  return parts.length > 0
    ? `on most components; ${parts.join(', and ')}`
    : undefined;
}

export function lookupClasses(
  table: BulmaClassTable,
  input: string,
  tag?: string
): Lookup {
  const tokens = classTokens(input);
  const verdicts = new Map<string, Verdict>();
  const stays = (token: string, why: string) =>
    verdicts.set(token, { kind: 'class', why });
  const result = (element: Element): Lookup => ({
    tag,
    element,
    rows: tokens.map(token => ({
      token,
      verdict: verdicts.get(token) ?? {
        kind: 'class',
        why: leftoverReason(table, token),
      },
    })),
  });
  const rootOf = (token: string) => own(table.roots, token);

  // A family bestax converts as a whole keeps the element as markup.
  const family = tokens.find(token => {
    const found = rootOf(token);
    return found?.status === 'todo' && !found.part;
  });
  if (family) {
    const why = rootOf(family)!.why ?? PART;
    verdicts.set(family, { kind: 'family', why });
    for (const token of tokens) {
      if (token !== family && !own(table.legacy, token)) {
        stays(token, `converted with the \`.${family}\` markup, by hand`);
      }
    }
    return result({ kind: 'markup', why: `\`.${family}\`: ${why}` });
  }

  // A wrapper the component inside it renders from a prop: its own class
  // and its modifiers become that component's props, and nothing else may
  // ride on it, since the component renders it bare.
  const wrapper = tokens.find(token => rootOf(token)?.status === 'fold');
  if (wrapper) {
    const entry = rootOf(wrapper)!;
    const writes = [...(entry.folds ?? [])];
    verdicts.set(wrapper, { kind: 'prop', writes: entry.folds ?? [] });
    let bare = true;
    for (const token of tokens) {
      if (token === wrapper) continue;
      const modifier = own(entry.modifiers, token);
      if (
        modifier &&
        !modifier.writes.some(write => writes.some(w => w.prop === write.prop))
      ) {
        writes.push(...modifier.writes);
        verdicts.set(token, { kind: 'prop', writes: modifier.writes });
        continue;
      }
      bare = false;
      stays(token, `bestax renders \`.${wrapper}\` with no other class`);
    }
    if (tag && tag !== entry.tag) {
      return result({
        kind: 'markup',
        why: `bestax renders \`.${wrapper}\` on a <${entry.tag}>, not a <${tag}>`,
      });
    }
    if (!bare) {
      return result({
        kind: 'markup',
        why: `bestax renders \`.${wrapper}\` with nothing on it but its own class and modifiers`,
      });
    }
    return result({ kind: 'fold', target: entry.target!, writes });
  }

  const precedence = (token: string) => {
    const index = table.precedence.indexOf(token);
    return index === -1 ? table.precedence.length : index;
  };
  const root = tokens
    .filter(token => rootOf(token)?.status === 'mapped')
    .sort((a, b) => precedence(a) - precedence(b))[0];

  let entry: RootRecord;
  if (root) {
    entry = rootOf(root)!;
  } else {
    const other = tokens.find(token => rootOf(token));
    if (other) {
      // A root nothing converts keeps its element as markup, helpers and all.
      const why = leftoverReason(table, other);
      for (const token of tokens) {
        if (token !== other && !own(table.legacy, token)) {
          stays(token, `the element stays \`.${other}\``);
        }
      }
      return result({ kind: 'markup', why: `\`.${other}\`: ${why}` });
    }
    const wrapper = tag ? own(table.wrappers, tag) : undefined;
    if (tag && !wrapper) {
      const why = `bestax has no component for a plain <${tag}>, so its classes stay`;
      for (const token of tokens) {
        if (own(table.helpers, token)) stays(token, why);
      }
      return result({ kind: 'markup', why });
    }
    entry = {
      status: 'mapped',
      target: wrapper ?? null,
      tag: tag ?? null,
      as: null,
      sizeDrivesTag: false,
      textColor: 'textColor',
      bgColor: 'bgColor',
      part: false,
      why: null,
      modifiers: {},
      omits: {},
      wrapsChildren: null,
      noHelpers: false,
      otherTagsStay: null,
      topLevelOnly: false,
      folds: null,
      absorbs: null,
      writes: null,
      countsChildren: null,
      items: null,
      parent: null,
      rendersText: null,
      classNameReplaces: false,
    };
  }
  const target = entry.target;
  const wrapsChildren = entry.wrapsChildren;
  const wraps =
    wrapsChildren &&
    (!wrapsChildren.when || tokens.includes(wrapsChildren.when))
      ? wrapsChildren
      : undefined;

  // Each class as the root's modifier, else as a helper prop, in order; the
  // first class to set a prop keeps it.
  // What the component needs for its own class comes first, so no class can
  // take its prop (`variant="lines"` for `.skeleton-lines`).
  const writes = new Map<
    string,
    { value: string | true; token: string; group?: string }
  >(
    (entry.writes ?? []).map(write => [
      write.prop,
      { value: write.value ?? true, token: root ?? '' },
    ])
  );
  for (const token of tokens) {
    if (token === root) {
      verdicts.set(token, { kind: 'component', target: target! });
      continue;
    }
    const modifier = own(entry.modifiers, token);
    if (modifier) {
      if (modifier.tagIn && tag && !modifier.tagIn.includes(tag)) {
        stays(
          token,
          `bestax \`${target}\` renders it exactly only on ${listTags(modifier.tagIn)}`
        );
        continue;
      }
      const taken = modifier.writes.find(write => writes.has(write.prop));
      if (taken) {
        stays(
          token,
          `\`${taken.prop}\` is already set by \`${writes.get(taken.prop)!.token}\``
        );
        continue;
      }
      for (const write of modifier.writes) {
        writes.set(write.prop, { value: write.value ?? true, token });
      }
      // A class the component renders from an attribute of the element
      // inside (`is-multiple` beside a `<select multiple>`).
      const paired = Object.entries(entry.absorbs?.pairs ?? {}).find(
        ([, pairedToken]) => pairedToken === token
      )?.[0];
      verdicts.set(token, {
        kind: 'prop',
        writes: modifier.writes,
        condition:
          modifier.tagIn && !tag
            ? `exact only on ${listTags(modifier.tagIn)}`
            : paired
              ? `with a bare \`${paired}\` on the <${entry.absorbs!.tag}> inside, which it renders`
              : modifier.needsAttr
                ? `beside an \`${modifier.needsAttr.name}\` of the element's own, since the prop renders \`${modifier.needsAttr.name}="${modifier.needsAttr.value}"\` otherwise; without one it stays a class`
                : undefined,
      });
      continue;
    }
    const omitted = own(entry.omits, token);
    if (omitted) {
      stays(token, omitted);
      continue;
    }
    const helper = own(table.helpers, token);
    if (!helper) continue;
    if (entry.noHelpers) {
      stays(token, `bestax \`${target}\` takes no helper props`);
      continue;
    }
    const prop =
      helper.group === 'text-color'
        ? entry.textColor
        : helper.group === 'background'
          ? entry.bgColor
          : helper.write.prop;
    if (!prop) {
      stays(token, `bestax \`${target}\` has no prop that renders it`);
      continue;
    }
    if (writes.has(prop)) {
      stays(
        token,
        `\`${prop}\` is already set by \`${writes.get(prop)!.token}\``
      );
      continue;
    }
    const write = { prop, value: helper.write.value };
    writes.set(prop, {
      value: write.value ?? true,
      token,
      group: helper.group,
    });
    const color =
      helper.group === 'text-color' || helper.group === 'background';
    verdicts.set(token, {
      kind: 'prop',
      writes: [write],
      condition:
        color && !target
          ? colorCondition(
              table,
              helper.group === 'text-color' ? 'textColor' : 'bgColor'
            )
          : undefined,
    });
  }

  let undone = false;
  /** Take a prop back, naming it: the class stays, but the prop is real. */
  const undo = (prop: string, why: string) => {
    const { token, value } = writes.get(prop)!;
    const named = value === true ? `\`${prop}\`` : `\`${prop}="${value}"\``;
    stays(token, `${named} ${why}, so here it stays a class`);
    writes.delete(prop);
    undone = true;
  };
  const displayProps = [...writes].filter(
    ([, write]) => write.group === 'display'
  );
  if (displayProps.length > 1 && writes.has('display')) {
    undo('display', 'is dropped beside a per-viewport `display`');
  }
  const flexDisplay = [...writes.values()].some(
    write =>
      write.group === 'display' &&
      (write.value === 'flex' || write.value === 'inline-flex')
  );
  if (!flexDisplay) {
    for (const [prop, write] of [...writes]) {
      if (write.group === 'flex-container') {
        undo(prop, 'renders only beside a flex `display` (`is-flex`)');
      }
    }
  }

  if (!target) {
    return result(
      writes.size > 0
        ? { kind: 'any' }
        : {
            kind: 'markup',
            why: undone
              ? 'each prop these classes name needs another class beside it'
              : 'none of these classes is a bestax component or prop',
          }
    );
  }
  if (!root && writes.size === 0) {
    return result({
      kind: 'markup',
      why: `nothing here for bestax \`${target}\` to carry, so the <${tag}> stays as it is`,
    });
  }
  const size = writes.get('size')?.value;
  const renders =
    entry.sizeDrivesTag && tag !== 'p' && typeof size === 'string'
      ? `h${size}`
      : entry.tag!;
  const reachable =
    !tag ||
    renders === tag ||
    entry.as === 'any' ||
    (Array.isArray(entry.as) && entry.as.includes(tag));
  if (!reachable) {
    if (tag && entry.otherTagsStay?.tags.includes(tag)) {
      return result({ kind: 'markup', why: entry.otherTagsStay.why });
    }
    return result({ kind: 'wrong-tag', target, tag, reaches: reaches(entry) });
  }
  // A `className` it's given replaces its own class, so a class left over
  // keeps the element as markup.
  if (
    entry.classNameReplaces &&
    tokens.some(token => token !== root && verdicts.get(token)?.kind !== 'prop')
  ) {
    return result({
      kind: 'markup',
      why: `bestax \`${target}\` writes a \`className\` it's given in place of \`.${root}\`, so this converts only with no other class`,
    });
  }
  const about = {
    wraps,
    absorbs: entry.absorbs ?? undefined,
    writes: entry.writes ?? undefined,
    counts: entry.countsChildren ?? undefined,
    topLevel: entry.topLevelOnly && root ? root : undefined,
    items: entry.items ?? undefined,
    parent: entry.parent?.tag,
    rendersText: entry.rendersText ?? undefined,
    classNameReplaces: entry.classNameReplaces || undefined,
  };
  if (!tag) {
    return result({
      kind: 'component',
      target,
      renders: reaches(entry),
      ...about,
    });
  }
  if (renders === tag) return result({ kind: 'component', target, ...about });
  return result({ kind: 'component', target, as: tag, ...about });
}

/** What the items inside a list become, when they convert by where they sit. */
function itemsText(items: Items): string {
  const child = `<${items.child}>`;
  const item = `<${items.tag}>`;
  const modifiers = Object.entries(items.modifiers).map(
    ([token, modifier]) =>
      `\`${token}\` on the ${child} becomes ${modifier.writes.map(writeText).join(' ')}`
  );
  const onItem = ['className', ...items.itemProps].map(name => `\`${name}\``);
  const after = items.after
    ? `, at most one bare <${items.after.tag}> after it, which becomes a ` +
      `\`${items.after.target}\` after the ${child}'s children,`
    : '';
  return (
    ` Each ${item} in it holding ${/^[aeiou]/.test(items.child) ? 'an' : 'a'} ${child}` +
    `${after} and nothing else becomes a \`${items.target}\`, written in the ` +
    `${item}'s place around the ${child}'s children.` +
    (modifiers.length > 0 ? ` ${capitalised(modifiers.join(', '))}.` : '') +
    ` \`${items.target}\` puts ${onItem.slice(0, -1).join(', ')} and ${onItem[onItem.length - 1]} ` +
    `on the ${item} and everything else on the ${child}, so an item converts ` +
    `only when its attributes already sit that way.`
  );
}

function capitalised(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** What converting a component that renders the element inside it means. */
function absorbsText(target: string, absorbs: Absorbs): string {
  const child = `<${absorbs.tag}>`;
  const aChild = `${/^[aeiou]/.test(absorbs.tag) ? 'an' : 'a'} ${child}`;
  const changes = [
    ...Object.entries(absorbs.modifiers ?? {}).map(
      ([token, modifier]) =>
        `\`${token}\` becomes ${modifier.writes.map(writeText).join(' ')}`
    ),
    ...Object.entries(absorbs.renames ?? {}).map(
      ([name, { to, beside }]) =>
        `\`${name}\` becomes \`${to}\` (beside \`${beside}\`)`
    ),
  ];
  const list =
    changes.length > 1
      ? `${changes.slice(0, -1).join(', ')} and ${changes[changes.length - 1]}`
      : changes[0];
  const on = list ? ` On the ${child}, ${list}.` : '';
  if (absorbs.attributesOn === 'element') {
    const taken = (absorbs.childProps ?? []).map(name => `\`${name}\``);
    if (taken.length === 0) {
      return (
        ` It renders the ${child} inside it itself, bare: put that ${child}'s ` +
        `children straight inside \`${target}\`, which converts only around ` +
        `${aChild} with no class or attribute.`
      );
    }
    const names =
      taken.length > 1
        ? `${taken.slice(0, -1).join(', ')} and ${taken[taken.length - 1]}`
        : taken[0];
    return (
      ` It renders the ${child} inside it itself, from its own ${names} ` +
      `props: write the ${child}'s ${names} on \`${target}\` in its place, ` +
      `which converts that way only around ${aChild} with no other ` +
      `attribute.${on}` +
      (absorbs.elseWraps
        ? ` Around other HTML elements written out it renders them as given, ` +
          `in place of its own ${child}, so put them inside \`${target}\` as ` +
          `they are; around an expression, which can come out empty, it ` +
          `would render its own.`
        : '')
    );
  }
  return (
    ` It renders the ${child} inside it itself, and puts the attributes it ` +
    `is given on that ${child}: write the ${child}'s attributes and children ` +
    `on \`${target}\` in its place, and nothing on this element but a \`key\`.` +
    on
  );
}

function orList(names: readonly string[]): string {
  const quoted = names.map(name => `\`${name}\``);
  return quoted.length > 1
    ? `${quoted.slice(0, -1).join(', ')} or ${quoted[quoted.length - 1]}`
    : quoted[0];
}

function writeText(write: PropWrite): string {
  if (write.value === undefined) return `\`${write.prop}\``;
  return write.numeric
    ? `\`${write.prop}={${write.value}}\``
    : `\`${write.prop}="${write.value}"\``;
}

const MIGRATE_NOTE =
  'Classes only: whether an element converts also depends on its attributes, ' +
  'children and file. To convert a codebase, `npx bestax-migrate bulma-classes src/` ' +
  'checks every element and leaves a TODO where it cannot; ' +
  '`get_skill({ name: "bestax-migrate", reference: "bulma-classes-unmappables" })` ' +
  'has a recipe for each.';

export function renderLookup(lookup: Lookup): string {
  const { element } = lookup;
  const out: string[] = [];
  switch (element.kind) {
    case 'component': {
      const given = [
        ...(element.as ? [`\`as="${element.as}"\``] : []),
        ...(element.writes ?? []).map(writeText),
      ];
      const counts = element.counts;
      out.push(
        `**Component:** \`${element.target}\`` +
          (given.length > 0 ? ` with ${given.join(' ')}` : '') +
          (element.renders ? ` (renders ${element.renders})` : '') +
          '.' +
          (element.wraps
            ? ` It renders its children inside a \`.${element.wraps.in}\` of its ` +
              `own unless one of them is a ${orList(element.wraps.unless)}, so ` +
              `build it from its parts.`
            : '') +
          (element.absorbs
            ? absorbsText(element.target, element.absorbs)
            : '') +
          (counts
            ? ` It renders this element's children itself, \`${counts.prop}\` ` +
              `bare, empty <${counts.tag}>s: write their count as ` +
              `\`${counts.prop}={N}\` and drop them. The codemod does that ` +
              `when they're all the element holds.`
            : '') +
          (element.topLevel
            ? ` It renders \`.${element.topLevel}\` only when no other ` +
              `\`${element.target}\` is around it, so one inside another ` +
              `\`.${element.topLevel}\`, or around a \`${element.target}\`, ` +
              `stays markup.`
            : '') +
          (element.items ? itemsText(element.items) : '') +
          (element.parent
            ? ` It renders its own bare <${element.parent}> around the element ` +
              `too: write it in the <${element.parent}>'s place, which ` +
              `converts only when that <${element.parent}> holds nothing else ` +
              `and carries nothing but a \`key\`.`
            : '') +
          (element.rendersText
            ? ` It renders its own \`${element.rendersText}\` as its content, ` +
              `so write it closing itself.`
            : '') +
          (element.classNameReplaces
            ? ` A \`className\` it's given replaces its own class, so it ` +
              `converts only with no other class.`
            : '')
      );
      break;
    }
    case 'wrong-tag':
      out.push(
        `**Component:** \`${element.target}\` renders ${element.reaches}, not ` +
          `a <${element.tag}>. Change the tag to use it, and the rows below are ` +
          `what it takes then; the codemod leaves a <${element.tag}> as markup.`
      );
      break;
    case 'markup':
      out.push(`**Stays markup:** ${element.why}.`);
      break;
    case 'fold':
      out.push(
        `**Folds into the \`${element.target}\` inside it**, as ` +
          `${element.writes.map(writeText).join(' ')}: \`${element.target}\` ` +
          `renders this wrapper itself. Delete the wrapper and put those props ` +
          `on the \`${element.target}\`; the codemod does that when the wrapper ` +
          `holds that one element and carries no attribute.`
      );
      break;
    case 'any':
      out.push(
        '**No component in these classes.** The props below go on whichever ' +
          'bestax component you use. For a plain tag, pass `tag`: bestax wraps ' +
          '<p>, <span>, <a> and a few more, but not <div>.'
      );
      break;
  }
  const rows = lookup.rows.map(({ token, verdict }) => {
    switch (verdict.kind) {
      case 'component':
        return [`\`${token}\``, `\`${verdict.target}\``, 'the component'];
      case 'family':
        return [`\`${token}\``, 'by hand', verdict.why];
      case 'prop':
        return [
          `\`${token}\``,
          verdict.writes.map(writeText).join(' '),
          verdict.condition ?? '',
        ];
      case 'class':
        return [`\`${token}\``, 'stays in `className`', verdict.why];
    }
  });
  out.push(table(['Class', 'In bestax', 'Note'], rows));
  if (
    element.kind === 'component' ||
    element.kind === 'wrong-tag' ||
    element.kind === 'fold'
  ) {
    out.push(
      `**Next:** \`get_props({ component: "${element.target}" })\` for its ` +
        `other props.`
    );
  }
  out.push(MIGRATE_NOTE);
  return out.join('\n\n');
}
