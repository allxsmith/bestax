import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Snackbar, SnackbarContainer, snackbar } from '../Snackbar';

jest.useFakeTimers();

describe('Snackbar', () => {
  afterEach(() => {
    jest.clearAllTimers();
    snackbar.clear();
  });

  describe('Rendering', () => {
    it('renders with message', () => {
      render(<Snackbar message="Test message" duration={0} />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders in portal', () => {
      render(<Snackbar message="Test message" duration={0} />);
      const snackbarElement = screen.getByRole('status');
      expect(
        snackbarElement.closest('.snackbar-container')
      ).toBeInTheDocument();
    });

    it('applies snackbar class', () => {
      render(<Snackbar message="Test" duration={0} />);
      expect(screen.getByRole('status')).toHaveClass('snackbar');
    });
  });

  describe('Type (colors action button)', () => {
    it('applies is-type-success class', () => {
      render(<Snackbar message="Test" type="success" duration={0} />);
      expect(screen.getByRole('status')).toHaveClass('is-type-success');
    });

    it('applies is-type-danger class', () => {
      render(<Snackbar message="Test" type="danger" duration={0} />);
      expect(screen.getByRole('status')).toHaveClass('is-type-danger');
    });

    it('applies is-type-warning class', () => {
      render(<Snackbar message="Test" type="warning" duration={0} />);
      expect(screen.getByRole('status')).toHaveClass('is-type-warning');
    });

    it('applies is-type-info class', () => {
      render(<Snackbar message="Test" type="info" duration={0} />);
      expect(screen.getByRole('status')).toHaveClass('is-type-info');
    });

    it('applies is-type-primary class', () => {
      render(<Snackbar message="Test" type="primary" duration={0} />);
      expect(screen.getByRole('status')).toHaveClass('is-type-primary');
    });

    it('applies is-type-link class', () => {
      render(<Snackbar message="Test" type="link" duration={0} />);
      expect(screen.getByRole('status')).toHaveClass('is-type-link');
    });

    it('does not apply type class for default', () => {
      render(<Snackbar message="Test" type="default" duration={0} />);
      const el = screen.getByRole('status');
      expect(el).not.toHaveClass('is-type-default');
    });
  });

  describe('Color (colors background)', () => {
    it('applies is-success class for color', () => {
      render(<Snackbar message="Test" color="success" duration={0} />);
      expect(screen.getByRole('status')).toHaveClass('is-success');
    });

    it('applies is-danger class for color', () => {
      render(<Snackbar message="Test" color="danger" duration={0} />);
      expect(screen.getByRole('status')).toHaveClass('is-danger');
    });

    it('applies is-warning class for color', () => {
      render(<Snackbar message="Test" color="warning" duration={0} />);
      expect(screen.getByRole('status')).toHaveClass('is-warning');
    });

    it('applies is-info class for color', () => {
      render(<Snackbar message="Test" color="info" duration={0} />);
      expect(screen.getByRole('status')).toHaveClass('is-info');
    });

    it('does not apply color class when color is not set', () => {
      render(<Snackbar message="Test" duration={0} />);
      const el = screen.getByRole('status');
      expect(el).not.toHaveClass('is-success');
      expect(el).not.toHaveClass('is-danger');
    });
  });

  describe('Type and Color together', () => {
    it('applies both is-type-* and is-* classes', () => {
      render(
        <Snackbar message="Test" type="success" color="dark" duration={0} />
      );
      const el = screen.getByRole('status');
      expect(el).toHaveClass('is-type-success');
      expect(el).toHaveClass('is-dark');
    });
  });

  describe('Positions', () => {
    it('applies is-bottom-right position by default', () => {
      render(<Snackbar message="Test" duration={0} />);
      const container = screen
        .getByRole('status')
        .closest('.snackbar-container');
      expect(container).toHaveClass('is-bottom-right');
    });

    it('applies is-bottom-left position', () => {
      render(<Snackbar message="Test" position="bottom-left" duration={0} />);
      const container = screen
        .getByRole('status')
        .closest('.snackbar-container');
      expect(container).toHaveClass('is-bottom-left');
    });

    it('applies is-bottom position', () => {
      render(<Snackbar message="Test" position="bottom" duration={0} />);
      const container = screen
        .getByRole('status')
        .closest('.snackbar-container');
      expect(container).toHaveClass('is-bottom');
    });

    it('applies is-top-right position', () => {
      render(<Snackbar message="Test" position="top-right" duration={0} />);
      const container = screen
        .getByRole('status')
        .closest('.snackbar-container');
      expect(container).toHaveClass('is-top-right');
    });

    it('applies is-top-left position', () => {
      render(<Snackbar message="Test" position="top-left" duration={0} />);
      const container = screen
        .getByRole('status')
        .closest('.snackbar-container');
      expect(container).toHaveClass('is-top-left');
    });

    it('applies is-top position', () => {
      render(<Snackbar message="Test" position="top" duration={0} />);
      const container = screen
        .getByRole('status')
        .closest('.snackbar-container');
      expect(container).toHaveClass('is-top');
    });
  });

  describe('Dismissible', () => {
    it('does not render close button by default', () => {
      render(<Snackbar message="Test" duration={0} />);
      expect(
        screen.queryByRole('button', { name: /close/i })
      ).not.toBeInTheDocument();
    });

    it('renders close button when dismissible is true', () => {
      render(<Snackbar message="Test" duration={0} dismissible />);
      expect(
        screen.getByRole('button', { name: /close/i })
      ).toBeInTheDocument();
    });

    it('close button triggers onClose', () => {
      const onClose = jest.fn();
      render(
        <Snackbar message="Test" duration={0} dismissible onClose={onClose} />
      );
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Rounded', () => {
    it('does not apply is-rounded by default', () => {
      render(<Snackbar message="Test" duration={0} />);
      expect(screen.getByRole('status')).not.toHaveClass('is-rounded');
    });

    it('applies is-rounded class when rounded is true', () => {
      render(<Snackbar message="Test" duration={0} rounded />);
      expect(screen.getByRole('status')).toHaveClass('is-rounded');
    });
  });

  describe('Conditional Actions', () => {
    it('does not render .snackbar-actions when no actionText or cancelText', () => {
      render(<Snackbar message="Test" duration={0} />);
      expect(
        document.querySelector('.snackbar-actions')
      ).not.toBeInTheDocument();
    });

    it('renders .snackbar-actions when actionText is provided', () => {
      render(<Snackbar message="Test" duration={0} actionText="OK" />);
      expect(document.querySelector('.snackbar-actions')).toBeInTheDocument();
    });

    it('renders .snackbar-actions when cancelText is provided', () => {
      render(<Snackbar message="Test" duration={0} cancelText="Cancel" />);
      expect(document.querySelector('.snackbar-actions')).toBeInTheDocument();
    });
  });

  describe('Inline', () => {
    it('renders without portal when inline is true', () => {
      render(<Snackbar message="Test" duration={0} inline />);
      const snackbarEl = screen.getByRole('status');
      expect(snackbarEl).toBeInTheDocument();
      expect(snackbarEl.closest('.snackbar-container')).not.toBeInTheDocument();
    });

    it('renders with portal by default', () => {
      render(<Snackbar message="Test" duration={0} />);
      const snackbarEl = screen.getByRole('status');
      expect(snackbarEl.closest('.snackbar-container')).toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('renders action button when actionText is provided', () => {
      render(<Snackbar message="Test" actionText="Undo" duration={0} />);
      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    });

    it('does not render action button by default', () => {
      render(<Snackbar message="Test" duration={0} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onAction when action button is clicked', () => {
      const onAction = jest.fn();
      render(
        <Snackbar
          message="Test"
          actionText="Undo"
          onAction={onAction}
          duration={0}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('closes snackbar after action click', () => {
      const onClose = jest.fn();
      render(
        <Snackbar
          message="Test"
          actionText="Undo"
          onAction={() => {}}
          onClose={onClose}
          duration={0}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cancel Button', () => {
    it('renders cancel button when cancelText is provided', () => {
      render(<Snackbar message="Test" cancelText="Dismiss" duration={0} />);
      expect(
        screen.getByRole('button', { name: 'Dismiss' })
      ).toBeInTheDocument();
    });

    it('closes snackbar when cancel button is clicked', () => {
      const onClose = jest.fn();
      render(
        <Snackbar
          message="Test"
          cancelText="Dismiss"
          onClose={onClose}
          duration={0}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders both cancel and action buttons', () => {
      render(
        <Snackbar
          message="Test"
          cancelText="Cancel"
          actionText="OK"
          duration={0}
        />
      );
      expect(
        screen.getByRole('button', { name: 'Cancel' })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
    });
  });

  describe('Auto Close', () => {
    it('closes automatically after duration', () => {
      const onClose = jest.fn();
      render(<Snackbar message="Test" duration={4000} onClose={onClose} />);

      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(4000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not auto-close when duration is 0', () => {
      const onClose = jest.fn();
      render(<Snackbar message="Test" duration={0} onClose={onClose} />);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Indefinite', () => {
    it('stays open when indefinite is true regardless of duration', () => {
      const onClose = jest.fn();
      render(
        <Snackbar message="Test" indefinite duration={2000} onClose={onClose} />
      );

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Pause on Hover', () => {
    it('pauses timer on mouse enter', () => {
      const onClose = jest.fn();
      render(
        <Snackbar
          message="Test"
          duration={3000}
          pauseOnHover
          onClose={onClose}
        />
      );

      const snackbarEl = screen.getByRole('status');
      fireEvent.mouseEnter(snackbarEl);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('resumes timer on mouse leave', () => {
      const onClose = jest.fn();
      render(
        <Snackbar
          message="Test"
          duration={3000}
          pauseOnHover
          onClose={onClose}
        />
      );

      const snackbarEl = screen.getByRole('status');
      fireEvent.mouseEnter(snackbarEl);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      fireEvent.mouseLeave(snackbarEl);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not pause when pauseOnHover is false', () => {
      const onClose = jest.fn();
      render(
        <Snackbar
          message="Test"
          duration={3000}
          pauseOnHover={false}
          onClose={onClose}
        />
      );

      const snackbarEl = screen.getByRole('status');
      fireEvent.mouseEnter(snackbarEl);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('mouseLeave is a no-op when pauseOnHover is false (covers if-false branch)', () => {
      render(<Snackbar message="Test" duration={3000} pauseOnHover={false} />);
      const snackbarEl = screen.getByRole('status');
      // Should not throw and should leave isPaused alone (false branch).
      expect(() => fireEvent.mouseLeave(snackbarEl)).not.toThrow();
    });
  });

  describe('Click to Dismiss', () => {
    it('closes when clicked (default behavior)', () => {
      const onClose = jest.fn();
      render(<Snackbar message="Test" duration={0} onClose={onClose} />);

      fireEvent.click(screen.getByRole('status'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('action button click does not double-fire close', () => {
      const onClose = jest.fn();
      const onAction = jest.fn();
      render(
        <Snackbar
          message="Test"
          actionText="Undo"
          onAction={onAction}
          onClose={onClose}
          duration={0}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('cancel button click does not double-fire close', () => {
      const onClose = jest.fn();
      render(
        <Snackbar
          message="Test"
          cancelText="Cancel"
          onClose={onClose}
          duration={0}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('dismissible close button click does not double-fire close', () => {
      const onClose = jest.fn();
      render(
        <Snackbar message="Test" dismissible onClose={onClose} duration={0} />
      );

      fireEvent.click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Escape Key', () => {
    it('closes on Escape when cancelable', () => {
      const onClose = jest.fn();
      render(
        <Snackbar message="Test" duration={0} cancelable onClose={onClose} />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on Escape when not cancelable', () => {
      const onClose = jest.fn();
      render(
        <Snackbar
          message="Test"
          duration={0}
          cancelable={false}
          onClose={onClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('non-Escape key with cancelable does not close (covers if-false branch)', () => {
      const onClose = jest.fn();
      render(
        <Snackbar message="Test" duration={0} cancelable onClose={onClose} />
      );
      fireEvent.keyDown(document, { key: 'a' });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has status role', () => {
      render(<Snackbar message="Test" duration={0} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live polite', () => {
      render(<Snackbar message="Test" duration={0} />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Container target', () => {
    it('mounts into element matched by string selector', () => {
      const mount = document.createElement('div');
      mount.id = 'snackbar-mount-target';
      document.body.appendChild(mount);

      try {
        render(
          <Snackbar
            message="Custom container"
            duration={0}
            container="#snackbar-mount-target"
          />
        );

        expect(mount.querySelector('.snackbar-container')).toBeInTheDocument();
        expect(screen.getByText('Custom container')).toBeInTheDocument();
      } finally {
        document.body.removeChild(mount);
      }
    });

    it('falls back to document.body when string selector matches nothing', () => {
      render(
        <Snackbar
          message="Fallback to body"
          duration={0}
          container="#does-not-exist"
        />
      );

      const snackbarEl = screen.getByText('Fallback to body');
      const containerEl = snackbarEl.closest('.snackbar-container');
      expect(containerEl).toBeInTheDocument();
      // Portal mounted directly under document.body when selector misses.
      expect(containerEl?.parentElement).toBe(document.body);
    });

    it('mounts into provided HTMLElement container', () => {
      const mount = document.createElement('div');
      mount.id = 'snackbar-html-element-target';
      document.body.appendChild(mount);

      try {
        render(
          <Snackbar
            message="HTMLElement container"
            duration={0}
            container={mount}
          />
        );

        expect(mount.querySelector('.snackbar-container')).toBeInTheDocument();
        expect(screen.getByText('HTMLElement container')).toBeInTheDocument();
      } finally {
        document.body.removeChild(mount);
      }
    });
  });

  describe('Action button without onAction handler', () => {
    it('renders and handles click without throwing when onAction is omitted', () => {
      const onClose = jest.fn();
      render(
        <Snackbar
          message="Test"
          actionText="Undo"
          onClose={onClose}
          duration={0}
        />
      );

      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
      }).not.toThrow();

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Action/Cancel button isolation', () => {
    it('renders only the action button when only actionText is provided', () => {
      render(<Snackbar message="Test" duration={0} actionText="OK" />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent('OK');
      expect(document.querySelector('.snackbar-action')).toBeInTheDocument();
      expect(
        document.querySelector('.snackbar-cancel')
      ).not.toBeInTheDocument();
    });

    it('renders only the cancel button when only cancelText is provided', () => {
      render(<Snackbar message="Test" duration={0} cancelText="Cancel" />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent('Cancel');
      expect(document.querySelector('.snackbar-cancel')).toBeInTheDocument();
      expect(
        document.querySelector('.snackbar-action')
      ).not.toBeInTheDocument();
    });
  });
});

describe('Snackbar Programmatic API', () => {
  afterEach(() => {
    jest.clearAllTimers();
    snackbar.clear();
  });

  describe('snackbar.show', () => {
    it('returns a promise', () => {
      const result = snackbar.show({ message: 'Test' });
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('snackbar.success', () => {
    it('creates a success snackbar', () => {
      render(<SnackbarContainer />);
      act(() => {
        snackbar.success('Success message');
      });
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('is-type-success');
    });
  });

  describe('snackbar.danger', () => {
    it('creates a danger snackbar', () => {
      render(<SnackbarContainer />);
      act(() => {
        snackbar.danger('Error message');
      });
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('is-type-danger');
    });
  });

  describe('snackbar.warning', () => {
    it('creates a warning snackbar', () => {
      render(<SnackbarContainer />);
      act(() => {
        snackbar.warning('Warning message');
      });
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('is-type-warning');
    });
  });

  describe('snackbar.info', () => {
    it('creates an info snackbar', () => {
      render(<SnackbarContainer />);
      act(() => {
        snackbar.info('Info message');
      });
      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('is-type-info');
    });
  });

  describe('snackbar.close', () => {
    it('closes the current snackbar', () => {
      render(<SnackbarContainer />);
      act(() => {
        snackbar.show({ message: 'Test', duration: 0 });
      });
      expect(screen.getByText('Test')).toBeInTheDocument();

      act(() => {
        snackbar.close();
      });
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });
  });

  describe('snackbar.clear', () => {
    it('clears all queued snackbars', () => {
      render(<SnackbarContainer />);
      act(() => {
        snackbar.show({ message: 'First', duration: 0 });
        snackbar.show({ message: 'Second', duration: 0 });
        snackbar.show({ message: 'Third', duration: 0 });
      });
      expect(screen.getByText('First')).toBeInTheDocument();

      act(() => {
        snackbar.clear();
      });
      expect(screen.queryByText('First')).not.toBeInTheDocument();
    });
  });

  describe('Queue behavior', () => {
    it('shows one snackbar at a time', () => {
      render(<SnackbarContainer />);
      act(() => {
        snackbar.show({ message: 'First', duration: 0 });
        snackbar.show({ message: 'Second', duration: 0 });
      });

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.queryByText('Second')).not.toBeInTheDocument();
    });

    it('shows next snackbar after current closes', () => {
      render(<SnackbarContainer />);
      act(() => {
        snackbar.show({ message: 'First', duration: 0 });
        snackbar.show({ message: 'Second', duration: 0 });
      });

      expect(screen.getByText('First')).toBeInTheDocument();

      act(() => {
        snackbar.close();
      });

      expect(screen.queryByText('First')).not.toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('snackbar.subscribe', () => {
    it('notifies subscribers of changes', () => {
      const listener = jest.fn();
      const unsubscribe = snackbar.subscribe(listener);

      act(() => {
        snackbar.show({ message: 'Test' });
      });

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('returns unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = snackbar.subscribe(listener);

      unsubscribe();

      act(() => {
        snackbar.show({ message: 'Test' });
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});

describe('SnackbarContainer', () => {
  afterEach(() => {
    snackbar.clear();
  });

  it('renders snackbars from programmatic API', () => {
    render(<SnackbarContainer />);

    act(() => {
      snackbar.show({ message: 'Container snackbar', duration: 0 });
    });

    expect(screen.getByText('Container snackbar')).toBeInTheDocument();
  });

  it('uses default position from container', () => {
    render(<SnackbarContainer position="top-left" />);

    act(() => {
      snackbar.show({ message: 'Test', duration: 0 });
    });

    const container = screen.getByRole('status').closest('.snackbar-container');
    expect(container).toHaveClass('is-top-left');
  });

  it('individual snackbar position overrides container default', () => {
    render(<SnackbarContainer position="top-left" />);

    act(() => {
      snackbar.show({ message: 'Test', duration: 0, position: 'bottom-right' });
    });

    const container = screen.getByRole('status').closest('.snackbar-container');
    expect(container).toHaveClass('is-bottom-right');
  });

  it('closes current snackbar via inner onClose handler and advances queue', () => {
    render(<SnackbarContainer />);

    act(() => {
      snackbar.show({ message: 'First', duration: 0 });
      snackbar.show({ message: 'Second', duration: 0 });
    });

    expect(screen.getByText('First')).toBeInTheDocument();

    // Click the snackbar itself; that fires the inner onClose, which the
    // SnackbarContainer wires to snackbar.close() — covering line 463.
    act(() => {
      fireEvent.click(screen.getByRole('status'));
    });

    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});
