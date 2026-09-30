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

  it('renders type="button"', () => {
    render(<Delete />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('keeps its type and name through a spread carrying absent values', () => {
    // React reads an `undefined` attribute as "remove it", and a props spread
    // whose key has no value is how that arrives. Defaults written before the
    // spread were erased by it: a nameless button that submits a form.
    const spread: object = { type: undefined, 'aria-label': undefined };
    render(<Delete data-testid="del" {...spread} />);
    const button = screen.getByTestId('del');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-label', 'Close');
  });

  it('keeps a custom ariaLabel through a spread carrying an absent aria-label', () => {
    const spread: { 'aria-label'?: string } = { 'aria-label': undefined };
    render(<Delete ariaLabel="Dismiss" {...spread} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Dismiss');
  });

  it('lets an explicit aria-label, or a submit or reset type, win', () => {
    // `type` is not in Delete's own props, so a caller's value arrives through
    // a spread; the defaults must not override a real one.
    const submit: object = { type: 'submit' };
    const reset: object = { type: 'reset' };
    render(
      <>
        <Delete data-testid="named" aria-label="Remove" />
        <Delete data-testid="submit" {...submit} />
        <Delete data-testid="reset" {...reset} />
      </>
    );
    expect(screen.getByTestId('named')).toHaveAttribute('aria-label', 'Remove');
    expect(screen.getByTestId('submit')).toHaveAttribute('type', 'submit');
    expect(screen.getByTestId('reset')).toHaveAttribute('type', 'reset');
  });

  it('replaces a type HTML would read as submit with type="button"', () => {
    const loose: object = { type: 'text/html' };
    render(<Delete {...loose} />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
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
      render(
        <ConfigProvider classPrefix="bulma-">
          <Delete size="large" m="2" />
        </ConfigProvider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bulma-delete');
      expect(button).toHaveClass('bulma-is-large');
      expect(button).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(<Delete size="medium" p="3" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('delete');
      expect(button).toHaveClass('is-medium');
      expect(button).toHaveClass('p-3');
    });
  });
});

describe('Delete color text alias', () => {
  it('renders has-text-primary when only color is set', () => {
    const { container } = render(<Delete color="primary" />);
    expect(container.querySelector('.delete')).toHaveClass('has-text-primary');
  });

  it('gives textColor precedence when both are set', () => {
    const { container } = render(<Delete textColor="danger" color="primary" />);
    const del = container.querySelector('.delete');
    expect(del).toHaveClass('has-text-danger');
    expect(del).not.toHaveClass('has-text-primary');
  });
});
