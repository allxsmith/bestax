import { Meta, StoryObj } from '@storybook/react-vite';
import { IconText } from './IconText';
import { Block } from './Block';
import {
  validColors,
  validSizes,
  validTextSizes,
} from '../helpers/useBulmaClasses';

const meta: Meta<typeof IconText> = {
  title: 'Elements/IconText',
  component: IconText,
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
    iconProps: {
      control: 'object',
      defaultValue: { name: 'fas fa-star', ariaLabel: 'Star icon' },
    },
    children: { control: 'text', defaultValue: 'Text' },
    items: { control: 'object' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A Bulma IconText component that wraps one or multiple Icons with optional text in an icon-text container. Uses useBulmaClasses for helper classes.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof IconText>;

export const Default: Story = {
  args: {
    iconProps: { name: 'fas fa-star', ariaLabel: 'Star icon' },
    children: 'Star',
  },
};

export const WithTextColor: Story = {
  args: {
    iconProps: { name: 'fas fa-star', ariaLabel: 'Star icon' },
    textColor: 'primary',
    children: 'Star',
  },
};

export const WithMargin: Story = {
  args: {
    iconProps: { name: 'fas fa-star', ariaLabel: 'Star icon' },
    m: '2',
    children: 'Star',
  },
};

export const WithLargeIcon: Story = {
  args: {
    iconProps: {
      name: 'fas fa-star',
      size: 'large',
      ariaLabel: 'Star icon',
      textColor: 'danger',
    },
    children: 'Large Star',
  },
};

export const InButton: Story = {
  render: ({ iconProps, children, ...args }) => (
    <button className="button is-primary">
      <IconText iconProps={iconProps} {...args}>
        {children}
      </IconText>
    </button>
  ),
  args: {
    iconProps: {
      name: 'fas fa-check',
      ariaLabel: 'Check icon',
      textColor: 'white',
    },
    children: 'Click Me',
  },
  parameters: {
    docs: {
      description: {
        story:
          'IconText used within a Bulma Button, with a custom icon text color.',
      },
    },
  },
};

export const InNotification: Story = {
  render: ({ iconProps, children, ...args }) => (
    <div className="notification is-info">
      <IconText iconProps={iconProps} {...args}>
        {children}
      </IconText>
    </div>
  ),
  args: {
    iconProps: {
      name: 'fas fa-info-circle',
      ariaLabel: 'Info icon',
      textColor: 'dark',
    },
    children: 'Info Notification',
    m: '1',
  },
  parameters: {
    docs: {
      description: {
        story:
          'IconText used within a Bulma Notification, with margin and text color.',
      },
    },
  },
};

export const InTag: Story = {
  render: ({ iconProps, children, ...args }) => (
    <span className="tag is-success is-medium">
      <IconText iconProps={iconProps} {...args}>
        {children}
      </IconText>
    </span>
  ),
  args: {
    iconProps: {
      name: 'fas fa-check',
      ariaLabel: 'Check icon',
      textColor: 'white',
      size: 'small',
    },
    children: 'Success',
  },
  parameters: {
    docs: {
      description: {
        story:
          'IconText used within a Bulma Tag, with a custom icon text color and size.',
      },
    },
  },
};

export const MultipleIconsInIconText: Story = {
  render: () => (
    <IconText
      items={[
        {
          iconProps: { name: 'fas fa-train', ariaLabel: 'Train icon' },
          text: 'Paris',
        },
        {
          iconProps: {
            name: 'fas fa-arrow-right',
            ariaLabel: 'Arrow right icon',
          },
          text: 'Budapest',
        },
        {
          iconProps: {
            name: 'fas fa-arrow-right',
            ariaLabel: 'Arrow right icon',
          },
          text: 'Bucharest',
        },
        {
          iconProps: {
            name: 'fas fa-arrow-right',
            ariaLabel: 'Arrow right icon',
          },
          text: 'Istanbul',
        },
        {
          iconProps: {
            name: 'fas fa-flag-checkered',
            ariaLabel: 'Finish icon',
          },
        },
      ]}
      mx="1"
    />
  ),
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'IconText with multiple icons and text, representing a train journey from Paris to Istanbul.',
      },
    },
  },
};

export const IconTextWithStars: Story = {
  render: () => (
    <IconText
      items={[
        { iconProps: { name: 'fas fa-star', ariaLabel: 'Star icon' } },
        { iconProps: { name: 'fas fa-star', ariaLabel: 'Star icon' } },
        { iconProps: { name: 'fas fa-star', ariaLabel: 'Star icon' } },
        {
          iconProps: {
            name: 'fas fa-star-half-alt',
            ariaLabel: 'Half star icon',
          },
        },
        {
          iconProps: { name: 'far fa-star', ariaLabel: 'Empty star icon' },
          text: '3.5/5',
        },
      ]}
      textColor="warning"
      mx="1"
    />
  ),
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'IconText used for a star rating system, with a text label for the score.',
      },
    },
  },
};

export const IconTextWithFlex: Story = {
  render: () => (
    <div>
      <IconText
        iconProps={{
          name: 'fas fa-info-circle',
          ariaLabel: 'Info icon',
          textColor: 'info',
        }}
        display="flex"
      >
        Information
      </IconText>
      <Block>
        Your package will be delivered on <strong>Tuesday at 08:00</strong>.
      </Block>
      <IconText
        iconProps={{
          name: 'fas fa-check-square',
          ariaLabel: 'Success icon',
          textColor: 'success',
        }}
        display="flex"
      >
        Success
      </IconText>
      <Block>Your image has been successfully uploaded.</Block>
      <IconText
        iconProps={{
          name: 'fas fa-exclamation-triangle',
          ariaLabel: 'Warning icon',
          textColor: 'warning',
        }}
        display="flex"
      >
        Warning
      </IconText>
      <Block>
        Some information is missing from your <a href="#">profile</a> details.
      </Block>
      <IconText
        iconProps={{
          name: 'fas fa-ban',
          ariaLabel: 'Danger icon',
          textColor: 'danger',
        }}
        display="flex"
      >
        Danger
      </IconText>
      <Block>
        There was an error in your submission. <a href="#">Please try again</a>.
      </Block>
    </div>
  ),
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Multiple IconText components with flex display, each paired with a Block component, showing different notification states (Information, Success, Warning, Danger).',
      },
    },
  },
};
