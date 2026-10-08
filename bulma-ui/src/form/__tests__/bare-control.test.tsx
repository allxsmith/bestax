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
import type { ControlLevelProps } from '../FormContext';

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

// Every Control rendered, recorded the same way, so the tests below can read
// which props each wrapper hands its own Control.
const mockControlProps: object[] = [];
jest.mock('../Control', () => {
  const actual = jest.requireActual<typeof import('../Control')>('../Control');
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const Control = (props: React.ComponentProps<typeof actual.Control>) => {
    mockControlProps.push(props);
    return createElement(actual.Control, props);
  };
  return { __esModule: true, ...actual, Control, default: Control };
});

// #905: a convenience wrapper inside a Control with no Field around it used
// to render a Field of its own there, a .field inside the .control, so
// Bulma's sibling rules (`.input ~ .icon`) no longer reached the icons and
// the field margin landed inside the control. It now renders no Field
// unless a prop that shapes the Field's markup needs one, and warns when one
// does, so nothing but the broken case changes its output.

interface Wrapper {
  name: string;
  render: (props: FormFieldProps & ControlLevelProps) => React.ReactElement;
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
    // Its own `iconLeft` is narrower than the Control's, and the tests that
    // pass Control-level props skip it, since it renders no Control.
    render: p => <FileInput {...(p as FormFieldProps)} />,
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

// #921: inside a Control, a wrapper renders no Control of its own, so the
// props it would have handed that Control do nothing there. It now warns in
// development, naming them, and renders exactly what it rendered before.

/**
 * A value for every Control-level prop, each one that would show on a
 * Control. `Required` makes a new `ControlLevelProps` member a type error
 * here until it is given one, so the tests below cover it.
 */
const everyControlProp = {
  isLoading: true,
  iconLeft: <span className="custom-left">L</span>,
  iconLeftName: 'user',
  iconLeftSize: 'small',
  iconRight: <span className="custom-right">R</span>,
  iconRightName: 'check',
  iconRightSize: 'small',
  hasIconsLeft: true,
  hasIconsRight: true,
  isExpanded: true,
  controlSize: 'large',
  controlClassName: 'custom-control',
} satisfies Required<ControlLevelProps>;

const controlLevelProps = Object.keys(everyControlProp) as Array<
  keyof ControlLevelProps
>;

/**
 * Every Control-level prop given a value of its own, so a value a Control
 * receives names the prop it came from. Strings, because every Control prop
 * renders one without complaint.
 */
const traced = Object.fromEntries(
  controlLevelProps.map(prop => [prop, `traced-${prop}`])
) as ControlLevelProps;
const tracedProp = new Map<unknown, keyof ControlLevelProps>(
  controlLevelProps.map(prop => [traced[prop], prop])
);

/** What a wrapper hands its own Control when given every traced value. */
const handedToControl = (el: Wrapper['render']) => {
  mockControlProps.length = 0;
  const { unmount } = render(el(traced));
  unmount();
  return mockControlProps
    .flatMap(props => Object.entries(props))
    .filter(([key]) => key !== 'children');
};

/**
 * Each Control-level prop that reaches a wrapper's own Control, with the
 * Control prop it arrives as.
 */
const reachesControl = (el: Wrapper['render']) => {
  const reached = new Map<keyof ControlLevelProps, string>();
  for (const [key, value] of handedToControl(el)) {
    const prop = tracedProp.get(value);
    if (prop) reached.set(prop, key);
  }
  return reached;
};

/** The Control-level warnings logged so far. */
const controlWarnings = () =>
  warnSpy.mock.calls
    .map(([message]) => message as string)
    .filter(message => message.includes('renders no <Control> of its own'));

/** The props a Control-level warning names, and what it says to set. */
const parseControlWarning = (message: string) => {
  const named = /<\w+ ([^>]+)> inside a <Control>/.exec(message)?.[1] ?? '';
  const toSet = /Set (.+) on that <Control> instead\./.exec(message)?.[1] ?? '';
  return {
    named: named.split(' ').sort(),
    toSet: toSet.split(/, | and /).sort(),
  };
};

const ownsControl = wrappers.filter(({ ownControl = true }) => ownControl);

describe.each(ownsControl)(
  '$name Control-level props',
  ({ name, render: el }) => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      // Every wrapper is given every Control-level prop here, and one that
      // does not take a prop passes it on to the DOM, where React logs it as
      // an unknown attribute. That noise is expected.
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('hands its Control only props that come from a Control-level prop', () => {
      const untraced = handedToControl(el)
        .filter(([, value]) => !tracedProp.has(value))
        .map(([key]) => key);
      expect(untraced).toEqual([]);
    });

    it('warns inside a Control for exactly the props that reach its own', () => {
      const reached = reachesControl(el);
      render(<Control>{el(traced)}</Control>);
      const warnings = controlWarnings();
      expect(warnings).toHaveLength(reached.size > 0 ? 1 : 0);
      if (reached.size === 0) return;

      const { named, toSet } = parseControlWarning(warnings[0]);
      expect(warnings[0]).toContain(`<${name} `);
      expect(named).toEqual([...reached.keys()].sort());
      expect(toSet).toEqual(
        [...reached]
          .map(([prop, key]) => (key === prop ? prop : `${key} (for ${prop})`))
          .sort()
      );
    });

    it('renders the same inside a Control with or without those props', () => {
      const given = Object.fromEntries(
        [...reachesControl(el).keys()].map(prop => [
          prop,
          everyControlProp[prop],
        ])
      ) as ControlLevelProps;
      const { container: without } = render(<Control>{el({})}</Control>);
      const { container } = render(<Control>{el(given)}</Control>);
      expect(withoutIds(container.innerHTML)).toBe(
        withoutIds(without.innerHTML)
      );
    });

    it('warns once per set of props, however often it renders', () => {
      const reached = [...reachesControl(el).keys()];
      const tree = (
        <>
          <Control>{el(everyControlProp)}</Control>
          <Control>{el(everyControlProp)}</Control>
          {reached.map(prop => (
            <Control key={prop}>
              {el({ [prop]: everyControlProp[prop] })}
            </Control>
          ))}
        </>
      );
      const { rerender } = render(tree);
      rerender(tree);

      // One for the whole set, and one for each prop given alone, which is
      // the same set when the wrapper takes a single prop.
      const warnings = controlWarnings();
      expect(warnings).toHaveLength(
        reached.length > 1 ? reached.length + 1 : reached.length
      );
      expect(new Set(warnings).size).toBe(warnings.length);
    });

    it('stays quiet outside a Control', () => {
      render(el(everyControlProp));
      expect(warnSpy).not.toHaveBeenCalled();
    });

    // A left icon size or column shows nothing on a Control with no glyph.
    // The glyph a wrapper's own Control draws by default is read from the
    // recording, so a wrapper that gains one fails here until the advice
    // names it.
    it.each([
      { prop: 'iconLeftSize', given: { iconLeftSize: 'small' } },
      { prop: 'hasIconsLeft', given: { hasIconsLeft: true } },
    ] satisfies Array<{
      prop: string;
      given: Pick<ControlLevelProps, 'iconLeftSize' | 'hasIconsLeft'>;
    }>)(
      'advises a Control that draws what its own did for $prop',
      ({ prop, given }) => {
        const reached = reachesControl(el).has(prop as keyof ControlLevelProps);
        mockControlProps.length = 0;
        const { container: own } = render(el(given));
        const glyph = (mockControlProps[0] as ControlLevelProps | undefined)
          ?.iconLeftName;
        render(<Control>{el(given)}</Control>);
        const warnings = controlWarnings();
        expect(warnings).toHaveLength(reached ? 1 : 0);
        if (!reached) return;

        expect(warnings[0]).toContain(
          glyph
            ? `Set ${prop} and iconLeftName="${glyph}" (its default icon) on`
            : `Set ${prop} on`
        );
        const { container: advised } = render(
          <Control {...given} iconLeftName={glyph}>
            {el({})}
          </Control>
        );
        expect(withoutIds(outerControl(advised).outerHTML)).toBe(
          withoutIds(outerControl(own).outerHTML)
        );
      }
    );
  }
);

