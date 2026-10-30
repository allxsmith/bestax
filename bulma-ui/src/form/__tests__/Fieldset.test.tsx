import React, { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Fieldset } from '../Fieldset';
import { Field } from '../Field';
import { Control } from '../Control';
import { Input } from '../Input';
import { InputBase } from '../InputBase';
import { SelectBase } from '../SelectBase';
import { TextAreaBase } from '../TextAreaBase';
import { Checkbox } from '../Checkbox';
import { Checkboxes } from '../Checkboxes';
import { Radio } from '../Radio';
import { CheckboxCard } from '../CheckboxCard';
import { RadioCard } from '../RadioCard';
import { Switch } from '../Switch';
import { Slider } from '../Slider';
import { Numberinput } from '../Numberinput';
import { PinInput } from '../PinInput';
import { Rate } from '../Rate';
import { Taginput } from '../Taginput';
import { Dropzone } from '../Dropzone';
import { Autocomplete } from '../Autocomplete';
import { Combobox } from '../Combobox';
import { DateInputBase } from '../DateInputBase';
import { TimeInputBase } from '../TimeInputBase';
import { DateTimeInputBase } from '../DateTimeInputBase';
import { DateRangeInputBase } from '../DateRangeInputBase';
import { ConfigProvider } from '../../helpers/Config';

