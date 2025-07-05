import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TextArea from '../TextArea';

describe('TextArea', () => {
  it('renders a textarea', () => {
    render(<TextArea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<TextArea placeholder="Type here..." />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('applies Bulma and custom classes', () => {
    const { container } = render(
      <TextArea
        color="primary"
        size="large"
        className="custom-ta"
        isRounded
        isStatic
        isHovered
        isFocused
        isLoading
        isActive
        hasFixedSize
      />
    );
    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass('textarea');
    expect(textarea).toHaveClass('is-primary');
    expect(textarea).toHaveClass('is-large');
    expect(textarea).toHaveClass('custom-ta');
    expect(textarea).toHaveClass('is-rounded');
    expect(textarea).toHaveClass('is-static');
    expect(textarea).toHaveClass('is-hovered');
    expect(textarea).toHaveClass('is-focused');
    expect(textarea).toHaveClass('is-loading');
    expect(textarea).toHaveClass('is-active');
    expect(textarea).toHaveClass('has-fixed-size');
  });

  it('sets disabled and readOnly', () => {
    render(<TextArea disabled readOnly />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
    expect(textarea.readOnly).toBe(true);
  });

  it('sets rows prop', () => {
    render(<TextArea rows={10} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.rows).toBe(10);
  });

  it('shows value when controlled', () => {
    render(<TextArea value="Hello" onChange={() => {}} />);
    expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
  });

  it('calls onChange handler', () => {
    const handleChange = jest.fn();
    render(<TextArea onChange={handleChange} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('forwards ref to textarea element', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<TextArea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('passes other props to textarea', () => {
    render(<TextArea data-testid="my-textarea" />);
    expect(screen.getByTestId('my-textarea')).toBeInTheDocument();
  });
});
