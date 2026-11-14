import React, { createRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import {
  Calendar,
  CalendarDayState,
  CalendarProps,
  CalendarSingleProps,
} from '../Calendar';
import type { DateRangeValue } from '../_pickerInternals/pickerTypes';
import { Field } from '../Field';
import { Fieldset } from '../Fieldset';
import { ConfigProvider } from '../../helpers/Config';
import { LocaleProvider } from '../../helpers/LocaleProvider';
import { resetDevWarnings } from '../../helpers/devWarnings';

const NOV_2026 = new Date(2026, 10, 1);

/** A day's cell, by the full date that names it. */
const day = (name: string) =>
  screen.getByRole('gridcell', { name: new RegExp(`\\b${name}$`) });

/** Each month's grid, first to last. */
const grids = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[role="grid"]'));

/** The cell holding the tab stop. */
const tabStop = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]');

/** The grids' names, read through `aria-labelledby`. */
const gridNames = (container: HTMLElement) =>
  grids(container).map(
    g =>
      container.ownerDocument.getElementById(g.getAttribute('aria-labelledby')!)
        ?.textContent
  );

const key = (el: Element, k: string, init: object = {}) =>
  fireEvent.keyDown(el, { key: k, ...init });

beforeAll(() => {
  // jsdom has no layout, and the year list scrolls its year into view.
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  resetDevWarnings();
});

