// `_ringprogress.scss` draws the ring, so these compile it, with no prefix and
// under one, and read its rules as text, the way Splitter's are read.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'elements/ringprogress';`,
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

const arc = '.ring-progress-arc';

describe('RingProgress styles', () => {
  it('registers its variables on the root, from Bulma tokens', () => {
    const root = PLAIN.filter(r => r.selector === '.ring-progress').map(
      r => r.declarations
    );
    expect(Object.assign({}, ...root)).toMatchObject({
      '--bulma-ring-progress-size': '5rem',
      '--bulma-ring-progress-thickness': '10',
      '--bulma-ring-progress-track-color': 'var(--bulma-border-weak)',
      '--bulma-ring-progress-arc-color': 'var(--bulma-primary)',
      '--bulma-ring-progress-duration': 'var(--bulma-duration)',
      '--bulma-ring-progress-label-size':
        'calc(var(--bulma-ring-progress-size) / 5)',
      display: 'inline-grid',
      '--ring-progress-gap': '0',
    });
  });

  it('sizes the ring for each size', () => {
    expect(find(PLAIN, '.ring-progress.is-small')).toEqual({
      '--bulma-ring-progress-size': '3.5rem',
    });
    expect(find(PLAIN, '.ring-progress.is-large')).toEqual({
      '--bulma-ring-progress-size': '9rem',
    });
  });

  it('sizes the middle with the ring', () => {
    expect(find(PLAIN, '.ring-progress-label')['font-size']).toBe(
      'var(--bulma-ring-progress-label-size)'
    );
  });

  it('starts the ring at the top, and stacks the middle over it', () => {
    expect(find(PLAIN, '.ring-progress-ring').transform).toBe('rotate(-90deg)');
    expect(
      find(PLAIN, '.ring-progress-ring, .ring-progress-label')['grid-area']
    ).toBe('1/1');
  });

  it('draws each arc as a dash of its length from its start, in path units', () => {
    expect(find(PLAIN, arc)).toMatchObject({
      stroke: 'var(--bulma-ring-progress-arc-color)',
      // Sass drops the calc() inside max(), which the browsers read the same.
      'stroke-dasharray':
        'max(0px, (var(--ring-progress-length) - var(--ring-progress-gap)) * 1px) 100px',
      'stroke-dashoffset': 'calc(var(--ring-progress-start) * -1px)',
      'transition-duration': 'var(--bulma-ring-progress-duration)',
    });
  });

  it('rounds the arc ends with is-rounded', () => {
    expect(find(PLAIN, `.ring-progress.is-rounded ${arc}`)).toEqual({
      'stroke-linecap': 'round',
    });
  });

  it('colors the ring from the root, and a section from its own class', () => {
    expect(find(PLAIN, '.ring-progress.is-success')).toEqual({
      '--bulma-ring-progress-arc-color': 'var(--bulma-success)',
    });
    expect(find(PLAIN, `${arc}.is-warning`)).toEqual({
      stroke: 'var(--bulma-warning)',
    });
  });

  it('stops the arc sliding under reduced motion', () => {
    expect(
      find(PLAIN, arc, ['@media (prefers-reduced-motion: reduce)'])
    ).toEqual({ transition: 'none' });
  });

  it('gives the ring system colors in forced colors, and sections gaps', () => {
    const forced = ['@media (forced-colors: active)'];
    expect(find(PLAIN, '.ring-progress.has-sections', forced)).toEqual({
      '--ring-progress-gap': '1.5',
    });
    expect(find(PLAIN, '.ring-progress-track', forced)).toEqual({
      stroke: 'GrayText',
    });
    expect(find(PLAIN, `.ring-progress ${arc}`, forced)).toEqual({
      stroke: 'CanvasText',
    });
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED.map(r => r.selector)).toEqual(
      PLAIN.map(r =>
        r.selector.replace(/\.(ring-progress|is-|has-)/g, '.bestax-$1')
      )
    );
  });
});
