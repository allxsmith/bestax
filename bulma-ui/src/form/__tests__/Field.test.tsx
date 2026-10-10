import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Field, { FieldLabel, FieldBody } from '../Field';
import { Control } from '../Control';
import InputBase from '../InputBase';
import SelectBase from '../SelectBase';
import TextAreaBase from '../TextAreaBase';
import { DateInputBase } from '../DateInputBase';
import { TimeInputBase } from '../TimeInputBase';
import { DateTimeInputBase } from '../DateTimeInputBase';
import { Numberinput } from '../Numberinput';
import { Slider } from '../Slider';
import { DateInput } from '../DateInput';
import { TimeInput } from '../TimeInput';
import { DateTimeInput } from '../DateTimeInput';
import { DateRangeInput } from '../DateRangeInput';
import { DateRangeInputBase } from '../DateRangeInputBase';
import { Autocomplete } from '../Autocomplete';
import { Taginput } from '../Taginput';
import { File } from '../File';
import { Radios } from '../Radios';
import { Radio } from '../Radio';
import { Checkboxes } from '../Checkboxes';
import { Checkbox } from '../Checkbox';
import { Switch } from '../Switch';
import { Rate } from '../Rate';
import { Input } from '../Input';
import { Select } from '../Select';
import { TextArea } from '../TextArea';
import { ConfigProvider } from '../../helpers/Config';

