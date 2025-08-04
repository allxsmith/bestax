import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import File from '../File';
import { ConfigProvider } from '../../helpers/Config';

describe('File', () => {
  it('renders a file input with default label', () => {
    render(<File />);
    const input = screen.getByLabelText(/choose a file/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'file');
  });

  it('renders custom label', () => {
    render(<File label="Upload Avatar" />);
    expect(screen.getByLabelText(/upload avatar/i)).toBeInTheDocument();
  });

  it('applies Bulma and custom classes', () => {
    const { container } = render(
      <File
        color="primary"
        size="large"
        className="custom-file"
        isBoxed
        isFullwidth
        hasName
      />
    );
    const wrapper = container.querySelector('.file');
    expect(wrapper).toHaveClass('file');
    expect(wrapper).toHaveClass('is-primary');
    expect(wrapper).toHaveClass('is-large');
    expect(wrapper).toHaveClass('custom-file');
    expect(wrapper).toHaveClass('is-boxed');
    expect(wrapper).toHaveClass('is-fullwidth');
    expect(wrapper).toHaveClass('has-name');
  });

  it('applies classPrefix when provided', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <File />
      </ConfigProvider>
    );
    const wrapper = container.querySelector('.bulma-file');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('bulma-file');
  });

  it('renders left and right icons', () => {
    render(
      <File
        iconLeft={<span data-testid="left-icon">L</span>}
        iconRight={<span data-testid="right-icon">R</span>}
      />
    );
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('shows fileName when hasName and fileName are provided', () => {
    render(<File hasName fileName="myfile.txt" />);
    expect(screen.getByText('myfile.txt')).toBeInTheDocument();
  });

  it('file input uses inputClassName', () => {
    render(<File inputClassName="my-file-input" />);
    const input = screen.getByLabelText(/choose a file/i);
    expect(input).toHaveClass('file-input');
    expect(input).toHaveClass('my-file-input');
  });

  it('forwards ref to file input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<File ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('passes other props to file input', () => {
    render(<File data-testid="my-file" />);
    expect(screen.getByTestId('my-file')).toBeInTheDocument();
  });

  it('supports alignment classes: isRight, isCentered, and precedence of isRight', () => {
    const { container, rerender } = render(<File isRight />);
    let wrapper = container.querySelector('.file');
    expect(wrapper).toHaveClass('is-right');
    rerender(<File isCentered />);
    wrapper = container.querySelector('.file');
    expect(wrapper).toHaveClass('is-centered');
    rerender(<File isRight isCentered />);
    wrapper = container.querySelector('.file');
    expect(wrapper).toHaveClass('is-right');
    expect(wrapper).not.toHaveClass('is-centered');
  });

  it('calls onChange when a file is selected', () => {
    const handleChange = jest.fn();
    render(<File onChange={handleChange} />);
    const input = screen.getByLabelText(/choose a file/i);
    // Simulate file selection, using window.File to avoid naming collision
    const file = new window.File(['abc'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(handleChange).toHaveBeenCalled();
  });
});
