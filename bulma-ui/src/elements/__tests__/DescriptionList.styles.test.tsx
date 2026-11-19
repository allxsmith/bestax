// `_descriptionlist.scss` lays the list out, so these compile it, with no
// prefix and under one, and read its rules as text, the way RingProgress's
// are read.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'elements/descriptionlist';`,
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

const PLAIN_CSS = compile('');
const PLAIN = rulesOf(PLAIN_CSS);
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

const root = '.description-list';
const STACKED = { 'grid-template-columns': 'minmax(0, 1fr)' };
const BESIDE = {
  'grid-template-columns':
    'fit-content(var(--bulma-description-list-label-max-width)) minmax(0, 1fr)',
};
const MEDIA = {
  mobile: '@media screen and (max-width: 768px)',
  tablet: '@media screen and (min-width: 769px), print',
  desktop: '@media screen and (min-width: 1024px)',
  widescreen: '@media screen and (min-width: 1216px)',
  fullhd: '@media screen and (min-width: 1408px)',
};

/** Every declaration on the root outside a media query, merged. */
const ROOT = Object.assign(
  {},
  ...PLAIN.filter(r => r.selector === root && !r.context.length).map(
    r => r.declarations
  )
);

describe('DescriptionList styles', () => {
  it('registers its variables on the root, from Bulma tokens', () => {
    expect(ROOT).toMatchObject({
      '--bulma-description-list-gap': '0.75em',
      '--bulma-description-list-column-gap': '1.5em',
      '--bulma-description-list-row-gap': '0.25em',
      '--bulma-description-list-label-max-width': '40%',
      '--bulma-description-list-label-color': 'var(--bulma-text-weak)',
      '--bulma-description-list-label-weight': 'var(--bulma-weight-normal)',
      '--bulma-description-list-value-color': 'var(--bulma-text)',
      '--bulma-description-list-divider-color': 'var(--bulma-border-weak)',
      '--bulma-description-list-divider-width': '1px',
    });
  });

  it('makes the root a grid, stacked, colored like the values, with the gaps', () => {
    expect(ROOT).toMatchObject({
      display: 'grid',
      ...STACKED,
      'column-gap': 'var(--bulma-description-list-column-gap)',
      'row-gap': 'var(--bulma-description-list-gap)',
      margin: '0',
      color: 'var(--bulma-description-list-value-color)',
    });
    expect(find(PLAIN, `${root}:not(:last-child)`)).toEqual({
      'margin-bottom': 'var(--bulma-block-spacing)',
    });
  });

  it('puts labels beside their values from tablet up, with no orientation given', () => {
    expect(find(PLAIN, root, [MEDIA.tablet])).toEqual(BESIDE);
  });

  it('spans each item over the list on subgrid, with one column of its own before it', () => {
    expect(find(PLAIN, '.description-list-item')).toMatchObject({
      display: 'grid',
      'grid-column': '1/-1',
      'grid-template-columns': 'subgrid',
      'grid-auto-flow': 'row dense',
      'align-items': 'baseline',
      'row-gap': 'var(--bulma-description-list-row-gap)',
    });
    // A browser without subgrid drops that declaration and keeps this one.
    expect(PLAIN_CSS).toMatch(
      /grid-template-columns: minmax\(0, 1fr\);\s*grid-template-columns: subgrid;/
    );
  });

  it('puts labels in the first column and values in the last, through the root', () => {
    expect(find(PLAIN, `${root} .description-list-label`)).toEqual({
      'grid-column': '1/2',
      margin: '0',
      color: 'var(--bulma-description-list-label-color)',
      'font-weight': 'var(--bulma-description-list-label-weight)',
    });
    expect(find(PLAIN, `${root} .description-list-value`)).toEqual({
      'grid-column': '-2/-1',
      margin: '0',
      'overflow-wrap': 'anywhere',
    });
  });

  it('draws a line between items with has-dividers', () => {
    expect(
      find(
        PLAIN,
        `${root}.has-dividers > .description-list-item + .description-list-item`
      )
    ).toEqual({
      'border-block-start':
        'var(--bulma-description-list-divider-width) solid var(--bulma-description-list-divider-color)',
      'padding-block-start': 'var(--bulma-description-list-gap)',
    });
  });

  it('pins the orientation at every width, and per viewport from its breakpoint', () => {
    expect(find(PLAIN, `${root}.is-vertical`)).toEqual(STACKED);
    expect(find(PLAIN, `${root}.is-horizontal`)).toEqual(BESIDE);
    for (const [viewport, media] of Object.entries(MEDIA)) {
      expect(find(PLAIN, `${root}.is-vertical-${viewport}`, [media])).toEqual(
        STACKED
      );
      expect(find(PLAIN, `${root}.is-horizontal-${viewport}`, [media])).toEqual(
        BESIDE
      );
    }
  });

  it('orders the orientation rules so the widest that applies wins', () => {
    const order = PLAIN.map(r => r.selector);
    const at = (selector: string) => order.indexOf(selector);
    // After the responsive default, `orientation`, then each viewport,
    // narrowest first, all at the same specificity.
    const sequence = [
      `${root}.is-vertical`,
      `${root}.is-vertical-mobile`,
      `${root}.is-vertical-tablet`,
      `${root}.is-vertical-desktop`,
      `${root}.is-vertical-widescreen`,
      `${root}.is-vertical-fullhd`,
    ].map(at);
    expect(sequence).toEqual([...sequence].sort((a, b) => a - b));
    expect(
      PLAIN.findIndex(r => r.selector === root && r.context.length)
    ).toBeLessThan(sequence[0]);
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED.map(r => r.selector)).toEqual(
      PLAIN.map(r =>
        r.selector.replace(/\.(description-list|is-|has-)/g, '.bestax-$1')
      )
    );
  });
});
