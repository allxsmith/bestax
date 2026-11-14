import { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { marginGap, useAnchoredPosition } from '../useAnchoredPosition';
import type { PickerPosition } from '../../form/_pickerInternals/pickerTypes';

/** Measures with neither element on the page. */
const Detached = ({ position }: { position: PickerPosition }) => {
  const anchorRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const resolved = useAnchoredPosition(anchorRef, panelRef, {
    active: true,
    position,
    fixed: true,
  });
  return <output>{JSON.stringify(resolved)}</output>;
};

/** Resolves `auto` for a 300px-tall panel under an anchor ending at 694px. */
const Attached = ({
  styledGap,
}: {
  styledGap?: (panel: HTMLElement) => number;
}) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resolved = useAnchoredPosition(anchorRef, panelRef, {
    active: true,
    position: 'auto',
    fixed: false,
    styledGap,
  });
  return (
    <>
      <button ref={anchorRef}>anchor</button>
      <div ref={panelRef} />
      <output>{resolved.position}</output>
    </>
  );
};

describe('useAnchoredPosition', () => {
  it('keeps its last placement when there is nothing to measure', () => {
    const { rerender } = render(<Detached position="auto" />);
    expect(screen.getByRole('status')).toHaveTextContent(
      '{"position":"bottom-left"}'
    );
    rerender(<Detached position="top-right" />);
    expect(screen.getByRole('status')).toHaveTextContent(
      '{"position":"bottom-left"}'
    );
  });

  it('starts at the corner asked for', () => {
    render(<Detached position="top-right" />);
    expect(screen.getByRole('status')).toHaveTextContent(
      '{"position":"top-right"}'
    );
  });

  describe('auto with a styled gap', () => {
    const innerHeight = window.innerHeight;

    beforeEach(() => {
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 1000,
      });
      vi.spyOn(
        HTMLElement.prototype,
        'getBoundingClientRect'
      ).mockImplementation(function (this: HTMLElement) {
        const button = this.tagName === 'BUTTON';
        return {
          top: button ? 674 : 0,
          bottom: button ? 694 : 300,
          left: 0,
          right: 100,
          width: 100,
          height: button ? 20 : 300,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect;
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: innerHeight,
      });
    });

    it('leaves room for the offset alone without one', () => {
      // 694 + 300 + 4 fits the 1000px viewport.
      render(<Attached />);
      expect(screen.getByRole('status')).toHaveTextContent('bottom-left');
    });

    it('leaves room for the gap it reports as well', () => {
      // 694 + 300 + 4 + 10 does not.
      render(<Attached styledGap={() => 10} />);
      expect(screen.getByRole('status')).toHaveTextContent('top-left');
    });
  });
});

/** A fixed panel of a given width, placed against a 300px-wide anchor. */
const Matched = ({
  position,
  panelWidth,
}: {
  position: PickerPosition;
  panelWidth: number;
}) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resolved = useAnchoredPosition(anchorRef, panelRef, {
    active: true,
    position,
    fixed: true,
    offset: 0,
    matchWidth: true,
  });
  return (
    <>
      <button ref={anchorRef} data-width="300">
        anchor
      </button>
      <div ref={panelRef} data-width={panelWidth} />
      <output>{JSON.stringify(resolved)}</output>
    </>
  );
};

describe('useAnchoredPosition with matchWidth', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        const button = this.tagName === 'BUTTON';
        const width = Number(this.dataset.width);
        return {
          top: button ? 200 : 0,
          bottom: button ? 236 : 150,
          left: button ? 500 : 0,
          right: button ? 800 : width,
          width,
          height: button ? 36 : 150,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect;
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('carries the anchor width, and lines a right corner up at that width', () => {
    render(<Matched position="top-right" panelWidth={120} />);
    expect(JSON.parse(screen.getByRole('status').textContent!)).toEqual({
      position: 'top-right',
      top: 50,
      left: 500,
      minWidth: 300,
    });
  });

  it('keeps a wider panel its own width', () => {
    render(<Matched position="bottom-right" panelWidth={400} />);
    expect(JSON.parse(screen.getByRole('status').textContent!)).toEqual({
      position: 'bottom-right',
      top: 236,
      left: 400,
      minWidth: 300,
    });
  });
});

/** A fixed panel above an anchor at 500 to 520px, as tall as its `data-height`. */
const Above = ({
  height,
  followContent,
  panelKey,
}: {
  height: number;
  followContent?: boolean;
  /** A new key replaces the panel element, as a portal that moves does. */
  panelKey?: string;
}) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resolved = useAnchoredPosition(anchorRef, panelRef, {
    active: true,
    position: 'top-left',
    fixed: true,
    offset: 0,
    followContent,
  });
  return (
    <>
      <button ref={anchorRef}>anchor</button>
      <div key={panelKey} ref={panelRef} data-height={height} />
      <output>{resolved.top}</output>
    </>
  );
};

