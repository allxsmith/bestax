import { render, screen } from '@testing-library/react';
import { Link } from '../Link';
import { ConfigProvider } from '../../helpers/Config';

describe('Link Component', () => {
  test('renders children content', () => {
    render(<Link href="#">Test Link</Link>);
    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });

  test('renders as anchor element', () => {
    render(<Link href="#">Link</Link>);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  test('applies href attribute', () => {
    render(<Link href="https://example.com">External Link</Link>);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://example.com'
    );
  });

  test('applies target attribute', () => {
    render(
      <Link href="#" target="_blank">
        New Tab Link
      </Link>
    );
    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
  });

  test('applies rel attribute', () => {
    render(
      <Link href="#" rel="noopener noreferrer">
        Secure Link
      </Link>
    );
    expect(screen.getByRole('link')).toHaveAttribute(
      'rel',
      'noopener noreferrer'
    );
  });

  test('applies custom className', () => {
    render(
      <Link href="#" className="custom-class">
        Test
      </Link>
    );
    expect(screen.getByRole('link')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  test('applies textColor class', () => {
    render(
      <Link href="#" textColor="primary">
        Test
      </Link>
    );
    expect(screen.getByRole('link')).toHaveClass('has-text-primary', {
      exact: false,
    });
  });

  test('applies bgColor class', () => {
    render(
      <Link href="#" bgColor="light">
        Test
      </Link>
    );
    expect(screen.getByRole('link')).toHaveClass('has-background-light', {
      exact: false,
    });
  });

  test('applies isActive class', () => {
    render(
      <Link href="#" isActive>
        Active Link
      </Link>
    );
    expect(screen.getByRole('link')).toHaveClass('is-active', { exact: false });
  });

  test('does not apply is-active class when isActive is false', () => {
    render(
      <Link href="#" isActive={false}>
        Inactive Link
      </Link>
    );
    expect(screen.getByRole('link')).not.toHaveClass('is-active');
  });

  test('applies Bulma helper classes', () => {
    render(
      <Link href="#" m="3" p="4" textWeight="bold">
        Test
      </Link>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveClass('m-3', { exact: false });
    expect(link).toHaveClass('p-4', { exact: false });
    expect(link).toHaveClass('has-text-weight-bold', { exact: false });
  });

  test('passes HTML attributes to anchor', () => {
    render(
      <Link
        href="#"
        id="link-id"
        data-testid="link"
        aria-label="Test link"
        title="Link title"
      >
        Test
      </Link>
    );
    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('id', 'link-id');
    expect(link).toHaveAttribute('aria-label', 'Test link');
    expect(link).toHaveAttribute('title', 'Link title');
  });

  test('does not pass non-HTML props to anchor', () => {
    render(
      <Link
        href="#"
        textColor="primary"
        bgColor="light"
        m="3"
        data-testid="link"
      >
        Test
      </Link>
    );
    const link = screen.getByTestId('link');
    expect(link).not.toHaveAttribute('textColor');
    expect(link).not.toHaveAttribute('bgColor');
    expect(link).not.toHaveAttribute('m');
  });

  test('renders without className when no classes are applied', () => {
    render(<Link href="#">Plain Link</Link>);
    const link = screen.getByRole('link');
    expect(link.getAttribute('class')).toBeNull();
  });

  describe('ClassPrefix', () => {
    it('applies classPrefix to is-active class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <Link href="#" isActive>
            Test
          </Link>
        </ConfigProvider>
      );
      expect(screen.getByRole('link')).toHaveClass('my-prefix-is-active');
    });

    it('applies prefix to helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Link href="#" m="2" p="3">
            Test Link
          </Link>
        </ConfigProvider>
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('bulma-m-2');
      expect(link).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      render(
        <Link href="#" m="4" textAlign="centered">
          Standard Link
        </Link>
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('m-4');
      expect(link).toHaveClass('has-text-centered');
    });
  });
});
