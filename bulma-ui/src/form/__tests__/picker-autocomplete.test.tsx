// #2064: a date or time picker's field takes the caller's `autoComplete`,
// such as `bday` for a date of birth, with `off` only as the default.
import type { ComponentType } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DateInput } from '../DateInput';
import { DateInputBase } from '../DateInputBase';
import { TimeInput } from '../TimeInput';
import { TimeInputBase } from '../TimeInputBase';
import { DateTimeInput } from '../DateTimeInput';
import { DateTimeInputBase } from '../DateTimeInputBase';

type Picker = ComponentType<Record<string, unknown>>;

const pickers: [string, Picker][] = [
  ['DateInput', DateInput as Picker],
  ['DateInputBase', DateInputBase as Picker],
  ['TimeInput', TimeInput as Picker],
  ['TimeInputBase', TimeInputBase as Picker],
  ['DateTimeInput', DateTimeInput as Picker],
  ['DateTimeInputBase', DateTimeInputBase as Picker],
];

/** The field the picker renders, text or native. */
const field = () =>
  document.querySelector<HTMLInputElement>('input:not([type="hidden"])')!;

describe.each(pickers)('%s', (_name, Picker) => {
  it('puts your autoComplete on its text field, and not on the container', () => {
    const { container } = render(
      <Picker aria-label="Born" mobileNative={false} autoComplete="bday" />
    );
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'autocomplete',
      'bday'
    );
    expect(container.firstElementChild).not.toHaveAttribute('autocomplete');
  });

  it('turns autocomplete off when you give none', () => {
    render(<Picker aria-label="Born" mobileNative={false} />);
    expect(screen.getByRole('combobox')).toHaveAttribute('autocomplete', 'off');
  });

  it('turns autocomplete off for an empty token too', () => {
    render(<Picker aria-label="Born" mobileNative={false} autoComplete="" />);
    expect(screen.getByRole('combobox')).toHaveAttribute('autocomplete', 'off');
  });

  it('puts it on the native input on a touch device', () => {
    render(<Picker aria-label="Born" mobileNative autoComplete="bday" />);
    expect(field()).toHaveAttribute('autocomplete', 'bday');
    expect(document.querySelectorAll('[autocomplete]')).toHaveLength(1);
  });

  it("leaves the native input at the browser's default without a token", () => {
    render(<Picker aria-label="Born" mobileNative />);
    expect(field()).not.toHaveAttribute('autocomplete');
  });

  it('puts it nowhere inline, where there is no field', () => {
    render(<Picker aria-label="Born" inline autoComplete="bday" />);
    expect(document.querySelectorAll('[autocomplete]')).toHaveLength(0);
  });
});

describe('a date of birth autofill fills', () => {
  it('commits a date in its format, and not one outside max, as with typing', () => {
    const onChange = vi.fn();
    render(
      <DateInput
        label="Date of birth"
        autoComplete="bday"
        mobileNative={false}
        max={new Date(2010, 11, 31)}
        onChange={onChange}
      />
    );
    const input = screen.getByRole('combobox', { name: 'Date of birth' });
    // Autofill writes the whole field without focusing it.
    fireEvent.change(input, { target: { value: '2015-06-01' } });
    expect(onChange).not.toHaveBeenCalled();
    // It shows as written until focus next leaves the field.
    expect(input).toHaveValue('2015-06-01');
    fireEvent.change(input, { target: { value: '1990-01-15' } });
    expect(onChange).toHaveBeenCalledWith(new Date(1990, 0, 15));
  });
});

describe('a time autofill fills', () => {
  it('commits a time in its format, and not one before min', () => {
    const onChange = vi.fn();
    render(
      <TimeInput
        label="Start"
        format="HH:mm"
        autoComplete="on"
        mobileNative={false}
        defaultValue={new Date(2020, 4, 6, 13, 0)}
        min={new Date(2020, 4, 6, 9, 0)}
        onChange={onChange}
      />
    );
    const input = screen.getByRole('combobox', { name: 'Start' });
    fireEvent.change(input, { target: { value: '08:00' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '10:30' } });
    expect(onChange).toHaveBeenCalledWith(new Date(2020, 4, 6, 10, 30));
  });
});
