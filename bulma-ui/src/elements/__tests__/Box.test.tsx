import { render, screen } from '@testing-library/react';
import { Box } from '../Box'; // Adjust the import path based on your project structure
import { ConfigProvider } from '../../helpers/Config';

describe('Box Component', () => {
  // Test 1: Renders children correctly
  test('renders children content', () => {
    render(<Box>Test Content</Box>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  // Test 2: Applies base box class
  test('applies base box class', () => {
    render(<Box>Test</Box>);
    expect(screen.getByText('Test')).toHaveClass('box', { exact: false });
  });

  // Test 3: Applies custom className
  test('applies custom className', () => {
    render(<Box className="custom-class">Test</Box>);
    expect(screen.getByText('Test')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  // Test 4: Applies textColor (has-text-*) class
  test('applies textColor class', () => {
    render(<Box textColor="primary">Test</Box>);
    expect(screen.getByText('Test')).toHaveClass('has-text-primary', {
      exact: false,
    });
  });

  // Test 5: Applies bgColor (has-background-*) class
  test('applies bgColor class', () => {
    render(<Box bgColor="light">Test</Box>);
    expect(screen.getByText('Test')).toHaveClass('has-background-light', {
      exact: false,
    });
  });

  // Test 6: Applies hasShadow prop (default true, no is-shadowless)
  test('has shadow by default', () => {
    render(<Box>Test</Box>);
    expect(screen.getByText('Test')).not.toHaveClass('is-shadowless', {
      exact: false,
    });
  });

  // Test 7: Applies is-shadowless when hasShadow is false
  test('applies is-shadowless when hasShadow is false', () => {
    render(<Box hasShadow={false}>Test</Box>);
    expect(screen.getByText('Test')).toHaveClass('is-shadowless', {
      exact: false,
    });
  });

  // Test 8: Applies Bulma helper classes from useBulmaClasses
  test('applies Bulma helper classes', () => {
    render(
      <Box m="3" p="4" textAlign="centered" textWeight="bold">
        Test
      </Box>
    );
    const box = screen.getByText('Test');
    expect(box).toHaveClass('m-3', { exact: false });
    expect(box).toHaveClass('p-4', { exact: false });
    expect(box).toHaveClass('has-text-centered', { exact: false });
    expect(box).toHaveClass('has-text-weight-bold', { exact: false });
  });

  // Test 9: Passes HTML attributes to div
  test('passes HTML attributes to div', () => {
    render(
      <Box id="box-id" data-testid="box" aria-label="Box">
        Test
      </Box>
    );
    const box = screen.getByTestId('box');
    expect(box).toHaveAttribute('id', 'box-id');
    expect(box).toHaveAttribute('aria-label', 'Box');
  });

  // Test 10: Does not pass non-HTML props to div
  test('does not pass non-HTML props to div', () => {
    render(
      <Box
        textColor="primary"
        bgColor="light"
        m="3"
        hasShadow={false}
        data-testid="box"
      >
        Test
      </Box>
    );
    const box = screen.getByTestId('box');
    expect(box).not.toHaveAttribute('textColor');
    expect(box).not.toHaveAttribute('bgColor');
    expect(box).not.toHaveAttribute('m');
    expect(box).not.toHaveAttribute('hasShadow');
  });

  // Test 11: Applies viewport-specific classes
  test('applies viewport-specific classes', () => {
    render(
      <Box textColor="primary" viewport="tablet">
        Test
      </Box>
    );
    expect(screen.getByText('Test')).toHaveClass('has-text-primary-tablet', {
      exact: false,
    });
  });

  // Test 12: Handles valid props correctly
  test('applies valid Bulma props', () => {
    render(
      <Box textColor="primary" m="1">
        Test
      </Box>
    );
    const box = screen.getByText('Test');
    expect(box).toHaveClass('box', { exact: false });
    expect(box).toHaveClass('has-text-primary');
    expect(box).toHaveClass('m-1');
  });

  // Test 13: Applies classPrefix to main class
  test('applies classPrefix to main class', () => {
    render(
      <ConfigProvider classPrefix="my-prefix-">
        <Box>Test</Box>
      </ConfigProvider>
    );
    expect(screen.getByText('Test')).toHaveClass('my-prefix-box', {
      exact: false,
    });
  });

  test('uses default class when no classPrefix provided', () => {
    render(
      <ConfigProvider>
        <Box>Test</Box>
      </ConfigProvider>
    );
    expect(screen.getByText('Test')).toHaveClass('box', { exact: false });
  });

  test('uses default class when classPrefix is undefined', () => {
    render(
      <ConfigProvider classPrefix={undefined}>
        <Box>Test</Box>
      </ConfigProvider>
    );
    expect(screen.getByText('Test')).toHaveClass('box', { exact: false });
  });
});
