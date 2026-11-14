import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Flex } from './Flex';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Content } from '../elements/Content';
import { Menu } from '../components/Menu';
import {
  validAlignContents,
  validAlignItems,
  validColors,
  validFlexDirections,
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

const meta: Meta<typeof Flex> = {
  title: 'Layout/Flex',
  component: Flex,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A flex container with CSS’s own defaults: a row that doesn’t wrap, its children stretched across it, and no gap. The flex container’s properties are props, on Bulma’s helper classes, and its children’s own block margins are zeroed.',
      },
    },
  },
  args: {
    gap: '2',
    bgColor: 'light',
    p: '3',
    children: [
      <Button key="a" color="primary">
        One
      </Button>,
      <Button key="b" color="info">
        Two
      </Button>,
      <Button key="c" color="success">
        Three
      </Button>,
    ],
  },
  argTypes: {
    as: {
      control: 'select',
      options: ELEMENTS,
      description:
        'The element to render; with `ul` or `ol`, give it `li` children',
    },
    flexDirection: {
      control: 'select',
      options: [undefined, ...validFlexDirections],
      description:
        'The main axis, a row unless set; the reverse values change only what’s seen, not reading or Tab order',
    },
    flexWrap: {
      control: 'select',
      options: [undefined, ...validFlexWraps],
      description: 'Whether children move to a new line when they don’t fit',
    },
    alignItems: {
      control: 'select',
      options: [undefined, ...validAlignItems],
      description: 'How each child sits across the main axis',
    },
    justifyContent: {
      control: 'select',
      options: [undefined, ...validJustifyContents],
      description: 'Where the children sit along the main axis',
    },
    alignContent: {
      control: 'select',
      options: [undefined, ...validAlignContents],
      description: 'How wrapped lines share the space across the main axis',
    },
    gap: {
      control: 'select',
      options: [undefined, ...validGaps],
      description: 'Space between children, a step of Bulma’s gap scale',
    },
    rowGap: {
      control: 'select',
      options: [undefined, ...validGaps],
      description: 'Space between wrapped lines, when it differs from `gap`',
    },
    columnGap: {
      control: 'select',
      options: [undefined, ...validGaps],
      description:
        'Space between children along a row, when it differs from `gap`',
    },
    p: {
      control: 'text',
      description: 'Padding helper',
    },
    children: {
      control: false,
      description: 'What it lays out',
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
type Story = StoryObj<typeof Flex>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const flex = canvasElement.querySelector('.stack') as HTMLElement;
    const style = getComputedStyle(flex);
    await expect(style.display).toBe('flex');
    await expect(style.flexDirection).toBe('row');
    await expect(style.flexWrap).toBe('nowrap');
  },
};

export const SideAndMain: Story = {
  render: function SideAndMainExample() {
    return (
      <Flex gap="4" alignItems="flex-start">
        <Box flexShrink="0">
          <Menu>
            <Menu.Label>Account</Menu.Label>
            <Menu.List>
              <Menu.Item href="#profile" active>
                Profile
              </Menu.Item>
              <Menu.Item href="#billing">Billing</Menu.Item>
            </Menu.List>
          </Menu>
        </Box>
        <Box flexGrow="1">
          <Content>
            <p>
              The side keeps its width, and this one grows into the rest of the
              row. Each Box’s own margin is zeroed, so the gap is the only space
              between them.
            </p>
          </Content>
        </Box>
      </Flex>
    );
  },
};

export const Column: Story = {
  args: { flexDirection: 'column', alignItems: 'flex-start' },
};

export const Wrapping: Story = {
  args: {
    flexWrap: 'wrap',
    columnGap: '3',
    rowGap: '1',
    children: Array.from({ length: 12 }, (_, i) => (
      <Button key={i} size="small">
        Item {i + 1}
      </Button>
    )),
  },
};
