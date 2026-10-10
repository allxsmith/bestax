// A class on a cell proves nothing about the stylesheet, so these compile the
// real SCSS and read what it gives the range's cells and the field, the way
// DateInput.styles.test.tsx does for the calendar's colors.
import * as sass from 'sass';
import path from 'path';
import { render, fireEvent, screen } from '@testing-library/react';
import { DateRangeInput } from '../DateRangeInput';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');
const OPTIONS = {
  loadPaths: [SCSS, NODE_MODULES],
  quietDeps: true,
  logger: sass.Logger.silent,
};

const sheets: HTMLStyleElement[] = [];
const inject = (css: string) => {
  const el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
  sheets.push(el);
};

beforeAll(() => {
  inject(
    sass.compileString(
      `@use 'form/dateinput';
       @use 'form/daterangeinput';`,
      OPTIONS
    ).css
  );
});

afterAll(() => {
  for (const el of sheets) el.remove();
});

const june = (day: number) => new Date(2024, 5, day);

/** The cell for `day` of the month on show, skipping nearby months' days. */
const cell = (container: HTMLElement, day: number) =>
  Array.from(
    container.querySelectorAll<HTMLButtonElement>('[role="gridcell"]')
  ).find(
    c =>
      !c.className.includes('is-other-month') && c.textContent === String(day)
  )!;

const style = (el: Element) => getComputedStyle(el);

/**
 * What the cascade gives `el` for `property` while the pointer is on it.
 * jsdom never matches `:hover`, so each selector is tried with `:hover`
 * standing for a class the cell carries meanwhile, and the matching rule with
 * the most class-level parts wins, the later one on a tie. That is the whole
 * of specificity for the cell's rules, which are classes and pseudo-classes.
 */
