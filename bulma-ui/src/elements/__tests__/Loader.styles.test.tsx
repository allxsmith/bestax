// Bulma spins `.loader` and the `is-loading` rings on buttons, controls and
// selects, and `scss/elements/_loader.scss` stops them under
// `prefers-reduced-motion: reduce`. Its indeterminate `.progress` bar and its
// skeleton pulse get the same treatment from `_progress.scss` and
// `_skeleton.scss`. Those overrides meet Bulma's own rules in every
// stylesheet bestax publishes, and they do not agree on which comes first, so
// a check that only looks for the override's text proves nothing about which
// rule wins.
//
// jsdom evaluates no media query, so this resolves the cascade itself, the
// way a browser would: every rule that sets an animation's name or duration
// on an element (or its `::after`) is ranked by importance, then specificity,
// then source order. It renders the real components, so the elements are the
// ones the library emits, and runs over every stylesheet `package.json`
// publishes, plus `extras.css` linked on either side of Bulma's own CSS.
//
// The components only cover the animations someone thought to list, so each
// sheet is also read for every rule that starts an animation, whatever the
// partial, and the plainest element that rule matches has to hold still under
// reduced motion too. A rule the walk cannot place, a selector it cannot build
// an element for, or a value it cannot read fails the test rather than
// dropping out of that list.
//
// Bulma draws each ring with two `transparent` sides, and forced colors
// paints those in the text color like any other border, which closes the
// ring. `_loader.scss` sets them to `Canvas` there, so the same walk resolves
// the open sides' colors with forced colors on, and checks each ring stays
// open.
import fs from 'fs';
import path from 'path';
import React from 'react';
import * as sass from 'sass';
import { render } from '@testing-library/react';
import { ConfigProvider } from '../../helpers/Config';
import {
  Autocomplete,
  Button,
  Control,
  DateInput,
  DateTimeInput,
  Icon,
  Input,
  LinkButton,
  Loader,
  Loading,
  Numberinput,
  Progress,
  Select,
  SelectBase,
  Sidebar,
  Skeleton,
  Tag,
  Taginput,
  TextArea,
  TimeInput,
  Title,
  ToggleButton,
} from '../../index';

const PKG = path.resolve(__dirname, '../../..');
const SCSS = path.join(PKG, 'src', 'scss');

const compile = (file: string) =>
  sass.compile(path.join(SCSS, file), {
    loadPaths: [path.resolve(PKG, '../node_modules')],
    quietDeps: true,
    logger: sass.Logger.silent,
  }).css;

// Resolved through package.json: jest maps any `.css` specifier to a stub.
const bulmaCss = () =>
  fs.readFileSync(
    path.join(
      path.dirname(require.resolve('bulma/package.json')),
      'css',
      'bulma.css'
    ),
    'utf8'
  );

/**
 * Every stylesheet the package publishes, read off `exports` rather than
 * listed here, so a new flavor is checked the day it ships. Each one is built
 * from the SCSS file of the same name under `src/scss`.
 */
