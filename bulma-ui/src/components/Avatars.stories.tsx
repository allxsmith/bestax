import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatars } from './Avatars';
import { Avatar } from './Avatar';

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
    max: { control: 'number' },
    spacing: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    size: {
      control: 'select',
      options: ['16x16', '24x24', '32x32', '48x48', '64x64'],
    },
    shape: {
      control: 'select',
      options: ['circle', 'rounded', 'square'],
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Avatars spacing="sm">
          {members.map(m => (
            <Avatar key={m.id} name={m.name} />
          ))}
        </Avatars>
        <Avatars spacing="md">
          {members.map(m => (
            <Avatar key={m.id} name={m.name} />
          ))}
        </Avatars>
        <Avatars spacing="lg">
          {members.map(m => (
            <Avatar key={m.id} name={m.name} />
          ))}
        </Avatars>
      </div>
    );
  },
};
