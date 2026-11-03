// `_cascader.scss` draws the field's chevron and clear button through the
// rules it shares with TreeSelect, and lays out the panel's columns, so these
// compile it, with no prefix and under one, and read its rules as text, the
// way TreeSelect's are read.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/cascader';`,
    {
      loadPaths: [SCSS, NODE_MODULES],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

/**
 * Every rule in a sheet of sass's expanded output: its selector and body. The
 * first of a selector wins, so a forced-colors rule doesn't stand in for the
 * plain one it follows.
 */
function rulesOf(css: string): Map<string, string> {
  const rules = new Map<string, string>();
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  for (const [, selector, body] of css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .matchAll(pattern)) {
    const key = selector.replace(/\s+/g, ' ').trim();
    if (!rules.has(key)) rules.set(key, body.replace(/\s+/g, ' ').trim());
  }
  return rules;
}

const PLAIN = rulesOf(compile(''));
const PREFIXED = rulesOf(compile('bestax-'));

function body(rules: Map<string, string>, selector: string): string {
  const found = rules.get(selector);
  if (found === undefined) throw new Error(`no rule for ${selector}`);
  return found;
}

describe('Cascader styles', () => {
  it('registers its variables on the root and on a portaled panel', () => {
    const vars = body(PLAIN, '.cascader, .cascader-panel');
    for (const name of [
      'chevron-width',
      'chevron-color',
      'chevron-hover-color',
      'chevron-focus-color',
      'search-gap',
      'column-width',
      'column-max-height',
      'column-border-color',
      'column-inset',
      'item-color',
      'item-size',
      'item-padding-y',
      'item-padding-x',
      'item-hover-background',
      'item-gap',
      'item-chevron-size',
      'highlight-background',
      'highlight-color',
      'disabled-color',
    ]) {
      expect(vars).toContain(`--bulma-cascader-${name}:`);
    }
  });

  it('places the chevron and the clear button at the inline end, as TreeSelect does', () => {
    expect(body(PLAIN, '.cascader-chevron')).toContain('inset-inline-end: 0');
    expect(body(PLAIN, '.cascader-clear')).toContain(
      'inset-inline-end: var(--bulma-cascader-chevron-width)'
    );
    expect(body(PLAIN, '.cascader .input')).toContain(
      'padding-inline-end: var(--bulma-cascader-chevron-width)'
    );
    expect(body(PLAIN, '.cascader.has-clear .input')).toContain(
      'padding-inline-end: calc(2 * var(--bulma-cascader-chevron-width))'
    );
  });

  it('sets the columns side by side, scrolling sideways, each scrolling down past a height', () => {
    const columns = body(PLAIN, '.cascader-columns');
    expect(columns).toContain('display: flex');
    expect(columns).toContain('overflow-x: auto');
    const column = body(PLAIN, '.cascader-column');
    expect(column).toContain('width: var(--bulma-cascader-column-width)');
    expect(column).toContain(
      'max-height: var(--bulma-cascader-column-max-height)'
    );
    expect(column).toContain('overflow-y: auto');
    expect(column).toContain('padding: var(--bulma-cascader-column-inset)');
    expect(body(PLAIN, '.cascader-column + .cascader-column')).toContain(
      'border-inline-start: 1px solid var(--bulma-cascader-column-border-color)'
    );
  });

  it('fills the items on the path, greys the disabled ones, and rings the focused one', () => {
    expect(body(PLAIN, '.dropdown-item.cascader-item.is-active')).toContain(
      'background-color: var(--bulma-cascader-highlight-background)'
    );
    expect(body(PLAIN, '.dropdown-item.cascader-item.is-disabled')).toContain(
      'color: var(--bulma-cascader-disabled-color)'
    );
    expect(body(PLAIN, '.dropdown-item.cascader-item:focus-visible')).toContain(
      'outline'
    );
  });

  it("points a parent's chevron the other way right to left", () => {
    expect(body(PLAIN, '.cascader-item-chevron')).toContain(
      'transform: rotate(-135deg)'
    );
    expect(body(PLAIN, '.cascader-item-chevron:dir(rtl)')).toContain(
      'transform: rotate(45deg)'
    );
  });

  it('sizes the items from the panel', () => {
    expect(body(PLAIN, '.cascader-panel.is-small')).toContain(
      '--bulma-cascader-item-size: var(--bulma-size-small)'
    );
    expect(body(PLAIN, '.cascader-panel.is-large')).toContain(
      '--bulma-cascader-item-padding-x: 1.5rem'
    );
  });

  it('keeps the path and the disabled items apart in forced colors', () => {
    expect(body(PLAIN, '.dropdown-item.cascader-item.is-active')).not.toContain(
      'Highlight'
    );
    const css = compile('');
    expect(css).toMatch(
      /@media \(forced-colors: active\)[\s\S]*\.cascader-item\.is-active[\s\S]*Highlight[\s\S]*GrayText/
    );
  });

  it('prefixes every class under a class prefix', () => {
    const selectors = Array.from(PREFIXED.keys()).join(' ');
    expect(selectors).toContain('.bestax-cascader');
    expect(selectors).toContain('.bestax-cascader-column');
    expect(selectors).toContain(
      '.bestax-dropdown-item.bestax-cascader-item.bestax-is-active'
    );
    expect(selectors).toContain('.bestax-cascader-panel.bestax-is-small');
    expect(selectors.replace(/\.bestax-[\w-]+/g, '')).not.toMatch(/\.[a-z]/);
  });
});
