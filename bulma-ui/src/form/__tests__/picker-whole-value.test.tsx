// A date or time picker takes a whole value the browser writes into its
// field, from a paste or autofill, when its parse reads it. Before, segment
// mode dropped it, and a field without focus showed it but never committed it
// (#2140).
import type { ComponentType } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DateInput } from '../DateInput';
import { TimeInput } from '../TimeInput';
import { DateTimeInput } from '../DateTimeInput';
import { DateRangeInput } from '../DateRangeInput';

type Picker = ComponentType<Record<string, unknown>>;

const pickers: [string, Picker, string, string, Date][] = [
  [
    'DateInput',
    DateInput as Picker,
    'YYYY-MM-DD',
    '1990-01-15',
    new Date(1990, 0, 15),
  ],
  [
    'TimeInput',
    TimeInput as Picker,
    'HH:mm',
    '08:30',
    (() => {
      const d = new Date();
      d.setHours(8, 30, 0, 0);
      return d;
    })(),
  ],
  [
    'DateTimeInput',
    DateTimeInput as Picker,
    'YYYY-MM-DD HH:mm',
    '1990-01-15 08:30',
    new Date(1990, 0, 15, 8, 30),
  ],
];

/** The day, hour and minute a date carries, for comparing across pickers. */
const parts = (d: Date) => [
  d.getFullYear(),
  d.getMonth(),
  d.getDate(),
  d.getHours(),
  d.getMinutes(),
];

describe.each(pickers)('%s', (_name, Picker, format, text, date) => {
  const renderPicker = (onChange: (d: Date | null) => void) =>
    render(
      <Picker
        aria-label="When"
        format={format}
        mobileNative={false}
        openOnFocus={false}
        onChange={onChange}
      />
    );

  it('commits a value autofill writes into it without focus', () => {
    const onChange = vi.fn();
    renderPicker(onChange);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: text } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(parts(onChange.mock.calls[0][0])).toEqual(parts(date));
    expect(input.value).toBe(text);
  });

  it('keeps text it cannot read without committing it, as before', () => {
    const onChange = vi.fn();
    renderPicker(onChange);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'January 15' } });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('January 15');
  });

  it('takes a whole value pasted into a segment', () => {
    const onChange = vi.fn();
    renderPicker(onChange);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    act(() => input.focus());
    const notPrevented = fireEvent.paste(input, {
      clipboardData: { getData: () => text },
    });
    expect(notPrevented).toBe(false);
    expect(parts(onChange.mock.calls[0][0])).toEqual(parts(date));
    expect(input.value).toBe(text);
  });

  it('takes a value autofill writes while it has focus', () => {
    const onChange = vi.fn();
    renderPicker(onChange);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    act(() => input.focus());
    fireEvent.change(input, { target: { value: text } });
    expect(parts(onChange.mock.calls[0][0])).toEqual(parts(date));
    expect(input.value).toBe(text);
  });
});

describe('TimeInput with a value', () => {
  it("keeps the value's day for a pasted time, within min and max", () => {
    const onChange = vi.fn();
    render(
      <TimeInput
        aria-label="Start"
        format="HH:mm"
        mobileNative={false}
        openOnFocus={false}
        defaultValue={new Date(2020, 4, 6, 13, 45)}
        min={new Date(2020, 4, 6, 9, 0)}
        max={new Date(2020, 4, 6, 17, 0)}
        onChange={onChange}
      />
    );
    const input = screen.getByRole('combobox') as HTMLInputElement;
    act(() => input.focus());
    fireEvent.paste(input, { clipboardData: { getData: () => '10:00' } });
    expect(onChange).toHaveBeenCalledWith(new Date(2020, 4, 6, 10, 0));
  });
});

describe('DateInput at month granularity', () => {
  it('keeps the month it holds when a day in that month is written in', () => {
    const onChange = vi.fn();
    render(
      <DateInput
        aria-label="Month"
        granularity="month"
        format="YYYY-MM-DD"
        mobileNative={false}
        value={new Date(2026, 2, 1)}
        onChange={onChange}
      />
    );
    const input = screen.getByRole('combobox') as HTMLInputElement;
    expect(input.value).toBe('2026-03-01');
    fireEvent.change(input, { target: { value: '2026-03-15' } });
    expect(input.value).toBe('2026-03-01');
  });
});

describe('DateRangeInput', () => {
  it('commits a value autofill writes into either field', () => {
    const onChange = vi.fn();
    render(
      <DateRangeInput
        mobileNative={false}
        openOnFocus={false}
        onChange={onChange}
      />
    );
    const start = screen.getByRole('combobox', { name: 'Start date' });
    const end = screen.getByRole('combobox', { name: 'End date' });
    fireEvent.change(start, { target: { value: '2026-06-10' } });
    fireEvent.change(end, { target: { value: '2026-06-13' } });
    expect(onChange).toHaveBeenLastCalledWith([
      new Date(2026, 5, 10),
      new Date(2026, 5, 13),
    ]);
  });

  it('takes a whole value pasted into the end field', () => {
    const onChange = vi.fn();
    render(
      <DateRangeInput
        mobileNative={false}
        openOnFocus={false}
        defaultValue={[new Date(2026, 5, 10), null]}
        onChange={onChange}
      />
    );
    const end = screen.getByRole('combobox', {
      name: 'End date',
    }) as HTMLInputElement;
    act(() => end.focus());
    fireEvent.paste(end, { clipboardData: { getData: () => '2026-06-13' } });
    expect(onChange).toHaveBeenLastCalledWith([
      new Date(2026, 5, 10),
      new Date(2026, 5, 13),
    ]);
    expect(end.value).toBe('2026-06-13');
  });
});
