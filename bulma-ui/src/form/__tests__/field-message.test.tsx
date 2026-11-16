import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { Field } from '../Field';
import { Input } from '../Input';
import { TextArea } from '../TextArea';
import { PasswordInput } from '../PasswordInput';
import { Numberinput } from '../Numberinput';
import { PinInput } from '../PinInput';
import { Select } from '../Select';
import { Checkboxes } from '../Checkboxes';
import { Checkbox } from '../Checkbox';
import { Radios } from '../Radios';
import { Radio } from '../Radio';
import { Rate } from '../Rate';
import { Slider } from '../Slider';
import { File as FileInput } from '../File';
import { Autocomplete } from '../Autocomplete';
import { Combobox } from '../Combobox';
import { Taginput } from '../Taginput';
import { TreeSelect } from '../TreeSelect';
import { Cascader } from '../Cascader';
import { ColorInput } from '../ColorInput';
import { ColorPicker } from '../ColorPicker';
import { DateInput } from '../DateInput';
import { TimeInput } from '../TimeInput';
import { DateTimeInput } from '../DateTimeInput';
import { DateRangeInput } from '../DateRangeInput';
import { ConfigProvider } from '../../helpers/Config';

// #1963: a wrapper's `message` is tied to the control the label names
// through `aria-describedby`, after any ids the caller passed, so a screen
// reader reads the help or error text when the control takes focus.

interface Wrapper {
  name: string;
  /** Renders the wrapper with the label "Field" and these props. */
  render: (props: {
    message?: React.ReactNode;
    'aria-describedby'?: string;
  }) => React.ReactElement;
  /** The element the label names, which the message describes. */
  target: () => HTMLElement;
  /**
   * False when the caller's own `aria-describedby` lands somewhere other
   * than the target, so the target lists only the message's id.
   */
  callerOnTarget?: boolean;
}

