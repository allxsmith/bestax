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
  numberAttrsOf,
  placedFor,
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
   * For a `className` a class joiner builds (`clsx('button', busy &&
   * 'is-loading')`), the classes each condition adds, one list per condition;
   * `tokens` then holds the ones it always adds. Set only when the codemod
   * can read every argument.
   */
  conditional?: readonly (readonly string[])[];
  /**
   * Indexes into `conditional` of conditions that may have side effects (a
   * call, an assignment). A condition that becomes a prop is evaluated before
   * the ones left in the call, so it passes them only when neither is one.
   */
  impure?: readonly number[];
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
  /**
   * That only child as written, when it is a plain HTML element: what an
   * entry that `absorbs` it reads.
   */
  soleChild?: ChildFacts;
  /**
   * The element's children, when every one React renders is a plain HTML
   * element; left out when one is anything else (text, an expression, a
   * component). What an entry that `countsChildren` reads.
   */
  childElements?: readonly ChildFacts[];
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
   * The classes on the HTML elements around this element, computed ones
   * included.
   */
  classesAround?: readonly string[];
  /**
   * The component this element is the only child of, if any (`Link` for
   * `<Link href="/x"><a className="button">`), since that component can
   * reach into it with `cloneElement`.
   */
  onlyChildOf?: string;
  /**
   * The root of the list the element is an item of (`menu-list`), when that
   * list is one `PLACED` names: the element converts as that entry, whatever
   * classes it carries.
   */
  itemOf?: string;
  /**
   * The element's `className` holds no class, so it renders `class=""`
   * (`tokens` is empty either way).
   */
  emptyClass?: boolean;
  /**
   * The plain HTML element around this one, when this is its only child:
   * what an entry whose target renders that element too reads.
   */
  soleChildOf?: ChildFacts;
  /**
   * The component that element is the only child of, if any: `onlyChildOf`
   * for the element such an entry takes the place of.
   */
  holderOnlyChildOf?: string;
  /**
   * The string the element's content renders, when it is one static text.
   */
  text?: string;
}

export interface ChildFacts {
  tag: string;
  /**
   * Its static classes, or null when its `className` is computed. Left out
   * when it has no `className` at all: an empty one still renders `class=""`.
   */
  tokens?: readonly string[] | null;
  /**
   * Its attributes but `className`, read as `ElementFacts.attributes` is,
   * except that a number literal (`size={3}`) is that number.
   */
  attributes: ReadonlyMap<string, string | number | true | null>;
  hasSpread: boolean;
  /**
   * Nothing inside it but whitespace React drops. A comment is something:
   * an element that goes would take it with it.
   */
  isEmpty: boolean;
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
  /**
   * The element's only child, which the target renders itself: the target is
   * written in the child's place, with the element's props and attributes
   * first, then the child's, and the element goes.
   */
  absorbs?: {
    /** What the child's classes become, in place of its `className`. */
    props: Array<[name: string, value: string | true]>;
    /** Child attributes the target reads under another name. */
    renames: Array<[from: string, to: string]>;
    /** Child attributes a prop above renders instead. */
    drop: string[];
    /**
     * What the element after the child becomes (`Menu.List`), when it has
     * one: it moves in after the child's children.
     */
    after?: string;
  };
  /**
   * The target renders the element's children itself, from a prop above:
   * they go, and the element closes itself.
   */
  rendersChildren?: true;
  /**
   * The target renders the bare element around this one too: the component
   * takes that element's place, with its `key`.
   */
  replacesParent?: true;
  /**
   * Conditional classes (`ElementFacts.conditional`) that become a boolean
   * prop set to their condition, each once. The rest stay in the joiner call.
   */
  conditional?: Array<[prop: string, token: string]>;
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
  // Every class the element may carry: its fixed ones, and any a condition
  // adds, which the element has to be right with as well as without.
  const carried = [
    ...new Set([...tokens, ...(facts.conditional ?? []).flat()]),
  ];
  const mayCarry = (token: string) => carried.includes(token);

  for (const token of carried) {
    const hint = legacyHint(token);
    if (hint) todos.push({ rule: ruleId('legacy', token), message: hint });
  }

