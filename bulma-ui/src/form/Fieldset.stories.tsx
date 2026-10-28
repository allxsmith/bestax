import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Fieldset } from './Fieldset';
import { Input } from './Input';
import { Select } from './Select';
import { Checkbox } from './Checkbox';
import { Rate } from './Rate';
import { Slider } from './Slider';
import { Field } from './Field';
import { Control } from './Control';
import { Button } from '../elements/Button';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';
import { validColors } from '../helpers/useBulmaClasses';

const meta: Meta<typeof Fieldset> = {
  title: 'Form/Fieldset',
  component: Fieldset,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A section of a form in a native fieldset, named by its legend. Bordered, filled or unstyled. Its disabled switches off every control inside, the native ones and bestax widgets such as Rate alike, and its message describes the group.',
      },
    },
  },
  args: {
    legend: 'Shipping address',
  },
  argTypes: {
    legend: {
      control: 'text',
      description: 'The group’s name, shown in a legend',
    },
    legendProps: {
      control: false,
      description: 'Props for the legend, such as an id or a className',
    },
    variant: {
      control: 'inline-radio',
      options: ['default', 'filled', 'unstyled'],
      description: 'Bordered, bordered on a tinted background, or no box',
    },
    disabled: {
      control: 'boolean',
      description:
        'Disables every control inside, and is the default for each bestax input’s own disabled',
    },
    message: {
      control: 'text',
      description: 'Help text under the group, which describes it',
    },
    messageColor: {
      control: 'select',
      options: [
        undefined,
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
      ],
      description: 'Bulma color for the message',
    },
    textColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Text color helper',
    },
    bgColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Background color helper',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
    children: {
      control: false,
      description: 'The group’s content, such as Fields and inputs',
    },
  },
  render: function DefaultExample(args) {
    return (
      <Fieldset {...args}>
        <Input label="Street" name="street" />
        <Input label="City" name="city" />
      </Fieldset>
    );
  },
};

export default meta;
type Story = StoryObj<typeof Fieldset>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: 'Shipping address' });
    await expect(group.tagName).toBe('FIELDSET');
  },
};

export const Variants: Story = {
  render: function VariantsExample() {
    return (
      <Columns>
        {(['default', 'filled', 'unstyled'] as const).map(variant => (
          <Column key={variant}>
            <Fieldset variant={variant} legend={`Shipping (${variant})`}>
              <Input label="Street" name={`street-${variant}`} />
              <Input label="City" name={`city-${variant}`} />
            </Fieldset>
          </Column>
        ))}
      </Columns>
    );
  },
};

export const WithMessage: Story = {
  args: {
    legend: 'Contact',
    message: 'Fill in the phone number or the email.',
    messageColor: 'info',
  },
  render: function WithMessageExample(args) {
    return (
      <Fieldset {...args}>
        <Input label="Phone" name="phone" type="tel" />
        <Input label="Email" name="email" type="email" />
      </Fieldset>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('group', { name: 'Contact' })
    ).toHaveAccessibleDescription('Fill in the phone number or the email.');
  },
};

export const HorizontalFields: Story = {
  args: { legend: 'Contact details' },
  render: function HorizontalFieldsExample(args) {
    return (
      <Fieldset {...args}>
        <Input horizontal label="Phone" name="phone" type="tel" />
        <Input horizontal label="Email" name="email" type="email" />
        <Field horizontal label="Subject">
          <Control>
            <Select name="subject">
              <option>Business</option>
              <option>Support</option>
            </Select>
          </Control>
        </Field>
      </Fieldset>
    );
  },
};

export const ToggledFromTheLegend: Story = {
  render: function ToggledFromTheLegendExample() {
    const [different, setDifferent] = useState(false);
    return (
      <Fieldset
        disabled={!different}
        legend={
          <Checkbox
            checked={different}
            onChange={event => setDifferent(event.target.checked)}
          >
            Ship to a different address
          </Checkbox>
        }
      >
        <Input label="Street" name="street" />
        <Input label="City" name="city" />
      </Fieldset>
    );
  },
};

export const DisablingAForm: Story = {
  render: function DisablingAFormExample() {
    const [saving, setSaving] = useState(false);
    return (
      <form
        onSubmit={event => {
          event.preventDefault();
          setSaving(true);
          setTimeout(() => setSaving(false), 2000);
        }}
      >
        <Fieldset variant="unstyled" disabled={saving}>
          <Input label="Name" name="name" />
          <Rate label="Rating" name="rating" defaultValue={3} />
          <Slider label="Volume" name="volume" defaultValue={40} />
          <Button type="submit" color="primary" isLoading={saving}>
            Save
          </Button>
        </Fieldset>
      </form>
    );
  },
};
