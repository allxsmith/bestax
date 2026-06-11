import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { Timepicker } from '../Timepicker';
import { TimeWheels } from '../_pickerInternals/TimeWheels';
import { __resetAudioTickForTest } from '../_pickerInternals/audioTick';

// -------------------------------------------------------------------------
// Interaction machinery of TimeWheels: pointer drags, fling momentum, snap
// animation, trackpad wheel accumulation, and the empty-space drag forwarder.
//
// jsdom has no real rAF loop, pointer capture, or monotonic clock, so the
// harness below mocks:
//   - requestAnimationFrame / cancelAnimationFrame → a pending-frame map we
//     drain manually with a controllable timestamp,
//   - performance.now → a settable `nowMs` variable,
//   - HTMLElement.prototype.setPointerCapture / releasePointerCapture →
//     jest.fn() stubs (jsdom's own implementations reject synthetic pointers).
// -------------------------------------------------------------------------

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) =>
        ({
          matches: false,
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => true,
          onchange: null,
        }) as unknown as MediaQueryList,
    });
  }
});

// Pointer-capture stubs. Saved/restored so other suites see jsdom's own
// behavior (if any).
let originalSetPointerCapture:
  | typeof HTMLElement.prototype.setPointerCapture
  | undefined;
let originalReleasePointerCapture:
  | typeof HTMLElement.prototype.releasePointerCapture
  | undefined;

beforeAll(() => {
  originalSetPointerCapture = HTMLElement.prototype.setPointerCapture;
  originalReleasePointerCapture = HTMLElement.prototype.releasePointerCapture;
  HTMLElement.prototype.setPointerCapture = jest.fn();
  HTMLElement.prototype.releasePointerCapture = jest.fn();
});

afterAll(() => {
  if (originalSetPointerCapture) {
    HTMLElement.prototype.setPointerCapture = originalSetPointerCapture;
  } else {
    delete (HTMLElement.prototype as unknown as { setPointerCapture?: unknown })
      .setPointerCapture;
  }
  if (originalReleasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = originalReleasePointerCapture;
  } else {
    delete (
      HTMLElement.prototype as unknown as { releasePointerCapture?: unknown }
    ).releasePointerCapture;
  }
});

// rAF / clock harness.
let pendingFrames: Map<number, FrameRequestCallback>;
let nextRafId: number;
let nowMs: number;
let cancelRafSpy: jest.SpyInstance;

beforeEach(() => {
  pendingFrames = new Map();
  nextRafId = 0;
  nowMs = 1000;
  jest.spyOn(performance, 'now').mockImplementation(() => nowMs);
  jest
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((cb: FrameRequestCallback) => {
      const id = ++nextRafId;
      pendingFrames.set(id, cb);
      return id;
    });
  cancelRafSpy = jest
    .spyOn(window, 'cancelAnimationFrame')
    .mockImplementation((id: number) => {
      pendingFrames.delete(id);
    });
});

afterEach(() => {
  jest.restoreAllMocks();
});

/** Drain pending rAF callbacks, advancing the mocked clock per frame. */
const flushFrames = (maxFrames = 500, stepMs = 16): number => {
  let frames = 0;
  while (pendingFrames.size > 0 && frames < maxFrames) {
    frames++;
    nowMs += stepMs;
    const cbs = Array.from(pendingFrames.values());
    pendingFrames.clear();
    act(() => {
      cbs.forEach(cb => cb(nowMs));
    });
  }
  return frames;
};

/**
 * This jsdom has no PointerEvent constructor, so fireEvent.pointerDown &c.
 * fall back to a bare Event that drops clientX/clientY/pointerId. Build a
 * MouseEvent (which carries coordinates) with the pointer event type and
 * attach pointerId manually — React reads both off the native event.
 */
const firePointer = (
  el: Element,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  init: { pointerId: number; clientX?: number; clientY?: number }
) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
  });
  Object.defineProperty(event, 'pointerId', { value: init.pointerId });
  fireEvent(el, event);
};

const at = (h: number, m: number, s = 0) => {
  const d = new Date();
  d.setHours(h, m, s, 0);
  return d;
};

const lastDate = (handler: jest.Mock): Date =>
  handler.mock.calls[handler.mock.calls.length - 1][0] as Date;

const openPicker = (ui: React.ReactElement) => {
  const utils = render(ui);
  fireEvent.click(utils.getByRole('combobox'));
  return { ...utils, wheels: utils.getAllByRole('spinbutton') };
};

const rect = (left: number, right: number): DOMRect =>
  ({
    left,
    right,
    top: 0,
    bottom: 160,
    width: right - left,
    height: 160,
    x: left,
    y: 0,
    toJSON: () => ({}),
  }) as DOMRect;