  // A family this source leaves as markup keeps its element as markup, even
  // beside a class it would convert (`navbar box`): the family's parts carry no
  // TODO of their own, so its outermost class is the one place it is flagged.
  const family = carried.find(token => {
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

  // An item of a list is what it is by where it sits, so its own classes all
  // stay: none of them decides what it becomes.
  const placed = facts.itemOf ? placedFor(facts.itemOf) : undefined;
  const wrapper = placed
    ? undefined
    : tokens.find(token => rootFor(token)?.status === 'fold');
  if (wrapper) return planFold(facts, wrapper, todos);

  const root = placed
    ? undefined
    : tokens
        .filter(token => rootFor(token)?.status === 'mapped')
        .sort((a, b) => precedence(a) - precedence(b))[0];

  let entry: RootEntry | null;
  if (placed) {
    entry = placed;
  } else if (root) {
    entry = rootFor(root)!;
  } else {
    // A root the table does not convert keeps the element as markup, so a
    // later pass (or a person) still finds it as the class it is.
    if (carried.some(token => rootFor(token))) {
      return { conversion: null, todos };
    }
    entry = wrapperEntry(tag);
    if (!entry) return { conversion: null, todos };
    // A wrapper exists only to carry helper props, so a tag none of whose
    // classes becomes one stays as it is, and nothing else about it is worth
    // a TODO.
    if (
      propsFrom(entry, tokens, tag, undefined, facts.attributes).writes.size ===
      0
    ) {
      return { conversion: null, todos };
    }
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
  const parent = entry.parent;
  if (parent) {
    const holder = facts.soleChildOf;
    const bare =
      holder?.tag === parent.tag &&
      holder.tokens === undefined &&
      !holder.hasSpread &&
      [...holder.attributes.keys()].every(name => name === 'key');
    if (!bare) {
      return refuse(
        'context',
        target,
        `bestax \`${target}\` renders its own bare <${parent.tag}> around the <${tag}>, so this converts only as the only thing inside a bare <${parent.tag}>, which it takes the place of; keep it as markup`
      );
    }
    if (facts.holderOnlyChildOf) {
      return refuse(
        'only-child',
        target,
        `the <${parent.tag}> around this element is the only child of \`<${facts.holderOnlyChildOf}>\`, which may hand it props or a ref with \`cloneElement\`, and bestax \`${target}\` in its place would put them on the <${tag}>; convert it by hand if \`<${facts.holderOnlyChildOf}>\` only renders its children`
      );
    }
    if (holder.attributes.has('key') && facts.attributes.has('key')) {
      return refuse(
        'attr',
        'key',
        `bestax \`${target}\` takes the place of the <${parent.tag}> around this element, and both have a \`key\`; keep one, then re-run`
      );
    }
  }
  if (entry.rendersText !== undefined && facts.text !== entry.rendersText) {
    return refuse(
      'children',
      target,
      `bestax \`${target}\` renders its own \`${entry.rendersText}\` as its content, so this converts only holding exactly that; keep it as markup`
    );
  }
  // An element converts with no class left only when found by where it sits,
  // and then an empty `className` would go with nothing to render it.
  if (placed && facts.emptyClass) {
    return refuse(
      'attr',
      'className',
      `this element has an empty \`className\`, which renders \`class=""\`, and bestax \`${target}\` renders it with no class attribute; drop the empty \`className\`, then re-run`
    );
  }
  // The attributes the target is given: the element's, or its only child's
  // when the target renders that child itself and puts them there.
  let attributes = facts.attributes;
  let absorbed: Conversion['absorbs'];
  if (entry.absorbs) {
    const where = root ? `\`.${root}\`` : `the <${tag}>`;
    const outcome = absorb(facts, where, entry, target, refuse);
    if (!('todos' in outcome)) {
      ({ attributes, absorbed } = outcome);
    } else if (!entry.absorbs.elseWraps) {
      return outcome;
    } else if (!facts.hasChildren) {
      return refuse(
        'children',
        target,
        `bestax \`${target}\` renders its own <${entry.absorbs.tag}> when it's given no children, so this empty element would gain one; keep it as markup`
      );
    } else if (!facts.soleChild && !facts.childElements?.length) {
      // The target tests its children for truth, so an expression that can
      // be falsy (`{src && <img />}`) would have it render its own child.
      return refuse(
        'children',
        target,
        `bestax \`${target}\` renders its own <${entry.absorbs.tag}> when its children are empty, and it can't be told from here that these never are, so this converts only around HTML elements written out; keep it as markup`
      );
    }
    // Otherwise the target renders the children as given, and the element
    // converts around them like any other.
  }
  const renamed = new Set(absorbed?.renames.map(([, to]) => to));

  if (attributes.has('dangerouslySetInnerHTML')) {
    return refuse(
      'attr',
      'dangerouslySetInnerHTML',
      `\`dangerouslySetInnerHTML\` sets the element's content directly, and some bestax components render content of their own beside \`children\`, which React rejects; keep this element as markup`
    );
  }
  // Every fact about the element's children comes from the JSX inside it, so
  // children passed as an attribute are content none of them sees.
  if (attributes.has('children')) {
    return refuse(
      'attr',
      'children',
      `this element sets \`children\` as an attribute, and the codemod reads an element's children from the JSX inside it, so it can't tell what bestax \`${target}\` would render from these; move them inside the element, then re-run`
    );
  }
  for (const name of attributes.keys()) {
    if (renamed.has(name)) continue;
    const readAsProp = entry.ownProps?.includes(name) || HELPER_PROPS.has(name);
    if (readAsProp && !entry.passThrough?.includes(name)) {
      return refuse(
        'attr',
        name,
        `\`${name}\` is also a bestax \`${target}\` prop, which would read it differently; rename or drop the attribute, then re-run`
      );
    }
  }
  // An attribute the target writes on this tag counts as one of its defaults.
  const written = Object.entries(entry.writesAttr ?? {})
    .filter(([, rule]) => rule.on.includes(tag))
    .map(([name, rule]): [string, string] => [name, rule.fallback]);
  const missing = [...Object.entries(entry.defaults ?? {}), ...written].filter(
    ([name]) => !attributes.has(name)
  );
  const drop: string[] = [];
  for (const name of entry.untypedAttrs ?? []) {
    if (!attributes.has(name)) continue;
    if (entry.defaults?.[name] === attributes.get(name)) {
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
  for (const name of numberAttrsOf(entry)) {
    const value = attributes.get(name);
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
  const provides = entry.providesContext;
  const reader =
    provides &&
    facts.bestaxInside?.find(
      name => !provides.readBy || provides.readBy.includes(name)
    );
  if (provides && reader) {
    return refuse(
      'context',
      target,
      `bestax \`${target}\` ${provides.what}, and this element already holds \`${reader}\`, which could render differently inside it; keep this element as markup, or convert it and check that component by hand`
    );
  }
  if (
    entry.needsElementChildren &&
    facts.hasChildren &&
    !facts.soleChild &&
    !facts.childElements?.length
  ) {
    return refuse(
      'children',
      target,
      `bestax \`${target}\` picks what it renders by whether it has children, and it can't be told from here that these never come out empty, so this converts only around HTML elements written out; keep it as markup`
    );
  }
  if (entry.adoptsIdFrom && !attributes.has('id')) {
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
  if (
    entry.topLevelOnly &&
    (facts.classesAround?.includes(root!) ||
      facts.bestaxAround?.includes(target))
  ) {
    return refuse(
      'context',
      target,
      `bestax \`${target}\` renders \`.${root}\` only when no other \`${target}\` is around it, and this element sits inside another \`.${root}\`, so it would lose the class; keep it as markup`
    );
  }
  // The other way round: one already inside renders the class now, and would
  // stop once this element became the `${target}` around it.
  if (entry.topLevelOnly && facts.bestaxInside?.includes(target)) {
    return refuse(
      'context',
      target,
      `bestax \`${target}\` renders \`.${root}\` only when no other \`${target}\` is around it, and this element holds one, which would lose the class once this one converts; keep this element as markup`
    );
  }
  // A component already in the file that picks its own render from its
  // children would change if this became one of them.
  const host = facts.bestaxAround?.find(name =>
    entry.changesParent?.includes(name)
  );
  if (host) {
    return refuse(
      'context',
      target,
      `this element sits inside a bestax \`${host}\`, which renders differently once one of its children is a \`${target}\`; keep it as markup, or convert the \`${host}\` and its children by hand`
    );
  }
  const wraps = entry.wrapsChildren;
  if (
    wraps &&
    (!wraps.when || mayCarry(wraps.when)) &&
    (facts.hasChildren || wraps.whenEmpty) &&
    !facts.childTargets?.some(child => wraps.unless.includes(child))
  ) {
    return refuse(
      'children',
      target,
      `bestax \`${target}\` renders its children inside a \`.${wraps.in}\` of its own unless one of them is a ${orList(wraps.unless)}, so this element stays markup`
    );
  }
  const counts = entry.countsChildren;
  const counted = facts.childElements?.every(
    child =>
      child.tag === counts?.tag &&
      child.tokens === undefined &&
      child.attributes.size === 0 &&
      !child.hasSpread &&
      child.isEmpty
  );
  if (counts && !counted) {
    return refuse(
      'children',
      target,
      `bestax \`${target}\` renders this element's children itself, \`${counts.prop}\` bare, empty <${counts.tag}>s, so it converts only when its children are just that; keep it as markup`
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
  for (const [name, rule] of Object.entries(entry.writesAttr ?? {})) {
    const value = attributes.get(name);
    if (!rule.on.includes(tag) || value === undefined) continue;
    if (typeof value !== 'string' || !rule.keeps.includes(value)) {
      return refuse(
        'attr',
        name,
        `bestax \`${target}\` keeps a <${tag}>'s \`${name}\` only as ${orList(rule.keeps)}, and writes \`${name}="${rule.fallback}"\` in place of anything else, so this one converts only as one of those, written out; keep this element as markup`
      );
    }
  }
  for (const [name, tags] of Object.entries(entry.dropsAttr ?? {})) {
    if (attributes.has(name) && inTagSet(tags, tag)) {
      // Bulma greys out `.button[disabled]` on any tag, so there it is not
      // inert: dropping it changes how the element looks.
      const visible = name === 'disabled' && target === 'Button';
      // A `name` on an <a> still names the target of a `#fragment` link.
      const anchored = name === 'name' && tag === 'a';
      return refuse(
        'drops',
        target,
        visible
          ? `bestax \`${target}\` drops \`disabled\` on a <${tag}>, and Bulma styles a disabled \`.${rootLabel(facts.tokens)}\` on any tag, so converting would change how it looks; keep this element as markup`
          : anchored
            ? `bestax \`${target}\` drops \`name\` on an <a>, where it still names the target of a \`#fragment\` link; keep this element as markup, or move the target to an \`id\`, then re-run`
            : `bestax \`${target}\` drops \`${name}\` on a <${tag}>, where it does nothing anyway; remove it, then re-run`
      );
    }
  }

  // ---- Tokens → props ---------------------------------------------------------
  const fromTokens = propsFrom(entry, tokens, tag, root, attributes);
  const { writes, converted } = fromTokens;
  numbers.push(...fromTokens.numbers);

  // ---- The tag ------------------------------------------------------------
  let renders = entry.tag!;
  if (entry.sizeDrivesTag && tag !== 'p' && writes.has('size')) {
    renders = `h${writes.get('size')}`;
  }
  let as: string | undefined;
  if (renders !== tag) {
    const reachable = entry.as === 'any' || (entry.as?.includes(tag) ?? false);
    if (!reachable) {
      if (entry.otherTagsStay?.tags.includes(tag)) {
        return { conversion: null, todos };
      }
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
  if (counts) {
    props.push([counts.prop, String(facts.childElements!.length)]);
    numbers.push(counts.prop);
  }
  // A class a condition adds becomes the boolean prop that renders it, set to
  // that condition, when it is one of the root's flags on its own: the
  // component renders it exactly when the condition is truthy, as the joiner
  // does. Anything else a condition adds stays in the joiner call.
  const parts = facts.conditional ?? [];
  const conditional: Array<[string, string]> = [];
  let conditionalStays = false;
  const places = (token: string) =>
    parts.filter(part => part.includes(token)).length +
    (tokens.includes(token) ? 1 : 0);
  const paired = new Set(Object.values(entry.absorbs?.pairs ?? {}));
  const impure = new Set(facts.impure ?? []);
  let impureStays = false;
  parts.forEach((part, index) => {
    const [token] = part;
    const modifier =
      part.length === 1 && places(token) === 1 && !paired.has(token)
        ? modifierFor(entry, token)
        : undefined;
    const [write, ...more] = modifier?.writes ?? [];
    const flag =
      write !== undefined &&
      more.length === 0 &&
      write.value === undefined &&
      !modifier!.onlyTrue &&
      (!modifier!.tagIn || modifier!.tagIn.includes(tag)) &&
      (!modifier!.needsAttr || attributes.has(modifier!.needsAttr.name)) &&
      !writes.has(write.prop) &&
      !conditional.some(([prop]) => prop === write.prop);
    // Written as a prop, the condition is evaluated before any left in the
    // call ahead of it, which is safe only when neither can have side effects.
    const reorders = conditionalStays && (impureStays || impure.has(index));
    if (flag && !reorders) {
      conditional.push([write.prop, token]);
    } else {
      conditionalStays = true;
      if (impure.has(index)) impureStays = true;
    }
  });

  const rest = tokens.filter(token => !converted.has(token));
  if (entry.classNameReplaces && (rest.length > 0 || conditionalStays)) {
    return refuse(
      'attr',
      'className',
      `bestax \`${target}\` writes a \`className\` it's given in place of \`.${root}\`, so this converts only with no other class; keep it as markup`
    );
  }
  return {
    conversion: {
      target,
      props,
      className: rest.length > 0 ? rest.join(' ') : null,
      drop,
      numbers,
      ...(absorbed ? { absorbs: absorbed } : {}),
      ...(counts || entry.rendersText !== undefined
        ? { rendersChildren: true as const }
        : {}),
      ...(parent ? { replacesParent: true as const } : {}),
      ...(conditional.length > 0 ? { conditional } : {}),
    },
    todos,
  };
}

/**
 * What an element's classes become on `entry`'s target: the props they
 * write, the classes that leave `className`, and the props written as
 * numbers. The group rules apply, so a helper the target would drop (a
 * base `display` beside a per-viewport one, a flex-container helper with no
 * flex `display`) stays a class, and so does a modifier missing the
 * attribute it needs.
 */
function propsFrom(
  entry: RootEntry,
  tokens: readonly string[],
  tag: string,
  root: string | undefined,
  attributes: ReadonlyMap<string, unknown>
): {
  writes: Map<string, string | true>;
  converted: Set<string>;
  numbers: string[];
} {
  const numbers: string[] = [];
  // What the root itself needs comes first, so no class can take its prop.
  const writes = new Map<string, string | true>(
    (entry.writes ?? []).map(write => [write.prop, write.value ?? true])
  );
  /** The tokens each written prop came from, so a group rule can undo it. */
  const sourceOf = new Map<string, string>();
  const groupOf = new Map<string, string>();
  const converted = new Set<string>(root ? [root] : []);

  for (const token of tokens) {
    if (converted.has(token)) continue;
    const modifier = modifierFor(entry, token);
    if (modifier) {
      if (modifier.tagIn && !modifier.tagIn.includes(tag)) continue;
      if (modifier.needsAttr && !attributes.has(modifier.needsAttr.name)) {
        continue;
      }
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
  return { writes, converted, numbers };
}

type Refuse = (kind: string, token: string, message: string) => Plan;

/** `a`, `a or b`, `a, b or c`, each in backticks. */
function orList(names: readonly string[], word = 'or'): string {
  const quoted = names.map(name => `\`${name}\``);
  return quoted.length > 1
    ? `${quoted.slice(0, -1).join(', ')} ${word} ${quoted[quoted.length - 1]}`
    : quoted[0];
}

/** `a`, `a and b`, `a, b and c`, each in backticks. */
function andList(names: readonly string[]): string {
  return orList(names, 'and');
}

/**
 * The only child an entry's target renders itself (`.select`'s `<select>`):
 * what its classes become, and the attributes the target is given. It
 * converts with the element only when the target would render it exactly
 * as written. `where` names the element for a message.
 */
function absorb(
  facts: ElementFacts,
  where: string,
  entry: RootEntry,
  target: string,
  refuse: Refuse
):
  | Plan
  | {
      attributes: ReadonlyMap<string, string | true | null>;
      absorbed: NonNullable<Conversion['absorbs']>;
    } {
  const spec = entry.absorbs!;
  const after = spec.after;
  // With an element after the child, the two are the element's children.
  const [child, next, ...more] = after
    ? (facts.childElements ?? [])
    : [facts.soleChild];
  const itself = `bestax \`${target}\` renders the <${spec.tag}> inside ${where} itself`;
  if (
    child?.tag !== spec.tag ||
    more.length > 0 ||
    (next && next.tag !== after?.tag)
  ) {
    return refuse(
      'children',
      target,
      after
        ? `${itself}, and a \`${after.target}\` after it from among its children, so this element converts only around a single <${spec.tag}>, and at most one <${after.tag}> after it, with nothing else beside them`
        : `${itself}, so this element converts only around a single <${spec.tag}>, with nothing else beside it`
    );
  }
  if (
    next &&
    (next.tokens !== undefined ||
      next.attributes.size > 0 ||
      next.hasSpread ||
      next.isEmpty)
  ) {
    return refuse(
      'children',
      after!.target,
      `${itself}, and the <${after!.tag}> after it as a \`${after!.target}\`, which this converts only bare and holding its items, as Bulma nests one; keep this element as markup, or convert it by hand`
    );
  }
  if (entry.requiresChildren && child.isEmpty && !next) {
    return refuse(
      'children',
      target,
      `bestax \`${target}\` requires children, and renders the <${spec.tag}>'s as its own, so this element converts only when the <${spec.tag}> inside holds something; keep it as markup`
    );
  }
  if (child.hasSpread) {
    return refuse(
      'spread',
      target,
      `the <${spec.tag}> inside spreads props, which bestax \`${target}\` may read differently than the <${spec.tag}> did; convert the two to \`${target}\` by hand`
    );
  }
  if (child.tokens === null) {
    return refuse(
      'dynamic-class',
      target,
      `the <${spec.tag}> inside has a computed \`className\`, which the codemod does not read there; convert the two to bestax \`${target}\` by hand, turning each condition into its prop`
    );
  }
  if (child.tokens?.length === 0) {
    return refuse(
      'attr',
      'className',
      `the <${spec.tag}> inside has an empty \`className\`, which renders \`class=""\`, and bestax \`${target}\` renders it with no class attribute; drop the empty \`className\`, then re-run`
    );
  }
  const modifiers = spec.modifiers ?? {};
  const props: Array<[string, string | true]> = [];
  for (const token of child.tokens ?? []) {
    const modifier = Object.hasOwn(modifiers, token)
      ? modifiers[token]
      : undefined;
    if (!modifier) {
      const allowed = Object.keys(modifiers);
      return refuse(
        'attr',
        'className',
        `${itself}, with no class on it${allowed.length > 0 ? ` but ${orList(allowed)}` : ''}, so its \`${token}\` would be lost; keep this element as markup`
      );
    }
    for (const write of modifier.writes) {
      props.push([write.prop, write.value ?? true]);
    }
  }

  // A number literal is carried over as written, like any other expression.
  const given = (value: string | number | true | null) =>
    typeof value === 'number' ? null : value;

  if (spec.attributesOn === 'split') {
    // Each keeps its own share: the target puts `elementProps` on the
    // element, and everything else on the child.
    const onElement = spec.elementProps ?? [];
    const stray = [...facts.attributes.keys()].find(
      name => name !== 'key' && !onElement.includes(name)
    );
    if (stray !== undefined) {
      return refuse(
        'attr',
        stray,
        `bestax \`${target}\` puts ${andList(['className', ...onElement])} on the <${facts.tag}>, and everything else on the <${spec.tag}> inside, so this element's \`${stray}\` would move there; keep this element as markup`
      );
    }
    const moved = [...child.attributes.keys()].find(
      name => name === 'key' || onElement.includes(name)
    );
    if (moved !== undefined) {
      return refuse(
        'attr',
        moved,
        moved === 'key'
          ? `the <${spec.tag}> inside has a \`key\`, which would move up to bestax \`${target}\` in place of this element's; keep this element as markup`
          : `bestax \`${target}\` puts \`${moved}\` on the <${facts.tag}>, so the <${spec.tag}>'s would move there; keep this element as markup`
      );
    }
    return {
      attributes: new Map([
        ...facts.attributes,
        ...[...child.attributes].map(
          ([name, value]): [string, string | true | null] => [
            name,
            given(value),
          ]
        ),
      ]),
      absorbed: {
        props,
        renames: [],
        drop: [],
        ...(next && { after: after!.target }),
      },
    };
  }

  if (spec.attributesOn === 'element') {
    // The ones the target takes as its own props move up with the child's
    // other props, and it writes them back on the child.
    const taken = spec.childProps ?? [];
    const name = [...child.attributes.keys()].find(
      found => !taken.includes(found)
    );
    if (name !== undefined) {
      return refuse(
        'attr',
        name,
        `${itself}, with no attributes${taken.length > 0 ? ` but ${orList(taken)}` : ''}, so its \`${name}\` would be lost; keep this element as markup`
      );
    }
    return {
      attributes: facts.attributes,
      absorbed: { props, renames: [], drop: [] },
    };
  }

  // The target puts what it is given on the child, so the element can carry
  // nothing but its `key`, which stays with the component in its place.
  const own = [...facts.attributes.keys()].find(name => name !== 'key');
  if (own !== undefined) {
    return refuse(
      'attr',
      own,
      `bestax \`${target}\` puts the attributes it is given on the <${spec.tag}> inside ${where}, so this element's \`${own}\` would move there; move it onto the <${spec.tag}> if that is what you want, then re-run`
    );
  }
  if (child.attributes.has('key')) {
    return refuse(
      'attr',
      'key',
      `the <${spec.tag}> inside has a \`key\`, which would move up to bestax \`${target}\` in place of this element's; keep this element as markup`
    );
  }
  const drop: string[] = [];
  for (const [name, token] of Object.entries(spec.pairs ?? {})) {
    const withClass = facts.tokens.includes(token);
    if (withClass && child.attributes.get(name) === true) {
      drop.push(name);
    } else if (withClass || child.attributes.has(name)) {
      return refuse(
        'attr',
        name,
        `bestax \`${target}\` renders \`${name}\` on the <${spec.tag}> and \`.${token}\` on this element together, from one prop, so the two convert only as a pair, with \`${name}\` written bare; keep this element as markup`
      );
    }
  }
  const attributes = new Map<string, string | true | null>();
  const renames: Array<[string, string]> = [];
  for (const [name, value] of child.attributes) {
    if (drop.includes(name)) continue;
    const rename =
      spec.renames && Object.hasOwn(spec.renames, name)
        ? spec.renames[name]
        : undefined;
    if (!rename) {
      attributes.set(name, given(value));
      continue;
    }
    // `SelectBase` writes `multipleSize` back as `size` only when it holds a
    // number, and an expression may not: only a literal converts. A string
    // one is held to a number's spelling below, with the target's numbers.
    if (
      !drop.includes(rename.beside) ||
      (typeof value !== 'number' && typeof value !== 'string')
    ) {
      return refuse(
        'attr',
        name,
        `bestax \`${target}\` writes the <${spec.tag}>'s \`${name}\` only beside \`${rename.beside}\`, and only from a number in \`${rename.to}\`, so it converts only as a number written out (\`${name}={4}\`); keep this element as markup, or convert it by hand if \`${name}\` is always a number`
      );
    }
    if (child.attributes.has(rename.to)) {
      return refuse(
        'attr',
        rename.to,
        `\`${rename.to}\` is also a bestax \`${target}\` prop, which would read it differently; rename or drop the attribute, then re-run`
      );
    }
    renames.push([name, rename.to]);
    attributes.set(rename.to, given(value));
  }
  return { attributes, absorbed: { props, renames, drop } };
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
