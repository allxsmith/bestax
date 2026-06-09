import React, { useRef } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { useFocusTrap } from '../_pickerInternals/useFocusTrap';

const Trap: React.FC<{ active: boolean }> = ({ active }) => {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active);
  return (
    <div ref={ref} tabIndex={-1} data-testid="trap">
      <button data-testid="first">First</button>
      <button data-testid="middle">Middle</button>
      <button data-testid="last">Last</button>
    </div>
  );
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
});
