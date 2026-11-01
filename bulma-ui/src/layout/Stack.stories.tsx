import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Stack } from './Stack';
import { Group } from './Group';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Divider } from '../elements/Divider';
import { Notification } from '../elements/Notification';
import { Tag } from '../elements/Tag';
import { Title } from '../elements/Title';
import { SubTitle } from '../elements/SubTitle';
import { Card } from '../components/Card';
import { Field } from '../form/Field';
import { Input } from '../form/Input';
import {
  validAlignItems,
  validColors,
  validGaps,
  validJustifyContents,
} from '../helpers/useBulmaClasses';

const ELEMENTS = [
  'div',
  'main',
  'section',
  'article',
  'aside',
  'header',
  'footer',
  'nav',
  'ul',
  'ol',
  'form',
  'fieldset',
];

const meta: Meta<typeof Stack> = {
  title: 'Layout/Stack',
  component: Stack,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A column with Bulma’s block spacing between its children, and their own block margins zeroed, so the gap is the only space. A `gap` step, `alignItems` and `justifyContent` replace the defaults through Bulma’s helper classes.',
      },
    },
  },
  args: {
    children: [
      <Notification key="note" color="info">
        Your changes are saved.
      </Notification>,
      <Box key="box">A Box, with no margin to undo.</Box>,
      <Card key="card">
        <Card.Content>A Card, last.</Card.Content>
      </Card>,
    ],
  },
  argTypes: {
    as: {
      control: 'select',
      options: ELEMENTS,
      description:
        'The element to render; with `ul` or `ol`, give it `li` children',
    },
    gap: {
      control: 'select',
      options: [undefined, ...validGaps],
      description:
        'Space between children, a step of Bulma’s gap scale; unset, Bulma’s block spacing',
    },
    alignItems: {
      control: 'select',
      options: [undefined, ...validAlignItems],
      description:
        'How each child sits across the column; stretched by default',
    },
    justifyContent: {
      control: 'select',
      options: [undefined, ...validJustifyContents],
      description:
        'Where the children sit down the column, when it’s taller than they are',
    },
    children: {
      control: false,
      description: 'What it lays out, top to bottom',
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
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Stack>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const stack = canvasElement.querySelector('.stack') as HTMLElement;
    await expect(stack).toHaveClass('is-vertical');
    // The gap is the only space: a Box's own bottom margin is zeroed.
    const box = within(stack).getByText(/A Box/);
    await expect(getComputedStyle(box).marginBottom).toBe('0px');
  },
};

export const Gaps: Story = {
  render: function GapsExample() {
    return (
      <Group alignItems="flex-start" gap="6">
        {([undefined, '1', '3', '6'] as const).map(gap => (
          <Stack key={gap ?? 'default'} gap={gap}>
            <Tag color="link">{gap ? `gap="${gap}"` : 'default'}</Tag>
            <Box p="3">One</Box>
            <Box p="3">Two</Box>
            <Box p="3">Three</Box>
          </Stack>
        ))}
      </Group>
    );
  },
};

export const BulmaBlocks: Story = {
  render: function BulmaBlocksExample() {
    return (
      <Stack>
        {/* One child, so the gap doesn't come between the pair */}
        <div>
          <Title>Account</Title>
          <SubTitle>A Title and its SubTitle, in one element.</SubTitle>
        </div>
        <Notification color="warning">
          A Notification, spaced by the gap alone.
        </Notification>
        <Field label="Name">
          <Input placeholder="Ada Lovelace" />
        </Field>
        <Box mb="6">A Box with mb="6": a helper margin still wins.</Box>
        <Card>
          <Card.Content>A Card, after the extra margin.</Card.Content>
        </Card>
      </Stack>
    );
  },
};

export const WithDividers: Story = {
  render: function WithDividersExample() {
    return (
      <Stack gap="3">
        <Box>Profile</Box>
        <Divider />
        <Box>Billing</Box>
        <Divider />
        <Box>Notifications</Box>
      </Stack>
    );
  },
};

export const Alignment: Story = {
  args: {
    alignItems: 'flex-start',
    children: [
      <Button key="a" color="primary">
        Sized to its text
      </Button>,
      <Button key="b">So is this one</Button>,
    ],
  },
};

export const AsAList: Story = {
  render: function AsAListExample() {
    return (
      <Stack as="ul" gap="2" aria-label="Recent invoices">
        <li>
          <Box>Invoice 1042, paid</Box>
        </li>
        <li>
          <Box>Invoice 1043, due Friday</Box>
        </li>
        <li>
          <Box>Invoice 1044, draft</Box>
        </li>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('list', { name: 'Recent invoices' });
    await expect(list).toHaveAttribute('role', 'list');
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
  },
};