describe('Fieldset', () => {
  it('renders a native fieldset named by its legend', () => {
    render(
      <Fieldset legend="Shipping address">
        <Input label="Street" />
      </Fieldset>
    );
    const group = screen.getByRole('group', { name: 'Shipping address' });
    expect(group.tagName).toBe('FIELDSET');
    expect(group).toHaveClass('fieldset');
    expect(group.firstElementChild?.tagName).toBe('LEGEND');
    expect(group.firstElementChild).toHaveClass('fieldset-legend');
    expect(screen.getByRole('textbox', { name: 'Street' })).toBeInTheDocument();
  });

  it('renders no legend without one', () => {
    const { container } = render(<Fieldset>Content</Fieldset>);
    expect(container.querySelector('legend')).toBeNull();
    expect(container.querySelector('fieldset')).toHaveTextContent('Content');
  });

  it('puts legendProps on the legend, keeping its class', () => {
    render(
      <Fieldset
        legend="Billing"
        legendProps={{ id: 'billing', className: 'is-size-5' }}
      />
    );
    const legend = screen.getByText('Billing');
    expect(legend).toHaveAttribute('id', 'billing');
    expect(legend).toHaveClass('fieldset-legend', 'is-size-5');
  });

  it.each([
    ['default', []],
    ['filled', ['is-filled']],
    ['unstyled', ['is-unstyled']],
  ] as const)('the %s variant adds %j', (variant, classes) => {
    render(<Fieldset variant={variant} legend="Section" />);
    const group = screen.getByRole('group');
    expect(group.className.split(' ').sort()).toEqual(
      ['fieldset', ...classes].sort()
    );
  });

  it('sets the native disabled attribute', () => {
    render(<Fieldset disabled legend="Off" />);
    expect(screen.getByRole('group')).toBeDisabled();
  });

  it('leaves the attribute off when not disabled', () => {
    render(<Fieldset legend="On" />);
    expect(screen.getByRole('group')).not.toHaveAttribute('disabled');
  });

  describe('message', () => {
    it('renders help text that describes the group', () => {
      render(
        <Fieldset legend="Contact" message="Fill in one of them.">
          <Input label="Phone" />
        </Fieldset>
      );
      const group = screen.getByRole('group', { name: 'Contact' });
      expect(group).toHaveAccessibleDescription('Fill in one of them.');
      const help = screen.getByText('Fill in one of them.');
      expect(help.tagName).toBe('P');
      expect(help).toHaveClass('help');
      expect(help).not.toHaveClass('is-danger');
      // The help comes last, after the content.
      expect(group.lastElementChild).toBe(help);
    });

    it('colors the message', () => {
      render(
        <Fieldset legend="Plan" message="Pick one." messageColor="danger" />
      );
      expect(screen.getByText('Pick one.')).toHaveClass('help', 'is-danger');
    });

    it('keeps an aria-describedby you pass, alongside the message', () => {
      render(
        <>
          <p id="note">Read this first.</p>
          <Fieldset legend="Plan" message="Pick one." aria-describedby="note" />
        </>
      );
      const group = screen.getByRole('group');
      expect(group.getAttribute('aria-describedby')).toMatch(/^note \S+$/);
      expect(group).toHaveAccessibleDescription('Read this first. Pick one.');
    });

    it('keeps your aria-describedby as it is with no message', () => {
      render(<Fieldset legend="Plan" aria-describedby="note" />);
      expect(screen.getByRole('group')).toHaveAttribute(
        'aria-describedby',
        'note'
      );
    });

    it('sets no aria-describedby, and no aria-invalid, without a message', () => {
      render(<Fieldset legend="Plan" messageColor="danger" />);
      const group = screen.getByRole('group');
      expect(group).not.toHaveAttribute('aria-describedby');
      expect(group).not.toHaveAttribute('aria-invalid');
    });

    it('marks nothing invalid with a danger message', () => {
      render(
        <Fieldset legend="Plan" message="Required." messageColor="danger">
          <Input label="Name" />
        </Fieldset>
      );
      expect(screen.getByRole('group')).not.toHaveAttribute('aria-invalid');
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    });
  });

  it('forwards its ref to the fieldset', () => {
    const ref = createRef<HTMLFieldSetElement>();
    render(<Fieldset ref={ref} legend="Ref" />);
    expect(ref.current).toBeInstanceOf(HTMLFieldSetElement);
  });

  it('passes attributes and helper props to the fieldset', () => {
    render(
      <Fieldset
        legend="Helpers"
        name="shipping"
        data-testid="fs"
        m="3"
        textColor="primary"
        bgColor="light"
        className="custom"
      />
    );
    const group = screen.getByTestId('fs');
    expect(group).toHaveAttribute('name', 'shipping');
    expect(group).toHaveClass(
      'fieldset',
      'm-3',
      'has-text-primary',
      'has-background-light',
      'custom'
    );
  });

  it('applies classPrefix from ConfigProvider', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <Fieldset
          legend="Prefixed"
          variant="filled"
          message="Help"
          messageColor="info"
        />
      </ConfigProvider>
    );
    const group = container.querySelector('fieldset');
    expect(group).toHaveClass('bestax-fieldset', 'bestax-is-filled');
    expect(group).not.toHaveClass('fieldset');
    expect(container.querySelector('legend')).toHaveClass(
      'bestax-fieldset-legend'
    );
    expect(screen.getByText('Help')).toHaveClass(
      'bestax-help',
      'bestax-is-info'
    );
  });

  it('renders the same on the server', () => {
    const html = renderToStaticMarkup(
      <Fieldset legend="Server" message="Help" disabled>
        <Input label="Name" />
      </Fieldset>
    );
    expect(html).toMatch(/^<fieldset class="fieldset" disabled=""/);
    expect(html).toContain('<legend class="fieldset-legend">Server</legend>');
    expect(html).toMatch(/aria-describedby="[^"]+-message"/);
  });

  describe('Field scope', () => {
    it('lets the convenience inputs inside render their own Field', () => {
      const { container } = render(
        <Field label="Outer">
          <Fieldset legend="Section">
            <Input label="Inner" />
          </Fieldset>
        </Field>
      );
      const fieldset = container.querySelector('fieldset')!;
      expect(fieldset.querySelector('.field > label.label')).toHaveTextContent(
        'Inner'
      );
      expect(
        screen.getByRole('textbox', { name: 'Inner' })
      ).toBeInTheDocument();
    });

    it("gives no input inside a labeled outer Field's id", () => {
      render(
        <Field label="Outer">
          <Fieldset legend="Section">
            <InputBase aria-label="Bare" />
          </Fieldset>
        </Field>
      );
      const outer = screen.getByText('Outer');
      expect(screen.getByRole('textbox')).not.toHaveAttribute('id');
      // Nothing took the label's `for`, so it drops it once mounted.
      expect(outer).not.toHaveAttribute('for');
    });

    it("points no group inside at a labeled outer Field's label", () => {
      render(
        <Field label="Outer">
          <Fieldset legend="Section">
            <Checkboxes>
              <Checkbox>One</Checkbox>
            </Checkboxes>
          </Fieldset>
        </Field>
      );
      const groups = screen.getAllByRole('group');
      const checkboxes = groups.find(g => g.tagName === 'DIV')!;
      expect(checkboxes).not.toHaveAttribute('aria-labelledby');
    });

    it('lets inputs inside a Control around it render their own Control', () => {
      const { container } = render(
        <Field>
          <Control>
            <Fieldset legend="Section">
              <Input aria-label="Inner" />
            </Fieldset>
          </Control>
        </Field>
      );
      const fieldset = container.querySelector('fieldset')!;
      expect(fieldset.querySelector('.field .control input')).not.toBeNull();
    });
  });
});

