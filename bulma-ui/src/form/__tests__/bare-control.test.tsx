import React from 'react';
import { render, screen } from '@testing-library/react';
import { Field } from '../Field';
import { Control } from '../Control';
import { Input } from '../Input';
import { Select } from '../Select';
import { TextArea } from '../TextArea';
import { DateInput } from '../DateInput';
import { DateTimeInput } from '../DateTimeInput';
import { TimeInput } from '../TimeInput';
import { Checkboxes } from '../Checkboxes';
import { Checkbox } from '../Checkbox';
import { Radios } from '../Radios';
import { Radio } from '../Radio';
import { Slider } from '../Slider';
import { Rate } from '../Rate';
import { resetDevWarnings } from '../../helpers/devWarnings';

// #905: a convenience wrapper inside a Control with no Field around it used
// to render a Field of its own there, a .field inside the .control, so
// Bulma's sibling rules (`.input ~ .icon`) no longer reached the icons and
// the field margin landed inside the control. It now renders no Field
// unless a label or message needs one, and warns when one does.

interface FieldBits {
  label?: React.ReactNode;
  message?: React.ReactNode;
}

interface Wrapper {
  name: string;
  render: (props: FieldBits) => React.ReactElement;
  /** The widget's own root element, which belongs directly in the Control. */
  root: string;
}

const wrappers: Wrapper[] = [
  { name: 'Input', render: p => <Input {...p} />, root: 'input.input' },
  {
    name: 'Select',
    render: p => (
      <Select {...p}>
        <option>One</option>
      </Select>
    ),
    root: '.select',
  },
  {
    name: 'TextArea',
    render: p => <TextArea {...p} />,
    root: 'textarea.textarea',
  },
  {
    name: 'DateInput',
    render: p => <DateInput {...p} />,
    root: '.dateinput-container',
  },
  {
    name: 'DateTimeInput',
    render: p => <DateTimeInput {...p} />,
    root: '.datetimeinput-container',
  },
  {
    name: 'TimeInput',
    render: p => <TimeInput {...p} />,
    root: '.timeinput-container',
  },
  {
    name: 'Checkboxes',
    render: p => (
      <Checkboxes {...p}>
        <Checkbox>One</Checkbox>
      </Checkboxes>
    ),
    root: '.checkboxes',
  },
  {
    name: 'Radios',
    render: p => (
      <Radios {...p}>
        <Radio value="one">One</Radio>
      </Radios>
    ),
    root: '.radios',
  },
  { name: 'Slider', render: p => <Slider {...p} />, root: '.slider' },
  { name: 'Rate', render: p => <Rate {...p} />, root: '.rate' },
];

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  resetDevWarnings();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

/** The outermost `.control`, the one each test renders itself. */
const outerControl = (container: HTMLElement) =>
  container.querySelector('.control') as HTMLElement;

describe.each(wrappers)(
  '$name inside a Control',
  ({ name, render: el, root }) => {
    it('renders no Field in a bare Control, so the widget is its own child', () => {
      const { container } = render(<Control>{el({})}</Control>);
      const control = outerControl(container);
      expect(container.querySelector('.field')).toBeNull();
      expect(container.querySelectorAll('.control')).toHaveLength(1);
      expect(control.firstElementChild).toBe(container.querySelector(root));
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('keeps its own Field for a label in a bare Control, and warns once', () => {
      const tree = (
        <>
          <Control>{el({ label: 'Name' })}</Control>
          <Control>{el({ label: 'Other' })}</Control>
        </>
      );
      const { container, rerender } = render(tree);
      rerender(tree);

      const control = outerControl(container);
      const field = control.firstElementChild as HTMLElement;
      expect(field).toHaveClass('field');
      expect(field.querySelector('label.label')).toHaveTextContent('Name');
      expect(field.querySelector(root)).not.toBeNull();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0][0] as string;
      expect(message).toContain(`<${name} label> inside a <Control>`);
      expect(message).toContain('Wrap the <Control> in a <Field>');
      expect(message).toContain('give the label to that <Field>');
    });

    it('keeps its own Field for a message in a bare Control, and warns once', () => {
      const { container } = render(
        <Control>{el({ message: 'Help text' })}</Control>
      );
      const control = outerControl(container);
      const field = control.firstElementChild as HTMLElement;
      expect(field).toHaveClass('field');
      expect(field.querySelector('p.help')).toHaveTextContent('Help text');

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0][0] as string;
      expect(message).toContain(`<${name} message> inside a <Control>`);
      expect(message).toContain('Wrap the <Control> in a <Field>');
      expect(message).not.toContain('give the label');
    });

    it('changes nothing inside a Field and Control, and does not warn', () => {
      const { container } = render(
        <Field label="Outer">
          <Control>{el({ label: 'Dropped', message: 'Help text' })}</Control>
        </Field>
      );
      const control = outerControl(container);
      expect(container.querySelectorAll('.field')).toHaveLength(1);
      expect(control.querySelector('.field')).toBeNull();
      expect(control.firstElementChild).toBe(container.querySelector(root));
      expect(screen.queryByText('Dropped')).toBeNull();
      expect(screen.getByText('Help text')).toHaveClass('help');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('wraps itself in a Field and Control on its own, and does not warn', () => {
      const { container } = render(el({ label: 'Name', message: 'Help text' }));
      const field = container.firstElementChild as HTMLElement;
      expect(field).toHaveClass('field');
      expect(field.querySelector('label.label')).toHaveTextContent('Name');
      expect(field.querySelector('.control')).not.toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  }
);

describe('the bare-Control warning', () => {
  it('names a label and a message together in one warning', () => {
    render(
      <Control>
        <Input label="Name" message="Help text" />
      </Control>
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toContain('<Input label message> inside a <Control>');
    expect(message).toContain('to hold the label and message');
  });

  it('keeps the label wired to the input in a bare Control', () => {
    render(
      <Control>
        <Input label="Name" />
      </Control>
    );
    expect(screen.getByLabelText('Name')).toHaveClass('input');
  });

  it('generates no id on an unlabeled input in a bare Control', () => {
    render(
      <Control>
        <Input data-testid="input" />
      </Control>
    );
    expect(screen.getByTestId('input')).not.toHaveAttribute('id');
  });

  it('is silent in production, and still renders the Field', () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const { container } = render(
        <Control>
          <Input label="Name" />
        </Control>
      );
      expect(outerControl(container).firstElementChild).toHaveClass('field');
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
