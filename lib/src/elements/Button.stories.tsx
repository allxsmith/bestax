/// <reference lib="dom" />
import { Meta, StoryObj } from '@storybook/react';
import { Button, ButtonProps } from './Button';
import { validColors } from '../helpers/useBulmaClasses';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'A customizable button component with Bulma styling. Supports colors, sizes, states, and helper classes. Ensure meaningful content for accessibility.',
      },
    },
  },
  argTypes: {
    // Bulma-specific props
    color: {
      control: 'select',
      options: ['primary', 'link', 'info', 'success', 'warning', 'danger'],
      description: 'Bulma color variant for the button.',
    },
    size: {
      control: 'select',
      options: ['small', 'normal', 'medium', 'large'],
      description: 'Size of the button.',
    },
    isLight: {
      control: 'boolean',
      description: 'Applies a lighter color variant.',
    },
    isRounded: {
      control: 'boolean',
      description: 'Makes the button rounded.',
    },
    isLoading: {
      control: 'boolean',
      description: 'Displays a loading spinner.',
    },
    isStatic: {
      control: 'boolean',
      description: 'Makes the button non-interactive.',
    },
    isFullWidth: {
      control: 'boolean',
      description: 'Makes the button full-width.',
    },
    isOutlined: {
      control: 'boolean',
      description: 'Applies outlined styling (requires color).',
    },
    isInverted: {
      control: 'boolean',
      description: 'Applies inverted styling (requires color).',
    },
    isFocused: {
      control: 'boolean',
      description: 'Applies focused styling (visual only).',
    },
    isActive: {
      control: 'boolean',
      description: 'Applies active styling (visual only).',
    },
    isHovered: {
      control: 'boolean',
      description: 'Applies hovered styling (visual only).',
    },
    isDisabled: {
      control: 'boolean',
      description:
        'Applies disabled styling (use with disabled for HTML attribute).',
    },
    // Helper props (from useBulmaClasses)
    textColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Text color (e.g., primary for has-text-primary).',
    },
    bgColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Background color (e.g., info for has-background-info).',
    },
    m: {
      control: 'text',
      description: 'Margin (e.g., 2 for m-2).',
    },
    p: {
      control: 'text',
      description: 'Padding (e.g., 3 for p-3).',
    },
    mx: {
      control: 'text',
      description: 'Horizontal margin (e.g., 4 for mx-4).',
    },
    my: {
      control: 'text',
      description: 'Vertical margin (e.g., 5 for my-5).',
    },
    mt: {
      control: 'text',
      description: 'Top margin (e.g., 1 for mt-1).',
    },
    mr: {
      control: 'text',
      description: 'Right margin (e.g., 2 for mr-2).',
    },
    mb: {
      control: 'text',
      description: 'Bottom margin (e.g., 3 for mb-3).',
    },
    ml: {
      control: 'text',
      description: 'Left margin (e.g., 4 for ml-4).',
    },
    textAlign: {
      control: 'select',
      options: ['centered', 'justified', 'left', 'right'],
      description: 'Text alignment (e.g., centered for has-text-centered).',
    },
    viewport: {
      control: 'select',
      options: ['mobile', 'tablet', 'desktop', 'widescreen', 'fullhd'],
      description: 'Responsive viewport (e.g., mobile for is-mobile).',
    },
    display: {
      control: 'select',
      options: ['block', 'flex', 'inline', 'inline-block', 'inline-flex'],
      description: 'Display type (e.g., flex for is-flex).',
    },
    justifyContent: {
      control: 'select',
      options: [
        'center',
        'start',
        'end',
        'space-between',
        'space-around',
        'space-evenly',
      ],
      description: 'Flexbox justify-content (requires display: flex).',
    },
    alignItems: {
      control: 'select',
      options: ['center', 'start', 'end', 'baseline', 'stretch'],
      description: 'Flexbox align-items (requires display: flex).',
    },
    // Standard HTML attributes
    className: {
      control: 'text',
      description: 'Custom CSS class.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button (HTML attribute).',
    },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: 'Button type attribute.',
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

