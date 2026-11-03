import { useRef } from 'react';
import { render, screen } from '@testing-library/react';
import {
  marginGap,
  sideMarginGap,
  useAnchoredPosition,
} from '../useAnchoredPosition';
import type { AnchoredSide } from '../useAnchoredPosition';
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

  it('keeps its placement with a panel and no anchor, unless asked to center', () => {
    const PanelOnly = () => {
      const anchorRef = useRef<HTMLElement>(null);
      const panelRef = useRef<HTMLDivElement>(null);
      const resolved = useAnchoredPosition(anchorRef, panelRef, {
        active: true,
        position: 'top-left',
        fixed: true,
      });
      return (
        <>
          <div ref={panelRef} />
          <output>{JSON.stringify(resolved)}</output>
        </>
      );
    };
    render(<PanelOnly />);
    expect(screen.getByRole('status')).toHaveTextContent(
      '{"position":"top-left"}'
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

    it('keeps a corner panel below when only its inline margin is large', () => {
      // With `marginGap`, a 50px left margin doesn't count, so 694 + 300 + 4
      // still fits and the panel stays below.
      const Margined = () => {
        const anchorRef = useRef<HTMLButtonElement>(null);
        const panelRef = useRef<HTMLDivElement>(null);
        const resolved = useAnchoredPosition(anchorRef, panelRef, {
          active: true,
          position: 'auto',
          fixed: false,
          styledGap: marginGap,
        });
        return (
          <>
            <button ref={anchorRef}>anchor</button>
            <div ref={panelRef} style={{ marginLeft: '-50px' }} />
            <output>{resolved.position}</output>
          </>
        );
      };
      render(<Margined />);
      expect(screen.getByRole('status')).toHaveTextContent('bottom-left');
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

describe('followContent', () => {
  /** A fixed panel above an anchor at 500 to 520px, as tall as its `data-height`. */
  const Above = ({
    height,
    followContent,
  }: {
    height: number;
    followContent?: boolean;
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
        <div ref={panelRef} data-height={height} />
        <output>{resolved.top}</output>
      </>
    );
  };

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
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
      }
    );
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

  it('keeps the placement it opened with by default', () => {
    const { rerender } = render(<Above height={200} />);
    expect(screen.getByRole('status')).toHaveTextContent('300');
    rerender(<Above height={80} />);
    expect(screen.getByRole('status')).toHaveTextContent('300');
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

  it('leaves the inline margins out, so a corner panel’s gap is its block margin', () => {
    expect(marginGap(panel({ marginLeft: '-12px', marginTop: '3px' }))).toBe(3);
    expect(marginGap(panel({ marginRight: '5px' }))).toBe(0);
  });

  it('reads the inline margins too for a panel placed on a side', () => {
    expect(
      sideMarginGap(panel({ marginLeft: '-12px', marginTop: '3px' }))
    ).toBe(12);
    expect(sideMarginGap(panel({ marginRight: '5px' }))).toBe(5);
    expect(sideMarginGap(panel({ marginBottom: '-9px' }))).toBe(9);
    expect(sideMarginGap(panel({}))).toBe(0);
  });

  it('reads no gap from a panel without margins', () => {
    expect(marginGap(panel({}))).toBe(0);
  });
});

describe('useAnchoredPosition on a side', () => {
  /**
   * A 100 by 50 panel against an anchor at 400 to 500 across and 300 to 340
   * down, in a 1000 by 800 client area, unless a test moves the anchor.
   */
  const Side = ({
    position,
    fixed = true,
    styledGap,
    rtl = false,
  }: {
    position: AnchoredSide;
    fixed?: boolean;
    styledGap?: (panel: HTMLElement) => number;
    rtl?: boolean;
  }) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const resolved = useAnchoredPosition(anchorRef, panelRef, {
      active: true,
      position,
      fixed,
      offset: 4,
      styledGap,
    });
    return (
      <>
        <button ref={anchorRef} dir={rtl ? 'rtl' : undefined} type="button">
          anchor
        </button>
        <div ref={panelRef} />
        <output>{JSON.stringify(resolved)}</output>
      </>
    );
  };

  const read = () => JSON.parse(screen.getByRole('status').textContent!);
  const root = document.documentElement;
  let anchor = { top: 300, left: 400, width: 100, height: 40 };

  beforeEach(() => {
    anchor = { top: 300, left: 400, width: 100, height: 40 };
    Object.defineProperty(root, 'clientWidth', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(root, 'clientHeight', {
      configurable: true,
      value: 800,
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        const box =
          this.tagName === 'BUTTON'
            ? anchor
            : { top: 0, left: 0, width: 100, height: 50 };
        return {
          ...box,
          bottom: box.top + box.height,
          right: box.left + box.width,
          x: box.left,
          y: box.top,
          toJSON: () => ({}),
        } as DOMRect;
      }
    );
    // jsdom has no `direction` of its own, so the `dir` attribute stands in.
    const computed = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      (el: Element, pseudo?: string | null) => {
        const style = computed(el, pseudo);
        if (el.getAttribute('dir') !== 'rtl') return style;
        return { ...style, direction: 'rtl' } as CSSStyleDeclaration;
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Back to jsdom's own, which reads 0.
    Reflect.deleteProperty(root, 'clientWidth');
    Reflect.deleteProperty(root, 'clientHeight');
  });

  it('centers the panel below, above, and beside the anchor', () => {
    const { rerender } = render(<Side position="bottom" />);
    expect(read()).toEqual({ position: 'bottom', top: 344, left: 400 });
    rerender(<Side position="top" />);
    expect(read()).toEqual({ position: 'top', top: 246, left: 400 });
    rerender(<Side position="right" />);
    expect(read()).toEqual({ position: 'right', top: 295, left: 504 });
    rerender(<Side position="left" />);
    expect(read()).toEqual({ position: 'left', top: 295, left: 296 });
  });

  it('swaps left and right under right-to-left text', () => {
    const { rerender } = render(<Side position="left" rtl />);
    expect(read()).toEqual({ position: 'right', top: 295, left: 504 });
    rerender(<Side position="right" rtl />);
    expect(read()).toEqual({ position: 'left', top: 295, left: 296 });
    rerender(<Side position="top" rtl />);
    expect(read().position).toBe('top');
  });

  it('flips to the opposite side when only that one has room', () => {
    anchor = { top: 740, left: 900, width: 100, height: 40 };
    const { rerender } = render(<Side position="bottom" />);
    expect(read()).toEqual({ position: 'top', top: 686, left: 900 });
    rerender(<Side position="right" />);
    expect(read()).toEqual({ position: 'left', top: 735, left: 796 });
  });

  it('stays on the side asked for when neither has room, inside the viewport', () => {
    // As tall as the client area, so there's no room above or below it, and
    // centered under it the panel would start 40px off the left edge.
    anchor = { top: 0, left: -40, width: 100, height: 800 };
    render(<Side position="bottom" />);
    expect(read()).toEqual({ position: 'bottom', top: 750, left: 0 });
  });

  it('counts the stylesheet’s gap for the fit and leaves it out of the coordinates', () => {
    anchor = { top: 690, left: 400, width: 100, height: 40 };
    const { rerender } = render(<Side position="bottom" />);
    // 730 + 4 + 50 fits under 800.
    expect(read()).toEqual({ position: 'bottom', top: 734, left: 400 });
    rerender(<Side position="bottom" styledGap={() => 20} />);
    // 730 + 24 + 50 doesn't, so it goes above, and the margin lifts it the
    // last 20px from 636.
    expect(read()).toEqual({ position: 'top', top: 636, left: 400 });
  });

  it('keeps the gap when the panel is moved back inside the viewport', () => {
    // Pushed past the bottom edge below the anchor, the panel is moved up to
    // end at 800 once its 10px margin has moved it down.
    anchor = { top: 0, left: 400, width: 100, height: 800 };
    render(<Side position="bottom" styledGap={() => 10} />);
    expect(read()).toEqual({ position: 'bottom', top: 740, left: 400 });
  });

  it('centers a panel in the viewport without an anchor, kept inside it', () => {
    const Centered = () => {
      const anchorRef = useRef<HTMLElement>(null);
      const panelRef = useRef<HTMLDivElement>(null);
      const resolved = useAnchoredPosition(anchorRef, panelRef, {
        active: true,
        position: 'center',
        fixed: true,
      });
      return (
        <>
          <div ref={panelRef} />
          <output>{JSON.stringify(resolved)}</output>
        </>
      );
    };
    const { unmount } = render(<Centered />);
    expect(read()).toEqual({ position: 'center', top: 375, left: 450 });
    unmount();
    // A viewport smaller than the panel puts it at the top left.
    Object.defineProperty(root, 'clientWidth', {
      configurable: true,
      value: 80,
    });
    Object.defineProperty(root, 'clientHeight', {
      configurable: true,
      value: 30,
    });
    render(<Centered />);
    expect(read()).toEqual({ position: 'center', top: 0, left: 0 });
  });

  it('gives a panel in place the side alone', () => {
    render(<Side position="left" fixed={false} />);
    expect(read()).toEqual({ position: 'left' });
  });

  it('starts at the side asked for before anything is measured', () => {
    const SideDetached = () => {
      const anchorRef = useRef<HTMLElement>(null);
      const panelRef = useRef<HTMLElement>(null);
      const resolved = useAnchoredPosition(anchorRef, panelRef, {
        active: true,
        position: 'left',
        fixed: true,
      });
      return <p>{resolved.position}</p>;
    };
    render(<SideDetached />);
    expect(screen.getByText('left')).toBeInTheDocument();
  });
});
