import { useState, type ReactNode } from 'react';
import { render, screen, act } from '@testing-library/react';
import { createPortal } from 'react-dom';
import { focusCheckInterval, useDismissTimer } from '../useDismissTimer';

vi.useFakeTimers();

afterEach(() => {
  vi.clearAllTimers();
});

const Closing = ({
  onDismiss,
  duration,
  children,
}: {
  onDismiss: () => void;
  duration: number | null;
  children?: ReactNode;
}) => {
  const { onFocus } = useDismissTimer(onDismiss, duration);
  return (
    <div data-testid="closing" onFocus={onFocus}>
      <button>Inside</button>
      {children}
    </div>
  );
};

// Advances the clock a check at a time, letting React render between steps.
const waitInSteps = (ms: number) => {
  for (let waited = 0; waited < ms; waited += focusCheckInterval) {
    act(() => {
      vi.advanceTimersByTime(focusCheckInterval);
    });
  }
};

describe('useDismissTimer', () => {
  it('calls onDismiss once the duration passes', () => {
    const onDismiss = vi.fn();
    render(<Closing onDismiss={onDismiss} duration={1000} />);
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('sets no timer for a null duration', () => {
    const onDismiss = vi.fn();
    render(<Closing onDismiss={onDismiss} duration={null} />);
    waitInSteps(10000);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('calls the latest onDismiss, without starting over when it changes', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Closing onDismiss={first} duration={1000} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender(<Closing onDismiss={second} duration={1000} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('keeps waiting while focus moves inside without a focus event it hears', () => {
    // A control that stops its focus event, as some third-party inputs do.
    const onDismiss = vi.fn();
    render(
      <Closing onDismiss={onDismiss} duration={1000}>
        <input aria-label="Quiet" onFocus={e => e.stopPropagation()} />
      </Closing>
    );
    act(() => {
      screen.getByRole('button', { name: 'Inside' }).focus();
    });
    act(() => {
      screen.getByRole('textbox', { name: 'Quiet' }).focus();
    });
    waitInSteps(10000);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('counts focus on what it portals elsewhere as inside', () => {
    const onDismiss = vi.fn();
    render(
      <Closing onDismiss={onDismiss} duration={1000}>
        {createPortal(<button>Portaled</button>, document.body)}
      </Closing>
    );
    act(() => {
      screen.getByRole('button', { name: 'Portaled' }).focus();
    });
    waitInSteps(10000);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('reads focus inside a shadow root from that root', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const mount = document.createElement('div');
    host.attachShadow({ mode: 'open' }).appendChild(mount);
    const onDismiss = vi.fn();
    render(<Closing onDismiss={onDismiss} duration={1000} />, {
      container: mount,
    });
    const inside = mount.querySelector('button')!;
    act(() => {
      inside.focus();
    });
    expect(document.activeElement).toBe(host);
    waitInSteps(10000);
    expect(onDismiss).not.toHaveBeenCalled();
    host.remove();
  });

  it('keeps waiting through a pause, and counts from when it finds focus gone after one', () => {
    const onDismiss = vi.fn();
    const Paused = () => {
      const [paused, setPaused] = useState(false);
      return (
        <>
          <button onClick={() => setPaused(p => !p)}>Toggle pause</button>
          <Closing onDismiss={onDismiss} duration={paused ? null : 1000} />
        </>
      );
    };
    render(<Paused />);
    act(() => {
      screen.getByRole('button', { name: 'Inside' }).focus();
    });
    const toggle = screen.getByRole('button', { name: 'Toggle pause' });
    // The pause starts, and focus leaves while it lasts. Nothing reads that
    // until the pause ends.
    act(() => {
      toggle.click();
    });
    waitInSteps(1000);
    act(() => {
      toggle.focus();
    });
    waitInSteps(10000);
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      toggle.click();
    });
    act(() => {
      vi.advanceTimersByTime(focusCheckInterval);
    });
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
