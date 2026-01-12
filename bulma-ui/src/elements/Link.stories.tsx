import { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from './Link';

const meta: Meta<typeof Link> = {
  title: 'Elements/Link',
  component: Link,
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
    isActive: {
      control: 'boolean',
      description: 'Whether the link appears active',
    },
    href: {
      control: 'text',
      description: 'The URL the link points to',
    },
    target: {
      control: 'select',
      options: ['_self', '_blank', '_parent', '_top'],
      description: 'Where to open the linked document',
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
      description: 'Content inside the link',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: {
    children: 'Default Link',
    href: '#',
  },
};

export const PrimaryText: Story = {
  args: {
    children: 'Primary Link',
    href: '#',
    textColor: 'primary',
  },
};

export const DangerText: Story = {
  args: {
    children: 'Danger Link',
    href: '#',
    textColor: 'danger',
  },
};

export const ActiveLink: Story = {
  args: {
    children: 'Active Link',
    href: '#',
    isActive: true,
  },
};

export const ExternalLink: Story = {
  args: {
    children: 'Open in New Tab',
    href: 'https://bulma.io',
    target: '_blank',
    rel: 'noopener noreferrer',
  },
};

export const WithBackground: Story = {
  args: {
    children: 'Link with Background',
    href: '#',
    bgColor: 'light',
    textColor: 'dark',
    p: '2',
  },
};

export const LargeText: Story = {
  args: {
    children: 'Large Link',
    href: '#',
    textSize: '3',
  },
};

export const BoldText: Story = {
  args: {
    children: 'Bold Link',
    href: '#',
    textWeight: 'bold',
  },
};

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Link href="#" textColor="primary">
        Primary Link
      </Link>
      <Link href="#" textColor="link">
        Link Color Link
      </Link>
      <Link href="#" textColor="info">
        Info Link
      </Link>
      <Link href="#" textColor="success">
        Success Link
      </Link>
      <Link href="#" textColor="warning">
        Warning Link
      </Link>
      <Link href="#" textColor="danger">
        Danger Link
      </Link>
    </div>
  ),
  name: 'All Colors',
};

export const InlineWithText: Story = {
  render: () => (
    <p>
      This is a paragraph with an <Link href="#">inline link</Link> in the
      middle of the text.
    </p>
  ),
  name: 'Inline with Text',
};
