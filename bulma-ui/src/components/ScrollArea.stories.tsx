import { Fragment, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { ScrollArea, type ScrollAreaEdge } from './ScrollArea';
import { Card } from './Card';
import { Menu } from './Menu';
import { Message } from './Message';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Content } from '../elements/Content';
import { Notification } from '../elements/Notification';
import { Paragraph } from '../elements/Paragraph';
import { Table } from '../elements/Table';
import { Tbody } from '../elements/Tbody';
import { Td } from '../elements/Td';
import { Th } from '../elements/Th';
import { Thead } from '../elements/Thead';
import { Title } from '../elements/Title';
import { Tr } from '../elements/Tr';
import { Column } from '../columns/Column';
import { Columns } from '../columns/Columns';
import { validColors } from '../helpers/useBulmaClasses';

/** Release notes, long enough to scroll in a few hundred pixels. */
const notes = (
  <Content p="4">
    <h3>Version 3.2</h3>
    <p>
      Search now matches tags as well as titles, and remembers the last filter
      you used on each page.
    </p>
    <h3>Version 3.1</h3>
    <p>
      Exports include the time zone, and a CSV export keeps the column order you
      set in the table.
    </p>
    <ul>
      <li>Faster loading for long lists.</li>
      <li>Keyboard shortcuts for the most used actions.</li>
      <li>A darker theme that follows your system.</li>
    </ul>
    <h3>Version 3.0</h3>
    <p>
      A new dashboard, with the numbers you check most at the top and the rest a
      click away.
    </p>
  </Content>
);

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3', 'Q4'];

/** A table wider than the columns it sits in. */
const results = (
  <Table isNarrow mb="0">
    <Thead>
      <Tr>
        <Th>Region</Th>
        {QUARTERS.map((quarter, i) => (
          <Th key={i}>
            {quarter} {i < 4 ? 2025 : 2026}
          </Th>
        ))}
      </Tr>
    </Thead>
    <Tbody>
      {['North', 'South', 'East', 'West'].map(region => (
        <Tr key={region}>
          <Td>{region}</Td>
          {QUARTERS.map((_, i) => (
            <Td key={i}>
              {(1200 + region.length * 97 + i * 131).toLocaleString('en')}
            </Td>
          ))}
        </Tr>
      ))}
    </Tbody>
  </Table>
);

const meta: Meta<typeof ScrollArea> = {
  title: 'Components/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A box whose content scrolls inside it, on the browser’s own scrollbars made thin and colored from Bulma’s tokens. While the content overflows, the viewport is a named region you can tab to and scroll by keyboard, Safari included. It can fade the content out toward the edges that have more past them.',
      },
    },
  },
  args: {
    'aria-label': 'Release notes',
    height: 240,
    className: 'box p-0',
    children: notes,
  },
  argTypes: {
    children: {
      control: false,
      description: 'What scrolls',
    },
    height: {
      control: 'text',
      description:
        'The area’s height: a number in pixels, or any CSS length as a string',
    },
    maxHeight: {
      control: 'text',
      description:
        'The height it grows to with its content, then scrolls past; a number in pixels, or any CSS length',
    },
    orientation: {
      control: 'inline-radio',
      options: ['both', 'vertical', 'horizontal'],
      description:
        'Which way it scrolls: vertical and horizontal clip the other axis, and both scrolls whichever overflows',
    },
    showScrollbars: {
      control: 'inline-radio',
      options: ['auto', 'hover', 'always'],
      description:
        'When the scrollbars show: whenever it overflows, only on hover or focus, or on every axis it scrolls even when the content fits',
    },
    hasStableGutter: {
      control: 'boolean',
      description:
        'Keeps room for the vertical scrollbar whether or not it shows, so the content doesn’t shift',
    },
    hasFade: {
      control: 'boolean',
      description:
        'Fades the content toward each edge that has more past it, without fading the scrollbar',
    },
    onEdgeReach: {
      action: 'edge reached',
      description: 'Called with the edge when scrolling reaches it',
    },
    'aria-label': {
      control: 'text',
      description: 'Names the region, read when it takes focus',
    },
    'aria-labelledby': {
      control: 'text',
      description: 'The id of a visible heading that names the region',
    },
    textColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Text color helper',
    },
    bgColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Background color helper',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the outer frame',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // It overflows, so it's a region you can tab to.
    const region = canvas.getByRole('region', { name: 'Release notes' });
    await expect(region).toHaveAttribute('tabindex', '0');
    await expect(region).toHaveAttribute('data-overflow-bottom');
  },
};

export const Fade: Story = {
  args: { hasFade: true },
};

export const GrowsToAHeight: Story = {
  render: function GrowsToAHeightExample(args) {
    const [count, setCount] = useState(2);
    return (
      <>
        <Paragraph mb="3">
          <Button size="small" onClick={() => setCount(c => c + 2)}>
            Add two messages
          </Button>
        </Paragraph>
        <ScrollArea
          {...args}
          height={undefined}
          maxHeight="16rem"
          aria-label="Messages"
        >
          {Array.from({ length: count }, (_, i) => (
            <Message key={i} title={i % 2 ? 'Sam' : 'Ana'} m="3">
              Message {i + 1}. It grows to 16rem, then scrolls.
            </Message>
          ))}
        </ScrollArea>
      </>
    );
  },
};

