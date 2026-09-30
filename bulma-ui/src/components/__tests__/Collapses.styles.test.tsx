// The group's spacing and joins live in _collapse.scss, which jsdom never
// loads on its own, so className assertions cannot see them. These tests
// compile the real partial and assert computed style instead (pattern:
// Badge.styles.test.tsx).
import * as sass from 'sass';
import path from 'path';
import type { CSSProperties } from 'react';
import { render, screen } from '@testing-library/react';
import { Collapses } from '../Collapses';
import { Collapse } from '../Collapse';

let styleEl: HTMLStyleElement;

beforeAll(() => {
  const result = sass.compile(
    path.resolve(__dirname, '../../scss/components/_collapse.scss'),
    {
      loadPaths: [path.resolve(__dirname, '../../../../node_modules')],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  );
  styleEl = document.createElement('style');
  styleEl.textContent = result.css;
  document.head.appendChild(styleEl);
});

afterAll(() => {
  styleEl.remove();
});

const GAP_VAR = '--bulma-collapse-group-gap';

/**
 * The value the group's `gap` resolves to. jsdom reports the custom
 * properties each element declares but neither inherits them nor resolves
 * `var()`, so this applies the two CSS rules itself: a custom property
 * inherits from the nearest element that declares it, and `var(--x, y)`
 * falls back to `y` when nothing does. What each element declares still
 * comes from the compiled stylesheet and the cascade.
 */
function resolvedGap(group: HTMLElement): string {
  const gap = getComputedStyle(group).gap;
  const read = gap.match(/^var\((--[\w-]+)(?:,\s*(.+))?\)$/);
  if (!read) return gap;
  const [, name, fallback] = read;
  for (let el: Element | null = group; el; el = el.parentElement) {
    const declared = getComputedStyle(el).getPropertyValue(name).trim();
    if (declared) return declared;
  }
  // No value and no fallback: the declaration is invalid at computed time.
  return fallback ?? 'unset';
}

/** Adds a stylesheet of the caller's own, before or after the library's. */
function addSheet(css: string, before = false): HTMLStyleElement {
  const el = document.createElement('style');
  el.textContent = css;
  if (before) document.head.insertBefore(el, styleEl);
  else document.head.appendChild(el);
  return el;
}

describe('Collapses styles', () => {
  it('reads the gap variable on the group, with 0.5rem as the default', () => {
    render(
      <Collapses data-testid="group">
        <Collapse trigger="A">Panel A</Collapse>
      </Collapses>
    );
    const group = screen.getByTestId('group');
    expect(getComputedStyle(group).gap).toBe(`var(${GAP_VAR}, 0.5rem)`);
    // The group declares no value of its own, which is what lets an
    // ancestor's value through.
    expect(getComputedStyle(group).getPropertyValue(GAP_VAR)).toBe('');
    expect(resolvedGap(group)).toBe('0.5rem');
  });

  it.each([
    ['after', false],
    ['before', true],
  ])(
    'applies a :root override loaded %s the library styles',
    (_order, before) => {
      const sheet = addSheet(`:root { ${GAP_VAR}: 1.5rem; }`, before);
      render(
        <Collapses data-testid="group">
          <Collapse trigger="A">Panel A</Collapse>
        </Collapses>
      );
      expect(resolvedGap(screen.getByTestId('group'))).toBe('1.5rem');
      sheet.remove();
    }
  );

  it('applies an override on any ancestor of the group', () => {
    render(
      <div style={{ [GAP_VAR]: '1rem' } as CSSProperties}>
        <section>
          <Collapses data-testid="group">
            <Collapse trigger="A">Panel A</Collapse>
          </Collapses>
        </section>
      </div>
    );
    expect(resolvedGap(screen.getByTestId('group'))).toBe('1rem');
  });

  it('applies an override on the group itself, over an ancestor one', () => {
    const sheet = addSheet(`:root { ${GAP_VAR}: 1.5rem; }`);
    render(
      <>
        <Collapses
          data-testid="styled"
          style={{ [GAP_VAR]: '2rem' } as CSSProperties}
        >
          <Collapse trigger="A">Panel A</Collapse>
        </Collapses>
        <Collapses className="roomy" data-testid="classed">
          <Collapse trigger="B">Panel B</Collapse>
        </Collapses>
      </>
    );
    const classSheet = addSheet(`.collapses.roomy { ${GAP_VAR}: 3rem; }`);
    expect(resolvedGap(screen.getByTestId('styled'))).toBe('2rem');
    expect(resolvedGap(screen.getByTestId('classed'))).toBe('3rem');
    sheet.remove();
    classSheet.remove();
  });

  it('spaces items with the gap alone, not the gap plus their own margin', () => {
    render(
      <>
        <Collapses>
          <Collapse trigger="A" data-testid="item">
            Panel A
          </Collapse>
          <Collapse trigger="B">Panel B</Collapse>
        </Collapses>
        <Collapse trigger="Standalone" data-testid="standalone">
          Standalone
        </Collapse>
        {/* A last child drops its margin anyway; this keeps it off the end. */}
        <div />
      </>
    );
    expect(getComputedStyle(screen.getByTestId('item')).marginBottom).toBe(
      '0px'
    );
    // Outside a group, a Collapse keeps its own spacing.
    expect(
      getComputedStyle(screen.getByTestId('standalone')).marginBottom
    ).toBe('var(--bulma-collapse-margin-bottom)');
  });

  it('joins only the group’s own items when seamless', () => {
    render(
      <Collapses seamless>
        <Collapse trigger="A" bordered data-testid="first">
          <Collapse trigger="Nested" bordered data-testid="nested">
            Nested panel
          </Collapse>
        </Collapse>
        <Collapse trigger="B" bordered>
          Panel B
        </Collapse>
      </Collapses>
    );
    // jsdom resolves the `border-radius` shorthand but not the per-corner
    // longhands the outer corners use, so this reads the reset every joined
    // item gets.
    expect(getComputedStyle(screen.getByTestId('first')).borderRadius).toBe(
      '0'
    );

    // A bordered Collapse inside an item's content is not one of the joins.
    expect(getComputedStyle(screen.getByTestId('nested')).borderRadius).toBe(
      'var(--bulma-collapse-radius)'
    );
  });
});
