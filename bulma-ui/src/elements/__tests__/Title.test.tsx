import { render, screen, cleanup } from '@testing-library/react';
import { Title, TitleProps } from '../Title';
import { ConfigProvider } from '../../helpers/Config';

describe('Title Component', () => {
  const defaultProps: TitleProps = {
    children: 'Test Title',
  };

  afterEach(() => {
    cleanup();
  });

  test('renders title with default props', () => {
    render(<Title {...defaultProps} />);
    const title = screen.getByRole('heading', { name: 'Test Title', level: 1 });
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H1');
    expect(title).toHaveClass('title');
  });

  test('renders as paragraph with as="p"', () => {
    render(<Title {...defaultProps} as="p" />);
    const title = screen.getByText('Test Title');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('P');
    expect(title).toHaveClass('title');
    expect(title).not.toHaveAttribute('role', 'heading');
  });

  test.each([
    ['h1', '1', 'H1'],
    ['h2', '2', 'H2'],
    ['h3', '3', 'H3'],
    ['h4', '4', 'H4'],
    ['h5', '5', 'H5'],
    ['h6', '6', 'H6'],
  ])(
    'renders as %s with size %s and correct heading level',
    (as, size, tagName) => {
      render(
        <Title
          {...defaultProps}
          as={as as TitleProps['as']}
          size={size as TitleProps['size']}
        />
      );
      const title = screen.getByRole('heading', {
        name: 'Test Title',
        level: parseInt(size),
      });
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe(tagName);
      expect(title).toHaveClass(`title is-${size}`);
    }
  );

  test('does not apply invalid size class and defaults to h1', () => {
    render(
      <Title
        {...defaultProps}
        size={'invalid' as unknown as TitleProps['size']}
      />
    );
    const title = screen.getByRole('heading', { name: 'Test Title', level: 1 });
    expect(title).toHaveClass('title');
    expect(title).not.toHaveClass('is-invalid');
    expect(title.tagName).toBe('H1');
  });

  test('applies spaced class', () => {
    render(<Title {...defaultProps} isSpaced />);
    const title = screen.getByRole('heading', { name: 'Test Title' });
    expect(title).toHaveClass('title is-spaced');
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(<Title {...defaultProps} m="4" />);
    const title = screen.getByRole('heading', { name: 'Test Title' });
    expect(title).toHaveClass('title m-4');
  });

  test('applies custom className', () => {
    render(<Title {...defaultProps} className="custom-title" />);
    const title = screen.getByRole('heading', { name: 'Test Title' });
    expect(title).toHaveClass('title custom-title');
  });

  test('forwards additional HTML attributes', () => {
    render(<Title {...defaultProps} data-testid="custom-title" />);
    const title = screen.getByTestId('custom-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('title');
  });

  test('renders without children', () => {
    render(<Title data-testid="empty-title" />);
    const title = screen.getByTestId('empty-title');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H1');
    expect(title).toHaveClass('title');
    expect(title).toBeEmptyDOMElement();
  });

  test('renders without children as paragraph', () => {
    render(<Title data-testid="empty-title" as="p" />);
    const title = screen.getByTestId('empty-title');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('P');
    expect(title).toHaveClass('title');
    expect(title).toBeEmptyDOMElement();
  });

  test('defaults to h1 for invalid as prop', () => {
    render(<Title {...defaultProps} as={'invalid' as TitleProps['as']} />);
    const title = screen.getByRole('heading', { name: 'Test Title', level: 1 });
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H1');
    expect(title).toHaveClass('title');
  });

  // Branch coverage for the Tag selection logic (lines 66, 79 in Title.tsx)
  test('uses correct tag when as is valid and size is undefined', () => {
    render(<Title {...defaultProps} as="h3" />);
    // No size provided, so should use <h3>
    const title = screen.getByText('Test Title');
    expect(title.tagName).toBe('H3');
    expect(title).toHaveClass('title');
  });

  test('uses correct tag when as is valid and size is also valid', () => {
    render(<Title {...defaultProps} as="h4" size="2" />);
    // Should use <h2> because size is valid
    const title = screen.getByText('Test Title');
    expect(title.tagName).toBe('H2');
    expect(title).toHaveClass('title is-2');
  });

  // --- New tests for hasSkeleton and skeleton props ---

  test('applies has-skeleton class when hasSkeleton prop is true', () => {
    render(<Title {...defaultProps} hasSkeleton />);
    const title = screen.getByRole('heading', { name: 'Test Title', level: 1 });
    expect(title).toHaveClass('has-skeleton');
  });

  test('does NOT apply has-skeleton class when hasSkeleton prop is omitted', () => {
    render(<Title {...defaultProps} />);
    const title = screen.getByRole('heading', { name: 'Test Title', level: 1 });
    expect(title).not.toHaveClass('has-skeleton');
  });

  test('does NOT apply has-skeleton class when hasSkeleton prop is false', () => {
    render(<Title {...defaultProps} hasSkeleton={false} />);
    const title = screen.getByRole('heading', { name: 'Test Title', level: 1 });
    expect(title).not.toHaveClass('has-skeleton');
  });

  test('applies is-skeleton class when skeleton prop is true (via useBulmaClasses)', () => {
    render(<Title {...defaultProps} skeleton />);
    const title = screen.getByRole('heading', { name: 'Test Title', level: 1 });
    expect(title).toHaveClass('is-skeleton');
  });

  test('does NOT apply is-skeleton class when skeleton prop is omitted', () => {
    render(<Title {...defaultProps} />);
    const title = screen.getByRole('heading', { name: 'Test Title', level: 1 });
    expect(title).not.toHaveClass('is-skeleton');
  });

  test('does NOT apply is-skeleton class when skeleton prop is false', () => {
    render(<Title {...defaultProps} skeleton={false} />);
    const title = screen.getByRole('heading', { name: 'Test Title', level: 1 });
    expect(title).not.toHaveClass('is-skeleton');
  });

  test('applies both has-skeleton and is-skeleton classes when both props are true', () => {
    render(<Title {...defaultProps} hasSkeleton skeleton />);
    const title = screen.getByRole('heading', { name: 'Test Title', level: 1 });
    expect(title).toHaveClass('has-skeleton');
    expect(title).toHaveClass('is-skeleton');
  });

  describe('ClassPrefix', () => {
    it('applies classPrefix to main class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <Title>Test Title</Title>
        </ConfigProvider>
      );
      const title = screen.getByRole('heading');
      expect(title).toHaveClass('my-prefix-title');
    });

    it('uses default class when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Title>Test Title</Title>
        </ConfigProvider>
      );
      const title = screen.getByRole('heading');
      expect(title).toHaveClass('title');
    });

    it('uses default class when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Title>Test Title</Title>
        </ConfigProvider>
      );
      const title = screen.getByRole('heading');
      expect(title).toHaveClass('title');
    });

    it('applies prefix to both main class and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Title size="2" isSpaced m="2">
            Test Title
          </Title>
        </ConfigProvider>
      );

      const title = container.querySelector('h2');
      expect(title).toHaveClass('bulma-title');
      expect(title).toHaveClass('bulma-is-2');
      expect(title).toHaveClass('bulma-is-spaced');
      expect(title).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Title size="3" isSpaced p="3">
          Standard Title
        </Title>
      );

      const title = container.querySelector('h3');
      expect(title).toHaveClass('title');
      expect(title).toHaveClass('is-3');
      expect(title).toHaveClass('is-spaced');
      expect(title).toHaveClass('p-3');
    });
  });
});