/** Gives `Above`'s anchor and panel their rects, the panel's from `data-height`. */
const mockRects = () =>
  vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      const button = this.tagName === 'BUTTON';
      const height = button ? 20 : Number(this.dataset.height);
      return {
        top: button ? 500 : 0,
        bottom: button ? 520 : height,
        left: 0,
        right: 100,
        width: 100,
        height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect;
    });

describe('followContent', () => {
  beforeEach(() => {
    mockRects();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('places a panel above again when its height changes after it opened', () => {
    const { rerender } = render(<Above height={200} followContent />);
    expect(screen.getByRole('status')).toHaveTextContent('300');
    rerender(<Above height={80} followContent />);
    expect(screen.getByRole('status')).toHaveTextContent('420');
  });

  it('measures nothing after a render by default', () => {
    const { rerender } = render(<Above height={200} />);
    expect(screen.getByRole('status')).toHaveTextContent('300');
    rerender(<Above height={80} />);
    expect(screen.getByRole('status')).toHaveTextContent('300');
  });
});

describe('following the panel and the anchor', () => {
  /** A ResizeObserver the tests fire by hand. */
  class MockResizeObserver {
    static instances: MockResizeObserver[] = [];
    observed: Element[] = [];
    disconnected = false;
    constructor(private callback: ResizeObserverCallback) {
      MockResizeObserver.instances.push(this);
    }
    observe(target: Element) {
      this.observed.push(target);
    }
    unobserve(target: Element) {
      this.observed = this.observed.filter(watched => watched !== target);
    }
    disconnect() {
      this.disconnected = true;
    }
    /** Reports a change in size, as the browser does after layout. */
    fire() {
      this.callback([], this as unknown as ResizeObserver);
    }
  }
  const observer = () =>
    MockResizeObserver.instances[MockResizeObserver.instances.length - 1];

  let rects: ReturnType<typeof mockRects>;
  beforeEach(() => {
    vi.useFakeTimers();
    rects = mockRects();
    MockResizeObserver.instances = [];
    (window as { ResizeObserver?: unknown }).ResizeObserver =
      MockResizeObserver;
  });

  afterEach(() => {
    delete (window as { ResizeObserver?: unknown }).ResizeObserver;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const panel = () => document.querySelector('[data-height]') as HTMLElement;
  const nextFrame = () => act(() => vi.advanceTimersToNextFrame());

  it('follows its own content changing size, in the next frame', () => {
    render(<Above height={200} />);
    expect(screen.getByRole('status')).toHaveTextContent('300');

    // Nothing renders: the content grew by itself, as a loaded image does.
    panel().dataset.height = '80';
    act(() => observer().fire());
    expect(screen.getByRole('status')).toHaveTextContent('300');
    nextFrame();
    expect(screen.getByRole('status')).toHaveTextContent('420');
  });

  it('watches the anchor as well as the panel, and lets go as it closes', () => {
    const { unmount } = render(<Above height={200} />);
    expect(observer().observed).toEqual([screen.getByRole('button'), panel()]);
    unmount();
    expect(observer().disconnected).toBe(true);
  });

  it('watches a panel that replaces the one it opened with, from the next measurement', () => {
    // A portal moving to another target remounts the panel, as one that
    // opens with the dialog it's in does, and nothing renders the hook.
    const { rerender } = render(<Above height={200} panelKey="first" />);
    const first = panel();
    rerender(<Above height={200} panelKey="second" />);
    const second = panel();
    expect(second).not.toBe(first);

    // The anchor's first report, after layout, measures again. Compared by
    // identity: the two panels are equal nodes.
    act(() => observer().fire());
    nextFrame();
    const [anchor, watched, ...rest] = observer().observed;
    expect(anchor).toBe(screen.getByRole('button'));
    expect(watched).toBe(second);
    expect(rest).toHaveLength(0);
  });

  it('measures once a frame, however many scrolls, resizes and size changes ask', () => {
    render(<Above height={200} />);
    rects.mockClear();

    act(() => {
      fireEvent.scroll(window);
      fireEvent.scroll(window);
      fireEvent(window, new Event('resize'));
      observer().fire();
    });
    expect(rects).not.toHaveBeenCalled();
    nextFrame();
    // One measurement reads the anchor and the panel once each.
    expect(rects).toHaveBeenCalledTimes(2);
  });

  it('drops the frame it asked for when it closes', () => {
    const { unmount } = render(<Above height={200} />);
    rects.mockClear();
    act(() => {
      fireEvent.scroll(window);
    });
    unmount();
    nextFrame();
    expect(rects).not.toHaveBeenCalled();
  });
});

describe('marginGap', () => {
  const panel = (style: Partial<CSSStyleDeclaration>) => {
    const el = document.createElement('div');
    Object.assign(el.style, style);
    document.body.appendChild(el);
    return el;
  };

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('reads the larger margin magnitude, so a negative gap above counts', () => {
    expect(marginGap(panel({ marginTop: '-6px', marginBottom: '2px' }))).toBe(
      6
    );
    expect(marginGap(panel({ marginBottom: '8px' }))).toBe(8);
  });

  it('reads no gap from a panel without margins', () => {
    expect(marginGap(panel({}))).toBe(0);
  });
});
