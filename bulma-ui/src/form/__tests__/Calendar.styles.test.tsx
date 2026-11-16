// The Calendar's frame, its months side by side, its header and its day
// content live in `_dateinput.scss`, which jsdom never loads. These compile
// the partial, with no prefix and under one, render a Calendar, and resolve
// what its elements get from it, the way a browser would.
import { render } from '@testing-library/react';
import { Calendar } from '../Calendar';
import type { CalendarSingleProps } from '../Calendar';
import { ConfigProvider } from '../../helpers/Config';
import { cascade, compilePartial } from '../../__tests__/css-cascade';

const NOV_2026 = new Date(2026, 10, 1);

let PLAIN = '';
let PREFIXED = '';

beforeAll(() => {
  PLAIN = compilePartial('form/dateinput');
  PREFIXED = compilePartial('form/dateinput', 'bestax-');
}, 30_000);

/** What `el` gets for `property` from `css`. */
const value = (el: Element, css: string, property: string) =>
  cascade(
    el,
    css,
    [property],
    (style, p) => style.getPropertyValue(p).trim() || undefined
  );

/** A Calendar with day content, in a ConfigProvider with `prefix`. */
function renderCalendar(prefix = '', props: Partial<CalendarSingleProps> = {}) {
  const { container } = render(
    <ConfigProvider classPrefix={prefix}>
      <Calendar
        locale="en-US"
        defaultMonth={NOV_2026}
        defaultValue={new Date(2026, 10, 20)}
        dayTemplate={() => '$90'}
        {...props}
      />
    </ConfigProvider>
  );
  const q = (selector: string) => {
    const el = container.querySelector(
      selector.replace(/\.([\w-]+)/g, `.${prefix}$1`)
    );
    if (!el) throw new Error(`nothing matches ${selector}`);
    return el;
  };
  return { container, q };
}

