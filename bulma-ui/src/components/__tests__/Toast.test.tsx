import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast, ToastContainer, toast } from '../Toast';

jest.useFakeTimers();

describe('Toast', () => {
  afterEach(() => {
    jest.clearAllTimers();
    toast.closeAll();
  });

  describe('Rendering', () => {
    it('renders with message', () => {
      render(<Toast message="Test message" duration={0} />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders in portal', () => {
      render(<Toast message="Test message" duration={0} />);
      const toastElement = screen.getByRole('alert');
      expect(toastElement.closest('.toast-container')).toBeInTheDocument();
    });

    it('applies toast class', () => {
      render(<Toast message="Test" duration={0} />);
      expect(screen.getByRole('alert')).toHaveClass('toast');
    });

    it('renders message in .toast-message', () => {
      render(<Toast message="Test message" duration={0} />);
      const messageEl = screen.getByText('Test message');
      expect(messageEl).toHaveClass('toast-message');
    });

    it('does not render a close button by default', () => {
      render(<Toast message="Test" duration={0} />);
      expect(
        screen.queryByRole('button', { name: /close/i })
      ).not.toBeInTheDocument();
    });

    it('applies rounded class', () => {
      render(<Toast message="Test" duration={0} rounded />);
      expect(screen.getByRole('alert')).toHaveClass('is-rounded');
    });
  });

  describe('Type (colors background)', () => {
    it('applies is-success type class', () => {
      render(<Toast message="Test" type="success" duration={0} />);
      expect(screen.getByRole('alert')).toHaveClass('is-success');
    });

    it('applies is-danger type class', () => {
      render(<Toast message="Test" type="danger" duration={0} />);
      expect(screen.getByRole('alert')).toHaveClass('is-danger');
    });

    it('applies is-warning type class', () => {
      render(<Toast message="Test" type="warning" duration={0} />);
      expect(screen.getByRole('alert')).toHaveClass('is-warning');
    });

    it('applies is-info type class', () => {
      render(<Toast message="Test" type="info" duration={0} />);
      expect(screen.getByRole('alert')).toHaveClass('is-info');
    });

    it('applies is-primary type class', () => {
      render(<Toast message="Test" type="primary" duration={0} />);
      expect(screen.getByRole('alert')).toHaveClass('is-primary');
    });

    it('applies is-link type class', () => {
      render(<Toast message="Test" type="link" duration={0} />);
      expect(screen.getByRole('alert')).toHaveClass('is-link');
    });

    it('does not apply type class for default', () => {
      render(<Toast message="Test" type="default" duration={0} />);
      const toastEl = screen.getByRole('alert');
      expect(toastEl).not.toHaveClass('is-default');
      expect(toastEl).not.toHaveClass('is-success');
    });
  });

  describe('Accessibility (aria-live by type)', () => {
    it.each(['danger', 'warning'] as const)(
      'uses assertive aria-live for %s',
      type => {
        render(<Toast message="Test" type={type} duration={0} />);
        expect(screen.getByRole('alert')).toHaveAttribute(
          'aria-live',
          'assertive'
        );
      }
    );

    it.each(['default', 'success', 'info'] as const)(
      'uses polite aria-live for %s',
      type => {
        render(<Toast message="Test" type={type} duration={0} />);
        expect(screen.getByRole('alert')).toHaveAttribute(
          'aria-live',
          'polite'
        );
      }
    );
  });

  describe('ActionType (colors action button)', () => {
    it('applies is-action-success class', () => {
      render(
        <Toast
          message="Test"
          actionType="success"
          actionText="OK"
          duration={0}
        />
      );
      expect(screen.getByRole('alert')).toHaveClass('is-action-success');
    });

    it('applies is-action-danger class', () => {
      render(
        <Toast
          message="Test"
          actionType="danger"
          actionText="OK"
          duration={0}
        />
      );
      expect(screen.getByRole('alert')).toHaveClass('is-action-danger');
    });

    it('does not apply is-action class when actionType is omitted', () => {
      render(<Toast message="Test" actionText="OK" duration={0} />);
      const el = screen.getByRole('alert');
      expect(el.className).not.toMatch(/is-action-/);
    });

    it('does not apply is-action class for default actionType', () => {
      render(
        <Toast
          message="Test"
          actionType="default"
          actionText="OK"
          duration={0}
        />
      );
      const el = screen.getByRole('alert');
      expect(el).not.toHaveClass('is-action-default');
    });
  });

  describe('Type and ActionType together', () => {
    it('applies both is-{type} and is-action-{actionType} classes', () => {
      render(
        <Toast
          message="Test"
          type="success"
          actionType="warning"
          actionText="OK"
          duration={0}
        />
      );
      const el = screen.getByRole('alert');
      expect(el).toHaveClass('is-success');
      expect(el).toHaveClass('is-action-warning');
    });
  });

  describe('Positions', () => {
    it('applies top-right position on container', () => {
      render(<Toast message="Test" position="top-right" duration={0} />);
      const container = screen.getByRole('alert').closest('.toast-container');
      expect(container).toHaveClass('is-top-right');
    });

    it('applies top-left position on container', () => {
      render(<Toast message="Test" position="top-left" duration={0} />);
      const container = screen.getByRole('alert').closest('.toast-container');
      expect(container).toHaveClass('is-top-left');
    });

    it('applies top-center position on container', () => {
      render(<Toast message="Test" position="top-center" duration={0} />);
      const container = screen.getByRole('alert').closest('.toast-container');
      expect(container).toHaveClass('is-top-center');
    });

    it('applies bottom-right position on container', () => {
      render(<Toast message="Test" position="bottom-right" duration={0} />);
      const container = screen.getByRole('alert').closest('.toast-container');
      expect(container).toHaveClass('is-bottom-right');
    });

    it('applies bottom-left position on container', () => {
      render(<Toast message="Test" position="bottom-left" duration={0} />);
      const container = screen.getByRole('alert').closest('.toast-container');
      expect(container).toHaveClass('is-bottom-left');
    });

    it('applies bottom-center position on container', () => {
      render(<Toast message="Test" position="bottom-center" duration={0} />);
      const container = screen.getByRole('alert').closest('.toast-container');
      expect(container).toHaveClass('is-bottom-center');
    });
  });

  describe('Closable', () => {
    it('does not render close button by default', () => {
      render(<Toast message="Test" duration={0} />);
      expect(
        screen.queryByRole('button', { name: /close/i })
      ).not.toBeInTheDocument();
    });

    it('renders close button when closable is true', () => {
      render(<Toast message="Test" duration={0} closable />);
      expect(
        screen.getByRole('button', { name: /close/i })
      ).toBeInTheDocument();
    });

    it('close button triggers onClose', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" duration={0} closable onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('close button click does not double-fire close', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" duration={0} closable onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Action Button', () => {
    it('renders action button when actionText is provided', () => {
      render(<Toast message="Test" actionText="Undo" duration={0} />);
      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    });

    it('does not render action button by default', () => {
      render(<Toast message="Test" duration={0} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onAction when action button is clicked', () => {
      const onAction = jest.fn();
      render(
        <Toast
          message="Test"
          actionText="Undo"
          onAction={onAction}
          duration={0}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('closes toast after action click', () => {
      const onClose = jest.fn();
      render(
        <Toast
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

    it('handles action click without throwing when onAction is omitted', () => {
      const onClose = jest.fn();
      render(
        <Toast
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

    it('action button click does not double-fire close', () => {
      const onClose = jest.fn();
      const onAction = jest.fn();
      render(
        <Toast
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
  });

  describe('Cancel Button', () => {
    it('renders cancel button when cancelText is provided', () => {
      render(<Toast message="Test" cancelText="Dismiss" duration={0} />);
      expect(
        screen.getByRole('button', { name: 'Dismiss' })
      ).toBeInTheDocument();
    });

    it('closes toast when cancel button is clicked', () => {
      const onClose = jest.fn();
      render(
        <Toast
          message="Test"
          cancelText="Dismiss"
          onClose={onClose}
          duration={0}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('cancel button click does not double-fire close', () => {
      const onClose = jest.fn();
      render(
        <Toast
          message="Test"
          cancelText="Cancel"
          onClose={onClose}
          duration={0}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders both cancel and action buttons', () => {
      render(
        <Toast
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

  describe('Conditional Actions', () => {
    it('does not render .toast-actions when no actionText or cancelText', () => {
      render(<Toast message="Test" duration={0} />);
      expect(document.querySelector('.toast-actions')).not.toBeInTheDocument();
    });

    it('renders .toast-actions when actionText is provided', () => {
      render(<Toast message="Test" duration={0} actionText="OK" />);
      expect(document.querySelector('.toast-actions')).toBeInTheDocument();
    });

    it('renders .toast-actions when cancelText is provided', () => {
      render(<Toast message="Test" duration={0} cancelText="Cancel" />);
      expect(document.querySelector('.toast-actions')).toBeInTheDocument();
    });
  });

  describe('Action/Cancel button isolation', () => {
    it('renders only the action button when only actionText is provided', () => {
      render(<Toast message="Test" duration={0} actionText="OK" />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent('OK');
      expect(document.querySelector('.toast-action')).toBeInTheDocument();
      expect(document.querySelector('.toast-cancel')).not.toBeInTheDocument();
    });

    it('renders only the cancel button when only cancelText is provided', () => {
      render(<Toast message="Test" duration={0} cancelText="Cancel" />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent('Cancel');
      expect(document.querySelector('.toast-cancel')).toBeInTheDocument();
      expect(document.querySelector('.toast-action')).not.toBeInTheDocument();
    });
  });

  describe('Auto Close', () => {
    it('closes automatically after duration (default 2000)', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" onClose={onClose} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not auto-close when duration is 0', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" duration={0} onClose={onClose} />);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('stays open when indefinite is true', () => {
      const onClose = jest.fn();
      render(
        <Toast message="Test" indefinite duration={2000} onClose={onClose} />
      );

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Pause on Hover', () => {
    it('pauses timer on mouse enter', () => {
      const onClose = jest.fn();
      render(
        <Toast message="Test" duration={3000} pauseOnHover onClose={onClose} />
      );

      const toastEl = screen.getByRole('alert');
      fireEvent.mouseEnter(toastEl);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('resumes timer on mouse leave', () => {
      const onClose = jest.fn();
      render(
        <Toast message="Test" duration={3000} pauseOnHover onClose={onClose} />
      );

      const toastEl = screen.getByRole('alert');
      fireEvent.mouseEnter(toastEl);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      fireEvent.mouseLeave(toastEl);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not pause when pauseOnHover is false (default)', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" duration={3000} onClose={onClose} />);

      const toastEl = screen.getByRole('alert');
      fireEvent.mouseEnter(toastEl);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('mouseLeave is a no-op when pauseOnHover is false (covers if-false branch)', () => {
      render(<Toast message="Test" duration={3000} pauseOnHover={false} />);
      const toastEl = screen.getByRole('alert');
      expect(() => fireEvent.mouseLeave(toastEl)).not.toThrow();
    });
  });

  describe('Click to Dismiss', () => {
    it('closes when clicked (dismissible=true by default)', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" duration={0} onClose={onClose} />);

      fireEvent.click(screen.getByRole('alert'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicked if dismissible is false', () => {
      const onClose = jest.fn();
      render(
        <Toast
          message="Test"
          duration={0}
          dismissible={false}
          onClose={onClose}
        />
      );

      fireEvent.click(screen.getByRole('alert'));

      expect(onClose).not.toHaveBeenCalled();
    });

    it('closes when clicking outside the toast (dismissible=true)', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" duration={0} onClose={onClose} />);

      // Flush the deferred requestAnimationFrame that attaches the listener
      act(() => {
        jest.runAllTimers();
      });

      fireEvent.click(document.body);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking outside if dismissible is false', () => {
      const onClose = jest.fn();
      render(
        <Toast
          message="Test"
          duration={0}
          dismissible={false}
          onClose={onClose}
        />
      );

      act(() => {
        jest.runAllTimers();
      });

      fireEvent.click(document.body);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Escape Key', () => {
    it('closes on Escape when cancelable (default)', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" duration={0} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on Escape when cancelable is false', () => {
      const onClose = jest.fn();
      render(
        <Toast
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
        <Toast message="Test" duration={0} cancelable onClose={onClose} />
      );
      fireEvent.keyDown(document, { key: 'a' });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Branch coverage', () => {
    it('handles close without onClose handler (covers `onClose?.` falsy branch)', () => {
      render(<Toast message="Test" duration={0} />);
      expect(() => fireEvent.click(screen.getByRole('alert'))).not.toThrow();
    });

    it('does not close when click is inside the toast (covers contains-true branch)', () => {
      const onClose = jest.fn();
      render(<Toast message="Hello" duration={0} onClose={onClose} />);

      act(() => {
        jest.runAllTimers();
      });

      fireEvent.click(screen.getByRole('alert'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has alert role', () => {
      render(<Toast message="Test" duration={0} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has aria-live polite', () => {
      render(<Toast message="Test" duration={0} />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Container resolution', () => {
    it('mounts into a string selector container when it exists', () => {
      const target = document.createElement('div');
      target.id = 'toast-target';
      document.body.appendChild(target);

      try {
        render(
          <Toast message="In selector" duration={0} container="#toast-target" />
        );

        const toastEl = screen.getByRole('alert');
        expect(target.contains(toastEl)).toBe(true);
      } finally {
        document.body.removeChild(target);
      }
    });

    it('falls back to document.body when string selector matches nothing', () => {
      render(
        <Toast
          message="Fallback toast"
          duration={0}
          container="#does-not-exist"
        />
      );

      const toastEl = screen.getByRole('alert');
      const containerEl = toastEl.closest('.toast-container');
      expect(containerEl).not.toBeNull();
      expect(containerEl?.parentElement).toBe(document.body);
    });

    it('mounts into an HTMLElement container', () => {
      const target = document.createElement('div');
      document.body.appendChild(target);

      try {
        render(
          <Toast message="Element target" duration={0} container={target} />
        );

        const toastEl = screen.getByRole('alert');
        expect(target.contains(toastEl)).toBe(true);
      } finally {
        document.body.removeChild(target);
      }
    });
  });

  describe('Inline rendering', () => {
    it('renders without a portal when inline is true', () => {
      const { container: rtlContainer } = render(
        <Toast message="Inline toast" duration={0} inline />
      );

      const toastEl = screen.getByRole('alert');
      expect(rtlContainer.contains(toastEl)).toBe(true);
      expect(toastEl.closest('.toast-container')).not.toBeInTheDocument();
    });

    it('renders with portal by default', () => {
      render(<Toast message="Test" duration={0} />);
      const toastEl = screen.getByRole('alert');
      expect(toastEl.closest('.toast-container')).toBeInTheDocument();
    });
  });

  describe('Forwarded ref', () => {
    it('assigns to a MutableRefObject ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Toast message="Ref test" duration={0} ref={ref} />);

      expect(ref.current).not.toBeNull();
      expect(ref.current).toBe(screen.getByRole('alert'));
    });

    it('invokes a function ref', () => {
      const fnRef = jest.fn();
      render(<Toast message="Fn ref test" duration={0} ref={fnRef} />);

      expect(fnRef).toHaveBeenCalled();
      const lastArg = fnRef.mock.calls[fnRef.mock.calls.length - 1][0];
      expect(lastArg).toBe(screen.getByRole('alert'));
    });
  });
});

describe('Toast Programmatic API', () => {
  afterEach(() => {
    jest.clearAllTimers();
    toast.closeAll();
  });

  describe('toast.show', () => {
    it('returns a toast ID', () => {
      const id = toast.show({ message: 'Test' });
      expect(id).toMatch(/^toast-\d+$/);
    });
  });

  describe('toast.success', () => {
    it('creates a success toast', () => {
      render(<ToastContainer />);
      act(() => {
        toast.success('Success message');
      });
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('is-success');
    });
  });

  describe('toast.danger', () => {
    it('creates a danger toast', () => {
      render(<ToastContainer />);
      act(() => {
        toast.danger('Error message');
      });
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('is-danger');
    });
  });

  describe('toast.warning', () => {
    it('creates a warning toast', () => {
      render(<ToastContainer />);
      act(() => {
        toast.warning('Warning message');
      });
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('is-warning');
    });
  });

  describe('toast.info', () => {
    it('creates an info toast', () => {
      render(<ToastContainer />);
      act(() => {
        toast.info('Info message');
      });
      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('is-info');
    });
  });

  describe('toast.close', () => {
    it('closes a specific toast', () => {
      render(<ToastContainer />);
      let toastId: string;
      act(() => {
        toastId = toast.show({ message: 'Test', duration: 0 });
      });
      expect(screen.getByText('Test')).toBeInTheDocument();

      act(() => {
        toast.close(toastId);
      });
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });
  });

  describe('toast.closeAll', () => {
    it('closes all toasts', () => {
      render(<ToastContainer />);
      act(() => {
        toast.show({ message: 'Toast 1', duration: 0 });
        toast.show({ message: 'Toast 2', duration: 0 });
        toast.show({ message: 'Toast 3', duration: 0 });
      });
      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();

      act(() => {
        toast.closeAll();
      });
      expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Toast 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Toast 3')).not.toBeInTheDocument();
    });
  });

  describe('toast.subscribe', () => {
    it('notifies subscribers of changes', () => {
      const listener = jest.fn();
      const unsubscribe = toast.subscribe(listener);

      act(() => {
        toast.show({ message: 'Test' });
      });

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('returns unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = toast.subscribe(listener);

      unsubscribe();

      act(() => {
        toast.show({ message: 'Test' });
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});

describe('ToastContainer', () => {
  afterEach(() => {
    toast.closeAll();
  });

  it('renders toasts from programmatic API', () => {
    render(<ToastContainer />);

    act(() => {
      toast.show({ message: 'Container toast', duration: 0 });
    });

    expect(screen.getByText('Container toast')).toBeInTheDocument();
  });

  it('uses position from container prop', () => {
    render(<ToastContainer position="bottom-left" />);

    act(() => {
      toast.show({ message: 'Test', duration: 0 });
    });

    const container = screen.getByText('Test').closest('.toast-container');
    expect(container).toHaveClass('is-bottom-left');
  });

  it('removes toast from container when its onClose fires (click-to-dismiss)', () => {
    render(<ToastContainer />);

    act(() => {
      toast.show({ message: 'Auto-removed', duration: 0 });
    });

    expect(screen.getByText('Auto-removed')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText('Auto-removed'));
    });

    expect(screen.queryByText('Auto-removed')).not.toBeInTheDocument();
  });
});

describe('Toast Queue', () => {
  afterEach(() => {
    jest.clearAllTimers();
    toast.closeAll();
  });

  it('shows one queued toast at a time', () => {
    render(<ToastContainer />);
    act(() => {
      toast.show({ message: 'Queued 1', duration: 0, queue: true });
      toast.show({ message: 'Queued 2', duration: 0, queue: true });
    });

    expect(screen.getByText('Queued 1')).toBeInTheDocument();
    expect(screen.queryByText('Queued 2')).not.toBeInTheDocument();
  });

  it('shows next queued toast after current closes', () => {
    render(<ToastContainer />);
    let id1: string;
    act(() => {
      id1 = toast.show({ message: 'Queued 1', duration: 0, queue: true });
      toast.show({ message: 'Queued 2', duration: 0, queue: true });
    });

    expect(screen.getByText('Queued 1')).toBeInTheDocument();

    act(() => {
      toast.close(id1!);
    });

    expect(screen.queryByText('Queued 1')).not.toBeInTheDocument();
    expect(screen.getByText('Queued 2')).toBeInTheDocument();
  });

  it('non-queued toasts stack simultaneously with queued toasts', () => {
    render(<ToastContainer />);
    act(() => {
      toast.show({ message: 'Stacked 1', duration: 0 });
      toast.show({ message: 'Stacked 2', duration: 0 });
      toast.show({ message: 'Queued 1', duration: 0, queue: true });
    });

    expect(screen.getByText('Stacked 1')).toBeInTheDocument();
    expect(screen.getByText('Stacked 2')).toBeInTheDocument();
    expect(screen.getByText('Queued 1')).toBeInTheDocument();
  });

  it('removes a waiting toast from the queue when closed by id', () => {
    render(<ToastContainer />);
    let id1: string;
    let id2: string;
    act(() => {
      id1 = toast.show({ message: 'Queued 1', duration: 0, queue: true });
      id2 = toast.show({ message: 'Queued 2', duration: 0, queue: true });
      toast.show({ message: 'Queued 3', duration: 0, queue: true });
    });

    expect(screen.getByText('Queued 1')).toBeInTheDocument();

    // Close the second toast while it is still waiting in the queue (it is
    // not the currently-displayed toast).
    act(() => {
      toast.close(id2!);
    });

    // The current toast is untouched...
    expect(screen.getByText('Queued 1')).toBeInTheDocument();

    // ...and when it closes, the already-closed toast is skipped entirely.
    act(() => {
      toast.close(id1!);
    });
    expect(screen.queryByText('Queued 2')).not.toBeInTheDocument();
    expect(screen.getByText('Queued 3')).toBeInTheDocument();
  });

  it('closeAll clears queued toasts too', () => {
    render(<ToastContainer />);
    act(() => {
      toast.show({ message: 'Queued 1', duration: 0, queue: true });
      toast.show({ message: 'Queued 2', duration: 0, queue: true });
    });

    act(() => {
      toast.closeAll();
    });

    expect(screen.queryByText('Queued 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Queued 2')).not.toBeInTheDocument();
  });
});
