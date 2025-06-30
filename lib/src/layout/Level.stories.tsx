import type { Meta, StoryObj } from '@storybook/react';
import Level from './Level';
import { Title } from '../elements/Title';
import { Button } from '../elements/Button';
import Field from '../form/Field';
import Control from '../form/Control';
import Input from '../form/Input';

const meta: Meta<typeof Level> = {
  title: 'Layout/Level',
  component: Level,
};
export default meta;

// Default Story
export const Default: StoryObj<typeof Level> = {
  render: () => (
    <Level>
      <Level.Left>
        <Level.Item>
          <Title as="p" size="5" className="subtitle">
            <strong>Favorite Posts</strong> posts
          </Title>
        </Level.Item>
        <Level.Item>
          <Field hasAddons>
            <Control>
              <Input type="text" placeholder="Find a post" />
            </Control>
            <Control>
              <Button>Search</Button>
            </Control>
          </Field>
        </Level.Item>
      </Level.Left>
      <Level.Right>
        <Level.Item as="p">
          <strong>All</strong>
        </Level.Item>
        <Level.Item as="p">
          <a>From Followers</a>
        </Level.Item>
        <Level.Item as="p">
          <a>From Verified Followers</a>
        </Level.Item>
        <Level.Item as="p">
          <a>Replies</a>
        </Level.Item>
        <Level.Item as="p">
          <Button color="success" as="a">
            New
          </Button>
        </Level.Item>
      </Level.Right>
    </Level>
  ),
};

// Centered Level
export const CenteredLevel: StoryObj<typeof Level> = {
  render: () => (
    <Level>
      <Level.Item hasTextCentered>
        <div>
          <p className="heading">Posts</p>
          <Title as="p">1,234</Title>
        </div>
      </Level.Item>
      <Level.Item hasTextCentered>
        <div>
          <p className="heading">Following</p>
          <Title as="p">6789</Title>
        </div>
      </Level.Item>
      <Level.Item hasTextCentered>
        <div>
          <p className="heading">Followers</p>
          <Title as="p">123K</Title>
        </div>
      </Level.Item>
      <Level.Item hasTextCentered>
        <div>
          <p className="heading">Likes</p>
          <Title as="p">9876</Title>
        </div>
      </Level.Item>
    </Level>
  ),
};

// Level Centered Menu
export const LevelCenteredMenu: StoryObj<typeof Level> = {
  render: () => (
    <Level>
      <Level.Item as="p" hasTextCentered>
        <a className="link is-info">Getting Started</a>
      </Level.Item>
      <Level.Item as="p" hasTextCentered>
        <a className="link is-info">APIs</a>
      </Level.Item>
      <Level.Item as="p" hasTextCentered>
        <img
          src="https://bulma.io/assets/images/bulma-type.png"
          alt=""
          style={{ height: 30 }}
        />
      </Level.Item>
      <Level.Item as="p" hasTextCentered>
        <a className="link is-info">Versions</a>
      </Level.Item>
      <Level.Item as="p" hasTextCentered>
        <a className="link is-info">FAQ</a>
      </Level.Item>
    </Level>
  ),
};

// Mobile Level
export const MobileLevel: StoryObj<typeof Level> = {
  render: () => (
    <Level isMobile>
      <Level.Item hasTextCentered>
        <div>
          <p className="heading">Posts</p>
          <Title as="p">1,234</Title>
        </div>
      </Level.Item>
      <Level.Item hasTextCentered>
        <div>
          <p className="heading">Following</p>
          <Title as="p">4567</Title>
        </div>
      </Level.Item>
      <Level.Item hasTextCentered>
        <div>
          <p className="heading">Followers</p>
          <Title as="p">123K</Title>
        </div>
      </Level.Item>
      <Level.Item hasTextCentered>
        <div>
          <p className="heading">Likes</p>
          <Title as="p">9876</Title>
        </div>
      </Level.Item>
    </Level>
  ),
};
