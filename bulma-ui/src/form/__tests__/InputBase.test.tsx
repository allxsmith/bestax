import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InputBase from '../InputBase';
import { ConfigProvider } from '../../helpers/Config';

describe('InputBase', () => {
  it('renders an input', () => {
    render(<InputBase />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<InputBase placeholder="Type here..." />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('applies Bulma and custom classes', () => {
    const { container } = render(
      <InputBase
        color="primary"
        size="large"
        className="custom-class"
        isRounded
        isStatic
        isHovered
        isFocused
        isLoading
      />
    );
    const input = container.querySelector('input');
    expect(input).toHaveClass('input');
    expect(input).toHaveClass('is-primary');
    expect(input).toHaveClass('is-large');
    expect(input).toHaveClass('custom-class');
    expect(input).toHaveClass('is-rounded');
    expect(input).toHaveClass('is-static');
    expect(input).toHaveClass('is-hovered');
    expect(input).toHaveClass('is-focused');
    expect(input).toHaveClass('is-loading');
  });

  it('sets disabled and readOnly', () => {
    render(<InputBase disabled readOnly />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
  });

  it('shows value when controlled', () => {
    render(<InputBase value="Hello" onChange={() => {}} />);
    expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
  });

  it('calls onChange handler', () => {
    const handleChange = jest.fn();
    render(<InputBase onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('forwards ref to input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<InputBase ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('passes other props to input', () => {
    render(<InputBase data-testid="my-input" />);
    expect(screen.getByTestId('my-input')).toBeInTheDocument();
  });

  it('applies classPrefix when provided via ConfigProvider', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <InputBase />
      </ConfigProvider>
    );
    const input = container.querySelector('.bulma-input');
    expect(input).toBeInTheDocument();
    expect(input).not.toHaveClass('input');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <InputBase data-testid="input" />
        </ConfigProvider>
      );
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('bulma-input');
    });

    it('uses default classes when no prefix is provided', () => {
      render(<InputBase data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('input');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <InputBase data-testid="input" />
        </ConfigProvider>
      );
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('input');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <InputBase color="primary" isRounded m="2" data-testid="input" />
        </ConfigProvider>
      );
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('bulma-input');
      expect(input).toHaveClass('bulma-is-primary');
      expect(input).toHaveClass('bulma-is-rounded');
      expect(input).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(<InputBase color="danger" isLoading p="3" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('input');
      expect(input).toHaveClass('is-danger');
      expect(input).toHaveClass('is-loading');
      expect(input).toHaveClass('p-3');
    });
  });
});
