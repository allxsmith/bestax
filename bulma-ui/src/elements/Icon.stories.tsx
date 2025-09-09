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
    variant: { control: 'text' },
    features: { control: 'object' },
    libraryFeatures: { control: 'object' }, // deprecated
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
          'A Bulma Icon component for displaying icons from multiple libraries (Font Awesome, Material Design Icons, Ionicons, Google Material Icons, and Material Symbols) with Bulma styling.',
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
    variant: 'solid',
    features: 'fa-2x',
    ariaLabel: 'Star icon large',
  },
};

export const FontAwesomeSpin: Story = {
  args: {
    name: 'spinner',
    variant: 'solid',
    features: ['fa-spin', 'fa-2x'],
    ariaLabel: 'Loading spinner',
  },
};

export const FontAwesomeBorderFw: Story = {
  args: {
    name: 'star',
    variant: 'solid',
    features: ['fa-fw', 'fa-border', 'fa-lg'],
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

export const MaterialDesignIcon: Story = {
  args: {
    name: 'home',
    library: 'mdi',
    ariaLabel: 'Material Design home icon',
  },
};

export const IoniconExample: Story = {
  args: {
    name: 'settings',
    library: 'ion',
    ariaLabel: 'Ionicons web component settings',
  },
};

export const GoogleMaterialIcon: Story = {
  args: {
    name: 'visibility',
    library: 'material-icons',
    ariaLabel: 'Google Material favorite icon',
  },
};

export const GoogleMaterialIconOutlined: Story = {
  args: {
    name: 'visibility',
    library: 'material-icons',
    variant: 'outlined',
    ariaLabel: 'Google Material favorite icon outlined',
  },
};

export const GoogleMaterialIconRound: Story = {
  args: {
    name: 'favorite',
    library: 'material-icons',
    variant: 'round',
    ariaLabel: 'Google Material favorite icon round',
  },
};

export const MaterialSymbolsDefault: Story = {
  args: {
    name: 'settings',
    library: 'material-symbols',
    ariaLabel: 'Material Symbols settings (outlined)',
  },
};

export const MaterialSymbolsRounded: Story = {
  args: {
    name: 'star',
    library: 'material-symbols',
    variant: 'rounded',
    ariaLabel: 'Material Symbols star rounded',
  },
};

export const MaterialSymbolsSharp: Story = {
  args: {
    name: 'home',
    library: 'material-symbols',
    variant: 'sharp',
    ariaLabel: 'Material Symbols home sharp',
  },
};

export const FontAwesomeBrands: Story = {
  args: {
    name: 'github',
    library: 'fa',
    variant: 'brands',
    ariaLabel: 'GitHub brand icon',
  },
};

export const IoniconOutline: Story = {
  args: {
    name: 'heart',
    library: 'ion',
    variant: 'outline',
    ariaLabel: 'Ionicon heart outline',
  },
};

export const IoniconSharp: Story = {
  args: {
    name: 'settings',
    library: 'ion',
    variant: 'sharp',
    ariaLabel: 'Ionicon settings sharp',
  },
};

export const MaterialIconsWithFeatures: Story = {
  args: {
    name: 'star',
    library: 'material-icons',
    variant: 'outlined',
    features: 'is-size-1',
    ariaLabel: 'Material Icons with size feature',
  },
};
