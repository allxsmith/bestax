import { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box'; // Adjust the import path based on your project structure

// Meta configuration for the Box component
const meta: Meta<typeof Box> = {
  title: 'Components/Box',
  component: Box,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    textColor: {
      control: 'select',
      options: [
        'primary',
        'info',
        'success',
        'warning',
        'danger',
        'light',
        'dark',
        'inherit',
        'current',
      ],
      description: 'Text color using Bulma has-text-* classes',
    },
    bgColor: {
      control: 'select',
      options: [
        'primary',
        'info',
        'success',
        'warning',
        'danger',
        'light',
        'dark',
        'inherit',
        'current',
      ],
      description: 'Background color using Bulma has-background-* classes',
    },
    hasShadow: {
      control: 'boolean',
      description: 'Toggles the box shadow (is-shadowless when false)',
    },
    m: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
      description: 'Margin size using Bulma m-* classes',
    },
    p: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
      description: 'Padding size using Bulma p-* classes',
    },
    textAlign: {
      control: 'select',
      options: ['centered', 'justified', 'left', 'right'],
      description: 'Text alignment using Bulma has-text-* classes',
    },
    className: {
      control: 'text',
      description: 'Custom CSS class',
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
    children: 'Default Box',
  },
};

// Box with primary text color
export const PrimaryText: Story = {
  args: {
    children: 'Box with Primary Text',
    textColor: 'primary',
  },
};

// Box with light background
export const LightBackground: Story = {
  args: {
    children: 'Box with Light Background',
    bgColor: 'grey-light',
  },
};

// Box without shadow
export const NoShadow: Story = {
  args: {
    children: 'Box without Shadow',
    hasShadow: false,
  },
};

// Box with spacing and alignment
export const SpacedAndAligned: Story = {
  args: {
    children: 'Box with Margin, Padding, and Centered Text',
    m: '4',
    p: '4',
    textAlign: 'centered',
  },
};

// Box with custom class
export const CustomClass: Story = {
  args: {
    children: 'Box with Custom Class',
    className: 'custom-box-class',
  },
};

// Box with viewport-specific text color
export const ViewportSpecific: Story = {
  args: {
    children: 'Box with Tablet-specific Primary Text',
    textColor: 'primary',
    viewport: 'tablet',
  },
};

// Interactive box with multiple props
export const Interactive: Story = {
  args: {
    children: 'Interactive Box',
    textColor: 'success',
    bgColor: 'black',
    m: '3',
    p: '3',
    textAlign: 'right',
    hasShadow: true,
  },
};
