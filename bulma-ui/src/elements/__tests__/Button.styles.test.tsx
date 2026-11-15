// Bulma's control mixin sets `outline: none` on a focused button and shows
// focus through its border color and box-shadow. `.button.is-ghost` clears
// both, and forced colors drops the shadow and forces the border's color, so
// `_button.scss` gives a focused ghost button, and every focused button in
// forced colors, Bulma's focus outline. These compile that partial and read
// its rules as text, the way IconButton's styles test reads its own, beside
// Bulma's button rules, which they have to outrank. No browser: jsdom's CSSOM
// drops `:focus-visible` and evaluates no media query.
//
// Bulma also sets a colored button's border width to 0, and forced colors
// replaces its fill, so the partial gives that width back, at 1px, inside
// `forced-colors: active` only (#1458). An outlined button is left out of
// that selector, which `matches` checks without a browser, and so is a text
// button, which has no fill to lose.
//
// A loading button draws Bulma's ring in `--bulma-loading-color`, which Bulma
// sets to a filled button's label color, and an outlined one's. The partial
// sets it for the inverted, text and ghost styles to the color each draws its
// label in, which Bulma leaves out, so the ring shows (#1772).
import * as sass from 'sass';
import type { ReactElement } from 'react';
import path from 'path';
import { render } from '@testing-library/react';
import { Button } from '../Button';
import { LinkButton } from '../LinkButton';
import { ConfigProvider } from '../../helpers/Config';
import { selectorsIn, withoutWhere } from '../../__tests__/selectors';

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
/** Whether a rule sets a loading button's ring color. */
const rings = (rule: Rule) => '--bulma-loading-color' in rule.declarations;

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
  '.button.is-ghost:focus-visible, .button.is-ghost.is-focused';
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
 * these selectors are made of. `:not()` weighs what it holds, and `:where()`
 * nothing.
 */
