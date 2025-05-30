import { render, screen } from '@testing-library/react';
import { Progress, ProgressProps } from '../Progress';

describe('Progress Component', () => {
  const defaultProps: ProgressProps = {
    value: 50,
    max: 100,
  };

  test('renders progress bar with default props', () => {
    render(<Progress {...defaultProps} />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveClass('progress');
    expect(progress).toHaveAttribute('value', '50');
    expect(progress).toHaveAttribute('max', '100');
  });

  test('applies color class correctly', () => {
    render(<Progress {...defaultProps} color="primary" />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveClass('progress is-primary');
  });

  test('applies size class correctly', () => {
    render(<Progress {...defaultProps} size="large" />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveClass('progress is-large');
  });

  test('renders without value or max', () => {
    render(<Progress />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveClass('progress');
    expect(progress).not.toHaveAttribute('value');
    expect(progress).not.toHaveAttribute('max');
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(<Progress {...defaultProps} m="4" />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveClass('progress m-4');
  });

  test('applies custom className', () => {
    render(<Progress {...defaultProps} className="custom-progress" />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveClass('progress custom-progress');
  });

  test('forwards additional HTML attributes', () => {
    render(<Progress {...defaultProps} data-testid="custom-progress" />);
    const progress = screen.getByTestId('custom-progress');
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveClass('progress');
  });

  test('renders children content', () => {
    render(<Progress {...defaultProps}>50%</Progress>);
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveTextContent('50%');
  });
});
