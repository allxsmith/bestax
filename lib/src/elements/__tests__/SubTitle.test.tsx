import { render, screen } from '@testing-library/react';
import { SubTitle, SubTitleProps } from '../SubTitle';

describe('SubTitle Component', () => {
  const defaultProps: SubTitleProps = {
    children: 'Test SubTitle',
  };

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
    render(<SubTitle {...defaultProps} size="invalid" />);
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
    render(<SubTitle {...defaultProps} as="invalid" />);
    const subtitle = screen.getByRole('heading', {
      name: 'Test SubTitle',
      level: 1,
    });
    expect(subtitle).toBeInTheDocument();
    expect(subtitle.tagName).toBe('H1');
    expect(subtitle).toHaveClass('subtitle');
  });
});
