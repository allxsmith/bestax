/**
 * The stack of open overlays behind "one Escape closes the topmost one"
 * (#1085), and "the topmost modal one holds Tab" (#1191). Overlays join only
 * through the hook, so each case here opens them with it.
 */
import React, { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { isModalOverlayOpen, useOverlayStack } from '../overlayStack';

/** An overlay that's open or not, returning its check. */
const overlay = (open: boolean, options?: { strict?: boolean }) =>
  renderHook(({ inStack }) => useOverlayStack(inStack), {
    initialProps: { inStack: open },
    wrapper: options?.strict ? StrictMode : undefined,
  });

/** Something that never joins, like a Toast: on top only with nothing open. */
const outsider = () => renderHook(() => useOverlayStack(false)).result.current;

describe('useOverlayStack', () => {
  it('puts the overlay that opened last on top, and the one under it once that closes', () => {
    const bottom = overlay(true);
    const top = overlay(true);
    const nothingOpen = outsider();

    expect(top.result.current()).toBe(true);
    expect(bottom.result.current()).toBe(false);
    expect(nothingOpen()).toBe(false);

    top.rerender({ inStack: false });
    expect(bottom.result.current()).toBe(true);
    expect(nothingOpen()).toBe(false);

    bottom.unmount();
    expect(nothingOpen()).toBe(true);
  });

  it('puts an overlay that opens again back on top', () => {
    const first = overlay(true);
    const second = overlay(true);

    first.rerender({ inStack: false });
    first.rerender({ inStack: true });
    expect(first.result.current()).toBe(true);
    expect(second.result.current()).toBe(false);
  });

  it('keeps the same check across renders', () => {
    const layer = overlay(true);
    const check = layer.result.current;
    layer.rerender({ inStack: true });
    expect(layer.result.current).toBe(check);
  });

  it("holds one place per open overlay under StrictMode's double effects, and none once closed", () => {
    const bottom = overlay(true, { strict: true });
    const top = overlay(true, { strict: true });
    const nothingOpen = outsider();

    expect(top.result.current()).toBe(true);
    expect(bottom.result.current()).toBe(false);

    // A second place left behind for either one would keep it in the stack
    // after it closes once.
    top.rerender({ inStack: false });
    expect(bottom.result.current()).toBe(true);
    bottom.rerender({ inStack: false });
    expect(nothingOpen()).toBe(true);
  });

  it('leaves the topmost overlay in place when a cleanup finds its own place already gone', () => {
    // Nothing in React does this today. The test runs an overlay's cleanup a
    // second time, the way a future mode that tears an effect down twice
    // might, and the topmost overlay has to keep its place.
    const cleanups: Array<() => void> = [];
    const realUseEffect = React.useEffect;
    const spy = jest
      .spyOn(React, 'useEffect')
      .mockImplementation((effect, deps) =>
        realUseEffect(() => {
          const cleanup = effect();
          if (cleanup) cleanups.push(cleanup);
          return cleanup;
        }, deps)
      );
    try {
      const bottom = overlay(true);
      const bottomCleanup = cleanups[cleanups.length - 1];
      const top = overlay(true);
      const nothingOpen = outsider();

      bottom.rerender({ inStack: false });
      act(() => bottomCleanup());

      expect(top.result.current()).toBe(true);
      expect(nothingOpen()).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });

  describe("asked about 'modal' overlays", () => {
    /** An overlay that's open, modal or not. */
    const layer = (modal: boolean) =>
      renderHook(({ inStack, isModal }) => useOverlayStack(inStack, isModal), {
        initialProps: { inStack: true, isModal: modal },
      });

    it('passes over one that is not modal, which still takes the top', () => {
      const modal = layer(true);
      const above = layer(false);

      expect(modal.result.current('modal')).toBe(true);
      expect(modal.result.current()).toBe(false);
      expect(above.result.current()).toBe(true);
    });

    it('counts one that is modal, wherever it sits above', () => {
      const under = layer(true);
      const between = layer(false);
      const top = layer(true);

      expect(under.result.current('modal')).toBe(false);
      expect(between.result.current('modal')).toBe(false);
      expect(top.result.current('modal')).toBe(true);
    });

    it('treats an overlay as modal unless it says otherwise', () => {
      const modal = layer(true);
      overlay(true);
      expect(modal.result.current('modal')).toBe(false);
    });

    it('follows an overlay that stops or starts being modal while open, keeping its place', () => {
      const modal = layer(true);
      const above = layer(true);
      expect(modal.result.current('modal')).toBe(false);

      above.rerender({ inStack: true, isModal: false });
      expect(modal.result.current('modal')).toBe(true);
      expect(above.result.current()).toBe(true);

      above.rerender({ inStack: true, isModal: true });
      expect(modal.result.current('modal')).toBe(false);
      expect(above.result.current()).toBe(true);
    });

    it('is true for one outside the stack while no modal overlay is open', () => {
      const nothingModal = outsider();
      layer(false);
      expect(nothingModal('modal')).toBe(true);
      expect(nothingModal()).toBe(false);

      layer(true);
      expect(nothingModal('modal')).toBe(false);
    });
  });

  describe('isModalOverlayOpen', () => {
    it('is whether any open overlay is modal, wherever it sits', () => {
      expect(isModalOverlayOpen()).toBe(false);

      const modal = overlay(true);
      const above = renderHook(() => useOverlayStack(true, false));
      expect(isModalOverlayOpen()).toBe(true);

      modal.rerender({ inStack: false });
      expect(isModalOverlayOpen()).toBe(false);
      above.unmount();
      expect(isModalOverlayOpen()).toBe(false);
    });
  });

  it('is left alone by a server render', () => {
    const Open = () => {
      useOverlayStack(true);
      return <div>open</div>;
    };
    expect(renderToString(<Open />)).toBe('<div>open</div>');
    expect(outsider()()).toBe(true);
  });

  it('holds one place for an overlay that hydrates open, and none once it unmounts', () => {
    const Open = () => {
      useOverlayStack(true);
      return <div>open</div>;
    };
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Open />);
    document.body.appendChild(container);
    const nothingOpen = outsider();

    let root: ReturnType<typeof hydrateRoot> | undefined;
    act(() => {
      root = hydrateRoot(container, <Open />);
    });
    expect(nothingOpen()).toBe(false);

    act(() => root?.unmount());
    expect(nothingOpen()).toBe(true);
    container.remove();
  });
});