describe('Fieldset disabled', () => {
  const cases: Array<[string, React.ReactElement, (c: HTMLElement) => void]> = [
    [
      'InputBase',
      <InputBase key="i" aria-label="x" />,
      c => expect(c.querySelector('input')).toHaveAttribute('disabled'),
    ],
    [
      'SelectBase',
      <SelectBase key="s" aria-label="x">
        <option>a</option>
      </SelectBase>,
      c => expect(c.querySelector('select')).toHaveAttribute('disabled'),
    ],
    [
      'TextAreaBase',
      <TextAreaBase key="t" aria-label="x" />,
      c => expect(c.querySelector('textarea')).toHaveAttribute('disabled'),
    ],
    [
      'Checkbox',
      <Checkbox key="c">x</Checkbox>,
      c => expect(c.querySelector('input')).toHaveAttribute('disabled'),
    ],
    [
      'Radio',
      <Radio key="r" value="a">
        x
      </Radio>,
      c => expect(c.querySelector('input')).toHaveAttribute('disabled'),
    ],
    [
      'CheckboxCard',
      <CheckboxCard key="cc" title="x" />,
      c => expect(c.querySelector('input')).toHaveAttribute('disabled'),
    ],
    [
      'RadioCard',
      <RadioCard key="rc" title="x" value="a" />,
      c => expect(c.querySelector('input')).toHaveAttribute('disabled'),
    ],
    [
      'Switch',
      <Switch key="w">x</Switch>,
      c => expect(c.querySelector('input')).toHaveAttribute('disabled'),
    ],
    [
      'Slider',
      <Slider key="sl" aria-label="x" />,
      c => {
        expect(c.querySelector('.slider')).toHaveClass('is-disabled');
        expect(c.querySelector('input')).toHaveAttribute('disabled');
      },
    ],
    [
      'Numberinput',
      <Numberinput key="n" aria-label="x" />,
      c => expect(c.querySelector('.numberinput')).toHaveClass('is-disabled'),
    ],
    [
      'PinInput',
      <PinInput key="p" length={2} aria-label="x" />,
      c => {
        expect(c.querySelector('.pin-input-box')).toHaveClass('is-disabled');
        expect(c.querySelector('input')).toHaveAttribute('disabled');
      },
    ],
    [
      'Rate',
      <Rate key="ra" aria-label="x" />,
      c => {
        const rate = c.querySelector('.rate')!;
        expect(rate).toHaveClass('is-disabled');
        expect(c.querySelector('[role="radiogroup"]')).toHaveAttribute(
          'tabindex',
          '-1'
        );
      },
    ],
    [
      'Taginput',
      <Taginput key="ta" defaultValue={['a']} />,
      c => {
        expect(c.querySelector('.taginput')).toHaveClass('is-disabled');
        // A disabled Taginput shows no remove buttons on its tags.
        expect(c.querySelector('.delete')).toBeNull();
      },
    ],
    [
      'Dropzone',
      <Dropzone
        key="dz"
        aria-label="x"
        files={[new File(['%PDF'], 'a.pdf', { type: 'application/pdf' })]}
      />,
      c => {
        expect(c.querySelector('.dropzone')).toHaveClass('is-disabled');
        expect(c.querySelector('input')).toHaveAttribute('disabled');
        // Nor does a disabled Dropzone on its files.
        expect(c.querySelector('.delete')).toBeNull();
      },
    ],
    [
      'Autocomplete',
      <Autocomplete key="a" aria-label="x" data={['a']} />,
      c => expect(c.querySelector('input')).toHaveAttribute('disabled'),
    ],
    [
      'Combobox',
      <Combobox key="co" aria-label="x" data={['a']} />,
      c =>
        expect(c.querySelector('input[role="combobox"]')).toHaveAttribute(
          'disabled'
        ),
    ],
    [
      'DateInputBase',
      <DateInputBase key="d" aria-label="x" />,
      c => {
        expect(c.querySelector('input')).toHaveAttribute('disabled');
        expect(c.querySelector('button')).toHaveAttribute('disabled');
      },
    ],
    [
      'TimeInputBase',
      <TimeInputBase key="ti" aria-label="x" />,
      c => expect(c.querySelector('input')).toHaveAttribute('disabled'),
    ],
    [
      'TimeInputBase inline',
      <TimeInputBase key="tw" aria-label="x" inline />,
      c => {
        expect(c.querySelector('.timeinput')).toHaveClass('is-disabled');
        for (const wheel of c.querySelectorAll('[role="spinbutton"]')) {
          expect(wheel).toHaveAttribute('tabindex', '-1');
        }
      },
    ],
    [
      'DateTimeInputBase',
      <DateTimeInputBase key="dt" aria-label="x" />,
      c => expect(c.querySelector('input')).toHaveAttribute('disabled'),
    ],
    [
      'DateRangeInputBase',
      <DateRangeInputBase key="dr" aria-label="x" />,
      c => {
        expect(c.querySelector('.daterangeinput-field')).toHaveClass(
          'is-disabled'
        );
        for (const input of c.querySelectorAll('input')) {
          expect(input).toHaveAttribute('disabled');
        }
      },
    ],
  ];

  it.each(cases)('disables %s inside it', (_name, element, check) => {
    const { container } = render(<Fieldset disabled>{element}</Fieldset>);
    check(container.querySelector('fieldset')!);
  });

  it('leaves the inputs alone outside a disabled Fieldset', () => {
    const { container } = render(
      <>
        <Fieldset>
          <Rate aria-label="Inside" />
        </Fieldset>
        <Rate aria-label="Outside" />
      </>
    );
    for (const rate of container.querySelectorAll('[role="radiogroup"]')) {
      expect(rate).toHaveAttribute('tabindex', '0');
    }
    expect(container.querySelector('.is-disabled')).toBeNull();
  });

  it("lets an input's own disabled win", () => {
    render(
      <Fieldset disabled>
        <Rate aria-label="Own" disabled={false} />
      </Fieldset>
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute('tabindex', '0');
  });

  it('leaves the cards alone outside a disabled Fieldset', () => {
    render(
      <>
        <Fieldset>
          <CheckboxCard title="Inside" />
        </Fieldset>
        <RadioCard title="Outside" value="a" />
      </>
    );
    expect(
      screen.getByRole('checkbox', { name: 'Inside' })
    ).not.toHaveAttribute('disabled');
    expect(screen.getByRole('radio', { name: 'Outside' })).not.toHaveAttribute(
      'disabled'
    );
  });

  it("lets a card's own disabled win", () => {
    render(
      <Fieldset disabled>
        <CheckboxCard title="Own" disabled={false} />
        <RadioCard title="Own radio" value="a" disabled={false} />
      </Fieldset>
    );
    // The attribute is off, though the browser still disables the input
    // through the fieldset.
    expect(screen.getByRole('checkbox', { name: 'Own' })).not.toHaveAttribute(
      'disabled'
    );
    expect(
      screen.getByRole('radio', { name: 'Own radio' })
    ).not.toHaveAttribute('disabled');
  });

  it('leaves the controls in its legend enabled', () => {
    render(
      <Fieldset disabled legend={<Checkbox>Use another address</Checkbox>}>
        <Checkbox>Inside</Checkbox>
      </Fieldset>
    );
    expect(
      screen.getByRole('checkbox', { name: 'Use another address' })
    ).not.toHaveAttribute('disabled');
    expect(screen.getByRole('checkbox', { name: 'Inside' })).toHaveAttribute(
      'disabled'
    );
  });

  it('disables what is inside a Fieldset that sits in a disabled one', () => {
    render(
      <Fieldset disabled legend="Outer">
        <Fieldset legend={<Checkbox>Inner legend</Checkbox>}>
          <Rate aria-label="Nested" />
        </Fieldset>
      </Fieldset>
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute('tabindex', '-1');
    // The inner legend is outside the outer one's legend, so it's disabled.
    expect(
      screen.getByRole('checkbox', { name: 'Inner legend' })
    ).toHaveAttribute('disabled');
  });
});
