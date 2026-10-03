// The calendar put `is-<colour>` on its root for as long as DateInput and
// DateTimeInput passed `color` in, and no rule read it. A class reaching the
// DOM proves nothing about the stylesheet, so these compile the real SCSS and
// check what it does, the way TimeInput.styles.test.tsx does for the wheels.
import * as sass from 'sass';
import path from 'path';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { DateInput } from '../DateInput';
import { DateTimeInput } from '../DateTimeInput';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');
const OPTIONS = {
  loadPaths: [SCSS, NODE_MODULES],
  quietDeps: true,
  logger: sass.Logger.silent,
};

const compile = (file: string) =>
  sass.compile(path.resolve(SCSS, file), OPTIONS).css;

const colors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;
type Color = (typeof colors)[number];

/**
 * The variables a colour re-points, and what each should read for it. Today's
 * tint and the ring sit on the calendar's surface, so they take the
 * `-on-scheme` variant, which Bulma adjusts until it contrasts with
 * `scheme-main`: plain `warning` or `info` is too faint there on a light
 * surface.
 */
const accents = (color: string) => ({
  '--bulma-dateinput-cell-selected-bg': `var(--bulma-${color})`,
  '--bulma-dateinput-cell-selected-color': `var(--bulma-${color}-invert)`,
  '--bulma-dateinput-cell-today-color': `var(--bulma-${color}-on-scheme)`,
  '--bulma-dateinput-focus-ring-color': `var(--bulma-${color}-on-scheme)`,
});

/** What an uncoloured calendar reads: plain `primary` for today and the ring. */
const defaults = {
  ...accents('primary'),
  '--bulma-dateinput-cell-today-color': 'var(--bulma-primary)',
  '--bulma-dateinput-focus-ring-color': 'var(--bulma-primary)',
};

/** The accent variables as the calendar root computes them. */
function computedAccents(root: HTMLElement) {
  const style = getComputedStyle(root);
  return Object.fromEntries(
    Object.keys(accents('primary')).map(name => [
      name,
      style.getPropertyValue(name).trim(),
    ])
  );
}

/** The calendar root, which is where `is-<colour>` lands. */
function calendarRoot(container: HTMLElement, prefix = '') {
  const root = container.querySelector<HTMLElement>(`.${prefix}dateinput`);
  if (!root) throw new Error(`no .${prefix}dateinput rendered`);
  return root;
}

const sheets: HTMLStyleElement[] = [];
const inject = (css: string) => {
  const el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
  sheets.push(el);
  return el;
};

let sheet: CSSStyleSheet;

beforeAll(() => {
  sheet = inject(compile('form/_dateinput.scss')).sheet as CSSStyleSheet;
});

afterAll(() => {
  for (const el of sheets) el.remove();
});

const pickers: [string, (color?: Color) => ReactElement][] = [
  ['DateInput', color => <DateInput inline color={color} />],
  [
    'DateInput month picker',
    color => <DateInput inline granularity="month" color={color} />,
  ],
  [
    'DateInput year picker',
    color => <DateInput inline granularity="year" color={color} />,
  ],
  ['DateTimeInput', color => <DateTimeInput inline color={color} />],
];

describe.each(pickers)('%s calendar colour styles', (_name, picker) => {
  it.each(colors)(
    'points the selection, today and the focus ring at %s',
    color => {
      const { container } = render(picker(color));
      expect(computedAccents(calendarRoot(container))).toEqual(accents(color));
    }
  );

  it('leaves an uncoloured calendar on the primary defaults', () => {
    const { container } = render(picker());
    expect(computedAccents(calendarRoot(container))).toEqual(defaults);
  });
});

describe('calendar colour styles under a class prefix', () => {
  it('matches the prefixed modifier the calendar emits', () => {
    inject(
      sass.compileString(
        `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: 'bestax-');
         @use 'form/dateinput';`,
        OPTIONS
      ).css
    );
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <DateInput inline color="danger" />
      </ConfigProvider>
    );
    const root = calendarRoot(container, 'bestax-');
    expect(root).toHaveClass('bestax-is-danger');
    expect(computedAccents(root)).toEqual(accents('danger'));
  });
});

/** Every custom property a style rule in the sheet sets. */
function setProperties(rules: CSSRuleList): string[] {
  const names = new Set<string>();
  for (const rule of Array.from(rules)) {
    if (!(rule instanceof CSSStyleRule)) continue;
    for (let i = 0; i < rule.style.length; i++) {
      const name = rule.style[i];
      if (name.startsWith('--')) names.add(name);
    }
  }
  return [...names];
}

/** Every top-level style rule whose selector is a keyboard focus state. */
function focusRules(rules: CSSRuleList): CSSStyleRule[] {
  return Array.from(rules).filter(
    (rule): rule is CSSStyleRule =>
      rule instanceof CSSStyleRule &&
      rule.selectorText.includes(':focus-visible')
  );
}

/** The colour a rule gives its outline, from the longhand or the shorthand. */
const ringOf = (rule: CSSStyleRule) =>
  rule.style.getPropertyValue('outline-color') ||
  rule.style.getPropertyValue('outline');

describe('calendar focus rings', () => {
  it('reads a calendar variable for every ring', () => {
    // A ring that names a colour itself, `scheme-main` included, stays that
    // colour whatever `color` does to the surface or the fill under it.
    const rules = focusRules(sheet.cssRules);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      expect([rule.selectorText, ringOf(rule)]).toEqual([
        rule.selectorText,
        expect.stringMatching(/var\(--bulma-dateinput-/),
      ]);
    }
  });

  it.each(['dateinput-cell', 'dateinput-year-cell', 'dateinput-month-cell'])(
    'gives a selected %s the selected value colour for its ring',
    cls => {
      // That ring is inset into the selection fill, which follows `color`,
      // and the selected value's colour is the one chosen to contrast with
      // it. Year and month cells share one rule, so match within its list.
      const rule = focusRules(sheet.cssRules).find(r =>
        r.selectorText
          .split(',')
          .map(s => s.trim())
          .includes(`.${cls}.is-selected:focus-visible`)
      );
      expect(rule && ringOf(rule)).toBe(
        'var(--bulma-dateinput-cell-selected-color)'
      );
    }
  );
});

describe('calendar variables', () => {
  it('registers only variables that some rule reads', () => {
    const set = setProperties(sheet.cssRules);
    expect(set).toContain('--bulma-dateinput-focus-ring-color');

    const shipped = compile('bestax.scss');
    const unread = set.filter(
      name => !new RegExp(`var\\(\\s*${name}\\s*[,)]`).test(shipped)
    );
    expect(unread).toEqual([]);
  });

  it('reads no Bulma colour directly outside a variable', () => {
    // A declaration that names a colour itself stays that colour whatever
    // `color` says, which is how the focus rings stayed primary. Custom
    // properties are where the colours are meant to be named.
    const direct = new RegExp(`var\\(--bulma-(?:${colors.join('|')})\\b`);
    const offenders = compile('form/_dateinput.scss')
      .split('\n')
      .map(line => line.trim())
      .filter(line => !line.startsWith('--') && direct.test(line));
    expect(offenders).toEqual([]);
  });
});
