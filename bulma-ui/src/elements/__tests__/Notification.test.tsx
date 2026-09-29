import { StrictMode } from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  Notification,
  NotificationProps,
  NotificationContainer,
  notification,
} from '../Notification';
import { ConfigProvider } from '../../helpers/Config';
import { resetColorDeprecationWarnings } from '../../helpers/colorDeprecations';

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
      render(
        <ConfigProvider classPrefix="bulma-">
          <Notification color="primary" isLight hasDelete m="2">
            Test Notification
          </Notification>
        </ConfigProvider>
      );

      const notification = screen.getByText('Test Notification').closest('div');
      expect(notification).toHaveClass('bulma-notification');
      expect(notification).toHaveClass('bulma-is-primary');
      expect(notification).toHaveClass('bulma-is-light');
      expect(notification).toHaveClass('bulma-m-2');

      const deleteButton = screen.getByRole('button');
      expect(deleteButton).toHaveClass('bulma-delete');
    });

    it('works without prefix', () => {
      render(
        <Notification color="info" hasDelete p="3">
          Standard Notification
        </Notification>
      );

      const notif = screen.getByText('Standard Notification').closest('div');
      expect(notif).toHaveClass('notification');
      expect(notif).toHaveClass('is-info');
      expect(notif).toHaveClass('p-3');

      const deleteButton = screen.getByRole('button');
      expect(deleteButton).toHaveClass('delete');
    });
  });
});

// Programmatic Notification API tests
jest.useFakeTimers();