function publishedStylesheets(): string[] {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(PKG, 'package.json'), 'utf8')
  ) as { exports: Record<string, { default?: string }> };
  const targets = new Set<string>();
  for (const entry of Object.values(manifest.exports)) {
    const target = entry?.default;
    if (target?.endsWith('.css')) targets.add(target);
  }
  return [...targets]
    .map(target => target.replace(/^\.\/dist\//, '').replace(/\.css$/, '.scss'))
    .sort();
}

const splitSelectors = (list: string): string[] => {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const ch = list[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      out.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(list.slice(start).trim());
  return out;
};

type Setting = { value: string; important: boolean };

type Rule = {
  selectors: string[];
  properties: string[];
  /** The `animation-name` the rule sets, from the longhand or the shorthand. */
  name: Setting | null;
  /** The `animation-duration` the rule sets, likewise. */
  duration: Setting | null;
  /** The `border-top-color` the rule sets, from the longhand or a shorthand. */
  top: Setting | null;
  /** The `border-right-color` the rule sets, likewise. */
  right: Setting | null;
  /** The `border-bottom-color` the rule sets, likewise. */
  bottom: Setting | null;
  /** The `border-left-color` the rule sets, likewise. */
  left: Setting | null;
  /** Every declaration the rule makes, by the property it was written with. */
  values: Record<string, Setting>;
  order: number;
  reducedMotionOnly: boolean;
  forcedColorsOnly: boolean;
};

/** What the user's settings are, for the rules that depend on them. */
type When = { reducedMotion?: boolean; forcedColors?: boolean };

type Side = 'top' | 'right' | 'bottom' | 'left';

/**
 * The logical color longhand for each side, read the way a horizontal,
 * left-to-right page draws it, which is how the rest of this file reads a
 * page. jsdom keeps a logical longhand as a property of its own, so without
 * this a ring opened on its inline end reads as closed.
 */
const LOGICAL_COLOR: Record<Side, string> = {
  top: 'border-block-start-color',
  right: 'border-inline-end-color',
  bottom: 'border-block-end-color',
  left: 'border-inline-start-color',
};

/** Top-level tokens of a value, keeping `var(…)` and other functions whole. */
const tokensOf = (value: string): string[] => {
  const out: string[] = [];
  let depth = 0;
  let token = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (/\s/.test(ch) && depth === 0) {
      if (token) out.push(token);
      token = '';
    } else token += ch;
  }
  if (token) out.push(token);
  return out;
};

const KEYWORD =
  /^(infinite|normal|reverse|alternate|alternate-reverse|forwards|backwards|both|running|paused|ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end)$/;

/**
 * The name and duration an `animation` shorthand sets. The first time is the
 * duration, and a `var(…)` counts as one, since that is how the partials
 * theme it. That reading is refused when nothing else names the animation,
 * as the `var(…)` may be the name. A shorthand with no name or no time
 * resets that longhand, to `none` and `0s`.
 */
function shorthand(value: string): { name: string; duration: string } {
  if (splitSelectors(value).length > 1) {
    throw new Error(
      `\`animation: ${value}\` lists more than one animation, which this ` +
        'test does not resolve. Extend `shorthand` before trusting a result.'
    );
  }
  let name: string | undefined;
  let duration: string | undefined;
  for (const token of tokensOf(value)) {
    if (/^[+-]?[\d.]+m?s$/.test(token) || token.startsWith('var(')) {
      duration ??= token;
    } else if (
      // The name is what is left once the keywords, the iteration count
      // and any timing function are set aside.
      !KEYWORD.test(token) &&
      !/^[\d.]+$/.test(token) &&
      !token.includes('(')
    ) {
      name ??= token;
    }
  }
  if (name === undefined && duration?.startsWith('var(')) {
    throw new Error(
      `\`animation: ${value}\` names no animation, so the \`var(…)\` read as ` +
        'its duration may be its name. Extend `shorthand` before trusting ' +
        'a result.'
    );
  }
  return { name: name ?? 'none', duration: duration ?? '0s' };
}

/** Every style rule in the sheet, in source order, with its media context. */
function rulesOf(css: string): Rule[] {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const out: Rule[] = [];
  const walk = (
    list: CSSRuleList,
    reducedMotionOnly: boolean,
    forcedColorsOnly: boolean
  ) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSMediaRule) {
        const media = rule.media.mediaText;
        // Read below as a plain match, so a negated or listed query would
        // apply its rules to the wrong users.
        if (
          /prefers-reduced-motion|forced-colors/.test(media) &&
          /\bnot\b|\bor\b|,/.test(media)
        ) {
          throw new Error(
            `@media ${media} negates or lists a reduced-motion or ` +
              'forced-colors query, which this test does not resolve. ' +
              'Extend `rulesOf` before trusting a result.'
          );
        }
        // A user who asked for less motion never matches `no-preference`,
        // and one in forced colors never matches `none`. The checks below
        // are about those users.
        if (/prefers-reduced-motion:\s*no-preference/.test(media)) continue;
        if (/forced-colors:\s*none/.test(media)) continue;
        // Anything left is for those users, the boolean form included:
        // `(forced-colors)` means `active`, as `(prefers-reduced-motion)`
        // means `reduce`.
        walk(
          rule.cssRules,
          reducedMotionOnly || /prefers-reduced-motion/.test(media),
          forcedColorsOnly || /forced-colors/.test(media)
        );
      } else if (rule instanceof CSSStyleRule) {
        const decl = rule.style;
        const properties = Array.from(
          { length: decl.length },
          (_, i) => decl[i]
        );
        // jsdom keeps the shorthand whole rather than expanding it.
        const longhand = (prop: 'name' | 'duration'): Setting | null => {
          for (const p of [`animation-${prop}`, 'animation']) {
            const value = decl.getPropertyValue(p).trim();
            if (!value) continue;
            return {
              value: p === 'animation' ? shorthand(value)[prop] : value,
              important: decl.getPropertyPriority(p) === 'important',
            };
          }
          return null;
        };
        // Likewise for a side's color: the longhand, its logical twin, then
        // each shorthand that sets it. A shorthand is kept whole, so it never
        // reads as a single color.
        const side = (name: Side): Setting | null => {
          for (const p of [
            `border-${name}-color`,
            LOGICAL_COLOR[name],
            `border-${name}`,
            'border-color',
            'border',
          ]) {
            const value = decl.getPropertyValue(p).trim();
            if (!value) continue;
            // One color per side would have to be picked out of it by
            // position, which `colorOf` doesn't do.
            if (p === 'border-color' && tokensOf(value).length > 1) {
              throw new Error(
                `\`border-color: ${value}\` gives the sides different colors, ` +
                  'which this test does not split. Extend `side` before ' +
                  'trusting a result.'
              );
            }
            return {
              value,
              important: decl.getPropertyPriority(p) === 'important',
            };
          }
          return null;
        };
        out.push({
          selectors: splitSelectors(rule.selectorText),
          properties,
          name: longhand('name'),
          duration: longhand('duration'),
          top: side('top'),
          right: side('right'),
          bottom: side('bottom'),
          left: side('left'),
          values: Object.fromEntries(
            properties.map(p => [
              p,
              {
                value: decl.getPropertyValue(p).trim(),
                important: decl.getPropertyPriority(p) === 'important',
              },
            ])
          ),
          order: out.length,
          reducedMotionOnly,
          forcedColorsOnly,
        });
      } else if (
        'cssRules' in rule &&
        !/^@(-\w+-)?keyframes\b/.test(rule.cssText) &&
        /[{;\s]animation(-[a-z-]+)?\s*:/.test(rule.cssText)
      ) {
        // `@supports`, `@layer`, `@container` and the like change when or in
        // what order their rules apply, which this test does not model.
        // Bulma lays out its fixed grid in `@container`, which is no concern
        // here, but an animation set in one has to fail rather than go
        // unchecked. Keyframes hold no style rules.
        throw new Error(
          `${rule.cssText.split('{')[0].trim()} sets an animation in rules ` +
            'this test does not walk. Extend `rulesOf` before trusting a ' +
            'result.'
        );
      }
    }
  };
  try {
    walk(style.sheet!.cssRules, false, false);
  } finally {
    style.remove();
  }
  return out;
}

const PSEUDO = /::?(after|before)$/;

function matches(selector: string, el: Element, pseudo: string): boolean {
  const found = PSEUDO.exec(selector);
  if ((found ? `::${found[1]}` : '') !== pseudo) return false;
  const base = found ? selector.slice(0, found.index) : selector;
  if (base.includes('::')) return false;
  try {
    return el.matches(base || '*');
  } catch {
    // A selector jsdom cannot parse (a vendor pseudo-class, say) is not one
    // of the spinner rules this file is about.
    return false;
  }
}

/** Specificity of a plain compound selector; functional pseudos are refused. */
function specificity(selector: string): [number, number, number] {
  if (selector.includes('(')) {
    throw new Error(
      `${selector} styles a spinner and has a functional pseudo-class, which ` +
        'this test does not rank. Extend `specificity` before trusting a result.'
    );
  }
  const stripped = selector.replace(/\[[^\]]*\]/g, '.x');
  const ids = (stripped.match(/#[\w-]+/g) ?? []).length;
  const classes = (
    stripped.match(/\.[\w-]+|(?<!:):(?!after|before)[\w-]+/g) ?? []
  ).length;
  const types =
    (stripped.match(/(?:^|[\s>+~])[a-zA-Z][\w-]*/g) ?? []).length +
    (PSEUDO.test(stripped) ? 1 : 0);
  return [ids, classes, types];
}

const beats = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
};

