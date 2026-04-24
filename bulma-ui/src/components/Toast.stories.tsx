import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Toast, ToastContainer, toast } from './Toast';
import { Button } from '../elements/Button';

const meta: Meta<typeof Toast> = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A toast notification for displaying brief messages. Wraps Snackbar with a simplified API — just a message, optional close button, no action buttons. Supports auto-dismiss, custom positioning, and programmatic API.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: 'The message to display',
    },
    type: {
      control: 'select',
      options: [
        'default',
        'success',
        'danger',
        'warning',
        'info',
        'primary',
        'link',
      ],
      description: 'The type/color of the toast',
    },
    position: {
      control: 'select',
      options: [
        'top-right',
        'top-left',
        'top-center',
        'bottom-right',
        'bottom-left',
        'bottom-center',
      ],
      description: 'Position on the screen',
    },
    duration: {
      control: 'number',
      description: 'Duration in ms before auto-close (0 = no auto-close)',
    },
    dismissible: {
      control: 'boolean',
      description: 'Whether clicking the toast dismisses it',
    },
    rounded: {
      control: 'boolean',
      description: 'Pill-shaped toast',
    },
    pauseOnHover: {
      control: 'boolean',
      description: 'Pause auto-close timer on hover',
    },
    indefinite: {
      control: 'boolean',
      description: 'Stay open until dismissed',
    },
    cancelable: {
      control: 'boolean',
      description: 'Whether the toast can be dismissed with Escape',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

/**
 * Basic toast notification.
 */
export const Default: Story = {
  render: function DefaultExample() {
    const [show, setShow] = useState(false);

    return (
      <div style={{ padding: '2rem' }}>
        <Button color="primary" onClick={() => setShow(true)} disabled={show}>
          Show Toast
        </Button>
        {show && (
          <Toast
            message="This is a toast notification"
            duration={0}
            onClose={() => setShow(false)}
          />
        )}
      </div>
    );
  },
};

/**
 * All toast type variants.
 */
export const Types: Story = {
  render: function TypesExample() {
    const [active, setActive] = useState<string | null>(null);

    const types = [
      'success',
      'danger',
      'warning',
      'info',
      'primary',
      'link',
    ] as const;

    return (
      <div style={{ padding: '2rem' }}>
        <div className="buttons">
          {types.map(type => (
            <Button
              key={type}
              color={type as any}
              onClick={() => setActive(type)}
              disabled={active !== null}
            >
              {type}
            </Button>
          ))}
        </div>
        {active && (
          <Toast
            message={`This is a ${active} toast`}
            type={active as any}
            duration={3000}
            onClose={() => setActive(null)}
          />
        )}
      </div>
    );
  },
};

/**
 * All 6 positions demonstrated.
 */
export const Positions: Story = {
  render: function PositionsExample() {
    const [activePosition, setActivePosition] = useState<string | null>(null);

    const positions = [
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ] as const;

    return (
      <div style={{ padding: '2rem' }}>
        <div className="buttons">
          {positions.map(pos => (
            <Button
              key={pos}
              onClick={() => setActivePosition(pos)}
              disabled={activePosition !== null}
            >
              {pos}
            </Button>
          ))}
        </div>
        {activePosition && (
          <Toast
            message={`Toast at ${activePosition}`}
            position={activePosition as any}
            duration={3000}
            onClose={() => setActivePosition(null)}
          />
        )}
      </div>
    );
  },
};

/**
 * Pill-shaped toast.
 */
export const Rounded: Story = {
  render: function RoundedExample() {
    const [show, setShow] = useState(false);

    return (
      <div style={{ padding: '2rem' }}>
        <Button color="primary" onClick={() => setShow(true)} disabled={show}>
          Show Rounded Toast
        </Button>
        {show && (
          <Toast
            message="This toast is pill-shaped"
            type="info"
            rounded
            duration={0}
            onClose={() => setShow(false)}
          />
        )}
      </div>
    );
  },
};

/**
 * Indefinite toast stays until dismissed.
 */
export const Indefinite: Story = {
  render: function IndefiniteExample() {
    const [show, setShow] = useState(false);

    return (
      <div style={{ padding: '2rem' }}>
        <Button color="primary" onClick={() => setShow(true)} disabled={show}>
          Show Indefinite Toast
        </Button>
        <p className="mt-4 help">
          This toast stays open until you click the close button or press Escape
        </p>
        {show && (
          <Toast
            message="This won't auto-dismiss"
            indefinite
            onClose={() => setShow(false)}
          />
        )}
      </div>
    );
  },
};

/**
 * Hover over the toast to pause the auto-close timer.
 */
export const PauseOnHover: Story = {
  render: function PauseExample() {
    const [show, setShow] = useState(false);

    return (
      <div style={{ padding: '2rem' }}>
        <Button color="primary" onClick={() => setShow(true)} disabled={show}>
          Show 5-second Toast
        </Button>
        <p className="mt-4 help">Hover over the toast to pause the timer</p>
        {show && (
          <Toast
            message="Hover to pause this toast"
            type="info"
            duration={5000}
            pauseOnHover
            onClose={() => setShow(false)}
          />
        )}
      </div>
    );
  },
};

/**
 * Non-dismissible toast — clicking it does nothing. Use `toast.close(id)` to dismiss programmatically.
 */
export const NonDismissible: Story = {
  render: function NonDismissibleExample() {
    const [toastId, setToastId] = useState<string | null>(null);

    return (
      <div style={{ padding: '2rem' }}>
        <ToastContainer position="top-right" />
        <div className="buttons">
          <Button
            color="primary"
            onClick={() => {
              const id = toast.show({
                message: 'This toast cannot be clicked away',
                type: 'info',
                dismissible: false,
                indefinite: true,
                cancelable: false,
              });
              setToastId(id);
            }}
            disabled={toastId !== null}
          >
            Show Non-Dismissible Toast
          </Button>
          <Button
            color="danger"
            onClick={() => {
              if (toastId) {
                toast.close(toastId);
                setToastId(null);
              }
            }}
            disabled={toastId === null}
          >
            Close Programmatically
          </Button>
        </div>
        <p className="mt-4 help">
          Click the toast — nothing happens. Use the button to close it via{' '}
          <code>toast.close(id)</code>.
        </p>
      </div>
    );
  },
};

/**
 * Programmatic toast API.
 */
export const ProgrammaticAPI: Story = {
  render: function ProgrammaticExample() {
    return (
      <div style={{ padding: '2rem' }}>
        <ToastContainer position="top-right" />
        <div className="buttons">
          <Button
            onClick={() =>
              toast.show({ message: 'Default toast', duration: 3000 })
            }
          >
            Default
          </Button>
          <Button
            color="success"
            onClick={() => toast.success('Success toast!')}
          >
            Success
          </Button>
          <Button color="danger" onClick={() => toast.danger('Error toast!')}>
            Danger
          </Button>
          <Button
            color="warning"
            onClick={() => toast.warning('Warning toast!')}
          >
            Warning
          </Button>
          <Button color="info" onClick={() => toast.info('Info toast!')}>
            Info
          </Button>
          <Button color="danger" onClick={() => toast.closeAll()}>
            Close All
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * Queued toasts display one at a time (FIFO).
 */
export const QueuedToasts: Story = {
  render: function QueuedExample() {
    const [count, setCount] = useState(0);

    return (
      <div style={{ padding: '2rem' }}>
        <ToastContainer position="top-right" />
        <p className="mb-4">
          Queued toasts display one at a time. Non-queued toasts stack normally.
        </p>
        <div className="buttons">
          <Button
            color="primary"
            onClick={() => {
              toast.show({
                message: 'Queued toast 1 of 3',
                queue: true,
                duration: 2000,
              });
              toast.show({
                message: 'Queued toast 2 of 3',
                type: 'info',
                queue: true,
                duration: 2000,
              });
              toast.show({
                message: 'Queued toast 3 of 3',
                type: 'success',
                queue: true,
                duration: 2000,
              });
            }}
          >
            Show 3 Queued Toasts
          </Button>
          <Button
            onClick={() => {
              setCount(c => c + 1);
              toast.show({
                message: `Queued toast #${count + 1}`,
                queue: true,
                duration: 3000,
              });
            }}
          >
            Add Queued
          </Button>
          <Button
            color="info"
            onClick={() =>
              toast.show({
                message: 'Non-queued (stacks normally)',
                duration: 3000,
              })
            }
          >
            Non-Queued
          </Button>
          <Button color="danger" onClick={() => toast.closeAll()}>
            Close All
          </Button>
        </div>
      </div>
    );
  },
};
