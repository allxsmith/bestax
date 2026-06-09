import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DateFormatOption } from './formatters';
import { isWithin } from './dateUtils';
import {
  buildSegmentMap,
  incrementSegmentValue,
  setSegmentValue,
  setAmPm,
  segmentIndexAtCaret,
  SegmentMap,
} from './segmentMap';

/**
 * Single-character literals that, when typed, jump the caret to the next
 * editable segment — the slash / colon / dash / dot / space separators that
 * appear between date and time tokens. Lets a user type `12/25/2026` or
 * `13:45` straight through, skipping over the format's punctuation.
 */
const SEPARATOR_RE = /[/:\-.\s]/;

export interface UseSegmentedEntryParams {
  /** Resolved format actually used to render (the host's default format). */
  format: DateFormatOption;
  /** Current canonical value (controlled or internal). */
  value: Date | null;
  /** Commit a new Date through the host's onChange / internal pipeline. */
  commitValue: (next: Date | null) => void;
  /** Host formatter: formatDate | formatTime | formatDateTime. */
  formatFn: (
    d: Date,
    fmt: DateFormatOption | undefined,
    locale?: string
  ) => string;
  /** Host parser used by the free-form fallback (parseDate / parseTime / custom). */
  tryParse: (s: string) => Date | null;
  /** Host's displayed-text state and setter (the hook drives it during edits). */
  text: string;
  setText: (s: string) => void;
  /**
   * Seed for an empty value when the user starts typing: Time → today at noon,
   * Date → today at 00:00, DateTime → now. Should be referentially stable.
   */
  makeBaseDate: () => Date;
  locale?: string;
  min?: Date;
  max?: Date;
  disabled?: boolean;
  readOnly?: boolean;
  /** Allow segmented typing. When false, segment mode never engages. */
  editable?: boolean;
  /** Whether a popover exists; gates open-on-focus / click / ArrowDown. */
  popover?: boolean;
  openOnFocus?: boolean;
  closeOnSelect?: boolean;
  isOpen: boolean;
  setOpen: (next: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onClick?: React.MouseEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

export interface UseSegmentedEntryResult {
  segmentMap: SegmentMap | null;
  activeSegmentIdx: number | null;
  /** True when segment typing is available (map + editable + not disabled/readOnly). */
  segmentEditable: boolean;
  /** True when a segment is actively selected. */
  inSegmentMode: boolean;
  /** Spread onto the combobox `<input>`. */
  inputHandlers: {
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    onFocus: React.FocusEventHandler<HTMLInputElement>;
    onClick: React.MouseEventHandler<HTMLInputElement>;
    onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
    onBlur: React.FocusEventHandler<HTMLInputElement>;
  };
}

/**
 * Segmented manual keyboard entry for a date / time picker input. Computes a
 * segment map from the token format, tracks the active segment, and returns
 * the full set of `<input>` event handlers — segment-mutating keys (arrows,
 * digits, AM/PM, separators) are handled here, while popover open/close and
 * free-form parse-on-blur/Enter are driven through the host-supplied
 * `setOpen` / `tryParse` / `commitValue` callbacks. When the format is an
 * `Intl` options object or contains variable-width tokens, the segment map is
 * null and the input transparently falls back to free-form text entry.
 */
export function useSegmentedEntry(
  params: UseSegmentedEntryParams
): UseSegmentedEntryResult {
  const {
    format,
    value,
    commitValue,
    formatFn,
    tryParse,
    text,
    setText,
    makeBaseDate,
    locale,
    min,
    max,
    disabled,
    readOnly,
    editable = true,
    popover = true,
    openOnFocus = true,
    closeOnSelect = false,
    isOpen,
    setOpen,
    inputRef,
    containerRef,
    onFocus,
    onClick,
    onKeyDown,
    onBlur,
  } = params;

  const segmentMap: SegmentMap | null = useMemo(
    () => (typeof format === 'string' ? buildSegmentMap(format) : null),
    [format]
  );
  const [activeSegmentIdx, setActiveSegmentIdx] = useState<number | null>(null);
  // Buffer of digits typed within the current segment, cleared on segment
  // change. Kept in a ref because key handlers read+update synchronously
  // within the same event tick.
  const typedDigitsRef = useRef<string>('');

  // Segment mode is unavailable for disabled / read-only / non-editable
  // pickers and for Intl-options / variable-width formats (segmentMap null).
  const segmentEditable = !!segmentMap && !!editable && !disabled && !readOnly;

  // The Date we edit when the user starts without a current value.
  const segmentBaseDate = useCallback(
    (): Date => value ?? makeBaseDate(),
    [value, makeBaseDate]
  );

  // Apply a segment-driven date update: commit through the host pipeline (so
  // onChange / controlled mode keep working) and re-render the text so the
  // active selection range stays valid.
  const applyDateFromSegment = useCallback(
    (next: Date) => {
      if (!isWithin(next, min, max)) return;
      commitValue(next);
      setText(formatFn(next, format, locale));
    },
    [commitValue, min, max, formatFn, format, locale, setText]
  );

  // After every segment-driven change, restore the system selection on the
  // active segment's char range. useLayoutEffect runs synchronously before
  // paint so the user never sees a stray caret position. We deliberately do
  // NOT gate on document.activeElement: when openOnFocus is true the focus
  // trap moves focus into the popover, but setSelectionRange on an unfocused
  // input is well-defined and the selection becomes visible on refocus.
  useLayoutEffect(() => {
    if (activeSegmentIdx === null || !segmentMap || !inputRef.current) return;
    const seg = segmentMap.segments[activeSegmentIdx];
    if (!seg) return;
    try {
      inputRef.current.setSelectionRange(seg.start, seg.end);
    } catch {
      // Some read-only inputs reject setSelectionRange; harmless.
    }
  }, [activeSegmentIdx, segmentMap, text, inputRef]);

  const moveSegment = useCallback(
    (delta: 1 | -1) => {
      if (!segmentMap || activeSegmentIdx === null) return;
      const pos = segmentMap.editable.indexOf(activeSegmentIdx);
      if (pos < 0) return;
      const nextPos = Math.max(
        0,
        Math.min(segmentMap.editable.length - 1, pos + delta)
      );
      const nextIdx = segmentMap.editable[nextPos];
      if (nextIdx !== activeSegmentIdx) {
        typedDigitsRef.current = '';
        setActiveSegmentIdx(nextIdx);
      }
    },
    [segmentMap, activeSegmentIdx]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // In segment mode the text is managed programmatically (every edit
      // re-formats from the canonical Date). Browser-issued input events
      // would otherwise clobber it. The free-form path runs only when
      // segment mode is inactive.
      if (activeSegmentIdx !== null && segmentEditable) return;
      setText(e.target.value);
    },
    [activeSegmentIdx, segmentEditable, setText]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      // The popover opens on focus by default, and the focus trap moves focus
      // into the popover panel — that fires this blur even though the user is
      // still in the same picker. Only tear down segment state and re-parse
      // when focus has truly left the picker's container.
      const nextFocus = e.relatedTarget as HTMLElement | null;
      const stayingInPicker =
        nextFocus !== null &&
        containerRef.current !== null &&
        containerRef.current.contains(nextFocus);
      if (stayingInPicker) {
        onBlur?.(e);
        return;
      }
      setActiveSegmentIdx(null);
      typedDigitsRef.current = '';
      const parsed = tryParse(text);
      if (parsed && isWithin(parsed, min, max)) {
        commitValue(parsed);
      } else {
        setText(value ? formatFn(value, format, locale) : '');
      }
      onBlur?.(e);
    },
    [
      containerRef,
      tryParse,
      text,
      min,
      max,
      commitValue,
      value,
      formatFn,
      format,
      locale,
      setText,
      onBlur,
    ]
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (openOnFocus && popover && !disabled && !readOnly) setOpen(true);
      // Enter segment mode: prime an initial value (so editing works even when
      // empty), seed the text, and highlight the first editable segment.
      if (segmentEditable && segmentMap) {
        if (!value) {
          setText(formatFn(makeBaseDate(), format, locale));
        }
        typedDigitsRef.current = '';
        setActiveSegmentIdx(segmentMap.editable[0]);
      }
      onFocus?.(e);
    },
    [
      openOnFocus,
      popover,
      disabled,
      readOnly,
      setOpen,
      segmentEditable,
      segmentMap,
      value,
      makeBaseDate,
      formatFn,
      format,
      locale,
      setText,
      onFocus,
    ]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      // Clicking the field opens the popover only when `openOnFocus` is on —
      // a click is just a focus. With `openOnFocus={false}` (manual-entry
      // mode) the click positions the caret for typing and the popover is
      // opened explicitly via the right launcher button (or ArrowDown).
      if (openOnFocus && popover && !disabled && !readOnly) setOpen(true);
      if (segmentEditable && segmentMap && inputRef.current) {
        const caret = inputRef.current.selectionStart ?? 0;
        const idx = segmentIndexAtCaret(segmentMap, caret);
        if (idx !== null && idx !== activeSegmentIdx) {
          typedDigitsRef.current = '';
          setActiveSegmentIdx(idx);
        }
      }
      onClick?.(e);
    },
    [
      openOnFocus,
      popover,
      disabled,
      readOnly,
      setOpen,
      segmentEditable,
      segmentMap,
      inputRef,
      activeSegmentIdx,
      onClick,
    ]
  );

  const inSegmentMode =
    segmentEditable && segmentMap !== null && activeSegmentIdx !== null;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Segment-mode key routing comes first. When segment mode isn't engaged
      // (not editable, no map, or no active segment — e.g. after a typed-text
      // fallback), unhandled keys fall through to the popover / free-form
      // handling below.
      if (inSegmentMode && segmentMap && activeSegmentIdx !== null) {
        const seg = segmentMap.segments[activeSegmentIdx];
        const base = segmentBaseDate();
        const isPm = base.getHours() >= 12;
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            typedDigitsRef.current = '';
            applyDateFromSegment(incrementSegmentValue(seg, base, 1, isPm));
            return;
          case 'ArrowDown':
            e.preventDefault();
            typedDigitsRef.current = '';
            applyDateFromSegment(incrementSegmentValue(seg, base, -1, isPm));
            return;
          case 'ArrowRight':
            e.preventDefault();
            moveSegment(1);
            return;
          case 'ArrowLeft':
            e.preventDefault();
            moveSegment(-1);
            return;
          case 'Backspace':
            e.preventDefault();
            if (typedDigitsRef.current.length > 0) {
              typedDigitsRef.current = '';
            } else {
              moveSegment(-1);
            }
            return;
          case 'Escape':
            if (isOpen) {
              e.preventDefault();
              setOpen(false);
            }
            return;
          case 'Enter':
            e.preventDefault();
            if (closeOnSelect) setOpen(false);
            return;
          case 'Tab':
            setActiveSegmentIdx(null);
            typedDigitsRef.current = '';
            return;
          default:
            // AM/PM keys.
            if (seg.kind === 'ampm') {
              if (e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                typedDigitsRef.current = '';
                applyDateFromSegment(setAmPm(base, false));
                moveSegment(1);
                return;
              }
              if (e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                typedDigitsRef.current = '';
                applyDateFromSegment(setAmPm(base, true));
                moveSegment(1);
                return;
              }
            }
            // Typing a format separator (/, :, -, ., space) jumps to the next
            // segment, skipping over the literal punctuation.
            if (e.key.length === 1 && SEPARATOR_RE.test(e.key)) {
              e.preventDefault();
              typedDigitsRef.current = '';
              moveSegment(1);
              return;
            }
            // Digit entry for numeric segments.
            if (/^[0-9]$/.test(e.key) && seg.kind !== 'ampm') {
              e.preventDefault();
              const nextBuffer = typedDigitsRef.current + e.key;
              typedDigitsRef.current = nextBuffer;
              const { date, advance } = setSegmentValue(
                seg,
                base,
                nextBuffer,
                isPm
              );
              applyDateFromSegment(date);
              if (advance) {
                typedDigitsRef.current = '';
                moveSegment(1);
              }
              return;
            }
        }
      }
      // ----- free-form / popover key handling -----
      if (e.key === 'ArrowDown' && !isOpen && popover) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const parsed = tryParse(text);
        if (parsed && isWithin(parsed, min, max)) {
          commitValue(parsed);
          if (closeOnSelect) setOpen(false);
        }
      }
      onKeyDown?.(e);
    },
    [
      inSegmentMode,
      segmentMap,
      activeSegmentIdx,
      segmentBaseDate,
      applyDateFromSegment,
      moveSegment,
      isOpen,
      setOpen,
      closeOnSelect,
      popover,
      tryParse,
      text,
      min,
      max,
      commitValue,
      onKeyDown,
    ]
  );

  return {
    segmentMap,
    activeSegmentIdx,
    segmentEditable,
    inSegmentMode,
    inputHandlers: {
      onChange: handleChange,
      onFocus: handleFocus,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
    },
  };
}
