import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatars } from './Avatars';
import { Avatar } from './Avatar';
import { Block } from '../elements/Block';

const members = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Grace Hopper' },
  { id: 3, name: 'Katherine Johnson' },
  { id: 4, name: 'Margaret Hamilton' },
  { id: 5, name: 'Radia Perlman' },
];

const meta: Meta<typeof Avatars> = {
  title: 'Components/Avatars',
  component: Avatars,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'An overlapping/stacked group of `Avatar`s with a "+N" surplus bubble when clamped by `max`.',
      },
    },
  },
  argTypes: {
    max: {
      control: 'number',
      description:
        'Show only the first `max` children, replacing the overflow with a "+N" surplus avatar. A single overflow avatar is shown directly rather than a pointless "+1".',
    },
    spacing: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description:
        'Overlap amount between avatars — or the gap when `spaced`. A `sm`/`md`/`lg` preset or a pixel number. Default `md`.',
    },
    size: {
      control: 'select',
      options: [
        '16x16',
        '24x24',
        '32x32',
        '48x48',
        '64x64',
        '96x96',
        '128x128',
      ],
      description: 'Uniform size applied to every child Avatar.',
    },
    shape: {
      control: 'select',
      options: ['circle', 'rounded', 'square'],
      description: 'Uniform shape applied to every child Avatar.',
    },
    spaced: {
      control: 'boolean',
      description:
        'Lay the avatars out side by side (non-overlapping) with `spacing` as the gap. Default `false`.',
    },
    surplusLabel: {
      control: false,
      description:
        "Builds the surplus avatar's accessible name from the hidden count, for localization. Default: `` `${count} more` ``.",
    },
  },
};
export default meta;
type Story = StoryObj<typeof Avatars>;

export const Default: Story = {
  render: function DefaultExample() {
    return (
      <Avatars>
        {members.map(m => (
          <Avatar key={m.id} name={m.name} />
        ))}
      </Avatars>
    );
  },
};

export const WithSurplus: Story = {
  render: function WithSurplusExample() {
    return (
      <Avatars max={3} size="48x48">
        {members.map(m => (
          <Avatar key={m.id} name={m.name} />
        ))}
      </Avatars>
    );
  },
};

export const LocalizedSurplus: Story = {
  render: function LocalizedSurplusExample() {
    // surplusLabel localizes the surplus bubble's accessible name ("+2" stays
    // the visible text; screen readers hear "2 weitere").
    return (
      <Avatars max={3} surplusLabel={count => `${count} weitere`}>
        {members.map(m => (
          <Avatar key={m.id} name={m.name} />
        ))}
      </Avatars>
    );
  },
};

export const UniformShape: Story = {
  render: function UniformShapeExample() {
    return (
      <Avatars max={4} shape="square">
        {members.map(m => (
          <Avatar key={m.id} name={m.name} />
        ))}
      </Avatars>
    );
  },
};

export const CompoundStatic: Story = {
  render: function CompoundStaticExample() {
    // `Avatars.Avatar` is the same component as `Avatar`, handy when importing
    // only the container.
    return (
      <Avatars>
        <Avatars.Avatar name="Ada Lovelace" />
        <Avatars.Avatar name="Grace Hopper" />
        <Avatars.Avatar name="Katherine Johnson" />
      </Avatars>
    );
  },
};

export const Spacing: Story = {
  render: function SpacingExample() {
    return (
      <Block display="flex" flexDirection="column">
        <Avatars spacing="sm" mb="4">
          {members.map(m => (
            <Avatar key={m.id} name={m.name} />
          ))}
        </Avatars>
        <Avatars spacing="md" mb="4">
          {members.map(m => (
            <Avatar key={m.id} name={m.name} />
          ))}
        </Avatars>
        <Avatars spacing="lg">
          {members.map(m => (
            <Avatar key={m.id} name={m.name} />
          ))}
        </Avatars>
      </Block>
    );
  },
};

export const NumericSpacing: Story = {
  render: function NumericSpacingExample() {
    return (
      <Avatars spacing={4}>
        {members.map(m => (
          <Avatar key={m.id} name={m.name} />
        ))}
      </Avatars>
    );
  },
};

export const Rtl: Story = {
  render: function RtlExample() {
    // The overlap uses margin-inline-start, so under dir="rtl" the stack
    // overlaps toward the reading direction instead of spreading apart.
    return (
      <div dir="rtl">
        <Avatars max={3} size="48x48">
          {members.map(m => (
            <Avatar key={m.id} name={m.name} />
          ))}
        </Avatars>
      </div>
    );
  },
};

export const Spaced: Story = {
  render: function SpacedExample() {
    return (
      <Avatars spaced>
        {members.map(m => (
          <Avatar key={m.id} name={m.name} />
        ))}
      </Avatars>
    );
  },
};
