import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Box } from '../elements/Box';
import { Block } from '../elements/Block';
import { Content } from '../elements/Content';
import { Icon } from '../elements/Icon';
import { Paragraph } from '../elements/Paragraph';
import { Field } from '../form/Field';
import { Control } from '../form/Control';
import { Input } from '../form/Input';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';
import { Grid } from '../grid/Grid';

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
    content: {
      control: false,
      description: 'Custom rich content (ReactNode) for the tooltip',
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
    closeDelay: {
      control: 'number',
      description: 'Delay before hiding tooltip after mouse leave (ms)',
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
    <Buttons p="6">
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
    </Buttons>
  ),
};

/**
 * Tooltip with different color variants.
 */
export const Colors: Story = {
  render: () => (
    <Buttons p="5">
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
    </Buttons>
  ),
};

/**
 * Tooltip in different sizes.
 */
export const Sizes: Story = {
  render: () => (
    <Buttons p="6">
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
    </Buttons>
  ),
};

/**
 * Multiline tooltip for longer content.
 */
export const Multiline: Story = {
  render: () => (
    <Box p="6">
      <Tooltip
        label="This is a longer tooltip that wraps to multiple lines. It's useful for displaying more detailed information."
        multiline
      >
        <Button>Hover for more info</Button>
      </Tooltip>
    </Box>
  ),
};

/**
 * Always visible tooltip.
 */
export const AlwaysActive: Story = {
  render: () => (
    <Box p="6">
      <Tooltip label="I'm always visible!" active color="info">
        <Button>Always visible tooltip</Button>
      </Tooltip>
    </Box>
  ),
};

/**
 * Tooltip with dashed underline style.
 */
export const DashedStyle: Story = {
  render: () => (
    <Box p="4">
      <p>
        The term{' '}
        <Tooltip label="Application Programming Interface" dashed>
          <span>API</span>
        </Tooltip>{' '}
        is commonly used in software development.
      </p>
    </Box>
  ),
};

/**
 * Tooltip with square corners.
 */
export const SquareCorners: Story = {
  render: () => (
    <Box p="5">
      <Tooltip label="Square cornered tooltip" square>
        <Button>Square tooltip</Button>
      </Tooltip>
    </Box>
  ),
};

/**
 * Tooltip with delay before showing.
 */
export const WithDelay: Story = {
  render: () => (
    <Buttons p="5">
      <Tooltip label="No delay" delay={0}>
        <Button>No delay</Button>
      </Tooltip>
      <Tooltip label="500ms delay" delay={500}>
        <Button>500ms delay</Button>
      </Tooltip>
      <Tooltip label="1 second delay" delay={1000}>
        <Button>1s delay</Button>
      </Tooltip>
    </Buttons>
  ),
};

/**
 * Tooltip with delay before hiding after mouse leave.
 */
export const WithCloseDelay: Story = {
  render: () => (
    <Buttons p="5">
      <Tooltip label="No close delay" closeDelay={0}>
        <Button>No close delay</Button>
      </Tooltip>
      <Tooltip label="500ms close delay" closeDelay={500}>
        <Button>500ms close delay</Button>
      </Tooltip>
      <Tooltip label="1 second close delay" closeDelay={1000}>
        <Button>1s close delay</Button>
      </Tooltip>
    </Buttons>
  ),
};

/**
 * Tooltip without animation.
 */
export const NoAnimation: Story = {
  render: () => (
    <Box p="5">
      <Tooltip label="No fade animation" animated={false}>
        <Button>No animation</Button>
      </Tooltip>
    </Box>
  ),
};

/**
 * Tooltip on icons.
 */
export const OnIcons: Story = {
  render: () => (
    <Buttons p="5">
      <Tooltip
        label="Delete item"
        color="danger"
        position="bottom"
        cursor="pointer"
      >
        <Icon name="trash" />
      </Tooltip>
      <Tooltip
        label="Edit item"
        color="info"
        position="bottom"
        cursor="pointer"
      >
        <Icon name="edit" />
      </Tooltip>
      <Tooltip
        label="Download"
        color="success"
        position="bottom"
        cursor="pointer"
      >
        <Icon name="download" />
      </Tooltip>
      <Tooltip label="Share" color="primary" position="bottom" cursor="pointer">
        <Icon name="share" />
      </Tooltip>
    </Buttons>
  ),
};

