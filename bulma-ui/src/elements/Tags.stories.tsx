import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import { Tags } from './Tags';
import { Tag } from './Tag';
import { Delete } from './Delete';

// Wrapper component for dismissible tag in Tags
const DismissibleTagWrapper: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  return isVisible ? (
    <Tag color="danger">
      Danger
      <Delete
        size="small"
        ariaLabel="Remove Danger"
        onClick={() => setIsVisible(false)}
      />
    </Tag>
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
      <Tag
        isDelete
        aria-label="Remove Allxsmith"
        onDelete={() => setIsVisible(false)}
      />
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
    size: { control: 'select', options: ['medium', 'large'] },
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

export const ManyTags: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tags wrap onto multiple lines by default — no prop is needed to enable it.',
      },
    },
  },
  args: {
    children: (
      <>
        {Array.from({ length: 100 }, (_, i) => (
          <Tag key={i}>Tag {i + 1}</Tag>
        ))}
      </>
    ),
  },
};

export const Sizes: Story = {
  render: () => (
    <>
      <Tags size="medium">
        <Tag color="primary">Medium</Tag>
        <Tag color="info">Medium</Tag>
      </Tags>
      <Tags size="large">
        <Tag color="primary">Large</Tag>
        <Tag color="info">Large</Tag>
      </Tags>
    </>
  ),
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
    <Tags {...args} hasAddons={false}>
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
          'Shows a Tags container with has-addons, containing a danger tag with text "Allxsmith" and a delete tag named "Remove Allxsmith" that removes it.',
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
