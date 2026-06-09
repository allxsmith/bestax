import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { Datetimepicker } from '../Datetimepicker';

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

describe('Datetimepicker', () => {
  it('renders combobox input', () => {
    const { getByRole } = render(<Datetimepicker label="When" />);
    expect(getByRole('combobox')).toBeInTheDocument();
  });

  it('formats default value with date and time', () => {
    const v = new Date(2024, 5, 7, 13, 45);
    const { getByRole } = render(<Datetimepicker defaultValue={v} />);
    expect((getByRole('combobox') as HTMLInputElement).value).toBe(
      '2024-06-07 13:45'
    );
  });

  it('opens with the calendar; the time wheels appear after clicking the time', () => {
    const v = new Date(2024, 5, 7, 13, 45);
    const { getByRole, container, queryAllByRole, getAllByRole } = render(
      <Datetimepicker defaultValue={v} />
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
      <Datetimepicker defaultValue={v} />
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
      <Datetimepicker defaultValue={v} onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByRole('button', { name: /Time/ }));
    expect(queryAllByRole('spinbutton').length).toBeGreaterThanOrEqual(2);
    const overlay = container.querySelector(
      '.datetimepicker-time-overlay'
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
      <Datetimepicker defaultValue={v} />
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
      <Datetimepicker defaultValue={v} onChange={handler} />
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
      <Datetimepicker defaultValue={v} onChange={handler} />
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
      <Datetimepicker defaultValue={v} onChange={handler} />
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
      <Datetimepicker defaultValue={v} onChange={handler} />
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
      <Datetimepicker onChange={handler} />
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
      <Datetimepicker defaultValue={v} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByLabelText('Done'));
    expect(queryByRole('dialog')).toBeNull();
  });

  it('renders <input type="datetime-local"> when mobileNative=true', () => {
    const { container } = render(<Datetimepicker mobileNative={true} />);
    const native = container.querySelector('input[type="datetime-local"]');
    expect(native).not.toBeNull();
  });

  it('forwards step from incrementMinutes on the native input', () => {
    const { container } = render(
      <Datetimepicker mobileNative={true} incrementMinutes={15} />
    );
    const native = container.querySelector(
      'input[type="datetime-local"]'
    ) as HTMLInputElement;
    expect(native.step).toBe('900');
  });

  it('forwards step from incrementSeconds when enableSeconds', () => {
    const { container } = render(
      <Datetimepicker mobileNative={true} enableSeconds incrementSeconds={10} />
    );
    const native = container.querySelector(
      'input[type="datetime-local"]'
    ) as HTMLInputElement;
    expect(native.step).toBe('10');
  });

  it('native input renders the value and round-trips changes through onChange', () => {
    const handler = jest.fn();
    const { container } = render(
      <Datetimepicker
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
      <Datetimepicker
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
      <Datetimepicker
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
    const { getByRole, container } = render(
      <Datetimepicker defaultValue={v} />
    );
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
    render(<Datetimepicker ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('shouldDisableDate prevents click selection', () => {
    const v = new Date(2024, 5, 7, 13, 45);
    const handler = jest.fn();
    const { getByRole, container } = render(
      <Datetimepicker
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
      <Datetimepicker
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
      <Datetimepicker defaultValue={v} hourFormat="12" />
    );
    fireEvent.click(getByRole('combobox'));
    expect(getByText('5:07 PM')).toBeInTheDocument();
  });

  it('footer shows a dash when there is no value', () => {
    const { getByRole, getByText } = render(<Datetimepicker />);
    fireEvent.click(getByRole('combobox'));
    expect(getByText('—')).toBeInTheDocument();
  });

  it('a 12h format string drives the footer pill and wheels even when hourFormat is unset', () => {
    // The displayed format is the source of truth: an explicit 12h `format`
    // must make both the footer pill and the time wheels 12h, despite
    // hourFormat defaulting to '24'.
    const v = new Date(2024, 5, 7, 17, 7);
    const { getByRole, getByText, getAllByRole } = render(
      <Datetimepicker defaultValue={v} format="YYYY-MM-DD hh:mm A" />
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
      <Datetimepicker
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

describe('Datetimepicker segmented input entry', () => {
  const dt = () => new Date(2024, 5, 7, 13, 45);

  it('selects the year segment on focus', () => {
    const { getByRole } = render(<Datetimepicker defaultValue={dt()} />);
    const input = getByRole('combobox') as HTMLInputElement;
    expect(input.value).toBe('2024-06-07 13:45');
    act(() => {
      input.focus();
    });
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 4]);
  });

  it('ArrowRight walks year → month → day → hours → minutes', () => {
    const { getByRole } = render(<Datetimepicker defaultValue={dt()} />);
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
      <Datetimepicker defaultValue={dt()} onChange={handler} />
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
      <Datetimepicker defaultValue={dt()} onChange={handler} />
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
      <Datetimepicker defaultValue={dt()} hourFormat="12" onChange={handler} />
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
    const { getByRole } = render(<Datetimepicker defaultValue={dt()} />);
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
      <Datetimepicker
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
});

describe('Datetimepicker editable / popover modes', () => {
  const dt = () => new Date(2024, 5, 7, 13, 45);

  it('editable={false}: typing / arrows do not change the value', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <Datetimepicker defaultValue={dt()} editable={false} onChange={handler} />
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
      <Datetimepicker defaultValue={dt()} editable={false} onChange={handler} />
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
      <Datetimepicker defaultValue={dt()} popover={false} />
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
      <Datetimepicker defaultValue={dt()} popover={false} onChange={handler} />
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

describe('Datetimepicker launcher icon', () => {
  const dtv = () => new Date(2024, 5, 7, 13, 45);

  it('opens the popover when the launcher is clicked, and toggles it closed', () => {
    const { getByLabelText, queryByRole } = render(
      <Datetimepicker openOnFocus={false} />
    );
    const trigger = getByLabelText('Choose date and time');
    expect(queryByRole('dialog')).toBeNull();
    fireEvent.click(trigger);
    expect(queryByRole('dialog')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(queryByRole('dialog')).toBeNull();
  });

  it('triggerIcon={false} renders no launcher', () => {
    const { queryByLabelText } = render(<Datetimepicker triggerIcon={false} />);
    expect(queryByLabelText('Choose date and time')).toBeNull();
  });

  it('renders no launcher when popover={false} or inline', () => {
    const { queryByLabelText, rerender } = render(
      <Datetimepicker popover={false} />
    );
    expect(queryByLabelText('Choose date and time')).toBeNull();
    rerender(<Datetimepicker inline />);
    expect(queryByLabelText('Choose date and time')).toBeNull();
  });

  it('disables the launcher when readOnly', () => {
    const { getByLabelText, queryByRole } = render(
      <Datetimepicker readOnly defaultValue={dtv()} />
    );
    const trigger = getByLabelText('Choose date and time') as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
    fireEvent.click(trigger);
    expect(queryByRole('dialog')).toBeNull();
  });

  it('editable={false} keeps the launcher working (picker-only)', () => {
    const { getByLabelText, getByRole } = render(
      <Datetimepicker editable={false} openOnFocus={false} />
    );
    fireEvent.click(getByLabelText('Choose date and time'));
    expect(getByRole('dialog')).toBeInTheDocument();
  });
});
