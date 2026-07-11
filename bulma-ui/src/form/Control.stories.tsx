import type { Meta, StoryObj } from '@storybook/react-vite';
import { Control } from './Control';
import { Field } from './Field';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from '../elements/Button';

const meta: Meta<typeof Control> = {
  title: 'Form/Control',
  component: Control,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The Bulma control wrapper for a single form input, handling left/right icons, the loading spinner, and expansion inside grouped or addon fields.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    hasIconsLeft: {
      control: 'boolean',
      description:
        'Reserve space for a left icon (set automatically when a left icon is given)',
    },
    hasIconsRight: {
      control: 'boolean',
      description:
        'Reserve space for a right icon (set automatically when a right icon is given)',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show a loading spinner on the right of the control',
    },
    isExpanded: {
      control: 'boolean',
      description:
        'Expand the control to fill the available space in a grouped or addon field',
    },
    size: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
      description:
        'Size of the control — scales the loading spinner and icon spacing',
    },
    iconLeftName: {
      control: 'text',
      description: 'Shortcut for the left icon name',
    },
    iconLeftSize: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'Shortcut for the left icon size',
    },
    iconRightName: {
      control: 'text',
      description: 'Shortcut for the right icon name',
    },
    iconRightSize: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'Shortcut for the right icon size',
    },
    iconLeft: {
      control: 'object',
      description: 'Full Icon props for the left icon',
    },
    iconRight: {
      control: 'object',
      description: 'Full Icon props for the right icon',
    },
    as: {
      control: 'select',
      options: ['div', 'p'],
      description: "Element type for the control (default: 'div')",
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Control>;

/**
 * A plain control wrapping a single input.
 */
export const Default: Story = {
  args: {
    children: <Input placeholder="Wrapped input" />,
  },
};

/**
 * Left icon via the `iconLeftName` shortcut.
 */
export const IconLeft: Story = {
  render: () => (
    <Control iconLeftName="envelope">
      <Input type="email" placeholder="Email" />
    </Control>
  ),
};

/**
 * Right icon via the `iconRightName` shortcut.
 */
export const IconRight: Story = {
  render: () => (
    <Control iconRightName="check">
      <Input placeholder="Username" />
    </Control>
  ),
};

/**
 * Icons on both sides of the input.
 */
export const IconsBoth: Story = {
  render: () => (
    <Control iconLeftName="user" iconRightName="check">
      <Input placeholder="Username" />
    </Control>
  ),
};

/**
 * Match the icon size to the input size via `iconLeftSize` / `iconRightSize`.
 */
export const IconsBySize: Story = {
  render: () => (
    <>
      <Field>
        <Control
          iconLeftName="user"
          iconLeftSize="small"
          iconRightName="check"
          iconRightSize="small"
        >
          <Input size="small" placeholder="Small" />
        </Control>
      </Field>
      <Field>
        <Control iconLeftName="user" iconRightName="check">
          <Input placeholder="Normal" />
        </Control>
      </Field>
      <Field>
        <Control
          iconLeftName="user"
          iconLeftSize="medium"
          iconRightName="check"
          iconRightSize="medium"
        >
          <Input size="medium" placeholder="Medium" />
        </Control>
      </Field>
      <Field>
        <Control
          iconLeftName="user"
          iconLeftSize="large"
          iconRightName="check"
          iconRightSize="large"
        >
          <Input size="large" placeholder="Large" />
        </Control>
      </Field>
    </>
  ),
};

/**
 * `isLoading` shows a spinner on the right of the control.
 */
export const Loading: Story = {
  render: () => (
    <Control isLoading>
      <Input placeholder="Searching…" />
    </Control>
  ),
};

/**
 * The `size` prop scales the loading spinner to match the input size.
 */
export const LoadingSizes: Story = {
  render: () => (
    <>
      <Field>
        <Control isLoading size="small">
          <Input size="small" placeholder="Loading small" />
        </Control>
      </Field>
      <Field>
        <Control isLoading>
          <Input placeholder="Loading normal" />
        </Control>
      </Field>
      <Field>
        <Control isLoading size="medium">
          <Input size="medium" placeholder="Loading medium" />
        </Control>
      </Field>
      <Field>
        <Control isLoading size="large">
          <Input size="large" placeholder="Loading large" />
        </Control>
      </Field>
    </>
  ),
};

/**
 * `isExpanded` makes a control fill the remaining space in a grouped field.
 */
export const ExpandedInGroup: Story = {
  render: () => (
    <Field grouped>
      <Control isExpanded>
        <Input placeholder="Find a repository" />
      </Control>
      <Control>
        <Button color="info">Search</Button>
      </Control>
    </Field>
  ),
};

/**
 * `isExpanded` inside an addon field — the select control grows to fill
 * the row while the button keeps its width.
 */
export const ExpandedInAddons: Story = {
  render: () => (
    <Field hasAddons>
      <Control isExpanded>
        <Select isFullwidth aria-label="Country">
          <option>United States</option>
          <option>United Kingdom</option>
          <option>Canada</option>
        </Select>
      </Control>
      <Control>
        <Button color="primary">Choose</Button>
      </Control>
    </Field>
  ),
};

/**
 * Render the control as a `<p>` element via the `as` prop.
 */
export const AsParagraph: Story = {
  render: () => (
    <Control as="p" iconLeftName="user">
      <Input placeholder="Paragraph control" />
    </Control>
  ),
};
