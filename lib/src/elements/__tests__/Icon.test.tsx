import { render, screen } from '@testing-library/react';
import { Icon } from '../Icon';

describe('Icon Component', () => {
  it('renders with required name prop', () => {
    render(<Icon name="fas fa-star" />);
    const icon = screen.getByLabelText('icon');
    expect(icon).toHaveClass('icon');
    expect(icon.querySelector('i')).toHaveClass('fas fa-star');
  });

  it('applies custom className', () => {
    render(<Icon name="fas fa-star" className="custom-icon" />);
    const icon = screen.getByLabelText('icon');
    expect(icon).toHaveClass('icon custom-icon');
  });

  it('applies size modifier', () => {
    render(<Icon name="fas fa-star" size="large" />);
    const icon = screen.getByLabelText('icon');
    expect(icon).toHaveClass('icon is-large');
  });

  it('applies textColor using useBulmaClasses', () => {
    render(<Icon name="fas fa-star" textColor="primary" />);
    const icon = screen.getByLabelText('icon');
    expect(icon).toHaveClass('has-text-primary');
  });

  it('applies bgColor using useBulmaClasses', () => {
    render(<Icon name="fas fa-star" bgColor="info" />);
    const icon = screen.getByLabelText('icon');
    expect(icon).toHaveClass('has-background-info');
  });

  it('applies margin using useBulmaClasses', () => {
    render(<Icon name="fas fa-star" m="2" />);
    const icon = screen.getByLabelText('icon');
    expect(icon).toHaveClass('m-2');
  });

  it('uses custom aria-label', () => {
    render(<Icon name="fas fa-star" ariaLabel="Star icon" />);
    const icon = screen.getByLabelText('Star icon');
    expect(icon).toBeInTheDocument();
  });

  it('passes through non-Bulma props via rest', () => {
    render(<Icon name="fas fa-star" data-testid="test-icon" />);
    const icon = screen.getByTestId('test-icon');
    expect(icon).toBeInTheDocument();
  });
});
