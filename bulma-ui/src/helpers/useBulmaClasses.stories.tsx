// src/helpers/useBulmaClasses.stories.tsx
import React, { useEffect, useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import { useBulmaClasses, BulmaClassesProps } from './useBulmaClasses';

// Components for skeleton stories
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Icon } from '../elements/Icon';
import { Image } from '../elements/Image';
import Media from '../layout/Media';
import { Notification } from '../elements/Notification';
import { Tag } from '../elements/Tag';
import { Title } from '../elements/Title';
import { SubTitle } from '../elements/SubTitle';
import Input from '../form/Input';
import TextArea from '../form/TextArea';
import Content from '../elements/Content';
import { Box } from '../elements/Box';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';
import { Message } from '../components/Message';

// Allow arbitrary props to satisfy Record<string, unknown>
const UseBulmaClassesDemo: React.FC<
  BulmaClassesProps & Record<string, unknown>
> = props => {
  const { bulmaHelperClasses } = useBulmaClasses(props);
  return <div className={bulmaHelperClasses}>Styled Div</div>;
};

const meta: Meta<typeof UseBulmaClassesDemo> = {
  title: 'Helpers/useBulmaClasses',
  component: UseBulmaClassesDemo,
  argTypes: {
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
        'black-bis',
        'black-ter',
        'grey-darker',
        'grey-dark',
        'grey',
        'grey-light',
        'grey-lighter',
        'white',
        'inherit',
        'current',
      ],
    },
    margin: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
    },
    textAlign: {
      control: 'select',
      options: ['centered', 'justified', 'left', 'right'],
    },
    viewport: {
      control: 'select',
      options: ['mobile', 'tablet', 'desktop', 'widescreen', 'fullhd'],
    },
    skeleton: {
      control: 'boolean',
      description: 'Apply the is-skeleton class (Bulma skeleton helper)',
    },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof UseBulmaClassesDemo>;

export const Default: Story = {
  args: {
    color: 'primary',
    margin: '2',
    textAlign: 'centered',
  },
};

export const CustomStyles: Story = {
  args: {
    color: 'success',
    margin: '3',
    textAlign: 'left',
    viewport: 'desktop',
  },
};

// Skeleton toggling hook
function useSkeletonToggle(intervalMs = 3000) {
  const [skeleton, setSkeleton] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => setSkeleton(s => !s), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return skeleton;
}

// --- Skeleton Stories for Each Component, using Skeleton Toggle ---

export const SkeletonButton: Story = {
  render: () => <Button skeleton>Skeleton Button</Button>,
  name: 'Skeleton Button (Toggles)',
};

export const SkeletonButtons: Story = {
  render: () => (
    <Buttons>
      <Button skeleton>Skeleton</Button>
      <Button skeleton>Skeleton</Button>
      <Button skeleton>Skeleton</Button>
    </Buttons>
  ),
  name: 'Skeleton Buttons Group (Toggles)',
};

export const SkeletonIcon: Story = {
  render: () => <Icon name="star" skeleton ariaLabel="Star icon skeleton" />,
  name: 'Skeleton Icon (Toggles)',
};

export const SkeletonImage: Story = {
  render: () => (
    <Image
      skeleton
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1150px-React-icon.svg.png"
      alt="Skeleton image"
      size="128x128"
    />
  ),
  name: 'Skeleton Image (Toggles)',
};

// Skeleton Media Component
const SkeletonMediaComponent: React.FC = () => {
  const skeleton = useSkeletonToggle();
  return (
    <Media skeleton={skeleton}>
      <Media.Left>
        <Image
          skeleton={skeleton}
          as="p"
          size="64x64"
          src="https://bulma.io/assets/images/placeholders/128x128.png"
          alt=""
        />
      </Media.Left>
      <Media.Content>
        <Content>
          <p>
            <strong>Skeleton Name</strong> <small>@skelly</small>{' '}
            <small>1m</small>
            <br />
            This is a skeleton media example.
          </p>
        </Content>
      </Media.Content>
    </Media>
  );
};
export const SkeletonMedia: Story = {
  render: () => <SkeletonMediaComponent />,
  name: 'Skeleton Media (Toggles)',
};

