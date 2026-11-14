// src/helpers/useBulmaClasses.stories.tsx
import React, { useEffect, useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import { useBulmaClasses, BulmaClassesProps } from './useBulmaClasses';
import { validGaps } from './bulmaClassHelpers';

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
import { Input } from '../form/Input';
import { TextArea } from '../form/TextArea';
import Content from '../elements/Content';
import { Box } from '../elements/Box';
import { Block } from '../elements/Block';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';
import { Message } from '../components/Message';
import { Link } from '../elements/Link';
import { Paragraph } from '../elements/Paragraph';

// One look for the demo boxes in the layout stories, readable on both color
// schemes. A stage, the area a demo lays its items out in, is a scheme
// surface a step off the box around it, so it and its text follow the scheme.
// An item is a primary fill with the text color Bulma pairs with primary.
// Items set their margin to 0, so a Box's bottom margin doesn't shift them,
// and stages space them with `gap` or margin helpers.
const STAGE = { bgColor: 'scheme-main-ter', hasShadow: false } as const;
const ITEM = {
  bgColor: 'primary',
  textColor: 'primary',
  colorShade: 'invert',
  hasShadow: false,
  m: '0',
  p: '3',
} as const;
// A stage that is flex on some viewports only is a plain block on the
// others, where `gap` does nothing. Its items keep a bottom margin, so they
// stay apart when they stack, and the stage takes that much off its bottom
// padding, so it looks the same in a row. `columnGap` spaces them in a row.
const SWITCHING_STAGE = { ...STAGE, columnGap: '1', pb: '3' } as const;
const SWITCHING_ITEM = { ...ITEM, mb: '2' } as const;

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
        'white-bis',
        'white-ter',
        'inherit',
        'current',
      ],
    },
    m: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
    },
    textAlign: {
      control: 'select',
      options: ['centered', 'justified', 'left', 'right'],
    },
    viewport: {
      control: 'select',
      options: [
        'mobile',
        'tablet',
        'tablet-only',
        'touch',
        'desktop',
        'desktop-only',
        'widescreen',
        'widescreen-only',
        'fullhd',
      ],
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
      description:
        'Apply the is-relative class for position: relative (pos wins when both are set)',
    },
    pos: {
      control: 'select',
      options: ['absolute', 'fixed', 'relative', 'static', 'sticky'],
      description: 'CSS position (is-position-<value>)',
    },
    overflow: {
      control: 'select',
      options: ['clipped', 'auto', 'clip', 'hidden', 'scroll', 'visible'],
      description: 'Overflow on both axes (is-clipped, is-overflow-<value>)',
    },
    radius: {
      control: 'select',
      options: ['radiusless', 'small', 'normal', 'large', 'rounded'],
      description: 'Border radius (is-radiusless, has-radius-<value>)',
    },
    aspectRatio: {
      control: 'select',
      options: [
        '1by1',
        '5by4',
        '4by3',
        '3by2',
        '5by3',
        '16by9',
        '2by1',
        '3by1',
        '4by5',
        '3by4',
        '2by3',
        '3by5',
        '9by16',
        '1by2',
        '1by3',
      ],
      description: 'Width-to-height ratio (is-aspect-ratio-<value>)',
    },
    float: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Float direction (is-pulled-left/is-pulled-right)',
    },
    gap: {
      control: 'select',
      options: validGaps,
      description:
        'Space between flex or grid children (is-gap-<step>), 0.5rem per step',
    },
    columnGap: {
      control: 'select',
      options: validGaps,
      description: 'Space between columns only (is-column-gap-<step>)',
    },
    rowGap: {
      control: 'select',
      options: validGaps,
      description: 'Space between rows only (is-row-gap-<step>)',
    },
    gapless: {
      control: 'boolean',
      description: 'Remove the gap between children (is-gapless)',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'These stories demonstrate the Bulma helper props provided by useBulmaClasses. Container components such as Box and Notification already come with Bulma’s standard pleasant padding and block spacing, so the examples only add margin or padding props where spacing itself is being demonstrated.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof UseBulmaClassesDemo>;

export const Default: Story = {
  args: {
    color: 'primary',
    m: '2',
    textAlign: 'centered',
  },
};

export const CustomStyles: Story = {
  args: {
    color: 'success',
    m: '3',
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
};

// A colored background takes the text color Bulma pairs with that color
// (`colorShade="invert"`), so it reads on both schemes. A scheme background
// follows the scheme, and so does the box's own text.
export const BackgroundColors: Story = {
  render: () => (
    <Columns isMultiline>
      {(
        [
          ['primary', 'Primary'],
          ['link', 'Link'],
          ['info', 'Info'],
          ['success', 'Success'],
          ['warning', 'Warning'],
          ['danger', 'Danger'],
          ['black', 'Black'],
          ['white', 'White'],
        ] as const
      ).map(([color, label]) => (
        <Column key={color} size="one-quarter">
          <Box bgColor={color} textColor={color} colorShade="invert">
            {label}
          </Box>
        </Column>
      ))}
      <Column size="one-quarter">
        <Box bgColor="scheme-main">Scheme Main (dark-mode adaptive)</Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="scheme-main-bis">
          Scheme Main Bis (dark-mode adaptive)
        </Box>
      </Column>
      <Column size="one-quarter">
        <Box bgColor="scheme-main-ter">
          Scheme Main Ter (dark-mode adaptive)
        </Box>
      </Column>
      <Column size="one-quarter">
        <Box data-theme="light" bgColor="scheme-invert" textColor="white">
          Scheme Invert (mode pinned, paired text)
        </Box>
      </Column>
    </Columns>
  ),
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
};

// A shade's number tracks its lightness, so a dark shade takes a light text
// shade and a light one a dark text shade. A middle shade can need either,
// depending on the hue, so these stay near the ends. None of them change with
// the scheme.
export const BackgroundColorShades: Story = {
  render: () => (
    <Columns isMultiline>
      <Column size="one-quarter">
        <Box
          bgColor="primary"
          backgroundColorShade="10"
          textColor="primary"
          colorShade="90"
        >
          Background Primary 10
        </Box>
      </Column>
      <Column size="one-quarter">
        <Box
          bgColor="primary"
          backgroundColorShade="20"
          textColor="primary"
          colorShade="90"
        >
          Background Primary 20
        </Box>
      </Column>
      <Column size="one-quarter">
        <Box
          bgColor="primary"
          backgroundColorShade="60"
          textColor="primary"
          colorShade="10"
        >
          Background Primary 60
        </Box>
      </Column>
      <Column size="one-quarter">
        <Box
          bgColor="primary"
          backgroundColorShade="90"
          textColor="primary"
          colorShade="10"
        >
          Background Primary 90
        </Box>
      </Column>
      <Column size="one-quarter">
        <Box
          bgColor="primary"
          backgroundColorShade="invert"
          textColor="primary"
        >
          Background Primary Invert
        </Box>
      </Column>
    </Columns>
  ),
};

// `light` and `dark` are fixed shades, while `soft` and `bold` follow the
// scheme: `bold` is the one far from the page background and `soft` the one
// near it, so a bold background with soft text reads on both schemes.
export const CombinedColorShades: Story = {
  render: () => (
    <Columns isMultiline>
      <Column size="half">
        <Box
          bgColor="primary"
          backgroundColorShade="10"
          textColor="primary"
          colorShade="80"
        >
          Dark background (10) with light text (80)
        </Box>
      </Column>
      <Column size="half">
        <Box
          bgColor="info"
          backgroundColorShade="75"
          textColor="info"
          colorShade="05"
        >
          Light background (75) with dark text (05)
        </Box>
      </Column>
      <Column size="half">
        <Box
          bgColor="success"
          backgroundColorShade="light"
          textColor="success"
          colorShade="dark"
        >
          Light success background with dark success text
        </Box>
      </Column>
      <Column size="half">
        <Box
          bgColor="warning"
          backgroundColorShade="bold"
          textColor="warning"
          colorShade="soft"
        >
          Bold warning background with soft warning text
        </Box>
      </Column>
    </Columns>
  ),
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
};

// The gap helpers set CSS `gap`, so they space the children of a flex or
// grid container and do nothing on an element laid out any other way.
export const Gap: Story = {
  render: () => (
    <>
      <Block display="flex" flexWrap="wrap" gap="2">
        <Tag color="primary">gap=&quot;2&quot;</Tag>
        <Tag color="primary">puts 1rem</Tag>
        <Tag color="primary">between children</Tag>
      </Block>
      <Block display="flex" flexDirection="column" gap="0.5">
        <Tag color="info">A column with gap=&quot;0.5&quot;</Tag>
        <Tag color="info">half steps sit between</Tag>
        <Tag color="info">the whole ones</Tag>
      </Block>
      <Block display="flex" flexWrap="wrap" columnGap="4" rowGap="1">
        {Array.from({ length: 12 }, (_, i) => (
          <Tag key={i} color="success">
            columnGap=&quot;4&quot; rowGap=&quot;1&quot;
          </Tag>
        ))}
      </Block>
      <Buttons gapless>
        <Button>gapless</Button>
        <Button>removes</Button>
        <Button>the gap</Button>
      </Buttons>
    </>
  ),
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
};

export const TextAlign: Story = {
  render: () => (
    <>
      <Box textAlign="centered">Centered text</Box>
      <Box textAlign="right">Right aligned text</Box>
      <Box textAlign="left">Left aligned text</Box>
    </>
  ),
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
};

export const Overflow: Story = {
  render: () => (
    <>
      <Box overflow="clipped" style={{ width: 200, height: 50 }}>
        This is a very long line of text that will be clipped and not overflow
        the box.
      </Box>
      {/* A scrolling region takes focus so a keyboard can scroll it. */}
      <Box
        aspectRatio="3by1"
        overflowY="auto"
        tabIndex={0}
        role="region"
        aria-label="Scrolling list"
      >
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i}>
            Line {i + 1}: the aspect ratio bounds the height and overflowY
            scrolls the rest.
          </p>
        ))}
      </Box>
    </>
  ),
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
};

