import React, { useRef, useState } from 'react';
import { render, fireEvent, act, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { useFocusTrap, UseFocusTrapOptions } from '../useFocusTrap';
import { Portal } from '../portal';

/** Presses Tab on whatever has focus, the way a browser dispatches it. */
function pressTab(shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    shiftKey,
    bubbles: true,
    cancelable: true,
  });
  (document.activeElement ?? document.body).dispatchEvent(event);
  return event;
}

const Trap: React.FC<
  UseFocusTrapOptions & { children?: React.ReactNode; withRef?: boolean }
> = ({ children, withRef = true, ...options }) => {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, options);
  return (
    <div ref={withRef ? ref : undefined} tabIndex={-1} data-testid="trap">
      {children ?? (
        <>
          <button>First</button>
          <button>Middle</button>
          <button>Last</button>
        </>
      )}
    </div>
  );
};

const button = (name: string) => screen.getByRole('button', { name });

describe('useFocusTrap', () => {
  describe('turning on', () => {
    it('is on by default and focuses the first tab stop', () => {
      render(<Trap />);
      expect(button('First')).toHaveFocus();
    });

    it('does nothing while inactive', () => {
      render(<Trap active={false} />);
      expect(document.body).toHaveFocus();
      button('Last').focus();
      const event = pressTab();
      expect(event.defaultPrevented).toBe(false);
    });

    it('focuses initialFocusRef when it points at an element', () => {
      const WithInitial: React.FC = () => {
        const initialRef = useRef<HTMLButtonElement>(null);
        return (
          <Trap initialFocusRef={initialRef}>
            <button>First</button>
            <button ref={initialRef}>Second</button>
          </Trap>
        );
      };
      render(<WithInitial />);
      expect(button('Second')).toHaveFocus();
    });

    it('falls back to the first tab stop while initialFocusRef is empty', () => {
      const WithEmptyInitial: React.FC = () => {
        const initialRef = useRef<HTMLButtonElement>(null);
        return <Trap initialFocusRef={initialRef} />;
      };
      render(<WithEmptyInitial />);
      expect(button('First')).toHaveFocus();
    });

    it('focuses the container when nothing inside can take focus', () => {
      render(
        <Trap>
          <span>Nothing focusable</span>
        </Trap>
      );
      expect(screen.getByTestId('trap')).toHaveFocus();
    });

    it('does nothing when the ref is never attached', () => {
      render(<Trap withRef={false} />);
      expect(document.body).toHaveFocus();
    });
  });

  describe('Tab', () => {
    it('wraps from the last stop to the first', () => {
      render(<Trap />);
      button('Last').focus();
      expect(pressTab().defaultPrevented).toBe(true);
      expect(button('First')).toHaveFocus();
    });

    it('wraps from the first stop to the last on Shift+Tab', () => {
      render(<Trap />);
      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(button('Last')).toHaveFocus();
    });

    it('leaves Tab to the browser between the ends', () => {
      render(<Trap />);
      button('Middle').focus();
      expect(pressTab().defaultPrevented).toBe(false);
      expect(pressTab(true).defaultPrevented).toBe(false);
      expect(button('Middle')).toHaveFocus();
    });

    it('ignores other keys', () => {
      render(<Trap />);
      button('Last').focus();
      fireEvent.keyDown(button('Last'), { key: 'ArrowDown' });
      expect(button('Last')).toHaveFocus();
    });

    it('holds focus on the container when there are no tab stops', () => {
      render(
        <Trap>
          <span>Nothing focusable</span>
        </Trap>
      );
      expect(pressTab().defaultPrevented).toBe(true);
      expect(screen.getByTestId('trap')).toHaveFocus();
    });

    it('wraps from the container itself on Shift+Tab, and lets Tab walk in', () => {
      render(<Trap />);
      const trap = screen.getByTestId('trap');
      trap.focus();
      expect(pressTab().defaultPrevented).toBe(false);
      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(button('Last')).toHaveFocus();
    });

    it('wraps from an element outside the tab order that sits after the last stop', () => {
      render(
        <Trap>
          <button>First</button>
          <button>Last</button>
          <button tabIndex={-1}>Roving</button>
        </Trap>
      );
      button('Roving').focus();
      expect(pressTab().defaultPrevented).toBe(true);
      expect(button('First')).toHaveFocus();
    });
  });

  describe('which elements are tab stops', () => {
    // Every decoy is focusable by selector but not by Tab. With any one of them
    // counted as an end, Tab from the real ends would leave the container.
    const Decoys: React.FC<{ where: 'start' | 'end' }> = ({ where }) => (
      <span data-decoys={where}>
        <a href="#x" tabIndex={-1}>
          negative tabindex link
        </a>
        <button tabIndex={-1}>negative tabindex button</button>
        <button disabled>disabled</button>
        <button disabled tabIndex={0}>
          disabled with tabindex
        </button>
        <fieldset disabled>
          <input aria-label="in a disabled fieldset" />
        </fieldset>
        <input type="hidden" />
        <button hidden>hidden attribute</button>
        <span hidden>
          <button>inside hidden</button>
        </span>
        <span style={{ display: 'none' }}>
          <button>inside display none</button>
        </span>
        <button style={{ visibility: 'hidden' }}>visibility hidden</button>
        <span style={{ visibility: 'collapse' }}>
          <button>inside visibility collapse</button>
        </span>
        {/* Set by hand: React 18 and 19 disagree on how to spell `inert`. */}
        <span ref={el => el?.setAttribute('inert', '')}>
          <button>inside inert</button>
        </span>
      </span>
    );

    beforeEach(() => {
      render(
        <Trap>
          <Decoys where="start" />
          <button>Real first</button>
          <div tabIndex={0}>Real middle</div>
          <a href="#real">Real last</a>
          <Decoys where="end" />
        </Trap>
      );
    });

    it('starts on the first real stop', () => {
      expect(button('Real first')).toHaveFocus();
    });

    it('wraps between the real ends in both directions', () => {
      screen.getByRole('link', { name: 'Real last' }).focus();
      expect(pressTab().defaultPrevented).toBe(true);
      expect(button('Real first')).toHaveFocus();

      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(screen.getByRole('link', { name: 'Real last' })).toHaveFocus();
    });

    it('counts an element with a non-negative tabindex', () => {
      screen.getByText('Real middle').focus();
      expect(pressTab().defaultPrevented).toBe(false);
    });
  });

  describe('restoring focus', () => {
    const Toggle: React.FC<{
      restoreFocus?: UseFocusTrapOptions['restoreFocus'];
      content?: React.ReactNode;
    }> = ({ restoreFocus, content }) => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          <button>Elsewhere</button>
          {open && (
            <Trap restoreFocus={restoreFocus}>
              {content ?? <button onClick={() => setOpen(false)}>Close</button>}
            </Trap>
          )}
          <button onClick={() => setOpen(false)}>Outside close</button>
        </>
      );
    };

    const open = () => {
      button('Open').focus();
      fireEvent.click(button('Open'));
    };

    it('returns focus to the element that had it when the trap turned on', () => {
      render(<Toggle />);
      open();
      expect(button('Close')).toHaveFocus();
      fireEvent.click(button('Close'));
      expect(button('Open')).toHaveFocus();
    });

    it('returns focus when active turns off with the container still mounted', () => {
      const Switchable: React.FC = () => {
        const [active, setActive] = useState(false);
        return (
          <>
            <button onClick={() => setActive(true)}>Arm</button>
            <Trap active={active}>
              <button onClick={() => setActive(false)}>Disarm</button>
            </Trap>
          </>
        );
      };
      render(<Switchable />);
      button('Arm').focus();
      fireEvent.click(button('Arm'));
      expect(button('Disarm')).toHaveFocus();
      fireEvent.click(button('Disarm'));
      expect(button('Arm')).toHaveFocus();
    });

    it('sends focus to the restoreFocus ref instead', () => {
      const WithTarget: React.FC = () => {
        const targetRef = useRef<HTMLButtonElement>(null);
        return (
          <>
            <button ref={targetRef}>Target</button>
            <Toggle restoreFocus={targetRef} />
          </>
        );
      };
      render(<WithTarget />);
      open();
      fireEvent.click(button('Close'));
      expect(button('Target')).toHaveFocus();
    });

    it('leaves focus alone when restoreFocus is false', () => {
      render(<Toggle restoreFocus={false} />);
      open();
      fireEvent.click(button('Close'));
      expect(document.body).toHaveFocus();
    });

    it('does not take focus back from an element outside that already has it', () => {
      render(<Toggle />);
      open();
      button('Elsewhere').focus();
      fireEvent.click(button('Outside close'));
      expect(button('Elsewhere')).toHaveFocus();
    });

    it('loses the opener to content that took focus as it mounted, which a ref fixes', () => {
      const WithOpenerRef: React.FC<{ byRef: boolean }> = ({ byRef }) => {
        const openerRef = useRef<HTMLButtonElement>(null);
        const [open, setOpen] = useState(false);
        return (
          <>
            <button ref={openerRef} onClick={() => setOpen(true)}>
              Open
            </button>
            {open && (
              <Trap restoreFocus={byRef ? openerRef : true}>
                <input aria-label="Search" autoFocus />
              </Trap>
            )}
            <button onClick={() => setOpen(false)}>Outside close</button>
          </>
        );
      };

      // The autofocused input already has focus when the trap turns on, so it
      // is what `true` records, and it leaves with the container.
      const { unmount } = render(<WithOpenerRef byRef={false} />);
      open();
      expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus();
      fireEvent.click(button('Outside close'));
      expect(document.body).toHaveFocus();
      unmount();

      render(<WithOpenerRef byRef />);
      open();
      fireEvent.click(button('Outside close'));
      expect(button('Open')).toHaveFocus();
    });
  });

  it('works inside a shadow root, where document.activeElement is the host', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const mount = document.createElement('div');
    host.attachShadow({ mode: 'open' }).appendChild(mount);
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const inShadow = (name: string) =>
      Array.from(mount.querySelectorAll('button')).find(
        b => b.textContent === name
      )!;
    const tabFrom = (el: HTMLElement, shiftKey = false) => {
      el.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(event);
      return event;
    };
    try {
      const { unmount } = render(<Trap />, { container: mount });
      expect(document.activeElement).toBe(host);
      expect(host.shadowRoot!.activeElement).toBe(inShadow('First'));

      expect(tabFrom(inShadow('Last')).defaultPrevented).toBe(true);
      expect(host.shadowRoot!.activeElement).toBe(inShadow('First'));
      expect(tabFrom(inShadow('Middle')).defaultPrevented).toBe(false);
      expect(tabFrom(inShadow('First'), true).defaultPrevented).toBe(true);
      expect(host.shadowRoot!.activeElement).toBe(inShadow('Last'));

      unmount();
      expect(opener).toHaveFocus();
    } finally {
      document.body.removeChild(host);
      document.body.removeChild(opener);
    }
  });

  it('lets a nested trap handle Tab without the outer one wrapping too', () => {
    const Nested: React.FC = () => {
      const outerRef = useRef<HTMLDivElement>(null);
      const innerRef = useRef<HTMLDivElement>(null);
      useFocusTrap(outerRef);
      useFocusTrap(innerRef);
      return (
        <div ref={outerRef} tabIndex={-1}>
          <button>Outer first</button>
          <div ref={innerRef} tabIndex={-1}>
            <button>Inner only</button>
          </div>
        </div>
      );
    };
    render(<Nested />);
    // The inner trap engages last, so it holds focus.
    expect(button('Inner only')).toHaveFocus();
    // Its only stop is also the outer trap's last one, so without the nested
    // check the outer trap would send focus to its first stop.
    expect(pressTab().defaultPrevented).toBe(true);
    expect(button('Inner only')).toHaveFocus();
  });

  describe('server rendering and hydration', () => {
    const PortaledPanel: React.FC = () => {
      const ref = useRef<HTMLDivElement>(null);
      useFocusTrap(ref);
      return (
        <main>
          <button>Page</button>
          <Portal>
            <div ref={ref} tabIndex={-1} data-testid="panel">
              <button>In the panel</button>
            </div>
          </Portal>
        </main>
      );
    };

    it('server-renders without running the trap', () => {
      expect(renderToString(<PortaledPanel />)).toBe(
        '<main><button>Page</button></main>'
      );
    });

    it('attaches to a portaled container once the page hydrates', async () => {
      const container = document.createElement('div');
      container.innerHTML = renderToString(<PortaledPanel />);
      document.body.appendChild(container);

      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      let unmountRoot = () => {};
      try {
        await act(async () => {
          const root = hydrateRoot(container, <PortaledPanel />);
          unmountRoot = () => root.unmount();
        });

        expect(errorSpy).not.toHaveBeenCalled();
        // The panel only exists from the commit after hydration; the trap
        // still found it, moved focus in, and wraps Tab there.
        const inPanel = button('In the panel');
        expect(inPanel).toHaveFocus();
        expect(pressTab().defaultPrevented).toBe(true);
        expect(inPanel).toHaveFocus();
      } finally {
        await act(async () => unmountRoot());
        errorSpy.mockRestore();
        document.body.removeChild(container);
      }
    });
  });
});
