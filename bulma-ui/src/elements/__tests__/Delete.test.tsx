import { render, screen, fireEvent } from '@testing-library/react';
import { Delete } from '../Delete';

describe('Delete Component', () => {
  it('renders with default props', () => {
    render(<Delete />);
    const button = screen.getByRole('button', { name: /close/i });
    expect(button).toHaveClass('delete');
    expect(button).not.toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Delete className="custom-class" />);
    const button = screen.getByRole('button', { name: /close/i });
    expect(button).toHaveClass('delete custom-class');
  });

  it('applies size modifier', () => {
    render(<Delete size="large" />);
    const button = screen.getByRole('button', { name: /close/i });
    expect(button).toHaveClass('delete is-large');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Delete disabled />);
    const button = screen.getByRole('button', { name: /close/i });
    expect(button).toBeDisabled();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Delete onClick={handleClick} />);
    const button = screen.getByRole('button', { name: /close/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('uses custom aria-label', () => {
    render(<Delete ariaLabel="Dismiss" />);
    const button = screen.getByRole('button', { name: /dismiss/i });
    expect(button).toBeInTheDocument();
  });

  it('applies textColor using useBulmaClasses', () => {
    render(<Delete textColor="primary" />);
    const button = screen.getByRole('button', { name: /close/i });
    expect(button).toHaveClass('has-text-primary');
  });

  it('applies bgColor using useBulmaClasses', () => {
    render(<Delete bgColor="info" />);
    const button = screen.getByRole('button', { name: /close/i });
    expect(button).toHaveClass('has-background-info');
  });

  it('applies margin using useBulmaClasses', () => {
    render(<Delete m="2" />);
    const button = screen.getByRole('button', { name: /close/i });
    expect(button).toHaveClass('m-2');
  });

  it('applies textSize using useBulmaClasses', () => {
    render(<Delete textSize="3" />);
    const button = screen.getByRole('button', { name: /close/i });
    expect(button).toHaveClass('is-size-3');
  });

  it('passes through non-Bulma props via rest', () => {
    render(<Delete data-testid="test" />);
    const button = screen.getByTestId('test');
    expect(button).toBeInTheDocument();
  });
});
