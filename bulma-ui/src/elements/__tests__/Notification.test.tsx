import { Profiler, StrictMode } from 'react';
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
import {
  announceDelay,
  announcementLifetime,
} from '../../helpers/statusRegion';
import { ToastContainer, toast } from '../../components/Toast';

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
    // Lets the container write what it announces.
    const waitForAnnouncements = () =>
      act(() => {
        jest.advanceTimersByTime(announceDelay);
      });

    it('keeps a status region in the page from mount, with nothing visible', () => {
      const { container } = render(<NotificationContainer />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveStyle({
        position: 'absolute',
        clip: 'rect(0px, 0px, 0px, 0px)',
      });
      expect(status).toBeEmptyDOMElement();

      // The region is all an empty container adds to the page. There's no
      // alert region: alerts announce themselves.
      expect(
        Array.from(document.body.children).filter(el => el !== container)
      ).toEqual([status]);
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it.each(['success', 'info', 'primary'] as const)(
      'announces a %s notification through the status region',
      color => {
        render(<NotificationContainer />);
        act(() => {
          notification.show({ message: `Msg ${color}`, color, duration: 0 });
        });
        waitForAnnouncements();

        expect(screen.getByRole('status')).toHaveTextContent(
          new RegExp(`^Msg ${color}$`)
        );
        expect(screen.queryByRole('alert')).toBeNull();
      }
    );

    it('announces a notification with no color through the status region', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.show({ message: 'Plain', duration: 0 });
      });
      waitForAnnouncements();

      expect(screen.getByRole('status')).toHaveTextContent(/^Plain$/);
    });

    it.each(['warning', 'danger'] as const)(
      'leaves a %s notification to announce itself as an alert',
      color => {
        render(<NotificationContainer />);
        act(() => {
          notification.show({ message: `Msg ${color}`, color, duration: 0 });
        });

        // The alert arrives with its text, in the notification itself.
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'assertive');
        expect(alert).toHaveTextContent(new RegExp(`^Msg ${color}$`));
        expect(alert.closest('.notification')).not.toBeNull();

        // And it isn't written anywhere else.
        waitForAnnouncements();
        expect(screen.getByRole('status')).toBeEmptyDOMElement();
        expect(screen.getAllByRole('alert')).toEqual([alert]);
      }
    );

    it('writes only the polite ones when they appear together with an alert', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.success('Saved', { duration: 0 });
        notification.warning('Almost full', { duration: 0 });
      });
      waitForAnnouncements();

      expect(screen.getByRole('status')).toHaveTextContent(/^Saved$/);
      expect(screen.getByRole('alert')).toHaveTextContent(/^Almost full$/);
    });

    it('writes the announcement into the region that was already there', () => {
      render(<NotificationContainer />);
      const status = screen.getByRole('status');

      act(() => {
        notification.success('Saved', { duration: 0 });
      });
      // Not in the commit that shows the notification.
      expect(status).toBeEmptyDOMElement();

      waitForAnnouncements();
      expect(screen.getByRole('status')).toBe(status);
      expect(status).toHaveTextContent('Saved');
    });

    it('announces only the message, not the close button', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.success('Saved', { duration: 0 });
        notification.danger('Something went wrong', { duration: 0 });
      });
      waitForAnnouncements();

      for (const [role, text] of [
        ['status', /^Saved$/],
        ['alert', /^Something went wrong$/],
      ] as const) {
        const region = screen.getByRole(role);
        expect(region).toHaveTextContent(text);
        expect(within(region).queryByRole('button')).toBeNull();
      }
      expect(
        screen.getAllByRole('button', { name: 'Close notification' })
      ).toHaveLength(2);
    });

    it('announces the text a message renders, without its markup', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.info(
          <>
            <strong>Draft</strong> saved
          </>,
          { duration: 0 }
        );
      });
      waitForAnnouncements();

      const region = screen.getByRole('status');
      expect(region).toHaveTextContent(/^Draft saved$/);
      expect(region.querySelector('strong')).toBeNull();
    });

    it('announces each polite notification once, through the region alone', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.success('Once', { duration: 0 });
      });
      waitForAnnouncements();

      // The notification carries no live region of its own, so the region is
      // the only one in the page, and it says it once.
      expect(screen.getAllByRole('status')).toEqual([
        screen.getByRole('status'),
      ]);
      expect(screen.queryByRole('alert')).toBeNull();
      const shown = document.querySelector('.notification')!;
      expect(shown).not.toHaveAttribute('role');
      expect(shown.querySelector('[role], [aria-live]')).toBeNull();
      expect(screen.getByRole('status').children).toHaveLength(1);

      // A later notification is announced on its own.
      act(() => {
        notification.info('Next', { duration: 0 });
      });
      waitForAnnouncements();
      expect(screen.getByRole('status')).toHaveTextContent(/^Next$/);
    });

    it('clears an announcement after a moment, leaving the notification', () => {
      render(<NotificationContainer />);
      act(() => {
        notification.success('Stays up', { indefinite: true });
      });
      waitForAnnouncements();
      expect(screen.getByRole('status')).toHaveTextContent('Stays up');

      act(() => {
        jest.advanceTimersByTime(announcementLifetime);
      });

      expect(screen.getByRole('status')).toBeEmptyDOMElement();
      expect(document.querySelector('.notification')).toHaveTextContent(
        'Stays up'
      );
    });

    it('announces the next queued notification when it appears', () => {
      render(<NotificationContainer />);
      let first = '';
      act(() => {
        first = notification.show({ message: 'Q1', duration: 0, queue: true });
        notification.show({ message: 'Q2', duration: 0, queue: true });
      });
      waitForAnnouncements();
      expect(screen.getByRole('status')).toHaveTextContent(/^Q1$/);

      act(() => {
        notification.close(first);
      });
      waitForAnnouncements();
      expect(screen.getByRole('status')).toHaveTextContent(/^Q2$/);
    });

    it('announces notifications at different positions together', () => {
      render(<NotificationContainer position="top-right" />);
      act(() => {
        notification.show({ message: 'Here', duration: 0 });
        notification.info('There', { position: 'bottom-left', duration: 0 });
      });
      waitForAnnouncements();

      expect(
        Array.from(screen.getByRole('status').children).map(
          el => el.textContent
        )
      ).toEqual(['Here', 'There']);
    });

    it('keeps its region in place while stacks come and go', () => {
      render(<NotificationContainer />);
      const status = screen.getByRole('status');

      act(() => {
        notification.show({ message: 'Top', duration: 0 });
        notification.show({ message: 'Bottom', position: 'bottom' });
      });
      act(() => {
        notification.closeAll();
      });

      expect(screen.getByRole('status')).toBe(status);
    });

    it('hides the region with no stylesheet, whatever the class prefix', () => {
      // No CSS is loaded here, Bulma's helpers included, and the region
      // doesn't rely on any.
      expect(document.styleSheets).toHaveLength(0);
      render(
        <ConfigProvider classPrefix="bestax-">
          <NotificationContainer />
        </ConfigProvider>
      );
      act(() => {
        notification.success('Hidden copy', { duration: 0 });
      });
      waitForAnnouncements();

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Hidden copy');
      expect(status).not.toHaveAttribute('class');
      expect(status).toHaveStyle({
        position: 'absolute',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        clip: 'rect(0px, 0px, 0px, 0px)',
        'clip-path': 'inset(50%)',
        'white-space': 'nowrap',
      });
    });

    it("leaves getByRole('alert') to a toast shown beside it", () => {
      // Without an alert region of its own, a container with no danger or
      // warning notification showing adds no alert to the page, so a toast's
      // alert is the only one.
      render(
        <>
          <NotificationContainer />
          <ToastContainer />
        </>
      );
      act(() => {
        notification.success('Saved', { duration: 0 });
        toast.info('Synced', { duration: 0 });
      });
      waitForAnnouncements();

      expect(screen.getByRole('alert')).toHaveClass('toast');
      expect(screen.getByRole('alert')).toHaveTextContent('Synced');

      act(() => {
        toast.closeAll();
      });
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

  it('announces them once the region it mounts is in the page', () => {
    notification.show({ message: 'Early', duration: 0 });
    notification.warning('Early warning', { duration: 0 });

    render(<NotificationContainer />);
    const status = screen.getByRole('status');
    // The region mounts empty, alongside the notifications. The warning
    // arrives as an alert, holding its own text.
    expect(status).toBeEmptyDOMElement();
    expect(screen.getByRole('alert')).toHaveTextContent(/^Early warning$/);

    act(() => {
      jest.advanceTimersByTime(announceDelay);
    });

    expect(status).toHaveTextContent(/^Early$/);
  });

  it('keeps one status region and announces once under StrictMode', () => {
    notification.show({ message: 'Strict', duration: 0 });
    render(
      <StrictMode>
        <NotificationContainer />
      </StrictMode>
    );
    act(() => {
      jest.advanceTimersByTime(announceDelay);
    });

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(
      Array.from(screen.getByRole('status').children).map(el => el.textContent)
    ).toEqual(['Strict']);
  });

  it('stops announcing once it unmounts', () => {
    notification.show({ message: 'Unmounted', duration: 0 });
    const { unmount } = render(<NotificationContainer />);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
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

      // The status region arrives with it, and announces it once it's in.
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
      act(() => {
        jest.advanceTimersByTime(announceDelay);
      });
      expect(screen.getByRole('status')).toHaveTextContent(
        /^Before hydration$/
      );
    } finally {
      // A root left mounted would add its notifications to every later test's.
      await act(async () => unmountRoot());
      errorSpy.mockRestore();
      document.body.removeChild(container);
    }
  });

  it('adds only its status region, in one render, when it hydrates with nothing to show', async () => {
    // Empty the way a closed notification leaves it, not only the way it
    // starts.
    const id = notification.show({ message: 'Gone', duration: 0 });
    notification.close(id);

    const onRender = jest.fn();
    const app = (
      <main>
        <Profiler id="notifications" onRender={onRender}>
          <NotificationContainer />
        </Profiler>
      </main>
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(app);
    document.body.appendChild(container);

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, app);
        unmountRoot = () => root.unmount();
      });

      // The hydrating render matches the server's empty markup, and the one
      // render after it portals the region in.
      expect(errorSpy).not.toHaveBeenCalled();
      expect(onRender.mock.calls.map(([, phase]) => phase)).toEqual([
        'mount',
        'update',
      ]);
      expect(container.innerHTML).toBe('<main></main>');
      expect(
        Array.from(document.body.children).filter(el => el !== container)
      ).toEqual([screen.getByRole('status')]);
    } finally {
      await act(async () => unmountRoot());
      errorSpy.mockRestore();
      document.body.removeChild(container);
    }
  });
});

