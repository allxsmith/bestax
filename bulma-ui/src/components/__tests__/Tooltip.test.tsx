import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('renders the tooltip wrapper', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('renders tooltip content with label', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(
        'Test tooltip'
      );
    });

    it('has data-tooltip attribute with label', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveAttribute(
        'data-tooltip',
        'Test tooltip'
      );
    });
  });

  describe('visibility', () => {
    it('is hidden by default', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveClass('is-active');
    });

    it('becomes visible on mouse enter', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.mouseEnter(container.querySelector('.tooltip')!);
      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-active');
    });

    it('hides on mouse leave', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      fireEvent.mouseEnter(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toHaveClass('is-active');

      fireEvent.mouseLeave(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).not.toHaveClass('is-active');
    });

    it('becomes visible on focus', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.focus(container.querySelector('.tooltip')!);
      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-active');
    });

    it('hides on blur', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      fireEvent.focus(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toHaveClass('is-active');

      fireEvent.blur(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).not.toHaveClass('is-active');
    });
  });

  describe('always active', () => {
    it('is always visible when active prop is true', () => {
      const { container } = render(
        <Tooltip label="Test tooltip" active>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-active');
    });

    it('stays visible on mouse leave when active', () => {
      const { container } = render(
        <Tooltip label="Test tooltip" active>
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      fireEvent.mouseEnter(tooltip);
      fireEvent.mouseLeave(tooltip);
      act(() => {
        jest.runAllTimers();
      });

      expect(tooltip).toHaveClass('is-active');
    });
  });

  describe('positions', () => {
    it.each(['top', 'bottom', 'left', 'right'] as const)(
      'applies is-%s class when position="%s"',
      position => {
        const { container } = render(
          <Tooltip label="Test" position={position}>
            <button>Hover me</button>
          </Tooltip>
        );
        expect(container.querySelector('.tooltip')).toHaveClass(
          `is-${position}`
        );
      }
    );

    it('defaults to top position', () => {
      const { container } = render(
        <Tooltip label="Test">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-top');
    });
  });

  describe('colors', () => {
    it.each([
      'primary',
      'link',
      'info',
      'success',
      'warning',
      'danger',
      'dark',
      'light',
    ] as const)('applies is-%s class when color="%s"', color => {
      const { container } = render(
        <Tooltip label="Test" color={color}>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass(`is-${color}`);
    });
  });

  describe('sizes', () => {
    it.each(['small', 'medium', 'large'] as const)(
      'applies is-%s class when size="%s"',
      size => {
        const { container } = render(
          <Tooltip label="Test" size={size}>
            <button>Hover me</button>
          </Tooltip>
        );
        expect(container.querySelector('.tooltip')).toHaveClass(`is-${size}`);
      }
    );

    it('does not apply size class by default', () => {
      const { container } = render(
        <Tooltip label="Test">
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltip = container.querySelector('.tooltip');
      expect(tooltip).not.toHaveClass('is-small');
      expect(tooltip).not.toHaveClass('is-medium');
      expect(tooltip).not.toHaveClass('is-large');
    });
  });

  describe('multiline', () => {
    it('applies is-multiline class when multiline is true', () => {
      const { container } = render(
        <Tooltip label="Long tooltip text" multiline>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-multiline');
    });

    it('does not apply is-multiline class when multiline is false', () => {
      const { container } = render(
        <Tooltip label="Test" multiline={false}>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveClass(
        'is-multiline'
      );
    });
  });

  describe('animated', () => {
    it('applies is-animated class by default', () => {
      const { container } = render(
        <Tooltip label="Test">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-animated');
    });

    it('does not apply is-animated class when animated is false', () => {
      const { container } = render(
        <Tooltip label="Test" animated={false}>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveClass(
        'is-animated'
      );
    });
  });

  describe('square', () => {
    it('applies is-square class when square is true', () => {
      const { container } = render(
        <Tooltip label="Test" square>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-square');
    });

    it('does not apply is-square class by default', () => {
      const { container } = render(
        <Tooltip label="Test">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveClass('is-square');
    });
  });

  describe('dashed', () => {
    it('applies is-dashed class when dashed is true', () => {
      const { container } = render(
        <Tooltip label="Test" dashed>
          <span>Hover me</span>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-dashed');
    });

    it('does not apply is-dashed class by default', () => {
      const { container } = render(
        <Tooltip label="Test">
          <span>Hover me</span>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveClass('is-dashed');
    });
  });

  describe('delay', () => {
    it('shows tooltip immediately when delay is 0', () => {
      const { container } = render(
        <Tooltip label="Test" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.mouseEnter(container.querySelector('.tooltip')!);
      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-active');
    });

    it('delays showing tooltip when delay is set', () => {
      const { container } = render(
        <Tooltip label="Test" delay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.mouseEnter(container.querySelector('.tooltip')!);

      // Not visible yet
      expect(container.querySelector('.tooltip')).not.toHaveClass('is-active');

      // After delay
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-active');
    });

    it('cancels delay when mouse leaves before timeout', () => {
      const { container } = render(
        <Tooltip label="Test" delay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      fireEvent.mouseEnter(tooltip);

      // Not visible yet
      expect(tooltip).not.toHaveClass('is-active');

      // Leave before delay completes
      act(() => {
        jest.advanceTimersByTime(250);
      });
      fireEvent.mouseLeave(tooltip);

      act(() => {
        jest.advanceTimersByTime(250);
      });

      // Should still not be visible
      expect(tooltip).not.toHaveClass('is-active');
    });
  });

  describe('closeDelay', () => {
    it('hides tooltip immediately when closeDelay is 0', () => {
      const { container } = render(
        <Tooltip label="Test" closeDelay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      fireEvent.mouseEnter(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toHaveClass('is-active');

      fireEvent.mouseLeave(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).not.toHaveClass('is-active');
    });

    it('delays hiding tooltip when closeDelay is set', () => {
      const { container } = render(
        <Tooltip label="Test" closeDelay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      fireEvent.mouseEnter(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toHaveClass('is-active');

      fireEvent.mouseLeave(tooltip);

      // Still visible immediately after leave
      expect(tooltip).toHaveClass('is-active');

      // Still visible before closeDelay elapses
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(tooltip).toHaveClass('is-active');

      // Hidden after closeDelay elapses
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(tooltip).not.toHaveClass('is-active');
    });

    it('cancels close delay when mouse re-enters before timeout', () => {
      const { container } = render(
        <Tooltip label="Test" closeDelay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      fireEvent.mouseEnter(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toHaveClass('is-active');

      // Leave, then re-enter before closeDelay elapses
      fireEvent.mouseLeave(tooltip);
      act(() => {
        jest.advanceTimersByTime(250);
      });
      fireEvent.mouseEnter(tooltip);
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should still be visible
      expect(tooltip).toHaveClass('is-active');
    });
  });

  describe('accessibility', () => {
    it('tooltip content has role="tooltip"', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByRole('tooltip', { hidden: true })).toBeInTheDocument();
    });

    it('tooltip content has aria-hidden="true" when not visible', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });

    it('tooltip content has aria-hidden="false" when visible', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.mouseEnter(container.querySelector('.tooltip')!);
      act(() => {
        jest.runAllTimers();
      });

      expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
        'aria-hidden',
        'false'
      );
    });

    it('tooltip content has aria-hidden="false" when always active', () => {
      render(
        <Tooltip label="Test tooltip" active>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
        'aria-hidden',
        'false'
      );
    });
  });

  describe('className handling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <Tooltip label="Test" className="custom-class">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('custom-class');
    });

    it('applies tooltipClassName to content', () => {
      render(
        <Tooltip label="Test" tooltipClassName="custom-tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByRole('tooltip', { hidden: true })).toHaveClass(
        'custom-tooltip'
      );
    });

    it('combines multiple classes correctly', () => {
      const { container } = render(
        <Tooltip
          label="Test"
          position="bottom"
          color="primary"
          multiline
          className="custom-class"
        >
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltip = container.querySelector('.tooltip');
      expect(tooltip).toHaveClass(
        'tooltip',
        'is-bottom',
        'is-primary',
        'is-multiline',
        'custom-class'
      );
    });
  });

  describe('Bulma helper classes', () => {
    it('applies Bulma helper classes from props', () => {
      const { container } = render(
        <Tooltip label="Test" m="2" p="3">
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltip = container.querySelector('.tooltip');
      expect(tooltip).toHaveClass('m-2', 'p-3');
    });
  });

  describe('HTML attributes', () => {
    it('passes through HTML attributes', () => {
      const { container } = render(
        <Tooltip label="Test" data-testid="tooltip" id="my-tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltip = container.querySelector('.tooltip');
      expect(tooltip).toHaveAttribute('data-testid', 'tooltip');
      expect(tooltip).toHaveAttribute('id', 'my-tooltip');
    });
  });

  describe('auto position resolution', () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const originalGetBoundingClientRect =
      Element.prototype.getBoundingClientRect;

    const setViewport = (width: number, height: number) => {
      Object.defineProperty(window, 'innerWidth', {
        value: width,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: height,
        writable: true,
        configurable: true,
      });
    };

    const mockRects = (
      wrapperRect: Partial<DOMRect>,
      contentRect: Partial<DOMRect> = {}
    ) => {
      Element.prototype.getBoundingClientRect = function (this: Element) {
        const isContent = this.classList.contains('tooltip-content');
        const rect = isContent ? contentRect : wrapperRect;
        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          toJSON: () => ({}),
          ...rect,
        } as DOMRect;
      };
    };

    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: originalInnerHeight,
        writable: true,
        configurable: true,
      });
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it('resolves auto position to top when there is space above', () => {
      setViewport(1024, 768);
      mockRects({ top: 100, bottom: 120, left: 500, right: 540 });

      const { container } = render(
        <Tooltip label="Test" position="auto" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-top');
    });

    it('resolves auto position to bottom when top space is too small but bottom is sufficient', () => {
      setViewport(1024, 768);
      // top space = 10 (< 40 margin), bottom space = 768 - 30 = 738 (>= 40)
      mockRects({ top: 10, bottom: 30, left: 500, right: 540 });

      const { container } = render(
        <Tooltip label="Test" position="auto" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-bottom');
    });

    it('resolves auto position to right when both vertical spaces are insufficient and right has more room', () => {
      setViewport(1024, 100);
      // top = 10 (<40), bottom = 100 - 90 = 10 (<40)
      // wrapper at left: 50, right: 90 — right space = 1024 - 90 = 934, left space = 50
      mockRects({ top: 10, bottom: 90, left: 50, right: 90 });

      const { container } = render(
        <Tooltip label="Test" position="auto" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-right');
    });

    it('resolves auto position to left when both vertical spaces are insufficient and left has more room', () => {
      setViewport(1024, 100);
      // top = 10 (<40), bottom = 100 - 90 = 10 (<40)
      // wrapper at left: 900, right: 1000 — right space = 24, left space = 900
      mockRects({ top: 10, bottom: 90, left: 900, right: 1000 });

      const { container } = render(
        <Tooltip label="Test" position="auto" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-left');
    });
  });

  describe('overflow correction', () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const originalGetBoundingClientRect =
      Element.prototype.getBoundingClientRect;
    const originalRAF = window.requestAnimationFrame;

    const setViewport = (width: number, height: number) => {
      Object.defineProperty(window, 'innerWidth', {
        value: width,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: height,
        writable: true,
        configurable: true,
      });
    };

    const mockRects = (
      wrapperRect: Partial<DOMRect>,
      contentRect: Partial<DOMRect>
    ) => {
      Element.prototype.getBoundingClientRect = function (this: Element) {
        const isContent = this.classList.contains('tooltip-content');
        const rect = isContent ? contentRect : wrapperRect;
        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          toJSON: () => ({}),
          ...rect,
        } as DOMRect;
      };
    };

    beforeEach(() => {
      // Make rAF synchronous so the overflow-correction callback runs in act().
      window.requestAnimationFrame = (cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      };
    });

    afterEach(() => {
      window.requestAnimationFrame = originalRAF;
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: originalInnerHeight,
        writable: true,
        configurable: true,
      });
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it('shifts vertical-position tooltip right when content overflows the left edge', () => {
      setViewport(1024, 768);
      // Wrapper near left edge so tooltip-content (centered) overflows left.
      // contentRect.left = -10 (< edgePadding 8) → shift = 8 - (-10) = 18
      mockRects(
        { top: 100, bottom: 120, left: 0, right: 40 },
        { top: 60, bottom: 100, left: -10, right: 90 }
      );

      render(
        <Tooltip label="Test" position="top" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      const content = screen.getByRole('tooltip', {
        hidden: true,
      }) as HTMLElement;
      expect(content.style.left).toBe('calc(50% + 18px)');
      expect(content.style.getPropertyValue('--tooltip-arrow-offset')).toBe(
        '-18px'
      );
    });

    it('shifts vertical-position tooltip left when content overflows the right edge', () => {
      setViewport(1024, 768);
      // contentRect.right = 1030 > innerWidth 1024 - edgePadding 8 = 1016
      // shift = 1030 - 1016 = 14
      mockRects(
        { top: 100, bottom: 120, left: 980, right: 1024 },
        { top: 60, bottom: 100, left: 930, right: 1030 }
      );

      render(
        <Tooltip label="Test" position="bottom" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      const content = screen.getByRole('tooltip', {
        hidden: true,
      }) as HTMLElement;
      expect(content.style.left).toBe('calc(50% - 14px)');
      expect(content.style.getPropertyValue('--tooltip-arrow-offset')).toBe(
        '14px'
      );
    });

    it('shifts horizontal-position tooltip down when content overflows the top edge', () => {
      setViewport(1024, 768);
      // contentRect.top = -5 (< edgePadding 8) → shift = 8 - (-5) = 13
      mockRects(
        { top: 50, bottom: 90, left: 100, right: 140 },
        { top: -5, bottom: 35, left: 150, right: 250 }
      );

      render(
        <Tooltip label="Test" position="right" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      const content = screen.getByRole('tooltip', {
        hidden: true,
      }) as HTMLElement;
      expect(content.style.top).toBe('calc(50% + 13px)');
      expect(content.style.getPropertyValue('--tooltip-arrow-offset')).toBe(
        '-13px'
      );
    });

    it('does not shift vertical-position tooltip when content fits within viewport', () => {
      setViewport(1024, 768);
      // contentRect well within viewport: left 200 (>= 8) and right 400 (<= 1016)
      mockRects(
        { top: 100, bottom: 120, left: 250, right: 350 },
        { top: 60, bottom: 100, left: 200, right: 400 }
      );

      render(
        <Tooltip label="Test" position="top" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      const content = screen.getByRole('tooltip', {
        hidden: true,
      }) as HTMLElement;
      // No corrective inline styles applied.
      expect(content.getAttribute('style')).toBeNull();
    });

    it('does not shift horizontal-position tooltip when content fits within viewport', () => {
      setViewport(1024, 768);
      // contentRect well within viewport: top 200 (>= 8) and bottom 400 (<= 760)
      mockRects(
        { top: 250, bottom: 350, left: 100, right: 140 },
        { top: 200, bottom: 400, left: 150, right: 250 }
      );

      render(
        <Tooltip label="Test" position="right" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      const content = screen.getByRole('tooltip', {
        hidden: true,
      }) as HTMLElement;
      expect(content.getAttribute('style')).toBeNull();
    });

    it('shifts horizontal-position tooltip up when content overflows the bottom edge', () => {
      setViewport(1024, 768);
      // contentRect.bottom = 775 > innerHeight 768 - edgePadding 8 = 760
      // shift = 775 - 760 = 15
      mockRects(
        { top: 700, bottom: 740, left: 100, right: 140 },
        { top: 735, bottom: 775, left: 0, right: 90 }
      );

      render(
        <Tooltip label="Test" position="left" active>
          <button>Hover me</button>
        </Tooltip>
      );

      act(() => {
        jest.runAllTimers();
      });

      const content = screen.getByRole('tooltip', {
        hidden: true,
      }) as HTMLElement;
      expect(content.style.top).toBe('calc(50% - 15px)');
      expect(content.style.getPropertyValue('--tooltip-arrow-offset')).toBe(
        '15px'
      );
    });
  });

  describe('custom content', () => {
    it('renders ReactNode content when content prop is provided', () => {
      render(
        <Tooltip
          content={
            <span data-testid="rich">
              <strong>Bold</strong> text
            </span>
          }
        >
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltipContent = screen.getByRole('tooltip', { hidden: true });
      expect(tooltipContent).toContainHTML('<strong>Bold</strong>');
      expect(tooltipContent).toHaveTextContent('Bold text');
    });

    it('content takes precedence over label when both provided', () => {
      render(
        <Tooltip label="Label text" content={<em>Content text</em>}>
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltipContent = screen.getByRole('tooltip', { hidden: true });
      expect(tooltipContent).toHaveTextContent('Content text');
      expect(tooltipContent).not.toHaveTextContent('Label text');
    });

    it('omits data-tooltip attribute when only content is provided', () => {
      const { container } = render(
        <Tooltip content={<span>Rich content</span>}>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveAttribute(
        'data-tooltip'
      );
    });

    it('sets data-tooltip attribute when label is provided alongside content', () => {
      const { container } = render(
        <Tooltip label="Label text" content={<span>Rich content</span>}>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveAttribute(
        'data-tooltip',
        'Label text'
      );
    });
  });

  describe('measurement frame after unmount', () => {
    const originalRAF = window.requestAnimationFrame;

    afterEach(() => {
      window.requestAnimationFrame = originalRAF;
    });

    it('skips the overflow-correction frame when the tooltip unmounted first', () => {
      // Capture rAF callbacks instead of running them so the measurement
      // frame can be flushed after the tooltip is gone.
      const frames: FrameRequestCallback[] = [];
      window.requestAnimationFrame = (cb: FrameRequestCallback) => {
        frames.push(cb);
        return frames.length;
      };

      const { unmount } = render(
        <Tooltip label="Test" position="top" active>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(frames.length).toBeGreaterThan(0);

      unmount();
      // The content ref is detached now; the queued frame must bail out
      // without touching state or throwing.
      expect(() => frames.forEach(cb => cb(0))).not.toThrow();
    });
  });
});
