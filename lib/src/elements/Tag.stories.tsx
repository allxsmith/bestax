import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { within, userEvent } from '@storybook/test';
import { Tag, TagProps } from './Tag';
import { Tags } from './Tags';
import { Delete } from './Delete';

// Wrapper component for dismissible tag
const DismissibleTagWrapper: React.FC<TagProps> = props => {
  const [isVisible, setIsVisible] = useState(true);
  return isVisible ? (
    <Tag {...props} onDelete={() => setIsVisible(false)} />
  ) : (
    <></>
  );
};

// Wrapper component for combined tag with Delete
const CombinedTagWithDeleteWrapper: React.FC<TagProps> = props => {
  const [isVisible, setIsVisible] = useState(true);
  return isVisible ? (
    <Tags hasAddons>
      <Tag {...props}>
        Tag with Delete
        <Delete onClick={() => setIsVisible(false)} />
      </Tag>
    </Tags>
  ) : (
    <></>
  );
};

const meta: Meta<typeof Tag> = {
  title: 'Components/Tag',
  component: Tag,
  argTypes: {
    color: {
      control: 'select',
      options: [
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'black',
        'dark',
        'light',
        'white',
      ],
    },
    size: {
      control: 'select',
      options: ['normal', 'medium', 'large'],
    },
    isRounded: { control: 'boolean' },
    isDelete: { control: 'boolean' },
    isHoverable: { control: 'boolean' },
    m: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
    },
    className: { control: 'text' },
  },
  decorators: [
    Story => (
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: {
    children: 'Default Tag',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary Tag',
    color: 'primary',
  },
};

export const Medium: Story = {
  args: {
    children: 'Medium Tag',
    size: 'medium',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Tag',
    size: 'large',
  },
};

export const Rounded: Story = {
  args: {
    children: 'Rounded Tag',
    isRounded: true,
  },
};

export const DeleteTag: Story = {
  render: args => <DismissibleTagWrapper {...args} isDelete />,
};

export const WithMargin: Story = {
  args: {
    children: 'Tag with Margin',
    m: '4',
  },
};

export const Combined: Story = {
  args: {
    children: 'Combined Tag',
    color: 'success',
    size: 'medium',
    isRounded: true,
    m: '2',
  },
};

export const Colors: Story = {
  render: () => (
    <>
      {[
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'black',
        'dark',
        'light',
        'white',
      ].map(color => (
        <Tag key={color} color={color as TagProps['color']} isHoverable>
          {color.charAt(0).toUpperCase() + color.slice(1)}
        </Tag>
      ))}
    </>
  ),
};

export const SizesTogether: Story = {
  render: () => (
    <>
      {['primary', 'success', 'danger'].map(color => (
        <div key={color} style={{ display: 'flex', gap: '10px' }}>
          <Tag color={color as TagProps['color']} size="normal" isHoverable>
            {color.charAt(0).toUpperCase() + color.slice(1)} Normal
          </Tag>
          <Tag color={color as TagProps['color']} size="medium" isHoverable>
            {color.charAt(0).toUpperCase() + color.slice(1)} Medium
          </Tag>
          <Tag color={color as TagProps['color']} size="large" isHoverable>
            {color.charAt(0).toUpperCase() + color.slice(1)} Large
          </Tag>
        </div>
      ))}
    </>
  ),
};

export const HoverState: Story = {
  args: {
    children: 'Hoverable Tag',
    color: 'primary',
    isHoverable: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tag = canvas.getByText('Hoverable Tag');
    await userEvent.hover(tag);
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the hover state with the is-hoverable class. Hover to see a slight opacity and scale change.',
      },
    },
  },
};

export const TagWithDelete: Story = {
  render: args => (
    <CombinedTagWithDeleteWrapper {...args} color="primary" size="medium" />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows a tag with a Delete component, dismissible when the delete button is clicked.',
      },
    },
  },
};
