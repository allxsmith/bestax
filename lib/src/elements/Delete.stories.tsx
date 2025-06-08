import { Meta, StoryObj } from '@storybook/react';
import { Delete } from './Delete';
import {
  validColors,
  validSizes,
  validTextSizes,
} from '../helpers/useBulmaClasses';

const meta: Meta<typeof Delete> = {
  title: 'Elements/Delete',
  component: Delete,
  argTypes: {
    className: { control: 'text' },
    textColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
    },
    bgColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
    },
    m: { control: 'select', options: validSizes },
    textSize: { control: 'select', options: validTextSizes },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    ariaLabel: { control: 'text' },
    disabled: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A Bulma Delete component used as a close button for modals, notifications, tags, messages, etc. Uses useBulmaClasses for helper classes.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Delete>;

export const Default: Story = {
  args: {
    ariaLabel: 'Close',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    ariaLabel: 'Close',
  },
};

export const Medium: Story = {
  args: {
    size: 'medium',
    ariaLabel: 'Close',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    ariaLabel: 'Close',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    ariaLabel: 'Close',
  },
};

export const WithCustomClass: Story = {
  args: {
    className: 'custom-delete',
    ariaLabel: 'Close',
  },
};

export const WithTextColor: Story = {
  args: {
    textColor: 'primary',
    ariaLabel: 'Close',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Delete component with a text color applied via useBulmaClasses.',
      },
    },
  },
};

export const WithBackgroundColor: Story = {
  args: {
    bgColor: 'info',
    ariaLabel: 'Close',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Delete component with a background color applied via useBulmaClasses.',
      },
    },
  },
};

export const WithMargin: Story = {
  args: {
    m: '2',
    ariaLabel: 'Close',
  },
  parameters: {
    docs: {
      description: {
        story: 'Delete component with margin applied via useBulmaClasses.',
      },
    },
  },
};

export const InTag: Story = {
  render: ({ onClick, ...args }) => (
    <span className="tag is-info is-medium">
      Example Tag
      <Delete size="small" onClick={onClick} {...args} />
    </span>
  ),
  args: {
    ariaLabel: 'Remove tag',
    textColor: 'danger',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Delete component used within a Bulma Tag to allow removing the tag, with a custom text color.',
      },
    },
  },
};

export const InNotification: Story = {
  render: ({ onClick, ...args }) => (
    <div className="notification is-primary">
      <Delete onClick={onClick} {...args} />
      <p>This is a primary notification with a delete button.</p>
    </div>
  ),
  args: {
    ariaLabel: 'Close notification',
    bgColor: 'warning',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Delete component used within a Bulma Notification to close it, with a custom background color.',
      },
    },
  },
};

export const InMessage: Story = {
  render: ({ onClick, ...args }) => (
    <article className="message is-success">
      <div className="message-header">
        <p>Success Message</p>
        <Delete onClick={onClick} {...args} />
      </div>
      <div className="message-body">
        This is a success message with a delete button in the header.
      </div>
    </article>
  ),
  args: {
    ariaLabel: 'Close message',
    m: '1',
    textColor: 'dark',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Delete component used within a Bulma Message header to close the message, with margin and text color.',
      },
    },
  },
};