describe('TimeWheels pointer drag', () => {
  it('ignores movement below the 4px drag threshold', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0)}
        mobileNative={false}
        onChange={handler}
      />
    );
    const hours = wheels[0];
    firePointer(hours, 'pointerdown', { pointerId: 1, clientY: 200 });
    firePointer(hours, 'pointermove', { pointerId: 1, clientY: 197 });
    expect(hours.className).not.toContain('is-dragging');
    expect(handler).not.toHaveBeenCalled();
    expect(hours.getAttribute('aria-valuenow')).toBe('10');
    // pointerup without a captured drag just resets state — no snap fires.
    firePointer(hours, 'pointerup', { pointerId: 1, clientY: 197 });
    expect(pendingFrames.size).toBe(0);
  });

  it('tracks the finger 1 item per 32px, trims old velocity samples, and snaps on release', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0)}
        mobileNative={false}
        onChange={handler}
      />
    );
    const hours = wheels[0];
    nowMs = 1000;
    firePointer(hours, 'pointerdown', { pointerId: 1, clientY: 200 });
    // Drag UP 32px → later value comes into view (10 → 11).
    nowMs = 1100;
    firePointer(hours, 'pointermove', { pointerId: 1, clientY: 168 });
    expect(hours.className).toContain('is-dragging');
    expect(hours.getAttribute('aria-valuenow')).toBe('11');
    expect(lastDate(handler).getHours()).toBe(11);
    // Drag DOWN past the start, 32px below it → position 9.
    nowMs = 1200; // > 100ms since the first sample → oldest sample trimmed
    firePointer(hours, 'pointermove', { pointerId: 1, clientY: 232 });
    expect(lastDate(handler).getHours()).toBe(9);
    // A slow final wiggle keeps the recent velocity under the fling threshold.
    nowMs = 1290;
    firePointer(hours, 'pointermove', { pointerId: 1, clientY: 233 });
    firePointer(hours, 'pointerup', { pointerId: 1, clientY: 233 });
    expect(hours.className).not.toContain('is-dragging');
    // Release left position at 8.97 → ease-out snap back to 9.
    expect(pendingFrames.size).toBeGreaterThan(0);
    flushFrames();
    expect(pendingFrames.size).toBe(0);
    expect(hours.getAttribute('aria-valuenow')).toBe('9');
    expect(lastDate(handler).getHours()).toBe(9);
  });

  it('snaps (no momentum) when the velocity samples have zero time spread', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0)}
        mobileNative={false}
        onChange={handler}
      />
    );
    const hours = wheels[0];
    nowMs = 1000;
    firePointer(hours, 'pointerdown', { pointerId: 1, clientY: 200 });
    // Same timestamp → dt === 0 → pxPerMs stays 0 → snap path.
    firePointer(hours, 'pointermove', { pointerId: 1, clientY: 150 });
    expect(lastDate(handler).getHours()).toBe(12); // 10 + 50/32 rounds to 12
    firePointer(hours, 'pointerup', { pointerId: 1, clientY: 150 });
    flushFrames();
    expect(hours.getAttribute('aria-valuenow')).toBe('12');
    expect(lastDate(handler).getHours()).toBe(12);
  });

  it('ignores pointermove / pointerup from a different pointerId', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0)}
        mobileNative={false}
        onChange={handler}
      />
    );
    const hours = wheels[0];
    firePointer(hours, 'pointerdown', { pointerId: 1, clientY: 200 });
    firePointer(hours, 'pointermove', { pointerId: 2, clientY: 100 });
    firePointer(hours, 'pointerup', { pointerId: 2, clientY: 100 });
    expect(hours.className).not.toContain('is-dragging');
    expect(handler).not.toHaveBeenCalled();
    firePointer(hours, 'pointerup', { pointerId: 1, clientY: 200 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('a fast upward fling starts momentum, caps the velocity, and settles on an item', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0)}
        mobileNative={false}
        onChange={handler}
      />
    );
    const hours = wheels[0];
    nowMs = 1000;
    firePointer(hours, 'pointerdown', { pointerId: 1, clientY: 300 });
    nowMs = 1016;
    firePointer(hours, 'pointermove', { pointerId: 1, clientY: 260 });
    nowMs = 1032;
    firePointer(hours, 'pointermove', { pointerId: 1, clientY: 220 });
    // 80px in 32ms = 2.5 px/ms — far above the 0.25 fling threshold, and the
    // resulting 0.078 items/ms is above the 0.05 cap.
    firePointer(hours, 'pointerup', { pointerId: 1, clientY: 220 });
    expect(pendingFrames.size).toBeGreaterThan(0);
    // One zero-advance frame exercises the dt = max(1, …) guard.
    flushFrames(1, 0);
    const frames = flushFrames(300);
    expect(frames).toBeGreaterThan(10); // friction decays over many frames
    expect(pendingFrames.size).toBe(0);
    // Drag ended at position 12.5; a capped (0.05 items/ms) fling coasts
    // ≈ 8.8 more items before the snap → final hour ≈ 21. An uncapped fling
    // would coast ≈ 13.7 items (≈ hour 2 after wrap), so the range proves
    // the cap took effect.
    const finalHour = lastDate(handler).getHours();
    expect(finalHour).toBeGreaterThanOrEqual(19);
    expect(finalHour).toBeLessThanOrEqual(23);
    expect(hours.getAttribute('aria-valuenow')).toBe(String(finalHour));
  });

  it('a fast downward fling coasts toward earlier values (negative cap branch)', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 30)}
        mobileNative={false}
        onChange={handler}
      />
    );
    const minutes = wheels[1];
    nowMs = 1000;
    firePointer(minutes, 'pointerdown', { pointerId: 1, clientY: 200 });
    nowMs = 1016;
    firePointer(minutes, 'pointermove', { pointerId: 1, clientY: 240 });
    nowMs = 1032;
    firePointer(minutes, 'pointermove', { pointerId: 1, clientY: 280 });
    firePointer(minutes, 'pointerup', { pointerId: 1, clientY: 280 });
    flushFrames(300);
    expect(pendingFrames.size).toBe(0);
    // Drag ended at 27.5; capped momentum coasts ≈ 8.8 items down → ≈ 19.
    const finalMinute = lastDate(handler).getMinutes();
    expect(finalMinute).toBeGreaterThanOrEqual(17);
    expect(finalMinute).toBeLessThanOrEqual(21);
    expect(minutes.getAttribute('aria-valuenow')).toBe(String(finalMinute));
  });

  it('momentum clamps at the top boundary of the non-wrapping AM/PM wheel', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(9, 0)}
        hourFormat="12"
        mobileNative={false}
        onChange={handler}
      />
    );
    const ampm = wheels[2];
    expect(ampm.getAttribute('aria-valuenow')).toBe('0'); // AM
    nowMs = 1000;
    firePointer(ampm, 'pointerdown', { pointerId: 1, clientY: 300 });
    nowMs = 1016;
    firePointer(ampm, 'pointermove', { pointerId: 1, clientY: 260 });
    expect(lastDate(handler).getHours()).toBe(21); // crossed into PM
    nowMs = 1032;
    firePointer(ampm, 'pointermove', { pointerId: 1, clientY: 220 });
    firePointer(ampm, 'pointerup', { pointerId: 1, clientY: 220 });
    // Fling velocity pushes past index 1 → clamp + zero velocity → snap ends
    // immediately on the integer.
    flushFrames(50);
    expect(pendingFrames.size).toBe(0);
    expect(ampm.getAttribute('aria-valuenow')).toBe('1');
    expect(lastDate(handler).getHours()).toBe(21);
  });

  it('momentum clamps at the bottom boundary of the AM/PM wheel', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(21, 0)}
        hourFormat="12"
        mobileNative={false}
        onChange={handler}
      />
    );
    const ampm = wheels[2];
    expect(ampm.getAttribute('aria-valuenow')).toBe('1'); // PM
    nowMs = 1000;
    firePointer(ampm, 'pointerdown', { pointerId: 1, clientY: 200 });
    nowMs = 1016;
    firePointer(ampm, 'pointermove', { pointerId: 1, clientY: 240 });
    expect(lastDate(handler).getHours()).toBe(9); // crossed into AM
    nowMs = 1032;
    firePointer(ampm, 'pointermove', { pointerId: 1, clientY: 280 });
    firePointer(ampm, 'pointerup', { pointerId: 1, clientY: 280 });
    flushFrames(50);
    expect(pendingFrames.size).toBe(0);
    expect(ampm.getAttribute('aria-valuenow')).toBe('0');
    expect(lastDate(handler).getHours()).toBe(9);
  });

  it('a gentle fling on the AM/PM wheel coasts through the interior before clamping', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(9, 0)}
        hourFormat="12"
        mobileNative={false}
        onChange={handler}
      />
    );
    const ampm = wheels[2];
    nowMs = 1000;
    firePointer(ampm, 'pointerdown', { pointerId: 1, clientY: 200 });
    nowMs = 1016;
    firePointer(ampm, 'pointermove', { pointerId: 1, clientY: 190 });
    nowMs = 1032;
    firePointer(ampm, 'pointermove', { pointerId: 1, clientY: 180 });
    // 20px in 32ms ≈ 0.63 px/ms — just over the fling threshold, slow enough
    // that the first momentum frame lands strictly inside (0, 1).
    firePointer(ampm, 'pointerup', { pointerId: 1, clientY: 180 });
    flushFrames(50);
    expect(pendingFrames.size).toBe(0);
    expect(ampm.getAttribute('aria-valuenow')).toBe('1');
    expect(lastDate(handler).getHours()).toBe(21);
  });

  it('cancels the in-flight animation frame on unmount', () => {
    const handler = jest.fn();
    const { wheels, unmount } = openPicker(
      <Timepicker
        defaultValue={at(10, 0)}
        mobileNative={false}
        onChange={handler}
      />
    );
    const hours = wheels[0];
    nowMs = 1000;
    firePointer(hours, 'pointerdown', { pointerId: 1, clientY: 200 });
    nowMs = 1016;
    firePointer(hours, 'pointermove', { pointerId: 1, clientY: 180 });
    // 20px/16ms = 1.25 px/ms → momentum frame is scheduled and left pending.
    firePointer(hours, 'pointerup', { pointerId: 1, clientY: 180 });
    expect(pendingFrames.size).toBeGreaterThan(0);
    unmount();
    expect(cancelRafSpy).toHaveBeenCalled();
    expect(pendingFrames.size).toBe(0);
  });
});

