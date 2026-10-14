// Bulma v1 doesn't style `<kbd>`, so `_kbd.scss` is all that draws a key.
// jsdom never loads the partial on its own, so these compile it, with no
// prefix and under one, and check its rules land on the elements Kbd and
// Kbd.Group render, read through getComputedStyle. jsdom leaves `var()`
// unresolved, so a value that reads a variable is compared as written. It
// also resolves no inheritance and no `!important`, so where those decide
// the outcome, the rules are read off the sheet instead.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import { Kbd } from '../Kbd';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, resolved through package.json since jest
// maps any `.css` specifier to a stub.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'elements/kbd';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

const bulmaCss = (file: string) =>
  fs.readFileSync(path.join(BULMA, 'css', file), 'utf8');

/** Every top-level style rule in `css`, in source order. */
function rulesOf(css: string): CSSStyleRule[] {
  const sheet = document.createElement('style');
  // An @charset is valid only at the very start, and two sheets joined put
  // one in the middle.
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  try {
    return Array.from((sheet.sheet as CSSStyleSheet).cssRules).filter(
      (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule
    );
  } finally {
    sheet.remove();
  }
}

/** Every declaration the rules for `selector` make, merged in order. */
function declarations(css: string, selector: string) {
  const out: Record<string, string> = {};
  for (const { style } of rulesOf(css).filter(
    rule => rule.selectorText === selector
  )) {
    for (let i = 0; i < style.length; i++) {
      out[style[i]] = style.getPropertyValue(style[i]).trim();
    }
  }
  return out;
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
])('the Kbd partial with %s', (_label, prefix) => {
  const renderShortcut = () =>
    render(
      <ConfigProvider classPrefix={prefix}>
        <Kbd data-testid="alone">Esc</Kbd>
        <Kbd.Group data-testid="group">
          <Kbd data-testid="in-group">Ctrl</Kbd>
          <Kbd label="Command">⌘</Kbd>
        </Kbd.Group>
      </ConfigProvider>
    );

  it('writes its rules for the prefixed classes Kbd renders, and no others', () => {
    const selectors = rulesOf(compile(prefix)).map(rule => rule.selectorText);
    expect([...new Set(selectors)].sort()).toEqual([
      `.${prefix}kbd`,
      `.${prefix}kbd-group`,
    ]);
  });

  it('draws a key as a keycap, inline, so it doesn’t push its line away', () => {
    load(compile(prefix));
    const { getByTestId } = renderShortcut();
    for (const id of ['alone', 'in-group']) {
      const key = getComputedStyle(getByTestId(id));
      expect(key.display).toBe('inline');
      expect(key.lineHeight).toBe('1');
      expect(key.whiteSpace).toBe('nowrap');
      expect(key.borderStyle).toBe('solid');
      expect(key.borderBottomWidth).toBe(
        'var(--bulma-kbd-border-bottom-width)'
      );
      expect(key.backgroundColor).toBe('var(--bulma-kbd-background)');
      expect(key.fontFamily).toBe('var(--bulma-kbd-family)');
      // The same size in a group as alone, since the group sets none.
      expect(key.fontSize).toBe('var(--bulma-kbd-size)');
    }
  });

  it('leaves the group plain text in the sentence’s font, on one line', () => {
    load(compile(prefix));
    const { getByTestId } = renderShortcut();
    const group = getComputedStyle(getByTestId('group'));
    expect(group.fontFamily).toBe('inherit');
    expect(group.whiteSpace).toBe('nowrap');
    // No font size, so the keys inside it are the size of a key on its own,
    // and no keycap of its own.
    expect(group.fontSize).toBe('');
    expect(group.borderStyle).toBe('');
    expect(group.lineHeight).toBe('');
  });

  it('styles neither the separator nor the label, which read as the sentence', () => {
    const { container } = renderShortcut();
    const separator = container.querySelector(`.${prefix}kbd-separator`);
    const label = Array.from(container.querySelectorAll('span')).find(
      span => span.textContent === 'Command'
    );
    expect(separator).not.toBeNull();
    expect(label).toBeDefined();
    const matching = rulesOf(compile(prefix)).filter(
      rule =>
        separator?.matches(rule.selectorText) ||
        label?.matches(rule.selectorText)
    );
    expect(matching).toEqual([]);
  });

  it('mixes the edge and the fill from the text color', () => {
    const vars = declarations(compile(prefix), `.${prefix}kbd`);
    expect(vars['--bulma-kbd-border-color']).toMatch(
      /^color-mix\(in srgb, currentColor \d+%, transparent\)$/
    );
    expect(vars['--bulma-kbd-background']).toMatch(
      /^color-mix\(in srgb, currentColor \d+%, transparent\)$/
    );
    expect(vars['--bulma-kbd-color']).toBe('currentColor');
    expect(vars['--bulma-kbd-family']).toBe('var(--bulma-family-code)');
  });

  it('sizes the key in em, so textSize scales its padding and edges too', () => {
    const vars = declarations(compile(prefix), `.${prefix}kbd`);
    for (const name of [
      'size',
      'padding',
      'border-width',
      'border-bottom-width',
    ]) {
      // A px length only as the floor of a max(), so an edge stays drawable.
      const lengths = vars[`--bulma-kbd-${name}`]
        .replace(/max\(\d+px, /g, '(')
        .match(/[\d.]+[a-z]+/g);
      expect(lengths).not.toBeNull();
      expect(lengths?.filter(length => !length.endsWith('em'))).toEqual([]);
    }
  });
});

describe('textSize on a key', () => {
  // Bulma's size helpers carry !important and the partial's size doesn't, so
  // the helper wins wherever the two sheets land and however specific the
  // selectors are. jsdom resolves no !important, so the two rules are read
  // off the sheets and checked to match the key.
  it('sets the size over the partial’s, in a prefixed build', () => {
    const { getByText } = render(
      <ConfigProvider classPrefix="bulma-">
        <Kbd textSize="3">K</Kbd>
      </ConfigProvider>
    );
    const key = getByText('K');
    const sizing = (css: string) =>
      rulesOf(css).filter(
        rule =>
          rule.style.getPropertyValue('font-size') &&
          key.matches(rule.selectorText)
      );

    const helper = sizing(bulmaCss('versions/bulma-prefixed.css'));
    expect(helper.map(rule => rule.selectorText)).toEqual(['.bulma-is-size-3']);
    expect(helper[0].style.getPropertyPriority('font-size')).toBe('important');

    const partial = sizing(compile('bulma-'));
    expect(partial.map(rule => rule.selectorText)).toEqual(['.bulma-kbd']);
    expect(partial[0].style.getPropertyPriority('font-size')).toBe('');
  });
});