describe.each([
  ['', () => PLAIN],
  ['bestax-', () => PREFIXED],
])('Calendar styles (prefix "%s")', (prefix, css) => {
  it('registers its variables from Bulma tokens', () => {
    const { q } = renderCalendar(prefix);
    const root = q('.calendar');
    const month = q('.dateinput');
    expect(value(root, css(), '--bulma-calendar-months-gap')).toBe(
      'var(--bulma-block-spacing)'
    );
    expect(value(root, css(), '--bulma-calendar-background-color')).toBe(
      'var(--bulma-scheme-main)'
    );
    expect(value(root, css(), '--bulma-calendar-border-color')).toBe(
      'var(--bulma-border)'
    );
    expect(value(root, css(), '--bulma-calendar-radius')).toBe(
      'var(--bulma-radius)'
    );
    expect(value(root, css(), '--bulma-calendar-padding')).toBe('0.75rem');
    expect(value(month, css(), '--bulma-dateinput-cell-content-size')).toBe(
      'var(--bulma-size-7)'
    );
    // The nearby months' days' colour, which reads at 4.5:1 on the hover
    // fill and a range's band too.
    expect(value(month, css(), '--bulma-dateinput-cell-content-color')).toBe(
      value(month, css(), '--bulma-dateinput-cell-other-month-color')
    );
    expect(
      value(month, css(), '--bulma-dateinput-cell-content-loading-opacity')
    ).toBe('0.4');
  });

  it('frames the root and lays the months out in a wrapping row', () => {
    const { q } = renderCalendar(prefix);
    const root = q('.calendar');
    expect(value(root, css(), 'padding')).toBe('var(--bulma-calendar-padding)');
    expect(value(root, css(), 'background-color')).toBe(
      'var(--bulma-calendar-background-color)'
    );
    expect(value(root, css(), 'border-radius')).toBe(
      'var(--bulma-calendar-radius)'
    );
    const months = q('.calendar-months');
    expect(value(months, css(), 'display')).toBe('flex');
    expect(value(months, css(), 'flex-wrap')).toBe('wrap');
    expect(value(months, css(), 'gap')).toBe(
      'var(--bulma-calendar-months-gap)'
    );
  });

  it("centres each month's name between its buttons", () => {
    const { container, q } = renderCalendar(prefix, { monthsToShow: 2 });
    expect(value(q('.dateinput-header'), css(), 'display')).toBe('grid');
    const [first, last] = container.querySelectorAll(
      `.${prefix}dateinput-header`
    );
    expect(
      value(
        first.querySelector(`.${prefix}dateinput-nav-prev`)!,
        css(),
        'grid-column'
      )
    ).toBe('1');
    expect(
      value(
        first.querySelector(`.${prefix}dateinput-month-trigger`)!,
        css(),
        'justify-self'
      )
    ).toBe('center');
    expect(
      value(
        last.querySelector(`.${prefix}dateinput-month-label`)!,
        css(),
        'grid-column'
      )
    ).toBe('2');
    expect(
      value(
        last.querySelector(`.${prefix}dateinput-nav-next`)!,
        css(),
        'grid-column'
      )
    ).toBe('3');
  });

  it("pads a month's plain name as the first month's button, so the grids line up", () => {
    const { container } = renderCalendar(prefix, { monthsToShow: 3 });
    const trigger = container.querySelector(
      `.${prefix}dateinput-month-trigger`
    )!;
    const [top] = value(trigger, css(), 'padding')!.split(' ');
    const labels = container.querySelectorAll(
      `.${prefix}dateinput-header > .${prefix}dateinput-month-label`
    );
    expect(labels).toHaveLength(2);
    for (const label of labels) {
      expect(value(label, css(), 'padding-block')).toBe(top);
    }
  });

  it('draws day content under the number, in its own colour and size', () => {
    const { container } = renderCalendar(prefix);
    const cell = container.querySelector(
      `.${prefix}dateinput-cell:not(.${prefix}is-selected)`
    )!;
    expect(value(cell, css(), 'flex-direction')).toBe('column');
    const content = cell.querySelector(`.${prefix}dateinput-cell-content`)!;
    expect(value(content, css(), 'color')).toBe(
      'var(--bulma-dateinput-cell-content-color)'
    );
    expect(value(content, css(), 'font-size')).toBe(
      'var(--bulma-dateinput-cell-content-size)'
    );
    expect(value(content, css(), 'opacity')).toBeUndefined();
    // A line high even where it's empty, so the numbers line up.
    expect(value(content, css(), 'min-height')).toBe('1em');
  });

  it("gives a picked day's content the picked day's colour", () => {
    const { q } = renderCalendar(prefix);
    const content = q('.dateinput-cell.is-selected .dateinput-cell-content');
    expect(value(content, css(), 'color')).toBe('inherit');
  });

  it('fades the content while loading', () => {
    const { q } = renderCalendar(prefix, { loading: true });
    expect(value(q('.dateinput-cell-content'), css(), 'opacity')).toBe(
      'var(--bulma-dateinput-cell-content-loading-opacity)'
    );
  });

  it.each(['small', 'medium', 'large', undefined] as const)(
    'stretches the days with isFullwidth, at size %s',
    size => {
      const { q } = renderCalendar(prefix, { isFullwidth: true, size });
      expect(value(q('.calendar'), css(), 'display')).toBe('block');
      expect(value(q('.dateinput-cell'), css(), 'width')).toBe('100%');
      expect(value(q('.calendar-months > .dateinput'), css(), 'flex')).toBe(
        '1 1 var(--bulma-dateinput-min-width)'
      );
    }
  );

  it('keeps compact days without isFullwidth', () => {
    const { q } = renderCalendar(prefix, { size: 'small' });
    expect(value(q('.calendar'), css(), 'display')).toBe('inline-block');
    expect(value(q('.dateinput-cell'), css(), 'width')).toBe('1.75rem');
  });
});