describe('TimeWheels empty-space drag forwarder', () => {
  it('forwards a pointerdown on the separator to the nearest wheel by X distance', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0)}
        mobileNative={false}
        onChange={handler}
      />
    );
    jest.spyOn(wheels[0], 'getBoundingClientRect').mockReturnValue(rect(0, 50));
    jest
      .spyOn(wheels[1], 'getBoundingClientRect')
      .mockReturnValue(rect(60, 110));
    const sep = document.querySelector('.timepicker-separator')!;
    // clientX 84 is nearest the minutes wheel (centre 85) vs hours (centre 25).
    firePointer(sep, 'pointerdown', {
      pointerId: 5,
      clientX: 84,
      clientY: 100,
    });
    expect(wheels[1].className).toContain('is-dragging');
    expect(wheels[0].className).not.toContain('is-dragging');
    // The drag is live on the minutes wheel: 32px up → +1 minute.
    firePointer(wheels[1], 'pointermove', { pointerId: 5, clientY: 68 });
    expect(lastDate(handler).getMinutes()).toBe(1);
    expect(lastDate(handler).getHours()).toBe(10);
    firePointer(wheels[1], 'pointerup', { pointerId: 5, clientY: 68 });
    flushFrames();
    expect(wheels[1].getAttribute('aria-valuenow')).toBe('1');
  });

  it('forwards to the hours wheel when the pointer is nearest it, and a no-move release just snaps', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0)}
        mobileNative={false}
        onChange={handler}
      />
    );
    jest.spyOn(wheels[0], 'getBoundingClientRect').mockReturnValue(rect(0, 50));
    jest
      .spyOn(wheels[1], 'getBoundingClientRect')
      .mockReturnValue(rect(60, 110));
    const sep = document.querySelector('.timepicker-separator')!;
    firePointer(sep, 'pointerdown', {
      pointerId: 5,
      clientX: 20,
      clientY: 100,
    });
    expect(wheels[0].className).toContain('is-dragging');
    // Release with a single velocity sample (< 2 needed) and an integer
    // position → snap early-returns with nothing to animate.
    firePointer(wheels[0], 'pointerup', { pointerId: 5, clientY: 100 });
    expect(wheels[0].className).not.toContain('is-dragging');
    expect(pendingFrames.size).toBe(0);
    expect(handler).not.toHaveBeenCalled();
    // Drag releases pull focus back to the wheel root.
    expect(document.activeElement).toBe(wheels[0]);
  });

  it('keeps the forwarded drag working when setPointerCapture throws', () => {
    const throwing = jest.fn(() => {
      throw new Error('pointer is not active');
    });
    const previous = HTMLElement.prototype.setPointerCapture;
    HTMLElement.prototype.setPointerCapture = throwing;
    try {
      const handler = jest.fn();
      const { wheels } = openPicker(
        <Timepicker
          defaultValue={at(10, 0)}
          mobileNative={false}
          onChange={handler}
        />
      );
      jest
        .spyOn(wheels[0], 'getBoundingClientRect')
        .mockReturnValue(rect(0, 50));
      jest
        .spyOn(wheels[1], 'getBoundingClientRect')
        .mockReturnValue(rect(60, 110));
      const sep = document.querySelector('.timepicker-separator')!;
      firePointer(sep, 'pointerdown', {
        pointerId: 9,
        clientX: 84,
        clientY: 100,
      });
      expect(throwing).toHaveBeenCalled();
      expect(wheels[1].className).toContain('is-dragging');
      firePointer(wheels[1], 'pointermove', { pointerId: 9, clientY: 68 });
      expect(lastDate(handler).getMinutes()).toBe(1);
      firePointer(wheels[1], 'pointerup', { pointerId: 9, clientY: 68 });
      flushFrames();
    } finally {
      HTMLElement.prototype.setPointerCapture = previous;
    }
  });

  it('safely ignores a foreign element carrying the wheel class', () => {
    // Defensive path: if the nearest "wheel" by X has no matching column ref
    // (here: an injected stray element), the forwarder must no-op, not crash.
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0)}
        mobileNative={false}
        onChange={handler}
      />
    );
    const row = wheels[0].parentElement!;
    const stray = document.createElement('div');
    stray.className = 'timepicker-wheel';
    row.appendChild(stray);
    jest.spyOn(wheels[0], 'getBoundingClientRect').mockReturnValue(rect(0, 50));
    jest
      .spyOn(wheels[1], 'getBoundingClientRect')
      .mockReturnValue(rect(60, 110));
    jest.spyOn(stray, 'getBoundingClientRect').mockReturnValue(rect(120, 170));
    const sep = document.querySelector('.timepicker-separator')!;
    expect(() =>
      firePointer(sep, 'pointerdown', {
        pointerId: 4,
        clientX: 150,
        clientY: 100,
      })
    ).not.toThrow();
    wheels.forEach(w => expect(w.className).not.toContain('is-dragging'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('safely no-ops when no wheel elements are found', () => {
    // Defensive path: strip the wheel class so the container query comes back
    // empty — the forwarder must bail without touching anything.
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0)}
        mobileNative={false}
        onChange={handler}
      />
    );
    wheels.forEach(w => w.classList.remove('timepicker-wheel'));
    const sep = document.querySelector('.timepicker-separator')!;
    expect(() =>
      firePointer(sep, 'pointerdown', {
        pointerId: 6,
        clientX: 10,
        clientY: 50,
      })
    ).not.toThrow();
    wheels.forEach(w => expect(w.className).not.toContain('is-dragging'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('does nothing when disabled (forwarder, pointer, keyboard, and wheel all inert)', () => {
    const fn = jest.fn();
    const { container, getAllByRole } = render(
      <TimeWheels value={{ hours: 10, minutes: 0 }} onChange={fn} disabled />
    );
    const wheels = getAllByRole('spinbutton');
    firePointer(wheels[0], 'pointerdown', { pointerId: 1, clientY: 200 });
    firePointer(wheels[0], 'pointermove', { pointerId: 1, clientY: 100 });
    expect(wheels[0].className).not.toContain('is-dragging');
    fireEvent.keyDown(wheels[0], { key: 'Home' });
    fireEvent.keyDown(wheels[0], { key: 'End' });
    fireEvent.keyDown(wheels[0], { key: 'ArrowDown' });
    fireEvent.wheel(wheels[0], { deltaY: 200 });
    const sep = container.querySelector('.timepicker-separator')!;
    firePointer(sep, 'pointerdown', { pointerId: 2, clientX: 0, clientY: 0 });
    wheels.forEach(w => expect(w.className).not.toContain('is-dragging'));
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('TimeWheels trackpad wheel accumulation', () => {
  it('steps once per 60px of accumulated deltaY, including multiple steps per event', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0)}
        mobileNative={false}
        onChange={handler}
      />
    );
    const hours = wheels[0];
    fireEvent.wheel(hours, { deltaY: 40 });
    expect(handler).not.toHaveBeenCalled(); // 40 < 60: no step yet
    fireEvent.wheel(hours, { deltaY: 40 });
    expect(lastDate(handler).getHours()).toBe(11); // 80 ≥ 60: one step, 20 remains
    fireEvent.wheel(hours, { deltaY: 130 });
    // 20 + 130 = 150 → two steps in one event (while loop).
    expect(lastDate(handler).getHours()).toBe(13);
  });

  it('scrolls to earlier values on negative deltaY', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0)}
        mobileNative={false}
        onChange={handler}
      />
    );
    fireEvent.wheel(wheels[0], { deltaY: -70 });
    expect(lastDate(handler).getHours()).toBe(9);
  });

  it('resets the accumulator when the scroll direction flips mid-gesture', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0)}
        mobileNative={false}
        onChange={handler}
      />
    );
    const hours = wheels[0];
    fireEvent.wheel(hours, { deltaY: 40 });
    fireEvent.wheel(hours, { deltaY: -30 }); // flip → accumulator restarts at -30
    expect(handler).not.toHaveBeenCalled();
    fireEvent.wheel(hours, { deltaY: -40 }); // -70 → one step down
    expect(handler).toHaveBeenCalledTimes(1);
    expect(lastDate(handler).getHours()).toBe(9);
  });

  it('resets the accumulator after a 250ms quiet window', () => {
    jest.useFakeTimers({
      doNotFake: [
        'performance',
        'requestAnimationFrame',
        'cancelAnimationFrame',
      ],
    });
    try {
      const handler = jest.fn();
      const { wheels } = openPicker(
        <Timepicker
          defaultValue={at(10, 0)}
          mobileNative={false}
          onChange={handler}
        />
      );
      const hours = wheels[0];
      fireEvent.wheel(hours, { deltaY: 40 });
      act(() => {
        jest.advanceTimersByTime(251);
      });
      // Without the reset this second 40 would cross 60 and step.
      fireEvent.wheel(hours, { deltaY: 40 });
      expect(handler).not.toHaveBeenCalled();
      fireEvent.wheel(hours, { deltaY: 30 }); // 70 ≥ 60 → now it steps
      expect(lastDate(handler).getHours()).toBe(11);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('TimeWheels keyboard and value mapping', () => {
  it('PageUp moves the hours wheel back by 5', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0)}
        mobileNative={false}
        onChange={handler}
      />
    );
    fireEvent.keyDown(wheels[0], { key: 'PageUp' });
    expect(lastDate(handler).getHours()).toBe(5);
  });

  it('maps 12 PM ± 1 on the 12h hours wheel back into 24h (PM branch)', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(12, 0)}
        hourFormat="12"
        mobileNative={false}
        onChange={handler}
      />
    );
    fireEvent.keyDown(wheels[0], { key: 'ArrowUp' }); // display 12 → 11 (PM)
    expect(lastDate(handler).getHours()).toBe(23);
  });

  it('maps 12 AM ± 1 on the 12h hours wheel back into 24h (AM branch)', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(0, 30)}
        hourFormat="12"
        mobileNative={false}
        onChange={handler}
      />
    );
    fireEvent.keyDown(wheels[0], { key: 'ArrowDown' }); // display 12 → 1 (AM)
    expect(lastDate(handler).getHours()).toBe(1);
    expect(lastDate(handler).getMinutes()).toBe(30);
  });

  it('ArrowDown on the seconds wheel advances the seconds', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0, 30)}
        enableSeconds
        mobileNative={false}
        onChange={handler}
      />
    );
    fireEvent.keyDown(wheels[2], { key: 'ArrowDown' });
    expect(lastDate(handler).getSeconds()).toBe(31);
  });

  it('AM/PM wheel ignores a change back to the current meridiem (identity early-return)', () => {
    const fn = jest.fn();
    const { getAllByRole } = render(
      <TimeWheels
        value={{ hours: 9, minutes: 0 }}
        onChange={fn}
        hourFormat="12"
      />
    );
    const ampm = getAllByRole('spinbutton')[2];
    fireEvent.keyDown(ampm, { key: 'ArrowDown' });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0][0]).toMatchObject({ hours: 21, minutes: 0 });
    // The value prop is uncontrolled here (still 9 AM = index 0), so moving
    // back fires onChange(0) — equal to the current ampmIndex → no commit.
    fireEvent.keyDown(ampm, { key: 'ArrowUp' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not commit when every candidate value is unselectable (nextValid exhaustion)', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0)}
        mobileNative={false}
        unselectableTimes={d => d.getHours() === 10}
        onChange={handler}
      />
    );
    // Every minute of hour 10 is blocked, so nextValid walks all 60
    // candidates, gives up, and the commit is rejected.
    fireEvent.keyDown(wheels[1], { key: 'ArrowDown' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('disables 12h hour items whose mapped 24h value is unselectable', () => {
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(14, 0)}
        hourFormat="12"
        mobileNative={false}
        unselectableTimes={d => d.getHours() === 15}
      />
    );
    const buttons = Array.from(
      wheels[0].querySelectorAll('button[role="option"]')
    ) as HTMLButtonElement[];
    const threes = buttons.filter(b => b.textContent?.trim() === '03');
    expect(threes.length).toBeGreaterThan(0);
    threes.forEach(b => expect(b.disabled).toBe(true)); // 3 PM = 15 blocked
    const fours = buttons.filter(b => b.textContent?.trim() === '04');
    expect(fours.length).toBeGreaterThan(0);
    fours.forEach(b => expect(b.disabled).toBe(false));
  });

  it('disables 12h hour items in the AM half too', () => {
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(2, 0)}
        hourFormat="12"
        mobileNative={false}
        unselectableTimes={d => d.getHours() === 3}
      />
    );
    const buttons = Array.from(
      wheels[0].querySelectorAll('button[role="option"]')
    ) as HTMLButtonElement[];
    const threes = buttons.filter(b => b.textContent?.trim() === '03');
    expect(threes.length).toBeGreaterThan(0);
    threes.forEach(b => expect(b.disabled).toBe(true)); // 3 AM blocked
    const fours = buttons.filter(b => b.textContent?.trim() === '04');
    expect(fours.length).toBeGreaterThan(0);
    fours.forEach(b => expect(b.disabled).toBe(false));
  });

  it('ArrowLeft on the first wheel keeps focus where it is', () => {
    const { wheels } = openPicker(
      <Timepicker defaultValue={at(10, 0)} mobileNative={false} />
    );
    wheels[0].focus();
    fireEvent.keyDown(wheels[0], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(wheels[0]);
  });

  it('Enter on the seconds wheel does not close the popover (no commit wired)', () => {
    const { wheels, getByRole } = openPicker(
      <Timepicker
        defaultValue={at(10, 0, 30)}
        enableSeconds
        mobileNative={false}
      />
    );
    fireEvent.keyDown(wheels[2], { key: 'Enter' });
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('hour and minute changes preserve the seconds part; ArrowUp steps seconds back', () => {
    const handler = jest.fn();
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 30, 30)}
        enableSeconds
        mobileNative={false}
        onChange={handler}
      />
    );
    fireEvent.keyDown(wheels[0], { key: 'ArrowDown' });
    expect(lastDate(handler).getHours()).toBe(11);
    expect(lastDate(handler).getSeconds()).toBe(30);
    fireEvent.keyDown(wheels[1], { key: 'ArrowDown' });
    expect(lastDate(handler).getMinutes()).toBe(31);
    expect(lastDate(handler).getSeconds()).toBe(30);
    fireEvent.keyDown(wheels[2], { key: 'ArrowUp' });
    expect(lastDate(handler).getSeconds()).toBe(29);
  });

  it('defaults a missing seconds part to 0 when enableSeconds is on', () => {
    const fn = jest.fn();
    const { getAllByRole } = render(
      <TimeWheels
        value={{ hours: 10, minutes: 0 }}
        onChange={fn}
        enableSeconds
      />
    );
    const wheels = getAllByRole('spinbutton');
    fireEvent.keyDown(wheels[0], { key: 'ArrowDown' });
    expect(fn).toHaveBeenLastCalledWith({ hours: 11, minutes: 0, seconds: 0 });
    fireEvent.keyDown(wheels[2], { key: 'ArrowDown' });
    expect(fn).toHaveBeenLastCalledWith({ hours: 10, minutes: 0, seconds: 1 });
  });

  it('disables second items blocked by unselectableTimes', () => {
    const { wheels } = openPicker(
      <Timepicker
        defaultValue={at(10, 0, 30)}
        enableSeconds
        mobileNative={false}
        unselectableTimes={d => d.getSeconds() === 33}
      />
    );
    const buttons = Array.from(
      wheels[2].querySelectorAll('button[role="option"]')
    ) as HTMLButtonElement[];
    const blocked = buttons.filter(b => b.textContent?.trim() === '33');
    expect(blocked.length).toBeGreaterThan(0);
    blocked.forEach(b => expect(b.disabled).toBe(true));
  });
});

