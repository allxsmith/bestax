import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { Toast, ToastContainer, toast } from '../Toast';
import { Modal } from '../Modal';
import { ConfigProvider } from '../../helpers/Config';
import { focusCheckInterval } from '../../helpers/useDismissTimer';

vi.useFakeTimers();

describe('Toast', () => {
  afterEach(() => {
    vi.clearAllTimers();
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

    it('names the close button with ariaCloseLabel, for an app in another language', () => {
      render(
        <Toast
          message="Enregistré"
          duration={0}
          closable
          ariaCloseLabel="Fermer"
        />
      );
      expect(
        screen.getByRole('button', { name: 'Fermer' })
      ).toBeInTheDocument();
    });

    it("names a programmatic toast's close button", () => {
      render(<ToastContainer />);
      act(() => {
        toast.show({
          message: 'Enregistré',
          closable: true,
          ariaCloseLabel: 'Fermer',
          duration: 0,
        });
      });
      expect(
        screen.getByRole('button', { name: 'Fermer' })
      ).toBeInTheDocument();
    });

    it('keeps the close button named with an empty ariaCloseLabel', () => {
      render(<Toast message="Saved" duration={0} closable ariaCloseLabel="" />);
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('keeps ariaCloseLabel off the toast element', () => {
      render(
        <Toast message="Saved" duration={0} closable ariaCloseLabel="Fermer" />
      );
      expect(screen.getByRole('alert')).not.toHaveAttribute('ariaCloseLabel');
    });

    it('close button triggers onClose', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" duration={0} closable onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('close button click does not double-fire close', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" duration={0} closable onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // A Toast the caller keeps mounted stays hidden once it closes, and
  // nothing closes it a second time (#1902).
  describe('Closing once', () => {
    // Steps through the timers, letting React render between them.
    const waitInSteps = (ms: number) => {
      for (let waited = 0; waited < ms; waited += focusCheckInterval) {
        act(() => {
          vi.advanceTimersByTime(focusCheckInterval);
        });
      }
    };

    const closes: [string, () => void][] = [
      [
        'its close button',
        () => fireEvent.click(screen.getByLabelText('Close')),
      ],
      ['its cancel button', () => fireEvent.click(screen.getByText('Keep'))],
      ['its action button', () => fireEvent.click(screen.getByText('Undo'))],
      ['a click on it', () => fireEvent.click(screen.getByRole('alert'))],
      ['Escape', () => fireEvent.keyDown(document, { key: 'Escape' })],
      ['a click outside it', () => fireEvent.click(document.body)],
    ];

    it.each(closes)(
      'calls onClose once when closed by %s and its timer runs out after',
      (_how, close) => {
        const onClose = vi.fn();
        render(
          <Toast
            message="Deleted"
            actionText="Undo"
            cancelText="Keep"
            closable
            duration={2000}
            onClose={onClose}
          />
        );
        act(() => {
          // The listener for a click outside goes on a frame after mount.
          vi.advanceTimersByTime(16);
        });
        act(() => {
          close();
        });
        waitInSteps(5000);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    );

    it('calls onClose once after an action pressed with focus on it', () => {
      const onClose = vi.fn();
      render(
        <Toast
          message="Deleted"
          actionText="Undo"
          duration={2000}
          onClose={onClose}
        />
      );
      const undo = screen.getByRole('button', { name: 'Undo' });
      act(() => {
        undo.focus();
      });
      fireEvent.click(undo);
      waitInSteps(5000);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('stops its timer once it has closed', () => {
      render(<Toast message="Saved" closable duration={2000} />);
      act(() => {
        fireEvent.click(screen.getByLabelText('Close'));
      });
      act(() => {
        vi.advanceTimersByTime(0);
      });
      expect(vi.getTimerCount()).toBe(0);
    });

    it('calls onClose once for a click and Escape before the render that hides it', () => {
      const onClose = vi.fn();
      render(<Toast message="Saved" duration={2000} onClose={onClose} />);
      act(() => {
        fireEvent.click(screen.getByRole('alert'));
        fireEvent.keyDown(document, { key: 'Escape' });
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("doesn't run its action once it has closed, before the render that hides it", () => {
      const onAction = vi.fn();
      const onClose = vi.fn();
      render(
        <Toast
          message="Deleted"
          actionText="Undo"
          cancelText="Keep"
          duration={2000}
          onAction={onAction}
          onClose={onClose}
        />
      );
      act(() => {
        fireEvent.click(screen.getByText('Keep'));
        fireEvent.click(screen.getByText('Undo'));
      });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onAction).not.toHaveBeenCalled();
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
      const onAction = vi.fn();
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
      const onClose = vi.fn();
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
      const onClose = vi.fn();
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
      const onClose = vi.fn();
      const onAction = vi.fn();
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
      const onClose = vi.fn();
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
      const onClose = vi.fn();
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
      const onClose = vi.fn();
      render(<Toast message="Test" onClose={onClose} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not auto-close when duration is 0', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" duration={0} onClose={onClose} />);

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('stays open when indefinite is true', () => {
      const onClose = vi.fn();
      render(
        <Toast message="Test" indefinite duration={2000} onClose={onClose} />
      );

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Pause on Hover', () => {
    it('pauses timer on mouse enter', () => {
      const onClose = vi.fn();
      render(
        <Toast message="Test" duration={3000} pauseOnHover onClose={onClose} />
      );

      const toastEl = screen.getByRole('alert');
      fireEvent.mouseEnter(toastEl);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('resumes timer on mouse leave', () => {
      const onClose = vi.fn();
      render(
        <Toast message="Test" duration={3000} pauseOnHover onClose={onClose} />
      );

      const toastEl = screen.getByRole('alert');
      fireEvent.mouseEnter(toastEl);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      fireEvent.mouseLeave(toastEl);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not pause when pauseOnHover is false (default)', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" duration={3000} onClose={onClose} />);

      const toastEl = screen.getByRole('alert');
      fireEvent.mouseEnter(toastEl);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('mouseLeave is a no-op when pauseOnHover is false (covers if-false branch)', () => {
      render(<Toast message="Test" duration={3000} pauseOnHover={false} />);
      const toastEl = screen.getByRole('alert');
      expect(() => fireEvent.mouseLeave(toastEl)).not.toThrow();
    });
  });

  // Someone using a toast's action, cancel or close button keeps it while
  // focus is there, as a pointer over it does with pauseOnHover.
  describe('while focus is inside', () => {
    // Advances the clock a check at a time, letting React render between
    // steps, so a timer that changes state mid-wait runs as it would live.
    const waitInSteps = (ms: number) => {
      for (let waited = 0; waited < ms; waited += focusCheckInterval) {
        act(() => {
          vi.advanceTimersByTime(focusCheckInterval);
        });
      }
    };

    it('waits, whatever pauseOnHover says', () => {
      const onClose = vi.fn();
      render(
        <Toast
          message="Deleted"
          actionText="Undo"
          duration={2000}
          pauseOnHover={false}
          onClose={onClose}
        />
      );
      act(() => {
        screen.getByRole('button', { name: 'Undo' }).focus();
      });
      waitInSteps(10000);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('gets its whole duration again once focus leaves', () => {
      const onClose = vi.fn();
      render(
        <>
          <button>Save</button>
          <Toast message="Saved" closable duration={2000} onClose={onClose} />
        </>
      );
      act(() => {
        screen.getByRole('button', { name: 'Close' }).focus();
      });
      waitInSteps(10000);
      act(() => {
        screen.getByRole('button', { name: 'Save' }).focus();
      });
      // The next check finds focus gone and starts the countdown over.
      act(() => {
        vi.advanceTimersByTime(focusCheckInterval);
      });
      act(() => {
        vi.advanceTimersByTime(1999);
      });
      expect(onClose).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("still calls the caller's own onFocus", () => {
      const onFocus = vi.fn();
      const onClose = vi.fn();
      render(
        <Toast
          message="Deleted"
          actionText="Undo"
          duration={2000}
          onFocus={onFocus}
          onClose={onClose}
        />
      );
      act(() => {
        screen.getByRole('button', { name: 'Undo' }).focus();
      });
      expect(onFocus).toHaveBeenCalledTimes(1);
      waitInSteps(10000);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('holds a toast shown through toast.show', () => {
      render(<ToastContainer />);
      act(() => {
        toast.show({ message: 'Deleted', actionText: 'Undo' });
      });
      act(() => {
        screen.getByRole('button', { name: 'Undo' }).focus();
      });
      waitInSteps(10000);
      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    });
  });

  describe('Click to Dismiss', () => {
    it('closes when clicked (dismissible=true by default)', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" duration={0} onClose={onClose} />);

      fireEvent.click(screen.getByRole('alert'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicked if dismissible is false', () => {
      const onClose = vi.fn();
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
      const onClose = vi.fn();
      render(<Toast message="Test" duration={0} onClose={onClose} />);

      // Flush the deferred requestAnimationFrame that attaches the listener
      act(() => {
        vi.runAllTimers();
      });

      fireEvent.click(document.body);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking outside if dismissible is false', () => {
      const onClose = vi.fn();
      render(
        <Toast
          message="Test"
          duration={0}
          dismissible={false}
          onClose={onClose}
        />
      );

      act(() => {
        vi.runAllTimers();
      });

      fireEvent.click(document.body);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Escape Key', () => {
    it('closes on Escape when cancelable (default)', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" duration={0} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('stays up on an Escape that something on the page already used', () => {
      const onClose = vi.fn();
      render(
        <>
          <Toast message="Test" duration={0} onClose={onClose} />
          <input
            aria-label="Search"
            onKeyDown={e => {
              if (e.key === 'Escape') e.preventDefault();
            }}
          />
        </>
      );
      fireEvent.keyDown(screen.getByLabelText('Search'), { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('hears Escape after a document listener added once it showed', () => {
      // A popup opened while the toast is up adds its listener after this
      // one, and still gets the key first.
      const onClose = vi.fn();
      render(<Toast message="Test" duration={0} onClose={onClose} />);
      const claim = (e: KeyboardEvent) => e.preventDefault();
      document.addEventListener('keydown', claim);
      try {
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onClose).not.toHaveBeenCalled();
      } finally {
        document.removeEventListener('keydown', claim);
      }
    });

    it('stops listening for Escape once it has closed', () => {
      const onClose = vi.fn();
      render(<Toast message="Test" duration={0} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on Escape when cancelable is false', () => {
      const onClose = vi.fn();
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
      const onClose = vi.fn();
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
      const onClose = vi.fn();
      render(<Toast message="Hello" duration={0} onClose={onClose} />);

      act(() => {
        vi.runAllTimers();
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

    it('falls back to document.body for an empty string container', () => {
      // document.querySelector('') throws, so '' must be treated as "no
      // container" rather than passed through to the selector.
      expect(() =>
        render(<Toast message="Empty selector" duration={0} container="" />)
      ).not.toThrow();

      const toastEl = screen.getByRole('alert');
      expect(toastEl.closest('.toast-container')?.parentElement).toBe(
        document.body
      );
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
      const fnRef = vi.fn();
      render(<Toast message="Fn ref test" duration={0} ref={fnRef} />);

      expect(fnRef).toHaveBeenCalled();
      const lastArg = fnRef.mock.calls[fnRef.mock.calls.length - 1][0];
      expect(lastArg).toBe(screen.getByRole('alert'));
    });
  });
});

describe('Toast Programmatic API', () => {
  afterEach(() => {
    vi.clearAllTimers();
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
      const listener = vi.fn();
      const unsubscribe = toast.subscribe(listener);

      act(() => {
        toast.show({ message: 'Test' });
      });

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('returns unsubscribe function', () => {
      const listener = vi.fn();
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

  // The container hands each toast an inline `onClose`, and it renders
  // whenever another toast shows, so a toast mustn't start over because its
  // `onClose` changed (#1113).
  it("keeps a toast's own clock when another one shows", () => {
    render(<ToastContainer />);
    act(() => {
      toast.show({ message: 'First', duration: 2000 });
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    act(() => {
      toast.show({ message: 'Second', duration: 10000 });
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText('First')).toBeNull();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('dismisses a toast on a click outside right after another one shows', () => {
    render(<ToastContainer />);
    act(() => {
      toast.show({ message: 'First', duration: 0 });
    });
    // Its outside-click listener goes on a frame after it shows.
    act(() => {
      vi.advanceTimersByTime(20);
    });
    act(() => {
      toast.show({ message: 'Second', duration: 0 });
    });

    fireEvent.click(document.body);
    expect(screen.queryByText('First')).toBeNull();
    // The second one's listener isn't on yet, so that click didn't count.
    expect(screen.getByText('Second')).toBeInTheDocument();
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

describe('ToastContainer mounted after toasts are raised', () => {
  afterEach(() => {
    vi.clearAllTimers();
    // The container is still mounted here, so closing re-renders it.
    act(() => {
      toast.closeAll();
    });
  });

  const shownMessages = () =>
    Array.from(document.body.querySelectorAll('.toast-message')).map(
      el => el.textContent
    );

  it('shows them when it mounts, in the order they were raised', () => {
    toast.show({ message: 'First', duration: 0 });
    toast.show({ message: 'Second', duration: 0 });

    render(<ToastContainer />);

    expect(shownMessages()).toEqual(['First', 'Second']);
  });

  it('adds later toasts after them without showing any twice', () => {
    toast.show({ message: 'Early', duration: 0 });
    render(<ToastContainer />);
    expect(shownMessages()).toEqual(['Early']);

    act(() => {
      toast.show({ message: 'Later', duration: 0 });
    });

    expect(shownMessages()).toEqual(['Early', 'Later']);
  });

  it('shows each once under StrictMode', () => {
    toast.show({ message: 'Strict', duration: 0 });
    render(
      <React.StrictMode>
        <ToastContainer />
      </React.StrictMode>
    );
    expect(shownMessages()).toEqual(['Strict']);

    act(() => {
      toast.show({ message: 'Strict later', duration: 0 });
    });

    expect(shownMessages()).toEqual(['Strict', 'Strict later']);
  });

  it('times each from when it appears, and drops it from the store after', () => {
    toast.show({ message: 'Timed', duration: 2000 });
    // Time spent waiting for a container does not count against the toast.
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    render(<ToastContainer />);
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(screen.getByText('Timed')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Timed')).not.toBeInTheDocument();

    // It left the store as well, so the next toast does not bring it back.
    act(() => {
      toast.show({ message: 'Next', duration: 0 });
    });
    expect(shownMessages()).toEqual(['Next']);
  });

  it('closes one by the id show returned', () => {
    const id = toast.show({ message: 'Close me', duration: 0 });
    toast.show({ message: 'Keep me', duration: 0 });
    render(<ToastContainer />);
    expect(shownMessages()).toEqual(['Close me', 'Keep me']);

    act(() => {
      toast.close(id);
    });

    expect(shownMessages()).toEqual(['Keep me']);
  });

  it('shows the queued toast on screen, then the next once it closes', () => {
    const id = toast.show({ message: 'Queued 1', duration: 0, queue: true });
    toast.show({ message: 'Queued 2', duration: 0, queue: true });
    render(<ToastContainer />);
    expect(shownMessages()).toEqual(['Queued 1']);

    act(() => {
      toast.close(id);
    });
    expect(shownMessages()).toEqual(['Queued 2']);
  });

  it('renders nothing on the server, then shows them once hydrated', async () => {
    toast.show({ message: 'Before hydration', duration: 0 });
    const app = (
      <main>
        <ToastContainer />
      </main>
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(app);
    document.body.appendChild(container);

    // The server's markup has no toasts in it, whatever has been raised, so
    // the hydrating render has to produce none either.
    expect(container.innerHTML).toBe('<main></main>');

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, app);
        unmountRoot = () => root.unmount();
      });

      expect(errorSpy).not.toHaveBeenCalled();
      expect(shownMessages()).toEqual(['Before hydration']);
    } finally {
      // A root left mounted would add its toasts to every later test's.
      await act(async () => unmountRoot());
      errorSpy.mockRestore();
      document.body.removeChild(container);
    }
  });

  it('renders once when it hydrates with nothing to show', async () => {
    // Empty the way a closed toast leaves it, not only the way it starts.
    const id = toast.show({ message: 'Gone', duration: 0 });
    toast.close(id);

    const onRender = vi.fn();
    const app = (
      <main>
        <React.Profiler id="toasts" onRender={onRender}>
          <ToastContainer />
        </React.Profiler>
      </main>
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(app);
    document.body.appendChild(container);

    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, app);
        unmountRoot = () => root.unmount();
      });

      // A client snapshot that is a different array from the server's, even
      // an empty one, would add an 'update' render after the mount.
      expect(onRender.mock.calls.map(([, phase]) => phase)).toEqual(['mount']);
    } finally {
      await act(async () => unmountRoot());
      document.body.removeChild(container);
    }
  });
});

describe('ToastContainer with toasts shown at their own position', () => {
  afterEach(() => {
    vi.clearAllTimers();
    act(() => {
      toast.closeAll();
    });
  });

  // Where each toast is on screen: the stack it sits in, whose position class
  // is what places it. Sorted by message, since toasts land in the body in
  // stack order rather than the order they were shown in.
  const placements = () =>
    Array.from(document.body.querySelectorAll('.toast'))
      .map(el => [
        String(el.querySelector('.toast-message')?.textContent),
        String(el.closest('.toast-container')?.className),
      ])
      .sort(([a], [b]) => a.localeCompare(b));

  // The stacks ToastContainer renders into the body, one per position in use.
  const stacks = () =>
    Array.from(document.body.children)
      .filter(el => el.classList.contains('toast-container'))
      .map(el => el.className);

  it('puts a toast shown with a position at that position', () => {
    render(<ToastContainer position="top-right" />);
    act(() => {
      toast.show({ message: 'Placed', position: 'bottom-center', duration: 0 });
    });

    expect(placements()).toEqual([
      ['Placed', 'toast-container is-bottom-center'],
    ]);
    expect(stacks()).toEqual(['toast-container is-bottom-center']);
  });

  it("puts a toast shown without one at the container's position", () => {
    render(<ToastContainer position="bottom-left" />);
    act(() => {
      toast.show({ message: 'Placed', position: 'top-center', duration: 0 });
      toast.info('Unplaced', { duration: 0 });
    });

    expect(placements()).toEqual([
      ['Placed', 'toast-container is-top-center'],
      ['Unplaced', 'toast-container is-bottom-left'],
    ]);
  });

  it('renders a stack for each position in use, in screen order', () => {
    render(<ToastContainer position="top-right" />);
    act(() => {
      toast.show({ message: 'BR', position: 'bottom-right', duration: 0 });
      toast.show({ message: 'Default', duration: 0 });
      toast.show({ message: 'TL', position: 'top-left', duration: 0 });
      toast.show({ message: 'BR 2', position: 'bottom-right', duration: 0 });
    });

    // Across the top, then across the bottom, whatever order they were used
    // in, and no stack for a position nothing is shown at.
    expect(stacks()).toEqual([
      'toast-container is-top-left',
      'toast-container is-top-right',
      'toast-container is-bottom-right',
    ]);
    expect(placements()).toEqual([
      ['BR', 'toast-container is-bottom-right'],
      ['BR 2', 'toast-container is-bottom-right'],
      ['Default', 'toast-container is-top-right'],
      ['TL', 'toast-container is-top-left'],
    ]);
  });

  it('keeps the toasts of a stack together, in the order they were shown', () => {
    render(<ToastContainer position="top-right" />);
    act(() => {
      toast.show({ message: 'A', duration: 0 });
      toast.show({ message: 'B', position: 'top-left', duration: 0 });
      toast.show({ message: 'C', duration: 0 });
      toast.show({ message: 'D', position: 'top-left', duration: 0 });
    });

    const stackContents = Array.from(
      document.body.querySelectorAll(':scope > .toast-container')
    ).map(stack => [
      stack.className,
      Array.from(stack.querySelectorAll('.toast-message')).map(
        el => el.textContent
      ),
    ]);
    expect(stackContents).toEqual([
      ['toast-container is-top-left', ['B', 'D']],
      ['toast-container is-top-right', ['A', 'C']],
    ]);
  });

  it("gives a toast at the container's own position the container's stack", () => {
    // Shown with that position or without one, both go in the one stack.
    const { container } = render(<ToastContainer position="bottom-left" />);
    act(() => {
      toast.show({ message: 'One', duration: 0 });
      toast.show({ message: 'Two', position: 'bottom-left', duration: 0 });
    });

    expect(
      Array.from(document.body.children)
        .filter(el => el !== container)
        .map(el => el.outerHTML)
    ).toEqual([
      '<div class="toast-container is-bottom-left" role="region" aria-label="Notifications (F8)"><div class="toast" role="alert" aria-live="polite"><span class="toast-message">One</span></div><div class="toast" role="alert" aria-live="polite"><span class="toast-message">Two</span></div></div>',
    ]);
  });

  it('removes a stack once its last toast is dismissed, leaving the others', () => {
    render(<ToastContainer position="top-right" />);
    act(() => {
      toast.show({ message: 'Stay', duration: 0 });
      toast.show({ message: 'Go', position: 'bottom-left', duration: 0 });
    });
    expect(stacks()).toHaveLength(2);

    act(() => {
      fireEvent.click(screen.getByText('Go'));
    });

    expect(placements()).toEqual([['Stay', 'toast-container is-top-right']]);
    expect(stacks()).toEqual(['toast-container is-top-right']);
  });

  it('times a toast out at its own position', () => {
    render(<ToastContainer position="top-right" />);
    act(() => {
      toast.show({ message: 'Stay', duration: 0 });
      toast.show({ message: 'Timed', position: 'bottom-left', duration: 1000 });
    });

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(placements()).toEqual([
      ['Stay', 'toast-container is-top-right'],
      ['Timed', 'toast-container is-bottom-left'],
    ]);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(placements()).toEqual([['Stay', 'toast-container is-top-right']]);
    expect(stacks()).toEqual(['toast-container is-top-right']);
  });

  it('keeps one queue across positions, each toast shown at its own', () => {
    render(<ToastContainer position="top-right" />);
    let first = '';
    act(() => {
      first = toast.show({
        message: 'Q1',
        position: 'bottom-right',
        queue: true,
        duration: 0,
      });
      toast.show({ message: 'Q2', queue: true, duration: 0 });
    });

    // The second waits for the first, although it would go somewhere else.
    expect(placements()).toEqual([['Q1', 'toast-container is-bottom-right']]);

    act(() => {
      toast.close(first);
    });
    expect(placements()).toEqual([['Q2', 'toast-container is-top-right']]);
    expect(stacks()).toEqual(['toast-container is-top-right']);
  });

  it("moves the toasts at the container's position when it changes, without remounting them", () => {
    const { rerender } = render(<ToastContainer position="top-right" />);
    act(() => {
      toast.show({ message: 'Follows', duration: 0 });
      toast.show({ message: 'Stays', position: 'bottom-left', duration: 0 });
    });
    const follows = screen.getByText('Follows').closest('.toast');

    rerender(<ToastContainer position="top-left" />);

    expect(placements()).toEqual([
      ['Follows', 'toast-container is-top-left'],
      ['Stays', 'toast-container is-bottom-left'],
    ]);
    expect(screen.getByText('Follows').closest('.toast')).toBe(follows);
  });

  it('places toasts shown before it mounts', () => {
    toast.show({ message: 'Early', position: 'bottom-center', duration: 0 });
    toast.show({ message: 'Early default', duration: 0 });

    render(<ToastContainer position="top-left" />);

    expect(placements()).toEqual([
      ['Early', 'toast-container is-bottom-center'],
      ['Early default', 'toast-container is-top-left'],
    ]);
    expect(stacks()).toEqual([
      'toast-container is-top-left',
      'toast-container is-bottom-center',
    ]);
  });

  it('shows each once under StrictMode', () => {
    toast.show({ message: 'Early', position: 'bottom-left', duration: 0 });
    render(
      <React.StrictMode>
        <ToastContainer />
      </React.StrictMode>
    );
    act(() => {
      toast.show({ message: 'Later', duration: 0 });
    });

    expect(placements()).toEqual([
      ['Early', 'toast-container is-bottom-left'],
      ['Later', 'toast-container is-top-right'],
    ]);
    expect(stacks()).toEqual([
      'toast-container is-top-right',
      'toast-container is-bottom-left',
    ]);
  });

  it('renders nothing on the server, then places them once hydrated', async () => {
    toast.show({ message: 'Placed', position: 'bottom-right', duration: 0 });
    toast.show({ message: 'Default', duration: 0 });
    const app = (
      <main>
        <ToastContainer />
      </main>
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(app);
    document.body.appendChild(container);
    expect(container.innerHTML).toBe('<main></main>');

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, app);
        unmountRoot = () => root.unmount();
      });

      expect(errorSpy).not.toHaveBeenCalled();
      expect(placements()).toEqual([
        ['Default', 'toast-container is-top-right'],
        ['Placed', 'toast-container is-bottom-right'],
      ]);
    } finally {
      await act(async () => unmountRoot());
      errorSpy.mockRestore();
      document.body.removeChild(container);
    }
  });
});

describe('ToastContainer stacks', () => {
  afterEach(() => {
    vi.clearAllTimers();
    act(() => {
      toast.closeAll();
    });
  });

  // Each stack in the body, as its class and the messages of the toasts
  // that are its own children.
  const stackContents = () =>
    Array.from(document.body.children)
      .filter(el => /(^|\s|-)toast-container(\s|$)/.test(el.className))
      .map(stack => [
        stack.className,
        Array.from(stack.children).map(
          el => el.querySelector('[class$="toast-message"]')?.textContent
        ),
      ]);

  it('puts the toasts shown at one position in one stack, one after another', () => {
    render(<ToastContainer position="top-right" />);
    act(() => {
      toast.show({ message: 'First toast', indefinite: true });
      toast.show({ message: 'Second toast', indefinite: true });
      toast.show({
        message: 'Third toast',
        indefinite: true,
        position: 'bottom-left',
      });
    });

    expect(stackContents()).toEqual([
      ['toast-container is-top-right', ['First toast', 'Second toast']],
      ['toast-container is-bottom-left', ['Third toast']],
    ]);
    expect(document.querySelectorAll('.toast-container')).toHaveLength(2);
  });

  it('builds its stacks with the class prefix', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <ToastContainer position="bottom-center" />
      </ConfigProvider>
    );
    act(() => {
      toast.show({ message: 'One', duration: 0 });
      toast.show({ message: 'Two', duration: 0 });
    });

    expect(stackContents()).toEqual([
      ['bestax-toast-container bestax-is-bottom-center', ['One', 'Two']],
    ]);
    expect(document.querySelector('.toast-container')).toBeNull();
    expect(screen.getByText('One').closest('[role="alert"]')).toHaveClass(
      'bestax-toast'
    );
  });

  it('portals a toast with a container of its own there, outside the stacks', () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    try {
      render(<ToastContainer position="top-right" />);
      act(() => {
        toast.show({ message: 'Own', container: target, duration: 0 });
      });
      // In a box of its own in the target, as before, and no empty stack.
      expect(target.innerHTML).toBe(
        '<div class="toast-container is-top-right"><div class="toast" role="alert" aria-live="polite"><span class="toast-message">Own</span></div></div>'
      );
      expect(stackContents()).toEqual([]);

      act(() => {
        toast.show({ message: 'Stacked', duration: 0 });
        toast.show({
          message: 'Own placed',
          container: target,
          position: 'bottom-center',
          duration: 0,
        });
      });
      expect(stackContents()).toEqual([
        ['toast-container is-top-right', ['Stacked']],
      ]);
      expect(target.contains(screen.getByText('Own'))).toBe(true);
      expect(
        screen.getByText('Own placed').closest('.toast-container')
      ).toHaveClass('is-bottom-center');
      expect(
        target.contains(screen.getByText('Own placed').closest('.toast'))
      ).toBe(true);
    } finally {
      act(() => {
        toast.closeAll();
      });
      document.body.removeChild(target);
    }
  });

  it('keeps an inline toast with a container in its stack, as inline wins', () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    try {
      render(<ToastContainer position="top-left" />);
      act(() => {
        toast.show({
          message: 'Inline',
          container: target,
          inline: true,
          duration: 0,
        });
        toast.show({ message: 'Plain', duration: 0 });
      });
      expect(target).toBeEmptyDOMElement();
      expect(stackContents()).toEqual([
        ['toast-container is-top-left', ['Inline', 'Plain']],
      ]);
    } finally {
      act(() => {
        toast.closeAll();
      });
      document.body.removeChild(target);
    }
  });

  it('stacks a toast with an empty container, which means none', () => {
    render(<ToastContainer position="top-right" />);
    act(() => {
      toast.show({ message: 'Empty', container: '', duration: 0 });
      toast.show({ message: 'Plain', duration: 0 });
    });

    expect(stackContents()).toEqual([
      ['toast-container is-top-right', ['Empty', 'Plain']],
    ]);
  });

  it('stacks a queued toast with the others at its position', () => {
    render(<ToastContainer position="top-right" />);
    act(() => {
      toast.show({ message: 'Queued', queue: true, duration: 0 });
      toast.show({ message: 'Stacked', duration: 0 });
    });

    // The queued one on screen comes after the stacked ones.
    expect(stackContents()).toEqual([
      ['toast-container is-top-right', ['Stacked', 'Queued']],
    ]);
  });

  it('dismisses and times out one toast of a stack, leaving the rest in it', () => {
    render(<ToastContainer position="top-right" />);
    act(() => {
      toast.show({ message: 'Click me', duration: 0 });
      // A click outside a dismissible toast closes it too, so these two
      // aren't, to stay up through the click on the first.
      toast.show({ message: 'Timed', duration: 1000, dismissible: false });
      toast.show({ message: 'Stay', duration: 0, dismissible: false });
    });
    // The outside-click listeners go on a frame after the toasts show.
    act(() => {
      vi.advanceTimersByTime(20);
    });

    act(() => {
      fireEvent.click(screen.getByText('Click me'));
    });
    expect(stackContents()).toEqual([
      ['toast-container is-top-right', ['Timed', 'Stay']],
    ]);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(stackContents()).toEqual([
      ['toast-container is-top-right', ['Stay']],
    ]);
  });

  it('keeps a toast mounted as others join and leave its stack', () => {
    render(<ToastContainer position="top-right" />);
    act(() => {
      toast.show({ message: 'Kept', duration: 0 });
    });
    const kept = screen.getByText('Kept').closest('.toast');
    let other = '';
    act(() => {
      other = toast.show({ message: 'Other', duration: 0 });
    });
    act(() => {
      toast.close(other);
    });
    expect(screen.getByText('Kept').closest('.toast')).toBe(kept);
  });
});

describe('Toast Queue', () => {
  afterEach(() => {
    vi.clearAllTimers();
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

  it('does not run the cleanup on re-render, only on real detach', () => {
    // setRef must stay referentially stable: an unstable ref identity makes
    // React detach and re-attach on every render, which would fire the
    // consumer's cleanup each time.
    const cleanup = vi.fn();
    const callbackRef = (node: HTMLDivElement | null) => {
      if (!node) return undefined;
      return () => {
        cleanup();
      };
    };

    const { rerender, unmount } = render(
      <Toast message="Stable" duration={0} ref={callbackRef} />
    );
    rerender(<Toast message="Stable again" duration={0} ref={callbackRef} />);
    rerender(<Toast message="And again" duration={0} ref={callbackRef} />);
    expect(cleanup).not.toHaveBeenCalled();

    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  // The cleanup contract is honored identically on React 18 and 19 (the CI
  // matrix), and identically across every component that merges a forwarded
  // ref, so neither this nor its siblings branch on React.version.
  it('runs a forwarded callback ref cleanup on unmount instead of calling it with null', () => {
    const calls: (HTMLDivElement | null)[] = [];
    const cleanup = vi.fn();
    const callbackRef = (node: HTMLDivElement | null) => {
      calls.push(node);
      if (!node) return undefined;
      return () => {
        cleanup();
      };
    };

    const { unmount } = render(
      <Toast message="Cleanup" duration={0} ref={callbackRef} />
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]).not.toBeNull();
    expect(cleanup).not.toHaveBeenCalled();

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(1);
  });
});

describe('Toast hydration', () => {
  it('hydrates a toast in place, then moves it into its portal', async () => {
    const app = (
      <main>
        <Toast message="Saved" duration={0} />
      </main>
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(app);
    document.body.appendChild(container);

    // The server renders it in place, so the hydrating render has markup to
    // match.
    expect(container.querySelector('.toast-container')).not.toBeNull();

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onRecoverableError = vi.fn();
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, app, { onRecoverableError });
        unmountRoot = () => root.unmount();
      });

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
      // Then it moved into document.body.
      expect(container.querySelector('.toast-container')).toBeNull();
      const shown = document.body.querySelector('.toast-container');
      expect(shown?.parentElement).toBe(document.body);
      expect(screen.getByRole('alert')).toHaveTextContent('Saved');
    } finally {
      await act(async () => unmountRoot());
      errorSpy.mockRestore();
      container.remove();
    }
  });
});

// A keyboard or screen reader user reaches a toast's action with a hotkey,
// before the toast closes on its own (#1915).
describe('ToastContainer hotkey', () => {
  afterEach(() => {
    vi.clearAllTimers();
    act(() => {
      toast.closeAll();
    });
  });

  const press = (init: KeyboardEventInit) => {
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      ...init,
    });
    act(() => {
      document.body.dispatchEvent(event);
    });
    return event;
  };

  it("moves focus to the newest toast's first button on F8", () => {
    render(<ToastContainer />);
    act(() => {
      toast.show({ message: 'Saved', actionText: 'View' });
      toast.show({
        message: 'Deleted',
        cancelText: 'Keep',
        actionText: 'Undo',
      });
    });
    const event = press({ key: 'F8', code: 'F8' });
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Keep' })
    );
  });

  it('keeps the toast open while focus is in it', () => {
    const onUndo = vi.fn();
    render(<ToastContainer />);
    act(() => {
      toast.show({
        message: 'Deleted',
        actionText: 'Undo',
        onAction: onUndo,
        duration: 2000,
      });
    });
    press({ key: 'F8', code: 'F8' });
    for (let waited = 0; waited < 10000; waited += focusCheckInterval) {
      act(() => {
        vi.advanceTimersByTime(focusCheckInterval);
      });
    }
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus();
  });

  it('focuses a toast with no button itself, until focus leaves it', () => {
    render(
      <>
        <button>Save</button>
        <ToastContainer />
      </>
    );
    act(() => {
      toast.show({ message: 'Saved', indefinite: true });
    });
    press({ key: 'F8', code: 'F8' });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveFocus();
    expect(alert).toHaveAttribute('tabindex', '-1');
    // Pressed again, it keeps the tabindex it gave and the one way it goes.
    press({ key: 'F8', code: 'F8' });
    expect(alert).toHaveFocus();
    act(() => {
      screen.getByRole('button', { name: 'Save' }).focus();
    });
    expect(alert).not.toHaveAttribute('tabindex');
  });

  it('leaves the key alone with no toast showing', () => {
    render(<ToastContainer />);
    const event = press({ key: 'F8', code: 'F8' });
    expect(event.defaultPrevented).toBe(false);
  });

  it('takes a hotkey of its own, with a modifier', () => {
    render(<ToastContainer hotkey={['altKey', 'KeyT']} />);
    act(() => {
      toast.show({ message: 'Deleted', actionText: 'Undo' });
    });
    expect(
      screen.getByRole('region', { name: 'Notifications (Alt+T)' })
    ).toBeInTheDocument();
    press({ key: 'F8', code: 'F8' });
    expect(document.activeElement).toBe(document.body);
    press({ key: 't', code: 'KeyT' });
    expect(document.activeElement).toBe(document.body);
    press({ key: 't', code: 'KeyT', altKey: true });
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus();
  });

  it('turns the hotkey off with an empty list', () => {
    render(<ToastContainer hotkey={[]} />);
    act(() => {
      toast.show({ message: 'Deleted', actionText: 'Undo' });
    });
    expect(
      screen.getByRole('region', { name: 'Notifications' })
    ).toBeInTheDocument();
    const event = press({ key: 'F8', code: 'F8' });
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(document.body);
  });

  it('names each stack a region with its hotkey', () => {
    render(<ToastContainer />);
    act(() => {
      toast.show({ message: 'One' });
      toast.show({ message: 'Two', position: 'bottom-left' });
    });
    expect(
      screen.getAllByRole('region', { name: 'Notifications (F8)' })
    ).toHaveLength(2);
  });

  it('leaves the key alone with another modifier held', () => {
    render(<ToastContainer />);
    act(() => {
      toast.show({ message: 'Deleted', actionText: 'Undo' });
    });
    const event = press({ key: 'F8', code: 'F8', ctrlKey: true });
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(document.body);
  });

  it('takes F8 while someone types in a field, and leaves a typed letter alone', () => {
    render(
      <>
        <input aria-label="Name" />
        <ToastContainer hotkey={['KeyN']} />
      </>
    );
    act(() => {
      toast.show({ message: 'Deleted', actionText: 'Undo' });
    });
    const field = screen.getByRole('textbox', { name: 'Name' });
    act(() => {
      field.focus();
    });
    act(() => {
      field.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'n', code: 'KeyN', bubbles: true })
      );
    });
    expect(field).toHaveFocus();
  });

  it('moves focus from a field with F8', () => {
    render(
      <>
        <input aria-label="Name" />
        <ToastContainer />
      </>
    );
    act(() => {
      toast.show({ message: 'Deleted', actionText: 'Undo' });
    });
    const field = screen.getByRole('textbox', { name: 'Name' });
    act(() => {
      field.focus();
    });
    act(() => {
      field.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'F8', code: 'F8', bubbles: true })
      );
    });
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus();
  });

  it('leaves the key alone while a modal overlay is open', () => {
    render(
      <>
        <Modal active onClose={() => {}}>
          <button>Inside</button>
        </Modal>
        <ToastContainer />
      </>
    );
    act(() => {
      toast.show({ message: 'Deleted', actionText: 'Undo' });
    });
    const event = press({ key: 'F8', code: 'F8' });
    expect(event.defaultPrevented).toBe(false);
    expect(screen.getByRole('button', { name: 'Undo' })).not.toHaveFocus();
  });

  it('goes to the toast shown last, past a queued one', () => {
    render(<ToastContainer />);
    act(() => {
      toast.show({ message: 'Waited', actionText: 'Open', queue: true });
      toast.show({ message: 'Deleted', actionText: 'Undo' });
    });
    press({ key: 'F8', code: 'F8' });
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus();
  });

  it("keeps a toast's own id, and still finds it", () => {
    render(<ToastContainer />);
    act(() => {
      toast.show({ id: 'save-toast', message: 'Saved', actionText: 'View' });
    });
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'save-toast');
    press({ key: 'F8', code: 'F8' });
    expect(screen.getByRole('button', { name: 'View' })).toHaveFocus();
  });

  it("leaves the key alone when focus can't go to the toast", () => {
    render(<ToastContainer />);
    act(() => {
      toast.show({ message: 'Deleted', actionText: 'Undo' });
    });
    screen.getByRole('button', { name: 'Undo' }).setAttribute('disabled', '');
    const event = press({ key: 'F8', code: 'F8' });
    expect(event.defaultPrevented).toBe(false);
  });

  it('turns the hotkey off when its entries name no single key', () => {
    render(<ToastContainer hotkey={['altKey']} />);
    act(() => {
      toast.show({ message: 'Deleted', actionText: 'Undo' });
    });
    const event = press({ key: 'Alt', code: 'AltLeft', altKey: true });
    expect(event.defaultPrevented).toBe(false);
  });

  it('names its region in the language it is given', () => {
    render(<ToastContainer ariaLabel="Avis" />);
    act(() => {
      toast.show({ message: 'Enregistré' });
    });
    expect(
      screen.getByRole('region', { name: 'Avis (F8)' })
    ).toBeInTheDocument();
  });

  it('names a digit key without its prefix', () => {
    render(<ToastContainer hotkey={['ctrlKey', 'shiftKey', 'Digit1']} />);
    act(() => {
      toast.show({ message: 'One' });
    });
    expect(
      screen.getByRole('region', { name: 'Notifications (Ctrl+Shift+1)' })
    ).toBeInTheDocument();
  });
});

// Closing a toast that holds focus passes focus on, rather than dropping it
// to the page (#1939).
describe('Focus when a toast closes', () => {
  afterEach(() => {
    vi.clearAllTimers();
    act(() => {
      toast.closeAll();
    });
  });

  const focus = (el: HTMLElement) => {
    act(() => {
      el.focus();
    });
  };
  const click = (el: HTMLElement) => {
    act(() => {
      fireEvent.click(el);
    });
  };
  const button = (name: string) => screen.getByRole('button', { name });

  it('hands focus back to where it came from when the toast it was in closes', () => {
    render(
      <>
        <button>Save</button>
        <ToastContainer />
      </>
    );
    act(() => {
      toast.show({ message: 'Deleted', actionText: 'Undo', indefinite: true });
    });
    focus(button('Save'));
    focus(button('Undo'));
    click(button('Undo'));
    expect(screen.queryByText('Deleted')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(button('Save'));
  });

  it("moves focus to the next toast's first button in its stack", () => {
    render(<ToastContainer />);
    act(() => {
      toast.show({ message: 'One', closable: true, indefinite: true });
      toast.show({
        message: 'Two',
        cancelText: 'Keep',
        actionText: 'Undo',
        indefinite: true,
      });
    });
    focus(button('Close'));
    click(button('Close'));
    expect(screen.queryByText('One')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(button('Keep'));
  });

  it('moves focus to the one before when the last in the stack closes', () => {
    render(<ToastContainer />);
    act(() => {
      toast.show({ message: 'One', actionText: 'View', indefinite: true });
      toast.show({ message: 'Two', actionText: 'Undo', indefinite: true });
    });
    focus(button('Undo'));
    click(button('Undo'));
    expect(document.activeElement).toBe(button('View'));
  });

  it('passes over a toast with no button, and one in another stack', () => {
    render(
      <>
        <button>Save</button>
        <ToastContainer />
      </>
    );
    act(() => {
      toast.show({ message: 'One', actionText: 'Undo', indefinite: true });
      toast.show({ message: 'Two', indefinite: true });
      toast.show({
        message: 'Three',
        actionText: 'View',
        position: 'bottom-left',
        indefinite: true,
      });
    });
    focus(button('Save'));
    focus(button('Undo'));
    click(button('Undo'));
    expect(document.activeElement).toBe(button('Save'));
  });

  it('moves focus when the app closes the toast that holds it', () => {
    render(
      <>
        <button>Save</button>
        <ToastContainer />
      </>
    );
    let id = '';
    act(() => {
      id = toast.show({
        message: 'Deleted',
        actionText: 'Undo',
        indefinite: true,
      });
    });
    focus(button('Save'));
    focus(button('Undo'));
    act(() => {
      toast.close(id);
    });
    expect(document.activeElement).toBe(button('Save'));
  });

  it('moves focus when Escape closes the toast that holds it', () => {
    render(
      <>
        <button>Save</button>
        <ToastContainer />
      </>
    );
    act(() => {
      toast.show({ message: 'Deleted', actionText: 'Undo', indefinite: true });
    });
    focus(button('Save'));
    focus(button('Undo'));
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(screen.queryByText('Deleted')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(button('Save'));
  });

  it('hands focus back after the hotkey brought it in', () => {
    render(
      <>
        <button>Save</button>
        <ToastContainer />
      </>
    );
    act(() => {
      toast.show({ message: 'Deleted', actionText: 'Undo', indefinite: true });
    });
    focus(button('Save'));
    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'F8',
          code: 'F8',
          bubbles: true,
          cancelable: true,
        })
      );
    });
    expect(document.activeElement).toBe(button('Undo'));
    click(button('Undo'));
    expect(document.activeElement).toBe(button('Save'));
  });

  it('leaves focus that is somewhere else where it is', () => {
    render(
      <>
        <button>Save</button>
        <button>Cancel</button>
        <ToastContainer />
      </>
    );
    let id = '';
    act(() => {
      id = toast.show({ message: 'One', actionText: 'Undo', indefinite: true });
      toast.show({ message: 'Two', actionText: 'View', indefinite: true });
    });
    focus(button('Save'));
    focus(button('Undo'));
    focus(button('Cancel'));
    act(() => {
      toast.close(id);
    });
    expect(document.activeElement).toBe(button('Cancel'));
  });

  it('drops focus to the page when where it came from has left the page', () => {
    const App = ({ saving }: { saving: boolean }) => (
      <>
        {saving && <button>Save</button>}
        <ToastContainer />
      </>
    );
    const { rerender } = render(<App saving />);
    act(() => {
      toast.show({ message: 'Deleted', actionText: 'Undo', indefinite: true });
    });
    focus(button('Save'));
    focus(button('Undo'));
    rerender(<App saving={false} />);
    click(button('Undo'));
    expect(document.activeElement).toBe(document.body);
  });

  // A legacy root, which React 18 still offers, renders a toast hiding
  // itself on its own when the update comes from outside React's events, as
  // Escape's does, so the store has to drop the toast first.
  it.runIf(React.version.startsWith('18.'))(
    'moves focus when Escape closes the toast under a legacy root',
    () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        render(
          <>
            <button>Save</button>
            <ToastContainer />
          </>,
          { legacyRoot: true }
        );
        act(() => {
          toast.show({
            message: 'Deleted',
            actionText: 'Undo',
            indefinite: true,
          });
        });
        focus(button('Save'));
        focus(button('Undo'));
        // Outside act, which would batch the updates.
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(screen.queryByText('Deleted')).not.toBeInTheDocument();
        expect(document.activeElement).toBe(button('Save'));
      } finally {
        errorSpy.mockRestore();
      }
    }
  );

  // A toast calls `onClose` before it hides, so the container can tell a
  // toast closing from one moving. One that throws still closes the toast.
  it('hides a toast whose onClose throws', () => {
    const swallow = (event: ErrorEvent) => event.preventDefault();
    window.addEventListener('error', swallow);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(
        <Toast
          message="Saved"
          indefinite
          onClose={() => {
            throw new Error('onClose failed');
          }}
        />
      );
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });
      expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    } finally {
      errorSpy.mockRestore();
      window.removeEventListener('error', swallow);
    }
  });

  it('has nowhere to go back to once focus went to the page itself', () => {
    render(
      <>
        <button>Save</button>
        <ToastContainer />
      </>
    );
    act(() => {
      toast.show({ message: 'Deleted', actionText: 'Undo', indefinite: true });
    });
    focus(button('Save'));
    // A click on the page's background sends focus to the page itself.
    act(() => {
      button('Save').blur();
    });
    focus(button('Undo'));
    click(button('Undo'));
    expect(document.activeElement).toBe(document.body);
  });

  it('keeps the toast focus moves to open while focus stays in it', () => {
    render(<ToastContainer />);
    act(() => {
      toast.show({ message: 'One', actionText: 'Undo', indefinite: true });
      toast.show({ message: 'Two', actionText: 'View', duration: 2000 });
    });
    focus(button('Undo'));
    click(button('Undo'));
    expect(document.activeElement).toBe(button('View'));
    for (let waited = 0; waited < 10000; waited += focusCheckInterval) {
      act(() => {
        vi.advanceTimersByTime(focusCheckInterval);
      });
    }
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(document.activeElement).toBe(button('View'));
  });

  it('leaves focus alone when a toast changes stacks without closing', () => {
    const { rerender } = render(<ToastContainer position="top-right" />);
    act(() => {
      toast.show({ message: 'Deleted', actionText: 'Undo', indefinite: true });
      toast.show({
        message: 'Saved',
        actionText: 'View',
        position: 'top-right',
        indefinite: true,
      });
    });
    focus(button('View'));
    // Saved, shown at the container's old position, remounts. It hasn't
    // closed, so focus drops as it would have, rather than going to Undo.
    rerender(<ToastContainer position="bottom-left" />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(document.activeElement).toBe(document.body);
  });
});
