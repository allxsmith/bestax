// Bulma v1 has no timeline, so `_timeline.scss` is all that draws one. jsdom
// never loads the partial on its own, so these compile it, with no prefix and
// under one, and check its rules land on the elements Timeline renders, read
// through getComputedStyle. jsdom leaves `var()` unresolved, so a value that
// reads a variable is compared as written. It evaluates no media query and
// resolves no specificity, so where those decide the outcome, the rules are
// read off the sheet instead. The layouts themselves, in a real browser, are
// checked by hand in Storybook.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Timeline } from '../Timeline';
import { Notification } from '../../elements/Notification';
import { Hero } from '../../layout/Hero';
import { Box } from '../../elements/Box';
import { Message } from '../Message';
import { Card } from '../Card';
import { ConfigProvider } from '../../helpers/Config';
import { compileSheet } from '../../__tests__/compile-scss';
import { bulmaCss, rulesOf as parseSheet } from '../../__tests__/css-cascade';
import {
  contrast,
  schemesOf,
  substitute,
  varsOn,
  type Vars,
} from '../../__tests__/contrast';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/timeline';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

/**
 * Every style rule in `css`, at any depth, in source order, each with the
 * at-rules it sits in (`@media (forced-colors: active)`), outermost first.
 */
function allRulesOf(css: string) {
  const sheet = document.createElement('style');
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  const out: { rule: CSSStyleRule; within: string[] }[] = [];
  const walk = (list: CSSRuleList, within: string[]) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSStyleRule) {
        out.push({ rule, within });
      } else if ('cssRules' in rule) {
        walk((rule as CSSGroupingRule).cssRules, [
          ...within,
          rule.cssText.split('{')[0].trim(),
        ]);
      }
    }
  };
  try {
    walk((sheet.sheet as CSSStyleSheet).cssRules, []);
  } finally {
    sheet.remove();
  }
  return out;
}

/**
 * The properties a rule declares, in order. Iterating its style lists the
 * longhands a shorthand sets as well, so the names are read off its
 * `cssText`, split at each `;` outside a string or brackets.
 */
function propertiesOf(rule: CSSStyleRule) {
  const text = `${rule.style.cssText};`;
  const names: string[] = [];
  let start = 0;
  let depth = 0;
  let quote = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ';' && depth === 0) {
      const name = text.slice(start, i).split(':')[0].trim();
      if (name) names.push(name);
      start = i + 1;
    }
  }
  return names;
}

/** A rule's declarations as `property: value` lines. */
const declarationsOf = (rule: CSSStyleRule) =>
  propertiesOf(rule).map(
    name => `${name}: ${rule.style.getPropertyValue(name)}`
  );

/** A rule's selector list on one line, `, ` between, the way it's written here. */
const selectorOf = (rule: CSSStyleRule) =>
  rule.selectorText.split(/\s*,\s*/).join(', ');

/** Every declaration the top-level rules for `selector` make, merged in order. */
function declarations(css: string, selector: string) {
  const out: Record<string, string> = {};
  for (const { rule } of allRulesOf(css).filter(
    ({ rule, within }) => within.length === 0 && selectorOf(rule) === selector
  )) {
    for (const name of propertiesOf(rule)) {
      out[name] = rule.style.getPropertyValue(name).trim();
    }
  }
  return out;
}

/** A selector list split at its commas, not the ones inside `:is()`. */
function selectorsOf(list: string) {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '(') depth++;
    else if (list[i] === ')') depth--;
    else if (list[i] === ',' && depth === 0) {
      out.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(list.slice(start).trim());
  return out;
}

/**
 * A selector's specificity as one comparable number: classes, attributes and
 * pseudo-classes in the tens, elements in the ones. `:where()` weighs nothing,
 * and `:is()`, `:not()` and `:has()` weigh their most specific argument, as
 * the spec has it. Enough for the selectors here, none of which has an id.
 */
function specificity(selector: string): number {
  let rest = selector;
  let nested = 0;
  const functional = /:(where|is|not|has)\(/g;
  for (let m = functional.exec(rest); m; m = functional.exec(rest)) {
    const open = m.index + m[0].length - 1;
    let close = open;
    for (let depth = 0; close < rest.length; close++) {
      if (rest[close] === '(') depth++;
      else if (rest[close] === ')' && --depth === 0) break;
    }
    if (m[1] !== 'where') {
      nested += Math.max(
        ...selectorsOf(rest.slice(open + 1, close)).map(specificity)
      );
    }
    rest = rest.slice(0, m.index) + rest.slice(close + 1);
    functional.lastIndex = m.index;
  }
  // A pseudo-element (`::before`) weighs what an element does.
  const pseudoElements = (rest.match(/::[\w-]+/g) ?? []).length;
  rest = rest.replace(/::[\w-]+/g, '');
  const classes = (rest.match(/\.[\w-]+|\[[^\]]+\]|:[\w-]+/g) ?? []).length;
  const elements = (rest.match(/(^|[\s>+~])[a-z][\w-]*/gi) ?? []).length;
  return nested + classes * 10 + elements + pseudoElements;
}

