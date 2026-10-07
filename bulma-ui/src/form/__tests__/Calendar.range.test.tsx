import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { Calendar, CalendarProps } from '../_pickerInternals/Calendar';
import type { DateRangeValue } from '../_pickerInternals/pickerTypes';

// June 2024 starts on a Saturday, so with Sunday first its days run from the
// grid's seventh cell.
const June15_2024 = new Date(2024, 5, 15);
const june = (day: number) => new Date(2024, 5, day);

type HarnessProps = Partial<CalendarProps> & {
  initialRange?: DateRangeValue;
  initialFocused?: Date;
};

// Owns the range and the focused day the way a host does: a committed pick
// becomes the range the calendar is given back.
const RangeHarness: React.FC<HarnessProps> = ({
  initialRange = [null, null],
  initialFocused = June15_2024,
  onRangeSelect,
  onFocusedDateChange,
  ...props
}) => {
  const [focused, setFocused] = React.useState(initialFocused);
  const [range, setRange] = React.useState<DateRangeValue>(initialRange);
  return (
    <Calendar
      locale="en-US"
      {...props}
      focusedDate={focused}
      onFocusedDateChange={d => {
        setFocused(d);
        onFocusedDateChange?.(d);
      }}
      range={range}
      onRangeSelect={(start, end) => {
        setRange([start, end]);
        onRangeSelect?.(start, end);
      }}
    />
  );
};

const grid = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[role="grid"]')!;

/** The cell for `day` of the month on show, skipping nearby months' days. */
const cell = (container: HTMLElement, day: number) =>
  Array.from(
    container.querySelectorAll<HTMLButtonElement>('[role="gridcell"]')
  ).find(
    c =>
      !c.className.includes('is-other-month') && c.textContent === String(day)
  )!;

/** Days of the month on show whose cell has `aria-selected="true"`. */
const selectedDays = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLButtonElement>(
      '[role="gridcell"][aria-selected="true"]'
    )
  )
    .filter(c => !c.className.includes('is-other-month'))
    .map(c => Number(c.textContent));

/** Days of the month on show whose cell carries `cls`. */
const daysWith = (container: HTMLElement, cls: string) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>('[role="gridcell"]'))
    .filter(
      c =>
        !c.className.includes('is-other-month') &&
        c.className.split(/\s+/).includes(cls)
    )
    .map(c => Number(c.textContent));

/** The text an element's `aria-describedby` points at. */
const description = (el: Element) =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map(id => document.getElementById(id)?.textContent)
    .join(' ');

const weekends = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

