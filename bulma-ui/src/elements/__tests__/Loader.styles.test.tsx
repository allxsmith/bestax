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
// reduced motion too.
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
  Taginput,
  TextArea,
  TimeInput,
  Title,
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
  order: number;
  reducedMotionOnly: boolean;
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
 * theme it. A shorthand with no name or no time resets that longhand, to
 * `none` and `0s`.
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
  return { name: name ?? 'none', duration: duration ?? '0s' };
}

/** Every style rule in the sheet, in source order, with its media context. */
function rulesOf(css: string): Rule[] {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const out: Rule[] = [];
  const walk = (list: CSSRuleList, reducedMotionOnly: boolean) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSMediaRule) {
        const media = rule.media.mediaText;
        // A user who asked for less motion never matches `no-preference`.
        if (/prefers-reduced-motion:\s*no-preference/.test(media)) continue;
        walk(
          rule.cssRules,
          reducedMotionOnly || /prefers-reduced-motion:\s*reduce/.test(media)
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
        out.push({
          selectors: splitSelectors(rule.selectorText),
          properties,
          name: longhand('name'),
          duration: longhand('duration'),
          order: out.length,
          reducedMotionOnly,
        });
      }
    }
  };
  walk(style.sheet!.cssRules, false);
  style.remove();
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
      `${selector} animates a spinner and has a functional pseudo-class, which ` +
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

/** One animation longhand on the element, as a browser would resolve it. */
function winning(
  rules: Rule[],
  el: Element,
  pseudo: string,
  reducedMotion: boolean,
  prop: 'name' | 'duration'
): string | null {
  let best: { rank: number[]; value: string } | null = null;
  for (const rule of rules) {
    const setting = rule[prop];
    if (!setting || (rule.reducedMotionOnly && !reducedMotion)) continue;
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
  const name = winning(rules, el, pseudo, reducedMotion, 'name') ?? 'none';
  const duration =
    winning(rules, el, pseudo, reducedMotion, 'duration') ?? '0s';
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
 * Each component that draws a loading animation, with the prop that turns it
 * on: the spinners, the indeterminate progress bar and the skeleton pulse.
 */
const ANIMATED: Array<[string, React.ReactElement]> = [
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
    const animating = new Set(
      rules
        .filter(
          rule =>
            !rule.reducedMotionOnly && (rule.name?.value ?? 'none') !== 'none'
        )
        .flatMap(rule => rule.selectors)
    );
    // Floor against the rule walk going quietly empty.
    expect(animating.size).toBeGreaterThan(0);
    const stillMoving: string[] = [];
    for (const selector of animating) {
      const { el, pseudo } = witness(selector);
      // It has to animate to begin with, or the check below is vacuous.
      expect([selector, moves(rules, el, pseudo, false)]).toEqual([
        selector,
        true,
      ]);
      if (moves(rules, el, pseudo, true)) stillMoving.push(selector);
    }
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
});
