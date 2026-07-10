import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Avatar } from '../Avatar';
import { ConfigProvider } from '../../helpers/Config';

describe('Avatar', () => {
  it('renders an image when src is provided', () => {
    render(<Avatar src="/photo.jpg" alt="Ada Lovelace" name="Ada Lovelace" />);
    const img = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('src', '/photo.jpg');
  });

  it('renders an image with an empty alt when neither alt nor name is provided', () => {
    const { container } = render(<Avatar src="/photo.jpg" />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('falls back to the icon when a whitespace-only name yields no initials', () => {
    render(<Avatar name="   " icon={<span data-testid="fallback-icon" />} />);
    expect(screen.getByTestId('fallback-icon')).toBeInTheDocument();
  });

  it('falls back to initials when the image fails to load', () => {
    render(<Avatar src="/broken.jpg" name="Ada Lovelace" />);
    const img = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
    fireEvent.error(img);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('resets the error state when src changes', () => {
    const { rerender } = render(
      <Avatar src="/broken.jpg" name="Ada Lovelace" />
    );
    const img = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
    fireEvent.error(img);
    expect(screen.getByText('AL')).toBeInTheDocument();

    rerender(<Avatar src="/fixed.jpg" name="Ada Lovelace" />);
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute(
      'src',
      '/fixed.jpg'
    );
  });

  it('derives initials from a single-word name', () => {
    render(<Avatar name="Cher" />);
    expect(screen.getByText('CH')).toBeInTheDocument();
  });

  it('derives initials by code point for astral-plane names', () => {
    render(<Avatar name="😀🎉" />);
    // Array.from keeps whole code points, so no half-surrogate initials.
    expect(screen.getByText('😀🎉')).toBeInTheDocument();
  });

  it('falls back to initials when the image already failed before hydration', () => {
    const completeSpy = jest
      .spyOn(HTMLImageElement.prototype, 'complete', 'get')
      .mockReturnValue(true);
    const widthSpy = jest
      .spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get')
      .mockReturnValue(0);
    render(<Avatar src="/broken.jpg" name="Ada Lovelace" />);
    expect(screen.getByText('AL')).toBeInTheDocument();
    completeSpy.mockRestore();
    widthSpy.mockRestore();
  });

  it('forwards imageProps to the underlying img', () => {
    render(
      <Avatar src="/photo.jpg" name="Ada" imageProps={{ loading: 'lazy' }} />
    );
    const img = screen.getByRole('img', { name: 'Ada' });
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('chains imageProps.onError before falling back', () => {
    const onError = jest.fn();
    render(
      <Avatar src="/broken.jpg" name="Ada Lovelace" imageProps={{ onError }} />
    );
    const img = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
    fireEvent.error(img);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('prefers explicit initials over a derived name', () => {
    render(<Avatar name="Ada Lovelace" initials="xy" />);
    expect(screen.getByText('XY')).toBeInTheDocument();
  });

  it('falls back to the provided icon when there is no src/name/initials', () => {
    render(<Avatar icon={<span data-testid="fallback-icon" />} />);
    expect(screen.getByTestId('fallback-icon')).toBeInTheDocument();
  });

  it('renders a generic default icon when nothing else is provided', () => {
    const { container } = render(<Avatar />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies a deterministic auto color from the name', () => {
    const colorPattern = /is-(primary|link|info|success|warning|danger)\b/;
    const { container: c1 } = render(<Avatar name="Ada Lovelace" />);
    const { container: c2 } = render(<Avatar name="Ada Lovelace" />);
    const class1 = (c1.firstChild as HTMLElement).className;
    const class2 = (c2.firstChild as HTMLElement).className;
    expect(class1).toMatch(colorPattern);
    expect(class1.match(colorPattern)?.[0]).toBe(
      class2.match(colorPattern)?.[0]
    );
  });

  it('lets an explicit color override the auto color', () => {
    render(<Avatar name="Ada Lovelace" color="info" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('is-info');
  });

  it('applies the shape class (defaults to circle)', () => {
    render(<Avatar name="Ada" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('is-circle');
  });

  it('applies a custom shape', () => {
    render(<Avatar name="Ada" shape="square" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('is-square');
  });

  it('applies a preset size class', () => {
    render(<Avatar name="Ada" size="64x64" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('is-64x64');
  });

  it('applies an inline pixel size when size is a number', () => {
    render(<Avatar name="Ada" size={20} data-testid="avatar" />);
    const avatar = screen.getByTestId('avatar');
    expect(avatar).not.toHaveClass('is-20');
    expect(avatar).toHaveStyle({ width: '20px', height: '20px' });
  });

  it('renders as a figure by default', () => {
    const { container } = render(<Avatar name="Ada" />);
    expect(container.firstChild?.nodeName).toBe('FIGURE');
  });

  it('renders as a link when href is provided', () => {
    render(<Avatar name="Ada" href="https://example.com" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('forwards target and rel when rendering a link', () => {
    render(
      <Avatar
        name="Ada"
        href="https://example.com"
        target="_blank"
        rel="noopener"
      />
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
  });

  it('does not forward href to a non-anchor element rendered via as', () => {
    const { container } = render(
      <Avatar name="Ada" as="div" href="https://example.com" />
    );
    const el = container.firstChild as HTMLElement;
    expect(el.nodeName).toBe('DIV');
    expect(el).not.toHaveAttribute('href');
  });

  it('forwards href to a custom component rendered via as', () => {
    const CustomLink: React.FC<{
      href?: string;
      children?: React.ReactNode;
    }> = ({ href, children, ...rest }) => (
      <a data-testid="custom" href={href} {...rest}>
        {children}
      </a>
    );
    render(<Avatar name="Ada" as={CustomLink} href="https://example.com" />);
    expect(screen.getByTestId('custom')).toHaveAttribute(
      'href',
      'https://example.com'
    );
  });

  it('respects an explicit as override', () => {
    const { container } = render(<Avatar name="Ada" as="div" />);
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('renders as a button without a redundant role but keeps the aria-label', () => {
    render(<Avatar name="Ada Lovelace" as="button" />);
    // A button is already interactive, so no role="img" is added, but the
    // accessible name still comes from the aria-label.
    const button = screen.getByRole('button', { name: 'Ada Lovelace' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).not.toHaveAttribute('role', 'img');
  });

  it('passes Bulma helper props through', () => {
    render(<Avatar name="Ada" m="3" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('m-3');
  });

  it('applies a custom className', () => {
    render(<Avatar name="Ada" className="extra" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveClass('extra');
  });

  it('sets role and aria-label when not showing an image', () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(
      screen.getByRole('img', { name: 'Ada Lovelace' })
    ).toBeInTheDocument();
  });

  it('applies the classPrefix from ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <Avatar name="Ada" data-testid="avatar" />
      </ConfigProvider>
    );
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveClass('bulma-avatar');
    expect(avatar).not.toHaveClass('avatar');
  });
});
