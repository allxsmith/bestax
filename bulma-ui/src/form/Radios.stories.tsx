import { Meta, StoryObj } from '@storybook/react';
import Radio from './Radio';
import Radios from './Radios';
import Control from './Control';

const meta: Meta<typeof Radio> = {
  title: 'Form/Radio',
  component: Radio,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Radio>;

export const MutuallyExclusive: Story = {
  render: () => (
    <Control>
      <Radio name="mutuallyExclusive"> Yes </Radio>{' '}
      <Radio name="mutuallyExclusive"> No </Radio>{' '}
      <Radio name="mutuallyExclusive"> Maybe </Radio>
    </Control>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Three radios in a group, only one can be selected at a time.',
      },
    },
  },
};

export const DefaultSelected: Story = {
  render: () => (
    <Control>
      <Radio name="pet"> Cat </Radio>{' '}
      <Radio name="pet" defaultChecked>
        {' '}
        Dog{' '}
      </Radio>
    </Control>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Two radios with "Dog" selected by default.',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <Control>
      <Radio name="response" disabled>
        Attend{' '}
      </Radio>{' '}
      <Radio name="response" disabled>
        {' '}
        Decline{' '}
      </Radio>{' '}
      <Radio name="response" disabled>
        {' '}
        Tentative{' '}
      </Radio>
    </Control>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Three disabled radios in a group.',
      },
    },
  },
};

export const ListOfRadios: Story = {
  render: () => (
    <Radios>
      <Radio name="event" disabled>
        {' '}
        Attend{' '}
      </Radio>
      <Radio name="event" disabled>
        {' '}
        Decline{' '}
      </Radio>
      <Radio name="event" disabled>
        {' '}
        Tentative{' '}
      </Radio>
    </Radios>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A group of disabled radios using the Radios wrapper.',
      },
    },
  },
};
