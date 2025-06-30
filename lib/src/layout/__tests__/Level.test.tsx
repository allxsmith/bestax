import { render, screen } from '@testing-library/react';
import Level from '../Level';
import { Title } from '../../elements/Title';
import Button from '../../elements/Button';
import Field from '../../form/Field';
import Control from '../../form/Control';
import Input from '../../form/Input';

describe('Level', () => {
  it('renders default layout with Bulma helpers', () => {
    render(
      <Level m="3" data-testid="level">
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
    );
    expect(screen.getByTestId('level')).toHaveClass('level');
    expect(screen.getByText('Favorite Posts')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Find a post')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies is-mobile', () => {
    render(<Level isMobile data-testid="level" />);
    expect(screen.getByTestId('level')).toHaveClass('is-mobile');
  });

  it('renders centered items with Title', () => {
    render(
      <Level>
        <Level.Item hasTextCentered>
          <div>
            <p className="heading">Posts</p>
            <Title as="p">1,234</Title>
          </div>
        </Level.Item>
      </Level>
    );
    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('Posts').closest('.level-item')).toHaveClass(
      'has-text-centered'
    );
  });

  it('renders as <p> when requested', () => {
    render(
      <Level>
        <Level.Item as="p" data-testid="level-p">
          Text
        </Level.Item>
      </Level>
    );
    expect(screen.getByTestId('level-p').tagName).toBe('P');
  });

  it('passes Bulma helpers to Level.Item', () => {
    render(
      <Level>
        <Level.Item m="2" data-testid="level-item">
          Helper
        </Level.Item>
      </Level>
    );
    expect(screen.getByTestId('level-item')).toHaveClass('m-2');
  });
});
