// `_colorswatch.scss` paints the swatch, so these compile it, with no prefix
// and under one, and read its rules as text, the way RingProgress's are read.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'elements/colorswatch';`,
    {
      loadPaths: [SCSS, NODE_MODULES],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

interface Rule {
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

const PLAIN = rulesOf(compile(''));
const PREFIXED = rulesOf(compile('bestax-'));

function find(rules: Rule[], selector: string, context: string[] = []) {
  const rule = rules.find(
    r =>
      r.selector === selector && r.context.join(' | ') === context.join(' | ')
  );
  if (!rule) throw new Error(`no rule for ${selector} in ${context}`);
  return rule.declarations;
}

describe('ColorSwatch styles', () => {
  it('registers its variables on the swatch, from Bulma tokens', () => {
    const root = PLAIN.filter(r => r.selector === '.color-swatch').map(
      r => r.declarations
    );
    expect(Object.assign({}, ...root)).toMatchObject({
      '--bulma-color-swatch-size': '1.5rem',
      '--bulma-color-swatch-radius': 'var(--bulma-radius)',
      '--bulma-color-swatch-checker-color': 'var(--bulma-border)',
      '--bulma-color-swatch-checker-background': 'var(--bulma-scheme-main)',
      'inline-size': 'var(--bulma-color-swatch-size)',
      'block-size': 'var(--bulma-color-swatch-size)',
    });
  });

  it('paints the color over a checkerboard, and opts out of forced colors', () => {
    const swatch = Object.assign(
      {},
      ...PLAIN.filter(
        r => r.selector === '.color-swatch' && !r.context.length
      ).map(r => r.declarations)
    );
    expect(swatch.background).toMatch(
      /^linear-gradient\(var\(--color-swatch-color\), var\(--color-swatch-color\)\), repeating-conic-gradient\(/
    );
    expect(swatch['forced-color-adjust']).toBe('none');
    expect(swatch['box-shadow']).toBe(
      'inset 0 0 0 1px var(--bulma-color-swatch-edge-color)'
    );
  });

  it('sizes and rounds it', () => {
    expect(find(PLAIN, '.color-swatch.is-large')).toEqual({
      '--bulma-color-swatch-size': '3rem',
    });
    expect(find(PLAIN, '.color-swatch.is-rounded')).toEqual({
      'border-radius': 'var(--bulma-radius-rounded)',
    });
  });

  it('edges it in the system text color in forced colors', () => {
    expect(
      find(PLAIN, '.color-swatch', ['@media (forced-colors: active)'])
    ).toEqual({ 'box-shadow': 'inset 0 0 0 1px CanvasText' });
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED.map(r => r.selector)).toEqual(
      PLAIN.map(r => r.selector.replace(/\.(color-swatch|is-)/g, '.bestax-$1'))
    );
  });
});