export const SkeletonNotification: Story = {
  render: () => (
    <Notification skeleton>Skeleton notification message.</Notification>
  ),
  name: 'Skeleton Notification (Toggles)',
};

export const SkeletonTag: Story = {
  render: () => <Tag skeleton>Skeleton Tag</Tag>,
  name: 'Skeleton Tag (Toggles)',
};

export const SkeletonTitle: Story = {
  render: () => (
    <Title skeleton size="2">
      Skeleton Title
    </Title>
  ),
  name: 'Skeleton Title (Toggles)',
};

export const SkeletonSubTitle: Story = {
  render: () => (
    <SubTitle skeleton size="4">
      Skeleton SubTitle
    </SubTitle>
  ),
  name: 'Skeleton SubTitle (Toggles)',
};

export const SkeletonInput: Story = {
  render: () => <Input skeleton placeholder="Skeleton Input" />,
  name: 'Skeleton Input (Toggles)',
};

export const SkeletonTextArea: Story = {
  render: () => <TextArea skeleton placeholder="Skeleton TextArea" rows={3} />,
  name: 'Skeleton TextArea (Toggles)',
};

// --- Custom Stories for useBulmaClasses Example Coverage ---

export const Colors: Story = {
  render: () => (
    <Buttons>
      <Button color="primary">Primary</Button>
      <Button color="link">Link</Button>
      <Button color="info">Info</Button>
      <Button color="success">Success</Button>
      <Button color="warning">Warning</Button>
      <Button color="danger">Danger</Button>
    </Buttons>
  ),
  name: 'Colors',
};

export const BackgroundColors: Story = {
  render: () => (
    <Columns isMultiline>
      <Column size="one-quarter">
        <Box bgColor="primary">Primary</Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="link">Link</Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="info">Info</Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="success">Success</Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="warning">Warning</Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="danger">Danger</Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="black">Black</Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="white">White</Box>
      </Column>
    </Columns>
  ),
  name: 'Background Colors',
};

export const ColorShades: Story = {
  render: () => (
    <Buttons>
      <Button color="primary" colorShade="10">
        Primary 10
      </Button>
      <Button color="primary" colorShade="30">
        Primary 30
      </Button>
      <Button color="primary" colorShade="60">
        Primary 60
      </Button>
      <Button color="primary" colorShade="90">
        Primary 90
      </Button>
      <Button color="primary" colorShade="invert">
        Primary Invert
      </Button>
    </Buttons>
  ),
  name: 'Color Shades',
};

export const BackgroundColorShades: Story = {
  render: () => (
    <Columns isMultiline>
      <Column size="one-quarter">
        <Box bgColor="primary" colorShade="10">
          Primary 10
        </Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="primary" colorShade="30">
          Primary 30
        </Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="primary" colorShade="60">
          Primary 60
        </Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="primary" colorShade="90">
          Primary 90
        </Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="primary" colorShade="invert">
          Primary Invert
        </Box>
      </Column>
    </Columns>
  ),
  name: 'Background Color Shades',
};

export const Margin: Story = {
  render: () => (
    <>
      <Buttons>
        <Button>Left</Button>
        <Button m="4">Margin 4</Button>
        <Button>Right</Button>
      </Buttons>
      <Buttons mt="5" mb="5">
        <Button>Top/Bottom Margin</Button>
        <Button>Row 2</Button>
      </Buttons>
    </>
  ),
  name: 'Margin',
};

export const TextSize: Story = {
  render: () => (
    <>
      <Notification textSize="1">Size 1</Notification>
      <Notification textSize="3">Size 3</Notification>
      <Notification textSize="5">Size 5</Notification>
      <Notification textSize="7">Size 7</Notification>
    </>
  ),
  name: 'Text Size',
};

