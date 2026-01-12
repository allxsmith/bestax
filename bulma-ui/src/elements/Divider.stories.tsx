import { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './Divider';
import { Block } from './Block';

const meta: Meta<typeof Divider> = {
  title: 'Elements/Divider',
  component: Divider,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    bgColor: {
      control: 'select',
      options: [
        'primary',
        'link',
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
    m: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
      description: 'Margin size using Bulma m-* classes',
    },
    my: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
      description: 'Vertical margin using Bulma my-* classes',
    },
    className: {
      control: 'text',
      description: 'Custom CSS class',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Divider>;

export const Default: Story = {
  args: {},
  decorators: [
    story => (
      <div style={{ width: '100%' }}>
        <Block>Content above the divider</Block>
        {story()}
        <Block>Content below the divider</Block>
      </div>
    ),
  ],
};

export const WithVerticalMargin: Story = {
  args: {
    my: '6',
  },
  decorators: [
    story => (
      <div style={{ width: '100%' }}>
        <Block>Content above the divider</Block>
        {story()}
        <Block>Content below the divider</Block>
      </div>
    ),
  ],
  name: 'With Vertical Margin',
};

export const PrimaryBackground: Story = {
  args: {
    bgColor: 'primary',
  },
  decorators: [
    story => (
      <div style={{ width: '100%' }}>
        <Block>Content above</Block>
        {story()}
        <Block>Content below</Block>
      </div>
    ),
  ],
  name: 'Primary Background',
};

export const AllColors: Story = {
  render: () => (
    <div style={{ width: '100%' }}>
      <Block>Default Divider</Block>
      <Divider />
      <Block>Primary Divider</Block>
      <Divider bgColor="primary" />
      <Block>Info Divider</Block>
      <Divider bgColor="info" />
      <Block>Success Divider</Block>
      <Divider bgColor="success" />
      <Block>Warning Divider</Block>
      <Divider bgColor="warning" />
      <Block>Danger Divider</Block>
      <Divider bgColor="danger" />
      <Block>End</Block>
    </div>
  ),
  name: 'All Colors',
};

export const SeparatingSections: Story = {
  render: () => (
    <div style={{ width: '100%' }}>
      <h2 className="title is-4">Section One</h2>
      <p>This is the first section of content.</p>
      <Divider my="5" />
      <h2 className="title is-4">Section Two</h2>
      <p>This is the second section of content.</p>
      <Divider my="5" />
      <h2 className="title is-4">Section Three</h2>
      <p>This is the third section of content.</p>
    </div>
  ),
  name: 'Separating Sections',
};
