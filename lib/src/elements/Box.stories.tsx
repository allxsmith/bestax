import { Meta, StoryObj } from '@storybook/react';
import Box from './Box';

// Define the meta configuration for Storybook
const meta: Meta<typeof Box> = {
  title: 'Components/Box',
  component: Box,
  argTypes: {
    padding: {
      control: 'text',
      description: 'Bulma padding class (e.g., p-5)',
    },
    margin: {
      control: 'text',
      description: 'Bulma margin class (e.g., m-4)',
    },
    backgroundColor: {
      control: 'text',
      description: 'Bulma background color class (e.g., has-background-white)',
    },
    hasShadow: {
      control: 'boolean',
      description: 'Toggle box shadow',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    children: {
      control: 'text',
      description: 'Content inside the box',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Box>;

// Default story
export const Default: Story = {
  args: {
    children: 'Default Box Content',
    padding: 'p-5',
    margin: 'm-4',
    backgroundColor: 'has-background-white',
    hasShadow: true,
  },
};

// Custom styling story
export const Custom: Story = {
  args: {
    children: 'Custom Styled Box',
    padding: 'p-3',
    margin: 'm-2',
    backgroundColor: 'has-background-light',
    hasShadow: false,
    className: 'custom-box',
  },
};

// No shadow story
export const NoShadow: Story = {
  args: {
    children: 'Box Without Shadow',
    hasShadow: false,
  },
};

// Different background story
export const InfoBackground: Story = {
  args: {
    children: 'Box with Info Background',
    backgroundColor: 'has-background-info-light',
  },
};
