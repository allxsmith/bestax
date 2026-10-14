import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kbd } from './Kbd';
import { Block } from './Block';
import { Box } from './Box';
import { Button } from './Button';
import { Buttons } from './Buttons';
import { Notification } from './Notification';
import { Paragraph } from './Paragraph';
import { Table } from './Table';
import { Tbody } from './Tbody';
import { Td } from './Td';
import { Th } from './Th';
import { Thead } from './Thead';
import { Title } from './Title';
import { Tr } from './Tr';
import { Tooltip } from '../components/Tooltip';
import { validColors, validTextSizes } from '../helpers/useBulmaClasses';

const meta: Meta<typeof Kbd> = {
  title: 'Elements/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A key the reader presses, drawn as a keycap on a `<kbd>`. It takes its colors from the text it sits in and its size in em, so it fits a paragraph, a title, a filled button or a tooltip as it is. `Kbd.Group` puts keys pressed together, or one after another, in the outer `<kbd>` HTML gives a combination, with the separator between them as text.',
      },
    },
  },
  args: {
    children: 'Esc',
  },
  argTypes: {
    children: {
      control: 'text',
      description:
        'The key as it is printed on the keyboard: a word, a letter or a symbol',
    },
    label: {
      control: 'text',
      description:
        'What a screen reader says in place of a symbol, such as "Command" for ⌘; the symbol is hidden from assistive tech and the label is read instead',
    },
    textColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description:
        'Text color helper; the edge and the fill are mixed from the text color, so they follow it',
    },
    bgColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description:
        'Background color helper, in place of the faint fill; pair it with a textColor that reads on it in both schemes',
    },
    textSize: {
      control: 'select',
      options: validTextSizes,
      description:
        'Font-size helper; the key is sized in em, so its padding and edges scale with it',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Kbd>;

export const Default: Story = {};

export const InASentence: Story = {
  render: function InASentenceExample() {
    return (
      <Paragraph>
        Press <Kbd>Esc</Kbd> to close the dialog.
      </Paragraph>
    );
  },
};

export const Combination: Story = {
  render: function CombinationExample() {
    return (
      <Paragraph>
        Open the command palette with{' '}
        <Kbd.Group>
          <Kbd>Ctrl</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>P</Kbd>
        </Kbd.Group>
        .
      </Paragraph>
    );
  },
};

export const Sequence: Story = {
  render: function SequenceExample() {
    return (
      <Paragraph>
        Go to your inbox with{' '}
        <Kbd.Group separator="then">
          <Kbd>G</Kbd>
          <Kbd>I</Kbd>
        </Kbd.Group>
        .
      </Paragraph>
    );
  },
};

export const SymbolsWithLabels: Story = {
  render: function SymbolsWithLabelsExample() {
    return (
      <>
        <Paragraph>
          Search with{' '}
          <Kbd.Group>
            <Kbd label="Command">⌘</Kbd>
            <Kbd>K</Kbd>
          </Kbd.Group>
          , which a screen reader reads as “Command plus K”.
        </Paragraph>
        <Paragraph>
          <Kbd label="Command">⌘</Kbd> <Kbd label="Option">⌥</Kbd>{' '}
          <Kbd label="Shift">⇧</Kbd> <Kbd label="Control">⌃</Kbd>{' '}
          <Kbd label="Return">⏎</Kbd>
        </Paragraph>
      </>
    );
  },
};

export const KeyboardShortcut: Story = {
  render: function KeyboardShortcutExample() {
    return (
      <Paragraph>
        Press{' '}
        <Kbd.Group>
          <Kbd>Ctrl</Kbd>
          <Kbd>C</Kbd>
        </Kbd.Group>{' '}
        to copy and{' '}
        <Kbd.Group>
          <Kbd>Ctrl</Kbd>
          <Kbd>V</Kbd>
        </Kbd.Group>{' '}
        to paste.
      </Paragraph>
    );
  },
};

export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <Block display="flex" alignItems="baseline">
        {(['7', '5', '3', '1'] as const).map(size => (
          <Kbd key={size} textSize={size} mr="4">
            Esc
          </Kbd>
        ))}
      </Block>
    );
  },
};

