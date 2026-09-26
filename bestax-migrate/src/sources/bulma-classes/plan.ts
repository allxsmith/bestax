/**
 * Decide what one plain JSX element becomes, from its tag, its static class
 * tokens and the names of its other attributes. Pure and AST-free, so the
 * render tests can drive it directly.
 *
 * The rule it enforces: an element converts only when the bestax component
 * renders exactly the markup the element did. Anything that would change the
 * markup is either left in `className` (a class with no prop here) or refuses
 * the whole element with a TODO (an attribute or tag the component would
 * render differently).
 */

import {
  FORWARDS_REF,
  HELPER_PROPS,
  HELPER_TOKENS,
  inTagSet,
  legacyHint,
  modifierFor,
  PRECEDENCE,
  rootFor,
  WRAPPER_OWN_PROPS,
  wrapperFor,
  type RootEntry,
} from './class-map.js';
import { ruleId } from './rules.js';

export interface ElementFacts {
  tag: string;
  /** The static className, split on whitespace, in order. */
  tokens: readonly string[];
  /**
   * The element's other attributes: a string value, `true` for a bare
   * attribute, or null for an expression.
   */
  attributes: ReadonlyMap<string, string | true | null>;
  hasSpread: boolean;
  hasRef: boolean;
  /** Whether the element has children (JSX text, elements or expressions). */
  hasChildren: boolean;
  /**
   * The bestax components the element's child elements are, or convert to
   * (`Card.Content`). Only a child written directly inside the element
   * counts: one in an expression may not render.
   */
  childTargets?: readonly string[];
  /**
   * What the element's only child converts to, when the element holds one
   * element and nothing else (not even whitespace React would render).
   */
  soleChildTarget?: string;
  /** The bestax components already in the file inside this element. */
  bestaxInside?: readonly string[];
  /** The bestax components already in the file around this element. */
  bestaxAround?: readonly string[];
  /**
   * The other components around this element (not bestax, not a fragment),
   * any of which could render a bestax component around it.
   */
  componentsAround?: readonly string[];
  /**
   * The component this element is the only child of, if any (`Link` for
   * `<Link href="/x"><a className="button">`), since that component can
   * reach into it with `cloneElement`.
   */
  onlyChildOf?: string;
}

export interface Todo {
  rule: string;
  message: string;
}

export interface Conversion {
  /** bestax JSX name, dotted for a part. */
  target: string;
  /** Attributes to write in place of `className`, in order. */
  props: Array<[name: string, value: string | true]>;
  /** What stays in `className`, or null when nothing does. */
  className: string | null;
  /** Attributes to remove: defaults the target renders by itself. */
  drop: string[];
  /**
   * Attributes, and props written above, whose numeric string value becomes
   * a number (`minCol={4}`), because the target types them as numbers.
   */
  numbers: string[];
}

export interface Plan {
  conversion: Conversion | null;
  /**
   * The element is a wrapper its only child's component renders from these
   * props: they join that child's conversion, and the element goes.
   */
  fold?: {
    target: string;
    props: Array<[name: string, value: string | true]>;
    numbers: string[];
  };
  todos: Todo[];
}

function wrapperEntry(tag: string): RootEntry | null {
  const target = wrapperFor(tag);
  if (!target) return null;
  return {
    status: 'mapped',
    target,
    tag,
    textColor: 'textColor',
    bgColor: 'bgColor',
    ownProps: WRAPPER_OWN_PROPS[target],
  };
}

function precedence(token: string): number {
  const index = PRECEDENCE.indexOf(token);
  return index === -1 ? PRECEDENCE.length : index;
}

/** The root class an element carries, for a message. */
function rootLabel(tokens: readonly string[]): string {
  return tokens.find(token => rootFor(token)?.status === 'mapped') ?? 'button';
}

function tagsItReaches(entry: RootEntry): string {
  if (entry.as === 'any') return 'any tag through `as`';
  if (entry.as) return entry.as.map(tag => `<${tag}>`).join(', ');
  return `only <${entry.tag}>`;
}

