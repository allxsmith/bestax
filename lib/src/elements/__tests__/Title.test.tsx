import { render, screen } from '@testing-library/react';
import { Title, TitleProps } from '../Title';

describe('Title Component', () => {
  const defaultProps: TitleProps = {
    children: 'Test Title',
  };

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
    render(<Title {...defaultProps} size="invalid" />);
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
    render(<Title {...defaultProps} as="invalid" />);
    const title = screen.getByRole('heading', { name: 'Test Title', level: 1 });
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H1');
    expect(title).toHaveClass('title');
  });
});
