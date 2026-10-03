import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Popover } from './Popover';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Icon } from '../elements/Icon';
import { Paragraph } from '../elements/Paragraph';
import { Tag } from '../elements/Tag';
import { Link } from '../elements/Link';
import { UnorderedList } from '../elements/UnorderedList';
import { ListItem } from '../elements/ListItem';
import { Checkbox } from '../form/Checkbox';
import { Checkboxes } from '../form/Checkboxes';
import { Input } from '../form/Input';

const meta: Meta<typeof Popover> = {
  title: 'Components/Popover',
  component: Popover,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A click-to-open panel of interactive content anchored to its trigger: a filter form, share options, an inline edit. The panel is a non-modal dialog that takes focus on open and hands it back to the trigger on close.',
      },
    },
  },
  tags: ['autodocs'],
  subcomponents: {
    Header: Popover.Header,
    Body: Popover.Body,
    Footer: Popover.Footer,
    Close: Popover.Close,
  },
  argTypes: {
    trigger: {
      control: false,
      description:
        'The element that toggles the popover; it receives aria-haspopup, aria-expanded and aria-controls',
    },
    children: {
      control: false,
      description: 'The panel content, usually Header, Body and Footer',
    },
    open: {
      control: 'boolean',
      description: 'Controlled open state',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Initial open state when uncontrolled',
    },
    onOpenChange: {
      control: false,
      description:
        'Called with the state asked for, from the trigger, Popover.Close, Escape or an outside press',
    },
    position: {
      control: 'select',
      options: ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'auto'],
      description:
        'Where the panel opens against the trigger; auto keeps it in the viewport',
    },
    appendToBody: {
      control: 'boolean',
      description:
        'Render the panel at the end of document.body, fixed to the viewport',
    },
    trapFocus: {
      control: 'boolean',
      description: 'Keep Tab and Shift+Tab inside the panel while it is open',
    },
    closeOnClickOutside: {
      control: 'boolean',
      description: 'Close on a pointerdown outside the trigger and the panel',
    },
    closeOnEscape: {
      control: 'boolean',
      description:
        'Close on Escape while focus is in the panel or on the trigger',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible name for a panel without a Popover.Header',
    },
    contentClassName: {
      control: 'text',
      description: 'Additional classes for the panel',
    },
  },
  args: {
    position: 'bottom-left',
    appendToBody: false,
    trapFocus: true,
    closeOnClickOutside: true,
    closeOnEscape: true,
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

/**
 * A filter form opened from a button. Use the controls to try the placement
 * and dismissal options.
 */
export const Default: Story = {
  render: function DefaultPopover(args) {
    const [statuses, setStatuses] = useState<string[]>(['open']);
    return (
      <Popover {...args} trigger={<Button>Filters</Button>}>
        <Popover.Header>Filter rows</Popover.Header>
        <Popover.Body>
          <Checkboxes value={statuses} onChange={setStatuses}>
            <Checkbox value="open">Open</Checkbox>
            <Checkbox value="closed">Closed</Checkbox>
          </Checkboxes>
        </Popover.Body>
        <Popover.Footer>
          <Popover.Close color="primary">Done</Popover.Close>
        </Popover.Footer>
      </Popover>
    );
  },
};

/**
 * The parts as statics: `Popover.Header` names the panel, `Popover.Body`
 * holds the content, `Popover.Footer` lines up the actions, and
 * `Popover.Close` closes the popover and hands focus back to the trigger.
 */
export const CompoundUsage: Story = {
  render: () => (
    <Popover trigger={<Button>Rename</Button>}>
      <Popover.Header>Rename file</Popover.Header>
      <Popover.Body>
        <Input aria-label="File name" defaultValue="report.pdf" />
      </Popover.Body>
      <Popover.Footer>
        <Popover.Close>Cancel</Popover.Close>
        <Popover.Close color="primary">Save</Popover.Close>
      </Popover.Footer>
    </Popover>
  ),
};

/**
 * The four corners. Each panel opens below or above the trigger, lined up
 * with its left or right edge.
 */
export const Positions: Story = {
  render: () => (
    <Box pt="6" pb="6" display="flex" justifyContent="space-around">
      {(['bottom-left', 'bottom-right', 'top-left', 'top-right'] as const).map(
        position => (
          <Popover
            key={position}
            position={position}
            ariaLabel={position}
            trigger={<Button>{position}</Button>}
          >
            <Popover.Body>Opens {position}.</Popover.Body>
          </Popover>
        )
      )}
    </Box>
  ),
};

/**
 * `appendToBody` renders the panel at the end of the page, so a clipping
 * ancestor (here a box with `overflow="hidden"`) doesn't cut it off.
 */
export const AppendToBody: Story = {
  render: () => (
    <Box overflow="hidden">
      <Popover
        appendToBody
        ariaLabel="Portaled"
        trigger={<Button color="primary">appendToBody</Button>}
      >
        <Popover.Body>This panel escapes the box.</Popover.Body>
      </Popover>
    </Box>
  ),
};

/**
 * Controlled: the page holds the open state, and `onOpenChange` reports every
 * request to change it.
 */
export const Controlled: Story = {
  render: function ControlledPopover() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Paragraph mb="3">The popover is {open ? 'open' : 'closed'}.</Paragraph>
        <Popover
          open={open}
          onOpenChange={setOpen}
          ariaLabel="Account"
          trigger={<Button>Account</Button>}
        >
          <Popover.Body>
            <Paragraph>Signed in as ada@example.com</Paragraph>
          </Popover.Body>
          <Popover.Footer>
            <Popover.Close>Sign out</Popover.Close>
          </Popover.Footer>
        </Popover>
      </>
    );
  },
};

/**
 * Share options without a header, named by `ariaLabel`.
 */
export const ShareOptions: Story = {
  render: () => (
    <Popover
      ariaLabel="Share"
      position="auto"
      trigger={
        <Button>
          <Icon name="share" variant="solid" />
          <span>Share</span>
        </Button>
      }
    >
      <Popover.Body>
        <UnorderedList>
          <ListItem>
            <Link href="#email">Email</Link>
          </ListItem>
          <ListItem>
            <Link href="#copy">Copy link</Link>
          </ListItem>
        </UnorderedList>
      </Popover.Body>
    </Popover>
  ),
};

/**
 * A trigger that isn't a button. An intrinsic element gets `role="button"`
 * and a tab stop; a component such as `Tag` takes them as props. Enter and
 * Space open it either way.
 */
export const NonButtonTrigger: Story = {
  render: () => (
    <Popover
      ariaLabel="Label help"
      trigger={
        <Tag color="info" role="button" tabIndex={0}>
          What is this?
        </Tag>
      }
    >
      <Popover.Body>
        <Paragraph>Labels group rows. Click one to filter by it.</Paragraph>
      </Popover.Body>
    </Popover>
  ),
};
