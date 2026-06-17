import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Loading } from './Loading';
import type { LoadingColor, LoadingOverlay } from './Loading';
import { Button } from '../elements/Button';
import { Icon } from '../elements/Icon';
import { Box } from '../elements/Box';
import { Block } from '../elements/Block';
import { Card } from './Card';
import { Content } from '../elements/Content';
import { Paragraph } from '../elements/Paragraph';
import { Grid } from '../grid/Grid';
import { Cell } from '../grid/Cell';

const meta: Meta<typeof Loading> = {
  title: 'Components/Loading',
  component: Loading,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A loading overlay component with spinner animation. Can be used as a full-page overlay or a container overlay to indicate loading states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    active: {
      control: 'boolean',
      description: 'Whether the loading overlay is visible',
    },
    isFullPage: {
      control: 'boolean',
      description: 'Cover the entire viewport',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of the loading spinner',
    },
    color: {
      control: 'select',
      options: [
        undefined,
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
      ],
      description: 'Color variant for the spinner',
    },
    overlay: {
      control: 'select',
      options: [undefined, 'light', 'dark', 'opaque'],
      description: 'Overlay opacity level',
    },
    canCancel: {
      control: 'boolean',
      description: 'Show a cancel button and allow closing',
    },
    children: {
      control: 'text',
      description: 'Loading message to display below the spinner',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Loading>;

const colors: LoadingColor[] = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
];
const overlays: (LoadingOverlay | undefined)[] = [
  'light',
  undefined,
  'dark',
  'opaque',
];
const overlayLabels: Record<string, string> = {
  light: 'Light',
  default: 'Default',
  dark: 'Dark',
  opaque: 'Opaque',
};
const sizes = ['small', undefined, 'medium', 'large'] as const;
const sizeLabels: Record<string, string> = {
  small: 'Small',
  default: 'Default',
  medium: 'Medium',
  large: 'Large',
};

/**
 * Basic loading overlay within a container.
 */
export const Default: Story = {
  render: () => (
    <Box relative style={{ height: '200px' }}>
      <Loading active>Loading...</Loading>
      <Content>
        <Paragraph>This content is behind the loading overlay.</Paragraph>
      </Content>
    </Box>
  ),
};

/**
 * Loading without text message.
 */
export const NoMessage: Story = {
  render: () => (
    <Box relative style={{ height: '200px' }}>
      <Loading active />
      <Content>
        <Paragraph>This content is behind the loading overlay.</Paragraph>
      </Content>
    </Box>
  ),
};

/**
 * All four spinner sizes side-by-side.
 */
export const Sizes: Story = {
  render: () => (
    <Grid isFixed fixedCols={4}>
      {sizes.map(size => (
        <Cell key={size ?? 'default'}>
          <Box relative style={{ height: '200px' }}>
            <Loading active size={size}>
              {sizeLabels[size ?? 'default']}
            </Loading>
          </Box>
        </Cell>
      ))}
    </Grid>
  ),
};

/**
 * Each size with a primary color spinner.
 */
export const SizesWithColor: Story = {
  render: () => (
    <Grid isFixed fixedCols={4}>
      {sizes.map(size => (
        <Cell key={size ?? 'default'}>
          <Box relative style={{ height: '200px' }}>
            <Loading active size={size} color="primary">
              {sizeLabels[size ?? 'default']}
            </Loading>
          </Box>
        </Cell>
      ))}
    </Grid>
  ),
};

/**
 * All Bulma color variants at default size.
 */
export const Colors: Story = {
  render: () => (
    <Grid isFixed fixedCols={4}>
      <Cell>
        <Box relative style={{ height: '160px' }}>
          <Loading active>Default</Loading>
        </Box>
      </Cell>
      {colors.map(color => (
        <Cell key={color}>
          <Box relative style={{ height: '160px' }}>
            <Loading active color={color}>
              {color.charAt(0).toUpperCase() + color.slice(1)}
            </Loading>
          </Box>
        </Cell>
      ))}
    </Grid>
  ),
};

/**
 * Color variants at the small size.
 */
export const ColorsSmall: Story = {
  render: () => (
    <Grid isFixed fixedCols={4}>
      {colors.map(color => (
        <Cell key={color}>
          <Box relative style={{ height: '140px' }}>
            <Loading active size="small" color={color}>
              {color.charAt(0).toUpperCase() + color.slice(1)}
            </Loading>
          </Box>
        </Cell>
      ))}
    </Grid>
  ),
};

/**
 * Color variants at the large size.
 */
export const ColorsLarge: Story = {
  render: () => (
    <Grid isFixed fixedCols={3}>
      {colors.map(color => (
        <Cell key={color}>
          <Box relative style={{ height: '220px' }}>
            <Loading active size="large" color={color}>
              {color.charAt(0).toUpperCase() + color.slice(1)}
            </Loading>
          </Box>
        </Cell>
      ))}
    </Grid>
  ),
};

/**
 * All overlay opacity levels side-by-side.
 */
export const OverlayOpacity: Story = {
  render: () => (
    <Grid isFixed fixedCols={4}>
      {overlays.map(overlay => (
        <Cell key={overlay ?? 'default'}>
          <Box relative style={{ height: '200px' }}>
            <Loading active overlay={overlay}>
              {overlayLabels[overlay ?? 'default']}
            </Loading>
            <Content>
              <Paragraph>Content behind the overlay.</Paragraph>
            </Content>
          </Box>
        </Cell>
      ))}
    </Grid>
  ),
};

/**
 * Loading with cancel functionality.
 */
export const WithCancel: Story = {
  render: function LoadingWithCancel() {
    const [isLoading, setIsLoading] = useState(true);

    return (
      <Block>
        <Box relative style={{ height: '200px' }}>
          <Loading
            active={isLoading}
            canCancel
            onCancel={() => setIsLoading(false)}
          >
            Click cancel or press Escape to close
          </Loading>
          <Content>
            <Paragraph>This content is behind the loading overlay.</Paragraph>
          </Content>
        </Box>
        {!isLoading && (
          <Button color="primary" mt="4" onClick={() => setIsLoading(true)}>
            Show Loading Again
          </Button>
        )}
      </Block>
    );
  },
};

/**
 * Full page loading overlay.
 * Note: This will cover the entire viewport in the actual implementation.
 */
export const FullPage: Story = {
  render: function FullPageLoading() {
    const [isLoading, setIsLoading] = useState(false);

    return (
      <Block>
        <Button color="primary" onClick={() => setIsLoading(true)}>
          Show Full Page Loading
        </Button>
        <Loading
          active={isLoading}
          isFullPage
          canCancel
          onCancel={() => setIsLoading(false)}
        >
          Full page loading... Click cancel or press Escape to close
        </Loading>
      </Block>
    );
  },
};

/**
 * Loading overlay triggered by a button (common use case).
 */
export const TriggeredByButton: Story = {
  render: function TriggeredLoading() {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = () => {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 2000);
    };

    return (
      <Box relative p="4">
        <Loading active={isLoading}>Loading data...</Loading>
        <Content>
          <Paragraph>Click the button to see the loading overlay.</Paragraph>
        </Content>
        <Button
          color="primary"
          onClick={handleClick}
          disabled={isLoading}
          mt="3"
        >
          Load Data
        </Button>
      </Box>
    );
  },
};

