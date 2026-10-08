import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { DateTimeInput } from '../DateTimeInput';
import { Field } from '../Field';
import { Control } from '../Control';
import { DateTimeInputBase } from '../DateTimeInputBase';
import { makeDate } from '../_pickerInternals/dateUtils';

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) =>
        ({
          matches: false,
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => true,
          onchange: null,
        }) as unknown as MediaQueryList,
    });
  }
});

describe('DateTimeInput', () => {
  it('renders combobox input', () => {
    const { getByRole } = render(<DateTimeInput label="When" />);
    expect(getByRole('combobox')).toBeInTheDocument();
  });

  it('inside an existing Field renders bare content with the help message', () => {
    const { container, getByText } = render(
      <Field label="When">
        <DateTimeInput message="Required" messageColor="danger" />
      </Field>
    );
    // No nested Field wrapper: exactly one field element.
    expect(container.querySelectorAll('.field').length).toBe(1);
    const help = getByText('Required');
    expect(help.className).toContain('help');
    expect(help.className).toContain('is-danger');
  });

  it('formats default value with date and time', () => {
    const v = new Date(2024, 5, 7, 13, 45);
    const { getByRole } = render(<DateTimeInput defaultValue={v} />);
    expect((getByRole('combobox') as HTMLInputElement).value).toBe(
      '2024-06-07 13:45'
    );
  });

  it('opens with the calendar; the time wheels appear after clicking the time', () => {
    const v = new Date(2024, 5, 7, 13, 45);
    const { getByRole, container, queryAllByRole, getAllByRole } = render(
      <DateTimeInput defaultValue={v} />
    );
    fireEvent.click(getByRole('combobox'));
    expect(container.querySelector('[role="grid"]')).not.toBeNull();
    // Wheels are collapsed by default (iOS-style).
    expect(queryAllByRole('spinbutton').length).toBe(0);
    // Clicking the time value reveals them.
    fireEvent.click(getByRole('button', { name: /Time/ }));
    expect(getAllByRole('spinbutton').length).toBeGreaterThanOrEqual(2);
  });

  it('clicking the time again collapses the wheels', () => {
    const v = new Date(2024, 5, 7, 13, 45);
    const { getByRole, queryAllByRole } = render(
      <DateTimeInput defaultValue={v} />
    );
    fireEvent.click(getByRole('combobox'));
    const timeBtn = getByRole('button', { name: /Time/ });
    fireEvent.click(timeBtn);
    expect(queryAllByRole('spinbutton').length).toBeGreaterThanOrEqual(2);
    fireEvent.click(timeBtn);
    expect(queryAllByRole('spinbutton').length).toBe(0);
  });

  it('clicking the overlay backdrop collapses the wheels without selecting a date', () => {
    const v = new Date(2024, 5, 7, 13, 45);
    const handler = jest.fn();
    const { getByRole, queryAllByRole, queryByRole, container } = render(
      <DateTimeInput defaultValue={v} onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByRole('button', { name: /Time/ }));
    expect(queryAllByRole('spinbutton').length).toBeGreaterThanOrEqual(2);
    const overlay = container.querySelector(
      '.datetimeinput-time-overlay'
    ) as HTMLElement;
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay);
    expect(queryAllByRole('spinbutton').length).toBe(0);
    expect(queryByRole('dialog')).not.toBeNull();
    expect(handler).not.toHaveBeenCalled();
  });

  it('Escape collapses the wheels first, then closes the popover', () => {
    const v = new Date(2024, 5, 7, 13, 45);
    const { getByRole, queryAllByRole, queryByRole, getAllByRole } = render(
      <DateTimeInput defaultValue={v} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByRole('button', { name: /Time/ }));
    const wheel = getAllByRole('spinbutton')[0];
    fireEvent.keyDown(wheel, { key: 'Escape' });
    expect(queryAllByRole('spinbutton').length).toBe(0);
    expect(queryByRole('dialog')).not.toBeNull();
    fireEvent.keyDown(queryByRole('dialog')!, { key: 'Escape' });
    expect(queryByRole('dialog')).toBeNull();
  });

  it('Escape leaves the year list first, then closes the popover', () => {
    HTMLElement.prototype.scrollIntoView = jest.fn();
    const v = new Date(2024, 5, 7, 13, 45);
    const { getByRole, queryByRole } = render(
      <DateTimeInput defaultValue={v} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(
      getByRole('dialog').querySelector('[aria-haspopup="listbox"]')!
    );
    const year = getByRole('listbox').querySelector<HTMLElement>(
      '[data-focused-year="true"]'
    )!;
    fireEvent.keyDown(year, { key: 'Escape' });
    expect(queryByRole('listbox')).toBeNull();
    expect(queryByRole('dialog')).not.toBeNull();
    fireEvent.keyDown(queryByRole('dialog')!, { key: 'Escape' });
    expect(queryByRole('dialog')).toBeNull();
  });

  it('selecting a date preserves the time-of-day', () => {
    const v = new Date(2024, 5, 7, 13, 45);
    const handler = jest.fn();
    const { getByRole, container } = render(
      <DateTimeInput defaultValue={v} onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    const cells = container.querySelectorAll('[role="gridcell"]');
    const target = Array.from(cells).find(
      c => c.textContent === '20' && !c.className.includes('is-other-month')
    );
    fireEvent.click(target!);
    expect(handler).toHaveBeenCalled();
    const arg: Date = handler.mock.calls[0][0];
    expect(arg.getDate()).toBe(20);
    expect(arg.getHours()).toBe(13);
    expect(arg.getMinutes()).toBe(45);
  });

  it('ArrowUp on the hours wheel increments the hour, keeping the date', () => {
    const v = new Date(2024, 5, 7, 10, 0);
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <DateTimeInput defaultValue={v} onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByRole('button', { name: /Time/ }));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowUp' });
    expect(handler).toHaveBeenCalled();
    const arg: Date = handler.mock.calls[0][0];
    expect(arg.getDate()).toBe(7);
    expect(arg.getHours()).toBe(11);
  });

  it('ArrowUp on the minutes wheel increments the minute, keeping the hour', () => {
    const v = new Date(2024, 5, 7, 10, 0);
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <DateTimeInput defaultValue={v} onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByRole('button', { name: /Time/ }));
    const wheels = getAllByRole('spinbutton');
    fireEvent.keyDown(wheels[1], { key: 'ArrowUp' });
    const arg: Date = handler.mock.calls[0][0];
    expect(arg.getHours()).toBe(10);
    expect(arg.getMinutes()).toBe(1);
  });

  it('Reset reverts edits to the value the popover opened with, and keeps it open', () => {
    const v = new Date(2024, 5, 7, 13, 45);
    const handler = jest.fn();
    const { getByRole, getByText, getAllByRole } = render(
      <DateTimeInput defaultValue={v} onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    // Reveal the wheels and change the hour (13 -> 14).
    fireEvent.click(getByRole('button', { name: /Time/ }));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowUp' });
    // Reset reverts to the value the popover opened with (13:45).
    fireEvent.click(getByText('Reset'));
    const reverted: Date = handler.mock.calls[handler.mock.calls.length - 1][0];
    expect(reverted.getHours()).toBe(13);
    expect(reverted.getMinutes()).toBe(45);
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('Reset reverts to empty when the popover opened with no value', () => {
    const handler = jest.fn();
    const { getByRole, getByText, getAllByRole } = render(
      <DateTimeInput onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    // Reveal the wheels and spin one to set a value from empty.
    fireEvent.click(getByRole('button', { name: /Time/ }));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
    expect(handler.mock.calls[handler.mock.calls.length - 1][0]).not.toBeNull();
    // Reset reverts back to empty, since that is how the popover opened.
    fireEvent.click(getByText('Reset'));
    expect(handler).toHaveBeenLastCalledWith(null);
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('the Done (check) button closes the popover', () => {
    const v = new Date(2024, 5, 7, 13, 45);
    const { getByRole, getByLabelText, queryByRole } = render(
      <DateTimeInput defaultValue={v} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByLabelText('Done'));
    expect(queryByRole('dialog')).toBeNull();
  });

  it('renders <input type="datetime-local"> when mobileNative=true', () => {
    const { container } = render(<DateTimeInput mobileNative={true} />);
    const native = container.querySelector('input[type="datetime-local"]');
    expect(native).not.toBeNull();
  });

  it('forwards step from incrementMinutes on the native input', () => {
    const { container } = render(
      <DateTimeInput mobileNative={true} incrementMinutes={15} />
    );
    const native = container.querySelector(
      'input[type="datetime-local"]'
    ) as HTMLInputElement;
    expect(native.step).toBe('900');
  });

  it('forwards step from incrementSeconds when enableSeconds', () => {
    const { container } = render(
      <DateTimeInput mobileNative={true} enableSeconds incrementSeconds={10} />
    );
    const native = container.querySelector(
      'input[type="datetime-local"]'
    ) as HTMLInputElement;
    expect(native.step).toBe('10');
  });

  it('native input renders the value and round-trips changes through onChange', () => {
    const handler = jest.fn();
    const { container } = render(
      <DateTimeInput
        mobileNative={true}
        defaultValue={new Date(2024, 5, 7, 13, 45)}
        onChange={handler}
      />
    );
    const native = container.querySelector(
      'input[type="datetime-local"]'
    ) as HTMLInputElement;
    expect(native.value).toBe('2024-06-07T13:45');
    fireEvent.change(native, { target: { value: '2024-06-08T14:30' } });
    const committed = handler.mock.calls[0][0] as Date;
    expect(committed.getDate()).toBe(8);
    expect(committed.getHours()).toBe(14);
    expect(committed.getMinutes()).toBe(30);
    expect(committed.getSeconds()).toBe(0);
    fireEvent.change(native, { target: { value: '' } });
    expect(handler).toHaveBeenLastCalledWith(null);
  });

  it('native input pads a year below 1000 to four digits', () => {
    const early = new Date(2024, 2, 4, 14, 30);
    early.setFullYear(19);
    const min = new Date(2024, 0, 1, 9, 0);
    min.setFullYear(19);
    const { container } = render(
      <DateTimeInput mobileNative={true} defaultValue={early} min={min} />
    );
    const native = container.querySelector(
      'input[type="datetime-local"]'
    ) as HTMLInputElement;
    // Unpadded, `19-03-04T14:30` is not a valid value and the input shows
    // nothing.
    expect(native.value).toBe('0019-03-04T14:30');
    expect(native.min).toBe('0019-01-01T09:00');
  });

  it('native input reads a year below 100 back as given', () => {
    const handler = jest.fn();
    const { container } = render(
      <DateTimeInput mobileNative={true} enableSeconds onChange={handler} />
    );
    const native = container.querySelector(
      'input[type="datetime-local"]'
    ) as HTMLInputElement;
    fireEvent.change(native, { target: { value: '0019-03-04T14:30:55' } });
    const committed = handler.mock.calls[0][0] as Date;
    expect([
      committed.getFullYear(),
      committed.getMonth(),
      committed.getDate(),
      committed.getHours(),
      committed.getMinutes(),
      committed.getSeconds(),
      committed.getMilliseconds(),
    ]).toEqual([19, 2, 4, 14, 30, 55, 0]);
  });

  it('native input round-trips a year past 9999', () => {
    const handler = jest.fn();
    const late = new Date(2024, 0, 1, 9, 0);
    late.setFullYear(10000);
    const { container } = render(
      <DateTimeInput
        mobileNative={true}
        defaultValue={late}
        onChange={handler}
      />
    );
    const native = container.querySelector(
      'input[type="datetime-local"]'
    ) as HTMLInputElement;
    expect(native.value).toBe('10000-01-01T09:00');
    fireEvent.change(native, { target: { value: '10000-03-04T14:30' } });
    const committed = handler.mock.calls[0][0] as Date;
    expect([
      committed.getFullYear(),
      committed.getMonth(),
      committed.getDate(),
      committed.getHours(),
      committed.getMinutes(),
    ]).toEqual([10000, 2, 4, 14, 30]);
  });

  it('native input round-trips seconds when enableSeconds', () => {
    const handler = jest.fn();
    const { container } = render(
      <DateTimeInput
        mobileNative={true}
        enableSeconds
        defaultValue={new Date(2024, 5, 7, 13, 45, 20)}
        onChange={handler}
      />
    );
    const native = container.querySelector(
      'input[type="datetime-local"]'
    ) as HTMLInputElement;
    // jsdom normalizes the reflected datetime-local value with milliseconds.
    expect(native.value).toMatch(/^2024-06-07T13:45:20/);
    fireEvent.change(native, { target: { value: '2024-06-08T14:30:55' } });
    const committed = handler.mock.calls[0][0] as Date;
    expect(committed.getSeconds()).toBe(55);
  });

  it('forwards min and max to the native input', () => {
    const { container } = render(
      <DateTimeInput
        mobileNative={true}
        min={new Date(2024, 5, 1, 9, 0)}
        max={new Date(2024, 5, 30, 17, 30)}
      />
    );
    const native = container.querySelector(
      'input[type="datetime-local"]'
    ) as HTMLInputElement;
    expect(native.min).toBe('2024-06-01T09:00');
    expect(native.max).toBe('2024-06-30T17:30');
  });

  it('Layout: calendar appears before the time wheels in DOM order', () => {
    const v = new Date(2024, 5, 7, 13, 45);
    const { getByRole, container } = render(<DateTimeInput defaultValue={v} />);
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByRole('button', { name: /Time/ }));
    const grid = container.querySelector('[role="grid"]')!;
    const firstWheel = container.querySelector('[role="spinbutton"]')!;
    expect(
      grid.compareDocumentPosition(firstWheel) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('forwards ref to the input', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<DateTimeInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('shouldDisableDate prevents click selection', () => {
    const v = new Date(2024, 5, 7, 13, 45);
    const handler = jest.fn();
    const { getByRole, container } = render(
      <DateTimeInput
        defaultValue={v}
        shouldDisableDate={d => d.getDate() === 8}
        onChange={handler}
      />
    );
    fireEvent.click(getByRole('combobox'));
    const cell = Array.from(
      container.querySelectorAll('[role="gridcell"]')
    ).find(
      c => c.textContent === '8' && !c.className.includes('is-other-month')
    );
    fireEvent.click(cell!);
    expect(handler).not.toHaveBeenCalled();
  });

  it('uses custom labels for the footer', () => {
    const { getByRole, getByText, getByLabelText } = render(
      <DateTimeInput
        labels={{ reset: 'Effacer', done: 'Valider', time: 'Heure' }}
      />
    );
    fireEvent.click(getByRole('combobox'));
    expect(getByText('Effacer')).toBeInTheDocument();
    expect(getByLabelText('Valider')).toBeInTheDocument();
    expect(getByText('Heure')).toBeInTheDocument();
  });

  it('footer shows the selected time (12-hour)', () => {
    const v = new Date(2024, 5, 7, 17, 7);
    const { getByRole, getByText } = render(
      <DateTimeInput defaultValue={v} hourFormat="12" />
    );
    fireEvent.click(getByRole('combobox'));
    expect(getByText('5:07 PM')).toBeInTheDocument();
  });

  it('footer shows a dash when there is no value', () => {
    const { getByRole, getByText } = render(<DateTimeInput />);
    fireEvent.click(getByRole('combobox'));
    expect(getByText('—')).toBeInTheDocument();
  });

  it('a 12h format string drives the footer pill and wheels even when hourFormat is unset', () => {
    // The displayed format is the source of truth: an explicit 12h `format`
    // must make both the footer pill and the time wheels 12h, despite
    // hourFormat defaulting to '24'.
    const v = new Date(2024, 5, 7, 17, 7);
    const { getByRole, getByText, getAllByRole } = render(
      <DateTimeInput defaultValue={v} format="YYYY-MM-DD hh:mm A" />
    );
    fireEvent.click(getByRole('combobox'));
    // Footer pill renders the 12h meridiem form, not 24h '17:07'.
    expect(getByText('5:07 PM')).toBeInTheDocument();
    // Reveal the wheels: hours + minutes + AM/PM = 3 spinbuttons.
    fireEvent.click(getByRole('button', { name: /Time/ }));
    expect(getAllByRole('spinbutton').length).toBe(3);
  });

  it('an explicit 24h format string wins over hourFormat="12" for the pill and wheels', () => {
    const v = new Date(2024, 5, 7, 17, 7);
    const { getByRole, getByText, getAllByRole } = render(
      <DateTimeInput
        defaultValue={v}
        format="YYYY-MM-DD HH:mm"
        hourFormat="12"
      />
    );
    fireEvent.click(getByRole('combobox'));
    // Pill renders 24h despite hourFormat="12".
    expect(getByText('17:07')).toBeInTheDocument();
    // Reveal the wheels: no AM/PM column → 2 spinbuttons.
    fireEvent.click(getByRole('button', { name: /Time/ }));
    expect(getAllByRole('spinbutton').length).toBe(2);
  });
});

// -------------------------------------------------------------------------
// Segmented manual entry across the combined date + time field.
// -------------------------------------------------------------------------

describe('DateTimeInput segmented input entry', () => {
  const dt = () => new Date(2024, 5, 7, 13, 45);

  it('selects the year segment on focus', () => {
    const { getByRole } = render(<DateTimeInput defaultValue={dt()} />);
    const input = getByRole('combobox') as HTMLInputElement;
    expect(input.value).toBe('2024-06-07 13:45');
    act(() => {
      input.focus();
    });
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 4]);
  });

  it('ArrowRight walks year → month → day → hours → minutes', () => {
    const { getByRole } = render(<DateTimeInput defaultValue={dt()} />);
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect([input.selectionStart, input.selectionEnd]).toEqual([5, 7]); // month
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect([input.selectionStart, input.selectionEnd]).toEqual([8, 10]); // day
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect([input.selectionStart, input.selectionEnd]).toEqual([11, 13]); // hours
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect([input.selectionStart, input.selectionEnd]).toEqual([14, 16]); // minutes
  });

  it('ArrowUp on the hours segment increments hours while preserving the date', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateTimeInput defaultValue={dt()} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' }); // → hours
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    const arg = handler.mock.calls[0][0] as Date;
    expect(arg.getHours()).toBe(14);
    expect(arg.getDate()).toBe(7);
    expect(arg.getMonth()).toBe(5);
    expect(input.value).toBe('2024-06-07 14:45');
  });

  it('digit entry on the day segment updates the day, keeping the time', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateTimeInput defaultValue={dt()} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' }); // → day
    fireEvent.keyDown(input, { key: '1' });
    fireEvent.keyDown(input, { key: '5' });
    const arg = handler.mock.calls[handler.mock.calls.length - 1][0] as Date;
    expect(arg.getDate()).toBe(15);
    expect(arg.getHours()).toBe(13);
    expect(arg.getMinutes()).toBe(45);
  });

  it('honors a/p on the meridiem segment in 12h mode', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateTimeInput defaultValue={dt()} hourFormat="12" onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    expect(input.value).toBe('2024-06-07 01:45 PM');
    act(() => {
      input.focus();
    });
    // year → month → day → hours → minutes → ampm
    for (let i = 0; i < 5; i++) {
      fireEvent.keyDown(input, { key: 'ArrowRight' });
    }
    fireEvent.keyDown(input, { key: 'a' });
    expect((handler.mock.calls[0][0] as Date).getHours()).toBe(1); // 1 PM → 1 AM
    fireEvent.keyDown(input, { key: 'p' });
    expect(
      (handler.mock.calls[handler.mock.calls.length - 1][0] as Date).getHours()
    ).toBe(13);
  });

  it('separators jump across both date and time segments', () => {
    const { getByRole } = render(<DateTimeInput defaultValue={dt()} />);
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: '-' }); // → month
    fireEvent.keyDown(input, { key: '/' }); // → day
    fireEvent.keyDown(input, { key: ' ' }); // → hours
    fireEvent.keyDown(input, { key: ':' }); // → minutes
    expect([input.selectionStart, input.selectionEnd]).toEqual([14, 16]);
    expect(input.value).toBe('2024-06-07 13:45'); // nothing inserted
  });

  it('falls back to free-form text entry for Intl-options formats', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateTimeInput
        defaultValue={dt()}
        format={{ dateStyle: 'short', timeStyle: 'short' }}
        onChange={handler}
        openOnFocus={false}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('rejects an hour edit blocked by unselectableTimes', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateTimeInput
        defaultValue={new Date(2024, 5, 7, 11, 0)}
        unselectableTimes={d => d.getHours() === 12}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    // year → month → day → hours
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowUp' }); // 11 → 12 is blocked
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('2024-06-07 11:00');
  });

  it('rejects a day edit blocked by shouldDisableDate', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateTimeInput
        defaultValue={dt()}
        shouldDisableDate={d => d.getDate() === 8}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    // year → month → day
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowUp' }); // 7 → 8 is blocked
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('2024-06-07 13:45');
  });

  it('unselectableDates blocks by calendar day regardless of the time of day', () => {
    // The unselectable entry is midnight on the 16th; the candidate carries
    // 10:00 — the day-based isSameDay composition must still reject it.
    const handler = jest.fn();
    const { getByRole } = render(
      <DateTimeInput
        defaultValue={new Date(2024, 5, 15, 10, 0)}
        unselectableDates={[new Date(2024, 5, 16)]}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    // year → month → day
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowUp' }); // 15 → 16 is blocked
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('2024-06-15 10:00');
  });

  it('still commits unblocked edits when blocking predicates are set', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateTimeInput
        defaultValue={new Date(2024, 5, 15, 10, 0)}
        shouldDisableDate={d => d.getDate() === 16}
        unselectableDates={[new Date(2024, 5, 16)]}
        unselectableTimes={d => d.getHours() === 12}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    // year → month → day
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // 15 → 14 is allowed
    const arg = handler.mock.calls[0][0] as Date;
    expect(arg.getDate()).toBe(14);
    expect(arg.getHours()).toBe(10);
    expect(input.value).toBe('2024-06-14 10:00');
  });
});

