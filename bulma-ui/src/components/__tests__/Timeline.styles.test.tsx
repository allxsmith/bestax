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
import { ConfigProvider } from '../../helpers/Config';

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

/** A rule's declarations as `property: value` lines. */
const declarationsOf = (rule: CSSStyleRule) =>
  Array.from(
    { length: rule.style.length },
    (_, i) => `${rule.style[i]}: ${rule.style.getPropertyValue(rule.style[i])}`
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
    for (let i = 0; i < rule.style.length; i++) {
      out[rule.style[i]] = rule.style.getPropertyValue(rule.style[i]).trim();
    }
  }
  return out;
}

/**
 * A simple selector's specificity as one comparable number: classes,
 * attributes and pseudo-classes in the tens, elements in the ones. Enough for
 * the selectors here, none of which has an id.
 */
function specificity(selector: string) {
  const classes = (selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) ?? [])
    .length;
  const elements = (selector.match(/(^|[\s>+~])[a-z][\w-]*/gi) ?? []).length;
  return classes * 10 + elements;
}

/**
 * The value `el` gets for `property` from the top-level rules in `css`: the
 * most specific matching selector wins, and the later rule on a tie. jsdom
 * resolves no specificity, so this does it for the rules that set `property`.
 */
function winning(css: string, el: Element, property: string) {
  let best = { score: -1, value: '' };
  for (const { rule, within } of allRulesOf(css)) {
    const value = rule.style.getPropertyValue(property);
    if (within.length > 0 || !value) continue;
    for (const selector of rule.selectorText.split(/\s*,\s*/)) {
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
        // Bulma's, for the colored Notification rule below.
        'notification',
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
    expect(title.fontSize).toBe('1em');
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

  it('stands the pending ring still under reduced motion, and keeps it open in forced colors', () => {
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
      {
        within: ['@media (forced-colors: active)'],
        selector: pending,
        declarations: [
          'border-inline-end-color: Canvas',
          'border-top-color: Canvas',
        ],
      },
    ]);
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
    // colors don't read on a colored Notification.
    expect(
      declarations(
        compile(prefix),
        `${p('notification')} ${p('timeline-title')}, ${p('notification')} ${p('timeline-time')}`
      )
    ).toEqual({ color: 'currentColor' });
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
      const lengths = vars[`--bulma-timeline-${name}`]
        .replace(/max\(\d+px, /g, '(')
        .match(/[\d.]+[a-z]+/g);
      expect(lengths).not.toBeNull();
      expect(lengths?.filter(length => !length.endsWith('em'))).toEqual([]);
    }
    // And no font size of its own on the list, so the helper sets it.
    expect(vars['font-size']).toBeUndefined();
  });

  it('colors progress with link by default and the root’s or the item’s color over it', () => {
    const css = compile(prefix);
    expect(
      declarations(css, p('timeline'))['--bulma-timeline-active-color']
    ).toBe('var(--bulma-link)');
    for (const name of [
      'primary',
      'link',
      'info',
      'success',
      'warning',
      'danger',
    ]) {
      const color = declarations(
        css,
        `${p('timeline')}${p(`is-${name}`)}, ${p('timeline-item')}${p(`is-${name}`)}`
      );
      expect(color['--bulma-timeline-marker-color']).toBe(
        `var(--bulma-${name})`
      );
      expect(color['--bulma-timeline-active-color']).toBe(
        `var(--bulma-${name})`
      );
    }
    // The colors come after the states, so an item's own color wins over its state.
    const selectors = allRulesOf(css).map(({ rule }) => rule.selectorText);
    const lastState = selectors
      .map(s => s.includes(p('is-upcoming')))
      .lastIndexOf(true);
    const firstColor = selectors.findIndex(s => s.includes(p('is-primary')));
    expect(firstColor).toBeGreaterThan(lastState);
  });
});
