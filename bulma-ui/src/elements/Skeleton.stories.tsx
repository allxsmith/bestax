import { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';

// Meta configuration for the Skeleton component
const meta: Meta<typeof Skeleton> = {
  title: 'Elements/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['block', 'lines'],
      description: 'Skeleton variant: block or lines',
    },
    lines: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of lines (only for lines variant)',
    },
    className: {
      control: 'text',
      description: 'Custom CSS class',
    },
    children: {
      control: 'text',
      description: 'Content inside the block (only for block variant)',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

// Default - Skeleton Block
export const Default: Story = {
  args: {
    variant: 'block',
  },
};

// Skeleton Block with Text
export const SkeletonBlockText: Story = {
  args: {
    variant: 'block',
    children:
      'We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness. That to secure these rights, Governments are instituted among Men, deriving their just powers from the consent of the governed.',
  },
};

// Skeleton Lines - 5 lines
export const SkeletonLines: Story = {
  args: {
    variant: 'lines',
    lines: 5,
  },
};
