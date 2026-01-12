import { render, screen } from '@testing-library/react';
import { Pre } from '../Pre';
import { ConfigProvider } from '../../helpers/Config';

describe('Pre Component', () => {
  test('renders children content', () => {
    render(<Pre>Preformatted text</Pre>);
    expect(screen.getByText('Preformatted text')).toBeInTheDocument();
  });

  test('renders as pre element', () => {
    render(<Pre data-testid="pre">Test</Pre>);
    const pre = screen.getByTestId('pre');
    expect(pre.tagName).toBe('PRE');
  });

  test('applies custom className', () => {
    render(<Pre className="custom-class">Test</Pre>);
    expect(screen.getByText('Test')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  test('applies textColor class', () => {
    render(<Pre textColor="primary">Test</Pre>);
    expect(screen.getByText('Test')).toHaveClass('has-text-primary', {
      exact: false,
    });
  });

  test('applies bgColor class', () => {
    render(<Pre bgColor="light">Test</Pre>);
    expect(screen.getByText('Test')).toHaveClass('has-background-light', {
      exact: false,
    });
  });

  test('applies Bulma helper classes', () => {
    render(
      <Pre m="3" p="4" textSize="5" data-testid="pre">
        Test
      </Pre>
    );
    const pre = screen.getByTestId('pre');
    expect(pre).toHaveClass('m-3', { exact: false });
    expect(pre).toHaveClass('p-4', { exact: false });
    expect(pre).toHaveClass('is-size-5', { exact: false });
  });

  test('passes HTML attributes to pre', () => {
    render(
      <Pre id="pre-id" data-testid="pre" aria-label="Pre" title="Pre title">
        Test
      </Pre>
    );
    const pre = screen.getByTestId('pre');
    expect(pre).toHaveAttribute('id', 'pre-id');
    expect(pre).toHaveAttribute('aria-label', 'Pre');
    expect(pre).toHaveAttribute('title', 'Pre title');
  });

  test('does not pass non-HTML props to pre', () => {
    render(
      <Pre textColor="primary" bgColor="light" m="3" data-testid="pre">
        Test
      </Pre>
    );
    const pre = screen.getByTestId('pre');
    expect(pre).not.toHaveAttribute('textColor');
    expect(pre).not.toHaveAttribute('bgColor');
    expect(pre).not.toHaveAttribute('m');
  });

  test('renders without className when no classes are applied', () => {
    render(<Pre data-testid="pre">Plain Pre</Pre>);
    const pre = screen.getByTestId('pre');
    expect(pre.getAttribute('class')).toBeNull();
  });

  test('combines multiple color-related classes', () => {
    render(
      <Pre textColor="white" bgColor="dark">
        Styled Pre
      </Pre>
    );
    const pre = screen.getByText('Styled Pre');
    expect(pre).toHaveClass('has-text-white', { exact: false });
    expect(pre).toHaveClass('has-background-dark', { exact: false });
  });

  test('preserves whitespace and formatting', () => {
    const multilineContent = `line 1
line 2
  indented line`;
    render(<Pre data-testid="pre">{multilineContent}</Pre>);
    expect(screen.getByTestId('pre').textContent).toBe(multilineContent);
  });

  test('preserves multiple spaces', () => {
    const spacedContent = 'word    word';
    render(<Pre data-testid="pre">{spacedContent}</Pre>);
    expect(screen.getByTestId('pre').textContent).toBe('word    word');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Pre m="2" p="3">
            Test Pre
          </Pre>
        </ConfigProvider>
      );
      const pre = screen.getByText('Test Pre');
      expect(pre).toHaveClass('bulma-m-2');
      expect(pre).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      render(
        <Pre m="4" textAlign="centered">
          Standard Pre
        </Pre>
      );
      const pre = screen.getByText('Standard Pre');
      expect(pre).toHaveClass('m-4');
      expect(pre).toHaveClass('has-text-centered');
    });

    it('uses default classes when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Pre m="2">Test</Pre>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('m-2');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Pre p="3">Test</Pre>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('p-3');
    });
  });
});