/** One longhand on the element, as a browser would resolve it. */
function winning(
  rules: Rule[],
  el: Element,
  pseudo: string,
  when: When,
  prop: 'name' | 'duration' | Side
): string | null {
  let best: { rank: number[]; value: string } | null = null;
  for (const rule of rules) {
    const setting = rule[prop];
    if (
      !setting ||
      (rule.reducedMotionOnly && !when.reducedMotion) ||
      (rule.forcedColorsOnly && !when.forcedColors)
    ) {
      continue;
    }
    for (const selector of rule.selectors) {
      if (!matches(selector, el, pseudo)) continue;
      const rank = [
        setting.important ? 1 : 0,
        ...specificity(selector),
        rule.order,
      ];
      if (!best || beats(rank, best.rank)) {
        best = { rank, value: setting.value };
      }
    }
  }
  return best && best.value;
}

/**
 * Any property on the element as a browser would resolve it, read from the
 * first of `names` a rule sets: the longhand, then any shorthand that sets
 * it, which is kept whole. Ranked the way `winning` ranks the rest.
 */
function resolved(
  rules: Rule[],
  el: Element,
  pseudo: string,
  when: When,
  names: string[]
): string | null {
  let best: { rank: number[]; value: string } | null = null;
  for (const rule of rules) {
    const name = names.find(n => rule.values[n]);
    if (
      !name ||
      (rule.reducedMotionOnly && !when.reducedMotion) ||
      (rule.forcedColorsOnly && !when.forcedColors)
    ) {
      continue;
    }
    const setting = rule.values[name];
    for (const selector of rule.selectors) {
      if (!matches(selector, el, pseudo)) continue;
      const rank = [
        setting.important ? 1 : 0,
        ...specificity(selector),
        rule.order,
      ];
      if (!best || beats(rank, best.rank)) {
        best = { rank, value: setting.value };
      }
    }
  }
  return best && best.value;
}

/**
 * Whether an animation plays on the element. The name and the duration are
 * resolved apart, because a rule can set one and not the other: a more
 * specific selector can rename the animation, and a reduced-motion rule that
 * loses on the name still zeroes the duration, so nothing plays. A `var(…)`
 * duration is taken to be non-zero.
 */
function moves(
  rules: Rule[],
  el: Element,
  pseudo: string,
  reducedMotion: boolean
): boolean {
  const name = winning(rules, el, pseudo, { reducedMotion }, 'name') ?? 'none';
  const duration =
    winning(rules, el, pseudo, { reducedMotion }, 'duration') ?? '0s';
  return name !== 'none' && parseFloat(duration) !== 0;
}

/**
 * The plainest element a selector matches: each compound becomes an element
 * with exactly its tag and classes, nested in the one before it. A selector
 * that takes more than that fails here rather than being skipped, so no
 * animation goes unchecked.
 */
function witness(selector: string): { el: Element; pseudo: string } {
  const found = PSEUDO.exec(selector);
  const base = found ? selector.slice(0, found.index) : selector;
  let el: Element = document.createElement('div');
  for (const part of base.split(/[\s>]+/).filter(Boolean)) {
    // Only a progress bar with no value is `:indeterminate`.
    const tag =
      /^[a-zA-Z][\w-]*/.exec(part)?.[0] ??
      (part.includes(':indeterminate') ? 'progress' : 'div');
    const next = document.createElement(tag);
    for (const [, name] of part.matchAll(/\.([\w-]+)/g)) {
      next.classList.add(name);
    }
    el = el.appendChild(next);
  }
  let built = false;
  try {
    built = el.matches(base);
  } catch {
    // jsdom cannot parse it; reported below like any other miss.
  }
  if (!built) {
    throw new Error(
      `${selector} sets an animation and no element could be built to ` +
        'match it. Extend `witness` before trusting a result.'
    );
  }
  return { el, pseudo: found ? `::${found[1]}` : '' };
}

/**
 * Every selector in the rules that starts an animation, checked on the
 * plainest element it matches. `stillMoving` holds the ones that play under
 * reduced motion, including any a reduced-motion block starts itself, and
 * `idle` the ones that start outside such a block yet do not animate there,
 * which would leave the check on them vacuous.
 */
function unstopped(rules: Rule[]) {
  const outsideReduced = new Map<string, boolean>();
  for (const rule of rules) {
    if ((rule.name?.value ?? 'none') === 'none') continue;
    for (const selector of rule.selectors) {
      outsideReduced.set(
        selector,
        !!outsideReduced.get(selector) || !rule.reducedMotionOnly
      );
    }
  }
  const idle: string[] = [];
  const stillMoving: string[] = [];
  for (const [selector, outside] of outsideReduced) {
    const { el, pseudo } = witness(selector);
    if (outside && !moves(rules, el, pseudo, false)) idle.push(selector);
    if (moves(rules, el, pseudo, true)) stillMoving.push(selector);
  }
  return { checked: outsideReduced.size, idle, stillMoving };
}

const STYLE =
  /^(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)$/;
const WIDTH = /^(thin|medium|thick|[+-]?[\d.]+[a-z%]*|calc\(.*\))$/;

/**
 * The color in a side's winning value: the value itself for a color
 * longhand, or the part of a `border` shorthand that is neither a width nor
 * a style. A side nothing sets, or a shorthand with no color, is
 * `currentcolor`, as CSS has it.
 */
function colorOf(value: string | null): string {
  if (value === null) return 'currentcolor';
  const color = tokensOf(value)
    .filter(token => !STYLE.test(token) && !WIDTH.test(token))
    .pop();
  return color ?? 'currentcolor';
}

/** The CSS system colors: the colors a forced-colors theme picks. */
const SYSTEM =
  /^(Canvas|CanvasText|LinkText|VisitedText|ActiveText|ButtonFace|ButtonText|ButtonBorder|Field|FieldText|Highlight|HighlightText|SelectedItem|SelectedItemText|Mark|MarkText|GrayText|AccentColor|AccentColorText)$/;

/**
 * An inherited property on the element, or on its `::after` or `::before`,
 * in forced colors: read off the first of them, going up the tree, that a
 * rule sets it on.
 */
function inherited(
  rules: Rule[],
  el: Element,
  pseudo: string,
  property: string
): string | null {
  const own = (node: Element, p: string) =>
    resolved(rules, node, p, { forcedColors: true }, [property]);
  if (pseudo) {
    const value = own(el, pseudo);
    if (value) return value;
  }
  for (let node: Element | null = el; node; node = node.parentElement) {
    const value = own(node, '');
    if (value) return value;
  }
  return null;
}