/**
 * Tooltip on text elements.
 */
export const OnText: Story = {
  render: () => (
    <Columns isCentered>
      <Column size="one-third">
        <Content>
          <p>
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
        </Content>
      </Column>
    </Columns>
  ),
};

/**
 * Form field with help tooltip.
 */
export const FormFieldHelp: Story = {
  render: () => (
    <Columns isCentered>
      <Column size="one-third">
        <Field>
          <label className="label">
            Password{' '}
            <Tooltip
              label="Must be at least 8 characters with one number and one special character"
              multiline
              color="info"
              cursor="help"
            >
              <Icon name="question-circle" size="small" />
            </Tooltip>
          </label>
          <Control>
            <Input type="password" placeholder="Enter password" />
          </Control>
        </Field>
      </Column>
    </Columns>
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
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
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
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 8,
          transform: 'translateY(-50%)',
        }}
      >
        <Tooltip label="Auto: no room on the left" position="auto">
          <Button size="small">Middle Left</Button>
        </Tooltip>
      </div>

      {/* Center */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <Tooltip label="Auto: plenty of room, defaults to top" position="auto">
          <Button>Center (defaults top)</Button>
        </Tooltip>
      </div>

      {/* Middle right */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: 8,
          transform: 'translateY(-50%)',
        }}
      >
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
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
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
    <Buttons p="5">
      <Tooltip label="Tooltip on button">
        <Button>Button</Button>
      </Tooltip>
      <Tooltip label="Tooltip on link">
        <a href="#" onClick={e => e.preventDefault()}>
          Link
        </a>
      </Tooltip>
      <Tooltip label="Tooltip on icon" cursor="pointer">
        <Icon name="info-circle" />
      </Tooltip>
      <Tooltip label="Tooltip on text" dashed>
        <span>Text</span>
      </Tooltip>
      <Tooltip label="Tooltip on image" cursor="pointer">
        <img
          src="https://bulma.io/assets/images/placeholders/64x64.png"
          alt="Example"
        />
      </Tooltip>
    </Buttons>
  ),
};

const colors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;
const sizes = [undefined, 'small', 'medium', 'large'] as const;
const sizeLabels: Record<string, string> = {
  '': 'default',
  small: 'small',
  medium: 'medium',
  large: 'large',
};

/**
 * Grid showing every color at each size, all always active.
 * Uses CSS grid so tooltips reflow responsively without overlapping.
 */
export const ColorsAndSizes: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <Box>
      {sizes.map(size => (
        <Block key={size || 'default'}>
          <Paragraph textColor="grey" textSize="7" textWeight="semibold" mb="3">
            {(sizeLabels[size || ''] || 'default').toUpperCase()}
          </Paragraph>
          <Grid minCol={6} rowGap={8} columnGap={1}>
            {colors.map(color => (
              <Block
                key={`${color}-${size || 'default'}`}
                pt="4"
                pb="6"
                textAlign="centered"
              >
                <Tooltip
                  label={color}
                  color={color}
                  size={size}
                  position="bottom"
                  active
                >
                  <Button color={color} size={size}>
                    {color}
                  </Button>
                </Tooltip>
              </Block>
            ))}
          </Grid>
        </Block>
      ))}
    </Box>
  ),
};

/**
 * Tooltip with custom rich content using the `content` prop.
 * Supports any ReactNode including formatted text, icons, and complex layouts.
 */
export const CustomContent: Story = {
  render: () => (
    <Buttons p="6">
      <Tooltip
        content={
          <span>
            <strong>Bold</strong> and <em>italic</em> text
          </span>
        }
        multiline
        active
        color="info"
      >
        <Button color="info">Rich text</Button>
      </Tooltip>
      <Tooltip
        content={
          <Block display="inline-flex" alignItems="center">
            <Icon name="thumbs-up" size="small" mr="2" />
            <Icon name="heart" size="small" mr="2" />
            <Icon name="star" size="small" />
          </Block>
        }
        color="warning"
      >
        <Button color="warning">Icon row</Button>
      </Tooltip>
      <Tooltip
        label="Fallback label"
        content={
          <span>
            Content <strong>overrides</strong> label
          </span>
        }
        multiline
        color="success"
      >
        <Button color="success">Content + label</Button>
      </Tooltip>
    </Buttons>
  ),
};
