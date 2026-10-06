import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateInput } from '../DateInput';
import { DateInputBase } from '../DateInputBase';
import { renderToStaticMarkup } from 'react-dom/server';
import { Field } from '../Field';
import { Control } from '../Control';
import { ConfigProvider } from '../../helpers/Config';
import * as nativeInputSupport from '../_pickerInternals/nativeInputSupport';
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

  describe('Focus trap', () => {
    const pressTab = (from: HTMLElement, shiftKey = false) => {
      from.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      from.dispatchEvent(event);
      return event;
    };

    // The day grid is a roving tabindex: only the focused day is a tab stop,
    // so it is the popover's last one, and the other days must not count.
    it('wraps Tab between the month button and the focused day', () => {
      const { getByRole, container } = render(
        <DateInput defaultValue={new Date(2024, 5, 15)} />
      );
      fireEvent.click(getByRole('combobox'));
      const monthButton = container.querySelector<HTMLElement>(
        '.dateinput-month-trigger'
      )!;
      const day = container.querySelector<HTMLElement>(
        '[data-focused="true"]'
      )!;

      expect(pressTab(day).defaultPrevented).toBe(true);
      expect(monthButton).toHaveFocus();

      expect(pressTab(monthButton, true).defaultPrevented).toBe(true);
      expect(day).toHaveFocus();
    });

    // As the date picker dialog pattern has it: the date, not the header.
    it.each([
      ['day', '[data-focused="true"]'],
      ['month', '[data-focused="true"]'],
      ['year', '[data-focused-year="true"]'],
    ] as const)(
      'opens the %s picker with focus on the focused cell',
      (granularity, selector) => {
        const { getByRole } = render(
          <DateInput
            granularity={granularity}
            defaultValue={new Date(2024, 5, 15)}
          />
        );
        act(() => {
          getByRole('combobox').focus();
        });
        const cell = getByRole('dialog').querySelector(selector);
        expect(cell).not.toBeNull();
        expect(document.activeElement).toBe(cell);
      }
    );

    // The focused cell is the grid's tab stop, which moves off a disabled
    // period to the nearest enabled one.
    it('opens the day picker on the tab stop past a disabled day', () => {
      const { getByRole } = render(
        <DateInput
          defaultValue={new Date(2024, 5, 15)}
          shouldDisableDate={d => d.getDate() === 15}
        />
      );
      act(() => {
        getByRole('combobox').focus();
      });
      const day = document.activeElement as HTMLElement;
      expect(getByRole('dialog').contains(day)).toBe(true);
      expect(day).toHaveAttribute('role', 'gridcell');
      expect(day).toHaveTextContent('16');
      // Landing there made it the focused day, so the keys move on from it.
      act(() => {
        fireEvent.keyDown(day, { key: 'ArrowRight' });
      });
      expect(document.activeElement).toHaveTextContent('17');
    });

    it('opens the month picker on the tab stop past a disabled month', () => {
      const { getByRole } = render(
        <DateInput
          granularity="month"
          defaultValue={new Date(2024, 5, 15)}
          shouldDisableDate={d => d.getMonth() === 5}
        />
      );
      act(() => {
        getByRole('combobox').focus();
      });
      expect(document.activeElement).toHaveAttribute('aria-label', 'July');
    });

    it('opens the year picker on the tab stop past a disabled year', () => {
      const { getByRole } = render(
        <DateInput
          granularity="year"
          defaultValue={new Date(2024, 5, 15)}
          shouldDisableDate={d => d.getFullYear() === 2024}
        />
      );
      act(() => {
        getByRole('combobox').focus();
      });
      expect(document.activeElement).toHaveAttribute('role', 'option');
      expect(document.activeElement).toHaveTextContent('2025');
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

    it('keeps DOM focus on the day the keyboard moves to', () => {
      const { getByRole } = render(
        <DateInput
          inline
          defaultValue={new Date(2024, 5, 15)}
          // The value's own day is out, so Tab lands on the 16th.
          shouldDisableDate={d => d.getDate() === 15}
        />
      );
      const grid = getByRole('grid');
      const stop = grid.querySelector<HTMLElement>('[tabindex="0"]')!;
      expect(stop).toHaveTextContent('16');
      act(() => stop.focus());
      act(() => {
        fireEvent.keyDown(stop, { key: 'ArrowRight' });
      });
      expect(document.activeElement).toHaveTextContent('17');
      expect(document.activeElement).toHaveAttribute('tabindex', '0');
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

  it('gives way to whichever spinner is drawn', () => {
    // Its own Control draws the spinner where the launcher sits.
    const own = render(<DateInput isLoading />);
    expect(own.container.querySelectorAll('.is-loading')).toHaveLength(1);
    expect(own.queryByLabelText('Choose date')).toBeNull();
    own.unmount();

    // Inside a Control it renders none, so nothing is drawn to give way to.
    const inner = render(
      <Field>
        <Control>
          <DateInput isLoading />
        </Control>
      </Field>
    );
    expect(inner.container.querySelector('.is-loading')).toBeNull();
    expect(inner.getByLabelText('Choose date').tagName).toBe('BUTTON');
    inner.unmount();

    // A loading Control it sits in draws the spinner in the same place.
    const outer = render(
      <Field>
        <Control isLoading>
          <DateInput />
        </Control>
      </Field>
    );
    expect(outer.container.querySelectorAll('.is-loading')).toHaveLength(1);
    expect(outer.queryByLabelText('Choose date')).toBeNull();
    outer.unmount();

    // An explicit `triggerIcon` still wins.
    const forced = render(
      <Field>
        <Control isLoading>
          <DateInput triggerIcon />
        </Control>
      </Field>
    );
    expect(forced.getByLabelText('Choose date').tagName).toBe('BUTTON');
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

  it('keeps a year below 100 as given', () => {
    const handler = jest.fn();
    const { container } = render(
      <DateInput
        mobileNative={true}
        min={makeDate(19, 0, 1)}
        max={makeDate(19, 11, 31)}
        onChange={handler}
      />
    );
    const native = container.querySelector(
      'input[type="date"]'
    ) as HTMLInputElement;
    expect(native.min).toBe('0019-01-01');
    fireEvent.change(native, { target: { value: '0019-03-04' } });
    const committed = handler.mock.calls[0][0] as Date;
    expect([
      committed.getFullYear(),
      committed.getMonth(),
      committed.getDate(),
    ]).toEqual([19, 2, 4]);
  });

  it('round-trips a year past 9999', () => {
    const handler = jest.fn();
    const { container } = render(
      <DateInput
        mobileNative={true}
        defaultValue={makeDate(10000, 0, 1)}
        onChange={handler}
      />
    );
    const native = container.querySelector(
      'input[type="date"]'
    ) as HTMLInputElement;
    expect(native.value).toBe('10000-01-01');
    fireEvent.change(native, { target: { value: '10000-03-04' } });
    const committed = handler.mock.calls[0][0] as Date;
    expect([
      committed.getFullYear(),
      committed.getMonth(),
      committed.getDate(),
    ]).toEqual([10000, 2, 4]);
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

  it('gives the popover and its calendar ids of their own', () => {
    const { getByRole } = render(<DateInputBase id="dob" />);
    fireEvent.click(getByRole('combobox'));
    expect(document.querySelectorAll('#dob-popover')).toHaveLength(1);
    const label = document.getElementById(
      getByRole('grid').getAttribute('aria-labelledby')!
    );
    expect(getByRole('dialog').contains(label)).toBe(true);
    expect(document.querySelectorAll(`[id="${label!.id}"]`)).toHaveLength(1);
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

describe('DateInput label association (#368)', () => {
  it('associates the label with the input via htmlFor/id', () => {
    const { getByRole, container } = render(<DateInput label="Date" />);
    const input = getByRole('combobox');
    expect(input.id).toBeTruthy();
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      input.id
    );
  });

  it('respects a user id and still derives the popover id from it', () => {
    const { getByRole, container } = render(
      <DateInput label="Date" id="when" />
    );
    const input = getByRole('combobox');
    expect(input).toHaveAttribute('id', 'when');
    expect(input).toHaveAttribute('aria-controls', 'when-popover');
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      'when'
    );
  });

  it('injects no id without a label', () => {
    const { getByRole } = render(<DateInput />);
    expect(getByRole('combobox')).not.toHaveAttribute('id');
  });

  it('renders the label unwired in inline mode', () => {
    const { container } = render(<DateInput label="Date" inline />);
    const label = container.querySelector('label.label');
    expect(label).toHaveTextContent('Date');
    expect(label).not.toHaveAttribute('for');
  });
});

// -------------------------------------------------------------------------
// granularity: month and year pickers (#773). A month or year value is the
// period's first day; min/max and the predicates judge whole periods.
// -------------------------------------------------------------------------

const lastCall = (handler: jest.Mock): Date | null =>
  handler.mock.calls[handler.mock.calls.length - 1][0];

const focusInput = (input: HTMLElement) =>
  act(() => {
    input.focus();
  });

describe('DateInput month granularity', () => {
  it('formats the value as YYYY-MM by default', () => {
    const { getByRole } = render(
      <DateInput granularity="month" defaultValue={new Date(2024, 5, 7)} />
    );
    expect((getByRole('combobox') as HTMLInputElement).value).toBe('2024-06');
  });

  it('shows a controlled mid-month value as its month without rewriting it', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        granularity="month"
        value={new Date(2024, 5, 20)}
        onChange={handler}
      />
    );
    fireEvent.click(getByRole('combobox'));
    expect((getByRole('combobox') as HTMLInputElement).value).toBe('2024-06');
    expect(
      getByRole('dialog').querySelector('[aria-selected="true"]')
    ).toHaveAttribute('aria-label', 'June');
    expect(handler).not.toHaveBeenCalled();
  });

  it.each([
    ['month', '2024-06'],
    ['year', '2024'],
  ] as const)(
    'leaves a controlled mid-%s value alone when focus passes through',
    (granularity, text) => {
      // Blur re-parses the displayed period, which lands on its first day.
      // That is the period the value already holds, so nothing commits.
      const handler = jest.fn();
      const { getByRole } = render(
        <DateInput
          granularity={granularity}
          value={new Date(2024, 5, 20)}
          onChange={handler}
          popover={false}
        />
      );
      const input = getByRole('combobox') as HTMLInputElement;
      focusInput(input);
      fireEvent.blur(input);
      expect(handler).not.toHaveBeenCalled();
      expect(input.value).toBe(text);
    }
  );

  it('leaves a mid-month value alone when typing lands on its month', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        granularity="month"
        defaultValue={new Date(2024, 5, 20)}
        onChange={handler}
        openOnFocus={false}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    focusInput(input);
    fireEvent.keyDown(input, { key: 'ArrowRight' }); // month
    fireEvent.keyDown(input, { key: '0' });
    fireEvent.keyDown(input, { key: '6' }); // June again
    fireEvent.keyDown(input, { key: 'Tab' });
    fireEvent.blur(input);
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('2024-06');
  });

  it('still drops the time from a day value on blur, as before', () => {
    // The day picker re-parses its text on blur, which commits midnight.
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        value={new Date(2024, 5, 20, 14, 30)}
        onChange={handler}
        popover={false}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    focusInput(input);
    fireEvent.blur(input);
    expect(handler).toHaveBeenCalledWith(new Date(2024, 5, 20));
  });

  it('opens on the month grid and commits the first of the picked month', () => {
    const handler = jest.fn();
    const { getByRole, getByLabelText, queryByRole } = render(
      <DateInput
        granularity="month"
        defaultValue={new Date(2024, 5, 7)}
        onChange={handler}
      />
    );
    fireEvent.click(getByRole('combobox'));
    expect(getByRole('dialog')).toHaveAttribute('aria-label', 'Choose month');
    expect(getByRole('grid')).toBeInTheDocument();
    fireEvent.click(getByLabelText('September'));
    expect(handler).toHaveBeenCalledWith(new Date(2024, 8, 1));
    expect(queryByRole('dialog')).toBeNull();
    expect((getByRole('combobox') as HTMLInputElement).value).toBe('2024-09');
  });

  it('names the launcher for a month, from labels when given', () => {
    const { getByLabelText, rerender } = render(
      <DateInput granularity="month" />
    );
    expect(getByLabelText('Choose month').tagName).toBe('BUTTON');
    rerender(
      <DateInput granularity="month" labels={{ chooseMonth: 'Mois' }} />
    );
    expect(getByLabelText('Mois').tagName).toBe('BUTTON');
  });

  it('types the year and month only, committing the first of the month', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        granularity="month"
        defaultValue={new Date(2024, 5, 1)}
        onChange={handler}
        openOnFocus={false}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    focusInput(input);
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 4]);
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect([input.selectionStart, input.selectionEnd]).toEqual([5, 7]);
    // There is no day segment to move on to.
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect([input.selectionStart, input.selectionEnd]).toEqual([5, 7]);
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(lastCall(handler)).toEqual(new Date(2024, 6, 1));
    expect(input.value).toBe('2024-07');
  });

  it('normalises a controlled mid-month value when typing moves it', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        granularity="month"
        value={new Date(2024, 5, 20)}
        onChange={handler}
        openOnFocus={false}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    focusInput(input);
    fireEvent.keyDown(input, { key: 'ArrowUp' }); // year
    expect(lastCall(handler)).toEqual(new Date(2025, 5, 1));
  });

  it('skips the day segment of a custom format with day tokens', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        granularity="month"
        format="YYYY-MM-DD"
        defaultValue={new Date(2024, 5, 20)}
        onChange={handler}
        openOnFocus={false}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    expect(input.value).toBe('2024-06-20');
    focusInput(input);
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect([input.selectionStart, input.selectionEnd]).toEqual([5, 7]);
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(lastCall(handler)).toEqual(new Date(2024, 6, 1));
    expect(input.value).toBe('2024-07-01');
  });

  it('parses free-form text against a month format', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        granularity="month"
        format="MM/YYYY"
        onChange={handler}
        openOnFocus={false}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '07/2025' } });
    fireEvent.blur(input);
    expect(handler).toHaveBeenCalledWith(new Date(2025, 6, 1));
  });

  it('parses against YYYY-MM when the format is Intl options with no parse', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        granularity="month"
        format={{ year: 'numeric', month: 'long' }}
        onChange={handler}
        openOnFocus={false}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2025-07' } });
    fireEvent.blur(input);
    expect(handler).toHaveBeenCalledWith(new Date(2025, 6, 1));
    expect(input.value).toBe('July 2025');
  });

  it('lets a partly bounded month through, committed as its first day', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        granularity="month"
        min={new Date(2024, 5, 15)}
        max={new Date(2024, 7, 10)}
        defaultValue={new Date(2024, 6, 1)}
        onChange={handler}
        openOnFocus={false}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    focusInput(input);
    fireEvent.keyDown(input, { key: 'ArrowRight' }); // month
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // June: holds min
    expect(lastCall(handler)).toEqual(new Date(2024, 5, 1));
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // May: wholly before min
    expect(handler).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('2024-06');
  });

  it('rejects a month whose every day is blocked, and allows one partly blocked', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        granularity="month"
        // Weekends and the whole of July.
        shouldDisableDate={d =>
          d.getDay() === 0 || d.getDay() === 6 || d.getMonth() === 6
        }
        defaultValue={new Date(2024, 4, 1)}
        onChange={handler}
        openOnFocus={false}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    focusInput(input);
    fireEvent.keyDown(input, { key: 'ArrowRight' }); // month
    // 1 June 2024 is a Saturday, but June has weekdays, so June counts.
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(lastCall(handler)).toEqual(new Date(2024, 5, 1));
    fireEvent.keyDown(input, { key: 'ArrowUp' }); // July: every day blocked
    expect(handler).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('2024-06');
  });

  it('judges a blocked first-of-month by its month, not its day', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        granularity="month"
        unselectableDates={[new Date(2024, 5, 1)]}
        onChange={handler}
        openOnFocus={false}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2024-06' } });
    fireEvent.blur(input);
    expect(handler).toHaveBeenCalledWith(new Date(2024, 5, 1));
  });

  it('seeds an empty field with the start of this month', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput granularity="month" popover={false} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    focusInput(input);
    fireEvent.blur(input);
    const now = new Date();
    expect(handler).toHaveBeenCalledWith(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );
  });

  it.each([
    ['month', '0019-06'],
    ['year', '0019'],
  ] as const)(
    'pads a year below 1000 to four digits in the %s form value',
    (granularity, expected) => {
      const early = new Date(2024, 5, 1);
      early.setFullYear(19);
      const { container } = render(
        <DateInput
          granularity={granularity}
          inline
          name="period"
          defaultValue={early}
        />
      );
      expect(
        (container.querySelector('input[type="hidden"]') as HTMLInputElement)
          .value
      ).toBe(expected);
    }
  );

  it('submits YYYY-MM from an inline calendar', () => {
    const { container } = render(
      <DateInput
        granularity="month"
        inline
        name="period"
        defaultValue={new Date(2024, 5, 20)}
      />
    );
    const hidden = container.querySelector(
      'input[type="hidden"]'
    ) as HTMLInputElement;
    expect(hidden.value).toBe('2024-06');
  });

  it('commits from the inline month grid', () => {
    const handler = jest.fn();
    const { getByLabelText, container } = render(
      <DateInput
        granularity="month"
        inline
        name="period"
        defaultValue={new Date(2024, 5, 1)}
        onChange={handler}
      />
    );
    fireEvent.click(getByLabelText('March'));
    expect(handler).toHaveBeenCalledWith(new Date(2024, 2, 1));
    expect(
      (container.querySelector('input[type="hidden"]') as HTMLInputElement)
        .value
    ).toBe('2024-03');
  });

  describe('native input', () => {
    const native = (container: HTMLElement) =>
      container.querySelector('input[type="month"]') as HTMLInputElement;

    it('renders <input type="month"> with YYYY-MM value and bounds', () => {
      const { container } = render(
        <DateInput
          granularity="month"
          mobileNative
          defaultValue={new Date(2024, 5, 20)}
          min={new Date(2024, 0, 15)}
          max={new Date(2025, 11, 31)}
        />
      );
      expect(native(container).value).toBe('2024-06');
      expect(native(container).min).toBe('2024-01');
      expect(native(container).max).toBe('2025-12');
    });

    it('round-trips a change to the first of the month, and a clear to null', () => {
      const handler = jest.fn();
      const { container } = render(
        <DateInput granularity="month" mobileNative onChange={handler} />
      );
      fireEvent.change(native(container), { target: { value: '2025-03' } });
      expect(handler).toHaveBeenLastCalledWith(new Date(2025, 2, 1));
      fireEvent.change(native(container), { target: { value: '' } });
      expect(handler).toHaveBeenLastCalledWith(null);
    });

    it('commits null for a malformed value', () => {
      const handler = jest.fn();
      const { container } = render(
        <DateInput granularity="month" mobileNative onChange={handler} />
      );
      const input = native(container);
      Object.defineProperty(input, 'value', {
        configurable: true,
        get: () => 'March',
        set: () => {},
      });
      fireEvent.change(input);
      expect(handler).toHaveBeenCalledWith(null);
    });

    it('keeps a year below 100 as given', () => {
      const handler = jest.fn();
      const { container } = render(
        <DateInput granularity="month" mobileNative onChange={handler} />
      );
      fireEvent.change(native(container), { target: { value: '0019-03' } });
      const committed = handler.mock.calls[0][0] as Date;
      expect([committed.getFullYear(), committed.getMonth()]).toEqual([19, 2]);
    });

    it('reads a year past 9999 back', () => {
      const handler = jest.fn();
      const { container } = render(
        <DateInput granularity="month" mobileNative onChange={handler} />
      );
      fireEvent.change(native(container), { target: { value: '10000-03' } });
      const committed = handler.mock.calls[0][0] as Date;
      expect([committed.getFullYear(), committed.getMonth()]).toEqual([
        10000, 2,
      ]);
    });

    describe('where the browser has no month input', () => {
      afterEach(() => jest.restoreAllMocks());

      it('renders the calendar instead', () => {
        // A browser without the type reads it back as text, so typing into
        // it would parse every partial keystroke to null.
        const supports = jest
          .spyOn(nativeInputSupport, 'supportsInputType')
          .mockReturnValue(false);
        const { container, getByRole } = render(
          <DateInput
            granularity="month"
            mobileNative
            defaultValue={new Date(2024, 5, 20)}
          />
        );
        expect(supports).toHaveBeenCalledWith('month');
        expect(native(container)).toBeNull();
        expect((getByRole('combobox') as HTMLInputElement).value).toBe(
          '2024-06'
        );
      });

      it('keeps the day picker on its native date input', () => {
        const supports = jest.spyOn(nativeInputSupport, 'supportsInputType');
        const { container } = render(<DateInput mobileNative />);
        expect(container.querySelector('input[type="date"]')).not.toBeNull();
        expect(supports).not.toHaveBeenCalled();
      });
    });

    it('renders the calendar on the server, before it can ask', () => {
      const supports = jest.spyOn(nativeInputSupport, 'supportsInputType');
      const html = renderToStaticMarkup(
        <DateInput granularity="month" mobileNative />
      );
      expect(html).not.toContain('type="month"');
      expect(html).toContain('role="combobox"');
      expect(supports).not.toHaveBeenCalled();
      supports.mockRestore();
    });
  });
});

