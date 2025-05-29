import { Meta, StoryObj } from '@storybook/react';
import { Buttons } from './Buttons';
import { Button } from './Button';
import { IconText } from './IconText';
import { Block } from './Block';
import {
  validColors,
  validSizes,
  validTextSizes,
} from '../helpers/useBulmaClasses';

const meta: Meta<typeof Buttons> = {
  title: 'Components/Buttons',
  component: Buttons,
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
    isCentered: { control: 'boolean' },
    isRight: { control: 'boolean' },
    hasAddons: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A Bulma Buttons component that wraps multiple Button components in a buttons container for alignment and spacing. Uses useBulmaClasses for helper classes.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Buttons>;

export const Default: Story = {
  render: () => (
    <Buttons>
      <Button>Primary</Button>
      <Button color="info">Info</Button>
      <Button color="success">Success</Button>
    </Buttons>
  ),
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default Buttons wrapper with multiple buttons in a row.',
      },
    },
  },
};

export const Centered: Story = {
  render: () => (
    <Buttons isCentered>
      <Button>Primary</Button>
      <Button color="info">Info</Button>
      <Button color="success">Success</Button>
    </Buttons>
  ),
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Buttons wrapper with centered alignment using is-centered.',
      },
    },
  },
};

export const RightAligned: Story = {
  render: () => (
    <Buttons isRight>
      <Button>Primary</Button>
      <Button color="info">Info</Button>
      <Button color="success">Success</Button>
    </Buttons>
  ),
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Buttons wrapper with right alignment using is-right.',
      },
    },
  },
};

export const WithAddons: Story = {
  render: () => (
    <Buttons hasAddons>
      <Button>Left</Button>
      <Button>Center</Button>
      <Button>Right</Button>
    </Buttons>
  ),
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Buttons wrapper with has-addons for grouped buttons.',
      },
    },
  },
};

export const WithIconText: Story = {
  render: () => (
    <Buttons isCentered>
      <Button color="primary">
        <IconText
          iconProps={{
            name: 'fas fa-check',
            ariaLabel: 'Check icon',
            textColor: 'white',
          }}
        >
          Confirm
        </IconText>
      </Button>
      <Button color="danger">
        <IconText
          iconProps={{
            name: 'fas fa-times',
            ariaLabel: 'Cancel icon',
            textColor: 'white',
          }}
        >
          Cancel
        </IconText>
      </Button>
    </Buttons>
  ),
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Buttons wrapper with buttons containing IconText components.',
      },
    },
  },
};

export const WithBlock: Story = {
  render: () => (
    <Block>
      <Buttons isCentered>
        <Button color="success">Save</Button>
        <Button color="warning">Edit</Button>
        <Button color="danger">Delete</Button>
      </Buttons>
    </Block>
  ),
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Buttons wrapper within a Block component for spaced layout.',
      },
    },
  },
};

export const WithIconTextAndAddons: Story = {
  render: () => (
    <Buttons hasAddons isCentered>
      <Button color="info">
        <IconText
          iconProps={{
            name: 'fas fa-search',
            ariaLabel: 'Search icon',
            textColor: 'white',
          }}
        >
          Search
        </IconText>
      </Button>
      <Button color="info" isLight>
        <IconText
          iconProps={{
            name: 'fas fa-filter',
            ariaLabel: 'Filter icon',
            textColor: 'dark',
          }}
        >
          Filter
        </IconText>
      </Button>
    </Buttons>
  ),
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Buttons wrapper with has-addons and buttons containing IconText components.',
      },
    },
  },
};