/** The `forced-color-adjust` in effect, which is inherited. */
const forcing = (rules: Rule[], el: Element, pseudo: string) =>
  inherited(rules, el, pseudo, 'forced-color-adjust') ?? 'auto';

/**
 * Why a ring wouldn't read as an open ring in forced colors, or null when it
 * would. Where forcing paints it, the drawn sides come out in a text color,
 * so the open sides have to be Canvas, the page's own color, and the drawn
 * ones mustn't be. Where forcing is off, as it is on a loading button,
 * nothing is painted for it: the open sides have to be transparent, and the
 * drawn ones a system color the theme picks, since an author color comes
 * with no contrast promised. `inherit` reads the side off the element the
 * pseudo-element is on.
 */
function ringProblem(
  rules: Rule[],
  el: Element,
  pseudo: string
): string | null {
  const side = (name: Side) => {
    const value = winning(rules, el, pseudo, { forcedColors: true }, name);
    return value === 'inherit' && pseudo
      ? winning(rules, el, '', { forcedColors: true }, name)
      : value;
  };
  const [top, right, bottom, left] = (
    ['top', 'right', 'bottom', 'left'] as const
  ).map(name => colorOf(side(name)));
  if (forcing(rules, el, pseudo) === 'none') {
    if (top !== 'transparent' || right !== 'transparent') {
      return `forcing is off and its open sides are ${top} and ${right}`;
    }
    if (!SYSTEM.test(bottom) || !SYSTEM.test(left)) {
      return `forcing is off and it's drawn in ${bottom} and ${left}`;
    }
    return null;
  }
  if (top !== 'Canvas' || right !== 'Canvas') {
    return `its open sides are ${top} and ${right}`;
  }
  // Firefox paints a forced border in the element's text color and keeps a
  // transparent one transparent, so on an element whose text is hidden, as a
  // loading button's is, a forced ring doesn't show there at all.
  if (inherited(rules, el, pseudo, 'color') === 'transparent') {
    return 'forcing paints it in a transparent text color, which Firefox keeps';
  }
  if (bottom === 'Canvas' || left === 'Canvas') {
    return "it's drawn in Canvas, the page's own color";
  }
  return null;
}

/**
 * Every ring the sheet draws, read off the sheet rather than off a roster:
 * an element something spins, whose four sides aren't all one color, which
 * is how a spinner shows it's turning. Forced colors paints every side in
 * one color, so `closed` holds the rings `ringProblem` finds fault with
 * there, which would turn as a full circle or not show at all.
 */
function unopened(rules: Rule[]) {
  const spun = new Set<string>();
  for (const rule of rules) {
    if ((rule.name?.value ?? 'none') === 'none') continue;
    if (rule.reducedMotionOnly || rule.forcedColorsOnly) continue;
    rule.selectors.forEach(selector => spun.add(selector));
  }
  const rings: string[] = [];
  const closed: string[] = [];
  for (const selector of spun) {
    const { el, pseudo } = witness(selector);
    const sides = (['top', 'right', 'bottom', 'left'] as const).map(side =>
      colorOf(winning(rules, el, pseudo, {}, side))
    );
    if (new Set(sides).size < 2) continue;
    rings.push(selector);
    if (ringProblem(rules, el, pseudo) !== null) closed.push(selector);
  }
  return { rings, closed };
}

/**
 * Each component that draws Bulma's loader ring, or a ring of its own built
 * the same way, with the prop that turns it on.
 */
const RINGS: Array<[string, React.ReactElement]> = [
  ['Loader', <Loader key="x" />],
  [
    'Button isLoading',
    <Button key="x" isLoading>
      Save
    </Button>,
  ],
  [
    'LinkButton isLoading',
    <LinkButton key="x" isLoading>
      Save
    </LinkButton>,
  ],
  ['Control isLoading', <Control key="x" isLoading />],
  [
    'SelectBase isLoading',
    <SelectBase key="x" isLoading>
      <option>One</option>
    </SelectBase>,
  ],
  [
    'Select isLoading',
    <Select key="x" isLoading>
      <option>One</option>
    </Select>,
  ],
  ['Input isLoading', <Input key="x" isLoading />],
  ['TextArea isLoading', <TextArea key="x" isLoading />],
  ['Numberinput isLoading', <Numberinput key="x" isLoading />],
  ['DateInput isLoading', <DateInput key="x" isLoading />],
  ['TimeInput isLoading', <TimeInput key="x" isLoading />],
  ['DateTimeInput isLoading', <DateTimeInput key="x" isLoading />],
  ['Autocomplete loading', <Autocomplete key="x" data={[]} loading />],
  ['Taginput loading', <Taginput key="x" loading />],
];

/**
 * Each component that draws a loading animation, with the prop that turns it
 * on: the rings, the indeterminate progress bar and the skeleton pulse.
 */
const ANIMATED: Array<[string, React.ReactElement]> = [
  ...RINGS,
  // Not Bulma's ring: `_loading.scss` spins its own icon and stops it in
  // the same file, which holds whatever order the partial lands in.
  ['Loading active', <Loading key="x" active />],
  // A bar with no `value` is `:indeterminate`, and Bulma sweeps it.
  ['Progress indeterminate', <Progress key="x" />],
  ['Skeleton block', <Skeleton key="x" />],
  ['Skeleton lines', <Skeleton key="x" variant="lines" />],
  // The `skeleton` helper prop puts `is-skeleton` on any component.
  [
    'Title skeleton',
    <Title key="x" skeleton>
      Heading
    </Title>,
  ],
  // `hasSkeleton` pulses a `::after` over part of the text.
  [
    'Title hasSkeleton',
    <Title key="x" hasSkeleton>
      Heading
    </Title>,
  ],
  // `_sidebar.scss` turns off the sidebar's own transition under reduced
  // motion, so a pulsing sidebar meets a second reduced-motion rule.
  [
    'Sidebar skeleton',
    <Sidebar key="x" isOpen inline overlay={false} skeleton />,
  ],
];

/** Every (element, pseudo) the stylesheet animates in this render. */
function animatedIn(container: Element, rules: Rule[]) {
  const found: Array<{ el: Element; pseudo: string }> = [];
  for (const el of Array.from(container.querySelectorAll('*'))) {
    for (const pseudo of ['', '::after', '::before']) {
      if (moves(rules, el, pseudo, false)) found.push({ el, pseudo });
    }
  }
  return found;
}

const tagOf = (el: Element) => {
  const cls = el.getAttribute('class');
  return `<${el.tagName.toLowerCase()}${cls === null ? '' : ` class="${cls}"`}>`;
};

