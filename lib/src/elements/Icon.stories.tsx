import { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon';
import {
  validColors,
  validSizes,
  validTextSizes,
} from '../helpers/useBulmaClasses';

const meta: Meta<typeof Icon> = {
  title: 'Elements/Icon',
  component: Icon,
  argTypes: {
    className: { control: 'text' },
    name: { control: 'text' },
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
  },
  parameters: {
    docs: {
      description: {
        component:
          'A Bulma Icon component for displaying icons (e.g., Font Awesome) with Bulma styling. Uses useBulmaClasses for helper classes.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Icon>;

export const Default: Story = {
  args: {
    name: 'fas fa-star',
    ariaLabel: 'Star icon',
  },
};

export const Small: Story = {
  args: {
    name: 'fas fa-star',
    size: 'small',
    ariaLabel: 'Star icon',
  },
};

export const Medium: Story = {
  args: {
    name: 'fas fa-star',
    size: 'medium',
    ariaLabel: 'Star icon',
  },
};

export const Large: Story = {
  args: {
    name: 'fas fa-star',
    size: 'large',
    ariaLabel: 'Star icon',
  },
};

export const WithTextColor: Story = {
  args: {
    name: 'fas fa-star',
    textColor: 'primary',
    ariaLabel: 'Star icon',
  },
};

export const WithMargin: Story = {
  args: {
    name: 'fas fa-star',
    m: '2',
    ariaLabel: 'Star icon',
  },
};