export function plan(facts: ElementFacts): Plan {
  const todos: Todo[] = [];
  const { tag, tokens } = facts;

  for (const token of tokens) {
    const hint = legacyHint(token);
    if (hint) todos.push({ rule: ruleId('legacy', token), message: hint });
  }

  // A family this source leaves as markup keeps its element as markup, even
  // beside a class it would convert (`navbar box`): the family's parts carry no
  // TODO of their own, so its outermost class is the one place it is flagged.
  const family = tokens.find(token => {
    const found = rootFor(token);
    return found?.status === 'todo' && !found.part;
  });
  if (family) {
    todos.push({
      rule: ruleId('family', family),
      message: `\`.${family}\` stays as markup: ${rootFor(family)!.why}`,
    });
    return { conversion: null, todos };
  }

  const wrapper = tokens.find(token => rootFor(token)?.status === 'fold');
  if (wrapper) return planFold(facts, wrapper, todos);

  const root = tokens
    .filter(token => rootFor(token)?.status === 'mapped')
    .sort((a, b) => precedence(a) - precedence(b))[0];

  let entry: RootEntry | null;
  if (root) {
    entry = rootFor(root)!;
  } else {
    // A root the table does not convert keeps the element as markup, so a
    // later pass (or a person) still finds it as the class it is.
    if (tokens.some(token => rootFor(token))) {
      return { conversion: null, todos };
    }
    entry = wrapperEntry(tag);
    if (!entry) return { conversion: null, todos };
  }
  const target = entry.target!;

  const refuse = (kind: string, token: string, message: string): Plan => ({
    conversion: null,
    todos: [...todos, { rule: ruleId(kind, token), message }],
  });

  // ---- Refusals: the component would render something else ---------------
  if (facts.hasSpread) {
    return refuse(
      'spread',
      target,
      `this element spreads props, which bestax \`${target}\` may read differently than the element did (a spread \`className\` merges with its classes instead of replacing them); convert it to \`${target}\` by hand`
    );
  }
  if (facts.hasRef && !FORWARDS_REF.includes(target)) {
    return refuse(
      'ref',
      target,
      `bestax \`${target}\` does not forward refs, so this \`ref\` would stop reaching the DOM node; keep this element as markup`
    );
  }
  if (facts.onlyChildOf) {
    return refuse(
      'only-child',
      target,
      `this element is the only child of \`<${facts.onlyChildOf}>\`, which may hand it props or a ref with \`cloneElement\` (next/link's legacy behavior, a tooltip, a Radix \`asChild\` trigger) that bestax \`${target}\` would not take the same way; convert it by hand if \`<${facts.onlyChildOf}>\` only renders its children`
    );
  }
  if (facts.attributes.has('dangerouslySetInnerHTML')) {
    return refuse(
      'attr',
      'dangerouslySetInnerHTML',
      `\`dangerouslySetInnerHTML\` sets the element's content directly, and some bestax components render content of their own beside \`children\`, which React rejects; keep this element as markup`
    );
  }
  for (const name of facts.attributes.keys()) {
    const readAsProp = entry.ownProps?.includes(name) || HELPER_PROPS.has(name);
    if (readAsProp && !entry.passThrough?.includes(name)) {
      return refuse(
        'attr',
        name,
        `\`${name}\` is also a bestax \`${target}\` prop, which would read it differently; rename or drop the attribute, then re-run`
      );
    }
  }
  const missing = Object.entries(entry.defaults ?? {}).filter(
    ([name]) => !facts.attributes.has(name)
  );
  const drop: string[] = [];
  for (const name of entry.untypedAttrs ?? []) {
    if (!facts.attributes.has(name)) continue;
    if (entry.defaults?.[name] === facts.attributes.get(name)) {
      drop.push(name);
      continue;
    }
    return refuse(
      'attr',
      name,
      `bestax \`${target}\`'s props take no \`${name}\`${entry.defaults?.[name] ? `, and it renders \`${name}="${entry.defaults[name]}"\` when none is given` : ''}; keep this element as markup`
    );
  }
  const numbers: string[] = [];
  for (const name of entry.numberAttrs ?? []) {
    const value = facts.attributes.get(name);
    if (typeof value !== 'string') continue;
    // Only a string that is already the number's own spelling: `040`, `1.50`
    // and ` 40 ` would render as `40`, `1.5` and `40`.
    if (!/^-?\d+(?:\.\d+)?$/.test(value) || String(Number(value)) !== value) {
      return refuse(
        'attr',
        name,
        `bestax \`${target}\` types \`${name}\` as a number, and \`${value}\` is not a number spelled the way it renders; keep this element as markup`
      );
    }
    numbers.push(name);
  }
  if (entry.requiresChildren && !facts.hasChildren) {
    return refuse(
      'children',
      target,
      `bestax \`${target}\` requires children, and this element has none; keep it as markup`
    );
  }
  if (entry.providesContext && facts.bestaxInside?.length) {
    return refuse(
      'context',
      target,
      `bestax \`${target}\` tells the bestax form controls inside it to skip wrappers of their own, and this element already holds \`${facts.bestaxInside[0]}\`, which could render differently inside it; keep this element as markup, or convert it and check that component by hand`
    );
  }
  if (entry.adoptsIdFrom && !facts.attributes.has('id')) {
    // Context follows the render tree, not the file: a component of the app
    // around the element can render a labelled `Field` around it just as well.
    const around =
      facts.bestaxAround?.find(name => entry.adoptsIdFrom!.includes(name)) ??
      facts.componentsAround?.[0];
    if (around) {
      return refuse(
        'context',
        target,
        `this element has no \`id\` and sits inside \`<${around}>\`, which is or could render a bestax \`${entry.adoptsIdFrom.join('` or `')}\` with a \`label\`; bestax \`${target}\` would then take that generated \`id\`; give the element an \`id\` of its own, then re-run`
      );
    }
  }
  const wraps = entry.wrapsChildren;
  if (
    wraps &&
    (!wraps.when || tokens.includes(wraps.when)) &&
    (facts.hasChildren || wraps.whenEmpty) &&
    !facts.childTargets?.some(child => wraps.unless.includes(child))
  ) {
    const parts = wraps.unless.map(part => `\`${part}\``);
    const list =
      parts.length > 1
        ? `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}`
        : parts[0];
    return refuse(
      'children',
      target,
      `bestax \`${target}\` renders its children inside a \`.${wraps.in}\` of its own unless one of them is a ${list}, so this element stays markup`
    );
  }
  if (missing.length > 0) {
    const list = missing.map(([name, value]) => `\`${name}="${value}"\``);
    return refuse(
      'defaults',
      target,
      `bestax \`${target}\` renders ${list.join(' and ')} when the element does not set ${missing.length === 1 ? 'it' : 'them'}; add ${missing.length === 1 ? 'it' : 'them'} here if that is what you want, then re-run`
    );
  }
  for (const [name, tags] of Object.entries(entry.dropsAttr ?? {})) {
    if (facts.attributes.has(name) && inTagSet(tags, tag)) {
      // Bulma greys out `.button[disabled]` on any tag, so there it is not
      // inert: dropping it changes how the element looks.
      const visible = name === 'disabled';
      return refuse(
        'drops',
        target,
        visible
          ? `bestax \`${target}\` drops \`disabled\` on a <${tag}>, and Bulma styles a disabled \`.${rootLabel(facts.tokens)}\` on any tag, so converting would change how it looks; keep this element as markup`
          : `bestax \`${target}\` drops \`${name}\` on a <${tag}>, where it does nothing anyway; remove it, then re-run`
      );
    }
  }

  // ---- Tokens → props ---------------------------------------------------------
  const writes = new Map<string, string | true>();
  /** The tokens each written prop came from, so a group rule can undo it. */
  const sourceOf = new Map<string, string>();
  const groupOf = new Map<string, string>();
  const converted = new Set<string>(root ? [root] : []);

  for (const token of tokens) {
    if (converted.has(token)) continue;
    const modifier = modifierFor(entry, token);
    if (modifier) {
      if (modifier.tagIn && !modifier.tagIn.includes(tag)) continue;
      if (modifier.writes.some(write => writes.has(write.prop))) continue;
      for (const write of modifier.writes) {
        writes.set(write.prop, write.value ?? true);
        sourceOf.set(write.prop, token);
        if (write.numeric) numbers.push(write.prop);
      }
      converted.add(token);
      continue;
    }
    const helper = entry.noHelpers ? undefined : HELPER_TOKENS.get(token);
    if (!helper) continue;
    const prop =
      helper.group === 'text-color'
        ? entry.textColor
        : helper.group === 'background'
          ? entry.bgColor
          : helper.write.prop;
    if (!prop || writes.has(prop)) continue;
    writes.set(prop, helper.write.value ?? true);
    sourceOf.set(prop, token);
    groupOf.set(prop, helper.group);
    converted.add(token);
  }

  const undo = (prop: string): void => {
    converted.delete(sourceOf.get(prop)!);
    writes.delete(prop);
  };
  const displayProps = [...writes.keys()].filter(
    prop => groupOf.get(prop) === 'display'
  );
  // bestax drops a base `display` whenever a per-viewport one is set.
  if (displayProps.includes('display') && displayProps.length > 1) {
    undo('display');
  }
  // Flex-container helpers only render beside a flex `display`.
  const flexDisplay = [...writes].some(
    ([prop, value]) =>
      groupOf.get(prop) === 'display' &&
      (value === 'flex' || value === 'inline-flex')
  );
  if (!flexDisplay) {
    for (const prop of [...writes.keys()]) {
      if (groupOf.get(prop) === 'flex-container') undo(prop);
    }
  }

  // A wrapper exists only to carry helper props; with none, leave the tag.
  if (!root && writes.size === 0) return { conversion: null, todos };

  // ---- The tag ------------------------------------------------------------
  let renders = entry.tag!;
  if (entry.sizeDrivesTag && tag !== 'p' && writes.has('size')) {
    renders = `h${writes.get('size')}`;
  }
  let as: string | undefined;
  if (renders !== tag) {
    const reachable = entry.as === 'any' || (entry.as?.includes(tag) ?? false);
    if (!reachable) {
      return refuse(
        'tag',
        target,
        `bestax \`${target}\` renders ${tagsItReaches(entry)}, not a <${tag}>; keep the markup, or change the tag and re-run`
      );
    }
    as = tag;
  }

  const props: Array<[string, string | true]> = [];
  if (as) props.push(['as', as]);
  props.push(...writes);
  const rest = tokens.filter(token => !converted.has(token));
  if (entry.ownClassOnly && rest.length > 0) {
    return refuse(
      'attr',
      'className',
      `bestax \`${target}\` drops its own class when it is given a \`className\`, so this element's other classes would take the place of \`.${root}\`; keep it as markup`
    );
  }
  return {
    conversion: {
      target,
      props,
      className: rest.length > 0 ? rest.join(' ') : null,
      drop,
      numbers,
    },
    todos,
  };
}

