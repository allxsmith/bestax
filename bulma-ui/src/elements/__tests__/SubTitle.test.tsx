import { render, screen, cleanup } from '@testing-library/react';
import { SubTitle, SubTitleProps } from '../SubTitle';
import { ConfigProvider } from '../../helpers/Config';

describe('SubTitle Component', () => {
  const defaultProps: SubTitleProps = {
    children: 'Test SubTitle',
  };

  afterEach(() => {
    cleanup();
  });

  test('renders subtitle with default props', () => {
    render(<SubTitle {...defaultProps} />);
    const subtitle = screen.getByRole('heading', {
      name: 'Test SubTitle',
      level: 1,
    });
    expect(subtitle).toBeInTheDocument();
    expect(subtitle.tagName).toBe('H1');
    expect(subtitle).toHaveClass('subtitle');
  });

  test('renders as paragraph with as="p"', () => {
    render(<SubTitle {...defaultProps} as="p" />);
    const subtitle = screen.getByText('Test SubTitle');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle.tagName).toBe('P');
    expect(subtitle).toHaveClass('subtitle');
    expect(subtitle).not.toHaveAttribute('role', 'heading');
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
        <SubTitle
          {...defaultProps}
          as={as as SubTitleProps['as']}
          size={size as SubTitleProps['size']}
        />
      );
      const subtitle = screen.getByRole('heading', {
        name: 'Test SubTitle',
        level: parseInt(size),
      });
      expect(subtitle).toBeInTheDocument();
      expect(subtitle.tagName).toBe(tagName);
      expect(subtitle).toHaveClass(`subtitle is-${size}`);
    }
  );

  test('does not apply invalid size class and defaults to h1', () => {
    render(
      <SubTitle
        {...defaultProps}
        size={'invalid' as unknown as SubTitleProps['size']}
      />
    );
    const subtitle = screen.getByRole('heading', {
      name: 'Test SubTitle',
      level: 1,
    });
    expect(subtitle).toHaveClass('subtitle');
    expect(subtitle).not.toHaveClass('is-invalid');
    expect(subtitle.tagName).toBe('H1');
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(<SubTitle {...defaultProps} m="4" />);
    const subtitle = screen.getByRole('heading', { name: 'Test SubTitle' });
    expect(subtitle).toHaveClass('subtitle m-4');
  });

  test('applies custom className', () => {
    render(<SubTitle {...defaultProps} className="custom-subtitle" />);
    const subtitle = screen.getByRole('heading', { name: 'Test SubTitle' });
    expect(subtitle).toHaveClass('subtitle custom-subtitle');
  });

  test('forwards additional HTML attributes', () => {
    render(<SubTitle {...defaultProps} data-testid="custom-subtitle" />);
    const subtitle = screen.getByTestId('custom-subtitle');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle).toHaveClass('subtitle');
  });

  test('renders without children', () => {
    render(<SubTitle data-testid="empty-subtitle" />);
    const subtitle = screen.getByTestId('empty-subtitle');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle.tagName).toBe('H1');
    expect(subtitle).toHaveClass('subtitle');
    expect(subtitle).toBeEmptyDOMElement();
  });

  test('renders without children as paragraph', () => {
    render(<SubTitle data-testid="empty-subtitle" as="p" />);
    const subtitle = screen.getByTestId('empty-subtitle');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle.tagName).toBe('P');
    expect(subtitle).toHaveClass('subtitle');
    expect(subtitle).toBeEmptyDOMElement();
  });

  test('defaults to h1 for invalid as prop', () => {
    render(
      <SubTitle
        {...defaultProps}
        as={'invalid' as unknown as SubTitleProps['as']}
      />
    );
    const subtitle = screen.getByRole('heading', {
      name: 'Test SubTitle',
      level: 1,
    });
    expect(subtitle).toBeInTheDocument();
    expect(subtitle.tagName).toBe('H1');
    expect(subtitle).toHaveClass('subtitle');
  });

  // Branch coverage for the Tag selection logic (invalid size, valid/invalid as)
  test('uses correct tag when as is valid and size is undefined', () => {
    render(<SubTitle {...defaultProps} as="h3" />);
    // No size provided, so should use <h3>
    const subtitle = screen.getByText('Test SubTitle');
    expect(subtitle.tagName).toBe('H3');
    expect(subtitle).toHaveClass('subtitle');
  });

  test('uses correct tag when as is valid and size is also valid', () => {
    render(<SubTitle {...defaultProps} as="h4" size="2" />);
    // Should use <h2> because size is valid
    const subtitle = screen.getByText('Test SubTitle');
    expect(subtitle.tagName).toBe('H2');
    expect(subtitle).toHaveClass('subtitle is-2');
  });

  // --- New tests for hasSkeleton and skeleton props ---
  test('applies has-skeleton class when hasSkeleton prop is true', () => {
    render(<SubTitle {...defaultProps} hasSkeleton />);
    const subtitle = screen.getByRole('heading', {
      name: 'Test SubTitle',
      level: 1,
    });
    expect(subtitle).toHaveClass('has-skeleton');
  });

  test('does NOT apply has-skeleton class when hasSkeleton prop is omitted', () => {
    render(<SubTitle {...defaultProps} />);
    const subtitle = screen.getByRole('heading', {
      name: 'Test SubTitle',
      level: 1,
    });
    expect(subtitle).not.toHaveClass('has-skeleton');
  });

  test('does NOT apply has-skeleton class when hasSkeleton prop is false', () => {
    render(<SubTitle {...defaultProps} hasSkeleton={false} />);
    const subtitle = screen.getByRole('heading', {
      name: 'Test SubTitle',
      level: 1,
    });
    expect(subtitle).not.toHaveClass('has-skeleton');
  });

  test('applies is-skeleton class when skeleton prop is true (via useBulmaClasses)', () => {
    render(<SubTitle {...defaultProps} skeleton />);
    const subtitle = screen.getByRole('heading', {
      name: 'Test SubTitle',
      level: 1,
    });
    expect(subtitle).toHaveClass('is-skeleton');
  });

  test('does NOT apply is-skeleton class when skeleton prop is omitted', () => {
    render(<SubTitle {...defaultProps} />);
    const subtitle = screen.getByRole('heading', {
      name: 'Test SubTitle',
      level: 1,
    });
    expect(subtitle).not.toHaveClass('is-skeleton');
  });

  test('does NOT apply is-skeleton class when skeleton prop is false', () => {
    render(<SubTitle {...defaultProps} skeleton={false} />);
    const subtitle = screen.getByRole('heading', {
      name: 'Test SubTitle',
      level: 1,
    });
    expect(subtitle).not.toHaveClass('is-skeleton');
  });

  test('applies both has-skeleton and is-skeleton classes when both props are true', () => {
    render(<SubTitle {...defaultProps} hasSkeleton skeleton />);
    const subtitle = screen.getByRole('heading', {
      name: 'Test SubTitle',
      level: 1,
    });
    expect(subtitle).toHaveClass('has-skeleton');
    expect(subtitle).toHaveClass('is-skeleton');
  });

  test('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <SubTitle {...defaultProps} />
      </ConfigProvider>
    );
    const subtitle = screen.getByRole('heading', {
      name: 'Test SubTitle',
      level: 1,
    });
    expect(subtitle).toHaveClass('bulma-subtitle');
    expect(subtitle).not.toHaveClass('subtitle');
  });
});