/**
 * The value `el` gets for `property` from the top-level rules in `css`: the
 * most specific matching selector wins, and the later rule on a tie. jsdom
 * resolves no specificity, so this does it for the rules that set `property`.
 * With `media`, the rules inside that at-rule take part too, in their place
 * in the sheet, as on a page where it matches.
 */
function winning(css: string, el: Element, property: string, media?: string) {
  let best = { score: -1, value: '' };
  for (const { rule, within } of allRulesOf(css)) {
    const value = rule.style.getPropertyValue(property);
    const applies =
      within.length === 0 || (within.length === 1 && within[0] === media);
    if (!applies || !value) continue;
    for (const selector of selectorsOf(rule.selectorText)) {
      if (el.matches(selector) && specificity(selector) >= best.score) {
        best = { score: specificity(selector), value: value.trim() };
      }
    }
  }
  return best.value;
}

let removeSheet = () => {};
afterEach(() => removeSheet());

/** Puts a stylesheet in the document until the test ends. */
function load(css: string) {
  const sheet = document.createElement('style');
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  removeSheet = () => sheet.remove();
}

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the Timeline partial with %s', (_label, prefix) => {
  const p = (name: string) => `.${prefix}${name}`;
  const pending = `${p('timeline-item')}${p('is-pending')} > ${p('timeline-marker')}`;
  const reachedIcon = `${p('timeline-item')}:is(${p('is-completed')}, ${p('is-active')}) > ${p('timeline-marker')}${p('is-icon')}`;

  const renderTracker = () =>
    render(
      <ConfigProvider classPrefix={prefix}>
        <Timeline active={1} pending="Out for delivery" data-testid="root">
          <Timeline.Item title="Order placed" time="12 October" />
          <Timeline.Item title="Shipped" />
          <Timeline.Item title="Delivered" icon="check" />
        </Timeline>
      </ConfigProvider>
    );

  it('writes its rules for the prefixed classes Timeline renders, and no others', () => {
    const classes = new Set(
      allRulesOf(compile(prefix)).flatMap(({ rule }) =>
        (rule.selectorText.match(/\.[\w-]+/g) ?? []).map(name => name.slice(1))
      )
    );
    expect([...classes].sort()).toEqual(
      [
        'icon',
        'is-active',
        'is-alternate',
        'is-completed',
        'is-danger',
        'is-end',
        'is-icon',
        'is-info',
        'is-link',
        'is-pending',
        'is-primary',
        'is-success',
        'is-upcoming',
        'is-warning',
        // Bulma's, for the colored Hero rules below, which name each color a
        // Hero takes.
        'is-black',
        'is-dark',
        'is-light',
        'is-text',
        'is-white',
        'notification',
        'hero',
        // And the surfaces of their own inside one, which that rule skips.
        'box',
        'card',
        'message',
        'modal',
        'timeline',
        'timeline-content',
        'timeline-item',
        'timeline-marker',
        'timeline-time',
        'timeline-title',
      ]
        .map(name => prefix + name)
        .sort()
    );
  });

  it('lands on the list, the items and the markers Timeline renders', () => {
    load(compile(prefix));
    const { container, getByTestId } = renderTracker();
    const root = getComputedStyle(getByTestId('root'));
    expect(root.listStyle).toBe('none');
    expect(root.paddingLeft).toBe('0px');

    const items = Array.from(container.querySelectorAll('li'));
    expect(items).toHaveLength(4);
    for (const item of items) {
      const style = getComputedStyle(item);
      expect(style.position).toBe('relative');
      expect(style.paddingInlineStart).toBe('var(--bulma-timeline-rail-size)');
      const marker = getComputedStyle(
        item.querySelector(p('timeline-marker')) as Element
      );
      expect(marker.position).toBe('absolute');
      expect(marker.zIndex).toBe('1');
    }
    const title = getComputedStyle(
      container.querySelector(p('timeline-title')) as Element
    );
    expect(title.color).toBe('var(--bulma-timeline-title-color)');
    // jsdom resolves the `em`: 1em of the 16px the title inherits, where an
    // h2 left to the browser is 24px.
    expect(title.fontSize).toBe('16px');
    const time = getComputedStyle(
      container.querySelector(p('timeline-time')) as Element
    );
    expect(time.fontSize).toBe('var(--bulma-timeline-time-size)');
  });

  it('draws every line, dot, ring and halo as a border or an outline', () => {
    // Forced colors keeps borders and outlines and replaces fills with the
    // page's color, so no shape may be a fill, and nothing is a shadow.
    const css = compile(prefix);
    const all = allRulesOf(css);
    expect(
      all.filter(({ rule }) => /box-shadow/.test(rule.style.cssText))
    ).toEqual([]);

    const line = declarations(
      css,
      `${p('timeline-item')}:not(:last-child)::before`
    );
    expect(line['border-inline-start']).toBe(
      'var(--bulma-timeline-line-width) solid var(--bulma-timeline-line-color)'
    );
    expect(line.content).toBe('""');
    expect(line['background-color']).toBeUndefined();

    // A dot is a border half its width, so there's no fill to lose.
    const dot = declarations(css, p('timeline-marker'));
    expect(dot.border).toBe(
      'calc(var(--bulma-timeline-dot-size) / 2) solid var(--bulma-timeline-marker-color)'
    );
    expect(dot.width).toBe('var(--bulma-timeline-dot-size)');
    expect(dot['background-color']).toBeUndefined();

    // An upcoming ring is the same box with a thinner border.
    const ring = declarations(
      css,
      `${p('timeline-item')}${p('is-upcoming')} > ${p('timeline-marker')}`
    );
    expect(ring['border-width']).toBe('var(--bulma-timeline-line-width)');

    // The current item's halo is an outline.
    const halo = declarations(
      css,
      `${p('timeline-item')}${p('is-active')} > ${p('timeline-marker')}`
    );
    expect(halo.outline).toBe(
      'var(--bulma-timeline-line-width) solid var(--bulma-timeline-marker-color)'
    );

    // The line into the pending item is dashed, and the completed one filled.
    expect(
      declarations(
        css,
        `${p('timeline-item')}:has(+ ${p('timeline-item')}${p('is-pending')})::before`
      )
    ).toEqual({ 'border-inline-start-style': 'dashed' });
    expect(
      declarations(css, `${p('timeline-item')}${p('is-completed')}::before`)
    ).toEqual({
      'border-inline-start-color': 'var(--bulma-timeline-active-color)',
    });
  });

  it('draws the pending marker as Bulma’s loader, a ring with two sides open', () => {
    const ring = declarations(compile(prefix), pending);
    expect(ring.animation).toBe(
      `${prefix}timeline-spin var(--bulma-timeline-pending-duration) infinite linear`
    );
    expect(ring['border-top-color']).toBe('transparent');
    expect(ring['border-inline-end-color']).toBe('transparent');
    expect(ring['border-width']).toBe('var(--bulma-timeline-line-width)');
  });

  it('turns the pending ring on keyframes of its own, so it needs no Bulma base', () => {
    // Bulma's `spinAround` is in its base, which `extras.css` and a modular
    // build can leave out, and an animation naming keyframes that aren't
    // there just doesn't run. The partial defines the ones it names.
    const sheet = document.createElement('style');
    sheet.textContent = compile(prefix).replace(/@charset "UTF-8";/g, '');
    document.head.appendChild(sheet);
    try {
      // jsdom has no CSSKeyframesRule global to test against, so the
      // rule's own text says what it is.
      const keyframes = Array.from(
        (sheet.sheet as CSSStyleSheet).cssRules
      ).filter(rule =>
        rule.cssText.startsWith('@keyframes')
      ) as CSSKeyframesRule[];
      expect(keyframes.map(rule => rule.name)).toEqual([
        `${prefix}timeline-spin`,
      ]);
      expect(
        Array.from(keyframes[0].cssRules).map(frame => frame.cssText)
      ).toEqual([expect.stringMatching(/transform: rotate\(360deg\)/)]);
    } finally {
      sheet.remove();
    }
  });

  it('fills the rings, the loader and a reached icon from --bulma-timeline-marker-background', () => {
    // So setting the variable on the timeline changes all three, and a
    // record's icon circle keeps its own variable, which the colors set.
    const css = compile(prefix);
    expect(declarations(css, p('timeline'))).toMatchObject({
      '--bulma-timeline-marker-background': 'var(--bulma-scheme-main)',
      '--bulma-timeline-marker-icon-background': 'var(--bulma-background)',
    });
    const { container } = render(
      <ConfigProvider classPrefix={prefix}>
        <Timeline active={1} pending="Out for delivery">
          <Timeline.Item title="Order placed" icon="box" />
          <Timeline.Item title="Shipped" />
          <Timeline.Item title="Delivered" />
        </Timeline>
      </ConfigProvider>
    );
    const marker = (state: string) =>
      container.querySelector(
        `${p('timeline-item')}${p(state)} > ${p('timeline-marker')}`
      ) as Element;
    const fill = 'var(--bulma-timeline-marker-background)';
    expect(winning(css, marker('is-upcoming'), 'background-color')).toBe(fill);
    expect(winning(css, marker('is-pending'), 'background-color')).toBe(fill);
    expect(winning(css, marker('is-completed'), 'background-color')).toBe(
      `color-mix(in srgb, var(--bulma-timeline-active-color) 15%, ${fill})`
    );

    const { container: record } = render(
      <ConfigProvider classPrefix={prefix}>
        <Timeline>
          <Timeline.Item title="Founded" icon="flag" />
        </Timeline>
      </ConfigProvider>
    );
    expect(
      winning(
        css,
        record.querySelector(p('timeline-marker')) as Element,
        'background-color'
      )
    ).toBe('var(--bulma-timeline-marker-icon-background)');
  });

  it('writes its reduced-motion and forced-colors rules for the pending ring and a reached icon marker only', () => {
    const nested = allRulesOf(compile(prefix))
      .filter(({ within }) => within.some(at => !/min-width/.test(at)))
      .map(({ rule, within }) => ({
        within,
        selector: rule.selectorText,
        declarations: declarationsOf(rule),
      }));
    expect(nested).toEqual([
      {
        within: ['@media (prefers-reduced-motion: reduce)'],
        selector: pending,
        declarations: ['animation: none'],
      },
      // jsdom writes a system color in lowercase, as browsers do.
      {
        within: ['@media (forced-colors: active)'],
        selector: pending,
        declarations: [
          'border-inline-end-color: canvas',
          'border-top-color: canvas',
        ],
      },
      {
        within: ['@media (forced-colors: active)'],
        selector: reachedIcon,
        declarations: [
          'border-width: calc(var(--bulma-timeline-line-width) * 2)',
        ],
      },
    ]);
  });

  // At rest a reached icon marker and one not reached yet are the same ring,
  // told apart by a tint and the icon's color, which forced colors paints
  // alike (#1991). There a reached one's ring is heavier, as a reached dot is
  // filled, and every other marker keeps its own. Still a border, so the
  // icon keeps the user's colors.
  it('draws a reached icon marker with a heavier ring in forced colors, and only that one', () => {
    const css = compile(prefix);
    const { container } = render(
      <ConfigProvider classPrefix={prefix}>
        <Timeline active={1} pending="Out for delivery">
          <Timeline.Item title="Ordered" icon="check" />
          <Timeline.Item title="Packed" icon="check" />
          <Timeline.Item title="Shipped" icon="check" />
          <Timeline.Item title="Delivered" />
        </Timeline>
      </ConfigProvider>
    );
    const markers = Array.from(
      container.querySelectorAll(p('timeline-marker'))
    );
    const ring = 'var(--bulma-timeline-line-width)';
    const heavy = `calc(${ring} * 2)`;
    const forced = '@media (forced-colors: active)';
    // Completed, current, upcoming, an upcoming dot, and the pending loader.
    expect(
      markers.map(marker => winning(css, marker, 'border-width', forced))
    ).toEqual([heavy, heavy, ring, ring, ring]);
    expect(markers.map(marker => winning(css, marker, 'border-width'))).toEqual(
      [ring, ring, ring, ring, ring]
    );

    // A record marks no progress, so its icon markers keep the line's ring,
    // a colored one included.
    const { container: record } = render(
      <ConfigProvider classPrefix={prefix}>
        <Timeline>
          <Timeline.Item title="Founded" icon="flag" />
          <Timeline.Item title="Launched" icon="rocket" color="success" />
        </Timeline>
      </ConfigProvider>
    );
    expect(
      Array.from(record.querySelectorAll(p('timeline-marker'))).map(marker =>
        winning(css, marker, 'border-width', forced)
      )
    ).toEqual([ring, ring]);
  });

  it('lays alternate out only from Bulma’s tablet breakpoint up', () => {
    const all = allRulesOf(compile(prefix));
    const alternate = all.filter(({ rule }) =>
      rule.selectorText.includes(p('is-alternate'))
    );
    expect(alternate.length).toBeGreaterThan(0);
    for (const { within } of alternate) {
      expect(within).toEqual(['@media screen and (min-width: 769px), print']);
    }
    // Nothing else sits in that query, so below it alternate is start.
    expect(
      all.filter(
        ({ rule, within }) =>
          within.length > 0 &&
          /min-width/.test(within[0]) &&
          !rule.selectorText.includes(p('is-alternate'))
      )
    ).toEqual([]);
  });

  it('moves no item up or down, so the reading order is the order on screen', () => {
    const css = compile(prefix);
    expect(css).not.toMatch(
      /\border\s*:|flex-direction:\s*(column|row)-reverse|grid-(row|area)/
    );
  });

  it('uses logical properties, so a right-to-left page needs no rules', () => {
    const physical =
      /^(left|right|(margin|padding|border)-(left|right)(-\w+)?|text-align: (left|right))$/;
    const offenders = allRulesOf(compile(prefix)).flatMap(({ rule }) =>
      declarationsOf(rule).filter(line =>
        physical.test(line.startsWith('text-align') ? line : line.split(':')[0])
      )
    );
    expect(offenders).toEqual([]);
  });

  it('gives the title and the time a Notification’s own text color', () => {
    // Bulma does the same for its titles there, since the scheme's text
    // colors don't read on a colored Notification. A colored Hero's come
    // through the timeline's variables, below.
    expect(
      declarations(
        compile(prefix),
        `${p('notification')} ${p('timeline-title')}, ${p('notification')} ${p('timeline-time')}`
      )
    ).toEqual({ color: 'currentcolor' });
  });

  it('widens the rail for every item when one has an icon marker', () => {
    expect(
      declarations(
        compile(prefix),
        `${p('timeline')}:has(> ${p('timeline-item')} > ${p('timeline-marker')}${p('is-icon')})`
      )
    ).toEqual({
      '--bulma-timeline-rail-size': 'var(--bulma-timeline-rail-size-icon)',
    });
  });

  it('sizes everything in em, so textSize scales the markers, the rail and the gaps too', () => {
    const vars = declarations(compile(prefix), p('timeline'));
    for (const name of [
      'gap',
      'content-gap',
      'rail-size',
      'rail-size-icon',
      'line-width',
      'dot-size',
      'marker-size',
      'pending-size',
      'halo-offset',
      'time-size',
    ]) {
      // A px length only as the floor of a max(), so a line stays drawable.
      // jsdom drops the space after the comma in a custom property.
      const lengths = vars[`--bulma-timeline-${name}`]
        .replace(/max\(\d+px,\s*/g, '(')
        .match(/[\d.]+[a-z]+/g);
      expect(lengths).not.toBeNull();
      expect(lengths?.filter(length => !length.endsWith('em'))).toEqual([]);
    }
    // And no font size of its own on the list, so the helper sets it.
    expect(vars['font-size']).toBeUndefined();
  });

  it('colors progress with link by default and the root’s or the item’s color over it', () => {
    const css = compile(prefix);
    // Bulma's colors, which change only when the repo's owner asks (the root
    // CLAUDE.md, "Bulma's stock colors and the bestax blue"). Each is put
    // together on the timeline from its hue, saturation and lightness, the
    // same color as Bulma's `--bulma-<color>`, so a Theme around the timeline
    // reaches it.
    const color = (name: string) =>
      `hsl(var(--bulma-${name}-h),var(--bulma-${name}-s),var(--bulma-${name}-l))`;
    const bare = (value: string) => value.replace(/\s+/g, '');
    expect(
      bare(declarations(css, p('timeline'))['--bulma-timeline-active-color'])
    ).toBe(color('link'));
    expect(
      declarations(css, p('timeline'))['--bulma-timeline-neutral-color']
    ).toBe('var(--bulma-border-hover)');
    // An upcoming icon is drawn in the page's weak text color, whatever the
    // timeline's color.
    expect(
      declarations(
        css,
        `${p('timeline-item')}${p('is-upcoming')} > ${p('timeline-marker')}${p('is-icon')}`
      )
    ).toEqual({ color: 'var(--bulma-text-weak)' });
    for (const name of [
      'primary',
      'link',
      'info',
      'success',
      'warning',
      'danger',
    ]) {
      const vars = declarations(
        css,
        `${p('timeline')}${p(`is-${name}`)}, ${p('timeline-item')}${p(`is-${name}`)}`
      );
      expect(bare(vars['--bulma-timeline-marker-color'])).toBe(color(name));
      expect(bare(vars['--bulma-timeline-active-color'])).toBe(color(name));
    }
    // The colors come after the states, so an item's own color wins over its
    // state. The rules for a colored Hero name both.
    const selectors = allRulesOf(css)
      .map(({ rule }) => rule.selectorText)
      .filter(s => !s.includes(p('hero')));
    const lastState = selectors
      .map(s => s.includes(p('is-upcoming')))
      .lastIndexOf(true);
    const firstColor = selectors.findIndex(s => s.includes(p('is-primary')));
    expect(firstColor).toBeGreaterThan(lastState);
  });

  // The page's colors don't stand out from a colored Hero, so there a timeline
  // with no color takes the Hero's text color and fills its rings with its
  // background (#1733). A color the caller set is kept. A colored
  // Notification has no such rule: a timeline there keeps the page's look,
  // with the Notification's own text color for its titles and times.
  describe('in a colored Hero, and in a colored Notification', () => {
    /** The variables the top-level rules in `css` matching `el` declare. */
    const declaredOn = (css: string, el: Element) =>
      varsOn(
        allRulesOf(css)
          .filter(({ within }) => within.length === 0)
          .map(({ rule }) => rule),
        selector => el.matches(selector)
      );

    const items = (
      <>
        <Timeline.Item title="Packed" />
        <Timeline.Item title="Shipped" icon="check" />
      </>
    );

    it('draws a timeline with no color in a colored Hero’s text color, and keeps the page’s in a Notification', () => {
      const css = compile(prefix);
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <Timeline active={0} data-testid="on-the-page">
            {items}
          </Timeline>
          <Notification color="info">
            <Timeline active={0} data-testid="in-a-note">
              {items}
            </Timeline>
          </Notification>
          <Hero color="link">
            <Timeline active={0} data-testid="in-a-hero">
              <Timeline.Item title="Packed" />
              <Timeline.Item
                title="Failed"
                color="danger"
                data-testid="colored-item"
              />
              <Timeline.Item title="Shipped" icon="check" />
            </Timeline>
            <Timeline
              active={0}
              color="warning"
              data-testid="colored-in-a-hero"
            >
              {items}
            </Timeline>
            <Box>
              <Timeline active={0} data-testid="on-a-box-in-a-hero">
                {items}
              </Timeline>
            </Box>
            <Card>
              <Timeline active={0} data-testid="on-a-card-in-a-hero">
                {items}
              </Timeline>
            </Card>
            <Message>
              <Timeline active={0} data-testid="in-a-message-in-a-hero">
                {items}
              </Timeline>
            </Message>
            <div className={`${prefix}modal`}>
              <Timeline active={0} data-testid="in-a-modal-in-a-hero">
                {items}
              </Timeline>
            </div>
            <Notification color="warning">
              <Timeline active={0} data-testid="in-a-colored-note-in-a-hero">
                {items}
              </Timeline>
            </Notification>
          </Hero>
          <Box>
            <Hero color="info">
              <Timeline active={0} data-testid="hero-in-a-box">
                {items}
              </Timeline>
            </Hero>
          </Box>
        </ConfigProvider>
      );
      const timeline = (id: string) =>
        container.querySelector(`[data-testid="${id}"]`)!;
      const vars = (id: string) => declaredOn(css, timeline(id));
      const bare = (value?: string) => value?.replace(/\s+/g, '');
      /** The color an upcoming icon's glyph is drawn in. */
      const glyph = (id: string) =>
        winning(
          css,
          timeline(id).querySelector(
            `${p('is-upcoming')} > ${p('timeline-marker')}${p('is-icon')}`
          )!,
          'color'
        );

      // A colored Hero: its text color and its background, its text color for
      // the titles and the times, and for an upcoming icon, through the
      // neutral color.
      const hero = vars('in-a-hero');
      expect(hero['--bulma-timeline-neutral-color']).toBe('currentColor');
      expect(hero['--bulma-timeline-active-color']).toBe('currentColor');
      expect(hero['--bulma-timeline-marker-icon-color']).toBe('currentColor');
      expect(hero['--bulma-timeline-title-color']).toBe('currentColor');
      expect(hero['--bulma-timeline-time-color']).toBe('currentColor');
      for (const name of [
        '--bulma-timeline-marker-background',
        '--bulma-timeline-marker-icon-background',
      ]) {
        expect([name, bare(hero[name])]).toEqual([
          name,
          'hsl(var(--bulma-hero-h),var(--bulma-hero-s),var(--bulma-hero-background-l))',
        ]);
      }
      expect(glyph('in-a-hero')).toBe('var(--bulma-timeline-neutral-color)');
      // A colored Hero inside a Box is still the timeline's surface.
      expect(vars('hero-in-a-box')['--bulma-timeline-neutral-color']).toBe(
        'currentColor'
      );
      expect(glyph('hero-in-a-box')).toBe(
        'var(--bulma-timeline-neutral-color)'
      );
      // An item's own color is kept, declared on the item over what it
      // inherits.
      expect(
        bare(vars('colored-item')['--bulma-timeline-marker-color'])
      ).toMatch(/--bulma-danger/);
      // A color on the timeline keeps its markers and the page's upcoming
      // icon, and its titles and times still take the Hero's text color.
      const coloredInHero = vars('colored-in-a-hero');
      expect(coloredInHero['--bulma-timeline-active-color']).not.toBe(
        'currentColor'
      );
      expect(coloredInHero['--bulma-timeline-title-color']).toBe(
        'currentColor'
      );
      expect(coloredInHero['--bulma-timeline-time-color']).toBe('currentColor');
      expect(glyph('colored-in-a-hero')).toBe('var(--bulma-text-weak)');
      // The page, a colored Notification, and a Box, a Card, a Message, a
      // Modal or a Notification inside the Hero keep the page's look, titles
      // included, and the page's upcoming icon.
      for (const id of [
        'on-the-page',
        'in-a-note',
        'on-a-box-in-a-hero',
        'on-a-card-in-a-hero',
        'in-a-message-in-a-hero',
        'in-a-modal-in-a-hero',
        'in-a-colored-note-in-a-hero',
      ]) {
        const own = vars(id);
        expect([
          id,
          own['--bulma-timeline-neutral-color'],
          own['--bulma-timeline-marker-background'],
          own['--bulma-timeline-title-color'],
          glyph(id),
        ]).toEqual([
          id,
          'var(--bulma-border-hover)',
          'var(--bulma-scheme-main)',
          'var(--bulma-text-strong)',
          'var(--bulma-text-weak)',
        ]);
      }
      // No rule for a colored Notification, and the Hero's weigh what
      // `.timeline` does: the Hero and the colors it skips sit in `:where()`,
      // so a later sheet's class that sets these variables on a timeline
      // still wins. The upcoming icon's rule sits inside the Hero's.
      const surfaceRules = allRulesOf(css)
        .map(({ rule }) => rule.selectorText)
        .filter(selector => selector.startsWith(':where('));
      expect(
        surfaceRules.filter(selector =>
          selector.startsWith(`:where(${p('notification')}`)
        )
      ).toEqual([]);
      const heroRule = new RegExp(
        `^:where\\(${p('hero').replace('.', '\\.')}:is\\(.+\\)\\) ${p('timeline').replace('.', '\\.')}:where\\(:not\\(.+\\)\\)`
      );
      expect(surfaceRules.length).toBeGreaterThan(0);
      for (const selector of surfaceRules) {
        expect(selector).toMatch(heroRule);
      }
      expect(
        surfaceRules.filter(selector =>
          selector.endsWith(
            ` ${p('timeline-item')}${p('is-upcoming')} > ${p('timeline-marker')}${p('is-icon')}`
          )
        )
      ).toHaveLength(1);
    });
  });
});

