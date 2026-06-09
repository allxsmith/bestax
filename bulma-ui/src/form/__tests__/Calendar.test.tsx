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
});
