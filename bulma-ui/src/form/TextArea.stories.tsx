import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TextArea } from './TextArea';
import { Field } from './Field';
import { Control } from './Control';

const meta: Meta<typeof TextArea> = {
  title: 'Form/TextArea',
  component: TextArea,
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
type Story = StoryObj<typeof TextArea>;

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
      <TextArea
        label="Small"
        size="small"
        placeholder="Small textarea"
        rows={2}
      />
      <TextArea
        label="Normal"
        placeholder="Normal textarea"
        rows={2}
      />
      <TextArea
        label="Medium"
        size="medium"
        placeholder="Medium textarea"
        rows={2}
      />
      <TextArea
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
      <TextArea
        label="Disabled"
        value="Cannot edit this"
        disabled
        rows={2}
        onChange={() => {}}
      />
      <TextArea
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
      <TextArea
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
      <TextArea
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

// ============================================================
// Context-aware Field/Control stories
// ============================================================

/**
 * Standalone with label — TextArea renders its own Field+Control wrapper automatically.
 */
export const WithLabel: Story = {
  render: () => <TextArea label="Bio" placeholder="Tell us about yourself" />,
};

/**
 * Inside Field — the outer Field turns off TextArea's auto Field rendering via context.
 * Demonstrates horizontal layout composition.
 */
export const WithFieldWrapper: Story = {
  render: () => (
    <Field horizontal label="Bio">
      <Field.Body>
        <TextArea placeholder="Tell us about yourself" />
      </Field.Body>
    </Field>
  ),
};

/**
 * Full manual composition — Field+Control provided externally,
 * TextArea renders just its raw element.
 */
export const WithFieldControlWrapper: Story = {
  render: () => (
    <Field horizontal label="Bio">
      <Field.Body>
        <Field>
          <Control>
            <TextArea placeholder="Tell us about yourself" />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};
