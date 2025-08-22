import { render, screen } from '@testing-library/react';
import Media from '../Media';
import { ConfigProvider } from '../../helpers/Config';

describe('Media', () => {
  it('renders as <article> by default', () => {
    render(<Media data-testid="media-default">Content</Media>);
    const media = screen.getByTestId('media-default');
    expect(media.tagName.toLowerCase()).toBe('article');
    expect(media).toHaveClass('media');
    expect(media).toHaveTextContent('Content');
  });

  it('renders as custom element with "as" prop', () => {
    render(
      <Media as="div" data-testid="media-div">
        Div Content
      </Media>
    );
    const media = screen.getByTestId('media-div');
    expect(media.tagName.toLowerCase()).toBe('div');
    expect(media).toHaveClass('media');
    expect(media).toHaveTextContent('Div Content');
  });

  it('applies Bulma helper classes', () => {
    render(<Media m="3" data-testid="media-helper" />);
    expect(screen.getByTestId('media-helper')).toHaveClass('media', 'm-3');
  });

  it('applies custom className', () => {
    render(<Media className="custom-class" data-testid="media-custom" />);
    expect(screen.getByTestId('media-custom')).toHaveClass(
      'media',
      'custom-class'
    );
  });

  it('forwards HTML attributes', () => {
    render(
      <Media id="my-media" aria-label="aria-test" data-testid="media-attrs" />
    );
    const media = screen.getByTestId('media-attrs');
    expect(media).toHaveAttribute('id', 'my-media');
    expect(media).toHaveAttribute('aria-label', 'aria-test');
  });

  it('applies classPrefix when provided', () => {
    render(
      <ConfigProvider classPrefix="custom-">
        <Media data-testid="media-test">Test Media</Media>
      </ConfigProvider>
    );
    const media = screen.getByTestId('media-test');
    expect(media).toHaveClass('custom-media');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Media data-testid="media">Media content</Media>
        </ConfigProvider>
      );
      const media = screen.getByTestId('media');
      expect(media).toBeInTheDocument();
      expect(media).toHaveClass('bulma-media');
    });

    it('uses default classes when no prefix is provided', () => {
      render(<Media data-testid="media">Media content</Media>);
      const media = screen.getByTestId('media');
      expect(media).toBeInTheDocument();
      expect(media).toHaveClass('media');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Media data-testid="media">Media content</Media>
        </ConfigProvider>
      );
      const media = screen.getByTestId('media');
      expect(media).toBeInTheDocument();
      expect(media).toHaveClass('media');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Media data-testid="media" textColor="primary" bgColor="light" m="3">
            Media content
          </Media>
        </ConfigProvider>
      );
      const media = screen.getByTestId('media');
      expect(media).toBeInTheDocument();
      expect(media).toHaveClass('bulma-media');
      expect(media).toHaveClass('bulma-has-text-primary');
      expect(media).toHaveClass('bulma-has-background-light');
      expect(media).toHaveClass('bulma-m-3');
    });

    it('works without prefix', () => {
      render(
        <Media data-testid="media" as="div" color="info" p="2">
          Media content
        </Media>
      );
      const media = screen.getByTestId('media');
      expect(media).toBeInTheDocument();
      expect(media).toHaveClass('media');
      expect(media).toHaveClass('has-text-info');
      expect(media).toHaveClass('p-2');
      expect(media.tagName.toLowerCase()).toBe('div');
    });

    it('applies prefix to Media subcomponents', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Media>
            <Media.Left data-testid="left" textColor="primary">
              Left Content
            </Media.Left>
            <Media.Content data-testid="content" bgColor="light">
              Content
            </Media.Content>
            <Media.Right data-testid="right" color="danger">
              Right Content
            </Media.Right>
          </Media>
        </ConfigProvider>
      );
      expect(screen.getByTestId('left')).toHaveClass('bulma-media-left');
      expect(screen.getByTestId('left')).toHaveClass('bulma-has-text-primary');
      expect(screen.getByTestId('content')).toHaveClass('bulma-media-content');
      expect(screen.getByTestId('content')).toHaveClass(
        'bulma-has-background-light'
      );
      expect(screen.getByTestId('right')).toHaveClass('bulma-media-right');
      expect(screen.getByTestId('right')).toHaveClass('bulma-has-text-danger');
    });
  });

  describe('Media.Left', () => {
    it('renders as <figure> by default', () => {
      render(
        <Media>
          <Media.Left data-testid="media-left">Left</Media.Left>
        </Media>
      );
      const left = screen.getByTestId('media-left');
      expect(left.tagName.toLowerCase()).toBe('figure');
      expect(left).toHaveClass('media-left');
      expect(left).toHaveTextContent('Left');
    });

    it('renders as custom element with "as" prop', () => {
      render(
        <Media>
          <Media.Left as="div" data-testid="media-left-div">
            Left Div
          </Media.Left>
        </Media>
      );
      const left = screen.getByTestId('media-left-div');
      expect(left.tagName.toLowerCase()).toBe('div');
      expect(left).toHaveClass('media-left');
      expect(left).toHaveTextContent('Left Div');
    });

    it('applies Bulma and custom classes', () => {
      render(
        <Media>
          <Media.Left m="2" className="foo" data-testid="media-left-helper">
            Left Helper
          </Media.Left>
        </Media>
      );
      const left = screen.getByTestId('media-left-helper');
      expect(left).toHaveClass('media-left', 'm-2', 'foo');
    });
  });

  describe('Media.Content', () => {
    it('renders content with correct class', () => {
      render(
        <Media>
          <Media.Content data-testid="media-content">
            Test Content
          </Media.Content>
        </Media>
      );
      const content = screen.getByTestId('media-content');
      expect(content.tagName.toLowerCase()).toBe('div');
      expect(content).toHaveClass('media-content');
      expect(content).toHaveTextContent('Test Content');
    });

    it('applies Bulma and custom classes', () => {
      render(
        <Media>
          <Media.Content m="1" className="bar" data-testid="media-content-bar">
            Bar
          </Media.Content>
        </Media>
      );
      const content = screen.getByTestId('media-content-bar');
      expect(content).toHaveClass('media-content', 'm-1', 'bar');
    });
  });

  describe('Media.Right', () => {
    it('renders content with correct class', () => {
      render(
        <Media>
          <Media.Right data-testid="media-right">Right Content</Media.Right>
        </Media>
      );
      const right = screen.getByTestId('media-right');
      expect(right.tagName.toLowerCase()).toBe('div');
      expect(right).toHaveClass('media-right');
      expect(right).toHaveTextContent('Right Content');
    });

    it('applies Bulma and custom classes', () => {
      render(
        <Media>
          <Media.Right m="4" className="baz" data-testid="media-right-baz">
            Baz
          </Media.Right>
        </Media>
      );
      const right = screen.getByTestId('media-right-baz');
      expect(right).toHaveClass('media-right', 'm-4', 'baz');
    });
  });

  it('renders nesting structure', () => {
    render(
      <Media data-testid="outer-media">
        <Media.Left data-testid="outer-left">Outer Left</Media.Left>
        <Media.Content data-testid="outer-content">
          <Media>
            <Media.Left data-testid="inner-left">Inner Left</Media.Left>
            <Media.Content data-testid="inner-content">
              Inner Content
            </Media.Content>
          </Media>
        </Media.Content>
        <Media.Right data-testid="outer-right">Outer Right</Media.Right>
      </Media>
    );
    expect(screen.getByTestId('outer-media')).toContainElement(
      screen.getByTestId('outer-left')
    );
    expect(screen.getByTestId('outer-media')).toContainElement(
      screen.getByTestId('outer-content')
    );
    expect(screen.getByTestId('outer-media')).toContainElement(
      screen.getByTestId('outer-right')
    );
    expect(screen.getByTestId('outer-content')).toContainElement(
      screen.getByTestId('inner-left')
    );
    expect(screen.getByTestId('outer-content')).toContainElement(
      screen.getByTestId('inner-content')
    );
  });

  describe('Color Props Fallback', () => {
    it('uses textColor when both textColor and color are provided for Media', () => {
      render(
        <Media data-testid="media" textColor="primary" color="danger">
          Media content
        </Media>
      );
      const media = screen.getByTestId('media');
      expect(media).toHaveClass('has-text-primary');
      expect(media).not.toHaveClass('has-text-danger');
    });

    it('falls back to color when textColor is not provided for Media', () => {
      render(
        <Media data-testid="media" color="warning">
          Media content
        </Media>
      );
      const media = screen.getByTestId('media');
      expect(media).toHaveClass('has-text-warning');
    });

    it('uses textColor when both textColor and color are provided for Media.Left', () => {
      render(
        <Media>
          <Media.Left data-testid="left" textColor="success" color="info">
            Left content
          </Media.Left>
        </Media>
      );
      const left = screen.getByTestId('left');
      expect(left).toHaveClass('has-text-success');
      expect(left).not.toHaveClass('has-text-info');
    });

    it('falls back to color when textColor is not provided for Media.Left', () => {
      render(
        <Media>
          <Media.Left data-testid="left" color="link">
            Left content
          </Media.Left>
        </Media>
      );
      const left = screen.getByTestId('left');
      expect(left).toHaveClass('has-text-link');
    });

    it('uses textColor when both textColor and color are provided for Media.Content', () => {
      render(
        <Media>
          <Media.Content data-testid="content" textColor="dark" color="light">
            Content
          </Media.Content>
        </Media>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('has-text-dark');
      expect(content).not.toHaveClass('has-text-light');
    });

    it('falls back to color when textColor is not provided for Media.Content', () => {
      render(
        <Media>
          <Media.Content data-testid="content" color="black">
            Content
          </Media.Content>
        </Media>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('has-text-black');
    });

    it('uses textColor when both textColor and color are provided for Media.Right', () => {
      render(
        <Media>
          <Media.Right data-testid="right" textColor="white" color="grey">
            Right content
          </Media.Right>
        </Media>
      );
      const right = screen.getByTestId('right');
      expect(right).toHaveClass('has-text-white');
      expect(right).not.toHaveClass('has-text-grey');
    });

    it('falls back to color when textColor is not provided for Media.Right', () => {
      render(
        <Media>
          <Media.Right data-testid="right" color="grey-light">
            Right content
          </Media.Right>
        </Media>
      );
      const right = screen.getByTestId('right');
      expect(right).toHaveClass('has-text-grey-light');
    });
  });
});