describe('DateTimeInput editable / popover modes', () => {
  const dt = () => new Date(2024, 5, 7, 13, 45);

  it('editable={false}: typing / arrows do not change the value', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateTimeInput defaultValue={dt()} editable={false} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('2024-06-07 13:45');
  });

  it('editable={false}: the popover still opens and date selection works', () => {
    const handler = jest.fn();
    const { getByRole, container } = render(
      <DateTimeInput defaultValue={dt()} editable={false} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.click(input);
    expect(getByRole('dialog')).toBeInTheDocument();
    const target = Array.from(
      container.querySelectorAll('[role="gridcell"]')
    ).find(c => c.textContent === '20');
    fireEvent.click(target!);
    expect(handler).toHaveBeenCalled();
  });

  it('popover={false}: focus / click / ArrowDown do not open a dialog', () => {
    const { getByRole, queryByRole } = render(
      <DateTimeInput defaultValue={dt()} popover={false} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.click(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(queryByRole('dialog')).toBeNull();
  });

  it('popover={false}: still supports segmented typing (input-only)', () => {
    const handler = jest.fn();
    const { getByRole, queryByRole } = render(
      <DateTimeInput defaultValue={dt()} popover={false} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect((handler.mock.calls[0][0] as Date).getFullYear()).toBe(2025);
    expect(queryByRole('dialog')).toBeNull();
  });
});

describe('DateTimeInput launcher icon', () => {
  const dtv = () => new Date(2024, 5, 7, 13, 45);

  it('opens the popover when the launcher is clicked, and toggles it closed', () => {
    const { getByLabelText, queryByRole } = render(
      <DateTimeInput openOnFocus={false} />
    );
    const trigger = getByLabelText('Choose date and time');
    expect(queryByRole('dialog')).toBeNull();
    fireEvent.click(trigger);
    expect(queryByRole('dialog')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(queryByRole('dialog')).toBeNull();
  });

  it('triggerIcon={false} renders no launcher', () => {
    const { queryByLabelText } = render(<DateTimeInput triggerIcon={false} />);
    expect(queryByLabelText('Choose date and time')).toBeNull();
  });

  it('renders no launcher when popover={false} or inline', () => {
    const { queryByLabelText, rerender } = render(
      <DateTimeInput popover={false} />
    );
    expect(queryByLabelText('Choose date and time')).toBeNull();
    rerender(<DateTimeInput inline />);
    expect(queryByLabelText('Choose date and time')).toBeNull();
  });

  it('disables the launcher when readOnly', () => {
    const { getByLabelText, queryByRole } = render(
      <DateTimeInput readOnly defaultValue={dtv()} />
    );
    const trigger = getByLabelText('Choose date and time') as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
    fireEvent.click(trigger);
    expect(queryByRole('dialog')).toBeNull();
  });

  it('editable={false} keeps the launcher working (picker-only)', () => {
    const { getByLabelText, getByRole } = render(
      <DateTimeInput editable={false} openOnFocus={false} />
    );
    fireEvent.click(getByLabelText('Choose date and time'));
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('gives way to whichever spinner is drawn', () => {
    // Its own Control draws the spinner where the launcher sits.
    const own = render(<DateTimeInput isLoading />);
    expect(own.container.querySelectorAll('.is-loading')).toHaveLength(1);
    expect(own.queryByLabelText('Choose date and time')).toBeNull();
    own.unmount();

    // Inside a Control it renders none, so nothing is drawn to give way to.
    const inner = render(
      <Field>
        <Control>
          <DateTimeInput isLoading />
        </Control>
      </Field>
    );
    expect(inner.container.querySelector('.is-loading')).toBeNull();
    expect(inner.getByLabelText('Choose date and time').tagName).toBe('BUTTON');
    inner.unmount();

    // A loading Control it sits in draws the spinner in the same place.
    const outer = render(
      <Field>
        <Control isLoading>
          <DateTimeInput />
        </Control>
      </Field>
    );
    expect(outer.container.querySelectorAll('.is-loading')).toHaveLength(1);
    expect(outer.queryByLabelText('Choose date and time')).toBeNull();
    outer.unmount();

    // An explicit `triggerIcon` still wins.
    const forced = render(
      <Field>
        <Control isLoading>
          <DateTimeInput triggerIcon />
        </Control>
      </Field>
    );
    expect(forced.getByLabelText('Choose date and time').tagName).toBe(
      'BUTTON'
    );
  });

  it('DateTimeInputBase gives way to a loading Control it sits in', () => {
    const loading = render(
      <Field>
        <Control isLoading>
          <DateTimeInputBase />
        </Control>
      </Field>
    );
    expect(loading.queryByLabelText('Choose date and time')).toBeNull();
    loading.unmount();

    const idle = render(
      <Field>
        <Control>
          <DateTimeInputBase />
        </Control>
      </Field>
    );
    expect(idle.getByLabelText('Choose date and time').tagName).toBe('BUTTON');
    idle.unmount();

    const forced = render(
      <Field>
        <Control isLoading>
          <DateTimeInputBase triggerIcon />
        </Control>
      </Field>
    );
    expect(forced.getByLabelText('Choose date and time').tagName).toBe(
      'BUTTON'
    );
  });
});

// -------------------------------------------------------------------------
// Remaining DateTimeInputBase branches: min/max clamping of date and time
// edits, controlled values, empty-value wheels, blur parsing, inline hidden
// inputs, seconds handling, and the bare base component.
// -------------------------------------------------------------------------

describe('DateTimeInputBase remaining branches', () => {
  const dt = () => new Date(2024, 5, 7, 13, 45);

  it('bare DateTimeInputBase renders the default launcher and opens/closes without callbacks', () => {
    const { getByRole, getByLabelText, queryByRole } = render(
      <DateTimeInputBase />
    );
    expect(getByLabelText('Choose date and time').tagName).toBe('BUTTON');
    fireEvent.click(getByRole('combobox'));
    expect(getByRole('dialog')).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(queryByRole('dialog')).toBeNull();
  });

  it('controlled value drives the text; value={null} renders empty', () => {
    const { getByRole, rerender } = render(<DateTimeInputBase value={dt()} />);
    expect((getByRole('combobox') as HTMLInputElement).value).toBe(
      '2024-06-07 13:45'
    );
    rerender(<DateTimeInputBase value={null} />);
    expect((getByRole('combobox') as HTMLInputElement).value).toBe('');
  });

  it('derives the popover id from the id prop', () => {
    const { getByRole } = render(<DateTimeInputBase id="appt" />);
    fireEvent.click(getByRole('combobox'));
    expect(getByRole('dialog').id).toBe('appt-popover');
  });

  it('controlled: a wheel change reports through onChange without internal state', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <DateTimeInputBase value={dt()} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.click(input);
    fireEvent.click(getByRole('button', { name: /Time/ }));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowUp' });
    expect((handler.mock.calls[0][0] as Date).getHours()).toBe(14);
    // The parent did not update `value`, so the text stays at 13:45.
    expect(input.value).toBe('2024-06-07 13:45');
  });

  it('clicking inside the time card does not collapse the wheels', () => {
    const { getByRole, getAllByRole, container } = render(
      <DateTimeInput defaultValue={dt()} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByRole('button', { name: /Time/ }));
    const card = container.querySelector(
      '.datetimeinput-time-card'
    ) as HTMLElement;
    fireEvent.click(card);
    expect(getAllByRole('spinbutton').length).toBeGreaterThanOrEqual(2);
  });

  it('fires onOpen once even when an open request repeats, and onClose on close', () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();
    const { getByRole } = render(
      <DateTimeInputBase onOpen={onOpen} onClose={onClose} />
    );
    const input = getByRole('combobox');
    fireEvent.click(input);
    fireEvent.click(input); // already open — no duplicate onOpen
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('rejects a time-wheel change that falls outside min/max', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <DateTimeInput
        defaultValue={new Date(2024, 5, 7, 10, 0)}
        min={new Date(2024, 5, 7, 10, 0)}
        max={new Date(2024, 5, 7, 10, 30)}
        onChange={handler}
      />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByRole('button', { name: /Time/ }));
    // ArrowDown steps back to 09:00, below min, so the change is dropped.
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
    expect(handler).not.toHaveBeenCalled();
    expect((getByRole('combobox') as HTMLInputElement).value).toBe(
      '2024-06-07 10:00'
    );
  });

  it('rejects a date selection whose merged date-time falls outside max', () => {
    // The cell for the 20th is selectable day-wise (midnight ≤ max), but the
    // carried-over time of day (13:45) pushes the merged value past max.
    const handler = jest.fn();
    const { getByRole, container } = render(
      <DateTimeInput
        defaultValue={dt()}
        max={new Date(2024, 5, 20, 10, 0)}
        onChange={handler}
      />
    );
    fireEvent.click(getByRole('combobox'));
    const cell = Array.from(
      container.querySelectorAll('[role="gridcell"]')
    ).find(
      c => c.textContent === '20' && !c.className.includes('is-other-month')
    ) as HTMLButtonElement;
    expect(cell.disabled).toBe(false);
    fireEvent.click(cell);
    expect(handler).not.toHaveBeenCalled();
  });

  it('selecting a date with no value commits midnight', () => {
    const handler = jest.fn();
    const { getByRole, container } = render(
      <DateTimeInput onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    const cell = Array.from(
      container.querySelectorAll('[role="gridcell"]')
    ).find(
      c => c.textContent === '20' && !c.className.includes('is-other-month')
    );
    fireEvent.click(cell!);
    const arg = handler.mock.calls[0][0] as Date;
    expect(arg.getDate()).toBe(20);
    expect(arg.getHours()).toBe(0);
    expect(arg.getMinutes()).toBe(0);
  });

  it('enableSeconds: 12h formatting, seconds pill, four wheels, and seconds preserved on date select', () => {
    const handler = jest.fn();
    const { getByRole, getByText, getAllByRole, container } = render(
      <DateTimeInput
        defaultValue={new Date(2024, 5, 7, 13, 45, 20)}
        hourFormat="12"
        enableSeconds
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    expect(input.value).toBe('2024-06-07 01:45:20 PM');
    fireEvent.click(input);
    // Footer pill shows the seconds in 12-hour form.
    expect(getByText('1:45:20 PM')).toBeInTheDocument();
    fireEvent.click(getByRole('button', { name: /Time/ }));
    // hours + minutes + seconds + AM/PM = 4 wheels.
    expect(getAllByRole('spinbutton').length).toBe(4);
    // Selecting another date carries the full time including seconds.
    const cell = Array.from(
      container.querySelectorAll('[role="gridcell"]')
    ).find(
      c => c.textContent === '20' && !c.className.includes('is-other-month')
    );
    fireEvent.click(cell!);
    const arg = handler.mock.calls[handler.mock.calls.length - 1][0] as Date;
    expect(arg.getDate()).toBe(20);
    expect(arg.getSeconds()).toBe(20);
  });

  it('enableSeconds with no value: wheels start at 00:00:00 and spin sets seconds', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <DateTimeInput enableSeconds onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByRole('button', { name: /Time/ }));
    const wheels = getAllByRole('spinbutton');
    expect(wheels.length).toBe(3);
    fireEvent.keyDown(wheels[2], { key: 'ArrowUp' });
    const arg = handler.mock.calls[0][0] as Date;
    expect(arg.getSeconds()).toBe(1);
    expect(arg.getHours()).toBe(0);
  });

  it('enableSeconds with no value: selecting a date commits zeroed seconds', () => {
    const handler = jest.fn();
    const { getByRole, container } = render(
      <DateTimeInput enableSeconds onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    const cell = Array.from(
      container.querySelectorAll('[role="gridcell"]')
    ).find(
      c => c.textContent === '20' && !c.className.includes('is-other-month')
    );
    fireEvent.click(cell!);
    const arg = handler.mock.calls[0][0] as Date;
    expect(arg.getHours()).toBe(0);
    expect(arg.getSeconds()).toBe(0);
  });

  it('Enter on a time wheel commits and closes the popover', () => {
    const { getByRole, getAllByRole, queryByRole } = render(
      <DateTimeInput defaultValue={dt()} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByRole('button', { name: /Time/ }));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'Enter' });
    expect(queryByRole('dialog')).toBeNull();
  });

  it('haptics opt-in still routes wheel changes through onChange', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <DateTimeInput defaultValue={dt()} haptics onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByRole('button', { name: /Time/ }));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowUp' });
    expect(handler).toHaveBeenCalled();
    expect((handler.mock.calls[0][0] as Date).getHours()).toBe(14);
  });

  it('free-form text parses on blur with the default format', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateTimeInput openOnFocus={false} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2024-12-25 08:30' } });
    fireEvent.blur(input);
    const arg = handler.mock.calls[0][0] as Date;
    expect(arg.getFullYear()).toBe(2024);
    expect(arg.getMonth()).toBe(11);
    expect(arg.getDate()).toBe(25);
    expect(arg.getHours()).toBe(8);
    expect(arg.getMinutes()).toBe(30);
  });

  it('custom parse is invoked on blur', () => {
    const parse = jest.fn(() => new Date(2030, 0, 15, 10, 30));
    const handler = jest.fn();
    const { getByRole } = render(
      <DateTimeInput openOnFocus={false} parse={parse} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'next quarter' } });
    fireEvent.blur(input);
    expect(parse).toHaveBeenCalledWith('next quarter');
    expect((handler.mock.calls[0][0] as Date).getFullYear()).toBe(2030);
  });

  it('Intl-options formats fall back to the default token format for blur parsing', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateTimeInput
        openOnFocus={false}
        format={{ dateStyle: 'short', timeStyle: 'short' }}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2024-12-25 08:30' } });
    fireEvent.blur(input);
    const arg = handler.mock.calls[0][0] as Date;
    expect(arg.getDate()).toBe(25);
    expect(arg.getHours()).toBe(8);
  });

  it('free-form Enter with a blocked value does not commit, and blur reverts', () => {
    // 'H' is a variable-width token → no segment map → free-form path.
    const handler = jest.fn();
    const { getByRole } = render(
      <DateTimeInput
        openOnFocus={false}
        format="YYYY-MM-DD H:mm"
        shouldDisableDate={d => d.getDate() === 16}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2024-06-16 10:00' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handler).not.toHaveBeenCalled();
    fireEvent.blur(input);
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('');
  });

  it('whitespace-only text reverts on blur without committing', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateTimeInput
        defaultValue={dt()}
        openOnFocus={false}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('2024-06-07 13:45');
  });

  it('segmented entry on an empty field seeds from the current date-time', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 5, 9, 10, 30));
    try {
      const handler = jest.fn();
      const { getByRole } = render(
        <DateTimeInput openOnFocus={false} onChange={handler} />
      );
      const input = getByRole('combobox') as HTMLInputElement;
      act(() => {
        input.focus();
      });
      expect(input.value).toBe('2026-06-09 10:30');
      fireEvent.keyDown(input, { key: 'ArrowUp' }); // year segment
      const arg = handler.mock.calls[0][0] as Date;
      expect(arg.getFullYear()).toBe(2027);
      expect(input.value).toBe('2027-06-09 10:30');
    } finally {
      jest.useRealTimers();
    }
  });

  it('a malformed native value commits null (invalid-format guard)', () => {
    // jsdom sanitizes bad values to '' before React sees them, so force the
    // value getter to surface a malformed string to the change handler.
    const handler = jest.fn();
    const { container } = render(
      <DateTimeInput mobileNative={true} onChange={handler} />
    );
    const native = container.querySelector(
      'input[type="datetime-local"]'
    ) as HTMLInputElement;
    Object.defineProperty(native, 'value', {
      configurable: true,
      get: () => 'not-a-datetime',
      set: () => {},
    });
    fireEvent.change(native);
    expect(handler).toHaveBeenCalledWith(null);
  });

  it('supports a callback ref', () => {
    const refFn = jest.fn();
    render(<DateTimeInput ref={refFn} />);
    expect(refFn).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it('inline renders the panel without a popover and emits a hidden input for name', () => {
    const { container, queryByRole } = render(
      <DateTimeInput inline name="appt" defaultValue={dt()} />
    );
    expect(queryByRole('dialog')).toBeNull();
    expect(container.querySelector('[role="grid"]')).not.toBeNull();
    const hidden = container.querySelector(
      'input[type="hidden"]'
    ) as HTMLInputElement;
    expect(hidden.value).toBe('2024-06-07T13:45');
  });

  it('inline with name but no value emits an empty hidden input', () => {
    const { container } = render(<DateTimeInput inline name="appt" />);
    const hidden = container.querySelector(
      'input[type="hidden"]'
    ) as HTMLInputElement;
    expect(hidden).not.toBeNull();
    expect(hidden.value).toBe('');
  });

  it('inline without a name emits no hidden input', () => {
    const { container } = render(<DateTimeInput inline defaultValue={dt()} />);
    expect(container.querySelector('input[type="hidden"]')).toBeNull();
  });
});

