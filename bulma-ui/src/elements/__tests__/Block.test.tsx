import { render, screen } from '@testing-library/react';
import { Block } from '../Block'; // Adjust the import path based on your project structure
import { ConfigProvider } from '../../helpers/Config';

describe('Block Component', () => {
  // Test 1: Renders children correctly
  test('renders children content', () => {
    render(<Block>Test Content</Block>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  // Test 2: Applies base block class
  test('applies base block class', () => {
    render(<Block>Test</Block>);
    expect(screen.getByText('Test')).toHaveClass('block', { exact: false });
  });

  // Test 3: Applies custom className
  test('applies custom className', () => {
    render(<Block className="custom-class">Test</Block>);
    expect(screen.getByText('Test')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  // Test 4: Applies textColor (has-text-*) class
  test('applies textColor class', () => {
    render(<Block textColor="primary">Test</Block>);
    expect(screen.getByText('Test')).toHaveClass('has-text-primary', {
      exact: false,
    });
  });

  // Test 5: Applies bgColor (has-background-*) class
  test('applies bgColor class', () => {
    render(<Block bgColor="light">Test</Block>);
    expect(screen.getByText('Test')).toHaveClass('has-background-light', {
      exact: false,
    });
  });

  // Test 6: Applies Bulma helper classes from useBulmaClasses
  test('applies Bulma helper classes', () => {
    render(
      <Block m="3" p="4" textAlign="centered" textWeight="bold">
        Test
      </Block>
    );
    const block = screen.getByText('Test');
    expect(block).toHaveClass('m-3', { exact: false });
    expect(block).toHaveClass('p-4', { exact: false });
    expect(block).toHaveClass('has-text-centered', { exact: false });
    expect(block).toHaveClass('has-text-weight-bold', { exact: false });
  });

  // Test 7: Passes HTML attributes to div
  test('passes HTML attributes to div', () => {
    render(
      <Block id="block-id" data-testid="block" aria-label="Block">
        Test
      </Block>
    );
    const block = screen.getByTestId('block');
    expect(block).toHaveAttribute('id', 'block-id');
    expect(block).toHaveAttribute('aria-label', 'Block');
  });

  // Test 8: Does not pass non-HTML props to div
  test('does not pass non-HTML props to div', () => {
    render(
      <Block textColor="primary" bgColor="light" m="3" data-testid="block">
        Test
      </Block>
    );
    const block = screen.getByTestId('block');
    expect(block).not.toHaveAttribute('textColor');
    expect(block).not.toHaveAttribute('bgColor');
    expect(block).not.toHaveAttribute('m');
  });

  // Test 9: Applies viewport-specific classes
  test('applies viewport-specific classes', () => {
    render(
      <Block textColor="primary" viewport="tablet">
        Test
      </Block>
    );
    expect(screen.getByText('Test')).toHaveClass('has-text-primary-tablet', {
      exact: false,
    });
  });

  // Test 10: Handles valid props correctly
  test('applies valid Bulma props', () => {
    render(
      <Block textColor="primary" m="1">
        Test
      </Block>
    );
    const block = screen.getByText('Test');
    expect(block).toHaveClass('block', { exact: false });
    expect(block).toHaveClass('has-text-primary');
    expect(block).toHaveClass('m-1');
  });

  describe('ClassPrefix', () => {
    it('applies classPrefix to main class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <Block>Test</Block>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('my-prefix-block');
    });

    it('uses default class when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Block>Test</Block>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('block');
    });

    it('uses default class when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Block>Test</Block>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('block');
    });

    it('applies prefix to both main class and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Block m="2" p="3">
            Test Block
          </Block>
        </ConfigProvider>
      );

      const block = container.querySelector('div');
      expect(block).toHaveClass('bulma-block');
      expect(block).toHaveClass('bulma-m-2');
      expect(block).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Block m="4" textAlign="centered">
          Standard Block
        </Block>
      );

      const block = container.querySelector('div');
      expect(block).toHaveClass('block');
      expect(block).toHaveClass('m-4');
      expect(block).toHaveClass('has-text-centered');
    });
  });
});
