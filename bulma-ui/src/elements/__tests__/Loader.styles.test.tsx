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
// way a browser would for one property: every rule that sets the animation on
// an element (or its `::after`) is ranked by importance, then specificity,
// then source order. It renders the real components, so the elements are the
// ones the library emits, and runs over every stylesheet `package.json`
// publishes, plus `extras.css` linked on either side of Bulma's own CSS.
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

type Rule = {
  selectors: string[];
  properties: string[];
  animation: string | null;
  important: boolean;
  order: number;
  reducedMotionOnly: boolean;
};

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
        const prop = ['animation-name', 'animation'].find(p =>
          decl.getPropertyValue(p)
        );
        out.push({
          selectors: splitSelectors(rule.selectorText),
          properties,
          animation: prop ? decl.getPropertyValue(prop).trim() : null,
          important: prop
            ? decl.getPropertyPriority(prop) === 'important'
            : false,
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

/** The animation that applies to the element, as a browser would resolve it. */
function winningAnimation(
  rules: Rule[],
  el: Element,
  pseudo: string,
  reducedMotion: boolean
): string | null {
  let best: { rank: number[]; value: string } | null = null;
  for (const rule of rules) {
    if (!rule.animation || (rule.reducedMotionOnly && !reducedMotion)) continue;
    for (const selector of rule.selectors) {
      if (!matches(selector, el, pseudo)) continue;
      const rank = [
        rule.important ? 1 : 0,
        ...specificity(selector),
        rule.order,
      ];
      if (!best || beats(rank, best.rank)) {
        best = { rank, value: rule.animation };
      }
    }
  }
  return best && best.value.split(/\s+/)[0];
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
];

/** Every (element, pseudo) the stylesheet animates in this render. */
function animatedIn(container: Element, rules: Rule[]) {
  const found: Array<{ el: Element; pseudo: string }> = [];
  for (const el of Array.from(container.querySelectorAll('*'))) {
    for (const pseudo of ['', '::after', '::before']) {
      const name = winningAnimation(rules, el, pseudo, false);
      if (name && name !== 'none') found.push({ el, pseudo });
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
        .filter(
          ({ el, pseudo }) =>
            winningAnimation(rules, el, pseudo, true) !== 'none'
        )
        .map(({ el, pseudo }) => describeEl(el, pseudo));
      expect(stillMoving).toEqual([]);
    }
  );

  it('changes nothing but the animation under prefers-reduced-motion', () => {
    // Each indicator has to stay drawn, so the override may not touch a
    // ring's border, the bar's gradient, a skeleton's fill, or any size or
    // display.
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
      .filter(property => !property.startsWith('animation'));
    expect(extra).toEqual([]);
  });
});
