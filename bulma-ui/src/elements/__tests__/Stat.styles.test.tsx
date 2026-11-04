// `_stat.scss` sets a Stat's type and resets the list's margins, so these
// compile it, with no prefix and under one, and read its rules as text, the
// way DescriptionList's are read.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'elements/stat';`,
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

const PLAIN_CSS = compile('');
const PLAIN = rulesOf(PLAIN_CSS);
const PREFIXED_CSS = compile('bestax-');

/** Every declaration of the rules with exactly this selector, merged. */
function find(selector: string) {
  const matching = PLAIN.filter(r => r.selector === selector);
  if (!matching.length) throw new Error(`no rule for ${selector}`);
  return Object.assign({}, ...matching.map(r => r.declarations));
}

describe('Stat styles', () => {
  it('registers its variables on the Stat, from Bulma tokens', () => {
    expect(find('.stat')).toMatchObject({
      '--bulma-stat-label-color': 'var(--bulma-text-weak)',
      '--bulma-stat-label-size': 'var(--bulma-size-7)',
      '--bulma-stat-value-color': 'var(--bulma-text-strong)',
      '--bulma-stat-value-size': 'var(--bulma-size-3)',
      '--bulma-stat-value-weight': 'var(--bulma-weight-semibold)',
      '--bulma-stat-value-line-height': '1.125',
      '--bulma-stat-change-color': 'var(--bulma-text)',
      '--bulma-stat-change-size': 'var(--bulma-size-7)',
      '--bulma-stat-change-gap': '0.25em',
      '--bulma-stat-description-color': 'var(--bulma-text-weak)',
      '--bulma-stat-description-size': 'var(--bulma-size-7)',
    });
  });

  it('colors the Stat like its figure, so a textColor on it reaches the figure', () => {
    expect(find('.stat')).toMatchObject({
      margin: '0',
      color: 'var(--bulma-stat-value-color)',
    });
    expect(find('.stat .stat-value')).not.toHaveProperty('color');
  });

  it('spaces a Stat on its own as a block, and not the tiles of a row', () => {
    expect(find('.stat:not(:last-child)')).toEqual({
      'margin-bottom': 'var(--bulma-block-spacing)',
    });
    expect(find('.stats > .stat')).toEqual({ 'margin-bottom': '0' });
    const order = PLAIN.map(r => r.selector);
    expect(order.indexOf('.stats > .stat')).toBeGreaterThan(
      order.indexOf('.stat:not(:last-child)')
    );
  });

  it('resets the row’s list margins and leaves the grid to Bulma', () => {
    expect(find('.stats')).toEqual({
      'margin-inline': '0',
      'margin-block-start': '0',
    });
  });

  it('steps the figure through Bulma’s size scale', () => {
    expect(find('.stat.is-small')).toEqual({
      '--bulma-stat-value-size': 'var(--bulma-size-4)',
    });
    expect(find('.stat.is-medium')).toEqual({
      '--bulma-stat-value-size': 'var(--bulma-size-2)',
    });
    expect(find('.stat.is-large')).toEqual({
      '--bulma-stat-value-size': 'var(--bulma-size-1)',
    });
  });

  it('colors a colored change with its color’s -on-scheme variant, over the uncolored one', () => {
    for (const color of [
      'primary',
      'link',
      'info',
      'success',
      'warning',
      'danger',
    ]) {
      expect(find(`.stat .stat-change.is-${color}`)).toEqual({
        color: `var(--bulma-${color}-on-scheme)`,
      });
    }
    // Only the root registers the change's variable, so it's the uncolored
    // change's, and setting it on the Stat reaches it.
    expect(
      PLAIN.filter(r => '--bulma-stat-change-color' in r.declarations).map(
        r => r.selector
      )
    ).toEqual(['.stat']);
  });

  it('sets each part’s type through the root, outranking Bulma’s .content dd indent', () => {
    expect(find('.stat .stat-label')).toEqual({
      margin: '0',
      color: 'var(--bulma-stat-label-color)',
      'font-size': 'var(--bulma-stat-label-size)',
    });
    expect(find('.stat .stat-value')).toEqual({
      margin: '0',
      'font-size': 'var(--bulma-stat-value-size)',
      'font-weight': 'var(--bulma-stat-value-weight)',
      'line-height': 'var(--bulma-stat-value-line-height)',
      'font-variant-numeric': 'tabular-nums',
      'overflow-wrap': 'anywhere',
    });
    expect(find('.stat .stat-change')).toEqual({
      display: 'flex',
      'align-items': 'center',
      gap: 'var(--bulma-stat-change-gap)',
      margin: '0',
      color: 'var(--bulma-stat-change-color)',
      'font-size': 'var(--bulma-stat-change-size)',
      'font-variant-numeric': 'tabular-nums',
    });
    expect(find('.stat .stat-change > svg')).toEqual({ flex: 'none' });
    expect(find('.stat .stat-description')).toEqual({
      margin: '0',
      color: 'var(--bulma-stat-description-color)',
      'font-size': 'var(--bulma-stat-description-size)',
    });
  });

  it('makes loading’s Skeleton and an empty figure one line of the figure tall', () => {
    expect(
      find('.stat .stat-value:empty, .stat .stat-value > .skeleton-block')
    ).toEqual({
      'min-height': '1lh',
    });
  });

  it('prefixes every class under a class prefix', () => {
    const selectors = rulesOf(PREFIXED_CSS).map(r => r.selector);
    const classes = selectors.flatMap(s => s.match(/\.[a-z][\w-]*/g) ?? []);
    expect(classes.length).toBeGreaterThan(0);
    expect(classes.filter(c => !c.startsWith('.bestax-'))).toEqual([]);
  });
});
