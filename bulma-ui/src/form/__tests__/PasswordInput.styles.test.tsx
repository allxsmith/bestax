// `_passwordinput.scss` lays the toggle over the input's right edge with the
// pickers' launcher rule, which the two share through the
// `extras-input-trigger` mixin. These compile it, with no prefix and under
// one, and read its rules as text, the way ColorInput's are read.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string, partial: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use '${partial}';`,
    {
      loadPaths: [SCSS, NODE_MODULES],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

interface Rule {
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

// The mixins it uses bring keyframes along; only the field's own rules count.
const own = (rules: Rule[]) =>
  rules.filter(r => !/^(from|to)$/.test(r.selector));
const PLAIN = own(rulesOf(compile('', 'form/passwordinput')));
const PREFIXED = own(rulesOf(compile('bestax-', 'form/passwordinput')));
const PICKERS = rulesOf(compile('', 'form/picker-popover'));

/**
 * The declarations a selector gets outside any media query, from every rule
 * that names it.
 */
function find(rules: Rule[], selector: string) {
  const found = rules.filter(
    r => r.selector === selector && r.context.length === 0
  );
  if (found.length === 0) throw new Error(`no rule for ${selector}`);
  return found.reduce<Record<string, string>>(
    (all, r) => ({ ...all, ...r.declarations }),
    {}
  );
}

const TOGGLE = '.passwordinput-container > .passwordinput-toggle';

describe('PasswordInput styles', () => {
  it('registers its variables on the container', () => {
    expect(find(PLAIN, '.passwordinput-container')).toEqual({
      position: 'relative',
      '--bulma-passwordinput-toggle-width': '2.5em',
      '--bulma-passwordinput-toggle-text-width': '4.5em',
      '--bulma-passwordinput-toggle-color': 'var(--bulma-text)',
      '--bulma-passwordinput-toggle-hover-color': 'var(--bulma-text-strong)',
    });
  });

  it('lays the toggle over the right edge, and keeps its width clear of text', () => {
    expect(find(PLAIN, '.passwordinput-container > .input')).toEqual({
      'padding-right': 'var(--bulma-passwordinput-toggle-width)',
    });
    expect(find(PLAIN, TOGGLE)).toMatchObject({
      position: 'absolute',
      top: '0',
      right: '0',
      height: '100%',
      width: 'var(--bulma-passwordinput-toggle-width)',
      color: 'var(--bulma-passwordinput-toggle-color)',
      'font-size': 'var(--bulma-size-normal)',
    });
    expect(find(PLAIN, `${TOGGLE}:hover:not(:disabled)`)).toEqual({
      color: 'var(--bulma-passwordinput-toggle-hover-color)',
    });
  });

  it('shares the pickers’ launcher rule, with its own variables', () => {
    // Both come from the `extras-input-trigger` mixin, so each picker rule
    // has a twin here that differs only in the names.
    const launcher = PICKERS.filter(r =>
      r.selector.startsWith('.dateinput-container')
    );
    expect(launcher.length).toBeGreaterThan(0);
    for (const rule of launcher) {
      const twin = rule.selector
        .replace(/dateinput-container/g, 'passwordinput-container')
        .replace(/dateinput-trigger/g, 'passwordinput-toggle');
      const declarations = Object.fromEntries(
        Object.entries(rule.declarations)
          .filter(([name]) => !name.startsWith('--'))
          .map(([name, value]) => [
            name,
            value.replace(/picker-trigger/g, 'passwordinput-toggle'),
          ])
      );
      expect(find(PLAIN, twin)).toEqual(expect.objectContaining(declarations));
    }
  });

  it('widens the toggle and the room for it with the text variant', () => {
    expect(
      find(
        PLAIN,
        '.passwordinput-container.is-text > .input, .passwordinput-container.is-text > .input.is-rounded'
      )
    ).toEqual({
      'padding-right': 'var(--bulma-passwordinput-toggle-text-width)',
    });
    expect(
      find(PLAIN, '.passwordinput-container.is-text > .passwordinput-toggle')
    ).toEqual({ width: 'var(--bulma-passwordinput-toggle-text-width)' });
  });

  it('outranks Bulma’s rounded input padding, so the order the sheets load in doesn’t matter', () => {
    // Bulma's `.input.is-rounded` sets both side paddings at two classes.
    const classes = (selector: string) =>
      (selector.match(/\.[\w-]+/g) ?? []).length;
    const rounded = PLAIN.filter(r =>
      r.selector.split(',').some(part => part.trim().endsWith('.is-rounded'))
    );
    expect(rounded).toHaveLength(2);
    for (const rule of rounded) {
      for (const part of rule.selector.split(',')) {
        if (part.trim().endsWith('.is-rounded')) {
          expect(classes(part)).toBeGreaterThan(2);
        }
      }
    }
  });

  it('sizes the toggle with the input', () => {
    for (const size of ['small', 'medium', 'large']) {
      expect(
        find(
          PLAIN,
          `.passwordinput-container > .input.is-${size} ~ .passwordinput-toggle`
        )
      ).toEqual({ 'font-size': `var(--bulma-size-${size})` });
    }
  });

  it('draws its focus ring with the extras-focus-outline mixin', () => {
    const mixin = sass.compileString(
      "@use 'mixins' as *;\n.probe { @include extras-focus-outline; }",
      { loadPaths: [SCSS], logger: sass.Logger.silent }
    ).css;
    expect(find(PLAIN, `${TOGGLE}:focus-visible`)).toEqual(
      find(rulesOf(mixin), '.probe')
    );
  });

  it('hides Edge’s own reveal button on its input only', () => {
    const reveal = PLAIN.filter(r => r.selector.includes('::-ms-reveal'));
    expect(reveal.map(r => r.selector)).toEqual([
      '.passwordinput-container > .input::-ms-reveal',
    ]);
    expect(reveal[0].declarations).toEqual({ display: 'none' });
  });

  it('sizes and colors a left icon from the input in the container', () => {
    const left = '.control.has-icons-left > .passwordinput-container';
    expect(find(PLAIN, `${left}:has(> .input.is-large) ~ .icon`)).toEqual({
      'font-size': 'var(--bulma-size-large)',
    });
    expect(find(PLAIN, `${left}:has(> .input:focus) ~ .icon`)).toEqual({
      color: 'var(--bulma-input-icon-focus-color)',
    });
  });

  it('draws a disabled toggle in the system gray in forced colors', () => {
    const forced = PLAIN.filter(r =>
      r.context.includes('@media (forced-colors: active)')
    );
    expect(forced).toEqual([
      {
        context: ['@media (forced-colors: active)'],
        selector: `${TOGGLE}:disabled`,
        declarations: { color: 'GrayText', opacity: '1' },
      },
    ]);
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED.map(r => r.selector)).toEqual(
      PLAIN.map(r =>
        r.selector.replace(
          /\.(passwordinput-|control\b|has-|is-|input\b|icon\b)/g,
          (_, name: string) => `.bestax-${name}`
        )
      )
    );
  });
});
