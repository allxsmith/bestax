import { Meta, StoryObj } from '@storybook/react-vite';
import { Menu, MenuLabel, MenuList, MenuItem } from './Menu';

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
      <MenuLabel>General</MenuLabel>
      <MenuList>
        <MenuItem>Dashboard</MenuItem>
        <MenuItem>Customers</MenuItem>
      </MenuList>
      <MenuLabel>Administration</MenuLabel>
      <MenuList>
        <MenuItem>Team Settings</MenuItem>
        <MenuItem active>
          Manage Your Team
          <MenuList>
            <MenuItem>Members</MenuItem>
            <MenuItem>Plugins</MenuItem>
            <MenuItem>Add a member</MenuItem>
          </MenuList>
        </MenuItem>
        <MenuItem>Invitations</MenuItem>
        <MenuItem>Cloud Storage Environment Settings</MenuItem>
        <MenuItem>Authentication</MenuItem>
      </MenuList>
      <MenuLabel>Transactions</MenuLabel>
      <MenuList>
        <MenuItem>Payments</MenuItem>
        <MenuItem>Transfers</MenuItem>
        <MenuItem>Balance</MenuItem>
      </MenuList>
    </Menu>
  ),
};
