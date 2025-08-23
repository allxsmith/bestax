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

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Level data-testid="level">Level content</Level>
        </ConfigProvider>
      );
      const level = screen.getByTestId('level');
      expect(level).toBeInTheDocument();
      expect(level).toHaveClass('bulma-level');
    });

    it('uses default classes when no prefix is provided', () => {
      render(<Level data-testid="level">Level content</Level>);
      const level = screen.getByTestId('level');
      expect(level).toBeInTheDocument();
      expect(level).toHaveClass('level');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Level data-testid="level">Level content</Level>
        </ConfigProvider>
      );
      const level = screen.getByTestId('level');
      expect(level).toBeInTheDocument();
      expect(level).toHaveClass('level');
    });

    it('applies prefix to both main class and level modifiers', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Level data-testid="level" isMobile m="3">
            Level content
          </Level>
        </ConfigProvider>
      );
      const level = screen.getByTestId('level');
      expect(level).toBeInTheDocument();
      expect(level).toHaveClass('bulma-level');
      expect(level).toHaveClass('bulma-is-mobile');
      expect(level).toHaveClass('bulma-m-3');
    });

    it('works without prefix', () => {
      render(
        <Level data-testid="level" isMobile p="2">
          Level content
        </Level>
      );
      const level = screen.getByTestId('level');
      expect(level).toBeInTheDocument();
      expect(level).toHaveClass('level');
      expect(level).toHaveClass('is-mobile');
      expect(level).toHaveClass('p-2');
    });

    it('applies prefix to Level subcomponents', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Level>
            <Level.Left data-testid="left" textColor="primary">
              Left Content
            </Level.Left>
            <Level.Right data-testid="right" bgColor="light">
              Right Content
            </Level.Right>
            <Level.Item data-testid="item" hasTextCentered color="danger">
              Item Content
            </Level.Item>
          </Level>
        </ConfigProvider>
      );
      expect(screen.getByTestId('left')).toHaveClass('bulma-level-left');
      expect(screen.getByTestId('left')).toHaveClass('bulma-has-text-primary');
      expect(screen.getByTestId('right')).toHaveClass('bulma-level-right');
      expect(screen.getByTestId('right')).toHaveClass(
        'bulma-has-background-light'
      );
      expect(screen.getByTestId('item')).toHaveClass('bulma-level-item');
      expect(screen.getByTestId('item')).toHaveClass('bulma-has-text-centered');
      expect(screen.getByTestId('item')).toHaveClass('bulma-has-text-danger');
    });
  });

  describe('Color Props Fallback', () => {
    it('uses textColor when both textColor and color are provided for Level', () => {
      render(
        <Level data-testid="level" textColor="primary" color="danger">
          Level content
        </Level>
      );
      const level = screen.getByTestId('level');
      expect(level).toHaveClass('has-text-primary');
      expect(level).not.toHaveClass('has-text-danger');
    });

    it('falls back to color when textColor is not provided for Level', () => {
      render(
        <Level data-testid="level" color="warning">
          Level content
        </Level>
      );
      const level = screen.getByTestId('level');
      expect(level).toHaveClass('has-text-warning');
    });

    it('uses textColor when both textColor and color are provided for Level.Left', () => {
      render(
        <Level>
          <Level.Left data-testid="left" textColor="success" color="info">
            Left content
          </Level.Left>
        </Level>
      );
      const left = screen.getByTestId('left');
      expect(left).toHaveClass('has-text-success');
      expect(left).not.toHaveClass('has-text-info');
    });

    it('falls back to color when textColor is not provided for Level.Left', () => {
      render(
        <Level>
          <Level.Left data-testid="left" color="link">
            Left content
          </Level.Left>
        </Level>
      );
      const left = screen.getByTestId('left');
      expect(left).toHaveClass('has-text-link');
    });

    it('uses textColor when both textColor and color are provided for Level.Right', () => {
      render(
        <Level>
          <Level.Right data-testid="right" textColor="dark" color="light">
            Right content
          </Level.Right>
        </Level>
      );
      const right = screen.getByTestId('right');
      expect(right).toHaveClass('has-text-dark');
      expect(right).not.toHaveClass('has-text-light');
    });

    it('falls back to color when textColor is not provided for Level.Right', () => {
      render(
        <Level>
          <Level.Right data-testid="right" color="black">
            Right content
          </Level.Right>
        </Level>
      );
      const right = screen.getByTestId('right');
      expect(right).toHaveClass('has-text-black');
    });

    it('uses textColor when both textColor and color are provided for Level.Item', () => {
      render(
        <Level>
          <Level.Item data-testid="item" textColor="white" color="grey">
            Item content
          </Level.Item>
        </Level>
      );
      const item = screen.getByTestId('item');
      expect(item).toHaveClass('has-text-white');
      expect(item).not.toHaveClass('has-text-grey');
    });

    it('falls back to color when textColor is not provided for Level.Item', () => {
      render(
        <Level>
          <Level.Item data-testid="item" color="grey-light">
            Item content
          </Level.Item>
        </Level>
      );
      const item = screen.getByTestId('item');
      expect(item).toHaveClass('has-text-grey-light');
    });
  });
});
