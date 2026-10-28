// `_checkboxcard.scss` and `_radiocard.scss` draw the cards' edge, focus
// outline and indicator, so these compile each, with no prefix and under one,
// and read its rules as text, the way RingProgress's are read. The two
// partials are the same apart from their names and the indicator's shape.
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

const FORCED = ['@media (forced-colors: active)'];

describe.each([
  { kind: 'checkbox', partial: 'checkboxcard', group: 'checkboxes' },
  { kind: 'radio', partial: 'radiocard', group: 'radios' },
])('$partial styles', ({ kind, partial, group }) => {
  const PLAIN = rulesOf(compile(partial, ''));
  const PREFIXED = rulesOf(compile(partial, 'bestax-'));
  const card = `.${kind}-card`;
  const input = `${card} > input[type=${kind}]`;
  const content = `.${kind}-card-content`;
  const edge = `${content}::before`;
  const v = (name: string) => `var(--bulma-${kind}-card-${name})`;

  it('registers its variables on the card, from Bulma tokens', () => {
    const root = Object.assign(
      {},
      ...PLAIN.filter(r => r.selector === card).map(r => r.declarations)
    );
    expect(root).toMatchObject({
      [`--bulma-${kind}-card-border-width`]: '1px',
      [`--bulma-${kind}-card-border-color`]: 'var(--bulma-border)',
      [`--bulma-${kind}-card-checked-border-width`]: '2px',
      [`--bulma-${kind}-card-active-color`]: 'var(--bulma-primary)',
      [`--bulma-${kind}-card-title-weight`]: 'var(--bulma-weight-semibold)',
      [`--bulma-${kind}-card-indicator-border-color`]: 'var(--bulma-text-weak)',
      [`--bulma-${kind}-card-transition-duration`]: 'var(--bulma-duration)',
      display: 'block',
      position: 'relative',
      cursor: 'pointer',
    });
  });

  it('hides the input the way Checkbox and Radio do', () => {
    expect(find(PLAIN, input)).toEqual({
      position: 'absolute',
      opacity: '0',
      width: '0',
      height: '0',
      margin: '0',
    });
  });

  it('draws a real border over the whole card, in the card radius', () => {
    expect(find(PLAIN, `${card} > ${edge}`)).toMatchObject({
      position: 'absolute',
      inset: '0',
      border: `${v('border-width')} solid ${v('border-color')}`,
      'border-radius': 'var(--bulma-card-radius)',
      'pointer-events': 'none',
    });
  });

  it('thickens the edge when checked, so it is never color alone', () => {
    const checked = PLAIN.find(
      r =>
        r.selector.startsWith(`${input}:checked + ${edge}`) && !r.context.length
    );
    expect(checked?.declarations).toEqual({
      'border-color': v('active-color'),
      'border-width': v('checked-border-width'),
    });
  });

  it("outlines the whole card on keyboard focus, in Bulma's focus color", () => {
    expect(find(PLAIN, `${input}:focus-visible + ${edge}`)).toEqual({
      outline: `${v('focus-width')} solid ${v('focus-color')}`,
      'outline-offset': v('focus-offset'),
    });
    const root = Object.assign(
      {},
      ...PLAIN.filter(r => r.selector === card).map(r => r.declarations)
    );
    expect(root).toMatchObject({
      [`--bulma-${kind}-card-focus-color`]:
        'hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l))',
      [`--bulma-${kind}-card-focus-width`]: 'var(--bulma-focus-width)',
    });
  });

  it("leaves the title in the card's text color, so textColor reaches it", () => {
    expect(find(PLAIN, `.${kind}-card-title`)).toEqual({
      display: 'block',
      'font-weight': v('title-weight'),
    });
  });

  it('dims a disabled card', () => {
    expect(find(PLAIN, `${input}:disabled + ${content}`)).toEqual({
      opacity: v('disabled-opacity'),
      cursor: 'not-allowed',
    });
  });

  it('sets the active color for each color class', () => {
    expect(find(PLAIN, `${card}.is-warning`)).toEqual({
      [`--bulma-${kind}-card-active-color`]: 'var(--bulma-warning)',
    });
  });

  it('shares the row in its group, and drops Bulma card margin there and in a grid', () => {
    expect(find(PLAIN, `.${group} > ${card}.card`)).toEqual({
      flex: '1 1 0',
      'min-width': `min(100%, ${v('min-width')})`,
    });
    expect(
      find(PLAIN, `.${group} > ${card}.card, .grid > ${card}.card`)
    ).toEqual({ 'margin-bottom': '0' });
  });

  it('names system colors in forced colors, Highlight for the checked edge', () => {
    expect(find(PLAIN, `${card} > ${edge}`, FORCED)).toEqual({
      'border-color': 'CanvasText',
    });
    const checked = PLAIN.find(
      r =>
        r.selector.startsWith(`${input}:checked + ${edge}`) &&
        r.context.join() === FORCED.join()
    );
    expect(checked?.declarations).toEqual({ 'border-color': 'Highlight' });
    expect(find(PLAIN, `${input}:focus-visible + ${edge}`, FORCED)).toEqual({
      'outline-color': 'Highlight',
    });
    expect(find(PLAIN, `${input}:disabled + ${content}`, FORCED)).toEqual({
      color: 'GrayText',
    });
    expect(find(PLAIN, `${input}:disabled + ${edge}`, FORCED)).toEqual({
      'border-color': 'GrayText',
    });
    expect(find(PLAIN, `${card} .${kind}-card-check`, FORCED)).toEqual({
      'border-color': 'ButtonText',
    });
  });

  it('stops the transitions under reduced motion', () => {
    const reduced = PLAIN.filter(
      r => r.context.join() === '@media (prefers-reduced-motion: reduce)'
    );
    expect(reduced).toHaveLength(1);
    expect(reduced[0].selector).toContain(`${card} > ${edge}`);
    expect(reduced[0].selector).toContain(`${card} .${kind}-card-check`);
    expect(reduced[0].declarations).toEqual({ transition: 'none' });
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED.map(r => r.selector)).toEqual(
      PLAIN.map(r =>
        r.selector.replace(
          /\.(checkbox-card|radio-card|card|is-|checkboxes|radios|grid)/g,
          '.bestax-$1'
        )
      )
    );
  });
});

describe('checkboxcard styles, the mixed state', () => {
  const PLAIN = rulesOf(compile('checkboxcard', ''));
  const input = '.checkbox-card > input[type=checkbox]';
  const check = '.checkbox-card-content > .checkbox-card-check';

  it('draws the dash and thickens the edge like a checked card', () => {
    expect(
      find(PLAIN, `${input}:indeterminate + ${check}::before`)
    ).toMatchObject({
      'background-color': 'var(--bulma-checkbox-card-check-color)',
    });
    expect(
      find(
        PLAIN,
        `${input}:checked + .checkbox-card-content::before, ${input}:indeterminate + .checkbox-card-content::before`
      )
    ).toEqual({
      'border-color': 'var(--bulma-checkbox-card-active-color)',
      'border-width': 'var(--bulma-checkbox-card-checked-border-width)',
    });
  });

  it('keeps the dash visible in forced colors', () => {
    expect(find(PLAIN, `${input}:indeterminate + ${check}`, FORCED)).toEqual({
      'background-color': 'Canvas',
      'border-color': 'Highlight',
    });
    expect(
      find(PLAIN, `${input}:indeterminate + ${check}::before`, FORCED)
    ).toEqual({ 'background-color': 'CanvasText' });
  });
});
