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
      '--bulma-splitter-line-active-color':
        'hsl(var(--bulma-primary-h), var(--bulma-primary-s), var(--bulma-primary-on-scheme-l))',
      '--bulma-splitter-grip-color': 'var(--bulma-text-weak)',
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

  it('turns the line and the grip the active color on hover, focus and drag', () => {
    expect(find(PLAIN, active(handle, '::before'))).toEqual({
      'border-inline-start-width': 'var(--bulma-splitter-line-active-size)',
      'border-inline-start-color': 'var(--bulma-splitter-line-active-color)',
    });
    expect(find(PLAIN, active(handle, '::after'))).toEqual({
      'border-color': 'var(--bulma-splitter-line-active-color)',
    });
  });

  it('turns a stacked handle’s line and grip the active color too', () => {
    // The stacked rules rank above the plain ones, so they need their own.
    expect(find(PLAIN, active(stacked, '::before'))).toEqual({
      'border-block-start-width': 'var(--bulma-splitter-line-active-size)',
      'border-block-start-color': 'var(--bulma-splitter-line-active-color)',
    });
    expect(find(PLAIN, active(stacked, '::after'))).toEqual({
      'border-block-color': 'var(--bulma-splitter-line-active-color)',
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

  it('draws the active line and grip in Highlight in forced colors, stacked too', () => {
    const forced = ['@media (forced-colors: active)'];
    const rule = PLAIN.find(
      r =>
        r.context.join() === forced.join() &&
        r.selector.includes('.splitter-handle.is-active::before')
    );
    expect(rule?.declarations).toEqual({ 'border-color': 'Highlight' });
    for (const base of [handle, stacked]) {
      for (const part of ['::before', '::after']) {
        for (const state of [':hover', ':focus-visible', '.is-active']) {
          expect(rule?.selector.split(', ')).toContain(
            `${base}${state}${part}`
          );
        }
      }
    }
    expect(find(PLAIN, `${handle}:focus-visible`, forced)).toEqual({
      'outline-color': 'CanvasText',
    });
  });

  describe('step buttons', () => {
    const box = '.splitter-buttons';
    const button = '.splitter-button';
    const stackedBox = '.splitter.is-vertical > .splitter-buttons';

    it('registers their variables on the root, from Bulma tokens', () => {
      const root = PLAIN.filter(r => r.selector === '.splitter').map(
        r => r.declarations
      );
      expect(Object.assign({}, ...root)).toMatchObject({
        '--bulma-splitter-button-size': '1.5rem',
        '--bulma-splitter-button-icon-size': '1rem',
        '--bulma-splitter-button-color': 'var(--bulma-text)',
        '--bulma-splitter-button-background': 'var(--bulma-scheme-main)',
        '--bulma-splitter-button-border-width': '1px',
        '--bulma-splitter-button-border-color': 'var(--bulma-border)',
        '--bulma-splitter-button-radius': 'var(--bulma-radius-rounded)',
        '--bulma-splitter-button-hover-color':
          'var(--bulma-splitter-line-active-color)',
        '--bulma-splitter-button-gap': '0.25rem',
      });
    });

    it('puts them in a box with no width, moved back onto the handle’s line, over the panes', () => {
      expect(find(PLAIN, box)).toEqual({
        position: 'relative',
        'z-index': '1',
        'inset-inline-start': 'calc(-0.5 * var(--bulma-splitter-handle-size))',
        flex: 'none',
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        // The grip's length between the halves, and a gap each side, so a
        // longer grip keeps its room.
        gap: 'calc(var(--bulma-splitter-grip-length) + 2 * var(--bulma-splitter-button-gap))',
        'inline-size': '0',
      });
    });

    it('keeps the room for the grip in the middle, the two halves meeting it, and lets a press through them to the handle', () => {
      expect(find(PLAIN, '.splitter-buttons-group')).toEqual({
        flex: '1 1 0',
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        gap: 'var(--bulma-splitter-button-gap)',
        // The halves lie over the handle; only the buttons take a press.
        'pointer-events': 'none',
      });
      expect(find(PLAIN, button)['pointer-events']).toBe('auto');
      expect(find(PLAIN, '.splitter-buttons-group:first-child')).toEqual({
        'justify-content': 'flex-end',
      });
    });

    it('draws a round 24px button, its arrow in the text color, the active color under the pointer', () => {
      expect(find(PLAIN, button)).toMatchObject({
        'inline-size': 'var(--bulma-splitter-button-size)',
        'block-size': 'var(--bulma-splitter-button-size)',
        border:
          'var(--bulma-splitter-button-border-width) solid var(--bulma-splitter-button-border-color)',
        'border-radius': 'var(--bulma-splitter-button-radius)',
        'background-color': 'var(--bulma-splitter-button-background)',
        color: 'var(--bulma-splitter-button-color)',
        cursor: 'pointer',
        'touch-action': 'manipulation',
      });
      expect(find(PLAIN, `${button} svg`)).toEqual({
        'inline-size': 'var(--bulma-splitter-button-icon-size)',
        'block-size': 'var(--bulma-splitter-button-icon-size)',
      });
      expect(find(PLAIN, `${button}:hover`)).toEqual({
        'border-color': 'var(--bulma-splitter-button-hover-color)',
        color: 'var(--bulma-splitter-button-hover-color)',
      });
      expect(find(PLAIN, `${button}:focus-visible`)).toMatchObject({
        'outline-offset': '2px',
      });
    });

    it('turns an arrow right to left, and a quarter between stacked panes, whichever way the page reads', () => {
      expect(find(PLAIN, `${button}:dir(rtl) svg`)).toEqual({
        transform: 'scaleX(-1)',
      });
      // Stacked, the turn outranks the mirroring, so up stays up.
      expect(find(PLAIN, `${stackedBox} ${button} svg`)).toEqual({
        transform: 'rotate(90deg)',
      });
      expect(find(PLAIN, stackedBox)).toEqual({
        'inset-inline-start': 'auto',
        'inset-block-start': 'calc(-0.5 * var(--bulma-splitter-handle-size))',
        'flex-direction': 'row',
        'inline-size': 'auto',
        'block-size': '0',
      });
      expect(find(PLAIN, `${stackedBox} > .splitter-buttons-group`)).toEqual({
        'flex-direction': 'row',
      });
    });

    it('follows the wider strip’s line for a coarse pointer', () => {
      const coarse = ['@media (pointer: coarse)'];
      expect(find(PLAIN, box, coarse)).toEqual({
        'inset-inline-start':
          'calc(-0.5 * var(--bulma-splitter-handle-size-coarse))',
      });
      expect(find(PLAIN, stackedBox, coarse)).toEqual({
        'inset-inline-start': 'auto',
        'inset-block-start':
          'calc(-0.5 * var(--bulma-splitter-handle-size-coarse))',
      });
    });

    it('takes the highlight under the pointer and a ring in the text color in forced colors', () => {
      const forced = ['@media (forced-colors: active)'];
      expect(find(PLAIN, `${button}:hover`, forced)).toEqual({
        'border-color': 'Highlight',
        color: 'Highlight',
      });
      expect(find(PLAIN, `${button}:focus-visible`, forced)).toEqual({
        'outline-color': 'CanvasText',
      });
    });
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED.map(r => r.selector)).toEqual(
      PLAIN.map(r => r.selector.replace(/\.(splitter|is-)/g, '.bestax-$1'))
    );
  });
});
