import { renderHook } from '@testing-library/react';
import { useScrollLock } from '../scrollLock';

describe('useScrollLock', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('does nothing when inactive', () => {
    renderHook(() => useScrollLock(false));
    expect(document.body.style.overflow).toBe('');
  });

  it('locks body scroll while active and restores it on unmount', () => {
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('is ref-counted across overlapping callers', () => {
    const a = renderHook(() => useScrollLock(true));
    const b = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');

    a.unmount();
    expect(document.body.style.overflow).toBe('hidden');

    b.unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('restores the overflow value that was set before locking', () => {
    document.body.style.overflow = 'scroll';
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('reacts to active toggling on rerender', () => {
    const { rerender, unmount } = renderHook(
      ({ active }) => useScrollLock(active),
      { initialProps: { active: false } }
    );
    expect(document.body.style.overflow).toBe('');

    rerender({ active: true });
    expect(document.body.style.overflow).toBe('hidden');

    rerender({ active: false });
    expect(document.body.style.overflow).toBe('');

    unmount();
  });
});
