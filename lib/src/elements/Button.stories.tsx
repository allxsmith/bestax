import { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
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
    isFullWidth: { control: 'boolean' },
    isOutlined: { control: 'boolean' },
    isInverted: { control: 'boolean' },
    textColor: {
      control: 'text',
      description: 'Text color (e.g., primary for has-text-primary)',
    },
    bgColor: {
      control: 'text',
      description: 'Background color (e.g., info for has-background-info)',
    },
    m: { control: 'text', description: 'Margin (e.g., 2 for m-2)' },
    textAlign: {
      control: 'select',
      options: ['centered', 'justified', 'left', 'right'],
    },
    viewport: {
      control: 'select',
      options: ['mobile', 'tablet', 'desktop', 'widescreen', 'fullhd'],
    },
    children: { control: 'text' },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Default Button',
  },
};

export const PrimaryWithHelpers: Story = {
  args: {
    color: 'primary',
    isRounded: true,
    textColor: 'success',
    m: '2',
    textAlign: 'centered',
    viewport: 'mobile',
    children: 'Primary Button with Helpers',
  },
};

export const FlexButton: Story = {
  args: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    children: 'Flex Button',
  },
};