describe('Field', () => {
  it('renders children', () => {
    render(<Field>Test Content</Field>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with no props', () => {
    // Should not throw
    const { container } = render(<Field />);
    expect(container.firstChild).toHaveClass('field');
  });

  it('applies custom className', () => {
    const { container } = render(<Field className="custom-class">Child</Field>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders label when provided as string', () => {
    render(<Field label="Username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Username')).toHaveClass('label');
  });

  it('renders label when provided as a React node', () => {
    render(<Field label={<span data-testid="custom-label">Node</span>} />);
    expect(screen.getByTestId('custom-label')).toBeInTheDocument();
  });

  it('renders horizontal layout with label', () => {
    render(<Field horizontal label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    const fieldLabel = screen.getByText('Email').closest('.field-label');
    expect(fieldLabel).toBeInTheDocument();
    const fieldElement = screen.getByText('Email').closest('.field');
    expect(fieldElement).not.toBeNull();
    const fieldBody = fieldElement?.querySelector('.field-body');
    expect(fieldBody).toBeInTheDocument();
  });

  it('renders grouped and has-addons classes', () => {
    const { container } = render(
      <Field grouped hasAddons>
        GroupAddon
      </Field>
    );
    const field = container.firstChild as HTMLElement;
    expect(field).toHaveClass('is-grouped');
    expect(field).toHaveClass('has-addons');
  });

  it('renders is-grouped-centered, is-grouped-right, is-grouped-multiline', () => {
    const { container: c1 } = render(
      <Field grouped="centered">centered</Field>
    );
    expect(c1.firstChild).toHaveClass('is-grouped-centered');
    const { container: c2 } = render(<Field grouped="right">right</Field>);
    expect(c2.firstChild).toHaveClass('is-grouped-right');
    const { container: c3 } = render(<Field grouped="multiline">multi</Field>);
    expect(c3.firstChild).toHaveClass('is-grouped-multiline');
  });

  it('renders with textColor and bgColor (delegates to useBulmaClasses)', () => {
    render(
      <Field textColor="danger" bgColor="light">
        Colors
      </Field>
    );
    expect(screen.getByText('Colors')).toBeInTheDocument();
  });

  it('passes labelProps to label (with htmlFor and data-testid)', () => {
    render(
      <Field
        label="Lab"
        labelProps={{ 'data-testid': 'my-label', htmlFor: 'f' }}
      />
    );
    const label = screen.getByTestId('my-label');
    expect(label).toHaveAttribute('for', 'f');
  });

  it('passes style and className from labelProps', () => {
    render(
      <Field
        label="Styled"
        labelProps={{
          style: { color: 'red' },
          className: 'extra-label',
          'data-testid': 'styled-label',
        }}
      />
    );
    const label = screen.getByTestId('styled-label');
    expect(label).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    expect(label).toHaveClass('extra-label');
  });

  it('horizontal with element whose type is null (covers ?. nullish branch)', () => {
    // Construct a React-element-like object whose `type` is null. This still
    // passes React.isValidElement (which only checks $$typeof), so the Field
    // logic's `c.type?.displayName` short-circuits via the `?.` nullish branch.
    // React itself will refuse to render the fake child, so we silence and catch.
    const real = React.createElement('div');
    const fake = { ...real, type: null } as unknown as React.ReactElement;
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    try {
      expect(() =>
        render(
          <Field horizontal label="Hi">
            {fake}
          </Field>
        )
      ).toThrow();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('renders Field.Label and Field.Body as static components', () => {
    render(
      <Field>
        <Field.Label data-testid="f-label">My Label</Field.Label>
        <Field.Body data-testid="f-body">Body Content</Field.Body>
      </Field>
    );
    expect(screen.getByTestId('f-label')).toBeInTheDocument();
    expect(screen.getByTestId('f-body')).toBeInTheDocument();
    expect(
      screen.getByText('My Label').closest('.field-label')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Body Content').closest('.field-body')
    ).toBeInTheDocument();
  });

  it('renders labelSize as size class (vertical and horizontal)', () => {
    // Vertical
    render(<Field label="Label" labelSize="large" />);
    expect(screen.getByText('Label')).toHaveClass('label');
    // Horizontal
    render(<Field label="Label2" labelSize="medium" horizontal />);
    const fieldLabel = screen.getByText('Label2').closest('.field-label');
    expect(fieldLabel).toHaveClass('is-medium');
  });

  it('adds is-normal class for labelSize "normal" in horizontal layout', () => {
    render(<Field label="NormalSize" labelSize="normal" horizontal />);
    const fieldLabel = screen.getByText('NormalSize').closest('.field-label');
    expect(fieldLabel?.className).toMatch(/is-normal/);
  });

  it('does not wrap children in FieldBody if already a FieldBody', () => {
    render(
      <Field horizontal>
        <Field.Body data-testid="existing-body">AlreadyBody</Field.Body>
      </Field>
    );
    // Should only be one field-body
    const bodies = screen.getAllByText('AlreadyBody');
    expect(bodies.length).toBe(1);
    expect(screen.getByTestId('existing-body')).toBeInTheDocument();
  });

  it('spreads extra props to FieldLabel and FieldBody', () => {
    render(
      <Field>
        <Field.Label data-testid="label-x" aria-label="lbl">
          A
        </Field.Label>
        <Field.Body data-testid="body-x" aria-label="body">
          B
        </Field.Body>
      </Field>
    );
    expect(screen.getByTestId('label-x')).toHaveAttribute('aria-label', 'lbl');
    expect(screen.getByTestId('body-x')).toHaveAttribute('aria-label', 'body');
  });

  it('passes labelProps.style to label in horizontal layout', () => {
    render(
      <Field
        horizontal
        label="Horiz"
        labelProps={{ style: { color: 'blue' }, 'data-testid': 'horiz-label' }}
      />
    );
    const label = screen.getByTestId('horiz-label');
    expect(label).toHaveStyle({ color: 'rgb(0, 0, 255)' });
  });

  it('does not wrap children if type.displayName is "FieldBody"', () => {
    const FakeBody = (props: React.ComponentPropsWithoutRef<'div'>) => (
      <div {...props}>FakeBody</div>
    );
    FakeBody.displayName = 'FieldBody';
    render(
      <Field horizontal>
        <FakeBody data-testid="fake-body" />
      </Field>
    );
    expect(screen.getByTestId('fake-body')).toBeInTheDocument();
  });

  it('applies classPrefix when provided via ConfigProvider', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <Field label="Test Label">Test content</Field>
      </ConfigProvider>
    );
    const field = container.querySelector('.bulma-field');
    expect(field).toBeInTheDocument();
    expect(field).not.toHaveClass('field');

    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('bulma-label');
    expect(label).not.toHaveClass('label');
  });

  it('applies classPrefix to FieldLabel and FieldBody components', () => {
    render(
      <ConfigProvider classPrefix="custom-">
        <Field>
          <Field.Label data-testid="field-label">Label with prefix</Field.Label>
          <Field.Body data-testid="field-body">Body with prefix</Field.Body>
        </Field>
      </ConfigProvider>
    );

    const fieldLabel = screen.getByTestId('field-label');
    const fieldBody = screen.getByTestId('field-body');

    expect(fieldLabel).toHaveClass('custom-field-label');
    expect(fieldLabel).not.toHaveClass('field-label');
    expect(fieldBody).toHaveClass('custom-field-body');
    expect(fieldBody).not.toHaveClass('field-body');
  });

  it('applies classPrefix to horizontal field labels', () => {
    render(
      <ConfigProvider classPrefix="prefix-">
        <Field horizontal label="Horizontal Label">
          <input type="text" />
        </Field>
      </ConfigProvider>
    );

    const label = screen.getByText('Horizontal Label');
    expect(label).toHaveClass('prefix-label');
    expect(label).not.toHaveClass('label');

    const fieldLabel = label.closest('.prefix-field-label');
    expect(fieldLabel).toBeInTheDocument();
    expect(fieldLabel).not.toHaveClass('field-label');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Field label="Test">Content</Field>
        </ConfigProvider>
      );
      const field = container.querySelector('.bulma-field');
      expect(field).toBeInTheDocument();
      expect(field).toHaveClass('bulma-field');
    });

    it('uses default classes when no prefix is provided', () => {
      const { container } = render(<Field label="Test">Content</Field>);
      const field = container.querySelector('.field');
      expect(field).toBeInTheDocument();
      expect(field).toHaveClass('field');
    });

    it('uses default classes when classPrefix is undefined', () => {
      const { container } = render(
        <ConfigProvider classPrefix={undefined}>
          <Field label="Test">Content</Field>
        </ConfigProvider>
      );
      const field = container.querySelector('.field');
      expect(field).toBeInTheDocument();
      expect(field).toHaveClass('field');
    });

    it('applies prefix to both main class and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Field grouped m="2" data-testid="test-field">
            Content
          </Field>
        </ConfigProvider>
      );

      const field = container.querySelector('.bulma-field');
      expect(field).toBeInTheDocument();
      expect(field).toHaveClass('bulma-field');
      expect(field).toHaveClass('bulma-is-grouped');
      expect(field).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Field hasAddons p="3">
          Content
        </Field>
      );
      const field = container.querySelector('.field');
      expect(field).toHaveClass('field');
      expect(field).toHaveClass('has-addons');
      expect(field).toHaveClass('p-3');
    });
  });
});

