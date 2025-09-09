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
import { Block } from '../elements/Block';
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
    clearfix: {
      control: 'boolean',
      description: 'Apply the is-clearfix class to fix floating children',
    },
    relative: {
      control: 'boolean',
      description: 'Apply the is-relative class for position: relative',
    },
    float: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Float direction (is-pulled-left/is-pulled-right)',
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
        Text Primary 10
      </Button>
      <Button color="primary" colorShade="30">
        Text Primary 30
      </Button>
      <Button color="primary" colorShade="60">
        Text Primary 60
      </Button>
      <Button color="primary" colorShade="90">
        Text Primary 90
      </Button>
      <Button color="primary" colorShade="invert">
        Text Primary Invert
      </Button>
    </Buttons>
  ),
  name: 'Color Shades',
};

export const BackgroundColorShades: Story = {
  render: () => (
    <Columns isMultiline>
      <Column size="one-quarter">
        <Box bgColor="primary" backgroundColorShade="10">
          Background Primary 10
        </Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="primary" backgroundColorShade="30">
          Background Primary 30
        </Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="primary" backgroundColorShade="60" textColor="white">
          Background Primary 60
        </Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="primary" backgroundColorShade="90" textColor="white">
          Background Primary 90
        </Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="primary" backgroundColorShade="invert">
          Background Primary Invert
        </Box>
      </Column>
    </Columns>
  ),
  name: 'Background Color Shades',
};

export const CombinedColorShades: Story = {
  render: () => (
    <Columns isMultiline>
      <Column size="one-half">
        <Box
          bgColor="primary"
          backgroundColorShade="10"
          textColor="primary"
          colorShade="80"
          p="4"
        >
          Light background (10%) with dark text (80%)
        </Box>
      </Column>
      <Column size="one-half">
        <Box
          bgColor="info"
          backgroundColorShade="75"
          textColor="info"
          colorShade="05"
          p="4"
        >
          Dark background (75%) with light text (05%)
        </Box>
      </Column>
      <Column size="one-half">
        <Box
          bgColor="success"
          backgroundColorShade="20"
          textColor="success"
          colorShade="dark"
          p="4"
        >
          Light success background with dark success text
        </Box>
      </Column>
      <Column size="one-half">
        <Box
          bgColor="warning"
          backgroundColorShade="bold"
          textColor="warning"
          colorShade="light"
          p="4"
        >
          Bold warning background with light warning text
        </Box>
      </Column>
    </Columns>
  ),
  name: 'Combined Color Shades',
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
      <Button visibility="invisible">Invisible</Button>
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
      <Title size="5">Display Values</Title>
      <Block mb="4">
        <Tag color="info">display=&quot;block&quot;</Tag>
        <Box display="block" bgColor="grey-lighter" p="2" my="1">
          Block display (takes full width)
        </Box>
      </Block>

      <Block mb="4">
        <Tag color="info">display=&quot;inline&quot;</Tag>
        <Box display="inline" bgColor="grey-lighter" p="2" m="1">
          Inline display
        </Box>
        <Box display="inline" bgColor="grey-light" p="2" m="1">
          Another inline
        </Box>
      </Block>

      <Block mb="4">
        <Tag color="info">display=&quot;inline-block&quot;</Tag>
        <Box
          display="inline-block"
          bgColor="grey-lighter"
          p="2"
          m="1"
          style={{ width: '150px' }}
        >
          Inline-block 1
        </Box>
        <Box
          display="inline-block"
          bgColor="grey-light"
          p="2"
          m="1"
          style={{ width: '150px' }}
        >
          Inline-block 2
        </Box>
      </Block>

      <Block mb="4">
        <Tag color="info">display=&quot;flex&quot;</Tag>
        <Columns bgColor="grey-lighter" p="2" isGapless={false}>
          <Column>
            <Block bgColor="grey-dark" textColor="white" p="2">
              Flex item 1
            </Block>
          </Column>
          <Column>
            <Block bgColor="grey" textColor="white" p="2">
              Flex item 2
            </Block>
          </Column>
        </Columns>
      </Block>

      <Block mb="4">
        <Tag color="info">display=&quot;inline-flex&quot;</Tag>
        <Columns
          bgColor="grey-lighter"
          p="2"
          m="1"
          isGapless={false}
          style={{ display: 'inline-flex' }}
        >
          <Column size="half">
            <Block bgColor="grey-dark" textColor="white" p="1">
              Item 1
            </Block>
          </Column>
          <Column size="half">
            <Block bgColor="grey" textColor="white" p="1">
              Item 2
            </Block>
          </Column>
        </Columns>
        <Columns
          bgColor="grey-light"
          p="2"
          m="1"
          isGapless={false}
          style={{ display: 'inline-flex' }}
        >
          <Column size="half">
            <Block bgColor="grey-darker" textColor="white" p="1">
              Item 3
            </Block>
          </Column>
          <Column size="half">
            <Block bgColor="black-ter" textColor="white" p="1">
              Item 4
            </Block>
          </Column>
        </Columns>
      </Block>
    </Box>
  ),
  name: 'Display Values',
};

