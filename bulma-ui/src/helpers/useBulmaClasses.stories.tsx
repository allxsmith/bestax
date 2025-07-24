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
