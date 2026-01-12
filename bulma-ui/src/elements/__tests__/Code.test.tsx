import { render, screen } from '@testing-library/react';
import { Code } from '../Code';
import { ConfigProvider } from '../../helpers/Config';

describe('Code Component', () => {
  test('renders children content', () => {
    render(<Code>{'console.log("test")'}</Code>);
    expect(screen.getByText('console.log("test")')).toBeInTheDocument();
  });

  test('renders as code element', () => {
    render(<Code data-testid="code">Test</Code>);
    const code = screen.getByTestId('code');
    expect(code.tagName).toBe('CODE');
  });

  test('applies custom className', () => {
    render(<Code className="custom-class">Test</Code>);
    expect(screen.getByText('Test')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  test('applies textColor class', () => {
    render(<Code textColor="primary">Test</Code>);
    expect(screen.getByText('Test')).toHaveClass('has-text-primary', {
      exact: false,
    });
  });

  test('applies bgColor class', () => {
    render(<Code bgColor="light">Test</Code>);
    expect(screen.getByText('Test')).toHaveClass('has-background-light', {
      exact: false,
    });
  });

  test('applies Bulma helper classes', () => {
    render(
      <Code m="3" p="4" textSize="5" data-testid="code">
        Test
      </Code>
    );
    const code = screen.getByTestId('code');
    expect(code).toHaveClass('m-3', { exact: false });
    expect(code).toHaveClass('p-4', { exact: false });
    expect(code).toHaveClass('is-size-5', { exact: false });
  });

  test('passes HTML attributes to code', () => {
    render(
      <Code
        id="code-id"
        data-testid="code"
        aria-label="Code"
        title="Code title"
      >
        Test
      </Code>
    );
    const code = screen.getByTestId('code');
    expect(code).toHaveAttribute('id', 'code-id');
    expect(code).toHaveAttribute('aria-label', 'Code');
    expect(code).toHaveAttribute('title', 'Code title');
  });

  test('does not pass non-HTML props to code', () => {
    render(
      <Code textColor="primary" bgColor="light" m="3" data-testid="code">
        Test
      </Code>
    );
    const code = screen.getByTestId('code');
    expect(code).not.toHaveAttribute('textColor');
    expect(code).not.toHaveAttribute('bgColor');
    expect(code).not.toHaveAttribute('m');
  });

  test('renders without className when no classes are applied', () => {
    render(<Code data-testid="code">Plain Code</Code>);
    const code = screen.getByTestId('code');
    expect(code.getAttribute('class')).toBeNull();
  });

  test('combines multiple color-related classes', () => {
    render(
      <Code textColor="primary" bgColor="light">
        Styled Code
      </Code>
    );
    const code = screen.getByText('Styled Code');
    expect(code).toHaveClass('has-text-primary', { exact: false });
    expect(code).toHaveClass('has-background-light', { exact: false });
  });

  test('preserves whitespace in code content', () => {
    render(<Code data-testid="code">const x = 1;</Code>);
    expect(screen.getByTestId('code').textContent).toBe('const x = 1;');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Code m="2" p="3">
            Test Code
          </Code>
        </ConfigProvider>
      );
      const code = screen.getByText('Test Code');
      expect(code).toHaveClass('bulma-m-2');
      expect(code).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      render(
        <Code m="4" textAlign="centered">
          Standard Code
        </Code>
      );
      const code = screen.getByText('Standard Code');
      expect(code).toHaveClass('m-4');
      expect(code).toHaveClass('has-text-centered');
    });

    it('uses default classes when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Code m="2">Test</Code>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('m-2');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Code p="3">Test</Code>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('p-3');
    });
  });
});
