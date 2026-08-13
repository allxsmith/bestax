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
  test('applies margin helper class', () => {
    render(<Box m="3">Test</Box>);
    expect(screen.getByText('Test')).toHaveClass('m-3', { exact: false });
  });

  test('applies padding helper class', () => {
    render(<Box p="4">Test</Box>);
    expect(screen.getByText('Test')).toHaveClass('p-4', { exact: false });
  });

  test('applies textAlign helper class', () => {
    render(<Box textAlign="centered">Test</Box>);
    expect(screen.getByText('Test')).toHaveClass('has-text-centered', {
      exact: false,
    });
  });

  test('applies textWeight helper class', () => {
    render(<Box textWeight="bold">Test</Box>);
    expect(screen.getByText('Test')).toHaveClass('has-text-weight-bold', {
      exact: false,
    });
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
  test('color classes do not support viewport-specific classes', () => {
    render(
      <Box textColor="primary" viewport="tablet">
        Test
      </Box>
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

  describe('ClassPrefix', () => {
    it('applies classPrefix to main class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <Box>Test</Box>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('my-prefix-box');
    });

    it('uses default class when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Box>Test</Box>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('box');
    });

    it('uses default class when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Box>Test</Box>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('box');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Box hasShadow={false} m="2">
            Test Box
          </Box>
        </ConfigProvider>
      );

      const box = screen.getByText('Test Box');
      expect(box).toHaveClass('bulma-box');
      expect(box).toHaveClass('bulma-is-shadowless');
      expect(box).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(
        <Box hasShadow={false} p="3">
          Standard Box
        </Box>
      );

      const box = screen.getByText('Standard Box');
      expect(box).toHaveClass('box');
      expect(box).toHaveClass('is-shadowless');
      expect(box).toHaveClass('p-3');
    });
  });
});

describe('Box color text alias', () => {
  it('renders has-text-primary when only color is set', () => {
    const { container } = render(<Box color="primary">Content</Box>);
    expect(container.querySelector('.box')).toHaveClass('has-text-primary');
  });

  it('gives textColor precedence when both are set', () => {
    const { container } = render(
      <Box textColor="danger" color="primary">
        Content
      </Box>
    );
    const box = container.querySelector('.box');
    expect(box).toHaveClass('has-text-danger');
    expect(box).not.toHaveClass('has-text-primary');
  });

  describe('Scheme backgrounds', () => {
    it('renders a scheme bgColor as an inline var() style, not a class', () => {
      const { container } = render(
        <Box bgColor="scheme-main-bis">Content</Box>
      );
      const box = container.querySelector('.box') as HTMLElement;
      expect(box.className).not.toContain('has-background-');
      expect(box.style.backgroundColor).toBe('var(--bulma-scheme-main-bis)');
    });

    it('renders the scheme style unchanged under a classPrefix', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Box bgColor="scheme-main-ter">Content</Box>
        </ConfigProvider>
      );
      const box = container.querySelector('.bulma-box') as HTMLElement;
      expect(box.className).not.toContain('has-background-');
      expect(box.style.backgroundColor).toBe('var(--bulma-scheme-main-ter)');
    });

    it('lets a user style win over the scheme helper style', () => {
      const { container } = render(
        <Box bgColor="scheme-main-bis" style={{ backgroundColor: 'red' }}>
          Content
        </Box>
      );
      const box = container.querySelector('.box') as HTMLElement;
      expect(box.style.backgroundColor).toBe('red');
    });

    it('renders no style attribute without a scheme bgColor or user style', () => {
      const { container } = render(<Box bgColor="light">Content</Box>);
      const box = container.querySelector('.box') as HTMLElement;
      expect(box).toHaveClass('has-background-light');
      expect(box.getAttribute('style')).toBeNull();
    });
  });
});
