import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'link', 'info', 'success', 'warning', 'danger'],
    },
    size: {
      control: 'select',
      options: ['small', 'normal', 'medium', 'large'],
    },
    isLight: { control: 'boolean' },
    isRounded: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    color: 'primary',
    children: 'Primary Button',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    children: 'Large Button',
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Loading',
  },
};