export const Interaction: Story = {
  render: () => (
    <>
      <Box interaction="unselectable">This text cannot be selected.</Box>
      <Box interaction="clickable">This box is clickable.</Box>
    </>
  ),
};

export const Cursor: Story = {
  render: () => (
    <>
      <Box cursor="pointer">Cursor: pointer (uses is-clickable)</Box>
      <Box cursor="help">Cursor: help</Box>
    </>
  ),
};

export const Radius: Story = {
  render: () => (
    <Buttons>
      <Button radius="radiusless">Radiusless</Button>
      <Button>Default</Button>
      <Button radius="small">Small</Button>
      <Button radius="normal">Normal</Button>
      <Button radius="large">Large</Button>
      <Button radius="rounded">Rounded</Button>
    </Buttons>
  ),
};

export const AspectRatio: Story = {
  render: () => (
    <Columns>
      {(['1by1', '4by3', '16by9', '3by1'] as const).map(ratio => (
        <Column key={ratio}>
          <Notification color="info" aspectRatio={ratio}>
            {ratio}
          </Notification>
        </Column>
      ))}
    </Columns>
  ),
};

export const Position: Story = {
  render: () => (
    <Box
      aspectRatio="3by1"
      overflowY="auto"
      p="0"
      tabIndex={0}
      role="region"
      aria-label="Rows under a sticky header"
    >
      {/* The position helpers set position only; sticky needs its offset. */}
      <Notification color="primary" pos="sticky" mb="0" style={{ top: 0 }}>
        pos=&quot;sticky&quot; keeps this header in view
      </Notification>
      {Array.from({ length: 20 }, (_, i) => (
        <p key={i} className="px-4">
          Row {i + 1}
        </p>
      ))}
    </Box>
  ),
};

