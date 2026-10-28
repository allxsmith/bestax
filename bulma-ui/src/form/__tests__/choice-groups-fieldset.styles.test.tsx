// `_checkbox.scss` and `_radio.scss` lay out `Checkboxes` and `Radios` with
// `as="fieldset"`, which jsdom never loads, so these compile each partial,
// with no prefix and under one, and read its rules as text, the way
// RingProgress's are read.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (partial: string, prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/${partial}';`,
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

/** The declarations of the rule with exactly this selector, in this context. */
function find(rules: Rule[], selector: string, context: string[] = []) {
  const rule = rules.find(
    r =>
      r.selector === selector && r.context.join(' | ') === context.join(' | ')
  );
  if (!rule) throw new Error(`no rule for ${selector} in ${context}`);
  return rule.declarations;
}

const TABLET = '@media screen and (min-width: 769px), print';

describe.each([
  ['checkbox', 'checkboxes'],
  ['radio', 'radios'],
])('_%s.scss with as="fieldset"', (partial, box) => {
  describe.each(['', 'bestax-'])('prefix "%s"', prefix => {
    const rules = rulesOf(compile(partial, prefix));
    const p = (name: string) => `${prefix}${name}`;
    const row = `fieldset.${p('field')}.${p('is-horizontal')}:has(.${p(box)})`;

    it('lets the fieldset shrink to its column', () => {
      expect(
        find(
          rules,
          `fieldset.${p(box)}, fieldset.${p('field')}:has(.${p(box)})`
        )
      ).toEqual({ 'min-inline-size': '0' });
    });

    it('makes a horizontal fieldset a block, from tablet up', () => {
      expect(find(rules, row, [TABLET])).toEqual({ display: 'flow-root' });
    });

    it("floats the legend into Bulma's label column, from tablet up", () => {
      expect(
        find(rules, `${row} > legend.${p('field-label')}`, [TABLET])
      ).toEqual({
        float: 'inline-start',
        'inline-size': 'calc((100% - 1.5rem) / 6)',
        'min-inline-size': 'min-content',
      });
    });

    it('leaves the legend alone below tablet', () => {
      const legendRules = rules.filter(r => r.selector.includes('legend'));
      for (const rule of legendRules) expect(rule.context).toEqual([TABLET]);
    });
  });
});
