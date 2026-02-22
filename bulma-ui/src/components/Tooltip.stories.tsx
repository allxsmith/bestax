import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';
import { Button } from '../elements/Button';
import { Icon } from '../elements/Icon';

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A tooltip component for displaying helpful information on hover. Supports multiple positions, colors, and styles.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The tooltip text content',
    },
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right', 'auto'],
      description: 'Position of the tooltip',
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
        'dark',
        'light',
      ],
      description: 'Color variant for the tooltip',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size variant for the tooltip',
    },
    active: {
      control: 'boolean',
      description: 'Force tooltip to be always visible',
    },
    multiline: {
      control: 'boolean',
      description: 'Allow tooltip to wrap to multiple lines',
    },
    animated: {
      control: 'boolean',
      description: 'Enable fade animation',
    },
    square: {
      control: 'boolean',
      description: 'Use square corners',
    },
    dashed: {
      control: 'boolean',
      description: 'Show dashed underline on trigger',
    },
    delay: {
      control: 'number',
      description: 'Delay before showing tooltip (ms)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

/**
 * Basic tooltip with default settings.
 */
export const Default: Story = {
  args: {
    label: 'This is a tooltip',
    children: <Button>Hover me</Button>,
  },
};

/**
 * Tooltip in different positions.
 */
export const Positions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', padding: '4rem' }}>
      <Tooltip label="Top tooltip" position="top">
        <Button>Top</Button>
      </Tooltip>
      <Tooltip label="Bottom tooltip" position="bottom">
        <Button>Bottom</Button>
      </Tooltip>
      <Tooltip label="Left tooltip" position="left">
        <Button>Left</Button>
      </Tooltip>
      <Tooltip label="Right tooltip" position="right">
        <Button>Right</Button>
      </Tooltip>
    </div>
  ),
};

/**
 * Tooltip with different color variants.
 */
export const Colors: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '3rem',
      }}
    >
      <Tooltip label="Primary tooltip" color="primary">
        <Button color="primary">Primary</Button>
      </Tooltip>
      <Tooltip label="Link tooltip" color="link">
        <Button color="link">Link</Button>
      </Tooltip>
      <Tooltip label="Info tooltip" color="info">
        <Button color="info">Info</Button>
      </Tooltip>
      <Tooltip label="Success tooltip" color="success">
        <Button color="success">Success</Button>
      </Tooltip>
      <Tooltip label="Warning tooltip" color="warning">
        <Button color="warning">Warning</Button>
      </Tooltip>
      <Tooltip label="Danger tooltip" color="danger">
        <Button color="danger">Danger</Button>
      </Tooltip>
      <Tooltip label="Dark tooltip" color="dark">
        <Button color="dark">Dark</Button>
      </Tooltip>
      <Tooltip label="Light tooltip" color="light">
        <Button color="light">Light</Button>
      </Tooltip>
    </div>
  ),
};

/**
 * Tooltip in different sizes.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '4rem' }}>
      <Tooltip label="Small tooltip" size="small">
        <Button size="small">Small</Button>
      </Tooltip>
      <Tooltip label="Default tooltip">
        <Button>Default</Button>
      </Tooltip>
      <Tooltip label="Medium tooltip" size="medium">
        <Button size="medium">Medium</Button>
      </Tooltip>
      <Tooltip label="Large tooltip" size="large">
        <Button size="large">Large</Button>
      </Tooltip>
    </div>
  ),
};

/**
 * Multiline tooltip for longer content.
 */
export const Multiline: Story = {
  render: () => (
    <div style={{ padding: '4rem' }}>
      <Tooltip
        label="This is a longer tooltip that wraps to multiple lines. It's useful for displaying more detailed information."
        multiline
      >
        <Button>Hover for more info</Button>
      </Tooltip>
    </div>
  ),
};

/**
 * Always visible tooltip.
 */
export const AlwaysActive: Story = {
  render: () => (
    <div style={{ padding: '4rem' }}>
      <Tooltip label="I'm always visible!" active color="info">
        <Button>Always visible tooltip</Button>
      </Tooltip>
    </div>
  ),
};

/**
 * Tooltip with dashed underline style.
 */
export const DashedStyle: Story = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <p>
        The term{' '}
        <Tooltip label="Application Programming Interface" dashed>
          <span>API</span>
        </Tooltip>{' '}
        is commonly used in software development.
      </p>
    </div>
  ),
};

/**
 * Tooltip with square corners.
 */
export const SquareCorners: Story = {
  render: () => (
    <div style={{ padding: '3rem' }}>
      <Tooltip label="Square cornered tooltip" square>
        <Button>Square tooltip</Button>
      </Tooltip>
    </div>
  ),
};

/**
 * Tooltip with delay before showing.
 */
export const WithDelay: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', padding: '3rem' }}>
      <Tooltip label="No delay" delay={0}>
        <Button>No delay</Button>
      </Tooltip>
      <Tooltip label="500ms delay" delay={500}>
        <Button>500ms delay</Button>
      </Tooltip>
      <Tooltip label="1 second delay" delay={1000}>
        <Button>1s delay</Button>
      </Tooltip>
    </div>
  ),
};

/**
 * Tooltip without animation.
 */
export const NoAnimation: Story = {
  render: () => (
    <div style={{ padding: '3rem' }}>
      <Tooltip label="No fade animation" animated={false}>
        <Button>No animation</Button>
      </Tooltip>
    </div>
  ),
};

