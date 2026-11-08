import type { Mock, MockInstance } from 'vitest';
import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  render,
  fireEvent,
  act,
  createEvent,
  screen,
} from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { PickerPopover } from '../_pickerInternals/PickerPopover';
import { Calendar, CALENDAR_FOCUSED_CELL } from '../_pickerInternals/Calendar';
import { TimeInput } from '../TimeInput';
import { DateTimeInput } from '../DateTimeInput';
import { DateInput } from '../DateInput';
import { DateRangeInput } from '../DateRangeInput';
import { LocaleProvider } from '../../helpers/LocaleProvider';
import { ColorInput } from '../ColorInput';
import { TreeSelect } from '../TreeSelect';

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

  it('marks the Escape it closes on as used, and lets it go on', () => {
    // A Modal or Sidebar around it reads `defaultPrevented` and stays open.
    // The key still reaches listeners further out.
    const { getByTestId } = render(<Harness />);
    const further = vi.fn();
    window.addEventListener('keydown', further);
    try {
      const escape = createEvent.keyDown(getByTestId('inside'), {
        key: 'Escape',
      });
      act(() => {
        fireEvent(getByTestId('inside'), escape);
      });
      expect(escape.defaultPrevented).toBe(true);
      expect(further).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('keydown', further);
    }
  });

  it('claims an Escape pressed in its panel before a React handler around it sees the key', () => {
    // Such as a Dropdown menu's, which then leaves the Escape to the picker.
    let seenUsed: boolean | undefined;
    const { getByTestId } = render(
      <div
        onKeyDown={e => {
          seenUsed = e.defaultPrevented;
        }}
      >
        <Harness />
      </div>
    );
    act(() => {
      fireEvent.keyDown(getByTestId('inside'), { key: 'Escape' });
    });
    expect(seenUsed).toBe(true);
  });

  it('leaves an Escape pressed in its panel unclaimed under closeOnEscape=false', () => {
    const { getByTestId } = render(<Harness closeOnEscape={false} />);
    expect(fireEvent.keyDown(getByTestId('inside'), { key: 'Escape' })).toBe(
      true
    );
  });

  it('closes on an Escape pressed elsewhere, and leaves that key unclaimed', () => {
    // Focus outside the picker, such as in a Modal opened over it, owns the
    // key, so the Modal still closes on it.
    const { getByTestId, queryByTestId } = render(
      <>
        <Harness />
        <button data-testid="elsewhere">elsewhere</button>
      </>
    );
    const escape = createEvent.keyDown(getByTestId('elsewhere'), {
      key: 'Escape',
    });
    act(() => {
      fireEvent(getByTestId('elsewhere'), escape);
    });
    expect(queryByTestId('inside')).toBeNull();
    expect(escape.defaultPrevented).toBe(false);
  });

  it('claims an Escape pressed on the field it opens from', () => {
    const { getByTestId } = render(<Harness />);
    const escape = createEvent.keyDown(getByTestId('anchor'), {
      key: 'Escape',
    });
    act(() => {
      fireEvent(getByTestId('anchor'), escape);
    });
    expect(escape.defaultPrevented).toBe(true);
  });

  it('does not close on Escape when closeOnEscape=false', () => {
    const { queryByTestId } = render(<Harness closeOnEscape={false} />);
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(queryByTestId('inside')).not.toBeNull();
  });

  it('closes on Alt+ArrowUp from inside, but not on a plain ArrowUp', () => {
    const { getByTestId, queryByTestId } = render(<Harness />);
    act(() => {
      fireEvent.keyDown(getByTestId('inside'), { key: 'ArrowUp' });
    });
    expect(queryByTestId('inside')).not.toBeNull();
    act(() => {
      fireEvent.keyDown(getByTestId('inside'), {
        key: 'ArrowUp',
        altKey: true,
      });
    });
    expect(queryByTestId('inside')).toBeNull();
  });

  it('keeps Alt+ArrowUp with Escape under closeOnEscape=false', () => {
    const { queryByTestId } = render(<Harness closeOnEscape={false} />);
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowUp', altKey: true });
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

  it.each([
    ['the element the selector matches', '.second', 'second'],
    ['the first tab stop when nothing matches', '.missing', 'first'],
  ])('opens with focus on %s', (_case, selector, expected) => {
    const anchorRef = { current: document.createElement('div') };
    const { getByRole } = render(
      <PickerPopover
        isOpen
        onClose={() => {}}
        anchorRef={anchorRef}
        ariaLabel="initial"
        initialFocusSelector={selector}
      >
        <button>first</button>
        <button className="second">second</button>
      </PickerPopover>
    );
    expect(getByRole('button', { name: expected })).toHaveFocus();
  });

  // A panel can hold more than the calendar, as DateTimeInput's does.
  it.each([
    ['day', 'data-focused', 'grid'],
    ['year', 'data-focused-year', 'listbox'],
  ] as const)(
    'opens a %s calendar on its own focused cell, not another marked one',
    (granularity, attribute, role) => {
      const anchorRef = { current: document.createElement('div') };
      const { getByRole } = render(
        <PickerPopover
          isOpen
          onClose={() => {}}
          anchorRef={anchorRef}
          ariaLabel="calendar"
          initialFocusSelector={CALENDAR_FOCUSED_CELL}
        >
          <button {...{ [attribute]: 'true' }}>elsewhere</button>
          <Calendar
            granularity={granularity}
            value={null}
            focusedDate={new Date(2024, 5, 15)}
            onSelect={() => {}}
            onFocusedDateChange={() => {}}
          />
        </PickerPopover>
      );
      const cell = getByRole(role).querySelector(`[${attribute}="true"]`);
      expect(cell).not.toBeNull();
      expect(document.activeElement).toBe(cell);
    }
  );

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
// The document listeners while `onClose` changes (#1113). TimeInput and
// DateTimeInput hand the popover an inline `onClose`, which changes on every
// render of the field. The listeners used to come off and go back on with
// each one, and React can render between two listeners for one event: the
// browser runs neither a listener taken off mid-event nor one added
// mid-event, so that Escape or press never reached the popover.
// -------------------------------------------------------------------------

describe('PickerPopover while its onClose changes', () => {
  /** The popover's own listeners among a spy's calls on `document`. */
  const popoverListeners = (spy: MockInstance) =>
    spy.mock.calls.filter(
      ([type]) => type === 'keydown' || type === 'pointerdown'
    );

  /** A field that hands the popover an inline `onClose`, as TimeInput does. */
  const InlineField: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    return (
      <>
        <button ref={anchorRef} data-testid="anchor">
          anchor
        </button>
        <button data-testid="outside">outside</button>
        <PickerPopover
          isOpen
          onClose={() => onClose()}
          anchorRef={anchorRef}
          ariaLabel="inline"
        >
          <button data-testid="inside">inside</button>
        </PickerPopover>
      </>
    );
  };

  /**
   * Renders `page` while a listener added ahead of the popover's renders it
   * again during each `type` event. A browser lets React render an update
   * made in one listener before the next one runs. jsdom runs them back to
   * back, so that listener renders with `flushSync`, which does the same
   * thing synchronously.
   */
  const renderWithListenerAhead = (
    type: 'keydown' | 'pointerdown',
    page: () => React.ReactElement
  ) => {
    const renderPage: { current?: () => void } = {};
    const Page = () => {
      const [, setRenders] = useState(0);
      useEffect(() => {
        // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- stands in for the browser rendering between listeners
        renderPage.current = () => flushSync(() => setRenders(n => n + 1));
      }, []);
      return page();
    };
    // Added before the popover opens, so it runs before the popover's own.
    const ahead = () => renderPage.current?.();
    document.addEventListener(type, ahead);
    const result = render(<Page />);
    return {
      ...result,
      stop: () => document.removeEventListener(type, ahead),
    };
  };

  it('keeps its document listeners when the field renders again', () => {
    const onClose = vi.fn();
    const { rerender } = render(<InlineField onClose={onClose} />);
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    try {
      rerender(<InlineField onClose={onClose} />);
      expect(popoverListeners(addSpy)).toHaveLength(0);
      expect(popoverListeners(removeSpy)).toHaveLength(0);
    } finally {
      addSpy.mockRestore();
      removeSpy.mockRestore();
    }
  });

  it.each([
    ['Escape', () => fireEvent.keyDown(document, { key: 'Escape' })],
    [
      'Alt+ArrowUp',
      () => fireEvent.keyDown(document, { key: 'ArrowUp', altKey: true }),
    ],
    [
      'a press outside',
      () => fireEvent.pointerDown(screen.getByTestId('outside')),
    ],
  ])('calls the onClose of its latest render on %s', (_, press) => {
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = render(<InlineField onClose={first} />);
    rerender(<InlineField onClose={latest} />);
    act(() => {
      press();
    });
    expect(latest).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  it.each([
    [
      'Escape',
      'keydown',
      () =>
        fireEvent.keyDown(document.activeElement as Element, {
          key: 'Escape',
        }),
    ],
    [
      'a press outside',
      'pointerdown',
      () => fireEvent.pointerDown(screen.getByTestId('outside')),
    ],
  ] as const)(
    'hears %s when a listener ahead of its own renders the field',
    (_, type, press) => {
      const onClose = vi.fn();
      const { stop } = renderWithListenerAhead(type, () => (
        <InlineField onClose={onClose} />
      ));
      try {
        act(() => {
          press();
        });
        expect(onClose).toHaveBeenCalledTimes(1);
      } finally {
        stop();
      }
    }
  );

  const clickField = () => fireEvent.click(screen.getByRole('combobox'));

  // DateInput and DateRangeInput memoize the `onClose` they hand it, but on
  // the caller's own `onOpen` and `onClose`, so an inline one of those
  // changes it on every render of the page.
  it.each([
    ['TimeInput', () => <TimeInput label="Start" />, clickField],
    ['DateTimeInput', () => <DateTimeInput label="Start" />, clickField],
    [
      'DateInput with an inline onClose',
      () => <DateInput label="Start" onClose={() => {}} />,
      clickField,
    ],
    [
      'DateRangeInput with an inline onClose',
      () => <DateRangeInput label="Stay" onClose={() => {}} />,
      () =>
        fireEvent.focus(screen.getByRole('combobox', { name: 'Start date' })),
    ],
  ])(
    'closes a %s on an Escape that a listener ahead of its own renders the page during',
    (_, field, open) => {
      const { stop } = renderWithListenerAhead('keydown', field);
      try {
        open();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        act(() => {
          fireEvent.keyDown(document.activeElement as Element, {
            key: 'Escape',
          });
        });
        expect(screen.queryByRole('dialog')).toBeNull();
      } finally {
        stop();
      }
    }
  );
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
    vi.restoreAllMocks();
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
    /** `default` leaves the prop out. */
    position?:
      | 'auto'
      | 'bottom-left'
      | 'bottom-right'
      | 'top-left'
      | 'top-right'
      | 'default';
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
          position={position === 'default' ? undefined : position}
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
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(anchorRect);
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(
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
    // Fixed-position math: top = anchor bottom, left = anchor right − width.
    // The gap is the stylesheet's margin, not part of the coordinates.
    expect(dialog.style.top).toBe('70px');
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
    // top = anchor top − height, left = anchor left.
    expect(dialog.style.top).toBe('580px');
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
    // top = anchor top − height, left = anchor right − width.
    expect(dialog.style.top).toBe('580px');
    expect(dialog.style.left).toBe('760px');
  });

  it('lines an explicit bottom-left up with the physical left', () => {
    setViewport(1000, 1000);
    const { getByRole } = renderWithRects(
      <PositionedHarness position="bottom-left" />,
      makeRect({ top: 50, bottom: 70, left: 900, right: 960 }),
      { width: 200, height: 300 }
    );
    const dialog = getByRole('dialog');
    expect(dialog.className).toMatch(/is-bottom-left/);
    expect(dialog.style.left).toBe('900px');
    expect(dialog.style.top).toBe('70px');
  });

  /** Runs a test on a right-to-left page. jsdom maps no `dir` to `direction`. */
  const rightToLeft = (test: () => void) => {
    const style = document.createElement('style');
    style.textContent = '[dir="rtl"] { direction: rtl; }';
    document.head.appendChild(style);
    document.documentElement.setAttribute('dir', 'rtl');
    try {
      test();
    } finally {
      document.documentElement.removeAttribute('dir');
      style.remove();
    }
  };

  it('lines the default up with the right edge on a right-to-left page', () => {
    rightToLeft(() => {
      setViewport(1000, 1000);
      const { getByRole } = renderWithRects(
        <PositionedHarness position="default" />,
        makeRect({ top: 50, bottom: 70, left: 900, right: 960 }),
        { width: 200, height: 300 }
      );
      const dialog = getByRole('dialog');
      expect(dialog).toHaveClass('is-bottom-left', 'is-start-aligned');
      // 960 - 200. Lined up on the left it would start at 900 and run the
      // 200px panel off the 1000px viewport.
      expect(dialog.style.left).toBe('760px');
      expect(dialog.style.top).toBe('70px');
    });
  });

  it('marks only the default as start aligned, for the stylesheet to place', () => {
    const { getByRole, unmount } = render(
      <PositionedHarness position="default" appendToBody={false} />
    );
    expect(getByRole('dialog')).toHaveClass(
      'is-bottom-left',
      'is-start-aligned'
    );
    unmount();
    render(<PositionedHarness position="bottom-left" appendToBody={false} />);
    expect(screen.getByRole('dialog')).not.toHaveClass('is-start-aligned');
  });

  it('keeps an explicit bottom-left physical on a right-to-left page', () => {
    rightToLeft(() => {
      setViewport(1000, 1000);
      const { getByRole } = renderWithRects(
        <PositionedHarness position="bottom-left" />,
        makeRect({ top: 50, bottom: 70, left: 400, right: 460 }),
        { width: 200, height: 300 }
      );
      const dialog = getByRole('dialog');
      expect(dialog.className).toMatch(/is-bottom-left/);
      expect(dialog.style.left).toBe('400px');
    });
  });

  it('keeps an explicit bottom-right physical on a right-to-left page', () => {
    rightToLeft(() => {
      setViewport(1000, 1000);
      const { getByRole } = renderWithRects(
        <PositionedHarness position="bottom-right" />,
        makeRect({ top: 50, bottom: 70, left: 400, right: 460 }),
        { width: 200, height: 300 }
      );
      expect(getByRole('dialog').className).toMatch(/is-bottom-right/);
      expect(getByRole('dialog').style.left).toBe('260px');
    });
  });

  it('measures auto against the physical sides on a right-to-left page', () => {
    rightToLeft(() => {
      setViewport(1000, 1000);
      const { getByRole } = renderWithRects(
        <PositionedHarness position="auto" />,
        makeRect({ top: 50, bottom: 70, left: 100, right: 160 }),
        { width: 200, height: 300 }
      );
      // 100 + 200 fits, so auto keeps the left edges, as left to right.
      expect(getByRole('dialog').className).toMatch(/is-bottom-left/);
      expect(getByRole('dialog').style.left).toBe('100px');
    });
  });

  it('lines the default up with the left edge left to right', () => {
    setViewport(1000, 1000);
    const { getByRole } = renderWithRects(
      <PositionedHarness position="default" />,
      makeRect({ top: 50, bottom: 70, left: 400, right: 460 }),
      { width: 200, height: 300 }
    );
    expect(getByRole('dialog').className).toMatch(/is-bottom-left/);
    expect(getByRole('dialog').style.left).toBe('400px');
  });

  // Each field leaves its `position` unset unless the caller sets one, so
  // the popover can line up with the field's start edge.
  it.each([
    ['DateInput', (p: object) => <DateInput label="Date" {...p} />],
    ['TimeInput', (p: object) => <TimeInput label="Time" {...p} />],
    ['DateTimeInput', (p: object) => <DateTimeInput label="When" {...p} />],
    ['DateRangeInput', (p: object) => <DateRangeInput label="Stay" {...p} />],
    ['ColorInput', (p: object) => <ColorInput label="Color" {...p} />],
    [
      'TreeSelect',
      (p: object) => (
        <TreeSelect
          label="Place"
          data={[{ value: 'here', label: 'Here' }]}
          {...p}
        />
      ),
    ],
  ])(
    'leaves the corner of %s to the start edge by default, and to the caller once named',
    (_, field) => {
      const open = () =>
        fireEvent.keyDown(screen.getAllByRole('combobox')[0], {
          key: 'ArrowDown',
          altKey: true,
        });
      rightToLeft(() => {
        const { unmount } = render(field({ mobileNative: false }));
        open();
        expect(screen.getByRole('dialog')).toHaveClass('is-start-aligned');
        unmount();
        render(field({ mobileNative: false, position: 'bottom-left' }));
        open();
        expect(screen.getByRole('dialog')).toHaveClass('is-bottom-left');
        expect(screen.getByRole('dialog')).not.toHaveClass('is-start-aligned');
      });
    }
  );

  it('reads the direction a LocaleProvider sets for the default', () => {
    const style = document.createElement('style');
    style.textContent = '[dir="rtl"] { direction: rtl; }';
    document.head.appendChild(style);
    try {
      setViewport(1000, 1000);
      const { getByRole } = renderWithRects(
        <LocaleProvider locale="ar" dir="rtl">
          <PositionedHarness position="default" />
        </LocaleProvider>,
        makeRect({ top: 50, bottom: 70, left: 900, right: 960 }),
        { width: 200, height: 300 }
      );
      expect(getByRole('dialog').style.left).toBe('760px');
    } finally {
      style.remove();
    }
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
    expect(dialog.style.top).toBe('70px');
    expect(dialog.style.left).toBe('80px');
  });

  it('auto leaves room below for the gap the stylesheet puts on a portaled panel', () => {
    setViewport(1000, 1000);
    const result = render(<PositionedHarness />);
    const dialog = result.getByRole('dialog');
    // The margin `--bulma-picker-popover-offset: 20px` would give it.
    dialog.style.marginTop = '20px';
    vi.spyOn(
      result.getByTestId('anchor'),
      'getBoundingClientRect'
    ).mockReturnValue(
      makeRect({ top: 670, bottom: 690, left: 50, right: 110 })
    );
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(
      makeRect({ top: 0, left: 0, right: 200, bottom: 300 })
    );
    act(() => {
      fireEvent(window, new Event('resize'));
    });
    // 690 + 300 fits the 1000px viewport, but not with the 20px gap as well.
    expect(dialog.className).toMatch(/is-top-left/);
  });

  it('auto leaves room below an in-place panel for its margin and no more', () => {
    setViewport(1000, 1000);
    const result = render(<PositionedHarness appendToBody={false} />);
    const dialog = result.getByRole('dialog');
    // The margin `--bulma-picker-popover-offset: 20px` would give it.
    dialog.style.marginTop = '20px';
    vi.spyOn(
      result.getByTestId('anchor'),
      'getBoundingClientRect'
    ).mockReturnValue(
      makeRect({ top: 660, bottom: 680, left: 50, right: 110 })
    );
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(
      makeRect({ top: 0, left: 0, right: 200, bottom: 300 })
    );
    act(() => {
      fireEvent(window, new Event('resize'));
    });
    // 680 + 300 + 20 fills the 1000px viewport exactly.
    expect(dialog.className).toMatch(/is-bottom-left/);
    expect(dialog.style.top).toBe('');
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
    (getByTestId('anchor').getBoundingClientRect as Mock).mockReturnValue(
      makeRect({ top: 880, bottom: 900, left: 900, right: 960 })
    );
    act(() => {
      fireEvent.scroll(window);
    });
    expect(dialog.className).toMatch(/is-top-right/);
    expect(dialog.style.top).toBe('580px');
    expect(dialog.style.left).toBe('760px');
  });
});

describe('PickerPopover hydration', () => {
  it('hydrates a portaled panel that is open on the first render in place, then moves it', async () => {
    const app = <Harness appendToBody />;
    const container = document.createElement('div');
    container.innerHTML = renderToString(app);
    document.body.appendChild(container);

    // The server renders it in place, so the hydrating render has markup to
    // match.
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onRecoverableError = vi.fn();
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, app, { onRecoverableError });
        unmountRoot = () => root.unmount();
      });

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
      // Then it moved into document.body.
      expect(container.querySelector('[role="dialog"]')).toBeNull();
      const panel = document.body.querySelector('[role="dialog"]');
      expect(panel?.parentElement).toBe(document.body);
    } finally {
      await act(async () => unmountRoot());
      errorSpy.mockRestore();
      container.remove();
    }
  });
});
