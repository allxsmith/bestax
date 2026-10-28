// `as="fieldset"` on Checkboxes and Radios: the group as a native fieldset,
// named by its legend. Both groups take it the same way, so each case runs
// on both; the default markup is held by each component's own tests.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Checkboxes } from '../Checkboxes';
import { Checkbox } from '../Checkbox';
import { Radios } from '../Radios';
import { Radio } from '../Radio';
import { Field } from '../Field';
import { Control } from '../Control';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';

type GroupProps = React.ComponentProps<typeof Checkboxes> &
  Omit<React.ComponentProps<typeof Radios>, 'children'>;

const groups = [
  {
    name: 'Checkboxes',
    role: 'group',
    box: 'checkboxes',
    render: (props: Partial<GroupProps>) => (
      <Checkboxes name="chores" {...(props as object)}>
        <Checkbox value="bed">Make the bed</Checkbox>
        <Checkbox value="teeth">Brush teeth</Checkbox>
      </Checkboxes>
    ),
  },
  {
    name: 'Radios',
    role: 'radiogroup',
    box: 'radios',
    render: (props: Partial<GroupProps>) => (
      <Radios name="rsvp" {...(props as object)}>
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
      </Radios>
    ),
  },
] as const;

describe.each(groups)('$name as="fieldset"', ({ role, box, render: group }) => {
  it('is a fieldset Field named by its legend', () => {
    const { container } = render(
      group({ as: 'fieldset', label: 'Pick some', message: 'Any of them.' })
    );
    const fieldset = screen.getByRole(role, { name: 'Pick some' });
    expect(fieldset.tagName).toBe('FIELDSET');
    expect(fieldset).toHaveClass('field');
    expect(fieldset).not.toHaveAttribute('aria-labelledby');
    // The legend comes first, with Bulma's label look and no `for`.
    const legend = fieldset.firstElementChild!;
    expect(legend.tagName).toBe('LEGEND');
    expect(legend).toHaveClass('label');
    expect(legend).toHaveTextContent('Pick some');
    // Then the Control holding the box of choices, then the help.
    const boxEl = fieldset.querySelector(`.control > .${box}`)!;
    expect(boxEl.tagName).toBe('DIV');
    expect(boxEl).not.toHaveAttribute('role');
    expect(fieldset.lastElementChild).toHaveClass('help');
    expect(fieldset.lastElementChild).toHaveTextContent('Any of them.');
    expect(container.querySelector('label.label')).toBeNull();
  });

  it('gives the fieldset its role only where it is not the implicit group', () => {
    render(group({ as: 'fieldset', label: 'Pick some' }));
    const fieldset = screen.getByRole(role, { name: 'Pick some' });
    if (role === 'radiogroup') {
      expect(fieldset).toHaveAttribute('role', 'radiogroup');
    } else {
      expect(fieldset).not.toHaveAttribute('role');
    }
  });

  it('puts the legend in the label column when horizontal', () => {
    render(
      group({
        as: 'fieldset',
        horizontal: true,
        label: 'Pick some',
        labelSize: 'medium',
        message: 'Help',
        fieldClassName: 'custom-field',
      })
    );
    const fieldset = screen.getByRole(role, { name: 'Pick some' });
    expect(fieldset).toHaveClass('field', 'is-horizontal', 'custom-field');
    const legend = fieldset.firstElementChild!;
    expect(legend.tagName).toBe('LEGEND');
    expect(legend).toHaveClass('field-label', 'is-medium');
    expect(legend.firstElementChild!.tagName).toBe('SPAN');
    expect(legend.firstElementChild).toHaveClass('label');
    const body = fieldset.querySelector(':scope > .field-body')!;
    expect(body.querySelector(`.control > .${box}`)).not.toBeNull();
    expect(body.lastElementChild).toHaveClass('help');
  });

  it("sizes a horizontal legend's column like Field, normal by default", () => {
    render(group({ as: 'fieldset', horizontal: true, label: 'Pick some' }));
    expect(screen.getByText('Pick some').closest('legend')).toHaveClass(
      'field-label',
      'is-normal'
    );
  });

  it('puts labelProps on the label, minus any htmlFor', () => {
    render(
      group({
        as: 'fieldset',
        label: 'Pick some',
        labelProps: { id: 'pick', htmlFor: 'nothing', className: 'is-size-5' },
      })
    );
    const legend = screen.getByText('Pick some');
    expect(legend.tagName).toBe('LEGEND');
    expect(legend).toHaveAttribute('id', 'pick');
    expect(legend).not.toHaveAttribute('for');
    expect(legend).toHaveClass('label', 'is-size-5');
  });

  it('puts attributes on the fieldset and classes on the box', () => {
    render(
      group({
        as: 'fieldset',
        label: 'Pick some',
        className: 'my-box',
        ml: '5',
        'data-testid': 'group',
        id: 'the-group',
      } as Partial<GroupProps>)
    );
    const fieldset = screen.getByTestId('group');
    expect(fieldset.tagName).toBe('FIELDSET');
    expect(fieldset).toHaveAttribute('id', 'the-group');
    expect(fieldset).not.toHaveClass('my-box');
    expect(fieldset.querySelector(`.${box}`)).toHaveClass('my-box', 'ml-5');
  });

  it('lets a caller aria-label name the group over the legend', () => {
    render(
      group({
        as: 'fieldset',
        label: 'Pick some',
        'aria-label': 'Chosen',
      } as Partial<GroupProps>)
    );
    expect(screen.getByRole(role, { name: 'Chosen' }).tagName).toBe('FIELDSET');
  });

  it('renders no legend without a label', () => {
    const { container } = render(
      group({ as: 'fieldset', message: 'Only help' })
    );
    const fieldset = container.querySelector('fieldset')!;
    expect(fieldset).toHaveClass('field');
    expect(fieldset.querySelector('legend')).toBeNull();
  });

  it("is the group element itself inside an outer Field, named by that Field's label", () => {
    const { container } = render(
      <Field label="Outer label">{group({ as: 'fieldset' })}</Field>
    );
    const fieldset = screen.getByRole(role, { name: 'Outer label' });
    expect(fieldset.tagName).toBe('FIELDSET');
    expect(fieldset).toHaveClass(box);
    expect(fieldset).toHaveAttribute('aria-labelledby');
    expect(fieldset.querySelector('legend')).toBeNull();
    expect(container.querySelectorAll('fieldset')).toHaveLength(1);
  });

  it('is the group element itself inside a Field and Control', () => {
    render(
      <Field>
        <Control>
          {group({
            as: 'fieldset',
            'aria-label': 'Bare',
          } as Partial<GroupProps>)}
        </Control>
      </Field>
    );
    const fieldset = screen.getByRole(role, { name: 'Bare' });
    expect(fieldset.tagName).toBe('FIELDSET');
    expect(fieldset.parentElement).toHaveClass('control');
  });

  it('keeps its Field inside a bare Control for a label, and warns', () => {
    resetDevWarnings();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <Control>{group({ as: 'fieldset', label: 'In a Control' })}</Control>
    );
    const fieldset = screen.getByRole(role, { name: 'In a Control' });
    expect(fieldset.parentElement).toHaveClass('control');
    // No Control of its own inside the caller's.
    expect(container.querySelectorAll('.control')).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('applies classPrefix from ConfigProvider', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        {group({
          as: 'fieldset',
          horizontal: true,
          label: 'Prefixed',
          message: 'Help',
        })}
      </ConfigProvider>
    );
    const fieldset = container.querySelector('fieldset')!;
    expect(fieldset).toHaveClass('bestax-field', 'bestax-is-horizontal');
    expect(fieldset.querySelector('legend')).toHaveClass(
      'bestax-field-label',
      'bestax-is-normal'
    );
    expect(fieldset.querySelector('legend > span')).toHaveClass('bestax-label');
    expect(fieldset.querySelector('.bestax-field-body')).not.toBeNull();
    expect(fieldset.querySelector(`.bestax-${box}`)).not.toBeNull();
    expect(fieldset.querySelector('.bestax-help')).not.toBeNull();
  });

  it('renders the same on the server', () => {
    const html = renderToStaticMarkup(
      group({ as: 'fieldset', label: 'Server' })
    );
    expect(html).toMatch(/^<fieldset class="field"/);
    expect(html).toContain('<legend class="label">Server</legend>');
  });

  it('renders a div, as before, by default and with as="div"', () => {
    for (const as of [undefined, 'div'] as const) {
      const { container, unmount } = render(group({ as, label: 'Default' }));
      expect(container.querySelector('fieldset')).toBeNull();
      expect(container.querySelector(`div.${box}`)).toHaveAttribute(
        'role',
        role
      );
      unmount();
    }
  });
});