export const ViewportSpecificDisplay: Story = {
  render: () => (
    <Box>
      <Title size="5">Viewport-Specific Display</Title>
      <SubTitle size="6">Resize your browser to see the effect</SubTitle>

      <Block mb="5">
        <Title size="6">Mobile Hidden, Tablet+ Visible</Title>
        <Box
          displayMobile="none"
          displayTablet="block"
          bgColor="info"
          colorShade="00"
          p="4"
          style={{ border: '2px solid #2196f3' }}
        >
          This box is hidden on mobile (display: none) but visible as block on
          tablet and larger screens.
        </Box>
      </Block>

      <div style={{ marginBottom: '2rem' }}>
        <Title size="6">Progressive Display Changes</Title>
        <Columns
          displayMobile="block"
          displayTablet="block"
          displayDesktop="flex"
          p="4"
          isGapless={false}
        >
          <Column>
            <Block p="2" textColor="current">
              Mobile: block | Tablet: inline-block | Desktop+: flex
            </Block>
          </Column>
          <Column>
            <Block p="2" textColor="current">
              Item 2 (visible in flex layout on desktop+)
            </Block>
          </Column>
        </Columns>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <Title size="6">Desktop Only Flex Layout</Title>
        <Columns
          displayMobile="block"
          displayTablet="block"
          displayDesktop="flex"
          displayWidescreen="flex"
          displayFullhd="flex"
          bgColor="success"
          colorShade="05"
          p="4"
          isGapless={false}
        >
          <Column>
            <Block bgColor="success" colorShade="10" p="2">
              Card 1
            </Block>
          </Column>
          <Column>
            <Block bgColor="success" colorShade="20" p="2">
              Card 2
            </Block>
          </Column>
          <Column>
            <Block bgColor="success" colorShade="30" p="2">
              Card 3
            </Block>
          </Column>
        </Columns>
        <p className="help">
          Stacked on mobile/tablet, side-by-side on desktop+
        </p>
      </div>

      <Block mb="5">
        <Title size="6">Responsive Visibility Control</Title>
        <Columns isGapless={false} isMultiline>
          <Column size="one-third">
            <Box
              displayMobile="block"
              displayTablet="none"
              displayDesktop="block"
              p="4"
              style={{ minWidth: '200px' }}
            >
              Mobile + Desktop Only
            </Box>
          </Column>
          <Column size="one-third">
            <Box
              displayMobile="none"
              displayTablet="block"
              displayDesktop="none"
              p="4"
              style={{ minWidth: '200px' }}
            >
              Tablet Only
            </Box>
          </Column>
          <Column size="one-third">
            <Box
              displayMobile="none"
              displayTablet="none"
              displayDesktop="block"
              bgColor="info"
              colorShade="00"
              p="4"
              style={{ minWidth: '200px' }}
            >
              Desktop+ Only
            </Box>
          </Column>
        </Columns>
      </Block>
    </Box>
  ),
  name: 'Viewport-Specific Display',
};

