// Forced colors takes away the open list's shadow and the highlighted
// option's fill, so `_autocomplete.scss` gives them an edge and an outline
// there (#2003). jsdom loads no partial on its own and evaluates no media
// query, so this compiles the partial, with no prefix and under one, and
// matches the selectors of its rules, inside the forced-colors block and
// outside it, against the markup the Autocomplete renders.
import * as sass from 'sass';
import path from 'path';
import { fireEvent, render, screen } from '@testing-library/react';
import { Autocomplete } from '../Autocomplete';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/autocomplete';`,
    {
      loadPaths: [SCSS, NODE_MODULES],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

/**
 * The declarations of `properties` that the rules of `css` matching `el` make,
 * in source order, split by whether they sit in the forced-colors block.
 */
function declaredFor(css: string, el: Element, properties: string[]) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const out = { atRest: [] as string[], forced: [] as string[] };
  const walk = (rules: CSSRuleList, forced: boolean) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        if (!el.matches(rule.selectorText)) continue;
        for (const property of properties) {
          const value = rule.style.getPropertyValue(property);
          if (value) {
            (forced ? out.forced : out.atRest).push(`${property}: ${value}`);
          }
        }
      } else if (rule instanceof CSSMediaRule) {
        walk(
          rule.cssRules,
          forced || rule.conditionText.includes('forced-colors: active')
        );
      }
    }
  };
  try {
    walk((style.sheet as CSSStyleSheet).cssRules, false);
  } finally {
    style.remove();
  }
  return out;
}

const OUTLINE = ['outline', 'outline-offset'];

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the open list in forced colors, with %s', (_n, prefix) => {
  const css = compile(prefix);

  const openList = () => {
    render(
      <ConfigProvider classPrefix={prefix}>
        <Autocomplete
          label="Fruit"
          data={['Apple', 'Apricot', 'Avocado']}
          header="Fruit we have"
        />
      </ConfigProvider>
    );
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const options = screen.getAllByRole('option');
    // The arrow put the highlight on the first option.
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
    return options;
  };

  it('outlines the highlighted option, and only it', () => {
    const [highlighted, other] = openList();
    expect(declaredFor(css, highlighted, OUTLINE)).toEqual({
      atRest: [],
      forced: ['outline: 2px solid Highlight', 'outline-offset: -2px'],
    });
    expect(declaredFor(css, other, OUTLINE)).toEqual({
      atRest: [],
      forced: [],
    });
  });

  it('draws an edge around the open list, header and all', () => {
    openList();
    const box = document.querySelector(
      `.${prefix}autocomplete .${prefix}dropdown-content`
    ) as HTMLElement;
    expect(box).toContainElement(screen.getByRole('listbox'));
    expect(box).toHaveTextContent('Fruit we have');
    expect(declaredFor(css, box, OUTLINE)).toEqual({
      atRest: [],
      forced: ['outline: 1px solid CanvasText', 'outline-offset: -1px'],
    });
  });
});