export const Shadowless: Story = {
  render: () => <Box shadow="shadowless">This box has no shadow.</Box>,
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
      <Block>
        <Tag color="info">display=&quot;block&quot;</Tag>
        <Box {...STAGE} mt="2">
          <Box {...ITEM} display="block">
            Block display (takes full width)
          </Box>
        </Box>
      </Block>

      <Block>
        <Tag color="info">display=&quot;inline&quot;</Tag>
        <Box {...STAGE} mt="2">
          <Box {...ITEM} display="inline" mr="2">
            Inline display
          </Box>
          <Box {...ITEM} display="inline">
            Another inline
          </Box>
        </Box>
      </Block>

      <Block>
        <Tag color="info">display=&quot;inline-block&quot;</Tag>
        <Box {...STAGE} mt="2">
          <Box {...ITEM} display="inline-block" mr="2">
            Inline-block 1
          </Box>
          <Box {...ITEM} display="inline-block">
            Inline-block 2
          </Box>
        </Box>
      </Block>

      <Block>
        <Tag color="info">display=&quot;flex&quot;</Tag>
        <Box {...STAGE} display="flex" gap="1" mt="2">
          <Box {...ITEM} flexGrow="1">
            Flex item 1
          </Box>
          <Box {...ITEM} flexGrow="1">
            Flex item 2
          </Box>
        </Box>
      </Block>

      <Block>
        <Tag color="info">display=&quot;inline-flex&quot;</Tag>
        <Block mt="2">
          <Box {...STAGE} display="inline-flex" gap="1" mr="2">
            <Box {...ITEM}>Item 1</Box>
            <Box {...ITEM}>Item 2</Box>
          </Box>
          <Box {...STAGE} display="inline-flex" gap="1">
            <Box {...ITEM}>Item 3</Box>
            <Box {...ITEM}>Item 4</Box>
          </Box>
        </Block>
      </Block>
    </Box>
  ),
};