export const GenericDisplayViewport: Story = {
  render: () => (
    <Box>
      <Title size="5">Generic Display + Viewport Settings</Title>
      <SubTitle size="6">
        Using the generic display + viewport prop pattern
      </SubTitle>

      <Block mb="5">
        <Notification color="info" isLight>
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
        </Notification>
      </Block>

      <Block mb="5">
        <Title size="6">Generic Pattern Examples</Title>

        <Block mb="4">
          <Tag color="primary">
            display=&quot;block&quot; viewport=&quot;tablet&quot;
          </Tag>
          <Box
            display="block"
            viewport="tablet"
            p="4"
            style={{
              background: '#fff8e1',
              border: '2px solid #ffc107',
              marginTop: '0.5rem',
            }}
          >
            Block display on tablet and larger (one combination only)
          </Box>
        </Block>

        <Block mb="4">
          <Tag color="primary">
            display=&quot;flex&quot; viewport=&quot;desktop&quot;
          </Tag>
          <Box
            display="flex"
            viewport="desktop"
            p="4"
            style={{
              background: '#f3e5f5',
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
        </Block>

        <Block mb="4">
          <Tag color="primary">
            display=&quot;none&quot; viewport=&quot;mobile&quot;
          </Tag>
          <Box
            display="none"
            viewport="mobile"
            bgColor="danger"
            colorShade="05"
            p="4"
            style={{
              border: '2px solid #f44336',
              marginTop: '0.5rem',
            }}
          >
            Hidden on mobile (one combination only)
          </Box>
        </Block>
      </Block>

      <Block mb="5">
        <Title size="6">Limitation: Cannot Mix Multiple Viewports</Title>
        <Notification color="warning" isLight>
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
        </Notification>
      </Block>

      <Block mb="5">
        <Title size="6">Viewport-Specific Properties Override Generic</Title>
        <p className="help">
          When both patterns are used, viewport-specific props take precedence
        </p>

        <Box
          display="block"
          viewport="mobile"
          displayMobile="flex"
          displayDesktop="inline-flex"
          bgColor="success"
          colorShade="05"
          p="4"
          style={{
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
      </Block>
    </Box>
  ),
  name: 'Generic Display + Viewport',
};

export const FlexboxWithViewports: Story = {
  render: () => (
    <Box>
      <Title size="5">Flexbox with Viewport-Specific Display</Title>
      <SubTitle size="6">
        Flexbox properties work when any viewport has flex display
      </SubTitle>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">Responsive Flex Direction</h4>
        <Columns
          displayMobile="flex"
          displayDesktop="flex"
          flexDirection="column-reverse"
          bgColor="info"
          colorShade="00"
          p="4"
          isGapless={false}
        >
          <Column>
            <Block bgColor="info" colorShade="10" p="2" style={{ order: 1 }}>
              Item 1 (flex-direction: column-reverse)
            </Block>
          </Column>
          <Column>
            <Block bgColor="info" colorShade="20" p="2" style={{ order: 2 }}>
              Item 2
            </Block>
          </Column>
          <Column>
            <Block bgColor="info" colorShade="30" p="2" style={{ order: 3 }}>
              Item 3
            </Block>
          </Column>
        </Columns>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">Justify Content & Align Items</h4>
        <Columns
          displayTablet="flex"
          justifyContent="space-between"
          alignItems="center"
          p="4"
          style={{ minHeight: '100px' }}
        >
          <Column isNarrow>
            <Block p="2">Start</Block>
          </Column>
          <Column isNarrow>
            <Block p="2">Center</Block>
          </Column>
          <Column isNarrow>
            <Block p="2">End</Block>
          </Column>
        </Columns>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">Flex Grow & Shrink</h4>
        <Columns
          displayDesktop="flex"
          bgColor="success"
          colorShade="05"
          p="4"
          isGapless={false}
        >
          <Column isNarrow>
            <Box
              flexGrow="0"
              flexShrink="0"
              bgColor="success"
              colorShade="10"
              p="2"
              style={{ minWidth: '150px' }}
            >
              Fixed Width (grow: 0, shrink: 0)
            </Box>
          </Column>
          <Column>
            <Box flexGrow="1" bgColor="success" colorShade="20" p="2">
              Flexible (grow: 1)
            </Box>
          </Column>
          <Column>
            <Box flexGrow="2" bgColor="success" colorShade="30" p="2">
              More Flexible (grow: 2)
            </Box>
          </Column>
        </Columns>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">Flex Wrap</h4>
        <Columns
          displayMobile="flex"
          flexWrap="wrap"
          justifyContent="center"
          p="4"
          isMultiline
          isGapless={false}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <Column key={i} size="one-quarter">
              <Block
                bgColor="warning"
                p="2"
                textAlign="centered"
                style={{ minWidth: '120px' }}
              >
                Item {i + 1}
              </Block>
            </Column>
          ))}
        </Columns>
      </div>
    </Box>
  ),
  name: 'Flexbox with Viewports',
};

export const ComplexResponsiveLayout: Story = {
  render: () => (
    <Box>
      <Title size="5">Complex Responsive Layout Example</Title>
      <SubTitle size="6">
        Real-world responsive layout using viewport-specific display
      </SubTitle>

      {/* Header */}
      <Box
        displayMobile="block"
        displayTablet="flex"
        justifyContent="space-between"
        alignItems="center"
        bgColor="info"
        textColor="white"
        p="4"
        mb="4"
      >
        <Block textWeight="bold" textSize="4">
          Logo
        </Block>
        <Columns displayMobile="none" displayTablet="flex" isGapless={false}>
          <Column isNarrow>
            <a href="#" style={{ color: 'white', textDecoration: 'none' }}>
              Home
            </a>
          </Column>
          <Column isNarrow>
            <a href="#" style={{ color: 'white', textDecoration: 'none' }}>
              About
            </a>
          </Column>
          <Column isNarrow>
            <a href="#" style={{ color: 'white', textDecoration: 'none' }}>
              Contact
            </a>
          </Column>
        </Columns>
      </Box>

      {/* Main Content Area */}
      <Columns
        displayMobile="block"
        displayDesktop="flex"
        mb="4"
        isGapless={false}
      >
        {/* Sidebar */}
        <Column size="one-quarter">
          <Box bgColor="grey-lighter" p="4" mb="4">
            <Title size="6" style={{ margin: '0 0 1rem 0' }}>
              Sidebar
            </Title>
            <Content>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                <li style={{ marginBottom: '0.5rem' }}>Navigation Item 1</li>
                <li style={{ marginBottom: '0.5rem' }}>Navigation Item 2</li>
                <li style={{ marginBottom: '0.5rem' }}>Navigation Item 3</li>
              </ul>
            </Content>
          </Box>
        </Column>

        {/* Main Content */}
        <Column>
          <Title size="6" style={{ margin: '0 0 1rem 0' }}>
            Main Content
          </Title>

          {/* Card Grid */}
          <Columns
            displayMobile="block"
            displayTablet="flex"
            isMultiline
            isGapless={false}
          >
            {Array.from({ length: 6 }, (_, i) => (
              <Column key={i} size="half" sizeMobile="full">
                <Box
                  bgColor="white"
                  p="4"
                  mb="4"
                  style={{
                    minWidth: '280px',
                  }}
                >
                  <Title size="6" style={{ margin: '0 0 0.5rem 0' }}>
                    Card {i + 1}
                  </Title>
                  <Content style={{ margin: 0, color: '#666' }}>
                    This card adapts its layout based on screen size.
                  </Content>
                </Box>
              </Column>
            ))}
          </Columns>
        </Column>
      </Columns>

      {/* Footer */}
      <Box
        displayMobile="block"
        displayTablet="flex"
        justifyContent="center"
        bgColor="black-ter"
        textColor="white"
        p="4"
        textAlign="centered"
      >
        <Block>© 2025 Responsive Layout Demo</Block>
      </Box>
    </Box>
  ),
  name: 'Complex Responsive Layout',
};

export const Float: Story = {
  render: () => (
    <Box>
      <Title size="5">Float Helpers</Title>
      <SubTitle size="6">
        Using is-pulled-left and is-pulled-right classes
      </SubTitle>

      <div style={{ marginBottom: '2rem' }}>
        <Title size="6">Basic Float Examples</Title>
        <Box p="4" bgColor="grey-lighter">
          <Button float="left" color="primary" style={{ marginRight: '1rem' }}>
            Floated Left
          </Button>
          <Button float="right" color="danger">
            Floated Right
          </Button>
          <p style={{ textAlign: 'center', paddingTop: '3rem' }}>
            This text flows around the floated buttons above.
          </p>
        </Box>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <Title size="6">Image Float Example</Title>
        <Box p="4" bgColor="grey-lighter">
          <Image
            float="left"
            src="https://bulma.io/assets/images/placeholders/128x128.png"
            alt="Floated image"
            size="64x64"
            style={{ marginRight: '1rem', marginBottom: '1rem' }}
          />
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur.
          </p>
        </Box>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <Title size="6">Multiple Floated Elements</Title>
        <Box p="4" bgColor="grey-lighter">
          <Tag float="left" color="info" m="1">
            Left Tag 1
          </Tag>
          <Tag float="left" color="success" m="1">
            Left Tag 2
          </Tag>
          <Tag float="right" color="warning" m="1">
            Right Tag 1
          </Tag>
          <Tag float="right" color="danger" m="1">
            Right Tag 2
          </Tag>
          <p style={{ clear: 'both', paddingTop: '2rem' }}>
            This paragraph comes after all the floated tags. Without clearfix,
            the container might not properly contain the floated elements.
          </p>
        </Box>
      </div>
    </Box>
  ),
  name: 'Float Helpers',
};

export const ClearfixDemo: Story = {
  render: () => (
    <Box>
      <Title size="5">Clearfix Helper</Title>
      <p className="subtitle is-6">
        Demonstrating the importance of is-clearfix for floating children
      </p>

      <div style={{ marginBottom: '3rem' }}>
        <h4 className="title is-6">❌ Without Clearfix (Container Collapse)</h4>
        <p className="help">
          Notice how the container doesn&apos;t properly wrap around the floated
          content
        </p>
        <Box
          p="3"
          bgColor="danger"
          colorShade="05"
          mb="4"
          style={{
            border: '2px solid #f44336',
          }}
        >
          <Button float="left" color="primary">
            Left Button
          </Button>
          <Button float="right" color="danger">
            Right Button
          </Button>
          {/* No clearfix - container may collapse */}
        </Box>
        <p className="help">
          The red border shows the actual container boundary - it collapsed!
        </p>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h4 className="title is-6">✅ With Clearfix (Proper Container)</h4>
        <p className="help">
          The container properly contains its floating children
        </p>
        <Box
          clearfix
          p="3"
          bgColor="success"
          colorShade="05"
          mb="4"
          style={{
            border: '2px solid #4caf50',
          }}
        >
          <Button float="left" color="primary">
            Left Button
          </Button>
          <Button float="right" color="danger">
            Right Button
          </Button>
        </Box>
        <p className="help">
          The green border shows the container properly wraps the content!
        </p>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h4 className="title is-6">Real-World Example: Card with Float</h4>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <h5 className="title is-6">Without Clearfix</h5>
            <Box bgColor="white" p="4">
              <Image
                float="left"
                src="https://bulma.io/assets/images/placeholders/128x128.png"
                alt="Profile"
                size="64x64"
                style={{ marginRight: '1rem' }}
              />
              <div>
                <h6 className="title is-6" style={{ margin: '0 0 0.5rem 0' }}>
                  John Doe
                </h6>
                <Content textSize="7" style={{ margin: 0 }}>
                  Software Developer
                </Content>
              </div>
              {/* Footer may overlap with image */}
            </Box>
            <p className="help" style={{ color: '#f44336' }}>
              Footer might overlap with the floated image
            </p>
          </div>

          <div style={{ flex: 1 }}>
            <h5 className="title is-6">With Clearfix</h5>
            <Box clearfix bgColor="white" p="4">
              <Image
                float="left"
                src="https://bulma.io/assets/images/placeholders/128x128.png"
                alt="Profile"
                size="64x64"
                style={{ marginRight: '1rem' }}
              />
              <div>
                <h6 className="title is-6" style={{ margin: '0 0 0.5rem 0' }}>
                  John Doe
                </h6>
                <Content textSize="7" style={{ margin: 0 }}>
                  Software Developer
                </Content>
              </div>
            </Box>
            <p className="help" style={{ color: '#4caf50' }}>
              Footer respects the floated content
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">Clearfix with Other Helpers</h4>
        <Box
          clearfix
          p="4"
          relative
          bgColor="info"
          colorShade="05"
          mb="4"
          style={{
            border: '2px solid #2196f3',
          }}
        >
          <Tag float="left" color="info" m="1">
            Clearfix
          </Tag>
          <Tag float="right" color="primary" m="1">
            Position Relative
          </Tag>
          <div
            className="is-size-7"
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(255, 193, 7, 0.8)',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
            }}
          >
            Absolutely positioned
          </div>
        </Box>
        <p className="help">
          Combined clearfix and relative positioning working together
        </p>
      </div>
    </Box>
  ),
  name: 'Clearfix Demo',
};

