// `_tour.scss` is what dims the page, draws the spotlight and places the step
// against the coordinates the component sets, so these compile it, with no
// prefix and under one, and read its rules. jsdom's CSS parser drops
// `@media (forced-colors)` and SVG geometry properties, so the compiled sheet
// is read as text instead: each rule's selector, the at-rules it sits in, and
// its declarations.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/tour';`,
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

/** The declarations of the rules with exactly this selector, in this context. */
function find(rules: Rule[], selector: string, context: string[] = []) {
  const found = rules.filter(
    r =>
      r.selector === selector && r.context.join(' | ') === context.join(' | ')
  );
  if (found.length === 0) throw new Error(`no rule for ${selector}`);
  return Object.assign({}, ...found.map(r => r.declarations));
}

const gap =
  'calc(var(--bulma-tour-spotlight-padding) + var(--bulma-tour-step-offset))';

describe('Tour styles', () => {
  it('registers its variables on the root, which lifts the tour to the modal layer', () => {
    expect(find(PLAIN, '.tour')).toMatchObject({
      '--bulma-tour-z-index': '60',
      '--bulma-tour-overlay-background':
        'hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.5)',
      '--bulma-tour-spotlight-padding': '0.5rem',
      '--bulma-tour-spotlight-radius': 'var(--bulma-radius)',
      '--bulma-tour-step-background': 'var(--bulma-scheme-main)',
      '--bulma-tour-step-border-color': 'var(--bulma-border-weak)',
      '--bulma-tour-step-max-width': 'min(24rem, 100vw - 2rem)',
      '--bulma-tour-progress-color': 'var(--bulma-text-weak)',
      position: 'relative',
      'z-index': 'var(--bulma-tour-z-index)',
    });
  });

  it('dims the viewport through the overlay’s fill', () => {
    expect(find(PLAIN, '.tour-overlay')).toMatchObject({
      position: 'fixed',
      inset: '0',
      fill: 'var(--bulma-tour-overlay-background)',
    });
  });

  it('rounds the spotlight and its ring, which draws nothing until forced colors', () => {
    const both = '.tour-spotlight, .tour-spotlight-ring';
    expect(find(PLAIN, both)).toEqual({
      rx: 'var(--bulma-tour-spotlight-radius)',
    });
    expect(find(PLAIN, '.tour-spotlight-ring')).toEqual({
      fill: 'none',
      stroke: 'none',
    });
    expect(
      find(PLAIN, '.tour-spotlight-ring', ['@media (forced-colors: active)'])
    ).toEqual({ stroke: 'Highlight', 'stroke-width': '2px' });
  });

  it('fixes the step to the viewport, bordered, with the gap on the side facing the target', () => {
    expect(find(PLAIN, '.tour-step')).toMatchObject({
      position: 'fixed',
      width: 'max-content',
      'max-width': 'var(--bulma-tour-step-max-width)',
      border: '1px solid var(--bulma-tour-step-border-color)',
    });
    expect(find(PLAIN, '.tour-step.is-bottom')).toEqual({ 'margin-top': gap });
    expect(find(PLAIN, '.tour-step.is-top')).toEqual({
      'margin-top': `calc(-1 * ${gap})`,
    });
    expect(find(PLAIN, '.tour-step.is-right')).toEqual({ 'margin-left': gap });
    expect(find(PLAIN, '.tour-step.is-left')).toEqual({
      'margin-left': `calc(-1 * ${gap})`,
    });
  });

  it('moves nothing on its own, so the scroll to a target is the only motion', () => {
    for (const rule of PLAIN) {
      for (const property of Object.keys(rule.declarations)) {
        expect(property).not.toMatch(/^(transition|animation)/);
      }
    }
  });

  it('prefixes every class it styles', () => {
    for (const rule of PREFIXED) {
      for (const cls of rule.selector.match(/\.[a-z][\w-]*/g) ?? []) {
        expect(cls).toMatch(/^\.bestax-/);
      }
    }
    expect(find(PREFIXED, '.bestax-tour-step.bestax-is-left')).toEqual({
      'margin-left': `calc(-1 * ${gap})`,
    });
  });
});
