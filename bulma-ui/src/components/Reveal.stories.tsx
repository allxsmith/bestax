import type { Meta, StoryObj } from '@storybook/react-vite';
import { Reveal, RevealAnimation } from './Reveal';
import { Card } from './Card';
import { Section } from '../layout/Section';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';
import { Title } from '../elements/Title';
import { Content } from '../elements/Content';
import { Box } from '../elements/Box';

const meta: Meta<typeof Reveal> = {
  title: 'Components/Reveal',
  component: Reveal,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Animates its content into view as it scrolls into the viewport, using `IntersectionObserver`. Renders in its final, visible state during SSR and automatically skips the animation when the user prefers reduced motion.',
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

export const Default: Story = {
  args: {
    animation: 'fade-up',
  },
  render: args => (
    <Reveal {...args}>
      <Box>
        <Title size="4">Reveal me</Title>
        <Content>
          This box fades up into view. Since it is already visible in the
          Storybook canvas, it appears revealed immediately — scroll it out of
          view and back in the "Scroll To Reveal" story to see the effect
          trigger.
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
  render: () => (
    <Reveal animation="fade-up" as={Section}>
      <Title size="3">Why bestax</Title>
      <Content>
        Rendered as a `Section` via the `as` prop instead of the default `div`.
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
  render: args => (
    <Reveal {...args} display="flex" flexWrap="wrap">
      {['Fast', 'Accessible', 'Themeable'].map(feature => (
        <Card key={feature} flexGrow="1" flexShrink="1" m="2">
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
