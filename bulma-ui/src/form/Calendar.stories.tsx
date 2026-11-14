import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Calendar } from './Calendar';
import type { CalendarSingleProps } from './Calendar';
import type { DateRangeValue } from './_pickerInternals/pickerTypes';
import { Fieldset } from './Fieldset';
import { Block } from '../elements/Block';
import { Icon } from '../elements/Icon';
import { Paragraph } from '../elements/Paragraph';
import { Title } from '../elements/Title';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';
import { validColors } from '../helpers/useBulmaClasses';

// The stories' args are a one-day Calendar's, which the range story
// trades for its own value.
const meta: Meta<CalendarSingleProps> = {
  title: 'Form/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Months on the page, not behind an input. A click picks a day or a range, each day can show what is on it, and the month on show can be held from outside, so an app loads each month’s data as it comes up.',
      },
    },
  },
  args: {
    'aria-label': 'Pick a day',
    defaultMonth: new Date(2026, 10, 1),
  },
  argTypes: {
    selectionMode: {
      control: 'inline-radio',
      options: ['single', 'range'],
      description: 'Picks one day, or a range’s start and then its end',
    },
    value: {
      control: false,
      description: 'The picked day, or range, when you hold the state',
    },
    defaultValue: {
      control: false,
      description: 'The value to begin with, when the Calendar holds it',
    },
    onChange: {
      control: false,
      description: 'Called with the picked day, or both ends of a range',
    },
    granularity: {
      control: 'inline-radio',
      options: ['day', 'month', 'year'],
      description: 'Picks a day, a month or a year (one-day mode only)',
    },
    month: {
      control: false,
      description: 'The month on show, when you hold the state',
    },
    defaultMonth: {
      control: false,
      description: 'The month on show to begin with',
    },
    onMonthChange: {
      control: false,
      description: 'Called with the first day of the new month on show',
    },
    monthsToShow: {
      control: { type: 'number', min: 1, max: 4 },
      description: 'How many months show side by side',
    },
    dayTemplate: {
      control: false,
      description: 'Draws content under a day’s number',
    },
    getDayLabel: {
      control: false,
      description: 'Builds a day’s accessible name from its full date',
    },
    loading: {
      control: 'boolean',
      description: 'Marks the grids busy and dims the day content',
    },
    readOnly: {
      control: 'boolean',
      description: 'Days can be read but not picked',
    },
    disabled: {
      control: 'boolean',
      description: 'Nothing can be focused or picked',
    },
    isFullwidth: {
      control: 'boolean',
      description: 'Stretches the months to the width of the container',
    },
    min: { control: false, description: 'Earliest day that can be picked' },
    max: { control: false, description: 'Latest day that can be picked' },
    shouldDisableDate: {
      control: false,
      description: 'Rules days out, such as weekends',
    },
    unselectableDates: {
      control: false,
      description: 'Days that can’t be picked',
    },
    locale: {
      control: 'text',
      description: 'BCP-47 locale for the names of days and months',
    },
    firstDayOfWeek: {
      control: { type: 'number', min: 0, max: 6 },
      description: 'Day the week starts on (0 = Sunday)',
    },
    dayNames: { control: false, description: 'The seven day names' },
    monthNames: { control: false, description: 'The twelve month names' },
    nearbyMonthDays: {
      control: 'boolean',
      description: 'Shows the nearby months’ days, dimmed',
    },
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
      description: 'Bulma color for the picked days',
    },
    size: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'Size of the cells and their text',
    },
    labels: {
      control: false,
      description: 'The strings, in your app’s language',
    },
    textColor: {
      control: 'select',
      options: [undefined, ...validColors, 'inherit', 'current'],
      description: 'Text color helper',
    },
    bgColor: {
      control: 'select',
      options: [undefined, ...validColors, 'inherit', 'current'],
      description: 'Background color helper',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<CalendarSingleProps>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('group', { name: 'Pick a day' })
    ).toBeInTheDocument();
    await expect(canvas.getByRole('grid')).toHaveAccessibleName(
      'November 2026'
    );
  },
};

export const Range: Story = {
  args: {
    'aria-label': 'Your stay',
    monthsToShow: 2,
  },
  render: function RangeExample({
    selectionMode: _mode,
    value: _value,
    defaultValue: _defaultValue,
    onChange: _onChange,
    granularity: _granularity,
    ...args
  }) {
    const [stay, setStay] = useState<DateRangeValue>([null, null]);
    return (
      <>
        <Calendar
          {...args}
          selectionMode="range"
          value={stay}
          onChange={setStay}
        />
        <Paragraph mt="3">
          {stay[0] && stay[1]
            ? `${stay[0].toDateString()} to ${stay[1].toDateString()}`
            : 'Pick a check-in day, then a check-out day.'}
        </Paragraph>
      </>
    );
  },
  argTypes: { selectionMode: { control: false } },
};

export const SeveralMonths: Story = {
  args: { monthsToShow: 3 },
};

/** A made-up price for a day, the same on every render. */
const priceOf = (date: Date) => 60 + ((date.getDate() * 7) % 50);