export const ViewportSpecificDisplay: Story = {
  render: () => (
    <Box>
      <Title size="5">Viewport-Specific Display</Title>
      <SubTitle size="6">Resize your browser to see the effect</SubTitle>

      <Block>
        <Title size="6">Mobile Hidden, Tablet+ Visible</Title>
        <Box {...STAGE}>
          <Box {...ITEM} displayMobile="none" displayTablet="block">
            This box is hidden on mobile (display: none) but visible as block on
            tablet and larger screens.
          </Box>
        </Box>
      </Block>

      <Block>
        <Title size="6">Progressive Display Changes</Title>
        <Box {...STAGE}>
          <Columns
            displayMobile="block"
            displayTablet="block"
            displayDesktop="flex"
            isGapless={false}
          >
            <Column>
              <Box {...ITEM}>Mobile and tablet: block | Desktop+: flex</Box>
            </Column>
            <Column>
              <Box {...ITEM}>Item 2 (side by side in the flex layout)</Box>
            </Column>
          </Columns>
        </Box>
      </Block>

      <Block>
        <Title size="6">Desktop Only Flex Layout</Title>
        <Box {...STAGE} mb="2">
          <Columns
            displayMobile="block"
            displayTablet="block"
            displayDesktop="flex"
            displayWidescreen="flex"
            displayFullhd="flex"
            isGapless={false}
          >
            <Column>
              <Box {...ITEM}>Card 1</Box>
            </Column>
            <Column>
              <Box {...ITEM}>Card 2</Box>
            </Column>
            <Column>
              <Box {...ITEM}>Card 3</Box>
            </Column>
          </Columns>
        </Box>
        <p className="help">
          Stacked on mobile/tablet, side-by-side on desktop+
        </p>
      </Block>

      <Block>
        <Title size="6">Responsive Visibility Control</Title>
        <Box {...STAGE}>
          {/* Bulma's `none` hides from its breakpoint up and outranks the
              display values, so a box hidden on one range takes that range's
              `-only` or touch prop. */}
          <Columns isGapless={false} isMultiline>
            <Column size="one-third">
              <Box {...ITEM} displayTabletOnly="none">
                Mobile + Desktop Only
              </Box>
            </Column>
            <Column size="one-third">
              <Box {...ITEM} displayMobile="none" displayDesktop="none">
                Tablet Only
              </Box>
            </Column>
            <Column size="one-third">
              <Box {...ITEM} displayTouch="none">
                Desktop+ Only
              </Box>
            </Column>
          </Columns>
        </Box>
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

      <Block>
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

      <Block>
        <Title size="6">Generic Pattern Examples</Title>

        <Block>
          <Tag color="primary">
            display=&quot;block&quot; viewport=&quot;tablet&quot;
          </Tag>
          <Box {...STAGE} mt="2">
            <Box {...ITEM} display="block" viewport="tablet">
              Block display on tablet and larger (one combination only)
            </Box>
          </Box>
        </Block>

        <Block>
          <Tag color="primary">
            display=&quot;flex&quot; viewport=&quot;desktop&quot;
          </Tag>
          <Box {...SWITCHING_STAGE} display="flex" viewport="desktop" mt="2">
            <Box {...SWITCHING_ITEM} flexGrow="1">
              Flex on desktop+
            </Box>
            <Box {...SWITCHING_ITEM} flexGrow="1">
              Generic pattern
            </Box>
          </Box>
        </Block>

        <Block>
          <Tag color="primary">
            display=&quot;none&quot; viewport=&quot;mobile&quot;
          </Tag>
          <Box {...STAGE} mt="2">
            <Box {...ITEM} display="none" viewport="mobile">
              Hidden on mobile (one combination only)
            </Box>
          </Box>
        </Block>
      </Block>

      <Block>
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

      <Block>
        <Title size="6">Viewport-Specific Properties Override Generic</Title>
        <p className="help">
          When both patterns are used, viewport-specific props take precedence
        </p>

        <Box
          {...SWITCHING_STAGE}
          display="block"
          viewport="mobile"
          displayMobile="flex"
          displayDesktop="inline-flex"
          mt="2"
        >
          <Box {...SWITCHING_ITEM} flexGrow="1">
            Generic: block-mobile | Override: flex-mobile, inline-flex-desktop
          </Box>
          <Box {...SWITCHING_ITEM} flexGrow="1">
            Viewport-specific wins!
          </Box>
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

      <Block>
        <h4 className="title is-6">Responsive Flex Direction</h4>
        <Box {...STAGE}>
          <Columns
            displayMobile="flex"
            displayDesktop="flex"
            flexDirection="column-reverse"
            isGapless={false}
          >
            <Column>
              <Box {...ITEM}>Item 1 (flex-direction: column-reverse)</Box>
            </Column>
            <Column>
              <Box {...ITEM}>Item 2</Box>
            </Column>
            <Column>
              <Box {...ITEM}>Item 3</Box>
            </Column>
          </Columns>
        </Box>
      </Block>

      <Block>
        <h4 className="title is-6">Justify Content & Align Items</h4>
        <Box
          {...STAGE}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          style={{ minHeight: '100px' }}
        >
          <Box {...ITEM}>Start</Box>
          <Box {...ITEM}>Center</Box>
          <Box {...ITEM}>End</Box>
        </Box>
      </Block>

      <Block>
        <h4 className="title is-6">Flex Grow & Shrink</h4>
        <Box {...SWITCHING_STAGE} displayDesktop="flex">
          <Box {...SWITCHING_ITEM} flexGrow="0" flexShrink="0">
            Fixed Width (grow: 0, shrink: 0)
          </Box>
          <Box {...SWITCHING_ITEM} flexGrow="1">
            Flexible (grow: 1)
          </Box>
          <Box {...SWITCHING_ITEM} flexGrow="2">
            More Flexible (grow: 2)
          </Box>
        </Box>
      </Block>

      <Block>
        <h4 className="title is-6">Flex Wrap</h4>
        <Box {...STAGE}>
          <Columns
            displayMobile="flex"
            flexWrap="wrap"
            justifyContent="center"
            isMultiline
            isGapless={false}
          >
            {Array.from({ length: 8 }, (_, i) => (
              <Column key={i} size="one-quarter">
                <Box {...ITEM} textAlign="centered">
                  Item {i + 1}
                </Box>
              </Column>
            ))}
          </Columns>
        </Box>
      </Block>
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
        {...ITEM}
        displayMobile="block"
        displayTablet="flex"
        justifyContent="space-between"
        alignItems="center"
        p="4"
        mb="5"
      >
        <Block textWeight="bold" textSize="4" mb="0">
          Logo
        </Block>
        <Block displayMobile="none" displayTablet="flex" gap="3" mb="0">
          <Link href="#" textColor="inherit">
            Home
          </Link>
          <Link href="#" textColor="inherit">
            About
          </Link>
          <Link href="#" textColor="inherit">
            Contact
          </Link>
        </Block>
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
          <Box {...STAGE}>
            <Title size="6" mb="3">
              Sidebar
            </Title>
            <Content>
              <ul>
                <li>Navigation Item 1</li>
                <li>Navigation Item 2</li>
                <li>Navigation Item 3</li>
              </ul>
            </Content>
          </Box>
        </Column>

        {/* Main Content */}
        <Column>
          <Title size="6" mb="3">
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
                <Box {...STAGE}>
                  <Title size="6" mb="2">
                    Card {i + 1}
                  </Title>
                  <Content>
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
        {...ITEM}
        displayMobile="block"
        displayTablet="flex"
        justifyContent="center"
        textAlign="centered"
        p="4"
      >
        <Block>© 2025 Responsive Layout Demo</Block>
      </Box>
    </Box>
  ),
};

