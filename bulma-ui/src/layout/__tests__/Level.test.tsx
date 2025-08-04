import { render, screen } from '@testing-library/react';
import Level from '../Level';
import { Title } from '../../elements/Title';
import Button from '../../elements/Button';
import Field from '../../form/Field';
import Control from '../../form/Control';
import Input from '../../form/Input';
import { ConfigProvider } from '../../helpers/Config';

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

  it('renders as <a> when requested with href and anchor props', () => {
    render(
      <Level>
        <Level.Item
          as="a"
          href="https://example.com"
          target="_blank"
          rel="noopener"
          data-testid="level-a"
        >
          Link Item
        </Level.Item>
      </Level>
    );
    const anchor = screen.getByTestId('level-a');
    expect(anchor.tagName).toBe('A');
    expect(anchor).toHaveAttribute('href', 'https://example.com');
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', 'noopener');
    expect(anchor).toHaveClass('level-item');
    expect(anchor).toHaveTextContent('Link Item');
  });

  it('applies classPrefix when provided', () => {
    render(
      <ConfigProvider classPrefix="custom-">
        <Level data-testid="level-test">Test Level</Level>
      </ConfigProvider>
    );
    const level = screen.getByTestId('level-test');
    expect(level).toHaveClass('custom-level');
  });

  it('applies classPrefix to Level subcomponents when provided', () => {
    render(
      <ConfigProvider classPrefix="custom-">
        <Level>
          <Level.Left data-testid="left">Left</Level.Left>
          <Level.Right data-testid="right">Right</Level.Right>
          <Level.Item data-testid="item">Item</Level.Item>
        </Level>
      </ConfigProvider>
    );
    expect(screen.getByTestId('left')).toHaveClass('custom-level-left');
    expect(screen.getByTestId('right')).toHaveClass('custom-level-right');
    expect(screen.getByTestId('item')).toHaveClass('custom-level-item');
  });
});
