import { Fragment, useState, type ComponentType } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { Reveal, RevealAnimation } from './Reveal';
import { Card } from './Card';
import { Section } from '../layout/Section';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';
import { Title } from '../elements/Title';
import { Content } from '../elements/Content';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';

const meta: Meta<typeof Reveal> = {
  title: 'Components/Reveal',
  component: Reveal,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Animates its content into view as it scrolls into the viewport, using `IntersectionObserver`. Renders in its final, visible state during SSR and automatically skips the animation when the user prefers reduced motion. The stories that start in view play their reveal while they load, so each has a Replay button that mounts it again. With reduced motion on, Replay shows the content straight away, the way Reveal always does then.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    animation: {
      control: 'select',
      options: [
        'fade',
        'fade-up',
        'fade-down',
        'slide-left',
        'slide-right',
        'zoom',
        'flip',
      ],
      description:
        'Animation style applied when the element enters the viewport.',
    },
    delay: {
      control: 'number',
      description: 'Delay in milliseconds before the animation starts.',
    },
    duration: {
      control: 'number',
      description: 'Animation duration in milliseconds.',
    },
    threshold: {
      control: 'number',
      description:
        'Fraction (0-1) of the element that must be visible to trigger the reveal.',
    },
    once: {
      control: 'boolean',
      description:
        'Animate only the first time the element enters the viewport.',
    },
    cascade: {
      control: 'boolean',
      description:
        'Stagger direct children with an incrementing delay instead of animating this element as a single block.',
    },
    cascadeInterval: {
      control: 'number',
      description:
        "Milliseconds added to each successive child's delay when `cascade` is set.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Reveal>;

// A story that starts in view plays its reveal while it loads, before anyone
// is looking. Replay changes the key around the story, so React mounts a fresh
// Reveal, which runs its animation again, or under reduced motion shows the
// content at once like any other Reveal. It's a decorator so the story's
// source shows only the Reveal.
const ReplayFrame = ({ Story }: { Story: ComponentType }) => {
  const [run, setRun] = useState(0);
  return (
    <>
      <Button mb="4" onClick={() => setRun(r => r + 1)}>
        Replay
      </Button>
      <Fragment key={run}>
        <Story />
      </Fragment>
    </>
  );
};

const withReplay: Decorator = Story => <ReplayFrame Story={Story} />;

export const Default: Story = {
  args: {
    animation: 'fade-up',
  },
  decorators: [withReplay],
  render: args => (
    <Reveal {...args}>
      <Box>
        <Title size="4">Reveal me</Title>
        <Content>
          This box fades up into view. Press Replay to watch it again, or see
          Scroll To Reveal for a box that waits until you scroll to it.
        </Content>
      </Box>
    </Reveal>
  ),
};

const ANIMATIONS: RevealAnimation[] = [
  'fade',
  'fade-up',
  'fade-down',
  'slide-left',
  'slide-right',
  'zoom',
  'flip',
];

export const Animations: Story = {
  decorators: [withReplay],
  render: () => (
    <Columns isMultiline>
      {ANIMATIONS.map(animation => (
        <Column size="one-third" key={animation}>
          <Reveal animation={animation}>
            <Box>
              <Title size="5">{animation}</Title>
            </Box>
          </Reveal>
        </Column>
      ))}
    </Columns>
  ),
};

export const AsSection: Story = {
  decorators: [withReplay],
  render: () => (
    <Reveal animation="fade-up" as={Section}>
      <Title size="3">Why bestax</Title>
      <Content>
        Rendered as a <code>Section</code> through the <code>as</code> prop
        instead of the default <code>div</code>.
      </Content>
    </Reveal>
  ),
};

export const Cascade: Story = {
  args: {
    animation: 'fade-up',
    cascade: true,
    cascadeInterval: 100,
  },
  decorators: [withReplay],
  render: args => (
    <Reveal {...args} display="flex" flexWrap="wrap" gap="2">
      {['Fast', 'Accessible', 'Themeable'].map(feature => (
        <Card key={feature} flexGrow="1" flexShrink="1" mb="0">
          <Card.Content>
            <Title size="5">{feature}</Title>
          </Card.Content>
        </Card>
      ))}
    </Reveal>
  ),
};

export const ScrollToReveal: Story = {
  render: () => (
    <>
      <Content>Scroll down to see the section fade up into view.</Content>
      <div style={{ height: '120vh' }} />
      <Reveal animation="fade-up">
        <Box>
          <Title size="4">Now you see me</Title>
          <Content>
            This box only animates in once it crosses the visibility threshold.
          </Content>
        </Box>
      </Reveal>
      <div style={{ height: '50vh' }} />
    </>
  ),
};
