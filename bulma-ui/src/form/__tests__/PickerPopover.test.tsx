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

  it('does not close on pointerdown on the anchor itself', () => {
    const { getByTestId, queryByTestId } = render(<Harness />);
    act(() => {
      fireEvent.pointerDown(getByTestId('anchor'));
    });
    expect(queryByTestId('inside')).not.toBeNull();
  });

  it('renders without crashing when the anchor ref is empty', () => {
    const emptyRef = { current: null };
    const { getByRole } = render(
      <PickerPopover
        isOpen
        onClose={() => {}}
        anchorRef={emptyRef}
        appendToBody
        ariaLabel="empty-anchor"
      >
        <div>panel</div>
      </PickerPopover>
    );
    // updatePosition bails out early (no anchor), leaving the default corner.
    expect(getByRole('dialog').className).toMatch(/is-bottom-left/);
  });

  it("role='group' omits aria-modal", () => {
    const anchorRef = { current: document.createElement('div') };
    const { getByRole } = render(
      <PickerPopover
        isOpen
        onClose={() => {}}
        anchorRef={anchorRef}
        role="group"
        ariaLabel="grouped"
      >
        <div>panel</div>
      </PickerPopover>
    );
    const group = getByRole('group');
    expect(group.getAttribute('aria-modal')).toBeNull();
    expect(group.getAttribute('role')).toBe('group');
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

// -------------------------------------------------------------------------
// Position resolution. jsdom reports zero-size rects, so the anchor's and
// panel's getBoundingClientRect are mocked, the viewport dimensions are
// pinned, and a window resize re-runs the measurement with the mocks live.
// -------------------------------------------------------------------------

describe('PickerPopover position resolution', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  const setViewport = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: height,
    });
  };

  afterEach(() => {
    setViewport(originalInnerWidth, originalInnerHeight);
    jest.restoreAllMocks();
  });

  const makeRect = (r: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }): DOMRect =>
    ({
      ...r,
      width: r.right - r.left,
      height: r.bottom - r.top,
      x: r.left,
      y: r.top,
      toJSON: () => ({}),
    }) as DOMRect;

  const PositionedHarness: React.FC<{
    position?:
      | 'auto'
      | 'bottom-left'
      | 'bottom-right'
      | 'top-left'
      | 'top-right';
    appendToBody?: boolean;
  }> = ({ position = 'auto', appendToBody = true }) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    return (
      <>
        <button ref={anchorRef} data-testid="anchor">
          anchor
        </button>
        <PickerPopover
          isOpen
          onClose={() => {}}
          anchorRef={anchorRef}
          position={position}
          appendToBody={appendToBody}
          ariaLabel="positioned"
        >
          <div>panel</div>
        </PickerPopover>
      </>
    );
  };

  /**
   * Renders the harness, mocks the anchor + panel rects, then fires a window
   * resize so updatePosition re-runs against the mocked measurements.
   */
  const renderWithRects = (
    ui: React.ReactElement,
    anchorRect: DOMRect,
    panelRect: { width: number; height: number }
  ) => {
    const result = render(ui);
    const anchor = result.getByTestId('anchor');
    const dialog = result.getByRole('dialog');
    jest.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(anchorRect);
    jest.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(
      makeRect({
        top: 0,
        left: 0,
        right: panelRect.width,
        bottom: panelRect.height,
      })
    );
    act(() => {
      fireEvent(window, new Event('resize'));
    });
    return result;
  };

  it('auto resolves to bottom-right when the panel fits below but not to the right', () => {
    setViewport(1000, 1000);
    const { getByRole } = renderWithRects(
      <PositionedHarness />,
      makeRect({ top: 50, bottom: 70, left: 900, right: 960 }),
      { width: 200, height: 300 }
    );
    const dialog = getByRole('dialog');
    expect(dialog.className).toMatch(/is-bottom-right/);
    // Fixed-position math: top = anchor bottom + 4, left = anchor right − width.
    expect(dialog.style.top).toBe('74px');
    expect(dialog.style.left).toBe('760px');
  });

  it('auto resolves to top-left when the panel fits to the right but not below', () => {
    setViewport(1000, 1000);
    const { getByRole } = renderWithRects(
      <PositionedHarness />,
      makeRect({ top: 880, bottom: 900, left: 50, right: 110 }),
      { width: 200, height: 300 }
    );
    const dialog = getByRole('dialog');
    expect(dialog.className).toMatch(/is-top-left/);
    // top = anchor top − height − 4, left = anchor left.
    expect(dialog.style.top).toBe('576px');
    expect(dialog.style.left).toBe('50px');
  });

  it('auto resolves to top-right when the panel fits neither below nor to the right', () => {
    setViewport(1000, 1000);
    const { getByRole } = renderWithRects(
      <PositionedHarness />,
      makeRect({ top: 880, bottom: 900, left: 900, right: 960 }),
      { width: 200, height: 300 }
    );
    const dialog = getByRole('dialog');
    expect(dialog.className).toMatch(/is-top-right/);
    // top = anchor top − height − 4, left = anchor right − width.
    expect(dialog.style.top).toBe('576px');
    expect(dialog.style.left).toBe('760px');
  });

  it('appendToBody computes fixed coordinates for an explicit bottom-left', () => {
    setViewport(1000, 1000);
    const { getByRole } = renderWithRects(
      <PositionedHarness position="bottom-left" />,
      makeRect({ top: 50, bottom: 70, left: 80, right: 140 }),
      { width: 200, height: 300 }
    );
    const dialog = getByRole('dialog');
    expect(dialog.className).toMatch(/is-bottom-left/);
    expect(dialog.style.top).toBe('74px');
    expect(dialog.style.left).toBe('80px');
  });

  it('auto without appendToBody applies the corner class with no inline coordinates', () => {
    setViewport(1000, 1000);
    const { getByRole } = renderWithRects(
      <PositionedHarness appendToBody={false} />,
      makeRect({ top: 880, bottom: 900, left: 50, right: 110 }),
      { width: 200, height: 300 }
    );
    const dialog = getByRole('dialog');
    expect(dialog.className).toMatch(/is-top-left/);
    expect(dialog.style.top).toBe('');
    expect(dialog.style.left).toBe('');
  });

  it('repositions when the window scrolls', () => {
    setViewport(1000, 1000);
    const { getByRole, getByTestId } = renderWithRects(
      <PositionedHarness />,
      makeRect({ top: 50, bottom: 70, left: 80, right: 140 }),
      { width: 200, height: 300 }
    );
    const dialog = getByRole('dialog');
    expect(dialog.className).toMatch(/is-bottom-left/);
    // The anchor moves (e.g. the page scrolled); a scroll event re-measures.
    (getByTestId('anchor').getBoundingClientRect as jest.Mock).mockReturnValue(
      makeRect({ top: 880, bottom: 900, left: 900, right: 960 })
    );
    act(() => {
      fireEvent.scroll(window);
    });
    expect(dialog.className).toMatch(/is-top-right/);
    expect(dialog.style.top).toBe('576px');
    expect(dialog.style.left).toBe('760px');
  });
});
