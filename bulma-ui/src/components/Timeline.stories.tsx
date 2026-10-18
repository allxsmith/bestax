import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Timeline } from './Timeline';
import { Card } from './Card';
import { Block } from '../elements/Block';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Icon } from '../elements/Icon';
import { Link } from '../elements/Link';
import { Notification } from '../elements/Notification';
import { Paragraph } from '../elements/Paragraph';
import { Title } from '../elements/Title';
import { Column } from '../columns/Column';
import { Columns } from '../columns/Columns';
import { validColors } from '../helpers/useBulmaClasses';

const COLORS = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

const STAGES = [
  {
    title: 'Order placed',
    time: '12 October, 09:30',
    dateTime: '2026-10-12T09:30',
  },
  { title: 'Packed', time: '13 October, 14:05', dateTime: '2026-10-13T14:05' },
  {
    title: 'Shipped',
    time: '14 October, 08:12',
    dateTime: '2026-10-14T08:12',
  },
  {
    title: 'Delivered',
    time: 'Expected 16 October',
    dateTime: '2026-10-16',
  },
];

/** The order's stages as items, the first `count` of them. */
const stages = (count = STAGES.length) =>
  STAGES.slice(0, count).map(stage => (
    <Timeline.Item key={stage.title} {...stage} />
  ));

/** A company's milestones, for the record and alternate stories. */
const milestones = (
  <>
    <Timeline.Item
      title="Founded"
      time="March 2019"
      dateTime="2019-03"
      icon="flag"
    >
      Two people and a spare room.
    </Timeline.Item>
    <Timeline.Item
      title="First office"
      time="June 2021"
      dateTime="2021-06"
      icon="building"
    >
      Twelve of us, in Leeds, and a longer line here to see how the text wraps
      beside the rail.
    </Timeline.Item>
    <Timeline.Item
      title="The mobile app"
      time="October 2026"
      dateTime="2026-10"
      icon={<Icon name="mobile" variant="solid" />}
      color="info"
    />
  </>
);

