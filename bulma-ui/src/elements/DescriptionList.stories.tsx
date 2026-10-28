import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { DescriptionList } from './DescriptionList';
import { Block } from './Block';
import { Box } from './Box';
import { Button } from './Button';
import { Icon } from './Icon';
import { Link } from './Link';
import { Tag } from './Tag';
import { Tags } from './Tags';
import { Title } from './Title';
import { Popover } from '../components/Popover';
import { Column } from '../columns/Column';
import { Columns } from '../columns/Columns';
import { validColors } from '../helpers/useBulmaClasses';

const ORIENTATIONS = [undefined, 'vertical', 'horizontal'] as const;

/** An order's details, as items. */
const order = (
  <>
    <DescriptionList.Item label="Order" value="#1234" />
    <DescriptionList.Item label="Placed on" value="14 October 2026" />
    <DescriptionList.Item
      label="Estimated delivery"
      value="Between 18 and 21 October 2026"
    />
    <DescriptionList.Item label="Total" value="$86.40" />
  </>
);

const meta: Meta<typeof DescriptionList> = {
  title: 'Elements/DescriptionList',
  component: DescriptionList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Facts about one thing, each a label and its value: a dl with a div per item, a dt per label and a dd per value. Labels sit above their values on a phone and beside them from the tablet breakpoint up, sharing one column so the values line up. For data with two dimensions, use a Table.',
      },
    },
  },
  args: {
    children: order,
  },
  argTypes: {
    children: {
      control: false,
      description: 'DescriptionList.Items, one for each fact',
    },
    orientation: {
      control: 'inline-radio',
      options: ORIENTATIONS,
      description:
        'Labels above their values or beside them, at every width no orientation<Viewport> prop covers; with none, above on a phone and beside from tablet up',
    },
    orientationMobile: {
      control: 'inline-radio',
      options: ORIENTATIONS,
      description: 'The orientation below the tablet breakpoint (769px)',
    },
    orientationTablet: {
      control: 'inline-radio',
      options: ORIENTATIONS,
      description: 'The orientation from the tablet breakpoint (769px) up',
    },
    orientationDesktop: {
      control: 'inline-radio',
      options: ORIENTATIONS,
      description: 'The orientation from the desktop breakpoint (1024px) up',
    },
    orientationWidescreen: {
      control: 'inline-radio',
      options: ORIENTATIONS,
      description: 'The orientation from the widescreen breakpoint (1216px) up',
    },
    orientationFullhd: {
      control: 'inline-radio',
      options: ORIENTATIONS,
      description: 'The orientation from the fullhd breakpoint (1408px) up',
    },
    hasDividers: {
      control: 'boolean',
      description: 'Draws a line between items',
    },
    textColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Text color helper; colors the values',
    },
    bgColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Background color helper',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DescriptionList>;

export const Default: Story = {
  render: function DefaultExample(args) {
    return (
      <>
        <Title as="h2" textSize="5" id="order-heading">
          Order details
        </Title>
        <DescriptionList {...args} aria-labelledby="order-heading" />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('term')).toHaveLength(4);
    await expect(canvas.getAllByRole('definition')).toHaveLength(4);
    await expect(
      canvasElement.querySelector('dl')?.getAttribute('aria-labelledby')
    ).toBe('order-heading');
  },
};

export const Orientations: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Beside at every width, above at every width, and above until the desktop breakpoint. Beside, every label shares one column as wide as the longest, so the values line up.',
      },
    },
  },
  render: function OrientationsExample() {
    return (
      <>
        <Title as="h3" size="6">
          Beside
        </Title>
        <DescriptionList orientation="horizontal">{order}</DescriptionList>
        <Title as="h3" size="6">
          Above
        </Title>
        <DescriptionList orientation="vertical">{order}</DescriptionList>
        <Title as="h3" size="6">
          Above until desktop
        </Title>
        <DescriptionList orientation="vertical" orientationDesktop="horizontal">
          {order}
        </DescriptionList>
      </>
    );
  },
};

export const PhoneWidth: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: {
    docs: {
      description: {
        story:
          'Below Bulma’s tablet breakpoint, labels sit above their values, and a long value wraps. Open this one on its own to see it at a phone’s width.',
      },
    },
  },
  render: function PhoneWidthExample() {
    return (
      <DescriptionList>
        {order}
        <DescriptionList.Item
          label="Email"
          value="ada.lovelace@analytical-engine.example.com"
        />
      </DescriptionList>
    );
  },
};

