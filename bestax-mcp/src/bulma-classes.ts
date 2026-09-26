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
 * those. A component that needs one of its parts inside says so.
 * `__tests__/bulma-classes-agree.test.ts` runs the planner beside it.
 */

import { table } from './format.js';

export interface PropWrite {
  prop: string;
  /** Omitted for a bare boolean prop. */
  value?: string;
}

export interface Modifier {
  writes: PropWrite[];
  /** The tags the writes are exact on (Title's size picks its heading). */
  tagIn?: string[];
}

export interface RootRecord {
  status: 'mapped' | 'todo' | 'plain';
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
}

export interface Wraps {
  in: string;
  unless: string[];
  /** It renders that element with no children too. */
  whenEmpty?: boolean;
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
    }
  /** The component cannot render this tag. */
  | { kind: 'wrong-tag'; target: string; tag: string; reaches: string }
  | { kind: 'markup'; why: string }
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
    };
  }
  const target = entry.target;
  const wraps = entry.wrapsChildren ?? undefined;

  // Each class as the root's modifier, else as a helper prop, in order; the
  // first class to set a prop keeps it.
  const writes = new Map<
    string,
    { value: string | true; token: string; group?: string }
  >();
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
      verdicts.set(token, {
        kind: 'prop',
        writes: modifier.writes,
        condition:
          modifier.tagIn && !tag
            ? `exact only on ${listTags(modifier.tagIn)}`
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
  if (!tag) {
    return result({
      kind: 'component',
      target,
      renders: reaches(entry),
      wraps,
    });
  }
  if (renders === tag) return result({ kind: 'component', target, wraps });
  const reachable =
    entry.as === 'any' || (Array.isArray(entry.as) && entry.as.includes(tag));
  return result(
    reachable
      ? { kind: 'component', target, as: tag, wraps }
      : { kind: 'wrong-tag', target, tag, reaches: reaches(entry) }
  );
}

function orList(names: readonly string[]): string {
  const quoted = names.map(name => `\`${name}\``);
  return quoted.length > 1
    ? `${quoted.slice(0, -1).join(', ')} or ${quoted[quoted.length - 1]}`
    : quoted[0];
}

function writeText(write: PropWrite): string {
  return write.value === undefined
    ? `\`${write.prop}\``
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
    case 'component':
      out.push(
        `**Component:** \`${element.target}\`` +
          (element.as ? ` with \`as="${element.as}"\`` : '') +
          (element.renders ? ` (renders ${element.renders})` : '') +
          '.' +
          (element.wraps
            ? ` It renders its children inside a \`.${element.wraps.in}\` of its ` +
              `own unless one of them is a ${orList(element.wraps.unless)}, so ` +
              `build it from its parts.`
            : '')
      );
      break;
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
  if (element.kind === 'component' || element.kind === 'wrong-tag') {
    out.push(
      `**Next:** \`get_props({ component: "${element.target}" })\` for its ` +
        `other props.`
    );
  }
  out.push(MIGRATE_NOTE);
  return out.join('\n\n');
}
