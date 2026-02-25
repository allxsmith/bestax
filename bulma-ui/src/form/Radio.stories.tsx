import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Radio } from './Radio';
import { Radios } from './Radios';
import { Control } from './Control';

const meta: Meta<typeof Radio> = {
  title: 'Form/Radio',
  component: Radio,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A themed radio button component with custom visual styling. Supports colors, sizes, and various states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'link', 'info', 'success', 'warning', 'danger'],
      description: 'Color variant for the radio',
    },
    size: {
      control: 'select',
      options: ['small', 'normal', 'medium', 'large'],
      description: 'Size of the radio',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the radio is disabled',
    },
    children: {
      control: 'text',
      description: 'Label content for the radio',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Radio>;

/**
 * Mutually exclusive radio buttons.
 */
export const MutuallyExclusive: Story = {
  render: () => (
    <Control>
      <Radio name="mutuallyExclusive">Yes</Radio>{' '}
      <Radio name="mutuallyExclusive">No</Radio>{' '}
      <Radio name="mutuallyExclusive">Maybe</Radio>
    </Control>
  ),
};

/**
 * Radio with default selection.
 */
export const DefaultSelected: Story = {
  render: () => (
    <Control>
      <Radio name="pet">Cat</Radio>{' '}
      <Radio name="pet" defaultChecked>
        Dog
      </Radio>
    </Control>
  ),
};

/**
 * Radio with different color variants.
 */
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Radio color="primary" name="color-demo-1" defaultChecked>
        Primary
      </Radio>
      <Radio color="link" name="color-demo-2" defaultChecked>
        Link
      </Radio>
      <Radio color="info" name="color-demo-3" defaultChecked>
        Info
      </Radio>
      <Radio color="success" name="color-demo-4" defaultChecked>
        Success
      </Radio>
      <Radio color="warning" name="color-demo-5" defaultChecked>
        Warning
      </Radio>
      <Radio color="danger" name="color-demo-6" defaultChecked>
        Danger
      </Radio>
    </div>
  ),
};

/**
 * Radio with different size variants.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Radio size="small" name="size-demo-1" defaultChecked>
        Small
      </Radio>
      <Radio size="normal" name="size-demo-2" defaultChecked>
        Normal
      </Radio>
      <Radio size="medium" name="size-demo-3" defaultChecked>
        Medium
      </Radio>
      <Radio size="large" name="size-demo-4" defaultChecked>
        Large
      </Radio>
    </div>
  ),
};

/**
 * Disabled radio states.
 */
export const Disabled: Story = {
  render: () => (
    <Control>
      <Radio name="response" disabled>
        Attend
      </Radio>{' '}
      <Radio name="response" disabled>
        Decline
      </Radio>{' '}
      <Radio name="response" disabled>
        Tentative
      </Radio>
    </Control>
  ),
};

/**
 * Controlled radio group with state management.
 */
export const Controlled: Story = {
  render: function ControlledRadio() {
    const [value, setValue] = useState('a');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Radio
            color="primary"
            name="controlled"
            value="a"
            checked={value === 'a'}
            onChange={() => setValue('a')}
          >
            Option A
          </Radio>
          <Radio
            color="primary"
            name="controlled"
            value="b"
            checked={value === 'b'}
            onChange={() => setValue('b')}
          >
            Option B
          </Radio>
          <Radio
            color="primary"
            name="controlled"
            value="c"
            checked={value === 'c'}
            onChange={() => setValue('c')}
          >
            Option C
          </Radio>
        </div>
        <p>
          Selected: <strong>{value.toUpperCase()}</strong>
        </p>
      </div>
    );
  },
};

/**
 * A group of radios using the Radios wrapper.
 */
export const ListOfRadios: Story = {
  render: () => (
    <Radios>
      <Radio name="event" color="info">
        Attend
      </Radio>
      <Radio name="event" color="info">
        Decline
      </Radio>
      <Radio name="event" color="info">
        Tentative
      </Radio>
    </Radios>
  ),
};
