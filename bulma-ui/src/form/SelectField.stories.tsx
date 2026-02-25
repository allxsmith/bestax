import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SelectField } from './SelectField';

const meta: Meta<typeof SelectField> = {
  title: 'Form/SelectField',
  component: SelectField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A convenience component that composes Field, Control, and Select. Use for typical form fields without needing to nest three components.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Field label text',
    },
    color: {
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
      description: 'Bulma color for the select',
    },
    size: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'Size of the select',
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
      description: 'Color for the help message',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the select is disabled',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading indicator',
    },
    horizontal: {
      control: 'boolean',
      description: 'Horizontal field layout',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SelectField>;

/**
 * Basic select field with a label.
 */
export const Default: Story = {
  args: {
    label: 'Country',
    children: (
      <>
        <option value="">Select a country</option>
        <option value="us">United States</option>
        <option value="ca">Canada</option>
        <option value="uk">United Kingdom</option>
        <option value="de">Germany</option>
        <option value="fr">France</option>
      </>
    ),
  },
};

/**
 * Select field with icon.
 */
export const WithIcon: Story = {
  args: {
    label: 'Country',
    iconLeftName: 'globe',
    children: (
      <>
        <option value="">Select a country</option>
        <option value="us">United States</option>
        <option value="ca">Canada</option>
        <option value="uk">United Kingdom</option>
      </>
    ),
  },
};

/**
 * Select field with validation message.
 */
export const WithMessage: Story = {
  args: {
    label: 'Role',
    message: 'Please select your role',
    messageColor: 'info',
    children: (
      <>
        <option value="">Choose a role</option>
        <option value="admin">Admin</option>
        <option value="editor">Editor</option>
        <option value="viewer">Viewer</option>
      </>
    ),
  },
};

/**
 * Select field showing an error state.
 */
export const ErrorState: Story = {
  args: {
    label: 'Category',
    color: 'danger',
    message: 'A category is required',
    messageColor: 'danger',
    children: (
      <>
        <option value="">Select a category</option>
        <option value="tech">Technology</option>
        <option value="science">Science</option>
      </>
    ),
  },
};

/**
 * Different select sizes.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {(['small', undefined, 'medium', 'large'] as const).map(size => (
        <SelectField
          key={size ?? 'normal'}
          label={size ? size.charAt(0).toUpperCase() + size.slice(1) : 'Normal'}
          size={size}
        >
          <option>Option A</option>
          <option>Option B</option>
        </SelectField>
      ))}
    </div>
  ),
};

/**
 * Loading and disabled states.
 */
export const StatesExample: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SelectField label="Loading" isLoading>
        <option>Loading options...</option>
      </SelectField>
      <SelectField label="Disabled" disabled>
        <option>Cannot change</option>
      </SelectField>
    </div>
  ),
};

/**
 * Horizontal field layout.
 */
export const Horizontal: Story = {
  render: () => (
    <div>
      <SelectField horizontal label="Country" labelSize="normal">
        <option>United States</option>
        <option>Canada</option>
      </SelectField>
      <SelectField horizontal label="Language" labelSize="normal">
        <option>English</option>
        <option>French</option>
      </SelectField>
    </div>
  ),
};

/**
 * Controlled select field.
 */
export const Controlled: Story = {
  render: function ControlledSelect() {
    const [value, setValue] = useState('');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <SelectField
          label="Fruit"
          value={value}
          onChange={e => setValue(e.target.value)}
          iconLeftName="leaf"
        >
          <option value="">Pick a fruit</option>
          <option value="apple">Apple</option>
          <option value="banana">Banana</option>
          <option value="cherry">Cherry</option>
        </SelectField>
        <p>
          Selected: <strong>{value || '(none)'}</strong>
        </p>
      </div>
    );
  },
};