/** `css`'s top-level rules, compiled and parsed the first time they're read. */
const once = (css: () => string) => {
  let rules: CSSStyleRule[] | undefined;
  return () => (rules ??= parseSheet(css()).rules);
};

/**
 * The published sheets the two contrast suites below read, each compiled and
 * parsed once for both. `extras.css` takes its colors from the app's Bulma,
 * so it is read with Bulma's own.
 */
const CONTRAST_SHEETS: [string, string, () => CSSStyleRule[]][] = [
  ['bestax.css', '', once(() => compileSheet('bestax.scss'))],
  [
    'bestax-prefixed.css',
    'bestax-',
    once(() => compileSheet('versions/bestax-prefixed.scss')),
  ],
  [
    'extras.css on Bulma’s own colors',
    '',
    once(() => bulmaCss() + compileSheet('extras.scss')),
  ],
];

// A colored Hero's text color against its background, which a timeline with
// no color draws its markers on (#1733), resolved through a whole published
// sheet in each scheme. A marker is a graphic, so it needs 3:1.
describe.each(CONTRAST_SHEETS)(
  'Timeline in a colored Hero in %s',
  (_name, prefix, sheet) => {
    let schemes: ReturnType<typeof schemesOf>;
    let surfaceVars: (surface: string, name: string, variant: string) => Vars;
    let handsOver: (surface: string) => boolean;
    // A hook keeps Vitest's 10s default rather than `testTimeout`, and a whole
    // sheet can take longer than that to compile on a loaded machine.
    beforeAll(() => {
      const rules = sheet();
      schemes = schemesOf(rules);
      const p = (name: string) => `.${prefix}${name}`;
      // The markers take the surface's text color only through the
      // timeline's rule for it, so the measurements below hold only with it.
      handsOver = surface =>
        rules.some(
          rule =>
            rule.selectorText.includes(`${p(surface)}:is(`) &&
            rule.selectorText.includes(p('timeline')) &&
            rule.style
              .getPropertyValue('--bulma-timeline-neutral-color')
              .trim() === 'currentColor'
        );
      surfaceVars = (surface, name, variant) => ({
        ...varsOn(rules, p(surface)),
        ...varsOn(rules, `${p(surface)}${p(`is-${name}`)}`),
        ...(variant &&
          varsOn(
            rules,
            `${p(surface)}${p(`is-${name}`)}${p(`is-${variant}`)}`
          )),
      });
    }, 30_000);

    it.each(
      [
        'white',
        'black',
        'light',
        'dark',
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
      ].map(name => ['hero', name, ''])
    )(
      'draws the markers at 3:1 on a %s in %s %s, on both schemes',
      (surface, name, variant) => {
        expect(handsOver(surface)).toBe(true);
        const failures: string[] = [];
        for (const [scheme, page] of Object.entries(schemes)) {
          const vars = { ...page, ...surfaceVars(surface, name, variant) };
          const ratio = contrast(
            substitute(
              `hsl(var(--bulma-${surface}-h), var(--bulma-${surface}-s), var(--bulma-${surface}-color-l))`,
              vars
            ),
            substitute(
              `hsl(var(--bulma-${surface}-h), var(--bulma-${surface}-s), var(--bulma-${surface}-background-l))`,
              vars
            )
          );
          if (ratio < 3) failures.push(`${scheme}: ${ratio.toFixed(2)}:1`);
        }
        expect(failures).toEqual([]);
      }
    );
  }
);

