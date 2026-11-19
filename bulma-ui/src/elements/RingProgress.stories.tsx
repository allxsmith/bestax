import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { RingProgress } from './RingProgress';
import { Button } from './Button';
import { Paragraph } from './Paragraph';
import { Tag } from './Tag';
import { Tags } from './Tags';
import { validColors } from '../helpers/useBulmaClasses';

const COLORS = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

const meta: Meta<typeof RingProgress> = {
  title: 'Elements/RingProgress',
  component: RingProgress,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A value drawn as a ring that fills as it grows, with anything you pass in the middle. A progressbar by default, a meter with isMeter, and with sections several values around one ring, read as an image whose name lists them. For work with no value, use Loader.',
      },
    },
  },
  args: {
    value: 72,
    label: 'Upload',
    color: 'success',
    children: '72%',
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'How far along it is, from 0 to max',
    },
    max: {
      control: 'number',
      description: 'The value that fills the ring',
    },
    sections: {
      control: false,
      description:
        'Several values around one ring, each with a color and a label, read in the ring’s name',
    },
    label: {
      control: 'text',
      description: 'What it shows; names the ring',
    },
    isMeter: {
      control: 'boolean',
      description:
        'A level within a range rather than a task: role="meter" in place of role="progressbar"',
    },
    color: {
      control: 'select',
      options: [undefined, ...COLORS, 'black', 'dark', 'light', 'white'],
      description: 'The arc’s color',
    },
    size: {
      control: 'inline-radio',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'The ring’s size',
    },
    isRounded: {
      control: 'boolean',
      description: 'Rounds the ends of the arc',
    },
    children: {
      control: 'text',
      description: 'What sits in the middle, hidden from assistive tech',
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
type Story = StoryObj<typeof RingProgress>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ring = canvas.getByRole('progressbar', { name: 'Upload' });
    await expect(ring).toHaveAttribute('aria-valuenow', '72');
  },
};

export const Meter: Story = {
  args: {
    isMeter: true,
    value: 64,
    label: 'Storage used',
    color: 'info',
    size: 'large',
    children: '64%',
  },
};

export const Sections: Story = {
  render: function SectionsExample() {
    const sections = [
      { value: 40, color: 'info' as const, label: 'Documents' },
      { value: 15, color: 'warning' as const, label: 'Photos' },
      { value: 15, color: 'danger' as const, label: 'Video' },
    ];
    return (
      <>
        <RingProgress label="Storage" size="medium" sections={sections}>
          70%
        </RingProgress>
        <Tags mt="3">
          {sections.map(section => (
            <Tag key={section.label} color={section.color}>
              {section.label} {section.value}%
            </Tag>
          ))}
        </Tags>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('img', {
        name: 'Storage: Documents 40%, Photos 15%, Video 15%',
      })
    ).toBeInTheDocument();
  },
};

export const Colors: Story = {
  render: function ColorsExample() {
    return (
      <>
        {COLORS.map(color => (
          <RingProgress
            key={color}
            value={70}
            label={color}
            color={color}
            mr="3"
          >
            70%
          </RingProgress>
        ))}
      </>
    );
  },
};

export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <>
        {(['small', undefined, 'medium', 'large'] as const).map(size => (
          <RingProgress
            key={size ?? 'normal'}
            value={60}
            label={size ?? 'normal'}
            size={size}
            isRounded
            mr="4"
          >
            60%
          </RingProgress>
        ))}
      </>
    );
  },
};

export const Changing: Story = {
  render: function ChangingExample() {
    const [value, setValue] = useState(20);
    return (
      <>
        <RingProgress value={value} label="Upload" color="success" mb="3">
          {value}%
        </RingProgress>
        <Paragraph>
          <Button size="small" onClick={() => setValue(v => (v + 20) % 120)}>
            Move it on
          </Button>
        </Paragraph>
      </>
    );
  },
};
