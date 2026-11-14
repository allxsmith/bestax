// `_lightbox.scss` lays out the viewer over Bulma's modal, styles its buttons
// for the dark background, fades the images and keeps a trigger looking like
// what it holds, so these compile it, with no prefix and under one, and read
// its rules. jsdom's CSS parser drops `:dir()` and `:where()`, so the
// compiled sheet is read as text instead: each rule's selector, the at-rules
// it sits in, and its declarations.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/lightbox';`,
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

const ROOT = '.modal.lightbox';
const CONTROLS = `${ROOT} .lightbox-toolbar .button, ${ROOT} .lightbox-arrow`;

describe('Lightbox styles', () => {
  it('registers its variables, and widens Bulma’s modal content, on the root', () => {
    expect(find(PLAIN, ROOT)).toEqual({
      '--bulma-lightbox-arrow-background':
        'hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.3)',
      '--bulma-lightbox-arrow-background-hover':
        'hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.5)',
      '--bulma-lightbox-arrow-color': 'var(--bulma-white)',
      '--bulma-lightbox-arrow-size': '3rem',
      '--bulma-lightbox-arrow-offset': '1rem',
      '--bulma-lightbox-arrow-icon-size': '1.5rem',
      '--bulma-lightbox-toolbar-button-background':
        'var(--bulma-lightbox-arrow-background)',
      '--bulma-lightbox-toolbar-button-background-hover':
        'var(--bulma-lightbox-arrow-background-hover)',
      '--bulma-lightbox-toolbar-icon-size': '1.25rem',
      '--bulma-lightbox-button-border-width': '1px',
      '--bulma-lightbox-disabled-opacity': '0.4',
      '--bulma-lightbox-controls-z-index': '1',
      '--bulma-lightbox-toolbar-color': 'var(--bulma-white)',
      '--bulma-lightbox-toolbar-gap': '0.75rem',
      '--bulma-lightbox-caption-color': 'var(--bulma-white)',
      '--bulma-lightbox-caption-max-width': '40em',
      '--bulma-lightbox-caption-padding': '0.75rem 1rem 0',
      '--bulma-lightbox-error-color': 'var(--bulma-lightbox-caption-color)',
      '--bulma-lightbox-error-gap': '0.75rem',
      '--bulma-lightbox-error-padding': '1rem',
      '--bulma-lightbox-loader-size': '2.5rem',
      '--bulma-lightbox-spacing': '4.5rem',
      '--bulma-lightbox-image-max-height':
        'calc(100% - 2 * var(--bulma-lightbox-spacing))',
      '--bulma-lightbox-animation-duration': 'var(--bulma-duration)',
      '--bulma-modal-content-width':
        'calc(100% - 2 * (var(--bulma-lightbox-arrow-size) + 2 * var(--bulma-lightbox-arrow-offset)))',
    });
  });

  it('gives the image the viewer’s height between the bands, and lets clicks through around it', () => {
    expect(find(PLAIN, `${ROOT} > .modal-content`)).toEqual({
      height: 'var(--bulma-lightbox-image-max-height)',
      'max-height': 'none',
      margin: '0',
      overflow: 'visible',
      'pointer-events': 'none',
    });
    expect(find(PLAIN, '.lightbox-image')).toMatchObject({
      'max-width': '100%',
      'max-height': '100%',
      'pointer-events': 'auto',
      'touch-action': 'none',
    });
    expect(find(PLAIN, '.lightbox-caption')['pointer-events']).toBe('auto');
    expect(find(PLAIN, '.lightbox-toolbar')['pointer-events']).toBe('none');
    expect(find(PLAIN, CONTROLS)['pointer-events']).toBe('auto');
  });

  it('stacks the image, the one leaving, the Loader and the error in one cell', () => {
    expect(find(PLAIN, '.lightbox-figure')).toMatchObject({
      display: 'grid',
      'grid-template-rows': 'minmax(0, 1fr) auto',
    });
    expect(find(PLAIN, '.lightbox-figure > :not(.lightbox-caption)')).toEqual({
      'grid-area': '1/1',
      'place-self': 'center',
    });
  });

  it('keeps the toolbar, the close button and the arrows over a zoomed image', () => {
    const above = 'var(--bulma-lightbox-controls-z-index)';
    expect(find(PLAIN, `${ROOT} > .modal-close`)).toEqual({ 'z-index': above });
    expect(find(PLAIN, '.lightbox-toolbar')['z-index']).toBe(above);
    expect(find(PLAIN, `${ROOT} .lightbox-arrow`)['z-index']).toBe(above);
  });

  it('spaces the toolbar, the caption, the error and the Loader in the variables', () => {
    expect(find(PLAIN, '.lightbox-toolbar').gap).toBe(
      'var(--bulma-lightbox-toolbar-gap)'
    );
    expect(find(PLAIN, '.lightbox-caption')).toMatchObject({
      'max-width': 'var(--bulma-lightbox-caption-max-width)',
      padding: 'var(--bulma-lightbox-caption-padding)',
      color: 'var(--bulma-lightbox-caption-color)',
    });
    expect(find(PLAIN, '.lightbox-error')).toMatchObject({
      gap: 'var(--bulma-lightbox-error-gap)',
      padding: 'var(--bulma-lightbox-error-padding)',
      color: 'var(--bulma-lightbox-error-color)',
    });
    expect(find(PLAIN, '.lightbox-figure > .loader')).toEqual({
      'font-size': 'var(--bulma-lightbox-loader-size)',
    });
  });

  it('puts the arrows at the inline edges and mirrors the chevrons right to left', () => {
    expect(find(PLAIN, `${ROOT} .lightbox-arrow.is-prev`)).toEqual({
      'inset-inline-start': 'var(--bulma-lightbox-arrow-offset)',
    });
    expect(find(PLAIN, `${ROOT} .lightbox-arrow.is-next`)).toEqual({
      'inset-inline-end': 'var(--bulma-lightbox-arrow-offset)',
    });
    expect(find(PLAIN, `${ROOT} .lightbox-arrow svg:dir(rtl)`)).toEqual({
      transform: 'scaleX(-1)',
    });
  });

  it('draws the controls in the variables, with an outline for focus and a dimmed disabled state', () => {
    expect(find(PLAIN, CONTROLS)).toMatchObject({
      border: 'var(--bulma-lightbox-button-border-width) solid transparent',
    });
    // The zoom buttons and the arrows each in their own variables.
    expect(find(PLAIN, `${ROOT} .lightbox-toolbar .button`)).toEqual({
      'background-color': 'var(--bulma-lightbox-toolbar-button-background)',
      color: 'var(--bulma-lightbox-toolbar-color)',
    });
    expect(
      find(
        PLAIN,
        `${ROOT} .lightbox-toolbar .button:hover:not([aria-disabled=true])`
      )
    ).toEqual({
      'background-color':
        'var(--bulma-lightbox-toolbar-button-background-hover)',
    });
    expect(find(PLAIN, `${ROOT} .lightbox-toolbar .button svg`)).toEqual({
      width: 'var(--bulma-lightbox-toolbar-icon-size)',
      height: 'var(--bulma-lightbox-toolbar-icon-size)',
    });
    expect(find(PLAIN, `${ROOT} .lightbox-arrow`)).toMatchObject({
      'background-color': 'var(--bulma-lightbox-arrow-background)',
      color: 'var(--bulma-lightbox-arrow-color)',
    });
    expect(
      find(PLAIN, `${ROOT} .lightbox-arrow:hover:not([aria-disabled=true])`)
    ).toEqual({
      'background-color': 'var(--bulma-lightbox-arrow-background-hover)',
    });
    expect(find(PLAIN, `${ROOT} .lightbox-arrow svg`)).toEqual({
      width: 'var(--bulma-lightbox-arrow-icon-size)',
      height: 'var(--bulma-lightbox-arrow-icon-size)',
    });
    expect(
      find(
        PLAIN,
        `${ROOT} .lightbox-toolbar .button:focus-visible, ${ROOT} .lightbox-arrow:focus-visible`
      )
    ).toMatchObject({
      'outline-color': 'currentColor',
      'box-shadow': 'none',
    });
    expect(
      find(
        PLAIN,
        `${ROOT} .lightbox-toolbar .button[aria-disabled=true], ${ROOT} .lightbox-arrow[aria-disabled=true]`
      )
    ).toEqual({
      opacity: 'var(--bulma-lightbox-disabled-opacity)',
      cursor: 'not-allowed',
    });
  });

  describe('The fades', () => {
    it('fades the viewer in, and each image once it has loaded', () => {
      expect(find(PLAIN, `${ROOT}.is-active`)).toEqual({
        animation:
          'extras-fade-in var(--bulma-lightbox-animation-duration) var(--bulma-easing, ease-out)',
      });
      expect(find(PLAIN, '.lightbox-image.is-loading')).toEqual({
        opacity: '0',
      });
      expect(
        find(PLAIN, '.lightbox-image:not(.is-loading):not(.is-leaving)')
      ).toEqual({
        animation:
          'extras-fade-in var(--bulma-lightbox-animation-duration) var(--bulma-easing, ease-out)',
      });
    });

    it('fades the image before out over the new one once that has loaded', () => {
      expect(
        find(
          PLAIN,
          '.lightbox-image:not(.is-loading) + .lightbox-image.is-leaving'
        )
      ).toEqual({
        animation:
          'extras-fade-out var(--bulma-lightbox-animation-duration) var(--bulma-easing, ease-out) forwards',
      });
    });

    it('stops every fade and transition under reduced motion', () => {
      const reduce = ['@media (prefers-reduced-motion: reduce)'];
      expect(find(PLAIN, `${ROOT}.is-active, .lightbox-image`, reduce)).toEqual(
        { animation: 'none !important' }
      );
      expect(find(PLAIN, '.lightbox-figure, .lightbox-image', reduce)).toEqual({
        transition: 'none',
      });
    });
  });

  it('draws the buttons’ borders in system colors in forced colors', () => {
    const forced = ['@media (forced-colors: active)'];
    expect(find(PLAIN, CONTROLS, forced)).toEqual({
      'border-color': 'ButtonText',
    });
    expect(
      find(
        PLAIN,
        `${ROOT} .lightbox-toolbar .button[aria-disabled=true], ${ROOT} .lightbox-arrow[aria-disabled=true]`,
        forced
      )
    ).toEqual({ 'border-color': 'GrayText', color: 'GrayText' });
  });

  it('keeps a trigger to what it holds at no specificity, unless it’s a Bulma button', () => {
    expect(find(PLAIN, ':where(.lightbox-trigger)')).toMatchObject({
      appearance: 'none',
      background: 'none',
      border: 'none',
      padding: '0',
    });
    expect(find(PLAIN, ':where(.lightbox-trigger:not(.button))')).toEqual({
      display: 'block',
      width: '100%',
    });
    expect(
      find(PLAIN, ':where(.lightbox-trigger:not(.button)):focus-visible')
    ).toMatchObject({ 'outline-offset': '2px' });
  });

  it('prefixes every class under a class prefix', () => {
    const selectors = PREFIXED.map(r => r.selector).join(' ');
    expect(selectors).not.toMatch(
      /(^|[^-])\.(modal|lightbox|button|buttons|loader|is-|has-)/
    );
    expect(PREFIXED.map(r => r.selector)).toEqual(
      PLAIN.map(r =>
        r.selector.replace(
          /\.(modal|lightbox|button|loader|is-)/g,
          '.bestax-$1'
        )
      )
    );
  });
});