describe('Compound components', () => {
  test('Field.Control is the Control component', () => {
    expect(Field.Control).toBe(Control);
  });

  test('Field.Label is the FieldLabel component', () => {
    expect(Field.Label).toBe(FieldLabel);
  });

  test('Field.Body is the FieldBody component', () => {
    expect(Field.Body).toBe(FieldBody);
  });

  test('renders a horizontal field through Field.Label and Field.Body', () => {
    const { container } = render(
      <Field horizontal>
        <Field.Label>Name</Field.Label>
        <Field.Body>
          <Field.Control>
            <input className="input" />
          </Field.Control>
        </Field.Body>
      </Field>
    );
    expect(container.querySelector('.field-label')).toBeInTheDocument();
    expect(container.querySelector('.field-body')).toBeInTheDocument();
    expect(container.querySelector('.control')).toBeInTheDocument();
  });
});

describe('label auto-association (#495)', () => {
  const labelEl = (container: HTMLElement) =>
    container.querySelector('label.label') as HTMLElement;

  it('associates the label with a composed InputBase', () => {
    const { container } = render(
      <Field label="Email">
        <Control>
          <InputBase type="email" />
        </Control>
      </Field>
    );
    const input = screen.getByLabelText('Email');
    expect(input.tagName).toBe('INPUT');
    expect(input.id).toBeTruthy();
    expect(labelEl(container)).toHaveAttribute('for', input.id);
  });

  it('associates in horizontal layout', () => {
    const { container } = render(
      <Field horizontal label="Email">
        <Control>
          <InputBase type="email" />
        </Control>
      </Field>
    );
    const input = screen.getByLabelText('Email');
    expect(labelEl(container)).toHaveAttribute('for', input.id);
  });

  it('associates a composed SelectBase via the inner select', () => {
    const { container } = render(
      <Field label="Country">
        <Control>
          <SelectBase>
            <option value="us">United States</option>
          </SelectBase>
        </Control>
      </Field>
    );
    const select = screen.getByLabelText('Country');
    expect(select.tagName).toBe('SELECT');
    expect(container.querySelector('div.select')).not.toHaveAttribute('id');
    expect(labelEl(container)).toHaveAttribute('for', select.id);
  });

  it('associates a composed TextAreaBase', () => {
    const { container } = render(
      <Field label="Bio">
        <Control>
          <TextAreaBase />
        </Control>
      </Field>
    );
    const textarea = screen.getByLabelText('Bio');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(labelEl(container)).toHaveAttribute('for', textarea.id);
  });

  // The picker bases, with the type their native touch input takes.
  const pickerBases: Array<
    [
      string,
      (props: {
        inline?: boolean;
        mobileNative?: boolean;
        id?: string;
      }) => React.ReactElement,
      string,
    ]
  > = [
    ['DateInputBase', props => <DateInputBase {...props} />, 'date'],
    ['TimeInputBase', props => <TimeInputBase {...props} />, 'time'],
    [
      'DateTimeInputBase',
      props => <DateTimeInputBase {...props} />,
      'datetime-local',
    ],
  ];

  it.each(pickerBases)('associates a composed %s', (_, element) => {
    const { container } = render(
      <Field label="When">
        <Control>{element({})}</Control>
      </Field>
    );
    const input = screen.getByRole('combobox', { name: 'When' });
    expect(input.id).toBeTruthy();
    expect(labelEl(container)).toHaveAttribute('for', input.id);
    // The popover's ids build on the adopted id, as they do on a caller's.
    expect(input).toHaveAttribute('aria-controls', `${input.id}-popover`);
  });

  it.each(pickerBases)(
    'associates the native input of a composed %s',
    (_, element, type) => {
      render(
        <Field label="When">
          <Control>{element({ mobileNative: true })}</Control>
        </Field>
      );
      expect(screen.getByLabelText('When')).toHaveAttribute('type', type);
    }
  );

  it.each(pickerBases)(
    'leaves an inline %s alone: it has no input to name',
    (_, element) => {
      const { container } = render(
        <Field label="When">{element({ inline: true })}</Field>
      );
      // Nothing but the label itself takes or derives an id from the target.
      const target = labelEl(container).getAttribute('for') as string;
      expect(
        container.querySelector(`[id^="${target}"]:not(label)`)
      ).toBeNull();
    }
  );

  it.each(pickerBases)(
    'keeps a user id on a composed %s, as on InputBase',
    (_, element) => {
      const { container } = render(
        <Field label="When">
          <Control>{element({ id: 'mine' })}</Control>
        </Field>
      );
      expect(screen.getByRole('combobox')).toHaveAttribute('id', 'mine');
      expect(labelEl(container).getAttribute('for')).not.toBe('mine');
    }
  );

  it('keeps a user id on the base; the label still points at its own target', () => {
    const { container } = render(
      <Field label="Email">
        <Control>
          <InputBase id="mine" />
        </Control>
      </Field>
    );
    const input = container.querySelector('input') as HTMLElement;
    expect(input).toHaveAttribute('id', 'mine');
    const forValue = labelEl(container).getAttribute('for');
    expect(forValue).toBeTruthy();
    expect(forValue).not.toBe('mine');
  });

  it('an explicit labelProps.htmlFor takes over the association', () => {
    const { container } = render(
      <Field label="Email" labelProps={{ htmlFor: 'custom' }}>
        <Control>
          <InputBase id="custom" />
        </Control>
      </Field>
    );
    expect(labelEl(container)).toHaveAttribute('for', 'custom');
    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'custom');
  });

  it('labelProps={{ htmlFor: undefined }} opts out entirely', () => {
    const { container } = render(
      <Field label="Email" labelProps={{ htmlFor: undefined }}>
        <Control>
          <InputBase />
        </Control>
      </Field>
    );
    expect(labelEl(container)).not.toHaveAttribute('for');
    expect(container.querySelector('input')).not.toHaveAttribute('id');
  });

  it('skips association for grouped fields', () => {
    const { container } = render(
      <Field label="Range" grouped>
        <Control>
          <InputBase />
        </Control>
        <Control>
          <InputBase />
        </Control>
      </Field>
    );
    expect(labelEl(container)).not.toHaveAttribute('for');
    container.querySelectorAll('input').forEach(input => {
      expect(input).not.toHaveAttribute('id');
    });
  });

  it('skips association for hasAddons fields', () => {
    const { container } = render(
      <Field label="Search" hasAddons>
        <Control>
          <InputBase />
        </Control>
      </Field>
    );
    expect(labelEl(container)).not.toHaveAttribute('for');
    expect(container.querySelector('input')).not.toHaveAttribute('id');
  });

  it('a nested unlabeled Field shadows the outer id', () => {
    const { container } = render(
      <Field label="Outer">
        <Field>
          <Control>
            <InputBase />
          </Control>
        </Field>
      </Field>
    );
    expect(container.querySelector('input')).not.toHaveAttribute('id');
  });

  it('a labeled Field with no adopting control renders the for anyway', () => {
    const { container } = render(<Field label="Only text">plain</Field>);
    expect(labelEl(container).getAttribute('for')).toBeTruthy();
  });
});

