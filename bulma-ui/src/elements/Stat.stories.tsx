import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Stat } from './Stat';
import { Stats } from './Stats';
import { Box } from './Box';
import { Button } from './Button';
import { Icon } from './Icon';
import { NumberFormatter } from './NumberFormatter';
import { RingProgress } from './RingProgress';
import { Popover } from '../components/Popover';
import { LocaleProvider } from '../helpers/LocaleProvider';
import { validColors } from '../helpers/useBulmaClasses';

const COLORS = [
  undefined,
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

const meta: Meta<typeof Stat> = {
  title: 'Elements/Stat',
  component: Stat,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A figure with its name, and often a change and a note: a dt for the label and a dd each for the figure, the change and the note. On its own a Stat is a dl; inside Stats it is a div in the row’s dl. A number value is written by NumberFormatter, and a change is written with its sign, so the direction is in the text, beside a decorative arrow and a tone.',
      },
    },
  },
  args: {
    label: 'Revenue',
    value: 8456.4,
    format: { style: 'currency', currency: 'USD' },
    locale: 'en-US',
    change: 0.12,
    description: 'since last month',
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'What the figure is, as a Stat.Label before the children',
    },
    value: {
      control: 'number',
      description:
        'The figure, as a Stat.Value; a number is written by NumberFormatter, anything else renders as given',
    },
    format: {
      control: 'object',
      description: 'Intl.NumberFormat options for a number value',
    },
    locale: {
      control: 'text',
      description:
        'The locale for the value and the change; unset, the LocaleProvider’s, else the runtime’s',
    },
    change: {
      control: { type: 'number', step: 0.001 },
      description:
        'The change, written with its sign; a fraction with the default format (0.12 for 12%)',
    },
    changeFormat: {
      control: 'object',
      description:
        'Intl.NumberFormat options for the change; they replace the default, and the sign is added unless they set signDisplay',
    },
    changeColor: {
      control: 'select',
      options: COLORS,
      description:
        'The change’s color; unset, success up, danger down and none at zero',
    },
    description: {
      control: 'text',
      description: 'A note under the figure, as a Stat.Description last',
    },
    size: {
      control: 'inline-radio',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'The figure’s size, a step of Bulma’s size scale',
    },
    loading: {
      control: 'boolean',
      description:
        'Shows a Skeleton in place of value and sets aria-busy on the Stat',
    },
    children: {
      control: false,
      description:
        'Stat.Label, Stat.Value, Stat.Change and Stat.Description, for anything the props don’t cover',
    },
    textColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Text color helper; colors the figure',
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
type Story = StoryObj<typeof Stat>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('term')).toHaveTextContent('Revenue');
    await expect(
      canvas.getAllByRole('definition').map(dd => dd.textContent)
    ).toEqual(['$8,456.40', '+12%', 'since last month']);
  },
};

export const Changes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Up, down and no change, in the sign’s tone, then a change that rounds to zero, which reads as zero, and a churn rate where up is bad news, so changeColor makes it danger.',
      },
    },
  },
  render: function ChangesExample() {
    return (
      <Stats minCol={8} gap={4}>
        <Stat label="Up" value={1280} change={0.12} locale="en-US" />
        <Stat label="Down" value={1180} change={-0.019} locale="en-US" />
        <Stat label="Flat" value={1200} change={0} locale="en-US" />
        <Stat
          label="Rounds to zero"
          value={1200}
          change={0.0004}
          locale="en-US"
        />
        <Stat
          label="Churn"
          value={0.021}
          format={{ style: 'percent', maximumFractionDigits: 1 }}
          change={0.004}
          changeColor="danger"
          locale="en-US"
        />
      </Stats>
    );
  },
};

export const ChangeColors: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Every color a change takes, each its -on-scheme variant so it reads as text in light and dark.',
      },
    },
  },
  render: function ChangeColorsExample() {
    return (
      <Stats minCol={6} gap={3}>
        {COLORS.filter(Boolean).map(color => (
          <Stat
            key={color}
            label={color}
            value={42}
            change={0.05}
            changeColor={color}
            locale="en-US"
          />
        ))}
      </Stats>
    );
  },
};

export const ChangeFormats: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A changeFormat of your own replaces the default and keeps the sign: an amount in dollars, and a count of points.',
      },
    },
  },
  render: function ChangeFormatsExample() {
    return (
      <Stats minCol={8} gap={4}>
        <Stat
          label="Revenue"
          value={8456.4}
          format={{ style: 'currency', currency: 'USD' }}
          change={1250}
          changeFormat={{ style: 'currency', currency: 'USD' }}
          locale="en-US"
        />
        <Stat
          label="Score"
          value={87}
          change={-3}
          changeFormat={{ maximumFractionDigits: 0 }}
          locale="en-US"
        />
      </Stats>
    );
  },
};