// -------------------------------------------------------------------------
// Environment fallbacks — the wheel guards every timestamp read behind
// `typeof performance !== 'undefined'` (falling back to Date.now) and only
// consults `prefers-reduced-motion` when matchMedia exists.
// -------------------------------------------------------------------------

describe('TimeWheels environment fallbacks', () => {
  it('still pulses the band when matchMedia is unavailable', () => {
    const originalMatchMedia = window.matchMedia;
    const originalAnimate = HTMLElement.prototype.animate;
    const animateSpy = jest.fn(
      () => ({ cancel: jest.fn() }) as unknown as Animation
    );
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    (HTMLElement.prototype as unknown as { animate: jest.Mock }).animate =
      animateSpy;
    try {
      const fn = jest.fn();
      const { getAllByRole } = render(
        <TimeWheels value={{ hours: 10, minutes: 0 }} onChange={fn} />
      );
      fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
      expect(fn).toHaveBeenCalled();
      // No reduced-motion MQL to consult → the pulse fires unconditionally.
      expect(animateSpy).toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: originalMatchMedia,
      });
      if (originalAnimate) {
        HTMLElement.prototype.animate = originalAnimate;
      } else {
        delete (HTMLElement.prototype as unknown as { animate?: unknown })
          .animate;
      }
    }
  });

  it('drags, snaps, flings, and forwards using Date.now when performance is unavailable', () => {
    const realPerformance = globalThis.performance;
    Object.defineProperty(globalThis, 'performance', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    jest.spyOn(Date, 'now').mockImplementation(() => nowMs);
    try {
      const handler = jest.fn();
      const { wheels } = openPicker(
        <Timepicker
          defaultValue={at(10, 0)}
          mobileNative={false}
          onChange={handler}
        />
      );
      const hours = wheels[0];
      const minutes = wheels[1];
      // Slow drag → snap (Date.now drives the sample window + snap easing).
      nowMs = 5000;
      firePointer(hours, 'pointerdown', { pointerId: 1, clientY: 200 });
      nowMs = 5100;
      firePointer(hours, 'pointermove', { pointerId: 1, clientY: 168 });
      nowMs = 5200;
      firePointer(hours, 'pointermove', { pointerId: 1, clientY: 169 });
      firePointer(hours, 'pointerup', { pointerId: 1, clientY: 169 });
      flushFrames();
      expect(hours.getAttribute('aria-valuenow')).toBe('11');
      expect(lastDate(handler).getHours()).toBe(11);
      // Fast fling → momentum (Date.now drives the friction clock).
      nowMs = 6000;
      firePointer(minutes, 'pointerdown', { pointerId: 2, clientY: 300 });
      nowMs = 6016;
      firePointer(minutes, 'pointermove', { pointerId: 2, clientY: 260 });
      nowMs = 6032;
      firePointer(minutes, 'pointermove', { pointerId: 2, clientY: 220 });
      firePointer(minutes, 'pointerup', { pointerId: 2, clientY: 220 });
      flushFrames(300);
      expect(pendingFrames.size).toBe(0);
      const settledMinute = lastDate(handler).getMinutes();
      expect(minutes.getAttribute('aria-valuenow')).toBe(String(settledMinute));
      // Forwarded empty-space drag (Date.now stamps the first sample).
      jest.spyOn(hours, 'getBoundingClientRect').mockReturnValue(rect(0, 50));
      jest
        .spyOn(minutes, 'getBoundingClientRect')
        .mockReturnValue(rect(60, 110));
      const sep = document.querySelector('.timepicker-separator')!;
      nowMs = 7000;
      firePointer(sep, 'pointerdown', {
        pointerId: 3,
        clientX: 20,
        clientY: 100,
      });
      expect(hours.className).toContain('is-dragging');
      firePointer(hours, 'pointerup', { pointerId: 3, clientY: 100 });
    } finally {
      Object.defineProperty(globalThis, 'performance', {
        configurable: true,
        writable: true,
        value: realPerformance,
      });
    }
  });
});

