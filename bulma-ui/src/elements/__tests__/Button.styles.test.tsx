// Bulma's control mixin sets `outline: none` on a focused button and shows
// focus through its border color and box-shadow. `.button.is-ghost` clears
// both, `.button.is-static` clears the shadow and keeps its own border color,
// and forced colors drops the shadow and forces the border's color, so
// `_button.scss` gives a focused ghost or static button, and every focused
// button in forced colors, Bulma's focus outline. These compile that partial and read
// its rules as text, the way IconButton's styles test reads its own, beside
// Bulma's button rules, which they have to outrank. No browser: jsdom's CSSOM
// drops `:focus-visible` and evaluates no media query.
//
// Bulma also sets a colored button's border width to 0, and forced colors
// replaces its fill, so the partial gives that width back, at 1px, inside
// `forced-colors: active` only (#1458). An outlined button is left out of
// that selector, which `matches` checks without a browser, and so is a text
// button, which has no fill to lose.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Button, type ButtonProps } from '../Button';
import { LinkButton } from '../LinkButton';
import { ToggleButton } from '../ToggleButton';
import { SegmentedControl } from '../../components/SegmentedControl';
import { ConfigProvider } from '../../helpers/Config';
import { Panel } from '../../components/Panel';
import { compileSheet } from '../../__tests__/compile-scss';
import {
  bulmaCss,
  compilePartial,
  customProperty,
  rulesOf as cascadeRules,
} from '../../__tests__/css-cascade';
import {
  contrast,
  schemesOf,
  substitute,
  type Vars,
} from '../../__tests__/contrast';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (source: string, prefix = '') =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     ${source}`,
    {
      loadPaths: [SCSS, NODE_MODULES],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

interface Rule {
  /** The at-rules around it, outermost first, as written. */
  context: string[];
  selector: string;
  declarations: Record<string, string>;
}

/** Every style rule in a sheet of sass's expanded output. */
function rulesOf(css: string): Rule[] {
  const rules: Rule[] = [];
  const open: (string | Rule)[] = [];
  let buffer = '';
  for (const char of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (char === '{') {
      const head = buffer.replace(/\s+/g, ' ').trim();
      buffer = '';
      if (head.startsWith('@')) {
        open.push(head);
      } else {
        const rule: Rule = {
          context: open.filter((o): o is string => typeof o === 'string'),
          selector: head,
          declarations: {},
        };
        rules.push(rule);
        open.push(rule);
      }
    } else if (char === '}') {
      const closed = open.pop();
      if (closed && typeof closed !== 'string') {
        for (const declaration of buffer.split(';')) {
          const at = declaration.indexOf(':');
          if (at < 0) continue;
          closed.declarations[declaration.slice(0, at).trim()] = declaration
            .slice(at + 1)
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
      buffer = '';
    } else {
      buffer += char;
    }
  }
  return rules;
}

const PLAIN = rulesOf(compile(`@use 'elements/button';`));
const PREFIXED = rulesOf(compile(`@use 'elements/button';`, 'bestax-'));
const BULMA = rulesOf(compile(`@use 'bulma/sass/elements/button';`));

const FORCED = '@media (forced-colors: active)';

/** Whether a rule draws an outline, or sets the border width. */
const outlines = (rule: Rule) =>
  Object.keys(rule.declarations).some(property =>
    property.startsWith('outline')
  );
const borders = (rule: Rule) =>
  '--bulma-button-border-width' in rule.declarations;
const lightnesses = (rule: Rule) => '--bulma-button-l' in rule.declarations;
const selects = (rule: Rule) => /is-selected/.test(rule.selector);

/**
 * Bulma's button colors, the keys of `$colors` in the order it ships them,
 * without `text`.
 */
const COLORS = [
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
];

const colored = (name: string, prefix = '') =>
  `.${prefix}button.${prefix}is-${name}.${prefix}is-${name}:not(.${prefix}is-outlined)`;

const GHOST_FOCUS =
  '.button.is-ghost:not(.is-loading):focus-visible, .button.is-ghost:not(.is-loading).is-focused';
const STATIC_FOCUS =
  '.button.is-static:not(.is-loading):focus-visible, .button.is-static:not(.is-loading).is-focused';
/** The rule outside forced colors, which names both. */
const OWN_FOCUS = `${GHOST_FOCUS}, ${STATIC_FOCUS}`;
const SELECTED = '.button.is-selected.is-selected:not(.is-loading)';
/** A selected button's forced-colors outline color, in the page's text color. */
const SELECTED_FOCUS = `${SELECTED}:focus-visible, ${SELECTED}.is-focused`;
const FORCED_FOCUS =
  '.button.button:not(.is-loading):focus-visible, .button.button:not(.is-loading).is-focused';

/** Bulma's focus outline, in its focus color, style, width and offset. */
const FOCUS_OUTLINE = {
  'outline-color':
    'hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l))',
  'outline-offset': 'var(--bulma-focus-offset)',
  'outline-style': 'var(--bulma-focus-style)',
  'outline-width': 'var(--bulma-focus-width)',
};

/** The declarations of the rule with exactly this selector, in this block. */
function find(rules: Rule[], selector: string, context: string[] = []) {
  const rule = rules.find(
    r => r.selector === selector && r.context.join(' ') === context.join(' ')
  );
  if (!rule) throw new Error(`no rule for ${selector}`);
  return rule.declarations;
}

/**
 * A compound selector's weight in classes and pseudo-classes, which is all
 * these selectors are made of. `:not()` weighs what it holds.
 */
const weight = (selector: string) =>
  (selector.replace(/:not\(/g, '(').match(/\.[\w-]+|:[\w-]+/g) ?? []).length;

/** Whether a selector is the keyboard or forced focus state these draw. */
const focused = (selector: string) =>
  /:focus-visible|\.is-focused/.test(selector);

/**
 * Whether an element matches each selector of a list on its classes alone.
 * :focus-visible is the keyboard state, which a test can't put an element
 * in, so dropping it leaves the classes the rule is anchored to.
 */
const matchesClasses = (element: Element, selectors: string) =>
  selectors
    .split(', ')
    .every(part => element.matches(part.replace(/:focus-visible/g, '')));

describe('Button focus outline', () => {
  it("draws Bulma's focus outline on a focused ghost or static button", () => {
    expect(find(PLAIN, OWN_FOCUS)).toEqual(FOCUS_OUTLINE);
  });

  it('matches a ghost Button, which has no link-button class, and a ghost LinkButton', () => {
    const { getByRole } = render(
      <div>
        <Button color="ghost" isFocused>
          Ghost
        </Button>
        <LinkButton variant="ghost" isFocused>
          Link
        </LinkButton>
      </div>
    );
    const button = getByRole('button', { name: 'Ghost' });
    const link = getByRole('button', { name: 'Link' });
    expect(button).not.toHaveClass('link-button');
    expect(link).toHaveClass('link-button');
    expect(matchesClasses(button, GHOST_FOCUS)).toBe(true);
    expect(matchesClasses(link, GHOST_FOCUS)).toBe(true);
  });

  it('matches a static Button, as a button or a link, which Tab reaches', () => {
    // Bulma's `is-static` draws no shadow, and its border color outranks the
    // focus one, so without the outline nothing shows focus.
    const { getByRole } = render(
      <div>
        <Button isStatic isFocused>
          @gmail.com
        </Button>
        <Button as="a" href="#domain" isStatic isFocused>
          @example.com
        </Button>
      </div>
    );
    for (const [role, name] of [
      ['button', '@gmail.com'],
      ['link', '@example.com'],
    ]) {
      const element = getByRole(role, { name });
      expect(element.tabIndex).toBe(0);
      expect(element).toHaveClass('is-static', 'is-focused');
      expect(matchesClasses(element, STATIC_FOCUS)).toBe(true);
      expect(matchesClasses(element, GHOST_FOCUS)).toBe(false);
    }
  });

  it("draws Bulma's focus outline on every focused button in forced colors", () => {
    expect(find(PLAIN, FORCED_FOCUS, [FORCED])).toEqual(FOCUS_OUTLINE);
  });

  it('matches a plain, an outlined, a colored and a small Button, and a LinkButton, in forced colors', () => {
    const { getByRole } = render(
      <div>
        <Button isFocused>Plain</Button>
        <Button color="primary" isOutlined isFocused>
          Outlined
        </Button>
        <Button color="primary" isFocused>
          Colored
        </Button>
        <Button size="small" isFocused>
          Small
        </Button>
        <LinkButton isFocused>Link</LinkButton>
      </div>
    );
    for (const name of ['Plain', 'Outlined', 'Colored', 'Small', 'Link']) {
      const button = getByRole('button', { name });
      expect(button).toHaveClass('is-focused');
      expect(matchesClasses(button, FORCED_FOCUS)).toBe(true);
    }
  });

  it('leaves a loading button to the loader, which rings it in and out of forced colors', () => {
    // So the order the two partials load in can't decide which ring a
    // loading ghost or static one gets.
    const { getByRole } = render(
      <div>
        <Button isLoading isFocused>
          Saving
        </Button>
        <Button color="ghost" isLoading isFocused>
          Ghost
        </Button>
        <Button isStatic isLoading isFocused>
          Static
        </Button>
        <ToggleButton defaultPressed isLoading isFocused>
          Pressed
        </ToggleButton>
      </div>
    );
    for (const name of ['Saving', 'Ghost', 'Static', 'Pressed']) {
      const button = getByRole('button', { name });
      expect(button).toHaveClass('is-loading', 'is-focused');
      for (const part of [OWN_FOCUS, FORCED_FOCUS, SELECTED_FOCUS].flatMap(s =>
        s.split(', ')
      )) {
        expect(button.matches(part.replace(/:focus-visible/g, ''))).toBe(false);
      }
    }
  });

  it('draws no outline on an unfocused button', () => {
    for (const rule of PLAIN) {
      const outlines = Object.keys(rule.declarations).filter(property =>
        property.startsWith('outline')
      );
      if (!outlines.length) continue;
      for (const part of rule.selector.split(', ')) {
        expect(focused(part)).toBe(true);
      }
    }
    const { getByRole } = render(<Button color="ghost">Ghost</Button>);
    const button = getByRole('button', { name: 'Ghost' });
    expect(button).not.toHaveClass('is-focused');
    expect(button.matches('.button.is-ghost.is-focused')).toBe(false);
  });

  it('draws only these outlines, the forced colors ones in their media query', () => {
    expect(
      PLAIN.filter(outlines).map(r => [r.context.join(' '), r.selector])
    ).toEqual([
      ['', OWN_FOCUS],
      [FORCED, FORCED_FOCUS],
      [FORCED, SELECTED_FOCUS],
    ]);
  });

  it("outranks the control mixin's outline: none, wherever the two load", () => {
    const theirs = BULMA.filter(
      r => !r.context.length && r.declarations.outline === 'none'
    ).flatMap(r => r.selector.split(', '));
    // @extend writes the mixin's `.is-focused` before `.button`. Both are
    // `outline: none`, and a focused button matches each of them.
    expect(theirs.filter(focused)).toEqual([
      '.button:focus-visible',
      '.is-focused.button',
    ]);
    for (const part of [OWN_FOCUS, FORCED_FOCUS, SELECTED_FOCUS].flatMap(s =>
      s.split(', ')
    )) {
      for (const other of theirs.filter(focused)) {
        expect(weight(part)).toBeGreaterThan(weight(other));
      }
    }
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED.map(r => [r.context, r.selector])).toEqual(
      PLAIN.map(r => [
        r.context,
        r.selector.replace(/\.(button|is-)/g, '.bestax-$1'),
      ])
    );
    expect(PREFIXED.map(r => r.declarations)).toEqual(
      PLAIN.map(r => r.declarations)
    );
  });

  it('matches a Button rendered under that prefix', () => {
    const prefixed = (selector: string) =>
      selector.replace(/\.(button|is-)/g, '.bestax-$1');
    const { getByRole } = render(
      <ConfigProvider classPrefix="bestax-">
        <Button color="ghost" isFocused>
          Ghost
        </Button>
        <Button isStatic isFocused>
          Static
        </Button>
      </ConfigProvider>
    );
    for (const [name, own] of [
      ['Ghost', GHOST_FOCUS],
      ['Static', STATIC_FOCUS],
    ]) {
      const button = getByRole('button', { name });
      expect(button).toHaveClass('bestax-button', 'bestax-is-focused');
      expect(matchesClasses(button, prefixed(own))).toBe(true);
      expect(matchesClasses(button, prefixed(FORCED_FOCUS))).toBe(true);
    }
    expect(PREFIXED.filter(outlines).map(r => r.selector)).toEqual(
      [OWN_FOCUS, FORCED_FOCUS, SELECTED_FOCUS].map(prefixed)
    );
  });
});

describe('colored buttons in forced colors', () => {
  it('sets a 1px border width on each doubled color class, and only there', () => {
    expect(PLAIN.filter(borders)).toEqual(
      COLORS.map(name => ({
        context: [FORCED],
        selector: colored(name),
        declarations: { '--bulma-button-border-width': '1px' },
      }))
    );
  });

  it("sets an outlined button's lightness on each color but the fixed shades, and only there", () => {
    const fixed = ['white', 'black', 'light', 'dark'];
    expect(
      PLAIN.filter(lightnesses).map(r => [r.context.join(' '), r.selector])
    ).toEqual(
      COLORS.filter(name => !fixed.includes(name)).map(name => [
        '',
        `.button.is-${name}.is-outlined:not(.is-inverted)`,
      ])
    );
  });

  it("holds these borders, the focus outlines, the outlined buttons' lightness and the selected look, and nothing else", () => {
    expect(
      PLAIN.filter(
        rule =>
          !outlines(rule) &&
          !borders(rule) &&
          !lightnesses(rule) &&
          !selects(rule)
      )
    ).toEqual([]);
  });

  it("loops over Bulma's colors, all but text", () => {
    const css = compile(
      `@use 'sass:map';
       @use 'bulma/sass/utilities/derived-variables' as dv;
       :root { --colors: #{map.keys(dv.$colors)}; }`
    );
    const keys = rulesOf(css)[0].declarations['--colors'].split(/,\s*/);
    expect(keys).toContain('text');
    expect(COLORS).toEqual(keys.filter(name => name !== 'text'));
    expect(COLORS).toEqual(
      expect.arrayContaining(['white', 'black', 'light', 'dark'])
    );
  });

  it('gives a text button, and so a text or underline LinkButton, no border', () => {
    expect(
      PLAIN.filter(borders).some(rule => rule.selector.includes('is-text'))
    ).toBe(false);
    const { getByRole } = render(
      <div>
        <Button color="text">Text</Button>
        <LinkButton>Link</LinkButton>
        <LinkButton variant="underline">Underline</LinkButton>
      </div>
    );
    for (const name of ['Text', 'Link', 'Underline']) {
      const button = getByRole('button', { name });
      expect(button).toHaveClass('is-text');
      for (const rule of PLAIN.filter(borders)) {
        expect(button.matches(rule.selector)).toBe(false);
      }
    }
  });

  it('excludes an outlined button and still matches a colored one', () => {
    const selector = colored('primary');
    const button = document.createElement('button');
    button.className = 'button is-primary';
    expect(button.matches(selector)).toBe(true);
    button.classList.add('is-outlined');
    expect(button.matches(selector)).toBe(false);
  });

  it('keeps the focus outline on a colored button, whose border no longer changes on focus', () => {
    // Bulma gives a focused colored button the same 1px border, so the
    // outline is what tells it apart from one at rest.
    const focusBorder = BULMA.filter(
      rule =>
        !rule.context.length &&
        rule.declarations['--bulma-button-border-width'] === '1px' &&
        rule.selector.split(', ').includes('.button.is-primary:focus-visible')
    );
    expect(focusBorder).toHaveLength(1);
    const { getByRole } = render(
      <Button color="primary" isFocused>
        Save
      </Button>
    );
    const button = getByRole('button', { name: 'Save' });
    expect(button.matches(colored('primary'))).toBe(true);
    expect(matchesClasses(button, FORCED_FOCUS)).toBe(true);
  });

  it("outranks Bulma's colored-button rule, whichever stylesheet loads first", () => {
    const theirs = BULMA.filter(
      rule =>
        rule.declarations['--bulma-button-border-width'] === '0px' &&
        rule.selector === '.button.is-primary'
    );
    expect(theirs).toHaveLength(1);
    expect(weight(colored('primary'))).toBeGreaterThan(
      weight('.button.is-primary')
    );
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED.filter(borders)).toEqual(
      COLORS.map(name => ({
        context: [FORCED],
        selector: colored(name, 'bestax-'),
        declarations: { '--bulma-button-border-width': '1px' },
      }))
    );
  });
});