// -------------------------------------------------------------------------
// Small-viewport panel: with the custom popover forced (mobileNative={false})
// on a small viewport, the time wheels grow to the 40px touch item height.
// -------------------------------------------------------------------------

describe('DateTimeInput small viewport', () => {
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) =>
        ({
          matches: query.includes('max-width'),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => true,
          onchange: null,
        }) as unknown as MediaQueryList,
    });
  });

  afterEach(() => {
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('uses the taller 40px wheel items on small viewports', () => {
    const { getByRole, getAllByRole } = render(
      <DateTimeInput
        mobileNative={false}
        defaultValue={new Date(2024, 5, 7, 13, 45)}
      />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByRole('button', { name: /Time/ }));
    expect(getAllByRole('spinbutton').length).toBeGreaterThanOrEqual(2);
    const option = getAllByRole('option')[0] as HTMLElement;
    expect(option.style.height).toBe('40px');
  });
});

describe('DateTimeInput label association (#368)', () => {
  it('associates the label with the input via htmlFor/id', () => {
    const { getByRole, container } = render(
      <DateTimeInput label="Appointment" />
    );
    const input = getByRole('combobox');
    expect(input.id).toBeTruthy();
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      input.id
    );
  });

  it('injects no id without a label', () => {
    const { getByRole } = render(<DateTimeInput />);
    expect(getByRole('combobox')).not.toHaveAttribute('id');
  });

  it('renders the label unwired in inline mode', () => {
    const { container } = render(<DateTimeInput label="Appointment" inline />);
    const label = container.querySelector('label.label');
    expect(label).toHaveTextContent('Appointment');
    expect(label).not.toHaveAttribute('for');
  });
});

