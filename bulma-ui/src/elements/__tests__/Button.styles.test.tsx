// Bulma sets a colored button's border width to 0, and forced colors replaces
// its fill, so `_button.scss` gives that width back, at 1px, inside
// `forced-colors: active` only (#1458). jsdom evaluates no media query, so
// these compile the partial and read the rules as text. An outlined button
// is left out of the selector, which `matches` checks without a browser.
import * as sass from 'sass';
import path from 'path';

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

/** Bulma's button colors, the keys of `$colors`, in the order it ships them. */
const COLORS = [
  'white',
  'black',
  'light',
  'dark',
  'text',
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
