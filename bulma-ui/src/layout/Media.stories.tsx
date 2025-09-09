import type { Meta, StoryObj } from '@storybook/react';
import Media from './Media';
import { Image } from '../elements/Image';
import { Icon } from '../elements/Icon';
import { Button } from '../elements/Button';
import Field from '../form/Field';
import TextArea from '../form/TextArea';
import Checkbox from '../form/Checkbox';
import Level from '../layout/Level';
import { Content } from '../elements/Content';
import Control from '../form/Control';

const meta: Meta<typeof Media> = {
  title: 'Layout/Media',
  component: Media,
};
export default meta;

// Default
export const Default: StoryObj<typeof Media> = {
  render: () => (
    <Media>
      <Media.Left>
        <Image
          as="p"
          size="64x64"
          src="https://bulma.io/assets/images/placeholders/128x128.png"
          alt=""
        />
      </Media.Left>
      <Media.Content>
        <div className="content">
          <p>
            <strong>Alexander Hamilton</strong> <small>@hamilton</small>{' '}
            <small>31m</small>
            <br />
            If men were angels, no government would be necessary. If angels were
            to govern men, neither external nor internal controls on government
            would be necessary.
          </p>
        </div>
        <Level isMobile>
          <Level.Left>
            <Level.Item as="a">
              <span className="icon is-small">
                <Icon name="reply" library="fa" variant="solid" />
              </span>
            </Level.Item>
            <Level.Item as="a">
              <span className="icon is-small">
                <Icon name="retweet" library="fa" variant="solid" />
              </span>
            </Level.Item>
            <Level.Item as="a">
              <span className="icon is-small">
                <Icon name="heart" library="fa" variant="solid" />
              </span>
            </Level.Item>
          </Level.Left>
        </Level>
      </Media.Content>
      <Media.Right>
        <button className="delete" aria-label="delete" />
      </Media.Right>
    </Media>
  ),
};

// With Inputs
export const WithInputs: StoryObj<typeof Media> = {
  render: () => (
    <Media>
      <Media.Left>
        <Image
          as="p"
          size="64x64"
          src="https://bulma.io/assets/images/placeholders/128x128.png"
          alt=""
        />
      </Media.Left>
      <Media.Content>
        <Field>
          <Control as="p">
            <TextArea className="textarea" placeholder="Add a comment..." />
          </Control>
        </Field>
        <Level>
          <Level.Left>
            <Level.Item>
              <Button as="a" color="info">
                Submit
              </Button>
            </Level.Item>
          </Level.Left>
          <Level.Right>
            <Level.Item>
              <Checkbox>Press enter to submit</Checkbox>
            </Level.Item>
          </Level.Right>
        </Level>
      </Media.Content>
    </Media>
  ),
};

// Nesting
export const Nesting: StoryObj<typeof Media> = {
  render: () => (
    <Media>
      <Media.Left>
        <Image
          as="p"
          size="64x64"
          src="https://bulma.io/assets/images/placeholders/128x128.png"
          alt=""
        />
      </Media.Left>
      <Media.Content>
        <Content>
          <p>
            <strong>John Jay</strong>
            <br />
            The people, in their collective capacity, are the ultimate
            authority. The Union is essential to the security of the people of
            America against foreign danger.
            <br />
            <small>
              <a>Like</a> &middot; <a>Reply</a> &middot; 3 hrs
            </small>
          </p>
        </Content>
        {/* First nested media */}
        <Media>
          <Media.Left>
            <Image
              as="p"
              size="48x48"
              src="https://bulma.io/assets/images/placeholders/96x96.png"
              alt=""
            />
          </Media.Left>
          <Media.Content>
            <Content>
              <p>
                <strong>James Madison</strong>
                <br />
                The accumulation of all powers, legislative, executive, and
                judiciary, in the same hands, may justly be pronounced the very
                definition of tyranny.
                <br />
                <small>
                  <a>Like</a> &middot; <a>Reply</a> &middot; 2 hrs
                </small>
              </p>
            </Content>
            {/* 2nd nested media (two siblings) */}
            <Media>
              Experience has taught mankind the necessity of auxiliary
              precautions.
            </Media>
            <Media>Ambition must be made to counteract ambition.</Media>
          </Media.Content>
        </Media>
        {/* Second nested media */}
        <Media>
          <Media.Left>
            <Image
              as="p"
              size="48x48"
              src="https://bulma.io/assets/images/placeholders/96x96.png"
              alt=""
            />
          </Media.Left>
          <Media.Content>
            <Content>
              <p>
                <strong>Alexander Hamilton</strong>
                <br />
                Safety from external danger is the most powerful director of
                national conduct. The desire for respect and security will
                always influence the policy of nations.
                <br />
                <small>
                  <a>Like</a> &middot; <a>Reply</a> &middot; 2 hrs
                </small>
              </p>
            </Content>
          </Media.Content>
        </Media>
      </Media.Content>
    </Media>
  ),
};

// With Button Below
export const WithButtonBelow: StoryObj<typeof Media> = {
  render: () => (
    <Media>
      <Media.Left>
        <Image
          as="p"
          size="64x64"
          src="https://bulma.io/assets/images/placeholders/128x128.png"
          alt=""
        />
      </Media.Left>
      <Media.Content>
        <Field>
          <p className="control">
            <TextArea className="textarea" placeholder="Add a comment..." />
          </p>
        </Field>
        <Field>
          <p className="control">
            <Button>Post comment</Button>
          </p>
        </Field>
      </Media.Content>
    </Media>
  ),
};
