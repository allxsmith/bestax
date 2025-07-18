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

// Skeleton Button Component
const SkeletonButtonComponent: React.FC = () => {
  const skeleton = useSkeletonToggle();
  return (
    <Button skeleton={skeleton} style={{ width: 120 }}>
      Skeleton Button
    </Button>
  );
};
export const SkeletonButton: Story = {
  render: () => <SkeletonButtonComponent />,
  name: 'Skeleton Button (Toggles)',
};

// Skeleton Buttons Group Component
const SkeletonButtonsComponent: React.FC = () => {
  const skeleton = useSkeletonToggle();
  return (
    <Buttons>
      <Button skeleton={skeleton} style={{ width: 120 }}>
        Skeleton
      </Button>
      <Button skeleton={skeleton} style={{ width: 120 }}>
        Skeleton
      </Button>
      <Button skeleton={skeleton} style={{ width: 120 }}>
        Skeleton
      </Button>
    </Buttons>
  );
};
export const SkeletonButtons: Story = {
  render: () => <SkeletonButtonsComponent />,
  name: 'Skeleton Buttons Group (Toggles)',
};

// Skeleton Icon Component
const SkeletonIconComponent: React.FC = () => {
  const skeleton = useSkeletonToggle();
  return (
    <Icon
      name="star"
      skeleton={skeleton}
      ariaLabel="Star icon skeleton"
      style={{ fontSize: 32 }}
    />
  );
};
export const SkeletonIcon: Story = {
  render: () => <SkeletonIconComponent />,
  name: 'Skeleton Icon (Toggles)',
};

// Skeleton Image Component
const SkeletonImageComponent: React.FC = () => {
  const skeleton = useSkeletonToggle();
  return (
    <Image
      skeleton={skeleton}
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1150px-React-icon.svg.png"
      alt="Skeleton image"
      size="128x128"
      style={{ width: 128, height: 128 }}
    />
  );
};
export const SkeletonImage: Story = {
  render: () => <SkeletonImageComponent />,
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

// Skeleton Notification Component
const SkeletonNotificationComponent: React.FC = () => {
  const skeleton = useSkeletonToggle();
  return (
    <Notification skeleton={skeleton} style={{ width: 300 }}>
      Skeleton notification message.
    </Notification>
  );
};
export const SkeletonNotification: Story = {
  render: () => <SkeletonNotificationComponent />,
  name: 'Skeleton Notification (Toggles)',
};

// Skeleton Tag Component
const SkeletonTagComponent: React.FC = () => {
  const skeleton = useSkeletonToggle();
  return (
    <Tag skeleton={skeleton} style={{ width: 100, display: 'inline-block' }}>
      Skeleton Tag
    </Tag>
  );
};
export const SkeletonTag: Story = {
  render: () => <SkeletonTagComponent />,
  name: 'Skeleton Tag (Toggles)',
};

// Skeleton Title Component
const SkeletonTitleComponent: React.FC = () => {
  const skeleton = useSkeletonToggle();
  return (
    <Title skeleton={skeleton} size="2" style={{ width: 180 }}>
      Skeleton Title
    </Title>
  );
};
export const SkeletonTitle: Story = {
  render: () => <SkeletonTitleComponent />,
  name: 'Skeleton Title (Toggles)',
};

// Skeleton SubTitle Component
const SkeletonSubTitleComponent: React.FC = () => {
  const skeleton = useSkeletonToggle();
  return (
    <SubTitle skeleton={skeleton} size="4" style={{ width: 140 }}>
      Skeleton SubTitle
    </SubTitle>
  );
};
export const SkeletonSubTitle: Story = {
  render: () => <SkeletonSubTitleComponent />,
  name: 'Skeleton SubTitle (Toggles)',
};

// Skeleton Input Component
const SkeletonInputComponent: React.FC = () => {
  const skeleton = useSkeletonToggle();
  return (
    <Input
      skeleton={skeleton}
      placeholder="Skeleton Input"
      style={{ width: 160 }}
    />
  );
};
export const SkeletonInput: Story = {
  render: () => <SkeletonInputComponent />,
  name: 'Skeleton Input (Toggles)',
};

// Skeleton TextArea Component
const SkeletonTextAreaComponent: React.FC = () => {
  const skeleton = useSkeletonToggle();
  return (
    <TextArea
      skeleton={skeleton}
      placeholder="Skeleton TextArea"
      rows={3}
      style={{ width: 220 }}
    />
  );
};
export const SkeletonTextArea: Story = {
  render: () => <SkeletonTextAreaComponent />,
  name: 'Skeleton TextArea (Toggles)',
};
