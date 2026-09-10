import React from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import { Menu } from './Menu';
import { Button } from '../elements/Button';

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

export const CompoundUsage: Story = {
  render: () => (
    <Menu>
      <Menu.Label>General</Menu.Label>
      <Menu.List>
        <Menu.Item active>Dashboard</Menu.Item>
        <Menu.Item>Customers</Menu.Item>
      </Menu.List>
      <Menu.Label>Administration</Menu.Label>
      <Menu.List>
        <Menu.Item>Team Settings</Menu.Item>
        <Menu.Item>Invitations</Menu.Item>
      </Menu.List>
    </Menu>
  ),
};

// Forwarded ref — Menu.Item's ref reaches the inner element `as` renders,
// not the wrapping <li>, because `as` is what names it.
const MenuForwardedRefDemo = () => {
  const itemRef = React.useRef<HTMLAnchorElement>(null);

  return (
    <>
      <Button mb="3" onClick={() => itemRef.current?.focus()}>
        Focus &ldquo;Customers&rdquo;
      </Button>
      <Menu>
        <Menu.Label>General</Menu.Label>
        <Menu.List>
          <Menu.Item href="#dashboard">Dashboard</Menu.Item>
          <Menu.Item href="#customers" ref={itemRef}>
            Customers
          </Menu.Item>
        </Menu.List>
      </Menu>
    </>
  );
};

export const ForwardedRef: Story = {
  render: () => <MenuForwardedRefDemo />,
  name: 'Forwarded ref (inner element, not the `<li>`)',
};
