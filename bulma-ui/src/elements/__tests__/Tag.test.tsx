import { render, screen, fireEvent } from '@testing-library/react';
import { Tag, TagProps } from '../Tag';

describe('Tag Component', () => {
  const defaultProps: TagProps = {
    children: 'Test Tag',
  };

  test('renders tag with default props', () => {
    render(<Tag {...defaultProps} />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toBeInTheDocument();
    expect(tag.tagName).toBe('SPAN');
    expect(tag).toHaveClass('tag');
  });

  test('applies color class', () => {
    render(<Tag {...defaultProps} color="primary" />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag is-primary');
  });

  test('does not apply invalid color class', () => {
    render(<Tag {...defaultProps} color="invalid" />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag');
    expect(tag).not.toHaveClass('is-invalid');
  });

  test('applies size class', () => {
    render(<Tag {...defaultProps} size="medium" />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag is-medium');
  });

  test('does not apply normal size class', () => {
    render(<Tag {...defaultProps} size="normal" />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag');
    expect(tag).not.toHaveClass('is-normal');
  });

  test('applies rounded class', () => {
    render(<Tag {...defaultProps} isRounded />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag is-rounded');
  });

  test('applies hoverable class', () => {
    render(<Tag {...defaultProps} isHoverable />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag is-hoverable');
  });

  test('renders as delete button', () => {
    render(<Tag {...defaultProps} isDelete />);
    const button = screen.getByRole('button', { name: 'Delete tag' });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveClass('tag is-delete');
    expect(button).toBeEmptyDOMElement();
  });

  test('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(<Tag {...defaultProps} isDelete onDelete={onDelete} />);
    const button = screen.getByRole('button', { name: 'Delete tag' });
    fireEvent.click(button);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(<Tag {...defaultProps} m="4" />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag m-4');
  });

  test('applies custom className', () => {
    render(<Tag {...defaultProps} className="custom-tag" />);
    const tag = screen.getByText('Test Tag');
    expect(tag).toHaveClass('tag custom-tag');
  });

  test('forwards additional HTML attributes', () => {
    render(<Tag {...defaultProps} data-testid="custom-tag" />);
    const tag = screen.getByTestId('custom-tag');
    expect(tag).toBeInTheDocument();
    expect(tag).toHaveClass('tag');
  });

  test('renders without children', () => {
    render(<Tag data-testid="empty-tag" />);
    const tag = screen.getByTestId('empty-tag');
    expect(tag).toBeInTheDocument();
    expect(tag.tagName).toBe('SPAN');
    expect(tag).toHaveClass('tag');
    expect(tag).toBeEmptyDOMElement();
  });
});