// A pressed ToggleButton and a checked SegmentedControl segment differ from
// the buttons beside them only by Bulma's fill, which forced colors replaces,
// so the partial draws a selected button in the system's selection colors
// there (#1869), and a disabled one in its disabled colors.
describe('selected buttons in forced colors', () => {
  const DISABLED = [
    `${SELECTED}[disabled]`,
    `${SELECTED}.is-disabled`,
    `fieldset[disabled] ${SELECTED}`,
  ].join(', ');

  it("draws a selected button in the system's selection colors, in forced colors only", () => {
    expect(find(PLAIN, SELECTED, [FORCED])).toEqual({
      'forced-color-adjust': 'none',
      'background-color': 'Highlight',
      'border-color': 'Highlight',
      'box-shadow': 'none',
      color: 'HighlightText',
    });
    expect(find(PLAIN, DISABLED, [FORCED])).toEqual({
      'background-color': 'GrayText',
      'border-color': 'GrayText',
      color: 'Canvas',
      opacity: '1',
    });
    expect(
      PLAIN.filter(selects).map(r => [r.context.join(' '), r.selector])
    ).toEqual([
      [FORCED, SELECTED],
      [FORCED, SELECTED_FOCUS],
      [FORCED, DISABLED],
    ]);
  });

  it("rings a focused one in the page's text color, not Bulma's focus color", () => {
    // Forcing is off on a selected button, so the forced colors outline
    // would keep Bulma's focus color.
    expect(find(PLAIN, SELECTED_FOCUS, [FORCED])).toEqual({
      'outline-color': 'CanvasText',
    });
    // It outranks the forced colors outline, whichever comes first.
    for (const part of SELECTED_FOCUS.split(', ')) {
      for (const other of FORCED_FOCUS.split(', ')) {
        expect(weight(part)).toBeGreaterThan(weight(other));
      }
    }
    const { getByRole } = render(
      <ToggleButton defaultPressed isFocused>
        Bold
      </ToggleButton>
    );
    const button = getByRole('button', { name: 'Bold' });
    expect(matchesClasses(button, SELECTED_FOCUS)).toBe(true);
    expect(matchesClasses(button, FORCED_FOCUS)).toBe(true);
  });

  it('matches a pressed ToggleButton and a checked segment, and not the others', () => {
    const { getByRole } = render(
      <div>
        <ToggleButton>Italic</ToggleButton>
        <ToggleButton defaultPressed>Bold</ToggleButton>
        <ToggleButton defaultPressed color="success">
          Underline
        </ToggleButton>
        <SegmentedControl aria-label="View" defaultValue="week">
          <SegmentedControl.Segment value="day">Day</SegmentedControl.Segment>
          <SegmentedControl.Segment value="week">Week</SegmentedControl.Segment>
        </SegmentedControl>
      </div>
    );
    const on = [
      getByRole('button', { name: 'Bold', pressed: true }),
      getByRole('button', { name: 'Underline', pressed: true }),
      getByRole('radio', { name: 'Week', checked: true }),
    ];
    const off = [
      getByRole('button', { name: 'Italic', pressed: false }),
      getByRole('radio', { name: 'Day', checked: false }),
    ];
    for (const element of on) {
      expect(element.matches(SELECTED)).toBe(true);
      for (const part of DISABLED.split(', ')) {
        expect(element.matches(part)).toBe(false);
      }
    }
    for (const element of off) {
      expect(element.matches(SELECTED)).toBe(false);
    }
  });

  it('draws a disabled pressed toggle and a disabled checked segment in the disabled colors', () => {
    const { getByRole } = render(
      <div>
        <ToggleButton defaultPressed disabled>
          Bold
        </ToggleButton>
        <fieldset disabled>
          <ToggleButton defaultPressed>Italic</ToggleButton>
        </fieldset>
        <SegmentedControl aria-label="View" defaultValue="week">
          <SegmentedControl.Segment value="day">Day</SegmentedControl.Segment>
          <SegmentedControl.Segment value="week" disabled>
            Week
          </SegmentedControl.Segment>
        </SegmentedControl>
        {/* Selected links: one disabled through Button's is-disabled,
            since Button renders no disabled attribute on a link, and one in
            a disabled fieldset, the case Bulma dims. */}
        <Button as="a" href="#a" className="is-selected" isDisabled>
          Underline
        </Button>
        <fieldset disabled>
          <Button as="a" href="#b" className="is-selected">
            Strike
          </Button>
        </fieldset>
      </div>
    );
    const anyOf = (element: Element) =>
      DISABLED.split(', ').some(part => element.matches(part));
    for (const element of [
      getByRole('button', { name: 'Bold' }),
      getByRole('button', { name: 'Italic' }),
      getByRole('radio', { name: 'Week' }),
      getByRole('link', { name: 'Underline' }),
      getByRole('link', { name: 'Strike' }),
    ]) {
      expect(element.matches(SELECTED)).toBe(true);
      expect(anyOf(element)).toBe(true);
    }
  });

  it("outranks Bulma's fill and its disabled fill, whichever stylesheet loads first", () => {
    expect(weight(SELECTED)).toBeGreaterThan(weight('.button.is-link'));
    const theirs = BULMA.filter(
      rule =>
        !rule.context.length &&
        'background-color' in rule.declarations &&
        rule.selector.split(', ').includes('.button.is-link[disabled]')
    );
    expect(theirs).toHaveLength(1);
    // An attribute selector weighs what a class does.
    const asClasses = (selector: string) =>
      selector.replace(/\[[^\]]*\]/g, '.attribute');
    // Bulma's disabled opacity too, which would blend the fill into the page.
    const dimmed = BULMA.filter(
      rule => !rule.context.length && 'opacity' in rule.declarations
    ).flatMap(rule => rule.selector.split(', '));
    expect(dimmed).toContain('.button[disabled]');
    for (const part of DISABLED.split(', ')) {
      for (const other of ['.button.is-link[disabled]', ...dimmed]) {
        expect(weight(asClasses(part))).toBeGreaterThan(
          weight(asClasses(other))
        );
      }
    }
  });

  it('leaves a loading one to the loader, which draws it as any loading button', () => {
    const { getByRole } = render(
      <div>
        <ToggleButton defaultPressed isLoading>
          Bold
        </ToggleButton>
        <ToggleButton defaultPressed isLoading disabled>
          Italic
        </ToggleButton>
      </div>
    );
    for (const name of ['Bold', 'Italic']) {
      const button = getByRole('button', { name });
      expect(button).toHaveClass('is-selected', 'is-loading');
      for (const part of [SELECTED, ...DISABLED.split(', ')]) {
        expect(button.matches(part)).toBe(false);
      }
    }
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED.filter(selects).map(r => r.selector)).toEqual(
      [SELECTED, SELECTED_FOCUS, DISABLED].map(selector =>
        selector.replace(/\.(button|is-)/g, '.bestax-$1')
      )
    );
    const { getByRole } = render(
      <ConfigProvider classPrefix="bestax-">
        <ToggleButton defaultPressed>Bold</ToggleButton>
      </ConfigProvider>
    );
    expect(
      getByRole('button', { name: 'Bold' }).matches(
        '.bestax-button.bestax-is-selected.bestax-is-selected'
      )
    ).toBe(true);
  });
});

