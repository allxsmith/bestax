import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DateRangeInput } from './DateRangeInput';
import type { DateRangeValue } from './DateRangeInputBase';
import { Field } from './Field';
import { Control } from './Control';
import { Block } from '../elements/Block';
import { Button } from '../elements/Button';
import { Paragraph } from '../elements/Paragraph';
import { Pre } from '../elements/Pre';

const meta: Meta<typeof DateRangeInput> = {
  title: 'Form/DateRangeInput',
  component: DateRangeInput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A start and end date in one field: two segmented inputs and one popover calendar that picks the start and then the end, with a preview of the range while the end is pending.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: [
        undefined,
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
      ],
      description:
        "Bulma color for the field, and for the calendar's range ends and band.",
    },
    size: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'Size of the field and the calendar.',
    },
    inline: {
      control: 'boolean',
      description: 'Render the calendar on the page, with no inputs.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable both inputs and the launcher.',
    },
    readOnly: {
      control: 'boolean',
      description: 'Make both inputs read-only and keep the popover closed.',
    },
    editable: {
      control: 'boolean',
      description: 'Allow segmented typing in both inputs.',
    },
    popover: {
      control: 'boolean',
      description: 'Whether the calendar popover exists.',
    },
    allowDisabledInRange: {
      control: 'boolean',
      description:
        'Let a range include disabled days, though neither end can be one.',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show a spinner on the Control, in place of the launcher.',
    },
    isRounded: {
      control: 'boolean',
      description: 'Round the field.',
    },
    openOnFocus: {
      control: 'boolean',
      description: 'Open the popover as focus arrives in the field.',
    },
    closeOnSelect: {
      control: 'boolean',
      description: 'Close the popover once the end is picked.',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder for both inputs.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DateRangeInput>;

const describeRange = ([start, end]: DateRangeValue) =>
  `${start ? start.toDateString() : 'no start'} to ${
    end ? end.toDateString() : 'no end'
  }`;

/** Today and a few days on, at midnight. */
const thisWeek = (): DateRangeValue => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  return [start, end];
};

export const Default: Story = {
  args: {
    label: 'Stay',
    placeholder: 'YYYY-MM-DD',
  },
};

export const Controlled: Story = {
  render: function Render() {
    const [range, setRange] = useState<DateRangeValue>([null, null]);
    return (
      <Block>
        <DateRangeInput
          label="Report period"
          value={range}
          onChange={setRange}
        />
        <Paragraph>Selected: {describeRange(range)}</Paragraph>
        <Button size="small" onClick={() => setRange([null, null])}>
          Clear
        </Button>
      </Block>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '`onChange` fires once the calendar has both ends, and as each input is typed into, so a half-typed range arrives as `[start, null]`.',
      },
    },
  },
};

export const Inline: Story = {
  args: {
    label: 'Stay',
    inline: true,
    defaultValue: thisWeek(),
  },
};

export const MinMax: Story = {
  render: () => {
    const today = new Date();
    const inAMonth = new Date();
    inAMonth.setMonth(inAMonth.getMonth() + 1);
    return (
      <DateRangeInput
        label="Within the next month"
        min={today}
        max={inAMonth}
        message="Both ends stay between today and a month from now."
      />
    );
  },
};

export const DisabledDates: Story = {
  render: () => (
    <Block>
      <DateRangeInput
        label="Weekdays only"
        shouldDisableDate={d => d.getDay() === 0 || d.getDay() === 6}
        message="A range can't cross a weekend: a pick past one starts a new range."
      />
      <DateRangeInput
        label="Over weekends"
        shouldDisableDate={d => d.getDay() === 0 || d.getDay() === 6}
        allowDisabledInRange
        message="With allowDisabledInRange the range can cross a weekend, but can't start or end on one."
      />
    </Block>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Block>
      <DateRangeInput label="Small" controlSize="small" size="small" />
      <DateRangeInput label="Default" />
      <DateRangeInput label="Medium" controlSize="medium" size="medium" />
      <DateRangeInput label="Large" controlSize="large" size="large" />
    </Block>
  ),
};

export const Colors: Story = {
  render: () => (
    <Block>
      {(['primary', 'info', 'success', 'warning', 'danger'] as const).map(
        color => (
          <DateRangeInput
            key={color}
            label={color}
            color={color}
            defaultValue={thisWeek()}
          />
        )
      )}
    </Block>
  ),
};

export const InlineColors: Story = {
  render: () => (
    <Block display="flex" flexWrap="wrap">
      {(
        ['primary', 'link', 'info', 'success', 'warning', 'danger'] as const
      ).map(color => (
        <Block key={color} mr="4" mb="4">
          <DateRangeInput
            label={color}
            color={color}
            inline
            defaultValue={thisWeek()}
          />
        </Block>
      ))}
    </Block>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`color` fills the two ends and tints the band between them. Click a day to start a new range and hover to see the fainter preview.',
      },
    },
  },
};

export const States: Story = {
  render: () => (
    <Block>
      <DateRangeInput label="Disabled" disabled defaultValue={thisWeek()} />
      <DateRangeInput label="Read only" readOnly defaultValue={thisWeek()} />
      <DateRangeInput
        label="Loading"
        isLoading
        message="The spinner takes the launcher's place."
      />
    </Block>
  ),
};

export const ManualEntry: Story = {
  args: {
    label: 'Type the dates',
    openOnFocus: false,
    placeholder: 'YYYY-MM-DD',
  },
  parameters: {
    docs: {
      description: {
        story:
          'With `openOnFocus` off, both inputs are for typing: segments step with the arrow keys and fill from digits, and `Tab` moves from the start to the end. The launcher, or `ArrowDown`, opens the calendar.',
      },
    },
  },
};

export const Localized: Story = {
  args: {
    label: 'Séjour',
    locale: 'fr-FR',
    firstDayOfWeek: 1,
    format: 'DD/MM/YYYY',
    placeholder: 'JJ/MM/AAAA',
    labels: {
      rangeStart: 'Arrivée',
      rangeEnd: 'Départ',
      rangePreviewEnd: 'Choisir comme départ',
      rangeSeparator: 'au',
      chooseDateRange: 'Choisir les dates',
      prevMonth: 'Mois précédent',
      nextMonth: 'Mois suivant',
    },
  },
};

export const MobileNative: Story = {
  args: {
    label: 'Stay',
    mobileNative: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Forced on here. With the default `'auto'`, touch devices with a small screen get two native date inputs, the end bounded by the start.",
      },
    },
  },
};

export const Composed: Story = {
  render: () => (
    <Field label="Leave">
      <Control>
        <DateRangeInput />
      </Control>
    </Field>
  ),
};

export const InForm: Story = {
  render: function Render() {
    const [entries, setEntries] = useState('');
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setEntries(JSON.stringify(Array.from(data.entries()), null, 2));
        }}
      >
        <DateRangeInput
          label="Stay"
          name="stay"
          defaultValue={thisWeek()}
          required
        />
        <Button type="submit" color="primary">
          Submit
        </Button>
        {entries && <Pre mt="3">{entries}</Pre>}
      </form>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Two hidden inputs submit the range as `stay[start]` and `stay[end]`, in `YYYY-MM-DD`. `startName` and `endName` rename either one.',
      },
    },
  },
};
