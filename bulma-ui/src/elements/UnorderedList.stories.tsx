import { Meta, StoryObj } from '@storybook/react-vite';
import { UnorderedList } from './UnorderedList';
import { ListItem } from './ListItem';

const meta: Meta<typeof UnorderedList> = {
  title: 'Elements/UnorderedList',
  component: UnorderedList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    textColor: {
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
      description: 'Text color using Bulma has-text-* classes',
    },
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
    p: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5', '6', 'auto'],
      description: 'Padding size using Bulma p-* classes',
    },
    className: {
      control: 'text',
      description: 'Custom CSS class',
    },
  },
};

export default meta;

type Story = StoryObj<typeof UnorderedList>;

export const Default: Story = {
  render: () => (
    <UnorderedList>
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </UnorderedList>
  ),
};

export const PrimaryText: Story = {
  render: () => (
    <UnorderedList textColor="primary">
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </UnorderedList>
  ),
  name: 'Primary Text Color',
};

export const WithBackground: Story = {
  render: () => (
    <UnorderedList bgColor="light" textColor="dark" p="4">
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </UnorderedList>
  ),
  name: 'With Background',
};

export const NestedList: Story = {
  render: () => (
    <UnorderedList>
      <ListItem>First item</ListItem>
      <ListItem>
        Second item with nested list
        <UnorderedList>
          <ListItem>Nested item 1</ListItem>
          <ListItem>Nested item 2</ListItem>
        </UnorderedList>
      </ListItem>
      <ListItem>Third item</ListItem>
    </UnorderedList>
  ),
  name: 'Nested List',
};

export const ColoredItems: Story = {
  render: () => (
    <UnorderedList>
      <ListItem textColor="primary">Primary item</ListItem>
      <ListItem textColor="success">Success item</ListItem>
      <ListItem textColor="warning">Warning item</ListItem>
      <ListItem textColor="danger">Danger item</ListItem>
    </UnorderedList>
  ),
  name: 'Colored Items',
};

export const WithSpacing: Story = {
  render: () => (
    <UnorderedList m="4">
      <ListItem mb="2">First item with margin</ListItem>
      <ListItem mb="2">Second item with margin</ListItem>
      <ListItem>Third item</ListItem>
    </UnorderedList>
  ),
  name: 'With Spacing',
};
