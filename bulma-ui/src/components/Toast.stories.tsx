import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  Toast,
  ToastContainer,
  toast,
  type ToastPosition,
  type ToastType,
} from './Toast';
import { Button } from '../elements/Button';

const meta: Meta<typeof Toast> = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A toast notification with optional action and cancel buttons. Supports 6 positions, `type` (colors background), `actionType` (colors action button), pause-on-hover, indefinite mode, click-to-dismiss, an explicit close button via `closable`, and a programmatic API.',
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
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
      ],
      description: 'Colors the toast BACKGROUND',
    },
    actionType: {
      control: 'select',
      options: [
        undefined,
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
      ],
      description: 'Colors the action BUTTON text',
    },
    position: {
      control: 'select',
      options: [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ],
      description: 'Position on screen (default: top-right)',
    },
    duration: {
      control: 'number',
      description: 'Duration in ms before auto-close (0 = no auto-close)',
    },
    indefinite: {
      control: 'boolean',
      description: 'Stay open until dismissed',
    },
    pauseOnHover: {
      control: 'boolean',
      description: 'Pause auto-close timer on hover',
    },
    dismissible: {
      control: 'boolean',
      description: 'Whether clicking the toast dismisses it',
    },
    closable: {
      control: 'boolean',
      description: 'Show an explicit close (X) button',
    },
    rounded: {
      control: 'boolean',
      description: 'Pill-shaped toast',
    },
    actionText: {
      control: 'text',
      description: 'Text for action button',
    },
    cancelText: {
      control: 'text',
      description: 'Text for cancel button',
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
 * `type` colors the toast background.
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
              color={type}
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
            type={active as ToastType}
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
            position={activePosition as ToastPosition}
            duration={3000}
            onClose={() => setActivePosition(null)}
          />
        )}
      </div>
    );
  },
};

/**
 * Toast with an action button. `actionType` colors the action button text.
 */
export const WithActionButton: Story = {
  render: function ActionExample() {
    const [current, setCurrent] = useState<string | null>(null);

    const types = [
      'primary',
      'link',
      'info',
      'success',
      'warning',
      'danger',
    ] as const;

    return (
      <div style={{ padding: '2rem' }}>
        <p className="mb-4">
          The <code>actionType</code> prop colors the{' '}
          <strong>action button</strong>:
        </p>
        <div className="buttons">
          {types.map(t => (
            <Button
              key={t}
              color={t}
              onClick={() => setCurrent(t)}
              disabled={current !== null}
            >
              actionType=&quot;{t}&quot;
            </Button>
          ))}
        </div>
        {current && (
          <Toast
            message={`Action button is ${current}-colored`}
            actionType={current as ToastType}
            actionText="Action"
            onAction={() => {}}
            duration={3000}
            onClose={() => setCurrent(null)}
          />
        )}
      </div>
    );
  },
};

/**
 * Toast with both cancel and action buttons.
 */
export const WithCancelButton: Story = {
  render: function CancelExample() {
    const [show, setShow] = useState(false);

    return (
      <div style={{ padding: '2rem' }}>
        <Button color="primary" onClick={() => setShow(true)} disabled={show}>
          Show Toast with Cancel
        </Button>
        {show && (
          <Toast
            message="Are you sure you want to proceed?"
            cancelText="Cancel"
            actionText="Confirm"
            actionType="danger"
            duration={0}
            onAction={() => {}}
            onClose={() => setShow(false)}
          />
        )}
      </div>
    );
  },
};

/**
 * Toast with an explicit close (X) button.
 */
export const Closable: Story = {
  render: function ClosableExample() {
    const [show, setShow] = useState(false);

    return (
      <div style={{ padding: '2rem' }}>
        <Button color="primary" onClick={() => setShow(true)} disabled={show}>
          Show Closable Toast
        </Button>
        {show && (
          <Toast
            message="This toast has a close button"
            closable
            duration={0}
            onClose={() => setShow(false)}
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
          This toast stays open until you click it or press Escape
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
          <Button
            onClick={() =>
              toast.show({
                message: 'File moved to trash',
                actionText: 'Undo',
                actionType: 'info',
                onAction: () => toast.success('File restored'),
              })
            }
          >
            With Action
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