export const Sizes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'size steps the figure through Bulma’s size scale; the label, the change and the note stay small.',
      },
    },
  },
  render: function SizesExample() {
    return (
      <Stats minCol={8} gap={4}>
        {([undefined, 'small', 'medium', 'large'] as const).map(size => (
          <Stat
            key={size ?? 'default'}
            label={size ?? 'default'}
            value={1234}
            change={0.08}
            size={size}
            locale="en-US"
          />
        ))}
      </Stats>
    );
  },
};

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A Skeleton one line of the figure tall stands in for the value, and the Stat is aria-busy.',
      },
    },
  },
  args: {
    loading: true,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('dl')).toHaveAttribute(
      'aria-busy',
      'true'
    );
  },
};

export const NotANumber: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A value that isn’t a number renders as given, so a figure that isn’t known yet can say so.',
      },
    },
  },
  args: {
    label: 'Revenue',
    value: 'N/A',
    change: undefined,
    description: 'no sales yet this month',
  },
};

export const WithParts: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Parts for what the props don’t cover: an info tip in the label, a RingProgress beside the figure, and a unit written by NumberFormatter.',
      },
    },
  },
  render: function WithPartsExample() {
    return (
      <Stats minCol={10} gap={4}>
        <Stat>
          <Stat.Label>
            Storage used{' '}
            <Popover
              ariaLabel="About storage used"
              trigger={
                <Button
                  size="small"
                  color="ghost"
                  aria-label="About storage used"
                >
                  <Icon name="circle-info" />
                </Button>
              }
            >
              <Popover.Body>Photos, files and backups.</Popover.Body>
            </Popover>
          </Stat.Label>
          <Stat.Value display="flex" alignItems="center" gap="3">
            <RingProgress value={62} size="small" label="Storage used">
              62%
            </RingProgress>
            <NumberFormatter
              value={31}
              format={{ style: 'unit', unit: 'gigabyte' }}
              locale="en-US"
            />
          </Stat.Value>
          <Stat.Description>of 50 GB</Stat.Description>
        </Stat>
        <Stat>
          <Stat.Label>Median response time</Stat.Label>
          <Stat.Value>
            <NumberFormatter
              value={182}
              format={{ style: 'unit', unit: 'millisecond' }}
              locale="en-US"
            />
          </Stat.Value>
          <Stat.Change value={-0.08} color="success" locale="en-US" />
        </Stat>
      </Stats>
    );
  },
};

export const OnASurface: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A Stat is text on the page’s background; a Box gives it a surface.',
      },
    },
  },
  render: function OnASurfaceExample(args) {
    return (
      <Box>
        <Stat {...args} />
      </Box>
    );
  },
};

export const InALocale: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Inside a LocaleProvider, the figures and the changes follow its locale: German, then Arabic from right to left. The provider goes around the row, since its wrapper can’t sit inside a list.',
      },
    },
  },
  render: function InALocaleExample() {
    return (
      <>
        <LocaleProvider locale="de-DE">
          <Stats minCol={8} gap={4}>
            <Stat
              label="Umsatz"
              value={8456.4}
              format={{ style: 'currency', currency: 'EUR' }}
              change={-0.019}
            />
            <Stat label="Neukunden" value={1234} change={0.12} />
          </Stats>
        </LocaleProvider>
        <LocaleProvider locale="ar-EG" dir="rtl">
          <Stats minCol={8} gap={4}>
            <Stat
              label="الإيرادات"
              value={8456.4}
              format={{ style: 'currency', currency: 'EGP' }}
              change={-0.019}
            />
            <Stat label="عملاء جدد" value={1234} change={0.12} />
          </Stats>
        </LocaleProvider>
      </>
    );
  },
};

export const CompoundUsage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The same tile from parts: Stat.Label, Stat.Value, Stat.Change and Stat.Description.',
      },
    },
  },
  render: function CompoundUsageExample() {
    return (
      <Stat>
        <Stat.Label>Revenue</Stat.Label>
        <Stat.Value>
          <NumberFormatter
            value={8456.4}
            format={{ style: 'currency', currency: 'USD' }}
            locale="en-US"
          />
        </Stat.Value>
        <Stat.Change value={0.12} locale="en-US" />
        <Stat.Description>since last month</Stat.Description>
      </Stat>
    );
  },
};
