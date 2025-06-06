import { Breadcrumb } from './Breadcrumb';
import { Icon } from '../elements/Icon';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  argTypes: {
    alignment: { control: 'select', options: ['', 'centered', 'right'] },
    separator: {
      control: 'select',
      options: ['', 'arrow', 'bullet', 'dot', 'succeeds'],
    },
    size: { control: 'select', options: ['', 'small', 'medium', 'large'] },
  },
  parameters: {
    // Optional: Add Bulma CSS to Storybook for proper rendering
    docs: {
      description: {
        component:
          'A Bulma breadcrumb navigation component supporting alignment, separators, sizes, and icons.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Breadcrumb>;

// Base breadcrumb items for reuse
const defaultItems = (
  <>
    <li>
      <a href="#">
        <Icon name="fas fa-home" ariaLabel="home icon" /> Home
      </a>
    </li>
    <li>
      <a href="#">
        <Icon name="fas fa-folder" ariaLabel="category icon" /> Category
      </a>
    </li>
    <li className="is-active">
      <a href="#">
        <Icon name="fas fa-file" ariaLabel="item icon" /> Item
      </a>
    </li>
  </>
);

// Default Story
export const Default: Story = {
  args: {
    children: defaultItems,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A default breadcrumb with no specific alignment, separator, or size modifiers.',
      },
    },
  },
};

// Centered Alignment
export const Centered: Story = {
  args: {
    alignment: 'centered',
    children: defaultItems,
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb with centered alignment using `is-centered`.',
      },
    },
  },
};

// Right Alignment
export const RightAligned: Story = {
  args: {
    alignment: 'right',
    children: defaultItems,
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb with right-aligned items using `is-right`.',
      },
    },
  },
};

// Arrow Separator
export const ArrowSeparator: Story = {
  args: {
    separator: 'arrow',
    children: defaultItems,
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb with arrow separators using `has-arrow-separator`.',
      },
    },
  },
};

// Bullet Separator
export const BulletSeparator: Story = {
  args: {
    separator: 'bullet',
    children: defaultItems,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Breadcrumb with bullet separators using `has-bullet-separator`.',
      },
    },
  },
};

// Dot Separator
export const DotSeparator: Story = {
  args: {
    separator: 'dot',
    children: defaultItems,
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb with dot separators using `has-dot-separator`.',
      },
    },
  },
};

// Succeeds Separator
export const SucceedsSeparator: Story = {
  args: {
    separator: 'succeeds',
    children: defaultItems,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Breadcrumb with succeeds separators using `has-succeeds-separator`.',
      },
    },
  },
};

// Small Size
export const Small: Story = {
  args: {
    size: 'small',
    children: defaultItems,
  },
  parameters: {
    docs: {
      description: {
        story: 'Small breadcrumb using `is-small`.',
      },
    },
  },
};

// Medium Size
export const Medium: Story = {
  args: {
    size: 'medium',
    children: defaultItems,
  },
  parameters: {
    docs: {
      description: {
        story: 'Medium breadcrumb using `is-medium`.',
      },
    },
  },
};

// Large Size
export const Large: Story = {
  args: {
    size: 'large',
    children: defaultItems,
  },
  parameters: {
    docs: {
      description: {
        story: 'Large breadcrumb using `is-large`.',
      },
    },
  },
};

// With Icons and Styling
export const WithIconsAndStyling: Story = {
  args: {
    alignment: 'centered',
    separator: 'dot',
    size: 'medium',
    textWeight: 'semibold',
    children: (
      <>
        <li>
          <a href="#">
            <Icon
              name="fas fa-home"
              textColor="primary"
              size="small"
              ariaLabel="home icon"
            />{' '}
            Home
          </a>
        </li>
        <li>
          <a href="#">
            <Icon
              name="fas fa-folder"
              textColor="info"
              size="small"
              ariaLabel="category icon"
            />{' '}
            Category
          </a>
        </li>
        <li className="is-active">
          <a href="#">
            <Icon
              name="fas fa-file"
              textColor="success"
              size="small"
              ariaLabel="item icon"
            />{' '}
            Item
          </a>
        </li>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Breadcrumb with centered alignment, dot separator, medium size, semibold text, and colored icons.',
      },
    },
  },
};
