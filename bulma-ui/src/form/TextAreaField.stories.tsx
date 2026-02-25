import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TextAreaField } from './TextAreaField';

const meta: Meta<typeof TextAreaField> = {
  title: 'Form/TextAreaField',
  component: TextAreaField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A convenience component that composes Field, Control, and TextArea. Use for typical form fields without needing to nest three components.',
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
      description: 'Bulma color for the textarea',
    },
    size: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'Size of the textarea',
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
      description: 'Whether the textarea is disabled',
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the textarea is read-only',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading indicator',
    },
    horizontal: {
      control: 'boolean',
      description: 'Horizontal field layout',
    },
    rows: {
      control: 'number',
      description: 'Number of visible text lines',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextAreaField>;

/**
 * Basic textarea field with a label.
 */
export const Default: Story = {
  args: {
    label: 'Bio',
    placeholder: 'Tell us about yourself...',
    rows: 4,
  },
};

/**
 * Textarea field with validation message.
 */
export const WithMessage: Story = {
  args: {
    label: 'Comments',
    placeholder: 'Your comments...',
    rows: 3,
    message: 'Maximum 500 characters',
    messageColor: 'info',
  },
};

/**
 * Textarea field showing an error state.
 */
export const ErrorState: Story = {
  args: {
    label: 'Description',
    value: '',
    color: 'danger',
    message: 'Description is required',
    messageColor: 'danger',
    rows: 3,
    onChange: () => {},
  },
};

/**
 * Different textarea sizes.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <TextAreaField
        label="Small"
        size="small"
        placeholder="Small textarea"
        rows={2}
      />
      <TextAreaField
        label="Normal"
        placeholder="Normal textarea"
        rows={2}
      />
      <TextAreaField
        label="Medium"
        size="medium"
        placeholder="Medium textarea"
        rows={2}
      />
      <TextAreaField
        label="Large"
        size="large"
        placeholder="Large textarea"
        rows={2}
      />
    </div>
  ),
};

/**
 * Disabled and read-only states.
 */
export const DisabledAndReadOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <TextAreaField
        label="Disabled"
        value="Cannot edit this"
        disabled
        rows={2}
        onChange={() => {}}
      />
      <TextAreaField
        label="Read Only"
        value="Read only value"
        readOnly
        rows={2}
        onChange={() => {}}
      />
    </div>
  ),
};

/**
 * Fixed-size textarea.
 */
export const FixedSize: Story = {
  args: {
    label: 'Fixed Size',
    placeholder: 'This textarea cannot be resized',
    rows: 4,
    hasFixedSize: true,
  },
};

/**
 * Horizontal field layout.
 */
export const Horizontal: Story = {
  render: () => (
    <div>
      <TextAreaField
        horizontal
        label="Message"
        placeholder="Your message..."
        rows={4}
        labelSize="normal"
      />
    </div>
  ),
};

/**
 * Controlled textarea with character count.
 */
export const CharacterCount: Story = {
  render: function CharCountTextArea() {
    const maxChars = 200;
    const [value, setValue] = useState('');
    const remaining = maxChars - value.length;
    const isOver = remaining < 0;

    return (
      <TextAreaField
        label="Tweet"
        placeholder="What's happening?"
        rows={3}
        value={value}
        onChange={e => setValue(e.target.value)}
        color={isOver ? 'danger' : undefined}
        message={`${remaining} characters remaining`}
        messageColor={isOver ? 'danger' : remaining < 20 ? 'warning' : undefined}
      />
    );
  },
};