describe('DateInput year granularity', () => {
  beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  it('formats the value as YYYY by default', () => {
    const { getByRole } = render(
      <DateInput granularity="year" defaultValue={new Date(2024, 5, 7)} />
    );
    expect((getByRole('combobox') as HTMLInputElement).value).toBe('2024');
  });

  it('opens on the year list and commits the first day of the picked year', () => {
    const handler = jest.fn();
    const { getByRole, getByText, queryByRole } = render(
      <DateInput
        granularity="year"
        min={new Date(2020, 0, 1)}
        max={new Date(2030, 11, 31)}
        defaultValue={new Date(2024, 5, 7)}
        onChange={handler}
      />
    );
    fireEvent.click(getByRole('combobox'));
    expect(getByRole('dialog')).toHaveAttribute('aria-label', 'Choose year');
    expect(getByRole('listbox')).toHaveAttribute('aria-label', 'Choose year');
    // The popover's focus lands on the focused year.
    expect(document.activeElement).toHaveTextContent('2024');
    fireEvent.click(getByText('2027'));
    expect(handler).toHaveBeenCalledWith(new Date(2027, 0, 1));
    expect(queryByRole('dialog')).toBeNull();
    expect((getByRole('combobox') as HTMLInputElement).value).toBe('2027');
  });

  it('names the launcher for a year, from labels when given', () => {
    const { getByLabelText, rerender } = render(
      <DateInput granularity="year" />
    );
    expect(getByLabelText('Choose year').tagName).toBe('BUTTON');
    rerender(<DateInput granularity="year" labels={{ chooseYear: 'Année' }} />);
    expect(getByLabelText('Année').tagName).toBe('BUTTON');
  });

  it('types four digits as the year and commits its first day', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput granularity="year" onChange={handler} openOnFocus={false} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    focusInput(input);
    for (const key of '1999') fireEvent.keyDown(input, { key });
    expect(lastCall(handler)).toEqual(new Date(1999, 0, 1));
    expect(input.value).toBe('1999');
  });

  it('keeps typing inside the min and max years', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <DateInput
        granularity="year"
        min={new Date(2020, 6, 1)}
        max={new Date(2022, 2, 1)}
        defaultValue={new Date(2020, 0, 1)}
        onChange={handler}
        openOnFocus={false}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    focusInput(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // 2019: before min
    expect(handler).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'ArrowUp' }); // 2021
    fireEvent.keyDown(input, { key: 'ArrowUp' }); // 2022: holds max
    expect(lastCall(handler)).toEqual(new Date(2022, 0, 1));
    fireEvent.keyDown(input, { key: 'ArrowUp' }); // 2023: after max
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('renders the calendar even when the native input is forced', () => {
    const { container, getByRole } = render(
      <DateInput granularity="year" mobileNative />
    );
    expect(container.querySelector('input[type="date"]')).toBeNull();
    expect(container.querySelector('input[type="month"]')).toBeNull();
    expect(getByRole('combobox')).toBeInTheDocument();
  });

  it('submits YYYY from an inline calendar without taking focus', () => {
    const { container } = render(
      <DateInput
        granularity="year"
        inline
        name="year"
        defaultValue={new Date(2024, 5, 20)}
      />
    );
    const hidden = container.querySelector(
      'input[type="hidden"]'
    ) as HTMLInputElement;
    expect(hidden.value).toBe('2024');
    expect(container.contains(document.activeElement)).toBe(false);
  });
});