export const Float: Story = {
  render: () => (
    <Box>
      <Title size="5">Float Helpers</Title>
      <SubTitle size="6">
        Using is-pulled-left and is-pulled-right classes
      </SubTitle>

      <Block>
        <Title size="6">Basic Float Examples</Title>
        <Box {...STAGE}>
          <Button float="left" color="primary" mr="3">
            Floated Left
          </Button>
          <Button float="right" color="danger">
            Floated Right
          </Button>
          <Paragraph textAlign="centered" pt="6">
            This text flows around the floated buttons above.
          </Paragraph>
        </Box>
      </Block>

      <Block>
        <Title size="6">Image Float Example</Title>
        <Box {...STAGE}>
          <Image
            float="left"
            src="https://bulma.io/assets/images/placeholders/128x128.png"
            alt="Floated image"
            size="64x64"
            mr="3"
            mb="3"
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
      </Block>

      <Block>
        <Title size="6">Multiple Floated Elements</Title>
        <Box {...STAGE}>
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
      </Block>
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

      <Block mb="6">
        <h4 className="title is-6">❌ Without Clearfix (Container Collapse)</h4>
        <p className="help">
          Notice how the container doesn&apos;t properly wrap around the floated
          content
        </p>
        <Box {...STAGE} mb="2">
          <Button float="left" color="primary">
            Left Button
          </Button>
          <Button float="right" color="danger">
            Right Button
          </Button>
          {/* No clearfix - container may collapse */}
        </Box>
        <p className="help">
          The container&apos;s background shows where it ends: it collapsed!
        </p>
      </Block>

      <Block mb="6">
        <h4 className="title is-6">✅ With Clearfix (Proper Container)</h4>
        <p className="help">
          The container properly contains its floating children
        </p>
        <Box {...STAGE} mb="2" clearfix>
          <Button float="left" color="primary">
            Left Button
          </Button>
          <Button float="right" color="danger">
            Right Button
          </Button>
        </Box>
        <p className="help">
          The container&apos;s background wraps the buttons it holds!
        </p>
      </Block>

      <Block mb="6">
        <h4 className="title is-6">Real-World Example: Card with Float</h4>
        <Columns>
          <Column>
            <h5 className="title is-6">Without Clearfix</h5>
            <Box {...STAGE} mb="2">
              <Image
                float="left"
                src="https://bulma.io/assets/images/placeholders/128x128.png"
                alt="Profile"
                size="64x64"
                mr="3"
              />
              <div>
                <h6 className="title is-6" style={{ margin: '0 0 0.5rem 0' }}>
                  John Doe
                </h6>
                <Content textSize="7">Software Developer</Content>
              </div>
              {/* Footer may overlap with image */}
            </Box>
            <p className="help is-danger">
              Footer might overlap with the floated image
            </p>
          </Column>

          <Column>
            <h5 className="title is-6">With Clearfix</h5>
            <Box {...STAGE} mb="2" clearfix>
              <Image
                float="left"
                src="https://bulma.io/assets/images/placeholders/128x128.png"
                alt="Profile"
                size="64x64"
                mr="3"
              />
              <div>
                <h6 className="title is-6" style={{ margin: '0 0 0.5rem 0' }}>
                  John Doe
                </h6>
                <Content textSize="7">Software Developer</Content>
              </div>
            </Box>
            <p className="help is-success">
              Footer respects the floated content
            </p>
          </Column>
        </Columns>
      </Block>

      <Block>
        <h4 className="title is-6">Clearfix with Other Helpers</h4>
        <Box {...STAGE} mb="2" clearfix relative>
          <Tag float="left" color="info" m="1">
            Clearfix
          </Tag>
          <Tag float="right" color="primary" m="1">
            Position Relative
          </Tag>
          <Tag
            color="warning"
            pos="absolute"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            Absolutely positioned
          </Tag>
        </Box>
        <p className="help">
          Combined clearfix and relative positioning working together
        </p>
      </Block>
    </Box>
  ),
};

