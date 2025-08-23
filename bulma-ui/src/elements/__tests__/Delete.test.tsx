import { render, screen, fireEvent } from '@testing-library/react';
import { Delete } from '../Delete';
import { ConfigProvider } from '../../helpers/Config';

describe('Delete Component', () => {
  it('renders with default props', () => {
    render(<Delete />);
    const button = screen.getByRole('button', { name: /close/i });
    expect(button).toHaveClass('delete');
    expect(button).not.toBeDisabled();
  });

  it('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <Delete />
      </ConfigProvider>
    );
    const button = screen.getByRole('button', { name: /close/i });
    expect(button).toHaveClass('bulma-delete');
    expect(button).not.toHaveClass('delete');
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

  describe('ClassPrefix', () => {
    it('applies classPrefix to main class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <Delete />
        </ConfigProvider>
      );
      const button = screen.getByRole('button', { name: /close/i });
      expect(button).toHaveClass('my-prefix-delete');
    });

    it('uses default class when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Delete />
        </ConfigProvider>
      );
      const button = screen.getByRole('button', { name: /close/i });
      expect(button).toHaveClass('delete');
    });

    it('uses default class when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Delete />
        </ConfigProvider>
      );
      const button = screen.getByRole('button', { name: /close/i });
      expect(button).toHaveClass('delete');
    });

    it('applies prefix to both main class and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Delete size="large" m="2" />
        </ConfigProvider>
      );

      const button = container.querySelector('button');
      expect(button).toHaveClass('bulma-delete');
      expect(button).toHaveClass('bulma-is-large');
      expect(button).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      const { container } = render(<Delete size="medium" p="3" />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('delete');
      expect(button).toHaveClass('is-medium');
      expect(button).toHaveClass('p-3');
    });
  });
});