/**
 * Multiple loading containers in a layout.
 */
export const MultipleContainers: Story = {
  render: function MultipleLoading() {
    const [loadingStates, setLoadingStates] = useState({
      card1: true,
      card2: false,
      card3: true,
    });

    const toggleLoading = (key: keyof typeof loadingStates) => {
      setLoadingStates(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
      <Grid isFixed fixedCols={3}>
        {(['card1', 'card2', 'card3'] as const).map((key, index) => (
          <Cell key={key}>
            <Card
              header={`Card ${index + 1}`}
              footer={
                <Button size="small" onClick={() => toggleLoading(key)}>
                  Toggle
                </Button>
              }
              relative
            >
              <Loading active={loadingStates[key]} size="small" />
              <Content>
                <Paragraph>Content here</Paragraph>
              </Content>
            </Card>
          </Cell>
        ))}
      </Grid>
    );
  },
};

/**
 * Custom indicator replacing the default CSS spinner.
 * The Loading component handles the spin animation, so provide a static icon.
 */
export const CustomIndicator: Story = {
  render: () => (
    <Box relative style={{ height: '250px' }}>
      <Loading
        active
        indicator={<Icon name="fan" variant="solid" size="large" />}
      >
        Spinning up...
      </Loading>
      <Content>
        <Paragraph>This content is behind the loading overlay.</Paragraph>
      </Content>
    </Box>
  ),
};

/**
 * Loading inactive state (not visible).
 */
export const Inactive: Story = {
  render: () => (
    <Box relative p="4">
      <Loading active={false}>This text won&apos;t be shown</Loading>
      <Content>
        <Paragraph>
          The loading overlay is inactive (active=false), so the content is
          visible.
        </Paragraph>
      </Content>
    </Box>
  ),
};
