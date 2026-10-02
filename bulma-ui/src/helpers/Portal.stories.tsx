import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Portal } from './portal';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Notification } from '../elements/Notification';

const meta: Meta<typeof Portal> = {
  title: 'Helpers/Portal',
  component: Portal,
  parameters: {
    docs: {
      description: {
        component:
          'Renders its children into another part of the page, `document.body` unless `container` says otherwise. Renders nothing on the server and during hydration, then portals in the commit that follows.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    container: {
      control: 'text',
      description:
        'An element or a `document.querySelector` selector to render into. Omitted, empty, or matching nothing, the content goes to `document.body`.',
    },
    disabled: {
      control: 'boolean',
      description:
        'Render the children in place instead, on the server as well as the client.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Portal>;

/**
 * The box clips anything that overflows it. The notification inside `Portal`
 * is rendered at the end of `document.body` instead, below the story, so the
 * clipping never reaches it. Turn on `disabled` to render it in place.
 */
export const Default: Story = {
  args: { disabled: false },
  render: args => (
    <Box overflow="clipped">
      <p>This box clips its overflow (Bulma&apos;s is-clipped).</p>
      <Portal {...args}>
        <Notification color="info" mt="4">
          Rendered through a portal, outside the box.
        </Notification>
      </Portal>
    </Box>
  ),
};

const IntoAContainerDemo = () => {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  return (
    <>
      <Box>
        <p>The portal below is declared in this box.</p>
        {target && (
          <Portal container={target}>
            <Notification color="success">
              It renders into the section further down the page.
            </Notification>
          </Portal>
        )}
      </Box>
      <section ref={setTarget} aria-label="Overlay root" />
    </>
  );
};

/**
 * `container` takes an element (here, one held in state from a ref callback)
 * or a selector, such as the id of an overlay root in your page shell.
 */
export const IntoAContainer: Story = {
  render: () => <IntoAContainerDemo />,
};

const MountingDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(o => !o)}>
        {open ? 'Remove' : 'Add'} portaled content
      </Button>
      {open && (
        <Portal>
          <Notification color="warning" mt="4">
            Unmounting the portal removes its content from `document.body`.
          </Notification>
        </Portal>
      )}
    </>
  );
};

/** Content mounts and unmounts with the portal that renders it. */
export const Mounting: Story = {
  render: () => <MountingDemo />,
};
