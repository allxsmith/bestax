import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../Sidebar';

describe('Sidebar', () => {
  describe('Rendering', () => {
    it('renders children when open', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <div>Sidebar Content</div>
        </Sidebar>
      );
      expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
    });

    it('renders with sidebar class', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );
      expect(screen.getByRole('dialog')).toHaveClass('sidebar');
    });

    it('applies is-active class when open', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );
      expect(screen.getByRole('dialog')).toHaveClass('is-active');
    });

    it('does not apply is-active class when closed', () => {
      render(
        <Sidebar isOpen={false} onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );
      expect(screen.getByRole('dialog', { hidden: true })).not.toHaveClass(
        'is-active'
      );
    });

    it('renders overlay by default', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );
      const overlay = document.querySelector('.sidebar-background');
      expect(overlay).toBeInTheDocument();
    });

    it('does not render overlay when overlay is false', () => {
      render(
        <Sidebar isOpen onClose={() => {}} overlay={false}>
          <div>Content</div>
        </Sidebar>
      );
      const overlay = document.querySelector('.sidebar-background');
      expect(overlay).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Sidebar isOpen onClose={() => {}} className="custom-class">
          <div>Content</div>
        </Sidebar>
      );
      expect(screen.getByRole('dialog')).toHaveClass('custom-class');
    });
  });

  describe('Position', () => {
    it('applies is-left class by default', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );
      expect(screen.getByRole('dialog')).toHaveClass('is-left');
    });

    it('applies is-right class when position is right', () => {
      render(
        <Sidebar isOpen onClose={() => {}} position="right">
          <div>Content</div>
        </Sidebar>
      );
      expect(screen.getByRole('dialog')).toHaveClass('is-right');
    });
  });

  describe('Width', () => {
    it('sets custom width via CSS variable', () => {
      render(
        <Sidebar isOpen onClose={() => {}} width="400px">
          <div>Content</div>
        </Sidebar>
      );
      const sidebar = screen.getByRole('dialog');
      expect(sidebar.style.getPropertyValue('--bulma-sidebar-width')).toBe(
        '400px'
      );
    });

    it('applies is-fullwidth class when fullWidth is true', () => {
      render(
        <Sidebar isOpen onClose={() => {}} fullWidth>
          <div>Content</div>
        </Sidebar>
      );
      expect(screen.getByRole('dialog')).toHaveClass('is-fullwidth');
    });
  });

  describe('Closing Behavior', () => {
    it('calls onClose when overlay is clicked', async () => {
      const handleClose = jest.fn();
      render(
        <Sidebar isOpen onClose={handleClose}>
          <div>Content</div>
        </Sidebar>
      );

      const overlay = document.querySelector('.sidebar-background');
      await userEvent.click(overlay!);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when overlay clicked and overlayClose is false', async () => {
      const handleClose = jest.fn();
      render(
        <Sidebar isOpen onClose={handleClose} overlayClose={false}>
          <div>Content</div>
        </Sidebar>
      );

      const overlay = document.querySelector('.sidebar-background');
      await userEvent.click(overlay!);

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('calls onClose when Escape key is pressed', () => {
      const handleClose = jest.fn();
      render(
        <Sidebar isOpen onClose={handleClose}>
          <div>Content</div>
        </Sidebar>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose on Escape when escapeClose is false', () => {
      const handleClose = jest.fn();
      render(
        <Sidebar isOpen onClose={handleClose} escapeClose={false}>
          <div>Content</div>
        </Sidebar>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('does not call onClose when canCancel is false', async () => {
      const handleClose = jest.fn();
      render(
        <Sidebar isOpen onClose={handleClose} canCancel={false}>
          <div>Content</div>
        </Sidebar>
      );

      const overlay = document.querySelector('.sidebar-background');
      await userEvent.click(overlay!);

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('does not call onClose on Escape when canCancel is false', () => {
      const handleClose = jest.fn();
      render(
        <Sidebar isOpen onClose={handleClose} canCancel={false}>
          <div>Content</div>
        </Sidebar>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Lock', () => {
    it('prevents body scroll when open with overlay', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(
        <Sidebar isOpen onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );

      rerender(
        <Sidebar isOpen={false} onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );

      expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('does not lock body scroll when overlay is false', () => {
      const originalOverflow = document.body.style.overflow;
      render(
        <Sidebar isOpen onClose={() => {}} overlay={false}>
          <div>Content</div>
        </Sidebar>
      );

      expect(document.body.style.overflow).toBe(originalOverflow);
    });
  });

  describe('Focus Management', () => {
    it('focuses first focusable element when opened', async () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <button>Click me</button>
        </Sidebar>
      );

      await waitFor(() => {
        expect(document.activeElement?.textContent).toBe('Click me');
      });
    });

    it('focuses sidebar when no focusable elements', async () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <div>No buttons here</div>
        </Sidebar>
      );

      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByRole('dialog'));
      });
    });
  });

  describe('Accessibility', () => {
    it('has dialog role', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal true when overlay is shown', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('does not have aria-modal when no overlay', () => {
      render(
        <Sidebar isOpen onClose={() => {}} overlay={false}>
          <div>Content</div>
        </Sidebar>
      );
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal');
    });

    it('has aria-hidden false when open', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );
      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-hidden',
        'false'
      );
    });

    it('has aria-hidden true when closed', () => {
      render(
        <Sidebar isOpen={false} onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );
      expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });

    it('overlay has aria-hidden true', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );
      const overlay = document.querySelector('.sidebar-background');
      expect(overlay).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to sidebar element', () => {
      const ref = React.createRef<HTMLElement>();
      render(
        <Sidebar isOpen onClose={() => {}} ref={ref}>
          <div>Content</div>
        </Sidebar>
      );
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });
  });

  describe('Portal Rendering', () => {
    it('renders sidebar in portal (body)', () => {
      render(
        <div id="app">
          <Sidebar isOpen onClose={() => {}}>
            <div>Content</div>
          </Sidebar>
        </div>
      );

      // Sidebar should be a direct child of body, not inside #app
      const sidebar = screen.getByRole('dialog');
      expect(sidebar.parentElement).toBe(document.body);
    });
  });

  describe('Overlay State', () => {
    it('overlay has is-active class when sidebar is open', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );
      const overlay = document.querySelector('.sidebar-background');
      expect(overlay).toHaveClass('is-active');
    });

    it('overlay does not have is-active class when sidebar is closed', () => {
      render(
        <Sidebar isOpen={false} onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );
      const overlay = document.querySelector('.sidebar-background');
      expect(overlay).not.toHaveClass('is-active');
    });
  });

  describe('Content Container', () => {
    it('wraps children in sidebar-content', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <div data-testid="child">Content</div>
        </Sidebar>
      );

      const child = screen.getByTestId('child');
      expect(child.parentElement).toHaveClass('sidebar-content');
    });

    it('renders Sidebar.Body with sidebar-body class', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <Sidebar.Body data-testid="body">Body content</Sidebar.Body>
        </Sidebar>
      );

      const body = screen.getByTestId('body');
      expect(body).toHaveClass('sidebar-body');
    });
  });

  describe('Edge Cases', () => {
    it('handles onClose being undefined', async () => {
      render(
        <Sidebar isOpen>
          <div>Content</div>
        </Sidebar>
      );

      const overlay = document.querySelector('.sidebar-background');
      // Should not throw
      await userEvent.click(overlay!);
    });

    it('handles rapid open/close', () => {
      const { rerender } = render(
        <Sidebar isOpen onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );

      rerender(
        <Sidebar isOpen={false} onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );

      rerender(
        <Sidebar isOpen onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );

      expect(screen.getByRole('dialog')).toHaveClass('is-active');
    });

    it('cleans up event listeners on unmount', () => {
      const handleClose = jest.fn();
      const { unmount } = render(
        <Sidebar isOpen onClose={handleClose}>
          <div>Content</div>
        </Sidebar>
      );

      unmount();

      // Should not throw and should not call handleClose
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('removes keydown listener on unmount (no leak)', () => {
      const removeSpy = jest.spyOn(document, 'removeEventListener');
      const { unmount } = render(
        <Sidebar isOpen onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );

      unmount();

      const removedKeydown = removeSpy.mock.calls.some(
        ([eventName]) => eventName === 'keydown'
      );
      expect(removedKeydown).toBe(true);
      removeSpy.mockRestore();
    });

    it('restores body overflow to original value on unmount', () => {
      const original = 'scroll';
      document.body.style.overflow = original;

      const { unmount } = render(
        <Sidebar isOpen onClose={() => {}}>
          <div>Content</div>
        </Sidebar>
      );

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe(original);

      // cleanup
      document.body.style.overflow = '';
    });

    it('does not trigger onClose for non-Escape keys', () => {
      const handleClose = jest.fn();
      render(
        <Sidebar isOpen onClose={handleClose}>
          <div>Content</div>
        </Sidebar>
      );

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'a' });

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Inline Rendering', () => {
    it('renders inline (no portal) when inline is true', () => {
      render(
        <div data-testid="container">
          <Sidebar isOpen onClose={() => {}} inline>
            <div>Inline content</div>
          </Sidebar>
        </div>
      );

      const sidebar = screen.getByRole('dialog');
      // sidebar should be inside the container, not on document.body
      expect(screen.getByTestId('container')).toContainElement(sidebar);
      expect(sidebar.parentElement).not.toBe(document.body);
    });
  });

  describe('Ref Forwarding (function ref)', () => {
    it('invokes function refs with the sidebar element', () => {
      const fnRef = jest.fn();
      render(
        <Sidebar isOpen onClose={() => {}} ref={fnRef}>
          <div>Content</div>
        </Sidebar>
      );

      expect(fnRef).toHaveBeenCalled();
      const node = fnRef.mock.calls[0][0];
      expect(node).toBeInstanceOf(HTMLElement);
      expect((node as HTMLElement).tagName).toBe('ASIDE');
    });
  });

  describe('Sub-components', () => {
    it('renders Sidebar.Header with sidebar-header class', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <Sidebar.Header data-testid="header" className="extra">
            Header content
          </Sidebar.Header>
        </Sidebar>
      );

      const header = screen.getByTestId('header');
      expect(header).toHaveClass('sidebar-header');
      expect(header).toHaveClass('extra');
      expect(header).toHaveTextContent('Header content');
    });

    it('renders Sidebar.Title with sidebar-title class', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <Sidebar.Title data-testid="title" className="extra">
            Title text
          </Sidebar.Title>
        </Sidebar>
      );

      const title = screen.getByTestId('title');
      expect(title.tagName).toBe('P');
      expect(title).toHaveClass('sidebar-title');
      expect(title).toHaveClass('extra');
      expect(title).toHaveTextContent('Title text');
    });

    it('renders Sidebar.Close as a button with sidebar-close class', () => {
      const handleClick = jest.fn();
      render(
        <Sidebar isOpen onClose={() => {}}>
          <Sidebar.Close data-testid="close" onClick={handleClick}>
            X
          </Sidebar.Close>
        </Sidebar>
      );

      const close = screen.getByTestId('close');
      expect(close.tagName).toBe('BUTTON');
      expect(close).toHaveClass('sidebar-close');
      expect(close).toHaveAttribute('aria-label', 'Close');
      expect(close).toHaveAttribute('type', 'button');
      fireEvent.click(close);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders Sidebar.Footer with sidebar-footer class', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <Sidebar.Footer data-testid="footer" className="extra">
            Footer content
          </Sidebar.Footer>
        </Sidebar>
      );

      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('sidebar-footer');
      expect(footer).toHaveClass('extra');
      expect(footer).toHaveTextContent('Footer content');
    });
  });

  describe('Compound components', () => {
    it('exposes Sidebar.Header as a static', () => {
      expect(Sidebar.Header).toBeDefined();
    });

    it('exposes Sidebar.Title as a static', () => {
      expect(Sidebar.Title).toBeDefined();
    });

    it('exposes Sidebar.Close as a static', () => {
      expect(Sidebar.Close).toBeDefined();
    });

    it('exposes Sidebar.Body as a static', () => {
      expect(Sidebar.Body).toBeDefined();
    });

    it('exposes Sidebar.Footer as a static', () => {
      expect(Sidebar.Footer).toBeDefined();
    });

    it('renders a sidebar through the dot path', () => {
      const { container } = render(
        <Sidebar inline isOpen onClose={() => {}}>
          <Sidebar.Header>
            <Sidebar.Title>Menu</Sidebar.Title>
            <Sidebar.Close />
          </Sidebar.Header>
          <Sidebar.Body>Body content</Sidebar.Body>
          <Sidebar.Footer>Footer content</Sidebar.Footer>
        </Sidebar>
      );
      expect(container.querySelector('.sidebar')).toBeInTheDocument();
      expect(container.querySelector('.sidebar-header')).toBeInTheDocument();
      expect(container.querySelector('.sidebar-title')).toBeInTheDocument();
      expect(container.querySelector('.sidebar-close')).toBeInTheDocument();
      expect(container.querySelector('.sidebar-body')).toBeInTheDocument();
      expect(container.querySelector('.sidebar-footer')).toBeInTheDocument();
    });
  });
});
