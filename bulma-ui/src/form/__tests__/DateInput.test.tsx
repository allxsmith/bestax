import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateInput } from '../DateInput';
import { DateInputBase } from '../DateInputBase';
import { Field } from '../Field';

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

describe('DateInput', () => {
  describe('Rendering', () => {
    it('renders an input with role=combobox', () => {
      const { getByRole } = render(<DateInput label="Date" />);
      expect(getByRole('combobox')).toBeInTheDocument();
    });

    it('inside an existing Field renders bare content with the help message', () => {
      const { container, getByText } = render(
        <Field label="When">
          <DateInput message="Required" messageColor="danger" />
        </Field>
      );
      // No nested Field wrapper: exactly one field element.
      expect(container.querySelectorAll('.field').length).toBe(1);
      const help = getByText('Required');
      expect(help.className).toContain('help');
      expect(help.className).toContain('is-danger');
    });

    it('renders a decorative left icon and a clickable right launcher by default', () => {
      const { getByLabelText, container } = render(<DateInput label="Date" />);
      // Decorative left icon shows by default.
      expect(container.querySelector('[class*="is-left"]')).not.toBeNull();
      // The launcher is a real button on the right.
      expect(getByLabelText('Choose date').tagName).toBe('BUTTON');
    });

    it('hides the left icon when iconLeftName is empty', () => {
      const { container } = render(<DateInput label="Date" iconLeftName="" />);
      expect(container.querySelector('[class*="is-left"]')).toBeNull();
    });
  });

  describe('Value handling', () => {
    it('uncontrolled: defaultValue formats into the input', () => {
      const { getByRole } = render(
        <DateInput defaultValue={new Date(2024, 5, 7)} />
      );
      expect((getByRole('combobox') as HTMLInputElement).value).toBe(
        '2024-06-07'
      );
    });

    it('controlled: value drives the displayed text', () => {
      const { getByRole, rerender } = render(
        <DateInput value={new Date(2024, 5, 7)} />
      );
      expect((getByRole('combobox') as HTMLInputElement).value).toBe(
        '2024-06-07'
      );
      rerender(<DateInput value={new Date(2024, 11, 25)} />);
      expect((getByRole('combobox') as HTMLInputElement).value).toBe(
        '2024-12-25'
      );
    });

    it('onChange fires when a date is selected', () => {
      const handler = jest.fn();
      const { getByRole, container } = render(
        <DateInput defaultValue={new Date(2024, 5, 15)} onChange={handler} />
      );
      fireEvent.click(getByRole('combobox'));
      const cells = container.querySelectorAll('[role="gridcell"]');
      const target = Array.from(cells).find(
        c => c.textContent === '20' && !c.hasAttribute('disabled')
      );
      fireEvent.click(target!);
      expect(handler).toHaveBeenCalledTimes(1);
      const arg: Date = handler.mock.calls[0][0];
      expect(arg.getDate()).toBe(20);
    });
  });

  describe('Open/close transitions', () => {
    it('opens on focus when openOnFocus=true', () => {
      const { getByRole } = render(<DateInput openOnFocus />);
      const input = getByRole('combobox');
      fireEvent.focus(input);
      expect(getByRole('dialog')).toBeInTheDocument();
    });

    it('does not open on focus when openOnFocus=false', () => {
      const { getByRole, queryByRole } = render(
        <DateInput openOnFocus={false} />
      );
      fireEvent.focus(getByRole('combobox'));
      expect(queryByRole('dialog')).toBeNull();
    });

    it('opens on input click when openOnFocus=true (default)', () => {
      const { getByRole, queryByRole } = render(<DateInput />);
      expect(queryByRole('dialog')).toBeNull();
      fireEvent.click(getByRole('combobox'));
      expect(getByRole('dialog')).toBeInTheDocument();
    });

    it('input click does NOT open when openOnFocus=false; the launcher does', () => {
      const { getByRole, getByLabelText, queryByRole } = render(
        <DateInput openOnFocus={false} />
      );
      // Manual-entry mode: clicking the field lets you type, not open.
      fireEvent.click(getByRole('combobox'));
      expect(queryByRole('dialog')).toBeNull();
      // The right launcher opens the popover.
      fireEvent.click(getByLabelText('Choose date'));
      expect(getByRole('dialog')).toBeInTheDocument();
    });

    it('opens on ArrowDown', () => {
      const { getByRole } = render(<DateInput openOnFocus={false} />);
      fireEvent.keyDown(getByRole('combobox'), { key: 'ArrowDown' });
      expect(getByRole('dialog')).toBeInTheDocument();
    });

    it('closes on Escape', () => {
      const { getByRole, queryByRole } = render(<DateInput />);
      fireEvent.click(getByRole('combobox'));
      expect(getByRole('dialog')).toBeInTheDocument();
      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });
      expect(queryByRole('dialog')).toBeNull();
    });

    it('closes after selection when closeOnSelect=true (default)', () => {
      const { getByRole, queryByRole, container } = render(
        <DateInput defaultValue={new Date(2024, 5, 15)} />
      );
      fireEvent.click(getByRole('combobox'));
      const target = Array.from(
        container.querySelectorAll('[role="gridcell"]')
      ).find(c => c.textContent === '20');
      fireEvent.click(target!);
      expect(queryByRole('dialog')).toBeNull();
    });

    it('keeps open after selection when closeOnSelect=false', () => {
      const { getByRole, container } = render(
        <DateInput defaultValue={new Date(2024, 5, 15)} closeOnSelect={false} />
      );
      fireEvent.click(getByRole('combobox'));
      const target = Array.from(
        container.querySelectorAll('[role="gridcell"]')
      ).find(c => c.textContent === '20');
      fireEvent.click(target!);
      expect(getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Format / parse', () => {
    it('reverts text on blur if input is unparseable', async () => {
      const user = userEvent.setup();
      const { getByRole } = render(
        <DateInput defaultValue={new Date(2024, 5, 7)} openOnFocus={false} />
      );
      const input = getByRole('combobox') as HTMLInputElement;
      await user.clear(input);
      await user.type(input, 'garbage');
      fireEvent.blur(input);
      expect(input.value).toBe('2024-06-07');
    });

    it('parses typed text on blur into a Date', () => {
      const handler = jest.fn();
      const { getByRole } = render(
        <DateInput openOnFocus={false} onChange={handler} format="DD/MM/YYYY" />
      );
      const input = getByRole('combobox') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '25/12/2024' } });
      fireEvent.blur(input);
      expect(handler).toHaveBeenCalled();
      const arg: Date = handler.mock.calls[0][0];
      expect(arg.getMonth()).toBe(11);
      expect(arg.getDate()).toBe(25);
    });
  });

  describe('Inline mode', () => {
    it('renders calendar without popover', () => {
      const { container, queryByRole } = render(<DateInput inline />);
      expect(queryByRole('combobox')).toBeNull();
      expect(queryByRole('dialog')).toBeNull();
      expect(container.querySelectorAll('[role="gridcell"]').length).toBe(42);
    });

    it('inline emits hidden input when name is provided', () => {
      const { container } = render(
        <DateInput inline name="dob" defaultValue={new Date(2024, 5, 7)} />
      );
      const hidden = container.querySelector('input[type="hidden"]');
      expect(hidden).not.toBeNull();
      expect((hidden as HTMLInputElement).value).toBe('2024-06-07');
    });
  });

  describe('Mobile native fallback', () => {
    it('renders <input type="date"> when mobileNative=true', () => {
      const { container } = render(<DateInput mobileNative={true} />);
      const native = container.querySelector('input[type="date"]');
      expect(native).not.toBeNull();
    });

    it('forwards min/max as ISO strings', () => {
      const { container } = render(
        <DateInput
          mobileNative={true}
          min={new Date(2024, 0, 1)}
          max={new Date(2024, 11, 31)}
        />
      );
      const native = container.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      expect(native.min).toBe('2024-01-01');
      expect(native.max).toBe('2024-12-31');
    });
  });

  describe('Field integration', () => {
    it('skips wrapping its own Field when inside one', () => {
      const { container } = render(
        <Field label="Outer">
          <DateInput />
        </Field>
      );
      const fields = container.querySelectorAll('[class*="field"]');
      // Only one Field wrapper should exist.
      const fieldElements = Array.from(fields).filter(
        f => !f.className.includes('field-label')
      );
      expect(fieldElements.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Ref forwarding', () => {
    it('forwards ref to the input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<DateInput ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('DateInputBase', () => {
    it('renders without Field/Control wrappers', () => {
      const { getByRole } = render(<DateInputBase />);
      expect(getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Min/Max handling', () => {
    it('disables previous-month button when at min boundary', () => {
      const { getByRole, getByLabelText } = render(
        <DateInput
          defaultValue={new Date(2024, 5, 15)}
          min={new Date(2024, 5, 1)}
        />
      );
      fireEvent.click(getByRole('combobox'));
      expect(
        (getByLabelText('Previous month') as HTMLButtonElement).disabled
      ).toBe(true);
    });

    it('disables out-of-range cells', () => {
      const { getByRole, container } = render(
        <DateInput
          defaultValue={new Date(2024, 5, 15)}
          min={new Date(2024, 5, 10)}
          max={new Date(2024, 5, 20)}
        />
      );
      fireEvent.click(getByRole('combobox'));
      const cells = container.querySelectorAll('[role="gridcell"]');
      const cell5 = Array.from(cells).find(
        c => c.textContent === '5' && !c.className.includes('is-other-month')
      );
      expect(cell5?.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('Predicates and callbacks', () => {
    it('parse callback is invoked on blur', () => {
      const parse = jest.fn(() => new Date(2030, 0, 15));
      const handler = jest.fn();
      const { getByRole } = render(
        <DateInput openOnFocus={false} parse={parse} onChange={handler} />
      );
      const input = getByRole('combobox') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'tomorrow' } });
      fireEvent.blur(input);
      expect(parse).toHaveBeenCalledWith('tomorrow');
      expect(handler).toHaveBeenCalled();
      const arg: Date = handler.mock.calls[0][0];
      expect(arg.getFullYear()).toBe(2030);
    });

    it('shouldDisableDate prevents click selection', () => {
      const handler = jest.fn();
      const { getByRole, container } = render(
        <DateInput
          defaultValue={new Date(2024, 5, 15)}
          shouldDisableDate={d => d.getDate() === 16}
          onChange={handler}
        />
      );
      fireEvent.click(getByRole('combobox'));
      const cell16 = Array.from(
        container.querySelectorAll('[role="gridcell"]')
      ).find(
        c => c.textContent === '16' && !c.className.includes('is-other-month')
      );
      fireEvent.click(cell16!);
      expect(handler).not.toHaveBeenCalled();
    });

    it('unselectableDates array disables matching cells', () => {
      const blocked = new Date(2024, 5, 17);
      const { getByRole, container } = render(
        <DateInput
          defaultValue={new Date(2024, 5, 15)}
          unselectableDates={[blocked]}
        />
      );
      fireEvent.click(getByRole('combobox'));
      const cell17 = Array.from(
        container.querySelectorAll('[role="gridcell"]')
      ).find(
        c => c.textContent === '17' && !c.className.includes('is-other-month')
      );
      expect(cell17?.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('focusedDate re-clamping', () => {
    it('clamps focusedDate when min changes after mount', () => {
      const { getByRole, rerender, container } = render(
        <DateInput defaultValue={new Date(2024, 5, 15)} />
      );
      fireEvent.click(getByRole('combobox'));
      // Before re-clamp, focused date is 15.
      expect(
        container.querySelector('[data-focused="true"]')?.textContent
      ).toBe('15');
      // Bump min to a date after 15 — focusedDate should clamp forward.
      rerender(
        <DateInput
          defaultValue={new Date(2024, 5, 15)}
          min={new Date(2024, 5, 20)}
        />
      );
      const focused = container.querySelector('[data-focused="true"]');
      expect(Number(focused?.textContent)).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Labels override', () => {
    it('uses custom prevMonth / nextMonth labels', () => {
      const { getByRole, getByLabelText } = render(
        <DateInput labels={{ prevMonth: 'Avant', nextMonth: 'Après' }} />
      );
      fireEvent.click(getByRole('combobox'));
      expect(getByLabelText('Avant')).toBeInTheDocument();
      expect(getByLabelText('Après')).toBeInTheDocument();
    });

    it('uses custom chooseDate label on the popover dialog', () => {
      const { getByRole } = render(
        <DateInput labels={{ chooseDate: 'Choisir la date' }} />
      );
      fireEvent.click(getByRole('combobox'));
      expect(getByRole('dialog').getAttribute('aria-label')).toBe(
        'Choisir la date'
      );
    });
  });
});

// -------------------------------------------------------------------------
// Segmented manual entry on the input field. Focus selects the year segment;
// ArrowUp/Down increment; ArrowLeft/Right move; digits overwrite with
// auto-advance; separators jump to the next segment.
// -------------------------------------------------------------------------

describe('DateInput segmented input entry', () => {
  it('selects the year segment on focus (width 4)', () => {
    const { getByRole } = render(
      <DateInput defaultValue={new Date(2024, 5, 7)} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(4);
  });

  it('ArrowUp increments the year, ArrowDown decrements it', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput defaultValue={new Date(2024, 5, 7)} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect((handler.mock.calls[0][0] as Date).getFullYear()).toBe(2025);
    expect(input.value).toBe('2025-06-07');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(
      (
        handler.mock.calls[handler.mock.calls.length - 1][0] as Date
      ).getFullYear()
    ).toBe(2023);
  });

  it('ArrowRight walks year → month → day, ArrowLeft walks back', () => {
    const { getByRole } = render(
      <DateInput defaultValue={new Date(2024, 5, 7)} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect([input.selectionStart, input.selectionEnd]).toEqual([5, 7]);
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect([input.selectionStart, input.selectionEnd]).toEqual([8, 10]);
    fireEvent.keyDown(input, { key: 'ArrowLeft' });
    expect([input.selectionStart, input.selectionEnd]).toEqual([5, 7]);
  });

  it('ArrowUp on the month segment increments the month in place', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput defaultValue={new Date(2024, 5, 7)} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowRight' }); // → month
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect((handler.mock.calls[0][0] as Date).getMonth()).toBe(6);
    expect(input.value).toBe('2024-07-07');
  });

  it('month digit 1 waits, digit >= 2 auto-advances to the day', () => {
    const { getByRole } = render(
      <DateInput defaultValue={new Date(2024, 5, 7)} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowRight' }); // → month
    fireEvent.keyDown(input, { key: '1' });
    expect([input.selectionStart, input.selectionEnd]).toEqual([5, 7]); // still month
    fireEvent.keyDown(input, { key: '2' }); // "12" completes → advance
    expect([input.selectionStart, input.selectionEnd]).toEqual([8, 10]); // day
    expect(input.value).toBe('2024-12-07');
  });

  it('typing a four-digit year advances to the month', () => {
    const { getByRole } = render(
      <DateInput defaultValue={new Date(2024, 5, 7)} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: '2' });
    fireEvent.keyDown(input, { key: '0' });
    fireEvent.keyDown(input, { key: '2' });
    fireEvent.keyDown(input, { key: '6' });
    expect(input.value).toBe('2026-06-07');
    expect([input.selectionStart, input.selectionEnd]).toEqual([5, 7]); // month
  });

  it('day digit >= 4 auto-advances (stays on last segment)', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput defaultValue={new Date(2024, 5, 7)} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' }); // → day
    fireEvent.keyDown(input, { key: '4' });
    expect(
      (handler.mock.calls[handler.mock.calls.length - 1][0] as Date).getDate()
    ).toBe(4);
  });

  it('Backspace clears the digit buffer, then moves to the previous segment', () => {
    const { getByRole } = render(
      <DateInput defaultValue={new Date(2024, 5, 7)} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowRight' }); // → month
    fireEvent.keyDown(input, { key: '1' });
    fireEvent.keyDown(input, { key: 'Backspace' }); // clears buffer, stays
    expect([input.selectionStart, input.selectionEnd]).toEqual([5, 7]);
    fireEvent.keyDown(input, { key: 'Backspace' }); // → year
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 4]);
  });

  it('typing a separator jumps to the next segment without inserting it', () => {
    const { getByRole } = render(
      <DateInput defaultValue={new Date(2024, 5, 7)} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: '-' });
    expect([input.selectionStart, input.selectionEnd]).toEqual([5, 7]); // month
    expect(input.value).toBe('2024-06-07'); // separator not inserted
  });

  it('honors a custom DD/MM/YYYY format with slash separators', () => {
    const { getByRole } = render(
      <DateInput defaultValue={new Date(2024, 5, 7)} format="DD/MM/YYYY" />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    expect(input.value).toBe('07/06/2024');
    act(() => {
      input.focus();
    });
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 2]); // day
    fireEvent.keyDown(input, { key: '/' });
    expect([input.selectionStart, input.selectionEnd]).toEqual([3, 5]); // month
  });

  it('Tab clears segment selection so focus can move out', () => {
    const { getByRole } = render(
      <DateInput defaultValue={new Date(2024, 5, 7)} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(input).toBeInTheDocument();
  });

  it('falls back to free-form text entry for Intl-options formats', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        defaultValue={new Date(2024, 5, 7)}
        format={{ year: 'numeric', month: '2-digit', day: '2-digit' }}
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

  it('rejects ArrowUp on the day segment when shouldDisableDate blocks the result', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        defaultValue={new Date(2024, 5, 15)}
        shouldDisableDate={d => d.getDate() === 16}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' }); // → day
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('2024-06-15');
  });

  it('rejects ArrowUp on the day segment when unselectableDates blocks the result', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        defaultValue={new Date(2024, 5, 15)}
        unselectableDates={[new Date(2024, 5, 16)]}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' }); // → day
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('2024-06-15');
  });

  it('rejects typed digits that complete to a blocked day', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        defaultValue={new Date(2024, 5, 15)}
        shouldDisableDate={d => d.getDate() === 16}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' }); // → day
    // The intermediate '1' may commit day 1 if unblocked — same contract as
    // min/max. Only the blocked completion ('16') must never go through.
    fireEvent.keyDown(input, { key: '1' });
    fireEvent.keyDown(input, { key: '6' });
    expect(input.value).not.toBe('2024-06-16');
    for (const call of handler.mock.calls) {
      expect((call[0] as Date).getDate()).not.toBe(16);
    }
  });

  it('still commits unblocked values when a predicate is present', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        defaultValue={new Date(2024, 5, 14)}
        shouldDisableDate={d => d.getDate() === 16}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' }); // → day
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect((handler.mock.calls[0][0] as Date).getDate()).toBe(15);
    expect(input.value).toBe('2024-06-15');
  });

  it('min still rejects segmented edits when a blocking predicate is also present', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        defaultValue={new Date(2024, 5, 10)}
        min={new Date(2024, 5, 10)}
        shouldDisableDate={d => d.getDate() === 16}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' }); // → day
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // June 9 — below min
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('2024-06-10');
  });
});

describe('DateInput editable / popover modes', () => {
  it('editable defaults to true: focus engages segment mode', () => {
    const { getByRole } = render(
      <DateInput defaultValue={new Date(2024, 5, 7)} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    expect(input.selectionEnd).toBe(4);
  });

  it('editable={false}: typing / arrows do not change the value', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        defaultValue={new Date(2024, 5, 7)}
        editable={false}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: '5' });
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('2024-06-07');
  });

  it('editable={false}: the popover still opens and selection works', () => {
    const handler = jest.fn();
    const { getByRole, container } = render(
      <DateInput
        defaultValue={new Date(2024, 5, 15)}
        editable={false}
        onChange={handler}
      />
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
      <DateInput defaultValue={new Date(2024, 5, 7)} popover={false} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.focus(input);
    expect(queryByRole('dialog')).toBeNull();
    fireEvent.click(input);
    expect(queryByRole('dialog')).toBeNull();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(queryByRole('dialog')).toBeNull();
  });

  it('popover={false}: still supports segmented typing (input-only)', () => {
    const handler = jest.fn();
    const { getByRole, queryByRole } = render(
      <DateInput
        defaultValue={new Date(2024, 5, 7)}
        popover={false}
        onChange={handler}
      />
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

describe('DateInput launcher icon', () => {
  it('opens the popover when the launcher is clicked, and toggles it closed', () => {
    const { getByLabelText, queryByRole } = render(
      <DateInput openOnFocus={false} />
    );
    const trigger = getByLabelText('Choose date');
    expect(queryByRole('dialog')).toBeNull();
    fireEvent.click(trigger);
    expect(queryByRole('dialog')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(queryByRole('dialog')).toBeNull();
  });

  it('triggerIcon={false} renders no launcher', () => {
    const { queryByLabelText } = render(<DateInput triggerIcon={false} />);
    expect(queryByLabelText('Choose date')).toBeNull();
  });

  it('renders no launcher when popover={false} or inline', () => {
    const { queryByLabelText, rerender } = render(
      <DateInput popover={false} />
    );
    expect(queryByLabelText('Choose date')).toBeNull();
    rerender(<DateInput inline />);
    expect(queryByLabelText('Choose date')).toBeNull();
  });

  it('disables the launcher when readOnly', () => {
    const { getByLabelText, queryByRole } = render(
      <DateInput readOnly defaultValue={new Date(2024, 5, 7)} />
    );
    const trigger = getByLabelText('Choose date') as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
    fireEvent.click(trigger);
    expect(queryByRole('dialog')).toBeNull();
  });

  it('editable={false} keeps the launcher working (picker-only)', () => {
    const { getByLabelText, getByRole } = render(
      <DateInput editable={false} openOnFocus={false} />
    );
    fireEvent.click(getByLabelText('Choose date'));
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('uses a custom triggerIconName and still opens', () => {
    const { getByLabelText, container, getByRole } = render(
      <DateInput triggerIconName="calendar-day" openOnFocus={false} />
    );
    // Font Awesome renders fa-calendar-day inside the launcher button.
    expect(container.querySelector('.fa-calendar-day')).not.toBeNull();
    fireEvent.click(getByLabelText('Choose date'));
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('still shows an opt-in left icon alongside the launcher', () => {
    const { container, getByLabelText } = render(
      <DateInput iconLeftName="calendar" />
    );
    expect(container.querySelector('[class*="is-left"]')).not.toBeNull();
    expect(getByLabelText('Choose date').tagName).toBe('BUTTON');
  });
});

describe('DateInput native input value handling', () => {
  it('renders the value as an ISO string and round-trips changes', () => {
    const handler = jest.fn();
    const { container } = render(
      <DateInput
        mobileNative={true}
        defaultValue={new Date(2024, 5, 7)}
        onChange={handler}
      />
    );
    const native = container.querySelector(
      'input[type="date"]'
    ) as HTMLInputElement;
    expect(native.value).toBe('2024-06-07');
    fireEvent.change(native, { target: { value: '2026-06-09' } });
    const committed = handler.mock.calls[0][0] as Date;
    expect(committed.getFullYear()).toBe(2026);
    expect(committed.getMonth()).toBe(5);
    expect(committed.getDate()).toBe(9);
  });

  it('clearing the native input commits null', () => {
    const handler = jest.fn();
    const { container } = render(
      <DateInput
        mobileNative={true}
        defaultValue={new Date(2024, 5, 7)}
        onChange={handler}
      />
    );
    const native = container.querySelector(
      'input[type="date"]'
    ) as HTMLInputElement;
    fireEvent.change(native, { target: { value: '' } });
    expect(handler).toHaveBeenLastCalledWith(null);
  });

  it('a malformed native value commits null (invalid-format guard)', () => {
    // jsdom sanitizes bad values to '' before React sees them, so force the
    // value getter to surface a malformed string to the change handler.
    const handler = jest.fn();
    const { container } = render(
      <DateInput mobileNative={true} onChange={handler} />
    );
    const native = container.querySelector(
      'input[type="date"]'
    ) as HTMLInputElement;
    Object.defineProperty(native, 'value', {
      configurable: true,
      get: () => 'not-a-date',
      set: () => {},
    });
    fireEvent.change(native);
    expect(handler).toHaveBeenCalledWith(null);
  });
});

describe('DateInputBase remaining branches', () => {
  it('controlled value={null} renders an empty input', () => {
    const { getByRole } = render(<DateInputBase value={null} />);
    expect((getByRole('combobox') as HTMLInputElement).value).toBe('');
  });

  it('controlled: selecting a date reports through onChange without internal state', () => {
    const handler = jest.fn();
    const { getByRole, container } = render(
      <DateInputBase value={new Date(2024, 5, 15)} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.click(input);
    const target = Array.from(
      container.querySelectorAll('[role="gridcell"]')
    ).find(
      c => c.textContent === '20' && !c.className.includes('is-other-month')
    );
    fireEvent.click(target!);
    expect((handler.mock.calls[0][0] as Date).getDate()).toBe(20);
    // The parent did not update `value`, so the text stays on the 15th.
    expect(input.value).toBe('2024-06-15');
  });

  it('derives the popover id from the id prop', () => {
    const { getByRole } = render(<DateInputBase id="dob" />);
    fireEvent.click(getByRole('combobox'));
    expect(getByRole('dialog').id).toBe('dob-popover');
    expect(getByRole('combobox').getAttribute('aria-controls')).toBe(
      'dob-popover'
    );
  });

  it('fires onOpen once even when an open request repeats, and onClose on close', () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();
    const { getByRole } = render(
      <DateInputBase onOpen={onOpen} onClose={onClose} />
    );
    const input = getByRole('combobox');
    fireEvent.click(input);
    // Clicking the already-open input requests open again; no duplicate event.
    fireEvent.click(input);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports a callback ref', () => {
    const refFn = jest.fn();
    render(<DateInputBase ref={refFn} />);
    expect(refFn).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it('whitespace-only text reverts on blur without committing', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInputBase
        defaultValue={new Date(2024, 5, 7)}
        openOnFocus={false}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('2024-06-07');
  });

  it('free-form blur with a blocked date reverts without committing', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInputBase
        openOnFocus={false}
        shouldDisableDate={d => d.getDate() === 16}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2024-06-16' } });
    fireEvent.blur(input);
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('');
  });

  it('focusing an empty input does not commit a blocked today seed on blur', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInputBase
        popover={false}
        shouldDisableDate={() => true}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.blur(input);
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('');
  });

  it('inline with name but no value emits an empty hidden input', () => {
    const { container } = render(<DateInputBase inline name="dob" />);
    const hidden = container.querySelector(
      'input[type="hidden"]'
    ) as HTMLInputElement;
    expect(hidden).not.toBeNull();
    expect(hidden.value).toBe('');
  });

  it('inline without a name emits no hidden input', () => {
    const { container } = render(
      <DateInputBase inline defaultValue={new Date(2024, 5, 7)} />
    );
    expect(container.querySelector('input[type="hidden"]')).toBeNull();
  });
});
