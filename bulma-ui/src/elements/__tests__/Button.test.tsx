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

  it('applies helper classes via rest props', () => {
    render(
      <Button
        textColor="success"
        m="2"
        textAlign="centered"
        viewport="mobile"
      />
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'button',
      'has-text-success-mobile',
      'm-2-mobile',
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
  });
});
