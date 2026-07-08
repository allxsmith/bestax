import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';
import { Icon } from '../elements/Icon';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Represents a person or entity as a compact image, falling back automatically from a photo to initials to an icon.',
      },
    },
  },
  argTypes: {
    src: { control: 'text' },
    alt: { control: 'text' },
    name: { control: 'text' },
    initials: { control: 'text' },
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
    },
    shape: {
      control: 'select',
      options: ['circle', 'rounded', 'square'],
    },
    color: {
      control: 'select',
      options: [
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'black',
        'dark',
        'light',
        'white',
      ],
    },
    href: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const Photo: Story = {
  render: function PhotoExample() {
    return (
      <Avatar
        src="https://bulma.io/assets/images/placeholders/128x128.png"
        name="Ada Lovelace"
        size="64x64"
      />
    );
  },
};

export const BrokenImageFallsBackToInitials: Story = {
  render: function BrokenImageExample() {
    return (
      <Avatar src="https://example.invalid/missing.jpg" name="Grace Hopper" />
    );
  },
};

export const Initials: Story = {
  render: function InitialsExample() {
    return (
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Katherine Johnson" />
        <Avatar initials="XY" color="info" />
      </div>
    );
  },
};

export const IconFallback: Story = {
  render: function IconExample() {
    return <Avatar icon={<Icon name="user" />} color="info" shape="rounded" />;
  },
};

export const DefaultFallback: Story = {
  render: function DefaultFallbackExample() {
    return <Avatar />;
  },
};

export const Shapes: Story = {
  render: function ShapesExample() {
    return (
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Avatar name="Circle Shape" shape="circle" />
        <Avatar name="Rounded Shape" shape="rounded" />
        <Avatar name="Square Shape" shape="square" />
      </div>
    );
  },
};

export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Avatar name="Ada Lovelace" size="16x16" />
        <Avatar name="Ada Lovelace" size="24x24" />
        <Avatar name="Ada Lovelace" size="32x32" />
        <Avatar name="Ada Lovelace" size="48x48" />
        <Avatar name="Ada Lovelace" size="64x64" />
        <Avatar name="Ada Lovelace" size={20} />
      </div>
    );
  },
};

export const Clickable: Story = {
  render: function ClickableExample() {
    return <Avatar name="Ada Lovelace" href="https://bestax.io" />;
  },
};