describe('Notification Programmatic API', () => {
  afterEach(() => {
    jest.clearAllTimers();
    notification.closeAll();
  });

  describe('notification.show', () => {
    it('returns an id', () => {
      const id = notification.show({ message: 'Test' });
      expect(id).toMatch(/^notification-\d+$/);
    });

    it('renders in NotificationContainer', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.show({ message: 'Hello', duration: 0 });
      });
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  describe('announcements', () => {
    it.each([
      ['success', 'status', 'polite'],
      ['info', 'status', 'polite'],
      ['warning', 'alert', 'assertive'],
      ['danger', 'alert', 'assertive'],
    ] as const)('a %s notification announces as %s', (color, role, live) => {
      render(<NotificationContainer />);
      act(() => {
        notification.show({ message: `Msg ${color}`, color, duration: 0 });
      });
      const region = screen.getByRole(role);
      expect(region).toHaveTextContent(`Msg ${color}`);
      expect(region).toHaveAttribute('aria-live', live);
    });

    it('a notification with no color announces as a status', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.show({ message: 'Plain', duration: 0 });
      });
      expect(screen.getByRole('status')).toHaveTextContent('Plain');
    });

    it('announces only the message, not the close button', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.danger('Something went wrong', { duration: 0 });
      });
      const region = screen.getByRole('alert');
      expect(region).toHaveTextContent(/^Something went wrong$/);
      expect(within(region).queryByRole('button')).toBeNull();
      expect(
        screen.getByRole('button', { name: 'Close notification' })
      ).toBeInTheDocument();
    });
  });

  describe('notification.success', () => {
    it('creates a success notification', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.success('Success!');
      });
      expect(screen.getByText('Success!')).toBeInTheDocument();
      const notif = screen.getByText('Success!').closest('.notification');
      expect(notif).toHaveClass('is-success');
    });
  });

  describe('notification.danger', () => {
    it('creates a danger notification', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.danger('Error!');
      });
      expect(screen.getByText('Error!')).toBeInTheDocument();
      const notif = screen.getByText('Error!').closest('.notification');
      expect(notif).toHaveClass('is-danger');
    });
  });

  describe('notification.warning', () => {
    it('creates a warning notification', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.warning('Warning!');
      });
      const notif = screen.getByText('Warning!').closest('.notification');
      expect(notif).toHaveClass('is-warning');
    });
  });

  describe('notification.info', () => {
    it('creates an info notification', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.info('Info!');
      });
      const notif = screen.getByText('Info!').closest('.notification');
      expect(notif).toHaveClass('is-info');
    });
  });

  describe('notification.close', () => {
    it('closes a specific notification', () => {
      render(<NotificationContainer />);
      let id: string;
      act(() => {
        id = notification.show({ message: 'Close me', duration: 0 });
      });
      expect(screen.getByText('Close me')).toBeInTheDocument();

      act(() => {
        notification.close(id!);
      });
      expect(screen.queryByText('Close me')).not.toBeInTheDocument();
    });
  });

  describe('notification.closeAll', () => {
    it('closes all notifications', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.show({ message: 'One', duration: 0 });
        notification.show({ message: 'Two', duration: 0 });
      });

      act(() => {
        notification.closeAll();
      });
      expect(screen.queryByText('One')).not.toBeInTheDocument();
      expect(screen.queryByText('Two')).not.toBeInTheDocument();
    });
  });

  describe('auto-close', () => {
    it('auto-closes after duration', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.show({ message: 'Auto', duration: 3000 });
      });
      expect(screen.getByText('Auto')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(screen.queryByText('Auto')).not.toBeInTheDocument();
    });

    it('stays open when indefinite', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.show({
          message: 'Stay',
          indefinite: true,
          duration: 1000,
        });
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(screen.getByText('Stay')).toBeInTheDocument();
    });
  });

  describe('queue', () => {
    it('shows one queued notification at a time', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.show({ message: 'Q1', duration: 0, queue: true });
        notification.show({ message: 'Q2', duration: 0, queue: true });
      });

      expect(screen.getByText('Q1')).toBeInTheDocument();
      expect(screen.queryByText('Q2')).not.toBeInTheDocument();
    });

    it('shows next queued after current closes', () => {
      render(<NotificationContainer />);
      let id: string;
      act(() => {
        id = notification.show({ message: 'Q1', duration: 0, queue: true });
        notification.show({ message: 'Q2', duration: 0, queue: true });
      });

      act(() => {
        notification.close(id!);
      });

      expect(screen.queryByText('Q1')).not.toBeInTheDocument();
      expect(screen.getByText('Q2')).toBeInTheDocument();
    });

    it('removes a waiting notification from the queue when closed by id', () => {
      render(<NotificationContainer />);
      let id1: string;
      let id2: string;
      act(() => {
        id1 = notification.show({ message: 'Q1', duration: 0, queue: true });
        id2 = notification.show({ message: 'Q2', duration: 0, queue: true });
        notification.show({ message: 'Q3', duration: 0, queue: true });
      });

      expect(screen.getByText('Q1')).toBeInTheDocument();

      // Close the second notification while it is still waiting in the queue
      // (it is not the currently-displayed one).
      act(() => {
        notification.close(id2!);
      });
      expect(screen.getByText('Q1')).toBeInTheDocument();

      // When the current one closes, the already-closed entry is skipped.
      act(() => {
        notification.close(id1!);
      });
      expect(screen.queryByText('Q2')).not.toBeInTheDocument();
      expect(screen.getByText('Q3')).toBeInTheDocument();
    });
  });

  describe('subscribe', () => {
    it('notifies subscribers', () => {
      const listener = jest.fn();
      const unsubscribe = notification.subscribe(listener);

      act(() => {
        notification.show({ message: 'Sub test' });
      });

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('returns unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = notification.subscribe(listener);
      unsubscribe();

      act(() => {
        notification.show({ message: 'No notify' });
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('delete button', () => {
    it('renders delete button by default', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.show({ message: 'With delete', duration: 0 });
      });

      expect(screen.getByLabelText('Close notification')).toBeInTheDocument();
    });

    it('closes when delete button is clicked', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.show({ message: 'Deletable', duration: 0 });
      });

      fireEvent.click(screen.getByLabelText('Close notification'));
      expect(screen.queryByText('Deletable')).not.toBeInTheDocument();
    });

    it('hides delete button when hasDelete is false', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.show({
          message: 'No delete',
          duration: 0,
          hasDelete: false,
        });
      });

      expect(
        screen.queryByLabelText('Close notification')
      ).not.toBeInTheDocument();
    });
  });

  describe('pauseOnHover', () => {
    it('pauses auto-dismiss timer when mouse enters and resumes on leave', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.show({
          message: 'Hoverable',
          duration: 3000,
          pauseOnHover: true,
        });
      });

      const notif = screen.getByText('Hoverable').closest('.notification')!;
      expect(notif).toBeInTheDocument();

      // Hover before timer fires — pauses the timer
      act(() => {
        fireEvent.mouseEnter(notif);
      });

      // Advance well past the duration; should still be present (paused)
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(screen.getByText('Hoverable')).toBeInTheDocument();

      // Leave triggers a fresh timer
      act(() => {
        fireEvent.mouseLeave(notif);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(screen.queryByText('Hoverable')).not.toBeInTheDocument();
    });

    it('renders container at bottom-left position', () => {
      render(<NotificationContainer position="bottom-left" />);
      act(() => {
        notification.show({ message: 'BL', duration: 0 });
      });
      expect(screen.getByText('BL')).toBeInTheDocument();
    });

    it('renders container at top-center position', () => {
      render(<NotificationContainer position="top" />);
      act(() => {
        notification.show({ message: 'TC', duration: 0 });
      });
      expect(screen.getByText('TC')).toBeInTheDocument();
    });

    it('renders container at bottom-center position', () => {
      render(<NotificationContainer position="bottom" />);
      act(() => {
        notification.show({ message: 'BC', duration: 0 });
      });
      expect(screen.getByText('BC')).toBeInTheDocument();
    });

    it('does not pause auto-dismiss when pauseOnHover is false', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.show({
          message: 'NoPause',
          duration: 3000,
          pauseOnHover: false,
        });
      });

      const notif = screen.getByText('NoPause').closest('.notification')!;
      expect(notif).toBeInTheDocument();

      // Mouse enter and leave should NOT toggle pause
      act(() => {
        fireEvent.mouseEnter(notif);
        fireEvent.mouseLeave(notif);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(screen.queryByText('NoPause')).not.toBeInTheDocument();
    });
  });
});