describe('label names the convenience controls (#939)', () => {
  const labelEl = (container: HTMLElement) =>
    container.querySelector('label.label') as HTMLElement;

  // Each control that renders one input of its own, with how to find it.
  const singles: Array<[string, () => React.ReactElement, () => HTMLElement]> =
    [
      [
        'Numberinput',
        () => <Numberinput />,
        () => screen.getByRole('spinbutton'),
      ],
      [
        'the stepper Numberinput',
        () => <Numberinput variant="stepper" />,
        () => screen.getByRole('spinbutton'),
      ],
      ['Slider', () => <Slider />, () => screen.getByRole('slider')],
      ['DateInput', () => <DateInput />, () => screen.getByRole('combobox')],
      ['TimeInput', () => <TimeInput />, () => screen.getByRole('combobox')],
      [
        'DateTimeInput',
        () => <DateTimeInput />,
        () => screen.getByRole('combobox'),
      ],
      [
        'Autocomplete',
        () => <Autocomplete data={['Apple']} placeholder="Search" />,
        () => screen.getByRole('combobox'),
      ],
      ['Taginput', () => <Taginput />, () => screen.getByRole('textbox')],
      [
        'File',
        () => <File />,
        () => document.querySelector('input[type="file"]') as HTMLElement,
      ],
    ];

  it.each(singles)('names %s from the Field label', (_, element, control) => {
    const { container } = render(<Field label="Pick">{element()}</Field>);
    const input = control();
    expect(input.id).toBeTruthy();
    expect(labelEl(container)).toHaveAttribute('for', input.id);
    expect(screen.getByLabelText('Pick')).toBe(input);
  });

  it.each(singles)(
    'names %s from the Field label inside a Control',
    (_, element, control) => {
      const { container } = render(
        <Field label="Pick">
          <Control>{element()}</Control>
        </Field>
      );
      expect(labelEl(container)).toHaveAttribute('for', control().id);
    }
  );

  it.each([
    ['Numberinput', 'spinbutton'],
    ['Slider', 'slider'],
    ['DateInput', 'combobox'],
    ['Autocomplete', 'combobox'],
    ['Taginput', 'textbox'],
  ])('gives %s the Field label as its accessible name', (name, role) => {
    const element = singles.find(([n]) => n === name)![1];
    render(<Field label="Pick">{element()}</Field>);
    expect(screen.getByRole(role, { name: 'Pick' })).toBeInTheDocument();
  });

  it('names the low thumb of a range Slider, as its own label does', () => {
    const { container } = render(
      <Field label="Pick">
        <Slider range />
      </Field>
    );
    const low = container.querySelector('.slider-input-low') as HTMLElement;
    expect(labelEl(container)).toHaveAttribute('for', low.id);
    const high = container.querySelector('.slider-input-high') as HTMLElement;
    expect(high).not.toHaveAttribute('id');
  });

  it("starts each range Slider thumb's name with the label, at its labelProps id (#981)", () => {
    render(
      <Field label="Pick" labelProps={{ id: 'pick-label' }}>
        <Slider range />
      </Field>
    );
    for (const name of ['Pick Minimum value', 'Pick Maximum value']) {
      expect(screen.getByRole('slider', { name })).toHaveAttribute(
        'aria-labelledby',
        expect.stringMatching(/^pick-label /)
      );
    }
  });

  it('keeps an id the caller set on the control', () => {
    const { container } = render(
      <Field label="Pick">
        <Slider id="mine" />
      </Field>
    );
    expect(screen.getByRole('slider')).toHaveAttribute('id', 'mine');
    expect(labelEl(container).getAttribute('for')).not.toBe('mine');
  });

  // A wrapper forwarding an optional id passes an undefined `id` key, which a
  // props spread after the control's own id would otherwise wipe.
  const undefinedIds: Array<
    [string, (props: { label?: string }) => React.ReactElement, () => Element]
  > = [
    [
      'Input',
      props => <Input id={undefined} {...props} />,
      () => screen.getByRole('textbox'),
    ],
    [
      'Select',
      props => (
        <Select id={undefined} {...props}>
          <option value="a">A</option>
        </Select>
      ),
      () => screen.getByRole('combobox'),
    ],
    [
      'TextArea',
      props => <TextArea id={undefined} {...props} />,
      () => screen.getByRole('textbox'),
    ],
    [
      'Numberinput',
      props => <Numberinput id={undefined} {...props} />,
      () => screen.getByRole('spinbutton'),
    ],
    [
      'Slider',
      props => <Slider id={undefined} {...props} />,
      () => screen.getByRole('slider'),
    ],
    [
      'a range Slider',
      props => <Slider range id={undefined} {...props} />,
      () => document.querySelector('.slider-input-low') as Element,
    ],
    [
      'DateInput',
      props => <DateInput id={undefined} {...props} />,
      () => screen.getByRole('combobox'),
    ],
    [
      'TimeInput',
      props => <TimeInput id={undefined} {...props} />,
      () => screen.getByRole('combobox'),
    ],
    [
      'DateTimeInput',
      props => <DateTimeInput id={undefined} {...props} />,
      () => screen.getByRole('combobox'),
    ],
    [
      'File',
      props => <File id={undefined} {...props} />,
      () => document.querySelector('input[type="file"]') as Element,
    ],
  ];

  it.each(undefinedIds)(
    'names %s from the Field label when the caller passes an undefined id',
    (_, element, control) => {
      const { container } = render(<Field label="Pick">{element({})}</Field>);
      expect(control().id).toBeTruthy();
      expect(labelEl(container)).toHaveAttribute('for', control().id);
    }
  );

  it.each(undefinedIds)(
    'names %s from its own label when the caller passes an undefined id',
    (_, element, control) => {
      const { container } = render(element({ label: 'Pick' }));
      expect(control().id).toBeTruthy();
      expect(labelEl(container)).toHaveAttribute('for', control().id);
    }
  );

  it("keeps a File's picked name and onChange beside the Field label's id", () => {
    const onChange = jest.fn();
    const { container } = render(
      <Field label="Resume">
        <File id={undefined} hasName onChange={onChange} />
      </Field>
    );
    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(labelEl(container)).toHaveAttribute('for', input.id);
    fireEvent.change(input, {
      target: { files: [new window.File(['x'], 'resume.pdf')] },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByText('resume.pdf')).toHaveClass('file-name');
    expect(labelEl(container)).toHaveAttribute('for', input.id);
  });

  it.each([
    ['a generated target', {}],
    ['a hand-wired target elsewhere', { labelProps: { htmlFor: 'other' } }],
  ])(
    'keeps the "Add tag" fallback on a Taginput the label does not target (%s)',
    (_, fieldProps) => {
      render(
        <Field label="Pick" {...fieldProps}>
          <Taginput id="mine" />
        </Field>
      );
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-label',
        'Add tag'
      );
    }
  );

  it('drops the "Add tag" fallback when the label is wired to the Taginput by hand', () => {
    render(
      <Field label="Tags" labelProps={{ htmlFor: 'tags-field' }}>
        <Taginput id="tags-field" />
      </Field>
    );
    const input = screen.getByRole('textbox', { name: 'Tags' });
    expect(input).not.toHaveAttribute('aria-label');
  });

  it('drops it across the inner Field of a hand-wired horizontal layout', () => {
    render(
      <Field horizontal label="Tags" labelProps={{ htmlFor: 'tags-field' }}>
        <Field.Body>
          <Field>
            <Taginput id="tags-field" />
          </Field>
          <Field>
            <Taginput id="other-tags" />
          </Field>
        </Field.Body>
      </Field>
    );
    const [wired, other] = screen.getAllByRole('textbox');
    expect(wired).not.toHaveAttribute('aria-label');
    expect(screen.getByRole('textbox', { name: 'Tags' })).toBe(wired);
    expect(other).toHaveAttribute('aria-label', 'Add tag');
  });

  // The horizontal recipe in the Context-Aware Rendering examples on the
  // Input, Select and TextArea pages, with and without the inner Control.
  const horizontalRecipes: Array<
    [string, (id: string) => React.ReactElement, string]
  > = [
    ['Input', id => <Input id={id} placeholder="Enter" />, 'textbox'],
    [
      'Select',
      id => (
        <Select id={id}>
          <option value="">Please select</option>
        </Select>
      ),
      'combobox',
    ],
    ['TextArea', id => <TextArea id={id} placeholder="Enter" />, 'textbox'],
  ];

  it.each(horizontalRecipes)(
    'names %s across the inner Field of a hand-wired horizontal layout',
    (_, element, role) => {
      render(
        <Field horizontal label="Pick" labelProps={{ htmlFor: 'pick-field' }}>
          <Field.Body>
            <Field>{element('pick-field')}</Field>
          </Field.Body>
        </Field>
      );
      expect(screen.getByRole(role, { name: 'Pick' })).toHaveAttribute(
        'id',
        'pick-field'
      );
    }
  );

  it.each(horizontalRecipes)(
    'names %s across the inner Field and Control of a hand-wired horizontal layout',
    (_, element, role) => {
      render(
        <Field horizontal label="Pick" labelProps={{ htmlFor: 'pick-field' }}>
          <Field.Body>
            <Field>
              <Control iconLeftName="user">{element('pick-field')}</Control>
            </Field>
          </Field.Body>
        </Field>
      );
      expect(screen.getByRole(role, { name: 'Pick' })).toHaveAttribute(
        'id',
        'pick-field'
      );
    }
  );

  it.each([
    ['an inline DateInput', () => <DateInput inline />],
    ['an inline TimeInput', () => <TimeInput inline />],
    ['an inline DateTimeInput', () => <DateTimeInput inline />],
    [
      'a Taginput at its tag limit',
      () => <Taginput defaultValue={['React']} maxTags={1} />,
    ],
  ])('leaves %s alone: it has no input to name', (_, element) => {
    const { container } = render(<Field label="Pick">{element()}</Field>);
    // Nothing but the label itself takes or derives an id from the target.
    const target = labelEl(container).getAttribute('for') as string;
    expect(container.querySelector(`[id^="${target}"]:not(label)`)).toBeNull();
  });

  // The Field's TSDoc names these as taking nothing from it: each wraps its
  // input in a label of its own, so its children name it.
  it.each([
    ['Checkbox', () => <Checkbox>Mine</Checkbox>, 'checkbox'],
    ['Radio', () => <Radio name="pick">Mine</Radio>, 'radio'],
    ['Switch', () => <Switch>Mine</Switch>, 'checkbox'],
  ])('leaves a %s named by its own children', (_, element, role) => {
    const { container } = render(<Field label="Pick">{element()}</Field>);
    const target = labelEl(container).getAttribute('for') as string;
    expect(container.querySelector(`[id="${target}"]`)).toBeNull();
    expect(screen.getByRole(role, { name: 'Mine' })).toBeInTheDocument();
  });

  // Each group control, built with whatever ARIA props, and own `label`, the
  // test passes.
  const groups: Array<
    [
      string,
      (
        aria?: React.AriaAttributes & { label?: React.ReactNode }
      ) => React.ReactElement,
      string,
    ]
  > = [
    [
      'Radios',
      aria => (
        <Radios name="pick" {...aria}>
          <Radio value="a">A</Radio>
        </Radios>
      ),
      'radiogroup',
    ],
    [
      'Checkboxes',
      aria => (
        <Checkboxes {...aria}>
          <Checkbox value="a">A</Checkbox>
        </Checkboxes>
      ),
      'group',
    ],
    ['Rate', aria => <Rate {...aria} />, 'radiogroup'],
    ['DateRangeInput', aria => <DateRangeInput {...aria} />, 'group'],
  ];
  // The same, plus a group base composed by hand, which has no `label` of
  // its own and takes its name from the Field alone (#1005).
  const fieldGroups: typeof groups = [
    ...groups,
    [
      'DateRangeInputBase',
      ({ label: _label, ...aria } = {}) => <DateRangeInputBase {...aria} />,
      'group',
    ],
  ];

  it.each(fieldGroups)(
    'names the %s group through aria-labelledby',
    (_, element, role) => {
      const { container } = render(<Field label="Pick">{element()}</Field>);
      const label = labelEl(container);
      expect(label.id).toBeTruthy();
      expect(label.id).not.toBe(label.getAttribute('for'));
      expect(screen.getByRole(role, { name: 'Pick' })).toHaveAttribute(
        'aria-labelledby',
        label.id
      );
    }
  );

  it.each(fieldGroups)(
    'names the %s group inside a Control too',
    (_, element, role) => {
      render(
        <Field label="Pick">
          <Control>{element()}</Control>
        </Field>
      );
      expect(screen.getByRole(role, { name: 'Pick' })).toBeInTheDocument();
    }
  );

  it.each(fieldGroups)(
    'lets an aria-label the caller set on %s win',
    (_, element, role) => {
      render(<Field label="Pick">{element({ 'aria-label': 'Mine' })}</Field>);
      const group = screen.getByRole(role, { name: 'Mine' });
      expect(group).not.toHaveAttribute('aria-labelledby');
    }
  );

  it.each(fieldGroups)(
    'lets an aria-labelledby the caller set on %s win',
    (_, element, role) => {
      render(
        <Field label="Pick">
          <span id="other">Other</span>
          {element({ 'aria-labelledby': 'other' })}
        </Field>
      );
      expect(screen.getByRole(role, { name: 'Other' })).toBeInTheDocument();
    }
  );

  // The same two props on a group that carries its own `label`: the caller's
  // name wins there too, so moving the label onto a Field changes nothing.
  it.each(groups)(
    'lets an aria-label the caller set on %s win over its own label',
    (_, element, role) => {
      const { container } = render(
        element({ label: 'Pick', 'aria-label': 'Mine' })
      );
      expect(labelEl(container)).toHaveTextContent('Pick');
      const group = screen.getByRole(role, { name: 'Mine' });
      expect(group).not.toHaveAttribute('aria-labelledby');
    }
  );

  it.each(groups)(
    'lets an aria-labelledby the caller set on %s win over its own label',
    (_, element, role) => {
      render(
        <>
          <span id="other">Other</span>
          {element({ label: 'Pick', 'aria-labelledby': 'other' })}
        </>
      );
      expect(screen.getByRole(role, { name: 'Other' })).toBeInTheDocument();
    }
  );

  it.each([
    [
      'inside a labeled Field',
      <Field key="field" label="Pick">
        <Rate aria-labelledby={undefined} />
      </Field>,
    ],
    [
      'with a label of its own',
      <Rate key="own" label="Pick" aria-labelledby={undefined} />,
    ],
  ])(
    'leaves a Rate its fallback name when the caller forwards an undefined aria-labelledby %s',
    (_, markup) => {
      render(markup);
      expect(
        screen.getByRole('radiogroup', { name: 'Rating' })
      ).toBeInTheDocument();
    }
  );

  it.each(fieldGroups)(
    'still names the %s group when the caller forwards an undefined aria-label',
    (_, element, role) => {
      render(
        <Field label="Pick">{element({ 'aria-label': undefined })}</Field>
      );
      expect(screen.getByRole(role, { name: 'Pick' })).toBeInTheDocument();
    }
  );

  it('drops the "Rating" fallback once the Field label names a Rate', () => {
    render(
      <Field label="Pick">
        <Rate />
      </Field>
    );
    expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-label');
  });

  it('points a group at a labelProps.id of the caller', () => {
    const { container } = render(
      <Field label="Pick" labelProps={{ id: 'pick-label' }}>
        <Rate />
      </Field>
    );
    expect(labelEl(container)).toHaveAttribute('id', 'pick-label');
    expect(screen.getByRole('radiogroup')).toHaveAttribute(
      'aria-labelledby',
      'pick-label'
    );
  });

  it.each([
    ['grouped', { grouped: true }],
    ['hasAddons', { hasAddons: true }],
    ['labelProps.htmlFor opt-out', { labelProps: { htmlFor: undefined } }],
  ])('names no group in a %s Field', (_, fieldProps) => {
    const { container } = render(
      <Field label="Pick" {...fieldProps}>
        <Rate />
      </Field>
    );
    expect(labelEl(container)).not.toHaveAttribute('id');
    const group = screen.getByRole('radiogroup');
    expect(group).not.toHaveAttribute('aria-labelledby');
    expect(group).toHaveAttribute('aria-label', 'Rating');
  });

  it.each([
    ['plain', {}],
    ['grouped', { grouped: true }],
    ['hasAddons', { hasAddons: true }],
  ])(
    'names no group from a label wired by hand in a %s Field, even one with an id',
    (_, fieldProps) => {
      // The id a range Slider or Autocomplete would point at, which a group
      // does not take on its own, since it takes no `for`.
      const { container } = render(
        <Field
          label="Pick"
          labelProps={{ htmlFor: 'pick', id: 'pick-label' }}
          {...fieldProps}
        >
          <Rate />
        </Field>
      );
      expect(labelEl(container)).toHaveAttribute('id', 'pick-label');
      const group = screen.getByRole('radiogroup');
      expect(group).not.toHaveAttribute('aria-labelledby');
      expect(group).toHaveAttribute('aria-label', 'Rating');
    }
  );

  it('a nested unlabeled Field shadows the outer label for groups too', () => {
    render(
      <Field label="Outer">
        <Field>
          <Radios name="pick">
            <Radio value="a">A</Radio>
          </Radios>
        </Field>
      </Field>
    );
    expect(screen.getByRole('radiogroup')).not.toHaveAttribute(
      'aria-labelledby'
    );
  });

  it('keeps a hand-wired label id and drops its for across a nested Field', () => {
    // The horizontal recipe on the group docs pages.
    const { container } = render(
      <Field
        horizontal
        label="Pick"
        labelProps={{ id: 'pick-label', htmlFor: undefined }}
      >
        <Field.Body>
          <Field>
            <Radios name="pick" aria-labelledby="pick-label">
              <Radio value="a">A</Radio>
            </Radios>
          </Field>
        </Field.Body>
      </Field>
    );
    expect(labelEl(container)).toHaveAttribute('id', 'pick-label');
    expect(labelEl(container)).not.toHaveAttribute('for');
    expect(
      screen.getByRole('radiogroup', { name: 'Pick' })
    ).toBeInTheDocument();
  });
});
