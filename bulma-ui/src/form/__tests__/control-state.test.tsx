import React from 'react';
import { render, screen } from '@testing-library/react';
import { Autocomplete } from '../Autocomplete';
import { Combobox } from '../Combobox';
import { Taginput } from '../Taginput';
import { TreeSelect } from '../TreeSelect';
import { Cascader } from '../Cascader';
import { DateInput } from '../DateInput';
import { TimeInput } from '../TimeInput';
import { DateTimeInput } from '../DateTimeInput';
import { DateInputBase } from '../DateInputBase';
import { TimeInputBase } from '../TimeInputBase';
import { DateTimeInputBase } from '../DateTimeInputBase';

// #2002: these wrappers put the caller's other attributes on an element
// around their control, so `aria-invalid` and `aria-errormessage`, which
// report the control's state, go on the control the label names instead.

interface Wrapper {
  name: string;
  /** Renders the wrapper with the label "Field" and these props. */
  render: (props: {
    'aria-invalid'?: React.AriaAttributes['aria-invalid'];
    'aria-errormessage'?: string;
    'data-testid'?: string;
  }) => React.ReactElement;
  /** The control the label names, or a base's only combobox. */
  target: () => HTMLElement;
}

const combobox = () => screen.getByRole('combobox', { name: 'Field' });

const wrappers: Wrapper[] = [
  {
    name: 'Autocomplete',
    render: p => <Autocomplete label="Field" data={['One']} {...p} />,
    target: combobox,
  },
  {
    name: 'Combobox with data',
    render: p => <Combobox label="Field" data={['One']} {...p} />,
    target: combobox,
  },
  {
    name: 'Taginput',
    render: p => <Taginput label="Field" {...p} />,
    target: () => screen.getByRole('textbox', { name: 'Field' }),
  },
  {
    name: 'TreeSelect',
    render: p => <TreeSelect label="Field" data={[]} {...p} />,
    target: combobox,
  },
  {
    name: 'Cascader',
    render: p => <Cascader label="Field" data={[]} {...p} />,
    target: combobox,
  },
  {
    name: 'DateInput',
    render: p => <DateInput label="Field" mobileNative={false} {...p} />,
    target: combobox,
  },
  {
    name: 'TimeInput',
    render: p => <TimeInput label="Field" mobileNative={false} {...p} />,
    target: combobox,
  },
  {
    name: 'DateTimeInput',
    render: p => <DateTimeInput label="Field" mobileNative={false} {...p} />,
    target: combobox,
  },
  {
    name: 'DateInputBase',
    render: p => (
      <DateInputBase aria-label="Field" mobileNative={false} {...p} />
    ),
    target: () => screen.getByRole('combobox'),
  },
  {
    name: 'TimeInputBase',
    render: p => (
      <TimeInputBase aria-label="Field" mobileNative={false} {...p} />
    ),
    target: () => screen.getByRole('combobox'),
  },
  {
    name: 'DateTimeInputBase',
    render: p => (
      <DateTimeInputBase aria-label="Field" mobileNative={false} {...p} />
    ),
    target: () => screen.getByRole('combobox'),
  },
];

describe.each(wrappers)('$name', ({ render: renderWrapper, target }) => {
  it('puts aria-invalid and aria-errormessage on the control, not its wrapper', () => {
    render(
      renderWrapper({
        'aria-invalid': true,
        'aria-errormessage': 'field-error',
        'data-testid': 'caller',
      })
    );

    expect(target()).toHaveAttribute('aria-invalid', 'true');
    expect(target()).toHaveAttribute('aria-errormessage', 'field-error');
    expect(document.querySelectorAll('[aria-invalid]')).toHaveLength(1);
    expect(document.querySelectorAll('[aria-errormessage]')).toHaveLength(1);
    // The other attributes still go where they did.
    expect(screen.getByTestId('caller')).not.toBe(target());
  });

  it('sets neither without them', () => {
    render(renderWrapper({}));

    expect(target()).not.toHaveAttribute('aria-invalid');
    expect(target()).not.toHaveAttribute('aria-errormessage');
  });
});

describe('the date and time bases', () => {
  it.each([
    ['DateInputBase', DateInputBase],
    ['TimeInputBase', TimeInputBase],
    ['DateTimeInputBase', DateTimeInputBase],
  ] as const)(
    '%s keeps them on its native input, and only there',
    (_name, Base) => {
      render(
        <Base
          aria-label="Field"
          mobileNative
          aria-invalid="true"
          aria-errormessage="field-error"
        />
      );
      const input = document.querySelector('input:not([type="hidden"])')!;
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-errormessage', 'field-error');
      expect(document.querySelectorAll('[aria-invalid]')).toHaveLength(1);
      expect(document.querySelectorAll('[aria-errormessage]')).toHaveLength(1);
    }
  );

  it.each([
    ['DateInputBase', DateInputBase],
    ['TimeInputBase', TimeInputBase],
    ['DateTimeInputBase', DateTimeInputBase],
  ] as const)(
    '%s keeps them on its container inline, where there is no input',
    (_name, Base) => {
      const { container } = render(
        <Base aria-label="Field" inline aria-invalid="true" />
      );
      expect(container.firstElementChild).toHaveAttribute(
        'aria-invalid',
        'true'
      );
    }
  );
});
