import { Meta, StoryObj } from '@storybook/react-vite';
import { ListItem } from './ListItem';
import { UnorderedList } from './UnorderedList';
import { OrderedList } from './OrderedList';

const meta: Meta<typeof ListItem> = {
  title: 'Elements/ListItem',
  component: ListItem,
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
    children: {
      control: 'text',
      description: 'Content inside the list item',
    },
  },
};

export default meta;

type Story = StoryObj<typeof ListItem>;

export const Default: Story = {
  args: {
    children: 'Default List Item',
  },
  decorators: [
    story => (
      <UnorderedList>
        {story()}
        <ListItem>Another item</ListItem>
      </UnorderedList>
    ),
  ],
};

export const PrimaryText: Story = {
  args: {
    children: 'Primary colored item',
    textColor: 'primary',
  },
  decorators: [
    story => (
      <UnorderedList>
        {story()}
        <ListItem>Normal item</ListItem>
      </UnorderedList>
    ),
  ],
  name: 'Primary Text Color',
};

export const WithBackground: Story = {
  args: {
    children: 'Item with background',
    bgColor: 'light',
    textColor: 'dark',
    p: '2',
  },
  decorators: [
    story => (
      <UnorderedList>
        {story()}
        <ListItem>Normal item</ListItem>
      </UnorderedList>
    ),
  ],
  name: 'With Background',
};

export const AllColors: Story = {
  render: () => (
    <UnorderedList>
      <ListItem textColor="primary">Primary item</ListItem>
      <ListItem textColor="link">Link item</ListItem>
      <ListItem textColor="info">Info item</ListItem>
      <ListItem textColor="success">Success item</ListItem>
      <ListItem textColor="warning">Warning item</ListItem>
      <ListItem textColor="danger">Danger item</ListItem>
    </UnorderedList>
  ),
  name: 'All Colors',
};

export const InOrderedList: Story = {
  render: () => (
    <OrderedList>
      <ListItem>First item</ListItem>
      <ListItem textColor="success">Second item (success)</ListItem>
      <ListItem>Third item</ListItem>
    </OrderedList>
  ),
  name: 'In Ordered List',
};

export const WithValue: Story = {
  render: () => (
    <OrderedList>
      <ListItem>First item</ListItem>
      <ListItem value={10}>Tenth item</ListItem>
      <ListItem>Eleventh item</ListItem>
    </OrderedList>
  ),
  name: 'With Custom Value',
};

export const WithSpacing: Story = {
  render: () => (
    <UnorderedList>
      <ListItem mb="3" p="2" bgColor="light" textColor="dark">
        Item with margin and padding
      </ListItem>
      <ListItem mb="3" p="2" bgColor="light" textColor="dark">
        Another spaced item
      </ListItem>
      <ListItem p="2" bgColor="light" textColor="dark">
        Last item
      </ListItem>
    </UnorderedList>
  ),
  name: 'With Spacing',
};