const wrappers: Wrapper[] = [
  {
    name: 'Input',
    render: p => <Input label="Field" {...p} />,
    target: () => screen.getByRole('textbox', { name: 'Field' }),
  },
  {
    name: 'TextArea',
    render: p => <TextArea label="Field" {...p} />,
    target: () => screen.getByRole('textbox', { name: 'Field' }),
  },
  {
    name: 'PasswordInput',
    render: p => <PasswordInput label="Field" {...p} />,
    target: () => screen.getByLabelText('Field', { selector: 'input' }),
  },
  {
    name: 'Numberinput',
    render: p => <Numberinput label="Field" {...p} />,
    target: () => screen.getByRole('spinbutton', { name: 'Field' }),
  },
  {
    name: 'PinInput',
    render: p => <PinInput label="Field" {...p} />,
    target: () => screen.getByRole('textbox', { name: 'Field' }),
  },
  {
    name: 'Select',
    render: p => (
      <Select label="Field" {...p}>
        <option>One</option>
      </Select>
    ),
    target: () => screen.getByRole('combobox', { name: 'Field' }),
  },
  {
    name: 'Checkboxes',
    render: p => (
      <Checkboxes label="Field" {...p}>
        <Checkbox>One</Checkbox>
      </Checkboxes>
    ),
    target: () => screen.getByRole('group', { name: 'Field' }),
  },
  {
    name: 'Checkboxes as="fieldset"',
    render: p => (
      <Checkboxes as="fieldset" label="Field" {...p}>
        <Checkbox>One</Checkbox>
      </Checkboxes>
    ),
    target: () => screen.getByRole('group', { name: 'Field' }),
  },
  {
    name: 'Radios',
    render: p => (
      <Radios label="Field" {...p}>
        <Radio value="one">One</Radio>
      </Radios>
    ),
    target: () => screen.getByRole('radiogroup', { name: 'Field' }),
  },
  {
    name: 'Radios as="fieldset"',
    render: p => (
      <Radios as="fieldset" label="Field" {...p}>
        <Radio value="one">One</Radio>
      </Radios>
    ),
    target: () => screen.getByRole('radiogroup', { name: 'Field' }),
  },
  {
    name: 'Rate',
    render: p => <Rate label="Field" {...p} />,
    target: () => screen.getByRole('radiogroup', { name: 'Field' }),
  },
  {
    name: 'Slider',
    render: p => <Slider label="Field" {...p} />,
    target: () => screen.getByRole('slider', { name: 'Field' }),
  },
  {
    name: 'File',
    render: p => <FileInput label="Field" {...p} />,
    target: () => screen.getByLabelText('Field', { selector: 'input' }),
  },
  {
    name: 'Autocomplete',
    render: p => <Autocomplete label="Field" data={['One']} {...p} />,
    target: () => screen.getByRole('combobox', { name: 'Field' }),
    callerOnTarget: false,
  },
  {
    name: 'Combobox',
    render: ({ 'aria-describedby': describedBy, ...p }) => (
      <Combobox label="Field" {...p}>
        <Combobox.Input aria-describedby={describedBy} />
      </Combobox>
    ),
    target: () => screen.getByRole('combobox', { name: 'Field' }),
  },
  {
    name: 'Combobox with data',
    render: p => <Combobox label="Field" data={['One']} {...p} />,
    target: () => screen.getByRole('combobox', { name: 'Field' }),
    callerOnTarget: false,
  },
  {
    name: 'Taginput',
    render: p => <Taginput label="Field" hasCounter={false} {...p} />,
    target: () => screen.getByRole('textbox', { name: 'Field' }),
    callerOnTarget: false,
  },
  {
    name: 'TreeSelect',
    render: p => <TreeSelect label="Field" data={[]} {...p} />,
    target: () => screen.getByRole('combobox', { name: 'Field' }),
  },
  {
    name: 'Cascader',
    render: p => <Cascader label="Field" data={[]} {...p} />,
    target: () => screen.getByRole('combobox', { name: 'Field' }),
  },
  {
    name: 'ColorInput',
    render: p => <ColorInput label="Field" {...p} />,
    target: () => screen.getByRole('combobox', { name: 'Field' }),
  },
  {
    name: 'ColorPicker',
    render: p => <ColorPicker label="Field" {...p} />,
    target: () => screen.getByRole('group', { name: 'Field' }),
  },
  // The picker bases put the caller's attributes on their container, so
  // their text input takes only the message's id.
  {
    name: 'DateInput',
    render: p => <DateInput label="Field" mobileNative={false} {...p} />,
    target: () => screen.getByRole('combobox', { name: 'Field' }),
    callerOnTarget: false,
  },
  {
    name: 'TimeInput',
    render: p => <TimeInput label="Field" mobileNative={false} {...p} />,
    target: () => screen.getByRole('combobox', { name: 'Field' }),
    callerOnTarget: false,
  },
  {
    name: 'DateTimeInput',
    render: p => <DateTimeInput label="Field" mobileNative={false} {...p} />,
    target: () => screen.getByRole('combobox', { name: 'Field' }),
    callerOnTarget: false,
  },
  {
    name: 'DateRangeInput',
    render: p => <DateRangeInput label="Field" mobileNative={false} {...p} />,
    target: () => screen.getByRole('group', { name: 'Field' }),
  },
  // On a phone the native input takes the caller's attributes too.
  {
    name: 'DateInput, native',
    render: p => <DateInput label="Field" mobileNative {...p} />,
    target: () => screen.getByLabelText('Field', { selector: 'input' }),
  },
  {
    name: 'TimeInput, native',
    render: p => <TimeInput label="Field" mobileNative {...p} />,
    target: () => screen.getByLabelText('Field', { selector: 'input' }),
  },
  {
    name: 'DateTimeInput, native',
    render: p => <DateTimeInput label="Field" mobileNative {...p} />,
    target: () => screen.getByLabelText('Field', { selector: 'input' }),
  },
  {
    name: 'DateRangeInput, native',
    render: p => <DateRangeInput label="Field" mobileNative {...p} />,
    target: () => screen.getByRole('group', { name: 'Field' }),
  },
];