describe('Calendar', () => {
  describe('structure', () => {
    it('renders the root, the months and one grid, with no field or input', () => {
      const { container } = render(
        <Calendar locale="en-US" defaultMonth={NOV_2026} />
      );
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveClass('calendar');
      expect(root).not.toHaveAttribute('role');
      const months = root.firstElementChild as HTMLElement;
      expect(months).toHaveClass('calendar-months');
      expect(months.children).toHaveLength(1);
      expect(months.firstElementChild).toHaveClass('dateinput');
      expect(grids(container)).toHaveLength(1);
      expect(gridNames(container)).toEqual(['November 2026']);
      expect(container.querySelector('input')).toBeNull();
      expect(container.querySelector('label')).toBeNull();
      expect(container.querySelector('.field')).toBeNull();
    });

    it('forwards the ref, the class name and the attributes to the root', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <Calendar
          ref={ref}
          className="extra"
          data-testid="cal"
          id="cal"
          defaultMonth={NOV_2026}
        />
      );
      const root = container.firstElementChild as HTMLElement;
      expect(ref.current).toBe(root);
      expect(root).toHaveClass('calendar', 'extra');
      expect(root).toHaveAttribute('data-testid', 'cal');
      expect(root).toHaveAttribute('id', 'cal');
      // The grids' own ids don't take the root's.
      expect(container.querySelectorAll('#cal')).toHaveLength(1);
    });

    it('puts the helper props on the root', () => {
      const { container } = render(
        <Calendar
          defaultMonth={NOV_2026}
          textColor="primary"
          bgColor="light"
          m="2"
        />
      );
      expect(container.firstElementChild).toHaveClass(
        'has-text-primary',
        'has-background-light',
        'm-2'
      );
    });

    it('is a group once something names it', () => {
      const { rerender } = render(
        <Calendar aria-label="Pick a day" defaultMonth={NOV_2026} />
      );
      expect(screen.getByRole('group', { name: 'Pick a day' })).toHaveClass(
        'calendar'
      );
      rerender(
        <>
          <h2 id="cal-heading">Holidays</h2>
          <Calendar aria-labelledby="cal-heading" defaultMonth={NOV_2026} />
        </>
      );
      expect(screen.getByRole('group', { name: 'Holidays' })).toHaveClass(
        'calendar'
      );
    });

    it('stretches with isFullwidth', () => {
      const { container } = render(
        <Calendar isFullwidth defaultMonth={NOV_2026} />
      );
      expect(container.firstElementChild).toHaveClass('is-fullwidth');
    });

    it('carries color and size on each month', () => {
      const { container } = render(
        <Calendar
          color="success"
          size="small"
          monthsToShow={2}
          defaultMonth={NOV_2026}
        />
      );
      const months = container.querySelectorAll('.dateinput');
      expect(months).toHaveLength(2);
      for (const m of months) expect(m).toHaveClass('is-success', 'is-small');
    });

    it('prefixes every class under a ConfigProvider classPrefix', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <Calendar
            isFullwidth
            defaultMonth={NOV_2026}
            dayTemplate={() => '•'}
            locale="en-US"
          />
        </ConfigProvider>
      );
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveClass('bestax-calendar', 'bestax-is-fullwidth');
      expect(root.firstElementChild).toHaveClass('bestax-calendar-months');
      expect(root.querySelector('.bestax-dateinput')).not.toBeNull();
      expect(
        root.querySelector('.bestax-dateinput-cell-content')
      ).not.toBeNull();
      const unprefixed = Array.from(root.querySelectorAll('*'))
        .concat(root)
        .flatMap(el => Array.from(el.classList))
        .filter(c => !c.startsWith('bestax-'));
      expect(unprefixed).toEqual([]);
    });
  });

  describe('naming days', () => {
    it('names each day by its full date, with the weekday row hidden', () => {
      const { container } = render(
        <Calendar locale="en-US" defaultMonth={NOV_2026} />
      );
      expect(day('Friday, November 20, 2026')).toHaveTextContent('20');
      const weekdays = container.querySelector('.dateinput-day-names');
      expect(weekdays).toHaveAttribute('aria-hidden', 'true');
    });

    it('builds the name with getDayLabel from the full date', () => {
      const getDayLabel = vi.fn((date: Date, label: string) =>
        date.getDate() === 20 ? `${label}, 3 slots left` : label
      );
      render(
        <Calendar
          locale="en-US"
          defaultMonth={NOV_2026}
          getDayLabel={getDayLabel}
        />
      );
      expect(
        screen.getByRole('gridcell', {
          name: 'Friday, November 20, 2026, 3 slots left',
        })
      ).toBeInTheDocument();
      expect(getDayLabel).toHaveBeenCalledWith(
        new Date(2026, 10, 20),
        'Friday, November 20, 2026'
      );
    });

    it('names days in the locale', () => {
      render(<Calendar locale="de-DE" defaultMonth={NOV_2026} />);
      expect(
        screen.getByRole('gridcell', { name: 'Freitag, 20. November 2026' })
      ).toBeInTheDocument();
    });

    it("names days by the Gregorian calendar the grid draws, whatever the locale's", () => {
      // Thai counts years from the Buddhist era by default: 2026 is 2569.
      const { container } = render(
        <Calendar locale="th-TH" defaultMonth={NOV_2026} />
      );
      const twentieth = Array.from(
        container.querySelectorAll('[role="gridcell"]:not(.is-other-month)')
      ).find(c => c.textContent === '20')!;
      expect(twentieth.getAttribute('aria-label')).toContain('2026');
      expect(twentieth.getAttribute('aria-label')).not.toContain('2569');
    });

    it("takes a LocaleProvider's locale and first day of the week", () => {
      const { container } = render(
        <LocaleProvider locale="de-DE">
          <Calendar defaultMonth={NOV_2026} />
        </LocaleProvider>
      );
      expect(
        screen.getByRole('gridcell', { name: 'Freitag, 20. November 2026' })
      ).toBeInTheDocument();
      expect(
        container.querySelector('.dateinput-day-name')?.textContent
      ).toMatch(/^Mo/);
    });

    it('adds the full names once the page has hydrated, without a mismatch', async () => {
      // With `month` given, the server and the browser render the same
      // markup, which names the days by their numbers and marks no today.
      const ui = (
        <Calendar
          locale="en-US"
          month={NOV_2026}
          getDayLabel={(_, label) => `${label}, open`}
          dayTemplate={() => 'open'}
        />
      );
      const container = document.createElement('div');
      container.innerHTML = renderToString(ui);
      for (const cell of container.querySelectorAll('[role="gridcell"]')) {
        expect(cell).not.toHaveAttribute('aria-label');
      }
      expect(container.innerHTML).not.toContain('is-today');
      expect(container.innerHTML).not.toContain('aria-current');
      expect(
        container.querySelector('.dateinput-day-names')
      ).not.toHaveAttribute('aria-hidden');
      document.body.appendChild(container);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(container, ui);
        });
        expect(errorSpy).not.toHaveBeenCalled();
        expect(
          within(container).getByRole('gridcell', {
            name: 'Friday, November 20, 2026, open',
          })
        ).toBeInTheDocument();
        expect(container.querySelector('.dateinput-day-names')).toHaveAttribute(
          'aria-hidden',
          'true'
        );
      } finally {
        errorSpy.mockRestore();
        await act(async () => root?.unmount());
        container.remove();
      }
    });
  });

  describe('day content', () => {
    it('draws dayTemplate under the number, inside the day', () => {
      render(
        <Calendar
          locale="en-US"
          defaultMonth={NOV_2026}
          dayTemplate={date =>
            date.getDate() === 20 ? <span>4 left</span> : null
          }
        />
      );
      const cell = day('November 20, 2026');
      const content = cell.querySelector('.dateinput-cell-content');
      expect(content).toHaveTextContent('4 left');
      expect(cell.firstChild?.textContent).toBe('20');
      // Days it returns nothing for keep an empty line, so the numbers line
      // up along a row.
      expect(
        day('November 21, 2026').querySelector('.dateinput-cell-content')
      ).toBeEmptyDOMElement();
    });

    it('draws no content line without dayTemplate', () => {
      const { container } = render(
        <Calendar locale="en-US" defaultMonth={NOV_2026} />
      );
      expect(container.querySelector('.dateinput-cell-content')).toBeNull();
    });

    it('renders nothing for false, an empty string or true, and 0 as content', () => {
      const values: Record<number, React.ReactNode> = {
        2: false,
        3: '',
        4: true,
        5: 0,
      };
      render(
        <Calendar
          locale="en-US"
          defaultMonth={NOV_2026}
          dayTemplate={date => values[date.getDate()]}
        />
      );
      for (const d of [2, 3, 4]) {
        expect(
          day(`November ${d}, 2026`).querySelector('.dateinput-cell-content')
        ).toBeEmptyDOMElement();
      }
      expect(
        day('November 5, 2026').querySelector('.dateinput-cell-content')
      ).toHaveTextContent('0');
    });

    it("tells dayTemplate each day's state", () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 10, 10, 12));
      try {
        const states = new Map<string, CalendarDayState>();
        render(
          <Calendar
            locale="en-US"
            defaultMonth={NOV_2026}
            defaultValue={new Date(2026, 10, 20)}
            min={new Date(2026, 10, 3)}
            dayTemplate={(date, state) => {
              states.set(date.toDateString(), state);
              return null;
            }}
          />
        );
        const of = (y: number, m: number, d: number) =>
          states.get(new Date(y, m, d).toDateString());
        expect(of(2026, 10, 10)).toEqual({
          isToday: true,
          isSelected: false,
          isDisabled: false,
          isOutsideMonth: false,
        });
        expect(of(2026, 10, 20)).toMatchObject({ isSelected: true });
        expect(of(2026, 10, 2)).toMatchObject({ isDisabled: true });
        expect(of(2026, 11, 1)).toMatchObject({ isOutsideMonth: true });
      } finally {
        vi.useRealTimers();
      }
    });

    it('tells dayTemplate every day is disabled in a disabled Calendar', () => {
      const states: CalendarDayState[] = [];
      render(
        <Fieldset disabled legend="Dates">
          <Calendar
            locale="en-US"
            defaultMonth={NOV_2026}
            dayTemplate={(_, state) => {
              states.push(state);
              return null;
            }}
          />
        </Fieldset>
      );
      expect(states.length).toBeGreaterThan(0);
      expect(states.every(state => state.isDisabled)).toBe(true);
    });

    it("isn't asked for the hidden days of nearby months", () => {
      const seen: number[] = [];
      render(
        <Calendar
          locale="en-US"
          defaultMonth={NOV_2026}
          nearbyMonthDays={false}
          dayTemplate={date => {
            seen.push(date.getMonth());
            return null;
          }}
        />
      );
      expect(new Set(seen)).toEqual(new Set([10]));
    });
  });

  describe('picking one day', () => {
    it('picks the clicked day and shows it picked', () => {
      const onChange = vi.fn();
      render(
        <Calendar locale="en-US" defaultMonth={NOV_2026} onChange={onChange} />
      );
      const cell = day('November 20, 2026');
      expect(cell).toHaveAttribute('aria-selected', 'false');
      fireEvent.click(cell);
      expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 20));
      expect(cell).toHaveAttribute('aria-selected', 'true');
    });

    it('picks the focused day with Enter or Space, at midnight', () => {
      const onChange = vi.fn();
      render(
        <Calendar
          locale="en-US"
          defaultValue={new Date(2026, 10, 20, 15, 30)}
          onChange={onChange}
        />
      );
      const cell = day('November 20, 2026');
      key(cell, 'ArrowRight');
      key(cell, 'Enter');
      expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 10, 21));
      key(cell, ' ');
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('changes a held value only when the caller passes it', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <Calendar
          locale="en-US"
          defaultMonth={NOV_2026}
          value={null}
          onChange={onChange}
        />
      );
      fireEvent.click(day('November 20, 2026'));
      expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 20));
      expect(day('November 20, 2026')).toHaveAttribute(
        'aria-selected',
        'false'
      );
      rerender(
        <Calendar
          locale="en-US"
          defaultMonth={NOV_2026}
          value={new Date(2026, 10, 20)}
          onChange={onChange}
        />
      );
      expect(day('November 20, 2026')).toHaveAttribute('aria-selected', 'true');
    });

    it('picks the first day of a month at month granularity', () => {
      const onChange = vi.fn();
      render(
        <Calendar
          locale="en-US"
          granularity="month"
          defaultMonth={NOV_2026}
          onChange={onChange}
        />
      );
      fireEvent.click(screen.getByRole('gridcell', { name: 'March' }));
      expect(onChange).toHaveBeenCalledWith(new Date(2026, 2, 1));
    });

    it("opens the year list on the value's year with no month", () => {
      const { container } = render(
        <Calendar granularity="year" defaultValue={new Date(2033, 0, 1)} />
      );
      expect(
        container.querySelector('[data-focused-year="true"]')
      ).toHaveTextContent('2033');
    });

    it('picks the first day of a year at year granularity', () => {
      const onChange = vi.fn();
      render(
        <Calendar
          locale="en-US"
          granularity="year"
          defaultMonth={NOV_2026}
          onChange={onChange}
        />
      );
      fireEvent.click(screen.getByRole('option', { name: '2028' }));
      expect(onChange).toHaveBeenCalledWith(new Date(2028, 0, 1));
    });
  });

  describe('picking a range', () => {
    it('commits both ends in one call, start first', () => {
      const onChange = vi.fn();
      const { container } = render(
        <Calendar
          locale="en-US"
          selectionMode="range"
          defaultMonth={NOV_2026}
          onChange={onChange}
        />
      );
      expect(grids(container)[0]).toHaveAttribute(
        'aria-multiselectable',
        'true'
      );
      fireEvent.click(day('November 10, 2026'));
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.click(day('November 14, 2026'));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith([
        new Date(2026, 10, 10),
        new Date(2026, 10, 14),
      ]);
      expect(day('November 12, 2026')).toHaveAttribute('aria-selected', 'true');
    });

    it('drops a pending start with Escape', () => {
      const onChange = vi.fn();
      render(
        <Calendar
          locale="en-US"
          selectionMode="range"
          defaultMonth={NOV_2026}
          onChange={onChange}
        />
      );
      const start = day('November 10, 2026');
      fireEvent.click(start);
      expect(start).toHaveAttribute('aria-selected', 'true');
      key(start, 'Escape');
      expect(start).toHaveAttribute('aria-selected', 'false');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('shows a held range, and opens on its start', () => {
      const range: DateRangeValue = [
        new Date(2026, 10, 28),
        new Date(2026, 11, 2),
      ];
      const { container } = render(
        <Calendar
          locale="en-US"
          selectionMode="range"
          monthsToShow={2}
          value={range}
        />
      );
      expect(gridNames(container)).toEqual(['November 2026', 'December 2026']);
      expect(day('December 1, 2026')).toHaveAttribute('aria-selected', 'true');
      expect(day('November 29, 2026')).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('readOnly and disabled', () => {
    it('reads days without picking them with readOnly', () => {
      const onChange = vi.fn();
      const { container } = render(
        <Calendar
          locale="en-US"
          readOnly
          defaultValue={new Date(2026, 10, 20)}
          onChange={onChange}
        />
      );
      expect(grids(container)[0]).toHaveAttribute('aria-readonly', 'true');
      const cell = day('November 20, 2026');
      fireEvent.click(day('November 21, 2026'));
      key(cell, 'Enter');
      expect(onChange).not.toHaveBeenCalled();
      // The keys still move focus.
      key(tabStop(container)!, 'ArrowRight');
      expect(tabStop(container)).toHaveAccessibleName(/November 22, 2026/);
    });

    it('stops picks and the header with disabled', () => {
      const onChange = vi.fn();
      const { container } = render(
        <Calendar
          locale="en-US"
          disabled
          defaultMonth={NOV_2026}
          onChange={onChange}
        />
      );
      expect(grids(container)[0]).toHaveAttribute('aria-disabled', 'true');
      for (const button of container.querySelectorAll('button')) {
        expect(button).toBeDisabled();
      }
    });

    it('takes disabled from a Fieldset around it', () => {
      const { container } = render(
        <Fieldset disabled legend="Dates">
          <Calendar locale="en-US" defaultMonth={NOV_2026} />
        </Fieldset>
      );
      expect(grids(container)[0]).toHaveAttribute('aria-disabled', 'true');
      expect(day('November 20, 2026')).toBeDisabled();
    });
  });

  describe('the month on show', () => {
    it('starts on defaultMonth, else the value, else today inside min and max', () => {
      const { unmount } = render(
        <Calendar locale="en-US" defaultMonth={new Date(2026, 4, 17)} />
      );
      expect(screen.getByRole('grid')).toHaveAccessibleName('May 2026');
      unmount();
      const second = render(
        <Calendar locale="en-US" defaultValue={new Date(2027, 1, 3)} />
      );
      expect(screen.getByRole('grid')).toHaveAccessibleName('February 2027');
      second.unmount();
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 10, 10, 12));
      try {
        render(<Calendar locale="en-US" min={new Date(2027, 2, 5)} />);
        expect(screen.getByRole('grid')).toHaveAccessibleName('March 2027');
      } finally {
        vi.useRealTimers();
      }
    });

    it('calls onMonthChange from the header buttons and moves on its own', () => {
      const onMonthChange = vi.fn();
      render(
        <Calendar
          locale="en-US"
          defaultMonth={NOV_2026}
          onMonthChange={onMonthChange}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 11, 1));
      expect(screen.getByRole('grid')).toHaveAccessibleName('December 2026');
      fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
      fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
      expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 9, 1));
      expect(screen.getByRole('grid')).toHaveAccessibleName('October 2026');
    });

    it('calls onMonthChange from PageUp, PageDown and an arrow over the edge', () => {
      const onMonthChange = vi.fn();
      const { container } = render(
        <Calendar
          locale="en-US"
          defaultValue={new Date(2026, 10, 30)}
          onMonthChange={onMonthChange}
        />
      );
      key(tabStop(container)!, 'ArrowRight');
      expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 11, 1));
      expect(tabStop(container)).toHaveAccessibleName(/December 1, 2026/);
      key(tabStop(container)!, 'PageDown');
      expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2027, 0, 1));
      key(tabStop(container)!, 'PageUp', { shiftKey: true });
      expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 0, 1));
      // A move inside the month changes no month.
      onMonthChange.mockClear();
      key(tabStop(container)!, 'ArrowRight');
      expect(onMonthChange).not.toHaveBeenCalled();
    });

    it('calls onMonthChange from a pick in the year list, keeping the month', () => {
      const onMonthChange = vi.fn();
      render(
        <Calendar
          locale="en-US"
          defaultMonth={NOV_2026}
          onMonthChange={onMonthChange}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'November 2026' }));
      fireEvent.click(screen.getByRole('option', { name: '2029' }));
      expect(onMonthChange).toHaveBeenCalledWith(new Date(2029, 10, 1));
      expect(screen.getByRole('grid')).toHaveAccessibleName('November 2029');
    });

    it('calls nothing for a year list pick of the year on show', () => {
      const onMonthChange = vi.fn();
      render(
        <Calendar
          locale="en-US"
          defaultMonth={NOV_2026}
          onMonthChange={onMonthChange}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'November 2026' }));
      fireEvent.click(screen.getByRole('option', { name: '2026' }));
      expect(onMonthChange).not.toHaveBeenCalled();
    });

    it('moves a held month only when the caller passes it', () => {
      const onMonthChange = vi.fn();
      const { container, rerender } = render(
        <Calendar
          locale="en-US"
          month={NOV_2026}
          defaultValue={new Date(2026, 10, 30)}
          onMonthChange={onMonthChange}
        />
      );
      key(tabStop(container)!, 'ArrowRight');
      expect(onMonthChange).toHaveBeenCalledWith(new Date(2026, 11, 1));
      // The month stays, and focus stays where it was.
      expect(screen.getByRole('grid')).toHaveAccessibleName('November 2026');
      expect(tabStop(container)).toHaveAccessibleName(/November 30, 2026/);
      key(tabStop(container)!, 'ArrowDown');
      expect(tabStop(container)).toHaveAccessibleName(/November 30, 2026/);
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(tabStop(container)).toHaveAccessibleName(/November 30, 2026/);
      // Once the caller passes the month, focus lands where the move asked.
      key(tabStop(container)!, 'ArrowRight');
      rerender(
        <Calendar
          locale="en-US"
          month={new Date(2026, 11, 15)}
          defaultValue={new Date(2026, 10, 30)}
          onMonthChange={onMonthChange}
        />
      );
      expect(screen.getByRole('grid')).toHaveAccessibleName('December 2026');
      expect(tabStop(container)).toHaveAccessibleName(/December 1, 2026/);
    });

    it('puts focus on the near end of a month the caller turns to', () => {
      const { container, rerender } = render(
        <Calendar
          locale="en-US"
          month={NOV_2026}
          defaultValue={new Date(2026, 10, 18)}
        />
      );
      rerender(
        <Calendar
          locale="en-US"
          month={new Date(2027, 5, 1)}
          defaultValue={new Date(2026, 10, 18)}
        />
      );
      expect(tabStop(container)).toHaveAccessibleName(/June 1, 2027/);
      rerender(
        <Calendar
          locale="en-US"
          month={new Date(2026, 0, 1)}
          defaultValue={new Date(2026, 10, 18)}
        />
      );
      expect(tabStop(container)).toHaveAccessibleName(/January 31, 2026/);
    });

    it('reads a value in another month as the nearest day on show', () => {
      const { container } = render(
        <Calendar
          locale="en-US"
          month={NOV_2026}
          defaultValue={new Date(2027, 2, 9)}
        />
      );
      expect(tabStop(container)).toHaveAccessibleName(/November 30, 2026/);
    });

    it('starts focus over from month as granularity changes', () => {
      const { container, rerender } = render(
        <Calendar locale="en-US" month={new Date(2024, 5, 1)} />
      );
      rerender(
        <Calendar
          locale="en-US"
          granularity="year"
          month={new Date(2030, 0, 1)}
        />
      );
      expect(
        container.querySelector('[data-focused-year="true"]')
      ).toHaveTextContent('2030');
    });

    it('is named by a labeled Field around it', () => {
      render(
        <Field label="Check-in">
          <Calendar locale="en-US" defaultMonth={NOV_2026} />
        </Field>
      );
      expect(screen.getByRole('group', { name: 'Check-in' })).toHaveClass(
        'calendar'
      );
    });

    it('puts focus back on the grid as the year list closes', () => {
      const { container } = render(
        <Calendar locale="en-US" defaultValue={new Date(2026, 10, 18)} />
      );
      const trigger = screen.getByRole('button', { name: 'November 2026' });
      trigger.focus();
      fireEvent.click(trigger);
      // The list focuses the current year as it opens.
      expect(document.activeElement).toHaveTextContent('2026');
      fireEvent.click(screen.getByRole('option', { name: '2028' }));
      expect(document.activeElement).toBe(tabStop(container));
      expect(document.activeElement).toHaveAccessibleName(/November 18, 2028/);
      // Escape goes back too.
      fireEvent.click(screen.getByRole('button', { name: 'November 2028' }));
      key(document.activeElement!, 'Escape');
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(document.activeElement).toBe(tabStop(container));
    });

    it('keeps focus on the grid as the month turns under the keys', () => {
      const { container } = render(
        <Calendar locale="en-US" defaultValue={new Date(2026, 10, 30)} />
      );
      tabStop(container)!.focus();
      key(tabStop(container)!, 'ArrowRight');
      expect(document.activeElement).toHaveAccessibleName(/December 1, 2026/);
    });

    it('stops the header at min and max', () => {
      render(
        <Calendar
          locale="en-US"
          defaultMonth={NOV_2026}
          min={new Date(2026, 10, 5)}
          max={new Date(2026, 11, 20)}
        />
      );
      expect(
        screen.getByRole('button', { name: 'Previous month' })
      ).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    });
  });

  describe('several months', () => {
    it('shows monthsToShow grids, each named by its month', () => {
      const { container } = render(
        <Calendar locale="en-US" monthsToShow={3} defaultMonth={NOV_2026} />
      );
      expect(gridNames(container)).toEqual([
        'November 2026',
        'December 2026',
        'January 2027',
      ]);
      const headers = container.querySelectorAll('.dateinput-header');
      // The previous button on the first month, the next on the last.
      expect(
        within(headers[0] as HTMLElement).getByRole('button', {
          name: 'Previous month',
        })
      ).toBeInTheDocument();
      expect(headers[0].querySelector('.dateinput-nav-next')).toBeNull();
      expect(headers[1].querySelector('button')).toBeNull();
      expect(
        within(headers[2] as HTMLElement).getByRole('button', {
          name: 'Next month',
        })
      ).toBeInTheDocument();
    });

    it('rounds monthsToShow down, and reads less than two as one', () => {
      const { container, rerender } = render(
        <Calendar monthsToShow={2.7} defaultMonth={NOV_2026} />
      );
      expect(grids(container)).toHaveLength(2);
      for (const n of [0, -3, Number.NaN, Number.POSITIVE_INFINITY]) {
        rerender(<Calendar monthsToShow={n} defaultMonth={NOV_2026} />);
        expect(grids(container)).toHaveLength(1);
      }
    });

    it('pages every month by monthsToShow', () => {
      const onMonthChange = vi.fn();
      const { container } = render(
        <Calendar
          locale="en-US"
          monthsToShow={2}
          defaultValue={new Date(2026, 11, 10)}
          defaultMonth={NOV_2026}
          onMonthChange={onMonthChange}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(onMonthChange).toHaveBeenCalledWith(new Date(2027, 0, 1));
      expect(gridNames(container)).toEqual(['January 2027', 'February 2027']);
      // Focus keeps its place on the page: the second month's day.
      expect(tabStop(container)).toHaveAccessibleName(/February 10, 2027/);
      fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
      expect(gridNames(container)).toEqual(['November 2026', 'December 2026']);
    });

    it('pages no further than min and max allow a whole page', () => {
      const { container } = render(
        <Calendar
          locale="en-US"
          monthsToShow={2}
          defaultMonth={new Date(2026, 8, 1)}
          min={new Date(2026, 7, 10)}
          max={new Date(2026, 11, 5)}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
      expect(gridNames(container)).toEqual(['August 2026', 'September 2026']);
      expect(
        screen.getByRole('button', { name: 'Previous month' })
      ).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(gridNames(container)).toEqual(['November 2026', 'December 2026']);
      expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    });

    it('crosses from one month into the next with the arrows', () => {
      const onMonthChange = vi.fn();
      const { container } = render(
        <Calendar
          locale="en-US"
          monthsToShow={2}
          defaultValue={new Date(2026, 10, 30)}
          onMonthChange={onMonthChange}
        />
      );
      tabStop(container)!.focus();
      key(tabStop(container)!, 'ArrowRight');
      // December is on show already, so nothing turns.
      expect(onMonthChange).not.toHaveBeenCalled();
      expect(document.activeElement).toHaveAccessibleName(/December 1, 2026/);
      expect(grids(container)[1]).toContainElement(
        document.activeElement as HTMLElement
      );
      // One Calendar, one tab stop.
      expect(
        container.querySelectorAll('[role="gridcell"][tabindex="0"]')
      ).toHaveLength(1);
      // Past the last month, its month comes in as the first.
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      onMonthChange.mockClear();
      key(tabStop(container)!, 'End');
      key(tabStop(container)!, 'PageDown');
      expect(onMonthChange).toHaveBeenCalledWith(new Date(2027, 2, 1));
      expect(gridNames(container)).toEqual(['March 2027', 'April 2027']);
    });

    it('brings a month before the first in as the last', () => {
      const onMonthChange = vi.fn();
      const { container } = render(
        <Calendar
          locale="en-US"
          monthsToShow={2}
          defaultValue={new Date(2026, 10, 1)}
          onMonthChange={onMonthChange}
        />
      );
      key(tabStop(container)!, 'ArrowLeft');
      expect(onMonthChange).toHaveBeenCalledWith(new Date(2026, 8, 1));
      expect(gridNames(container)).toEqual(['September 2026', 'October 2026']);
      expect(tabStop(container)).toHaveAccessibleName(/October 31, 2026/);
    });

    it('keeps a tab stop in another month when the focused one is all disabled', () => {
      const { container } = render(
        <Calendar
          locale="en-US"
          monthsToShow={2}
          defaultMonth={new Date(2026, 11, 1)}
          defaultValue={new Date(2026, 11, 13)}
          shouldDisableDate={date => date.getMonth() === 11}
        />
      );
      expect(tabStop(container)).toHaveAccessibleName(/January 1, 2027/);
      expect(tabStop(container)).toBeEnabled();
    });

    it("marks and keeps the first month's year in the year list", () => {
      const { container } = render(
        <Calendar
          locale="en-US"
          monthsToShow={2}
          defaultMonth={new Date(2026, 11, 1)}
          defaultValue={new Date(2027, 0, 5)}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'December 2026' }));
      expect(screen.getByRole('option', { selected: true })).toHaveTextContent(
        '2026'
      );
      // The year on show changes nothing.
      fireEvent.click(screen.getByRole('option', { name: '2026' }));
      expect(gridNames(container)).toEqual(['December 2026', 'January 2027']);
      fireEvent.click(screen.getByRole('button', { name: 'December 2026' }));
      fireEvent.click(screen.getByRole('option', { name: '2028' }));
      expect(gridNames(container)).toEqual(['December 2028', 'January 2029']);
      expect(tabStop(container)).toHaveAccessibleName(/January 5, 2029/);
    });

    it("turns to a nearby month's day when it's clicked", () => {
      const onChange = vi.fn();
      const { container } = render(
        <Calendar
          locale="en-US"
          monthsToShow={2}
          defaultMonth={new Date(2026, 11, 1)}
          onChange={onChange}
        />
      );
      // December's grid opens on November's last days.
      const [first] = grids(container);
      const nov29 = within(first).getByRole('gridcell', {
        name: /November 29, 2026/,
      });
      fireEvent.click(nov29);
      expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 29));
      expect(gridNames(container)).toEqual(['October 2026', 'November 2026']);
    });

    it("hides a nearby month's days where their own month is on show", () => {
      const { container } = render(
        <Calendar locale="en-US" monthsToShow={2} defaultMonth={NOV_2026} />
      );
      const [nov, dec] = grids(container);
      // November's last week runs into December, which shows them itself.
      const dec1 = Array.from(
        nov.querySelectorAll<HTMLElement>('.is-other-month')
      ).find(c => c.textContent === '1')!;
      expect(dec1).toBeDisabled();
      expect(dec1).toHaveStyle({ visibility: 'hidden' });
      expect(
        screen.getAllByRole('gridcell', { name: /December 1, 2026/ })
      ).toEqual([
        within(dec).getByRole('gridcell', { name: /December 1, 2026/ }),
      ]);
      // January's first days still show under December, dimmed.
      expect(
        within(dec).getByRole('gridcell', { name: /January 2, 2027/ })
      ).toHaveClass('is-other-month');
    });

    it("keeps a range's preview as the pointer crosses between months", () => {
      const { container } = render(
        <Calendar
          locale="en-US"
          selectionMode="range"
          monthsToShow={2}
          defaultMonth={NOV_2026}
        />
      );
      fireEvent.click(day('November 20, 2026'));
      fireEvent.mouseOver(day('November 28, 2026'));
      expect(day('November 28, 2026')).toHaveClass('is-preview');
      // Out of November's grid into the gap between the months.
      const months = container.querySelector('.calendar-months')!;
      fireEvent.mouseOut(grids(container)[0], { relatedTarget: months });
      expect(day('November 28, 2026')).toHaveClass('is-preview');
      // Out of the months altogether.
      fireEvent.mouseOut(months, { relatedTarget: document.body });
      expect(day('November 28, 2026')).not.toHaveClass('is-preview');
    });

    it('shows only the first month while the year list is open', () => {
      const { container } = render(
        <Calendar locale="en-US" monthsToShow={2} defaultMonth={NOV_2026} />
      );
      fireEvent.click(screen.getByRole('button', { name: 'November 2026' }));
      expect(container.querySelectorAll('.dateinput')).toHaveLength(1);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
      fireEvent.click(screen.getByRole('option', { name: '2030' }));
      expect(gridNames(container)).toEqual(['November 2030', 'December 2030']);
    });
  });

  describe('month and year granularity', () => {
    it('shows the year of month, and reports a new year as its 1 January', () => {
      const onMonthChange = vi.fn();
      const { container } = render(
        <Calendar
          locale="en-US"
          granularity="month"
          monthsToShow={3}
          defaultMonth={new Date(2026, 10, 15)}
          onMonthChange={onMonthChange}
        />
      );
      expect(grids(container)).toHaveLength(1);
      expect(gridNames(container)).toEqual(['2026']);
      fireEvent.click(screen.getByRole('button', { name: 'Next year' }));
      expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2027, 0, 1));
      expect(gridNames(container)).toEqual(['2027']);
      // Down from the last row crosses into the next year.
      const stop = tabStop(container)!;
      key(stop, 'End');
      key(tabStop(container)!, 'ArrowDown');
      key(tabStop(container)!, 'ArrowDown');
      key(tabStop(container)!, 'ArrowDown');
      key(tabStop(container)!, 'ArrowDown');
      expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2028, 0, 1));
      onMonthChange.mockClear();
      // A move inside the year changes nothing.
      key(tabStop(container)!, 'ArrowLeft');
      expect(onMonthChange).not.toHaveBeenCalled();
      // The year list as navigation.
      fireEvent.click(screen.getByRole('button', { name: '2028' }));
      fireEvent.click(screen.getByRole('option', { name: '2031' }));
      expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2031, 0, 1));
    });

    it("holds the year on show at month granularity until it's passed", () => {
      const onMonthChange = vi.fn();
      const { container } = render(
        <Calendar
          locale="en-US"
          granularity="month"
          month={new Date(2026, 0, 1)}
          defaultValue={new Date(2030, 4, 1)}
          onMonthChange={onMonthChange}
        />
      );
      // A value in another year reads as the same month of the year on show.
      expect(gridNames(container)).toEqual(['2026']);
      expect(tabStop(container)).toHaveAccessibleName('December');
      fireEvent.click(screen.getByRole('button', { name: 'Previous year' }));
      expect(onMonthChange).toHaveBeenCalledWith(new Date(2025, 0, 1));
      expect(gridNames(container)).toEqual(['2026']);
    });

    it('opens the year list on the year of month, and never calls onMonthChange', () => {
      const onMonthChange = vi.fn();
      const onChange = vi.fn();
      const { container } = render(
        <Calendar
          locale="en-US"
          granularity="year"
          month={new Date(2031, 5, 1)}
          defaultValue={new Date(2020, 0, 1)}
          onMonthChange={onMonthChange}
          onChange={onChange}
        />
      );
      const focused = container.querySelector('[data-focused-year="true"]');
      expect(focused).toHaveTextContent('2031');
      key(focused!, 'ArrowRight');
      fireEvent.click(screen.getByRole('option', { name: '2033' }));
      expect(onChange).toHaveBeenCalledWith(new Date(2033, 0, 1));
      expect(onMonthChange).not.toHaveBeenCalled();
    });
  });

  describe('loading', () => {
    it('marks the grids busy and keeps focus where it was', () => {
      const { container, rerender } = render(
        <Calendar locale="en-US" monthsToShow={2} defaultMonth={NOV_2026} />
      );
      for (const g of grids(container))
        expect(g).not.toHaveAttribute('aria-busy');
      tabStop(container)!.focus();
      const focused = document.activeElement;
      rerender(
        <Calendar
          locale="en-US"
          monthsToShow={2}
          defaultMonth={NOV_2026}
          loading
        />
      );
      for (const g of grids(container)) {
        expect(g).toHaveAttribute('aria-busy', 'true');
      }
      expect(document.activeElement).toBe(focused);
    });

    it('marks the month grid busy too', () => {
      const { container } = render(
        <Calendar granularity="month" defaultMonth={NOV_2026} loading />
      );
      expect(grids(container)[0]).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('a value that does not fit selectionMode', () => {
    it('warns once and shows nothing picked', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const asSingle = {
          value: [new Date(2026, 10, 3), null],
        } as unknown as CalendarSingleProps;
        const { unmount } = render(
          <Calendar locale="en-US" defaultMonth={NOV_2026} {...asSingle} />
        );
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toMatch(/isn't a Date/);
        expect(screen.queryAllByRole('gridcell', { selected: true })).toEqual(
          []
        );
        unmount();
        const asRange = {
          selectionMode: 'range',
          defaultValue: new Date(2026, 10, 3),
        } as unknown as CalendarProps;
        render(
          <Calendar locale="en-US" defaultMonth={NOV_2026} {...asRange} />
        );
        expect(warn).toHaveBeenCalledTimes(2);
        expect(warn.mock.calls[1][0]).toMatch(/\[start, end\] pair/);
        expect(screen.queryAllByRole('gridcell', { selected: true })).toEqual(
          []
        );
      } finally {
        warn.mockRestore();
      }
    });
  });

  it('follows bounds that change after mount', () => {
    const { container, rerender } = render(
      <Calendar locale="en-US" defaultValue={new Date(2026, 10, 20)} />
    );
    rerender(
      <Calendar
        locale="en-US"
        defaultValue={new Date(2026, 10, 20)}
        max={new Date(2026, 10, 12)}
      />
    );
    expect(tabStop(container)).toHaveAccessibleName(/November 12, 2026/);
  });

  it('works as an agenda: a held value and month together', () => {
    const Agenda = () => {
      const [value, setValue] = useState<Date | null>(null);
      const [month, setMonth] = useState(NOV_2026);
      return (
        <>
          <Calendar
            locale="en-US"
            value={value}
            onChange={setValue}
            month={month}
            onMonthChange={setMonth}
          />
          <output>{value ? value.toDateString() : 'none'}</output>
          <button type="button" onClick={() => setMonth(new Date(2027, 5, 1))}>
            June
          </button>
        </>
      );
    };
    render(<Agenda />);
    fireEvent.click(day('November 20, 2026'));
    expect(screen.getByRole('status')).toHaveTextContent('Fri Nov 20 2026');
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('grid')).toHaveAccessibleName('December 2026');
    fireEvent.click(screen.getByRole('button', { name: 'June' }));
    expect(screen.getByRole('grid')).toHaveAccessibleName('June 2027');
  });
});
