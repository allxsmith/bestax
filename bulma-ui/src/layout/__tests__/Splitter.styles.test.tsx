// `_splitter.scss` lays the panes out and draws the handles, so these compile
// it, with no prefix and under one, and read its rules. The sheet is read as
// text, the way ScrollArea's is: each rule's selector, the at-rules around
// it, and its declarations.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'layout/splitter';`,
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

const handle = '.splitter-handle';
const stacked = '.splitter.is-vertical > .splitter-handle';
const active = (base: string, part: string) =>
  [':hover', ':focus-visible', '.is-active']
    .map(state => `${base}${state}${part}`)
    .join(', ');

describe('Splitter styles', () => {
  it('registers its variables on the root, from Bulma tokens', () => {
    const root = PLAIN.filter(r => r.selector === '.splitter').map(
      r => r.declarations
    );
    expect(Object.assign({}, ...root)).toMatchObject({
      '--bulma-splitter-handle-size': '0.75rem',
      '--bulma-splitter-handle-size-coarse': '1.5rem',
      '--bulma-splitter-line-size': '1px',
      '--bulma-splitter-line-color': 'var(--bulma-border)',
      '--bulma-splitter-line-active-size': '2px',
      '--bulma-splitter-line-active-color': 'var(--bulma-primary)',
      '--bulma-splitter-grip-color': 'var(--bulma-border-hover)',
      display: 'flex',
      'flex-direction': 'row',
    });
    expect(find(PLAIN, '.splitter.is-vertical')).toEqual({
      'flex-direction': 'column',
    });
  });

  it('lets a pane be smaller than its content, which scrolls', () => {
    expect(find(PLAIN, '.splitter-pane')).toEqual({
      'min-width': '0',
      'min-height': '0',
      overflow: 'auto',
    });
  });

  it('makes the handle a fixed strip that a drag can use, with no scrolling or selecting', () => {
    expect(find(PLAIN, handle)).toMatchObject({
      flex: 'none',
      'inline-size': 'var(--bulma-splitter-handle-size)',
      cursor: 'col-resize',
      'touch-action': 'none',
      'user-select': 'none',
    });
  });

  it('draws the line and the grip as borders, which forced colors keeps', () => {
    expect(find(PLAIN, `${handle}::before`)['border-inline-start']).toBe(
      'var(--bulma-splitter-line-size) solid var(--bulma-splitter-line-color)'
    );
    expect(find(PLAIN, `${handle}::after`)['border-inline']).toBe(
      'calc(var(--bulma-splitter-grip-size) / 2) solid var(--bulma-splitter-grip-color)'
    );
  });

  it('turns the line the active color on hover, focus and drag', () => {
    expect(find(PLAIN, active(handle, '::before'))).toEqual({
      'border-inline-start-width': 'var(--bulma-splitter-line-active-size)',
      'border-inline-start-color': 'var(--bulma-splitter-line-active-color)',
    });
  });

  it('draws Bulma’s focus outline inside the strip', () => {
    expect(find(PLAIN, `${handle}:focus`)).toEqual({ outline: 'none' });
    expect(find(PLAIN, `${handle}:focus-visible`)).toMatchObject({
      'outline-offset': '-2px',
    });
  });

  it('lays the handle across when the panes are stacked', () => {
    expect(find(PLAIN, stacked)).toEqual({
      'inline-size': 'auto',
      'block-size': 'var(--bulma-splitter-handle-size)',
      cursor: 'row-resize',
    });
    expect(find(PLAIN, `${stacked}::before`)['border-block-start']).toBe(
      'var(--bulma-splitter-line-size) solid var(--bulma-splitter-line-color)'
    );
  });

  it('widens the strip for a coarse pointer', () => {
    expect(find(PLAIN, handle, ['@media (pointer: coarse)'])).toEqual({
      'inline-size': 'var(--bulma-splitter-handle-size-coarse)',
    });
    expect(find(PLAIN, stacked, ['@media (pointer: coarse)'])).toEqual({
      'inline-size': 'auto',
      'block-size': 'var(--bulma-splitter-handle-size-coarse)',
    });
  });

  it('draws the active line in Highlight in forced colors', () => {
    const forced = ['@media (forced-colors: active)'];
    const rule = PLAIN.find(
      r =>
        r.context.join() === forced.join() &&
        r.selector.includes('.splitter-handle.is-active::before')
    );
    expect(rule?.declarations).toEqual({ 'border-color': 'Highlight' });
    expect(find(PLAIN, `${handle}:focus-visible`, forced)).toEqual({
      'outline-color': 'CanvasText',
    });
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED.map(r => r.selector)).toEqual(
      PLAIN.map(r => r.selector.replace(/\.(splitter|is-)/g, '.bestax-$1'))
    );
  });
});
