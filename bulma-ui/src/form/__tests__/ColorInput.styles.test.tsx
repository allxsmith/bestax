// `_colorinput.scss` places the field's swatch and launcher, so these compile
// it, with no prefix and under one, and read its rules as text, the way
// ColorPicker's are read.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/colorinput';`,
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

// The mixins it uses bring keyframes along; only the field's own rules count.
const own = (rules: Rule[]) =>
  rules.filter(r => !/^(from|to)$/.test(r.selector));
const PLAIN = own(rulesOf(compile('')));
const PREFIXED = own(rulesOf(compile('bestax-')));

function find(rules: Rule[], selector: string) {
  const rule = rules.find(r => r.selector === selector);
  if (!rule) throw new Error(`no rule for ${selector}`);
  return rule.declarations;
}

describe('ColorInput styles', () => {
  it('registers its variables on the field', () => {
    expect(
      PLAIN.filter(r => r.selector === '.colorinput')
        .map(r => r.declarations)
        .reduce((all, one) => ({ ...all, ...one }), {})
    ).toMatchObject({
      '--bulma-colorinput-side-width': '2.5em',
      '--bulma-colorinput-swatch-size': '1.25em',
      '--bulma-colorinput-trigger-color': 'var(--bulma-text)',
      position: 'relative',
    });
  });

  it('keeps room on the logical sides, so they swap right to left', () => {
    expect(
      find(PLAIN, '.colorinput > .input, .colorinput > .input.is-rounded')
    ).toEqual({
      'padding-inline-start': 'var(--bulma-colorinput-side-width)',
    });
    expect(find(PLAIN, '.colorinput.has-trigger > .input')).toEqual({
      'padding-inline-end': 'var(--bulma-colorinput-side-width)',
    });
    expect(
      find(PLAIN, '.colorinput > .colorinput-swatch')['inset-inline-start']
    ).toBe('0');
    expect(
      find(PLAIN, '.colorinput > .colorinput-trigger')['inset-inline-end']
    ).toBe('0');
  });

  it('outranks Bulma’s rounded input padding, so the order the sheets load in doesn’t matter', () => {
    // Bulma's `.input.is-rounded` sets both side paddings at two classes.
    const classes = (selector: string) =>
      (selector.match(/\.[\w-]+/g) ?? []).length;
    const padding = PLAIN.filter(r =>
      Object.keys(r.declarations).some(d => d.startsWith('padding-inline'))
    );
    expect(padding).toHaveLength(2);
    for (const rule of padding) {
      const rounded = rule.selector
        .split(',')
        .map(part => part.trim())
        .filter(
          part =>
            part.endsWith('.input.is-rounded') || part.includes('.has-trigger')
        );
      expect(rounded).toHaveLength(1);
      expect(classes(rounded[0])).toBeGreaterThan(2);
    }
  });

  it('sizes the swatch and launcher with the input', () => {
    expect(
      find(
        PLAIN,
        '.colorinput > .input.is-large ~ .colorinput-swatch, .colorinput > .input.is-large ~ .colorinput-trigger'
      )
    ).toEqual({ 'font-size': 'var(--bulma-size-large)' });
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED.map(r => r.selector)).toEqual(
      PLAIN.map(r =>
        r.selector.replace(
          /\.(colorinput|color-|is-|has-|input\b|icon\b)/g,
          (_, name: string) => `.bestax-${name}`
        )
      )
    );
  });
});
