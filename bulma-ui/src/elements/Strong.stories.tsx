import { Meta, StoryObj } from '@storybook/react-vite';
import { Strong } from './Strong';
import { Paragraph } from './Paragraph';

const meta: Meta<typeof Strong> = {
  title: 'Elements/Strong',
  component: Strong,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    textColor: {
      control: 'select',
      options: [
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'light',
        'dark',
        'inherit',
        'current',
      ],
      description: 'Text color using Bulma has-text-* classes',
    },
    bgColor: {
      control: 'select',
      options: [
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'light',
        'dark',
        'inherit',
        'current',
      ],
      description: 'Background color using Bulma has-background-* classes',
    },
    m: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
      description: 'Margin size using Bulma m-* classes',
    },
    p: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
      description: 'Padding size using Bulma p-* classes',
    },
    className: {
      control: 'text',
      description: 'Custom CSS class',
    },
    children: {
      control: 'text',
      description: 'Content inside the strong element',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Strong>;

export const Default: Story = {
  args: {
    children: 'Strong text',
  },
};

export const PrimaryColor: Story = {
  args: {
    children: 'Primary strong text',
    textColor: 'primary',
  },
  name: 'Primary Color',
};

export const DangerColor: Story = {
  args: {
    children: 'Important warning!',
    textColor: 'danger',
  },
  name: 'Danger Color',
};

export const WithBackground: Story = {
  args: {
    children: 'Highlighted strong text',
    bgColor: 'warning',
    textColor: 'dark',
    p: '1',
  },
  name: 'With Background',
};

export const InlineWithText: Story = {
  render: () => (
    <Paragraph>
      This is a paragraph with <Strong>strong text</Strong> in the middle. The
      strong text indicates <Strong textColor="primary">important</Strong>{' '}
      content.
    </Paragraph>
  ),
  name: 'Inline with Text',
};

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Strong textColor="primary">Primary strong</Strong>
      <Strong textColor="link">Link strong</Strong>
      <Strong textColor="info">Info strong</Strong>
      <Strong textColor="success">Success strong</Strong>
      <Strong textColor="warning">Warning strong</Strong>
      <Strong textColor="danger">Danger strong</Strong>
    </div>
  ),
  name: 'All Colors',
};

export const Emphasis: Story = {
  render: () => (
    <Paragraph>
      <Strong>Note:</Strong> This is a pattern commonly used for callouts where
      the lead word is strong to draw attention.
    </Paragraph>
  ),
  name: 'Callout Pattern',
};