type Story = StoryObj<typeof Button>;

// Baseline story
export const Default: Story = {
  args: {
    children: 'Default Button',
  },
};

// Colors
export const AllColors: Story = {
  render: () => (
    <div className="buttons">
      {['primary', 'link', 'info', 'success', 'warning', 'danger'].map(
        color => (
          <Button key={color} color={color as ButtonProps['color']}>
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </Button>
        )
      )}
    </div>
  ),
  name: 'All Colors',
};

// Sizes
export const AllSizes: Story = {
  render: () => (
    <div className="buttons">
      {['small', 'normal', 'medium', 'large'].map(size => (
        <Button key={size} size={size as ButtonProps['size']}>
          {size.charAt(0).toUpperCase() + size.slice(1)}
        </Button>
      ))}
    </div>
  ),
  name: 'All Sizes',
};

// Light variant
export const LightPrimary: Story = {
  args: {
    color: 'primary',
    isLight: true,
    children: 'Light Primary Button',
  },
};

// Rounded
export const Rounded: Story = {
  args: {
    color: 'info',
    isRounded: true,
    children: 'Rounded Button',
  },
};

// Loading
export const Loading: Story = {
  args: {
    color: 'success',
    isLoading: true,
    children: 'Loading Button',
  },
};

// Static
export const Static: Story = {
  args: {
    isStatic: true,
    children: 'Static Button',
  },
};

// FullWidth
export const FullWidth: Story = {
  args: {
    color: 'warning',
    isFullWidth: true,
    children: 'Full Width Button',
  },
};

// Outlined
export const Outlined: Story = {
  args: {
    color: 'danger',
    isOutlined: true,
    children: 'Outlined Button',
  },
};

// Inverted
export const Inverted: Story = {
  args: {
    color: 'link',
    isInverted: true,
    children: 'Inverted Button',
  },
};

// Focused
export const Focused: Story = {
  args: {
    color: 'primary',
    isFocused: true,
    children: 'Focused Button',
  },
};

// Active
export const Active: Story = {
  args: {
    color: 'info',
    isActive: true,
    children: 'Active Button',
  },
};

// Hovered
export const Hovered: Story = {
  args: {
    color: 'success',
    isHovered: true,
    children: 'Hovered Button',
  },
};

// Disabled (using both isDisabled and disabled)
export const Disabled: Story = {
  args: {
    color: 'warning',
    isDisabled: true,
    disabled: true,
    children: 'Disabled Button',
  },
};

// Text and Background Color
export const CustomTextAndBg: Story = {
  args: {
    textColor: 'danger',
    bgColor: 'info',
    children: 'Custom Text & Background',
  },
};

// Spacing Helpers
export const Spacing: Story = {
  args: {
    m: '2',
    p: '3',
    mx: '4',
    my: '5',
    mt: '1',
    mr: '2',
    mb: '3',
    ml: '4',
    children: 'Button with Spacing',
  },
};

// Text Alignment
export const TextAlignment: Story = {
  args: {
    textAlign: 'centered',
    children: 'Centered Text Button',
  },
};

// Responsive Viewport
export const Responsive: Story = {
  args: {
    viewport: 'mobile',
    children: 'Mobile Responsive Button',
  },
};

// Flexbox Layout
export const FlexLayout: Story = {
  args: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    children: 'Flex Button',
  },
};

// Button Group
export const ButtonGroup: Story = {
  render: () => (
    <div className="buttons has-addons">
      <Button color="primary">Left</Button>
      <Button color="primary">Center</Button>
      <Button color="primary">Right</Button>
    </div>
  ),
  name: 'Button Group',
};

// HTML Attributes
export const WithHTMLAttributes: Story = {
  args: {
    type: 'submit',
    className: 'custom-class',
    children: 'Submit Button',
  },
};
