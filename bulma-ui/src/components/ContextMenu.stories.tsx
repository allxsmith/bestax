import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ContextMenu } from './ContextMenu';
import { Dropdown } from './Dropdown';
import { Card } from './Card';
import { Box } from '../elements/Box';
import { Paragraph } from '../elements/Paragraph';
import { Table } from '../elements/Table';
import { Notification } from '../elements/Notification';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';

const meta: Meta<typeof ContextMenu> = {
  title: 'Components/ContextMenu',
  component: ContextMenu,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A menu of actions that opens where you right-click an element, such as a table row or a card, or long press it on a touch screen. Shift+F10 and the context menu key open it where the browser fires contextmenu for them. Its actions need a visible way in as well, such as a Dropdown on the same row.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    trigger: {
      control: false,
      description:
        'The element a right-click, the context menu key or a long press opens the menu from; cloned, not wrapped',
    },
    children: {
      control: false,
      description: 'The menu items: ContextMenu.Item and ContextMenu.Divider',
    },
    onOpenChange: {
      control: false,
      description:
        'Called with true when the menu opens and false when it closes, whatever closed it',
    },
    closeOnClick: {
      control: 'boolean',
      description:
        'Close the menu when an item is clicked or activated with Enter or Space',
    },
    disabled: {
      control: 'boolean',
      description:
        "Leave the trigger to the browser: its own menu shows, and long presses don't open this one",
    },
    'aria-label': {
      control: 'text',
      description: "The menu's accessible name",
    },
  },
  args: {
    closeOnClick: true,
    disabled: false,
    'aria-label': 'Actions for report.pdf',
  },
};

export default meta;
type Story = StoryObj<typeof ContextMenu>;

/**
 * Right-click the box, or long press it on a touch screen. It takes focus
 * with Tab too, so Shift+F10 or the context menu key opens the menu from
 * the keyboard where the browser fires `contextmenu` for them. Use the
 * controls to keep it open after an item or to turn it off.
 */
export const Default: Story = {
  render: function DefaultStory(args) {
    const [last, setLast] = useState('nothing yet');
    return (
      <>
        <ContextMenu
          {...args}
          trigger={
            <Box tabIndex={0} p="6" textAlign="centered">
              report.pdf: right-click here, or long press on a touch screen
            </Box>
          }
        >
          <ContextMenu.Item as="button" onClick={() => setLast('Rename')}>
            Rename
          </ContextMenu.Item>
          <ContextMenu.Item as="button" onClick={() => setLast('Duplicate')}>
            Duplicate
          </ContextMenu.Item>
          <ContextMenu.Item as="button" onClick={() => setLast('Download')}>
            Download
          </ContextMenu.Item>
          <ContextMenu.Divider />
          <ContextMenu.Item
            as="button"
            color="danger"
            onClick={() => setLast('Delete')}
          >
            Delete
          </ContextMenu.Item>
        </ContextMenu>
        <Paragraph mt="3">Last action: {last}</Paragraph>
      </>
    );
  },
};

const FILES = ['report.pdf', 'budget.xlsx', 'notes.txt'];

