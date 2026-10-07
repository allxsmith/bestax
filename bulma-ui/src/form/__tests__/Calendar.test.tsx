import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { Calendar, CalendarProps } from '../_pickerInternals/Calendar';
import { makeDate } from '../_pickerInternals/dateUtils';

const June15_2024 = new Date(2024, 5, 15);

/** The props of a calendar that picks one date. */
type SingleProps = Extract<CalendarProps, { onSelect: (d: Date) => void }>;

const Harness: React.FC<Partial<SingleProps>> = props => {
  const [focused, setFocused] = React.useState(June15_2024);
  const [value, setValue] = React.useState<Date | null>(null);
  return (
    <Calendar
      value={value}
      focusedDate={focused}
      onSelect={d => {
        setValue(d);
        props.onSelect?.(d);
      }}
      onFocusedDateChange={d => {
        setFocused(d);
        props.onFocusedDateChange?.(d);
      }}
      {...props}
    />
  );
};

describe('Calendar', () => {
  it('renders 42 cells', () => {
    const { container } = render(<Harness />);
    expect(container.querySelectorAll('[role="gridcell"]').length).toBe(42);
  });

  it('groups the days into rows of a week', () => {
    // A grid owns rows, and rows own cells, so assistive technology can walk
    // the grid, and the days it marks selected, row by row.
    const { container } = render(<Harness />);
    const grid = container.querySelector('[role="grid"]')!;
    const rows = Array.from(grid.children);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row).toHaveAttribute('role', 'row');
      expect(row).toHaveClass('dateinput-week');
      expect(row.querySelectorAll(':scope > [role="gridcell"]')).toHaveLength(
        7
      );
    }
    expect(grid.querySelectorAll('[role="gridcell"]')).toHaveLength(
      rows.length * 7
    );
  });

  it('renders 7 day name headers', () => {
    const { container } = render(<Harness />);
    expect(
      container.querySelectorAll(
        '[class*="dateinput-day-name"]:not([class*="dateinput-day-names"])'
      ).length
    ).toBe(7);
  });

  it('marks today with aria-current="date"', () => {
    const today = new Date();
    const { container } = render(<Harness focusedDate={today} />);
    const todayCell = container.querySelector('[aria-current="date"]');
    expect(todayCell).not.toBeNull();
    expect(Number(todayCell!.textContent)).toBe(today.getDate());
  });

  it('selecting via click fires onSelect', () => {
    const onSelect = jest.fn();
    const { container } = render(<Harness onSelect={onSelect} />);
    const cells = container.querySelectorAll('[role="gridcell"]');
    fireEvent.click(cells[10]);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('keyboard ArrowRight moves focusedDate +1 day', () => {
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <Harness onFocusedDateChange={onFocusedDateChange} />
    );
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'ArrowRight',
    });
    expect(onFocusedDateChange).toHaveBeenCalled();
    const arg: Date = onFocusedDateChange.mock.calls[0][0];
    expect(arg.getDate()).toBe(16);
  });

  it('keyboard ArrowDown moves +7 days', () => {
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <Harness onFocusedDateChange={onFocusedDateChange} />
    );
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'ArrowDown',
    });
    const arg: Date = onFocusedDateChange.mock.calls[0][0];
    expect(arg.getDate()).toBe(22);
  });

  it('ArrowRight skips disabled weekend in one keypress (Fri -> Mon)', () => {
    // June 14, 2024 is a Friday. With Sat+Sun disabled, ArrowRight should
    // land on Monday June 17 in a single keypress, not on Saturday.
    const onFocusedDateChange = jest.fn();
    const friday = new Date(2024, 5, 14);
    const { container } = render(
      <Harness
        focusedDate={friday}
        shouldDisableDate={d => d.getDay() === 0 || d.getDay() === 6}
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'ArrowRight',
    });
    expect(onFocusedDateChange).toHaveBeenCalledTimes(1);
    const arg: Date = onFocusedDateChange.mock.calls[0][0];
    expect(arg.getDate()).toBe(17);
    expect(arg.getDay()).toBe(1); // Monday
  });

  it('ArrowLeft skips disabled weekend in one keypress (Mon -> Fri)', () => {
    const onFocusedDateChange = jest.fn();
    const monday = new Date(2024, 5, 17);
    const { container } = render(
      <Harness
        focusedDate={monday}
        shouldDisableDate={d => d.getDay() === 0 || d.getDay() === 6}
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'ArrowLeft',
    });
    expect(onFocusedDateChange).toHaveBeenCalledTimes(1);
    const arg: Date = onFocusedDateChange.mock.calls[0][0];
    expect(arg.getDate()).toBe(14);
    expect(arg.getDay()).toBe(5); // Friday
  });

  it('Arrow keys leave focus put when range is entirely disabled', () => {
    // With min and max both pointing at the only disabled date, there is no
    // valid neighbour to move to. Focus should stay where it is.
    const onFocusedDateChange = jest.fn();
    const day = new Date(2024, 5, 15);
    const { container } = render(
      <Harness
        focusedDate={day}
        min={day}
        max={day}
        shouldDisableDate={() => true}
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'ArrowRight',
    });
    expect(onFocusedDateChange).not.toHaveBeenCalled();
  });

  it('PageUp without shift moves -1 month', () => {
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <Harness onFocusedDateChange={onFocusedDateChange} />
    );
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'PageUp',
    });
    const arg: Date = onFocusedDateChange.mock.calls[0][0];
    expect(arg.getMonth()).toBe(4); // May
  });

  it('Shift+PageUp moves -1 year', () => {
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <Harness onFocusedDateChange={onFocusedDateChange} />
    );
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'PageUp',
      shiftKey: true,
    });
    const arg: Date = onFocusedDateChange.mock.calls[0][0];
    expect(arg.getFullYear()).toBe(2023);
  });

  it('Enter on focused selects', () => {
    const onSelect = jest.fn();
    const { container } = render(<Harness onSelect={onSelect} />);
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'Enter',
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('disables out-of-range cells via min/max', () => {
    const { container } = render(
      <Harness min={new Date(2024, 5, 10)} max={new Date(2024, 5, 20)} />
    );
    const cells = container.querySelectorAll('[role="gridcell"]');
    const disabledCount = Array.from(cells).filter(c =>
      c.hasAttribute('disabled')
    ).length;
    expect(disabledCount).toBeGreaterThan(0);
  });

  it('reads a min and max in a year below 100 as given', () => {
    const { container } = render(
      <Harness
        focusedDate={makeDate(19, 5, 15)}
        min={makeDate(19, 5, 10)}
        max={makeDate(19, 5, 20)}
      />
    );
    const enabled = Array.from(
      container.querySelectorAll('[role="gridcell"]')
    ).filter(c => c.getAttribute('aria-disabled') === 'false');
    expect(enabled.map(c => Number(c.textContent))).toEqual([
      10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ]);
  });

  describe('before year 1', () => {
    // 1 January of year 1 is a Monday, so a Sunday-first grid opens on
    // 31 December of year 0.
    const yearZeroCell = (container: HTMLElement) =>
      Array.from(container.querySelectorAll('[role="gridcell"]')).find(
        c => c.textContent === '31' && c.className.includes('is-other-month')
      ) as HTMLButtonElement;
    const firstOfYearOne = (container: HTMLElement) =>
      Array.from(container.querySelectorAll('[role="gridcell"]')).find(
        c => c.textContent === '1' && !c.className.includes('is-other-month')
      ) as HTMLButtonElement;

    it('selects a day in year 1 and disables the days before it', () => {
      const onSelect = jest.fn();
      const { container, getByLabelText } = render(
        <PeriodHarness focusedDate={makeDate(1, 0, 15)} onSelect={onSelect} />
      );
      expect(yearZeroCell(container)).toBeDisabled();
      expect(getByLabelText('Previous month')).toBeDisabled();
      fireEvent.click(firstOfYearOne(container));
      expect(onSelect).toHaveBeenCalledWith(makeDate(1, 0, 1));
    });

    it('keeps keyboard focus from leaving year 1 backwards', () => {
      const onFocusedDateChange = jest.fn();
      const { container } = render(
        <PeriodHarness
          focusedDate={makeDate(1, 0, 1)}
          onFocusedDateChange={onFocusedDateChange}
        />
      );
      const grid = container.querySelector('[role="grid"]')!;
      fireEvent.keyDown(grid, { key: 'ArrowLeft' });
      fireEvent.keyDown(grid, { key: 'PageUp' });
      expect(onFocusedDateChange).not.toHaveBeenCalled();
    });

    it('reads a min in year 0 or a negative year as the start of year 1', () => {
      for (const min of [makeDate(0, 6, 1), makeDate(-5, 0, 1)]) {
        const { container, getByLabelText, unmount } = render(
          <PeriodHarness focusedDate={makeDate(1, 0, 15)} min={min} />
        );
        expect(yearZeroCell(container)).toBeDisabled();
        expect(firstOfYearOne(container)).not.toBeDisabled();
        expect(getByLabelText('Previous month')).toBeDisabled();
        unmount();
      }
    });

    it('steps no further back from a month already before min', () => {
      const cases: [Date, Date | undefined][] = [
        // No min, so the floor at year 1.
        [makeDate(0, 11, 31), undefined],
        // A day before min in an earlier month, as picking min's year from
        // the year list can leave it.
        [new Date(2024, 2, 15), new Date(2024, 5, 15)],
      ];
      for (const [focusedDate, min] of cases) {
        const { getByLabelText, unmount } = render(
          <PeriodHarness focusedDate={focusedDate} min={min} />
        );
        expect(getByLabelText('Previous month')).toBeDisabled();
        expect(getByLabelText('Next month')).not.toBeDisabled();
        unmount();
      }
    });
  });

  it('steps no further on from a month already after max', () => {
    // As picking max's year from the year list can leave it.
    const { getByLabelText } = render(
      <PeriodHarness
        focusedDate={new Date(2024, 8, 15)}
        max={new Date(2024, 5, 15)}
      />
    );
    expect(getByLabelText('Next month')).toBeDisabled();
    expect(getByLabelText('Previous month')).not.toBeDisabled();
  });

  it('shouldDisableDate predicate disables matching cells', () => {
    const onSelect = jest.fn();
    const { container } = render(
      <Harness
        shouldDisableDate={d => d.getDate() === 15}
        onSelect={onSelect}
      />
    );
    const target = Array.from(
      container.querySelectorAll('[role="gridcell"]')
    ).find(
      c => c.textContent === '15' && !c.hasAttribute('aria-disabled') === false
    );
    expect(target).toBeDefined();
    expect(target!.getAttribute('aria-disabled')).toBe('true');
  });

  it('first day name reflects firstDayOfWeek=1 (Monday)', () => {
    const { container } = render(<Harness firstDayOfWeek={1} locale="en-US" />);
    const firstName = container.querySelectorAll(
      '[class*="dateinput-day-name"]'
    )[0];
    expect(firstName.textContent).toMatch(/Mon/);
  });

  it('clicking the next-month button advances focusedDate', () => {
    const onFocusedDateChange = jest.fn();
    const { getByLabelText } = render(
      <Harness onFocusedDateChange={onFocusedDateChange} />
    );
    fireEvent.click(getByLabelText('Next month'));
    const arg: Date = onFocusedDateChange.mock.calls[0][0];
    expect(arg.getMonth()).toBe(6);
  });

  it('clicking the previous-month button moves focusedDate back', () => {
    const onFocusedDateChange = jest.fn();
    const { getByLabelText } = render(
      <Harness onFocusedDateChange={onFocusedDateChange} />
    );
    fireEvent.click(getByLabelText('Previous month'));
    const arg: Date = onFocusedDateChange.mock.calls[0][0];
    expect(arg.getMonth()).toBe(4);
  });

  it('keyboard ArrowUp moves -7 days', () => {
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <Harness onFocusedDateChange={onFocusedDateChange} />
    );
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'ArrowUp',
    });
    const arg: Date = onFocusedDateChange.mock.calls[0][0];
    expect(arg.getDate()).toBe(8);
    expect(arg.getMonth()).toBe(5);
  });

  it('PageDown without shift moves +1 month', () => {
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <Harness onFocusedDateChange={onFocusedDateChange} />
    );
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'PageDown',
    });
    const arg: Date = onFocusedDateChange.mock.calls[0][0];
    expect(arg.getMonth()).toBe(6); // July
    expect(arg.getFullYear()).toBe(2024);
  });

  it('Shift+PageDown moves +1 year', () => {
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <Harness onFocusedDateChange={onFocusedDateChange} />
    );
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'PageDown',
      shiftKey: true,
    });
    const arg: Date = onFocusedDateChange.mock.calls[0][0];
    expect(arg.getFullYear()).toBe(2025);
    expect(arg.getMonth()).toBe(5);
  });

  it('Home moves to the first day of the week', () => {
    // June 12, 2024 is a Wednesday; with Sunday-first weeks Home lands on
    // Sunday June 9.
    const onFocusedDateChange = jest.fn();
    const wednesday = new Date(2024, 5, 12);
    const { container } = render(
      <Harness
        focusedDate={wednesday}
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'Home',
    });
    const arg: Date = onFocusedDateChange.mock.calls[0][0];
    expect(arg.getDate()).toBe(9);
    expect(arg.getDay()).toBe(0); // Sunday
  });

  it('End moves to the last day of the week', () => {
    // June 12, 2024 is a Wednesday; with Sunday-first weeks End lands on
    // Saturday June 15.
    const onFocusedDateChange = jest.fn();
    const wednesday = new Date(2024, 5, 12);
    const { container } = render(
      <Harness
        focusedDate={wednesday}
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'End',
    });
    const arg: Date = onFocusedDateChange.mock.calls[0][0];
    expect(arg.getDate()).toBe(15);
    expect(arg.getDay()).toBe(6); // Saturday
  });

  it('Home/End respect firstDayOfWeek=1 (Monday-first weeks)', () => {
    const onFocusedDateChange = jest.fn();
    const wednesday = new Date(2024, 5, 12);
    const { container } = render(
      <Harness
        focusedDate={wednesday}
        firstDayOfWeek={1}
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'Home',
    });
    const arg: Date = onFocusedDateChange.mock.calls[0][0];
    expect(arg.getDate()).toBe(10);
    expect(arg.getDay()).toBe(1); // Monday
  });

  it('ArrowUp stays put when the jump would land before min', () => {
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <Harness
        min={new Date(2024, 5, 10)}
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    // June 15 - 7 = June 8, which is before min (June 10).
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'ArrowUp',
    });
    expect(onFocusedDateChange).not.toHaveBeenCalled();
  });

  it('ArrowDown stays put when the jump would land after max', () => {
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <Harness
        max={new Date(2024, 5, 18)}
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    // June 15 + 7 = June 22, which is after max (June 18).
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'ArrowDown',
    });
    expect(onFocusedDateChange).not.toHaveBeenCalled();
  });

  it('Enter does not select when the focused date is unselectable', () => {
    const onSelect = jest.fn();
    const { container } = render(
      <Harness
        shouldDisableDate={d => d.getDate() === 15}
        onSelect={onSelect}
      />
    );
    fireEvent.keyDown(container.querySelector('[role="grid"]')!, {
      key: 'Enter',
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('clicking an unselectable cell does not select or move focus', () => {
    const onSelect = jest.fn();
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <Harness
        shouldDisableDate={d => d.getDate() === 20}
        onSelect={onSelect}
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    const disabledCell = Array.from(
      container.querySelectorAll('[role="gridcell"]')
    ).find(c => c.getAttribute('aria-disabled') === 'true');
    expect(disabledCell).toBeDefined();
    fireEvent.click(disabledCell!);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onFocusedDateChange).not.toHaveBeenCalled();
  });

  it('hides other-month cells when nearbyMonthDays is false', () => {
    const { container } = render(<Harness nearbyMonthDays={false} />);
    const hidden = Array.from(
      container.querySelectorAll('[role="gridcell"]')
    ).filter(c => (c as HTMLElement).style.visibility === 'hidden');
    // June 2024 has 30 days in a 42-cell grid -> 12 hidden neighbours.
    expect(hidden.length).toBe(12);
    hidden.forEach(c => expect(c).toBeDisabled());
  });

  it('marks unselectableDates entries as disabled', () => {
    const { container } = render(
      <Harness unselectableDates={[new Date(2024, 5, 20)]} />
    );
    const cell = Array.from(
      container.querySelectorAll('[role="gridcell"]')
    ).find(
      c => c.textContent === '20' && c.getAttribute('aria-disabled') === 'true'
    );
    expect(cell).toBeDefined();
  });

  it('marks the selected value with aria-selected', () => {
    const { container } = render(<Harness value={new Date(2024, 5, 15)} />);
    const selected = container.querySelector('[aria-selected="true"]');
    expect(selected).not.toBeNull();
    expect(selected!.textContent).toBe('15');
  });

  it('uses provided dayNames and monthNames verbatim', () => {
    const dayNames = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'];
    const monthNames = [
      'M1',
      'M2',
      'M3',
      'M4',
      'M5',
      'M6',
      'M7',
      'M8',
      'M9',
      'M10',
      'M11',
      'M12',
    ];
    const { container, getByText } = render(
      <Harness dayNames={dayNames} monthNames={monthNames} />
    );
    expect(getByText('M6 2024')).toBeInTheDocument();
    const firstName = container.querySelectorAll(
      '[class*="dateinput-day-name"]:not([class*="dateinput-day-names"])'
    )[0];
    expect(firstName.textContent).toBe('D1');
  });

  it('disables prev/next month buttons at the min/max month boundaries', () => {
    const { getByLabelText } = render(
      <Harness min={new Date(2024, 5, 1)} max={new Date(2024, 5, 30)} />
    );
    expect(getByLabelText('Previous month')).toBeDisabled();
    expect(getByLabelText('Next month')).toBeDisabled();
  });

  it('autoFocusCell focuses the focused-date cell after render', () => {
    const { container } = render(<Harness autoFocusCell />);
    const focusedCell = container.querySelector('[data-focused="true"]');
    expect(focusedCell).not.toBeNull();
    expect(document.activeElement).toBe(focusedCell);
  });

  it('wires id to the grid via aria-labelledby', () => {
    const { container } = render(<Harness id="cal" />);
    expect(container.querySelector('#cal')).not.toBeNull();
    expect(
      container.querySelector('[role="grid"]')!.getAttribute('aria-labelledby')
    ).toBe('cal-label');
  });

  describe('year-picker view', () => {
    const scrollIntoViewMock = jest.fn();

    beforeAll(() => {
      HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
    });

    beforeEach(() => {
      scrollIntoViewMock.mockClear();
    });

    const openYearView = (container: HTMLElement) => {
      fireEvent.click(container.querySelector('[aria-haspopup="listbox"]')!);
    };

    it('opens via the month/year header trigger', () => {
      const { container } = render(<Harness />);
      const trigger = container.querySelector('[aria-haspopup="listbox"]')!;
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      openYearView(container as HTMLElement);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(container.querySelector('[role="listbox"]')).not.toBeNull();
      expect(container.querySelector('[role="grid"]')).toBeNull();
    });

    it('renders the min..max year range with the focused year selected', () => {
      const { container } = render(
        <Harness min={new Date(2020, 0, 1)} max={new Date(2030, 11, 31)} />
      );
      openYearView(container as HTMLElement);
      const options = container.querySelectorAll('[role="option"]');
      expect(options.length).toBe(11); // 2020..2030 inclusive
      expect(options[0].textContent).toBe('2020');
      expect(options[10].textContent).toBe('2030');
      const selected = Array.from(options).filter(
        o => o.getAttribute('aria-selected') === 'true'
      );
      expect(selected.length).toBe(1);
      expect(selected[0].textContent).toBe('2024');
      expect(selected[0].getAttribute('tabindex')).toBe('0');
      expect(options[0].getAttribute('tabindex')).toBe('-1');
    });

    it('clamps yearsRange by min/max', () => {
      const { container } = render(
        <Harness
          min={new Date(2022, 0, 1)}
          max={new Date(2026, 11, 31)}
          yearsRange={[2000, 2050]}
        />
      );
      openYearView(container as HTMLElement);
      const options = container.querySelectorAll('[role="option"]');
      expect(options.length).toBe(5); // 2022..2026
      expect(options[0].textContent).toBe('2022');
      expect(options[4].textContent).toBe('2026');
    });

    it('scrolls and focuses the focused year on open', () => {
      const { container } = render(
        <Harness min={new Date(2020, 0, 1)} max={new Date(2030, 11, 31)} />
      );
      openYearView(container as HTMLElement);
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ block: 'center' });
      const focusedYear = container.querySelector(
        '[data-focused-year="true"]'
      )!;
      expect(focusedYear.textContent).toBe('2024');
      expect(document.activeElement).toBe(focusedYear);
    });

    it('renders no selected year when the focused year is outside yearsRange', () => {
      const { container } = render(<Harness yearsRange={[2030, 2032]} />);
      openYearView(container as HTMLElement);
      const options = container.querySelectorAll('[role="option"]');
      expect(options.length).toBe(3); // 2030..2032
      expect(container.querySelector('[aria-selected="true"]')).toBeNull();
      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });

    it('stops the default range at year 1', () => {
      const { container } = render(
        <PeriodHarness focusedDate={makeDate(19, 5, 15)} />
      );
      openYearView(container as HTMLElement);
      const options = container.querySelectorAll('[role="option"]');
      expect(options[0].textContent).toBe('1');
      expect(options[options.length - 1].textContent).toBe('119');
    });

    it('starts at year 1 for a min in year 0 or a negative year', () => {
      for (const min of [makeDate(0, 6, 1), makeDate(-5, 0, 1)]) {
        const { container, unmount } = render(
          <PeriodHarness focusedDate={makeDate(19, 5, 15)} min={min} />
        );
        openYearView(container as HTMLElement);
        expect(container.querySelector('[role="option"]')!.textContent).toBe(
          '1'
        );
        unmount();
      }
    });

    it('disables month nav buttons while the year view is open', () => {
      const { container, getByLabelText } = render(<Harness />);
      openYearView(container as HTMLElement);
      expect(getByLabelText('Previous month')).toBeDisabled();
      expect(getByLabelText('Next month')).toBeDisabled();
    });

    it('selecting a year updates focusedDate and returns to the day view', () => {
      const onFocusedDateChange = jest.fn();
      const { container, getByText } = render(
        <Harness
          min={new Date(2020, 0, 1)}
          max={new Date(2030, 11, 31)}
          onFocusedDateChange={onFocusedDateChange}
          autoFocusCell
        />
      );
      openYearView(container as HTMLElement);
      fireEvent.click(getByText('2027'));
      expect(onFocusedDateChange).toHaveBeenCalledTimes(1);
      const arg: Date = onFocusedDateChange.mock.calls[0][0];
      expect(arg.getFullYear()).toBe(2027);
      expect(arg.getMonth()).toBe(5);
      expect(arg.getDate()).toBe(15);
      // Back in the day view, with focus moved to the focused day cell.
      expect(container.querySelector('[role="grid"]')).not.toBeNull();
      expect(container.querySelector('[role="listbox"]')).toBeNull();
      const focusedCell = container.querySelector('[data-focused="true"]');
      expect(document.activeElement).toBe(focusedCell);
    });

    it('Escape closes the year view back to the day view', () => {
      const { container } = render(<Harness />);
      openYearView(container as HTMLElement);
      const listbox = container.querySelector('[role="listbox"]')!;
      fireEvent.keyDown(listbox, { key: 'a' }); // ignored
      expect(container.querySelector('[role="listbox"]')).not.toBeNull();
      fireEvent.keyDown(listbox, { key: 'Escape' });
      expect(container.querySelector('[role="listbox"]')).toBeNull();
      expect(container.querySelector('[role="grid"]')).not.toBeNull();
    });

    it('clicking the trigger again toggles back to the day view', () => {
      const { container } = render(<Harness />);
      openYearView(container as HTMLElement);
      expect(container.querySelector('[role="listbox"]')).not.toBeNull();
      openYearView(container as HTMLElement);
      expect(container.querySelector('[role="listbox"]')).toBeNull();
      expect(container.querySelector('[role="grid"]')).not.toBeNull();
    });
  });
});

