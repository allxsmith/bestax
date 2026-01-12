import { Meta, StoryObj } from '@storybook/react-vite';
import { Paragraph } from './Paragraph';

const meta: Meta<typeof Paragraph> = {
  title: 'Elements/Paragraph',
  component: Paragraph,
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
    textAlign: {
      control: 'select',
      options: ['centered', 'justified', 'left', 'right'],
      description: 'Text alignment using Bulma has-text-* classes',
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
      description: 'Content inside the paragraph',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Paragraph>;

export const Default: Story = {
  args: {
    children:
      'This is a default paragraph. It contains some sample text to demonstrate the component.',
  },
};

export const PrimaryText: Story = {
  args: {
    children: 'This paragraph has primary colored text.',
    textColor: 'primary',
  },
};

export const CenteredText: Story = {
  args: {
    children: 'This paragraph is centered.',
    textAlign: 'centered',
  },
};

export const WithBackground: Story = {
  args: {
    children: 'This paragraph has a light background.',
    bgColor: 'light',
    textColor: 'dark',
    p: '3',
  },
};

export const LargeText: Story = {
  args: {
    children: 'This is a large paragraph.',
    textSize: '3',
  },
};

export const SmallText: Story = {
  args: {
    children: 'This is a small paragraph.',
    textSize: '7',
  },
};

export const JustifiedText: Story = {
  args: {
    children:
      'This paragraph has justified text alignment. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    textAlign: 'justified',
  },
  decorators: [story => <div style={{ maxWidth: '400px' }}>{story()}</div>],
};

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Paragraph textColor="primary">Primary paragraph</Paragraph>
      <Paragraph textColor="link">Link paragraph</Paragraph>
      <Paragraph textColor="info">Info paragraph</Paragraph>
      <Paragraph textColor="success">Success paragraph</Paragraph>
      <Paragraph textColor="warning">Warning paragraph</Paragraph>
      <Paragraph textColor="danger">Danger paragraph</Paragraph>
    </div>
  ),
  name: 'All Colors',
};

export const StackedParagraphs: Story = {
  render: () => (
    <div style={{ maxWidth: '500px' }}>
      <Paragraph mb="4">
        First paragraph with margin bottom. Lorem ipsum dolor sit amet,
        consectetur adipiscing elit.
      </Paragraph>
      <Paragraph mb="4">
        Second paragraph with margin bottom. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </Paragraph>
      <Paragraph>
        Third paragraph without margin bottom. Ut enim ad minim veniam, quis
        nostrud exercitation.
      </Paragraph>
    </div>
  ),
  name: 'Stacked Paragraphs',
};

export const HighlightedParagraph: Story = {
  args: {
    children: 'This is a highlighted paragraph with dark background.',
    bgColor: 'dark',
    textColor: 'white',
    p: '4',
  },
  name: 'Highlighted Paragraph',
};