describe('NotificationContainer mounted after notifications are raised', () => {
  afterEach(() => {
    jest.clearAllTimers();
    // The container is still mounted here, so closing re-renders it.
    act(() => {
      notification.closeAll();
    });
  });

  const shownMessages = () =>
    Array.from(document.body.querySelectorAll('.notification')).map(
      el => el.textContent
    );

  it('shows them when it mounts, in the order they were raised', () => {
    notification.show({ message: 'First', duration: 0 });
    notification.success('Second', { duration: 0 });

    render(<NotificationContainer />);

    expect(shownMessages()).toEqual(['First', 'Second']);
  });

  it('adds later notifications after them without showing any twice', () => {
    notification.show({ message: 'Early', duration: 0 });
    render(<NotificationContainer />);
    expect(shownMessages()).toEqual(['Early']);

    act(() => {
      notification.show({ message: 'Later', duration: 0 });
    });

    expect(shownMessages()).toEqual(['Early', 'Later']);
  });

  it('shows each once under StrictMode', () => {
    notification.show({ message: 'Strict', duration: 0 });
    render(
      <StrictMode>
        <NotificationContainer />
      </StrictMode>
    );
    expect(shownMessages()).toEqual(['Strict']);

    act(() => {
      notification.show({ message: 'Strict later', duration: 0 });
    });

    expect(shownMessages()).toEqual(['Strict', 'Strict later']);
  });

  it('times each from when it appears, and drops it from the store after', () => {
    notification.show({ message: 'Timed', duration: 3000 });
    // Time spent waiting for a container does not count against it.
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    render(<NotificationContainer />);
    act(() => {
      jest.advanceTimersByTime(2999);
    });
    expect(screen.getByText('Timed')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Timed')).not.toBeInTheDocument();

    // It left the store as well, so the next notification does not bring it
    // back.
    act(() => {
      notification.show({ message: 'Next', duration: 0 });
    });
    expect(shownMessages()).toEqual(['Next']);
  });

  it('closes one from its delete button', () => {
    notification.show({ message: 'Close me', duration: 0 });
    notification.show({ message: 'Keep me', duration: 0 });
    render(<NotificationContainer />);
    expect(shownMessages()).toEqual(['Close me', 'Keep me']);

    const closeMe = screen
      .getByText('Close me')
      .closest<HTMLElement>('.notification')!;
    fireEvent.click(within(closeMe).getByRole('button'));

    expect(shownMessages()).toEqual(['Keep me']);
  });

  it('shows the queued notification on screen, then the next once it closes', () => {
    const id = notification.show({ message: 'Q1', duration: 0, queue: true });
    notification.show({ message: 'Q2', duration: 0, queue: true });
    render(<NotificationContainer />);
    expect(shownMessages()).toEqual(['Q1']);

    act(() => {
      notification.close(id);
    });
    expect(shownMessages()).toEqual(['Q2']);
  });

  it('renders nothing on the server, then shows them once hydrated', async () => {
    notification.show({ message: 'Before hydration', duration: 0 });
    const app = (
      <main>
        <NotificationContainer />
      </main>
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(app);
    document.body.appendChild(container);

    // The server's markup has no notifications in it, whatever has been
    // raised, so the hydrating render has to produce none either.
    expect(container.innerHTML).toBe('<main></main>');

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, app);
        unmountRoot = () => root.unmount();
      });

      expect(errorSpy).not.toHaveBeenCalled();
      expect(shownMessages()).toEqual(['Before hydration']);
    } finally {
      // A root left mounted would add its notifications to every later test's.
      await act(async () => unmountRoot());
      errorSpy.mockRestore();
      document.body.removeChild(container);
    }
  });
});

describe('Notification deprecated color values', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    resetColorDeprecationWarnings();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    notification.closeAll();
    warnSpy.mockRestore();
  });

  test('still emits is-grey but warns once in development', () => {
    const { rerender } = render(<Notification color="grey">Grey</Notification>);
    expect(screen.getByText('Grey').closest('div')).toHaveClass('is-grey');
    rerender(<Notification color="grey">Grey</Notification>);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('<Notification color="grey">')
    );
  });

  test('does not warn for a CSS-backed color', () => {
    render(<Notification color="primary">Primary</Notification>);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('warns for a dead color through the programmatic API', () => {
    render(<NotificationContainer />);
    act(() => {
      notification.show({
        message: 'Programmatic',
        color: 'grey-light',
        duration: 0,
      });
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('<Notification color="grey-light">')
    );
  });
});
