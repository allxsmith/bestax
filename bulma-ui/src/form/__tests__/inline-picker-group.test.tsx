// An inline DateInput, TimeInput or DateTimeInput renders no input for a
// label's `for` to name, so its root is a group the label names (#2023), as
// DateRangeInput's and Calendar's are.
import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import { Field } from '../Field';
import { DateInput } from '../DateInput';
import { DateInputBase } from '../DateInputBase';
import { TimeInput } from '../TimeInput';
import { TimeInputBase } from '../TimeInputBase';
import { DateTimeInput } from '../DateTimeInput';
import { DateTimeInputBase } from '../DateTimeInputBase';

type Picker = ComponentType<Record<string, unknown>>;

const wrappers: [string, Picker][] = [
  ['DateInput', DateInput as Picker],
  ['TimeInput', TimeInput as Picker],
  ['DateTimeInput', DateTimeInput as Picker],
];

const bases: [string, Picker][] = [
  ['DateInputBase', DateInputBase as Picker],
  ['TimeInputBase', TimeInputBase as Picker],
  ['DateTimeInputBase', DateTimeInputBase as Picker],
];

/** The picker's root, the element the caller's attributes go on. */
const rootOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(
    '.dateinput-container, .timeinput-container, .datetimeinput-container'
  )!;

describe.each(wrappers)('%s inline', (_name, Picker) => {
  it('is a group named by its label', () => {
    const { container } = render(<Picker inline label="Meeting" />);
    const group = screen.getByRole('group', { name: 'Meeting' });
    expect(group).toBe(rootOf(container));
    const label = container.querySelector('label')!;
    expect(group).toHaveAttribute('aria-labelledby', label.id);
    // The label names the group, so it points at no control.
    expect(label).not.toHaveAttribute('for');
  });

  it('is a group named by an aria-label you give it', () => {
    render(<Picker inline aria-label="Meeting" />);
    expect(screen.getByRole('group', { name: 'Meeting' })).toBeInTheDocument();
  });

  it('takes the name you give it over its label', () => {
    render(
      <>
        <span id="other">Other name</span>
        <Picker inline label="Meeting" aria-labelledby="other" />
      </>
    );
    expect(
      screen.getByRole('group', { name: 'Other name' })
    ).toBeInTheDocument();
  });

  it('is named by a labeled Field around it', () => {
    const { container } = render(
      <Field label="Outer">
        <Picker inline />
      </Field>
    );
    expect(screen.getByRole('group', { name: 'Outer' })).toBe(
      rootOf(container)
    );
  });

  it('is described by its message', () => {
    render(<Picker inline label="Meeting" message="Pick a weekday" />);
    expect(
      screen.getByRole('group', { name: 'Meeting' })
    ).toHaveAccessibleDescription('Pick a weekday');
  });

  it("names it by the label's own id when you give one", () => {
    render(<Picker inline label="Meeting" labelProps={{ id: 'my-label' }} />);
    expect(screen.getByRole('group', { name: 'Meeting' })).toHaveAttribute(
      'aria-labelledby',
      'my-label'
    );
  });

  it('leaves a label you wired with labelProps.htmlFor as it was', () => {
    const { container } = render(
      <Picker inline label="Meeting" labelProps={{ htmlFor: 'elsewhere' }} />
    );
    expect(container.querySelector('label')).toHaveAttribute(
      'for',
      'elsewhere'
    );
    expect(rootOf(container)).not.toHaveAttribute('role');
  });

  it('is no group with an empty aria-label', () => {
    const { container } = render(<Picker inline aria-label="" />);
    expect(rootOf(container)).not.toHaveAttribute('role');
  });

  it('is no group with no name', () => {
    const { container } = render(<Picker inline />);
    expect(rootOf(container)).not.toHaveAttribute('role');
    expect(rootOf(container)).not.toHaveAttribute('aria-labelledby');
  });

  it('still names its input by the label outside inline mode', () => {
    const { container } = render(
      <Picker label="Meeting" mobileNative={false} />
    );
    expect(
      screen.getByRole('combobox', { name: 'Meeting' })
    ).toBeInTheDocument();
    expect(rootOf(container)).not.toHaveAttribute('role');
    expect(rootOf(container)).not.toHaveAttribute('aria-labelledby');
  });
});

describe.each(bases)('%s inline', (_name, Base) => {
  it('is a group named by a labeled Field around it', () => {
    const { container } = render(
      <Field label="Outer">
        <Base inline />
      </Field>
    );
    expect(screen.getByRole('group', { name: 'Outer' })).toBe(
      rootOf(container)
    );
  });

  it('is a group named by an aria-label you give it', () => {
    render(<Base inline aria-label="Meeting" />);
    expect(screen.getByRole('group', { name: 'Meeting' })).toBeInTheDocument();
  });

  it('is no group in a grouped Field, whose label names no one control', () => {
    const { container } = render(
      <Field label="Outer" grouped>
        <Base inline />
      </Field>
    );
    expect(rootOf(container)).not.toHaveAttribute('role');
  });

  it('is no group with no name', () => {
    const { container } = render(<Base inline />);
    expect(rootOf(container)).not.toHaveAttribute('role');
  });
});
