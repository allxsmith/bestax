import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Snackbar, SnackbarContainer, snackbar } from './Snackbar';
import { Button } from '../elements/Button';

const meta: Meta<typeof Snackbar> = {
  title: 'Components/Snackbar',
  component: Snackbar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A snackbar notification with optional action and cancel buttons. Supports 6 positions, `type` (colors action button), `color` (colors background), pause-on-hover, indefinite mode, and programmatic API.',
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
      description: 'Colors the action BUTTON',
    },
    color: {
      control: 'select',
      options: [
        undefined,
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'dark',
        'light',
      ],
      description: 'Colors the snackbar BACKGROUND',
    },
    position: {
      control: 'select',
      options: [
        'top-left',
        'top',
        'top-right',
        'bottom-left',
        'bottom',
        'bottom-right',
      ],
      description: 'Position on screen (default: bottom-right)',
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
      description: 'Whether the snackbar can be dismissed with Escape',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Snackbar>;

/**
 * Basic snackbar notification at bottom-right.
 */
export const Default: Story = {
  render: function DefaultExample() {
    const [show, setShow] = useState(false);

    return (
      <div style={{ padding: '2rem' }}>
        <Button color="primary" onClick={() => setShow(true)} disabled={show}>
          Show Snackbar
        </Button>
        {show && (
          <Snackbar
            message="This is a snackbar message"
            duration={0}
            onClose={() => setShow(false)}
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
    const [position, setPosition] = useState<string | null>(null);

    const positions = [
      'top-left',
      'top',
      'top-right',
      'bottom-left',
      'bottom',
      'bottom-right',
    ] as const;

    return (
      <div style={{ padding: '2rem' }}>
        <div className="buttons">
          {positions.map(pos => (
            <Button
              key={pos}
              onClick={() => setPosition(pos)}
              disabled={position !== null}
            >
              {pos}
            </Button>
          ))}
        </div>
        {position && (
          <Snackbar
            message={`Snackbar at ${position}`}
            position={position as any}
            actionText="OK"
            onAction={() => {}}
            duration={3000}
            onClose={() => setPosition(null)}
          />
        )}
      </div>
    );
  },
};

/**
 * `type` prop colors the action button text, NOT the background.
 */
export const TypeColorsActionButton: Story = {
  render: function TypeExample() {
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
          The <code>type</code> prop colors the <strong>action button</strong>:
        </p>
        <div className="buttons">
          {types.map(type => (
            <Button
              key={type}
              color={type as any}
              onClick={() => setCurrent(type)}
              disabled={current !== null}
            >
              type="{type}"
            </Button>
          ))}
        </div>
        {current && (
          <Snackbar
            message={`Action button is ${current}-colored`}
            type={current as any}
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
 * `color` prop colors the snackbar background.
 */
export const ColorColorsBackground: Story = {
  render: function ColorExample() {
    const [current, setCurrent] = useState<string | null>(null);

    const colors = [
      'primary',
      'link',
      'info',
      'success',
      'warning',
      'danger',
      'dark',
    ] as const;

    return (
      <div style={{ padding: '2rem' }}>
        <p className="mb-4">
          The <code>color</code> prop colors the <strong>background</strong>:
        </p>
        <div className="buttons">
          {colors.map(color => (
            <Button
              key={color}
              color={color as any}
              onClick={() => setCurrent(color)}
              disabled={current !== null}
            >
              color="{color}"
            </Button>
          ))}
        </div>
        {current && (
          <Snackbar
            message={`Background is ${current}`}
            color={current as any}
            actionText="OK"
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
 * Snackbar with a close button (dismissible) and no action/cancel buttons.
 */
export const DismissibleSnackbar: Story = {
  render: function DismissibleExample() {
    const [show, setShow] = useState(false);

    return (
      <div style={{ padding: '2rem' }}>
        <Button color="primary" onClick={() => setShow(true)} disabled={show}>
          Show Dismissible Snackbar
        </Button>
        {show && (
          <Snackbar
            message="This snackbar has a close button"
            dismissible
            duration={0}
            onClose={() => setShow(false)}
          />
        )}
      </div>
    );
  },
};

/**
 * Pill-shaped snackbar with rounded corners.
 */
export const RoundedSnackbar: Story = {
  render: function RoundedExample() {
    const [show, setShow] = useState(false);

    return (
      <div style={{ padding: '2rem' }}>
        <Button color="primary" onClick={() => setShow(true)} disabled={show}>
          Show Rounded Snackbar
        </Button>
        {show && (
          <Snackbar
            message="This snackbar is pill-shaped"
            rounded
            actionText="OK"
            onAction={() => {}}
            duration={0}
            onClose={() => setShow(false)}
          />
        )}
      </div>
    );
  },
};

/**
 * Snackbar with both cancel and action buttons.
 */
export const WithCancelButton: Story = {
  render: function CancelExample() {
    const [show, setShow] = useState(false);

    return (
      <div style={{ padding: '2rem' }}>
        <Button color="primary" onClick={() => setShow(true)} disabled={show}>
          Show Snackbar with Cancel
        </Button>
        {show && (
          <Snackbar
            message="Are you sure you want to proceed?"
            cancelText="Cancel"
            actionText="Confirm"
            type="danger"
            onAction={() => {}}
            duration={0}
            onClose={() => setShow(false)}
          />
        )}
      </div>
    );
  },
};

/**
 * Indefinite snackbar stays until dismissed.
 */
export const Indefinite: Story = {
  render: function IndefiniteExample() {
    const [show, setShow] = useState(false);

    return (
      <div style={{ padding: '2rem' }}>
        <Button color="primary" onClick={() => setShow(true)} disabled={show}>
          Show Indefinite Snackbar
        </Button>
        <p className="mt-4 help">
          This snackbar stays open until you click the action or press Escape
        </p>
        {show && (
          <Snackbar
            message="This won't auto-dismiss"
            indefinite
            actionText="Dismiss"
            onAction={() => {}}
            onClose={() => setShow(false)}
          />
        )}
      </div>
    );
  },
};

/**
 * Hover over the snackbar to pause the auto-close timer.
 */
export const PauseOnHover: Story = {
  render: function PauseExample() {
    const [show, setShow] = useState(false);

    return (
      <div style={{ padding: '2rem' }}>
        <Button color="primary" onClick={() => setShow(true)} disabled={show}>
          Show 5-second Snackbar
        </Button>
        <p className="mt-4 help">Hover over the snackbar to pause the timer</p>
        {show && (
          <Snackbar
            message="Hover to pause this snackbar"
            type="info"
            actionText="OK"
            onAction={() => {}}
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
 * Programmatic snackbar API.
 */
export const ProgrammaticAPI: Story = {
  render: function ProgrammaticExample() {
    return (
      <div style={{ padding: '2rem' }}>
        <SnackbarContainer />
        <div className="buttons">
          <Button
            onClick={() =>
              snackbar.show({ message: 'Default snackbar', actionText: 'OK' })
            }
          >
            Default
          </Button>
          <Button
            color="success"
            onClick={() =>
              snackbar.success('Changes saved!', { actionText: 'View' })
            }
          >
            Success
          </Button>
          <Button
            color="danger"
            onClick={() =>
              snackbar.danger('Failed to save', { actionText: 'Retry' })
            }
          >
            Danger
          </Button>
          <Button
            color="warning"
            onClick={() =>
              snackbar.warning('Check your input', { actionText: 'Review' })
            }
          >
            Warning
          </Button>
          <Button
            color="info"
            onClick={() =>
              snackbar.info('New update available', { actionText: 'Update' })
            }
          >
            Info
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * Queued snackbars display one at a time.
 */
export const QueuedSnackbars: Story = {
  render: function QueuedExample() {
    const [count, setCount] = useState(0);

    const showMultiple = () => {
      snackbar.show({ message: 'Snackbar 1 of 3', duration: 2000 });
      snackbar.show({
        message: 'Snackbar 2 of 3',
        type: 'info',
        duration: 2000,
      });
      snackbar.show({
        message: 'Snackbar 3 of 3',
        type: 'success',
        duration: 2000,
      });
    };

    return (
      <div style={{ padding: '2rem' }}>
        <SnackbarContainer />
        <div className="buttons">
          <Button color="primary" onClick={showMultiple}>
            Show 3 Queued Snackbars
          </Button>
          <Button
            onClick={() => {
              setCount(c => c + 1);
              snackbar.show({
                message: `Queued snackbar #${count + 1}`,
                duration: 3000,
              });
            }}
          >
            Add to Queue
          </Button>
          <Button color="danger" onClick={() => snackbar.clear()}>
            Clear Queue
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * File operation feedback example.
 */
export const FileOperations: Story = {
  render: function FileOperationsExample() {
    return (
      <div style={{ padding: '2rem' }}>
        <SnackbarContainer />
        <div className="box">
          <h4 className="title is-5">File Manager</h4>
          <div className="buttons">
            <Button
              onClick={() =>
                snackbar.success('File uploaded successfully', {
                  actionText: 'View',
                  onAction: () => {},
                })
              }
            >
              Upload File
            </Button>
            <Button
              onClick={() =>
                snackbar.show({
                  message: 'File moved to trash',
                  cancelText: 'Cancel',
                  actionText: 'Undo',
                  onAction: () => snackbar.success('File restored'),
                })
              }
            >
              Delete File
            </Button>
            <Button
              onClick={() =>
                snackbar.info('Download started', {
                  actionText: 'Open',
                  duration: 2000,
                })
              }
            >
              Download
            </Button>
            <Button
              onClick={() =>
                snackbar.danger('Permission denied', {
                  actionText: 'Details',
                  duration: 5000,
                })
              }
            >
              Restricted Action
            </Button>
          </div>
        </div>
      </div>
    );
  },
};
