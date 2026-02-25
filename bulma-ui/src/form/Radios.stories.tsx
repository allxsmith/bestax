import { Meta, StoryObj } from '@storybook/react-vite';
import Radio from './Radio';
import Radios from './Radios';

const meta: Meta<typeof Radios> = {
  title: 'Form/Radios',
  component: Radios,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A wrapper component that groups multiple Radio buttons together with proper spacing.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Radios>;

export const Default: Story = {
  render: () => (
    <Radios>
      <Radio name="event">Attend</Radio>
      <Radio name="event">Decline</Radio>
      <Radio name="event">Tentative</Radio>
    </Radios>
  ),
};

export const WithColors: Story = {
  render: () => (
    <Radios>
      <Radio name="color-group" color="primary">
        Primary
      </Radio>
      <Radio name="color-group" color="info">
        Info
      </Radio>
      <Radio name="color-group" color="success">
        Success
      </Radio>
    </Radios>
  ),
};

export const DisabledGroup: Story = {
  render: () => (
    <Radios>
      <Radio name="disabled-group" disabled>
        Attend
      </Radio>
      <Radio name="disabled-group" disabled>
        Decline
      </Radio>
      <Radio name="disabled-group" disabled>
        Tentative
      </Radio>
    </Radios>
  ),
};
