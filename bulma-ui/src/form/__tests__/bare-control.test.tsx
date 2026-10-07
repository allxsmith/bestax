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
import { File as FileInput } from '../File';
import { Taginput } from '../Taginput';
import { resetDevWarnings } from '../../helpers/devWarnings';
import type { FormFieldProps } from '../fieldProps';

// Every Field the wrappers render, recorded so the tests below can read which
// props each wrapper hands its Field. The recording renders the real Field.
const mockFieldProps: object[] = [];
jest.mock('../Field', () => {
  const actual = jest.requireActual<typeof import('../Field')>('../Field');
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const Recording = (props: React.ComponentProps<typeof actual.Field>) => {
    mockFieldProps.push(props);
    return createElement(actual.Field, props);
  };
  const Field = Object.assign(Recording, actual.Field);
  return { __esModule: true, ...actual, Field, default: Field };
});

// #905: a convenience wrapper inside a Control with no Field around it used
// to render a Field of its own there, a .field inside the .control, so
// Bulma's sibling rules (`.input ~ .icon`) no longer reached the icons and
// the field margin landed inside the control. It now renders no Field
// unless a prop that shapes the Field's markup needs one, and warns when one
// does, so nothing but the broken case changes its output.

interface Wrapper {
  name: string;
  render: (props: FormFieldProps) => React.ReactElement;
  /** The widget's own root element, which belongs directly in the Control. */
  root: string;
  /** False for a widget that never renders a Control of its own. */
  ownControl?: boolean;
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
  {
    name: 'File',
    render: p => <FileInput {...p} />,
    root: '.file',
    ownControl: false,
  },
  {
    name: 'Taginput',
    render: p => <Taginput {...p} />,
    root: '.taginput',
    ownControl: false,
  },
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

/** Markup with React's generated ids (18 and 19 spellings) made comparable. */
const withoutIds = (html: string) =>
  html.replace(/_r_[0-9a-z]+_|:r[0-9a-z]+:/g, 'ID');

/**
 * A value for every Field-level prop, each one that would show if it reached
 * the markup. `Required` makes a new `FormFieldProps` member a type error
 * here until it is given one, so the tests below cover it.
 */
const everyFieldProp = {
  label: 'Name',
  labelSize: 'large',
  labelProps: { className: 'custom-label', id: 'custom-label', htmlFor: 'x' },
  horizontal: true,
  message: 'Help text',
  messageColor: 'danger',
  fieldClassName: 'custom-field',
} satisfies Required<FormFieldProps>;

/**
 * The props that change nothing in the Field's markup unless a label or
 * message renders, which is why they alone keep no Field.
 */
const inertWithoutLabel: FormFieldProps = {
  labelSize: everyFieldProp.labelSize,
  labelProps: everyFieldProp.labelProps,
  messageColor: everyFieldProp.messageColor,
};

/** The wrapper prop behind each prop a wrapper hands its Field. */
const fieldPropSource = new Map<string, keyof FormFieldProps>([
  ['label', 'label'],
  ['labelSize', 'labelSize'],
  ['labelProps', 'labelProps'],
  ['horizontal', 'horizontal'],
  ['className', 'fieldClassName'],
]);

describe.each(wrappers)(
  '$name inside a Control',
  ({ name, render: el, root, ownControl = true }) => {
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
      expect(message).toContain('set label on that <Field>');
    });

    it.each([
      {
        prop: 'horizontal',
        props: { horizontal: true },
        fieldClass: 'is-horizontal',
        onField: 'horizontal',
      },
      {
        prop: 'fieldClassName',
        props: { fieldClassName: 'custom-field' },
        fieldClass: 'custom-field',
        onField: 'className (for fieldClassName)',
      },
    ])(
      'keeps its own Field for $prop in a bare Control, and warns once',
      ({ prop, props, fieldClass, onField }) => {
        const tree = (
          <>
            <Control>{el(props)}</Control>
            <Control>{el(props)}</Control>
          </>
        );
        const { container, rerender } = render(tree);
        rerender(tree);

        const control = outerControl(container);
        const field = control.firstElementChild as HTMLElement;
        expect(field).toHaveClass('field', fieldClass);
        expect(field.querySelector(root)).not.toBeNull();

        expect(warnSpy).toHaveBeenCalledTimes(1);
        const message = warnSpy.mock.calls[0][0] as string;
        expect(message).toContain(`<${name} ${prop}> inside a <Control>`);
        expect(message).toContain('for that prop');
        expect(message).toContain(`set ${onField} on that <Field>`);
      }
    );