export const TextAlign: Story = {
  render: () => (
    <>
      <Box textAlign="centered">Centered text</Box>
      <Box textAlign="right">Right aligned text</Box>
      <Box textAlign="left">Left aligned text</Box>
    </>
  ),
  name: 'Text Align',
};

export const TextTransform: Story = {
  render: () => (
    <>
      <Content textTransform="uppercase">
        <p>
          We hold these truths to be self-evident, that all men are created
          equal...
        </p>
      </Content>
      <Content textTransform="lowercase">
        <p>
          We hold these truths to be self-evident, that all men are created
          equal...
        </p>
      </Content>
      <Content textTransform="capitalized">
        <p>
          We hold these truths to be self-evident, that all men are created
          equal...
        </p>
      </Content>
      <Content textTransform="italic">
        <p>
          We hold these truths to be self-evident, that all men are created
          equal...
        </p>
      </Content>
    </>
  ),
  name: 'Text Transform',
};

export const TextWeight: Story = {
  render: () => (
    <>
      <Content textWeight="light">
        <p>
          We hold these truths to be self-evident, that all men are created
          equal...
        </p>
      </Content>
      <Content textWeight="normal">
        <p>
          We hold these truths to be self-evident, that all men are created
          equal...
        </p>
      </Content>
      <Content textWeight="medium">
        <p>
          We hold these truths to be self-evident, that all men are created
          equal...
        </p>
      </Content>
      <Content textWeight="bold">
        <p>
          We hold these truths to be self-evident, that all men are created
          equal...
        </p>
      </Content>
    </>
  ),
  name: 'Text Weight',
};

export const FontFamily: Story = {
  render: () => (
    <>
      <Content fontFamily="sans-serif">
        <p>
          We hold these truths to be self-evident, that all men are created
          equal...
        </p>
      </Content>
      <Content fontFamily="monospace">
        <p>
          We hold these truths to be self-evident, that all men are created
          equal...
        </p>
      </Content>
      <Content fontFamily="primary">
        <p>
          We hold these truths to be self-evident, that all men are created
          equal...
        </p>
      </Content>
      <Content fontFamily="secondary">
        <p>
          We hold these truths to be self-evident, that all men are created
          equal...
        </p>
      </Content>
      <Content fontFamily="code">
        <p>
          We hold these truths to be self-evident, that all men are created
          equal...
        </p>
      </Content>
    </>
  ),
  name: 'Font Family',
};

export const Visibility: Story = {
  render: () => (
    <Buttons>
      <Button visibility="hidden">Hidden</Button>
      <Button visibility="sr-only">Screen Reader Only</Button>
      <Button>Visible</Button>
    </Buttons>
  ),
  name: 'Visibility',
};

export const Overflow: Story = {
  render: () => (
    <Box overflow="clipped" style={{ width: 200, height: 50 }}>
      This is a very long line of text that will be clipped and not overflow the
      box.
    </Box>
  ),
  name: 'Overflow',
};

export const Overlay: Story = {
  render: () => (
    <Box overlay>
      <span style={{ position: 'relative', zIndex: 1 }}>Content</span>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 2,
        }}
      />
    </Box>
  ),
  name: 'Overlay',
};

export const Interaction: Story = {
  render: () => (
    <>
      <Box interaction="unselectable">This text cannot be selected.</Box>
      <Box interaction="clickable">This box is clickable.</Box>
    </>
  ),
  name: 'Interaction',
};

export const Radius: Story = {
  render: () => (
    <Buttons>
      <Button radius="radiusless">Radiusless</Button>
      <Button>Normal</Button>
    </Buttons>
  ),
  name: 'Radius',
};

export const Shadowless: Story = {
  render: () => <Box shadow="shadowless">This box has no shadow.</Box>,
  name: 'Shadowless',
};

