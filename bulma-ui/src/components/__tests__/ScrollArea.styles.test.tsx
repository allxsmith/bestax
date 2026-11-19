// `_scrollarea.scss` is all that makes a ScrollArea scroll, styles its bars
// and draws its fade, so these compile it, with no prefix and under one, and
// read its rules. jsdom's CSS parser drops `:dir()`, `:has()` and
// `@supports selector()`, so the compiled sheet is read as text instead: each
// rule's selector, the at-rules it sits in, and its declarations.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/scrollarea';`,
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

const viewport = '.scroll-area-viewport';
const fade = `.scroll-area.has-fade > ${viewport}`;

describe('ScrollArea styles', () => {
  it('registers its variables on the frame, a cell that asks for no room of its own', () => {
    const frame = PLAIN.filter(r => r.selector === '.scroll-area').map(
      r => r.declarations
    );
    expect(Object.assign({}, ...frame)).toMatchObject({
      '--bulma-scroll-area-scrollbar-width': 'thin',
      '--bulma-scroll-area-thumb-color': 'var(--bulma-text-weak)',
      '--bulma-scroll-area-thumb-hover-color': 'var(--bulma-text)',
      '--bulma-scroll-area-track-color': 'transparent',
      '--bulma-scroll-area-fade-size': '2rem',
      display: 'grid',
      'grid-template-columns': 'minmax(0, 1fr)',
      'grid-template-rows': 'minmax(0, 1fr)',
      'min-width': '0',
      'min-height': '0',
    });
  });

  it('makes the viewport scroll on the bars the variables style', () => {
    expect(find(PLAIN, viewport)).toMatchObject({
      overflow: 'auto',
      'border-radius': 'inherit',
      'scrollbar-width': 'var(--bulma-scroll-area-scrollbar-width)',
      'scrollbar-color':
        'var(--bulma-scroll-area-thumb-color) var(--bulma-scroll-area-track-color)',
    });
    expect(find(PLAIN, `.scroll-area:hover > ${viewport}`)).toEqual({
      'scrollbar-color':
        'var(--bulma-scroll-area-thumb-hover-color) var(--bulma-scroll-area-track-color)',
    });
  });

  it('clips the axis an orientation leaves out', () => {
    expect(find(PLAIN, `.scroll-area.is-vertical > ${viewport}`)).toEqual({
      'overflow-x': 'hidden',
      'overflow-y': 'auto',
    });
    expect(find(PLAIN, `.scroll-area.is-horizontal > ${viewport}`)).toEqual({
      'overflow-x': 'auto',
      'overflow-y': 'hidden',
    });
  });

  it('shows the bars always as overflow: scroll, on the axes it scrolls', () => {
    const always = '.scroll-area.has-visible-scrollbars';
    expect(find(PLAIN, `${always} > ${viewport}`)).toEqual({
      overflow: 'scroll',
    });
    expect(find(PLAIN, `${always}.is-vertical > ${viewport}`)).toEqual({
      'overflow-x': 'hidden',
      'overflow-y': 'scroll',
    });
    expect(find(PLAIN, `${always}.is-horizontal > ${viewport}`)).toEqual({
      'overflow-x': 'scroll',
      'overflow-y': 'hidden',
    });
  });

  it('keeps hover bars colorless until the pointer or focus is in it', () => {
    const hover = '.scroll-area.has-hover-scrollbars';
    expect(find(PLAIN, `${hover} > ${viewport}`)).toEqual({
      'scrollbar-color': 'transparent transparent',
    });
    expect(
      find(
        PLAIN,
        `${hover}:hover > ${viewport}, ${hover} > ${viewport}:focus-within`
      )
    ).toEqual({
      'scrollbar-color':
        'var(--bulma-scroll-area-thumb-hover-color) var(--bulma-scroll-area-track-color)',
    });
  });

  it('keeps the gutter with hasStableGutter', () => {
    expect(find(PLAIN, `.scroll-area.has-stable-gutter > ${viewport}`)).toEqual(
      { 'scrollbar-gutter': 'stable' }
    );
  });

  describe('The fade', () => {
    const rule = () => find(PLAIN, fade);

    it('masks the content with a gradient per axis, and the bar strips opaque', () => {
      const mask = rule()['mask-image'];
      expect(mask.match(/linear-gradient\(/g)).toHaveLength(4);
      expect(mask).toContain(
        'linear-gradient(to bottom, var(--scroll-area-fade-top), #000 var(--bulma-scroll-area-fade-size), #000 calc(100% - var(--bulma-scroll-area-fade-size)), var(--scroll-area-fade-bottom))'
      );
      expect(mask).toContain(
        'linear-gradient(to right, var(--scroll-area-fade-start)'
      );
      expect(rule()).toMatchObject({
        'mask-size':
          'var(--scroll-area-bar-inline) 100%, 100% var(--scroll-area-bar-block), 100% calc(100% - var(--scroll-area-bar-block)), calc(100% - var(--scroll-area-bar-inline)) 100%',
        'mask-position': 'right top, left bottom, left top, left top',
        'mask-repeat': 'no-repeat',
        'mask-composite': 'add, add, intersect, add',
        '--scroll-area-bar-inline': 'var(--scroll-area-bar-inline-size, 0px)',
        '--scroll-area-bar-block': 'var(--scroll-area-bar-block-size, 0px)',
      });
    });

    it('is opaque at each edge until the edge has more past it', () => {
      for (const edge of ['top', 'bottom', 'start', 'end']) {
        expect(rule()[`--scroll-area-fade-${edge}`]).toBe('#000');
        expect(find(PLAIN, `${fade}[data-overflow-${edge}]`)).toEqual({
          [`--scroll-area-fade-${edge}`]: 'transparent',
        });
      }
    });

    it('runs from the right, with the bar strip on the left, right to left', () => {
      const rtl = find(PLAIN, `${fade}:dir(rtl)`);
      expect(rtl['mask-image']).toContain(
        'linear-gradient(to left, var(--scroll-area-fade-start)'
      );
      expect(rtl['mask-position']).toBe(
        'left top, left bottom, left top, right top'
      );
    });

    it.each([
      '@media (forced-colors: active)',
      '@media (prefers-contrast: more)',
    ])('is off under %s', media => {
      expect(find(PLAIN, fade, [media])).toEqual({ 'mask-image': 'none' });
    });
  });

  describe('The focus ring', () => {
    it('is the viewport’s own, inside it, where :has() is missing', () => {
      expect(find(PLAIN, `${viewport}:focus`)).toEqual({ outline: 'none' });
      expect(find(PLAIN, `${viewport}:focus-visible`)).toMatchObject({
        'outline-offset': '-2px',
      });
      expect(find(PLAIN, `${viewport}:focus-visible`).outline).toMatch(
        /^2px solid /
      );
    });

    it('moves to the frame where :has() works, so the fade never clips it', () => {
      const supports = ['@supports selector(:has(*))'];
      expect(
        find(PLAIN, `.scroll-area:has(> ${viewport}:focus-visible)`, supports)
      ).toMatchObject({ 'outline-offset': '2px' });
      expect(find(PLAIN, `${viewport}:focus-visible`, supports)).toEqual({
        outline: 'none',
      });
    });

    it('takes the system text color in forced colors, in two rules', () => {
      const forced = ['@media (forced-colors: active)'];
      expect(find(PLAIN, `${viewport}:focus-visible`, forced)).toEqual({
        'outline-color': 'CanvasText',
      });
      expect(
        find(PLAIN, `.scroll-area:has(> ${viewport}:focus-visible)`, forced)
      ).toEqual({ 'outline-color': 'CanvasText' });
    });
  });

  it('prefixes every class under a class prefix', () => {
    const selectors = PREFIXED.map(r => r.selector).join(' ');
    expect(selectors).not.toMatch(/(^|[^-])\.(scroll-area|is-|has-)/);
    expect(
      find(
        PREFIXED,
        '.bestax-scroll-area.bestax-has-fade > .bestax-scroll-area-viewport[data-overflow-top]'
      )
    ).toEqual({ '--scroll-area-fade-top': 'transparent' });
    expect(PREFIXED.map(r => r.selector)).toEqual(
      PLAIN.map(r =>
        r.selector.replace(/\.(scroll-area|is-|has-)/g, '.bestax-$1')
      )
    );
  });
});
