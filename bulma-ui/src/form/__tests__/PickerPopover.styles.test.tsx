// Where a picker's panel sits comes from _picker-popover.scss, which jsdom
// never loads on its own, so className assertions cannot see it. These
// compile the real partial, plain and under a class prefix, and assert
// computed style instead (pattern: Popover.styles.test.tsx). jsdom leaves
// `var()` unresolved and does no layout, so values are compared as written.
import * as sass from 'sass';
import { readdirSync } from 'fs';
import path from 'path';
import type { ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DateInput } from '../DateInput';
import { TimeInput } from '../TimeInput';
import { DateTimeInput } from '../DateTimeInput';
import { ConfigProvider } from '../../helpers/Config';
import type { PickerPosition } from '../_pickerInternals/pickerTypes';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');
const OPTIONS = {
  loadPaths: [SCSS, NODE_MODULES],
  quietDeps: true,
  logger: sass.Logger.silent,
};

const sheets: HTMLStyleElement[] = [];

beforeAll(() => {
  for (const source of [
    `@use 'form/picker-popover';`,
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: 'bestax-');
     @use 'form/picker-popover';`,
  ]) {
    const el = document.createElement('style');
    el.textContent = sass.compileString(source, OPTIONS).css;
    document.head.appendChild(el);
    sheets.push(el);
  }
});

afterAll(() => {
  for (const el of sheets) el.remove();
});

type Corner = Exclude<PickerPosition, 'auto'>;
const corners: Corner[] = [
  'bottom-left',
  'bottom-right',
  'top-left',
  'top-right',
];

type PickerProps = { position: Corner; appendToBody: boolean };
const pickers: [string, (props: PickerProps) => ReactElement][] = [
  ['DateInput', props => <DateInput {...props} />],
  ['TimeInput', props => <TimeInput {...props} />],
  ['DateTimeInput', props => <DateTimeInput {...props} />],
];

const prefixes = ['', 'bestax-'];

/** Renders the picker under the prefix, opens it, and returns its panel. */
function openPanel(
  picker: (props: PickerProps) => ReactElement,
  prefix: string,
  props: PickerProps
) {
  render(<ConfigProvider classPrefix={prefix}>{picker(props)}</ConfigProvider>);
  fireEvent.click(screen.getByRole('combobox'));
  const panel = screen.getByRole('dialog');
  expect(panel).toHaveClass(
    `${prefix}picker-popover`,
    `${prefix}is-${props.position}`
  );
  return panel;
}

const offset = 'calc(100% + var(--bulma-picker-popover-offset))';

describe.each(pickers)('%s panel placement', (_name, picker) => {
  describe.each(prefixes)('with class prefix "%s"', prefix => {
    it.each<[Corner, string]>([
      ['bottom-left', 'var(--bulma-picker-popover-offset)'],
      ['bottom-right', 'var(--bulma-picker-popover-offset)'],
      ['top-left', 'calc(-1 * var(--bulma-picker-popover-offset))'],
      ['top-right', 'calc(-1 * var(--bulma-picker-popover-offset))'],
    ])(
      'takes the gap of a portaled %s panel from the offset variable',
      (position, marginTop) => {
        // The coordinates are the anchor's edge, so the gap is a margin,
        // negative above, as on Popover. Before, the hook added a fixed 4px
        // and the variable moved only an in-place panel.
        const panel = openPanel(picker, prefix, {
          position,
          appendToBody: true,
        });
        expect(getComputedStyle(panel).marginTop).toBe(marginTop);
      }
    );

    it.each<[Corner, Record<string, string>]>([
      ['bottom-left', { top: offset, left: '0px' }],
      ['bottom-right', { top: offset, right: '0px' }],
      ['top-left', { bottom: offset, left: '0px' }],
      ['top-right', { bottom: offset, right: '0px' }],
    ])('keeps an in-place %s panel on its corner', (position, expected) => {
      const panel = openPanel(picker, prefix, {
        position,
        appendToBody: false,
      });
      expect(panel).not.toHaveClass(`${prefix}is-portal`);
      expect(panel.getAttribute('style') ?? '').toBe('');
      const style = getComputedStyle(panel);
      expect(style.position).toBe('absolute');
      for (const [property, value] of Object.entries(expected)) {
        expect([property, style.getPropertyValue(property)]).toEqual([
          property,
          value,
        ]);
      }
    });
  });
});

// Any partial loaded after this one can move the panel too, so where it sits
// is also checked in every stylesheet the package publishes, at a phone and
// a desktop width. jsdom's own cascade ignores specificity and width media
// queries, so the helpers below apply both.

type Rank = number[];

/** Compares two ranks place by place: negative, zero or positive. */
const compare = (a: Rank, b: Rank) =>
  a.reduce((found, n, i) => found || n - b[i], 0);

const highest = (ranks: Rank[]) =>
  ranks.reduce((a, b) => (compare(a, b) >= 0 ? a : b));

/** A selector list, or a pseudo-class argument, split at top-level commas. */
function splitList(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const ch = list[i];
    if (ch === '\\') i++;
    else if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }
  return [...parts, list.slice(start).trim()];
}

const LEGACY_PSEUDO_ELEMENTS = [
  'before',
  'after',
  'first-line',
  'first-letter',
];

/**
 * The specificity of one complex selector, as [ids, classes, types].
 * `:is()`, `:not()` and `:has()` count their most specific argument, and
 * `:where()` counts nothing.
 */
function specificity(selector: string): Rank {
  const rank: Rank = [0, 0, 0];
  let i = 0;
  const name = () => {
    const start = i;
    while (i < selector.length && /[\w\\-]/.test(selector[i])) {
      i += selector[i] === '\\' ? 2 : 1;
    }
    return selector.slice(start, i).toLowerCase();
  };
  const argument = () => {
    const start = ++i;
    for (let depth = 1; depth > 0 && i < selector.length; i++) {
      if (selector[i] === '\\') i++;
      else if (selector[i] === '(') depth++;
      else if (selector[i] === ')') depth--;
    }
    return selector.slice(start, i - 1);
  };
  while (i < selector.length) {
    const ch = selector[i];
    if (ch === '#' || ch === '.') {
      i++;
      name();
      rank[ch === '#' ? 0 : 1]++;
    } else if (ch === '[') {
      i = selector.indexOf(']', i) + 1;
      rank[1]++;
    } else if (ch === ':') {
      const isElement = selector[i + 1] === ':';
      i += isElement ? 2 : 1;
      const pseudo = name();
      const arg = selector[i] === '(' ? argument() : '';
      if (isElement || LEGACY_PSEUDO_ELEMENTS.includes(pseudo)) rank[2]++;
      else if (['is', 'not', 'has'].includes(pseudo)) {
        highest(splitList(arg).map(specificity)).forEach(
          (n, at) => (rank[at] += n)
        );
      } else if (pseudo !== 'where') rank[1]++;
    } else if (/[\w\\-]/.test(ch)) {
      name();
      rank[2]++;
    } else i++;
  }
  return rank;
}

/**
 * Whether a media query list can hold at this viewport width. Width is all
 * that is known, so every other feature is taken as holding, and a rule
 * counts if any screen this wide could get it. A media type other than
 * `screen` or `all` does not hold.
 */
function mediaHolds(mediaText: string, width: number): boolean {
  return mediaText.split(',').some(query => {
    const type = /^\s*(?:only\s+)?([a-z]+)/i.exec(query)?.[1].toLowerCase();
    if (type && type !== 'screen' && type !== 'all') return false;
    return [...query.matchAll(/\((min|max)-width:\s*([\d.]+)px\)/g)].every(
      ([, bound, px]) =>
        bound === 'min' ? width >= Number(px) : width <= Number(px)
    );
  });
}

const PLACEMENT = ['position', 'top', 'right', 'bottom', 'left'];
const isInset = (property: string) => property.startsWith('inset');

/**
 * The style rules that can hold at this width and say where a box sits, in
 * source order, including those inside media, container and supports blocks.
 */
function placementRules(
  rules: CSSRuleList,
  width: number,
  found: CSSStyleRule[] = []
): CSSStyleRule[] {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) {
      const declared = Array.from(rule.style);
      if (declared.some(p => PLACEMENT.includes(p) || isInset(p))) {
        found.push(rule);
      }
    } else if (rule instanceof CSSMediaRule) {
      if (mediaHolds(rule.media.mediaText, width)) {
        placementRules(rule.cssRules, width, found);
      }
    } else if ('cssRules' in rule) {
      placementRules((rule as CSSGroupingRule).cssRules, width, found);
    }
  }
  return found;
}

/** A selector jsdom cannot parse, such as a pseudo-element's, matches nothing. */
function matches(el: Element, selector: string): boolean {
  try {
    return el.matches(selector);
  } catch {
    return false;
  }
}

/**
 * Where the cascade puts the element under these rules and its inline style.
 * Each property takes the declaration ranked highest by importance, then
 * inline over a rule, then specificity, then source order. A property
 * nothing declares is empty, as jsdom reports it.
 */
function placement(el: HTMLElement, rules: CSSStyleRule[]) {
  const winners = new Map<string, { rank: Rank; value: string }>();
  const offer = (property: string, rank: Rank, style: CSSStyleDeclaration) => {
    const value = style.getPropertyValue(property);
    const best = winners.get(property);
    if (value && (!best || compare(rank, best.rank) >= 0)) {
      winners.set(property, { rank, value });
    }
  };
  const important = (style: CSSStyleDeclaration, property: string) =>
    style.getPropertyPriority(property) ? 1 : 0;
  rules.forEach((rule, order) => {
    const matching = splitList(rule.selectorText).filter(s => matches(el, s));
    if (matching.length === 0) return;
    // An `inset` shorthand moves the box without naming these properties.
    expect([rule.selectorText, Array.from(rule.style).filter(isInset)]).toEqual(
      [rule.selectorText, []]
    );
    const rank = highest(matching.map(specificity));
    for (const property of PLACEMENT) {
      offer(
        property,
        [important(rule.style, property), 0, ...rank, order],
        rule.style
      );
    }
  });
  for (const property of PLACEMENT) {
    offer(property, [important(el.style, property), 1, 0, 0, 0, 0], el.style);
  }
  return Object.fromEntries(
    PLACEMENT.map(property => [property, winners.get(property)?.value ?? ''])
  );
}

/** Parses CSS into a sheet without leaving it on the document. */
function parseSheet(css: string): CSSStyleSheet {
  const el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
  const sheet = el.sheet as CSSStyleSheet;
  el.remove();
  return sheet;
}

const PHONE = 375;
const DESKTOP = 1280;

// The entry points rollup builds a published stylesheet from.
const published = [
  'extras.scss',
  'bestax.scss',
  ...readdirSync(path.join(SCSS, 'versions'))
    .filter(file => file.endsWith('.scss'))
    .map(file => `versions/${file}`),
];

describe.each(published)('panel placement in %s', file => {
  const prefix = file.includes('prefixed') ? 'bestax-' : '';
  let sheet: CSSStyleSheet;

  beforeAll(() => {
    sheet = parseSheet(sass.compile(path.join(SCSS, file), OPTIONS).css);
  }, 30_000);

  describe.each([PHONE, DESKTOP])('at %ipx wide', width => {
    let rules: CSSStyleRule[];

    beforeAll(() => {
      rules = placementRules(sheet.cssRules, width);
    });

    describe.each(pickers)('%s', (_name, picker) => {
      it.each(corners)(
        'places a portaled %s panel by its inline coordinates alone',
        position => {
          const panel = openPanel(picker, prefix, {
            position,
            appendToBody: true,
          });
          expect(panel).toHaveClass(`${prefix}is-portal`);
          expect(panel.parentElement).toBe(document.body);
          // The positioning hook sets these inline. Any `right` or `bottom`
          // on top of them stretches or collapses the fixed box.
          expect(panel.style.top).not.toBe('');
          expect(panel.style.left).not.toBe('');
          expect(placement(panel, rules)).toEqual({
            position: 'fixed',
            top: panel.style.top,
            right: 'auto',
            bottom: 'auto',
            left: panel.style.left,
          });
        }
      );
    });
  });

  it.each(corners)(
    'keeps an in-place TimeInput panel at %s a sheet on a phone',
    position => {
      // On a small screen an in-place TimeInput panel spans the bottom of
      // the viewport instead of sitting on its corner.
      const panel = openPanel(props => <TimeInput {...props} />, prefix, {
        position,
        appendToBody: false,
      });
      expect(placement(panel, placementRules(sheet.cssRules, PHONE))).toEqual({
        position: 'fixed',
        top: 'auto',
        right: '1rem',
        bottom: '1rem',
        left: '1rem',
      });
    }
  );
});
