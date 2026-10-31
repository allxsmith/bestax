// `_emptystate.scss` is all that lays an EmptyState out, so these compile it,
// with no prefix and under one, and check its rules land on the elements
// EmptyState renders, read through getComputedStyle. jsdom leaves `var()`
// unresolved, so a value that reads a variable is compared as written. It
// also resolves no specificity, so where that decides the outcome, the rules
// are read off the sheets and compared instead.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import { EmptyState, type EmptyStateProps } from '../EmptyState';
import { Button } from '../../elements/Button';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/emptystate';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

const bulmaCss = (file: string) =>
  fs.readFileSync(path.join(BULMA, 'css', file), 'utf8');

/** Every top-level style rule in `css`, and whether any sit in an at-rule. */
function parse(css: string) {
  const sheet = document.createElement('style');
  // An @charset is valid only at the very start of a sheet.
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  try {
    const all = Array.from((sheet.sheet as CSSStyleSheet).cssRules);
    return {
      rules: all.filter(
        (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule
      ),
      atRules: all.filter(rule => !(rule instanceof CSSStyleRule)),
    };
  } finally {
    sheet.remove();
  }
}

const rulesOf = (css: string) => parse(css).rules;

/** A rule's selector list on one line, `, ` between, the way it's written here. */
const selectorOf = (rule: CSSStyleRule) =>
  rule.selectorText.split(/\s*,\s*/).join(', ');

/** Every declaration the rules for `selector` make, merged in order. */
function declarations(css: string, selector: string) {
  const out: Record<string, string> = {};
  for (const { style } of rulesOf(css).filter(
    rule => selectorOf(rule) === selector
  )) {
    for (let i = 0; i < style.length; i++) {
      out[style[i]] = style.getPropertyValue(style[i]).trim();
    }
  }
  return out;
}

/**
 * A simple selector's specificity as one comparable number: classes,
 * attributes and pseudo-classes in the tens, elements in the ones. Enough
 * for the selectors here, none of which has an id. `:not()` counts as its
 * argument, the way the spec has it.
 */
function specificity(selector: string) {
  const s = selector.replace(/:not\(([^)]*)\)/g, ' $1');
  const classes = (s.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) ?? []).length;
  const elements = (s.match(/(^|[\s>+~])[a-z][\w-]*/gi) ?? []).length;
  return classes * 10 + elements;
}

let removeSheet = () => {};
afterEach(() => removeSheet());

