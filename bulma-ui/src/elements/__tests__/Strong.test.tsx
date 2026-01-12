import { render, screen } from '@testing-library/react';
import { Strong } from '../Strong';
import { ConfigProvider } from '../../helpers/Config';

describe('Strong Component', () => {
  test('renders children content', () => {
    render(<Strong>Important text</Strong>);
    expect(screen.getByText('Important text')).toBeInTheDocument();
  });

  test('renders as strong element', () => {
    render(<Strong data-testid="strong">Test</Strong>);
    const strong = screen.getByTestId('strong');
    expect(strong.tagName).toBe('STRONG');
  });

  test('applies custom className', () => {
    render(<Strong className="custom-class">Test</Strong>);
    expect(screen.getByText('Test')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  test('applies textColor class', () => {
    render(<Strong textColor="primary">Test</Strong>);
    expect(screen.getByText('Test')).toHaveClass('has-text-primary', {
      exact: false,
    });
  });

  test('applies bgColor class', () => {
    render(<Strong bgColor="light">Test</Strong>);
    expect(screen.getByText('Test')).toHaveClass('has-background-light', {
      exact: false,
    });
  });

  test('applies Bulma helper classes', () => {
    render(
      <Strong m="3" p="4" textSize="5" data-testid="strong">
        Test
      </Strong>
    );
    const strong = screen.getByTestId('strong');
    expect(strong).toHaveClass('m-3', { exact: false });
    expect(strong).toHaveClass('p-4', { exact: false });
    expect(strong).toHaveClass('is-size-5', { exact: false });
  });

  test('passes HTML attributes to strong', () => {
    render(
      <Strong
        id="strong-id"
        data-testid="strong"
        aria-label="Strong"
        title="Strong title"
      >
        Test
      </Strong>
    );
    const strong = screen.getByTestId('strong');
    expect(strong).toHaveAttribute('id', 'strong-id');
    expect(strong).toHaveAttribute('aria-label', 'Strong');
    expect(strong).toHaveAttribute('title', 'Strong title');
  });

  test('does not pass non-HTML props to strong', () => {
    render(
      <Strong textColor="primary" bgColor="light" m="3" data-testid="strong">
        Test
      </Strong>
    );
    const strong = screen.getByTestId('strong');
    expect(strong).not.toHaveAttribute('textColor');
    expect(strong).not.toHaveAttribute('bgColor');
    expect(strong).not.toHaveAttribute('m');
  });

  test('renders without className when no classes are applied', () => {
    render(<Strong data-testid="strong">Plain Strong</Strong>);
    const strong = screen.getByTestId('strong');
    expect(strong.getAttribute('class')).toBeNull();
  });

  test('combines multiple color-related classes', () => {
    render(
      <Strong textColor="primary" bgColor="light">
        Styled Strong
      </Strong>
    );
    const strong = screen.getByText('Styled Strong');
    expect(strong).toHaveClass('has-text-primary', { exact: false });
    expect(strong).toHaveClass('has-background-light', { exact: false });
  });

  describe('ClassPrefix', () => {
    it('applies prefix to helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Strong m="2" p="3">
            Test Strong
          </Strong>
        </ConfigProvider>
      );
      const strong = screen.getByText('Test Strong');
      expect(strong).toHaveClass('bulma-m-2');
      expect(strong).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      render(
        <Strong m="4" textAlign="centered">
          Standard Strong
        </Strong>
      );
      const strong = screen.getByText('Standard Strong');
      expect(strong).toHaveClass('m-4');
      expect(strong).toHaveClass('has-text-centered');
    });

    it('uses default classes when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Strong m="2">Test</Strong>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('m-2');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Strong p="3">Test</Strong>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('p-3');
    });
  });
});
