import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Calendar } from '../_pickerInternals/Calendar';

const June15_2024 = new Date(2024, 5, 15);

const Harness: React.FC<
  Partial<React.ComponentProps<typeof Calendar>>
> = props => {
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

  it('renders 7 day name headers', () => {
    const { container } = render(<Harness />);
    expect(
      container.querySelectorAll(
        '[class*="datepicker-day-name"]:not([class*="datepicker-day-names"])'
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
      '[class*="datepicker-day-name"]'
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
      '[class*="datepicker-day-name"]:not([class*="datepicker-day-names"])'
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