export const ClassName: Story = {
  render: () => (
    <Message className="custom-message">
      This message uses a custom className.
    </Message>
  ),
  name: 'ClassName',
};

// --- Display and Viewport Stories ---

export const DisplayValues: Story = {
  render: () => (
    <Box>
      <h3 className="title is-5">Display Values</h3>
      <div style={{ marginBottom: '1rem' }}>
        <span className="tag is-info">display=&quot;block&quot;</span>
        <Box
          display="block"
          style={{
            background: '#f5f5f5',
            padding: '0.5rem',
            margin: '0.25rem 0',
          }}
        >
          Block display (takes full width)
        </Box>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <span className="tag is-info">display=&quot;inline&quot;</span>
        <Box
          display="inline"
          style={{
            background: '#f5f5f5',
            padding: '0.5rem',
            margin: '0.25rem',
          }}
        >
          Inline display
        </Box>
        <Box
          display="inline"
          style={{
            background: '#e8e8e8',
            padding: '0.5rem',
            margin: '0.25rem',
          }}
        >
          Another inline
        </Box>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <span className="tag is-info">display=&quot;inline-block&quot;</span>
        <Box
          display="inline-block"
          style={{
            background: '#f5f5f5',
            padding: '0.5rem',
            margin: '0.25rem',
            width: '150px',
          }}
        >
          Inline-block 1
        </Box>
        <Box
          display="inline-block"
          style={{
            background: '#e8e8e8',
            padding: '0.5rem',
            margin: '0.25rem',
            width: '150px',
          }}
        >
          Inline-block 2
        </Box>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <span className="tag is-info">display=&quot;flex&quot;</span>
        <Box
          display="flex"
          style={{ background: '#f5f5f5', padding: '0.5rem', gap: '0.5rem' }}
        >
          <div style={{ background: '#ddd', padding: '0.5rem', flex: 1 }}>
            Flex item 1
          </div>
          <div style={{ background: '#ccc', padding: '0.5rem', flex: 1 }}>
            Flex item 2
          </div>
        </Box>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <span className="tag is-info">display=&quot;inline-flex&quot;</span>
        <Box
          display="inline-flex"
          style={{
            background: '#f5f5f5',
            padding: '0.5rem',
            gap: '0.5rem',
            margin: '0.25rem',
          }}
        >
          <div style={{ background: '#ddd', padding: '0.25rem' }}>Item 1</div>
          <div style={{ background: '#ccc', padding: '0.25rem' }}>Item 2</div>
        </Box>
        <Box
          display="inline-flex"
          style={{
            background: '#e8e8e8',
            padding: '0.5rem',
            gap: '0.5rem',
            margin: '0.25rem',
          }}
        >
          <div style={{ background: '#bbb', padding: '0.25rem' }}>Item 3</div>
          <div style={{ background: '#aaa', padding: '0.25rem' }}>Item 4</div>
        </Box>
      </div>
    </Box>
  ),
  name: 'Display Values',
};