export const RelativePosition: Story = {
  render: () => (
    <Box>
      <Title size="5">Relative Position Helper</Title>
      <p className="subtitle is-6">
        Using is-relative for positioned elements and overlays
      </p>

      <Block mb="6">
        <h4 className="title is-6">Basic Relative Positioning</h4>
        <Box {...STAGE} relative style={{ height: '150px' }}>
          <span>This container has position: relative</span>
          <Box {...ITEM} pos="absolute" style={{ top: '20px', right: '20px' }}>
            Absolutely positioned child
          </Box>
        </Box>
      </Block>

      <Block mb="6">
        <h4 className="title is-6">Card with Badge Overlay</h4>
        <Box {...STAGE} relative style={{ maxWidth: '300px' }}>
          <Title size="5" mb="3">
            Product Card
          </Title>
          <Paragraph mb="3">
            This is a sample product description that shows how relative
            positioning helps with overlays.
          </Paragraph>
          <Button color="primary">Add to Cart</Button>

          {/* Badge overlay */}
          <Tag
            color="danger"
            pos="absolute"
            style={{
              top: '-8px',
              right: '-8px',
              transform: 'rotate(12deg)',
            }}
          >
            NEW!
          </Tag>
        </Box>
      </Block>

      <Block mb="6">
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
            pos="absolute"
            style={{
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
      </Block>

      <Block mb="6">
        <h4 className="title is-6">Combined with Other Helpers</h4>
        <Box {...STAGE} mb="2" relative clearfix style={{ minHeight: '120px' }}>
          <Button float="left" color="success">
            Floated Button
          </Button>
          <Button float="right" color="info">
            Another Float
          </Button>

          {/* Absolutely positioned notification */}
          <Notification
            color="warning"
            pos="absolute"
            style={{
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
      </Block>
    </Box>
  ),
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

      <Box
        {...STAGE}
        textSizeMobile="7" // Small on mobile
        textSizeTablet="5" // Medium on tablet
        textSizeDesktop="3" // Large on desktop
        textSizeWidescreen="2" // Larger on widescreen
        textSizeFullhd="1" // Largest on fullhd
        textWeight="bold"
        p="4"
      >
        This text size changes based on viewport: small on mobile, progressively
        larger on bigger screens.
      </Box>

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

      <Box
        {...STAGE}
        textAlignMobile="centered" // Center on mobile
        textAlignTablet="left" // Left on tablet
        textAlignDesktop="right" // Right on desktop
        textAlignWidescreen="justified" // Justify on widescreen
        textAlignFullhd="centered" // Center on fullhd
        textSize="4"
        p="4"
      >
        This text alignment changes based on viewport: centered on mobile, left
        on tablet, right on desktop, justified on widescreen, centered again on
        fullhd. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
        eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </Box>

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

      <Box
        {...STAGE}
        visibilityMobile="hidden" // Hidden on mobile
        visibilityTablet="sr-only" // Screen reader only on tablet
        visibilityDesktop="invisible" // Invisible on desktop
        visibilityWidescreen="hidden" // Hidden on widescreen
        // Visible by default on fullhd
        textSize="4"
        textWeight="bold"
        p="4"
      >
        This block visibility changes: hidden on mobile, screen-reader-only on
        tablet, invisible on desktop, hidden on widescreen, visible on fullhd.
      </Box>

      <Content>
        <strong>Generated classes:</strong>
        <code>
          {' '}
          is-hidden-mobile is-sr-only-tablet is-invisible-desktop
          is-hidden-widescreen
        </code>
      </Content>

      <Box
        {...STAGE}
        visibilityMobile="invisible"
        visibilityTablet="invisible"
        visibilityDesktop="invisible"
        textSize="3"
        p="3"
      >
        This block is invisible on mobile, tablet, and desktop (but takes up
        space). Only visible on widescreen and fullhd.
      </Box>

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

export const TouchAndOnlyViewports: Story = {
  render: () => (
    <Box>
      <Title size="5">Touch and &quot;-only&quot; Viewports</Title>
      <SubTitle size="6">
        Resize your browser to see the effect — <code>touch</code> covers mobile
        + tablet, while the <code>-only</code> variants isolate a single
        breakpoint band.
      </SubTitle>

      <Block>
        <Title size="6">displayTouch / displayDesktopOnly</Title>
        <Box {...ITEM} displayTouch="none" displayDesktopOnly="flex" p="4">
          Hidden on mobile + tablet (<code>displayTouch=&quot;none&quot;</code>
          ), shown as flex on desktop only (
          <code>displayDesktopOnly=&quot;flex&quot;</code>).
        </Box>
      </Block>

      <Block>
        <Title size="6">visibilityTouch / visibilityWidescreenOnly</Title>
        <Buttons>
          <Button visibilityTouch="hidden">Hidden on mobile + tablet</Button>
          <Button visibilityWidescreenOnly="invisible">
            Invisible on widescreen only
          </Button>
          <Button>Always visible</Button>
        </Buttons>
      </Block>

      <Block>
        <Title size="6">displayTabletOnly</Title>
        <Box {...ITEM} displayTabletOnly="block" p="4">
          <code>is-block-tablet-only</code> sets <code>display: block</code>{' '}
          only inside the tablet-only range (769px - 1023px). A Box is already
          block by default, so outside that range it keeps its normal block
          display — the <code>-only</code> class does not hide it elsewhere.
        </Box>
      </Block>

      <Content>
        <strong>Generated classes:</strong>
        <code>
          {' '}
          is-hidden-touch is-flex-desktop-only is-hidden-touch
          is-invisible-widescreen-only is-block-tablet-only
        </code>
      </Content>
    </Box>
  ),
  name: 'Touch and -only Viewports',
};

export const GridDisplay: Story = {
  render: () => (
    <Box>
      <Title size="5">Grid Display</Title>
      <SubTitle size="6">
        <code>display=&quot;grid&quot;</code> emits <code>is-grid</code>
      </SubTitle>
      <Box display="grid">
        <Notification color="primary" m="1">
          Cell 1
        </Notification>
        <Notification color="info" m="1">
          Cell 2
        </Notification>
        <Notification color="success" m="1">
          Cell 3
        </Notification>
      </Box>
    </Box>
  ),
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
        bgColor="primary"
        textColor="primary"
        colorShade="invert"
        p="4"
        m="2"
        // Viewport-specific properties
        textSizeMobile="6"
        textSizeDesktop="4"
        textAlignMobile="centered"
        textAlignDesktop="left"
      >
        This box combines regular properties (background, text color, padding,
        margin) with viewport-specific properties (text size and alignment).
      </Block>

      <Content>
        <strong>Generated classes:</strong>
        <code>
          {' '}
          has-text-primary-invert has-background-primary p-4 m-2
          is-size-6-mobile is-size-4-desktop has-text-centered-mobile
          has-text-left-desktop
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

      <Block>
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

        <Box
          {...STAGE}
          color="primary"
          textAlign="centered"
          viewport="mobile"
          textSize="4"
          p="4"
        >
          This uses the old global viewport approach - all properties get the
          same viewport modifier.
        </Box>
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

        <Box
          {...STAGE}
          textSizeMobile="6"
          textSizeTablet="4"
          textSizeDesktop="2"
          textAlignMobile="centered"
          textAlignDesktop="left"
          p="4"
        >
          This uses the new viewport-specific properties - each viewport can
          have different values for text size and alignment.
        </Box>
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

      <Block>
        <Title size="6">Align Self on Buttons</Title>
        <Content mb="3">
          <strong>Important:</strong> The buttons below don&apos;t need{' '}
          <code>display=&quot;flex&quot;</code> themselves - they just need to
          be children of a flex container to use <code>alignSelf</code>.
        </Content>
        <Box
          {...STAGE}
          display="flex"
          alignItems="flex-start"
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

      <Block>
        <Title size="6">Flex Grow & Shrink on Items</Title>
        <Content mb="3">
          These boxes use <code>flexGrow</code> and <code>flexShrink</code>{' '}
          without needing <code>display=&quot;flex&quot;</code> on themselves.
        </Content>
        <Box {...STAGE} display="flex" gap="1">
          <Box {...ITEM} flexGrow="0" flexShrink="0" textAlign="centered">
            No grow/shrink
          </Box>
          <Box {...ITEM} flexGrow="1" flexShrink="1" textAlign="centered">
            Grow: 1, Shrink: 1
          </Box>
          <Box {...ITEM} flexGrow="2" flexShrink="0" textAlign="centered">
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
          {...STAGE}
          display="flex"
          justifyContent="space-around"
          alignItems="stretch"
          gap="1"
          style={{ minHeight: '120px' }}
        >
          <Box
            {...ITEM}
            alignSelf="flex-start"
            flexGrow="0"
            textAlign="centered"
          >
            alignSelf: start
            <br />
            flexGrow: 0
          </Box>
          <Box {...ITEM} alignSelf="center" flexGrow="1" textAlign="centered">
            alignSelf: center
            <br />
            flexGrow: 1
          </Box>
          <Box
            {...ITEM}
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
};
