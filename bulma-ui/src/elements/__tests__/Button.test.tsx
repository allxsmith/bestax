import React, { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../Button';
import { ConfigProvider } from '../../helpers/Config';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('applies button-specific classes', () => {
    render(<Button color="primary" size="large" isRounded />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'button',
      'is-primary',
      'is-large',
      'is-rounded'
    );
  });

  test('applies helper classes via rest props', () => {
    render(
      <Button color="success" m="2" textAlign="centered" viewport="mobile">
        Test
      </Button>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'button',
      'is-success', // Button color modifier
      'm-2', // Margin does not support viewport modifiers
      'has-text-centered-mobile'
    );
  });

  it('prioritizes button color over textColor and bgColor', () => {
    render(<Button color="primary" textColor="success" bgColor="info" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'button',
      'is-primary',
      'has-text-success',
      'has-background-info'
    );
    expect(button).not.toHaveClass(
      'has-text-primary',
      'has-background-primary'
    );
  });

  it('forwards HTML attributes from bulmaProps', () => {
    render(
      <Button data-testid="test" onClick={() => {}}>
        Test
      </Button>
    );
    const button = screen.getByTestId('test');
    expect(button).toHaveClass('button');
  });

  it('applies is-ghost class for color="ghost"', () => {
    render(<Button color="ghost">Ghost</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button', 'is-ghost');
  });

  it('applies is-text class for color="text"', () => {
    render(<Button color="text">Text</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button', 'is-text');
  });

  describe('as="a" anchor rendering', () => {
    it('renders as <a> with correct classes and href', () => {
      render(
        <Button as="a" href="https://example.com" color="info">
          Link Button
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('button', 'is-info');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link.tagName).toBe('A');
      expect(link).toHaveTextContent('Link Button');
    });

    it('handles onClick for <a> and isDisabled', () => {
      const handleClick = jest.fn();
      render(
        <Button as="a" href="https://example.com" onClick={handleClick}>
          Anchor Button
        </Button>
      );
      const link = screen.getByRole('link');
      fireEvent.click(link);
      expect(handleClick).toHaveBeenCalled();
    });

    it('prevents default when isDisabled for <a>', () => {
      const handleClick = jest.fn();
      render(
        <Button
          as="a"
          href="https://example.com"
          isDisabled
          onClick={handleClick}
        >
          Disabled Anchor
        </Button>
      );
      const link = screen.getByRole('link');
      fireEvent.click(link);
      expect(handleClick).not.toHaveBeenCalled();
      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('as={Component} custom component rendering', () => {
    it('renders as a custom component and forwards link-like props', () => {
      const CustomLink = ({
        to,
        ...rest
      }: { to: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a data-to={to} {...rest} />
      );
      render(
        <Button as={CustomLink} to="/visit" color="primary">
          Book a visit
        </Button>
      );
      const link = screen.getByText('Book a visit');
      expect(link.tagName).toBe('A');
      expect(link).toHaveClass('button', 'is-primary');
      expect(link).toHaveAttribute('data-to', '/visit');
    });

    it('does not forward button-only attributes to a custom component', () => {
      const CustomLink = (
        props: React.AnchorHTMLAttributes<HTMLAnchorElement>
      ) => <a {...props} />;
      render(
        <Button as={CustomLink} href="#" type="submit" name="foo">
          Custom
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('type');
      expect(link).not.toHaveAttribute('name');
    });
  });

  describe('as="button" native button rendering', () => {
    it('renders as <button> by default', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveClass('button');
    });

    it('handles onClick for <button> and isDisabled', () => {
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} isDisabled>
          Disabled Button
        </Button>
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });
  });

  describe('Fullwidth', () => {
    it('applies is-fullwidth via the canonical isFullwidth prop', () => {
      render(<Button isFullwidth>Wide</Button>);
      expect(screen.getByRole('button')).toHaveClass('is-fullwidth');
    });

    it('applies is-fullwidth via the deprecated isFullWidth prop', () => {
      render(<Button isFullWidth>Wide</Button>);
      expect(screen.getByRole('button')).toHaveClass('is-fullwidth');
    });

    it('isFullwidth wins when both spellings are set', () => {
      render(
        <Button isFullwidth={false} isFullWidth>
          Not wide
        </Button>
      );
      expect(screen.getByRole('button')).not.toHaveClass('is-fullwidth');
    });

    it('does not apply is-fullwidth by default', () => {
      render(<Button>Default</Button>);
      expect(screen.getByRole('button')).not.toHaveClass('is-fullwidth');
    });

    it('applies the class prefix to is-fullwidth', () => {
      render(
        <ConfigProvider classPrefix="bestax-">
          <Button isFullwidth>Wide</Button>
        </ConfigProvider>
      );
      expect(screen.getByRole('button')).toHaveClass('bestax-is-fullwidth');
    });
  });

  describe('ClassPrefix', () => {
    it('applies classPrefix to main class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <Button>Test</Button>
        </ConfigProvider>
      );
      expect(screen.getByRole('button')).toHaveClass('my-prefix-button');
    });

    it('uses default class when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Button>Test</Button>
        </ConfigProvider>
      );
      expect(screen.getByRole('button')).toHaveClass('button');
    });

    it('uses default class when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Button>Test</Button>
        </ConfigProvider>
      );
      expect(screen.getByRole('button')).toHaveClass('button');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Button color="primary" size="large" m="2" isRounded>
            Test Button
          </Button>
        </ConfigProvider>
      );

      const button = screen.getByRole('button', { name: 'Test Button' });
      expect(button).toHaveClass('bulma-button');
      expect(button).toHaveClass('bulma-is-primary');
      expect(button).toHaveClass('bulma-is-large');
      expect(button).toHaveClass('bulma-is-rounded');
      expect(button).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(
        <Button color="info" size="medium" p="3">
          Standard Button
        </Button>
      );

      const button = screen.getByRole('button', { name: 'Standard Button' });
      expect(button).toHaveClass('button');
      expect(button).toHaveClass('is-info');
      expect(button).toHaveClass('is-medium');
      expect(button).toHaveClass('p-3');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to the underlying <button> element', () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Click Me</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toBe(screen.getByRole('button'));
    });

    it('forwards ref to the underlying <a> element when as="a"', () => {
      const ref = createRef<HTMLAnchorElement>();
      render(
        <Button as="a" href="#" ref={ref}>
          Link Button
        </Button>
      );
      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
      expect(ref.current).toBe(screen.getByRole('link'));
    });
  });
});