// Each published sheet carries Bulma's colors for the timeline. A color put
// together on the timeline from its channels resolves to what the sheet's
// own `--bulma-<color>` does, in each scheme, so it stays Bulma's color if
// Bulma ever puts `--bulma-<color>` together differently. Variables resolve
// here as the whole page declares them, not per element. `border-hover` falls
// short of WCAG's 3:1 against the page in both schemes, and some of the colors
// on a light page, which the Timeline page says, with how a theme gets more.
describe.each(CONTRAST_SHEETS)(
  'Timeline colors in %s',
  (_name, prefix, sheet) => {
    let schemes: ReturnType<typeof schemesOf>;
    /** The variables the timeline declares on itself, and with each color. */
    let root: Vars;
    let colored: (name: string) => Vars;
    let rules: CSSStyleRule[];
    // A hook keeps Vitest's 10s default rather than `testTimeout`, and a whole
    // sheet can take longer than that to compile on a loaded machine.
    beforeAll(() => {
      rules = sheet();
      schemes = schemesOf(rules);
      root = varsOn(rules, `.${prefix}timeline`);
      colored = name => varsOn(rules, `.${prefix}timeline.${prefix}is-${name}`);
    }, 30_000);

    const plain = (value: string) =>
      value.replace(/^hsla\((.*),\s*1\)$/, 'hsl($1)').replace(/\s+/g, '');

    it('draws a marker with no color in border-hover, and an upcoming icon in text-weak', () => {
      expect(root['--bulma-timeline-neutral-color']).toBe(
        'var(--bulma-border-hover)'
      );
      const upcoming = rules.filter(
        rule =>
          rule.selectorText ===
          `.${prefix}timeline-item.${prefix}is-upcoming > .${prefix}timeline-marker.${prefix}is-icon`
      );
      expect(
        upcoming.map(rule => rule.style.getPropertyValue('color'))
      ).toEqual(['var(--bulma-text-weak)']);
    });

    it.each([
      [
        'progress with no color',
        'link',
        () => root['--bulma-timeline-active-color'],
      ],
      ...['primary', 'link', 'info', 'success', 'warning', 'danger'].flatMap(
        (name): [string, string, () => string][] => [
          [
            `a ${name} marker`,
            name,
            () => colored(name)['--bulma-timeline-marker-color'],
          ],
          [
            `${name} progress`,
            name,
            () => colored(name)['--bulma-timeline-active-color'],
          ],
        ]
      ),
    ] as [string, string, () => string][])(
      'draws %s in the sheet’s own %s, on both schemes',
      (_what, name, read) => {
        const value = read();
        expect(value).toBeTruthy();
        for (const [scheme, page] of Object.entries(schemes)) {
          const vars = { ...page, ...root };
          expect([scheme, plain(substitute(value, vars))]).toEqual([
            scheme,
            plain(substitute(`var(--bulma-${name})`, vars)),
          ]);
        }
      }
    );
  }
);
