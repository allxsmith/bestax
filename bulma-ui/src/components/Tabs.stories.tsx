import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import Tabs from './Tabs';
import { Block } from '../elements/Block';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Icon } from '../elements/Icon';
import { Notification } from '../elements/Notification';
import { Paragraph } from '../elements/Paragraph';
import { Title } from '../elements/Title';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A stateful tab component with content panels, vertical layout, and compound subcomponents. Supports controlled and uncontrolled modes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    align: {
      control: 'select',
      options: ['left', 'centered', 'right'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    color: {
      control: 'select',
      options: [
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
        'black',
        'dark',
        'light',
        'white',
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs>
      <Tabs.List>
        <Tabs.Tab index={0}>Pictures</Tabs.Tab>
        <Tabs.Tab index={1}>Music</Tabs.Tab>
        <Tabs.Tab index={2}>Videos</Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>
          <Paragraph>Browse your photo library and recent uploads.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={1}>
          <Paragraph>Listen to your favourite tracks and playlists.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={2}>
          <Paragraph>Watch saved videos and streaming content.</Paragraph>
        </Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [active, setActive] = useState(0);
    return (
      <Block>
        <Paragraph>
          Active tab: <strong>{active}</strong>
        </Paragraph>
        <Tabs value={active} onChange={setActive}>
          <Tabs.List>
            <Tabs.Tab index={0}>Overview</Tabs.Tab>
            <Tabs.Tab index={1}>Details</Tabs.Tab>
            <Tabs.Tab index={2}>Reviews</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0}>
              <Paragraph>Product overview and summary.</Paragraph>
            </Tabs.Content.Item>
            <Tabs.Content.Item index={1}>
              <Paragraph>Specifications and technical details.</Paragraph>
            </Tabs.Content.Item>
            <Tabs.Content.Item index={2}>
              <Paragraph>Customer reviews and ratings.</Paragraph>
            </Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      </Block>
    );
  },
};

export const ExternalNavigation: Story = {
  render: () => {
    const tabs = ['Account', 'Security', 'Notifications', 'Billing'];
    const [active, setActive] = useState(0);

    const goPrev = () => setActive((i) => Math.max(0, i - 1));
    const goNext = () => setActive((i) => Math.min(tabs.length - 1, i + 1));

    return (
      <Block>
        <Tabs value={active} onChange={setActive}>
          <Tabs.List>
            {tabs.map((label, i) => (
              <Tabs.Tab key={i} index={i}>
                {label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0}>
              <Paragraph>Manage your account details and display name.</Paragraph>
            </Tabs.Content.Item>
            <Tabs.Content.Item index={1}>
              <Paragraph>Update your password and two-factor authentication.</Paragraph>
            </Tabs.Content.Item>
            <Tabs.Content.Item index={2}>
              <Paragraph>Choose which notifications you receive.</Paragraph>
            </Tabs.Content.Item>
            <Tabs.Content.Item index={3}>
              <Paragraph>View invoices and manage your subscription.</Paragraph>
            </Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
        <Buttons>
          <Button onClick={goPrev} isDisabled={active === 0}>
            Previous
          </Button>
          <Button onClick={goNext} isDisabled={active === tabs.length - 1} color="primary">
            Next
          </Button>
        </Buttons>
      </Block>
    );
  },
};

export const AlignmentCentered: Story = {
  render: () => (
    <Tabs align="centered">
      <Tabs.List>
        <Tabs.Tab index={0}>Home</Tabs.Tab>
        <Tabs.Tab index={1}>Profile</Tabs.Tab>
        <Tabs.Tab index={2}>Settings</Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>
          <Paragraph>Welcome home.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={1}>
          <Paragraph>Your profile information.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={2}>
          <Paragraph>Application settings.</Paragraph>
        </Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  ),
};

export const AlignmentRight: Story = {
  render: () => (
    <Tabs align="right">
      <Tabs.List>
        <Tabs.Tab index={0}>Home</Tabs.Tab>
        <Tabs.Tab index={1}>Profile</Tabs.Tab>
        <Tabs.Tab index={2}>Settings</Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>
          <Paragraph>Welcome home.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={1}>
          <Paragraph>Your profile information.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={2}>
          <Paragraph>Application settings.</Paragraph>
        </Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  ),
};

export const SmallTabs: Story = {
  render: () => (
    <Tabs size="small">
      <Tabs.List>
        <Tabs.Tab index={0}>Tab 1</Tabs.Tab>
        <Tabs.Tab index={1}>Tab 2</Tabs.Tab>
        <Tabs.Tab index={2}>Tab 3</Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>
          <Paragraph>Small tab content 1.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={1}>
          <Paragraph>Small tab content 2.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={2}>
          <Paragraph>Small tab content 3.</Paragraph>
        </Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  ),
};

export const MediumTabs: Story = {
  render: () => (
    <Tabs size="medium">
      <Tabs.List>
        <Tabs.Tab index={0}>Tab 1</Tabs.Tab>
        <Tabs.Tab index={1}>Tab 2</Tabs.Tab>
        <Tabs.Tab index={2}>Tab 3</Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>
          <Paragraph>Medium tab content 1.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={1}>
          <Paragraph>Medium tab content 2.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={2}>
          <Paragraph>Medium tab content 3.</Paragraph>
        </Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  ),
};

export const LargeTabs: Story = {
  render: () => (
    <Tabs size="large">
      <Tabs.List>
        <Tabs.Tab index={0}>Tab 1</Tabs.Tab>
        <Tabs.Tab index={1}>Tab 2</Tabs.Tab>
        <Tabs.Tab index={2}>Tab 3</Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>
          <Paragraph>Large tab content 1.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={1}>
          <Paragraph>Large tab content 2.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={2}>
          <Paragraph>Large tab content 3.</Paragraph>
        </Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  ),
};

export const BoxedTabs: Story = {
  render: () => (
    <Tabs boxed>
      <Tabs.List>
        <Tabs.Tab index={0}>Overview</Tabs.Tab>
        <Tabs.Tab index={1}>Elements</Tabs.Tab>
        <Tabs.Tab index={2}>Components</Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>
          <Box>
            <Paragraph>Boxed tab overview content inside a Box.</Paragraph>
          </Box>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={1}>
          <Box>
            <Paragraph>Elements documentation goes here.</Paragraph>
          </Box>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={2}>
          <Box>
            <Paragraph>Components documentation goes here.</Paragraph>
          </Box>
        </Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  ),
};

export const ToggleTabs: Story = {
  render: () => (
    <Tabs toggle>
      <Tabs.List>
        <Tabs.Tab index={0}>All</Tabs.Tab>
        <Tabs.Tab index={1}>Active</Tabs.Tab>
        <Tabs.Tab index={2}>Completed</Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>
          <Paragraph>Showing all items.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={1}>
          <Paragraph>Showing active items only.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={2}>
          <Paragraph>Showing completed items only.</Paragraph>
        </Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  ),
};

export const ToggleRoundedTabs: Story = {
  render: () => (
    <Tabs toggle rounded>
      <Tabs.List>
        <Tabs.Tab index={0}>All</Tabs.Tab>
        <Tabs.Tab index={1}>Active</Tabs.Tab>
        <Tabs.Tab index={2}>Completed</Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>
          <Paragraph>Showing all items.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={1}>
          <Paragraph>Showing active items only.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={2}>
          <Paragraph>Showing completed items only.</Paragraph>
        </Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  ),
};

export const FullwidthTabs: Story = {
  render: () => (
    <Tabs fullwidth>
      <Tabs.List>
        <Tabs.Tab index={0}>One</Tabs.Tab>
        <Tabs.Tab index={1}>Two</Tabs.Tab>
        <Tabs.Tab index={2}>Three</Tabs.Tab>
        <Tabs.Tab index={3}>Four</Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>
          <Paragraph>First panel.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={1}>
          <Paragraph>Second panel.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={2}>
          <Paragraph>Third panel.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={3}>
          <Paragraph>Fourth panel.</Paragraph>
        </Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs>
      <Tabs.List>
        <Tabs.Tab index={0} icon="image">
          Pictures
        </Tabs.Tab>
        <Tabs.Tab index={1} icon="music">
          Music
        </Tabs.Tab>
        <Tabs.Tab index={2} icon="film">
          Videos
        </Tabs.Tab>
        <Tabs.Tab index={3} icon="file-alt">
          Documents
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>
          <Paragraph>Your picture gallery.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={1}>
          <Paragraph>Your music library.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={2}>
          <Paragraph>Your video collection.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={3}>
          <Paragraph>Your documents.</Paragraph>
        </Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  ),
};

export const VerticalLeft: Story = {
  render: () => (
    <Tabs vertical>
      <Tabs.List>
        <Tabs.Tab index={0}>Account</Tabs.Tab>
        <Tabs.Tab index={1}>Security</Tabs.Tab>
        <Tabs.Tab index={2}>Notifications</Tabs.Tab>
        <Tabs.Tab index={3}>Billing</Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>
          <Title size="5">Account Settings</Title>
          <Paragraph>
            Manage your account details, profile picture, and display name.
          </Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={1}>
          <Title size="5">Security Settings</Title>
          <Paragraph>
            Update your password, enable two-factor authentication, and manage
            sessions.
          </Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={2}>
          <Title size="5">Notification Preferences</Title>
          <Paragraph>
            Choose which notifications you receive by email or push.
          </Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={3}>
          <Title size="5">Billing</Title>
          <Paragraph>
            View invoices, update payment methods, and manage your subscription.
          </Paragraph>
        </Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  ),
};

export const VerticalRight: Story = {
  render: () => (
    <Tabs vertical side="right">
      <Tabs.List>
        <Tabs.Tab index={0}>General</Tabs.Tab>
        <Tabs.Tab index={1}>Appearance</Tabs.Tab>
        <Tabs.Tab index={2}>Advanced</Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>
          <Paragraph>General application settings and preferences.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={1}>
          <Paragraph>Theme, colour scheme, and font settings.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={2}>
          <Notification color="warning">
            Advanced settings can affect system stability.
          </Notification>
          <Paragraph>Developer options and experimental features.</Paragraph>
        </Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  ),
};

export const VerticalExpanded: Story = {
  render: () => (
    <div style={{ height: '400px' }}>
      <Tabs vertical expanded>
        <Tabs.List>
          <Tabs.Tab index={0}>Dashboard</Tabs.Tab>
          <Tabs.Tab index={1}>Analytics</Tabs.Tab>
          <Tabs.Tab index={2}>Reports</Tabs.Tab>
          <Tabs.Tab index={3}>Settings</Tabs.Tab>
        </Tabs.List>
        <Tabs.Content>
          <Tabs.Content.Item index={0}>
            <Paragraph>Dashboard overview with key metrics.</Paragraph>
          </Tabs.Content.Item>
          <Tabs.Content.Item index={1}>
            <Paragraph>Traffic analytics and user engagement data.</Paragraph>
          </Tabs.Content.Item>
          <Tabs.Content.Item index={2}>
            <Paragraph>Generate and download reports.</Paragraph>
          </Tabs.Content.Item>
          <Tabs.Content.Item index={3}>
            <Paragraph>Application configuration.</Paragraph>
          </Tabs.Content.Item>
        </Tabs.Content>
      </Tabs>
    </div>
  ),
};

export const VerticalWithIcons: Story = {
  render: () => (
    <Tabs vertical>
      <Tabs.List>
        <Tabs.Tab index={0} icon="user">
          Account
        </Tabs.Tab>
        <Tabs.Tab index={1} icon="lock">
          Security
        </Tabs.Tab>
        <Tabs.Tab index={2} icon="bell">
          Notifications
        </Tabs.Tab>
        <Tabs.Tab index={3} icon="credit-card">
          Billing
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>
          <Title size="5">Account Settings</Title>
          <Paragraph>
            Manage your account details, profile picture, and display name.
          </Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={1}>
          <Title size="5">Security Settings</Title>
          <Paragraph>
            Update your password, enable two-factor authentication, and manage
            sessions.
          </Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={2}>
          <Title size="5">Notification Preferences</Title>
          <Paragraph>
            Choose which notifications you receive by email or push.
          </Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={3}>
          <Title size="5">Billing</Title>
          <Paragraph>
            View invoices, update payment methods, and manage your subscription.
          </Paragraph>
        </Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  ),
};

export const VerticalRightWithIcons: Story = {
  render: () => (
    <Tabs vertical side="right">
      <Tabs.List>
        <Tabs.Tab index={0} icon="cog">
          General
        </Tabs.Tab>
        <Tabs.Tab index={1} icon="palette">
          Appearance
        </Tabs.Tab>
        <Tabs.Tab index={2} icon="wrench">
          Advanced
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>
          <Paragraph>General application settings and preferences.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={1}>
          <Paragraph>Theme, colour scheme, and font settings.</Paragraph>
        </Tabs.Content.Item>
        <Tabs.Content.Item index={2}>
          <Paragraph>Developer options and experimental features.</Paragraph>
        </Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  ),
};

export const BackwardCompatible: Story = {
  name: 'Backward Compatible (Tabs.Item)',
  render: () => (
    <Tabs>
      <Tabs.List>
        <Tabs.Item active>
          <a>Home</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Profile</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Settings</a>
        </Tabs.Item>
      </Tabs.List>
    </Tabs>
  ),
};
