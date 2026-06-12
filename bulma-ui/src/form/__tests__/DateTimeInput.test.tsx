import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { DateTimeInput } from '../DateTimeInput';
import { Field } from '../Field';
import { DateTimeInputBase } from '../DateTimeInputBase';

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

  it('ArrowDown on the hours wheel increments the hour, keeping the date', () => {
    const v = new Date(2024, 5, 7, 10, 0);
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <DateTimeInput defaultValue={v} onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByRole('button', { name: /Time/ }));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
    expect(handler).toHaveBeenCalled();
    const arg: Date = handler.mock.calls[0][0];
    expect(arg.getDate()).toBe(7);
    expect(arg.getHours()).toBe(11);
  });

  it('ArrowDown on the minutes wheel increments the minute, keeping the hour', () => {
    const v = new Date(2024, 5, 7, 10, 0);
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <DateTimeInput defaultValue={v} onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByRole('button', { name: /Time/ }));
    const wheels = getAllByRole('spinbutton');
    fireEvent.keyDown(wheels[1], { key: 'ArrowDown' });
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
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
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
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
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
    // ArrowUp decrements to 09:00, which is below min — change is dropped.
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowUp' });
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
    fireEvent.keyDown(wheels[2], { key: 'ArrowDown' });
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
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
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