export const ViewportSpecificDisplay: Story = {
  render: () => (
    <Box>
      <h3 className="title is-5">Viewport-Specific Display</h3>
      <p className="subtitle is-6">Resize your browser to see the effect</p>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">Mobile Hidden, Tablet+ Visible</h4>
        <Box
          displayMobile="none"
          displayTablet="block"
          style={{
            background: '#e3f2fd',
            padding: '1rem',
            border: '2px solid #2196f3',
          }}
        >
          This box is hidden on mobile (display: none) but visible as block on
          tablet and larger screens.
        </Box>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">Progressive Display Changes</h4>
        <Box
          displayMobile="block"
          displayTablet="inline-block"
          displayDesktop="flex"
          style={{
            background: '#f3e5f5',
            padding: '1rem',
            border: '2px solid #9c27b0',
            gap: '0.5rem',
          }}
        >
          <div style={{ background: '#e1bee7', padding: '0.5rem', flex: 1 }}>
            Mobile: block | Tablet: inline-block | Desktop+: flex
          </div>
          <div style={{ background: '#ce93d8', padding: '0.5rem', flex: 1 }}>
            Item 2 (visible in flex layout on desktop+)
          </div>
        </Box>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">Desktop Only Flex Layout</h4>
        <Box
          displayMobile="block"
          displayTablet="block"
          displayDesktop="flex"
          displayWidescreen="flex"
          displayFullhd="flex"
          style={{
            background: '#e8f5e8',
            padding: '1rem',
            border: '2px solid #4caf50',
            gap: '0.5rem',
          }}
        >
          <div style={{ background: '#c8e6c9', padding: '0.5rem', flex: 1 }}>
            Card 1
          </div>
          <div style={{ background: '#a5d6a7', padding: '0.5rem', flex: 1 }}>
            Card 2
          </div>
          <div style={{ background: '#81c784', padding: '0.5rem', flex: 1 }}>
            Card 3
          </div>
        </Box>
        <p className="help">
          Stacked on mobile/tablet, side-by-side on desktop+
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">Responsive Visibility Control</h4>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Box
            displayMobile="block"
            displayTablet="none"
            displayDesktop="block"
            style={{
              background: '#fff3e0',
              padding: '1rem',
              border: '2px solid #ff9800',
              minWidth: '200px',
            }}
          >
            Mobile + Desktop Only
          </Box>
          <Box
            displayMobile="none"
            displayTablet="block"
            displayDesktop="none"
            style={{
              background: '#fce4ec',
              padding: '1rem',
              border: '2px solid #e91e63',
              minWidth: '200px',
            }}
          >
            Tablet Only
          </Box>
          <Box
            displayMobile="none"
            displayTablet="none"
            displayDesktop="block"
            style={{
              background: '#e3f2fd',
              padding: '1rem',
              border: '2px solid #2196f3',
              minWidth: '200px',
            }}
          >
            Desktop+ Only
          </Box>
        </div>
      </div>
    </Box>
  ),
  name: 'Viewport-Specific Display',
};

