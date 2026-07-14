import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';
import { Block } from '../elements/Block';
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
    src: {
      control: 'text',
      description:
        'Image URL. On load error (or if absent), falls back to initials, then icon.',
    },
    alt: {
      control: 'text',
      description:
        'Alternate text for the image (required for meaningful images).',
    },
    name: {
      control: 'text',
      description:
        'Derives initials and a deterministic background color when no src/initials is shown.',
    },
    initials: {
      control: 'text',
      description: 'Explicit initials override (else derived from name).',
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
      description: 'Preset size, or a pixel size when a number.',
    },
    shape: {
      control: 'select',
      options: ['circle', 'rounded', 'square'],
      description: 'Avatar shape. Default circle.',
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
      description:
        'Background color for initials/icon avatars (else auto-derived from name).',
    },
    href: {
      control: 'text',
      description: 'When set, renders the avatar as a link.',
    },
  },
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const Photo: Story = {
  render: function PhotoExample() {
    return (
      <Avatar
        src="https://github.com/allxsmith.png"
        name="Al Smith"
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
      <Block display="flex">
        <Avatar name="Ada Lovelace" mr="3" />
        <Avatar name="Grace Hopper" mr="3" />
        <Avatar name="Katherine Johnson" mr="3" />
        <Avatar initials="XY" color="info" />
      </Block>
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
      <Block display="flex">
        <Avatar name="Circle Shape" shape="circle" mr="3" />
        <Avatar name="Rounded Shape" shape="rounded" mr="3" />
        <Avatar name="Square Shape" shape="square" />
      </Block>
    );
  },
};

export const Sizes: Story = {
  render: function SizesExample() {
    return (
      <Block display="flex" alignItems="center">
        <Avatar name="Ada Lovelace" size="16x16" mr="3" />
        <Avatar name="Ada Lovelace" size="24x24" mr="3" />
        <Avatar name="Ada Lovelace" size="32x32" mr="3" />
        <Avatar name="Ada Lovelace" size="48x48" mr="3" />
        <Avatar name="Ada Lovelace" size="64x64" mr="3" />
        <Avatar name="Ada Lovelace" size={20} />
      </Block>
    );
  },
};

export const Clickable: Story = {
  render: function ClickableExample() {
    return <Avatar name="Ada Lovelace" href="https://bestax.io" />;
  },
};

export const LazyLoadedImage: Story = {
  render: function LazyLoadedExample() {
    return (
      <Avatar
        src="https://github.com/allxsmith.png"
        name="Al Smith"
        size="64x64"
        imageProps={{ loading: 'lazy' }}
      />
    );
  },
};