const weight = (selector: string) =>
  (
    withoutWhere(selector)
      .replace(/:not\(/g, '(')
      .match(/\.[\w-]+|:[\w-]+/g) ?? []
  ).length;

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
  it("draws Bulma's focus outline on a focused ghost button", () => {
    expect(find(PLAIN, GHOST_FOCUS)).toEqual(FOCUS_OUTLINE);
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

  it('leaves a loading button to the loader, which rings it in system colors', () => {
    const { getByRole } = render(
      <Button isLoading isFocused>
        Saving
      </Button>
    );
    const button = getByRole('button', { name: 'Saving' });
    expect(button).toHaveClass('is-loading', 'is-focused');
    for (const part of FORCED_FOCUS.split(', ')) {
      expect(button.matches(part.replace(/:focus-visible/g, ''))).toBe(false);
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

  it('draws only these outlines, the forced colors one in its media query', () => {
    expect(
      PLAIN.filter(outlines).map(r => [r.context.join(' '), r.selector])
    ).toEqual([
      ['', GHOST_FOCUS],
      [FORCED, FORCED_FOCUS],
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
    for (const part of [GHOST_FOCUS, FORCED_FOCUS].flatMap(s =>
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
    const { getByRole } = render(
      <ConfigProvider classPrefix="bestax-">
        <Button color="ghost" isFocused>
          Ghost
        </Button>
      </ConfigProvider>
    );
    const button = getByRole('button', { name: 'Ghost' });
    expect(button).toHaveClass('bestax-button', 'bestax-is-focused');
    for (const rule of PREFIXED.filter(outlines)) {
      expect(matchesClasses(button, rule.selector)).toBe(true);
    }
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

  it('holds these borders, the focus outlines and the loading rings, and nothing else', () => {
    expect(
      PLAIN.filter(rule => !outlines(rule) && !borders(rule) && !rings(rule))
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

describe('loading rings', () => {
  // Each style, the selector list that sets its ring, and the rule Bulma
  // paints its label in.
  const STYLES = [
    {
      style: 'inverted',
      selector:
        '.button.is-inverted:where(:not(fieldset[disabled] *, [disabled]:is(.is-white, .is-black, .is-light, .is-dark, .is-primary, .is-link, .is-info, .is-success, .is-warning, .is-danger))), .button.is-inverted.is-outlined:where(:not(fieldset[disabled] *, [disabled]:is(.is-white, .is-black, .is-light, .is-dark, .is-primary, .is-link, .is-info, .is-success, .is-warning, .is-danger)))',
      label: '.button.is-inverted',
    },
    {
      style: 'text',
      selector: '.button.is-text, .button.is-text.is-outlined',
      label: '.button.is-text',
    },
    {
      style: 'ghost',
      selector: '.button.is-ghost, .button.is-ghost.is-outlined',
      label: '.button.is-ghost',
    },
  ];

  // The rule Bulma paints a style's label in. `.button.is-text` is also a
  // color in Bulma's loop, which comes first and paints nothing.
  const labelRule = (selector: string) => {
    let found = -1;
    BULMA.forEach((rule, index) => {
      if (rule.selector === selector && 'color' in rule.declarations) {
        found = index;
      }
    });
    return found;
  };

  it('sets a ring color for these styles, and only them', () => {
    expect(PLAIN.filter(rings).map(rule => rule.selector)).toEqual(
      STYLES.map(({ selector }) => selector)
    );
    expect(PLAIN.filter(rings).every(rule => !rule.context.length)).toBe(true);
  });

  it.each(STYLES)(
    'draws a loading $style button’s ring in the color Bulma paints its label',
    ({ selector, label }) => {
      expect(labelRule(label)).toBeGreaterThan(-1);
      expect(find(PLAIN, selector)['--bulma-loading-color']).toBe(
        BULMA[labelRule(label)].declarations.color
      );
    }
  );

  it("outranks each of Bulma's ring colors a button with that style also matches, whichever loads first", () => {
    const theirs = BULMA.filter(rings).flatMap(rule =>
      selectorsIn(rule.selector)
    );
    // On every button, and again on an outlined one.
    expect(theirs).toEqual(['.button', '.button.is-outlined']);
    for (const part of STYLES.flatMap(({ selector }) =>
      selectorsIn(selector)
    )) {
      const element = document.createElement('button');
      element.className = withoutWhere(part)
        .split('.')
        .filter(Boolean)
        .join(' ');
      for (const other of theirs.filter(o => element.matches(o))) {
        expect([part, other, weight(part) > weight(other)]).toEqual([
          part,
          other,
          true,
        ]);
      }
    }
  });

  it('gives a text or ghost style the tie with inverted, as Bulma draws it over inverted', () => {
    const order = (style: string) =>
      PLAIN.findIndex(
        rule =>
          rule.selector ===
          STYLES.find(entry => entry.style === style)!.selector
      );
    // A tie, which only holds while the inverted rule's guard weighs nothing.
    // Read off the compiled rules.
    const compiled = (style: string) =>
      selectorsIn(
        PLAIN.filter(rings).find(rule =>
          rule.selector.includes(`.is-${style}`)
        )!.selector
      );
    expect(compiled('inverted').map(weight)).toEqual(
      compiled('text').map(weight)
    );
    expect(compiled('inverted').map(weight)).toEqual(
      compiled('ghost').map(weight)
    );
    // `weight` reads classes alone, so check the guard is all in `:where()`:
    // without it the selectors are the classes alone, as text's are.
    expect(compiled('inverted').map(withoutWhere)).toEqual([
      '.button.is-inverted',
      '.button.is-inverted.is-outlined',
    ]);
    expect(order('text')).toBeGreaterThan(order('inverted'));
    expect(order('ghost')).toBeGreaterThan(order('inverted'));
    // Bulma's own label rules, in the same order.
    expect(labelRule('.button.is-text')).toBeGreaterThan(
      labelRule('.button.is-inverted')
    );
    expect(labelRule('.button.is-ghost')).toBeGreaterThan(
      labelRule('.button.is-inverted')
    );
  });

  it('gives a ghost LinkButton’s ring the text color its label has, over the ghost button’s', () => {
    const link = rulesOf(compile(`@use 'elements/linkbutton';`));
    const ghost = find(link, '.button.link-button.is-ghost');
    expect(ghost['--bulma-loading-color']).toBe(
      'var(--bulma-link-button-ghost-color)'
    );
    expect(ghost.color).toBe('var(--bulma-link-button-ghost-color)');
    expect(weight('.button.link-button.is-ghost')).toBeGreaterThan(
      weight('.button.is-ghost')
    );
  });

  it('leaves a disabled inverted button to Bulma where its disabled fill wins, and only there', () => {
    // Bulma's ring is the filled label's color, which shows on the disabled
    // fill, where the inverted label takes the fill's own color. That's a
    // colored disabled button, and any in a disabled fieldset. An uncolored
    // disabled one keeps its inverted fill, so it keeps this ring.
    const inverted = PLAIN.filter(rings).find(rule =>
      rule.selector.includes('is-inverted')
    )!;
    const parts = selectorsIn(inverted.selector);
    const { container } = render(
      <>
        <Button color="primary" isInverted isLoading disabled>
          Disabled
        </Button>
        <fieldset disabled>
          <Button isInverted isLoading>
            In a fieldset
          </Button>
        </fieldset>
        <Button isInverted isLoading disabled>
          Uncolored
        </Button>
        <Button color="primary" isInverted isLoading>
          Enabled
        </Button>
      </>
    );
    const [disabled, inFieldset, uncolored, enabled] = Array.from(
      container.querySelectorAll('.button')
    );
    const matched = (el: Element) => parts.some(part => el.matches(part));
    expect([
      matched(disabled),
      matched(inFieldset),
      matched(uncolored),
      matched(enabled),
    ]).toEqual([false, false, true, true]);
  });

  it.each<[string, ReactElement]>([
    [
      'an inverted Button',
      <Button key="x" color="primary" isInverted isLoading>
        Save
      </Button>,
    ],
    [
      'a text Button',
      <Button key="x" color="text" isLoading>
        Save
      </Button>,
    ],
    [
      'an outlined ghost Button',
      <Button key="x" color="ghost" isOutlined isLoading>
        Save
      </Button>,
    ],
    [
      'a LinkButton',
      <LinkButton key="x" isLoading>
        Save
      </LinkButton>,
    ],
    [
      'an underline LinkButton',
      <LinkButton key="x" variant="underline" isLoading>
        Save
      </LinkButton>,
    ],
    [
      'a ghost LinkButton',
      <LinkButton key="x" variant="ghost" isLoading>
        Save
      </LinkButton>,
    ],
  ])('matches %s', (_name, element) => {
    const { container } = render(element);
    const button = container.querySelector('.button')!;
    expect(
      PLAIN.filter(rings).some(rule =>
        selectorsIn(rule.selector).some(part => button.matches(part))
      )
    ).toBe(true);
  });
});
