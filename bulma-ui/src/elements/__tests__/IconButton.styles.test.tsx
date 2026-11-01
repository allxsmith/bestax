// `_iconbutton.scss` turns Bulma's rounded pill into a circle on an
// IconButton, and only there, and keeps Bulma's `text` and `ghost` looks from
// underlining the glyph. These compile it, with no prefix and under one, and
// read its rules as text, the way RingProgress's are read, beside Bulma's own
// button rules, which it has to outrank.
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

const PLAIN = rulesOf(compile(`@use 'elements/iconbutton';`));
const PREFIXED = rulesOf(compile(`@use 'elements/iconbutton';`, 'bestax-'));
const BULMA = rulesOf(compile(`@use 'bulma/sass/elements/button';`));

const CIRCLE = '.button.icon-button.is-rounded';
const NO_UNDERLINE = [
  '.button.icon-button.icon-button',
  '.button.icon-button.icon-button:hover',
  '.button.icon-button.icon-button.is-hovered',
];

/** The declarations of the top-level rule with exactly this selector. */
function find(rules: Rule[], selector: string) {
  const rule = rules.find(r => r.selector === selector && !r.context.length);
  if (!rule) throw new Error(`no rule for ${selector}`);
  return rule.declarations;
}

/** Bulma's declarations for a selector, its rules for it merged in order. */
const bulma = (selector: string) =>
  Object.assign(
    {},
    ...BULMA.filter(r => r.selector === selector && !r.context.length).map(
      r => r.declarations
    )
  ) as Record<string, string>;

/**
 * A compound selector's weight in classes and pseudo-classes, which is all
 * these selectors are made of.
 */
const weight = (selector: string) =>
  (selector.match(/\.[\w-]+|:[\w-]+/g) ?? []).length;

/** Whether a selector is for a hovered button, by pointer or by class. */
const hovered = (selector: string) => /:hover|\.is-hovered/.test(selector);

describe('IconButton styles', () => {
  it('takes back the padding Bulma adds to a rounded button', () => {
    expect(find(PLAIN, CIRCLE)).toEqual({
      'padding-inline':
        'calc(var(--bulma-button-padding-horizontal) - var(--bulma-button-border-width))',
    });
  });

  it("puts it back to a plain button's padding, so the width is the height", () => {
    const plain = bulma('.button');
    const rounded = bulma('.button.is-rounded');
    const circle = find(PLAIN, CIRCLE)['padding-inline'];
    // Bulma's square comes from its plain padding; its pill adds to it.
    expect(plain['padding-left']).toBe(circle);
    expect(plain['padding-right']).toBe(circle);
    expect(rounded['padding-left']).not.toBe(circle);
    expect(rounded['padding-left']).toContain('0.25em');
  });

  it("outranks Bulma's rounded rule, wherever the two load", () => {
    expect(weight(CIRCLE)).toBeGreaterThan(weight('.button.is-rounded'));
  });

  it('draws no underline under the glyph, at rest or hovered', () => {
    expect(find(PLAIN, NO_UNDERLINE.join(', '))).toEqual({
      'text-decoration': 'none',
    });
  });

  it('outranks each Bulma rule that underlines a button, wherever the two load', () => {
    // `is-text` underlines at rest, and `is-ghost` on hover.
    const underlines = BULMA.filter(
      r => !r.context.length && 'text-decoration' in r.declarations
    ).flatMap(r => r.selector.split(', '));
    expect(underlines).toEqual(
      expect.arrayContaining(['.button.is-text', '.button.is-ghost:hover'])
    );
    for (const theirs of underlines) {
      for (const ours of NO_UNDERLINE.filter(
        s => hovered(s) === hovered(theirs)
      )) {
        expect(weight(ours)).toBeGreaterThan(weight(theirs));
      }
    }
  });

  it('registers no variables of its own', () => {
    for (const rule of PLAIN) {
      for (const property of Object.keys(rule.declarations)) {
        expect(property.startsWith('--')).toBe(false);
      }
    }
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED.map(r => r.selector)).toEqual(
      PLAIN.map(r =>
        r.selector.replace(/\.(button|icon-button|is-)/g, '.bestax-$1')
      )
    );
    expect(PREFIXED.map(r => r.declarations)).toEqual(
      PLAIN.map(r => r.declarations)
    );
  });
});