export const GenericDisplayViewport: Story = {
  render: () => (
    <Box>
      <h3 className="title is-5">Generic Display + Viewport Settings</h3>
      <p className="subtitle is-6">
        Using the generic display + viewport prop pattern
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <div className="notification is-info is-light">
          <p>
            <strong>Note:</strong> The generic <code>display</code> +{' '}
            <code>viewport</code> pattern supports only one display/viewport
            combination at a time.
          </p>
          <p>
            For multiple viewport combinations (e.g., hidden on mobile, flex on
            tablet, block on desktop), use the viewport-specific display
            properties: <code>displayMobile</code>, <code>displayTablet</code>,{' '}
            <code>displayDesktop</code>, <code>displayWidescreen</code>,{' '}
            <code>displayFullhd</code>.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">Generic Pattern Examples</h4>

        <div style={{ marginBottom: '1rem' }}>
          <span className="tag is-primary">
            display=&quot;block&quot; viewport=&quot;tablet&quot;
          </span>
          <Box
            display="block"
            viewport="tablet"
            style={{
              background: '#fff8e1',
              padding: '1rem',
              border: '2px solid #ffc107',
              marginTop: '0.5rem',
            }}
          >
            Block display on tablet and larger (one combination only)
          </Box>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <span className="tag is-primary">
            display=&quot;flex&quot; viewport=&quot;desktop&quot;
          </span>
          <Box
            display="flex"
            viewport="desktop"
            style={{
              background: '#f3e5f5',
              padding: '1rem',
              border: '2px solid #9c27b0',
              gap: '0.5rem',
              marginTop: '0.5rem',
            }}
          >
            <div style={{ background: '#e1bee7', padding: '0.5rem', flex: 1 }}>
              Flex on desktop+
            </div>
            <div style={{ background: '#ce93d8', padding: '0.5rem', flex: 1 }}>
              Generic pattern
            </div>
          </Box>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <span className="tag is-primary">
            display=&quot;none&quot; viewport=&quot;mobile&quot;
          </span>
          <Box
            display="none"
            viewport="mobile"
            style={{
              background: '#ffebee',
              padding: '1rem',
              border: '2px solid #f44336',
              marginTop: '0.5rem',
            }}
          >
            Hidden on mobile (one combination only)
          </Box>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">
          Limitation: Cannot Mix Multiple Viewports
        </h4>
        <div className="notification is-warning is-light">
          <p>
            <strong>Problem:</strong> You cannot use the generic pattern to
            achieve &quot;hidden on mobile, flex on tablet, block on
            desktop&quot; because it only supports one display/viewport
            combination.
          </p>
          <p>
            <strong>Solution:</strong> Use viewport-specific properties like{' '}
            <code>
              displayMobile=&quot;none&quot; displayTablet=&quot;flex&quot;
              displayDesktop=&quot;block&quot;
            </code>{' '}
            instead.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">
          Viewport-Specific Properties Override Generic
        </h4>
        <p className="help">
          When both patterns are used, viewport-specific props take precedence
        </p>

        <Box
          display="block"
          viewport="mobile"
          displayMobile="flex"
          displayDesktop="inline-flex"
          style={{
            background: '#e8f5e8',
            padding: '1rem',
            border: '2px solid #4caf50',
            gap: '0.5rem',
            marginTop: '0.5rem',
          }}
        >
          <div style={{ background: '#c8e6c9', padding: '0.5rem', flex: 1 }}>
            Generic: block-mobile | Override: flex-mobile, inline-flex-desktop
          </div>
          <div style={{ background: '#a5d6a7', padding: '0.5rem', flex: 1 }}>
            Viewport-specific wins!
          </div>
        </Box>
      </div>
    </Box>
  ),
  name: 'Generic Display + Viewport',
};

export const FlexboxWithViewports: Story = {
  render: () => (
    <Box>
      <h3 className="title is-5">Flexbox with Viewport-Specific Display</h3>
      <p className="subtitle is-6">
        Flexbox properties work when any viewport has flex display
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">Responsive Flex Direction</h4>
        <Box
          displayMobile="flex"
          displayDesktop="flex"
          flexDirection="column-reverse"
          style={{
            background: '#e3f2fd',
            padding: '1rem',
            border: '2px solid #2196f3',
            gap: '0.5rem',
          }}
        >
          <div style={{ background: '#bbdefb', padding: '0.5rem', order: 1 }}>
            Item 1 (flex-direction: column-reverse)
          </div>
          <div style={{ background: '#90caf9', padding: '0.5rem', order: 2 }}>
            Item 2
          </div>
          <div style={{ background: '#64b5f6', padding: '0.5rem', order: 3 }}>
            Item 3
          </div>
        </Box>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">Justify Content & Align Items</h4>
        <Box
          displayTablet="flex"
          justifyContent="space-between"
          alignItems="center"
          style={{
            background: '#f3e5f5',
            padding: '1rem',
            border: '2px solid #9c27b0',
            minHeight: '100px',
          }}
        >
          <div style={{ background: '#e1bee7', padding: '0.5rem' }}>Start</div>
          <div style={{ background: '#ce93d8', padding: '0.5rem' }}>Center</div>
          <div style={{ background: '#ba68c8', padding: '0.5rem' }}>End</div>
        </Box>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">Flex Grow & Shrink</h4>
        <Box
          displayDesktop="flex"
          style={{
            background: '#e8f5e8',
            padding: '1rem',
            border: '2px solid #4caf50',
            gap: '0.5rem',
          }}
        >
          <Box
            flexGrow="0"
            flexShrink="0"
            style={{
              background: '#c8e6c9',
              padding: '0.5rem',
              minWidth: '150px',
            }}
          >
            Fixed Width (grow: 0, shrink: 0)
          </Box>
          <Box
            flexGrow="1"
            style={{ background: '#a5d6a7', padding: '0.5rem' }}
          >
            Flexible (grow: 1)
          </Box>
          <Box
            flexGrow="2"
            style={{ background: '#81c784', padding: '0.5rem' }}
          >
            More Flexible (grow: 2)
          </Box>
        </Box>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">Flex Wrap</h4>
        <Box
          displayMobile="flex"
          flexWrap="wrap"
          justifyContent="center"
          style={{
            background: '#fff3e0',
            padding: '1rem',
            border: '2px solid #ff9800',
            gap: '0.5rem',
          }}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              style={{
                background: '#ffcc02',
                padding: '0.5rem',
                minWidth: '120px',
                textAlign: 'center',
              }}
            >
              Item {i + 1}
            </div>
          ))}
        </Box>
      </div>
    </Box>
  ),
  name: 'Flexbox with Viewports',
};

