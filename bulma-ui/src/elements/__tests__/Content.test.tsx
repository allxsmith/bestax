import { render, screen } from '@testing-library/react';
import { Content } from '../Content';
import { ConfigProvider } from '../../helpers/Config';

describe('Content Component', () => {
  // Test 1: Renders children correctly
  test('renders children content', () => {
    render(<Content>Test Content</Content>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  // Test 2: Applies base content class
  test('applies base content class', () => {
    render(<Content>Test</Content>);
    expect(screen.getByText('Test')).toHaveClass('content', { exact: false });
  });

  // Test 3: Applies custom className
  test('applies custom className', () => {
    render(<Content className="custom-class">Test</Content>);
    expect(screen.getByText('Test')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  // Test 4: Applies textColor (has-text-*) class
  test('applies textColor class', () => {
    render(<Content textColor="primary">Test</Content>);
    expect(screen.getByText('Test')).toHaveClass('has-text-primary', {
      exact: false,
    });
  });

  // Test 5: Applies bgColor (has-background-*) class
  test('applies bgColor class', () => {
    render(<Content bgColor="light">Test</Content>);
    expect(screen.getByText('Test')).toHaveClass('has-background-light', {
      exact: false,
    });
  });

  // Test 6: Applies size modifier classes (split into separate tests)
  test('applies small size modifier class', () => {
    render(<Content size="small">Test</Content>);
    expect(screen.getByText('Test')).toHaveClass('is-small', { exact: false });
    expect(screen.getByText('Test')).toHaveClass('content', { exact: false });
  });

  test('applies medium size modifier class', () => {
    render(<Content size="medium">Test</Content>);
    expect(screen.getByText('Test')).toHaveClass('is-medium', { exact: false });
    expect(screen.getByText('Test')).toHaveClass('content', { exact: false });
  });

  test('applies large size modifier class', () => {
    render(<Content size="large">Test</Content>);
    expect(screen.getByText('Test')).toHaveClass('is-large', { exact: false });
    expect(screen.getByText('Test')).toHaveClass('content', { exact: false });
  });

  test('does not apply modifier class for normal size', () => {
    render(<Content size="normal">Test</Content>);
    expect(screen.getByText('Test')).not.toHaveClass('is-normal', {
      exact: false,
    });
    expect(screen.getByText('Test')).toHaveClass('content', { exact: false });
  });

  // Test 7: Applies Bulma helper classes from useBulmaClasses
  test('applies Bulma helper classes', () => {
    render(
      <Content m="3" p="4" textAlign="centered" textWeight="bold">
        Test
      </Content>
    );
    const content = screen.getByText('Test');
    expect(content).toHaveClass('m-3', { exact: false });
    expect(content).toHaveClass('p-4', { exact: false });
    expect(content).toHaveClass('has-text-centered', { exact: false });
    expect(content).toHaveClass('has-text-weight-bold', { exact: false });
  });

  // Test 8: Passes HTML attributes to div
  test('passes HTML attributes to div', () => {
    render(
      <Content id="content-id" data-testid="content" aria-label="Content">
        Test
      </Content>
    );
    const content = screen.getByTestId('content');
    expect(content).toHaveAttribute('id', 'content-id');
    expect(content).toHaveAttribute('aria-label', 'Content');
  });

  // Test 9: Does not pass non-HTML props to div
  test('does not pass non-HTML props to div', () => {
    render(
      <Content
        textColor="primary"
        bgColor="light"
        size="medium"
        m="3"
        data-testid="content"
      >
        Test
      </Content>
    );
    const content = screen.getByTestId('content');
    expect(content).not.toHaveAttribute('textColor');
    expect(content).not.toHaveAttribute('bgColor');
    expect(content).not.toHaveAttribute('size');
    expect(content).not.toHaveAttribute('m');
  });

  // Test 10: Color classes do not support viewport-specific classes
  test('color classes do not support viewport-specific classes', () => {
    render(
      <Content textColor="primary" viewport="tablet">
        Test
      </Content>
    );
    expect(screen.getByText('Test')).toHaveClass('has-text-primary', {
      exact: false,
    });
    expect(screen.getByText('Test')).not.toHaveClass(
      'has-text-primary-tablet',
      {
        exact: false,
      }
    );
  });

  // Test 11: Handles invalid props gracefully
  test('ignores invalid Bulma props', () => {
    render(
      <Content
        textColor="invalid-color"
        size="invalid-size"
        m="invalid-size"
        as="invalid"
      >
        Test
      </Content>
    );
    const content = screen.getByText('Test');
    expect(content).toHaveClass('content', { exact: false });
    expect(content).not.toHaveClass('has-text-invalid-color');
    expect(content).not.toHaveClass('is-invalid-size');
    expect(content).not.toHaveClass('m-invalid-size');
  });

  // Test 12: Renders nested HTML elements correctly
  test('renders nested HTML elements with content styling', () => {
    render(
      <Content data-testid="content">
        <h1>Heading</h1>
        <p>Paragraph</p>
        <ul>
          <li>Item</li>
        </ul>
      </Content>
    );
    const content = screen.getByTestId('content');
    expect(content).toHaveClass('content', { exact: false });
    expect(screen.getByText('Heading')).toBeInTheDocument();
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
    expect(screen.getByText('Item')).toBeInTheDocument();
  });

  describe('ClassPrefix', () => {
    it('applies classPrefix to main class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <Content data-testid="content">Test</Content>
        </ConfigProvider>
      );
      expect(screen.getByTestId('content')).toHaveClass('my-prefix-content');
    });

    it('uses default class when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Content data-testid="content">Test</Content>
        </ConfigProvider>
      );
      expect(screen.getByTestId('content')).toHaveClass('content');
    });

    it('uses default class when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Content data-testid="content">Test</Content>
        </ConfigProvider>
      );
      expect(screen.getByTestId('content')).toHaveClass('content');
    });

    it('applies prefix to both main class and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Content size="large" m="2" p="3">
            Test Content
          </Content>
        </ConfigProvider>
      );

      const content = container.querySelector('div');
      expect(content).toHaveClass('bulma-content');
      expect(content).toHaveClass('bulma-is-large');
      expect(content).toHaveClass('bulma-m-2');
      expect(content).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Content size="medium" textAlign="centered">
          Standard Content
        </Content>
      );

      const content = container.querySelector('div');
      expect(content).toHaveClass('content');
      expect(content).toHaveClass('is-medium');
      expect(content).toHaveClass('has-text-centered');
    });
  });
});