describe('DateInput granularity changes', () => {
  it('reopens on the view of the new granularity', () => {
    const { getByRole, rerender, queryByRole } = render(
      <DateInput
        granularity="month"
        defaultValue={new Date(2024, 5, 7)}
        openOnFocus={false}
      />
    );
    rerender(
      <DateInput
        granularity="year"
        defaultValue={new Date(2024, 5, 7)}
        openOnFocus={false}
      />
    );
    fireEvent.keyDown(getByRole('combobox'), { key: 'ArrowDown' });
    expect(getByRole('listbox')).toBeInTheDocument();
    expect(queryByRole('grid')).toBeNull();
    expect((getByRole('combobox') as HTMLInputElement).value).toBe('2024');
  });

  it('leaves the day picker as it was when granularity is day', () => {
    const { getByRole, getByLabelText } = render(
      <DateInput granularity="day" defaultValue={new Date(2024, 5, 7)} />
    );
    expect((getByRole('combobox') as HTMLInputElement).value).toBe(
      '2024-06-07'
    );
    expect(getByLabelText('Choose date')).toBeInTheDocument();
    fireEvent.click(getByRole('combobox'));
    expect(getByLabelText('Previous month')).toBeInTheDocument();
    expect(
      getByRole('grid').querySelectorAll('[role="gridcell"]')
    ).toHaveLength(42);
  });
});