export const ComplexResponsiveLayout: Story = {
  render: () => (
    <Box>
      <h3 className="title is-5">Complex Responsive Layout Example</h3>
      <p className="subtitle is-6">
        Real-world responsive layout using viewport-specific display
      </p>

      {/* Header */}
      <Box
        displayMobile="block"
        displayTablet="flex"
        justifyContent="space-between"
        alignItems="center"
        style={{
          background: '#1976d2',
          color: 'white',
          padding: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>Logo</div>
        <Box displayMobile="none" displayTablet="flex" style={{ gap: '1rem' }}>
          <a href="#" style={{ color: 'white', textDecoration: 'none' }}>
            Home
          </a>
          <a href="#" style={{ color: 'white', textDecoration: 'none' }}>
            About
          </a>
          <a href="#" style={{ color: 'white', textDecoration: 'none' }}>
            Contact
          </a>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        displayMobile="block"
        displayDesktop="flex"
        style={{ gap: '1rem', marginBottom: '1rem' }}
      >
        {/* Sidebar */}
        <Box
          displayMobile="block"
          displayDesktop="block"
          style={{
            background: '#f5f5f5',
            padding: '1rem',
            marginBottom: '1rem',
            flex: '0 0 250px',
          }}
        >
          <h4 style={{ margin: '0 0 1rem 0' }}>Sidebar</h4>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            <li style={{ marginBottom: '0.5rem' }}>Navigation Item 1</li>
            <li style={{ marginBottom: '0.5rem' }}>Navigation Item 2</li>
            <li style={{ marginBottom: '0.5rem' }}>Navigation Item 3</li>
          </ul>
        </Box>

        {/* Main Content */}
        <Box style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>Main Content</h4>

          {/* Card Grid */}
          <Box
            displayMobile="block"
            displayTablet="flex"
            flexWrap="wrap"
            style={{ gap: '1rem' }}
          >
            {Array.from({ length: 6 }, (_, i) => (
              <Box
                key={i}
                displayMobile="block"
                displayTablet="block"
                style={{
                  background: 'white',
                  border: '1px solid #ddd',
                  padding: '1rem',
                  flex: '1 1 calc(50% - 0.5rem)',
                  minWidth: '280px',
                  marginBottom: '1rem',
                }}
              >
                <h5 style={{ margin: '0 0 0.5rem 0' }}>Card {i + 1}</h5>
                <p style={{ margin: 0, color: '#666' }}>
                  This card adapts its layout based on screen size.
                </p>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        displayMobile="block"
        displayTablet="flex"
        justifyContent="center"
        style={{
          background: '#333',
          color: 'white',
          padding: '1rem',
          textAlign: 'center',
        }}
      >
        <div>© 2025 Responsive Layout Demo</div>
      </Box>
    </Box>
  ),
  name: 'Complex Responsive Layout',
};