/**
 * A wrapper the component inside it renders from a prop (`.table-container`
 * from `Table isResponsive`). It folds into that component only when it is
 * exactly what the component renders for it: its own tag and class, its own
 * modifiers, no attribute, and one child that becomes the component.
 */
function planFold(facts: ElementFacts, wrapper: string, todos: Todo[]): Plan {
  const entry = rootFor(wrapper)!;
  const target = entry.target;
  if (!target) return { conversion: null, todos };
  const folds = entry.folds ?? [];
  const renders = `\`${target} ${folds.map(write => write.prop).join(' ')}\``;
  const refuse = (kind: string, token: string, message: string): Plan => ({
    conversion: null,
    todos: [...todos, { rule: ruleId(kind, token), message }],
  });

  if (facts.tag !== entry.tag) {
    return refuse(
      'tag',
      target,
      `bestax ${renders} renders \`.${wrapper}\` on a <${entry.tag}>, not a <${facts.tag}>; keep the markup, or change the tag and re-run`
    );
  }
  if (facts.hasSpread) {
    return refuse(
      'spread',
      target,
      `this element spreads props, and bestax ${renders} renders \`.${wrapper}\` with none of its own; keep it as markup`
    );
  }
  if (facts.onlyChildOf) {
    return refuse(
      'only-child',
      target,
      `this element is the only child of \`<${facts.onlyChildOf}>\`, which may hand it props or a ref with \`cloneElement\`, and folding it would move those onto the \`${target}\` inside; convert it by hand if \`<${facts.onlyChildOf}>\` only renders its children`
    );
  }
  const attribute = [...facts.attributes.keys()][0];
  if (attribute) {
    return refuse(
      'attr',
      attribute,
      `bestax ${renders} renders \`.${wrapper}\` with no attributes, so this element's \`${attribute}\` would be lost; keep it as markup`
    );
  }

  const props: Array<[string, string | true]> = folds.map(write => [
    write.prop,
    write.value ?? true,
  ]);
  const numbers: string[] = [];
  for (const token of facts.tokens) {
    if (token === wrapper) continue;
    const modifier = modifierFor(entry, token);
    const taken = modifier?.writes.some(write =>
      props.some(([prop]) => prop === write.prop)
    );
    if (!modifier || taken) {
      return refuse(
        'attr',
        'className',
        `bestax ${renders} renders \`.${wrapper}\` with no class but its own and one of each of its modifiers, so \`${token}\` would be lost; keep this element as markup`
      );
    }
    for (const write of modifier.writes) {
      props.push([write.prop, write.value ?? true]);
      if (write.numeric) numbers.push(write.prop);
    }
  }

  if (facts.soleChildTarget !== target) {
    return refuse(
      'children',
      target,
      `bestax ${renders} renders \`.${wrapper}\` itself, so this element converts only around a single element that becomes a \`${target}\`, with nothing else beside it`
    );
  }
  return { conversion: null, fold: { target, props, numbers }, todos };
}
