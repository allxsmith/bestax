import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
import { DateRangeInput } from '../DateRangeInput';
import { DateRangeInputBase } from '../DateRangeInputBase';
import { ColorPicker } from '../ColorPicker';

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

// #2063: a range's two inputs, and ColorPicker.Input's input, take them too.
describe.each([
  ['DateRangeInput', DateRangeInput],
  ['DateRangeInputBase', DateRangeInputBase],
] as const)('%s', (_name, Range) => {
  const inputs = () =>
    Array.from(
      document.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])')
    );

  it.each([
    ['its text inputs', false],
    ['its native inputs', true],
  ] as const)(
    'puts aria-invalid and aria-errormessage on %s, not the group',
    (_where, mobileNative) => {
      render(
        <Range
          aria-label="Stay"
          mobileNative={mobileNative}
          aria-invalid="true"
          aria-errormessage="stay-error"
        />
      );
      expect(inputs()).toHaveLength(2);
      for (const input of inputs()) {
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-errormessage', 'stay-error');
      }
      expect(screen.getByRole('group', { name: 'Stay' })).not.toHaveAttribute(
        'aria-invalid'
      );
      expect(document.querySelectorAll('[aria-invalid]')).toHaveLength(2);
    }
  );

  it('sets neither without them', () => {
    render(<Range aria-label="Stay" mobileNative={false} />);
    for (const input of inputs()) {
      expect(input).not.toHaveAttribute('aria-invalid');
      expect(input).not.toHaveAttribute('aria-errormessage');
    }
  });

  it('keeps them on the group inline, where there is no input', () => {
    render(<Range aria-label="Stay" inline aria-invalid="true" />);
    expect(screen.getByRole('group', { name: 'Stay' })).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });
});

describe('ColorPicker.Input', () => {
  const field = () => screen.getByRole('textbox', { name: 'Color value' });

  it('puts aria-invalid and aria-errormessage on its input, not its row', () => {
    render(
      <ColorPicker defaultValue="#ff0000">
        <ColorPicker.Input
          aria-invalid="true"
          aria-errormessage="color-error"
          data-testid="row"
        />
      </ColorPicker>
    );
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(field()).toHaveAttribute('aria-errormessage', 'color-error');
    expect(screen.getByTestId('row')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByTestId('row')).not.toHaveAttribute('aria-errormessage');
  });

  it("keeps marking text it cannot read, whatever the caller's aria-invalid says", () => {
    render(
      <ColorPicker defaultValue="#ff0000">
        <ColorPicker.Input aria-invalid="false" />
      </ColorPicker>
    );
    fireEvent.change(field(), { target: { value: 'not a color' } });
    expect(field()).toHaveAttribute('aria-invalid', 'true');
  });
});

// #2130: the ColorPicker's own aria-invalid and aria-errormessage reach its
// value field, and stay on its group.
describe('ColorPicker', () => {
  const field = () => screen.getByRole('textbox', { name: 'Color value' });

  it('gives its value field the aria-invalid and aria-errormessage it takes', () => {
    render(
      <ColorPicker
        label="Accent"
        defaultValue="#ff0000"
        aria-invalid="true"
        aria-errormessage="accent-error"
      />
    );
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(field()).toHaveAttribute('aria-errormessage', 'accent-error');
    const group = screen.getByRole('group', { name: 'Accent' });
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('aria-errormessage', 'accent-error');
  });

  it('gives them to a ColorPicker.Input among parts of your own', () => {
    render(
      <ColorPicker
        aria-label="Accent"
        defaultValue="#ff0000"
        aria-invalid
        aria-errormessage="accent-error"
      >
        <ColorPicker.HueSlider />
        <ColorPicker.Input />
      </ColorPicker>
    );
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(field()).toHaveAttribute('aria-errormessage', 'accent-error');
  });

  it("lets ColorPicker.Input's own win over the picker's", () => {
    render(
      <ColorPicker
        aria-label="Accent"
        defaultValue="#ff0000"
        aria-invalid="true"
        aria-errormessage="accent-error"
      >
        <ColorPicker.Input
          aria-invalid={false}
          aria-errormessage="value-error"
        />
      </ColorPicker>
    );
    expect(field()).not.toHaveAttribute('aria-invalid');
    expect(field()).toHaveAttribute('aria-errormessage', 'value-error');
  });

  it("takes the picker's as a pair, so the Input's one keeps the other out", () => {
    render(
      <ColorPicker
        aria-label="Accent"
        defaultValue="#ff0000"
        aria-invalid="true"
        aria-errormessage="accent-error"
      >
        <ColorPicker.Input aria-invalid={false} />
      </ColorPicker>
    );
    expect(field()).not.toHaveAttribute('aria-invalid');
    expect(field()).not.toHaveAttribute('aria-errormessage');
  });

  it("doesn't reach the field of a ColorPicker nested inside it", () => {
    render(
      <ColorPicker
        aria-label="Outer"
        defaultValue="#ff0000"
        aria-invalid="true"
        aria-errormessage="outer-error"
      >
        <ColorPicker aria-label="Inner" defaultValue="#00ff00">
          <ColorPicker.Input />
        </ColorPicker>
      </ColorPicker>
    );
    expect(field()).not.toHaveAttribute('aria-invalid');
    expect(field()).not.toHaveAttribute('aria-errormessage');
  });

  it('sets neither on the field without them', () => {
    render(<ColorPicker aria-label="Accent" defaultValue="#ff0000" />);
    expect(field()).not.toHaveAttribute('aria-invalid');
    expect(field()).not.toHaveAttribute('aria-errormessage');
  });

  it('still marks text the field cannot read when the picker is valid', () => {
    render(
      <ColorPicker
        aria-label="Accent"
        defaultValue="#ff0000"
        aria-invalid="false"
      />
    );
    expect(field()).toHaveAttribute('aria-invalid', 'false');
    fireEvent.change(field(), { target: { value: 'not a color' } });
    expect(field()).toHaveAttribute('aria-invalid', 'true');
  });
});
