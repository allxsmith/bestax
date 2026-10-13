import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  SegmentedControl,
  type SegmentedControlColor,
} from './SegmentedControl';
import { Icon } from '../elements/Icon';
import { Paragraph } from '../elements/Paragraph';

const COLORS: SegmentedControlColor[] = [
  'link',
  'primary',
  'info',
  'success',
  'warning',
  'danger',
];

const meta: Meta<typeof SegmentedControl> = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A row of buttons where only one can be on, such as left, center or right alignment, or a list or grid view. It is Bulma’s .buttons.has-addons row with the checked segment filled, and a radio group to a screen reader: one tab stop, and the arrow keys move the check.',
      },
    },
  },
  argTypes: {
    value: {
      control: false,
      description:
        'The checked segment’s value, when you hold the state; picking a segment then only calls onChange',
    },
    defaultValue: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description:
        'The segment checked to begin with, when the group holds its own state',
    },
    onChange: {
      control: false,
      description:
        'Called with the newly checked value; the arrow keys, Home and End check as they move, and pressing the checked segment calls nothing',
    },
    color: {
      control: 'select',
      options: COLORS,
      description:
        'The checked segment’s fill (default link); the others are plain buttons',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of every segment, through are-<size> on the row',
    },
    hasAddons: {
      control: 'boolean',
      description:
        'Joins the segments into one row with no gaps (default true)',
    },
    isCentered: {
      control: 'boolean',
      description: 'Centers the row',
    },
    isRight: {
      control: 'boolean',
      description: 'Aligns the row to the right',
    },
    'aria-label': {
      control: 'text',
      description:
        'Names the group for a screen reader; pass this or aria-labelledby',
    },
  },
  args: {
    'aria-label': 'Text alignment',
    defaultValue: 'left',
    color: 'link',
  },
  render: function AlignmentExample(args) {
    return (
      <SegmentedControl {...args}>
        <SegmentedControl.Segment value="left">Left</SegmentedControl.Segment>
        <SegmentedControl.Segment value="center">
          Center
        </SegmentedControl.Segment>
        <SegmentedControl.Segment value="right">Right</SegmentedControl.Segment>
      </SegmentedControl>
    );
  },
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

/**
 * Holding its own state. Click a segment, or Tab to the row and use the
 * arrow keys: the check moves with focus.
 */
export const Default: Story = {};

/**
 * Nothing checked to begin with. Tab lands on the first segment without
 * checking it, and Space, Enter or an arrow key picks one. Once one is
 * checked, one always is.
 */
export const NothingCheckedYet: Story = {
  args: { defaultValue: undefined },
};

/** The state held by the caller, and shown under the row. */
export const Controlled: Story = {
  render: function ControlledExample(args) {
    const [range, setRange] = useState('week');
    return (
      <>
        <SegmentedControl
          {...args}
          aria-label="Calendar range"
          value={range}
          onChange={setRange}
        >
          <SegmentedControl.Segment value="day">Day</SegmentedControl.Segment>
          <SegmentedControl.Segment value="week">Week</SegmentedControl.Segment>
          <SegmentedControl.Segment value="month">
            Month
          </SegmentedControl.Segment>
        </SegmentedControl>
        <Paragraph mt="3">Showing one {range} at a time.</Paragraph>
      </>
    );
  },
};

/**
 * Each fill. `white`, `light`, `dark` and `black` aren't offered, since each
 * fills about as light or dark as an unchecked segment already is in one theme
 * or the other.
 */
export const Colors: Story = {
  render: function ColorsExample() {
    return (
      <>
        {COLORS.map(color => (
          <SegmentedControl
            key={color}
            aria-label={`Billing, ${color}`}
            color={color}
            defaultValue="yearly"
          >
            <SegmentedControl.Segment value="monthly">
              Monthly
            </SegmentedControl.Segment>
            <SegmentedControl.Segment value="yearly">
              Yearly
            </SegmentedControl.Segment>
          </SegmentedControl>
        ))}
      </>
    );
  },
};

/** `size` sizes every segment, through Bulma's `are-<size>` on the row. */
export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <>
        {(['small', undefined, 'medium', 'large'] as const).map(size => (
          <SegmentedControl
            key={size ?? 'normal'}
            aria-label={`View, ${size ?? 'normal'}`}
            size={size}
            defaultValue="list"
          >
            <SegmentedControl.Segment value="list">
              List
            </SegmentedControl.Segment>
            <SegmentedControl.Segment value="grid">
              Grid
            </SegmentedControl.Segment>
          </SegmentedControl>
        ))}
      </>
    );
  },
};

/** An icon on its own needs an `aria-label` on its segment. */
export const IconOnly: Story = {
  render: function IconOnlyExample() {
    return (
      <SegmentedControl aria-label="Text alignment" defaultValue="left">
        <SegmentedControl.Segment value="left" aria-label="Align left">
          <Icon name="align-left" />
        </SegmentedControl.Segment>
        <SegmentedControl.Segment value="center" aria-label="Align center">
          <Icon name="align-center" />
        </SegmentedControl.Segment>
        <SegmentedControl.Segment value="right" aria-label="Align right">
          <Icon name="align-right" />
        </SegmentedControl.Segment>
        <SegmentedControl.Segment value="justify" aria-label="Justify">
          <Icon name="align-justify" />
        </SegmentedControl.Segment>
      </SegmentedControl>
    );
  },
};

/** A disabled segment can't be picked, and the arrow keys skip it. */
export const DisabledSegment: Story = {
  render: function DisabledSegmentExample() {
    return (
      <SegmentedControl aria-label="Shipping speed" defaultValue="standard">
        <SegmentedControl.Segment value="standard">
          Standard
        </SegmentedControl.Segment>
        <SegmentedControl.Segment value="express" isDisabled>
          Express
        </SegmentedControl.Segment>
        <SegmentedControl.Segment value="overnight">
          Overnight
        </SegmentedControl.Segment>
      </SegmentedControl>
    );
  },
};

/** With `hasAddons={false}` the segments sit apart, with Bulma's usual gap. */
export const Apart: Story = {
  args: { hasAddons: false },
};

/**
 * `SegmentedControl.Segment` is the only way to write a segment, so every
 * story here is dot notation. This one builds the row from data.
 */
export const CompoundUsage: Story = {
  render: function CompoundUsageExample() {
    const views = [
      { value: 'list', label: 'List' },
      { value: 'grid', label: 'Grid' },
      { value: 'board', label: 'Board' },
    ];
    return (
      <SegmentedControl aria-label="View" defaultValue="grid">
        {views.map(view => (
          <SegmentedControl.Segment key={view.value} value={view.value}>
            {view.label}
          </SegmentedControl.Segment>
        ))}
      </SegmentedControl>
    );
  },
};
