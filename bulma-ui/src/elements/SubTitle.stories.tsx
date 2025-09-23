import { Meta, StoryObj } from '@storybook/react-vite';
import { SubTitle, SubTitleProps } from './SubTitle';
import { Title } from './Title';
import { Block } from './Block';
import React, { useEffect, useState } from 'react';

const meta: Meta<typeof SubTitle> = {
  title: 'Elements/SubTitle',
  component: SubTitle,
  argTypes: {
    size: {
      control: 'select',
      options: ['1', '2', '3', '4', '5', '6'],
    },
    as: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'],
    },
    m: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
    },
    className: { control: 'text' },
    hasSkeleton: { control: 'boolean' },
    skeleton: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof SubTitle>;

export const Default: Story = {
  args: {
    children: 'Default SubTitle',
  },
};

export const Size2: Story = {
  args: {
    children: 'SubTitle Size 2',
    size: '2',
  },
};

export const Size4: Story = {
  args: {
    children: 'SubTitle Size 4',
    size: '4',
  },
};

export const WithMargin: Story = {
  args: {
    children: 'SubTitle with Margin',
    m: '4',
  },
};

export const AsParagraph: Story = {
  args: {
    children: 'SubTitle as Paragraph',
    as: 'p',
    size: '3',
  },
};

export const AllSizes: Story = {
  render: () => (
    <>
      {['1', '2', '3', '4', '5', '6'].map(size => (
        <SubTitle key={size} size={size as SubTitleProps['size']}>
          SubTitle Size {size}
        </SubTitle>
      ))}
    </>
  ),
};

export const TitleAndSubtitle: Story = {
  render: () => (
    <>
      <Block>
        <Title as="p" size="1">
          Title 1
        </Title>
        <SubTitle as="p" size="3">
          Subtitle 3
        </SubTitle>
      </Block>
      <Block>
        <Title as="p" size="2">
          Title 2
        </Title>
        <SubTitle as="p" size="4">
          Subtitle 4
        </SubTitle>
      </Block>
      <Block>
        <Title as="p" size="3">
          Title 3
        </Title>
        <SubTitle as="p" size="5">
          Subtitle 5
        </SubTitle>
      </Block>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows Title and SubTitle components rendered as paragraphs with paired sizes.',
      },
    },
  },
};

export const TitleAndSubtitleSpaced: Story = {
  render: () => (
    <>
      <Block>
        <Title as="p" size="1" isSpaced>
          Title 1
        </Title>
        <SubTitle as="p" size="3">
          Subtitle 3
        </SubTitle>
      </Block>
      <Block>
        <Title as="p" size="2" isSpaced>
          Title 2
        </Title>
        <SubTitle as="p" size="4">
          Subtitle 4
        </SubTitle>
      </Block>
      <Block>
        <Title as="p" size="3" isSpaced>
          Title 3
        </Title>
        <SubTitle as="p" size="5">
          Subtitle 5
        </SubTitle>
      </Block>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows Title and SubTitle components rendered as paragraphs with paired sizes, with spaced titles.',
      },
    },
  },
};

// --- Skeleton Stories ---

export const HasSkeleton: Story = {
  args: {
    children: 'SubTitle',
    hasSkeleton: true,
    size: '3',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Applies the `has-skeleton` class to the SubTitle component using the hasSkeleton prop.',
      },
    },
  },
};

const IsSkeletonComponent: React.FC = () => {
  // This toggles the skeleton prop every 3 seconds
  const [skeleton, setSkeleton] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => setSkeleton(s => !s), 3000);
    return () => clearInterval(timer);
  }, []);
  return (
    <SubTitle skeleton={skeleton} size="4">
      SubTitle
    </SubTitle>
  );
};

export const IsSkeleton: Story = {
  render: () => <IsSkeletonComponent />,
  parameters: {
    docs: {
      description: {
        story:
          'Uses the `skeleton` prop (handled by useBulmaClasses) to toggle the `is-skeleton` class every 3 seconds.',
      },
    },
  },
};
