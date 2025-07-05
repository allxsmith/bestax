import { Meta, StoryObj } from '@storybook/react';
import { Container } from './Container';
import { Notification } from '../elements/Notification';

const meta: Meta<typeof Container> = {
  title: 'Layout/Container',
  component: Container,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof Container>;

export const Default: Story = {
  render: () => (
    <Container>
      <Notification color="primary">
        By default the container is <strong>centered</strong> on desktop
        viewports and up.
      </Notification>
    </Container>
  ),
};

export const Widescreen: Story = {
  render: () => (
    <Container widescreen>
      <Notification color="primary">
        If <code>breakpoint=&quot;widescreen&quot;</code> the container is{' '}
        <strong>fullwidth</strong> <em>until</em> the <code>widescreen</code>{' '}
        breakpoint.
      </Notification>
    </Container>
  ),
};

export const FullHD: Story = {
  render: () => (
    <Container fullhd>
      <Notification color="primary">
        If <code>breakpoint=&quot;fullhd&quot;</code> the container is{' '}
        <strong>fullwidth</strong> <em>until</em> the <code>fullhd</code>{' '}
        breakpoint.
      </Notification>
    </Container>
  ),
};

export const MaxTabletWidth: Story = {
  render: () => (
    <Container breakpoint="tablet" isMax>
      <Notification color="primary">
        If the container has <code>breakpoint=&quot;tablet&quot;</code> and{' '}
        <code>isMax</code> then the container will have a <code>max-width</code>{' '}
        of <code>tablet - container offset</code>.
      </Notification>
    </Container>
  ),
};

export const MaxWidthDesktop: Story = {
  render: () => (
    <Container breakpoint="desktop" isMax>
      <Notification color="primary">
        If the container has <code>breakpoint=&quot;desktop&quot;</code> and{' '}
        <code>isMax</code> then the container will have a <code>max-width</code>{' '}
        of <code>desktop - container offset</code>.
      </Notification>
    </Container>
  ),
};

export const MaxWidthWidescreen: Story = {
  render: () => (
    <Container breakpoint="widescreen" isMax>
      <Notification color="primary">
        If the container has <code>breakpoint=&quot;widescreen&quot;</code> and{' '}
        <code>isMax</code> then the container will have a <code>max-width</code>{' '}
        of <code>widescreen - container offset</code>.
      </Notification>
    </Container>
  ),
};

export const FluidContainer: Story = {
  render: () => (
    <Container fluid>
      <Notification color="primary">
        If the container has <code>breakpoint=&quot;fluid&quot;</code> it will
        expand to the full width of the screen, with a small 32px gap on each
        side.
      </Notification>
    </Container>
  ),
};
