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
    libraryFeatures: { control: 'object' },
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
          'A Bulma Icon component for displaying Font Awesome icons with Bulma styling.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Icon>;

export const Default: Story = {
  args: {
    name: 'star',
    ariaLabel: 'Star icon',
  },
};

export const FontAwesomeLarge: Story = {
  args: {
    name: 'star',
    libraryFeatures: ['fas', 'fa-2x'],
    ariaLabel: 'Star icon large',
  },
};

export const FontAwesomeSpin: Story = {
  args: {
    name: 'spinner',
    libraryFeatures: ['fas', 'fa-spin', 'fa-2x'],
    ariaLabel: 'Loading spinner',
  },
};

export const FontAwesomeBorderFw: Story = {
  args: {
    name: 'star',
    libraryFeatures: ['fas', 'fa-fw', 'fa-border', 'fa-lg'],
    ariaLabel: 'Star bordered fixed width',
  },
};

export const WithTextColor: Story = {
  args: {
    name: 'star',
    textColor: 'primary',
    ariaLabel: 'Star icon with primary text color',
  },
};

export const WithMargin: Story = {
  args: {
    name: 'star',
    m: '2',
    ariaLabel: 'Star icon with margin',
  },
};

export const WithSize: Story = {
  args: {
    name: 'star',
    size: 'large',
    ariaLabel: 'Star icon large container',
  },
};
