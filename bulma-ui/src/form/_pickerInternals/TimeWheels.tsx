/* eslint-disable react-hooks/refs --
 * This wheel/momentum picker intentionally accesses refs during render:
 *  - state is mirrored into refs (positionRef, audioTickEnabledRef) so the
 *    RAF/drag/tick callbacks read the latest values in lockstep with rendering
 *    (refactoring to effect-synced refs would desync drag from the frame);
 *  - a MediaQueryList is lazily cached in a ref (reducedMotionMqlRef);
 *  - per-column Wheel handle refs build the keyboard focus order.
 * These are deliberate, established patterns; behavior is covered by unit tests
 * and certified interactively in-browser (drag, ticks, keyboard focus nav).
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  classNames,
  prefixedClassNames,
  usePrefixedClassNames,
} from '../../helpers/classNames';
import { useConfig } from '../../helpers/Config';
import { HourFormat, PickerLabels, mergeLabels } from './pickerTypes';
import { setTimeOfDay } from './dateUtils';
import { tickHaptic as fireTickHaptic } from './haptics';
import { playAudioTick, unlockAudioTick } from './audioTick';

export interface TimeWheelsValue {
  hours: number;
  minutes: number;
  seconds?: number;
}

export interface TimeWheelsProps {
  value: TimeWheelsValue;
  onChange: (v: TimeWheelsValue) => void;
  hourFormat?: HourFormat;
  enableSeconds?: boolean;
  /** Step between visible values in the wheel. Default `1`. */
  incrementHours?: number;
  incrementMinutes?: number;
  incrementSeconds?: number;
  unselectableTimes?: (d: Date) => boolean;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
  className?: string;
  id?: string;
  labels?: PickerLabels;
  /** Number of items visible at once (must be odd). Default 5. */
  visibleCount?: number;
  /** Item height in px. Default 32. */
  itemHeight?: number;
  /**
   * Play a short audible tick on each item crossing. Useful as a fallback on
   * iOS Safari, where there is no web-accessible haptic API. Off by default
   * to avoid surprising users with sound; flip on for iOS-targeted UIs.
   */
  audioTick?: boolean;
  /**
   * Fired when the user presses Enter on a wheel column. The current value is
   * already committed (each wheel-tick calls onChange), so this typically just
   * needs to close the surrounding popover.
   */
  onCommit?: () => void;
}

const wrap = (n: number, max: number): number => ((n % max) + max) % max;

/**
 * Walk forward (or backward) from `start` in `step` steps until `test` returns
 * true or we've cycled all `max` candidates. Used to skip past unselectable
 * values without freezing the wheel.
 */
