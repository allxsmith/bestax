import React, { useRef, useState } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { PickerPopover } from '../_pickerInternals/PickerPopover';

const Harness: React.FC<{
  appendToBody?: boolean;
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
  initialOpen?: boolean;
}> = ({
  appendToBody,
  closeOnEscape = true,
  closeOnClickOutside = true,
  initialOpen = true,
}) => {
  const [open, setOpen] = useState(initialOpen);
  const anchorRef = useRef<HTMLButtonElement>(null);
  return (
    <div>
      <button
        ref={anchorRef}
        data-testid="anchor"
        onClick={() => setOpen(o => !o)}
      >
        anchor
      </button>
      <PickerPopover
        isOpen={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        appendToBody={appendToBody}
        closeOnEscape={closeOnEscape}
        closeOnClickOutside={closeOnClickOutside}
        ariaLabel="test"
      >
        <button data-testid="inside">inside</button>
      </PickerPopover>
    </div>
  );
};

describe('PickerPopover', () => {
  it('does not render when closed', () => {
    const { queryByTestId } = render(<Harness initialOpen={false} />);
    expect(queryByTestId('inside')).toBeNull();
  });

  it('renders dialog role when open', () => {
    const { getByRole } = render(<Harness />);
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    const { queryByTestId } = render(<Harness />);
    expect(queryByTestId('inside')).not.toBeNull();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(queryByTestId('inside')).toBeNull();
  });

  it('does not close on Escape when closeOnEscape=false', () => {
    const { queryByTestId } = render(<Harness closeOnEscape={false} />);
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(queryByTestId('inside')).not.toBeNull();
  });

  it('closes on outside pointerdown', () => {
    const { queryByTestId, container } = render(
      <>
        <button data-testid="outside">outside</button>
        <Harness />
      </>
    );
    expect(queryByTestId('inside')).not.toBeNull();
    act(() => {
      fireEvent.pointerDown(
        container.querySelector('[data-testid="outside"]')!
      );
    });
    expect(queryByTestId('inside')).toBeNull();
  });

  it('does not close on pointerdown inside the panel', () => {
    const { getByTestId, queryByTestId } = render(<Harness />);
    act(() => {
      fireEvent.pointerDown(getByTestId('inside'));
    });
    expect(queryByTestId('inside')).not.toBeNull();
  });

  it('renders into document.body when appendToBody', () => {
    const { getByTestId } = render(<Harness appendToBody />);
    const inside = getByTestId('inside');
    // panel is the parent dialog, which when portaled is a direct child of body.
    expect(inside.closest('[role="dialog"]')!.parentElement).toBe(
      document.body
    );
  });

  it("position='auto' picks bottom-left when there's room below", () => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 1000,
    });
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1000,
    });
    const Wrapper: React.FC = () => {
      const anchorRef = useRef<HTMLButtonElement>(null);
      return (
        <>
          <button
            ref={anchorRef}
            data-testid="anchor"
            style={{ position: 'absolute', top: 100, left: 100 }}
          >
            anchor
          </button>
          <PickerPopover
            isOpen
            onClose={() => {}}
            anchorRef={anchorRef}
            position="auto"
            appendToBody
            ariaLabel="auto"
          >
            <div>panel</div>
          </PickerPopover>
        </>
      );
    };
    const { getByRole } = render(<Wrapper />);
    const dialog = getByRole('dialog');
    expect(dialog.className).toMatch(/is-bottom-left/);
  });
});