/** Puts a stylesheet in the document until the test ends. */
function load(css: string) {
  const sheet = document.createElement('style');
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  removeSheet = () => sheet.remove();
}

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the EmptyState partial with %s', (_label, prefix) => {
  const p = (name: string) => `.${prefix}${name}`;

  const renderEmpty = (props: EmptyStateProps = {}) =>
    render(
      <ConfigProvider classPrefix={prefix}>
        <EmptyState
          data-testid="root"
          icon="folder-open"
          title="No projects yet"
          description="Projects you create show up here."
          {...props}
        >
          <EmptyState.Actions data-testid="actions">
            <Button>New project</Button>
            <Button>Import</Button>
          </EmptyState.Actions>
        </EmptyState>
      </ConfigProvider>
    );

  it('writes its rules for the prefixed classes EmptyState renders, and no others', () => {
    const { rules, atRules } = parse(compile(prefix));
    const classes = new Set(
      rules.flatMap(rule =>
        (rule.selectorText.match(/\.[\w-]+/g) ?? []).map(name => name.slice(1))
      )
    );
    // Its own classes, Bulma's modifiers and the two Bulma parts it renders,
    // all prefixed, plus the icon libraries' own classes, which never are.
    const vendor = /^material-(icons|symbols)(-[a-z-]+)?$/;
    const theirs = [...classes].filter(name => !vendor.test(name));
    expect(theirs.every(name => name.startsWith(prefix))).toBe(true);
    expect(
      [...classes].filter(name => vendor.test(name)).length
    ).toBeGreaterThan(0);
    expect(
      [
        'empty-state',
        'empty-state-indicator',
        'empty-state-title',
        'empty-state-description',
        'empty-state-actions',
      ].every(name => classes.has(`${prefix}${name}`))
    ).toBe(true);
    // No media query, no keyframes: there's no motion, and nothing is
    // needed for forced colors, where the icon is text and stays visible.
    expect(atRules).toEqual([]);
  });

  it('lays the parts out in one centered column, with a gap between them', () => {
    load(compile(prefix));
    const { getByTestId } = renderEmpty();
    const root = getComputedStyle(getByTestId('root'));
    expect(root.display).toBe('flex');
    expect(root.flexDirection).toBe('column');
    expect(root.alignItems).toBe('center');
    expect(root.textAlign).toBe('center');
    expect(root.gap).toBe('var(--bulma-empty-state-gap)');
    expect(root.paddingBlock).toBe('var(--bulma-empty-state-padding)');
    // Centered row by row, so a row that wraps stays centered.
    expect(getComputedStyle(getByTestId('actions')).justifyContent).toBe(
      'center'
    );
  });

  it('draws the indicator as a circle at the indicator’s size', () => {
    load(compile(prefix));
    const { container } = renderEmpty();
    const indicator = getComputedStyle(
      container.querySelector(p('empty-state-indicator')) as Element
    );
    expect(indicator.width).toBe('var(--bulma-empty-state-indicator-size)');
    expect(indicator.height).toBe('var(--bulma-empty-state-indicator-size)');
    expect(indicator.borderRadius).toBe(
      'var(--bulma-empty-state-indicator-radius)'
    );
    expect(indicator.backgroundColor).toBe(
      'var(--bulma-empty-state-indicator-background)'
    );
    expect(indicator.color).toBe('var(--bulma-empty-state-indicator-color)');
    expect(indicator.fontSize).toBe('var(--bulma-empty-state-icon-size)');
    expect(indicator.flexShrink).toBe('0');
    // The Icon's box follows the glyph, which follows the font size.
    const icon = getComputedStyle(
      container.querySelector(`${p('empty-state-indicator')} > ${p('icon')}`)!
    );
    expect(icon.width).toBe('1em');
    expect(icon.height).toBe('1em');
  });

  it('draws a bare SVG at the icon size, and hands Material glyphs the font size back', () => {
    const vars = declarations(
      compile(prefix),
      `${p('empty-state-indicator')} > ${p('icon')}, ` +
        `${p('empty-state-indicator')} > svg, ` +
        `${p('empty-state-indicator')} > img`
    );
    expect(vars).toEqual({ height: '1em', width: '1em' });
    const material = rulesOf(compile(prefix)).find(rule =>
      rule.selectorText.includes('.material-icons')
    );
    expect(material?.selectorText).toContain(
      `${p('empty-state-indicator')} .material-symbols-outlined`
    );
    expect(material?.style.getPropertyValue('font-size')).toBe('inherit');
  });

  it('sizes the title and the description from the variables', () => {
    load(compile(prefix));
    const { container } = renderEmpty();
    const title = getComputedStyle(container.querySelector('h2')!);
    expect(title.fontSize).toBe('var(--bulma-empty-state-title-size)');
    const description = getComputedStyle(container.querySelector('p')!);
    expect(description.fontSize).toBe(
      'var(--bulma-empty-state-description-size)'
    );
    expect(description.color).toBe(
      'var(--bulma-empty-state-description-color)'
    );
    expect(description.maxWidth).toBe(
      'var(--bulma-empty-state-description-max-width)'
    );
  });

  it('clears the title’s and the row’s Bulma margins with selectors that out-rank them', () => {
    const css = compile(prefix);
    const bulma = rulesOf(
      bulmaCss(prefix ? 'versions/bulma-prefixed.css' : 'bulma.css')
    );
    const bulmaPrefix = prefix ? 'bulma-' : '';
    const { container } = render(
      <ConfigProvider classPrefix={prefix}>
        <EmptyState title="No projects yet">
          <EmptyState.Actions>
            <Button>New project</Button>
          </EmptyState.Actions>
          <span>after</span>
        </EmptyState>
      </ConfigProvider>
    );
    for (const part of ['title', 'buttons']) {
      // Bulma's own rule, read off its sheet under its own prefix.
      const theirs = bulma
        .flatMap(rule => rule.selectorText.split(/\s*,\s*/))
        .find(sel => sel === `.${bulmaPrefix}${part}:not(:last-child)`);
      expect(theirs).toBeDefined();
      const el = container.querySelector(p(part))!;
      const ours = rulesOf(css).filter(
        rule =>
          el.matches(rule.selectorText) &&
          /^0(px)?$/.test(rule.style.getPropertyValue('margin-bottom'))
      );
      expect(ours).toHaveLength(1);
      expect(specificity(ours[0].selectorText)).toBeGreaterThan(
        specificity(theirs!)
      );
    }
  });

  it('puts the indicator at the start of the line in left, and makes room for it', () => {
    load(compile(prefix));
    const { getByTestId, container } = renderEmpty({ align: 'left' });
    const root = getComputedStyle(getByTestId('root'));
    expect(root.alignItems).toBe('flex-start');
    expect(root.textAlign).toBe('start');
    expect(root.position).toBe('relative');
    expect(root.paddingInlineStart).toBe(
      'calc(var(--bulma-empty-state-indicator-size) + var(--bulma-empty-state-gap))'
    );
    // On the content box, so the room it keeps follows the block padding in
    // effect, a `py` helper's included, rather than the padding variable.
    expect(root.boxSizing).toBe('content-box');
    expect(root.minHeight).toBe('var(--bulma-empty-state-indicator-size)');
    const indicator = getComputedStyle(
      container.querySelector(p('empty-state-indicator'))!
    );
    expect(indicator.position).toBe('absolute');
    expect(indicator.insetInlineStart).toMatch(/^0(px)?$/);
    expect(getComputedStyle(getByTestId('actions')).justifyContent).toBe(
      'flex-start'
    );
  });

  it('hands the parts border-box back, since Bulma’s reset makes them inherit', () => {
    load(compile(prefix));
    const { getByTestId, container } = renderEmpty({ align: 'left' });
    for (const part of [
      container.querySelector(p('empty-state-indicator'))!,
      container.querySelector('h2')!,
      container.querySelector('p')!,
      getByTestId('actions'),
    ]) {
      expect(getComputedStyle(part).boxSizing).toBe('border-box');
    }
  });

  it('keeps no room in left when there is no indicator', () => {
    load(compile(prefix));
    const { getByTestId } = render(
      <ConfigProvider classPrefix={prefix}>
        <EmptyState
          data-testid="root"
          align="left"
          title="No projects yet"
          description="Projects you create show up here."
        >
          <EmptyState.Actions data-testid="actions">
            <Button>New project</Button>
          </EmptyState.Actions>
        </EmptyState>
      </ConfigProvider>
    );
    const root = getComputedStyle(getByTestId('root'));
    // Still the start of the line, with no indent and no height kept.
    expect(root.alignItems).toBe('flex-start');
    expect(root.textAlign).toBe('start');
    expect(root.paddingInlineStart).toBe('');
    expect(root.minHeight).toBe('');
    expect(root.boxSizing).toBe('');
    expect(getComputedStyle(getByTestId('actions')).justifyContent).toBe(
      'flex-start'
    );
  });

  it('keeps the room only for an indicator that is the root’s own child', () => {
    const rule = rulesOf(compile(prefix)).find(r =>
      r.style.getPropertyValue('min-height')
    );
    expect(selectorOf(rule!)).toBe(
      `${p('empty-state')}${p('is-left')}:has(> ${p('empty-state-indicator')})`
    );
  });

  it('changes only variables for a size', () => {
    const rules = rulesOf(compile(prefix));
    for (const size of ['small', 'medium', 'large']) {
      const rule = rules.find(
        r => r.selectorText === `${p('empty-state')}${p(`is-${size}`)}`
      );
      expect(rule).toBeDefined();
      const names = Array.from(rule!.style);
      expect(names.length).toBeGreaterThan(0);
      expect(names.every(name => name.startsWith('--bulma-empty-state-'))).toBe(
        true
      );
    }
  });

  it('pairs a neutral circle from the scheme’s tokens, in both variants', () => {
    const css = compile(prefix);
    const base = declarations(css, p('empty-state'));
    expect(base['--bulma-empty-state-indicator-background']).toBe(
      'var(--bulma-background)'
    );
    expect(base['--bulma-empty-state-indicator-color']).toBe(
      'var(--bulma-text-weak)'
    );
    expect(base['--bulma-empty-state-description-color']).toBe('currentColor');
    const filled = declarations(css, `${p('empty-state')}${p('is-filled')}`);
    expect(filled).toEqual({
      '--bulma-empty-state-indicator-background': 'var(--bulma-text)',
      '--bulma-empty-state-indicator-color': 'var(--bulma-scheme-main)',
    });
  });

  it.each(['primary', 'link', 'info', 'success', 'warning', 'danger'])(
    'pairs %s from the scheme’s soft lightness, or the color and its invert',
    color => {
      const css = compile(prefix);
      expect(
        declarations(css, `${p('empty-state')}${p(`is-${color}`)}`)
      ).toEqual({
        '--bulma-empty-state-indicator-background': `hsl(var(--bulma-${color}-h), var(--bulma-${color}-s), var(--bulma-soft-l))`,
        '--bulma-empty-state-indicator-color': `hsl(var(--bulma-${color}-h), var(--bulma-${color}-s), var(--bulma-soft-invert-l))`,
      });
      expect(
        declarations(
          css,
          `${p('empty-state')}${p(`is-${color}`)}${p('is-filled')}`
        )
      ).toEqual({
        '--bulma-empty-state-indicator-background': `var(--bulma-${color})`,
        '--bulma-empty-state-indicator-color': `var(--bulma-${color}-invert)`,
      });
    }
  );
});

describe('the margin helpers on an EmptyState part', () => {
  // The partial clears the parts' Bulma margins without `!important`, and
  // the helpers carry it, so a margin helper still wins wherever the sheets
  // land.
  it('win over the reset in a prefixed build', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <EmptyState>
          <EmptyState.Title mb="5">No projects yet</EmptyState.Title>
          <span>after</span>
        </EmptyState>
      </ConfigProvider>
    );
    const title = container.querySelector('h2')!;
    const margins = (css: string) =>
      rulesOf(css).filter(
        rule =>
          rule.style.getPropertyValue('margin-bottom') &&
          title.matches(rule.selectorText)
      );
    const helper = margins(bulmaCss('versions/bulma-prefixed.css')).find(
      rule => rule.selectorText === '.bulma-mb-5'
    );
    expect(helper?.style.getPropertyPriority('margin-bottom')).toBe(
      'important'
    );
    const reset = margins(compile('bulma-'));
    expect(reset).toHaveLength(1);
    expect(reset[0].style.getPropertyPriority('margin-bottom')).toBe('');
  });
});
