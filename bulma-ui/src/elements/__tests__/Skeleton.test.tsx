import { render, screen } from '@testing-library/react';
import { Skeleton } from '../Skeleton'; // Adjust the import path as needed
import { ConfigProvider } from '../../helpers/Config';

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

  describe('ClassPrefix', () => {
    test('applies classPrefix to skeleton-block class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <Skeleton data-testid="skeleton" />
        </ConfigProvider>
      );
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('my-prefix-skeleton-block');
    });

    test('applies classPrefix to skeleton-lines class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <Skeleton variant="lines" data-testid="skeleton" />
        </ConfigProvider>
      );
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('my-prefix-skeleton-lines');
    });

    test('uses default classes when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Skeleton data-testid="skeleton" />
        </ConfigProvider>
      );
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('skeleton-block');
    });

    test('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Skeleton variant="lines" data-testid="skeleton" />
        </ConfigProvider>
      );
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('skeleton-lines');
    });

    it('applies prefix to both main class and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Skeleton variant="lines" lines={5} className="custom-class" />
        </ConfigProvider>
      );

      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveClass('bulma-skeleton-lines');
      expect(skeleton).toHaveClass('custom-class');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Skeleton variant="block" className="test-class" />
      );

      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveClass('skeleton-block');
      expect(skeleton).toHaveClass('test-class');
    });
  });
});
