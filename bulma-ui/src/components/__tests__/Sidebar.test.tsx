import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../Sidebar';
import { Loading } from '../Loading';
import { ConfigProvider } from '../../helpers/Config';

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

    it('applies is-fullwidth and 100% width via the canonical isFullwidth prop', () => {
      render(
        <Sidebar isOpen onClose={() => {}} isFullwidth>
          <div>Content</div>
        </Sidebar>
      );
      const sidebar = screen.getByRole('dialog');
      expect(sidebar).toHaveClass('is-fullwidth');
      expect(sidebar.style.getPropertyValue('--bulma-sidebar-width')).toBe(
        '100%'
      );
    });

    it('isFullwidth wins over fullWidth for both the class and the width', () => {
      render(
        <Sidebar
          isOpen
          onClose={() => {}}
          isFullwidth={false}
          fullWidth
          width="320px"
        >
          <div>Content</div>
        </Sidebar>
      );
      const sidebar = screen.getByRole('dialog');
      expect(sidebar).not.toHaveClass('is-fullwidth');
      expect(sidebar.style.getPropertyValue('--bulma-sidebar-width')).toBe(
        '320px'
      );
    });

    it('applies the class prefix to is-fullwidth', () => {
      render(
        <ConfigProvider classPrefix="bestax-">
          <Sidebar isOpen onClose={() => {}} isFullwidth>
            <div>Content</div>
          </Sidebar>
        </ConfigProvider>
      );
      expect(screen.getByRole('dialog')).toHaveClass('bestax-is-fullwidth');
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

    it('leaves an Escape that content inside already used', () => {
      const handleClose = jest.fn();
      render(
        <Sidebar isOpen onClose={handleClose}>
          <input
            aria-label="Search"
            onKeyDown={e => {
              if (e.key === 'Escape') e.preventDefault();
            }}
          />
        </Sidebar>
      );

      fireEvent.keyDown(screen.getByLabelText('Search'), { key: 'Escape' });
      expect(handleClose).not.toHaveBeenCalled();

      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('hears Escape after a document listener added once it was open', () => {
      const handleClose = jest.fn();
      render(
        <Sidebar isOpen onClose={handleClose}>
          <div>Content</div>
        </Sidebar>
      );
      const claim = (e: KeyboardEvent) => e.preventDefault();
      document.addEventListener('keydown', claim);
      try {
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(handleClose).not.toHaveBeenCalled();
      } finally {
        document.removeEventListener('keydown', claim);
      }
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

    it('takes focus without an overlay too, with no modal overlay open', () => {
      render(
        <Sidebar isOpen onClose={() => {}} overlay={false}>
          <button type="button">Inside</button>
        </Sidebar>
      );
      expect(screen.getByText('Inside')).toHaveFocus();
    });

    it('moves focus past a control Tab would skip', () => {
      render(
        <Sidebar isOpen onClose={() => {}}>
          <button type="button" disabled>
            Disabled
          </button>
          <a href="#skip" tabIndex={-1}>
            Not tabbable
          </a>
          <button type="button">Enabled</button>
        </Sidebar>
      );
      expect(screen.getByText('Enabled')).toHaveFocus();
    });

    describe('when it closes', () => {
      let opener: HTMLButtonElement;
      beforeEach(() => {
        opener = document.createElement('button');
        opener.textContent = 'Open filters';
        document.body.appendChild(opener);
        opener.focus();
      });
      afterEach(() => opener.remove());

      const ui = (isOpen: boolean, overlay = true) => (
        <Sidebar isOpen={isOpen} onClose={() => {}} overlay={overlay}>
          <button type="button">Inside</button>
        </Sidebar>
      );

      it('hands focus back to the element that had it when it opened', () => {
        const { rerender } = render(ui(true));
        expect(screen.getByText('Inside')).toHaveFocus();

        rerender(ui(false));
        expect(opener).toHaveFocus();
      });

      it('hands focus back when it unmounts while open', () => {
        const { unmount } = render(ui(true));
        unmount();
        expect(opener).toHaveFocus();
      });

      it('leaves focus that moved out to the page where it is', () => {
        const elsewhere = document.createElement('button');
        document.body.appendChild(elsewhere);
        try {
          const { rerender } = render(ui(true, false));
          elsewhere.focus();

          rerender(ui(false, false));
          expect(elsewhere).toHaveFocus();
        } finally {
          elsewhere.remove();
        }
      });

      it('does not pull focus out of a sidebar still open on top', () => {
        const stack = (backgroundOpen: boolean) => (
          <>
            <Sidebar isOpen={backgroundOpen} onClose={() => {}}>
              <button type="button">Background</button>
            </Sidebar>
            <Sidebar isOpen onClose={() => {}}>
              <button type="button">Top</button>
            </Sidebar>
          </>
        );
        const { rerender } = render(stack(true));
        expect(screen.getByText('Top')).toHaveFocus();

        rerender(stack(false));
        expect(screen.getByText('Top')).toHaveFocus();
      });
    });
  });

  describe('Focus containment', () => {
    const three = (
      props: Partial<React.ComponentProps<typeof Sidebar>> = {}
    ) => (
      <Sidebar isOpen onClose={() => {}} aria-label="Filters" {...props}>
        <button type="button">First</button>
        <button type="button">Middle</button>
        <button type="button">Last</button>
      </Sidebar>
    );

    it('wraps Tab from the last tab stop to the first', () => {
      render(three());
      const last = screen.getByText('Last');
      last.focus();

      expect(fireEvent.keyDown(last, { key: 'Tab' })).toBe(false);
      expect(screen.getByText('First')).toHaveFocus();
    });

    it('wraps Shift+Tab from the first tab stop to the last', () => {
      render(three());
      const first = screen.getByText('First');
      expect(first).toHaveFocus();

      expect(fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })).toBe(
        false
      );
      expect(screen.getByText('Last')).toHaveFocus();
    });

    it('leaves Tab to the browser between the ends', () => {
      render(three());
      const middle = screen.getByText('Middle');
      middle.focus();

      expect(fireEvent.keyDown(middle, { key: 'Tab' })).toBe(true);
      expect(fireEvent.keyDown(middle, { key: 'Tab', shiftKey: true })).toBe(
        true
      );
      expect(middle).toHaveFocus();
    });

    it('wraps at the stops Tab visits, past a disabled control and a radio group', () => {
      render(
        <Sidebar isOpen onClose={() => {}} aria-label="Filters">
          <button type="button">First</button>
          <input type="radio" name="rating" aria-label="4 stars" />
          <input type="radio" name="rating" aria-label="3 stars" />
          <button type="button" disabled>
            Apply
          </button>
        </Sidebar>
      );
      // A radio group is one stop, its first button while none is checked.
      const group = screen.getByLabelText('4 stars');
      group.focus();

      expect(fireEvent.keyDown(group, { key: 'Tab' })).toBe(false);
      expect(screen.getByText('First')).toHaveFocus();
    });

    it('pulls focus back in when Tab is pressed from outside the sidebar', () => {
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      try {
        render(three());

        outside.focus();
        expect(fireEvent.keyDown(outside, { key: 'Tab' })).toBe(false);
        expect(screen.getByText('First')).toHaveFocus();

        outside.focus();
        expect(fireEvent.keyDown(outside, { key: 'Tab', shiftKey: true })).toBe(
          false
        );
        expect(screen.getByText('Last')).toHaveFocus();
      } finally {
        outside.remove();
      }
    });

    it('holds focus on the sidebar when nothing inside can take it', () => {
      render(
        <Sidebar isOpen onClose={() => {}} aria-label="Filters">
          <p>Nothing to focus</p>
        </Sidebar>
      );
      const sidebar = screen.getByRole('dialog');
      sidebar.blur();

      expect(fireEvent.keyDown(document.body, { key: 'Tab' })).toBe(false);
      expect(sidebar).toHaveFocus();
    });

    it('leaves a Tab that a trap inside already used', () => {
      // A portaled popup's own trap moves focus outside the sidebar's node and
      // claims the key; the sidebar must not pull focus back.
      const panel = document.createElement('button');
      document.body.appendChild(panel);
      const trap = (e: KeyboardEvent) => {
        e.preventDefault();
        panel.focus();
      };
      render(three());
      document.addEventListener('keydown', trap);
      try {
        fireEvent.keyDown(screen.getByText('Last'), { key: 'Tab' });
        expect(panel).toHaveFocus();
      } finally {
        document.removeEventListener('keydown', trap);
        panel.remove();
      }
    });

    it('leaves Tab alone without an overlay, which is not modal', () => {
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      try {
        render(three({ overlay: false }));
        const last = screen.getByText('Last');
        last.focus();

        expect(fireEvent.keyDown(last, { key: 'Tab' })).toBe(true);
        expect(last).toHaveFocus();

        outside.focus();
        expect(fireEvent.keyDown(outside, { key: 'Tab' })).toBe(true);
        expect(outside).toHaveFocus();
      } finally {
        outside.remove();
      }
    });

    it('lets go of Tab once it closes', () => {
      const { rerender } = render(three());
      rerender(three({ isOpen: false }));
      const last = screen.getByText('Last');
      last.focus();

      expect(fireEvent.keyDown(last, { key: 'Tab' })).toBe(true);
      expect(last).toHaveFocus();
    });

    it('holds Tab in the topmost sidebar only', () => {
      render(
        <>
          <Sidebar isOpen onClose={() => {}} aria-label="Menu">
            <button type="button">Under</button>
          </Sidebar>
          {three()}
        </>
      );
      const last = screen.getByText('Last');
      last.focus();

      expect(fireEvent.keyDown(last, { key: 'Tab' })).toBe(false);
      expect(screen.getByText('First')).toHaveFocus();
    });

    describe('when a Tab it let through leaves anyway', () => {
      // A browser can leave out a stop the sidebar has, as Safari leaves out
      // links when its settings say to, and walk focus out of the sidebar on
      // a Tab the sidebar left to it. jsdom moves no focus on Tab, so each
      // test moves it out by hand the way that browser would.
      let outside: HTMLButtonElement;
      beforeEach(() => {
        outside = document.createElement('button');
        outside.textContent = 'Behind the overlay';
        document.body.appendChild(outside);
      });
      afterEach(() => outside.remove());

      it('sends focus forward to the first stop', () => {
        render(
          <Sidebar isOpen onClose={() => {}} aria-label="Navigation">
            <button type="button">Close</button>
            <a href="#home">Skipped by the browser</a>
          </Sidebar>
        );
        const close = screen.getByText('Close');
        expect(close).toHaveFocus();

        expect(fireEvent.keyDown(close, { key: 'Tab' })).toBe(true);
        act(() => outside.focus());
        expect(close).toHaveFocus();
      });

      it('sends focus back to the last stop on Shift+Tab', () => {
        render(
          <Sidebar isOpen onClose={() => {}} aria-label="Navigation">
            <a href="#home">Skipped by the browser</a>
            <button type="button">Close</button>
          </Sidebar>
        );
        const close = screen.getByText('Close');
        act(() => close.focus());

        expect(fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })).toBe(
          true
        );
        act(() => outside.focus());
        expect(close).toHaveFocus();
      });

      it('leaves focus a pointer or a script moves out', () => {
        render(three());
        act(() => outside.focus());
        expect(outside).toHaveFocus();
      });

      it('leaves it alone under another overlay', () => {
        // A full-page Loading is in the overlay stack but holds no Tab, so
        // nothing else moves focus here.
        const Page = ({ loading }: { loading: boolean }) => (
          <>
            {three()}
            <Loading active={loading} isFullPage />
          </>
        );
        const { rerender } = render(<Page loading={false} />);
        rerender(<Page loading />);
        const middle = screen.getByText('Middle');
        act(() => middle.focus());

        expect(fireEvent.keyDown(middle, { key: 'Tab' })).toBe(true);
        act(() => outside.focus());
        expect(outside).toHaveFocus();
      });
    });
  });

  describe('Closed', () => {
    // jsdom implements neither `inert` nor a tab order, so this applies the
    // browser's rule itself, as Collapse's tests do: a focusable element
    // inside an inert subtree can't take focus.
    const tabbable = () =>
      Array.from(document.body.querySelectorAll<HTMLElement>('a[href], button'))
        .filter(el => el.tabIndex >= 0 && !el.closest('[inert]'))
        .map(el => el.textContent);

    const ui = (isOpen: boolean) => (
      <Sidebar isOpen={isOpen} onClose={() => {}} aria-label="Navigation">
        <button type="button">Close</button>
        <a href="#home">Home</a>
      </Sidebar>
    );

    it('is inert, so Tab passes over its content, and open it is not', () => {
      const { rerender } = render(ui(false));
      const sidebar = screen.getByRole('dialog', { hidden: true });
      expect(sidebar).toHaveAttribute('inert');
      expect(tabbable()).toEqual([]);

      rerender(ui(true));
      expect(sidebar).not.toHaveAttribute('inert');
      expect(tabbable()).toEqual(['Close', 'Home']);

      rerender(ui(false));
      expect(sidebar).toHaveAttribute('inert');
      expect(tabbable()).toEqual([]);
    });

    it('stops being inert before focus moves in on open', () => {
      const focus = HTMLElement.prototype.focus;
      const inertWhenFocused: boolean[] = [];
      const spy = jest
        .spyOn(HTMLElement.prototype, 'focus')
        .mockImplementation(function (this: HTMLElement, options) {
          inertWhenFocused.push(this.closest('[inert]') !== null);
          focus.call(this, options);
        });
      try {
        const { rerender } = render(ui(false));
        rerender(ui(true));
      } finally {
        spy.mockRestore();
      }
      expect(screen.getByText('Close')).toHaveFocus();
      expect(inertWhenFocused).toEqual([false]);
    });

    it('is inert by the time it hands focus back on close', () => {
      const opener = document.createElement('button');
      document.body.appendChild(opener);
      try {
        opener.focus();
        const { rerender } = render(ui(true));
        expect(screen.getByText('Close')).toHaveFocus();

        rerender(ui(false));
        expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute(
          'inert'
        );
        expect(opener).toHaveFocus();
      } finally {
        opener.remove();
      }
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
      const removeSpy = jest.spyOn(window, 'removeEventListener');
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

    it('keeps the Sidebar.Close type and name through a spread carrying absent values', () => {
      // React reads an `undefined` attribute as "remove it", and a props spread
      // whose key has no value is how that arrives. Defaults written before
      // the spread were erased by it: a nameless button that submits a form.
      const spread: {
        type?: 'button' | 'submit' | 'reset';
        'aria-label'?: string;
      } = { type: undefined, 'aria-label': undefined };
      render(<Sidebar.Close data-testid="close" {...spread} />);
      const close = screen.getByTestId('close');
      expect(close).toHaveAttribute('type', 'button');
      expect(close).toHaveAttribute('aria-label', 'Close');
    });

    it('lets an explicit Sidebar.Close type and aria-label win', () => {
      render(
        <>
          <Sidebar.Close data-testid="submit" type="submit" aria-label="Done" />
          <Sidebar.Close data-testid="reset" type="reset" />
        </>
      );
      expect(screen.getByTestId('submit')).toHaveAttribute('type', 'submit');
      expect(screen.getByTestId('submit')).toHaveAttribute(
        'aria-label',
        'Done'
      );
      expect(screen.getByTestId('reset')).toHaveAttribute('type', 'reset');
    });

    it('falls back to the Sidebar.Close name when given an empty aria-label', () => {
      // `''` names nothing, and the button is drawn as an icon, so an empty
      // label would leave it unnamed. It falls back like a missing one.
      render(<Sidebar.Close data-testid="close" aria-label="" />);
      expect(screen.getByTestId('close')).toHaveAttribute(
        'aria-label',
        'Close'
      );
    });

    it('replaces a Sidebar.Close type HTML would read as submit with type="button"', () => {
      const loose: object = { type: 'text/html' };
      render(<Sidebar.Close data-testid="close" {...loose} />);
      expect(screen.getByTestId('close')).toHaveAttribute('type', 'button');
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

  // The cleanup contract is honored identically on React 18 and 19 (the CI
  // matrix), and identically across every component that merges a forwarded
  // ref, so neither this nor its siblings branch on React.version.
  it('runs a forwarded callback ref cleanup on unmount instead of calling it with null', () => {
    const calls: (HTMLElement | null)[] = [];
    const cleanup = jest.fn();
    const callbackRef = (node: HTMLElement | null) => {
      calls.push(node);
      if (!node) return undefined;
      return () => {
        cleanup();
      };
    };

    const { unmount } = render(
      <Sidebar isOpen onClose={() => {}} ref={callbackRef}>
        x
      </Sidebar>
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]).not.toBeNull();
    expect(cleanup).not.toHaveBeenCalled();

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(1);
  });
});