export const RelativePosition: Story = {
  render: () => (
    <Box>
      <Title size="5">Relative Position Helper</Title>
      <p className="subtitle is-6">
        Using is-relative for positioned elements and overlays
      </p>

      <div style={{ marginBottom: '3rem' }}>
        <h4 className="title is-6">Basic Relative Positioning</h4>
        <Box
          relative
          p="4"
          bgColor="grey-lighter"
          style={{
            border: '2px solid #333',
            height: '150px',
          }}
        >
          <span>This container has position: relative</span>
          <Box
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: '#ff5722',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
            }}
          >
            Absolutely positioned child
          </Box>
        </Box>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h4 className="title is-6">Card with Badge Overlay</h4>
        <Box
          relative
          bgColor="white"
          style={{
            borderRadius: '8px',
            padding: '1.5rem',
            maxWidth: '300px',
          }}
        >
          <h5 className="title is-5" style={{ margin: '0 0 1rem 0' }}>
            Product Card
          </h5>
          <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
            This is a sample product description that shows how relative
            positioning helps with overlays.
          </p>
          <Button color="primary">Add to Cart</Button>

          {/* Badge overlay */}
          <Tag
            color="danger"
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              transform: 'rotate(12deg)',
            }}
          >
            NEW!
          </Tag>
        </Box>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h4 className="title is-6">Image with Caption Overlay</h4>
        <Box
          relative
          style={{
            display: 'inline-block',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <Image
            src="https://bulma.io/assets/images/placeholders/256x256.png"
            alt="Sample"
            size="128x128"
          />
          <Box
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '1rem',
            }}
          >
            <h6
              className="title is-6"
              style={{ color: 'white', margin: '0 0 0.5rem 0' }}
            >
              Image Caption
            </h6>
            <p className="is-size-7" style={{ margin: 0 }}>
              Overlay caption using relative positioning
            </p>
          </Box>
        </Box>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 className="title is-6">Combined with Other Helpers</h4>
        <Box
          relative
          clearfix
          p="4"
          bgColor="success"
          colorShade="05"
          style={{
            border: '2px solid #4caf50',
            minHeight: '120px',
          }}
        >
          <Button float="left" color="success">
            Floated Button
          </Button>
          <Button float="right" color="info">
            Another Float
          </Button>

          {/* Absolutely positioned notification */}
          <Notification
            color="warning"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              margin: 0,
              maxWidth: '200px',
            }}
          >
            Centered notification
          </Notification>
        </Box>
        <p className="help">
          Combining relative positioning with clearfix and float helpers
        </p>
      </div>
    </Box>
  ),
  name: 'Relative Position',
};