export const InFlowingText: Story = {
  render: function InFlowingTextExample() {
    return (
      <Box>
        <Title size="4">
          Press{' '}
          <Kbd.Group>
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </Kbd.Group>{' '}
          to search
        </Title>
        <Paragraph>
          A key follows the size of the text around it, and its padding and
          edges sit around it without pushing the lines apart. Select a word and
          press{' '}
          <Kbd.Group>
            <Kbd>Ctrl</Kbd>
            <Kbd>B</Kbd>
          </Kbd.Group>{' '}
          for bold, or{' '}
          <Kbd.Group>
            <Kbd>Ctrl</Kbd>
            <Kbd>I</Kbd>
          </Kbd.Group>{' '}
          for italics. A combination never breaks across two lines, so{' '}
          <Kbd.Group>
            <Kbd>Ctrl</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>Right Arrow</Kbd>
          </Kbd.Group>{' '}
          moves to the next line whole when it doesn’t fit, and{' '}
          <Kbd.Group separator="then">
            <Kbd>G</Kbd>
            <Kbd>I</Kbd>
          </Kbd.Group>{' '}
          does the same.
        </Paragraph>
      </Box>
    );
  },
};

export const InAButton: Story = {
  render: function InAButtonExample() {
    return (
      <Buttons>
        <Button color="primary" aria-keyshortcuts="Control+S">
          Save
          <Kbd.Group ml="2">
            <Kbd>Ctrl</Kbd>
            <Kbd>S</Kbd>
          </Kbd.Group>
        </Button>
        <Button color="dark" aria-keyshortcuts="Meta+K">
          Search
          <Kbd.Group ml="2">
            <Kbd label="Command">⌘</Kbd>
            <Kbd>K</Kbd>
          </Kbd.Group>
        </Button>
        <Button aria-keyshortcuts="Escape">
          Cancel
          <Kbd ml="2">Esc</Kbd>
        </Button>
        <Button color="danger" size="large" aria-keyshortcuts="Delete">
          Delete
          <Kbd ml="2">Del</Kbd>
        </Button>
      </Buttons>
    );
  },
};

export const InATooltip: Story = {
  render: function InATooltipExample() {
    return (
      <Tooltip
        active
        position="right"
        content={
          <>
            Bold{' '}
            <Kbd.Group>
              <Kbd>Ctrl</Kbd>
              <Kbd>B</Kbd>
            </Kbd.Group>
          </>
        }
      >
        <Button aria-keyshortcuts="Control+B">Bold</Button>
      </Tooltip>
    );
  },
};

export const InANotification: Story = {
  render: function InANotificationExample() {
    return (
      <>
        <Notification color="info">
          Press <Kbd>Esc</Kbd> to close, or{' '}
          <Kbd.Group>
            <Kbd>Ctrl</Kbd>
            <Kbd>Z</Kbd>
          </Kbd.Group>{' '}
          to undo.
        </Notification>
        <Notification color="warning" isLight>
          Unsaved changes. Press{' '}
          <Kbd.Group>
            <Kbd>Ctrl</Kbd>
            <Kbd>S</Kbd>
          </Kbd.Group>{' '}
          to save them.
        </Notification>
      </>
    );
  },
};

export const ShortcutsTable: Story = {
  render: function ShortcutsTableExample() {
    return (
      <Table>
        <Thead>
          <Tr>
            <Th>Action</Th>
            <Th>Shortcut</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Command palette</Td>
            <Td>
              <Kbd.Group>
                <Kbd>Ctrl</Kbd>
                <Kbd>Shift</Kbd>
                <Kbd>P</Kbd>
              </Kbd.Group>
            </Td>
          </Tr>
          <Tr>
            <Td>Go to inbox</Td>
            <Td>
              <Kbd.Group separator="then">
                <Kbd>G</Kbd>
                <Kbd>I</Kbd>
              </Kbd.Group>
            </Td>
          </Tr>
          <Tr>
            <Td>Close</Td>
            <Td>
              <Kbd>Esc</Kbd>
            </Td>
          </Tr>
        </Tbody>
      </Table>
    );
  },
};

export const TextColor: Story = {
  render: function TextColorExample() {
    return (
      <>
        <Notification color="info">
          Press <Kbd>Esc</Kbd> to close this panel.
        </Notification>
        <Notification color="warning" isLight>
          You have unsaved changes. Press{' '}
          <Kbd.Group>
            <Kbd>Ctrl</Kbd>
            <Kbd>S</Kbd>
          </Kbd.Group>{' '}
          to save them.
        </Notification>
        <Paragraph>
          Select a row and press{' '}
          <Kbd textColor="danger" colorShade="on-scheme">
            Del
          </Kbd>{' '}
          to delete it.
        </Paragraph>
      </>
    );
  },
};

export const CompoundUsage: Story = {
  render: function CompoundUsageExample() {
    return (
      <Paragraph>
        Press{' '}
        <Kbd.Group>
          <Kbd label="Command">⌘</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>P</Kbd>
        </Kbd.Group>{' '}
        on a Mac, then{' '}
        <Kbd.Group separator="then">
          <Kbd>G</Kbd>
          <Kbd>I</Kbd>
        </Kbd.Group>
        .
      </Paragraph>
    );
  },
};
