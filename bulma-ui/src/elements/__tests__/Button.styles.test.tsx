// Bulma's control mixin sets `outline: none` on a focused button and shows
// focus through its border color and box-shadow. `.button.is-ghost` clears
// both, and forced colors drops the shadow and forces the border's color, so
// `_button.scss` gives a focused ghost button, and every focused button in
// forced colors, Bulma's focus outline. These compile that partial and read
// its rules as text, the way IconButton's styles test reads its own, beside
// Bulma's button rules, which they have to outrank. No browser: jsdom's CSSOM
// drops `:focus-visible` and evaluates no media query.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Button } from '../Button';
import { LinkButton } from '../LinkButton';
import { ConfigProvider } from '../../helpers/Config';

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

const GHOST_FOCUS =
  '.button.is-ghost:focus-visible, .button.is-ghost.is-focused';
const FORCED_FOCUS = '.button.button:focus-visible, .button.button.is-focused';

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
 * these selectors are made of.
 */
const weight = (selector: string) =>
  (selector.match(/\.[\w-]+|:[\w-]+/g) ?? []).length;

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
    .every(part => element.matches(part.replace(/:[\w-]+/g, '')));

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

  it('has only these rules, the forced colors one in its media query', () => {
    expect(PLAIN.map(r => [r.context.join(' '), r.selector])).toEqual([
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
    for (const rule of PREFIXED) {
      expect(matchesClasses(button, rule.selector)).toBe(true);
    }
  });
});