// --- Viewport-Specific Properties Stories ---

export const ViewportSpecificTextSizes: Story = {
  render: () => (
    <Box>
      <Title size="5">Viewport-Specific Text Sizes</Title>
      <SubTitle size="6">
        Different text sizes for each viewport - resize your browser to see the
        effect
      </SubTitle>

      <Block
        textSizeMobile="7" // Small on mobile
        textSizeTablet="5" // Medium on tablet
        textSizeDesktop="3" // Large on desktop
        textSizeWidescreen="2" // Larger on widescreen
        textSizeFullhd="1" // Largest on fullhd
        textWeight="bold"
        p="4"
        mb="4"
        style={{ border: '2px solid #ccc' }}
      >
        This text size changes based on viewport: small on mobile, progressively
        larger on bigger screens.
      </Block>

      <Content>
        <strong>Generated classes:</strong>
        <code>
          {' '}
          is-size-7-mobile is-size-5-tablet is-size-3-desktop
          is-size-2-widescreen is-size-1-fullhd
        </code>
      </Content>
    </Box>
  ),
  name: 'Viewport-Specific Text Sizes',
};

export const ViewportSpecificTextAlignment: Story = {
  render: () => (
    <Box>
      <Title size="5">Viewport-Specific Text Alignment</Title>
      <SubTitle size="6">
        Different text alignment for each viewport - resize your browser to see
        the effect
      </SubTitle>

      <Block
        textAlignMobile="centered" // Center on mobile
        textAlignTablet="left" // Left on tablet
        textAlignDesktop="right" // Right on desktop
        textAlignWidescreen="justified" // Justify on widescreen
        textAlignFullhd="centered" // Center on fullhd
        textSize="4"
        p="4"
        mb="4"
        style={{ border: '2px solid #ccc' }}
      >
        This text alignment changes based on viewport: centered on mobile, left
        on tablet, right on desktop, justified on widescreen, centered again on
        fullhd. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
        eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </Block>

      <Content>
        <strong>Generated classes:</strong>
        <code>
          {' '}
          has-text-centered-mobile has-text-left-tablet has-text-right-desktop
          has-text-justified-widescreen has-text-centered-fullhd
        </code>
      </Content>
    </Box>
  ),
  name: 'Viewport-Specific Text Alignment',
};

