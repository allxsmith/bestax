// `_treeview.scss` is all that draws a TreeView, so these compile it, with
// no prefix and under one, and check its rules land on the elements TreeView
// renders. jsdom leaves `var()` unresolved, so a value that reads a variable
// is compared as written, and where the outcome turns on a selector or on
// the order of the rules, the rules are read off the sheet instead.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import { TreeView } from '../TreeView';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/treeview';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

/** Every top-level rule in `css`: the style rules, and the at-rules apart. */
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
      media: all.filter(
        (rule): rule is CSSMediaRule => rule instanceof CSSMediaRule
      ),
    };
  } finally {
    sheet.remove();
  }
}

/** A rule's selector list on one line, `, ` between, the way it's written here. */
const selectorOf = (rule: CSSStyleRule) =>
  rule.selectorText.split(/\s*,\s*/).join(', ');

/** Every declaration the rules for `selector` make, merged in order. */
function declarations(rules: CSSStyleRule[], selector: string) {
  const out: Record<string, string> = {};
  for (const { style } of rules.filter(rule => selectorOf(rule) === selector)) {
    for (let i = 0; i < style.length; i++) {
      out[style[i]] = style.getPropertyValue(style[i]).trim();
    }
  }
  return out;
}

/** The style rules inside the `@media` rule whose condition matches. */
const mediaRules = (css: string, condition: RegExp) =>
  parse(css)
    .media.filter(rule => condition.test(rule.conditionText))
    .flatMap(rule =>
      Array.from(rule.cssRules).filter(
        (inner): inner is CSSStyleRule => inner instanceof CSSStyleRule
      )
    );

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the TreeView partial with %s', (_label, prefix) => {
  const p = (name: string) => `.${prefix}${name}`;
  const css = compile(prefix);
  const { rules } = parse(css);

  it('writes its rules for the prefixed classes TreeView renders, and no others', () => {
    const classes = new Set(
      [...rules, ...parse(css).media.flatMap(m => Array.from(m.cssRules))]
        .map(rule => (rule as CSSStyleRule).selectorText)
        .flatMap(sel => (sel.match(/\.[\w-]+/g) ?? []).map(n => n.slice(1)))
    );
    expect([...classes].every(name => name.startsWith(prefix))).toBe(true);
    // Every class a checkbox tree with a selected-looking row renders, with
    // a loading item's row and a failed load's.
    const { container } = render(
      <ConfigProvider classPrefix={prefix}>
        <TreeView
          aria-label="Files"
          size="small"
          selectionMode="checkbox"
          defaultExpanded={['a', 'd', 'e']}
        >
          <TreeView.Item value="a" label="A" icon={<svg />}>
            <TreeView.Item value="b" label="B" disabled />
            <TreeView.Item value="d" label="D" hasChildren isLoading />
            <TreeView.Item
              value="e"
              label="E"
              hasChildren
              loadError="Couldn’t load E"
              onRetry={() => {}}
            />
          </TreeView.Item>
        </TreeView>
        <TreeView
          aria-label="Picked"
          selectionMode="single"
          defaultSelected="c"
        >
          <TreeView.Item value="c" label="C" />
        </TreeView>
      </ConfigProvider>
    );
    const ours = new Set(
      Array.from(container.querySelectorAll('[class]'))
        .flatMap(el => Array.from(el.classList))
        // Checkbox's own classes are its partial's to draw, and the loading
        // row's loader and the Retry button are Bulma's.
        .filter(
          name =>
            ![
              `${prefix}styled-checkbox`,
              `${prefix}checkbox`,
              `${prefix}check`,
              `${prefix}loader`,
              `${prefix}button`,
            ].includes(name)
        )
    );
    expect([...ours].sort()).toEqual(
      [
        'is-disabled',
        'is-selected',
        'is-small',
        'tree-view',
        'tree-view-check',
        'tree-view-group',
        'tree-view-icon',
        'tree-view-item',
        'tree-view-label',
        'tree-view-row',
        'tree-view-toggle',
      ].map(name => prefix + name)
    );
    for (const name of ours) expect(classes.has(name)).toBe(true);
  });

  it('reads none of the menu’s variables or classes', () => {
    expect(css).not.toMatch(/--bulma-menu-/);
    expect(css).not.toMatch(new RegExp(`\\.${prefix}menu\\b`));
  });

  it('copies the defaults of the Bulma menu variables it stands in for', () => {
    const bulma = parse(
      fs.readFileSync(path.join(BULMA, 'css', 'bulma.css'), 'utf8')
    ).rules;
    const menu = declarations(bulma, '.menu');
    const tree = declarations(rules, p('tree-view'));
    const copies: Record<string, string> = {
      'item-h': 'menu-item-h',
      'item-s': 'menu-item-s',
      'item-background-l': 'menu-item-background-l',
      'item-background-l-delta': 'menu-item-background-l-delta',
      'item-hover-background-l-delta': 'menu-item-hover-background-l-delta',
      'item-active-background-l-delta': 'menu-item-active-background-l-delta',
      'item-color-l': 'menu-item-color-l',
      'item-radius': 'menu-item-radius',
      'item-padding': 'menu-list-link-padding',
      'item-selected-h': 'menu-item-selected-h',
      'item-selected-s': 'menu-item-selected-s',
      'item-selected-background-l': 'menu-item-selected-background-l',
      'item-selected-color-l': 'menu-item-selected-color-l',
      'line-height': 'menu-list-line-height',
      'group-border': 'menu-list-border-left',
      'group-margin': 'menu-nested-list-margin',
      'group-padding': 'menu-nested-list-padding-left',
    };
    for (const [ours, theirs] of Object.entries(copies)) {
      expect([ours, tree[`--bulma-tree-view-${ours}`]]).toEqual([
        ours,
        menu[`--bulma-${theirs}`],
      ]);
    }
    // And the tree's own, from the base tokens.
    expect(tree['--bulma-tree-view-item-disabled-color']).toBe(
      'var(--bulma-text-weak)'
    );
    expect(tree['--bulma-tree-view-gap']).toBe('0.375em');
    expect(tree['--bulma-tree-view-toggle-size']).toBe('1em');
    expect(tree['--bulma-tree-view-toggle-color']).toBe('currentColor');
    expect(tree['--bulma-tree-view-toggle-duration']).toBe(
      'var(--bulma-duration)'
    );
    expect(Object.keys(tree).filter(k => k.startsWith('--'))).toHaveLength(22);
  });

  it('sizes the tree as the menu is sized, and takes the bullets off its lists', () => {
    const root = declarations(rules, p('tree-view'));
    expect(root['font-size']).toBe('var(--bulma-size-normal)');
    expect(root['line-height']).toBe('var(--bulma-tree-view-line-height)');
    expect(root['list-style']).toBe('none');
    for (const size of ['small', 'medium', 'large']) {
      expect(
        declarations(rules, `${p('tree-view')}${p(`is-${size}`)}`)
      ).toEqual({ 'font-size': `var(--bulma-size-${size})` });
    }
  });

  it('draws the row as the menu draws its item', () => {
    expect(declarations(rules, p('tree-view-row'))).toEqual({
      'align-items': 'center',
      'background-color':
        'hsl(var(--bulma-tree-view-item-h), var(--bulma-tree-view-item-s), calc(var(--bulma-tree-view-item-background-l) + var(--bulma-tree-view-item-background-l-delta)))',
      'border-radius': 'var(--bulma-tree-view-item-radius)',
      color:
        'hsl(var(--bulma-tree-view-item-h), var(--bulma-tree-view-item-s), var(--bulma-tree-view-item-color-l))',
      cursor: 'pointer',
      display: 'flex',
      gap: 'var(--bulma-tree-view-gap)',
      padding: 'var(--bulma-tree-view-item-padding)',
    });
    expect(declarations(rules, `${p('tree-view-row')}:hover`)).toEqual({
      '--bulma-tree-view-item-background-l-delta':
        'var(--bulma-tree-view-item-hover-background-l-delta)',
    });
    expect(declarations(rules, `${p('tree-view-row')}:active`)).toEqual({
      '--bulma-tree-view-item-background-l-delta':
        'var(--bulma-tree-view-item-active-background-l-delta)',
    });
    expect(
      declarations(rules, `${p('tree-view-row')}${p('is-selected')}`)
    ).toEqual({
      '--bulma-tree-view-item-h': 'var(--bulma-tree-view-item-selected-h)',
      '--bulma-tree-view-item-s': 'var(--bulma-tree-view-item-selected-s)',
      '--bulma-tree-view-item-background-l':
        'var(--bulma-tree-view-item-selected-background-l)',
      '--bulma-tree-view-item-color-l':
        'var(--bulma-tree-view-item-selected-color-l)',
    });
  });

  it('takes the tints off a disabled row, after the rules that add them', () => {
    const disabled = `${p('tree-view-row')}${p('is-disabled')}`;
    expect(declarations(rules, disabled)).toEqual({
      '--bulma-tree-view-item-background-l-delta': '0%',
      color: 'var(--bulma-tree-view-item-disabled-color)',
      cursor: 'default',
    });
    // The same specificity as :hover and :active, so the later rule wins.
    const order = rules.map(selectorOf);
    expect(order.indexOf(disabled)).toBeGreaterThan(
      order.indexOf(`${p('tree-view-row')}:active`)
    );
  });

  it('gives a nested group the menu’s guide line and indent, without its block margin', () => {
    expect(declarations(rules, p('tree-view-group'))).toEqual({
      'border-inline-start': 'var(--bulma-tree-view-group-border)',
      'list-style': 'none',
      'margin-block': '0',
      'margin-inline': 'var(--bulma-tree-view-group-margin)',
      padding: '0',
      'padding-inline-start': 'var(--bulma-tree-view-group-padding)',
    });
  });

  it('rings the focused item’s row, outside it, and nothing on the li', () => {
    expect(declarations(rules, `${p('tree-view-item')}:focus`)).toEqual({
      outline: 'none',
    });
    const ring = declarations(
      rules,
      `${p('tree-view-item')}:focus-visible > ${p('tree-view-row')}`
    );
    expect(ring.outline).toMatch(/^2px solid hsl\(var\(--bulma-link-h/);
    expect(ring['outline-offset']).toBe('2px');
  });

  it('draws the chevron on a parent only, pointing to the end of the line or down', () => {
    const chevron = (state: string) =>
      `${p('tree-view-item')}${state} > ${p('tree-view-row')} > ${p('tree-view-toggle')}::after`;
    expect(declarations(rules, chevron('[aria-expanded]'))).toEqual({
      'border-color': 'var(--bulma-tree-view-toggle-color)',
      'border-style': 'solid',
      'border-width': '0 0 0.125em 0.125em',
      content: '""',
      height: '0.5em',
      transform: 'translateX(-15%) rotate(-135deg)',
      'transition-duration': 'var(--bulma-tree-view-toggle-duration)',
      'transition-property': 'transform',
      width: '0.5em',
    });
    // The selectors read as Sass writes them, with the values unquoted.
    const rtl = rules.filter(rule => rule.selectorText.includes(':dir(rtl)'));
    expect(rtl.map(selectorOf)).toEqual([
      chevron('[aria-expanded=false]:dir(rtl)'),
    ]);
    expect(rtl[0].style.getPropertyValue('transform')).toBe(
      'translateX(15%) rotate(45deg)'
    );
    expect(declarations(rules, chevron('[aria-expanded=true]'))).toEqual({
      transform: 'translateY(-15%) rotate(-45deg)',
    });
    // The chevron's box is on every row, so labels line up.
    expect(declarations(rules, p('tree-view-toggle'))).toMatchObject({
      height: 'var(--bulma-tree-view-toggle-size)',
      width: 'var(--bulma-tree-view-toggle-size)',
      flex: 'none',
    });
  });

  it('leaves a press on the box to the row', () => {
    expect(declarations(rules, `${p('tree-view-check')} > *`)).toEqual({
      'pointer-events': 'none',
    });
  });

  it('keeps the selected row, a disabled one and the ring in forced colors', () => {
    const forced = mediaRules(css, /forced-colors:\s*active/);
    expect(
      declarations(forced, `${p('tree-view-row')}${p('is-selected')}`)
    ).toEqual({
      'background-color': 'Highlight',
      color: 'HighlightText',
      'forced-color-adjust': 'none',
    });
    expect(
      declarations(forced, `${p('tree-view-row')}${p('is-disabled')}`)
    ).toEqual({ color: 'GrayText' });
    expect(
      declarations(
        forced,
        `${p('tree-view-item')}:focus-visible > ${p('tree-view-row')}`
      )
    ).toEqual({ 'outline-color': 'CanvasText' });
  });

  it('stops the chevron turning when motion is reduced', () => {
    const reduced = mediaRules(css, /prefers-reduced-motion:\s*reduce/);
    expect(reduced).toHaveLength(1);
    expect(selectorOf(reduced[0])).toBe(
      `${p('tree-view-item')}[aria-expanded] > ${p('tree-view-row')} > ${p('tree-view-toggle')}::after`
    );
    expect(reduced[0].style.getPropertyValue('transition')).toMatch(/^none/);
  });
});