const meta: Meta<typeof Timeline> = {
  title: 'Components/Timeline',
  component: Timeline,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A list of events in the order they happened, each with a marker on a line down the side. By default it is a record and marks nothing. With `active` it marks progress for something that moves along on its own, and `pending` ends it on what is under way. The states are read as words and drawn as shapes, so no state is told by color alone.',
      },
    },
  },
  args: {
    titleAs: 'h3',
    children: (
      <>
        <Timeline.Item
          title="Delivered"
          time="16 October 2026, 11:40"
          dateTime="2026-10-16T11:40"
          color="success"
        >
          Signed for by A. Smith.
        </Timeline.Item>
        <Timeline.Item
          title="Shipped"
          time="14 October 2026, 08:12"
          dateTime="2026-10-14T08:12"
        >
          <Paragraph>
            Tracking number <Link href="#track">1Z999AA10123456784</Link>
          </Paragraph>
        </Timeline.Item>
        <Timeline.Item
          title="Order placed"
          time="12 October 2026, 09:30"
          dateTime="2026-10-12T09:30"
        />
      </>
    ),
  },
  argTypes: {
    children: {
      control: false,
      description:
        'Timeline.Items in the order they are read; each child counts as one item, with Fragments and arrays opened up',
    },
    active: {
      control: 'number',
      description:
        'Marks progress: the item at this index is current, the ones before it completed and the rest upcoming; leave it out for a record',
    },
    pending: {
      control: 'text',
      description:
        'What is under way, as a last item after the children, read with pendingLabel',
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'end', 'alternate'],
      description:
        'Where the rail goes: at the start, at the end, or down the middle with the items taking turns (start below the tablet breakpoint)',
    },
    titleAs: {
      control: 'select',
      options: ['h2', 'h3', 'h4', 'h5', 'h6', 'p'],
      description:
        'What every title renders as: the heading level under the one the timeline sits beneath, or p for a busy feed',
    },
    color: {
      control: 'select',
      options: [undefined, ...COLORS],
      description:
        'The markers’ color and the color of progress; neutral without it, and link for progress',
    },
    completedLabel: {
      control: 'text',
      description: 'Read after a completed item’s title, visually hidden',
    },
    upcomingLabel: {
      control: 'text',
      description: 'Read after an upcoming item’s title, visually hidden',
    },
    pendingLabel: {
      control: 'text',
      description: 'Read after the pending item’s title, visually hidden',
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
      description: 'Additional CSS classes to apply',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Timeline>;

export const Default: Story = {};

export const Progress: Story = {
  args: {
    active: 2,
    pending: 'Out for delivery',
    children: stages(3),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(4);
    // The states are in the headings as words, apart from the current one,
    // which aria-current says.
    await expect(
      canvas
        .getAllByRole('heading', { level: 3 })
        .map(heading => heading.textContent)
    ).toEqual([
      'Order placed completed',
      'Packed completed',
      'Shipped',
      'Out for delivery in progress',
    ]);
    await expect(canvas.getAllByRole('listitem')[2]).toHaveAttribute(
      'aria-current',
      'step'
    );
  },
};

export const Layouts: Story = {
  render: function LayoutsExample() {
    return (
      <>
        <Title as="h2" textSize="5">
          start
        </Title>
        <Timeline titleAs="h3" active={1} pending="Out for delivery">
          {stages(3)}
        </Timeline>
        <Title as="h2" textSize="5">
          end
        </Title>
        <Timeline
          titleAs="h3"
          align="end"
          active={1}
          pending="Out for delivery"
        >
          {stages(3)}
        </Timeline>
        <Title as="h2" textSize="5">
          alternate
        </Title>
        <Timeline titleAs="h3" align="alternate">
          {milestones}
        </Timeline>
        <Timeline
          titleAs="h3"
          align="alternate"
          active={2}
          pending="Out for delivery"
        >
          {stages(3)}
        </Timeline>
      </>
    );
  },
};

export const IconMarkers: Story = {
  render: function IconMarkersExample() {
    return (
      <Columns>
        <Column>
          <Timeline titleAs="h3" color="primary">
            {milestones}
          </Timeline>
        </Column>
        <Column>
          <Timeline titleAs="h3" active={2}>
            <Timeline.Item
              title="Order placed"
              time="12 October"
              icon="check"
            />
            <Timeline.Item title="Packed" time="13 October" icon="box" />
            <Timeline.Item title="Shipped" time="14 October" icon="truck" />
            <Timeline.Item
              title="Delivered"
              time="Expected 16 October"
              icon="house"
            />
          </Timeline>
        </Column>
      </Columns>
    );
  },
};

export const Colors: Story = {
  render: function ColorsExample() {
    return (
      <Columns isMultiline>
        {COLORS.map(color => (
          <Column key={color} size="one-third">
            <Title as="h2" textSize="6">
              {color}
            </Title>
            <Timeline
              titleAs="h3"
              color={color}
              active={1}
              pending="Out for delivery"
            >
              {stages(3)}
            </Timeline>
          </Column>
        ))}
        <Column size="one-third">
          <Title as="h2" textSize="6">
            A record, one item in its own color
          </Title>
          <Timeline titleAs="h3" color="primary">
            <Timeline.Item title="Deployed" time="10:42" color="success">
              All checks passed.
            </Timeline.Item>
            <Timeline.Item title="Rolled back" time="10:15" color="danger">
              The health check failed.
            </Timeline.Item>
            <Timeline.Item title="Started" time="10:02" />
          </Timeline>
        </Column>
      </Columns>
    );
  },
};

export const TextSizes: Story = {
  render: function TextSizesExample() {
    return (
      <Columns isMultiline>
        {(['7', '6', '5', '4'] as const).map(size => (
          <Column key={size} size="half">
            <Title as="h2" textSize="6">
              textSize {size}
            </Title>
            <Timeline
              titleAs="h3"
              textSize={size}
              active={1}
              pending="Out for delivery"
            >
              <Timeline.Item
                title="Order placed"
                time="12 October"
                icon="check"
              />
              {stages(3).slice(1)}
            </Timeline>
          </Column>
        ))}
      </Columns>
    );
  },
};

export const RightToLeft: Story = {
  render: function RightToLeftExample() {
    const order = (
      <>
        <Timeline.Item
          title="تم الطلب"
          time="١٢ أكتوبر"
          dateTime="2026-10-12"
        />
        <Timeline.Item title="تم الشحن" time="١٤ أكتوبر" dateTime="2026-10-14">
          غادر المستودع.
        </Timeline.Item>
        <Timeline.Item
          title="التوصيل"
          time="متوقع ١٦ أكتوبر"
          dateTime="2026-10-16"
        />
      </>
    );
    const labels = {
      completedLabel: 'مكتمل',
      upcomingLabel: 'قادم',
      pendingLabel: 'قيد التنفيذ',
    };
    return (
      <Block dir="rtl" lang="ar">
        <Timeline titleAs="h3" active={1} pending="قيد التوصيل" {...labels}>
          {order}
        </Timeline>
        <Timeline titleAs="h3" align="end">
          {order}
        </Timeline>
        <Timeline
          titleAs="h3"
          align="alternate"
          active={1}
          pending="قيد التوصيل"
          {...labels}
        >
          {order}
        </Timeline>
      </Block>
    );
  },
};

export const PhoneWidth: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: {
    docs: {
      description: {
        story:
          'Below Bulma’s tablet breakpoint, `alternate` is `start`, with each time back under its title. Open this one on its own to see it at a phone’s width.',
      },
    },
  },
  render: function PhoneWidthExample() {
    return (
      <Timeline
        titleAs="h3"
        align="alternate"
        active={2}
        pending="Out for delivery"
      >
        {stages(3)}
      </Timeline>
    );
  },
};

