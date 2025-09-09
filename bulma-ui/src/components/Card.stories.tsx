import { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';
import { Icon } from '../elements/Icon';

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

export const CompoundComponents: Story = {
  render: () => (
    <Card>
      <Card.Header>
        <Card.Header.Title>Compound Component Card</Card.Header.Title>
        <Card.Header.Icon aria-label="more options">
          <Icon name="angle-down" variant="solid" ariaLabel="expand" />
        </Card.Header.Icon>
      </Card.Header>
      <Card.Image>
        <figure className="image is-4by3">
          <img src={TEST_IMAGE} alt="Beautiful forest" />
        </figure>
      </Card.Image>
      <Card.Content>
        <div className="content">{DECLARATION_LATIN}</div>
      </Card.Content>
      <Card.Footer>
        <Card.FooterItem>
          <button className="button is-primary">Save</button>
        </Card.FooterItem>
        <Card.FooterItem>
          <button className="button">Cancel</button>
        </Card.FooterItem>
      </Card.Footer>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the flexible compound component API for Card, allowing fine-grained control over each section.',
      },
    },
  },
};

export const CompoundComponentsMinimal: Story = {
  render: () => (
    <Card>
      <Card.Header>
        <Card.Header.Title>Simple Header</Card.Header.Title>
      </Card.Header>
      <Card.Content>
        <p>Just some minimal content using compound components.</p>
      </Card.Content>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A minimal example using only Card.Header and Card.Content compound components.',
      },
    },
  },
};

export const MixedApproach: Story = {
  render: () => (
    <Card header="Prop-based header" textColor="primary" m="3">
      <Card.Content className="has-background-light">
        <p>You can mix prop-based and compound component approaches!</p>
        <p>
          This card uses the header prop but compound components for content.
        </p>
      </Card.Content>
      <Card.Footer>
        <Card.FooterItem>Mixed approach example</Card.FooterItem>
      </Card.Footer>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows how you can mix the traditional prop-based API with compound components for maximum flexibility.',
      },
    },
  },
};

export const HeaderTitleVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card>
        <Card.Header>
          <Card.Header.Title>Default Header Title</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <p>This card uses the default header title alignment.</p>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Header.Title centered>Centered Header Title</Card.Header.Title>
        </Card.Header>
        <Card.Content>
          <p>This card uses a centered header title.</p>
        </Card.Content>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the Card.Header.Title component with different alignment options.',
      },
    },
  },
};

export const HeaderWithIcon: Story = {
  render: () => (
    <Card>
      <Card.Header>
        <Card.Header.Title>Expandable Card</Card.Header.Title>
        <Card.Header.Icon aria-label="expand">
          <Icon name="angle-down" variant="solid" ariaLabel="expand" />
        </Card.Header.Icon>
      </Card.Header>
      <Card.Content>
        This card demonstrates the Card.Header.Icon component, which renders a
        proper Bulma card-header-icon button for actions like expand/collapse or
        accessing more options.
      </Card.Content>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the Card.Header.Icon component for adding action buttons to card headers.',
      },
    },
  },
};
