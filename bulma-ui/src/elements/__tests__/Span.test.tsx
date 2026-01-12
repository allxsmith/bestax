import { render, screen } from '@testing-library/react';
import { Span } from '../Span';
import { ConfigProvider } from '../../helpers/Config';

describe('Span Component', () => {
  test('renders children content', () => {
    render(<Span>Test Content</Span>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('renders as span element', () => {
    render(<Span data-testid="span">Test</Span>);
    const span = screen.getByTestId('span');
    expect(span.tagName).toBe('SPAN');
  });

  test('applies custom className', () => {
    render(<Span className="custom-class">Test</Span>);
    expect(screen.getByText('Test')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  test('applies textColor class', () => {
    render(<Span textColor="primary">Test</Span>);
    expect(screen.getByText('Test')).toHaveClass('has-text-primary', {
      exact: false,
    });
  });

  test('applies bgColor class', () => {
    render(<Span bgColor="light">Test</Span>);
    expect(screen.getByText('Test')).toHaveClass('has-background-light', {
      exact: false,
    });
  });

  test('applies Bulma helper classes', () => {
    render(
      <Span m="3" p="4" textAlign="centered" textWeight="bold">
        Test
      </Span>
    );
    const span = screen.getByText('Test');
    expect(span).toHaveClass('m-3', { exact: false });
    expect(span).toHaveClass('p-4', { exact: false });
    expect(span).toHaveClass('has-text-centered', { exact: false });
    expect(span).toHaveClass('has-text-weight-bold', { exact: false });
  });

  test('applies textSize class', () => {
    render(<Span textSize="3">Large Text</Span>);
    expect(screen.getByText('Large Text')).toHaveClass('is-size-3', {
      exact: false,
    });
  });

  test('passes HTML attributes to span', () => {
    render(
      <Span
        id="span-id"
        data-testid="span"
        aria-label="Span"
        title="Span title"
      >
        Test
      </Span>
    );
    const span = screen.getByTestId('span');
    expect(span).toHaveAttribute('id', 'span-id');
    expect(span).toHaveAttribute('aria-label', 'Span');
    expect(span).toHaveAttribute('title', 'Span title');
  });

  test('does not pass non-HTML props to span', () => {
    render(
      <Span textColor="primary" bgColor="light" m="3" data-testid="span">
        Test
      </Span>
    );
    const span = screen.getByTestId('span');
    expect(span).not.toHaveAttribute('textColor');
    expect(span).not.toHaveAttribute('bgColor');
    expect(span).not.toHaveAttribute('m');
  });

  test('renders without className when no classes are applied', () => {
    render(<Span data-testid="span">Plain Span</Span>);
    const span = screen.getByTestId('span');
    expect(span.getAttribute('class')).toBeNull();
  });

  test('combines multiple color-related classes', () => {
    render(
      <Span textColor="primary" bgColor="light">
        Styled Span
      </Span>
    );
    const span = screen.getByText('Styled Span');
    expect(span).toHaveClass('has-text-primary', { exact: false });
    expect(span).toHaveClass('has-background-light', { exact: false });
  });

  describe('ClassPrefix', () => {
    it('applies prefix to helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Span m="2" p="3">
            Test Span
          </Span>
        </ConfigProvider>
      );
      const span = screen.getByText('Test Span');
      expect(span).toHaveClass('bulma-m-2');
      expect(span).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      render(
        <Span m="4" textAlign="centered">
          Standard Span
        </Span>
      );
      const span = screen.getByText('Standard Span');
      expect(span).toHaveClass('m-4');
      expect(span).toHaveClass('has-text-centered');
    });

    it('uses default classes when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Span m="2">Test</Span>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('m-2');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Span p="3">Test</Span>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('p-3');
    });
  });
});
