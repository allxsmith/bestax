import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Stats } from './Stats';
import { Stat } from './Stat';
import { Box } from './Box';
import { Title } from './Title';
import { validColors } from '../helpers/useBulmaClasses';

/** A dashboard's key figures, as Stats. */
const kpis = (
  <>
    <Stat
      label="Revenue"
      value={8456.4}
      format={{ style: 'currency', currency: 'USD' }}
      change={0.12}
      description="since last month"
      locale="en-US"
    />
    <Stat
      label="New customers"
      value={1234}
      change={-0.019}
      description="since last month"
      locale="en-US"
    />
    <Stat
      label="Churn"
      value={0.021}
      format={{ style: 'percent', maximumFractionDigits: 1 }}
      change={0.004}
      changeColor="danger"
      description="since last month"
      locale="en-US"
    />
    <Stat
      label="Requests"
      value={1234567}
      format={{ notation: 'compact' }}
      change={0}
      description="since last month"
      locale="en-US"
    />
  </>
);

const meta: Meta<typeof Stats> = {
  title: 'Elements/Stats',
  component: Stats,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A row of Stats as one description list on Bulma’s smart grid: a dl.stats.grid with a div per Stat. Tiles are at least minCol wide and wrap without media queries; the gap helper prop spaces them. Name the row with aria-labelledby pointing at the heading above it.',
      },
    },
  },
  args: {
    children: kpis,
    minCol: 8,
    gap: 4,
  },
  argTypes: {
    children: {
      control: false,
      description: 'Stats, one per figure, and nothing else',
    },
    minCol: {
      control: { type: 'range', min: 1, max: 32 },
      description:
        'The narrowest a tile gets before the row wraps (is-col-min-*), 1.5rem a step',
    },
    gap: {
      control: 'select',
      options: [undefined, 0, 1, 2, 3, 4, 5, 6, 7, 8],
      description: 'The space between tiles (is-gap-*), 0.5rem a step',
    },
    textColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description:
        'Text color helper; each Stat without its own takes it for its figure',
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
type Story = StoryObj<typeof Stats>;

export const Default: Story = {
  render: function DefaultExample(args) {
    return (
      <>
        <Title as="h2" size="5" id="kpis">
          This month
        </Title>
        <Stats {...args} aria-labelledby="kpis" />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelectorAll('dl')).toHaveLength(1);
    await expect(canvas.getAllByRole('term')).toHaveLength(4);
    await expect(
      canvasElement.querySelector('dl')?.getAttribute('aria-labelledby')
    ).toBe('kpis');
  },
};

export const NarrowTiles: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A smaller minCol fits more tiles to a line before the row wraps.',
      },
    },
  },
  args: {
    minCol: 5,
    gap: 2,
  },
};

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Each tile shows a Skeleton while its figure loads, so the row keeps its height when they arrive.',
      },
    },
  },
  render: function LoadingExample(args) {
    return (
      <Stats {...args}>
        <Stat label="Revenue" loading description="since last month" />
        <Stat label="New customers" loading description="since last month" />
        <Stat label="Churn" loading description="since last month" />
      </Stats>
    );
  },
};

export const TextColor: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'textColor on the row colors each figure; a Stat’s own wins. The labels, the changes and the notes keep their colors.',
      },
    },
  },
  render: function TextColorExample(args) {
    return (
      <Stats {...args} textColor="link">
        <Stat label="Revenue" value="$8,456" />
        <Stat label="Refunds" value="$312" textColor="danger" />
      </Stats>
    );
  },
};

export const OnSurfaces: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Stats are text on the page’s background; a Box around the whole row gives it a surface. A Box can’t go around one Stat in a row, since the row is a list that holds only its Stats; give that Stat helper props instead.',
      },
    },
  },
  render: function OnSurfacesExample(args) {
    return (
      <Box>
        <Stats {...args} />
      </Box>
    );
  },
};

export const RightToLeft: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The grid follows the writing direction, so the first tile sits on the right.',
      },
    },
  },
  render: function RightToLeftExample(args) {
    return (
      <div dir="rtl" lang="ar">
        <Stats {...args}>
          <Stat label="الإيرادات" value={8456.4} change={0.12} locale="ar-EG" />
          <Stat label="عملاء جدد" value={1234} change={-0.019} locale="ar-EG" />
        </Stats>
      </div>
    );
  },
};