describe('NotificationContainer with notifications shown at their own position', () => {
  afterEach(() => {
    jest.clearAllTimers();
    act(() => {
      notification.closeAll();
    });
  });

  // Where a stack sits, read back from the inline style that fixes it there.
  const positionOf = (stack: HTMLElement) => {
    const edge = stack.style.bottom === '0px' ? 'bottom' : 'top';
    if (stack.style.left === '50%') return edge;
    return `${edge}-${stack.style.right === '0px' ? 'right' : 'left'}`;
  };

  // Each stack the container renders, in page order, with its messages.
  const stacks = () =>
    Array.from(document.body.children)
      .filter(el => el.querySelector(':scope > .notification'))
      .map(stack => [
        positionOf(stack as HTMLElement),
        Array.from(stack.children).map(el => el.textContent),
      ]);

  it('puts a notification shown with a position at that position', () => {
    render(<NotificationContainer position="top-right" />);
    act(() => {
      notification.show({ message: 'Placed', position: 'bottom', duration: 0 });
    });

    expect(stacks()).toEqual([['bottom', ['Placed']]]);
  });

  it("puts a notification shown without one at the container's position", () => {
    render(<NotificationContainer position="bottom-left" />);
    act(() => {
      notification.show({ message: 'Placed', position: 'top', duration: 0 });
      notification.info('Unplaced', { duration: 0 });
    });

    expect(stacks()).toEqual([
      ['top', ['Placed']],
      ['bottom-left', ['Unplaced']],
    ]);
  });

  it('renders a stack for each position in use, in screen order', () => {
    render(<NotificationContainer position="top-right" />);
    act(() => {
      notification.show({
        message: 'BR',
        position: 'bottom-right',
        duration: 0,
      });
      notification.show({ message: 'Default', duration: 0 });
      notification.show({ message: 'TL', position: 'top-left', duration: 0 });
      notification.show({
        message: 'BR 2',
        position: 'bottom-right',
        duration: 0,
      });
    });

    // Across the top, then across the bottom, whatever order they were used
    // in, and no stack for a position nothing is shown at. Each stack keeps
    // its notifications in the order they were shown.
    expect(stacks()).toEqual([
      ['top-left', ['TL']],
      ['top-right', ['Default']],
      ['bottom-right', ['BR', 'BR 2']],
    ]);
  });

  it("gives a notification at the container's own position the container's stack", () => {
    // What a container rendered before notifications could be placed on
    // their own: one stack, fixed to the container's position, and then the
    // status region, which says nothing until the announcements are due.
    const { container } = render(<NotificationContainer position="bottom" />);
    act(() => {
      notification.show({ message: 'One', duration: 0 });
      notification.show({ message: 'Two', position: 'bottom', duration: 0 });
    });

    expect(
      Array.from(document.body.children)
        .filter(el => el !== container)
        .map(el => el.outerHTML)
    ).toEqual([
      '<div style="position: fixed; z-index: 100; display: flex; flex-direction: column-reverse; gap: 0.75rem; padding: 1rem; pointer-events: none; max-width: 100%; bottom: 0px; left: 50%; transform: translateX(-50%); align-items: center;">' +
        '<div class="notification" style="pointer-events: auto;"><button class="delete" aria-label="Close notification"></button><span>One</span></div>' +
        '<div class="notification" style="pointer-events: auto;"><button class="delete" aria-label="Close notification"></button><span>Two</span></div>' +
        '</div>',
      '<div role="status" aria-live="polite" style="position: absolute; width: 1px; height: 1px; margin: 0px; padding: 0px; border: 0px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); clip-path: inset(50%); white-space: nowrap;"></div>',
    ]);
  });

  it('removes a stack once its last notification is closed, leaving the others', () => {
    render(<NotificationContainer position="top-right" />);
    act(() => {
      notification.show({ message: 'Stay', duration: 0 });
      notification.show({ message: 'Go', position: 'top-left', duration: 0 });
    });
    expect(stacks()).toHaveLength(2);

    const go = screen.getByText('Go').closest<HTMLElement>('.notification')!;
    fireEvent.click(within(go).getByRole('button'));

    expect(stacks()).toEqual([['top-right', ['Stay']]]);
  });

  it('times a notification out at its own position', () => {
    render(<NotificationContainer position="top-right" />);
    act(() => {
      notification.show({ message: 'Stay', duration: 0 });
      notification.show({
        message: 'Timed',
        position: 'bottom-left',
        duration: 1000,
      });
    });

    act(() => {
      jest.advanceTimersByTime(999);
    });
    expect(stacks()).toEqual([
      ['top-right', ['Stay']],
      ['bottom-left', ['Timed']],
    ]);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(stacks()).toEqual([['top-right', ['Stay']]]);
  });

  it('keeps one queue across positions, each shown at its own', () => {
    render(<NotificationContainer position="top-right" />);
    let first = '';
    act(() => {
      first = notification.show({
        message: 'Q1',
        position: 'bottom-right',
        queue: true,
        duration: 0,
      });
      notification.show({ message: 'Q2', queue: true, duration: 0 });
    });

    // The second waits for the first, although it would go somewhere else.
    expect(stacks()).toEqual([['bottom-right', ['Q1']]]);

    act(() => {
      notification.close(first);
    });
    expect(stacks()).toEqual([['top-right', ['Q2']]]);
  });

  it("moves the notifications at the container's position when it changes, without remounting them", () => {
    const { rerender } = render(<NotificationContainer position="top-right" />);
    act(() => {
      notification.show({ message: 'Follows', duration: 0 });
      notification.show({
        message: 'Stays',
        position: 'bottom-left',
        duration: 0,
      });
    });
    const follows = screen.getByText('Follows').closest('.notification');

    rerender(<NotificationContainer position="top-left" />);

    expect(stacks()).toEqual([
      ['top-left', ['Follows']],
      ['bottom-left', ['Stays']],
    ]);
    expect(screen.getByText('Follows').closest('.notification')).toBe(follows);
  });

  it('places notifications shown before it mounts', () => {
    notification.show({ message: 'Early', position: 'bottom', duration: 0 });
    notification.show({ message: 'Early default', duration: 0 });

    render(<NotificationContainer position="top-left" />);

    expect(stacks()).toEqual([
      ['top-left', ['Early default']],
      ['bottom', ['Early']],
    ]);
  });

  it('shows each once under StrictMode', () => {
    notification.show({
      message: 'Early',
      position: 'bottom-left',
      duration: 0,
    });
    render(
      <StrictMode>
        <NotificationContainer />
      </StrictMode>
    );
    act(() => {
      notification.show({ message: 'Later', duration: 0 });
    });

    expect(stacks()).toEqual([
      ['top-right', ['Later']],
      ['bottom-left', ['Early']],
    ]);
  });

  it('renders nothing on the server, then places them once hydrated', async () => {
    notification.show({
      message: 'Placed',
      position: 'bottom-right',
      duration: 0,
    });
    notification.show({ message: 'Default', duration: 0 });
    const app = (
      <main>
        <NotificationContainer />
      </main>
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(app);
    document.body.appendChild(container);
    expect(container.innerHTML).toBe('<main></main>');

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, app);
        unmountRoot = () => root.unmount();
      });

      expect(errorSpy).not.toHaveBeenCalled();
      expect(stacks()).toEqual([
        ['top-right', ['Default']],
        ['bottom-right', ['Placed']],
      ]);
    } finally {
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
