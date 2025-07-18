import { render, screen } from '@testing-library/react';
import { Skeleton } from '../Skeleton'; // Adjust the import path as needed

describe('Skeleton', () => {
  it('renders a block skeleton by default', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('skeleton-block');
  });

  it('renders children inside the block skeleton', () => {
    render(<Skeleton data-testid="skeleton">Test Content</Skeleton>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders a skeleton-lines container with the correct number of lines', () => {
    render(<Skeleton variant="lines" lines={4} data-testid="skeleton-lines" />);
    const skeletonLines = screen.getByTestId('skeleton-lines');
    expect(skeletonLines).toHaveClass('skeleton-lines');
    // Each line is a child div (no content)
    expect(skeletonLines.querySelectorAll('div')).toHaveLength(4);
  });

  it('renders 3 lines by default for the lines variant', () => {
    render(<Skeleton variant="lines" data-testid="skeleton-lines" />);
    const skeletonLines = screen.getByTestId('skeleton-lines');
    expect(skeletonLines.querySelectorAll('div')).toHaveLength(3);
  });

  it('applies the className prop', () => {
    render(<Skeleton className="my-custom-class" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('my-custom-class');
  });
});
