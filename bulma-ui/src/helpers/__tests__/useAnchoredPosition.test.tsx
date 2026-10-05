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
      jest
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockImplementation(function (this: HTMLElement) {
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
      jest.restoreAllMocks();
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