export const ViewportSpecificVisibility: Story = {
  render: () => (
    <Box>
      <Title size="5">Viewport-Specific Visibility</Title>
      <SubTitle size="6">
        Different visibility for each viewport - resize your browser to see the
        effect
      </SubTitle>

      <Block
        visibilityMobile="hidden" // Hidden on mobile
        visibilityTablet="sr-only" // Screen reader only on tablet
        visibilityDesktop="invisible" // Invisible on desktop
        visibilityWidescreen="hidden" // Hidden on widescreen
        // Visible by default on fullhd
        textSize="4"
        textWeight="bold"
        p="4"
        mb="4"
        style={{ border: '2px solid #ccc' }}
      >
        This block visibility changes: hidden on mobile, screen-reader-only on
        tablet, invisible on desktop, hidden on widescreen, visible on fullhd.
      </Block>

      <Content>
        <strong>Generated classes:</strong>
        <code>
          {' '}
          is-hidden-mobile is-sr-only-tablet is-invisible-desktop
          is-hidden-widescreen
        </code>
      </Content>

      <Block
        visibilityMobile="invisible"
        visibilityTablet="invisible"
        visibilityDesktop="invisible"
        textSize="3"
        p="3"
        mb="4"
        color="warning"
        style={{ border: '2px solid orange' }}
      >
        This block is invisible on mobile, tablet, and desktop (but takes up
        space). Only visible on widescreen and fullhd.
      </Block>

      <Content>
        <strong>
          Example showing difference between hidden and invisible:
        </strong>
        <ul>
          <li>
            <strong>hidden:</strong> Element is not visible and doesn&apos;t
            take up space
          </li>
          <li>
            <strong>invisible:</strong> Element is not visible but still takes
            up space
          </li>
          <li>
            <strong>sr-only:</strong> Only visible to screen readers
          </li>
        </ul>
      </Content>
    </Box>
  ),
  name: 'Viewport-Specific Visibility',
};

