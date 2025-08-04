import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../Input';
import { ConfigProvider } from '../../helpers/Config';

describe('Input', () => {
  it('renders an input', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Type here..." />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('applies Bulma and custom classes', () => {
    const { container } = render(
      <Input
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
    render(<Input disabled readOnly />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
  });

  it('shows value when controlled', () => {
    render(<Input value="Hello" onChange={() => {}} />);
    expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
  });

  it('calls onChange handler', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('forwards ref to input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('passes other props to input', () => {
    render(<Input data-testid="my-input" />);
    expect(screen.getByTestId('my-input')).toBeInTheDocument();
  });

  it('applies classPrefix when provided via ConfigProvider', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <Input />
      </ConfigProvider>
    );
    const input = container.querySelector('.bulma-input');
    expect(input).toBeInTheDocument();
    expect(input).not.toHaveClass('input');
  });
});
