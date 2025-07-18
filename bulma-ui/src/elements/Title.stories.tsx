import React, { useEffect, useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import { Title, TitleProps } from './Title';
import { SubTitle } from './SubTitle';
import { Block } from './Block';

const meta: Meta<typeof Title> = {
  title: 'Elements/Title',
  component: Title,
  argTypes: {
    size: {
      control: 'select',
      options: ['1', '2', '3', '4', '5', '6'],
    },
    isSpaced: { control: 'boolean' },
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

type Story = StoryObj<typeof Title>;

export const Default: Story = {
  args: {
    children: 'Default Title',
  },
};

export const Size1: Story = {
  args: {
    children: 'Title Size 1',
    size: '1',
  },
};

export const Size3: Story = {
  args: {
    children: 'Title Size 3',
    size: '3',
  },
};

export const Spaced: Story = {
  args: {
    children: 'Spaced Title',
    isSpaced: true,
  },
};

export const WithMargin: Story = {
  args: {
    children: 'Title with Margin',
    m: '4',
  },
};

export const AsParagraph: Story = {
  args: {
    children: 'Title as Paragraph',
    as: 'p',
    size: '3',
  },
};

export const AllSizes: Story = {
  render: () => (
    <>
      {['1', '2', '3', '4', '5', '6'].map(size => (
        <Title key={size} size={size as TitleProps['size']}>
          Title Size {size}
        </Title>
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
    children: 'Title',
    hasSkeleton: true,
    size: '2',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Applies the `has-skeleton` class to the Title component using the hasSkeleton prop.',
      },
    },
  },
};

export const IsSkeleton: Story = {
  render: () => {
    // Move hook usage into a component
    function SkeletonToggler() {
      const [skeleton, setSkeleton] = useState(true);
      useEffect(() => {
        const timer = setInterval(() => setSkeleton(s => !s), 3000);
        return () => clearInterval(timer);
      }, []);
      return (
        <Title skeleton={skeleton} size="2">
          Title
        </Title>
      );
    }
    return <SkeletonToggler />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Uses the `skeleton` prop (handled by useBulmaClasses) to toggle the `is-skeleton` class every 3 seconds.',
      },
    },
  },
};
