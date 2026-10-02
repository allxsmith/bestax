import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useFocusTrap } from './useFocusTrap';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Title } from '../elements/Title';
import { Input } from '../form/Input';

interface TrapDemoProps {
  /** Trap focus while the panel is open. */
  trapFocus?: boolean;
}

/**
 * A panel opened from a button: the shape a popover or a command palette
 * takes. The trap moves focus in, wraps Tab, and returns focus to the button.
 */
const TrapDemo = ({ trapFocus = true }: TrapDemoProps) => {
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, {
    active: open && trapFocus,
    restoreFocus: openerRef,
  });

  const close = () => setOpen(false);
  const panel = open && (
    <div
      ref={panelRef}
      id="trap-demo-panel"
      role="dialog"
      aria-labelledby="trap-demo-title"
      tabIndex={-1}
      onKeyDown={e => {
        if (e.key === 'Escape') close();
      }}
    >
      <Box mt="3">
        <Title size="5" id="trap-demo-title">
          Filter rows
        </Title>
        <Input label="Name contains" />
        <Buttons>
          <Button color="primary" onClick={close}>
            Apply
          </Button>
          <Button disabled>Export (disabled, skipped)</Button>
          <Button visibility="invisible">Invisible, skipped</Button>
          <Button onClick={close}>Cancel</Button>
        </Buttons>
      </Box>
    </div>
  );

  return (
    <>
      <Button
        ref={openerRef}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="trap-demo-panel"
        onClick={() => setOpen(o => !o)}
      >
        Filters
      </Button>
      {panel}
    </>
  );
};

const meta: Meta<typeof TrapDemo> = {
  title: 'Helpers/useFocusTrap',
  component: TrapDemo,
  parameters: {
    docs: {
      description: {
        component:
          'Keeps keyboard focus inside a container while it is active. Open the panel, then Tab past Cancel or Shift+Tab past the input: focus wraps, skipping the disabled button and the invisible one in the gap after it. Escape, Apply or Cancel closes it, and focus returns to Filters.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    trapFocus: {
      control: 'boolean',
      description:
        'Passed as `active` (with the open state). Off, Tab walks out of the panel into the page.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TrapDemo>;

export const Default: Story = {
  args: { trapFocus: true },
};
