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

    it('also has snackbar class (wraps Snackbar)', () => {
      render(<Toast message="Test" duration={0} />);
      expect(screen.getByRole('alert')).toHaveClass('snackbar');
    });

    it('does not render a close button', () => {
      render(<Toast message="Test" duration={0} />);
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });

    it('applies rounded class', () => {
      render(<Toast message="Test" duration={0} rounded />);
      expect(screen.getByRole('alert')).toHaveClass('is-rounded');
    });
  });

  describe('Types', () => {
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
      render(<Toast message="Test" indefinite duration={2000} onClose={onClose} />);

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
      render(<Toast message="Test" duration={3000} pauseOnHover onClose={onClose} />);

      const toastEl = screen.getByRole('alert');
      fireEvent.mouseEnter(toastEl);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('resumes timer on mouse leave', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" duration={3000} pauseOnHover onClose={onClose} />);

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
      render(<Toast message="Test" duration={0} dismissible={false} onClose={onClose} />);

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
      render(<Toast message="Test" duration={0} dismissible={false} onClose={onClose} />);

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
      render(<Toast message="Test" duration={0} cancelable={false} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
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
    });
  });

  describe('toast.danger', () => {
    it('creates a danger toast', () => {
      render(<ToastContainer />);
      act(() => {
        toast.danger('Error message');
      });
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('toast.warning', () => {
    it('creates a warning toast', () => {
      render(<ToastContainer />);
      act(() => {
        toast.warning('Warning message');
      });
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });
  });

  describe('toast.info', () => {
    it('creates an info toast', () => {
      render(<ToastContainer />);
      act(() => {
        toast.info('Info message');
      });
      expect(screen.getByText('Info message')).toBeInTheDocument();
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
