// `_stack.scss` makes Stack, Group, Center and Flex flex containers, gives
// Stack and Group their gaps, and zeroes their children's block margins.
// These compile it, with no prefix and under one, and read its rules as
// text, the way Splitter's styles test does: each rule's selector, the
// at-rules around it, and its declarations. Then they compile the
// published sheets, to hold the layout to the build without Bulma's helpers
// and the helpers to beating the defaults where they ship.
import * as sass from 'sass';
import path from 'path';
import { compileSheet } from '../../__tests__/compile-scss';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'layout/stack';`,
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

/** Every style rule in a sheet of sass's expanded or compressed output. */
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

/** The declarations of the rule with exactly this selector, in this context. */
function find(rules: Rule[], selector: string, context: string[] = []) {
  const rule = rules.find(
    r =>
      r.selector === selector && r.context.join(' | ') === context.join(' | ')
  );
  if (!rule) throw new Error(`no rule for ${selector} in ${context}`);
  return rule.declarations;
}

/** Every declaration on this selector, merged in source order. */
const merged = (rules: Rule[], selector: string) =>
  Object.assign(
    {},
    ...rules
      .filter(r => r.selector === selector && !r.context.length)
      .map(r => r.declarations)
  );

const MOBILE = '@media screen and (max-width: 768px)';
const TOUCH = '@media screen and (max-width: 1023px)';
const UNTIL_WIDESCREEN = '@media screen and (max-width: 1215px)';

describe.each([
  ['', compile('')],
  ['bestax-', compile('bestax-')],
])('Stack styles, prefix "%s"', (prefix, css) => {
  const rules = rulesOf(css);
  const c = (name: string) => `.${prefix}${name}`;
  const stack = c('stack');

  it('registers the two gaps on the root, from Bulma’s block spacing', () => {
    expect(merged(rules, stack)).toEqual({
      '--bulma-stack-gap': 'var(--bulma-block-spacing)',
      '--bulma-stack-horizontal-gap': 'calc(var(--bulma-block-spacing) * 0.5)',
      display: 'flex',
    });
  });

  it('leaves Flex at CSS’s own defaults: a row, no wrap, stretched, no gap', () => {
    const own = rules.filter(r => r.selector === stack);
    for (const { declarations } of own) {
      for (const property of [
        'flex-direction',
        'flex-wrap',
        'align-items',
        'justify-content',
        'gap',
      ]) {
        expect(declarations).not.toHaveProperty(property);
      }
    }
  });

  it('makes Stack a column spaced by --bulma-stack-gap', () => {
    expect(find(rules, `${stack}${c('is-vertical')}`)).toEqual({
      'flex-direction': 'column',
      gap: 'var(--bulma-stack-gap)',
    });
  });

  it('makes Group a row that wraps, centered, spaced by --bulma-stack-horizontal-gap', () => {
    expect(find(rules, `${stack}${c('is-horizontal')}`)).toEqual({
      'flex-wrap': 'wrap',
      'align-items': 'center',
      gap: 'var(--bulma-stack-horizontal-gap)',
    });
  });

  it('centers Center on both axes, with no gap', () => {
    expect(find(rules, `${stack}${c('is-centered')}`)).toEqual({
      'align-items': 'center',
      'justify-content': 'center',
    });
  });

  // Bulma's block margin is `.box:not(:last-child)`, two classes' weight.
  // `:not(#\#)` matches any element with an id's weight, so the reset wins
  // whichever sheet loads first, and a helper's `!important` still beats it.
  it('zeroes the children’s block-end margin in a Stack, and both in the others', () => {
    expect(find(rules, `${stack}${c('is-vertical')} > :not(#\\#)`)).toEqual({
      'margin-block-end': '0',
    });
    expect(
      find(rules, `${stack}:not(${c('is-vertical')}) > :not(#\\#)`)
    ).toEqual({ 'margin-block': '0' });
    // Nothing deeper than the children.
    for (const rule of rules) {
      if (/margin/.test(Object.keys(rule.declarations).join(' '))) {
        expect(rule.selector).toMatch(/ > (hr)?:not\(#\\#\)$/);
      }
    }
  });

  // Bulma's `hr` margin collapses into the block above it in normal flow.
  // Nothing collapses in a flex container, so a Divider in a Stack loses its
  // top margin too, and sits in the middle of the space.
  it('zeroes a Divider’s top margin in a Stack too', () => {
    expect(find(rules, `${stack}${c('is-vertical')} > hr:not(#\\#)`)).toEqual({
      'margin-block-start': '0',
    });
  });

  it('shares the row equally in a full-width Group', () => {
    expect(
      find(rules, `${stack}${c('is-horizontal')}${c('is-fullwidth')} > *`)
    ).toEqual({ flex: '1 1 0' });
  });

  it.each([
    ['tablet', MOBILE],
    ['desktop', TOUCH],
    ['widescreen', UNTIL_WIDESCREEN],
  ])(
    'stacks a Group with breakpoint %s below it, full width across the column',
    (breakpoint, media) => {
      const group = `${stack}${c('is-horizontal')}${c(`is-${breakpoint}`)}`;
      expect(find(rules, group, [media])).toEqual({
        'flex-direction': 'column',
      });
      expect(find(rules, `${group}${c('is-fullwidth')}`, [media])).toEqual({
        'align-items': 'stretch',
      });
      expect(find(rules, `${group}${c('is-fullwidth')} > *`, [media])).toEqual({
        flex: 'none',
      });
      // From the breakpoint up, the row's own rules apply: nothing outside
      // the media query names the breakpoint.
      expect(
        rules.filter(
          r => r.selector.includes(c(`is-${breakpoint}`)) && !r.context.length
        )
      ).toEqual([]);
    }
  );

  it('uses only the prefix it was built with', () => {
    if (prefix) {
      expect(css).not.toMatch(/(^|[\s,>(])\.stack\b/m);
      expect(css).not.toMatch(/\.is-(vertical|horizontal|centered)\b/);
    }
    expect(css).toContain(`${stack}${c('is-vertical')}`);
  });
});

describe('the published sheets', () => {
  // The flavor without Bulma's helper classes: the four are still flex
  // containers with their gaps, and the props have no class to add.
  it('keeps the layout in bestax-no-helpers.css, which has no helper classes', () => {
    const rules = rulesOf(compileSheet('versions/bestax-no-helpers.scss'));
    expect(merged(rules, '.stack')).toMatchObject({ display: 'flex' });
    expect(find(rules, '.stack.is-vertical')).toMatchObject({
      gap: 'var(--bulma-stack-gap)',
    });
    expect(find(rules, '.stack.is-horizontal')).toMatchObject({
      gap: 'var(--bulma-stack-horizontal-gap)',
    });
    for (const helper of ['.is-gap-2', '.is-align-items-center', '.is-flex']) {
      expect(rules.some(r => r.selector === helper)).toBe(false);
    }
  });

  // Where the helpers ship, a prop's class replaces a default because it's
  // `!important`, whichever order the rules come in.
  it('ships the helpers a prop adds as !important in bestax.css', () => {
    const rules = rulesOf(compileSheet('bestax.scss'));
    expect(find(rules, '.is-gap-2')).toEqual({ gap: '1rem !important' });
    expect(find(rules, '.is-align-items-flex-start')).toEqual({
      'align-items': 'flex-start !important',
    });
    expect(find(rules, '.is-flex-wrap-nowrap')).toEqual({
      'flex-wrap': 'nowrap !important',
    });
    expect(find(rules, '.is-justify-content-space-between')).toEqual({
      'justify-content': 'space-between !important',
    });
    expect(find(rules, '.mb-2')).toEqual({
      'margin-bottom': '0.5rem !important',
    });
  });
});
