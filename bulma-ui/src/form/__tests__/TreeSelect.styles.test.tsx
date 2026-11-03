// `_treeselect.scss` draws the chevron and the clear button on the field and
// sizes the panel, so these compile it, with no prefix and under one, and
// read its rules as text, the way ColorInput's are read.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/treeselect';`,
    {
      loadPaths: [SCSS, NODE_MODULES],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

/** Every rule in a sheet of sass's expanded output: its selector and body. */
function rulesOf(css: string): Map<string, string> {
  const rules = new Map<string, string>();
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  for (const [, selector, body] of css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .matchAll(pattern)) {
    rules.set(
      selector.replace(/\s+/g, ' ').trim(),
      body.replace(/\s+/g, ' ').trim()
    );
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

describe('TreeSelect styles', () => {
  it('registers its variables on the root and on a portaled panel', () => {
    const vars = body(PLAIN, '.tree-select, .tree-select-panel');
    for (const name of [
      'panel-max-height',
      'search-gap',
      'chevron-width',
      'chevron-color',
      'chevron-hover-color',
      'chevron-focus-color',
      'empty-color',
      'empty-padding',
      'tree-inset',
    ]) {
      expect(vars).toContain(`--bulma-tree-select-${name}:`);
    }
  });

  it('starts the chevron from root tokens, since the input variables live on the field', () => {
    const vars = body(PLAIN, '.tree-select, .tree-select-panel');
    expect(vars).toContain(
      '--bulma-tree-select-chevron-width: var(--bulma-control-height)'
    );
    expect(vars).not.toContain('--bulma-input-');
  });

  it('places the chevron and the clear button at the inline end, whatever the direction', () => {
    const chevron = body(PLAIN, '.tree-select-chevron');
    expect(chevron).toContain('inset-inline-end: 0');
    expect(chevron).toContain('pointer-events: none');
    expect(body(PLAIN, '.tree-select-clear')).toContain(
      'inset-inline-end: var(--bulma-tree-select-chevron-width)'
    );
    expect(body(PLAIN, '.tree-select .input')).toContain(
      'padding-inline-end: var(--bulma-tree-select-chevron-width)'
    );
    expect(body(PLAIN, '.tree-select.has-clear .input')).toContain(
      'padding-inline-end: calc(2 * var(--bulma-tree-select-chevron-width))'
    );
  });

  it('lets the tree scroll in the panel, past a height', () => {
    const tree = body(PLAIN, '.tree-select-panel > .tree-view');
    expect(tree).toContain(
      'max-height: var(--bulma-tree-select-panel-max-height)'
    );
    expect(tree).toContain('overflow-y: auto');
  });

  it('colors the chevron as focused while the field is focused, drawn focused, or open', () => {
    const rule = Array.from(PLAIN.keys()).find(selector =>
      selector.includes('.input:focus ~ .tree-select-chevron')
    )!;
    expect(rule.split(', ')).toEqual([
      '.tree-select .input:focus ~ .tree-select-chevron',
      '.tree-select .input.is-focused ~ .tree-select-chevron',
      '.tree-select .input[aria-expanded=true] ~ .tree-select-chevron',
    ]);
    expect(body(PLAIN, rule)).toContain(
      'color: var(--bulma-tree-select-chevron-focus-color)'
    );
  });

  it('prefixes every class under a class prefix', () => {
    const selectors = Array.from(PREFIXED.keys()).join(' ');
    expect(selectors).toContain('.bestax-tree-select');
    expect(selectors).toContain(
      '.bestax-tree-select-panel > .bestax-tree-view'
    );
    expect(selectors).toContain('.bestax-input.bestax-is-small ~ *');
    expect(selectors.replace(/\.bestax-[\w-]+/g, '')).not.toMatch(/\.[a-z]/);
  });
});