// -------------------------------------------------------------------------
// Audio unlock — pointerdown (and the forwarded startDrag) must resume the
// AudioContext from inside the user gesture so the first tick can play.
// -------------------------------------------------------------------------

describe('TimeWheels audio unlock on drag', () => {
  let originalAudioContext: typeof window.AudioContext | undefined;
  let audioCtorSpy: jest.Mock;
  let resumeSpy: jest.Mock;

  beforeEach(() => {
    __resetAudioTickForTest();
    originalAudioContext = window.AudioContext;
    resumeSpy = jest.fn().mockResolvedValue(undefined);
    const mockCtx = {
      state: 'suspended' as AudioContextState,
      currentTime: 0,
      resume: resumeSpy,
      close: jest.fn().mockResolvedValue(undefined),
      destination: {},
    };
    audioCtorSpy = jest.fn(() => mockCtx);
    (window as unknown as { AudioContext: jest.Mock }).AudioContext =
      audioCtorSpy;
  });

  afterEach(() => {
    __resetAudioTickForTest();
    if (originalAudioContext) {
      window.AudioContext = originalAudioContext;
    } else {
      delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    }
  });

  it('pointerdown on a wheel unlocks the suspended audio context when audioTick is on', () => {
    const { wheels } = openPicker(
      <Timepicker defaultValue={at(10, 0)} mobileNative={false} audioTick />
    );
    firePointer(wheels[0], 'pointerdown', { pointerId: 1, clientY: 200 });
    expect(audioCtorSpy).toHaveBeenCalled();
    expect(resumeSpy).toHaveBeenCalled();
    firePointer(wheels[0], 'pointerup', { pointerId: 1, clientY: 200 });
  });

  it('a forwarded empty-space drag also unlocks the audio context', () => {
    const { wheels } = openPicker(
      <Timepicker defaultValue={at(10, 0)} mobileNative={false} audioTick />
    );
    jest.spyOn(wheels[0], 'getBoundingClientRect').mockReturnValue(rect(0, 50));
    jest
      .spyOn(wheels[1], 'getBoundingClientRect')
      .mockReturnValue(rect(60, 110));
    const sep = document.querySelector('.timepicker-separator')!;
    firePointer(sep, 'pointerdown', {
      pointerId: 3,
      clientX: 20,
      clientY: 100,
    });
    expect(audioCtorSpy).toHaveBeenCalled();
    expect(resumeSpy).toHaveBeenCalled();
    firePointer(wheels[0], 'pointerup', { pointerId: 3, clientY: 100 });
  });
});
