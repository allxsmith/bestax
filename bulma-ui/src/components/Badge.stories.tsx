import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { Block } from '../elements/Block';
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
    content: {
      control: 'text',
      description:
        'Count, short text, or a custom node to display; max/showZero apply only to numeric content.',
    },
    badgeClassName: {
      control: 'text',
      description: 'Additional CSS classes applied to the badge pill itself.',
    },
    max: {
      control: 'number',
      description:
        'Numeric content above this renders as "{max}+". Default 99.',
    },
    dot: {
      control: 'boolean',
      description: 'Render a small dot with no content.',
    },
    showZero: {
      control: 'boolean',
      description: 'Show the badge when content is 0. Default false.',
    },
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
      description: 'Status color. Default danger.',
    },
    position: {
      control: 'select',
      options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
      description:
        'Corner to overlay the badge on, relative to children. Ignored for standalone badges. Default top-right.',
    },
    overlap: {
      control: 'select',
      options: ['circle', 'square'],
      description:
        'Nudges the offset for a round (circle) vs rectangular (square) child. Ignored for standalone badges. Default square.',
    },
    pulse: {
      control: 'boolean',
      description:
        'Processing/pulse animation; no-ops under prefers-reduced-motion: reduce.',
    },
    invisible: {
      control: 'boolean',
      description: 'Hide the badge pill without unmounting it.',
    },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const StatusDot: Story = {
  render: function StatusDotExample() {
    return (
      <Badge dot color="success" overlap="circle">
        <Avatar name="Ada Lovelace" alt="Ada Lovelace, online" />
      </Badge>
    );
  },
};

export const UnreadCount: Story = {
  render: function UnreadCountExample() {
    return (
      <Badge content={128} max={99} color="danger">
        <Icon name="bell" ariaLabel="Notifications, 128 unread" />
      </Badge>
    );
  },
};

export const Positions: Story = {
  render: function PositionsExample() {
    return (
      <Block display="flex">
        <Badge content={1} position="top-right" mr="5">
          <Avatar name="A" alt="A, 1 new message" shape="square" />
        </Badge>
        <Badge content={2} position="top-left" mr="5">
          <Avatar name="B" alt="B, 2 new messages" shape="square" />
        </Badge>
        <Badge content={3} position="bottom-right" mr="5">
          <Avatar name="C" alt="C, 3 new messages" shape="square" />
        </Badge>
        <Badge content={4} position="bottom-left">
          <Avatar name="D" alt="D, 4 new messages" shape="square" />
        </Badge>
      </Block>
    );
  },
};

export const Pulse: Story = {
  render: function PulseExample() {
    return (
      <Badge dot color="success" pulse overlap="circle">
        <Avatar name="Ada Lovelace" alt="Ada Lovelace, syncing" />
      </Badge>
    );
  },
};

export const ZeroHiddenByDefault: Story = {
  render: function ZeroHiddenExample() {
    return (
      <Block display="flex">
        <Badge content={0} mr="5">
          <Icon name="bell" ariaLabel="Notifications, none unread" />
        </Badge>
        <Badge content={0} showZero>
          <Icon name="bell" ariaLabel="Notifications, none unread" />
        </Badge>
      </Block>
    );
  },
};

export const Standalone: Story = {
  render: function StandaloneExample() {
    return (
      <Block display="flex" alignItems="center">
        <Badge content={5} color="info" mr="2" />
        <span>new messages</span>
      </Block>
    );
  },
};

export const StandaloneInteractive: Story = {
  render: function StandaloneInteractiveExample() {
    const [clicks, setClicks] = useState(0);
    return (
      <Badge content={clicks} showZero onClick={() => setClicks(c => c + 1)} />
    );
  },
};

export const StandalonePulse: Story = {
  render: function StandalonePulseExample() {
    return (
      <Block display="flex" alignItems="center">
        <Badge content={5} color="danger" pulse mr="2" />
        <span>new alerts</span>
      </Block>
    );
  },
};

export const TextChild: Story = {
  render: function TextChildExample() {
    return (
      <Badge content={3} color="primary">
        Inbox
      </Badge>
    );
  },
};

export const CustomNodeContent: Story = {
  render: function CustomNodeExample() {
    return (
      <Badge content={<Icon name="check" />} color="success">
        <Avatar name="Ada Lovelace" alt="Ada Lovelace, verified" />
      </Badge>
    );
  },
};

export const StringContent: Story = {
  render: function StringContentExample() {
    return (
      <Badge content="NEW" color="primary">
        <Icon name="envelope" ariaLabel="Messages, new" />
      </Badge>
    );
  },
};

export const StandaloneDot: Story = {
  render: function StandaloneDotExample() {
    return (
      <Block display="flex" alignItems="center">
        <Badge dot color="success" mr="2" />
        <span>Online</span>
      </Block>
    );
  },
};

export const Invisible: Story = {
  render: function InvisibleExample() {
    return (
      <Block display="flex">
        <Badge content={4} color="danger" mr="5">
          <Icon name="bell" ariaLabel="Notifications, 4 unread" />
        </Badge>
        <Badge content={4} color="danger" invisible>
          <Icon name="bell" ariaLabel="Notifications, 4 unread" />
        </Badge>
      </Block>
    );
  },
};