function nextValid(
  start: number,
  step: number,
  max: number,
  test: (n: number) => boolean
): number {
  let candidate = wrap(start, max);
  for (let i = 0; i < max; i++) {
    if (test(candidate)) return candidate;
    candidate = wrap(candidate + step, max);
  }
  return start;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

interface WheelHandle {
  focus: () => void;
  /**
   * Begin a drag externally — used by the parent's empty-space forwarder so
   * the user can grab the wheel by touching anywhere in the wheels row, not
   * just on the column itself (matches iOS native picker behavior).
   *
   * The pointer must already be active (i.e., a real `pointerdown` is in
   * flight). We immediately capture the pointer on the wheel root so the
   * existing `onPointerMove` / `onPointerUp` handlers will fire here.
   */
  startDrag: (pointerId: number, clientY: number) => void;
}

interface WheelProps<T> {
  values: T[];
  index: number;
  onChange: (nextIndex: number) => void;
  formatLabel: (v: T) => string;
  formatAriaText?: (v: T) => string;
  ariaLabel: string;
  visibleCount: number;
  itemHeight: number;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  onFocusPrev?: () => void;
  onFocusNext?: () => void;
  /** Fired when Enter is pressed (current value is already committed live). */
  onCommit?: () => void;
  /**
   * Whether the wheel wraps at the edges. When true, scrolling past the last
   * value rolls back to the first (and vice versa) and neighbouring values
   * are visible above the first / below the last item.
   */
  wrap?: boolean;
  /**
   * Optional predicate. Items for which it returns `true` are rendered with
   * the `disabled` attribute (and visually dimmed via the `:disabled` SCSS
   * rule), giving users a clear cue that the value is blocked. Keyboard /
   * wheel navigation may still pass over these positions, but `onChange`
   * callers (`TimeWheels`) skip them via `nextValid`.
   */
  disabledFor?: (v: T) => boolean;
  /**
   * Play an audible tick on each item crossing. Used as the iOS substitute
   * for haptic feedback; threaded from `TimeWheels.audioTick`.
   */
  audioTick?: boolean;
}

const WheelInner = <T,>(
  {
    values,
    index,
    onChange,
    formatLabel,
    formatAriaText,
    ariaLabel,
    visibleCount,
    itemHeight,
    disabled,
    size,
    color,
    onFocusPrev,
    onFocusNext,
    onCommit,
    wrap = false,
    disabledFor,
    audioTick = false,
  }: WheelProps<T>,
  ref: React.Ref<WheelHandle>
) => {
  const { classPrefix } = useConfig();
  const N = values.length;
  const half = Math.floor(visibleCount / 2);
  const containerHeight = visibleCount * itemHeight;
  // Buffer around the visible window so adjacent items animate in/out smoothly.
  const BUFFER = half + 2;

  // Continuous wheel position in units of items. Math.round(position) is the
  // "active" virtual index; the fractional part is the drag/momentum offset
  // within an item slot. Using a single float (rather than virtualIdx +
  // dragOffset) keeps drag and tick-update in lockstep so items move with the
  // finger without a 40px overshoot when crossing item boundaries.
  const [position, setPosition] = useState<number>(index);
  const positionRef = useRef<number>(index);
  positionRef.current = position;
  const [isDragging, setIsDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // Ref to the stationary selection band — populated by the JSX below. The
  // band briefly scales + brightens on each item tick so users perceive a
  // body-felt "thunk" even on iOS where no haptic API exists.
  const bandRef = useRef<HTMLDivElement>(null);
  // Cached MediaQueryList for `prefers-reduced-motion`. We read this on
  // every tick to decide whether to fire the band pulse; caching the MQL
  // saves a `matchMedia` call per tick (which can fire at ~20Hz during a
  // momentum flick).
  const reducedMotionMqlRef = useRef<MediaQueryList | null>(null);
  if (
    reducedMotionMqlRef.current === null &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
  ) {
    reducedMotionMqlRef.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );
  }
  // In-flight band pulse animation (Web Animations API). Tracked so we can
  // cancel on unmount; the WAI's `composite: 'replace'` semantics handle
  // re-trigger automatically without us needing to cancel between ticks.
  const pulseAnimRef = useRef<Animation | null>(null);
  // True while the external `index` prop sync useEffect runs, so we don't
  // fire a haptic blip when the parent updates the value programmatically.
  const isSyncingRef = useRef<boolean>(false);

  // Tiny haptic/audio/visual blip per item tick. Haptic uses
  // `navigator.vibrate` where available (Android Chrome / Firefox Android /
  // Samsung Internet); iOS has no web-accessible haptic path as of May
  // 2026, so the optional `audioTick` plays a low-frequency thunk as the
  // closest UX substitute. The visual band-pulse fires on every tick on
  // every platform (gated only by `prefers-reduced-motion`) so the
  // selection band feels reactive — visual reinforcement of the tactile
  // feedback. We skip all three during programmatic prop sync so a parent
  // re-render doesn't blip.
  const audioTickEnabledRef = useRef<boolean>(audioTick);
  audioTickEnabledRef.current = audioTick;
  const playBandPulse = useCallback(() => {
    const el = bandRef.current;
    if (!el || typeof el.animate !== 'function') return;
    if (reducedMotionMqlRef.current?.matches) return;
    // Compound scale + brightness pulse, peaking at 40% through the 110ms
    // duration. `composite: 'replace'` means a re-trigger mid-pulse cleanly
    // restarts rather than queueing — important at fling rates where ticks
    // can fire every ~50ms.
    pulseAnimRef.current = el.animate(
      [
        { transform: 'scale(1)', filter: 'brightness(1)' },
        {
          transform: 'scale(1.04)',
          filter: 'brightness(1.15)',
          offset: 0.4,
        },
        { transform: 'scale(1)', filter: 'brightness(1)' },
      ],
      { duration: 110, easing: 'ease-out', composite: 'replace' }
    );
  }, []);
  const tickFeedback = useCallback(() => {
    /* istanbul ignore next: the sync flag is only true synchronously inside the prop-sync effect, which sets position directly and never routes through commitPosition */
    if (isSyncingRef.current) return;
    fireTickHaptic();
    if (audioTickEnabledRef.current) playAudioTick();
    playBandPulse();
  }, [playBandPulse]);
  const dragStateRef = useRef<{
    pointerId: number | null;
    startY: number;
    startPosition: number;
    captured: boolean;
    samples: { t: number; y: number }[];
  }>({
    pointerId: null,
    startY: 0,
    startPosition: 0,
    captured: false,
    samples: [],
  });
  // RAF id for the in-flight momentum / snap animation, so we can cancel when
  // the user grabs the wheel again or the component unmounts.
  const rafIdRef = useRef<number | null>(null);

  const virtualIdx = Math.round(position);

  const cancelRaf = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      cancelRaf();
      // Cancel any in-flight band pulse so it doesn't keep a reference to
      // a detached DOM node. WAI Animation.cancel() is safe to call even
      // if the animation has already finished.
      pulseAnimRef.current?.cancel();
      pulseAnimRef.current = null;
    },
    [cancelRaf]
  );

  React.useImperativeHandle(
    ref,
    () => ({
      focus: () => rootRef.current?.focus(),
      startDrag: (pointerId: number, clientY: number) => {
        /* istanbul ignore next: the empty-space forwarder (sole caller) already returns on the same disabled prop */
        if (disabled) return;
        cancelRaf();
        if (audioTickEnabledRef.current) unlockAudioTick();
        const now =
          typeof performance !== 'undefined' ? performance.now() : Date.now();
        dragStateRef.current = {
          pointerId,
          startY: clientY,
          startPosition: positionRef.current,
          // Skip the drag-threshold gate: the parent forwarder has already
          // decided this is a drag (a pointerdown landed on empty space,
          // which has no click target).
          captured: true,
          samples: [{ t: now, y: clientY }],
        };
        try {
          rootRef.current?.setPointerCapture(pointerId);
        } catch {
          // setPointerCapture can throw if the pointer isn't currently
          // active for this element; the existing onPointerMove handler
          // still matches on pointerId so the drag will work either way.
        }
        setIsDragging(true);
      },
    }),
    [disabled, cancelRaf]
  );

  // Resolve a virtualIdx into an actual values[] index (modulo wrap if `wrap`).
  const toActual = useCallback(
    (v: number) => {
      if (wrap) return ((v % N) + N) % N;
      return Math.max(0, Math.min(N - 1, v));
    },
    [wrap, N]
  );

  const clampPosition = useCallback(
    (p: number) => {
      if (wrap) return p;
      return Math.max(0, Math.min(N - 1, p));
    },
    [wrap, N]
  );

  // Update position and fire onChange if the rounded value changed.
  const commitPosition = useCallback(
    (next: number) => {
      const clamped = clampPosition(next);
      const prevRound = Math.round(positionRef.current);
      const nextRound = Math.round(clamped);
      positionRef.current = clamped;
      setPosition(clamped);
      if (nextRound !== prevRound) {
        onChange(toActual(nextRound));
        tickFeedback();
      }
    },
    [clampPosition, onChange, toActual, tickFeedback]
  );

  // When the external `index` changes (e.g. from typed input), re-sync
  // position to the closest virtual position that maps to it.
  //
  // Crucial subtlety: this effect re-runs every time the parent value
  // changes — including the round-trip case where the user's own scroll
  // commits a tick → fires onChange → parent re-renders with the new
  // index → here. If we cancelled the in-flight momentum/snap RAF on
  // every such echo, the snap would never get to land on an integer
  // (the user's wheel would stop wherever the last tick fired). So we
  // bail out early when the rounded position already matches the
  // incoming index — the echo case — and only cancel + apply an actual
  // jump when the parent has moved us somewhere we don't already round
  // to.
  useEffect(() => {
    const prev = positionRef.current;
    const wrappedRoundPrev = ((Math.round(prev) % N) + N) % N;
    if (wrappedRoundPrev === index) return;
    cancelRaf();
    isSyncingRef.current = true;
    setPosition(prevPos => {
      if (!wrap) {
        positionRef.current = index;
        return index;
      }
      const wrappedPrev = ((prevPos % N) + N) % N;
      const forward = (index - wrappedPrev + N) % N;
      const backward = forward - N;
      const delta =
        Math.abs(forward) <= Math.abs(backward) ? forward : backward;
      const next = prevPos + delta;
      positionRef.current = next;
      return next;
    });
    isSyncingRef.current = false;
  }, [index, N, wrap, cancelRaf]);

  const moveBy = useCallback(
    (delta: number) => {
      if (disabled) return;
      cancelRaf();
      commitPosition(Math.round(positionRef.current) + delta);
    },
    [disabled, cancelRaf, commitPosition]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveBy(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveBy(1);
          break;
        case 'PageUp':
          e.preventDefault();
          moveBy(-5);
          break;
        case 'PageDown':
          e.preventDefault();
          moveBy(5);
          break;
        case 'Home':
          e.preventDefault();
          if (disabled) break;
          cancelRaf();
          commitPosition(0);
          break;
        case 'End':
          e.preventDefault();
          if (disabled) break;
          cancelRaf();
          commitPosition(N - 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onFocusPrev?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onFocusNext?.();
          break;
        case 'Enter':
          e.preventDefault();
          onCommit?.();
          break;
      }
    },
    [
      moveBy,
      disabled,
      commitPosition,
      cancelRaf,
      N,
      onFocusPrev,
      onFocusNext,
      onCommit,
    ]
  );

  // Animate position to the nearest integer with ease-out cubic. Used after a
  // drag / momentum settles, so the wheel always rests aligned to an item.
  const animateSnap = useCallback(() => {
    cancelRaf();
    const start = positionRef.current;
    const target = Math.round(start);
    if (start === target) return;
    const duration = 180;
    const startTime =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = start + (target - start) * eased;
      commitPosition(next);
      if (t < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };
    rafIdRef.current = requestAnimationFrame(tick);
  }, [cancelRaf, commitPosition]);

  // Kinetic momentum after a flick. Uses exponential friction so the velocity
  // tapers smoothly. Updates `position` in items/ms; commitPosition handles
  // the onChange ticks as virtualIdx crosses integers.
  const startMomentum = useCallback(
    (initialPxPerMs: number) => {
      cancelRaf();
      // Drag-up (negative dy/dt in screen coords) should INCREASE position
      // (later values come into view), so flip the sign.
      let velocity = -initialPxPerMs / itemHeight; // items / ms
      // Cap initial velocity so a frantic swipe doesn't blast through the
      // whole list. Empirically tuned to match iOS feel.
      const MAX_VEL = 0.05; // items/ms (≈ 50 items/sec)
      if (velocity > MAX_VEL) velocity = MAX_VEL;
      if (velocity < -MAX_VEL) velocity = -MAX_VEL;
      const STOP_VEL = 0.0015; // items/ms (≈ 1.5 items/sec)
      // Friction coefficient per millisecond — chosen so velocity halves
      // every ~120ms.
      const FRICTION_PER_MS = Math.pow(0.5, 1 / 120);
      let lastTime =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
      const tick = (now: number) => {
        const dt = Math.max(1, now - lastTime);
        lastTime = now;
        let next = positionRef.current + velocity * dt;
        // Boundary handling for non-wrapping wheels: clamp and zero the
        // velocity so we don't keep ticking against the wall.
        if (!wrap) {
          if (next <= 0) {
            next = 0;
            velocity = 0;
          } else if (next >= N - 1) {
            next = N - 1;
            velocity = 0;
          }
        }
        commitPosition(next);
        velocity *= Math.pow(FRICTION_PER_MS, dt);
        if (Math.abs(velocity) < STOP_VEL) {
          animateSnap();
          return;
        }
        rafIdRef.current = requestAnimationFrame(tick);
      };
      rafIdRef.current = requestAnimationFrame(tick);
    },
    [cancelRaf, commitPosition, itemHeight, wrap, N, animateSnap]
  );

  // Mouse wheel: accumulate deltaY across events and step when the
  // accumulator crosses SCROLL_STEP_PX. Trackpads emit dozens of small
  // events per swipe; without accumulation a single gesture flies the wheel.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || disabled) return undefined;
    const SCROLL_STEP_PX = 60;
    const QUIET_MS = 250;
    let accumulated = 0;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;
    const resetAccumulator = () => {
      accumulated = 0;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Reset accumulator if scroll direction reversed mid-gesture.
      if (accumulated !== 0 && Math.sign(accumulated) !== Math.sign(e.deltaY)) {
        accumulated = 0;
      }
      accumulated += e.deltaY;
      while (Math.abs(accumulated) >= SCROLL_STEP_PX) {
        if (accumulated > 0) {
          moveBy(1);
          accumulated -= SCROLL_STEP_PX;
        } else {
          moveBy(-1);
          accumulated += SCROLL_STEP_PX;
        }
      }
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(resetAccumulator, QUIET_MS);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [moveBy, disabled]);

  // Pointer drag.
  // We DELAY capturing the pointer until the user moves more than
  // DRAG_THRESHOLD_PX. Without this, capturing on pointerdown would redirect
  // mouseup → wheel root, which suppresses the click event on the item button
  // the user pressed (so single-clicks on neighbouring items would no-op).
  const DRAG_THRESHOLD_PX = 4;
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    cancelRaf();
    if (audioTickEnabledRef.current) {
      // Resume the AudioContext from inside the user gesture so the first
      // tick of this drag can play (iOS Safari requires this; other browsers
      // are forgiving but it's a cheap idempotent call).
      unlockAudioTick();
    }
    const now =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    dragStateRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startPosition: positionRef.current,
      captured: false,
      samples: [{ t: now, y: e.clientY }],
    };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragStateRef.current;
    if (s.pointerId !== e.pointerId) return;
    const dy = e.clientY - s.startY;
    if (!s.captured) {
      if (Math.abs(dy) < DRAG_THRESHOLD_PX) return;
      rootRef.current?.setPointerCapture(e.pointerId);
      s.captured = true;
      setIsDragging(true);
    }
    const now =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    s.samples.push({ t: now, y: e.clientY });
    // Keep the velocity sample window short so the post-flick velocity
    // reflects the *recent* finger speed, not the whole-drag average.
    const VELOCITY_WINDOW_MS = 100;
    while (s.samples.length > 2 && now - s.samples[0].t > VELOCITY_WINDOW_MS) {
      s.samples.shift();
    }
    // Continuous position: every itemHeight worth of finger drag advances
    // the wheel by 1 unit. Pulling the finger DOWN (positive dy) shows
    // EARLIER values, which means position decreases.
    commitPosition(s.startPosition - dy / itemHeight);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragStateRef.current;
    if (s.pointerId !== e.pointerId) return;
    if (s.captured) {
      rootRef.current?.releasePointerCapture(e.pointerId);
      // Drags don't fire click → focus would be left on whichever child
      // received pointerdown. Pull it back to the wheel root so :focus
      // emphasis still reads correctly after a drag.
      rootRef.current?.focus();
      // Compute fling velocity from the recent sample window.
      const samples = s.samples;
      let pxPerMs = 0;
      if (samples.length >= 2) {
        const first = samples[0];
        const last = samples[samples.length - 1];
        const dt = last.t - first.t;
        if (dt > 0) pxPerMs = (last.y - first.y) / dt;
      }
      // Threshold below which we just snap to the nearest item; above which
      // we kick off momentum.
      const FLING_THRESHOLD = 0.25; // px/ms ≈ 250 px/sec
      if (Math.abs(pxPerMs) > FLING_THRESHOLD) {
        startMomentum(pxPerMs);
      } else {
        animateSnap();
      }
    }
    s.pointerId = null;
    s.captured = false;
    s.samples = [];
    setIsDragging(false);
  };

  const rootClass = prefixedClassNames(classPrefix, 'timeinput-wheel', {
    [`is-${color}`]: !!color,
    [`is-${size}`]: !!size,
    'is-disabled': disabled,
    'is-dragging': isDragging,
  });
  const itemClass = (selected: boolean) =>
    prefixedClassNames(classPrefix, 'timeinput-wheel-item', {
      'is-selected': selected,
      [`is-${color}`]: selected && !!color,
    });
  const bandClass = prefixedClassNames(classPrefix, 'timeinput-wheel-band', {
    [`is-${color}`]: !!color,
  });

  // Build the buffered window of items to render around the current position.
  const items: { vIdx: number; aIdx: number }[] = [];
  for (let off = -BUFFER; off <= BUFFER; off++) {
    const vIdx = virtualIdx + off;
    if (!wrap && (vIdx < 0 || vIdx >= N)) continue;
    const aIdx = toActual(vIdx);
    items.push({ vIdx, aIdx });
  }

  const ariaText = formatAriaText
    ? formatAriaText(values[toActual(virtualIdx)])
    : formatLabel(values[toActual(virtualIdx)]);

  // Center of the wheel viewport, in px from the top.
  const centreTop = containerHeight / 2 - itemHeight / 2;

  return (
    <div
      ref={rootRef}
      role="spinbutton"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={N - 1}
      aria-valuenow={toActual(virtualIdx)}
      aria-valuetext={ariaText}
      tabIndex={disabled ? -1 : 0}
      className={rootClass}
      style={{ height: containerHeight }}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Stationary selection band — sits at the centre of the viewport while
          items slide through it, like the iOS native picker. The ref lets
          `playBandPulse` animate scale + brightness on each item tick. */}
      <div
        ref={bandRef}
        className={bandClass}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: centreTop,
          height: itemHeight,
          pointerEvents: 'none',
        }}
      />
      {items.map(({ vIdx, aIdx }) => {
        // Continuous offset in items: items at the centre have offset ≈ 0;
        // top of viewport is negative, bottom positive.
        const offCentreItems = vIdx - position;
        const top = centreTop + offCentreItems * itemHeight;
        const selected = vIdx === virtualIdx;
        const itemDisabled =
          disabled || (disabledFor ? disabledFor(values[aIdx]) : false);
        return (
          <button
            key={vIdx}
            type="button"
            role="option"
            aria-selected={selected}
            tabIndex={-1}
            className={itemClass(selected)}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: itemHeight,
              top: `${top}px`,
            }}
            disabled={itemDisabled}
            onClick={() => {
              moveBy(vIdx - virtualIdx);
              // Click focuses the <button> child by default; pull focus back
              // to the wheel root so the column emphasis (:focus rules) match.
              rootRef.current?.focus();
            }}
          >
            {formatLabel(values[aIdx])}
          </button>
        );
      })}
    </div>
  );
};