describe('DateTimeInput focus inside the popover', () => {
  const v = new Date(2024, 5, 7, 10, 0);

  it('keeps focus on a time wheel the keyboard edits', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <DateTimeInput defaultValue={v} onChange={handler} />
    );
    act(() => {
      getByRole('combobox').focus();
    });
    fireEvent.click(getByRole('button', { name: /Time/ }));
    const wheel = getAllByRole('spinbutton')[0];
    act(() => wheel.focus());
    act(() => {
      fireEvent.keyDown(wheel, { key: 'ArrowDown' });
    });
    expect(handler).toHaveBeenCalled();
    expect(wheel).toHaveFocus();
  });

  it('still moves focus into the popover each time it opens', () => {
    const { getByRole, queryByRole } = render(
      <DateTimeInput defaultValue={v} openOnFocus={false} />
    );
    const launcher = getByRole('button', { name: 'Choose date and time' });
    for (let i = 0; i < 2; i++) {
      act(() => {
        fireEvent.click(launcher);
      });
      const dialog = getByRole('dialog');
      expect(dialog.contains(document.activeElement)).toBe(true);
      act(() => {
        fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
      });
      expect(queryByRole('dialog')).toBeNull();
    }
  });
});

describe('DateTimeInput focus and the time wheels', () => {
  const v = new Date(2024, 5, 7, 10, 0);
  const openPopover = (input: HTMLElement) => {
    act(() => {
      input.focus();
    });
  };
  const pressTimeButton = (button: HTMLElement) => {
    act(() => {
      button.focus();
    });
    act(() => {
      fireEvent.click(button);
    });
  };

  it('moves focus to the hours wheel as the Time button opens the wheels', () => {
    const { getByRole, getAllByRole } = render(
      <DateTimeInput defaultValue={v} />
    );
    openPopover(getByRole('combobox'));
    pressTimeButton(getByRole('button', { name: /Time/ }));
    const wheels = getAllByRole('spinbutton');
    expect(wheels[0]).toHaveAttribute('aria-label', 'hours');
    expect(wheels[0]).toHaveFocus();
  });

  it('closes the popover on Alt+ArrowUp from a wheel, turning nothing', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole, queryByRole } = render(
      <DateTimeInput defaultValue={v} onChange={handler} />
    );
    openPopover(getByRole('combobox'));
    pressTimeButton(getByRole('button', { name: /Time/ }));
    act(() => {
      fireEvent.keyDown(getAllByRole('spinbutton')[0], {
        key: 'ArrowUp',
        altKey: true,
      });
    });
    expect(queryByRole('dialog')).toBeNull();
    expect(handler).not.toHaveBeenCalled();
    expect(getByRole('combobox')).toHaveFocus();
  });

  it('hands focus back to the Time button when Escape closes the wheels', () => {
    const { getByRole, queryAllByRole, getAllByRole } = render(
      <DateTimeInput defaultValue={v} />
    );
    openPopover(getByRole('combobox'));
    const timeButton = getByRole('button', { name: /Time/ });
    pressTimeButton(timeButton);
    const minutes = getAllByRole('spinbutton')[1];
    act(() => {
      minutes.focus();
    });
    act(() => {
      fireEvent.keyDown(minutes, { key: 'Escape' });
    });
    expect(queryAllByRole('spinbutton')).toHaveLength(0);
    expect(timeButton).toHaveFocus();
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('hands focus back to the Time button when it or a click outside the card closes them', () => {
    const { getByRole, getAllByRole, queryAllByRole, container } = render(
      <DateTimeInput defaultValue={v} />
    );
    openPopover(getByRole('combobox'));
    const timeButton = getByRole('button', { name: /Time/ });
    // A click on the button need not focus it, so focus can still be on a
    // wheel as the button closes them.
    pressTimeButton(timeButton);
    expect(getAllByRole('spinbutton')[0]).toHaveFocus();
    act(() => {
      fireEvent.click(timeButton);
    });
    expect(queryAllByRole('spinbutton')).toHaveLength(0);
    expect(timeButton).toHaveFocus();
    // A press on the overlay takes focus off the wheel before the click,
    // as a browser does for a press on something that takes no focus.
    pressTimeButton(timeButton);
    const hours = getAllByRole('spinbutton')[0];
    expect(hours).toHaveFocus();
    act(() => {
      hours.blur();
    });
    act(() => {
      fireEvent.click(container.querySelector('.datetimeinput-time-overlay')!);
    });
    expect(queryAllByRole('spinbutton')).toHaveLength(0);
    expect(timeButton).toHaveFocus();
  });

  it('leaves focus on a calendar day when Escape closes the wheels from there', () => {
    const { getByRole, queryAllByRole } = render(
      <DateTimeInput defaultValue={v} />
    );
    openPopover(getByRole('combobox'));
    pressTimeButton(getByRole('button', { name: /Time/ }));
    const day = getByRole('dialog').querySelector<HTMLElement>(
      '[data-focused="true"]'
    )!;
    act(() => {
      day.focus();
    });
    act(() => {
      fireEvent.keyDown(day, { key: 'Escape' });
    });
    expect(queryAllByRole('spinbutton')).toHaveLength(0);
    expect(day).toHaveFocus();
  });

  it('keeps focus on the wheel the keys turn', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <DateTimeInput defaultValue={v} onChange={handler} />
    );
    openPopover(getByRole('combobox'));
    pressTimeButton(getByRole('button', { name: /Time/ }));
    const hours = getAllByRole('spinbutton')[0];
    act(() => {
      fireEvent.keyDown(hours, { key: 'ArrowUp' });
    });
    act(() => {
      fireEvent.keyDown(hours, { key: 'ArrowUp' });
    });
    expect((handler.mock.lastCall![0] as Date).getHours()).toBe(12);
    expect(hours).toHaveFocus();
  });

  it('does the same inline', () => {
    const { getByRole, getAllByRole, queryAllByRole } = render(
      <DateTimeInput defaultValue={v} inline />
    );
    const timeButton = getByRole('button', { name: /Time/ });
    pressTimeButton(timeButton);
    const hours = getAllByRole('spinbutton')[0];
    expect(hours).toHaveFocus();
    act(() => {
      fireEvent.keyDown(hours, { key: 'Escape' });
    });
    expect(queryAllByRole('spinbutton')).toHaveLength(0);
    expect(timeButton).toHaveFocus();
  });
});

