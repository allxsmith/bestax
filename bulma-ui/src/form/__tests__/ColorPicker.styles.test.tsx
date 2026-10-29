// `_colorpicker.scss` draws the square, the sliders, their thumbs and the
// swatches, so these compile it, with no prefix and under one, and read its
// rules as text, the way RingProgress's are read.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/colorpicker';`,
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

// The mixins it uses bring keyframes along; only the picker's own rules count.
const own = (rules: Rule[]) =>
  rules.filter(r => !/^(from|to)$/.test(r.selector));
const PLAIN = own(rulesOf(compile('')));
const PREFIXED = own(rulesOf(compile('bestax-')));
const FORCED = ['@media (forced-colors: active)'];

function find(rules: Rule[], selector: string, context: string[] = []) {
  const rule = rules.find(
    r =>
      r.selector === selector && r.context.join(' | ') === context.join(' | ')
  );
  if (!rule) throw new Error(`no rule for ${selector} in ${context}`);
  return rule.declarations;
}

describe('ColorPicker styles', () => {
  it('registers its variables on the picker, from Bulma tokens', () => {
    expect(find(PLAIN, '.color-picker')).toMatchObject({
      '--bulma-color-picker-width': '16rem',
      '--bulma-color-picker-slider-height': '1.5rem',
      '--bulma-color-picker-thumb-size': '1.25rem',
      '--bulma-color-picker-checker-color': 'var(--bulma-border)',
      '--bulma-color-picker-checker-background': 'var(--bulma-scheme-main)',
      '--bulma-color-picker-swatch-ring-color': 'var(--bulma-text-strong)',
    });
  });

  it('draws the square from its hue, mirrored right to left', () => {
    const square = find(PLAIN, '.color-area');
    expect(square.background).toContain(
      'hsl(var(--color-picker-hue, 0), 100%, 50%)'
    );
    expect(square.background).toContain('linear-gradient(to right,');
    expect(square['touch-action']).toBe('none');
    expect(square['forced-color-adjust']).toBe('none');
    expect(find(PLAIN, '.color-area:dir(rtl)').background).toContain(
      'linear-gradient(to left,'
    );
  });

  it('draws the hue and alpha tracks, mirrored right to left', () => {
    const hue = '.color-slider.is-hue .color-slider-track';
    expect(find(PLAIN, hue).background).toMatch(/^linear-gradient\(to right,/);
    expect(find(PLAIN, `${hue}:dir(rtl)`).background).toMatch(
      /^linear-gradient\(to left,/
    );
    const alpha = '.color-slider.is-alpha .color-slider-track';
    expect(find(PLAIN, alpha).background).toContain(
      'rgb(var(--color-picker-rgb, 0 0 0)/0)'
    );
    expect(find(PLAIN, alpha).background).toContain('repeating-conic-gradient');
    expect(find(PLAIN, `${alpha}:dir(rtl)`).background).toMatch(
      /^linear-gradient\(to left,/
    );
  });

  it('places the thumbs from the inline start', () => {
    expect(find(PLAIN, '.color-area-thumb')).toEqual({
      'inset-inline-start': 'var(--color-area-x, 0%)',
      'inset-block-start': 'var(--color-area-y, 100%)',
    });
    expect(find(PLAIN, '.color-slider-thumb')['inset-inline-start']).toBe(
      'var(--color-slider-position, 0%)'
    );
  });

  it('hides the inputs but for assistive tech, and rings the thumb they focus', () => {
    expect(find(PLAIN, '.color-area-input, .color-slider-input')).toMatchObject(
      { position: 'absolute', width: '1px', clip: 'rect(0, 0, 0, 0)' }
    );
    expect(
      find(
        PLAIN,
        '.color-area-thumb:has(:focus-visible), .color-slider-thumb:has(:focus-visible)'
      )['outline-offset']
    ).toBe('2px');
  });

  it('rings a chosen swatch, so the choice is not color alone', () => {
    expect(find(PLAIN, '.color-picker-swatch.is-checked')).toEqual({
      'border-color': 'var(--bulma-color-picker-swatch-ring-color)',
    });
  });

  it('keeps the colors in forced colors, with system edges and rings', () => {
    expect(find(PLAIN, '.color-area, .color-slider-track', FORCED)).toEqual({
      'box-shadow': 'inset 0 0 0 1px CanvasText',
    });
    expect(find(PLAIN, '.color-picker-swatch', FORCED)).toEqual({
      'border-color': 'Canvas',
    });
    expect(find(PLAIN, '.color-picker-swatch.is-checked', FORCED)).toEqual({
      'border-color': 'Highlight',
    });
  });

  it('prefixes every class under a class prefix', () => {
    expect(PREFIXED.map(r => r.selector)).toEqual(
      PLAIN.map(r =>
        r.selector.replace(
          /\.(color-|is-|input\b)/g,
          (_, name: string) => `.bestax-${name}`
        )
      )
    );
  });
});
