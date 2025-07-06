import { Meta, StoryObj } from '@storybook/react-vite';
import Tabs from './Tabs';
import { Icon } from '../elements/Icon';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const AlignmentCentered: Story = {
  render: () => (
    <Tabs align="centered">
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

export const AlignmentRight: Story = {
  render: () => (
    <Tabs align="right">
      <Tabs.List>
        <Tabs.Item>
          <a>Home</a>
        </Tabs.Item>
        <Tabs.Item active>
          <a>Profile</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Settings</a>
        </Tabs.Item>
      </Tabs.List>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs>
      <Tabs.List>
        <Tabs.Item active>
          <a>
            <Icon name="fas fa-image" size="small" />
            <span>Pictures</span>
          </a>
        </Tabs.Item>
        <Tabs.Item>
          <a>
            <Icon name="fas fa-music" size="small" />
            <span>Music</span>
          </a>
        </Tabs.Item>
        <Tabs.Item>
          <a>
            <Icon name="fas fa-film" size="small" />
            <span>Videos</span>
          </a>
        </Tabs.Item>
        <Tabs.Item>
          <a>
            <Icon name="fas fa-file-alt" size="small" />
            <span>Documents</span>
          </a>
        </Tabs.Item>
      </Tabs.List>
    </Tabs>
  ),
};

export const SmallTabs: Story = {
  render: () => (
    <Tabs size="small">
      <Tabs.List>
        <Tabs.Item active>
          <a>Tab 1</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Tab 2</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Tab 3</a>
        </Tabs.Item>
      </Tabs.List>
    </Tabs>
  ),
};

export const MediumTabs: Story = {
  render: () => (
    <Tabs size="medium">
      <Tabs.List>
        <Tabs.Item active>
          <a>Tab 1</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Tab 2</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Tab 3</a>
        </Tabs.Item>
      </Tabs.List>
    </Tabs>
  ),
};

export const LargeTabs: Story = {
  render: () => (
    <Tabs size="large">
      <Tabs.List>
        <Tabs.Item active>
          <a>Tab 1</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Tab 2</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Tab 3</a>
        </Tabs.Item>
      </Tabs.List>
    </Tabs>
  ),
};

export const BoxedTabs: Story = {
  render: () => (
    <Tabs boxed>
      <Tabs.List>
        <Tabs.Item active>
          <a>Overview</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Elements</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Components</a>
        </Tabs.Item>
      </Tabs.List>
    </Tabs>
  ),
};

export const ToggleTabs: Story = {
  render: () => (
    <Tabs toggle>
      <Tabs.List>
        <Tabs.Item active>
          <a>All</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Active</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Completed</a>
        </Tabs.Item>
      </Tabs.List>
    </Tabs>
  ),
};

export const ToggleRoundedTabs: Story = {
  render: () => (
    <Tabs toggle rounded>
      <Tabs.List>
        <Tabs.Item active>
          <a>All</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Active</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Completed</a>
        </Tabs.Item>
      </Tabs.List>
    </Tabs>
  ),
};

export const FullwidthTabs: Story = {
  render: () => (
    <Tabs fullwidth>
      <Tabs.List>
        <Tabs.Item active>
          <a>One</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Two</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Three</a>
        </Tabs.Item>
        <Tabs.Item>
          <a>Four</a>
        </Tabs.Item>
      </Tabs.List>
    </Tabs>
  ),
};

export const CenteredBoxedWithIcons: Story = {
  render: () => (
    <Tabs align="centered" boxed>
      <Tabs.List>
        <Tabs.Item active>
          <a>
            <Icon name="fas fa-home" size="small" />
            <span>Home</span>
          </a>
        </Tabs.Item>
        <Tabs.Item>
          <a>
            <Icon name="fas fa-user" size="small" />
            <span>Profile</span>
          </a>
        </Tabs.Item>
        <Tabs.Item>
          <a>
            <Icon name="fas fa-cog" size="small" />
            <span>Settings</span>
          </a>
        </Tabs.Item>
      </Tabs.List>
    </Tabs>
  ),
};

export const ToggleFullwidthWithIcons: Story = {
  render: () => (
    <Tabs toggle fullwidth>
      <Tabs.List>
        <Tabs.Item active>
          <a>
            <Icon name="fas fa-list" size="small" />
            <span>List</span>
          </a>
        </Tabs.Item>
        <Tabs.Item>
          <a>
            <Icon name="fas fa-check" size="small" />
            <span>Done</span>
          </a>
        </Tabs.Item>
        <Tabs.Item>
          <a>
            <Icon name="fas fa-times" size="small" />
            <span>Removed</span>
          </a>
        </Tabs.Item>
      </Tabs.List>
    </Tabs>
  ),
};

export const CenteredBoxedMediumWithIcons: Story = {
  render: () => (
    <Tabs align="centered" boxed size="medium">
      <Tabs.List>
        <Tabs.Item active>
          <a>
            <Icon name="fas fa-star" size="small" />
            <span>Favorites</span>
          </a>
        </Tabs.Item>
        <Tabs.Item>
          <a>
            <Icon name="fas fa-clock" size="small" />
            <span>Recent</span>
          </a>
        </Tabs.Item>
        <Tabs.Item>
          <a>
            <Icon name="fas fa-archive" size="small" />
            <span>Archive</span>
          </a>
        </Tabs.Item>
      </Tabs.List>
    </Tabs>
  ),
};

export const ToggleFullwidthLargeWithIcons: Story = {
  render: () => (
    <Tabs toggle fullwidth size="large">
      <Tabs.List>
        <Tabs.Item active>
          <a>
            <Icon name="fas fa-rocket" size="small" />
            <span>Launch</span>
          </a>
        </Tabs.Item>
        <Tabs.Item>
          <a>
            <Icon name="fas fa-bell" size="small" />
            <span>Alerts</span>
          </a>
        </Tabs.Item>
        <Tabs.Item>
          <a>
            <Icon name="fas fa-cogs" size="small" />
            <span>Settings</span>
          </a>
        </Tabs.Item>
      </Tabs.List>
    </Tabs>
  ),
};
