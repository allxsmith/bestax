// `_floatbutton.scss` gives float buttons their shadow, lays out the
// FloatButtons stack and the speed dial, and fades back to top. These compile
// it, with no prefix and under one, and read its rules as text, the way
// IconButton's are read, beside Bulma's own button rules, which some of it
// has to outrank.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (source: string, prefix = '') =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     ${source}`,
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

const PARTIAL = `@use 'components/floatbutton';`;
const PLAIN = rulesOf(compile(PARTIAL)).filter(
  r => !r.context.some(c => c.startsWith('@keyframes extras-'))
);
const PREFIXED = rulesOf(compile(PARTIAL, 'bestax-')).filter(
  r => !r.context.some(c => c.startsWith('@keyframes extras-'))
);
const BULMA = rulesOf(compile(`@use 'bulma/sass/elements/button';`));

/** The declarations of every rule with exactly this selector, in a context. */
function find(rules: Rule[], selector: string, context: string[] = []) {
  const found = rules.filter(
    r => r.selector === selector && r.context.join() === context.join()
  );
  if (!found.length) throw new Error(`no rule for ${selector}`);
  return Object.assign({}, ...found.map(r => r.declarations)) as Record<
    string,
    string
  >;
}

/** A compound selector's weight in classes, attributes and pseudo-classes. */
const weight = (selector: string) =>
  (selector.match(/\.[\w-]+|:[\w-]+|\[[\w-]+\]/g) ?? []).length;

const REDUCE = '@media (prefers-reduced-motion: reduce)';
const FORCED = '@media (forced-colors: active)';

