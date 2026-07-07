import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LinkButton } from '../LinkButton';
import { ConfigProvider } from '../../helpers/Config';

describe('LinkButton Component', () => {
  it('renders children correctly', () => {
    render(<LinkButton>Click Me</LinkButton>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('renders a <button> element', () => {
    render(<LinkButton>Test</LinkButton>);
    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
  });

  it('applies link-button and is-text classes by default', () => {
    render(<LinkButton>Default</LinkButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button', 'is-text', 'link-button');
  });

  it('applies is-ghost when variant="ghost"', () => {
    render(<LinkButton variant="ghost">Ghost</LinkButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button', 'is-ghost', 'link-button');
    expect(button).not.toHaveClass('is-text');
  });

  it('applies link-button-primary when color="primary"', () => {
    render(<LinkButton color="primary">Primary</LinkButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('link-button', 'link-button-primary');
  });

  it('applies link-button-danger when color="danger"', () => {
    render(<LinkButton color="danger">Danger</LinkButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('link-button', 'link-button-danger');
  });

  it('does not apply a color class when color is not set', () => {
    render(<LinkButton>No Color</LinkButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('link-button');
    expect(button.className).not.toMatch(/link-button-/);
  });

  it('disables the button when isDisabled is true', () => {
    render(
      <LinkButton isDisabled disabled>
        Disabled
      </LinkButton>
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('fires onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<LinkButton onClick={handleClick}>Clickable</LinkButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', () => {
    const handleClick = jest.fn();
    render(
      <LinkButton onClick={handleClick} isDisabled disabled>
        Disabled
      </LinkButton>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('passes through size prop to Button', () => {
    render(<LinkButton size="large">Large</LinkButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('is-large');
  });

  it('passes through isRounded prop to Button', () => {
    render(<LinkButton isRounded>Rounded</LinkButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('is-rounded');
  });

  it('passes through isFullWidth prop to Button', () => {
    render(<LinkButton isFullWidth>Full Width</LinkButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('is-fullwidth');
  });

  it('passes through isLoading prop to Button', () => {
    render(<LinkButton isLoading>Loading</LinkButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('is-loading');
  });

  it('merges custom className with link-button classes', () => {
    render(<LinkButton className="my-custom">Custom</LinkButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('link-button', 'my-custom');
  });

  it('renders as anchor when as="a"', () => {
    render(
      <LinkButton as="a" href="https://example.com">
        Link
      </LinkButton>
    );
    const link = screen.getByRole('link');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveClass('link-button');
  });

  it('renders as a custom component and forwards link-like props', () => {
    const CustomLink = ({
      to,
      ...rest
    }: { to: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a data-to={to} {...rest} />
    );
    render(
      <LinkButton as={CustomLink} to="/dashboard">
        Dashboard
      </LinkButton>
    );
    const link = screen.getByText('Dashboard');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('data-to', '/dashboard');
    expect(link).toHaveClass('link-button');
  });

  describe('underline variant', () => {
    it('applies link-button-underline and is-text classes', () => {
      render(<LinkButton variant="underline">Underline</LinkButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'button',
        'is-text',
        'link-button',
        'link-button-underline'
      );
      expect(button).not.toHaveClass('is-ghost');
    });

    it('combines underline with color classes', () => {
      render(
        <LinkButton variant="underline" color="danger">
          Danger Underline
        </LinkButton>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'link-button',
        'link-button-underline',
        'link-button-danger'
      );
    });

    it('respects classPrefix for underline class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <LinkButton variant="underline" color="primary">
            Test
          </LinkButton>
        </ConfigProvider>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('my-prefix-link-button');
      expect(button).toHaveClass('my-prefix-link-button-underline');
      expect(button).toHaveClass('my-prefix-link-button-primary');
    });
  });

  describe('ConfigProvider prefix support', () => {
    it('applies classPrefix to Button classes', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <LinkButton>Test</LinkButton>
        </ConfigProvider>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('my-prefix-button');
      expect(button).toHaveClass('my-prefix-is-text');
    });

    it('prefixes link-button classes', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <LinkButton color="primary">Test</LinkButton>
        </ConfigProvider>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('my-prefix-link-button');
      expect(button).toHaveClass('my-prefix-link-button-primary');
    });
  });
});