export const Prices: Story = {
  args: { 'aria-label': 'Pick a departure day' },
  render: function PricesExample(args) {
    const [day, setDay] = useState<Date | null>(null);
    return (
      <Calendar
        {...args}
        selectionMode="single"
        value={day}
        onChange={setDay}
        dayTemplate={date => `$${priceOf(date)}`}
        getDayLabel={(date, label) => `${label}, $${priceOf(date)}`}
      />
    );
  },
};

/** Slots left on a day: none at weekends, a few otherwise. */
const slotsLeft = (date: Date) =>
  date.getDay() === 0 || date.getDay() === 6 ? 0 : (date.getDate() % 5) + 1;

export const LoadingEachMonth: Story = {
  args: { 'aria-label': 'Book a slot' },
  render: function LoadingExample(args) {
    const [month, setMonth] = useState(new Date(2026, 10, 1));
    const [loading, setLoading] = useState(false);
    const [day, setDay] = useState<Date | null>(null);
    // A month's data takes a moment to arrive, as a fetch would.
    useEffect(() => {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 600);
      return () => clearTimeout(timer);
    }, [month]);
    return (
      <Calendar
        {...args}
        selectionMode="single"
        month={month}
        onMonthChange={setMonth}
        loading={loading}
        value={day}
        onChange={setDay}
        shouldDisableDate={date => slotsLeft(date) === 0}
        dayTemplate={date => slotsLeft(date) > 0 && `${slotsLeft(date)} left`}
        getDayLabel={(date, label) => `${label}, ${slotsLeft(date)} slots left`}
      />
    );
  },
  argTypes: { loading: { control: false } },
};

const HOLIDAYS: Record<string, string> = {
  '2026-11-26': 'Thanksgiving',
  '2026-12-25': 'Christmas Day',
  '2026-12-31': "New Year's Eve",
};
const holidayOf = (date: Date) =>
  HOLIDAYS[
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  ];

export const ReadOnly: Story = {
  args: { 'aria-label': undefined, readOnly: true },
  render: function ReadOnlyExample(args) {
    return (
      <>
        <Title as="h2" size="5" id="holidays-heading">
          Team holidays
        </Title>
        <Calendar
          {...args}
          aria-labelledby="holidays-heading"
          dayTemplate={date =>
            holidayOf(date) && <Icon name="star" size="small" />
          }
          getDayLabel={(date, label) =>
            holidayOf(date) ? `${label}, ${holidayOf(date)}` : label
          }
        />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('gridcell', {
        name: 'Thursday, November 26, 2026, Thanksgiving',
      })
    ).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  render: function DisabledExample(args) {
    return (
      <Fieldset legend="Delivery day" disabled>
        <Calendar {...args} />
      </Fieldset>
    );
  },
};

export const MinMaxAndDisabledDays: Story = {
  args: {
    min: new Date(2026, 10, 5),
    max: new Date(2026, 11, 20),
    shouldDisableDate: (date: Date) => date.getDay() === 0,
  },
};

export const MonthAndYear: Story = {
  render: function MonthAndYearExample(args) {
    return (
      <Columns>
        <Column>
          <Calendar {...args} aria-label="Pick a month" granularity="month" />
        </Column>
        <Column>
          <Calendar {...args} aria-label="Pick a year" granularity="year" />
        </Column>
      </Columns>
    );
  },
  argTypes: { granularity: { control: false } },
};

export const ColorsAndSizes: Story = {
  render: function ColorsExample(args) {
    return (
      <Columns isMultiline>
        {(
          [
            ['primary', 'small'],
            ['info', undefined],
            ['success', 'medium'],
            ['danger', 'large'],
          ] as const
        ).map(([color, size]) => (
          <Column key={color} isNarrow>
            <Calendar
              {...args}
              aria-label={`Pick a day (${color})`}
              color={color}
              size={size}
              defaultValue={new Date(2026, 10, 18)}
            />
          </Column>
        ))}
      </Columns>
    );
  },
  argTypes: { color: { control: false }, size: { control: false } },
};

export const FullWidth: Story = {
  args: { isFullwidth: true, monthsToShow: 2 },
  render: function FullWidthExample(args) {
    return (
      <Block>
        <Calendar
          {...args}
          dayTemplate={date => `$${priceOf(date)}`}
          getDayLabel={(date, label) => `${label}, $${priceOf(date)}`}
        />
      </Block>
    );
  },
};

export const Agenda: Story = {
  args: { 'aria-label': 'Show a day’s agenda' },
  render: function AgendaExample(args) {
    const [day, setDay] = useState<Date | null>(new Date(2026, 10, 17));
    return (
      <Columns>
        <Column isNarrow>
          <Calendar
            {...args}
            selectionMode="single"
            value={day}
            onChange={setDay}
          />
        </Column>
        <Column>
          <Title as="h3" size="6">
            {day ? day.toDateString() : 'No day picked'}
          </Title>
          <Paragraph>
            {day && day.getDay() % 6 !== 0
              ? 'Stand-up at 9:30, design review at 14:00.'
              : 'Nothing on.'}
          </Paragraph>
        </Column>
      </Columns>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('gridcell', { name: 'Thursday, November 19, 2026' })
    );
    await expect(
      canvas.getByRole('heading', { name: 'Thu Nov 19 2026' })
    ).toBeInTheDocument();
  },
};
