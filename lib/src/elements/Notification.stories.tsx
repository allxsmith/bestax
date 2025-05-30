import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Notification, NotificationProps } from './Notification';

// Separate component for dismissible notification to comply with react-hooks/rules-of-hooks
const DismissibleNotification: React.FC<NotificationProps> = props => {
  const [isVisible, setIsVisible] = React.useState(true);
  if (!isVisible) return <p>Notification dismissed!</p>;
  return (
    <Notification {...props} hasDelete onDelete={() => setIsVisible(false)} />
  );
};

const meta: Meta<typeof Notification> = {
  title: 'Components/Notification',
  component: Notification,
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
        'black-bis',
        'black-ter',
        'grey-darker',
        'grey-dark',
        'grey',
        'grey-light',
        'grey-lighter',
        'white',
        'light',
        'dark',
      ],
    },
    isLight: { control: 'boolean' },
    hasDelete: { control: 'boolean' },
    m: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
    },
    className: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof Notification>;

export const Default: Story = {
  args: {
    children: 'This is a default notification.',
  },
};

export const Primary: Story = {
  args: {
    color: 'primary',
    children: 'This is a primary notification.',
  },
};

export const PrimaryLight: Story = {
  args: {
    color: 'primary',
    isLight: true,
    children: 'This is a light primary notification.',
  },
};

export const Success: Story = {
  args: {
    color: 'success',
    children: 'This is a success notification.',
  },
};

export const SuccessLight: Story = {
  args: {
    color: 'success',
    isLight: true,
    children: 'This is a light success notification.',
  },
};

export const Warning: Story = {
  args: {
    color: 'warning',
    children: 'This is a warning notification.',
  },
};

export const WarningLight: Story = {
  args: {
    color: 'warning',
    isLight: true,
    children: 'This is a light warning notification.',
  },
};

export const Danger: Story = {
  args: {
    color: 'danger',
    children: 'This is a danger notification.',
  },
};

export const DangerLight: Story = {
  args: {
    color: 'danger',
    isLight: true,
    children: 'This is a light danger notification.',
  },
};

export const Info: Story = {
  args: {
    color: 'info',
    children: 'This is an info notification.',
  },
};

export const InfoLight: Story = {
  args: {
    color: 'info',
    isLight: true,
    children: 'This is a light info notification.',
  },
};

export const Link: Story = {
  args: {
    color: 'link',
    children: 'This is a link notification.',
  },
};

export const LinkLight: Story = {
  args: {
    color: 'link',
    isLight: true,
    children: 'This is a light link notification.',
  },
};

export const WithDelete: Story = {
  render: (args: NotificationProps) => <DismissibleNotification {...args} />,
  args: {
    color: 'info',
    children: 'Click the delete button to dismiss this notification.',
  },
};

export const WithMargin: Story = {
  args: {
    children: 'This notification has a margin.',
    m: '4',
  },
};

export const CustomContent: Story = {
  args: {
    color: 'warning',
    children: (
      <>
        <strong>Warning!</strong> This notification contains{' '}
        <a href="#">custom content</a>.
      </>
    ),
  },
};
