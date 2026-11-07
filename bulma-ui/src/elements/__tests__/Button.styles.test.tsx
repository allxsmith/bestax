// A ghost button shows no focus ring: Bulma's control mixin sets
// `outline: none` on `:focus-visible`, and `.button.is-ghost` then clears
// the border and box-shadow Bulma draws focus with. The rule lives in
// `_linkbutton.scss` (there is no `_button.scss`) at the root, not under
// `.link-button`, because a ghost Button has no `link-button` class. These
// compile that partial and read the rule as text, the way IconButton's
// styles test reads its own, beside Bulma's button rules, which it has to
// outrank. No browser: jsdom's CSSOM drops `:focus-visible`.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Button } from '../Button';
import { LinkButton } from '../LinkButton';

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

const PLAIN = rulesOf(compile(`@use 'elements/linkbutton';`));
const PREFIXED = rulesOf(compile(`@use 'elements/linkbutton';`, 'bestax-'));
const BULMA = rulesOf(compile(`@use 'bulma/sass/elements/button';`));

const GHOST_FOCUS =
  '.button.is-ghost:focus-visible, .button.is-ghost.is-focused';

/** The declarations of the top-level rule with exactly this selector. */
function find(rules: Rule[], selector: string) {
  const rule = rules.find(r => r.selector === selector && !r.context.length);
  if (!rule) throw new Error(`no rule for ${selector}`);
  return rule.declarations;
}

/**
 * A compound selector's weight in classes and pseudo-classes, which is all
 * these selectors are made of.
 */
const weight = (selector: string) =>
  (selector.match(/\.[\w-]+|:[\w-]+/g) ?? []).length;

/** Whether a selector is the keyboard or forced focus state this rule draws. */
const focused = (selector: string) =>
  /:focus-visible|\.is-focused/.test(selector);

describe('ghost button focus ring', () => {
  it("draws Bulma's focus outline on a focused ghost button", () => {
    expect(find(PLAIN, GHOST_FOCUS)).toEqual({
      'outline-color':
        'hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l))',
      'outline-offset': 'var(--bulma-focus-offset)',
      'outline-style': 'var(--bulma-focus-style)',
      'outline-width': 'var(--bulma-focus-width)',
    });
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
    // :focus-visible is the keyboard state. Drop it and the classes are
    // what the rule is anchored to, and neither selector asks for link-button.
    for (const part of GHOST_FOCUS.split(', ')) {
      const classes = part.replace(/:[\w-]+/g, '');
      expect(button.matches(classes)).toBe(true);
      expect(link.matches(classes)).toBe(true);
    }
    expect(find(PLAIN, GHOST_FOCUS)['outline-style']).toBe(
      'var(--bulma-focus-style)'
    );
  });

  it('draws no outline on an unfocused ghost button', () => {
    for (const rule of PLAIN) {
      const outlines = Object.keys(rule.declarations).filter(property =>
        property.startsWith('outline')
      );
      if (!outlines.length) continue;
      for (const part of rule.selector.split(', ')) {
        expect(part).toMatch(/:focus-visible|\.is-focused/);
      }
    }
  });

  it("outranks the control mixin's outline: none, wherever the two load", () => {
    const theirs = BULMA.filter(
      r => !r.context.length && r.declarations.outline === 'none'
    ).flatMap(r => r.selector.split(', '));
    // @extend writes the mixin's `.is-focused` before `.button`. Both are
    // `outline: none`, and a focused ghost button matches each of them.
    expect(theirs.filter(focused)).toEqual([
      '.button:focus-visible',
      '.is-focused.button',
    ]);
    for (const part of GHOST_FOCUS.split(', ')) {
      for (const other of theirs.filter(focused)) {
        expect(weight(part)).toBeGreaterThan(weight(other));
      }
    }
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED.map(r => r.selector)).toEqual(
      PLAIN.map(r =>
        r.selector.replace(/\.(button|link-button|is-)/g, '.bestax-$1')
      )
    );
    expect(PREFIXED.map(r => r.declarations)).toEqual(
      PLAIN.map(r => r.declarations)
    );
  });
});
