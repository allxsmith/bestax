import { Meta, StoryObj } from '@storybook/react-vite';
import { Emphasis } from './Emphasis';
import { Paragraph } from './Paragraph';

const meta: Meta<typeof Emphasis> = {
  title: 'Elements/Emphasis',
  component: Emphasis,
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
      description: 'Content inside the emphasis element',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Emphasis>;

export const Default: Story = {
  args: {
    children: 'Emphasized text',
  },
};

export const PrimaryColor: Story = {
  args: {
    children: 'Primary emphasized text',
    textColor: 'primary',
  },
  name: 'Primary Color',
};

export const InfoColor: Story = {
  args: {
    children: 'Note this important detail',
    textColor: 'info',
  },
  name: 'Info Color',
};

export const WithBackground: Story = {
  args: {
    children: 'Highlighted emphasis',
    bgColor: 'light',
    textColor: 'dark',
    p: '1',
  },
  name: 'With Background',
};

export const InlineWithText: Story = {
  render: () => (
    <Paragraph>
      This is a paragraph with <Emphasis>emphasized text</Emphasis> in the
      middle. You should <Emphasis textColor="info">really</Emphasis> pay
      attention to this.
    </Paragraph>
  ),
  name: 'Inline with Text',
};

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Emphasis textColor="primary">Primary emphasis</Emphasis>
      <Emphasis textColor="link">Link emphasis</Emphasis>
      <Emphasis textColor="info">Info emphasis</Emphasis>
      <Emphasis textColor="success">Success emphasis</Emphasis>
      <Emphasis textColor="warning">Warning emphasis</Emphasis>
      <Emphasis textColor="danger">Danger emphasis</Emphasis>
    </div>
  ),
  name: 'All Colors',
};

export const QuotationStyle: Story = {
  render: () => (
    <Paragraph>
      As the saying goes, <Emphasis>actions speak louder than words</Emphasis>.
    </Paragraph>
  ),
  name: 'Quotation Style',
};

export const TechnicalTerm: Story = {
  render: () => (
    <Paragraph>
      The <Emphasis>idempotent</Emphasis> operation can be applied multiple
      times without changing the result beyond the initial application.
    </Paragraph>
  ),
  name: 'Technical Term',
};