export const ViewportSpecificCombined: Story = {
  render: () => (
    <Box>
      <Title size="5">Combined Viewport-Specific Properties</Title>
      <SubTitle size="6">
        Multiple viewport-specific properties working together
      </SubTitle>

      <Block
        // Regular properties (apply to all viewports)
        bgColor="light"
        p="4"
        m="2"
        // Viewport-specific properties
        textSizeMobile="6"
        textSizeDesktop="4"
        textAlignMobile="centered"
        textAlignDesktop="left"
        mb="4"
        style={{ border: '2px solid #ccc' }}
      >
        This box combines regular properties (background, padding, margin) with
        viewport-specific properties (text size and alignment).
      </Block>

      <Content>
        <strong>Generated classes:</strong>
        <code>
          {' '}
          has-background-light p-4 m-2 is-size-6-mobile is-size-4-desktop
          has-text-centered-mobile has-text-left-desktop
        </code>
      </Content>
    </Box>
  ),
  name: 'Combined Viewport-Specific Properties',
};

export const ViewportComparison: Story = {
  render: () => (
    <Box>
      <Title size="5">Comparison: Before vs After</Title>

      <Block mb="5">
        <Title size="6">Before (Global Viewport Property):</Title>
        <Content>
          <pre>{`// You had to choose ONE value for ALL viewports
const { bulmaHelperClasses } = useBulmaClasses({
  color: 'primary',
  textAlign: 'centered',
  viewport: 'mobile' // Applies to ALL properties
});
// Result: has-text-primary-mobile has-text-centered-mobile`}</pre>
        </Content>

        <Block
          color="primary"
          textAlign="centered"
          viewport="mobile"
          textSize="4"
          p="4"
          style={{ border: '2px solid #ccc' }}
        >
          This uses the old global viewport approach - all properties get the
          same viewport modifier.
        </Block>
      </Block>

      <Block>
        <Title size="6">After (Viewport-Specific Properties):</Title>
        <Content>
          <pre>{`// You can specify DIFFERENT values for EACH viewport
const { bulmaHelperClasses } = useBulmaClasses({
  textSizeMobile: '6',
  textSizeTablet: '4', 
  textSizeDesktop: '2',
  textAlignMobile: 'centered',
  textAlignDesktop: 'left'
});
// Result: is-size-6-mobile is-size-4-tablet 
//         is-size-2-desktop has-text-centered-mobile 
//         has-text-left-desktop`}</pre>
        </Content>

        <Block
          textSizeMobile="6"
          textSizeTablet="4"
          textSizeDesktop="2"
          textAlignMobile="centered"
          textAlignDesktop="left"
          p="4"
          style={{ border: '2px solid #ccc' }}
        >
          This uses the new viewport-specific properties - each viewport can
          have different values for text size and alignment.
        </Block>
      </Block>
    </Box>
  ),
  name: 'Viewport Property Comparison',
};

