import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Checkbox } from './Checkbox';
import { Checkboxes } from './Checkboxes';
import { Block } from '../elements/Block';

const meta: Meta<typeof Checkbox> = {
  title: 'Form/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A themed checkbox component with custom visual styling. Supports colors, sizes, and various states including indeterminate.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'link', 'info', 'success', 'warning', 'danger'],
      description: 'Color variant for the checkbox',
    },
    size: {
      control: 'select',
      options: ['small', 'normal', 'medium', 'large'],
      description: 'Size of the checkbox',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
    indeterminate: {
      control: 'boolean',
      description:
        'Shows the mixed state, as in a "Select all" box. `checked` is still the value',
    },
    children: {
      control: 'text',
      description: 'Label content for the checkbox',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

/**
 * Basic checkbox with default styling.
 */
export const Default: Story = {
  args: {
    children: 'Stay Signed In',
  },
};

/**
 * Checkbox with an anchor tag in the label.
 */
export const CheckboxWithLink: Story = {
  render: () => (
    <Checkbox>
      I have read and agree to the{' '}
      <a href="#" target="_blank" rel="noopener noreferrer">
        terms and conditions
      </a>
      .
    </Checkbox>
  ),
};

/**
 * Checkbox with different color variants.
 */
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Checkbox color="primary" defaultChecked>
        Primary
      </Checkbox>
      <Checkbox color="link" defaultChecked>
        Link
      </Checkbox>
      <Checkbox color="info" defaultChecked>
        Info
      </Checkbox>
      <Checkbox color="success" defaultChecked>
        Success
      </Checkbox>
      <Checkbox color="warning" defaultChecked>
        Warning
      </Checkbox>
      <Checkbox color="danger" defaultChecked>
        Danger
      </Checkbox>
    </div>
  ),
};

/**
 * Checkbox with different size variants.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Checkbox size="small" defaultChecked>
        Small
      </Checkbox>
      <Checkbox size="normal" defaultChecked>
        Normal
      </Checkbox>
      <Checkbox size="medium" defaultChecked>
        Medium
      </Checkbox>
      <Checkbox size="large" defaultChecked>
        Large
      </Checkbox>
    </div>
  ),
};

/**
 * Disabled checkbox states.
 */
export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Checkbox disabled>Disabled unchecked</Checkbox>
      <Checkbox disabled defaultChecked color="success">
        Disabled checked
      </Checkbox>
    </div>
  ),
};

/**
 * A "Select all" box over a list, mixed while only some of the list is
 * checked. The `indeterminate` prop draws the mixed state; `checked` stays the
 * value.
 */
export const Indeterminate: Story = {
  render: function IndeterminateCheckbox() {
    const items = ['Item A', 'Item B', 'Item C'];
    const [picked, setPicked] = useState(['Item A', 'Item C']);
    const allPicked = picked.length === items.length;

    return (
      <Block>
        <Checkbox
          color="primary"
          checked={allPicked}
          indeterminate={picked.length > 0 && !allPicked}
          onChange={() => setPicked(allPicked ? [] : items)}
        >
          Select all
        </Checkbox>
        <Checkboxes value={picked} onChange={setPicked} ml="5">
          {items.map(item => (
            <Checkbox key={item} value={item} color="primary">
              {item}
            </Checkbox>
          ))}
        </Checkboxes>
      </Block>
    );
  },
};

/**
 * Controlled checkbox with state management.
 */
export const Controlled: Story = {
  render: function ControlledCheckbox() {
    const [isChecked, setIsChecked] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Checkbox
          color="primary"
          checked={isChecked}
          onChange={e => setIsChecked(e.target.checked)}
        >
          Feature is {isChecked ? 'enabled' : 'disabled'}
        </Checkbox>
        <p>
          Current state: <strong>{isChecked ? 'ON' : 'OFF'}</strong>
        </p>
      </div>
    );
  },
};

/**
 * Checkbox without label.
 */
export const NoLabel: Story = {
  args: {
    color: 'primary',
    defaultChecked: true,
  },
};

// Group/Checkboxes-wrapper stories live in `Checkboxes.stories.tsx`.
