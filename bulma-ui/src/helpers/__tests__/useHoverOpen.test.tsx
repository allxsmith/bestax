import { useRef, useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useHoverOpen, HoverOpenHandlers } from '../useHoverOpen';

/**
 * A pointer event with a `pointerType`, which jsdom's events lack. React
 * makes `onPointerEnter` and `onPointerLeave` out of `pointerover` and
 * `pointerout`.
 */
const pointer = (
  el: Element,
  type: 'pointerover' | 'pointerout' | 'pointerdown',
  relatedTarget: EventTarget | null = null
) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    relatedTarget,
  });
  Object.defineProperty(event, 'pointerType', { value: 'mouse' });
  fireEvent(el, event);
};

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

interface HarnessProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  withTrigger?: boolean;
  onHandlers?: (handlers: HoverOpenHandlers) => void;
}

/** A trigger and a floating element, with the hook's handlers on their parent. */
const Harness = ({
  open = false,
  onOpenChange = () => {},
  openDelay = 100,
  closeDelay = 50,
  withTrigger = true,
  onHandlers,
}: HarnessProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const handlers = useHoverOpen({
    open,
    onOpenChange,
    openDelay,
    closeDelay,
    triggerRef,
    floatingRef,
  });
  onHandlers?.(handlers);
  return (
    <div data-testid="root" {...handlers}>
      {withTrigger && <button ref={triggerRef}>Trigger</button>}
      {open && (
        <div ref={floatingRef} data-testid="floating">
          <button>Inside</button>
        </div>
      )}
    </div>
  );
};

/** The harness holding its own open state, as an uncontrolled caller does. */
const Stateful = ({ onOpenChange, ...props }: HarnessProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Harness
      {...props}
      open={open}
      onOpenChange={next => {
        onOpenChange?.(next);
        setOpen(next);
      }}
    />
  );
};