describe('DateTimeInput focus handed back on close', () => {
  // The calendar focuses a cell as the popover opens. Closing must return
  // focus to the input, and under openOnFocus (the default) that focus must
  // not open the popover again.
  const v = new Date(2024, 5, 15, 9, 30);
  const openByFocus = (input: HTMLElement) => {
    act(() => {
      input.focus();
    });
  };
  const pressEscape = () => {
    act(() => {
      fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    });
  };

  it('opens with focus on the focused day, not the header', () => {
    const { getByRole } = render(<DateTimeInput defaultValue={v} />);
    openByFocus(getByRole('combobox'));
    const day = getByRole('dialog').querySelector('[data-focused="true"]');
    expect(day).toHaveTextContent('15');
    expect(document.activeElement).toBe(day);
  });

  it('Escape closes it and leaves focus on the input', () => {
    const onOpen = jest.fn();
    const { getByRole, queryByRole } = render(
      <DateTimeInput defaultValue={v} onOpen={onOpen} />
    );
    const input = getByRole('combobox');
    openByFocus(input);
    expect(getByRole('dialog')).toBeInTheDocument();
    expect(input).not.toHaveFocus();
    pressEscape();
    expect(queryByRole('dialog')).toBeNull();
    expect(input).toHaveFocus();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('the Done button closes it the same way', () => {
    const onOpen = jest.fn();
    const { getByRole, getByLabelText, queryByRole } = render(
      <DateTimeInput defaultValue={v} onOpen={onOpen} />
    );
    const input = getByRole('combobox');
    openByFocus(input);
    act(() => {
      fireEvent.click(getByLabelText('Done'));
    });
    expect(queryByRole('dialog')).toBeNull();
    expect(input).toHaveFocus();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('Enter on a time wheel closes it the same way', () => {
    const onOpen = jest.fn();
    const { getByRole, getAllByRole, queryByRole, container } = render(
      <DateTimeInput defaultValue={v} onOpen={onOpen} />
    );
    const input = getByRole('combobox');
    openByFocus(input);
    act(() => {
      fireEvent.click(container.querySelector('.datetimeinput-footer-time')!);
    });
    const wheel = getAllByRole('spinbutton')[0];
    act(() => {
      wheel.focus();
    });
    act(() => {
      fireEvent.keyDown(wheel, { key: 'Enter' });
    });
    expect(queryByRole('dialog')).toBeNull();
    expect(input).toHaveFocus();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('a click outside closes it for good', () => {
    const onOpen = jest.fn();
    const { getByRole, queryByRole } = render(
      <>
        <DateTimeInput defaultValue={v} onOpen={onOpen} />
        <button>Elsewhere</button>
      </>
    );
    const input = getByRole('combobox');
    openByFocus(input);
    const elsewhere = getByRole('button', { name: 'Elsewhere' });
    // pointerDown closes the popover without moving focus, so the trap hands
    // it to the input, which must not reopen. The focus() after it stands in
    // for the browser moving focus to what was clicked.
    act(() => {
      fireEvent.pointerDown(elsewhere);
    });
    expect(queryByRole('dialog')).toBeNull();
    expect(input).toHaveFocus();
    act(() => {
      elsewhere.focus();
    });
    expect(queryByRole('dialog')).toBeNull();
    expect(elsewhere).toHaveFocus();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('opens again when the user comes back to the input', () => {
    const { getByRole, queryByRole } = render(
      <>
        <DateTimeInput defaultValue={v} />
        <button>Elsewhere</button>
      </>
    );
    const input = getByRole('combobox');
    openByFocus(input);
    pressEscape();
    expect(queryByRole('dialog')).toBeNull();

    // A click on the input focus is already on.
    fireEvent.click(input);
    expect(getByRole('dialog')).toBeInTheDocument();
    pressEscape();
    expect(queryByRole('dialog')).toBeNull();

    // Leaving and coming back.
    act(() => {
      getByRole('button', { name: 'Elsewhere' }).focus();
    });
    openByFocus(input);
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  describe('commits nothing the user did not type or pick', () => {
    const renderWith = (defaultValue: Date | null) => {
      const onChange = jest.fn();
      const utils = render(
        <>
          <DateTimeInput defaultValue={defaultValue} onChange={onChange} />
          <button>Elsewhere</button>
        </>
      );
      const input = utils.getByRole('combobox') as HTMLInputElement;
      const elsewhere = utils.getByRole('button', { name: 'Elsewhere' });
      const leave = () =>
        act(() => {
          elsewhere.focus();
        });
      const clickOutside = () => {
        act(() => {
          fireEvent.pointerDown(elsewhere);
        });
        leave();
      };
      return { ...utils, input, onChange, leave, clickOutside };
    };
    // The display leaves the seconds out, so a re-parse would drop them.
    const withSeconds = new Date(2024, 5, 15, 9, 30, 45);

    it('when Escape dismisses a value with seconds and focus moves on', () => {
      const { input, onChange, leave } = renderWith(withSeconds);
      openByFocus(input);
      pressEscape();
      leave();
      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('2024-06-15 09:30');
    });

    it('when the ✓ button or a click outside dismisses it', () => {
      const {
        input,
        onChange,
        leave,
        clickOutside,
        getByLabelText,
        getByRole,
      } = renderWith(withSeconds);
      openByFocus(input);
      act(() => {
        fireEvent.click(getByLabelText('Done'));
      });
      leave();
      openByFocus(input);
      expect(getByRole('dialog')).toBeInTheDocument();
      clickOutside();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('when a click outside dismisses an empty field', () => {
      const { input, onChange, clickOutside } = renderWith(null);
      openByFocus(input);
      clickOutside();
      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
    });

    it('when Escape dismisses an empty field, which stays empty', () => {
      const { input, onChange, leave } = renderWith(null);
      openByFocus(input);
      pressEscape();
      expect(input).toHaveFocus();
      expect(input).toHaveValue('');
      leave();
      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
    });

    it('when the launcher dismisses an empty field, which stays empty', () => {
      const { input, onChange, getByRole, queryByRole } = renderWith(null);
      openByFocus(input);
      expect(input).not.toHaveValue('');
      // Pressing the launcher focuses it before the click closes the
      // popover, so the trap has no focus to hand back.
      const launcher = getByRole('button', { name: 'Choose date and time' });
      act(() => {
        fireEvent.pointerDown(launcher);
        launcher.focus();
      });
      act(() => {
        fireEvent.click(launcher);
      });
      expect(queryByRole('dialog')).toBeNull();
      expect(launcher).toHaveFocus();
      expect(input).toHaveValue('');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('but keeps a date typed after the dismiss, seconds and all', () => {
      const { input, onChange, leave } = renderWith(withSeconds);
      openByFocus(input);
      pressEscape();
      for (const key of '2025') fireEvent.keyDown(input, { key });
      leave();
      expect(input).toHaveValue('2025-06-15 09:30');
      expect(onChange).toHaveBeenLastCalledWith(
        new Date(2025, 5, 15, 9, 30, 45)
      );
    });
  });
});

describe('DateTimeInput left without typing', () => {
  // Leaving commits nothing nobody typed: re-parsing the display would drop
  // the seconds it leaves out, and an empty field's seed is not the user's.
  const renderWith = (props: React.ComponentProps<typeof DateTimeInput>) => {
    const onChange = jest.fn();
    const utils = render(
      <>
        <DateTimeInput {...props} onChange={onChange} />
        <button>Elsewhere</button>
      </>
    );
    const input = utils.getByRole('combobox') as HTMLInputElement;
    const elsewhere = utils.getByRole('button', { name: 'Elsewhere' });
    // Under openOnFocus the calendar takes the first focus, and the second
    // is the user clicking back into the field before clicking away.
    const visit = () => {
      act(() => {
        input.focus();
      });
      act(() => {
        input.focus();
      });
      expect(input).toHaveFocus();
      act(() => {
        fireEvent.pointerDown(elsewhere);
      });
      act(() => {
        elsewhere.focus();
      });
    };
    return { ...utils, input, onChange, visit };
  };

  describe.each([
    ['off', { openOnFocus: false }],
    ['on, the default', {}],
  ] as const)('with openOnFocus %s', (_, mode) => {
    it('keeps the seconds the display leaves out', () => {
      const { input, onChange, visit } = renderWith({
        ...mode,
        defaultValue: new Date(2024, 5, 15, 9, 30, 45),
      });
      visit();
      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('2024-06-15 09:30');
    });

    it('leaves an empty field empty', () => {
      const { input, onChange, visit } = renderWith(mode);
      visit();
      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
    });
  });

  it('commits nothing on Enter over the text it showed', () => {
    const parse = jest.fn(() => new Date(2024, 5, 15, 9, 30));
    const { input, onChange } = renderWith({
      // No segments, so Enter parses the text.
      format: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      },
      parse,
      defaultValue: new Date(2024, 5, 15, 9, 30, 45),
      openOnFocus: false,
    });
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(parse).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('adds nothing on leaving after a typed edit, so the seconds stay', () => {
    const { input, onChange, getByRole } = renderWith({
      openOnFocus: false,
      defaultValue: new Date(2024, 5, 15, 9, 30, 45),
    });
    act(() => {
      input.focus();
    });
    for (const key of '2025') fireEvent.keyDown(input, { key });
    const typed = onChange.mock.calls.length;
    act(() => {
      getByRole('button', { name: 'Elsewhere' }).focus();
    });
    expect(input).toHaveValue('2025-06-15 09:30');
    expect(onChange).toHaveBeenCalledTimes(typed);
    expect(onChange).toHaveBeenLastCalledWith(new Date(2025, 5, 15, 9, 30, 45));
  });

  it('commits nothing for a value when focus opens a portaled popover', () => {
    // The portal sits outside the field, so the focus the calendar takes as
    // it opens reads as leaving.
    const { input, onChange, getByRole } = renderWith({
      appendToBody: true,
      defaultValue: new Date(2024, 5, 15, 9, 30, 45),
    });
    act(() => {
      input.focus();
    });
    expect(getByRole('dialog')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('2024-06-15 09:30');
  });

  it.each([
    ['in place', false],
    ['portaled', true],
  ])(
    "shows an empty field's seed while a popover %s is open, then drops it",
    (_, appendToBody) => {
      const { input, onChange, getByRole, queryByRole } = renderWith({
        appendToBody,
      });
      act(() => {
        input.focus();
      });
      expect(getByRole('dialog')).toBeInTheDocument();
      expect(input).not.toHaveValue('');
      const elsewhere = getByRole('button', { name: 'Elsewhere' });
      act(() => {
        fireEvent.pointerDown(elsewhere);
      });
      act(() => {
        elsewhere.focus();
      });
      expect(queryByRole('dialog')).toBeNull();
      expect(input).toHaveValue('');
      expect(onChange).not.toHaveBeenCalled();
    }
  );
});

describe('DateTimeInput onOpen and onClose', () => {
  const v = new Date(2024, 5, 15, 9, 30);
  const pressEscape = (on: Element) =>
    act(() => {
      fireEvent.keyDown(on, { key: 'Escape' });
    });

  it('fire once per open and close under StrictMode', () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();
    const { getByRole, queryByRole } = render(
      <React.StrictMode>
        <DateTimeInput defaultValue={v} onOpen={onOpen} onClose={onClose} />
      </React.StrictMode>
    );
    act(() => {
      getByRole('combobox').focus();
    });
    expect(getByRole('dialog')).toBeInTheDocument();
    pressEscape(document.activeElement!);
    expect(queryByRole('dialog')).toBeNull();
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('still opens after an onClose that focuses the input', () => {
    // Under openOnFocus that focus asks to open from inside onClose, before
    // the close has rendered, and the later request wins.
    const Picker = () => {
      const inputRef = React.useRef<HTMLInputElement>(null);
      const refocusedRef = React.useRef(false);
      return (
        <DateTimeInput
          ref={inputRef}
          defaultValue={v}
          onClose={() => {
            if (refocusedRef.current) return;
            refocusedRef.current = true;
            inputRef.current?.focus();
          }}
        />
      );
    };
    const { getByRole, queryByRole } = render(<Picker />);
    const input = getByRole('combobox');
    act(() => {
      input.focus();
    });
    pressEscape(document.activeElement!);
    expect(getByRole('dialog')).toBeInTheDocument();
    pressEscape(document.activeElement!);
    expect(queryByRole('dialog')).toBeNull();
    fireEvent.click(input);
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('fires onClose once when the input and the popover both take Escape', () => {
    const onClose = jest.fn();
    const { getByRole, queryByRole } = render(
      <DateTimeInput defaultValue={v} onClose={onClose} openOnFocus={false} />
    );
    const input = getByRole('combobox');
    act(() => {
      fireEvent.click(getByRole('button', { name: 'Choose date and time' }));
    });
    act(() => {
      input.focus();
    });
    expect(getByRole('dialog')).toBeInTheDocument();
    pressEscape(input);
    expect(queryByRole('dialog')).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// HTML's datetime-local input holds no year below 1, so the picker stops there
// on every path a value can arrive by.
describe('DateTimeInput before year 1', () => {
  const at = (year: number, month: number, day: number, h = 0, m = 0) => {
    const d = makeDate(year, month, day);
    d.setHours(h, m);
    return d;
  };
  const lastYear = (handler: jest.Mock) =>
    (
      handler.mock.calls[handler.mock.calls.length - 1][0] as Date
    ).getFullYear();
  const focusInput = (input: HTMLElement) =>
    act(() => {
      input.focus();
    });

  it('picks a day in year 1 from the calendar and disables the days before', () => {
    const handler = jest.fn();
    const { container, getByLabelText } = render(
      <DateTimeInput
        inline
        defaultValue={at(1, 0, 15, 9, 30)}
        onChange={handler}
      />
    );
    expect(getByLabelText('Previous month')).toBeDisabled();
    const cells = Array.from(container.querySelectorAll('[role="gridcell"]'));
    // 1 January of year 1 is a Monday, so the grid opens on 31 December of
    // year 0.
    expect(
      cells.find(
        c => c.textContent === '31' && c.className.includes('is-other-month')
      )
    ).toBeDisabled();
    fireEvent.click(
      cells.find(
        c => c.textContent === '1' && !c.className.includes('is-other-month')
      )!
    );
    expect(handler).toHaveBeenCalledWith(at(1, 0, 1, 9, 30));
  });

  it('keeps the calendar at year 1 under a max before it', () => {
    // StrictMode runs the focus re-clamp twice on mount, so a clamp that
    // swaps between the crossed bounds would end on the max.
    const { container, getByLabelText } = render(
      <React.StrictMode>
        <DateTimeInput inline max={at(0, 11, 31, 12, 0)} />
      </React.StrictMode>
    );
    expect(container.querySelector('.dateinput-month-label')!.textContent).toBe(
      'January 1'
    );
    expect(getByLabelText('Previous month')).toBeDisabled();
  });

  it('submits a value in year 1, and nothing for one before it', () => {
    const submitted = (defaultValue: Date) => {
      const { container, unmount } = render(
        <DateTimeInput inline name="when" defaultValue={defaultValue} />
      );
      const hidden = container.querySelector(
        'input[type="hidden"]'
      ) as HTMLInputElement;
      const value = hidden.value;
      unmount();
      return value;
    };
    expect(submitted(at(1, 5, 15, 10, 30))).toBe('0001-06-15T10:30');
    expect(submitted(at(0, 5, 15, 10, 30))).toBe('');
    expect(submitted(at(-1, 5, 15, 10, 30))).toBe('');
  });

  it('turns the time wheels on a value in year 1 but not before', () => {
    for (const [year, allowed] of [
      [1, true],
      [0, false],
      [-1, false],
    ] as const) {
      const handler = jest.fn();
      const { getByRole, getAllByRole, unmount } = render(
        <DateTimeInput value={at(year, 5, 15, 10, 0)} onChange={handler} />
      );
      fireEvent.click(getByRole('combobox'));
      fireEvent.click(getByRole('button', { name: /Time/ }));
      fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowUp' });
      if (allowed) expect(handler).toHaveBeenCalledWith(at(year, 5, 15, 11, 0));
      else expect(handler).not.toHaveBeenCalled();
      unmount();
    }
  });

  describe('segmented typing', () => {
    it('steps into year 1 and no further', () => {
      const handler = jest.fn();
      const { getByRole } = render(
        <DateTimeInput
          defaultValue={at(2, 5, 15, 10, 0)}
          onChange={handler}
          openOnFocus={false}
        />
      );
      const input = getByRole('combobox') as HTMLInputElement;
      focusInput(input);
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(lastYear(handler)).toBe(1);
      expect(input.value).toBe('0001-06-15 10:00');
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(input.value).toBe('0001-06-15 10:00');
    });

    it('leaves a value in year 0 only towards year 1', () => {
      const handler = jest.fn();
      const { getByRole } = render(
        <DateTimeInput
          value={at(0, 5, 15, 10, 0)}
          onChange={handler}
          openOnFocus={false}
        />
      );
      const input = getByRole('combobox') as HTMLInputElement;
      focusInput(input);
      // Down to a negative year is out of range.
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(handler).not.toHaveBeenCalled();
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(lastYear(handler)).toBe(1);
    });
  });

  describe('parsing', () => {
    const typeAndLeave = (input: HTMLInputElement, text: string) => {
      fireEvent.change(input, { target: { value: text } });
      fireEvent.blur(input);
    };

    it('reads year 1 and rejects year 0 with the default parse', () => {
      const handler = jest.fn();
      const { getByRole } = render(
        <DateTimeInputBase openOnFocus={false} onChange={handler} />
      );
      const input = getByRole('combobox') as HTMLInputElement;
      typeAndLeave(input, '0000-06-16 10:00');
      expect(handler).not.toHaveBeenCalled();
      expect(input.value).toBe('');
      typeAndLeave(input, '0001-06-16 10:00');
      expect(handler).toHaveBeenCalledWith(at(1, 5, 16, 10, 0));
    });

    it('rejects a negative year from a custom parse', () => {
      const handler = jest.fn();
      const { getByRole } = render(
        <DateTimeInputBase
          openOnFocus={false}
          parse={() => at(-1, 5, 16, 10, 0)}
          onChange={handler}
        />
      );
      const input = getByRole('combobox') as HTMLInputElement;
      typeAndLeave(input, '16 June 2 BC, 10:00');
      expect(handler).not.toHaveBeenCalled();
      expect(input.value).toBe('');
    });
  });

  describe('native input', () => {
    const native = (container: HTMLElement) =>
      container.querySelector(
        'input[type="datetime-local"]'
      ) as HTMLInputElement;

    it('gets a min of year 1 for one before it', () => {
      for (const min of [at(0, 6, 1, 9, 0), at(-5, 0, 1, 9, 0)]) {
        const { container, unmount } = render(
          <DateTimeInput mobileNative min={min} />
        );
        expect(native(container).min).toBe('0001-01-01T00:00');
        unmount();
      }
    });

    it('reads year 1 back, while the input itself drops year 0 and below', () => {
      const handler = jest.fn();
      const { container } = render(
        <DateTimeInput mobileNative onChange={handler} />
      );
      // HTML has no year 0 or negative year, so the input empties itself.
      fireEvent.change(native(container), {
        target: { value: '0000-03-04T14:30' },
      });
      fireEvent.change(native(container), {
        target: { value: '-0001-03-04T14:30' },
      });
      expect(native(container).value).toBe('');
      expect(handler).not.toHaveBeenCalledWith(expect.any(Date));
      fireEvent.change(native(container), {
        target: { value: '0001-03-04T14:30' },
      });
      expect(handler).toHaveBeenLastCalledWith(at(1, 2, 4, 14, 30));
    });
  });
});

describe('DateTimeInput times seeded from the clock', () => {
  // The clock reads 14:23:10.507. A time the picker starts from it keeps
  // none of what the field does not show: the seconds without enableSeconds,
  // and the milliseconds always.
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 7, 14, 23, 10, 507));
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  const last = (handler: jest.Mock) => handler.mock.lastCall![0] as Date;
  const openOnFocusedDay = (input: HTMLElement) => {
    act(() => {
      input.focus();
    });
    return document.activeElement as HTMLElement;
  };

  it('Enter on the focused day of an empty field picks it at midnight', () => {
    for (const enableSeconds of [false, true]) {
      const handler = jest.fn();
      const { getByRole, unmount } = render(
        <DateTimeInput enableSeconds={enableSeconds} onChange={handler} />
      );
      const day = openOnFocusedDay(getByRole('combobox'));
      expect(day).toHaveTextContent('7');
      act(() => {
        fireEvent.keyDown(day, { key: 'Enter' });
      });
      expect(last(handler)).toEqual(new Date(2026, 9, 7, 0, 0, 0, 0));
      unmount();
    }
  });

  it('a picked day keeps the whole time of a value, by key or by click', () => {
    const value = new Date(2026, 9, 7, 10, 30, 45, 250);
    const handler = jest.fn();
    const { getByRole } = render(
      <DateTimeInput value={value} onChange={handler} />
    );
    const day = openOnFocusedDay(getByRole('combobox'));
    act(() => {
      fireEvent.keyDown(day, { key: 'ArrowRight' });
    });
    act(() => {
      fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    });
    expect(last(handler)).toEqual(new Date(2026, 9, 8, 10, 30, 45, 250));
    const ninth = Array.from(
      getByRole('dialog').querySelectorAll('[role="gridcell"]')
    ).find(c => c.textContent === '9')!;
    act(() => {
      fireEvent.click(ninth);
    });
    expect(last(handler)).toEqual(new Date(2026, 9, 9, 10, 30, 45, 250));
  });

  it('a value set after mounting empty gives the picked day its time, not the clock', () => {
    const handler = jest.fn();
    const { getByRole, rerender } = render(
      <DateTimeInput value={null} onChange={handler} />
    );
    rerender(
      <DateTimeInput value={new Date(2026, 9, 7, 9, 15)} onChange={handler} />
    );
    const day = openOnFocusedDay(getByRole('combobox'));
    act(() => {
      fireEvent.keyDown(day, { key: 'Enter' });
    });
    expect(last(handler)).toEqual(new Date(2026, 9, 7, 9, 15, 0, 0));
  });

  it('turning a wheel on an empty field starts from a whole minute', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <DateTimeInput onChange={handler} />
    );
    openOnFocusedDay(getByRole('combobox'));
    act(() => {
      fireEvent.click(getByRole('button', { name: /Time/ }));
    });
    act(() => {
      fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowUp' });
    });
    expect(last(handler)).toEqual(new Date(2026, 9, 7, 1, 0, 0, 0));
  });

  it('turning the seconds wheel on an empty field starts from a whole second', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <DateTimeInput enableSeconds onChange={handler} />
    );
    openOnFocusedDay(getByRole('combobox'));
    act(() => {
      fireEvent.click(getByRole('button', { name: /Time/ }));
    });
    act(() => {
      fireEvent.keyDown(getAllByRole('spinbutton')[2], { key: 'ArrowUp' });
    });
    expect(last(handler)).toEqual(new Date(2026, 9, 7, 0, 0, 1, 0));
  });

  it('typing into an empty field starts from the clock, less what the format hides', () => {
    for (const [enableSeconds, seeded] of [
      [false, new Date(2027, 9, 7, 14, 23, 0, 0)],
      [true, new Date(2027, 9, 7, 14, 23, 10, 0)],
    ] as const) {
      const handler = jest.fn();
      const { getByRole, unmount } = render(
        <DateTimeInput
          enableSeconds={enableSeconds}
          openOnFocus={false}
          onChange={handler}
        />
      );
      const input = getByRole('combobox');
      act(() => {
        input.focus();
      });
      fireEvent.keyDown(input, { key: 'ArrowUp' }); // year segment
      expect(last(handler)).toEqual(seeded);
      unmount();
    }
  });
});
