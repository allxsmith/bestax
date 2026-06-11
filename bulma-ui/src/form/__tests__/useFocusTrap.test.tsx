import React, { useRef } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { useFocusTrap } from '../_pickerInternals/useFocusTrap';

const Trap: React.FC<{ active: boolean; restoreFocus?: boolean }> = ({
  active,
  restoreFocus,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(
    ref,
    active,
    restoreFocus === undefined ? undefined : { restoreFocus }
  );
  return (
    <div ref={ref} tabIndex={-1} data-testid="trap">
      <button data-testid="first">First</button>
      <button data-testid="middle">Middle</button>
      <button data-testid="last">Last</button>
    </div>
  );
};

// Trap with an explicit initial-focus target.
const InitialFocusTrap: React.FC<{ attachInitial?: boolean }> = ({
  attachInitial = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const initialRef = useRef<HTMLButtonElement>(null);
  useFocusTrap(ref, true, {
    initialFocusRef: initialRef as React.RefObject<HTMLElement>,
  });
  return (
    <div ref={ref} tabIndex={-1} data-testid="trap">
      <button data-testid="first">First</button>
      <button ref={attachInitial ? initialRef : undefined} data-testid="second">
        Second
      </button>
    </div>
  );
};

// Trap whose container has no focusable children.
const EmptyTrap: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true);
  return (
    <div ref={ref} tabIndex={-1} data-testid="trap">
      <span>nothing focusable here</span>
    </div>
  );
};

// Active trap whose container ref is never attached to a DOM node.
const DetachedTrap: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true);
  return <button data-testid="loose">loose</button>;
};

describe('useFocusTrap', () => {
  it('does nothing when inactive', () => {
    render(<Trap active={false} />);
    // No focus moved to first button.
    expect(document.activeElement).toBe(document.body);
  });

  it('focuses first focusable when activated', () => {
    const { getByTestId } = render(<Trap active={true} />);
    expect(document.activeElement).toBe(getByTestId('first'));
  });

  it('cycles forward from last → first on Tab', () => {
    const { getByTestId } = render(<Trap active={true} />);
    const last = getByTestId('last');
    last.focus();
    fireEvent.keyDown(getByTestId('trap'), { key: 'Tab' });
    expect(document.activeElement).toBe(getByTestId('first'));
  });

  it('cycles backward from first → last on Shift+Tab', () => {
    const { getByTestId } = render(<Trap active={true} />);
    const first = getByTestId('first');
    first.focus();
    fireEvent.keyDown(getByTestId('trap'), { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(getByTestId('last'));
  });

  it('restores focus when deactivated', () => {
    const Wrapper: React.FC = () => {
      const [active, setActive] = React.useState(false);
      return (
        <>
          <button data-testid="outside" onClick={() => setActive(true)}>
            outside
          </button>
          {active && <Trap active={active} />}
          <button data-testid="deactivate" onClick={() => setActive(false)}>
            close
          </button>
        </>
      );
    };
    const { getByTestId } = render(<Wrapper />);
    const outside = getByTestId('outside');
    outside.focus();
    fireEvent.click(outside);
    expect(document.activeElement).toBe(getByTestId('first'));
    fireEvent.click(getByTestId('deactivate'));
    expect(document.activeElement).toBe(outside);
  });

  it('does not restore focus on unmount when restoreFocus is false', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    const { getByTestId, unmount } = render(
      <Trap active={true} restoreFocus={false} />
    );
    expect(document.activeElement).toBe(getByTestId('first'));
    unmount();
    expect(document.activeElement).not.toBe(outside);
    document.body.removeChild(outside);
  });

  it('focuses the initialFocusRef element when provided', () => {
    const { getByTestId } = render(<InitialFocusTrap />);
    expect(document.activeElement).toBe(getByTestId('second'));
  });

  it('falls back to the first focusable when initialFocusRef has no node', () => {
    const { getByTestId } = render(<InitialFocusTrap attachInitial={false} />);
    expect(document.activeElement).toBe(getByTestId('first'));
  });

  it('does not wrap on Tab from a middle element', () => {
    const { getByTestId } = render(<Trap active={true} />);
    const middle = getByTestId('middle');
    middle.focus();
    fireEvent.keyDown(getByTestId('trap'), { key: 'Tab' });
    // Not at the boundary — the hook leaves focus handling to the browser.
    expect(document.activeElement).toBe(middle);
  });

  it('ignores non-Tab keys', () => {
    const { getByTestId } = render(<Trap active={true} />);
    const first = getByTestId('first');
    first.focus();
    fireEvent.keyDown(getByTestId('trap'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(first);
  });

  it('focuses the container and blocks Tab when nothing inside is focusable', () => {
    const { getByTestId } = render(<EmptyTrap />);
    const trap = getByTestId('trap');
    expect(document.activeElement).toBe(trap);
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    trap.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(trap);
  });

  it('does nothing while active if the container ref is never attached', () => {
    const { getByTestId } = render(<DetachedTrap />);
    // No focus was stolen and nothing crashed.
    expect(document.activeElement).not.toBe(getByTestId('loose'));
  });
});
