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
import { fireEvent, render } from '@testing-library/react';
import { Taginput } from '../Taginput';
import { Control } from '../Control';
import { Field } from '../Field';
import { Input } from '../Input';
import { ConfigProvider } from '../../helpers/Config';
import {
  cascade,
  compilePartial,
  compileSource,
  customProperty,
  declaredFor as declarationsFor,
} from '../../__tests__/css-cascade';

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

/** The values `property` takes in the rules of `css` that match `el`. */
function declaredFor(css: string, el: Element, property: string): string[] {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const out: string[] = [];
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        const value = rule.style.getPropertyValue(property);
        if (value && el.matches(rule.selectorText)) out.push(value);
      } else if ('cssRules' in rule) {
        walk((rule as CSSGroupingRule).cssRules);
      }
    }
  };
  try {
    walk((style.sheet as CSSStyleSheet).cssRules);
  } finally {
    style.remove();
  }
  return out;
}

// Forced colors takes away the open list's shadow and the highlighted
// suggestion's fill, so the partial gives them an edge and an outline there,
// and nothing at rest (#2003).
describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the open suggestion list in forced colors, with %s', (_n, prefix) => {
  const css = compilePartial('form/taginput', prefix);
  const OUTLINE = ['outline', 'outline-offset'];
  const FORCED = '@media (forced-colors: active)';

  const openList = () => {
    const { getByRole, getAllByRole } = render(
      <ConfigProvider classPrefix={prefix}>
        <Taginput label="Tags" data={['Apple', 'Apricot', 'Avocado']} />
      </ConfigProvider>
    );
    const input = getByRole('combobox');
    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const options = getAllByRole('option');
    // The arrow put the highlight on the first suggestion.
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
    return { list: getByRole('listbox'), options };
  };

  it('outlines the highlighted suggestion, and only it', () => {
    const {
      options: [highlighted, other],
    } = openList();
    expect(declarationsFor(highlighted, css, OUTLINE)).toEqual({
      atRest: [],
      [FORCED]: ['outline: 2px solid Highlight', 'outline-offset: -2px'],
    });
    expect(declarationsFor(other, css, OUTLINE)).toEqual({ atRest: [] });
  });

  it('draws an edge around the open list', () => {
    const { list } = openList();
    expect(list).toHaveClass(`${prefix}dropdown-content`);
    expect(declarationsFor(list, css, OUTLINE)).toEqual({
      atRest: [],
      [FORCED]: ['outline: 1px solid CanvasText', 'outline-offset: -1px'],
    });
  });
});

/**
 * `value` with each of Bulma's input focus variables it reads replaced by the
 * value `el` inherits from the rules of `css`, or by its fallback when no
 * element up the tree declares it. Null when one has neither, since a browser
 * then drops the whole declaration.
 */
function withInputFocus(
  el: Element,
  css: string,
  value: string
): string | null {
  let invalid = false;
  const resolved = value.replace(
    /var\((--bulma-input-focus-[\w-]+)(?:,\s*(var\([^()]*\)))?\)/g,
    (_m, name: string, fallback: string | undefined) => {
      for (let node: Element | null = el; node; node = node.parentElement) {
        const declared = customProperty(node, css, name);
        if (declared) return declared;
      }
      if (fallback) return fallback;
      invalid = true;
      return '';
    }
  );
  return invalid ? null : resolved;
}

// Bulma registers its input focus variables on `.control`, `.input`,
// `.textarea` and `.select`, and the Taginput's box is none of them. It read
// them alone, so outside a Control its focus ring's border and shadow were
// dropped (#2189). It falls back to Bulma's global focus values, and a
// wrapping Control's own values still win. The Bulma here sets its input
// focus hue and alpha apart from the global ones, so the test can tell which
// one the ring took.
describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the focus ring, with %s', (_n, prefix) => {
  const css = compileSource(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'bulma/sass/form/shared' with ($input-focus-h: 10deg, $input-focus-shadow-alpha: 0.5);
     @use 'form/taginput';`
  );

  const GLOBAL_BORDER =
    'hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l))';
  const GLOBAL_SHADOW =
    'var(--bulma-focus-shadow-size) hsla(var(--bulma-focus-h), ' +
    'var(--bulma-focus-s), var(--bulma-focus-l), ' +
    'var(--bulma-focus-shadow-alpha))';

  /** The focused Taginput's box, rendered inside `wrap`. */
  const focusedBox = (
    wrap: (child: ReactElement) => ReactElement,
    color?: 'primary'
  ) => {
    const { container, getByRole } = render(
      <ConfigProvider classPrefix={prefix}>
        {wrap(<Taginput label="Tags" color={color} />)}
      </ConfigProvider>
    );
    getByRole('textbox').focus();
    const box = container.querySelector(`.${prefix}taginput-container`)!;
    expect(box.matches(':focus-within')).toBe(true);
    return box;
  };

  /** The ring the box draws, with the input focus variables resolved. */
  const ring = (box: Element) => {
    const read = (property: string) => {
      const value = cascade(
        box,
        css,
        [property],
        (style, p) => style.getPropertyValue(p) || undefined,
        { forcedColors: false }
      );
      return value === undefined ? undefined : withInputFocus(box, css, value);
    };
    return { border: read('border-color'), shadow: read('box-shadow') };
  };

  it("draws Bulma's global focus ring outside a Control", () => {
    expect(ring(focusedBox(child => child))).toEqual({
      border: GLOBAL_BORDER,
      shadow: GLOBAL_SHADOW,
    });
  });

  it("takes a wrapping Control's input focus values", () => {
    const box = focusedBox(child => (
      <Field>
        <Control>{child}</Control>
      </Field>
    ));
    expect(box.closest(`.${prefix}control`)).not.toBeNull();
    expect(ring(box)).toEqual({
      border: 'hsl(10deg, var(--bulma-focus-s), var(--bulma-focus-l))',
      shadow:
        'var(--bulma-focus-shadow-size) hsla(10deg, var(--bulma-focus-s), ' +
        'var(--bulma-focus-l), 0.5)',
    });
  });

  it("keeps the shadow of a colored Taginput's ring outside a Control", () => {
    expect(ring(focusedBox(child => child, 'primary')).shadow).toBe(
      'var(--bulma-focus-shadow-size) hsla(var(--bulma-primary-h), ' +
        'var(--bulma-primary-s), var(--bulma-primary-l), ' +
        'var(--bulma-focus-shadow-alpha))'
    );
  });
});

describe("a tag's remove button", () => {
  // The button comes after the tag's text, so its gap from the text belongs
  // on its inline start. A physical margin-left put the gap on the side away
  // from the text on a right-to-left page, and the button landed on it.
  it.each([
    ['no prefix', ''],
    ['a class prefix', 'bestax-'],
  ])(
    'keeps its gap on the text side in either direction with %s',
    (_n, prefix) => {
      const css = sass.compileString(
        `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
       @use 'form/taginput';`,
        OPTIONS
      ).css;
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <Taginput defaultValue={['alpha']} />
        </ConfigProvider>
      );
      const button = container.querySelector(
        `.${prefix}tag .${prefix}delete`
      ) as HTMLElement;
      expect(declaredFor(css, button, 'margin-inline-start')).toEqual([
        '0.25rem',
      ]);
      expect(declaredFor(css, button, 'margin-inline-end')).toEqual([
        '-0.25rem',
      ]);
      expect(declaredFor(css, button, 'margin-left')).toEqual([]);
      expect(declaredFor(css, button, 'margin-right')).toEqual([]);
    }
  );
});

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