/** One row of the file list, with the same actions in a visible Dropdown. */
const FileRow = ({
  name,
  onAction,
}: {
  name: string;
  onAction: (action: string) => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const actions = (
    <>
      <ContextMenu.Item as="button" onClick={() => onAction(`Rename ${name}`)}>
        Rename
      </ContextMenu.Item>
      <ContextMenu.Item
        as="button"
        onClick={() => onAction(`Duplicate ${name}`)}
      >
        Duplicate
      </ContextMenu.Item>
      <ContextMenu.Divider />
      <ContextMenu.Item
        as="button"
        color="danger"
        onClick={() => onAction(`Delete ${name}`)}
      >
        Delete
      </ContextMenu.Item>
    </>
  );
  return (
    <ContextMenu
      aria-label={`Actions for ${name}`}
      onOpenChange={setMenuOpen}
      trigger={
        <Table.Tr isSelected={menuOpen}>
          <Table.Td>{name}</Table.Td>
          <Table.Td>
            <Dropdown label="Actions" right>
              {actions}
            </Dropdown>
          </Table.Td>
        </Table.Tr>
      }
    >
      {actions}
    </ContextMenu>
  );
};

/**
 * A file list. Right-click a row, or long press it, and the row stays
 * highlighted while its menu is open, through `onOpenChange`. The Actions
 * Dropdown on each row is the visible way in to the same items, and its
 * button is what keyboard users focus to press Shift+F10 on the row.
 */
export const FileTable: Story = {
  render: function FileTableStory() {
    const [last, setLast] = useState('nothing yet');
    return (
      <>
        <Notification mb="4">Last action: {last}</Notification>
        <Table isFullwidth>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {FILES.map(name => (
              <FileRow key={name} name={name} onAction={setLast} />
            ))}
          </Table.Tbody>
        </Table>
      </>
    );
  },
};

/**
 * Items that toggle in place. With `closeOnClick` off, the menu stays open
 * while you check and uncheck them, which `menuitemcheckbox` and
 * `aria-checked` announce.
 */
export const CheckboxItems: Story = {
  render: function CheckboxItemsStory() {
    const [hidden, setHidden] = useState(false);
    const [extensions, setExtensions] = useState(true);
    return (
      <ContextMenu
        aria-label="View options"
        closeOnClick={false}
        trigger={
          <Box tabIndex={0} p="6" textAlign="centered">
            Right-click for view options. Hidden files are{' '}
            {hidden ? 'shown' : 'hidden'}, extensions are{' '}
            {extensions ? 'shown' : 'hidden'}.
          </Box>
        }
      >
        <ContextMenu.Item
          as="button"
          role="menuitemcheckbox"
          aria-checked={hidden}
          onClick={() => setHidden(value => !value)}
        >
          <span aria-hidden="true">{hidden ? '✓ ' : ''}</span>Show hidden files
        </ContextMenu.Item>
        <ContextMenu.Item
          as="button"
          role="menuitemcheckbox"
          aria-checked={extensions}
          onClick={() => setExtensions(value => !value)}
        >
          <span aria-hidden="true">{extensions ? '✓ ' : ''}</span>Show
          extensions
        </ContextMenu.Item>
      </ContextMenu>
    );
  },
};

/**
 * Disabled items stay in the menu and are skipped by the arrow keys and by
 * typing, as in Dropdown.
 */
export const DisabledItems: Story = {
  render: () => (
    <ContextMenu
      aria-label="Clipboard"
      trigger={
        <Box tabIndex={0} p="6" textAlign="centered">
          Right-click for the clipboard actions
        </Box>
      }
    >
      <ContextMenu.Item as="button" disabled>
        Cut
      </ContextMenu.Item>
      <ContextMenu.Item as="button" disabled>
        Copy
      </ContextMenu.Item>
      <ContextMenu.Item as="button">Paste</ContextMenu.Item>
      <ContextMenu.Item as="button">Paste and match style</ContextMenu.Item>
    </ContextMenu>
  ),
};

/**
 * Regions inside regions. Right-click a card for its menu, and the board
 * around the cards for the board's. Only the innermost one opens.
 */
export const Nested: Story = {
  render: () => (
    <ContextMenu
      aria-label="Board"
      trigger={
        <Box p="5">
          <Paragraph mb="4">Board: right-click between the cards</Paragraph>
          <Columns>
            {['Write the docs', 'Review the PR'].map(title => (
              <Column key={title}>
                <ContextMenu
                  aria-label={`Actions for ${title}`}
                  trigger={
                    <Card tabIndex={0}>
                      <Card.Content>{title}</Card.Content>
                    </Card>
                  }
                >
                  <ContextMenu.Item as="button">Move to Done</ContextMenu.Item>
                  <ContextMenu.Item as="button">Archive</ContextMenu.Item>
                </ContextMenu>
              </Column>
            ))}
          </Columns>
        </Box>
      }
    >
      <ContextMenu.Item as="button">New card</ContextMenu.Item>
      <ContextMenu.Item as="button">Rename board</ContextMenu.Item>
    </ContextMenu>
  ),
};

/**
 * `disabled` gives the trigger back to the browser: a right-click shows the
 * browser's own menu.
 */
export const Disabled: Story = {
  render: () => (
    <ContextMenu
      aria-label="Actions"
      disabled
      trigger={
        <Box p="6" textAlign="centered">
          Right-click here for the browser&apos;s own menu
        </Box>
      }
    >
      <ContextMenu.Item as="button">Rename</ContextMenu.Item>
    </ContextMenu>
  ),
};

/** `ContextMenu.Item` and `ContextMenu.Divider`, from the one import. */
export const CompoundUsage: Story = {
  render: () => (
    <ContextMenu
      aria-label="Actions for notes.txt"
      trigger={
        <Box tabIndex={0} p="6" textAlign="centered">
          notes.txt
        </Box>
      }
    >
      <ContextMenu.Item as="button">Open</ContextMenu.Item>
      <ContextMenu.Item as="button">Rename</ContextMenu.Item>
      <ContextMenu.Divider />
      <ContextMenu.Item as="button">Delete</ContextMenu.Item>
    </ContextMenu>
  ),
};