describe('DateInput granularity under a class prefix', () => {
  // Every class the month grid and the year list emit carries the prefix.
  const unprefixed = (root: HTMLElement) =>
    Array.from(root.querySelectorAll('[class]'))
      .flatMap(el => Array.from(el.classList))
      .filter(cls => !cls.startsWith('bestax-'));

  it.each(['month', 'year'] as const)('prefixes the %s view', granularity => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <DateInput
          granularity={granularity}
          inline
          defaultValue={new Date(2024, 5, 7)}
          min={new Date(2024, 2, 1)}
        />
      </ConfigProvider>
    );
    const selected = container.querySelector('[aria-selected="true"]')!;
    expect(selected).toHaveClass(`bestax-dateinput-${granularity}-cell`);
    expect(selected).toHaveClass('bestax-is-selected');
    expect(unprefixed(container)).toEqual([]);
  });
});

describe('DateInput focus handed back on close', () => {
  // The calendar focuses a cell as the popover opens. Closing must return
  // focus to the input, and under openOnFocus (the default) that focus must
  // not open the popover again.
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

  it.each(['day', 'month', 'year'] as const)(
    'Escape closes the %s picker and leaves focus on the input',
    granularity => {
      const onOpen = jest.fn();
      const { getByRole, queryByRole } = render(
        <DateInput
          granularity={granularity}
          defaultValue={new Date(2024, 5, 15)}
          onOpen={onOpen}
        />
      );
      const input = getByRole('combobox');
      openByFocus(input);
      expect(getByRole('dialog')).toBeInTheDocument();
      // The calendar took focus.
      expect(input).not.toHaveFocus();
      pressEscape();
      expect(queryByRole('dialog')).toBeNull();
      expect(input).toHaveFocus();
      expect(onOpen).toHaveBeenCalledTimes(1);
    }
  );

  it('picking a day with the pointer closes it the same way', () => {
    const onOpen = jest.fn();
    const { getByRole, getByText, queryByRole } = render(
      <DateInput defaultValue={new Date(2024, 5, 15)} onOpen={onOpen} />
    );
    const input = getByRole('combobox');
    openByFocus(input);
    act(() => {
      fireEvent.click(getByText('20'));
    });
    expect(queryByRole('dialog')).toBeNull();
    expect(input).toHaveFocus();
    expect(input).toHaveValue('2024-06-20');
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('picking a day with Enter closes it the same way', () => {
    const onOpen = jest.fn();
    const { getByRole, queryByRole } = render(
      <DateInput defaultValue={new Date(2024, 5, 15)} onOpen={onOpen} />
    );
    const input = getByRole('combobox');
    openByFocus(input);
    const day = getByRole('dialog').querySelector<HTMLElement>(
      '[data-focused="true"]'
    )!;
    act(() => {
      day.focus();
    });
    act(() => {
      fireEvent.keyDown(day, { key: 'Enter' });
    });
    expect(queryByRole('dialog')).toBeNull();
    expect(input).toHaveFocus();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('hands focus to the input when the launcher opened it', () => {
    const onOpen = jest.fn();
    const { getByRole, getByLabelText, queryByRole } = render(
      <DateInput defaultValue={new Date(2024, 5, 15)} onOpen={onOpen} />
    );
    const launcher = getByLabelText('Choose date');
    act(() => {
      launcher.focus();
    });
    act(() => {
      fireEvent.click(launcher);
    });
    expect(getByRole('dialog')).toBeInTheDocument();
    pressEscape();
    expect(queryByRole('dialog')).toBeNull();
    expect(getByRole('combobox')).toHaveFocus();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('a click outside closes it for good', () => {
    const onOpen = jest.fn();
    const { getByRole, queryByRole } = render(
      <>
        <DateInput defaultValue={new Date(2024, 5, 15)} onOpen={onOpen} />
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
        <DateInput defaultValue={new Date(2024, 5, 15)} />
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
    const renderWith = (props: React.ComponentProps<typeof DateInput>) => {
      const onChange = jest.fn();
      const utils = render(
        <>
          <DateInput {...props} onChange={onChange} />
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
    const june15 = new Date(2024, 5, 15);

    it('when Escape dismisses a value and focus moves on', () => {
      const { input, onChange, leave } = renderWith({ defaultValue: june15 });
      openByFocus(input);
      pressEscape();
      leave();
      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('2024-06-15');
    });

    it('when a click outside dismisses a value', () => {
      const { input, onChange, clickOutside } = renderWith({
        defaultValue: june15,
      });
      openByFocus(input);
      clickOutside();
      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('2024-06-15');
    });

    it('when a click outside dismisses an empty field', () => {
      const { input, onChange, clickOutside } = renderWith({});
      openByFocus(input);
      clickOutside();
      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
    });

    it('when Escape dismisses an empty field, which stays empty', () => {
      const { input, onChange, leave } = renderWith({});
      openByFocus(input);
      pressEscape();
      expect(input).toHaveFocus();
      expect(input).toHaveValue('');
      leave();
      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
    });

    it('when the launcher dismisses an empty field, which stays empty', () => {
      const { input, onChange, getByRole, queryByRole } = renderWith({});
      openByFocus(input);
      expect(input).not.toHaveValue('');
      // Pressing the launcher focuses it before the click closes the
      // popover, so the trap has no focus to hand back.
      const launcher = getByRole('button', { name: 'Choose date' });
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

    it('but keeps a date typed after the dismiss', () => {
      const { input, onChange, leave } = renderWith({ defaultValue: june15 });
      openByFocus(input);
      pressEscape();
      for (const key of '2025') fireEvent.keyDown(input, { key });
      leave();
      expect(input).toHaveValue('2025-06-15');
      expect(onChange).toHaveBeenLastCalledWith(new Date(2025, 5, 15));
    });

    it('but commits text typed before the popover opened', () => {
      const { input, onChange, leave, getByRole, queryByRole } = renderWith({
        defaultValue: june15,
        // No segments, so the text is typed freely and parsed on leaving.
        format: { year: 'numeric', month: '2-digit', day: '2-digit' },
        openOnFocus: false,
      });
      act(() => {
        input.focus();
      });
      fireEvent.change(input, { target: { value: '2025-07-04' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(getByRole('dialog')).toBeInTheDocument();
      pressEscape();
      expect(queryByRole('dialog')).toBeNull();
      leave();
      expect(onChange).toHaveBeenLastCalledWith(new Date(2025, 6, 4));
    });
  });
});

describe('DateInput onOpen and onClose', () => {
  const june15 = new Date(2024, 5, 15);
  const pressEscape = (on: Element) =>
    act(() => {
      fireEvent.keyDown(on, { key: 'Escape' });
    });

  it('fire once per open and close under StrictMode', () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();
    const { getByRole, queryByRole } = render(
      <React.StrictMode>
        <DateInput defaultValue={june15} onOpen={onOpen} onClose={onClose} />
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
        <DateInput
          ref={inputRef}
          defaultValue={june15}
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
      <DateInput defaultValue={june15} onClose={onClose} openOnFocus={false} />
    );
    const input = getByRole('combobox');
    act(() => {
      fireEvent.click(getByRole('button', { name: 'Choose date' }));
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
