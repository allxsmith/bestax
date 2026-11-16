// `useAnchoredPosition` keeps a panel in place inside the viewport by writing
// a shift in `--bulma-anchored-shift`, which each panel's partial adds to its
// corner's edge. These hold the two sides to each other: every partial with a
// panel at a corner starts the shift at 0 on the panel itself and reads it in
// its corner rules, in the plain build and under a class prefix, and a panel
// inside a shifted one keeps its own.
import { render, screen } from '@testing-library/react';
import { compilePartial, compileSource } from './css-cascade';
import { ANCHORED_SHIFT } from '../helpers/useAnchoredPosition';
import { ConfigProvider } from '../helpers/Config';
import { Popover } from '../components/Popover';

/** Each partial, and the class of the panel it draws at a corner. */
const PANELS: [partial: string, panel: string][] = [
  ['components/popover', 'popover-content'],
  ['components/hovercard', 'hover-card-content'],
  ['form/picker-popover', 'picker-popover'],
  ['form/combobox', 'combobox-menu'],
];

/** Every rule's selector and body, whitespace folded, comments dropped. */
function rulesOf(css: string): [string, string][] {
  const rules: [string, string][] = [];
  for (const [, selector, body] of css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    rules.push([
      selector.replace(/\s+/g, ' ').trim(),
      body.replace(/\s+/g, ' ').trim(),
    ]);
  }
  return rules;
}

/** The bodies of the rules whose selector ends with `ending`. */
const bodiesOf = (rules: [string, string][], ending: string) =>
  rules
    .filter(([selector]) => selector.split(', ').some(s => s.endsWith(ending)))
    .map(([, body]) => body);

it('names the property the partials read, whatever Bulma’s variable prefix is', () => {
  expect(ANCHORED_SHIFT).toBe('--bulma-anchored-shift');
  // An app that renames Bulma's variables still gets the name the component
  // writes, since the theming variables are renamed and this one isn't.
  for (const [partial] of PANELS) {
    const css = compileSource(
      `@use 'bulma/sass/utilities/initial-variables' with ($cssvars-prefix: 'app-');
       @use '${partial}';`
    );
    expect(css).toContain(`${ANCHORED_SHIFT}: 0px`);
    expect(css).toContain(`left: var(${ANCHORED_SHIFT})`);
    expect(css).toContain(`right: calc(-1 * var(${ANCHORED_SHIFT}))`);
  }
});

describe.each(PANELS)('%s', (partial, panel) => {
  describe.each(['', 'bestax-'])('with class prefix "%s"', prefix => {
    const rules = rulesOf(compilePartial(partial, prefix));

    it('starts the shift at 0 on the panel itself, so a panel inside a shifted one does not inherit it', () => {
      const own = rules.filter(
        ([selector]) =>
          selector
            .split(', ')
            .includes(`.${prefix}dropdown-menu.${prefix}${panel}`) ||
          selector.split(', ').includes(`.${prefix}${panel}`)
      );
      expect(
        own.some(([, body]) => body.includes(`${ANCHORED_SHIFT}: 0px`))
      ).toBe(true);
    });

    it('adds the shift to the edge of each corner', () => {
      for (const corner of ['is-bottom-left', 'is-top-left']) {
        expect(bodiesOf(rules, `.${prefix}${corner}`).join(' ')).toContain(
          `left: var(${ANCHORED_SHIFT})`
        );
      }
      for (const corner of ['is-bottom-right', 'is-top-right']) {
        expect(bodiesOf(rules, `.${prefix}${corner}`).join(' ')).toContain(
          `right: calc(-1 * var(${ANCHORED_SHIFT}))`
        );
      }
    });
  });
});

describe('a panel inside a shifted panel', () => {
  it('keeps its own shift, written on it, in either build', () => {
    for (const prefix of ['', 'bestax-']) {
      const { unmount } = render(
        <ConfigProvider classPrefix={prefix || undefined}>
          <Popover
            trigger={<button>Outer</button>}
            ariaLabel="Outer"
            defaultOpen
          >
            <Popover
              trigger={<button>Inner</button>}
              ariaLabel="Inner"
              defaultOpen
            >
              Inner
            </Popover>
          </Popover>
        </ConfigProvider>
      );
      const outer = screen.getByRole('dialog', { name: 'Outer' });
      const inner = screen.getByRole('dialog', { name: 'Inner' });
      // As if the outer one ran past an edge and was shifted.
      outer.style.setProperty(ANCHORED_SHIFT, '-40px');
      expect(inner.style.getPropertyValue(ANCHORED_SHIFT)).toBe('0px');
      expect(getComputedStyle(inner).getPropertyValue(ANCHORED_SHIFT)).toBe(
        '0px'
      );
      unmount();
    }
  });
});
