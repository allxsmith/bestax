import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';
import { Input } from './Input';
import { Field } from './Field';
import { Control } from './Control';

const meta: Meta<typeof Input> = {
  title: 'Form/Input',
  component: Input,
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
type Story = StoryObj<typeof Input>;

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
    <>
      <Input label="Small" size="small" placeholder="Small input" />
      <Input label="Normal" placeholder="Normal input" />
      <Input label="Medium" size="medium" placeholder="Medium input" />
      <Input label="Large" size="large" placeholder="Large input" />
    </>
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
    <>
      <Input
        label="Disabled"
        value="Cannot edit"
        disabled
        onChange={() => {}}
      />
      <Input
        label="Read Only"
        value="Read only value"
        readOnly
        onChange={() => {}}
      />
    </>
  ),
};

/**
 * Horizontal field layout.
 */
export const Horizontal: Story = {
  render: () => (
    <div>
      <Input horizontal label="Name" placeholder="Your full name" />
      <Input
        horizontal
        label="Email"
        type="email"
        placeholder="Your email"
      />
    </div>
  ),
};

/**
 * Horizontal fields at each size, with matching labelSize and input size.
 */
export const HorizontalSizes: Story = {
  render: () => (
    <div>
      <Input horizontal label="Small" placeholder="Small input" size="small" labelSize="small" />
      <Input horizontal label="Normal" placeholder="Normal input" />
      <Input horizontal label="Medium" placeholder="Medium input" size="medium" labelSize="medium" />
      <Input horizontal label="Large" placeholder="Large input" size="large" labelSize="large" />
    </div>
  ),
};

/**
 * Full form example using Input.
 */
export const FormExample: Story = {
  render: function FormDemo() {
    const [form, setForm] = useState({
      name: '',
      email: '',
      phone: '',
    });

    const update =
      (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    return (
      <Columns>
        <Column
          sizeMobile="full"
          sizeTablet="full"
          sizeDesktop="half"
          sizeWidescreen="one-third"
          sizeFullhd="one-quarter"
        >
          <Input
            label="Full Name"
            placeholder="John Doe"
            iconLeftName="user"
            value={form.name}
            onChange={update('name')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            iconLeftName="envelope"
            value={form.email}
            onChange={update('email')}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            iconLeftName="phone"
            value={form.phone}
            onChange={update('phone')}
          />
        </Column>
      </Columns>
    );
  },
};

// ============================================================
// Context-aware Field/Control stories
// ============================================================

/**
 * Standalone with label — Input renders its own Field+Control wrapper automatically.
 */
export const WithLabel: Story = {
  render: () => <Input label="Username" placeholder="Enter username" />,
};

/**
 * Inside Field — the outer Field turns off Input's auto Field rendering via context.
 * Demonstrates horizontal layout composition.
 */
export const WithFieldWrapper: Story = {
  render: () => (
    <Field horizontal label="Username">
      <Field.Body>
        <Input placeholder="Enter username" />
      </Field.Body>
    </Field>
  ),
};

/**
 * Full manual composition — Field+Control provided externally,
 * Input renders just its raw element.
 */
export const WithFieldControlWrapper: Story = {
  render: () => (
    <Field horizontal label="Username">
      <Field.Body>
        <Field>
          <Control iconLeftName="fas fa-user">
            <Input placeholder="Enter username" />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};
