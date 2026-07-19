import { Meta, StoryObj } from '@storybook/react-vite';
import { OrderedList } from './OrderedList';
import { ListItem } from './ListItem';
import { Content } from './Content';

const meta: Meta<typeof OrderedList> = {
  title: 'Elements/OrderedList',
  component: OrderedList,
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
    type: {
      control: 'select',
      options: ['1', 'a', 'A', 'i', 'I'],
      description: 'The numbering type for the list',
    },
    start: {
      control: 'number',
      description: 'The starting number for the list',
    },
    reversed: {
      control: 'boolean',
      description: 'Whether to reverse the list numbering',
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

type Story = StoryObj<typeof OrderedList>;

export const Default: Story = {
  render: () => (
    <Content>
      <OrderedList>
        <ListItem>First item</ListItem>
        <ListItem>Second item</ListItem>
        <ListItem>Third item</ListItem>
      </OrderedList>
    </Content>
  ),
};

export const AlphabeticLowercase: Story = {
  render: () => (
    <Content>
      <OrderedList type="a">
        <ListItem>First item</ListItem>
        <ListItem>Second item</ListItem>
        <ListItem>Third item</ListItem>
      </OrderedList>
    </Content>
  ),
};

export const AlphabeticUppercase: Story = {
  render: () => (
    <Content>
      <OrderedList type="A">
        <ListItem>First item</ListItem>
        <ListItem>Second item</ListItem>
        <ListItem>Third item</ListItem>
      </OrderedList>
    </Content>
  ),
};

export const RomanNumerals: Story = {
  render: () => (
    <Content>
      <OrderedList type="I">
        <ListItem>First item</ListItem>
        <ListItem>Second item</ListItem>
        <ListItem>Third item</ListItem>
      </OrderedList>
    </Content>
  ),
};

export const StartingNumber: Story = {
  render: () => (
    <Content>
      <OrderedList start={5}>
        <ListItem>Fifth item</ListItem>
        <ListItem>Sixth item</ListItem>
        <ListItem>Seventh item</ListItem>
      </OrderedList>
    </Content>
  ),
  name: 'Custom Starting Number',
};

export const Reversed: Story = {
  render: () => (
    <Content>
      <OrderedList reversed>
        <ListItem>Third item (shown as 3)</ListItem>
        <ListItem>Second item (shown as 2)</ListItem>
        <ListItem>First item (shown as 1)</ListItem>
      </OrderedList>
    </Content>
  ),
  name: 'Reversed Order',
};

export const PrimaryText: Story = {
  render: () => (
    <Content>
      <OrderedList textColor="primary">
        <ListItem>First item</ListItem>
        <ListItem>Second item</ListItem>
        <ListItem>Third item</ListItem>
      </OrderedList>
    </Content>
  ),
  name: 'Primary Text Color',
};

export const WithBackground: Story = {
  render: () => (
    <Content bgColor="light" textColor="dark" p="4">
      <OrderedList>
        <ListItem>First item</ListItem>
        <ListItem>Second item</ListItem>
        <ListItem>Third item</ListItem>
      </OrderedList>
    </Content>
  ),
};

export const NestedList: Story = {
  render: () => (
    <Content>
      <OrderedList>
        <ListItem>First item</ListItem>
        <ListItem>
          Second item with nested list
          <OrderedList type="a">
            <ListItem>Nested item a</ListItem>
            <ListItem>Nested item b</ListItem>
          </OrderedList>
        </ListItem>
        <ListItem>Third item</ListItem>
      </OrderedList>
    </Content>
  ),
};

export const CompoundUsage: Story = {
  render: () => (
    <Content>
      <OrderedList>
        <OrderedList.Item>First item via dot notation</OrderedList.Item>
        <OrderedList.Item>Second item via dot notation</OrderedList.Item>
      </OrderedList>
    </Content>
  ),
};