/**
 * Tooltip on icons.
 */
export const OnIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', padding: '3rem' }}>
      <Tooltip label="Delete item" color="danger" position="bottom">
        <span style={{ cursor: 'pointer' }}>
          <Icon icon="fas fa-trash" />
        </span>
      </Tooltip>
      <Tooltip label="Edit item" color="info" position="bottom">
        <span style={{ cursor: 'pointer' }}>
          <Icon icon="fas fa-edit" />
        </span>
      </Tooltip>
      <Tooltip label="Download" color="success" position="bottom">
        <span style={{ cursor: 'pointer' }}>
          <Icon icon="fas fa-download" />
        </span>
      </Tooltip>
      <Tooltip label="Share" color="primary" position="bottom">
        <span style={{ cursor: 'pointer' }}>
          <Icon icon="fas fa-share" />
        </span>
      </Tooltip>
    </div>
  ),
};

/**
 * Tooltip on text elements.
 */
export const OnText: Story = {
  render: () => (
    <div style={{ padding: '3rem', maxWidth: '400px' }}>
      <p style={{ lineHeight: 1.8 }}>
        Hover over the{' '}
        <Tooltip label="Cascading Style Sheets" color="info" dashed>
          <span>CSS</span>
        </Tooltip>{' '}
        or{' '}
        <Tooltip label="HyperText Markup Language" color="info" dashed>
          <span>HTML</span>
        </Tooltip>{' '}
        terms to see their full names. You can also learn about{' '}
        <Tooltip
          label="JavaScript is a programming language used for web development"
          color="warning"
          multiline
          dashed
        >
          <span>JavaScript</span>
        </Tooltip>
        .
      </p>
    </div>
  ),
};

/**
 * Form field with help tooltip.
 */
export const FormFieldHelp: Story = {
  render: () => (
    <div style={{ padding: '3rem', maxWidth: '400px' }}>
      <div className="field">
        <label className="label">
          Password{' '}
          <Tooltip
            label="Must be at least 8 characters with one number and one special character"
            multiline
            color="info"
          >
            <span style={{ cursor: 'help' }}>
              <Icon icon="fas fa-question-circle" size="small" />
            </span>
          </Tooltip>
        </label>
        <div className="control">
          <input
            className="input"
            type="password"
            placeholder="Enter password"
          />
        </div>
      </div>
    </div>
  ),
};

/**
 * Auto-placement tooltips automatically choose the best direction based on
 * available viewport space. Hover over buttons placed at each edge and corner
 * to see the tooltip flip away from the viewport boundary.
 */
export const AutoPlacement: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Top-left corner */}
      <div style={{ position: 'absolute', top: 8, left: 8 }}>
        <Tooltip label="Auto: flips away from top-left corner" position="auto">
          <Button size="small">Top Left</Button>
        </Tooltip>
      </div>

      {/* Top center */}
      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)' }}>
        <Tooltip label="Auto: no room above, goes below" position="auto">
          <Button size="small">Top Center</Button>
        </Tooltip>
      </div>

      {/* Top-right corner */}
      <div style={{ position: 'absolute', top: 8, right: 8 }}>
        <Tooltip label="Auto: flips away from top-right corner" position="auto">
          <Button size="small">Top Right</Button>
        </Tooltip>
      </div>

      {/* Middle left */}
      <div style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)' }}>
        <Tooltip label="Auto: no room on the left" position="auto">
          <Button size="small">Middle Left</Button>
        </Tooltip>
      </div>

      {/* Center */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <Tooltip label="Auto: plenty of room, defaults to top" position="auto">
          <Button>Center (defaults top)</Button>
        </Tooltip>
      </div>

      {/* Middle right */}
      <div style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)' }}>
        <Tooltip label="Auto: no room on the right" position="auto">
          <Button size="small">Middle Right</Button>
        </Tooltip>
      </div>

      {/* Bottom-left corner */}
      <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
        <Tooltip label="Auto: flips away from bottom-left" position="auto">
          <Button size="small">Bottom Left</Button>
        </Tooltip>
      </div>

      {/* Bottom center */}
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)' }}>
        <Tooltip label="Auto: no room below, goes above" position="auto">
          <Button size="small">Bottom Center</Button>
        </Tooltip>
      </div>

      {/* Bottom-right corner */}
      <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
        <Tooltip label="Auto: flips away from bottom-right" position="auto">
          <Button size="small">Bottom Right</Button>
        </Tooltip>
      </div>
    </div>
  ),
};

/**
 * Tooltip with different trigger elements.
 */
export const DifferentTriggers: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '2rem',
        alignItems: 'center',
        padding: '3rem',
      }}
    >
      <Tooltip label="Tooltip on button">
        <Button>Button</Button>
      </Tooltip>
      <Tooltip label="Tooltip on link">
        <a href="#" onClick={e => e.preventDefault()}>
          Link
        </a>
      </Tooltip>
      <Tooltip label="Tooltip on icon">
        <Icon icon="fas fa-info-circle" style={{ cursor: 'pointer' }} />
      </Tooltip>
      <Tooltip label="Tooltip on text" dashed>
        <span>Text</span>
      </Tooltip>
      <Tooltip label="Tooltip on image">
        <img
          src="https://bulma.io/assets/images/placeholders/64x64.png"
          alt="Example"
          style={{ cursor: 'pointer' }}
        />
      </Tooltip>
    </div>
  ),
};
