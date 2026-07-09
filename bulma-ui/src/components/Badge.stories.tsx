import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { Icon } from '../elements/Icon';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A small status/count indicator overlaid on the corner of another element (or standalone).',
      },
    },
  },
  argTypes: {
    content: { control: 'text' },
    max: { control: 'number' },
    dot: { control: 'boolean' },
    showZero: { control: 'boolean' },
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
    position: {
      control: 'select',
      options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
    },
    overlap: {
      control: 'select',
      options: ['circle', 'square'],
    },
    pulse: { control: 'boolean' },
    invisible: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const StatusDot: Story = {
  render: function StatusDotExample() {
    return (
      <Badge dot color="success" overlap="circle">
        <Avatar name="Ada Lovelace" />
      </Badge>
    );
  },
};

export const UnreadCount: Story = {
  render: function UnreadCountExample() {
    return (
      <Badge content={128} max={99} color="danger">
        <Icon name="bell" />
      </Badge>
    );
  },
};

export const Positions: Story = {
  render: function PositionsExample() {
    return (
      <div style={{ display: 'flex', gap: '2rem' }}>
        <Badge content={1} position="top-right">
          <Avatar name="A" shape="square" />
        </Badge>
        <Badge content={2} position="top-left">
          <Avatar name="B" shape="square" />
        </Badge>
        <Badge content={3} position="bottom-right">
          <Avatar name="C" shape="square" />
        </Badge>
        <Badge content={4} position="bottom-left">
          <Avatar name="D" shape="square" />
        </Badge>
      </div>
    );
  },
};

export const Pulse: Story = {
  render: function PulseExample() {
    return (
      <Badge dot color="success" pulse overlap="circle">
        <Avatar name="Processing" />
      </Badge>
    );
  },
};

export const ZeroHiddenByDefault: Story = {
  render: function ZeroHiddenExample() {
    return (
      <div style={{ display: 'flex', gap: '2rem' }}>
        <Badge content={0}>
          <Icon name="bell" />
        </Badge>
        <Badge content={0} showZero>
          <Icon name="bell" />
        </Badge>
      </div>
    );
  },
};

export const Standalone: Story = {
  render: function StandaloneExample() {
    return <Badge content={5} color="info" />;
  },
};

export const CustomNodeContent: Story = {
  render: function CustomNodeExample() {
    return (
      <Badge content={<Icon name="check" />} color="success">
        <Avatar name="Ada Lovelace" />
      </Badge>
    );
  },
};
