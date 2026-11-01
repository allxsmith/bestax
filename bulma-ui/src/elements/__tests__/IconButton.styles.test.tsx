// `_iconbutton.scss` turns Bulma's rounded pill into a circle on an
// IconButton, and only there. These compile it, with no prefix and under
// one, and read its rules as text, the way RingProgress's are read, beside
// Bulma's own rounded rule, which it has to outrank.
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

/** How many classes a compound selector of classes names. */
const classCount = (selector: string) => selector.split('.').length - 1;

describe('IconButton styles', () => {
  it('takes back the padding Bulma adds to a rounded button', () => {
    expect(PLAIN).toEqual([
      {
        context: [],
        selector: '.button.icon-button.is-rounded',
        declarations: {
          'padding-inline':
            'calc(var(--bulma-button-padding-horizontal) - var(--bulma-button-border-width))',
        },
      },
    ]);
  });

  it("puts it back to a plain button's padding, so the width is the height", () => {
    const bulma = rulesOf(compile(`@use 'bulma/sass/elements/button';`));
    // Bulma writes `.button` in more than one rule, so merge them in order.
    const merged = (selector: string) =>
      Object.assign(
        {},
        ...bulma
          .filter(r => r.selector === selector && r.context.length === 0)
          .map(r => r.declarations)
      ) as Record<string, string>;
    const plain = merged('.button');
    const rounded = merged('.button.is-rounded');
    const circle = PLAIN[0].declarations['padding-inline'];
    // Bulma's square comes from its plain padding; its pill adds to it.
    expect(plain['padding-left']).toBe(circle);
    expect(plain['padding-right']).toBe(circle);
    expect(rounded['padding-left']).not.toBe(circle);
    expect(rounded['padding-left']).toContain('0.25em');
  });

  it("outranks Bulma's rounded rule, wherever the two load", () => {
    expect(classCount(PLAIN[0].selector)).toBeGreaterThan(
      classCount('.button.is-rounded')
    );
  });

  it('registers no variables of its own', () => {
    for (const rule of PLAIN) {
      for (const property of Object.keys(rule.declarations)) {
        expect(property.startsWith('--')).toBe(false);
      }
    }
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED.map(r => r.selector)).toEqual([
      '.bestax-button.bestax-icon-button.bestax-is-rounded',
    ]);
    expect(PREFIXED[0].declarations).toEqual(PLAIN[0].declarations);
  });
});
