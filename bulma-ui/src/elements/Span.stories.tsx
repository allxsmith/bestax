import { Meta, StoryObj } from '@storybook/react-vite';
import { Span } from './Span';

const meta: Meta<typeof Span> = {
  title: 'Elements/Span',
  component: Span,
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
    textSize: {
      control: 'select',
      options: ['1', '2', '3', '4', '5', '6', '7'],
      description: 'Text size using Bulma is-size-* classes',
    },
    textWeight: {
      control: 'select',
      options: ['light', 'normal', 'medium', 'semibold', 'bold'],
      description: 'Text weight using Bulma has-text-weight-* classes',
    },
    className: {
      control: 'text',
      description: 'Custom CSS class',
    },
    children: {
      control: 'text',
      description: 'Content inside the span',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Span>;

export const Default: Story = {
  args: {
    children: 'Default Span',
  },
};

export const PrimaryText: Story = {
  args: {
    children: 'Primary Text',
    textColor: 'primary',
  },
};

export const SuccessText: Story = {
  args: {
    children: 'Success Text',
    textColor: 'success',
  },
};

export const WithBackground: Story = {
  args: {
    children: 'Span with Background',
    bgColor: 'warning',
    textColor: 'dark',
    p: '2',
  },
};

export const LargeText: Story = {
  args: {
    children: 'Large Span',
    textSize: '3',
  },
};

export const BoldText: Story = {
  args: {
    children: 'Bold Span',
    textWeight: 'bold',
  },
};

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Span textColor="primary">Primary Span</Span>
      <Span textColor="link">Link Span</Span>
      <Span textColor="info">Info Span</Span>
      <Span textColor="success">Success Span</Span>
      <Span textColor="warning">Warning Span</Span>
      <Span textColor="danger">Danger Span</Span>
    </div>
  ),
  name: 'All Colors',
};

export const InlineWithText: Story = {
  render: () => (
    <p>
      This is a paragraph with a <Span textColor="primary">colored span</Span>{' '}
      in the middle and a <Span textWeight="bold">bold span</Span> as well.
    </p>
  ),
  name: 'Inline with Text',
};

export const HighlightedText: Story = {
  args: {
    children: 'Highlighted Text',
    bgColor: 'warning',
    textColor: 'dark',
    p: '1',
  },
  name: 'Highlighted Text',
};
