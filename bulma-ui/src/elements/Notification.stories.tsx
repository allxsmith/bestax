import React from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import {
  Notification,
  NotificationProps,
  NotificationContainer,
  notification,
} from './Notification';
import { Button } from './Button';

// Separate component for dismissible notification to comply with react-hooks/rules-of-hooks
const DismissibleNotification: React.FC<NotificationProps> = props => {
  const [isVisible, setIsVisible] = React.useState(true);
  if (!isVisible) return <p>Notification dismissed!</p>;
  return (
    <Notification {...props} hasDelete onDelete={() => setIsVisible(false)} />
  );
};

const meta: Meta<typeof Notification> = {
  title: 'Elements/Notification',
  component: Notification,
  tags: ['autodocs'],
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

/**
 * Programmatic notification API.
 */
export const ProgrammaticAPI: Story = {
  render: function ProgrammaticExample() {
    return (
      <div style={{ padding: '2rem' }}>
        <NotificationContainer position="top-right" />
        <div className="buttons">
          <Button
            color="success"
            onClick={() => notification.success('Changes saved!')}
          >
            Success
          </Button>
          <Button
            color="danger"
            onClick={() => notification.danger('Something went wrong!')}
          >
            Danger
          </Button>
          <Button
            color="warning"
            onClick={() => notification.warning('Check your input')}
          >
            Warning
          </Button>
          <Button
            color="info"
            onClick={() => notification.info('New update available')}
          >
            Info
          </Button>
          <Button
            onClick={() =>
              notification.show({
                message: 'Custom notification',
                color: 'primary',
                isLight: true,
                duration: 5000,
              })
            }
          >
            Custom
          </Button>
          <Button color="danger" onClick={() => notification.closeAll()}>
            Close All
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * Queued notifications display one at a time.
 */
export const QueuedNotifications: Story = {
  render: function QueuedExample() {
    return (
      <div style={{ padding: '2rem' }}>
        <NotificationContainer position="top-right" />
        <p className="mb-4">Queued notifications display one at a time.</p>
        <div className="buttons">
          <Button
            color="primary"
            onClick={() => {
              notification.show({
                message: 'Queued 1 of 3',
                color: 'info',
                queue: true,
                duration: 2000,
              });
              notification.show({
                message: 'Queued 2 of 3',
                color: 'success',
                queue: true,
                duration: 2000,
              });
              notification.show({
                message: 'Queued 3 of 3',
                color: 'warning',
                queue: true,
                duration: 2000,
              });
            }}
          >
            Show 3 Queued
          </Button>
          <Button
            onClick={() =>
              notification.show({
                message: 'Non-queued (stacks)',
                duration: 3000,
              })
            }
          >
            Non-Queued
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * Different positions for programmatic notifications.
 */
export const Positions: Story = {
  render: function PositionsExample() {
    const [pos, setPos] = React.useState<
      | 'top-left'
      | 'top'
      | 'top-right'
      | 'bottom-left'
      | 'bottom'
      | 'bottom-right'
    >('top-right');

    return (
      <div style={{ padding: '2rem' }}>
        <NotificationContainer position={pos} />
        <div className="buttons">
          {(
            [
              'top-left',
              'top',
              'top-right',
              'bottom-left',
              'bottom',
              'bottom-right',
            ] as const
          ).map(p => (
            <Button
              key={p}
              color={pos === p ? 'primary' : undefined}
              onClick={() => {
                setPos(p);
                notification.closeAll();
                notification.info(`Position: ${p}`, { duration: 3000 });
              }}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>
    );
  },
};