// Bulma draws an outlined button's label, border and loading ring in the
// color's own lightness, `--bulma-button-l`, and Bulma's link color reads at
// about 3.5:1 on the dark scheme that way, which is every Panel's "Reset all
// filters" button (#1637). The partial gives an outlined button the lighter
// of the color's own lightness and its on-scheme one. These resolve the
// variable across Bulma's CSS and the partial in either order with
// `css-cascade.ts`, and measure the label against bestax.css's own scheme
// variables (`contrast.ts`).
describe('outlined buttons on the dark scheme', () => {
  // The colors whose outlined button the partial adjusts, and the ones it
  // leaves alone: the fixed shades, and `text`, a text button.
  const ADJUSTED = ['primary', 'link', 'info', 'success', 'warning', 'danger'];
  const FIXED = ['white', 'black', 'light', 'dark'];

  /** The lightness the partial gives an outlined button in `color`. */
  // On a dark page the lighter of the two, and on a white one the color's
  // own, through a cap that grows with the page's distance from white.
  const lighter = (color: string) =>
    `max(var(--bulma-${color}-l),min(var(--bulma-${color}-on-scheme-l),var(--bulma-${color}-l)+(100%-var(--bulma-scheme-main-l))*2))`;

  /** A value without its spaces, which jsdom doesn't always keep. */
  const flat = (value: string | undefined) => value?.replace(/\s+/g, '');

  /** The button an outlined Button in `color` renders, under `prefix`. */
  const outlinedOf = (color: string, prefix = '') => {
    const button = (
      <Button color={color as 'link'} isOutlined>
        Reset
      </Button>
    );
    const { container } = render(
      prefix ? (
        <ConfigProvider classPrefix={prefix}>{button}</ConfigProvider>
      ) : (
        button
      )
    );
    return container.querySelector('button') as HTMLElement;
  };

  /** The `--bulma-button-l` the rules of `css` give `el`. */
  const lightnessOf = (el: Element, css: string) =>
    flat(customProperty(el, css, '--bulma-button-l'));

  const sheets = new Map<string, string>();
  const sheet = (name: string, build: () => string) => {
    if (!sheets.has(name)) sheets.set(name, build());
    return sheets.get(name)!;
  };
  const partial = (prefix = '') => compile(`@use 'elements/button';`, prefix);
  const orders: [string, () => string][] = [
    ['after', () => sheet('after', () => bulmaCss() + partial())],
    ['before', () => sheet('before', () => partial() + bulmaCss())],
  ];

  describe.each(orders)('with the partial %s Bulma', (_order, css) => {
    it.each(ADJUSTED)(
      'gives an outlined %s button the lighter lightness',
      color => {
        expect(lightnessOf(outlinedOf(color), css())).toBe(lighter(color));
      }
    );

    it.each(FIXED)("leaves an outlined %s button at Bulma's", color => {
      expect(lightnessOf(outlinedOf(color), css())).toBe(
        `var(--bulma-${color}-l)`
      );
    });

    it("leaves an inverted outlined button's lightness at Bulma's", () => {
      const { container } = render(
        <Button color="link" isOutlined isInverted>
          Go
        </Button>
      );
      const button = container.querySelector('button') as HTMLElement;
      expect(button).toHaveClass('is-outlined', 'is-inverted');
      expect(lightnessOf(button, css())).toBe('var(--bulma-link-l)');
    });

    it("leaves a filled button's lightness at Bulma's", () => {
      const { container } = render(<Button color="link">Go</Button>);
      expect(
        lightnessOf(container.querySelector('button') as HTMLElement, css())
      ).toBe('var(--bulma-link-l)');
    });

    it('gives Panel.ButtonBlock the lighter lightness', () => {
      const { container } = render(
        <Panel>
          <Panel.ButtonBlock>Reset all filters</Panel.ButtonBlock>
        </Panel>
      );
      const button = container.querySelector('button') as HTMLElement;
      expect(button).toHaveClass('button', 'is-link', 'is-outlined');
      expect(lightnessOf(button, css())).toBe(lighter('link'));
    });
  });

  it.each(ADJUSTED)(
    'keys an outlined %s button on the prefixed classes in the prefixed build',
    color => {
      const css = sheet(
        'prefixed',
        () => bulmaCss('versions/bulma-prefixed.css') + partial('bulma-')
      );
      expect(lightnessOf(outlinedOf(color, 'bulma-'), css)).toBe(
        lighter(color)
      );
    }
  );

  describe('in bestax.css', () => {
    let css = '';
    let schemes: Record<string, Vars>;

    // A hook keeps Vitest's 10s default rather than `testTimeout`, and
    // sass-embedded's start can take longer than that on a loaded machine.
    beforeAll(() => {
      css = compileSheet('bestax.scss');
      schemes = schemesOf(cascadeRules(css).rules);
    }, 30_000);

    /** An outlined button's label in `color`, at `lightness`. */
    const label = (color: string, lightness: string) =>
      `hsl(var(--bulma-${color}-h), var(--bulma-${color}-s), ${lightness})`;

    /** The page's background on `scheme`. */
    const page = (scheme: string) =>
      substitute(
        'hsl(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-main-l))',
        schemes[scheme]
      );

    /**
     * The contrast of an outlined button's label in `color` on the page, with
     * `own` set over the scheme.
     */
    const onPage = (
      scheme: string,
      color: string,
      lightness: string,
      own: Vars = {}
    ) =>
      contrast(
        substitute(label(color, lightness), { ...schemes[scheme], ...own }),
        page(scheme)
      );

    /** The lightness bestax.css gives an outlined button in `color`. */
    const bestax = (color: string) => {
      const value = lightnessOf(outlinedOf(color), css);
      if (!value) throw new Error(`no lightness for an outlined ${color}`);
      return value;
    };

    it("measures Bulma's outlined link under 4.5:1 on the dark scheme, so the check can fail", () => {
      expect(onPage('dark', 'link', 'var(--bulma-link-l)')).toBeLessThan(4.5);
    });

    it.each(['link', 'primary'])(
      'holds 4.5:1 for an outlined %s button on the dark scheme',
      color => {
        expect(onPage('dark', color, bestax(color))).toBeGreaterThanOrEqual(
          4.5
        );
      }
    );

    it.each(ADJUSTED)(
      'keeps an outlined %s button as it was on the light scheme',
      color => {
        expect(onPage('light', color, bestax(color))).toBe(
          onPage('light', color, `var(--bulma-${color}-l)`)
        );
      }
    );

    // A Theme can set a color's trio at runtime and leave its on-scheme
    // lightness at the build's, which is then lighter than a dark new color.
    const olive = {
      '--bulma-primary-h': '60',
      '--bulma-primary-s': '100%',
      '--bulma-primary-l': '20%',
    };

    it('keeps an outlined primary set darker at runtime as dark on the light scheme', () => {
      expect(onPage('light', 'primary', bestax('primary'), olive)).toBe(
        onPage('light', 'primary', 'var(--bulma-primary-l)', olive)
      );
    });

    it('lifts an outlined primary set darker at runtime on the dark scheme', () => {
      expect(
        onPage('dark', 'primary', 'var(--bulma-primary-l)', olive)
      ).toBeLessThan(4.5);
      expect(
        onPage('dark', 'primary', bestax('primary'), olive)
      ).toBeGreaterThanOrEqual(4.5);
    });

    // Bulma's own info, success, warning and danger already read on the dark
    // page, so their on-scheme lightness there is their own.
    it.each(['info', 'success', 'warning', 'danger'])(
      'keeps an outlined %s button as it was on the dark scheme, where it already read',
      color => {
        const before = onPage('dark', color, `var(--bulma-${color}-l)`);
        expect(before).toBeGreaterThanOrEqual(4.5);
        expect(onPage('dark', color, bestax(color))).toBe(before);
      }
    );
  });
});