export const LoadingOlderMessages: Story = {
  render: function LoadingOlderMessagesExample(args) {
    const [messages, setMessages] = useState(() =>
      Array.from({ length: 6 }, (_, i) => `Message ${i + 1}`)
    );
    const [reached, setReached] = useState<ScrollAreaEdge | null>(null);
    const onEdgeReach = (edge: ScrollAreaEdge) => {
      setReached(edge);
      if (edge === 'top') {
        setMessages(current => [
          ...Array.from(
            { length: 3 },
            (_, i) => `Older message ${current.length + i + 1}`
          ),
          ...current,
        ]);
      }
    };
    return (
      <>
        <Paragraph mb="3" role="status">
          {reached ? `Reached the ${reached}.` : 'Scroll to an edge.'}
        </Paragraph>
        <ScrollArea
          {...args}
          height={240}
          aria-label="Messages"
          hasFade
          onEdgeReach={onEdgeReach}
        >
          {messages.map(text => (
            <Message key={text} m="3">
              {text}
            </Message>
          ))}
        </ScrollArea>
      </>
    );
  },
};

export const Orientation: Story = {
  render: function OrientationExample() {
    return (
      <Columns>
        <Column>
          <Title as="h2" textSize="6">
            vertical
          </Title>
          <ScrollArea
            orientation="vertical"
            height={200}
            aria-label="Release notes"
            className="box p-0"
          >
            {notes}
          </ScrollArea>
        </Column>
        <Column>
          <Title as="h2" textSize="6">
            horizontal
          </Title>
          <ScrollArea
            orientation="horizontal"
            aria-label="Quarterly results"
            className="box p-0"
            hasFade
          >
            {results}
          </ScrollArea>
        </Column>
        <Column>
          <Title as="h2" textSize="6">
            both
          </Title>
          <ScrollArea
            height={200}
            aria-label="Quarterly results by region"
            className="box p-0"
            hasFade
          >
            {results}
            {results}
            {results}
          </ScrollArea>
        </Column>
      </Columns>
    );
  },
};

export const Scrollbars: Story = {
  render: function ScrollbarsExample() {
    return (
      <Columns>
        {(['auto', 'hover', 'always'] as const).map(showScrollbars => (
          <Column key={showScrollbars}>
            <Title as="h2" textSize="6">
              {showScrollbars}
            </Title>
            <ScrollArea
              showScrollbars={showScrollbars}
              height={200}
              aria-label={`Release notes, ${showScrollbars}`}
              className="box p-0"
            >
              {notes}
            </ScrollArea>
          </Column>
        ))}
      </Columns>
    );
  },
};

export const StableGutter: Story = {
  render: function StableGutterExample() {
    return (
      <Columns>
        {[false, true].map(hasStableGutter => (
          <Column key={String(hasStableGutter)}>
            <Title as="h2" textSize="6">
              {hasStableGutter ? 'hasStableGutter' : 'without'}
            </Title>
            <ScrollArea
              hasStableGutter={hasStableGutter}
              height={200}
              aria-label="A short note"
              className="box p-0"
            >
              <Content p="4">
                <p>
                  This fits, so there is no bar. With a stable gutter the room
                  for one is kept anyway, where the system draws its bars beside
                  the content.
                </p>
              </Content>
            </ScrollArea>
          </Column>
        ))}
      </Columns>
    );
  },
};

export const SidebarMenu: Story = {
  render: function SidebarMenuExample() {
    const sections = [
      ['General', ['Dashboard', 'Customers', 'Orders', 'Products']],
      ['Reports', ['Sales', 'Traffic', 'Retention', 'Exports']],
      ['Settings', ['Team', 'Billing', 'Integrations', 'Security']],
    ] as const;
    return (
      <Box p="0">
        <ScrollArea
          height={260}
          aria-label="Sections"
          showScrollbars="hover"
          hasStableGutter
        >
          <Menu p="3">
            {sections.map(([label, items]) => (
              <Fragment key={label}>
                <Menu.Label>{label}</Menu.Label>
                <Menu.List>
                  {items.map(item => (
                    <Menu.Item key={item} href={`#${item.toLowerCase()}`}>
                      {item}
                    </Menu.Item>
                  ))}
                </Menu.List>
              </Fragment>
            ))}
          </Menu>
        </ScrollArea>
      </Box>
    );
  },
};

export const OnBackgrounds: Story = {
  render: function OnBackgroundsExample() {
    return (
      <Columns>
        <Column>
          <Card header="In a Card">
            <ScrollArea height={180} aria-label="Card notes" hasFade>
              {notes}
            </ScrollArea>
          </Card>
        </Column>
        <Column>
          <Notification color="info" p="0">
            <ScrollArea height={180} aria-label="Info notes" hasFade>
              {notes}
            </ScrollArea>
          </Notification>
        </Column>
        <Column>
          <Box p="0">
            <ScrollArea height={180} aria-label="Box notes" hasFade>
              {notes}
            </ScrollArea>
          </Box>
        </Column>
      </Columns>
    );
  },
};

export const RightToLeft: Story = {
  render: function RightToLeftExample() {
    return (
      <div dir="rtl">
        <ScrollArea
          height={200}
          aria-label="نتائج ربع سنوية"
          className="box p-0"
          hasFade
        >
          {results}
          {results}
          {results}
        </ScrollArea>
      </div>
    );
  },
};