const HOVERED = 'jsdom-hovered';
function hovered(el: Element, property: string): string {
  const rules = Array.from((sheets[0].sheet as CSSStyleSheet).cssRules);
  let best = { weight: -1, value: '' };
  el.classList.add(HOVERED);
  for (const rule of rules) {
    if (!(rule instanceof CSSStyleRule)) continue;
    const value = rule.style.getPropertyValue(property);
    if (!value) continue;
    for (const part of rule.selectorText.split(/,(?![^(]*\))/)) {
      const selector = part.trim().replace(/:hover/g, `.${HOVERED}`);
      if (!el.matches(selector)) continue;
      const weight = (
        selector.replace(/:not\(/g, '(').match(/\.[\w-]+|:[\w-]+/g) ?? []
      ).length;
      if (weight >= best.weight) best = { weight, value };
    }
  }
  el.classList.remove(HOVERED);
  return best.value;
}

describe('range cells', () => {
  it('fill the ends and band the days between', () => {
    const { container } = render(
      <DateRangeInput inline defaultValue={[june(10), june(13)]} />
    );
    for (const end of [10, 13]) {
      expect(style(cell(container, end)).backgroundColor).toBe(
        'var(--bulma-dateinput-cell-selected-bg)'
      );
    }
    for (const between of [11, 12]) {
      expect(style(cell(container, between)).backgroundColor).toBe(
        'var(--bulma-dateinput-cell-range-bg)'
      );
    }
    expect(style(cell(container, 14)).backgroundColor).not.toMatch(/range/);
  });

  it('keep the band under the pointer, with the hover overlay on top', () => {
    const { container } = render(
      <DateRangeInput inline defaultValue={[june(10), june(13)]} />
    );
    const band = cell(container, 11);
    expect(hovered(band, 'background-color')).toBe(
      'var(--bulma-dateinput-cell-range-bg)'
    );
    expect(hovered(band, 'background-image')).toContain(
      'var(--bulma-dateinput-cell-hover-bg)'
    );
    // A day outside the range takes the overlay as its fill.
    expect(hovered(cell(container, 20), 'background-color')).toBe(
      'var(--bulma-dateinput-cell-hover-bg)'
    );
  });

  it('keep the preview tint on the day under the pointer', () => {
    // The preview ends on the hovered day, so the pointer is always on it.
    const { container } = render(<DateRangeInput inline />);
    fireEvent.click(cell(container, 10));
    fireEvent.mouseOver(cell(container, 13));
    for (const day of [12, 13]) {
      expect(hovered(cell(container, day), 'background-color')).toBe(
        'var(--bulma-dateinput-cell-range-preview-bg)'
      );
    }
    expect(hovered(cell(container, 13), 'background-image')).toContain(
      'var(--bulma-dateinput-cell-hover-bg)'
    );
  });

  // jsdom matches no `:hover`, so this reads the cells as the keys leave
  // them, with the preview's end on the focused day; the two above put the
  // pointer on them.
  it('band a preview fainter and outline the day it would end on', () => {
    const { container } = render(<DateRangeInput inline />);
    fireEvent.click(cell(container, 10));
    fireEvent.mouseEnter(cell(container, 13));
    expect(style(cell(container, 11)).backgroundColor).toBe(
      'var(--bulma-dateinput-cell-range-preview-bg)'
    );
    const end = style(cell(container, 13));
    expect(end.backgroundColor).toBe(
      'var(--bulma-dateinput-cell-range-preview-bg)'
    );
    expect(end.borderStyle).toBe('dashed');
    expect(end.borderColor).toBe('var(--bulma-dateinput-cell-selected-bg)');
  });

  it('tint the band from the selection fill, so color re-tints it', () => {
    const { container } = render(
      <DateRangeInput inline color="danger" defaultValue={[june(10), null]} />
    );
    const root = style(container.querySelector('.dateinput')!);
    expect(root.getPropertyValue('--bulma-dateinput-cell-selected-bg')).toBe(
      'var(--bulma-danger)'
    );
    for (const name of [
      '--bulma-dateinput-cell-range-bg',
      '--bulma-dateinput-cell-range-preview-bg',
    ]) {
      expect(root.getPropertyValue(name)).toMatch(
        /^color-mix\(in srgb, var\(--bulma-dateinput-cell-selected-bg\) \d+%, transparent\)$/
      );
    }
  });
});

describe('the field', () => {
  it('leaves the inputs bare inside the one Bulma input', () => {
    render(<DateRangeInput />);
    const input = style(screen.getByRole('combobox', { name: 'Start date' }));
    expect(input.borderWidth || input.borderStyle).toMatch(/^0|none/);
    // jsdom spells `transparent` as its computed value.
    expect(input.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(input.outlineStyle || input.outline).toMatch(/none/);
  });

  it('spaces and colors the separator from its variables', () => {
    const { container } = render(<DateRangeInput />);
    expect(style(container.querySelector('.daterangeinput-field')!).gap).toBe(
      'var(--bulma-daterangeinput-gap)'
    );
    expect(
      style(container.querySelector('.daterangeinput-separator')!).color
    ).toBe('var(--bulma-daterangeinput-separator-color)');
  });

  it("gives a disabled field Bulma's disabled input look", () => {
    const { container } = render(<DateRangeInput disabled />);
    const field = style(container.querySelector('.daterangeinput-field')!);
    expect(field.backgroundColor).toBe(
      'var(--bulma-input-disabled-background-color)'
    );
    expect(field.color).toBe('var(--bulma-input-disabled-color)');
  });
});

describe('under a class prefix', () => {
  it('matches the prefixed classes the component emits', () => {
    inject(
      sass.compileString(
        `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: 'bestax-');
         @use 'form/dateinput';
         @use 'form/daterangeinput';`,
        OPTIONS
      ).css
    );
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <DateRangeInput inline defaultValue={[june(10), june(13)]} />
        <DateRangeInput disabled />
      </ConfigProvider>
    );
    expect(style(cell(container, 11)).backgroundColor).toBe(
      'var(--bulma-dateinput-cell-range-bg)'
    );
    expect(
      style(container.querySelector('.bestax-daterangeinput-field')!).color
    ).toBe('var(--bulma-input-disabled-color)');
  });
});
