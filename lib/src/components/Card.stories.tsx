import { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const DECLARATION_LATIN =
  'Quando in rerum natura cursu fit ut populus aliquis inter nationes terrae statum separatum et aequalem, ad quem iure naturali et naturae Deo habendum vocantur, sibi vindicare velit, debetur erga opiniones humani generis ut causas, quae eos ad secessionem impellunt, declaret.';

const TEST_IMAGE =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    textColor: {
      control: 'select',
      options: [
        'primary',
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
    hasShadow: {
      control: 'boolean',
      description: 'Toggles the card shadow (is-shadowless when false)',
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
    textAlign: {
      control: 'select',
      options: ['centered', 'justified', 'left', 'right'],
      description: 'Text alignment using Bulma has-text-* classes',
    },
    className: {
      control: 'text',
      description: 'Custom CSS class',
    },
    header: {
      control: 'text',
      description: 'Card header content',
    },
    footer: {
      control: 'text',
      description: 'Card footer content',
    },
    image: {
      control: 'text',
      description: 'Image URL or React node for card image',
    },
    children: {
      control: 'text',
      description: 'Card body content',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    header: 'Card Header',
    image: TEST_IMAGE,
    imageAlt: 'Beautiful forest',
    children: DECLARATION_LATIN,
    footer: (
      <>
        <span className="card-footer-item">Save</span>
        <span className="card-footer-item">Cancel</span>
      </>
    ),
  },
};

export const WithHeader: Story = {
  args: {
    header: 'Card Header',
    children: DECLARATION_LATIN,
  },
};

export const WithFooter: Story = {
  args: {
    children: DECLARATION_LATIN,
    footer: (
      <>
        <span className="card-footer-item">Save</span>
        <span className="card-footer-item">Cancel</span>
      </>
    ),
  },
};

export const WithImage: Story = {
  args: {
    children: DECLARATION_LATIN,
    image: TEST_IMAGE,
    imageAlt: 'Beautiful forest',
  },
};

export const ImageOnly: Story = {
  args: {
    image: TEST_IMAGE,
    imageAlt: 'Beautiful forest',
  },
};

export const NoShadow: Story = {
  args: {
    children: DECLARATION_LATIN,
    hasShadow: false,
  },
};

export const Spaced: Story = {
  args: {
    children: DECLARATION_LATIN,
    m: '4',
    p: '4',
  },
};

export const ViewportSpecific: Story = {
  args: {
    children: DECLARATION_LATIN,
    textColor: 'primary',
    viewport: 'tablet',
  },
};

export const Interactive: Story = {
  args: {
    header: 'Interactive Card',
    children: DECLARATION_LATIN,
    textColor: 'success',
    bgColor: 'dark',
    m: '3',
    p: '3',
    textAlign: 'centered',
    hasShadow: true,
    footer: (
      <>
        <span className="card-footer-item">Action 1</span>
        <span className="card-footer-item">Action 2</span>
      </>
    ),
  },
};