type PickerProps = ControlLevelProps & { inline?: boolean };

const pickers = [
  {
    name: 'DateInput',
    render: (p: PickerProps) => <DateInput {...p} />,
    defaultIcon: 'calendar',
  },
  {
    name: 'TimeInput',
    render: (p: PickerProps) => <TimeInput {...p} />,
    defaultIcon: 'clock',
  },
  {
    name: 'DateTimeInput',
    render: (p: PickerProps) => <DateTimeInput {...p} />,
    defaultIcon: 'calendar-alt',
  },
];

describe('the Control-level warning', () => {
  it.each([
    { name: 'Input', render: (p: ControlLevelProps) => <Input {...p} /> },
    ...pickers,
  ])(
    'traces every Control-level prop from $name to its Control',
    ({ render: el }) => {
      expect([...reachesControl(el).keys()].sort()).toEqual(
        [...controlLevelProps].sort()
      );
    }
  );

  it('names every Control-level prop passed in one warning', () => {
    render(
      <Control>
        <Input
          isLoading
          iconLeftName="user"
          controlSize="large"
          controlClassName="custom-control"
        />
      </Control>
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toContain(
      '<Input isLoading iconLeftName controlSize controlClassName> inside a ' +
        '<Control> renders no <Control> of its own, so those props do ' +
        'nothing there.'
    );
    expect(message).toContain(
      'Set isLoading, iconLeftName, size (for controlSize) and className ' +
        '(for controlClassName) on that <Control> instead.'
    );
  });

  it('names a single prop as that prop', () => {
    render(
      <Control>
        <Input isLoading />
      </Control>
    );
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toContain('so that prop does nothing there.');
    expect(message).toContain('Set isLoading on that <Control> instead.');
  });

  it('ignores falsy Control-level props, which a Control ignores too', () => {
    render(
      <Control>
        <Input
          isLoading={false}
          iconLeft={null}
          iconLeftName=""
          hasIconsLeft={false}
          controlClassName=""
        />
      </Control>
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns inside a Control with a Field around it too', () => {
    render(
      <Field label="Name">
        <Control>
          <Input isLoading />
        </Control>
      </Field>
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(controlWarnings()).toHaveLength(1);
  });

  it.each(pickers)(
    "never warns for $name's own default icon, only for one passed",
    ({ name, render: el, defaultIcon }) => {
      render(<Control>{el({})}</Control>);
      expect(warnSpy).not.toHaveBeenCalled();

      render(<Control>{el({ iconLeftName: defaultIcon })}</Control>);
      expect(controlWarnings()).toEqual([
        expect.stringContaining(`<${name} iconLeftName> inside a <Control>`),
      ]);
    }
  );

  // A left icon size or column shows nothing on a Control with no glyph, and
  // a picker's own Control supplies one. Advice to move those props alone
  // would leave the caller's Control without the icon the picker drew.
  it.each(
    pickers.flatMap(picker =>
      (
        [
          { prop: 'iconLeftSize', given: { iconLeftSize: 'small' } },
          { prop: 'hasIconsLeft', given: { hasIconsLeft: true } },
        ] satisfies Array<{
          prop: string;
          given: Pick<ControlLevelProps, 'iconLeftSize' | 'hasIconsLeft'>;
        }>
      ).map(left => ({ ...picker, ...left }))
    )
  )(
    "names $name's default icon in the advice for $prop, which then draws what its own Control did",
    ({ name, render: el, defaultIcon, prop, given }) => {
      render(<Control>{el(given)}</Control>);
      const message = controlWarnings()[0];
      expect(message).toContain(`<${name} ${prop}> inside a <Control>`);
      expect(message).toContain(
        `Set ${prop} and iconLeftName="${defaultIcon}" (its default icon) ` +
          'on that <Control> instead.'
      );

      const { container: own } = render(el(given));
      const { container: advised } = render(
        <Control {...given} iconLeftName={defaultIcon}>
          {el({})}
        </Control>
      );
      // Standalone, the picker also wraps its Control in a Field of its own.
      expect(withoutIds(outerControl(advised).outerHTML)).toBe(
        withoutIds(outerControl(own).outerHTML)
      );
    }
  );

  it.each(pickers)(
    "leaves $name's default icon out of the advice when the caller chose the icon",
    ({ render: el }) => {
      render(
        <Control>
          {el({ iconLeftSize: 'small', iconLeftName: '' })}
          {el({ iconLeftSize: 'small', iconLeft: <span>L</span> })}
          {el({ isLoading: true, iconRightName: 'check' })}
        </Control>
      );
      const warnings = controlWarnings();
      expect(warnings).toHaveLength(3);
      for (const message of warnings) {
        expect(message).not.toContain('default icon');
      }
    }
  );

  it('names no default icon for a wrapper without one', () => {
    render(
      <Control>
        <Input iconLeftSize="small" hasIconsLeft />
      </Control>
    );
    const message = controlWarnings()[0];
    expect(message).toContain(
      'Set iconLeftSize and hasIconsLeft on that <Control> instead.'
    );
  });

  it.each(pickers)(
    'warns separately for $name sites that hide the icon and that keep the default',
    ({ render: el, defaultIcon }) => {
      // The same props reach the warning either way, since an empty
      // iconLeftName counts as unset, but only one wants the default glyph.
      const hidden = el({ iconLeftSize: 'small', iconLeftName: '' });
      const kept = el({ iconLeftSize: 'small' });
      render(<Control>{hidden}</Control>);
      render(<Control>{kept}</Control>);
      render(<Control>{hidden}</Control>);

      const glyph = `iconLeftName="${defaultIcon}" (its default icon)`;
      const warnings = controlWarnings();
      expect(warnings).toHaveLength(2);
      expect(warnings[0]).not.toContain(glyph);
      expect(warnings[1]).toContain(glyph);
    }
  );

  it.each(pickers)(
    "warns for $name's own isLoading inside a loading Control, where it draws nothing",
    ({ name, render: el }) => {
      const { container: without } = render(
        <Control isLoading>{el({})}</Control>
      );
      const { container } = render(
        <Control isLoading>{el({ isLoading: true })}</Control>
      );
      expect(withoutIds(container.innerHTML)).toBe(
        withoutIds(without.innerHTML)
      );
      expect(controlWarnings()).toEqual([
        expect.stringContaining(`<${name} isLoading> inside a <Control>`),
      ]);
    }
  );

  // An inline picker renders no Control inside a Control or outside one, so
  // it drops its Control-level props in both places, and says so the same
  // way in both rather than pointing at a Control.
  it.each(pickers)(
    'warns once for an inline $name given Control-level props, inside a Control or not',
    ({ name, render: el }) => {
      const given = { inline: true, isLoading: true, controlSize: 'large' };
      const { container: plain } = render(el({ inline: true }));
      const { container } = render(el(given as PickerProps));
      expect(withoutIds(container.innerHTML)).toBe(withoutIds(plain.innerHTML));
      render(<Control>{el(given as PickerProps)}</Control>);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0][0] as string;
      expect(message).toContain(
        `<${name} inline isLoading controlSize> renders no <Control> in ` +
          'inline mode, inside a <Control> or not, so those props do nothing.'
      );
      expect(message).toContain('Leave them out of an inline picker.');
    }
  );

  it.each(pickers)(
    "never warns for an inline $name's own default icon, only for one passed",
    ({ name, render: el, defaultIcon }) => {
      render(el({ inline: true }));
      render(<Control>{el({ inline: true })}</Control>);
      expect(warnSpy).not.toHaveBeenCalled();

      render(el({ inline: true, iconLeftName: defaultIcon }));
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0][0] as string;
      expect(message).toContain(`<${name} inline iconLeftName> renders no`);
      expect(message).toContain('so that prop does nothing.');
      expect(message).toContain('Leave it out of an inline picker.');
    }
  );

  it("does not warn for a Select's isLoading, which its select draws", () => {
    const { container } = render(
      <Control>
        <Select isLoading>
          <option>One</option>
        </Select>
      </Control>
    );
    expect(container.querySelector('.select')).toHaveClass('is-loading');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('is silent in production, and renders the same', () => {
    const tree = (
      <Control>
        <Input isLoading iconLeftName="user" />
      </Control>
    );
    const { container: dev } = render(tree);
    warnSpy.mockClear();
    resetDevWarnings();

    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const { container } = render(tree);
      expect(withoutIds(container.innerHTML)).toBe(withoutIds(dev.innerHTML));
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