// Bulma's button nests no light variant in its grayscale colors. With
// isLight, a button of one of them, or of no color, takes the light color's
// class as well, and the cascade between the two decides the look, which
// isLight's description says (#1678). These resolve the button's custom
// properties across Bulma's CSS and the partial with `css-cascade.ts`.
describe('isLight on a grayscale color', () => {
  const sheets = (prefix = '') =>
    prefix
      ? bulmaCss('versions/bulma-prefixed.css') +
        compilePartial('elements/button', prefix)
      : bulmaCss() + compilePartial('elements/button');
  const buttonOf = (props: ButtonProps, prefix = '') =>
    render(
      <ConfigProvider classPrefix={prefix || undefined}>
        <Button {...props}>Save</Button>
      </ConfigProvider>
    ).container.querySelector(`.${prefix}button`)!;
  /** The variables a color sets on a button, as the rules of `css` resolve them. */
  const looksOf = (el: Element, css: string) =>
    Object.fromEntries(
      ['h', 's', 'l', 'background-l', 'border-l', 'color-l'].map(name => [
        name,
        customProperty(el, css, `--bulma-button-${name}`),
      ])
    );
  /** What `.button.is-<name>` sets those variables to. */
  const colorOf = (name: string) => ({
    h: `var(--bulma-${name}-h)`,
    s: `var(--bulma-${name}-s)`,
    l: `var(--bulma-${name}-l)`,
    'background-l': `var(--bulma-${name}-l)`,
    'border-l': `var(--bulma-${name}-l)`,
    'color-l': `var(--bulma-${name}-invert-l)`,
  });

  describe.each(['', 'bulma-'])("with the class prefix '%s'", prefix => {
    it("gives white, black, light and no color the light button's look", () => {
      const css = sheets(prefix);
      for (const color of [undefined, 'white', 'black', 'light'] as const) {
        const el = buttonOf({ color, isLight: true }, prefix);
        expect(el).toHaveClass(`${prefix}is-light`);
        expect(looksOf(el, css)).toEqual(colorOf('light'));
      }
    });

    it("leaves a dark button the dark button's look", () => {
      const el = buttonOf({ color: 'dark', isLight: true }, prefix);
      expect(el).toHaveClass(`${prefix}is-dark`, `${prefix}is-light`);
      expect(looksOf(el, sheets(prefix))).toEqual(colorOf('dark'));
    });

    it('gives a palette color its light variant', () => {
      const el = buttonOf({ color: 'primary', isLight: true }, prefix);
      expect(looksOf(el, sheets(prefix))).toEqual({
        ...colorOf('primary'),
        'background-l': 'var(--bulma-light-l)',
        'color-l': 'var(--bulma-primary-light-invert-l)',
      });
    });
  });
});