describe('Calendar range mode', () => {
  it('marks the grid multiselectable', () => {
    const { container } = render(<RangeHarness />);
    expect(grid(container)).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('leaves a single-date grid as it was', () => {
    const { container } = render(
      <Calendar
        value={june(10)}
        focusedDate={June15_2024}
        onSelect={() => {}}
        onFocusedDateChange={() => {}}
      />
    );
    expect(grid(container)).not.toHaveAttribute('aria-multiselectable');
    expect(cell(container, 10)).not.toHaveAttribute('aria-describedby');
    // The month label is the only live region.
    expect(container.querySelectorAll('[aria-live]')).toHaveLength(1);
  });

  it('marks the start with the first pick and commits nothing', () => {
    const onRangeSelect = jest.fn();
    const { container } = render(
      <RangeHarness onRangeSelect={onRangeSelect} />
    );
    fireEvent.click(cell(container, 10));
    expect(onRangeSelect).not.toHaveBeenCalled();
    expect(selectedDays(container)).toEqual([10]);
    expect(cell(container, 10)).toHaveClass('is-selected', 'is-range-start');
  });

  it('commits start and end with the second pick', () => {
    const onRangeSelect = jest.fn();
    const { container } = render(
      <RangeHarness onRangeSelect={onRangeSelect} />
    );
    fireEvent.click(cell(container, 10));
    fireEvent.click(cell(container, 13));
    expect(onRangeSelect).toHaveBeenCalledTimes(1);
    const [start, end] = onRangeSelect.mock.calls[0];
    expect(start).toEqual(june(10));
    expect(end).toEqual(june(13));
  });

  it('selects every day of a committed range and fills only its ends', () => {
    const { container } = render(
      <RangeHarness initialRange={[june(10), june(13)]} />
    );
    expect(selectedDays(container)).toEqual([10, 11, 12, 13]);
    expect(daysWith(container, 'is-selected')).toEqual([10, 13]);
    expect(daysWith(container, 'is-in-range')).toEqual([11, 12]);
    expect(daysWith(container, 'is-range-start')).toEqual([10]);
    expect(daysWith(container, 'is-range-end')).toEqual([13]);
    expect(daysWith(container, 'is-preview')).toEqual([]);
  });

  it('shows a range with one end set as that one day', () => {
    const { container } = render(
      <RangeHarness initialRange={[null, june(13)]} />
    );
    expect(selectedDays(container)).toEqual([13]);
    expect(daysWith(container, 'is-range-end')).toEqual([13]);
    expect(daysWith(container, 'is-range-start')).toEqual([]);
  });

  it('makes a one-day range when the start is picked again', () => {
    const onRangeSelect = jest.fn();
    const { container } = render(
      <RangeHarness onRangeSelect={onRangeSelect} />
    );
    fireEvent.click(cell(container, 10));
    fireEvent.click(cell(container, 10));
    expect(onRangeSelect).toHaveBeenCalledWith(june(10), june(10));
    expect(cell(container, 10)).toHaveClass('is-range-start', 'is-range-end');
  });

  it('starts over from a pick before the start', () => {
    const onRangeSelect = jest.fn();
    const { container } = render(
      <RangeHarness onRangeSelect={onRangeSelect} />
    );
    fireEvent.click(cell(container, 10));
    fireEvent.click(cell(container, 5));
    expect(onRangeSelect).not.toHaveBeenCalled();
    expect(selectedDays(container)).toEqual([5]);
    fireEvent.click(cell(container, 7));
    expect(onRangeSelect).toHaveBeenCalledWith(june(5), june(7));
  });

  it('hides the committed range while a new one is picked', () => {
    const { container } = render(
      <RangeHarness initialRange={[june(3), june(6)]} />
    );
    fireEvent.click(cell(container, 20));
    expect(selectedDays(container)).toEqual([20]);
    expect(daysWith(container, 'is-in-range')).toEqual([]);
  });

  it('previews the range to the hovered day without selecting it', () => {
    const { container } = render(<RangeHarness />);
    fireEvent.click(cell(container, 10));
    fireEvent.mouseEnter(cell(container, 13));
    expect(daysWith(container, 'is-in-range')).toEqual([11, 12]);
    expect(daysWith(container, 'is-range-end')).toEqual([13]);
    expect(daysWith(container, 'is-preview')).toEqual([11, 12, 13]);
    expect(selectedDays(container)).toEqual([10]);
  });

  it('hands the preview back to the focused day as the pointer leaves', () => {
    const { container } = render(<RangeHarness />);
    fireEvent.click(cell(container, 10));
    fireEvent.mouseEnter(cell(container, 13));
    fireEvent.mouseLeave(grid(container));
    expect(daysWith(container, 'is-preview')).toEqual([]);
    expect(daysWith(container, 'is-range-end')).toEqual([10]);
  });

  it('shows no preview while nothing is pending', () => {
    const { container } = render(
      <RangeHarness initialRange={[june(3), june(6)]} />
    );
    fireEvent.mouseEnter(cell(container, 13));
    expect(daysWith(container, 'is-preview')).toEqual([]);
    expect(selectedDays(container)).toEqual([3, 4, 5, 6]);
  });

  it('previews no span to a day before the start', () => {
    const { container } = render(<RangeHarness />);
    fireEvent.click(cell(container, 10));
    fireEvent.mouseEnter(cell(container, 4));
    expect(daysWith(container, 'is-preview')).toEqual([]);
    expect(daysWith(container, 'is-range-end')).toEqual([]);
  });

  it('picks start and end from the keyboard, previewing as focus moves', () => {
    const onRangeSelect = jest.fn();
    const { container } = render(
      <RangeHarness initialFocused={june(10)} onRangeSelect={onRangeSelect} />
    );
    fireEvent.keyDown(grid(container), { key: 'Enter' });
    expect(selectedDays(container)).toEqual([10]);
    fireEvent.keyDown(grid(container), { key: 'ArrowRight' });
    fireEvent.keyDown(grid(container), { key: 'ArrowRight' });
    expect(daysWith(container, 'is-preview')).toEqual([11, 12]);
    fireEvent.keyDown(grid(container), { key: ' ' });
    expect(onRangeSelect).toHaveBeenCalledWith(june(10), june(12));
  });

  it('lets a key take the preview back from the pointer', () => {
    const { container } = render(<RangeHarness initialFocused={june(10)} />);
    fireEvent.keyDown(grid(container), { key: 'Enter' });
    fireEvent.mouseEnter(cell(container, 20));
    expect(daysWith(container, 'is-range-end')).toEqual([20]);
    fireEvent.keyDown(grid(container), { key: 'ArrowRight' });
    expect(daysWith(container, 'is-range-end')).toEqual([11]);
  });

  it('ignores Enter on a disabled focused day', () => {
    const onRangeSelect = jest.fn();
    const { container } = render(
      <RangeHarness
        initialFocused={june(15)}
        shouldDisableDate={weekends}
        onRangeSelect={onRangeSelect}
      />
    );
    fireEvent.keyDown(grid(container), { key: 'Enter' });
    expect(selectedDays(container)).toEqual([]);
  });

  describe('disabled days inside a range', () => {
    // Friday 14 June to Monday 17 June crosses a weekend.
    it('starts over from a pick past a disabled day', () => {
      const onRangeSelect = jest.fn();
      const { container } = render(
        <RangeHarness
          shouldDisableDate={weekends}
          onRangeSelect={onRangeSelect}
        />
      );
      fireEvent.click(cell(container, 13));
      fireEvent.click(cell(container, 17));
      expect(onRangeSelect).not.toHaveBeenCalled();
      expect(selectedDays(container)).toEqual([17]);
    });

    it('previews no span over a disabled day', () => {
      const { container } = render(
        <RangeHarness shouldDisableDate={weekends} />
      );
      fireEvent.click(cell(container, 13));
      fireEvent.mouseEnter(cell(container, 17));
      expect(daysWith(container, 'is-preview')).toEqual([]);
      fireEvent.mouseEnter(cell(container, 14));
      expect(daysWith(container, 'is-preview')).toEqual([14]);
    });

    it('previews nothing to a disabled day itself', () => {
      const { container } = render(
        <RangeHarness shouldDisableDate={weekends} />
      );
      fireEvent.click(cell(container, 13));
      fireEvent.mouseEnter(cell(container, 15));
      expect(daysWith(container, 'is-preview')).toEqual([]);
    });

    it('counts unselectableDates as disabled days', () => {
      const onRangeSelect = jest.fn();
      const { container } = render(
        <RangeHarness
          unselectableDates={[june(12)]}
          onRangeSelect={onRangeSelect}
        />
      );
      fireEvent.click(cell(container, 10));
      fireEvent.click(cell(container, 14));
      expect(onRangeSelect).not.toHaveBeenCalled();
      fireEvent.click(cell(container, 16));
      expect(onRangeSelect).toHaveBeenCalledWith(june(14), june(16));
    });

    it('spans a disabled day with allowDisabledInRange', () => {
      const onRangeSelect = jest.fn();
      const { container } = render(
        <RangeHarness
          shouldDisableDate={weekends}
          allowDisabledInRange
          onRangeSelect={onRangeSelect}
        />
      );
      fireEvent.click(cell(container, 13));
      fireEvent.click(cell(container, 17));
      expect(onRangeSelect).toHaveBeenCalledWith(june(13), june(17));
      expect(selectedDays(container)).toEqual([13, 14, 15, 16, 17]);
      expect(cell(container, 15)).toHaveClass('is-in-range', 'is-disabled');
    });

    it('needs no walk when nothing disables a day', () => {
      const onRangeSelect = jest.fn();
      const { container } = render(
        <RangeHarness
          min={june(1)}
          max={june(30)}
          onRangeSelect={onRangeSelect}
        />
      );
      fireEvent.click(cell(container, 1));
      fireEvent.click(cell(container, 30));
      expect(onRangeSelect).toHaveBeenCalledWith(june(1), june(30));
    });
  });

  describe('Escape', () => {
    // A popover listens for Escape on the document, so a key that reaches it
    // closes the popover.
    const documentEscape = () => {
      const listener = jest.fn();
      document.addEventListener('keydown', listener);
      return {
        listener,
        remove: () => document.removeEventListener('keydown', listener),
      };
    };

    it('takes back a pending pick and stops there', () => {
      const { container } = render(
        <RangeHarness initialRange={[june(3), june(6)]} />
      );
      fireEvent.click(cell(container, 20));
      const doc = documentEscape();
      fireEvent.keyDown(grid(container), { key: 'Escape' });
      doc.remove();
      expect(doc.listener).not.toHaveBeenCalled();
      expect(selectedDays(container)).toEqual([3, 4, 5, 6]);
    });

    it('goes on to the popover with nothing pending', () => {
      const { container } = render(
        <RangeHarness initialRange={[june(3), june(6)]} />
      );
      const doc = documentEscape();
      fireEvent.keyDown(grid(container), { key: 'Escape' });
      doc.remove();
      expect(doc.listener).toHaveBeenCalledTimes(1);
    });

    it("goes on to the popover when the pending start is the value's own", () => {
      const { container } = render(
        <RangeHarness initialRange={[june(10), null]} />
      );
      const doc = documentEscape();
      fireEvent.keyDown(grid(container), { key: 'Escape' });
      doc.remove();
      expect(doc.listener).toHaveBeenCalledTimes(1);
      expect(selectedDays(container)).toEqual([10]);
    });

    it("goes back to the value's own start after a new one", () => {
      const onRangeSelect = jest.fn();
      const { container } = render(
        <RangeHarness
          initialRange={[june(10), null]}
          onRangeSelect={onRangeSelect}
        />
      );
      fireEvent.click(cell(container, 5));
      expect(selectedDays(container)).toEqual([5]);
      fireEvent.keyDown(grid(container), { key: 'Escape' });
      expect(selectedDays(container)).toEqual([10]);
      fireEvent.click(cell(container, 12));
      expect(onRangeSelect).toHaveBeenCalledWith(june(10), june(12));
    });
  });

  describe("the value's own start", () => {
    it('is pending, so the next pick sets the end', () => {
      const onRangeSelect = jest.fn();
      const { container } = render(
        <RangeHarness
          initialRange={[june(10), null]}
          onRangeSelect={onRangeSelect}
        />
      );
      expect(selectedDays(container)).toEqual([10]);
      fireEvent.click(cell(container, 12));
      expect(onRangeSelect).toHaveBeenCalledWith(june(10), june(12));
    });

    it('is pending from the start of its day', () => {
      const onRangeSelect = jest.fn();
      const { container } = render(
        <RangeHarness
          initialRange={[new Date(2024, 5, 10, 15, 30), null]}
          onRangeSelect={onRangeSelect}
        />
      );
      fireEvent.click(cell(container, 10));
      expect(onRangeSelect).toHaveBeenCalledWith(june(10), june(10));
    });

    it('replaces a pending pick when the range changes from outside', () => {
      const { container, rerender } = render(
        <Calendar
          locale="en-US"
          focusedDate={June15_2024}
          onFocusedDateChange={() => {}}
          range={[june(3), june(6)]}
        />
      );
      fireEvent.click(cell(container, 20));
      expect(selectedDays(container)).toEqual([20]);
      rerender(
        <Calendar
          locale="en-US"
          focusedDate={June15_2024}
          onFocusedDateChange={() => {}}
          range={[june(8), null]}
        />
      );
      expect(selectedDays(container)).toEqual([8]);
    });

    it('stays pending across renders that keep the range', () => {
      const { container, rerender } = render(
        <Calendar
          locale="en-US"
          focusedDate={June15_2024}
          onFocusedDateChange={() => {}}
          range={[june(3), june(6)]}
        />
      );
      fireEvent.click(cell(container, 20));
      rerender(
        <Calendar
          locale="en-US"
          focusedDate={June15_2024}
          onFocusedDateChange={() => {}}
          range={[june(3), june(6)]}
        />
      );
      expect(selectedDays(container)).toEqual([20]);
    });
  });

  it('keeps the pending start across months', () => {
    const onRangeSelect = jest.fn();
    const { container, getByLabelText } = render(
      <RangeHarness onRangeSelect={onRangeSelect} />
    );
    fireEvent.click(cell(container, 28));
    fireEvent.click(getByLabelText('Next month'));
    fireEvent.click(cell(container, 2));
    expect(onRangeSelect).toHaveBeenCalledWith(june(28), new Date(2024, 6, 2));
  });

  it('commits without a handler to call', () => {
    const { container } = render(
      <Calendar
        focusedDate={June15_2024}
        onFocusedDateChange={() => {}}
        range={[null, null]}
      />
    );
    fireEvent.click(cell(container, 10));
    expect(() => fireEvent.click(cell(container, 12))).not.toThrow();
  });

  it('picks a single date without a handler to call', () => {
    const { container } = render(
      <Calendar focusedDate={June15_2024} onFocusedDateChange={() => {}} />
    );
    expect(() => fireEvent.click(cell(container, 10))).not.toThrow();
  });

  it('picks a single month at month granularity, range or not', () => {
    const onSelect = jest.fn();
    const onRangeSelect = jest.fn();
    const { getByRole } = render(
      <Calendar
        granularity="month"
        focusedDate={June15_2024}
        onFocusedDateChange={() => {}}
        onSelect={onSelect}
        range={[null, null]}
        onRangeSelect={onRangeSelect}
      />
    );
    expect(getByRole('grid')).not.toHaveAttribute('aria-multiselectable');
    fireEvent.click(getByRole('gridcell', { name: 'March' }));
    expect(onSelect).toHaveBeenCalledWith(new Date(2024, 2, 1));
    expect(onRangeSelect).not.toHaveBeenCalled();
  });

  describe('descriptions', () => {
    it('names the ends of a committed range', () => {
      const { container } = render(
        <RangeHarness initialRange={[june(10), june(13)]} />
      );
      expect(description(cell(container, 10))).toBe('Start date');
      expect(description(cell(container, 13))).toBe('End date');
      expect(cell(container, 11)).not.toHaveAttribute('aria-describedby');
    });

    it('names both ends on a one-day range', () => {
      const { container } = render(
        <RangeHarness initialRange={[june(10), june(10)]} />
      );
      expect(description(cell(container, 10))).toBe('Start date End date');
    });

    it('names the pending start but not the preview end', () => {
      const { container } = render(<RangeHarness />);
      fireEvent.click(cell(container, 10));
      fireEvent.mouseEnter(cell(container, 13));
      expect(description(cell(container, 10))).toBe('Start date');
      expect(cell(container, 13)).not.toHaveAttribute('aria-describedby');
    });

    it('takes its words from labels', () => {
      const { container } = render(
        <RangeHarness
          initialRange={[june(10), june(13)]}
          labels={{ rangeStart: 'Arrivée', rangeEnd: 'Départ' }}
        />
      );
      expect(description(cell(container, 10))).toBe('Arrivée');
      expect(description(cell(container, 13))).toBe('Départ');
    });

    it('keeps its ids under the calendar id when it has one', () => {
      const { container } = render(
        <RangeHarness id="stay" initialRange={[june(10), june(13)]} />
      );
      expect(cell(container, 10).getAttribute('aria-describedby')).toBe(
        'stay-range-start'
      );
    });
  });

  describe('the announced range', () => {
    const summary = (container: HTMLElement) =>
      document.getElementById(
        grid(container).getAttribute('aria-describedby')!
      )!;

    it('is a polite region the grid is described by', () => {
      const { container } = render(
        <RangeHarness initialRange={[june(10), june(13)]} />
      );
      expect(summary(container)).toHaveAttribute('aria-live', 'polite');
      expect(summary(container)).toHaveTextContent(
        'Start date: June 10, 2024, End date: June 13, 2024'
      );
    });

    it('states the pending start after the first pick', () => {
      const { container } = render(<RangeHarness />);
      expect(summary(container)).toHaveTextContent('');
      act(() => {
        fireEvent.click(cell(container, 10));
      });
      expect(summary(container).textContent).toBe('Start date: June 10, 2024');
    });

    it('states a lone end', () => {
      const { container } = render(
        <RangeHarness initialRange={[null, june(13)]} />
      );
      expect(summary(container).textContent).toBe('End date: June 13, 2024');
    });

    it('stays in the page while the year list is open', () => {
      // jsdom has no scrollIntoView, which the year list calls as it opens.
      HTMLElement.prototype.scrollIntoView = jest.fn();
      const { container } = render(
        <RangeHarness initialRange={[june(10), june(13)]} />
      );
      fireEvent.click(container.querySelector('[aria-haspopup="listbox"]')!);
      delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
      expect(container.querySelector('[role="grid"]')).toBeNull();
      expect(
        container.querySelector('[id$="-range-summary"]')
      ).toHaveTextContent('Start date: June 10, 2024, End date: June 13, 2024');
    });

    it('is hidden without a stylesheet', () => {
      const { container } = render(<RangeHarness />);
      expect(summary(container).style.position).toBe('absolute');
      expect(summary(container).style.overflow).toBe('hidden');
    });
  });
});
