import { Meta, StoryObj } from '@storybook/react-vite';
import { Menu } from './Menu';

const meta: Meta<typeof Menu> = {
  title: 'Components/Menu',
  component: Menu,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Menu>;

export const Basic: Story = {
  render: () => (
    <Menu style={{ maxWidth: 300 }}>
      <Menu.Label>General</Menu.Label>
      <Menu.List>
        <Menu.Item>Dashboard</Menu.Item>
        <Menu.Item>Customers</Menu.Item>
      </Menu.List>
      <Menu.Label>Administration</Menu.Label>
      <Menu.List>
        <Menu.Item>Team Settings</Menu.Item>
        <Menu.Item active>
          Manage Your Team
          <Menu.List>
            <Menu.Item>Members</Menu.Item>
            <Menu.Item>Plugins</Menu.Item>
            <Menu.Item>Add a member</Menu.Item>
          </Menu.List>
        </Menu.Item>
        <Menu.Item>Invitations</Menu.Item>
        <Menu.Item>Cloud Storage Environment Settings</Menu.Item>
        <Menu.Item>Authentication</Menu.Item>
      </Menu.List>
      <Menu.Label>Transactions</Menu.Label>
      <Menu.List>
        <Menu.Item>Payments</Menu.Item>
        <Menu.Item>Transfers</Menu.Item>
        <Menu.Item>Balance</Menu.Item>
      </Menu.List>
    </Menu>
  ),
};
