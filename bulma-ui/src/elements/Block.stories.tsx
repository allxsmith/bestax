import { Meta, StoryObj } from '@storybook/react-vite';
import { Block } from './Block'; // Adjust the import path based on your project structure

// Meta configuration for the Block component
const meta: Meta<typeof Block> = {
  title: 'Elements/Block',
  component: Block,
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
      description: 'Content inside the block',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Block>;

// Default story
export const Default: Story = {
  args: {
    children: 'Default Block',
  },
};

// Block with primary text color
export const PrimaryText: Story = {
  args: {
    children: 'Block with Primary Text',
    textColor: 'primary',
  },
};

// Block with light background
export const LightBackground: Story = {
  args: {
    children: 'Block with Light Background',
    bgColor: 'light',
  },
};

// Block with spacing and alignment
export const SpacedAndAligned: Story = {
  args: {
    children: 'Block with Margin, Padding, and Centered Text',
    m: '4',
    p: '4',
    textAlign: 'centered',
  },
};

// Block with custom class
export const CustomClass: Story = {
  args: {
    children: 'Block with Custom Class',
    className: 'custom-block-class',
  },
};

// Block with viewport-specific text color
export const ViewportSpecific: Story = {
  args: {
    children: 'Block with Tablet-specific Primary Text',
    textColor: 'primary',
    viewport: 'tablet',
  },
};

// Interactive block with multiple props
export const Interactive: Story = {
  args: {
    children: 'Interactive Block',
    textColor: 'success',
    bgColor: 'dark',
    m: '3',
    p: '3',
    textAlign: 'right',
  },
};

// Multiple stacked blocks to show margin-bottom spacing
export const StackedBlocks: Story = {
  args: {
    children: 'Block',
  },
  render: args => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <Block {...args} bgColor="primary" textColor="white">
        First Block
      </Block>
      <Block {...args} bgColor="info" textColor="white">
        Second Block
      </Block>
      <Block {...args} bgColor="success" textColor="white">
        Third Block
      </Block>
      <Block {...args} bgColor="warning" textColor="black">
        Fourth Block
      </Block>
    </div>
  ),
};