const Wheel = React.forwardRef(WheelInner) as <T>(
  props: WheelProps<T> & { ref?: React.Ref<WheelHandle> }
) => React.ReactElement;

export const TimeWheels: React.FC<TimeWheelsProps> = ({
  value,
  onChange,
  hourFormat = '24',
  enableSeconds = false,
  incrementHours = 1,
  incrementMinutes = 1,
  incrementSeconds = 1,
  unselectableTimes,
  size,
  color,
  disabled,
  className,
  id,
  labels,
  visibleCount = 5,
  itemHeight = 32,
  audioTick = false,
  onCommit,
}) => {
  const t = mergeLabels(labels);

  const rootClass = usePrefixedClassNames('timeinput', {
    [`is-${color}`]: !!color,
    [`is-${size}`]: !!size,
    'is-disabled': disabled,
  });
  const wheelsClass = usePrefixedClassNames('timeinput-wheels');
  const sepClass = usePrefixedClassNames('timeinput-separator');
  // Use the prefixed class through the same helper the wheels themselves do,
  // so the selector matches the actual rendered class regardless of whether
  // the consumer configured `classPrefix` via ConfigProvider. Building the
  // selector with `${classPrefix}timeinput-wheel` is wrong when classPrefix
  // is undefined (defaults to the empty prefix) — it would stringify to
  // "undefinedtimeinput-wheel".
  const wheelSingleClass = usePrefixedClassNames('timeinput-wheel');
  const wheelsContainerRef = useRef<HTMLDivElement>(null);

  const isPm = value.hours >= 12;

  const isTimeAllowed = useCallback(
    (h: number, m: number, s: number) => {
      if (!unselectableTimes) return true;
      const probe = setTimeOfDay(new Date(), {
        hours: h,
        minutes: m,
        seconds: s,
      });
      return !unselectableTimes(probe);
    },
    [unselectableTimes]
  );

  // Per-column "is this value disabled?" predicates. We compute them against
  // the current value's other parts, so e.g. a predicate that only blocks
  // 12:00–12:59 leaves all minutes selectable when the user moves the hour
  // off 12. Returning `undefined` (rather than a function) when there is no
  // unselectableTimes lets the Wheel skip the disabled-attribute branch.
  const isHourDisabled = useCallback(
    (display: number) => {
      let h24 = display;
      if (hourFormat === '12') {
        const base = display % 12;
        h24 = isPm ? base + 12 : base;
      }
      return !isTimeAllowed(h24, value.minutes, value.seconds ?? 0);
    },
    [hourFormat, isPm, isTimeAllowed, value.minutes, value.seconds]
  );
  const isMinuteDisabled = useCallback(
    (m: number) => !isTimeAllowed(value.hours, m, value.seconds ?? 0),
    [isTimeAllowed, value.hours, value.seconds]
  );
  const isSecondDisabled = useCallback(
    (s: number) => !isTimeAllowed(value.hours, value.minutes, s),
    [isTimeAllowed, value.hours, value.minutes]
  );
  const hourDisabledFor = unselectableTimes ? isHourDisabled : undefined;
  const minuteDisabledFor = unselectableTimes ? isMinuteDisabled : undefined;
  const secondDisabledFor = unselectableTimes ? isSecondDisabled : undefined;

  const commit = useCallback(
    (next: Partial<TimeWheelsValue>) => {
      const merged: TimeWheelsValue = {
        hours: next.hours ?? value.hours,
        minutes: next.minutes ?? value.minutes,
        seconds: enableSeconds
          ? (next.seconds ?? value.seconds ?? 0)
          : undefined,
      };
      if (!isTimeAllowed(merged.hours, merged.minutes, merged.seconds ?? 0)) {
        return;
      }
      onChange(merged);
    },
    [value, enableSeconds, isTimeAllowed, onChange]
  );

  // Build the value lists per column.
  const hourValues = useMemo<number[]>(() => {
    const step = Math.max(1, incrementHours);
    if (hourFormat === '12') {
      const out: number[] = [];
      for (let h = 1; h <= 12; h += step) out.push(h);
      return out;
    }
    const out: number[] = [];
    for (let h = 0; h < 24; h += step) out.push(h);
    return out;
  }, [hourFormat, incrementHours]);

  const minuteValues = useMemo<number[]>(() => {
    const step = Math.max(1, incrementMinutes);
    const out: number[] = [];
    for (let m = 0; m < 60; m += step) out.push(m);
    return out;
  }, [incrementMinutes]);

  const secondValues = useMemo<number[]>(() => {
    const step = Math.max(1, incrementSeconds);
    const out: number[] = [];
    for (let s = 0; s < 60; s += step) out.push(s);
    return out;
  }, [incrementSeconds]);

  // Map current value → wheel index.
  const displayedHours =
    hourFormat === '12'
      ? value.hours % 12 === 0
        ? 12
        : value.hours % 12
      : value.hours;
  const hourIndex = Math.max(0, hourValues.indexOf(displayedHours));
  const minuteIndex = Math.max(0, minuteValues.indexOf(value.minutes));
  const secondIndex = Math.max(0, secondValues.indexOf(value.seconds ?? 0));
  const ampmIndex = isPm ? 1 : 0;

  // Refs for column focus management.
  const hoursRef = useRef<WheelHandle>(null);
  const minutesRef = useRef<WheelHandle>(null);
  const secondsRef = useRef<WheelHandle>(null);
  const ampmRef = useRef<WheelHandle>(null);

  // Build the focus order at runtime.
  const columnOrder: React.RefObject<WheelHandle | null>[] = [];
  columnOrder.push(hoursRef);
  columnOrder.push(minutesRef);
  if (enableSeconds) columnOrder.push(secondsRef);
  if (hourFormat === '12') columnOrder.push(ampmRef);
  const focusAt = (i: number) => columnOrder[i]?.current?.focus();
  const indexOf = (r: React.RefObject<WheelHandle | null>): number =>
    columnOrder.indexOf(r);
  const focusPrevOf = (r: React.RefObject<WheelHandle | null>) => () =>
    focusAt(indexOf(r) - 1);
  const focusNextOf = (r: React.RefObject<WheelHandle | null>) => () =>
    focusAt(indexOf(r) + 1);

  // Hour change — translate displayed value back into 24h.
  const onHourIndex = (next: number) => {
    const display =
      hourValues[Math.max(0, Math.min(hourValues.length - 1, next))];
    let next24 = display;
    if (hourFormat === '12') {
      const baseHour = display % 12;
      next24 = isPm ? baseHour + 12 : baseHour;
    }
    // Skip past any blocked hour using nextValid.
    const allowed = nextValid(next24, next24 >= value.hours ? 1 : -1, 24, h =>
      isTimeAllowed(h, value.minutes, value.seconds ?? 0)
    );
    commit({ hours: allowed });
  };

  const onMinuteIndex = (next: number) => {
    const m =
      minuteValues[Math.max(0, Math.min(minuteValues.length - 1, next))];
    const allowed = nextValid(m, m >= value.minutes ? 1 : -1, 60, mm =>
      isTimeAllowed(value.hours, mm, value.seconds ?? 0)
    );
    commit({ minutes: allowed });
  };

  const onSecondIndex = (next: number) => {
    const s =
      secondValues[Math.max(0, Math.min(secondValues.length - 1, next))];
    const allowed = nextValid(s, s >= (value.seconds ?? 0) ? 1 : -1, 60, ss =>
      isTimeAllowed(value.hours, value.minutes, ss)
    );
    commit({ seconds: allowed });
  };

  const onAmpmIndex = (next: number) => {
    if (next === ampmIndex) return;
    commit({ hours: (value.hours + 12) % 24 });
  };

  // Forward drags that originate on the empty space inside the wheels row
  // (left of the leftmost wheel, right of the rightmost wheel, on the
  // separator) to whichever wheel column is nearest to the pointer X — so
  // the picker behaves like the iOS native one, where the whole picker
  // surface is grabbable, not just the column itself.
  const onWheelsContainerPointerDown = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (disabled) return;
    // If the pointerdown landed on a real wheel column, the wheel's own
    // handler takes over — don't double-dispatch.
    if ((e.target as HTMLElement).closest(`.${wheelSingleClass}`)) return;
    const container = wheelsContainerRef.current;
    /* istanbul ignore next: the handler is attached to the very element this ref points to, so it can't be null while events fire */
    if (!container) return;
    const wheels = container.querySelectorAll<HTMLElement>(
      `.${wheelSingleClass}`
    );
    if (wheels.length === 0) return;
    let nearestIdx = 0;
    let nearestDist = Infinity;
    const x = e.clientX;
    wheels.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const cx = (r.left + r.right) / 2;
      const d = Math.abs(x - cx);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    });
    columnOrder[nearestIdx]?.current?.startDrag(e.pointerId, e.clientY);
  };

  return (
    <div
      id={id}
      className={classNames(rootClass, className)}
      aria-disabled={disabled}
    >
      <div
        className={wheelsClass}
        ref={wheelsContainerRef}
        onPointerDown={onWheelsContainerPointerDown}
      >
        <Wheel
          ref={hoursRef}
          values={hourValues}
          index={hourIndex}
          onChange={onHourIndex}
          formatLabel={pad2}
          ariaLabel={t.hours}
          visibleCount={visibleCount}
          itemHeight={itemHeight}
          disabled={disabled}
          size={size}
          color={color}
          wrap
          onCommit={onCommit}
          onFocusPrev={focusPrevOf(hoursRef)}
          onFocusNext={focusNextOf(hoursRef)}
          disabledFor={hourDisabledFor}
          audioTick={audioTick}
        />
        <div className={sepClass} aria-hidden="true">
          :
        </div>
        <Wheel
          ref={minutesRef}
          values={minuteValues}
          index={minuteIndex}
          onChange={onMinuteIndex}
          formatLabel={pad2}
          ariaLabel={t.minutes}
          visibleCount={visibleCount}
          itemHeight={itemHeight}
          disabled={disabled}
          size={size}
          color={color}
          wrap
          onCommit={onCommit}
          onFocusPrev={focusPrevOf(minutesRef)}
          onFocusNext={focusNextOf(minutesRef)}
          disabledFor={minuteDisabledFor}
          audioTick={audioTick}
        />
        {enableSeconds && (
          <>
            <div className={sepClass} aria-hidden="true">
              :
            </div>
            <Wheel
              ref={secondsRef}
              values={secondValues}
              index={secondIndex}
              onChange={onSecondIndex}
              formatLabel={pad2}
              ariaLabel={t.seconds}
              visibleCount={visibleCount}
              itemHeight={itemHeight}
              disabled={disabled}
              size={size}
              color={color}
              wrap
              onFocusPrev={focusPrevOf(secondsRef)}
              onFocusNext={focusNextOf(secondsRef)}
              disabledFor={secondDisabledFor}
              audioTick={audioTick}
            />
          </>
        )}
        {hourFormat === '12' && (
          <Wheel
            ref={ampmRef}
            values={['AM', 'PM']}
            index={ampmIndex}
            onChange={onAmpmIndex}
            formatLabel={v => v}
            ariaLabel={t.ampm}
            visibleCount={visibleCount}
            itemHeight={itemHeight}
            disabled={disabled}
            size={size}
            color={color}
            onCommit={onCommit}
            onFocusPrev={focusPrevOf(ampmRef)}
            onFocusNext={focusNextOf(ampmRef)}
            audioTick={audioTick}
          />
        )}
      </div>
    </div>
  );
};

TimeWheels.displayName = 'TimeWheels';

export default TimeWheels;
