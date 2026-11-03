// `_appframe.scss` lays out the whole frame, at every width, before any
// script runs, so these compile it, with no prefix and under one, and read
// its rules. The sheet is read as text, the way Splitter's is: each rule's
// selector, the at-rules around it, and its declarations.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'layout/appframe';`,
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
  /** Every declaration in order, repeats included. */
  all: [string, string][];
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
          all: [],
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
          const property = declaration.slice(0, at).trim();
          const value = declaration
            .slice(at + 1)
            .replace(/\s+/g, ' ')
            .trim();
          closed.declarations[property] = value;
          closed.all.push([property, value]);
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

/** The rule with exactly this selector, in this context. */
function ruleFor(rules: Rule[], selector: string, context: string[] = []) {
  const rule = rules.find(
    r =>
      r.selector === selector && r.context.join(' | ') === context.join(' | ')
  );
  if (!rule) throw new Error(`no rule for ${selector} in ${context}`);
  return rule;
}

const find = (rules: Rule[], selector: string, context: string[] = []) =>
  ruleFor(rules, selector, context).declarations;

const TABLET = '@media screen and (min-width: 769px), print';
const DESKTOP = '@media screen and (min-width: 1024px)';
const WIDESCREEN = '@media screen and (min-width: 1216px)';

describe('AppFrame styles', () => {
  it('registers its variables on the root, from Bulma tokens', () => {
    expect(find(PLAIN, '.app-frame')).toMatchObject({
      '--bulma-app-frame-header-background': 'var(--bulma-scheme-main)',
      '--bulma-app-frame-nav-width': '16rem',
      '--bulma-app-frame-nav-rail-width': '4rem',
      '--bulma-app-frame-nav-background': 'var(--bulma-scheme-main)',
      '--bulma-app-frame-aside-width': '20rem',
      '--bulma-app-frame-border-color': 'var(--bulma-border)',
      '--bulma-app-frame-backdrop-background':
        'hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.86)',
      '--bulma-app-frame-drawer-shadow': 'var(--bulma-shadow)',
      '--bulma-app-frame-transition-duration': 'var(--bulma-duration)',
    });
  });

  it('puts the header height on Bulma’s variables host, and pads the document’s scroll by it', () => {
    expect(find(PLAIN, ':root')).toEqual({
      '--bulma-app-frame-header-height': 'var(--bulma-navbar-height)',
    });
    expect(find(PLAIN, 'html:has(.app-frame)')).toEqual({
      'scroll-padding-top': 'var(--bulma-app-frame-header-height)',
    });
  });

  describe('below the breakpoint', () => {
    it('stacks the parts in one column at least as tall as the window', () => {
      // The second rule on the root: the first registers the variables.
      const layout = PLAIN.filter(r => r.selector === '.app-frame').find(
        r => 'display' in r.declarations
      ) as Rule;
      expect(layout.declarations).toMatchObject({
        display: 'grid',
        'grid-template-columns': 'minmax(0, 1fr)',
        'grid-template-rows': 'auto 1fr auto auto',
        'grid-template-areas': '"header" "main" "aside" "footer"',
      });
      expect(layout.all.filter(([p]) => p === 'min-height')).toEqual([
        ['min-height', '100vh'],
        ['min-height', '100dvh'],
      ]);
    });

    it('sticks the header to the top', () => {
      expect(find(PLAIN, '.app-frame-header')).toMatchObject({
        'grid-area': 'header',
        position: 'sticky',
        'inset-block-start': '0',
        'z-index': '30',
      });
    });

    it('makes the nav a drawer, out of view and hidden until it opens', () => {
      expect(find(PLAIN, '.app-frame-nav')).toMatchObject({
        position: 'fixed',
        'inset-block': '0',
        'inset-inline-start': '0',
        'z-index': '40',
        'inline-size': 'min(var(--bulma-app-frame-nav-width), 100vw - 3rem)',
        'overflow-y': 'auto',
        'overscroll-behavior': 'contain',
        transform: 'translateX(-100%)',
        visibility: 'hidden',
        // The slide plays, and the drawer hides once it's over.
        'transition-property': 'transform, visibility',
        'transition-delay': '0s, var(--bulma-app-frame-transition-duration)',
      });
      expect(find(PLAIN, '.app-frame-nav:dir(rtl)')).toEqual({
        transform: 'translateX(100%)',
      });
    });

    it('shows the open drawer at once, so focus can move in', () => {
      expect(find(PLAIN, '.app-frame.is-nav-open > .app-frame-nav')).toEqual({
        transform: 'none',
        visibility: 'visible',
        'transition-delay': '0s',
      });
    });

    it('fades the backdrop in under the open drawer', () => {
      expect(find(PLAIN, '.app-frame-backdrop')).toMatchObject({
        position: 'fixed',
        inset: '0',
        'z-index': '39',
        opacity: '0',
        visibility: 'hidden',
      });
      expect(
        find(PLAIN, '.app-frame.is-nav-open > .app-frame-backdrop')
      ).toEqual({
        opacity: '1',
        visibility: 'visible',
        'transition-delay': '0s',
      });
    });

    it('puts the close button at the far side of the drawer’s top', () => {
      expect(find(PLAIN, '.app-frame-nav > .app-frame-close')).toMatchObject({
        display: 'flex',
        'margin-inline-start': 'auto',
      });
    });
  });

  describe.each([
    ['tablet', TABLET],
    ['desktop', DESKTOP],
    ['widescreen', WIDESCREEN],
  ])('from the %s breakpoint up', (breakpoint, media) => {
    const root = `.app-frame.is-${breakpoint}`;

    it('lays out the column, the page and the aside under the header', () => {
      expect(find(PLAIN, root, [media])).toEqual({
        'grid-template-columns': 'auto minmax(0, 1fr) auto',
        'grid-template-rows': 'auto 1fr auto',
        'grid-template-areas':
          '"header header header" "nav main aside" "nav footer aside"',
      });
    });

    it('sticks the nav column under the header, as tall as the window less it', () => {
      const nav = ruleFor(PLAIN, `${root} > .app-frame-nav`, [media]);
      expect(nav.declarations).toMatchObject({
        'grid-area': 'nav',
        position: 'sticky',
        'inset-block-start': 'var(--bulma-app-frame-header-height)',
        'z-index': 'auto',
        'align-self': 'start',
        'inline-size': 'var(--bulma-app-frame-nav-width)',
        'border-inline-end':
          'var(--bulma-app-frame-border-width) solid var(--bulma-app-frame-border-color)',
        transform: 'none',
        visibility: 'visible',
      });
      expect(nav.all.filter(([p]) => p === 'block-size')).toEqual([
        ['block-size', 'calc(100vh - var(--bulma-app-frame-header-height))'],
        ['block-size', 'calc(100dvh - var(--bulma-app-frame-header-height))'],
      ]);
    });

    it('slides a collapsed column out past its edge, then hides it', () => {
      expect(
        find(PLAIN, `${root}.is-nav-collapsed > .app-frame-nav`, [media])
      ).toEqual({
        'margin-inline-start': 'calc(-1 * var(--bulma-app-frame-nav-width))',
        visibility: 'hidden',
        'transition-delay':
          '0s, 0s, var(--bulma-app-frame-transition-duration)',
      });
    });

    it('slides the column’s edge and its width, and hides it only once it’s out', () => {
      expect(find(PLAIN, `${root} > .app-frame-nav`, [media])).toMatchObject({
        'transition-property': 'margin-inline-start, inline-size, visibility',
        'transition-duration':
          'var(--bulma-app-frame-transition-duration), var(--bulma-app-frame-transition-duration), 0s',
        'transition-delay': '0s',
      });
    });

    describe('collapsed to the rail', () => {
      const rail = `${root}.is-nav-collapsed > .app-frame-nav.is-rail`;

      it('narrows the column to the icons, over the page, unclipped and as tall as its content', () => {
        const nav = ruleFor(PLAIN, rail, [media]);
        expect(nav.declarations).toEqual({
          'z-index': '29',
          'margin-inline-start': '0',
          'inline-size': 'var(--bulma-app-frame-nav-rail-width)',
          'block-size': 'auto',
          'min-block-size':
            'calc(100svh - var(--bulma-app-frame-header-height))',
          overflow: 'visible',
          visibility: 'visible',
          'transition-delay': '0s',
        });
        expect(nav.all.filter(([p]) => p === 'min-block-size')).toEqual([
          [
            'min-block-size',
            'calc(100vh - var(--bulma-app-frame-header-height))',
          ],
          [
            'min-block-size',
            'calc(100svh - var(--bulma-app-frame-header-height))',
          ],
        ]);
      });

      it('lets a rail taller than the window under the header scroll with the page', () => {
        expect(find(PLAIN, `${rail}.is-tall`, [media])).toEqual({
          position: 'relative',
          'inset-block-start': 'auto',
        });
      });

      it('shows each tooltip and its bridge, and centers each link or button on its icon', () => {
        expect(
          find(
            PLAIN,
            `${rail} .app-frame-rail-tooltip > .tooltip-content, ${rail} .app-frame-rail-tooltip::after`,
            [media]
          )
        ).toEqual({ display: 'block' });
        expect(
          find(PLAIN, `${rail} .app-frame-rail-tooltip > :first-child`, [media])
        ).toEqual({
          'padding-inline': '0',
          'justify-content': 'center',
          'text-align': 'center',
        });
        expect(find(PLAIN, `${rail} .menu-item-icon`, [media])).toEqual({
          'margin-inline-end': '0',
        });
        // A section's icon as large as the items', not the heading's size.
        expect(find(PLAIN, `${rail} .menu-section-toggle`, [media])).toEqual({
          'font-size': 'inherit',
        });
      });

      it('hides each label visually, never with display: none, so it stays the name', () => {
        const labels = find(
          PLAIN,
          `${rail} .menu-item-label, ${rail} .menu-section-label`,
          [media]
        );
        expect(labels).toMatchObject({
          position: 'absolute',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
        });
        expect(labels.display).toBeUndefined();
        expect(labels.visibility).toBeUndefined();
      });

      it('hides the nested lists, the labels, the chevrons and the sections’ lists', () => {
        expect(
          find(
            PLAIN,
            [
              `${rail} .menu-label`,
              `${rail} .menu-section-chevron`,
              `${rail} .menu-list ul`,
              `${rail} .menu-section > div`,
            ].join(', '),
            [media]
          )
        ).toEqual({ display: 'none' });
      });
    });

    it('drops the close button and the backdrop', () => {
      expect(
        find(
          PLAIN,
          `${root} > .app-frame-nav > .app-frame-close, ${root} > .app-frame-backdrop`,
          [media]
        )
      ).toEqual({ display: 'none' });
    });

    it('sizes the aside', () => {
      expect(find(PLAIN, `${root} > .app-frame-aside`, [media])).toEqual({
        'inline-size': 'var(--bulma-app-frame-aside-width)',
        'border-inline-start':
          'var(--bulma-app-frame-border-width) solid var(--bulma-app-frame-border-color)',
      });
    });
  });

  it('makes the rail’s tooltip wrapper a block and hides its tooltip and bridge, at every width', () => {
    expect(find(PLAIN, '.tooltip.app-frame-rail-tooltip')).toEqual({
      display: 'block',
    });
    expect(
      find(
        PLAIN,
        '.tooltip.app-frame-rail-tooltip > .tooltip-content, .tooltip.app-frame-rail-tooltip::after'
      )
    ).toEqual({ display: 'none' });
  });

  it('shows the frame’s burger at every width, over Bulma’s rule', () => {
    expect(find(PLAIN, '.navbar-burger.app-frame-burger')).toEqual({
      display: 'inline-flex',
    });
  });

  it('keeps the skip link out of sight until it has focus', () => {
    expect(find(PLAIN, '.app-frame-skip-link')).toMatchObject({
      position: 'absolute',
      width: '1px',
      height: '1px',
      clip: 'rect(0, 0, 0, 0)',
      transition: 'none',
    });
    expect(find(PLAIN, '.app-frame-skip-link:focus')).toMatchObject({
      position: 'fixed',
      width: 'auto',
      height: 'auto',
      clip: 'auto',
      'background-color': 'var(--bulma-app-frame-skip-link-background)',
      color: 'var(--bulma-app-frame-skip-link-color)',
      'outline-offset': '2px',
    });
  });

  it('draws no ring on main, which the skip link focuses', () => {
    expect(find(PLAIN, '.app-frame-main:focus')).toEqual({ outline: 'none' });
  });

  it('gives the drawer a border in forced colors, where its shadow is dropped', () => {
    expect(
      find(PLAIN, '.app-frame-nav', ['@media (forced-colors: active)'])
    ).toEqual({
      'border-inline-end':
        'var(--bulma-app-frame-border-width) solid var(--bulma-app-frame-border-color)',
    });
  });

  it('stops every transition under reduced motion', () => {
    expect(
      find(PLAIN, '.app-frame-nav, .app-frame-backdrop', [
        '@media (prefers-reduced-motion: reduce)',
      ])
    ).toEqual({ transition: 'none !important' });
  });

  it('prefixes every class, and only classes', () => {
    const selectors = PREFIXED.filter(
      r => !r.context.some(c => c.startsWith('@keyframes'))
    ).map(r => r.selector);
    const classes = selectors.flatMap(s => s.match(/\.[\w-]+/g) ?? []);
    expect(classes.length).toBeGreaterThan(0);
    expect(classes.filter(c => !c.startsWith('.bestax-'))).toEqual([]);
    expect(selectors).toContain(
      '.bestax-app-frame.bestax-is-desktop.bestax-is-nav-collapsed > .bestax-app-frame-nav'
    );
    expect(selectors).toContain('html:has(.bestax-app-frame)');
    expect(
      selectors.some(s =>
        s.includes(
          '.bestax-app-frame.bestax-is-desktop.bestax-is-nav-collapsed > .bestax-app-frame-nav.bestax-is-rail .bestax-menu-item-label'
        )
      )
    ).toBe(true);
  });
});
