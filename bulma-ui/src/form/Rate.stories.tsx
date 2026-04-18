import type { Meta, StoryObj } from '@storybook/react-vite';
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
