import { render, screen, fireEvent } from '@testing-library/react';
import { Notification, NotificationProps } from '../Notification';
import { ConfigProvider } from '../../helpers/Config';

describe('Notification Component', () => {
  const defaultProps: NotificationProps = {
    children: 'This is a notification',
  };

  test('renders notification with default props', () => {
    render(<Notification {...defaultProps} />);
    const notification = screen.getByText('This is a notification');
    expect(notification).toBeInTheDocument();
    expect(notification.closest('div')).toHaveClass('notification');
    expect(notification.closest('div')).not.toHaveClass('is-light');
    expect(
      screen.queryByLabelText('Close notification')
    ).not.toBeInTheDocument();
  });

  test('applies color class correctly', () => {
    render(<Notification {...defaultProps} color="primary" />);
    const notification = screen
      .getByText('This is a notification')
      .closest('div');
    expect(notification).toHaveClass('notification is-primary');
  });

  test('applies light variant class when isLight is true', () => {
    render(<Notification {...defaultProps} color="info" isLight />);
    const notification = screen
      .getByText('This is a notification')
      .closest('div');
    expect(notification).toHaveClass('notification is-info is-light');
  });

  test('renders delete button when hasDelete is true', () => {
    render(<Notification {...defaultProps} hasDelete />);
    const deleteButton = screen.getByLabelText('Close notification');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveClass('delete');
  });

  test('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(<Notification {...defaultProps} hasDelete onDelete={onDelete} />);
    const deleteButton = screen.getByLabelText('Close notification');
    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(<Notification {...defaultProps} m="4" />);
    const notification = screen
      .getByText('This is a notification')
      .closest('div');
    expect(notification).toHaveClass('notification m-4');
  });

  test('applies custom className', () => {
    render(<Notification {...defaultProps} className="custom-notification" />);
    const notification = screen
      .getByText('This is a notification')
      .closest('div');
    expect(notification).toHaveClass('notification custom-notification');
  });

  test('forwards additional HTML attributes', () => {
    render(
      <Notification {...defaultProps} data-testid="custom-notification" />
    );
    const notification = screen.getByTestId('custom-notification');
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveClass('notification');
  });

  describe('ClassPrefix', () => {
    it('applies classPrefix to main class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <Notification>Test</Notification>
        </ConfigProvider>
      );
      const notification = screen.getByText('Test').closest('div');
      expect(notification).toHaveClass('my-prefix-notification');
    });

    it('uses default class when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Notification>Test</Notification>
        </ConfigProvider>
      );
      const notification = screen.getByText('Test').closest('div');
      expect(notification).toHaveClass('notification');
    });

    it('uses default class when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Notification>Test</Notification>
        </ConfigProvider>
      );
      const notification = screen.getByText('Test').closest('div');
      expect(notification).toHaveClass('notification');
    });

    it('applies prefix to both main class and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Notification color="primary" isLight hasDelete m="2">
            Test Notification
          </Notification>
        </ConfigProvider>
      );

      const notification = container.querySelector('div');
      expect(notification).toHaveClass('bulma-notification');
      expect(notification).toHaveClass('bulma-is-primary');
      expect(notification).toHaveClass('bulma-is-light');
      expect(notification).toHaveClass('bulma-m-2');

      const deleteButton = container.querySelector('button');
      expect(deleteButton).toHaveClass('bulma-delete');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Notification color="info" hasDelete p="3">
          Standard Notification
        </Notification>
      );

      const notification = container.querySelector('div');
      expect(notification).toHaveClass('notification');
      expect(notification).toHaveClass('is-info');
      expect(notification).toHaveClass('p-3');

      const deleteButton = container.querySelector('button');
      expect(deleteButton).toHaveClass('delete');
    });
  });
});
