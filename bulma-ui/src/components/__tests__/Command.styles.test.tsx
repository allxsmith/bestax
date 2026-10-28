// `_command.scss` draws the box, the list, the highlight that follows the
// keyboard and the dialog's place in Bulma's `.modal`, so these compile it,
// with no prefix and under one, and read its rules as text: each rule's
// selector, the at-rules it sits in, and its declarations.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/command';`,
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

const item = '.command-item';

describe('Command styles', () => {
  it('registers its variables on the box, from Bulma’s tokens', () => {
    const box = PLAIN.filter(r => r.selector === '.command').map(
      r => r.declarations
    );
    expect(Object.assign({}, ...box)).toMatchObject({
      '--bulma-command-background': 'var(--bulma-scheme-main)',
      '--bulma-command-border-color': 'var(--bulma-border-weak)',
      '--bulma-command-radius': 'var(--bulma-radius-large)',
      '--bulma-command-list-max-height': '20rem',
      '--bulma-command-item-color': 'var(--bulma-text-strong)',
      '--bulma-command-highlight-background': 'var(--bulma-link)',
      '--bulma-command-highlight-color': 'var(--bulma-link-invert)',
      '--bulma-command-disabled-color': 'var(--bulma-text-weak)',
      '--bulma-command-dialog-width': '40rem',
      '--bulma-command-dialog-offset': '12vh',
      '--bulma-command-dialog-shadow': 'var(--bulma-shadow)',
      display: 'flex',
      'flex-direction': 'column',
      'background-color': 'var(--bulma-command-background)',
      border: '1px solid var(--bulma-command-border-color)',
    });
  });

  it('scrolls the list past its height, without scrolling the page', () => {
    expect(find(PLAIN, '.command-list')).toEqual({
      'max-height': 'var(--bulma-command-list-max-height)',
      'overflow-y': 'auto',
      'overscroll-behavior': 'contain',
    });
  });

  it('fills the highlight with Bulma’s link pair, and greys a disabled item', () => {
    expect(find(PLAIN, `${item}.is-active`)).toEqual({
      'background-color': 'var(--bulma-command-highlight-background)',
      color: 'var(--bulma-command-highlight-color)',
    });
    expect(find(PLAIN, `${item}.is-disabled`)).toMatchObject({
      color: 'var(--bulma-command-disabled-color)',
      cursor: 'not-allowed',
    });
    expect(find(PLAIN, `${item}.is-active.is-disabled`)).toEqual({
      'background-color': 'var(--bulma-command-item-hover-background)',
      color: 'var(--bulma-command-disabled-color)',
    });
    expect(
      find(PLAIN, `${item}:hover:not(.is-active):not(.is-disabled)`)
    ).toEqual({
      'background-color': 'var(--bulma-command-item-hover-background)',
    });
  });

  it('gives the quieter parts the item’s own color on the highlight', () => {
    const rule = PLAIN.find(r => r.selector.includes(`${item}.is-active `));
    expect(rule?.selector.split(', ')).toEqual([
      `${item}.is-active .command-item-icon`,
      `${item}.is-active .command-item-description`,
      `${item}.is-active .command-item-hint`,
      `${item}.is-disabled .command-item-icon`,
      `${item}.is-disabled .command-item-description`,
      `${item}.is-disabled .command-item-hint`,
    ]);
    expect(rule?.declarations).toEqual({ color: 'inherit' });
  });

  it('pushes the hint to the end of the row, which turns around right to left', () => {
    expect(find(PLAIN, '.command-item-hint')).toMatchObject({
      'margin-inline-start': 'auto',
    });
  });

  it('keeps the dialog near the top of the modal, above its background', () => {
    expect(find(PLAIN, '.command.command-dialog')).toEqual({
      position: 'relative',
      width: 'calc(100% - 2rem)',
      'max-width': 'var(--bulma-command-dialog-width)',
      'max-height': 'calc(100% - 2 * var(--bulma-command-dialog-offset))',
      'margin-top': 'var(--bulma-command-dialog-offset)',
      'margin-bottom': 'auto',
      'box-shadow': 'var(--bulma-command-dialog-shadow)',
    });
    expect(find(PLAIN, '.command.command-dialog > .command-list')).toEqual({
      flex: '1 1 auto',
      'min-height': '0',
    });
  });

  it('outlines the highlight in forced colors, where its fill is dropped', () => {
    const forced = ['@media (forced-colors: active)'];
    expect(find(PLAIN, `${item}.is-active`, forced)).toEqual({
      outline: '2px solid Highlight',
      'outline-offset': '-2px',
    });
    expect(
      find(PLAIN, `${item}.is-disabled, ${item}.is-active.is-disabled`, forced)
    ).toEqual({ color: 'GrayText' });
  });

  it('animates nothing', () => {
    for (const rule of PLAIN) {
      expect(Object.keys(rule.declarations)).not.toEqual(
        expect.arrayContaining(['animation'])
      );
      expect(Object.keys(rule.declarations)).not.toEqual(
        expect.arrayContaining(['transition'])
      );
    }
  });

  it('prefixes every class under a class prefix', () => {
    const selectors = PREFIXED.map(r => r.selector).join(' ');
    expect(selectors).not.toMatch(/(^|[^-])\.(command|is-)/);
    expect(PREFIXED.map(r => r.selector)).toEqual(
      PLAIN.map(r => r.selector.replace(/\.(command|is-)/g, '.bestax-$1'))
    );
  });
});
