// Bulma sets a colored button's border width to 0, and forced colors replaces
// its fill, so `_button.scss` gives that width back, at 1px, inside
// `forced-colors: active` only (#1458). jsdom evaluates no media query, so
// these compile the partial and read the rules as text. An outlined button
// is left out of the selector, which `matches` checks without a browser, and
// so is a text button, which has no fill to lose.
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

const FORCED = '@media (forced-colors: active)';

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

const PLAIN = rulesOf(compile(`@use 'elements/button';`));
const PREFIXED = rulesOf(compile(`@use 'elements/button';`, 'bestax-'));

describe('colored buttons in forced colors', () => {
  it('sets a 1px border width on each doubled color class, and only there', () => {
    expect(PLAIN).toEqual(
      COLORS.map(name => ({
        context: [FORCED],
        selector: colored(name),
        declarations: { '--bulma-button-border-width': '1px' },
      }))
    );
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

  it('gives a text button, and so a text or underline LinkButton, no rule', () => {
    expect(PLAIN.some(rule => rule.selector.includes('is-text'))).toBe(false);
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
      for (const rule of PLAIN) {
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

  it("outranks Bulma's colored-button rule, whichever stylesheet loads first", () => {
    const bulma = rulesOf(compile(`@use 'bulma/sass/elements/button';`));
    const theirs = bulma.filter(
      rule =>
        rule.declarations['--bulma-button-border-width'] === '0px' &&
        rule.selector === '.button.is-primary'
    );
    expect(theirs).toHaveLength(1);
    // `:not()` counts as its argument, so the doubled class is four classes
    // to Bulma's two, and the extra `:not` token in this count only widens it.
    const weight = (selector: string) =>
      (selector.match(/\.[\w-]+|:[\w-]+/g) ?? []).length;
    expect(weight(colored('primary'))).toBeGreaterThan(
      weight('.button.is-primary')
    );
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED).toEqual(
      COLORS.map(name => ({
        context: [FORCED],
        selector: colored(name, 'bestax-'),
        declarations: { '--bulma-button-border-width': '1px' },
      }))
    );
  });
});
