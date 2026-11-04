import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Center } from './Center';
import { Loader } from '../elements/Loader';
import { Icon } from '../elements/Icon';
import { Paragraph } from '../elements/Paragraph';
import { Block } from '../elements/Block';
import { Button } from '../elements/Button';
import { Card } from '../components/Card';
import {
  validColors,
  validDisplays,
  validGaps,
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

const meta: Meta<typeof Center> = {
  title: 'Layout/Center',
  component: Center,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Centers its content on both axes. Give it a height, or put it in something that has one, to center down the middle as well as across.',
      },
    },
  },
  args: {
    bgColor: 'light',
    aspectRatio: '16by9',
    children: <Loader textSize="3" ariaLabel="Loading the report" />,
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
      description: 'Space between children, when there are several',
    },
    display: {
      control: 'select',
      options: [undefined, ...validDisplays],
      description:
        '`inline-flex` sizes it to its content, to center something inside a line of text',
    },
    aspectRatio: {
      control: 'text',
      description: 'Aspect ratio helper, which gives it a height to center in',
    },
    children: {
      control: false,
      description: 'What it centers',
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
type Story = StoryObj<typeof Center>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const center = canvasElement.querySelector('.stack') as HTMLElement;
    await expect(center).toHaveClass('is-centered');
    await expect(getComputedStyle(center).justifyContent).toBe('center');
    await expect(getComputedStyle(center).alignItems).toBe('center');
  },
};

export const InACard: Story = {
  render: function InACardExample() {
    return (
      <Card>
        <Card.Content>
          <Center p="6">
            <Loader textSize="3" ariaLabel="Loading invoices" />
          </Center>
        </Card.Content>
      </Card>
    );
  },
};

export const SeveralChildren: Story = {
  args: {
    gap: '2',
    children: [
      <Paragraph key="text">Nothing here yet.</Paragraph>,
      <Button key="add" color="primary">
        Add one
      </Button>,
    ],
  },
};

export const Inline: Story = {
  render: function InlineExample() {
    // A Block, not a Paragraph: Center renders a block element, which a
    // `<p>` can't hold.
    return (
      <Block>
        Sync is{' '}
        <Center
          display="inline-flex"
          bgColor="success"
          textColor="white"
          radius="rounded"
          p="1"
        >
          <Icon name="check" ariaLabel="on" />
        </Center>{' '}
        for every device.
      </Block>
    );
  },
};