describe.each(wrappers)('$name message', wrapper => {
  it('describes the control the label names', () => {
    const { container } = render(
      wrapper.render({ message: 'Use your work address.' })
    );
    const help = container.querySelector('p.help') as HTMLElement;
    expect(help.id).not.toBe('');
    expect(wrapper.target().getAttribute('aria-describedby')).toBe(help.id);
    expect(wrapper.target()).toHaveAccessibleDescription(
      'Use your work address.'
    );
  });

  it("lists the caller's ids first", () => {
    const { container } = render(
      wrapper.render({
        message: 'Use your work address.',
        'aria-describedby': 'hint',
      })
    );
    const help = container.querySelector('p.help') as HTMLElement;
    expect(wrapper.target().getAttribute('aria-describedby')).toBe(
      wrapper.callerOnTarget === false ? help.id : `hint ${help.id}`
    );
  });

  it('describes nothing without a message', () => {
    const { container } = render(wrapper.render({}));
    expect(container.querySelector('p.help')).toBeNull();
    expect(wrapper.target()).not.toHaveAttribute('aria-describedby');
  });
});

describe('message wiring beyond the table', () => {
  it('describes the input inside an outer Field, which takes the message as a sibling', () => {
    const { container } = render(
      <Field label="Email">
        <Input message="We never share it." />
      </Field>
    );
    const help = container.querySelector('p.help') as HTMLElement;
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-describedby', help.id);
    expect(input).toHaveAccessibleDescription('We never share it.');
  });

  it("keeps a caller's ids with no message", () => {
    render(<Input label="Email" aria-describedby="hint" />);
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
      'aria-describedby',
      'hint'
    );
  });

  it('gives each message its own id', () => {
    render(
      <>
        <Input label="First" message="One" />
        <Input label="Second" message="Two" />
      </>
    );
    expect(
      screen.getByRole('textbox', { name: 'First' })
    ).toHaveAccessibleDescription('One');
    expect(
      screen.getByRole('textbox', { name: 'Second' })
    ).toHaveAccessibleDescription('Two');
  });

  it('keeps the color and the class prefix on the message', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <Input label="Email" message="Required." messageColor="danger" />
      </ConfigProvider>
    );
    const help = container.querySelector('p') as HTMLElement;
    expect(help).toHaveClass('bestax-help', 'bestax-is-danger');
    expect(
      screen.getByRole('textbox', { name: 'Email' })
    ).toHaveAccessibleDescription('Required.');
  });

  it("describes both of a range Slider's thumbs, with the caller's ids on the low one", () => {
    const { container } = render(
      <Slider label="Price" range message="In euros." aria-describedby="hint" />
    );
    const help = container.querySelector('p.help') as HTMLElement;
    const [low, high] = screen.getAllByRole('slider');
    expect(low).toHaveAttribute('aria-describedby', `hint ${help.id}`);
    expect(high).toHaveAttribute('aria-describedby', help.id);
  });

  it("lists a Taginput's counter before its message", () => {
    const { container } = render(
      <Taginput label="Tags" maxTags={3} message="Press Enter to add." />
    );
    const counter = container.querySelector('small') as HTMLElement;
    const help = container.querySelector('p.help') as HTMLElement;
    expect(screen.getByRole('textbox', { name: 'Tags' })).toHaveAttribute(
      'aria-describedby',
      `${counter.id} ${help.id}`
    );
  });

  it("lists a multiple Combobox's tags before its message", () => {
    const { container } = render(
      <Combobox
        label="Fruit"
        data={['Apple', 'Pear']}
        multiple
        defaultValue={['Apple']}
        message="Pick any."
      />
    );
    const help = container.querySelector('p.help') as HTMLElement;
    const field = screen.getByRole('combobox', { name: 'Fruit' });
    const ids = (field.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids[ids.length - 1]).toBe(help.id);
    expect(ids.length).toBeGreaterThan(1);
  });

  it("lists a multiple TreeSelect's tags before its message", () => {
    const { container } = render(
      <TreeSelect
        label="Folders"
        data={[{ value: 'a', label: 'A' }]}
        selectionMode="checkbox"
        defaultValue={['a']}
        message="Pick any."
      />
    );
    const help = container.querySelector('p.help') as HTMLElement;
    const field = screen.getByRole('combobox', { name: 'Folders' });
    const ids = (field.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids[ids.length - 1]).toBe(help.id);
    expect(ids.length).toBeGreaterThan(1);
    expect(within(container).getByText('Pick any.')).toBe(help);
  });
});
