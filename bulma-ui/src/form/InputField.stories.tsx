import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { InputField } from './InputField';

const meta: Meta<typeof InputField> = {
  title: 'Form/InputField',
  component: InputField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A convenience component that composes Field, Control, and Input. Use for typical form fields without needing to nest three components.',
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
      description: 'Bulma color for the input',
    },
    size: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'Size of the input',
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
      description: 'Whether the input is disabled',
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the input is read-only',
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
type Story = StoryObj<typeof InputField>;

/**
 * Basic input field with a label.
 */
export const Default: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
  },
};

/**
 * Input field with icons.
 */
export const WithIcons: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    iconLeftName: 'envelope',
    iconRightName: 'check',
  },
};

/**
 * Input field with validation message.
 */
export const WithMessage: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    message: 'Password must be at least 8 characters',
    messageColor: 'info',
    iconLeftName: 'lock',
  },
};

/**
 * Input field showing an error state.
 */
export const ErrorState: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'Enter email',
    value: 'invalid-email',
    color: 'danger',
    message: 'Please enter a valid email address',
    messageColor: 'danger',
    iconLeftName: 'envelope',
    iconRightName: 'exclamation-triangle',
    onChange: () => {},
  },
};

/**
 * Input field showing a success state.
 */
export const SuccessState: Story = {
  args: {
    label: 'Username',
    value: 'available_user',
    color: 'success',
    message: 'This username is available',
    messageColor: 'success',
    iconLeftName: 'user',
    iconRightName: 'check',
    onChange: () => {},
  },
};

/**
 * Different input sizes.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <InputField label="Small" size="small" placeholder="Small input" />
      <InputField label="Normal" placeholder="Normal input" />
      <InputField label="Medium" size="medium" placeholder="Medium input" />
      <InputField label="Large" size="large" placeholder="Large input" />
    </div>
  ),
};

/**
 * Input field with loading state.
 */
export const Loading: Story = {
  args: {
    label: 'Search',
    placeholder: 'Searching...',
    isLoading: true,
    iconLeftName: 'search',
  },
};

/**
 * Disabled and read-only states.
 */
export const DisabledAndReadOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <InputField
        label="Disabled"
        value="Cannot edit"
        disabled
        onChange={() => {}}
      />
      <InputField
        label="Read Only"
        value="Read only value"
        readOnly
        onChange={() => {}}
      />
    </div>
  ),
};

/**
 * Horizontal field layout.
 */
export const Horizontal: Story = {
  render: () => (
    <div>
      <InputField
        horizontal
        label="Name"
        placeholder="Your full name"
        labelSize="normal"
      />
      <InputField
        horizontal
        label="Email"
        type="email"
        placeholder="Your email"
        labelSize="normal"
      />
    </div>
  ),
};

/**
 * Full form example using InputField.
 */
export const FormExample: Story = {
  render: function FormDemo() {
    const [form, setForm] = useState({
      name: '',
      email: '',
      phone: '',
    });

    const update =
      (field: keyof typeof form) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    return (
      <div style={{ maxWidth: '500px' }}>
        <InputField
          label="Full Name"
          placeholder="John Doe"
          iconLeftName="user"
          value={form.name}
          onChange={update('name')}
        />
        <InputField
          label="Email"
          type="email"
          placeholder="john@example.com"
          iconLeftName="envelope"
          value={form.email}
          onChange={update('email')}
        />
        <InputField
          label="Phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          iconLeftName="phone"
          value={form.phone}
          onChange={update('phone')}
        />
      </div>
    );
  },
};