/**
 * A calendar whose focus and value follow its own callbacks, which the
 * `Harness` above gives up once a test passes a handler of its own.
 */
const PeriodHarness: React.FC<
  Partial<SingleProps> & { initialValue?: Date | null }
> = ({
  onSelect,
  onFocusedDateChange,
  focusedDate = June15_2024,
  initialValue = null,
  ...props
}) => {
  const [focused, setFocused] = React.useState(focusedDate);
  const [value, setValue] = React.useState<Date | null>(initialValue);
  return (
    <Calendar
      value={value}
      focusedDate={focused}
      onSelect={d => {
        setValue(d);
        onSelect?.(d);
      }}
      onFocusedDateChange={d => {
        setFocused(d);
        onFocusedDateChange?.(d);
      }}
      {...props}
    />
  );
};

const monthCells = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[role="gridcell"]'));
const monthCell = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[aria-label="${name}"]`)!;
const focusedMonth = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-focused="true"]')!;
const yearOptions = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[role="option"]'));
const yearOption = (container: HTMLElement, year: number) =>
  yearOptions(container).find(o => o.textContent === String(year))!;
const focusedYearOption = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-focused-year="true"]')!;

describe('Calendar month granularity', () => {
  const grid = (container: HTMLElement) =>
    container.querySelector<HTMLElement>('[role="grid"]')!;
  const press = (container: HTMLElement, key: string) =>
    fireEvent.keyDown(grid(container), { key });

  it('shows the focused year as twelve months in rows of three', () => {
    const { container, getByText } = render(
      <PeriodHarness granularity="month" locale="en-US" id="cal" />
    );
    expect(getByText('2024')).toHaveAttribute('id', 'cal-label');
    expect(grid(container)).toHaveAttribute('aria-labelledby', 'cal-label');
    const rows = container.querySelectorAll('[role="row"]');
    expect(rows).toHaveLength(4);
    rows.forEach(row =>
      expect(row.querySelectorAll('[role="gridcell"]')).toHaveLength(3)
    );
    // Short names on the cells, long names for assistive technology.
    const june = monthCell(container, 'June');
    expect(june.textContent).toBe('Jun');
    expect(june).toHaveClass('dateinput-month-cell');
    // No day grid parts.
    expect(container.querySelector('.dateinput-day-names')).toBeNull();
    expect(monthCells(container)).toHaveLength(12);
  });

  it('roves the tab stop to the focused month', () => {
    const { container } = render(<PeriodHarness granularity="month" />);
    const focusable = monthCells(container).filter(c => c.tabIndex === 0);
    expect(focusable).toHaveLength(1);
    expect(focusable[0]).toBe(focusedMonth(container));
    expect(focusable[0]).toHaveAttribute('aria-label', 'June');
  });

  it('selects the month holding the value, and marks the current month', () => {
    const today = new Date();
    const { container } = render(
      <PeriodHarness
        granularity="month"
        focusedDate={today}
        initialValue={new Date(today.getFullYear(), today.getMonth(), 20)}
      />
    );
    const selected = container.querySelectorAll('[aria-selected="true"]');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveClass('is-selected');
    const current = container.querySelector('[aria-current="date"]')!;
    expect(current).toBe(selected[0]);
    expect(current).toHaveClass('is-today');
  });

  it('reports the first of the clicked month and focuses it inside min', () => {
    const onSelect = jest.fn();
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <PeriodHarness
        granularity="month"
        min={new Date(2024, 2, 15)}
        onSelect={onSelect}
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    fireEvent.click(monthCell(container, 'March'));
    expect(onSelect).toHaveBeenCalledWith(new Date(2024, 2, 1));
    // The first is before min, so focus lands on min itself.
    expect(onFocusedDateChange).toHaveBeenCalledWith(new Date(2024, 2, 15));
    expect(monthCell(container, 'March')).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('disables a month only when every day in it is unselectable', () => {
    const { container } = render(
      <PeriodHarness
        granularity="month"
        min={new Date(2024, 2, 15)}
        max={new Date(2024, 9, 10)}
        shouldDisableDate={d => d.getMonth() === 6}
      />
    );
    const disabled = monthCells(container)
      .filter(c => c.hasAttribute('disabled'))
      .map(c => c.getAttribute('aria-label'));
    // Before min, after max, and July, every day of which the predicate
    // blocks. March and October are cut partway, so they stay.
    expect(disabled).toEqual([
      'January',
      'February',
      'July',
      'November',
      'December',
    ]);
    const july = monthCell(container, 'July');
    expect(july).toHaveAttribute('aria-disabled', 'true');
    expect(july).toHaveClass('is-disabled');
  });

  it('keeps the month of a min set late on its last day', () => {
    const { container } = render(
      <PeriodHarness granularity="month" min={new Date(2024, 5, 30, 15, 0)} />
    );
    expect(monthCell(container, 'June')).not.toBeDisabled();
    expect(monthCell(container, 'May')).toBeDisabled();
  });

  it.each([
    ['ArrowRight', 2024, 6],
    ['ArrowLeft', 2024, 4],
    ['ArrowDown', 2024, 8],
    ['ArrowUp', 2024, 2],
    ['PageDown', 2025, 5],
    ['PageUp', 2023, 5],
  ])('%s moves focus to %i-%i', (key, year, month) => {
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <PeriodHarness
        granularity="month"
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    const event = press(container, key);
    expect(event).toBe(false); // default prevented
    const arg: Date = onFocusedDateChange.mock.calls[0][0];
    expect([arg.getFullYear(), arg.getMonth()]).toEqual([year, month]);
  });

  it('Home and End go to the ends of the focused row', () => {
    const { container } = render(
      <PeriodHarness granularity="month" focusedDate={new Date(2024, 4, 15)} />
    );
    press(container, 'Home');
    expect(focusedMonth(container)).toHaveAttribute('aria-label', 'April');
    press(container, 'End');
    expect(focusedMonth(container)).toHaveAttribute('aria-label', 'June');
  });

  it('crosses into the next year from December', () => {
    const { container, getByText } = render(
      <PeriodHarness granularity="month" focusedDate={new Date(2024, 11, 1)} />
    );
    press(container, 'ArrowRight');
    expect(getByText('2025')).toBeInTheDocument();
    expect(focusedMonth(container)).toHaveAttribute('aria-label', 'January');
  });

  it('skips months with no selectable day', () => {
    const { container } = render(
      <PeriodHarness
        granularity="month"
        shouldDisableDate={d => d.getMonth() === 6}
      />
    );
    press(container, 'ArrowRight');
    expect(focusedMonth(container)).toHaveAttribute('aria-label', 'August');
  });

  it('stays put at the min and max months', () => {
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <PeriodHarness
        granularity="month"
        min={new Date(2024, 5, 20)}
        max={new Date(2024, 5, 25)}
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    press(container, 'ArrowLeft');
    press(container, 'ArrowRight');
    expect(onFocusedDateChange).not.toHaveBeenCalled();
  });

  it('gives up when no month nearby has a selectable day', () => {
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <PeriodHarness
        granularity="month"
        shouldDisableDate={() => true}
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    press(container, 'ArrowRight');
    expect(onFocusedDateChange).not.toHaveBeenCalled();
  });

  it('ignores keys the grid does not handle', () => {
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <PeriodHarness
        granularity="month"
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    expect(press(container, 'a')).toBe(true); // not prevented
    expect(onFocusedDateChange).not.toHaveBeenCalled();
  });

  it.each(['Enter', ' '])('%p selects the first of the focused month', key => {
    const onSelect = jest.fn();
    const { container } = render(
      <PeriodHarness granularity="month" onSelect={onSelect} />
    );
    press(container, key);
    expect(onSelect).toHaveBeenCalledWith(new Date(2024, 5, 1));
  });

  it('Enter does not select a month with no selectable day', () => {
    const onSelect = jest.fn();
    const { container } = render(
      <PeriodHarness
        granularity="month"
        shouldDisableDate={() => true}
        onSelect={onSelect}
      />
    );
    press(container, 'Enter');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('steps a year with the header buttons, kept inside min and max', () => {
    const { container, getByLabelText, getByText } = render(
      <PeriodHarness
        granularity="month"
        focusedDate={new Date(2025, 0, 10)}
        min={new Date(2024, 5, 15)}
        max={new Date(2026, 1, 1)}
      />
    );
    expect(getByLabelText('Previous year')).not.toBeDisabled();
    fireEvent.click(getByLabelText('Previous year'));
    expect(getByText('2024')).toBeInTheDocument();
    // January 2024 is before min, so focus lands in June.
    expect(focusedMonth(container)).toHaveAttribute('aria-label', 'June');
    expect(getByLabelText('Previous year')).toBeDisabled();

    fireEvent.click(getByLabelText('Next year'));
    fireEvent.click(getByLabelText('Next year'));
    expect(getByText('2026')).toBeInTheDocument();
    // June 2026 is after max, so focus lands in February.
    expect(focusedMonth(container)).toHaveAttribute('aria-label', 'February');
    expect(getByLabelText('Next year')).toBeDisabled();
  });

  it('names the header buttons from labels', () => {
    const { getByLabelText } = render(
      <PeriodHarness
        granularity="month"
        labels={{ prevYear: 'Année précédente', nextYear: 'Année suivante' }}
      />
    );
    expect(getByLabelText('Année précédente')).toBeInTheDocument();
    expect(getByLabelText('Année suivante')).toBeInTheDocument();
  });

  describe('tab stop', () => {
    const tabStop = (container: HTMLElement) =>
      monthCells(container).filter(c => c.tabIndex === 0);

    it.each([
      ['the later neighbour', [5], 5, 'July'],
      ['the earlier one when the later is out too', [5, 6], 5, 'May'],
      ['back from December', [11], 11, 'November'],
      ['on from January past a blocked February', [0, 1], 0, 'March'],
    ])(
      'moves off a disabled focused month to %s',
      (_case, blocked, focused, expected) => {
        const { container } = render(
          <PeriodHarness
            granularity="month"
            focusedDate={new Date(2024, focused, 15)}
            shouldDisableDate={d => blocked.includes(d.getMonth())}
          />
        );
        const stops = tabStop(container);
        expect(stops).toHaveLength(1);
        expect(stops[0]).toHaveAttribute('aria-label', expected);
        expect(stops[0]).not.toBeDisabled();
      }
    );

    it('makes the month Tab reaches the focused one, so keys move from it', () => {
      const onFocusedDateChange = jest.fn();
      const onSelect = jest.fn();
      const { container } = render(
        <PeriodHarness
          granularity="month"
          shouldDisableDate={d => d.getMonth() === 5}
          onFocusedDateChange={onFocusedDateChange}
          onSelect={onSelect}
        />
      );
      act(() => tabStop(container)[0].focus());
      expect(onFocusedDateChange).toHaveBeenCalledWith(new Date(2024, 6, 1));
      press(container, 'ArrowRight');
      expect(document.activeElement).toHaveAttribute('aria-label', 'August');
      press(container, 'Enter');
      expect(onSelect).toHaveBeenCalledWith(new Date(2024, 7, 1));
    });

    it('stays on the focused month when every month is disabled', () => {
      const { container } = render(
        <PeriodHarness granularity="month" shouldDisableDate={() => true} />
      );
      expect(tabStop(container)[0]).toHaveAttribute('aria-label', 'June');
    });
  });

  it('stops stepping back at year 1', () => {
    for (const min of [undefined, makeDate(0, 6, 1), makeDate(-5, 0, 1)]) {
      const onSelect = jest.fn();
      const { container, getByLabelText, unmount } = render(
        <PeriodHarness
          granularity="month"
          focusedDate={makeDate(1, 5, 15)}
          min={min}
          onSelect={onSelect}
        />
      );
      expect(getByLabelText('Previous year')).toBeDisabled();
      fireEvent.click(monthCell(container, 'January'));
      expect(onSelect).toHaveBeenCalledWith(makeDate(1, 0, 1));
      unmount();
    }
  });

  it('keeps a year below 100 when a month is picked', () => {
    const early = new Date(2024, 5, 15);
    early.setFullYear(19);
    const onSelect = jest.fn();
    const { container, getByText } = render(
      <PeriodHarness
        granularity="month"
        focusedDate={early}
        onSelect={onSelect}
      />
    );
    expect(getByText('19')).toBeInTheDocument();
    fireEvent.click(monthCell(container, 'March'));
    const picked: Date = onSelect.mock.calls[0][0];
    expect([picked.getFullYear(), picked.getMonth()]).toEqual([19, 2]);
  });

  it('reads a min in a year below 100 as given', () => {
    const { container } = render(
      <PeriodHarness
        granularity="month"
        focusedDate={makeDate(19, 5, 15)}
        min={makeDate(19, 5, 30)}
      />
    );
    expect(monthCell(container, 'June')).not.toBeDisabled();
    expect(monthCell(container, 'May')).toBeDisabled();
  });

  it('shows caller-supplied month names on the cells', () => {
    const names = [
      'M1',
      'M2',
      'M3',
      'M4',
      'M5',
      'M6',
      'M7',
      'M8',
      'M9',
      'M10',
      'M11',
      'M12',
    ];
    const { container } = render(
      <PeriodHarness granularity="month" monthNames={names} />
    );
    expect(monthCell(container, 'M6').textContent).toBe('M6');
  });

  describe('year list as navigation', () => {
    beforeAll(() => {
      HTMLElement.prototype.scrollIntoView = jest.fn();
    });

    const openYears = (container: HTMLElement) =>
      fireEvent.click(container.querySelector('[aria-haspopup="listbox"]')!);

    it('jumps to a year and returns to the month grid inside min', () => {
      const { container, getByText, getByLabelText } = render(
        <PeriodHarness
          granularity="month"
          min={new Date(2020, 5, 15)}
          max={new Date(2030, 11, 31)}
          autoFocusCell
        />
      );
      openYears(container);
      expect(getByLabelText('Previous year')).toBeDisabled();
      expect(getByLabelText('Next year')).toBeDisabled();
      // As navigation the list labels itself with the header's year.
      expect(container.querySelector('[role="listbox"]')).toHaveAttribute(
        'aria-label',
        '2024'
      );
      fireEvent.click(getByText('2020'));
      expect(container.querySelector('[role="listbox"]')).toBeNull();
      expect(getByText('2020')).toBeInTheDocument();
      // June 2020 is clamped up to min, still June; the grid takes focus.
      expect(focusedMonth(container)).toHaveAttribute('aria-label', 'June');
      expect(document.activeElement).toBe(focusedMonth(container));
    });

    it('Escape and the header toggle both return to the month grid', () => {
      const { container } = render(<PeriodHarness granularity="month" />);
      openYears(container);
      fireEvent.keyDown(container.querySelector('[role="listbox"]')!, {
        key: 'Escape',
      });
      expect(grid(container)).not.toBeNull();
      openYears(container);
      openYears(container);
      expect(grid(container)).not.toBeNull();
    });
  });

  describe('focus', () => {
    it('focuses the focused month when asked', () => {
      const { container } = render(
        <PeriodHarness granularity="month" autoFocusCell />
      );
      expect(document.activeElement).toBe(focusedMonth(container));
    });

    it('leaves focus alone when not asked, then follows the keyboard', () => {
      const { container } = render(<PeriodHarness granularity="month" />);
      expect(container.contains(document.activeElement)).toBe(false);
      act(() => focusedMonth(container).focus());
      press(container, 'ArrowRight');
      expect(document.activeElement).toBe(focusedMonth(container));
      expect(document.activeElement).toHaveAttribute('aria-label', 'July');
    });
  });
});

describe('Calendar year granularity', () => {
  const list = (container: HTMLElement) =>
    container.querySelector<HTMLElement>('[role="listbox"]')!;
  const press = (container: HTMLElement, key: string) =>
    fireEvent.keyDown(list(container), { key });

  const scrollIntoView = jest.fn();
  beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
  });
  beforeEach(() => scrollIntoView.mockClear());

  it('shows the year list as its only view', () => {
    const { container, getByText, queryByLabelText } = render(
      <PeriodHarness
        granularity="year"
        min={new Date(2020, 0, 1)}
        max={new Date(2030, 11, 31)}
        id="cal"
      />
    );
    expect(list(container)).toHaveAttribute('aria-label', 'Choose year');
    expect(container.querySelector('[role="grid"]')).toBeNull();
    expect(yearOptions(container)).toHaveLength(11);
    // The header names the focused year and opens nothing.
    const label = container.querySelector('#cal-label')!;
    expect(label.textContent).toBe('2024');
    expect(label.closest('button')).toBeNull();
    expect(container.querySelector('[aria-haspopup="listbox"]')).toBeNull();
    expect(queryByLabelText('Previous month')).toBeNull();
    expect(queryByLabelText('Next month')).toBeNull();
    expect(getByText('2030')).toBeInTheDocument();
    // Opening it as the selection surface does not scroll the page.
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('names the list from labels', () => {
    const { container } = render(
      <PeriodHarness granularity="year" labels={{ chooseYear: 'Année' }} />
    );
    expect(list(container)).toHaveAttribute('aria-label', 'Année');
  });

  it("selects the value's year, separately from the focused one", () => {
    const { container } = render(
      <PeriodHarness granularity="year" initialValue={new Date(2021, 0, 1)} />
    );
    const selected = container.querySelectorAll('[aria-selected="true"]');
    expect(selected).toHaveLength(1);
    expect(selected[0].textContent).toBe('2021');
    expect(selected[0]).toHaveClass('is-selected');
    expect(focusedYearOption(container).textContent).toBe('2024');
    expect(focusedYearOption(container).tabIndex).toBe(0);
    expect(yearOption(container, 2021).tabIndex).toBe(-1);
  });

  it('marks the current year', () => {
    const { container } = render(
      <PeriodHarness granularity="year" focusedDate={new Date()} />
    );
    const current = container.querySelector('[aria-current="date"]')!;
    expect(current.textContent).toBe(String(new Date().getFullYear()));
    expect(current).toHaveClass('is-today');
  });

  describe('tab stop', () => {
    const blockYears =
      (...years: number[]) =>
      (d: Date) =>
        years.includes(d.getFullYear());
    const tabStops = (container: HTMLElement) =>
      yearOptions(container).filter(o => o.tabIndex === 0);

    it.each([
      ['the later neighbour', [2024], '2025'],
      ['the earlier one when the later is out too', [2024, 2025], '2023'],
    ])(
      'moves off a disabled focused year to %s',
      (_case, blocked, expected) => {
        const { container } = render(
          <PeriodHarness
            granularity="year"
            shouldDisableDate={blockYears(...blocked)}
          />
        );
        const stops = tabStops(container);
        expect(stops).toHaveLength(1);
        expect(stops[0]).toHaveTextContent(expected);
        expect(stops[0]).not.toBeDisabled();
        expect(stops[0]).toHaveAttribute('data-focused-year', 'true');
      }
    );

    it('makes the year Tab reaches the focused one, so keys move from it', () => {
      const onFocusedDateChange = jest.fn();
      const { container } = render(
        <PeriodHarness
          granularity="year"
          shouldDisableDate={blockYears(2024)}
          onFocusedDateChange={onFocusedDateChange}
        />
      );
      act(() => tabStops(container)[0].focus());
      expect(onFocusedDateChange).toHaveBeenCalledWith(new Date(2025, 0, 1));
      press(container, 'ArrowRight');
      expect(document.activeElement).toHaveTextContent('2026');
    });

    it('leaves focus moving through the list alone', () => {
      const onFocusedDateChange = jest.fn();
      const { container } = render(
        <PeriodHarness
          granularity="year"
          onFocusedDateChange={onFocusedDateChange}
        />
      );
      act(() => focusedYearOption(container).focus());
      expect(onFocusedDateChange).not.toHaveBeenCalled();
    });

    it.each([
      ['the first year when it falls before the list', 2024, [], '2030'],
      ['the last year when it falls after the list', 2050, [], '2040'],
      [
        'the nearest enabled year to the end it falls past',
        2024,
        [2030],
        '2031',
      ],
    ])(
      'moves a focused year outside the list to %s',
      (_case, year, blocked, expected) => {
        const { container } = render(
          <PeriodHarness
            granularity="year"
            yearsRange={[2030, 2040]}
            focusedDate={new Date(year, 0, 1)}
            shouldDisableDate={blockYears(...blocked)}
          />
        );
        const stops = tabStops(container);
        expect(stops).toHaveLength(1);
        expect(stops[0]).toHaveTextContent(expected);
        expect(stops[0]).toHaveAttribute('data-focused-year', 'true');
      }
    );

    it('makes the end of the list Tab reaches the focused year', () => {
      const onFocusedDateChange = jest.fn();
      const { container } = render(
        <PeriodHarness
          granularity="year"
          yearsRange={[2030, 2040]}
          onFocusedDateChange={onFocusedDateChange}
        />
      );
      act(() => tabStops(container)[0].focus());
      expect(onFocusedDateChange).toHaveBeenCalledWith(new Date(2030, 0, 1));
      press(container, 'ArrowRight');
      expect(document.activeElement).toHaveTextContent('2031');
    });
  });

  it('reports the first day of the clicked year and focuses it inside min', () => {
    const onSelect = jest.fn();
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <PeriodHarness
        granularity="year"
        min={new Date(2022, 5, 15)}
        onSelect={onSelect}
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    fireEvent.click(yearOption(container, 2022));
    expect(onSelect).toHaveBeenCalledWith(new Date(2022, 0, 1));
    expect(onFocusedDateChange).toHaveBeenCalledWith(new Date(2022, 5, 15));
    // Still the year list: picking a year is the last step.
    expect(list(container)).not.toBeNull();
    expect(yearOption(container, 2022)).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('disables a year only when every day in it is unselectable', () => {
    const { container } = render(
      <PeriodHarness
        granularity="year"
        min={new Date(2020, 11, 31)}
        max={new Date(2030, 0, 1)}
        shouldDisableDate={d => d.getFullYear() === 2025}
      />
    );
    const disabled = yearOptions(container).filter(o =>
      o.hasAttribute('disabled')
    );
    expect(disabled.map(o => o.textContent)).toEqual(['2025']);
    expect(disabled[0]).toHaveAttribute('aria-disabled', 'true');
    expect(disabled[0]).toHaveClass('is-disabled');
    expect(yearOption(container, 2020)).toHaveAttribute(
      'aria-disabled',
      'false'
    );
  });

  it.each([
    ['ArrowRight', 2025],
    ['ArrowLeft', 2023],
    ['ArrowDown', 2028],
    ['ArrowUp', 2020],
    ['Home', 2014],
    ['End', 2034],
  ])('%s moves focus to %i', (key, year) => {
    const { container } = render(
      <PeriodHarness
        granularity="year"
        min={new Date(2014, 0, 1)}
        max={new Date(2034, 11, 31)}
      />
    );
    expect(press(container, key)).toBe(false); // default prevented
    expect(focusedYearOption(container).textContent).toBe(String(year));
  });

  it('skips years with no selectable day', () => {
    const { container } = render(
      <PeriodHarness
        granularity="year"
        shouldDisableDate={d => d.getFullYear() === 2025}
      />
    );
    press(container, 'ArrowRight');
    expect(focusedYearOption(container).textContent).toBe('2026');
  });

  it('stays put at the ends of the list', () => {
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <PeriodHarness
        granularity="year"
        min={new Date(2024, 0, 1)}
        max={new Date(2024, 11, 31)}
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    press(container, 'ArrowRight');
    press(container, 'ArrowUp');
    expect(onFocusedDateChange).not.toHaveBeenCalled();
  });

  it('leaves Escape and unhandled keys alone', () => {
    const { container } = render(<PeriodHarness granularity="year" />);
    expect(press(container, 'Escape')).toBe(true);
    expect(press(container, 'a')).toBe(true);
    expect(list(container)).not.toBeNull();
  });

  it('keeps a year below 100 when it is picked or reached', () => {
    const early = new Date(2024, 5, 15);
    early.setFullYear(19);
    const onSelect = jest.fn();
    const onFocusedDateChange = jest.fn();
    const { container } = render(
      <PeriodHarness
        granularity="year"
        focusedDate={early}
        yearsRange={[15, 25]}
        shouldDisableDate={d => d.getFullYear() === 20}
        onSelect={onSelect}
        onFocusedDateChange={onFocusedDateChange}
      />
    );
    // The predicate sees year 20 itself, not 1920.
    expect(yearOption(container, 20)).toBeDisabled();
    press(container, 'ArrowRight');
    expect((onFocusedDateChange.mock.calls[0][0] as Date).getFullYear()).toBe(
      21
    );
    fireEvent.click(yearOption(container, 22));
    expect((onSelect.mock.calls[0][0] as Date).getFullYear()).toBe(22);
  });

  it('lists no year before 1', () => {
    for (const min of [undefined, makeDate(0, 6, 1), makeDate(-5, 0, 1)]) {
      const onSelect = jest.fn();
      const { container, unmount } = render(
        <PeriodHarness
          granularity="year"
          focusedDate={makeDate(19, 5, 15)}
          min={min}
          onSelect={onSelect}
        />
      );
      expect(yearOptions(container)[0].textContent).toBe('1');
      press(container, 'Home');
      expect(focusedYearOption(container).textContent).toBe('1');
      fireEvent.click(yearOption(container, 1));
      expect(onSelect).toHaveBeenCalledWith(makeDate(1));
      unmount();
    }
  });

  it('keeps the listed years still while focus moves', () => {
    const { container } = render(<PeriodHarness granularity="year" />);
    const first = yearOptions(container)[0].textContent;
    press(container, 'ArrowDown');
    press(container, 'ArrowDown');
    expect(yearOptions(container)[0].textContent).toBe(first);
    expect(focusedYearOption(container).textContent).toBe('2032');
  });

  describe('focus and scrolling', () => {
    afterEach(() => jest.restoreAllMocks());

    it('centres the focused year by scrolling the list itself', () => {
      jest
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockImplementation(function (this: Element) {
          const isList = this.getAttribute('role') === 'listbox';
          return { top: isList ? 100 : 400, height: 36 } as DOMRect;
        });
      jest.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(200);
      const { container } = render(<PeriodHarness granularity="year" />);
      // 400 - 100 puts the year 300px down; centring it in a 200px list
      // leaves (200 - 36) / 2 above it.
      expect(list(container).scrollTop).toBe(218);
      expect(container.contains(document.activeElement)).toBe(false);
    });

    it('focuses the focused year when asked', () => {
      const { container } = render(
        <PeriodHarness granularity="year" autoFocusCell />
      );
      expect(document.activeElement).toBe(focusedYearOption(container));
    });

    it('moves DOM focus with the keyboard once the list has it', () => {
      const { container } = render(<PeriodHarness granularity="year" />);
      press(container, 'ArrowRight');
      expect(container.contains(document.activeElement)).toBe(false);
      act(() => focusedYearOption(container).focus());
      press(container, 'ArrowRight');
      expect(document.activeElement).toBe(focusedYearOption(container));
      expect(document.activeElement!.textContent).toBe('2026');
    });

    it('focuses the end of the list a focused year outside it fell past', () => {
      const { container } = render(
        <PeriodHarness
          granularity="year"
          yearsRange={[2030, 2032]}
          autoFocusCell
        />
      );
      expect(document.activeElement).toBe(focusedYearOption(container));
      expect(document.activeElement!.textContent).toBe('2030');
    });

    it('does nothing when the list is empty', () => {
      const { container } = render(
        <PeriodHarness
          granularity="year"
          yearsRange={[2032, 2030]}
          autoFocusCell
        />
      );
      expect(yearOptions(container)).toHaveLength(0);
      expect(container.contains(document.activeElement)).toBe(false);
    });
  });
});

describe('Calendar day grid focus', () => {
  const grid = (container: HTMLElement) =>
    container.querySelector<HTMLElement>('[role="grid"]')!;
  const press = (container: HTMLElement, key: string) =>
    act(() => {
      fireEvent.keyDown(document.activeElement ?? grid(container), { key });
    });
  // A day of the month on show, not a nearby month's day with the same number.
  const day = (container: HTMLElement, n: number) =>
    Array.from(
      container.querySelectorAll<HTMLElement>(
        '.dateinput-cell:not(.is-other-month)'
      )
    ).find(c => c.textContent === String(n))!;
  const tabStops = (container: HTMLElement) =>
    Array.from(
      container.querySelectorAll<HTMLElement>('[role="gridcell"]')
    ).filter(c => c.tabIndex === 0);

  describe('without autoFocusCell, as an inline calendar renders it', () => {
    it('leaves focus alone until the grid has it', () => {
      const { container } = render(<PeriodHarness />);
      expect(container.contains(document.activeElement)).toBe(false);
      fireEvent.click(container.querySelector('.dateinput-nav-next')!);
      expect(
        container.querySelector('.dateinput-month-label')
      ).toHaveTextContent('July 2024');
      expect(container.contains(document.activeElement)).toBe(false);
    });

    it('moves DOM focus with the arrow keys', () => {
      const { container } = render(<PeriodHarness />);
      act(() => day(container, 15).focus());
      press(container, 'ArrowRight');
      expect(document.activeElement).toBe(day(container, 16));
      press(container, 'ArrowDown');
      expect(document.activeElement).toBe(day(container, 23));
      expect(tabStops(container)).toEqual([day(container, 23)]);
    });

    it('follows a key that moves into another month', () => {
      const { container } = render(<PeriodHarness />);
      act(() => day(container, 15).focus());
      press(container, 'PageDown');
      expect(
        container.querySelector('.dateinput-month-label')
      ).toHaveTextContent('July 2024');
      expect(document.activeElement).toBe(day(container, 15));
      press(container, 'ArrowLeft');
      expect(document.activeElement).toBe(day(container, 14));
    });
  });

  describe('tab stop', () => {
    it.each([
      ['the later neighbour', [15], 15, 16],
      ['the earlier one when the later is out too', [15, 16], 15, 14],
      ["back from the month's last day", [30], 30, 29],
      ['on from the first past a blocked second', [1, 2], 1, 3],
    ])(
      'moves off a disabled focused day to %s',
      (_case, blocked, focused, expected) => {
        const { container } = render(
          <PeriodHarness
            focusedDate={new Date(2024, 5, focused)}
            shouldDisableDate={d =>
              d.getMonth() === 5 && blocked.includes(d.getDate())
            }
          />
        );
        const stops = tabStops(container);
        expect(stops).toEqual([day(container, expected)]);
        expect(stops[0]).not.toBeDisabled();
        expect(stops[0]).toHaveAttribute('data-focused', 'true');
      }
    );

    it('makes the day Tab reaches the focused one, so keys move from it', () => {
      const onFocusedDateChange = jest.fn();
      const onSelect = jest.fn();
      const { container } = render(
        <PeriodHarness
          shouldDisableDate={d => d.getMonth() === 5 && d.getDate() === 15}
          onFocusedDateChange={onFocusedDateChange}
          onSelect={onSelect}
        />
      );
      act(() => tabStops(container)[0].focus());
      expect(onFocusedDateChange).toHaveBeenCalledWith(new Date(2024, 5, 16));
      press(container, 'ArrowRight');
      expect(document.activeElement).toBe(day(container, 17));
      press(container, 'Enter');
      expect(onSelect).toHaveBeenCalledWith(new Date(2024, 5, 17));
    });

    it("leaves a nearby month's day to its click, which turns the grid", () => {
      const onFocusedDateChange = jest.fn();
      const { container } = render(
        <PeriodHarness onFocusedDateChange={onFocusedDateChange} />
      );
      // Focus comes before the click; turning the grid then would move the
      // cell out from under the pointer.
      const nearby = container.querySelector<HTMLElement>(
        '.dateinput-cell.is-other-month:last-child'
      )!;
      act(() => nearby.focus());
      expect(onFocusedDateChange).not.toHaveBeenCalled();
      fireEvent.click(nearby);
      expect(onFocusedDateChange).toHaveBeenCalledTimes(1);
      expect(
        container.querySelector('.dateinput-month-label')
      ).toHaveTextContent('July 2024');
    });

    it('stays on the focused day when every day is disabled', () => {
      const { container } = render(
        <PeriodHarness shouldDisableDate={() => true} />
      );
      expect(tabStops(container)).toEqual([day(container, 15)]);
    });

    it('takes focus as the popover asks, on the stop', () => {
      const { container } = render(
        <PeriodHarness
          autoFocusCell
          shouldDisableDate={d => d.getMonth() === 5 && d.getDate() === 15}
        />
      );
      expect(document.activeElement).toBe(day(container, 16));
    });
  });

  describe('when the focused day becomes disabled', () => {
    const block15 = (d: Date) => d.getMonth() === 5 && d.getDate() === 15;
    const Page: React.FC<{ blocked?: boolean }> = ({ blocked }) => (
      <>
        <PeriodHarness shouldDisableDate={blocked ? block15 : undefined} />
        <button>Elsewhere</button>
      </>
    );

    it('moves focus to the new stop', () => {
      const { container, rerender } = render(<Page />);
      act(() => day(container, 15).focus());
      rerender(<Page blocked />);
      expect(document.activeElement).toBe(day(container, 16));
    });

    it('also when the browser drops focus to <body> as it disables it', () => {
      // jsdom keeps focus on a button once it is disabled. Chromium blurs it
      // there and then, inside React's commit, so this does the same.
      const setAttribute = Element.prototype.setAttribute;
      let dropped = false;
      const spy = jest
        .spyOn(Element.prototype, 'setAttribute')
        .mockImplementation(function (this: Element, name, value) {
          setAttribute.call(this, name, value);
          if (name === 'disabled' && this === document.activeElement) {
            (this as HTMLElement).blur();
            dropped = true;
          }
        });
      try {
        const { container, rerender } = render(<Page />);
        act(() => day(container, 15).focus());
        rerender(<Page blocked />);
        expect(dropped).toBe(true);
        expect(document.activeElement).toBe(day(container, 16));
      } finally {
        spy.mockRestore();
      }
    });

    it('leaves focus alone once the user has taken it off the page', () => {
      // Clicking a blank part of the page blurs the cell with nowhere for
      // focus to go, so it lands on <body> as a drop would.
      const { container, rerender } = render(<Page />);
      act(() => day(container, 15).focus());
      act(() => day(container, 15).blur());
      rerender(<Page blocked />);
      expect(document.activeElement).toBe(document.body);
    });

    it('leaves focus that went elsewhere alone', () => {
      const { container, rerender, getByRole } = render(<Page />);
      const elsewhere = getByRole('button', { name: 'Elsewhere' });
      act(() => day(container, 15).focus());
      act(() => elsewhere.focus());
      rerender(<Page blocked />);
      expect(elsewhere).toHaveFocus();
    });
  });

  describe('with autoFocusCell, as the popover renders it', () => {
    beforeAll(() => {
      // jsdom has no scrollIntoView, which the year list calls.
      HTMLElement.prototype.scrollIntoView ??= jest.fn();
    });

    it('leaves focus on the header button the user pressed', () => {
      const { container } = render(<PeriodHarness autoFocusCell />);
      const next = container.querySelector<HTMLElement>('.dateinput-nav-next')!;
      act(() => next.focus());
      act(() => {
        fireEvent.click(next);
      });
      expect(
        container.querySelector('.dateinput-month-label')
      ).toHaveTextContent('July 2024');
      expect(next).toHaveFocus();
    });

    it('takes focus again as it comes back from the year list', () => {
      const { container, getByText } = render(<PeriodHarness autoFocusCell />);
      fireEvent.click(container.querySelector('.dateinput-month-trigger')!);
      act(() => {
        fireEvent.click(getByText('2025'));
      });
      expect(
        container.querySelector('.dateinput-month-label')
      ).toHaveTextContent('June 2025');
      expect(document.activeElement).toBe(day(container, 15));
    });
  });
});

describe('Calendar focus inside a shadow root', () => {
  // A docs live preview renders into one, where document.activeElement
  // names the host rather than the focused element.
  let host: HTMLElement;
  let root: ShadowRoot;
  let mount: HTMLElement;
  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = host.attachShadow({ mode: 'open' });
    mount = document.createElement('div');
    root.appendChild(mount);
  });
  afterEach(() => {
    host.remove();
  });
  const press = (el: Element, key: string) =>
    act(() => {
      fireEvent.keyDown(el, { key });
    });
  const day = (n: number) =>
    Array.from(
      mount.querySelectorAll<HTMLElement>(
        '.dateinput-cell:not(.is-other-month)'
      )
    ).find(c => c.textContent === String(n))!;

  it('follows the keyboard through the day grid, into another month too', () => {
    render(<PeriodHarness />, { container: mount });
    act(() => day(15).focus());
    press(day(15), 'ArrowRight');
    expect(root.activeElement).toBe(day(16));
    press(day(16), 'PageDown');
    expect(mount.querySelector('.dateinput-month-label')).toHaveTextContent(
      'July 2024'
    );
    expect(root.activeElement).toBe(day(16));
  });

  it('follows the keyboard through the month grid', () => {
    render(<PeriodHarness granularity="month" />, { container: mount });
    const june = mount.querySelector<HTMLElement>('[aria-label="June"]')!;
    act(() => june.focus());
    press(june, 'ArrowRight');
    expect(root.activeElement).toHaveAttribute('aria-label', 'July');
  });

  it('follows the keyboard through the year list', () => {
    render(<PeriodHarness granularity="year" />, { container: mount });
    const focused = mount.querySelector<HTMLElement>(
      '[data-focused-year="true"]'
    )!;
    act(() => focused.focus());
    press(focused, 'ArrowRight');
    expect(root.activeElement).toHaveTextContent('2025');
  });
});
