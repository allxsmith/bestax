import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TextAreaBase from '../TextAreaBase';
import { ConfigProvider } from '../../helpers/Config';

describe('TextAreaBase', () => {
  it('renders a textarea', () => {
    render(<TextAreaBase />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<TextAreaBase placeholder="Type here..." />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('applies Bulma and custom classes', () => {
    const { container } = render(
      <TextAreaBase
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
    render(<TextAreaBase disabled readOnly />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
    expect(textarea.readOnly).toBe(true);
  });

  it('sets rows prop', () => {
    render(<TextAreaBase rows={10} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.rows).toBe(10);
  });

  it('shows value when controlled', () => {
    render(<TextAreaBase value="Hello" onChange={() => {}} />);
    expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
  });

  it('calls onChange handler', () => {
    const handleChange = jest.fn();
    render(<TextAreaBase onChange={handleChange} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('forwards ref to textarea element', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<TextAreaBase ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('passes other props to textarea', () => {
    render(<TextAreaBase data-testid="my-textarea" />);
    expect(screen.getByTestId('my-textarea')).toBeInTheDocument();
  });

  it('applies classPrefix when provided via ConfigProvider', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <TextAreaBase />
      </ConfigProvider>
    );
    const textarea = container.querySelector('.bulma-textarea');
    expect(textarea).toBeInTheDocument();
    expect(textarea).not.toHaveClass('textarea');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <TextAreaBase data-testid="textarea" />
        </ConfigProvider>
      );
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('bulma-textarea');
    });

    it('uses default classes when no prefix is provided', () => {
      render(<TextAreaBase data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('textarea');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <TextAreaBase data-testid="textarea" />
        </ConfigProvider>
      );
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('textarea');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <TextAreaBase color="primary" isRounded m="2" data-testid="textarea" />
        </ConfigProvider>
      );
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('bulma-textarea');
      expect(textarea).toHaveClass('bulma-is-primary');
      expect(textarea).toHaveClass('bulma-is-rounded');
      expect(textarea).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(
        <TextAreaBase color="danger" hasFixedSize p="3" data-testid="textarea" />
      );
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('textarea');
      expect(textarea).toHaveClass('is-danger');
      expect(textarea).toHaveClass('has-fixed-size');
      expect(textarea).toHaveClass('p-3');
    });
  });
});
