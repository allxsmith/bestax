import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import { Menu } from './Menu';
import { Block } from '../elements/Block';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Column } from '../columns/Column';
import { Columns } from '../columns/Columns';

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
        <Menu.Item href="#dashboard">Dashboard</Menu.Item>
        <Menu.Item href="#customers">Customers</Menu.Item>
      </Menu.List>
      <Menu.Label>Administration</Menu.Label>
      <Menu.List>
        <Menu.Item href="#team-settings">Team Settings</Menu.Item>
        <Menu.Item active href="#manage-your-team">
          Manage Your Team
          <Menu.List>
            <Menu.Item href="#members">Members</Menu.Item>
            <Menu.Item href="#plugins">Plugins</Menu.Item>
            <Menu.Item href="#add-a-member">Add a member</Menu.Item>
          </Menu.List>
        </Menu.Item>
        <Menu.Item href="#invitations">Invitations</Menu.Item>
        <Menu.Item href="#cloud-storage">
          Cloud Storage Environment Settings
        </Menu.Item>
        <Menu.Item href="#authentication">Authentication</Menu.Item>
      </Menu.List>
      <Menu.Label>Transactions</Menu.Label>
      <Menu.List>
        <Menu.Item href="#payments">Payments</Menu.Item>
        <Menu.Item href="#transfers">Transfers</Menu.Item>
        <Menu.Item href="#balance">Balance</Menu.Item>
      </Menu.List>
    </Menu>
  ),
};

/** A docs sidebar's link groups, for `Menu.Section`. */
const DOCS = [
  {
    label: 'Getting started',
    links: ['Installation', 'Quick start', 'Theming'],
  },
  {
    label: 'Components',
    links: ['Button', 'Card', 'Menu', 'Modal'],
  },
  {
    label: 'Form',
    links: ['Input', 'Select', 'Checkbox'],
  },
  {
    label: 'Helpers',
    links: ['Spacing', 'Color', 'Typography'],
  },
];

const slug = (text: string) => `#${text.toLowerCase().replace(/\s+/g, '-')}`;

/** Keeps a story's menu to about a sidebar's width. */
function Narrow({ children }: { children: React.ReactNode }) {
  return (
    <Columns>
      <Column size="one-third">{children}</Column>
    </Columns>
  );
}

/**
 * A docs sidebar whose groups of links open and close. Each heading is a
 * button, and the links under an open one are ordinary links, each its own
 * tab stop. The group holding the current page starts open.
 */
export const Sections: Story = {
  render: () => (
    <Narrow>
      <nav aria-label="Documentation">
        <Menu>
          {DOCS.map(group => (
            <Menu.Section
              key={group.label}
              label={group.label}
              defaultOpen={group.label === 'Components'}
            >
              <Menu.List>
                {group.links.map(link => (
                  <Menu.Item
                    key={link}
                    href={slug(link)}
                    active={link === 'Card'}
                  >
                    {link}
                  </Menu.Item>
                ))}
              </Menu.List>
            </Menu.Section>
          ))}
        </Menu>
      </nav>
    </Narrow>
  ),
};

const ControlledSectionsDemo = () => {
  const [open, setOpen] = useState<string[]>(['Components']);
  const setGroup = (label: string, isOpen: boolean) =>
    setOpen(current =>
      isOpen ? [...current, label] : current.filter(l => l !== label)
    );

  return (
    <Narrow>
      <Buttons mb="3">
        <Button size="small" onClick={() => setOpen(DOCS.map(g => g.label))}>
          Open all
        </Button>
        <Button size="small" onClick={() => setOpen([])}>
          Close all
        </Button>
      </Buttons>
      <nav aria-label="Documentation">
        <Menu>
          {DOCS.map(group => (
            <Menu.Section
              key={group.label}
              label={group.label}
              open={open.includes(group.label)}
              onOpenChange={isOpen => setGroup(group.label, isOpen)}
            >
              <Menu.List>
                {group.links.map(link => (
                  <Menu.Item key={link} href={slug(link)}>
                    {link}
                  </Menu.Item>
                ))}
              </Menu.List>
            </Menu.Section>
          ))}
        </Menu>
      </nav>
    </Narrow>
  );
};

/** Sections whose open state the app holds, through `open` and `onOpenChange`. */
export const ControlledSections: Story = {
  render: () => <ControlledSectionsDemo />,
};

/** The chevron sits at the end of the heading and points that way while closed. */
export const SectionsRightToLeft: Story = {
  render: () => (
    <Block dir="rtl">
      <Narrow>
        <Menu>
          {DOCS.slice(0, 3).map((group, i) => (
            <Menu.Section
              key={group.label}
              label={group.label}
              defaultOpen={i === 0}
            >
              <Menu.List>
                {group.links.map(link => (
                  <Menu.Item key={link} href={slug(link)}>
                    {link}
                  </Menu.Item>
                ))}
              </Menu.List>
            </Menu.Section>
          ))}
        </Menu>
      </Narrow>
    </Block>
  ),
};

export const CompoundUsage: Story = {
  render: () => (
    <Menu>
      <Menu.Label>General</Menu.Label>
      <Menu.List>
        <Menu.Item active href="#dashboard">
          Dashboard
        </Menu.Item>
        <Menu.Item href="#customers">Customers</Menu.Item>
      </Menu.List>
      <Menu.Label>Administration</Menu.Label>
      <Menu.List>
        <Menu.Item href="#team-settings">Team Settings</Menu.Item>
        <Menu.Item href="#invitations">Invitations</Menu.Item>
      </Menu.List>
      <Menu.Section label="Transactions">
        <Menu.List>
          <Menu.Item href="#payments">Payments</Menu.Item>
          <Menu.Item href="#transfers">Transfers</Menu.Item>
        </Menu.List>
      </Menu.Section>
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
