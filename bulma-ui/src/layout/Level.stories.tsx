import type { Meta, StoryObj } from '@storybook/react-vite';
import Level from './Level';
import { Title } from '../elements/Title';
import { Button } from '../elements/Button';
import Field from '../form/Field';
import Control from '../form/Control';
import { Input } from '../form/Input';

const meta: Meta<typeof Level> = {
  title: 'Layout/Level',
  component: Level,
  tags: ['autodocs'],
};
export default meta;

// Default Story
export const Default: StoryObj<typeof Level> = {
  render: () => (
    <Level>
      <Level.Left>
        <Level.Item>
          <Title as="p" size="5" className="subtitle">
            <strong>Favorite Posts</strong>
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
          <a>Published</a>
        </Level.Item>
        <Level.Item as="p">
          <a>Drafts</a>
        </Level.Item>
        <Level.Item as="p">
          <a>Deleted</a>
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
        <img src="/img/bestax-type.svg" alt="Bestax" style={{ height: 30 }} />
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

// Compound (dot-notation) usage
export const CompoundUsage: StoryObj<typeof Level> = {
  render: () => (
    <Level>
      <Level.Left>
        <Level.Item>
          <Title as="p" size="5" className="subtitle">
            <strong>All Posts</strong>
          </Title>
        </Level.Item>
      </Level.Left>
      <Level.Right>
        <Level.Item as="p">
          <a>Published</a>
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

/**
 * `Level.Item` renders an `<a>` when told to, and that form takes the anchor's
 * wider attributes — `download`, `hrefLang`, `ping`, `referrerPolicy` — not
 * just `href`/`target`/`rel`. On any other `as` they are withheld rather than
 * rendered as dead markup.
 */
export const AnchorItem: StoryObj<typeof Level> = {
  render: () => (
    <Level>
      <Level.Left>
        <Level.Item
          as="a"
          href="/files/report.pdf"
          download="report.pdf"
          referrerPolicy="no-referrer"
        >
          Download the report
        </Level.Item>
      </Level.Left>
      <Level.Right>
        <Level.Item
          as="a"
          href="https://example.com"
          target="_blank"
          rel="noreferrer"
        >
          Open example.com
        </Level.Item>
      </Level.Right>
    </Level>
  ),
};
