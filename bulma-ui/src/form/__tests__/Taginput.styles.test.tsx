// A loading `Control` draws its spinner as `::after` at its right edge, and
// Bulma leaves that box catching clicks. Around a Taginput it can land on the
// delete button of the last tag in the first row, so `_taginput.scss` lets
// clicks through it there, the way the Taginput's own loader does. jsdom
// computes no pseudo-element styles, so this reads the compiled rules and
// matches their selectors against the markup the components render.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Taginput } from '../Taginput';
import { Control } from '../Control';
import { Field } from '../Field';
import { Input } from '../Input';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');
const OPTIONS = {
  loadPaths: [SCSS, NODE_MODULES],
  quietDeps: true,
  logger: sass.Logger.silent,
};

const bulmaCss = () =>
  fs.readFileSync(
    path.join(
      path.dirname(require.resolve('bulma/package.json')),
      'css',
      'bulma.css'
    ),
    'utf8'
  );

type Declared = { selector: string; value: string; important: boolean };

/** Every `::after` selector in `css` that sets `pointer-events`. */
function afterPointerEvents(css: string): Declared[] {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const out: Declared[] = [];
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        const value = rule.style.getPropertyValue('pointer-events');
        if (!value) continue;
        for (const selector of rule.selectorText.split(/,(?![^(]*\))/)) {
          if (selector.trim().endsWith('::after')) {
            out.push({
              selector: selector.trim(),
              value,
              important:
                rule.style.getPropertyPriority('pointer-events') ===
                'important',
            });
          }
        }
      } else if ('cssRules' in rule) {
        walk((rule as CSSGroupingRule).cssRules);
      }
    }
  };
  walk((style.sheet as CSSStyleSheet).cssRules);
  style.remove();
  return out;
}

/** The `pointer-events` the given element's `::after` gets from `rules`. */
function afterValueFor(el: Element, rules: Declared[]): string | undefined {
  return rules.find(r => el.matches(r.selector.replace(/::after$/, '')))?.value;
}

const wrappers: [string, (child: ReactElement) => ReactElement][] = [
  [
    'Field > Control',
    child => (
      <Field>
        <Control isLoading data-testid="outer">
          {child}
        </Control>
      </Field>
    ),
  ],
  [
    'a Control with no Field',
    child => (
      <Control isLoading data-testid="outer">
        {child}
      </Control>
    ),
  ],
];

describe('a loading Control around a Taginput', () => {
  // Bulma's spinner keeps the default `auto`, with nothing for this rule to
  // outrank.
  it('gets no pointer-events from Bulma for its spinner', () => {
    const { getByTestId } = render(
      <Field>
        <Control isLoading data-testid="outer">
          <Taginput defaultValue={['one']} />
        </Control>
      </Field>
    );
    expect(
      afterValueFor(getByTestId('outer'), afterPointerEvents(bulmaCss()))
    ).toBeUndefined();
  });

  it.each(wrappers)('lets clicks through its spinner in %s', (_n, wrap) => {
    const rules = afterPointerEvents(
      sass.compile(path.join(SCSS, 'form/_taginput.scss'), OPTIONS).css
    );
    const { getByTestId, unmount } = render(
      wrap(<Taginput defaultValue={['one', 'two']} />)
    );
    expect(afterValueFor(getByTestId('outer'), rules)).toBe('none');
    unmount();

    // Around any other control the spinner keeps Bulma's behavior.
    const other = render(wrap(<Input />));
    expect(afterValueFor(other.getByTestId('outer'), rules)).toBeUndefined();
  });

  it('matches the prefixed classes under a class prefix', () => {
    const rules = afterPointerEvents(
      sass.compileString(
        `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: 'bestax-');
         @use 'form/taginput';`,
        OPTIONS
      ).css
    );
    const { getByTestId } = render(
      <ConfigProvider classPrefix="bestax-">
        <Field>
          <Control isLoading data-testid="outer">
            <Taginput defaultValue={['one']} />
          </Control>
        </Field>
      </ConfigProvider>
    );
    expect(getByTestId('outer')).toHaveClass('bestax-is-loading');
    expect(afterValueFor(getByTestId('outer'), rules)).toBe('none');
  });
});
