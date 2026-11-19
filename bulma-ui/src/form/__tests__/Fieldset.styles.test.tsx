// `_fieldset.scss` draws the box and the legend, which jsdom never loads, so
// these compile it, with no prefix and under one, and read its rules as text,
// the way RingProgress's are read.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/fieldset';`,
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
  // What each open brace opened: an at-rule's head, or a style rule.
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

/** The declarations of the rule with exactly this selector, in this context. */
function find(rules: Rule[], selector: string, context: string[] = []) {
  const rule = rules.find(
    r =>
      r.selector === selector && r.context.join(' | ') === context.join(' | ')
  );
  if (!rule) throw new Error(`no rule for ${selector} in ${context}`);
  return rule.declarations;
}

/** Every declaration on the root class, merged in source order. */
const root = (rules: Rule[], selector = '.fieldset') =>
  Object.assign(
    {},
    ...rules
      .filter(r => r.selector === selector && r.context.length === 0)
      .map(r => r.declarations)
  );

describe('Fieldset styles', () => {
  it('registers its variables on the root, from Bulma tokens', () => {
    expect(root(PLAIN)).toMatchObject({
      '--bulma-fieldset-background': 'var(--bulma-scheme-main)',
      '--bulma-fieldset-filled-background': 'var(--bulma-background)',
      '--bulma-fieldset-border-color': 'var(--bulma-border)',
      '--bulma-fieldset-border-width': '1px',
      '--bulma-fieldset-radius': 'var(--bulma-radius-large)',
      '--bulma-fieldset-padding': '1.25rem',
      '--bulma-fieldset-padding-top': '0.75rem',
      '--bulma-fieldset-spacing': 'var(--bulma-block-spacing)',
      '--bulma-fieldset-legend-color': 'var(--bulma-label-color)',
      '--bulma-fieldset-legend-size': 'var(--bulma-size-normal)',
      '--bulma-fieldset-legend-weight': 'var(--bulma-label-weight)',
      '--bulma-fieldset-legend-padding': '0.5em',
      '--bulma-fieldset-legend-spacing': 'var(--bulma-label-spacing)',
    });
  });

  it('draws the default box from those variables', () => {
    expect(root(PLAIN)).toMatchObject({
      'background-color': 'var(--bulma-fieldset-background)',
      border:
        'var(--bulma-fieldset-border-width) solid var(--bulma-fieldset-border-color)',
      'border-radius': 'var(--bulma-fieldset-radius)',
      padding: 'var(--bulma-fieldset-padding)',
      'padding-block-start': 'var(--bulma-fieldset-padding-top)',
    });
  });

  it("resets the browser's min-content floor, which Bulma keeps", () => {
    expect(root(PLAIN)['min-inline-size']).toBe('0');
  });

  it('spaces a Fieldset from what follows it', () => {
    expect(find(PLAIN, '.fieldset:not(:last-child)')).toEqual({
      'margin-block-end': 'var(--bulma-fieldset-spacing)',
    });
  });

  it('tints the filled variant', () => {
    expect(find(PLAIN, '.fieldset.is-filled')).toEqual({
      'background-color': 'var(--bulma-fieldset-filled-background)',
    });
  });

  it('draws no box for the unstyled variant', () => {
    expect(find(PLAIN, '.fieldset.is-unstyled')).toEqual({
      'background-color': 'transparent',
      border: '0',
      'border-radius': '0',
      padding: '0',
    });
  });

  it('gives the legend the label look, with room in the border', () => {
    expect(find(PLAIN, '.fieldset-legend')).toEqual({
      color: 'var(--bulma-fieldset-legend-color)',
      'font-size': 'var(--bulma-fieldset-legend-size)',
      'font-weight': 'var(--bulma-fieldset-legend-weight)',
      'padding-inline': 'var(--bulma-fieldset-legend-padding)',
    });
  });

  it('spaces the unstyled legend from the content, as a label is', () => {
    expect(find(PLAIN, '.fieldset.is-unstyled > .fieldset-legend')).toEqual({
      'margin-block-end': 'var(--bulma-fieldset-legend-spacing)',
      'padding-inline': '0',
    });
  });

  it("keeps an enabled checkbox or radio in the legend from Bulma's disabled look", () => {
    expect(
      find(
        PLAIN,
        '.fieldset-legend .checkbox:has(input:enabled), .fieldset-legend .radio:has(input:enabled)'
      )
    ).toEqual({ color: 'inherit', cursor: 'pointer' });
  });

  it('draws the border in the text color in forced colors', () => {
    expect(
      find(PLAIN, '.fieldset', ['@media (forced-colors: active)'])
    ).toEqual({ 'border-color': 'CanvasText' });
  });

  it('prefixes every class under a class prefix', () => {
    const selectors = PREFIXED.map(r => r.selector).join(' ');
    expect(selectors).not.toMatch(/(^|[\s,>(])\.(?!bestax-)[a-z]/);
    expect(root(PREFIXED, '.bestax-fieldset')['min-inline-size']).toBe('0');
    expect(find(PREFIXED, '.bestax-fieldset.bestax-is-filled')).toEqual({
      'background-color': 'var(--bulma-fieldset-filled-background)',
    });
    expect(
      find(
        PREFIXED,
        '.bestax-fieldset.bestax-is-unstyled > .bestax-fieldset-legend'
      )
    ).toHaveProperty('margin-block-end');
  });
});
