import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Group } from './Group';
import { Button } from '../elements/Button';
import { Tag } from '../elements/Tag';
import { Title } from '../elements/Title';
import { Span } from '../elements/Span';
import { Avatar } from '../components/Avatar';
import { Box } from '../elements/Box';
import {
  validAlignItems,
  validColors,
  validFlexWraps,
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

const meta: Meta<typeof Group> = {
  title: 'Layout/Group',
  component: Group,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A row that wraps, its children centered on each other, with half of Bulma’s block spacing between them and their own block margins zeroed. `isFullwidth` shares the row equally, and `breakpoint` stacks the children below a Bulma breakpoint.',
      },
    },
  },
  args: {
    children: [
      <Button key="save" color="primary">
        Save
      </Button>,
      <Button key="cancel">Cancel</Button>,
      <Span key="note" textColor="grey">
        Last saved a minute ago
      </Span>,
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
        'Space between children, a step of Bulma’s gap scale; unset, half of Bulma’s block spacing',
    },
    alignItems: {
      control: 'select',
      options: [undefined, ...validAlignItems],
      description: 'How each child sits across the row; centered by default',
    },
    justifyContent: {
      control: 'select',
      options: [undefined, ...validJustifyContents],
      description:
        'Where the children sit along the row; `space-between` pushes the ends apart',
    },
    flexWrap: {
      control: 'select',
      options: [undefined, ...validFlexWraps],
      description:
        'Whether children move to a new row when they don’t fit; wraps by default',
    },
    isFullwidth: {
      control: 'boolean',
      description: 'The children share the row equally',
    },
    breakpoint: {
      control: 'select',
      options: [undefined, 'tablet', 'desktop', 'widescreen'],
      description:
        'Stacks the children below this Bulma breakpoint and sets them in a row from it up',
    },
    children: {
      control: false,
      description: 'What it lays out, in a row',
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
type Story = StoryObj<typeof Group>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('.stack') as HTMLElement;
    await expect(group).toHaveClass('is-horizontal');
    await expect(getComputedStyle(group).flexWrap).toBe('wrap');
  },
};

export const Toolbar: Story = {
  render: function ToolbarExample() {
    return (
      <Group justifyContent="space-between">
        <Title as="h2" size="4">
          Invoices
        </Title>
        <Group gap="1">
          <Button>Export</Button>
          <Button color="primary">New invoice</Button>
        </Group>
      </Group>
    );
  },
};

export const Wrapping: Story = {
  render: function WrappingExample() {
    return (
      <Box>
        <Group gap="1">
          {[
            'React',
            'TypeScript',
            'Bulma',
            'Sass',
            'Vite',
            'Storybook',
            'Vitest',
            'Playwright',
            'ESLint',
            'Prettier',
            'pnpm',
            'Turbo',
          ].map(name => (
            <Tag key={name} color="link">
              {name}
            </Tag>
          ))}
        </Group>
      </Box>
    );
  },
};

export const FullWidth: Story = {
  args: {
    isFullwidth: true,
    children: [
      <Button key="cancel">Cancel</Button>,
      <Button key="save" color="primary">
        Save
      </Button>,
    ],
  },
};

export const Breakpoint: Story = {
  args: {
    breakpoint: 'tablet',
    isFullwidth: true,
    children: [
      <Button key="cancel">Cancel</Button>,
      <Button key="save" color="primary">
        Save
      </Button>,
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Narrower than a tablet, the buttons stack, each the column’s width. From the tablet up, they share the row.',
      },
    },
  },
};

export const Avatars: Story = {
  render: function AvatarsExample() {
    return (
      <Group gap="2">
        <Avatar name="Ada Lovelace" />
        <Avatar name="Alan Turing" />
        <Span>Ada and Alan are editing</Span>
      </Group>
    );
  },
};

export const AsAList: Story = {
  render: function AsAListExample() {
    return (
      <Group as="ul" gap="1" aria-label="Topics">
        <li>
          <Tag>React</Tag>
        </li>
        <li>
          <Tag>Bulma</Tag>
        </li>
        <li>
          <Tag>Accessibility</Tag>
        </li>
      </Group>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('list', { name: 'Topics' })).toBeVisible();
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
  },
};