export const InContainers: Story = {
  render: function InContainersExample() {
    return (
      <>
        <Columns>
          <Column>
            <Box>
              <Title as="h2" textSize="5">
                Order history
              </Title>
              <Timeline titleAs="h3">{stages(3).reverse()}</Timeline>
            </Box>
          </Column>
          <Column>
            <Card header="Activity">
              <Timeline titleAs="p" textSize="7" align="end">
                <Timeline.Item
                  title="Sam merged #42"
                  time="2 minutes ago"
                  dateTime="2026-10-16T14:58Z"
                />
                <Timeline.Item
                  title="Ana approved #42"
                  time="1 hour ago"
                  dateTime="2026-10-16T14:00Z"
                />
                <Timeline.Item
                  title="Sam opened #42"
                  time="Yesterday"
                  dateTime="2026-10-15T09:12Z"
                />
              </Timeline>
            </Card>
          </Column>
        </Columns>
        <Columns isMultiline>
          {(['info', 'success', 'warning', 'danger'] as const).map(color => (
            <Column key={color} size="one-third">
              <Notification color={color}>
                <Timeline titleAs="h3" active={1} pending="Out for delivery">
                  {stages(2)}
                </Timeline>
              </Notification>
            </Column>
          ))}
          <Column size="one-third">
            {/* Progress is link by default, which disappears on a link
                Notification, so this one takes a color that stands out. */}
            <Notification color="link">
              <Timeline
                titleAs="h3"
                color="warning"
                active={1}
                pending="Out for delivery"
              >
                {stages(2)}
              </Timeline>
            </Notification>
          </Column>
        </Columns>
      </>
    );
  },
};

export const LocalizedWords: Story = {
  args: {
    active: 1,
    pending: 'En livraison',
    completedLabel: 'terminé',
    upcomingLabel: 'à venir',
    pendingLabel: 'en cours',
    children: (
      <>
        <Timeline.Item title="Commande passée" />
        <Timeline.Item title="Expédiée" />
        <Timeline.Item title="Livrée" />
      </>
    ),
  },
};

export const ChangesOnScreen: Story = {
  render: function ChangesOnScreenExample() {
    const [reached, setReached] = useState(1);
    const done = reached >= STAGES.length;
    return (
      <Box>
        <Title as="h2" textSize="5">
          Your order
        </Title>
        {/* Always in the page, so a change to its text is announced. */}
        <Paragraph role="status" aria-atomic="true" visibility="sr-only">
          {done ? 'Delivered' : `Now: ${STAGES[reached].title}`}
        </Paragraph>
        <Timeline titleAs="h3" active={reached}>
          {stages()}
        </Timeline>
        <Button
          onClick={() => setReached(n => Math.min(n + 1, STAGES.length))}
          disabled={done}
        >
          Next stage
        </Button>
      </Box>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('Now: Packed');
    await userEvent.click(canvas.getByRole('button', { name: 'Next stage' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Now: Shipped');
    await expect(canvas.getAllByRole('listitem')[2]).toHaveAttribute(
      'aria-current',
      'step'
    );
  },
};

export const CompoundUsage: Story = {
  render: function CompoundUsageExample() {
    return (
      <Timeline titleAs="h3" active={1} color="success">
        <Timeline.Item title="Build" time="10:02" icon="hammer">
          <Paragraph>All 312 tests passed.</Paragraph>
        </Timeline.Item>
        <Timeline.Item title="Deploy to staging" time="10:15" icon="server">
          <Paragraph>
            Rolling out, two of four servers done.{' '}
            <Link href="#logs">See the logs</Link>
          </Paragraph>
        </Timeline.Item>
        <Timeline.Item title="Deploy to production" icon="globe" />
      </Timeline>
    );
  },
};