// A skeleton line is a bare `<div>`, so its parent says which one it is.
const describeEl = (el: Element, pseudo: string) =>
  (el.hasAttribute('class') || !el.parentElement
    ? ''
    : `${tagOf(el.parentElement)} > `) +
  tagOf(el) +
  pseudo;

type Sheet = { label: string; prefix: string; css: () => string };

const SHEETS: Sheet[] = publishedStylesheets().flatMap((file): Sheet[] => {
  const source = fs.readFileSync(path.join(SCSS, file), 'utf8');
  const prefix = /\$class-prefix:\s*["']([^"']*)["']/.exec(source)?.[1] ?? '';
  // extras.css carries no Bulma; an app links its own, on either side.
  if (!/bulma\/sass(?:\/elements|['"])/.test(source)) {
    return [
      {
        label: `${file} linked before Bulma's CSS`,
        prefix,
        css: () => compile(file) + bulmaCss(),
      },
      {
        label: `${file} linked after Bulma's CSS`,
        prefix,
        css: () => bulmaCss() + compile(file),
      },
    ];
  }
  return [{ label: file, prefix, css: () => compile(file) }];
});

// The sheet-wide check is only as wide as what the rule walk collects, so
// anything the walk would misread has to fail rather than shrink the list.
describe('the cascade resolver', () => {
  it('checks an animation a reduced-motion block starts', () => {
    const rules = rulesOf(
      '@media (prefers-reduced-motion: reduce) { .x { animation: fade 1s; } }'
    );
    expect(unstopped(rules)).toEqual({
      checked: 1,
      idle: [],
      stillMoving: ['.x'],
    });
  });

  it.each([
    '@supports (display: grid) { .x { animation: spin 1s; } }',
    '@layer base { .x { animation: spin 1s; } }',
    '@container (min-width: 1px) { .x { animation: spin 1s; } }',
    '@media not all and (prefers-reduced-motion: reduce) { .x { animation: none; } }',
    '@media not all and (forced-colors: active) { .x { border-top-color: red; } }',
  ])('refuses rules it cannot place: %s', css => {
    expect(() => rulesOf(css)).toThrow('Extend `rulesOf`');
  });

  it('passes over a rule it does not walk when nothing in it animates', () => {
    expect(
      rulesOf('@container (min-width: 1px) { .x { color: red; } }')
    ).toEqual([]);
  });

  it('reads a side’s color from the longhand before the shorthand, and keeps a forced-colors rule to forced colors', () => {
    const rules = rulesOf(
      '.x { border: 2px solid red; border-top-color: transparent; } ' +
        '@media (forced-colors: active) { .x { border-top-color: Canvas !important; } } ' +
        '@media (forced-colors: none) { .x { border-top-color: blue !important; } }'
    );
    const el = document.createElement('div');
    el.className = 'x';
    expect(winning(rules, el, '', {}, 'top')).toBe('transparent');
    expect(winning(rules, el, '', { forcedColors: true }, 'top')).toBe(
      'Canvas'
    );
    expect(winning(rules, el, '', { forcedColors: true }, 'right')).toBe(
      '2px solid red'
    );
  });

  it.each([
    [
      '@media (forced-colors) { .x { border-top-color: Canvas; } }',
      'forcedColorsOnly',
    ],
    [
      '@media (prefers-reduced-motion) { .x { animation: none; } }',
      'reducedMotionOnly',
    ],
  ] as const)(
    'reads a query in its boolean form as the active one: %s',
    (css, flag) => {
      // `(forced-colors)` means `active`, and `(prefers-reduced-motion)`
      // means `reduce`, so the rule is for those users only.
      const rules = rulesOf(css);
      expect(rules).toHaveLength(1);
      expect(rules[0][flag]).toBe(true);
    }
  );

  it('finds a ring nobody listed, and lets it pass once its top and right are Canvas', () => {
    const ring =
      '.spinner { animation: spin 1s; border: 2px solid var(--x); border-top-color: transparent; }';
    expect(unopened(rulesOf(ring))).toEqual({
      rings: ['.spinner'],
      closed: ['.spinner'],
    });
    expect(
      unopened(
        rulesOf(
          ring +
            '@media (forced-colors: active) { .spinner { border-top-color: Canvas; border-right-color: Canvas; } }'
        )
      )
    ).toEqual({ rings: ['.spinner'], closed: [] });
  });

  it('lets a ring out of forcing pass only with transparent open sides and system-color drawn ones', () => {
    const ring =
      '.b::after { animation: spin 1s; border: 2px solid red; border-top-color: transparent; border-right-color: transparent; }';
    // Forcing off, and the ring still in its author color.
    expect(
      unopened(
        rulesOf(
          ring +
            '@media (forced-colors: active) { .b { forced-color-adjust: none; } }'
        )
      )
    ).toEqual({ rings: ['.b::after'], closed: ['.b::after'] });
    // Forcing off, Canvas open sides, which can differ from the surface.
    expect(
      unopened(
        rulesOf(
          ring +
            '@media (forced-colors: active) { .b { forced-color-adjust: none; border-color: ButtonText; } .b::after { border-color: inherit; border-top-color: Canvas; border-right-color: Canvas; } }'
        )
      )
    ).toEqual({ rings: ['.b::after'], closed: ['.b::after'] });
    // Forcing off, drawn in the button's system color, open onto its surface.
    expect(
      unopened(
        rulesOf(
          ring +
            '@media (forced-colors: active) { .b { forced-color-adjust: none; border-color: ButtonText; } .b::after { border-color: inherit; border-top-color: transparent; border-right-color: transparent; } }'
        )
      )
    ).toEqual({ rings: ['.b::after'], closed: [] });
  });

  it('fails a forced ring on an element whose text is transparent, which Firefox keeps', () => {
    expect(
      unopened(
        rulesOf(
          '.b { color: transparent; } ' +
            '.b::after { animation: spin 1s; border: 2px solid red; border-top-color: transparent; } ' +
            '@media (forced-colors: active) { .b::after { border-top-color: Canvas; border-right-color: Canvas; } }'
        )
      )
    ).toEqual({ rings: ['.b::after'], closed: ['.b::after'] });
  });

  it('reads a ring opened on its logical sides as a left-to-right page draws it', () => {
    // Timeline's pending ring opens its top and inline end, which is the
    // right in a left-to-right page, the side Bulma's loader opens.
    const ring =
      '.spinner { animation: spin 1s; border: 2px solid var(--x); border-block-start-color: transparent; border-inline-end-color: transparent; }';
    expect(unopened(rulesOf(ring))).toEqual({
      rings: ['.spinner'],
      closed: ['.spinner'],
    });
    expect(
      unopened(
        rulesOf(
          ring +
            '@media (forced-colors: active) { .spinner { border-block-start-color: Canvas; border-inline-end-color: Canvas; } }'
        )
      )
    ).toEqual({ rings: ['.spinner'], closed: [] });
  });

  it('takes a spinning box whose sides are all one color for something other than a ring', () => {
    expect(
      unopened(
        rulesOf(
          '.pulse { animation: pulse 1s; border: 1px solid red; } .bar { animation: sweep 1s; }'
        )
      )
    ).toEqual({ rings: [], closed: [] });
  });

  it('refuses a border-color that gives the sides different colors', () => {
    expect(() =>
      rulesOf('.x { border-color: red transparent red red; }')
    ).toThrow('Extend `side`');
  });

  it('refuses a shorthand whose only candidate name is a var()', () => {
    expect(() => rulesOf('.x { animation: var(--x) 1s; }')).toThrow(
      'Extend `shorthand`'
    );
  });
});

it('checks every published stylesheet', () => {
  // Floor against the manifest read going quietly empty.
  expect(publishedStylesheets()).toEqual(
    expect.arrayContaining(['bestax.scss', 'extras.scss'])
  );
  for (const file of publishedStylesheets()) {
    expect(fs.existsSync(path.join(SCSS, file))).toBe(true);
  }
});

describe.each(SHEETS)('$label', ({ prefix, css }) => {
  let rules: Rule[];
  beforeAll(() => {
    rules = rulesOf(css());
  }, 60000);

  it.each(ANIMATED)(
    '%s animates normally and stops under prefers-reduced-motion',
    (_label, element) => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>{element}</ConfigProvider>
      );
      const animated = animatedIn(container, rules);
      // It has to animate to begin with, or the check below is vacuous.
      expect(animated.length).toBeGreaterThan(0);
      const stillMoving = animated
        .filter(({ el, pseudo }) => moves(rules, el, pseudo, true))
        .map(({ el, pseudo }) => describeEl(el, pseudo));
      expect(stillMoving).toEqual([]);
    }
  );

  it('stops every animation it declares under prefers-reduced-motion', () => {
    // The roster above only sees the components on it. This reads the
    // animations off the sheet instead, so one added to any partial is
    // checked without anyone listing it.
    const { checked, idle, stillMoving } = unstopped(rules);
    // Floor against the rule walk going quietly empty.
    expect(checked).toBeGreaterThan(0);
    // It has to animate to begin with, or the check below is vacuous.
    expect(idle).toEqual([]);
    expect(stillMoving).toEqual([]);
  });

  it('changes nothing but the animation under prefers-reduced-motion', () => {
    // Each indicator has to stay drawn, so the override may not touch a
    // ring's border, the bar's gradient, a skeleton's fill, or any size or
    // display. Motion properties are the point of the override, so
    // `animation-*` and `transition-*` are allowed.
    const { container } = render(
      <ConfigProvider classPrefix={prefix}>
        {ANIMATED.map(([label, element]) => (
          <React.Fragment key={label}>{element}</React.Fragment>
        ))}
      </ConfigProvider>
    );
    const targets = animatedIn(container, rules);
    const extra = rules
      .filter(rule => rule.reducedMotionOnly)
      .filter(rule =>
        targets.some(({ el, pseudo }) =>
          rule.selectors.some(selector => matches(selector, el, pseudo))
        )
      )
      .flatMap(rule => rule.properties)
      .filter(
        property =>
          !property.startsWith('animation') &&
          !property.startsWith('transition')
      );
    expect(extra).toEqual([]);
  });

  it.each(RINGS)(
    '%s keeps its ring open in forced colors, and only there',
    (_label, element) => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>{element}</ConfigProvider>
      );
      const rings = animatedIn(container, rules);
      // It has to draw a ring to begin with, or the check below is vacuous.
      expect(rings.length).toBeGreaterThan(0);
      const sides = (when: When) =>
        rings.map(({ el, pseudo }) => ({
          ring: describeEl(el, pseudo),
          top: winning(rules, el, pseudo, when, 'top'),
          right: winning(rules, el, pseudo, when, 'right'),
        }));
      // Its open sides stay open: Canvas, the page's own color, which forced
      // colors leaves alone, or transparent where forcing is off.
      expect(
        rings.map(({ el, pseudo }) => ({
          ring: describeEl(el, pseudo),
          problem: ringProblem(rules, el, pseudo),
        }))
      ).toEqual(
        rings.map(({ el, pseudo }) => ({
          ring: describeEl(el, pseudo),
          problem: null,
        }))
      );
      // Anywhere else, the ring keeps the sides it had.
      for (const { top, right } of sides({})) {
        expect(top).not.toBe('Canvas');
        expect(right).not.toBe('Canvas');
      }
    }
  );

  it('opens every ring it draws in forced colors', () => {
    // The roster above only sees the components on it. This reads the
    // rings off the sheet instead, so one a partial or Bulma adds is
    // checked without anyone listing it.
    const { rings, closed } = unopened(rules);
    // Floor against the read going quietly empty.
    expect(rings).toContain(`.${prefix}loader`);
    expect(closed).toEqual([]);
  });

  it('changes nothing but a ring’s border colors in forced colors', () => {
    const { container } = render(
      <ConfigProvider classPrefix={prefix}>
        {RINGS.map(([label, element]) => (
          <React.Fragment key={label}>{element}</React.Fragment>
        ))}
      </ConfigProvider>
    );
    const targets = animatedIn(container, rules);
    // Each ring has to stay drawn as it was, so a rule here may set its
    // border colors and nothing else: Canvas for the open sides where
    // forcing paints it, and transparent and `inherit` for a loading
    // button's, where it doesn't. `ringProblem` checks what they add up to.
    const extra = rules
      .filter(rule => rule.forcedColorsOnly)
      .filter(rule =>
        targets.some(({ el, pseudo }) =>
          rule.selectors.some(selector => matches(selector, el, pseudo))
        )
      )
      .flatMap(rule =>
        rule.properties.map(
          property => `${property}: ${rule.values[property].value}`
        )
      )
      .filter(
        declaration =>
          !/^border(-(top|right|bottom|left|(block|inline)-(start|end)))?-color: (Canvas|transparent|inherit)$/.test(
            declaration
          )
      );
    expect(extra).toEqual([]);
  });

  /**
   * Each kind of loading button, with what forced colors gives it when it's
   * idle, which is what it keeps while it loads: a `<button>` a button's
   * surface and text color, a link a link's, anything else the page's own.
   * A variant with no surface of its own has none, and shows the page
   * through it, so it pairs with the page's text color unless it's a link.
   * A disabled one keeps the gray forced colors gives a disabled control.
   */
  const LOADING_LOOKS: Array<
    [string, React.ReactElement, { surface: string; border: string }]
  > = [
    [
      'Button isLoading',
      <Button key="x" isLoading>
        Save
      </Button>,
      { surface: 'ButtonFace', border: 'ButtonText' },
    ],
    [
      'Button color="primary" isLoading',
      <Button key="x" color="primary" isLoading>
        Save
      </Button>,
      { surface: 'ButtonFace', border: 'ButtonText' },
    ],
    [
      'Button color="ghost" isLoading',
      <Button key="x" color="ghost" isLoading>
        Save
      </Button>,
      { surface: 'transparent', border: 'CanvasText' },
    ],
    [
      'Button color="text" isLoading',
      <Button key="x" color="text" isLoading>
        Save
      </Button>,
      { surface: 'transparent', border: 'CanvasText' },
    ],
    [
      'Button isOutlined isLoading',
      <Button key="x" color="primary" isOutlined isLoading>
        Save
      </Button>,
      { surface: 'transparent', border: 'CanvasText' },
    ],
    [
      'LinkButton isLoading',
      <LinkButton key="x" isLoading>
        Save
      </LinkButton>,
      { surface: 'transparent', border: 'CanvasText' },
    ],
    [
      'LinkButton variant="underline" isLoading',
      <LinkButton key="x" variant="underline" isLoading>
        Save
      </LinkButton>,
      { surface: 'transparent', border: 'CanvasText' },
    ],
    [
      'Button as="a" href isLoading',
      <Button key="x" as="a" href="#" isLoading>
        Save
      </Button>,
      { surface: 'Canvas', border: 'LinkText' },
    ],
    [
      'LinkButton as="a" href isLoading',
      <LinkButton key="x" as="a" href="#" isLoading>
        Save
      </LinkButton>,
      { surface: 'transparent', border: 'LinkText' },
    ],
    [
      'Button as="a" isLoading, with no href',
      <Button key="x" as="a" isLoading>
        Save
      </Button>,
      { surface: 'Canvas', border: 'CanvasText' },
    ],
    [
      'Button as="span" isLoading',
      <Button key="x" as="span" isLoading>
        Save
      </Button>,
      { surface: 'Canvas', border: 'CanvasText' },
    ],
    [
      'Button isDisabled isLoading',
      <Button key="x" isDisabled isLoading>
        Save
      </Button>,
      { surface: 'ButtonFace', border: 'GrayText' },
    ],
    [
      'Button color="ghost" isDisabled isLoading',
      <Button key="x" color="ghost" isDisabled isLoading>
        Save
      </Button>,
      { surface: 'transparent', border: 'GrayText' },
    ],
    [
      'Button isLoading in a disabled fieldset',
      <fieldset key="x" disabled>
        <Button isLoading>Save</Button>
      </fieldset>,
      { surface: 'ButtonFace', border: 'GrayText' },
    ],
  ];

  it('checks the loading buttons on the roster', () => {
    const labels = LOADING_LOOKS.map(([label]) => label);
    for (const [label] of RINGS.filter(([name]) =>
      /Button isLoading$/.test(name)
    )) {
      expect(labels).toContain(label);
    }
  });

  it.each(LOADING_LOOKS)(
    '%s hides its label in forced colors and keeps the surface it has when idle',
    (_label, element, look) => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>{element}</ConfigProvider>
      );
      const button = container.querySelector(`.${prefix}button`)!;
      const forced = (names: string[]) =>
        resolved(rules, button, '', { forcedColors: true }, names);
      // Forced colors paints any text color in the theme's own, so the label
      // Bulma hides with `transparent` would show. With forcing off on the
      // button, it stays transparent, and every other color it shows is a
      // system one the theme picks, paired with the surface it shows.
      expect(forced(['forced-color-adjust'])).toBe('none');
      expect(forced(['color'])).toBe('transparent');
      expect(forced(['background-color', 'background'])).toBe(look.surface);
      for (const side of ['top', 'right', 'bottom', 'left'] as const) {
        expect(winning(rules, button, '', { forcedColors: true }, side)).toBe(
          look.border
        );
      }
      // Focused, it's outlined in its border color. A browser won't focus a
      // disabled one, though jsdom will, so there's no outline to check.
      if (!button.matches(':disabled')) {
        button.setAttribute('tabindex', '0');
        (button as HTMLElement).focus();
        expect(
          colorOf(
            resolved(rules, button, '', { forcedColors: true }, [
              'outline-color',
              'outline',
            ])
          )
        ).toBe(look.border);
      }
      // Its ring stays out of forcing with it, drawn in its border color and
      // open onto its surface.
      expect(forcing(rules, button, '::after')).toBe('none');
      expect(ringProblem(rules, button, '::after')).toBeNull();
      expect(
        winning(rules, button, '::after', { forcedColors: true }, 'top')
      ).toBe('transparent');
      expect(
        winning(rules, button, '::after', { forcedColors: true }, 'bottom')
      ).toBe('inherit');
      // None of it reaches anyone not in forced colors.
      expect(
        resolved(rules, button, '', {}, ['forced-color-adjust'])
      ).toBeNull();
    }
  );

  it.each([
    [
      'a Tag with a color',
      <Button key="x" isLoading>
        <Tag color="danger">3</Tag>
        <span>Save</span>
      </Button>,
    ],
    [
      'an Icon with a text color',
      <Button key="x" isLoading>
        <Icon name="floppy-disk" textColor="danger" />
        <span>Save</span>
      </Button>,
    ],
    [
      'an Icon with a background',
      <Button key="x" isLoading>
        <Icon name="floppy-disk" bgColor="danger" />
      </Button>,
    ],
    [
      'an SVG with its own fill',
      <Button key="x" isLoading>
        <svg viewBox="0 0 24 24" fill="#3e8ed0" aria-hidden="true">
          <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
        </svg>
        <span>Save</span>
      </Button>,
    ],
    [
      'a LinkButton holding a Tag',
      <LinkButton key="x" isLoading>
        <Tag color="danger">3</Tag>
        <span>Save</span>
      </LinkButton>,
    ],
    [
      'a ToggleButton holding an Icon with a background',
      <ToggleButton key="x" isLoading>
        <Icon name="floppy-disk" bgColor="danger" />
      </ToggleButton>,
    ],
  ] as Array<[string, React.ReactElement<{ isLoading?: boolean }>]>)(
    'hides everything inside a loading button, in every mode: %s',
    (_label, element) => {
      const { container, rerender } = render(
        <ConfigProvider classPrefix={prefix}>{element}</ConfigProvider>
      );
      const button = container.querySelector(`.${prefix}button`)!;
      const children = Array.from(button.children);
      expect(children.length).toBeGreaterThan(0);
      // Bulma's transparent label only reaches what inherits it, so a color,
      // a background or a fill of a child's own would show through the
      // spinner, and in forced colors, with forcing off, so would anything.
      // A child at no opacity paints nothing, whatever it sets, keeps its
      // box, so the button keeps its size, and stays in the accessibility
      // tree, so the button keeps its name.
      for (const el of children) {
        for (const when of [
          {},
          { forcedColors: true },
          { reducedMotion: true },
        ]) {
          expect(resolved(rules, el, '', when, ['opacity'])).toBe('0');
        }
      }
      // The spinner is the button's own `::after`, which stays.
      expect(resolved(rules, button, '::after', {}, ['opacity'])).toBeNull();
      // And it all comes back when loading ends.
      rerender(
        <ConfigProvider classPrefix={prefix}>
          {React.cloneElement(element, { isLoading: false })}
        </ConfigProvider>
      );
      const done = container.querySelector(`.${prefix}button`)!;
      expect(done.classList.contains(`${prefix}is-loading`)).toBe(false);
      for (const el of Array.from(done.children)) {
        expect(resolved(rules, el, '', {}, ['opacity'])).toBeNull();
      }
    }
  );

  it.each(
    RINGS.filter(
      ([name]) => !/Button isLoading$/.test(name) && name !== 'Loader'
    ).map(([name, element]): [string, React.ReactElement] =>
      // The roster's `Control` holds nothing, which would check nothing.
      name === 'Control isLoading'
        ? [
            name,
            <Control key="x" isLoading>
              <Input />
            </Control>,
          ]
        : [name, element]
    )
  )('leaves what is inside a loading field showing: %s', (_label, element) => {
    // The hide is for a loading button. A control, a select or a field
    // marked loading keeps itself, its input, its select and its own buttons.
    // Autocomplete and Taginput mark an element with nothing inside, so for
    // them it's the element itself that counts.
    const { container } = render(
      <ConfigProvider classPrefix={prefix}>{element}</ConfigProvider>
    );
    const loading = Array.from(
      container.querySelectorAll(`.${prefix}is-loading`)
    );
    // With nothing marked loading, it would pass whatever the sheet says.
    expect(loading.length).toBeGreaterThan(0);
    const shown = loading.flatMap(el => [
      el,
      ...Array.from(el.querySelectorAll('*')),
    ]);
    for (const el of shown) {
      for (const when of [{}, { forcedColors: true }]) {
        expect(resolved(rules, el, '', when, ['opacity'])).not.toBe('0');
      }
    }
  });

  it.each([
    [
      'rendered as a div',
      <Button key="x" as="div" isLoading>
        <a href="#details">Details</a>
        <span>Saving</span>
      </Button>,
    ],
    [
      'rendered as a span',
      <Button key="x" as="span" isLoading>
        <span>
          <a href="#details">Details</a>
        </span>
        <span>Saving</span>
      </Button>,
    ],
  ] as Array<[string, React.ReactElement]>)(
    'shows a child of a loading button while it holds focus, %s',
    (_label, element) => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>{element}</ConfigProvider>
      );
      const [holder, other] = Array.from(
        container.querySelector(`.${prefix}button`)!.children
      );
      // Hidden like the rest until it has focus, since opacity leaves it in
      // the tab order. Then it comes back, so focus is never on something
      // nobody can see, and the rest stays hidden.
      expect(resolved(rules, holder, '', {}, ['opacity'])).toBe('0');
      container.querySelector<HTMLElement>('a')!.focus();
      for (const when of [{}, { forcedColors: true }]) {
        expect(resolved(rules, holder, '', when, ['opacity'])).toBe('1');
        expect(resolved(rules, other, '', when, ['opacity'])).toBe('0');
      }
    }
  );

  it('rings a focused loading button in forced colors, where its border holds still', () => {
    // The `!important` border above stops the browser recoloring it to show
    // focus, so the rules draw an outline instead, in its border color.
    const focus = (selector: string) =>
      rules.filter(
        rule => rule.forcedColorsOnly && rule.selectors.includes(selector)
      );
    const base = focus(`.${prefix}button.${prefix}is-loading:focus-visible`);
    expect(base.map(rule => rule.values.outline?.value)).toEqual([
      '2px solid CanvasText',
    ]);
    expect(base[0].values['outline-offset']?.value).toBe('2px');
    expect(
      focus(`button.${prefix}button.${prefix}is-loading:focus-visible`).map(
        rule => rule.values['outline-color']?.value
      )
    ).toEqual(['ButtonText']);
    expect(
      focus(`a[href].${prefix}button.${prefix}is-loading:focus-visible`).map(
        rule => rule.values['outline-color']?.value
      )
    ).toEqual(['LinkText']);
    for (const variant of ['is-ghost', 'is-text', 'is-outlined']) {
      expect(
        focus(
          `.${prefix}button.${prefix}${variant}.${prefix}is-loading:focus-visible`
        ).map(rule => rule.values['outline-color']?.value)
      ).toEqual(['CanvasText']);
    }
    // And no system color outside forced colors, anywhere in the sheet: one
    // there would show in every theme, not just a contrast one.
    expect(
      rules
        .filter(rule => !rule.forcedColorsOnly)
        .flatMap(rule =>
          Object.entries(rule.values)
            .filter(([, { value }]) =>
              tokensOf(value).some(token => SYSTEM.test(token))
            )
            .map(
              ([property, { value }]) =>
                `${rule.selectors.join(', ')} { ${property}: ${value} }`
            )
        )
    ).toEqual([]);
  });
});
