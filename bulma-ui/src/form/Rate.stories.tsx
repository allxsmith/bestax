import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Rate } from './Rate';
import { Field } from './Field';
import { Control } from './Control';

const meta: Meta<typeof Rate> = {
  title: 'Form/Rate',
  component: Rate,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A star/icon-based rating component. Supports sizes, colors, precision, and custom icons.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Rate>;

/**
 * Basic rate with default settings.
 */
export const Default: Story = {
  args: {
    defaultValue: 3,
  },
};

// ============================================================
// Context-aware Field/Control stories
// ============================================================

/**
 * Standalone with label — Rate renders its own Field+Control wrapper automatically.
 */
export const WithLabel: Story = {
  render: () => <Rate label="Rating" />,
};

/**
 * Inside Field — the outer Field turns off Rate's auto Field rendering via context.
 * Demonstrates horizontal layout composition.
 */
export const WithFieldWrapper: Story = {
  render: () => (
    <Field horizontal label="Rating">
      <Field.Body>
        <Rate />
      </Field.Body>
    </Field>
  ),
};

/**
 * Full manual composition — Field+Control provided externally,
 * Rate renders just its raw element.
 */
export const WithFieldControlWrapper: Story = {
  render: () => (
    <Field horizontal label="Rating">
      <Field.Body>
        <Field>
          <Control>
            <Rate />
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};

/**
 * Form submission — Rate is HTML-form-compatible. Pass a `name` prop and the
 * current value is submitted as a hidden input alongside any other form fields.
 * Submit the form below to see the resulting FormData entries.
 */
export const WithName: Story = {
  render: function RateForm() {
    const [submitted, setSubmitted] = useState<string>('');
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setSubmitted(JSON.stringify(Array.from(fd.entries()), null, 2));
        }}
      >
        <Rate name="rating" defaultValue={3} showScore />
        <div style={{ marginTop: '1rem' }}>
          <button type="submit" className="button is-primary">
            Submit
          </button>
        </div>
        {submitted && (
          <pre style={{ marginTop: '1rem' }}>{submitted}</pre>
        )}
      </form>
    );
  },
};