describe('FloatButton styles', () => {
  it('registers its variables, starting at Bulma’s shadow and duration', () => {
    expect(find(PLAIN, '.button.float-button')).toEqual({
      '--bulma-float-button-shadow': 'var(--bulma-shadow)',
      '--bulma-float-button-transition-duration': 'var(--bulma-duration)',
    });
    expect(find(PLAIN, '.float-button-speed-dial')).toMatchObject({
      '--bulma-float-button-actions-gap': '0.5rem',
      '--bulma-float-button-transition-duration': 'var(--bulma-duration)',
    });
    expect(find(PLAIN, '.float-buttons')).toMatchObject({
      '--bulma-float-buttons-gap': '0.75rem',
    });
    // The fades are the button's and the dial's own, so the stack declares
    // no duration of its own to disagree with them.
    expect(find(PLAIN, '.float-buttons')).not.toHaveProperty(
      '--bulma-float-button-transition-duration'
    );
  });

  it('gives a float button its shadow, except where Bulma’s focus ring or disabled look takes over', () => {
    const selector =
      '.button.float-button:not(:focus-visible):not(.is-focused):not([disabled])';
    expect(find(PLAIN, selector)).toEqual({
      'box-shadow': 'var(--bulma-float-button-shadow)',
    });
    // Bulma's own shadow sits on `.button`, which this outranks.
    expect(weight(selector)).toBeGreaterThan(weight('.button'));
    expect(
      BULMA.some(
        r => r.selector === '.button' && 'box-shadow' in r.declarations
      )
    ).toBe(true);
  });

  it('stacks FloatButtons in a column on its corner’s side, and lets the pointer through between buttons', () => {
    expect(find(PLAIN, '.float-buttons')).toMatchObject({
      display: 'flex',
      'flex-direction': 'column',
      gap: 'var(--bulma-float-buttons-gap)',
      'pointer-events': 'none',
    });
    expect(find(PLAIN, '.float-buttons > *')).toEqual({
      'pointer-events': 'auto',
    });
    // The side is physical: a column's align-items follows the writing
    // direction, so right-to-left text would line them up on the far side.
    expect(find(PLAIN, '.float-buttons')).not.toHaveProperty('align-items');
    expect(
      find(
        PLAIN,
        '.float-buttons.is-top-right > *, .float-buttons.is-bottom-right > *'
      )
    ).toEqual({ 'margin-left': 'auto' });
    expect(
      find(
        PLAIN,
        '.float-buttons.is-top-left > *, .float-buttons.is-bottom-left > *'
      )
    ).toEqual({ 'margin-right': 'auto' });
  });

  it.each([
    ['is-up', 'column-reverse'],
    ['is-down', 'column'],
    ['is-left', 'row-reverse'],
    ['is-right', 'row'],
    ['is-left.is-rtl', 'row'],
    ['is-right.is-rtl', 'row-reverse'],
  ])(
    'lays a dial that is %s out as %s, which its actions inherit',
    (modifier, direction) => {
      expect(find(PLAIN, `.float-button-speed-dial.${modifier}`)).toEqual({
        'flex-direction': direction,
      });
    }
  );

  it('lines a dial’s actions up as the corner says, on the screen', () => {
    expect(
      PLAIN.some(
        r =>
          r.selector.includes('.float-button-speed-dial') &&
          r.declarations['align-items'] !== undefined &&
          r.declarations['align-items'] !== 'center'
      )
    ).toBe(false);
    expect(
      find(
        PLAIN,
        '.float-button-speed-dial.is-left, .float-button-speed-dial.is-right'
      )
    ).toEqual({ 'align-items': 'center' });
    /** The trigger and the actions of an up or down dial in these corners. */
    const vertical = (corners: string[]) =>
      corners
        .flatMap(corner =>
          ['is-up', 'is-down'].flatMap(way => {
            const dial = `.affix.${corner} .float-button-speed-dial.${way}`;
            return [`${dial} > *`, `${dial} > .float-button-actions > *`];
          })
        )
        .join(', ');
    expect(find(PLAIN, vertical(['is-top-right', 'is-bottom-right']))).toEqual({
      'margin-left': 'auto',
    });
    expect(find(PLAIN, vertical(['is-top-left', 'is-bottom-left']))).toEqual({
      'margin-right': 'auto',
    });
    expect(find(PLAIN, '.float-button-actions')).toMatchObject({
      display: 'flex',
      'flex-direction': 'inherit',
      'align-items': 'inherit',
      gap: 'var(--bulma-float-button-actions-gap)',
    });
  });

  it('fades the actions in, and not under reduced motion', () => {
    expect(find(PLAIN, '.float-button-actions').animation).toBe(
      'float-button-actions-in var(--bulma-float-button-transition-duration) ease-out'
    );
    expect(find(PLAIN, '.float-button-actions', [REDUCE])).toEqual({
      animation: 'none',
    });
  });

  it('fades back to top in and out, hides it with its tooltip, and not under reduced motion', () => {
    expect(find(PLAIN, '.button.float-button-back-to-top')).toMatchObject({
      'transition-property':
        'background-color, border-color, box-shadow, color, opacity, visibility',
      'transition-duration': 'var(--bulma-float-button-transition-duration)',
    });
    expect(
      find(PLAIN, '.button.float-button-back-to-top:not(.is-shown)')
    ).toEqual({ opacity: '0', visibility: 'hidden' });
    const tooltip =
      '.button.float-button-back-to-top:not(.is-shown) ~ .tooltip-content';
    expect(find(PLAIN, tooltip)).toEqual({
      opacity: '0',
      visibility: 'hidden',
    });
    // Tooltip shows its content with `.tooltip.is-active .tooltip-content`.
    expect(weight(tooltip)).toBeGreaterThan(
      weight('.tooltip.is-active .tooltip-content')
    );
    expect(find(PLAIN, '.button.float-button-back-to-top', [REDUCE])).toEqual({
      transition: 'none',
    });
  });

  it('lets the pointer through the boxes around a hidden back to top, and hides a stack item holding it, a Badge included', () => {
    const item =
      '.float-buttons > :has(.float-button-back-to-top:not(.is-shown))';
    // At once: the button's own visibility, which transitions, keeps it on
    // the screen through its fade.
    expect(find(PLAIN, item)).toEqual({
      'pointer-events': 'none',
      visibility: 'hidden',
    });
    // It outranks the rule that gives a stack's items the pointer back.
    expect(weight(item)).toBeGreaterThan(weight('.float-buttons > *'));
    expect(PLAIN.some(r => r.selector === item && r.context.length > 0)).toBe(
      false
    );
    expect(
      find(
        PLAIN,
        '.affix:not(.float-buttons):has(> .float-button-back-to-top:not(.is-shown)), .affix:not(.float-buttons):has(> .tooltip > .float-button-back-to-top:not(.is-shown))'
      )
    ).toEqual({ 'pointer-events': 'none' });
    // Shown is `is-shown`, which Bulma doesn't style on a button, not its
    // pressed `is-active`.
    expect(
      BULMA.some(r => r.selector.split(', ').includes('.button.is-shown'))
    ).toBe(false);
    expect(
      BULMA.some(r => r.selector.split(', ').includes('.button.is-active'))
    ).toBe(true);
  });

  it('hides the trigger’s tooltip while the dial is open', () => {
    const selector =
      '.float-button-speed-dial.is-active > .tooltip > .tooltip-content';
    expect(find(PLAIN, selector)).toEqual({
      opacity: '0',
      visibility: 'hidden',
    });
    expect(weight(selector)).toBeGreaterThan(
      weight('.tooltip.is-active .tooltip-content')
    );
    // Tooltip's bridge toward its content would reach over the first action.
    const bridge = '.float-button-speed-dial.is-active > .tooltip::after';
    expect(find(PLAIN, bridge)).toEqual({ content: 'none' });
    expect(weight(bridge)).toBeGreaterThan(weight('.tooltip.is-open::after'));
  });

  it('keeps every float button’s edge and its focus in forced colors, outranking Bulma’s outline: none', () => {
    const selector = '.button.float-button.float-button';
    expect(find(PLAIN, selector, [FORCED])).toEqual({
      outline: '1px solid ButtonText',
      'outline-offset': '-1px',
    });
    expect(
      find(PLAIN, `${selector}:focus-visible, ${selector}.is-focused`, [FORCED])
    ).toEqual({
      outline: '2px solid Highlight',
      'outline-offset': '2px',
    });
    const bulmaNone = BULMA.filter(
      r => !r.context.length && r.declarations.outline === 'none'
    ).flatMap(r => r.selector.split(', '));
    expect(bulmaNone).toContain('.button:focus-visible');
    for (const theirs of bulmaNone) {
      expect(weight(selector)).toBeGreaterThan(weight(theirs));
    }
  });

  it('prefixes every class under a class prefix', () => {
    const classes = (rules: Rule[]) =>
      rules.flatMap(r => r.selector.match(/\.[\w-]+/g) ?? []);
    expect(classes(PREFIXED).filter(c => !c.startsWith('.bestax-'))).toEqual(
      []
    );
    expect(PREFIXED.map(r => r.declarations)).toEqual(
      PLAIN.map(r => r.declarations)
    );
  });
});