export const Dividers: Story = {
  args: {
    hasDividers: true,
    orientation: 'horizontal',
  },
};

export const RichValues: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A value can be a link or a tag, an item can have several values, and a label can hold a button that opens a Popover about it, named "About" and the label.',
      },
    },
  },
  render: function RichValuesExample() {
    return (
      <DescriptionList hasDividers>
        <DescriptionList.Item
          label="Status"
          value={<Tag color="success">Shipped</Tag>}
        />
        <DescriptionList.Item
          label="Tracking"
          value={<Link href="#track">1Z999AA10123456784</Link>}
        />
        <DescriptionList.Item label="Delivery notes">
          <DescriptionList.Value>Leave with a neighbour</DescriptionList.Value>
          <DescriptionList.Value>Ring twice</DescriptionList.Value>
        </DescriptionList.Item>
        <DescriptionList.Item value="Partner warehouse">
          <DescriptionList.Label>
            Fulfilment{' '}
            <Popover
              ariaLabel="About fulfilment"
              trigger={
                <Button
                  size="small"
                  color="ghost"
                  aria-label="About fulfilment"
                >
                  <Icon name="circle-info" />
                </Button>
              }
            >
              <Popover.Body>
                Packed and shipped by a partner warehouse, not by us.
              </Popover.Body>
              <Popover.Footer>
                <Popover.Close size="small">Close</Popover.Close>
              </Popover.Footer>
            </Popover>
          </DescriptionList.Label>
        </DescriptionList.Item>
        <DescriptionList.Item
          label="Tags"
          value={
            <Tags>
              <Tag>Gift</Tag>
              <Tag>Priority</Tag>
            </Tags>
          }
        />
      </DescriptionList>
    );
  },
};

export const TextSizes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The gaps are in em, so `textSize` scales them with the text.',
      },
    },
  },
  render: function TextSizesExample() {
    return (
      <>
        <DescriptionList textSize="7">{order}</DescriptionList>
        <DescriptionList>{order}</DescriptionList>
        <DescriptionList textSize="4">{order}</DescriptionList>
      </>
    );
  },
};

export const RightToLeft: Story = {
  render: function RightToLeftExample() {
    return (
      <Block dir="rtl" lang="ar">
        <DescriptionList hasDividers>
          <DescriptionList.Item label="الطلب" value="١٢٣٤" />
          <DescriptionList.Item label="تاريخ الطلب" value="١٤ أكتوبر ٢٠٢٦" />
          <DescriptionList.Item label="الإجمالي" value="٨٦٫٤٠ دولار" />
        </DescriptionList>
      </Block>
    );
  },
};

export const InContainers: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Two lists side by side, each in a Box and named by its heading. The lists take the width of their column.',
      },
    },
  },
  render: function InContainersExample() {
    return (
      <Columns>
        <Column>
          <Box>
            <Title as="h3" textSize="5" id="account-heading">
              Account
            </Title>
            <DescriptionList aria-labelledby="account-heading">
              <DescriptionList.Item label="Name" value="Ada Lovelace" />
              <DescriptionList.Item
                label="Email"
                value="ada@analytical-engine.example.com"
              />
              <DescriptionList.Item label="Plan" value="Team" />
            </DescriptionList>
          </Box>
        </Column>
        <Column>
          <Box>
            <Title as="h3" textSize="5" id="billing-heading">
              Billing
            </Title>
            <DescriptionList aria-labelledby="billing-heading">
              <DescriptionList.Item label="Next invoice" value="1 November" />
              <DescriptionList.Item label="Amount" value="$48.00" />
              <DescriptionList.Item label="Card" value="Visa ending 4242" />
            </DescriptionList>
          </Box>
        </Column>
      </Columns>
    );
  },
};

export const CompoundUsage: Story = {
  render: function CompoundUsageExample() {
    return (
      <DescriptionList orientation="horizontal">
        <DescriptionList.Item>
          <DescriptionList.Label>Author</DescriptionList.Label>
          <DescriptionList.Value>Ada Lovelace</DescriptionList.Value>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Label>Languages</DescriptionList.Label>
          <DescriptionList.Value>English</DescriptionList.Value>
          <DescriptionList.Value>French</DescriptionList.Value>
          <DescriptionList.Value>Italian</DescriptionList.Value>
        </DescriptionList.Item>
        <DescriptionList.Item label="Published" value="1843" />
      </DescriptionList>
    );
  },
};
