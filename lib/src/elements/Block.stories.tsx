import { Meta, StoryObj } from '@storybook/react';
import { Block } from './Block';

const meta: Meta<typeof Block> = {
  title: 'Components/Block',
  component: Block,
  argTypes: {
    className: { control: 'text', description: 'Custom CSS class' },
    children: { control: 'text', description: 'Content inside the block' },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Block>;

export const Default: Story = {
  args: {
    children: 'This is a Bulma Block component.',
  },
};

export const WithCustomClass: Story = {
  args: {
    children: 'Block with custom styling.',
    className: 'has-background-grey-lighter has-text-centered',
  },
};

export const MultipleBlocks: Story = {
  render: () => (
    <>
      <Block>First block</Block>
      <Block>Second block</Block>
      <Block>Third block</Block>
    </>
  ),
};
