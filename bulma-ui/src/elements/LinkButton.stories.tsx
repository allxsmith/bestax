import { Meta, StoryObj } from '@storybook/react-vite';
import { LinkButton, LinkButtonProps } from './LinkButton';
import { Buttons } from './Buttons';

const meta: Meta<typeof LinkButton> = {
  title: 'Elements/LinkButton',
  component: LinkButton,
  parameters: {
    docs: {
      description: {
        component:
          'A button that visually looks like text or a link, for a11y-friendly replacements of `<div onClick>` anti-patterns. Supports text (no underline) and ghost (no link color) variants with optional color overrides.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'ghost'],
      description: "Display mode: 'text' for minimal, 'ghost' for link-like.",
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
        'white',
        'light',
        'dark',
        'black',
      ],
      description: 'Text color override.',
    },
    size: {
      control: 'select',
      options: ['small', 'normal', 'medium', 'large'],
      description: 'Button size.',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Disables the button.',
    },
    isRounded: {
      control: 'boolean',
      description: 'Makes the button rounded.',
    },
    isLoading: {
      control: 'boolean',
      description: 'Displays a loading spinner.',
    },
    isFullWidth: {
      control: 'boolean',
      description: 'Makes the button full-width.',
    },
    onClick: {
      action: 'clicked',
      description: 'Click event handler.',
    },
    children: {
      control: 'text',
      description: 'Button content.',
    },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof LinkButton>;

// Default text variant
export const Default: Story = {
  args: {
    children: 'Click me',
  },
};

// Ghost variant
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost LinkButton',
  },
};

// Text variant with color
export const TextWithColor: Story = {
  args: {
    variant: 'text',
    color: 'primary',
    children: 'Primary Text',
  },
  name: 'Text with Color',
};

// Ghost variant with color
export const GhostWithColor: Story = {
  args: {
    variant: 'ghost',
    color: 'danger',
    children: 'Danger Ghost',
  },
  name: 'Ghost with Color',
};

// All semantic colors in text variant
export const AllColors: Story = {
  render: () => (
    <Buttons>
      {(
        [
          'primary',
          'link',
          'info',
          'success',
          'warning',
          'danger',
        ] as const
      ).map(color => (
        <LinkButton key={color} color={color}>
          {color.charAt(0).toUpperCase() + color.slice(1)}
        </LinkButton>
      ))}
    </Buttons>
  ),
  name: 'All Colors',
};

// All colors in ghost variant
export const AllColorsGhost: Story = {
  render: () => (
    <Buttons>
      {(
        [
          'primary',
          'link',
          'info',
          'success',
          'warning',
          'danger',
        ] as const
      ).map(color => (
        <LinkButton key={color} variant="ghost" color={color}>
          {color.charAt(0).toUpperCase() + color.slice(1)}
        </LinkButton>
      ))}
    </Buttons>
  ),
  name: 'All Colors (Ghost)',
};

// Disabled state
export const Disabled: Story = {
  args: {
    isDisabled: true,
    disabled: true,
    children: 'Disabled LinkButton',
  },
};

// Sizes
export const AllSizes: Story = {
  render: () => (
    <Buttons>
      {(['small', 'normal', 'medium', 'large'] as const).map(size => (
        <LinkButton key={size} size={size}>
          {size.charAt(0).toUpperCase() + size.slice(1)}
        </LinkButton>
      ))}
    </Buttons>
  ),
  name: 'All Sizes',
};
