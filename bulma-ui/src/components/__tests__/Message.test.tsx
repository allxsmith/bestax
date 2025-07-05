import { render, screen, fireEvent } from '@testing-library/react';
import { Message } from '../Message';

describe('Message', () => {
  it('renders with title and body', () => {
    render(<Message title="Hello">World</Message>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('World')).toBeInTheDocument();
    expect(screen.getByTestId('message')).toHaveClass('message');
  });

  it('applies color class', () => {
    render(<Message color="danger" title="Error" />);
    expect(screen.getByTestId('message')).toHaveClass('is-danger');
  });

  it('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(
      <Message title="Closable" onClose={onClose}>
        Bye
      </Message>
    );
    fireEvent.click(screen.getByTestId('message-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders without header if neither title nor onClose is provided', () => {
    render(<Message>Just body</Message>);
    expect(screen.queryByText('message-header')).not.toBeInTheDocument();
    expect(screen.getByText('Just body')).toBeInTheDocument();
  });

  it('does not render message-body if children not provided', () => {
    render(<Message title="Note" />);
    expect(screen.queryByTestId('message-body')).not.toBeInTheDocument();
  });

  it('supports extra className and passes it to root', () => {
    render(
      <Message className="extra-class" title="Title">
        Content
      </Message>
    );
    expect(screen.getByTestId('message')).toHaveClass('extra-class');
  });
});
