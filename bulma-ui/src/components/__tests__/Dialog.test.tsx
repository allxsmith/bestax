import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Dialog, DialogContainer, dialog } from '../Dialog';

describe('Dialog', () => {
  afterEach(() => {
    dialog.close();
  });

  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(<Dialog isOpen message="Test message" />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<Dialog isOpen={false} message="Test message" />);
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(<Dialog isOpen title="Test Title" message="Test message" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders confirm button', () => {
      render(<Dialog isOpen message="Test" />);
      expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
    });

    it('renders cancel button by default', () => {
      render(<Dialog isOpen message="Test" />);
      expect(
        screen.getByRole('button', { name: 'Cancel' })
      ).toBeInTheDocument();
    });

    it('does not render cancel button when showCancel is false', () => {
      render(<Dialog isOpen message="Test" showCancel={false} />);
      expect(
        screen.queryByRole('button', { name: 'Cancel' })
      ).not.toBeInTheDocument();
    });

    it('renders custom button text', () => {
      render(
        <Dialog isOpen message="Test" confirmText="Yes" cancelText="No" />
      );
      expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
    });
  });

  describe('Types', () => {
    it('applies success type class', () => {
      render(<Dialog isOpen message="Test" type="success" />);
      expect(screen.getByRole('alertdialog')).toHaveClass('is-success');
    });

    it('applies danger type class', () => {
      render(<Dialog isOpen message="Test" type="danger" />);
      expect(screen.getByRole('alertdialog')).toHaveClass('is-danger');
    });

    it('applies warning type class', () => {
      render(<Dialog isOpen message="Test" type="warning" />);
      expect(screen.getByRole('alertdialog')).toHaveClass('is-warning');
    });

    it('applies info type class', () => {
      render(<Dialog isOpen message="Test" type="info" />);
      expect(screen.getByRole('alertdialog')).toHaveClass('is-info');
    });

    it('does not apply type class for default', () => {
      render(<Dialog isOpen message="Test" type="default" />);
      expect(screen.getByRole('alertdialog')).not.toHaveClass('is-default');
    });

    it('applies colored button for type', () => {
      render(<Dialog isOpen message="Test" type="danger" />);
      const confirmBtn = screen.getByRole('button', { name: 'OK' });
      expect(confirmBtn).toHaveClass('is-danger');
    });
  });

  describe('Icon', () => {
    it('renders default icon for success type', () => {
      render(<Dialog isOpen message="Test" type="success" title="Success" />);
      const icon = document.querySelector('.dialog-icon svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders default icon for danger type', () => {
      render(<Dialog isOpen message="Test" type="danger" title="Error" />);
      const icon = document.querySelector('.dialog-icon svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders custom icon when provided', () => {
      render(
        <Dialog
          isOpen
          message="Test"
          title="Custom"
          icon={<span data-testid="custom-icon">!</span>}
        />
      );
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('does not render icon when icon is null', () => {
      render(
        <Dialog
          isOpen
          message="Test"
          type="success"
          title="No Icon"
          icon={null}
        />
      );
      expect(document.querySelector('.dialog-icon')).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      const onConfirm = jest.fn();
      render(<Dialog isOpen message="Test" onConfirm={onConfirm} />);

      fireEvent.click(screen.getByRole('button', { name: 'OK' }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button is clicked', () => {
      const onCancel = jest.fn();
      render(<Dialog isOpen message="Test" onCancel={onCancel} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when overlay is clicked', () => {
      const onCancel = jest.fn();
      render(<Dialog isOpen message="Test" onCancel={onCancel} />);

      const overlay = document.querySelector('.modal-background');
      fireEvent.click(overlay!);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not call onCancel when canCancel is false and overlay clicked', () => {
      const onCancel = jest.fn();
      render(
        <Dialog isOpen message="Test" onCancel={onCancel} canCancel={false} />
      );

      const overlay = document.querySelector('.modal-background');
      fireEvent.click(overlay!);

      expect(onCancel).not.toHaveBeenCalled();
    });

    it('does not call onCancel when clicking inside dialog', () => {
      const onCancel = jest.fn();
      render(<Dialog isOpen message="Test" onCancel={onCancel} />);

      const dialog = screen.getByRole('alertdialog');
      fireEvent.click(dialog);

      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('Escape Key', () => {
    it('calls onCancel on Escape when canCancel is true', () => {
      const onCancel = jest.fn();
      render(<Dialog isOpen message="Test" onCancel={onCancel} canCancel />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not call onCancel on Escape when canCancel is false', () => {
      const onCancel = jest.fn();
      render(
        <Dialog isOpen message="Test" onCancel={onCancel} canCancel={false} />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('focuses confirm button by default', () => {
      render(<Dialog isOpen message="Test" />);
      expect(screen.getByRole('button', { name: 'OK' })).toHaveFocus();
    });

    it('focuses cancel button when focusCancel is true', () => {
      render(<Dialog isOpen message="Test" focusCancel />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });
  });

  describe('Body Scroll Lock', () => {
    it('prevents body scroll when open', () => {
      render(<Dialog isOpen message="Test" />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(<Dialog isOpen message="Test" />);
      rerender(<Dialog isOpen={false} message="Test" />);
      expect(document.body.style.overflow).not.toBe('hidden');
    });
  });

  describe('Accessibility', () => {
    it('has alertdialog role', () => {
      render(<Dialog isOpen message="Test" />);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('has aria-modal true', () => {
      render(<Dialog isOpen message="Test" />);
      expect(screen.getByRole('alertdialog')).toHaveAttribute(
        'aria-modal',
        'true'
      );
    });

    it('has aria-labelledby when title is provided', () => {
      render(<Dialog isOpen title="Dialog Title" message="Test" />);
      expect(screen.getByRole('alertdialog')).toHaveAttribute(
        'aria-labelledby',
        'dialog-title'
      );
    });

    it('has aria-describedby for message', () => {
      render(<Dialog isOpen message="Test" />);
      expect(screen.getByRole('alertdialog')).toHaveAttribute(
        'aria-describedby',
        'dialog-message'
      );
    });
  });

  describe('Rendering structure', () => {
    it('renders inline within parent', () => {
      render(
        <div id="app">
          <Dialog isOpen message="Test" />
        </div>
      );

      const dialogElement = screen.getByRole('alertdialog');
      // Dialog should be rendered inline within the parent
      expect(dialogElement.closest('#app')).not.toBeNull();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to dialog element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Dialog isOpen message="Test" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});

describe('Dialog Programmatic API', () => {
  afterEach(() => {
    dialog.close();
  });

  describe('dialog.alert', () => {
    it('returns a promise', () => {
      const result = dialog.alert({ message: 'Test' });
      expect(result).toBeInstanceOf(Promise);
      dialog.close();
    });

    it('accepts string shorthand', () => {
      const result = dialog.alert('Simple message');
      expect(result).toBeInstanceOf(Promise);
      dialog.close();
    });
  });

  describe('dialog.confirm', () => {
    it('returns a promise', () => {
      const result = dialog.confirm({ message: 'Test' });
      expect(result).toBeInstanceOf(Promise);
      dialog.close();
    });

    it('accepts string shorthand', () => {
      const result = dialog.confirm('Simple confirm');
      expect(result).toBeInstanceOf(Promise);
      dialog.close();
    });
  });

  describe('dialog.close', () => {
    it('closes the current dialog', () => {
      render(<DialogContainer />);
      act(() => {
        dialog.alert({ message: 'Test' });
      });
      expect(screen.getByText('Test')).toBeInTheDocument();

      act(() => {
        dialog.close();
      });
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });

    it('resolves with provided value', async () => {
      let resolvedValue: any;
      const promise = dialog.confirm({ message: 'Test' });
      promise.then(val => {
        resolvedValue = val;
      });

      dialog.close(true);

      await Promise.resolve();
      expect(resolvedValue).toBe(true);
    });
  });

  describe('dialog.subscribe', () => {
    it('notifies subscribers of changes', () => {
      const listener = jest.fn();
      const unsubscribe = dialog.subscribe(listener);

      act(() => {
        dialog.alert({ message: 'Test' });
      });

      expect(listener).toHaveBeenCalled();
      unsubscribe();
      dialog.close();
    });

    it('returns unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = dialog.subscribe(listener);

      unsubscribe();

      act(() => {
        dialog.alert({ message: 'Test' });
      });

      expect(listener).not.toHaveBeenCalled();
      dialog.close();
    });
  });
});

describe('DialogContainer', () => {
  afterEach(() => {
    dialog.close();
  });

  it('renders alert dialogs', () => {
    render(<DialogContainer />);

    act(() => {
      dialog.alert({ title: 'Alert', message: 'Test alert' });
    });

    expect(screen.getByText('Test alert')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancel' })
    ).not.toBeInTheDocument();
  });

  it('renders confirm dialogs with cancel button', () => {
    render(<DialogContainer />);

    act(() => {
      dialog.confirm({ title: 'Confirm', message: 'Test confirm' });
    });

    expect(screen.getByText('Test confirm')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('resolves confirm with true on confirm click', async () => {
    render(<DialogContainer />);

    let result: boolean | undefined;
    act(() => {
      dialog.confirm({ message: 'Confirm?' }).then(r => {
        result = r;
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await Promise.resolve();
    expect(result).toBe(true);
  });

  it('resolves confirm with false on cancel click', async () => {
    render(<DialogContainer />);

    let result: boolean | undefined;
    act(() => {
      dialog.confirm({ message: 'Confirm?' }).then(r => {
        result = r;
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await Promise.resolve();
    expect(result).toBe(false);
  });
});