    it('keeps no Field for labelSize, labelProps or messageColor alone', () => {
      // Standalone, they leave the Field's markup exactly as it is without
      // them, so in a bare Control a Field for them would be the broken case.
      const { container: bare } = render(el({}));
      const { container: given } = render(el(inertWithoutLabel));
      expect(withoutIds(given.innerHTML)).toBe(withoutIds(bare.innerHTML));

      const { container } = render(<Control>{el(inertWithoutLabel)}</Control>);
      const control = outerControl(container);
      expect(control.querySelector('.field')).toBeNull();
      expect(control.firstElementChild).toBe(control.querySelector(root));
      expect(warnSpy).not.toHaveBeenCalled();
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
      expect(message).toContain('Wrap the <Control> in a <Field> instead.');
      expect(message).not.toContain('on that <Field>');
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

    it('wraps itself in a Field on its own, and does not warn', () => {
      const { container } = render(el({ label: 'Name', message: 'Help text' }));
      const field = container.firstElementChild as HTMLElement;
      expect(field).toHaveClass('field');
      expect(field.querySelector('label.label')).toHaveTextContent('Name');
      if (ownControl) {
        expect(field.querySelector(`.control > ${root}`)).not.toBeNull();
      } else {
        expect(field.querySelector(`:scope > ${root}`)).not.toBeNull();
      }
      expect(warnSpy).not.toHaveBeenCalled();
    });
  }
);

// rendersOwnField keeps a hand-written list of the props that keep a Field in
// a bare Control. These hold that list to what the wrappers actually do: each
// wrapper hands its Field only props that come from a FormFieldProps member,
// every member is tried, and in a bare Control the Field stays for exactly
// the members that change the wrapper's markup when set alone.
describe.each(wrappers)('$name Field props', ({ render: el }) => {
  it('hands its Field only props that come from a Field-level prop', () => {
    mockFieldProps.length = 0;
    render(el(everyFieldProp));
    const handed = new Set(mockFieldProps.flatMap(props => Object.keys(props)));
    handed.delete('children');
    expect(handed.size).toBeGreaterThan(0);
    expect([...handed].filter(key => !fieldPropSource.has(key))).toEqual([]);
  });

  it('keeps a Field in a bare Control for exactly the props that change its markup', () => {
    const markup = (props: FormFieldProps) => {
      const { container, unmount } = render(el(props));
      const html = withoutIds(container.innerHTML);
      unmount();
      return html;
    };
    const keepsField = (props: FormFieldProps) => {
      const { container, unmount } = render(<Control>{el(props)}</Control>);
      const kept = outerControl(container).querySelector('.field') !== null;
      unmount();
      return kept;
    };
    const plain = markup({});
    const alone = Object.entries(everyFieldProp).map(
      ([prop, value]) => [prop, { [prop]: value } as FormFieldProps] as const
    );
    const changesMarkup = alone
      .filter(([, props]) => markup(props) !== plain)
      .map(([prop]) => prop);
    const keepsItsField = alone
      .filter(([, props]) => keepsField(props))
      .map(([prop]) => prop);
    expect(keepsItsField).toEqual(changesMarkup);
  });
});

describe('the bare-Control warning', () => {
  it('names every Field-shaping prop passed in one warning', () => {
    render(
      <Control>
        <Input
          label="Name"
          message="Help text"
          horizontal
          fieldClassName="custom-field"
        />
      </Control>
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toContain(
      '<Input label message horizontal fieldClassName> inside a <Control>'
    );
    expect(message).toContain('for those props');
    expect(message).toContain(
      'set label, horizontal and className (for fieldClassName) on that <Field>.'
    );
  });

  it('names two props moving to the Field without a list comma', () => {
    render(
      <Control>
        <Input label="Name" horizontal />
      </Control>
    );
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toContain('set label and horizontal on that <Field>.');
  });

  it('keeps no Field for falsy Field-shaping props', () => {
    const { container } = render(
      <Control>
        <Input label="" message={null} horizontal={false} fieldClassName="" />
      </Control>
    );
    expect(container.querySelector('.field')).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
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
