import React from 'react';
import { render, fireEvent, act, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DateRangeInput } from '../DateRangeInput';
import { DateRangeInputBase, type DateRangeValue } from '../DateRangeInputBase';
import { Field } from '../Field';
import { Control } from '../Control';
import { ConfigProvider } from '../../helpers/Config';

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

const june = (day: number) => new Date(2024, 5, day);
const weekends = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

const startInput = () =>
  screen.getByRole('combobox', { name: 'Start date' }) as HTMLInputElement;
const endInput = () =>
  screen.getByRole('combobox', { name: 'End date' }) as HTMLInputElement;

/** The cell for `day` of the month on show, skipping nearby months' days. */
const cell = (day: number) =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>('[role="gridcell"]')
  ).find(
    c =>
      !c.className.includes('is-other-month') && c.textContent === String(day)
  )!;

/** Types `keys` into `input` one key at a time, the way segmented entry reads them. */
const type = (input: HTMLInputElement, keys: string) => {
  for (const key of keys) fireEvent.keyDown(input, { key });
};

/** The last range `onChange` reported. */
const lastRange = (handler: jest.Mock): DateRangeValue =>
  handler.mock.calls[handler.mock.calls.length - 1][0];

describe('DateRangeInput', () => {
  describe('rendering', () => {
    it('renders two named inputs in one Bulma input, with a separator', () => {
      const { container } = render(<DateRangeInput />);
      const field = container.querySelector('.daterangeinput-field')!;
      expect(field).toHaveClass('input');
      expect(field).toContainElement(startInput());
      expect(field).toContainElement(endInput());
      expect(startInput()).not.toHaveClass('input');
      const separator = container.querySelector('.daterangeinput-separator')!;
      expect(separator).toHaveTextContent('–');
      expect(separator).toHaveAttribute('aria-hidden', 'true');
    });

    it('is a group inside a Field and a Control with a calendar icon', () => {
      const { container } = render(<DateRangeInput />);
      const root = container.querySelector('.daterangeinput')!;
      expect(root).toHaveAttribute('role', 'group');
      expect(root).toHaveClass('dateinput-container');
      expect(root.parentElement).toHaveClass('control', 'has-icons-left');
      expect(container.querySelector('.icon.is-left')).not.toBeNull();
    });

    it('gives each input combobox semantics for the popover', () => {
      render(<DateRangeInput id="stay" />);
      for (const input of [startInput(), endInput()]) {
        expect(input).toHaveAttribute('aria-haspopup', 'dialog');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(input).toHaveAttribute('aria-controls', 'stay-popover');
        expect(input).toHaveAttribute('autocomplete', 'off');
      }
    });

    it('puts the id on the start input and a derived one on the end', () => {
      render(<DateRangeInput id="stay" />);
      expect(startInput()).toHaveAttribute('id', 'stay');
      expect(endInput()).toHaveAttribute('id', 'stay-end');
    });

    it('carries color, size, rounded and disabled on the field', () => {
      const { container } = render(
        <DateRangeInput color="danger" size="small" isRounded disabled />
      );
      expect(container.querySelector('.daterangeinput-field')).toHaveClass(
        'is-danger',
        'is-small',
        'is-rounded',
        'is-disabled'
      );
      expect(startInput()).toBeDisabled();
      expect(endInput()).toBeDisabled();
    });

    it('puts helper props and className on the root', () => {
      const { container } = render(
        <DateRangeInputBase m="2" className="custom" data-testid="root" />
      );
      expect(screen.getByTestId('root')).toHaveClass('m-2', 'custom');
      expect(container.firstElementChild).toBe(screen.getByTestId('root'));
    });

    it('takes its words from labels', () => {
      const { container } = render(
        <DateRangeInput
          labels={{
            rangeStart: 'Arrivée',
            rangeEnd: 'Départ',
            rangeSeparator: 'au',
            chooseDateRange: 'Choisir',
          }}
        />
      );
      expect(screen.getByRole('combobox', { name: 'Arrivée' })).toBeTruthy();
      expect(screen.getByRole('combobox', { name: 'Départ' })).toBeTruthy();
      expect(
        container.querySelector('.daterangeinput-separator')
      ).toHaveTextContent('au');
      expect(screen.getByLabelText('Choisir')).toHaveClass('dateinput-trigger');
    });

    it('shows the placeholder in both inputs', () => {
      render(<DateRangeInput placeholder="YYYY-MM-DD" />);
      expect(startInput()).toHaveAttribute('placeholder', 'YYYY-MM-DD');
      expect(endInput()).toHaveAttribute('placeholder', 'YYYY-MM-DD');
    });

    it('prefixes every class under a ConfigProvider classPrefix', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <DateRangeInput color="primary" />
        </ConfigProvider>
      );
      const root = container.querySelector('.bestax-daterangeinput')!;
      expect(root).toHaveClass('bestax-dateinput-container');
      expect(root.querySelector('.bestax-daterangeinput-field')).toHaveClass(
        'bestax-input',
        'bestax-is-primary'
      );
      expect(root.querySelector('.bestax-daterangeinput-input')).toBe(
        startInput()
      );
      expect(root.querySelector('.bestax-daterangeinput-separator')).not.toBe(
        null
      );
      expect(root.querySelector('.bestax-dateinput-trigger')).not.toBeNull();
      expect(container.querySelector('.daterangeinput')).toBeNull();
    });

    it('forwards its ref to the start input', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<DateRangeInput ref={ref} />);
      expect(ref.current).toBe(startInput());
    });

    it('calls a ref callback with the start input', () => {
      const ref = jest.fn();
      render(<DateRangeInputBase ref={ref} />);
      expect(ref).toHaveBeenCalledWith(startInput());
    });

    it('renders on the server', () => {
      const html = renderToStaticMarkup(
        <DateRangeInput label="Stay" defaultValue={[june(10), june(13)]} />
      );
      expect(html).toContain('value="2024-06-10"');
      expect(html).toContain('value="2024-06-13"');
    });
  });

  describe('label', () => {
    it('names the group, not either input', () => {
      render(<DateRangeInput label="Stay" />);
      const group = screen.getByRole('group', { name: 'Stay' });
      expect(group).toHaveClass('daterangeinput');
      expect(startInput()).toHaveAccessibleName('Start date');
      expect(screen.getByText('Stay')).not.toHaveAttribute('for');
    });

    it("uses the caller's label id", () => {
      render(<DateRangeInput label="Stay" labelProps={{ id: 'stay-label' }} />);
      expect(screen.getByRole('group')).toHaveAttribute(
        'aria-labelledby',
        'stay-label'
      );
    });

    it('names an inline calendar too', () => {
      render(<DateRangeInput label="Stay" inline />);
      expect(screen.getByRole('group', { name: 'Stay' })).toBeTruthy();
    });

    it('drops its label inside an outer Field', () => {
      const { container } = render(
        <Field label="Outer">
          <Control>
            <DateRangeInput label="Dropped" />
          </Control>
        </Field>
      );
      expect(container.querySelectorAll('.field')).toHaveLength(1);
      expect(screen.queryByText('Dropped')).toBeNull();
      expect(screen.getByRole('group')).not.toHaveAttribute('aria-labelledby');
    });

    it('renders a message, colored', () => {
      render(<DateRangeInput message="Pick your nights" messageColor="info" />);
      expect(screen.getByText('Pick your nights')).toHaveClass(
        'help',
        'is-info'
      );
    });
  });

  describe('value', () => {
    it('shows a default range in the two inputs', () => {
      render(<DateRangeInput defaultValue={[june(10), june(13)]} />);
      expect(startInput()).toHaveValue('2024-06-10');
      expect(endInput()).toHaveValue('2024-06-13');
    });

    it('follows a controlled range', () => {
      const { rerender } = render(
        <DateRangeInput value={[june(10), null]} onChange={() => {}} />
      );
      expect(startInput()).toHaveValue('2024-06-10');
      expect(endInput()).toHaveValue('');
      rerender(
        <DateRangeInput value={[june(11), june(12)]} onChange={() => {}} />
      );
      expect(startInput()).toHaveValue('2024-06-11');
      expect(endInput()).toHaveValue('2024-06-12');
    });

    it('reports a pick under control and waits for the range back', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <DateRangeInput value={[june(1), june(2)]} onChange={onChange} />
      );
      fireEvent.click(startInput());
      fireEvent.click(cell(10));
      fireEvent.click(cell(13));
      expect(onChange).toHaveBeenCalledWith([june(10), june(13)]);
      expect(startInput()).toHaveValue('2024-06-01');
      rerender(
        <DateRangeInput value={[june(10), june(13)]} onChange={onChange} />
      );
      expect(startInput()).toHaveValue('2024-06-10');
    });

    it('formats both inputs with format and locale', () => {
      render(
        <DateRangeInput
          defaultValue={[june(10), june(13)]}
          format="DD/MM/YYYY"
        />
      );
      expect(startInput()).toHaveValue('10/06/2024');
      expect(endInput()).toHaveValue('13/06/2024');
    });
  });

  describe('picking in the popover', () => {
    it('commits the range once, with both ends, and closes', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput defaultValue={[june(1), june(2)]} onChange={onChange} />
      );
      fireEvent.click(startInput());
      fireEvent.click(cell(10));
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      fireEvent.click(cell(13));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith([june(10), june(13)]);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(startInput()).toHaveValue('2024-06-10');
      expect(endInput()).toHaveValue('2024-06-13');
    });

    it('stays open with closeOnSelect off', () => {
      render(
        <DateRangeInput
          defaultValue={[june(1), june(2)]}
          closeOnSelect={false}
        />
      );
      fireEvent.click(startInput());
      fireEvent.click(cell(10));
      fireEvent.click(cell(13));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(endInput()).toHaveValue('2024-06-13');
    });

    it('sets the end of a range that has only a start', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput defaultValue={[june(10), null]} onChange={onChange} />
      );
      fireEvent.click(endInput());
      fireEvent.click(cell(12));
      expect(onChange).toHaveBeenCalledWith([june(10), june(12)]);
    });

    it('hands the calendar its constraints', () => {
      render(
        <DateRangeInput
          defaultValue={[june(10), null]}
          shouldDisableDate={weekends}
          min={june(5)}
        />
      );
      fireEvent.click(startInput());
      expect(cell(15)).toBeDisabled();
      expect(cell(4)).toBeDisabled();
      expect(cell(12)).not.toBeDisabled();
    });

    it('lets the range span a disabled day with allowDisabledInRange', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput
          defaultValue={[june(14), null]}
          shouldDisableDate={weekends}
          allowDisabledInRange
          onChange={onChange}
        />
      );
      fireEvent.click(startInput());
      fireEvent.click(cell(17));
      expect(onChange).toHaveBeenCalledWith([june(14), june(17)]);
    });

    it('names the popover and the calendar after the range', () => {
      render(<DateRangeInput id="stay" />);
      fireEvent.click(startInput());
      const dialog = screen.getByRole('dialog', { name: 'Choose date range' });
      expect(dialog).toHaveAttribute('id', 'stay-popover');
      expect(dialog.querySelector('#stay-popover-cal')).not.toBeNull();
      expect(screen.getByRole('grid')).toHaveAttribute(
        'aria-multiselectable',
        'true'
      );
    });

    it('opens on the month of the range', () => {
      render(<DateRangeInput defaultValue={[null, june(13)]} />);
      fireEvent.click(startInput());
      expect(screen.getByText('June 2024')).toBeInTheDocument();
    });

    it('keeps the month in range when the bounds change', () => {
      const { rerender } = render(<DateRangeInput min={june(1)} />);
      rerender(<DateRangeInput min={new Date(2030, 0, 1)} />);
      fireEvent.click(startInput());
      expect(screen.getByText('January 2030')).toBeInTheDocument();
    });

    it('can render the popover into the body', () => {
      const { container } = render(<DateRangeInput appendToBody />);
      fireEvent.click(startInput());
      const dialog = screen.getByRole('dialog');
      expect(container.contains(dialog)).toBe(false);
      expect(dialog.parentElement).toBe(document.body);
    });
  });

  describe('opening and closing', () => {
    it('opens as focus arrives, and fires onOpen and onClose', () => {
      const onOpen = jest.fn();
      const onClose = jest.fn();
      render(<DateRangeInput onOpen={onOpen} onClose={onClose} />);
      fireEvent.focus(startInput());
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(startInput()).toHaveAttribute('aria-expanded', 'true');
      expect(onOpen).toHaveBeenCalledTimes(1);
      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('opens nothing as focus moves from one input to the other', () => {
      const onFocus = jest.fn();
      render(<DateRangeInput onFocus={onFocus} />);
      fireEvent.focus(endInput(), { relatedTarget: startInput() });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(onFocus).toHaveBeenCalledTimes(1);
      // A click is asking, so it still opens.
      fireEvent.click(endInput());
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('opens as focus arrives from outside the field', () => {
      const onFocusCapture = jest.fn();
      render(
        <>
          <button type="button">Before</button>
          <DateRangeInput onFocusCapture={onFocusCapture} />
        </>
      );
      fireEvent.focus(endInput(), {
        relatedTarget: screen.getByText('Before'),
      });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(onFocusCapture).toHaveBeenCalled();
    });

    it('stays closed on focus with openOnFocus off, and opens on ArrowDown', () => {
      render(<DateRangeInput openOnFocus={false} />);
      fireEvent.focus(endInput());
      fireEvent.click(endInput());
      expect(screen.queryByRole('dialog')).toBeNull();
      // Outside segment mode, as before the input is focused.
      fireEvent.keyDown(screen.getByRole('combobox', { name: 'Start date' }), {
        key: 'ArrowDown',
      });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('hands focus back to the input that opened it, and stays shut', () => {
      render(<DateRangeInput />);
      act(() => {
        endInput().focus();
      });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(document.activeElement).not.toBe(endInput());
      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });
      expect(document.activeElement).toBe(endInput());
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('hands focus back to the start input after the launcher', () => {
      render(<DateRangeInput openOnFocus={false} />);
      act(() => {
        screen.getByLabelText('Choose date range').click();
      });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });
      expect(document.activeElement).toBe(startInput());
    });

    it('toggles from the launcher', () => {
      render(<DateRangeInput />);
      const launcher = screen.getByLabelText('Choose date range');
      fireEvent.click(launcher);
      expect(launcher).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(launcher);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it.each([
      ['disabled', { disabled: true }],
      ['readOnly', { readOnly: true }],
    ])('keeps the launcher shut when %s', (_, props) => {
      render(<DateRangeInput {...props} />);
      const launcher = screen.getByLabelText('Choose date range');
      expect(launcher).toBeDisabled();
      expect(launcher).toHaveAttribute('tabindex', '-1');
      fireEvent.click(launcher);
      fireEvent.focus(startInput());
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('drops the launcher for a spinner, or when asked', () => {
      const { container, rerender } = render(<DateRangeInput isLoading />);
      expect(container.querySelector('.dateinput-trigger')).toBeNull();
      expect(container.querySelector('.control')).toHaveClass('is-loading');
      rerender(<DateRangeInput triggerIcon={false} />);
      expect(container.querySelector('.dateinput-trigger')).toBeNull();
    });

    it('is input-only without a popover', () => {
      const { container } = render(<DateRangeInput popover={false} />);
      fireEvent.focus(startInput());
      fireEvent.keyDown(startInput(), { key: 'ArrowDown' });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(container.querySelector('.dateinput-trigger')).toBeNull();
    });

    it('is picker-only when not editable', () => {
      render(<DateRangeInput editable={false} />);
      expect(startInput()).toHaveAttribute('readonly');
      expect(endInput()).toHaveAttribute('readonly');
    });
  });

  describe('typing', () => {
    const typeInto = (input: HTMLInputElement, keys: string) => {
      act(() => {
        input.focus();
      });
      type(input, keys);
    };

    it('commits a typed start on its own', () => {
      const onChange = jest.fn();
      render(<DateRangeInput openOnFocus={false} onChange={onChange} />);
      typeInto(startInput(), '20240610');
      expect(lastRange(onChange)).toEqual([june(10), null]);
      expect(startInput()).toHaveValue('2024-06-10');
    });

    it('starts an empty end from the start', () => {
      render(
        <DateRangeInput openOnFocus={false} defaultValue={[june(10), null]} />
      );
      act(() => {
        endInput().focus();
      });
      expect(endInput()).toHaveValue('2024-06-10');
    });

    it('takes an end on or after the start', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput
          openOnFocus={false}
          defaultValue={[june(10), null]}
          onChange={onChange}
        />
      );
      typeInto(endInput(), '20240612');
      expect(lastRange(onChange)).toEqual([june(10), june(12)]);
    });

    it('refuses an end before the start', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput
          openOnFocus={false}
          defaultValue={[june(10), june(20)]}
          onChange={onChange}
        />
      );
      act(() => {
        endInput().focus();
      });
      // Day segment: 20 → 05, which comes before the start.
      fireEvent.keyDown(endInput(), { key: 'ArrowRight' });
      fireEvent.keyDown(endInput(), { key: 'ArrowRight' });
      type(endInput(), '05');
      expect(onChange).not.toHaveBeenCalledWith([june(10), june(5)]);
      expect(endInput()).toHaveValue('2024-06-20');
    });

    it('refuses an end that reaches over a disabled day', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput
          openOnFocus={false}
          defaultValue={[june(13), null]}
          shouldDisableDate={weekends}
          onChange={onChange}
        />
      );
      typeInto(endInput(), '20240617');
      expect(onChange).not.toHaveBeenCalledWith([june(13), june(17)]);
      typeInto(endInput(), '20240614');
      expect(lastRange(onChange)).toEqual([june(13), june(14)]);
    });

    it('takes an end over a disabled day with allowDisabledInRange', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput
          openOnFocus={false}
          defaultValue={[june(13), null]}
          shouldDisableDate={weekends}
          allowDisabledInRange
          onChange={onChange}
        />
      );
      typeInto(endInput(), '20240617');
      expect(lastRange(onChange)).toEqual([june(13), june(17)]);
    });

    it('refuses a disabled start', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput
          openOnFocus={false}
          unselectableDates={[june(15)]}
          onChange={onChange}
        />
      );
      typeInto(startInput(), '20240615');
      expect(onChange).not.toHaveBeenCalledWith([june(15), null]);
    });

    it('clears the end when the start moves past it', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput
          openOnFocus={false}
          defaultValue={[june(10), june(12)]}
          onChange={onChange}
        />
      );
      act(() => {
        startInput().focus();
      });
      // Month segment: June → July.
      fireEvent.keyDown(startInput(), { key: 'ArrowRight' });
      fireEvent.keyDown(startInput(), { key: 'ArrowUp' });
      expect(lastRange(onChange)).toEqual([new Date(2024, 6, 10), null]);
      expect(endInput()).toHaveValue('');
    });

    it('clears the end when the start moves over a disabled day', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput
          openOnFocus={false}
          defaultValue={[june(17), june(18)]}
          shouldDisableDate={weekends}
          onChange={onChange}
        />
      );
      act(() => {
        startInput().focus();
      });
      // Day segment: 17 → 14, a Friday before the weekend.
      fireEvent.keyDown(startInput(), { key: 'ArrowRight' });
      fireEvent.keyDown(startInput(), { key: 'ArrowRight' });
      type(startInput(), '14');
      expect(lastRange(onChange)).toEqual([june(14), null]);
    });

    it('keeps the end when the start still comes before it', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput
          openOnFocus={false}
          defaultValue={[june(10), june(20)]}
          onChange={onChange}
        />
      );
      act(() => {
        startInput().focus();
      });
      fireEvent.keyDown(startInput(), { key: 'ArrowRight' });
      fireEvent.keyDown(startInput(), { key: 'ArrowRight' });
      type(startInput(), '12');
      expect(lastRange(onChange)).toEqual([june(12), june(20)]);
    });

    it('keeps the end while the digits of a start year are still coming', () => {
      // The first digit makes year 0002, too far from the end to walk for
      // the disabled day, so that start can't keep the end. The year isn't
      // finished, so the digit waits rather than clearing the end.
      const onChange = jest.fn();
      render(
        <DateRangeInput
          openOnFocus={false}
          defaultValue={[june(10), june(20)]}
          unselectableDates={[new Date(2024, 11, 25)]}
          onChange={onChange}
        />
      );
      typeInto(startInput(), '2');
      expect(onChange).not.toHaveBeenCalled();
      expect(endInput()).toHaveValue('2024-06-20');
      type(startInput(), '024');
      expect(lastRange(onChange)).toEqual([june(10), june(20)]);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(endInput()).toHaveValue('2024-06-20');
    });

    it('keeps the end while a start month is half typed past a disabled day', () => {
      // Typing 10 for October passes through January, which has a disabled
      // day between it and the end. October doesn't.
      const onChange = jest.fn();
      const oct = (day: number) => new Date(2024, 9, day);
      render(
        <DateRangeInput
          openOnFocus={false}
          defaultValue={[oct(5), oct(25)]}
          unselectableDates={[new Date(2024, 2, 1)]}
          onChange={onChange}
        />
      );
      act(() => {
        startInput().focus();
      });
      fireEvent.keyDown(startInput(), { key: 'ArrowRight' });
      type(startInput(), '1');
      expect(onChange).not.toHaveBeenCalled();
      type(startInput(), '0');
      expect(lastRange(onChange)).toEqual([oct(5), oct(25)]);
      expect(endInput()).toHaveValue('2024-10-25');
    });

    it('still clears the end for a finished start that cannot keep it', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput
          openOnFocus={false}
          defaultValue={[june(10), june(20)]}
          unselectableDates={[new Date(2023, 11, 25)]}
          onChange={onChange}
        />
      );
      typeInto(startInput(), '2023');
      expect(lastRange(onChange)).toEqual([new Date(2023, 5, 10), null]);
      expect(endInput()).toHaveValue('');
    });

    it('reads free-form text as focus moves to the other input', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput
          openOnFocus={false}
          format={{ year: 'numeric', month: 'long', day: 'numeric' }}
          parse={s => (s === 'tenth' ? june(10) : null)}
          onChange={onChange}
        />
      );
      fireEvent.change(startInput(), { target: { value: 'tenth' } });
      fireEvent.blur(startInput(), { relatedTarget: endInput() });
      expect(onChange).toHaveBeenCalledWith([june(10), null]);
    });

    it('reads typed ISO text under an Intl format with no parser', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput
          openOnFocus={false}
          format={{ dateStyle: 'medium' }}
          locale="en-US"
          onChange={onChange}
        />
      );
      fireEvent.change(endInput(), { target: { value: '2024-06-13' } });
      fireEvent.keyDown(endInput(), { key: 'Enter' });
      expect(onChange).toHaveBeenCalledWith([null, june(13)]);
      expect(endInput()).toHaveValue('Jun 13, 2024');
    });

    it('parses free-form text with the default parser on Enter', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput
          openOnFocus={false}
          format="D/M/YYYY"
          onChange={onChange}
        />
      );
      fireEvent.change(startInput(), { target: { value: '  ' } });
      fireEvent.keyDown(startInput(), { key: 'Enter' });
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.change(startInput(), { target: { value: '10/6/2024' } });
      fireEvent.keyDown(startInput(), { key: 'Enter' });
      expect(onChange).toHaveBeenCalledWith([june(10), null]);
    });
  });

  describe('forms', () => {
    it('submits the range from two hidden inputs named after name', () => {
      const { container } = render(
        <DateRangeInput name="stay" defaultValue={[june(10), june(13)]} />
      );
      const start = container.querySelector('input[name="stay[start]"]');
      const end = container.querySelector('input[name="stay[end]"]');
      expect(start).toHaveAttribute('type', 'hidden');
      expect(start).toHaveValue('2024-06-10');
      expect(end).toHaveValue('2024-06-13');
      expect(startInput()).not.toHaveAttribute('name');
      expect(endInput()).not.toHaveAttribute('name');
    });

    it('submits an empty end as an empty value', () => {
      const { container } = render(
        <DateRangeInput name="stay" defaultValue={[june(10), null]} />
      );
      expect(container.querySelector('input[name="stay[end]"]')).toHaveValue(
        ''
      );
    });

    it('takes a name per end', () => {
      const { container } = render(
        <DateRangeInput
          startName="from"
          endName="to"
          form="booking"
          defaultValue={[june(10), june(13)]}
        />
      );
      const from = container.querySelector('input[name="from"]');
      expect(from).toHaveValue('2024-06-10');
      expect(from).toHaveAttribute('form', 'booking');
      expect(container.querySelector('input[name="to"]')).toHaveValue(
        '2024-06-13'
      );
    });

    it('renders no hidden input without a name', () => {
      const { container } = render(<DateRangeInput />);
      expect(container.querySelector('input[type="hidden"]')).toBeNull();
    });

    it('marks both inputs required', () => {
      render(<DateRangeInput required />);
      expect(startInput()).toBeRequired();
      expect(endInput()).toBeRequired();
    });

    it('reaches FormData as two entries', () => {
      const { container } = render(
        <form>
          <DateRangeInput name="stay" defaultValue={[june(10), june(13)]} />
        </form>
      );
      const data = new FormData(container.querySelector('form')!);
      expect(Array.from(data.entries())).toEqual([
        ['stay[start]', '2024-06-10'],
        ['stay[end]', '2024-06-13'],
      ]);
    });
  });

  describe('inline', () => {
    it('renders the calendar with no inputs or Control', () => {
      const { container } = render(
        <DateRangeInput inline name="stay" defaultValue={[june(10), null]} />
      );
      expect(screen.queryByRole('combobox')).toBeNull();
      expect(container.querySelector('.control')).toBeNull();
      expect(screen.getByRole('group')).toContainElement(
        screen.getByRole('grid')
      );
      expect(container.querySelector('input[name="stay[start]"]')).toHaveValue(
        '2024-06-10'
      );
    });

    it('commits picks', () => {
      const onChange = jest.fn();
      const { container } = render(
        <DateRangeInput
          inline
          name="stay"
          defaultValue={[june(10), june(11)]}
          onChange={onChange}
        />
      );
      fireEvent.click(cell(20));
      fireEvent.click(cell(22));
      expect(onChange).toHaveBeenCalledWith([june(20), june(22)]);
      expect(container.querySelector('input[name="stay[end]"]')).toHaveValue(
        '2024-06-22'
      );
    });

    it('names its calendar after the id', () => {
      const { container } = render(<DateRangeInputBase inline id="stay" />);
      expect(container.querySelector('#stay-popover')).toHaveClass('dateinput');
    });
  });

  describe('native inputs', () => {
    const nativeStart = () => screen.getByLabelText('Start date');
    const nativeEnd = () => screen.getByLabelText('End date');

    it('renders two date inputs with a separator', () => {
      const { container } = render(
        <DateRangeInput
          mobileNative
          id="stay"
          name="stay"
          required
          defaultValue={[june(10), june(13)]}
        />
      );
      expect(nativeStart()).toHaveAttribute('type', 'date');
      expect(nativeStart()).toHaveValue('2024-06-10');
      expect(nativeStart()).toHaveAttribute('id', 'stay');
      expect(nativeStart()).toBeRequired();
      expect(nativeEnd()).toHaveAttribute('type', 'date');
      expect(nativeEnd()).toHaveValue('2024-06-13');
      expect(nativeEnd()).toHaveAttribute('id', 'stay-end');
      expect(
        container.querySelector('.daterangeinput-separator')
      ).not.toBeNull();
      expect(screen.getByRole('group')).toBeTruthy();
      expect(container.querySelector('input[name="stay[start]"]')).toHaveValue(
        '2024-06-10'
      );
    });

    it('bounds the start by min and max and the end by the start', () => {
      render(
        <DateRangeInput
          mobileNative
          min={june(1)}
          max={june(30)}
          defaultValue={[june(10), null]}
        />
      );
      expect(nativeStart()).toHaveAttribute('min', '2024-06-01');
      expect(nativeStart()).toHaveAttribute('max', '2024-06-30');
      expect(nativeEnd()).toHaveAttribute('min', '2024-06-10');
      expect(nativeEnd()).toHaveAttribute('max', '2024-06-30');
    });

    it('bounds an end with no start by min', () => {
      render(<DateRangeInput mobileNative min={june(1)} />);
      expect(nativeEnd()).toHaveAttribute('min', '2024-06-01');
      expect(nativeStart()).not.toHaveAttribute('max');
    });

    it('commits changes by the typing rules', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput
          mobileNative
          defaultValue={[june(10), june(20)]}
          shouldDisableDate={weekends}
          max={june(28)}
          onChange={onChange}
        />
      );
      // Before the start, over a weekend, or past max: refused.
      fireEvent.change(nativeEnd(), { target: { value: '2024-06-05' } });
      fireEvent.change(nativeEnd(), { target: { value: '2024-06-24' } });
      fireEvent.change(nativeEnd(), { target: { value: '2024-07-01' } });
      expect(onChange).not.toHaveBeenCalled();
      expect(nativeEnd()).toHaveValue('2024-06-20');
      fireEvent.change(nativeEnd(), { target: { value: '2024-06-12' } });
      expect(lastRange(onChange)).toEqual([june(10), june(12)]);
      fireEvent.change(nativeStart(), { target: { value: '2024-06-13' } });
      expect(lastRange(onChange)).toEqual([june(13), null]);
      fireEvent.change(nativeStart(), { target: { value: '' } });
      expect(lastRange(onChange)).toEqual([null, null]);
    });

    it('clears an end', () => {
      const onChange = jest.fn();
      render(
        <DateRangeInput
          mobileNative
          defaultValue={[june(10), june(12)]}
          onChange={onChange}
        />
      );
      fireEvent.change(nativeEnd(), { target: { value: '' } });
      expect(lastRange(onChange)).toEqual([june(10), null]);
    });

    it('forwards its ref to the start input', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<DateRangeInput mobileNative ref={ref} />);
      expect(ref.current).toBe(nativeStart());
    });

    it('stays a calendar when inline', () => {
      render(<DateRangeInput mobileNative inline />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('context-aware wrapping', () => {
    it('renders no Control of its own inside one', () => {
      const { container } = render(
        <Field>
          <Control>
            <DateRangeInput />
          </Control>
        </Field>
      );
      expect(container.querySelectorAll('.control')).toHaveLength(1);
    });

    it('lays out horizontally with its own Field', () => {
      const { container } = render(
        <DateRangeInput label="Stay" horizontal fieldClassName="custom" />
      );
      expect(container.querySelector('.field')).toHaveClass(
        'is-horizontal',
        'custom'
      );
    });

    it('passes Control props through', () => {
      const { container } = render(
        <DateRangeInput
          iconLeftName=""
          iconRightName="check"
          hasIconsRight
          isExpanded
          controlSize="large"
          controlClassName="custom-control"
        />
      );
      const control = container.querySelector('.control')!;
      expect(control).toHaveClass(
        'has-icons-right',
        'is-expanded',
        'is-large',
        'custom-control'
      );
      expect(control).not.toHaveClass('has-icons-left');
    });
  });
});
