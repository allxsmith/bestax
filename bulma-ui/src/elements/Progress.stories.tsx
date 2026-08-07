import { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './Progress';

const meta: Meta<typeof Progress> = {
  title: 'Elements/Progress',
  component: Progress,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: [
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'black',
        'white',
        'light',
        'dark',
      ],
      description:
        'Bulma color modifier (`is-<color>`); only CSS-backed values are listed.',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size modifier for the progress bar.',
    },
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Current value of the progress bar.',
    },
    max: {
      control: { type: 'number', min: 1 },
      description: 'Maximum value of the progress bar.',
    },
    m: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
      description: 'Bulma margin helper.',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 50,
    max: 100,
  },
};

export const Primary: Story = {
  args: {
    color: 'primary',
    value: 75,
    max: 100,
  },
};

export const Success: Story = {
  args: {
    color: 'success',
    value: 90,
    max: 100,
  },
};

export const Warning: Story = {
  args: {
    color: 'warning',
    value: 30,
    max: 100,
  },
};

export const Danger: Story = {
  args: {
    color: 'danger',
    value: 10,
    max: 100,
  },
};

export const Info: Story = {
  args: {
    color: 'info',
    value: 60,
    max: 100,
  },
};

export const Link: Story = {
  args: {
    color: 'link',
    value: 80,
    max: 100,
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    value: 50,
    max: 100,
  },
};

export const Medium: Story = {
  args: {
    size: 'medium',
    value: 50,
    max: 100,
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    value: 50,
    max: 100,
  },
};

export const WithMargin: Story = {
  args: {
    value: 50,
    max: 100,
    m: '4',
  },
};

export const Indeterminate: Story = {
  args: {
    color: 'primary',
  },
};

export const WithCustomContent: Story = {
  args: {
    value: 50,
    max: 100,
    children: '50% Complete',
  },
};

export const MultipleIndeterminate: Story = {
  render: () => (
    <>
      <Progress className="is-small is-primary" max={100} />
      <Progress className="is-danger" max={100} />
      <Progress className="is-medium is-dark" max={100} />
      <Progress className="is-large is-info" max={100} />
    </>
  ),
};
