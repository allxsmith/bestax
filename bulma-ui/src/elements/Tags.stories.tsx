import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import { Tags } from './Tags';
import { Tag } from './Tag';

// Wrapper component for dismissible tag in Tags
const DismissibleTagWrapper: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  return isVisible ? (
    <Tag color="danger" isDelete onDelete={() => setIsVisible(false)} />
  ) : (
    <></>
  );
};

// Wrapper component for dismissible tag with delete tag
const DismissibleTagWithDeleteWrapper: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  return isVisible ? (
    <Tags hasAddons>
      <Tag color="danger">Allxsmith</Tag>
      <Tag isDelete onDelete={() => setIsVisible(false)} />
    </Tags>
  ) : (
    <></>
  );
};

const meta: Meta<typeof Tags> = {
  title: 'Elements/Tags',
  component: Tags,
  tags: ['autodocs'],
  argTypes: {
    hasAddons: { control: 'boolean' },
    isMultiline: { control: 'boolean' },
    m: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
    },
    className: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof Tags>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Tag>Tag 1</Tag>
        <Tag>Tag 2</Tag>
        <Tag>Tag 3</Tag>
      </>
    ),
  },
};

export const Addons: Story = {
  args: {
    hasAddons: true,
    children: (
      <>
        <Tag color="primary">Primary</Tag>
        <Tag color="success">Success</Tag>
      </>
    ),
  },
};

export const Multiline: Story = {
  args: {
    isMultiline: true,
    children: (
      <>
        {Array.from({ length: 100 }, (_, i) => (
          <Tag key={i}>Tag {i + 1}</Tag>
        ))}
      </>
    ),
  },
};

export const WithMargin: Story = {
  args: {
    m: '4',
    children: (
      <>
        <Tag>Tag 1</Tag>
        <Tag>Tag 2</Tag>
      </>
    ),
  },
};

export const MixedTags: Story = {
  render: args => (
    <Tags {...args} isMultiline hasAddons={false}>
      <Tag color="primary" size="medium">
        Primary Medium
      </Tag>
      <Tag color="success" isRounded>
        Success Rounded
      </Tag>
      <DismissibleTagWrapper />
      <Tag color="info">Info</Tag>
    </Tags>
  ),
};

export const AddonsWithDeleteTag: Story = {
  render: () => <DismissibleTagWithDeleteWrapper />,
  parameters: {
    docs: {
      description: {
        story:
          'Shows a Tags container with has-addons, containing a danger tag with text "Alex Smith" and a dismissible delete tag.',
      },
    },
  },
};

export const CompoundUsage: Story = {
  render: () => (
    <Tags>
      <Tags.Tag color="primary">React</Tags.Tag>
      <Tags.Tag color="info">TypeScript</Tags.Tag>
      <Tags.Tag color="success">Bulma</Tags.Tag>
    </Tags>
  ),
};
