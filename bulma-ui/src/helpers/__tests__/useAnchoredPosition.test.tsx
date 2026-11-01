import { useRef } from 'react';
import { render, screen } from '@testing-library/react';
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

  it('reads no gap from a panel without margins', () => {
    expect(marginGap(panel({}))).toBe(0);
  });
});