const trigger = () => screen.getByRole('button', { name: 'Trigger' });
const floating = () => screen.queryByTestId('floating');

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useHoverOpen', () => {
  it('asks to open after openDelay on hover, and to close after closeDelay once the pointer leaves', () => {
    const onOpenChange = jest.fn();
    render(<Stateful onOpenChange={onOpenChange} />);
    pointer(trigger(), 'pointerover');
    advance(99);
    expect(onOpenChange).not.toHaveBeenCalled();
    advance(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    pointer(trigger(), 'pointerout', document.body);
    advance(49);
    expect(floating()).toBeInTheDocument();
    advance(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(floating()).toBeNull();
  });

  it('renders nothing of its own and adds no roles or ARIA', () => {
    render(<Stateful />);
    pointer(trigger(), 'pointerover');
    advance(100);
    const root = screen.getByTestId('root');
    expect(floating()).toBeInTheDocument();
    expect(root.outerHTML).not.toMatch(/\saria-|\srole=/);
    expect(root.querySelectorAll('*')).toHaveLength(3);
  });

  it('returns the same handlers on every render', () => {
    const seen: HoverOpenHandlers[] = [];
    const { rerender } = render(
      <Harness onHandlers={handlers => seen.push(handlers)} />
    );
    rerender(<Harness openDelay={200} onHandlers={h => seen.push(h)} />);
    expect(seen[1]).toBe(seen[0]);
  });

  it('calls the onOpenChange of the latest render when a delay runs out', () => {
    const first = jest.fn();
    const latest = jest.fn();
    const { rerender } = render(<Harness onOpenChange={first} />);
    pointer(trigger(), 'pointerover');
    rerender(<Harness onOpenChange={latest} />);
    advance(100);
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledWith(true);
  });

  it('counts focus as keyboard focus until a press, and again after a key', () => {
    const onOpenChange = jest.fn();
    render(
      <>
        <Harness onOpenChange={onOpenChange} />
        <button>Elsewhere</button>
      </>
    );
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });

    // Nothing has been pressed yet, so focus counts, as `:focus-visible`
    // would have it.
    trigger().focus();
    advance(100);
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    elsewhere.focus();
    pointer(trigger(), 'pointerdown');
    trigger().focus();
    advance(1000);
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    elsewhere.focus();
    fireEvent.keyDown(elsewhere, { key: 'Tab', shiftKey: true });
    trigger().focus();
    advance(100);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it('stops Escape at the document while open, and lets it through while closed', () => {
    const outer = jest.fn();
    document.addEventListener('keydown', outer);
    try {
      const { rerender } = render(<Harness />);
      fireEvent.keyDown(trigger(), { key: 'Escape' });
      expect(outer).toHaveBeenCalledTimes(1);

      rerender(<Harness open />);
      fireEvent.keyDown(trigger(), { key: 'Escape' });
      expect(outer).toHaveBeenCalledTimes(1);
    } finally {
      document.removeEventListener('keydown', outer);
    }
  });

  it('listens on the page’s document when there is no trigger', () => {
    const onOpenChange = jest.fn();
    render(<Harness open withTrigger={false} onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('has nothing to hand focus back to without a trigger', () => {
    const { rerender } = render(<Harness open withTrigger={false} />);
    screen.getByRole('button', { name: 'Inside' }).focus();
    rerender(<Harness open={false} withTrigger={false} />);
    expect(document.body).toHaveFocus();
  });

  it('hands focus back to the trigger when the floating element closes with focus inside', () => {
    const onOpenChange = jest.fn();
    const { rerender } = render(<Harness open onOpenChange={onOpenChange} />);
    pointer(screen.getByRole('button', { name: 'Inside' }), 'pointerdown');
    screen.getByRole('button', { name: 'Inside' }).focus();
    fireEvent.keyDown(document.body, { key: 'Enter' });
    rerender(<Harness open={false} onOpenChange={onOpenChange} />);
    expect(trigger()).toHaveFocus();
    // Handing focus back is not keyboard focus arriving, so it asks for
    // nothing.
    advance(1000);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('asks for nothing after it unmounts', () => {
    const onOpenChange = jest.fn();
    const { unmount } = render(<Harness onOpenChange={onOpenChange} />);
    pointer(trigger(), 'pointerover');
    unmount();
    advance(1000);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  describe('document listeners', () => {
    /**
     * Counts the capture-phase listeners of each type on `document` that are
     * still on: those added since the spy started, less those taken off.
     */
    const watchDocument = () => {
      const add = jest.spyOn(document, 'addEventListener');
      const remove = jest.spyOn(document, 'removeEventListener');
      const live = (type: string) =>
        add.mock.calls.filter(([t, , capture]) => t === type && capture)
          .length -
        remove.mock.calls.filter(([t, , capture]) => t === type && capture)
          .length;
      return {
        keydown: () => live('keydown'),
        pointerdown: () => live('pointerdown'),
        restore: () => {
          add.mockRestore();
          remove.mockRestore();
        },
      };
    };

    it('shares one pair for telling a key from a press across every hook, and takes it off with the last', () => {
      const listeners = watchDocument();
      try {
        const first = render(<Harness />);
        const second = render(<Harness />);
        const third = render(<Harness />);
        expect(listeners.keydown()).toBe(1);
        expect(listeners.pointerdown()).toBe(1);

        first.unmount();
        second.unmount();
        expect(listeners.keydown()).toBe(1);
        third.unmount();
        expect(listeners.keydown()).toBe(0);
        expect(listeners.pointerdown()).toBe(0);
      } finally {
        listeners.restore();
      }
    });

    it('listens for Escape only while open or about to open', () => {
      const listeners = watchDocument();
      try {
        render(<Stateful />);
        const idle = listeners.keydown();

        pointer(trigger(), 'pointerover');
        expect(listeners.keydown()).toBe(idle + 1);
        pointer(trigger(), 'pointerout', document.body);
        expect(listeners.keydown()).toBe(idle);

        pointer(trigger(), 'pointerover');
        advance(100);
        expect(floating()).toBeInTheDocument();
        expect(listeners.keydown()).toBe(idle + 1);

        pointer(trigger(), 'pointerout', document.body);
        advance(50);
        expect(floating()).toBeNull();
        expect(listeners.keydown()).toBe(idle);
      } finally {
        listeners.restore();
      }
    });

    it('stops listening for Escape once it cancels an opening', () => {
      const listeners = watchDocument();
      try {
        const onOpenChange = jest.fn();
        render(<Harness onOpenChange={onOpenChange} />);
        const idle = listeners.keydown();
        pointer(trigger(), 'pointerover');
        fireEvent.keyDown(trigger(), { key: 'Escape' });
        expect(listeners.keydown()).toBe(idle);
        advance(1000);
        expect(onOpenChange).not.toHaveBeenCalled();
      } finally {
        listeners.restore();
      }
    });

    it('stops listening when an opening its caller turns down runs out', () => {
      const listeners = watchDocument();
      try {
        const onOpenChange = jest.fn();
        render(<Harness onOpenChange={onOpenChange} />);
        const idle = listeners.keydown();
        pointer(trigger(), 'pointerover');
        advance(100);
        // A controlled caller that keeps it closed.
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(floating()).toBeNull();
        expect(listeners.keydown()).toBe(idle);
      } finally {
        listeners.restore();
      }
    });

    it('takes the Escape listener off when it unmounts open', () => {
      const listeners = watchDocument();
      try {
        const { unmount } = render(<Harness open />);
        expect(listeners.keydown()).toBe(2);
        unmount();
        expect(listeners.keydown()).toBe(0);
      } finally {
        listeners.restore();
      }
    });
  });
});
