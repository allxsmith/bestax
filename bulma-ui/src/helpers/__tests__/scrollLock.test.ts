import { cleanup, renderHook } from '@testing-library/react';
import { scrollLockOffset, useScrollLock } from '../scrollLock';

const root = document.documentElement;

/** The room the lock says it padded on a side, as `<html>` holds it. */
const offset = (side: 'left' | 'right') =>
  root.style.getPropertyValue(`--bulma-scroll-lock-offset-${side}`);

/** A rect spanning `left` to `right`, as `getBoundingClientRect` gives it. */
const span = (left: number, right: number) =>
  ({ left, right, top: 0, bottom: 0, width: right - left }) as DOMRect;

/**
 * `<html>`'s box before the lock, then after it, as an engine draws the
 * page's scrollbar: the room it took comes back on one side.
 */
const mockScrollbar = (before: DOMRect, after: DOMRect) =>
  vi
    .spyOn(root, 'getBoundingClientRect')
    .mockReturnValueOnce(before)
    .mockReturnValueOnce(after)
    .mockReturnValue(after);

describe('useScrollLock', () => {
  afterEach(() => {
    // Release every lock first, so the styles reset below are the ones left.
    cleanup();
    vi.restoreAllMocks();
    root.style.overflow = '';
    root.style.paddingLeft = '';
    root.style.paddingRight = '';
    root.style.removeProperty('--bulma-scroll-lock-offset-left');
    root.style.removeProperty('--bulma-scroll-lock-offset-right');
  });

  it('does nothing when inactive', () => {
    renderHook(() => useScrollLock(false));
    expect(root.style.overflow).toBe('');
  });

  it('locks the page on <html>, not <body>, and restores it on unmount', () => {
    // Bulma gives <html> its own overflow, so <body>'s never reaches the
    // viewport: only <html>'s stops the page scrolling.
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(root.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).toBe('');
    unmount();
    expect(root.style.overflow).toBe('');
  });

  it('is ref-counted across overlapping callers', () => {
    const a = renderHook(() => useScrollLock(true));
    const b = renderHook(() => useScrollLock(true));
    expect(root.style.overflow).toBe('hidden');

    a.unmount();
    expect(root.style.overflow).toBe('hidden');

    b.unmount();
    expect(root.style.overflow).toBe('');
  });

  it('restores the overflow value that was set before locking', () => {
    root.style.overflow = 'scroll';
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(root.style.overflow).toBe('hidden');
    unmount();
    expect(root.style.overflow).toBe('scroll');
  });

  it('reacts to active toggling on rerender', () => {
    const { rerender, unmount } = renderHook(
      ({ active }) => useScrollLock(active),
      { initialProps: { active: false } }
    );
    expect(root.style.overflow).toBe('');

    rerender({ active: true });
    expect(root.style.overflow).toBe('hidden');

    rerender({ active: false });
    expect(root.style.overflow).toBe('');

    unmount();
  });

  describe('the room the scrollbar took', () => {
    it('pads the right when the scrollbar was on the right', () => {
      mockScrollbar(span(0, 785), span(0, 800));
      const { unmount } = renderHook(() => useScrollLock(true));
      expect(root.style.paddingRight).toBe('15px');
      expect(root.style.paddingLeft).toBe('');
      unmount();
      expect(root.style.paddingRight).toBe('');
    });

    it('sets the room it padded on the right for fixed elements, while locked', () => {
      // The window's right edge takes the room back, and the padding on
      // <html> doesn't reach an element fixed to it, so it reads this.
      mockScrollbar(span(0, 785), span(0, 800));
      const { unmount } = renderHook(() => useScrollLock(true));
      expect(offset('right')).toBe('15px');
      expect(offset('left')).toBe('');
      unmount();
      expect(offset('right')).toBe('');
      expect(root.getAttribute('style')).toBe('');
    });

    it('pads the left when the scrollbar was on the left', () => {
      // Firefox can draw it there under right-to-left text, while Chromium
      // and WebKit keep it on the right, so the side isn't the text's.
      mockScrollbar(span(15, 800), span(0, 800));
      const { unmount } = renderHook(() => useScrollLock(true));
      expect(root.style.paddingLeft).toBe('15px');
      expect(root.style.paddingRight).toBe('');
      expect(offset('left')).toBe('15px');
      expect(offset('right')).toBe('');
      unmount();
      expect(root.style.paddingLeft).toBe('');
      expect(offset('left')).toBe('');
    });

    it('adds to the padding <html> already has, and puts its own back', () => {
      root.style.paddingLeft = '3px';
      root.style.paddingRight = '4px';
      mockScrollbar(span(0, 785), span(0, 800));
      const { unmount } = renderHook(() => useScrollLock(true));
      expect(root.style.paddingRight).toBe('19px');
      expect(root.style.paddingLeft).toBe('3px');
      // The room the scrollbar gave back, not the padding it came to.
      expect(offset('right')).toBe('15px');
      expect(offset('left')).toBe('');
      unmount();
      expect(root.style.paddingRight).toBe('4px');
      expect(root.style.paddingLeft).toBe('3px');
    });

    it('pads nothing when nothing moved, as with an overlay scrollbar', () => {
      mockScrollbar(span(0, 800), span(0, 800));
      renderHook(() => useScrollLock(true));
      expect(root.style.overflow).toBe('hidden');
      expect(root.style.paddingLeft).toBe('');
      expect(root.style.paddingRight).toBe('');
      expect(offset('left')).toBe('');
      expect(offset('right')).toBe('');
    });

    it('measures once for nested locks, so the padding is not added twice', () => {
      const rect = mockScrollbar(span(0, 785), span(0, 800));
      const outer = renderHook(() => useScrollLock(true));
      const inner = renderHook(() => useScrollLock(true));
      expect(rect).toHaveBeenCalledTimes(2);
      expect(root.style.paddingRight).toBe('15px');
      expect(offset('right')).toBe('15px');

      inner.unmount();
      expect(root.style.paddingRight).toBe('15px');
      expect(offset('right')).toBe('15px');
      outer.unmount();
      expect(root.style.paddingRight).toBe('');
      expect(offset('right')).toBe('');
    });

    it('names the variable an element reads, falling back to 0 with no lock', () => {
      expect(scrollLockOffset('right')).toBe(
        'var(--bulma-scroll-lock-offset-right, 0px)'
      );
      expect(scrollLockOffset('left')).toBe(
        'var(--bulma-scroll-lock-offset-left, 0px)'
      );
    });
  });
});