export const FlexItemProperties: Story = {
  render: () => (
    <Box>
      <Title size="5">Flex Item Properties</Title>
      <SubTitle size="6">
        Properties that apply to flex items (children of flex containers)
      </SubTitle>

      <Block mb="5">
        <Title size="6">Align Self on Buttons</Title>
        <Content mb="3">
          <strong>Important:</strong> The buttons below don&apos;t need{' '}
          <code>display=&quot;flex&quot;</code> themselves - they just need to
          be children of a flex container to use <code>alignSelf</code>.
        </Content>
        <Box
          display="flex"
          alignItems="flex-start"
          bgColor="light"
          p="4"
          style={{ minHeight: '150px' }}
        >
          <Button color="primary" alignSelf="flex-start" mr="2">
            Align Self: Start
          </Button>
          <Button color="info" alignSelf="center" mr="2">
            Align Self: Center
          </Button>
          <Button color="success" alignSelf="flex-end" mr="2">
            Align Self: End
          </Button>
          <Button color="warning" alignSelf="stretch">
            Align Self: Stretch
          </Button>
        </Box>
      </Block>

      <Block mb="5">
        <Title size="6">Flex Grow & Shrink on Items</Title>
        <Content mb="3">
          These boxes use <code>flexGrow</code> and <code>flexShrink</code>{' '}
          without needing <code>display=&quot;flex&quot;</code> on themselves.
        </Content>
        <Box display="flex" bgColor="light" p="4">
          <Box
            bgColor="primary"
            textColor="white"
            p="3"
            mr="2"
            flexGrow="0"
            flexShrink="0"
            textAlign="centered"
          >
            No grow/shrink
          </Box>
          <Box
            bgColor="info"
            textColor="white"
            p="3"
            mr="2"
            flexGrow="1"
            flexShrink="1"
            textAlign="centered"
          >
            Grow: 1, Shrink: 1
          </Box>
          <Box
            bgColor="success"
            textColor="white"
            p="3"
            flexGrow="2"
            flexShrink="0"
            textAlign="centered"
          >
            Grow: 2, No shrink
          </Box>
        </Box>
      </Block>

      <Block>
        <Title size="6">Mixed Container and Item Properties</Title>
        <Content mb="3">
          The outer box has flex container properties, while inner items have
          flex item properties.
        </Content>
        <Box
          display="flex"
          justifyContent="space-around"
          alignItems="stretch"
          bgColor="grey-lighter"
          p="4"
          style={{ minHeight: '120px' }}
        >
          <Box
            bgColor="danger"
            textColor="white"
            p="2"
            alignSelf="flex-start"
            flexGrow="0"
            textAlign="centered"
          >
            alignSelf: start
            <br />
            flexGrow: 0
          </Box>
          <Box
            bgColor="warning"
            textColor="white"
            p="2"
            alignSelf="center"
            flexGrow="1"
            textAlign="centered"
          >
            alignSelf: center
            <br />
            flexGrow: 1
          </Box>
          <Box
            bgColor="success"
            textColor="white"
            p="2"
            alignSelf="flex-end"
            flexShrink="0"
            textAlign="centered"
          >
            alignSelf: end
            <br />
            flexShrink: 0
          </Box>
        </Box>
      </Block>
    </Box>
  ),
  name: 'Flex Item Properties',
};
