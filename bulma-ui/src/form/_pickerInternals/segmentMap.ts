/**
 * Segment-map utility for manual keyboard entry on a date / time picker input.
 * Given a token-format string like `'YYYY-MM-DD'`, `'HH:mm:ss'`, `'hh:mm A'`,
 * or a combined `'YYYY-MM-DD HH:mm'`, we compute the character ranges of each
 * editable segment in the formatted output, plus arithmetic helpers
 * (increment / digit-set) for each kind.
 *
 * Variable-width tokens (`Y`, `YYY`, `M`, `D`, `H`, `h`, `m`, `s`) cause the
 * renderer to emit output of unpredictable width depending on value, which
 * would shift segment boundaries between renders and break the selection.
 * `buildSegmentMap` returns `null` for any format containing those, signalling
 * the caller to fall back to free-form text entry.
 */

import { addYears } from './dateUtils';

export type SegmentKind =
  | 'year'
  | 'month'
  | 'day'
  | 'hours'
  | 'minutes'
  | 'seconds'
  | 'ampm'
  | 'literal';

export interface Segment {
  kind: SegmentKind;
  /** Source token (e.g., `'HH'`) for editable segments; literal text for `'literal'`. */
  token: string;
  /** Inclusive char index into the formatted-string output. */
  start: number;
  /** Exclusive char index. */
  end: number;
  /** Populated only when `kind === 'hours'`. */
  hourFormat?: '12' | '24';
}

export interface SegmentMap {
  segments: Segment[];
  /** Indices of non-literal segments, left to right. */
  editable: number[];
}

// Match longest tokens first so `HH` doesn't collapse to two `H`s and `YYYY`
// doesn't collapse to `YY` + `YY`. The single-char and odd-width variants
// (`Y`, `YYY`, `M`, `D`, `H`, `h`, `m`, `s`) are matched only so they can be
// explicitly rejected below — otherwise a format like `'YYY-MM'` would
// silently mis-tokenize as `YY` + a stray `Y`.
const TOKEN_REGEX = /YYYY|YYY|YY|Y|MM|M|DD|D|HH|hh|mm|ss|H|h|m|s|A|a/g;

// Fixed-width tokens render the same number of chars on every value. All are 2
// wide except the 4-digit year.
const tokenWidth = (token: string): number => (token === 'YYYY' ? 4 : 2);

const KIND_BY_TOKEN: Record<string, SegmentKind> = {
  YYYY: 'year',
  YY: 'year',
  MM: 'month',
  DD: 'day',
  HH: 'hours',
  hh: 'hours',
  mm: 'minutes',
  ss: 'seconds',
  A: 'ampm',
  a: 'ampm',
};

/**
 * Walk a token-format string and produce a {@link SegmentMap}, or `null` if
 * the format contains any variable-width tokens (`H`, `h`, `m`, `s`) — the
 * caller should treat that case as "segment mode unsupported, use the input's
 * free-form text-entry fallback".
 */
export function buildSegmentMap(format: string): SegmentMap | null {
  const segments: Segment[] = [];
  let cursor = 0;
  let renderedPos = 0;
  // Reset the regex's lastIndex from any previous use (it's a /g regex).
  TOKEN_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN_REGEX.exec(format)) !== null) {
    const token = match[0];

    // Reject variable / odd-width tokens — they render an unpredictable number
    // of characters, which would break fixed segment boundaries.
    if (
      token === 'H' ||
      token === 'h' ||
      token === 'm' ||
      token === 's' ||
      token === 'M' ||
      token === 'D' ||
      token === 'Y' ||
      token === 'YYY'
    ) {
      return null;
    }

    // Capture any literal text between the previous cursor and this match.
    if (match.index > cursor) {
      const literal = format.slice(cursor, match.index);
      segments.push({
        kind: 'literal',
        token: literal,
        start: renderedPos,
        end: renderedPos + literal.length,
      });
      renderedPos += literal.length;
    }

    const kind = KIND_BY_TOKEN[token];
    const width = tokenWidth(token);
    const seg: Segment = {
      kind,
      token,
      start: renderedPos,
      end: renderedPos + width,
    };
    if (kind === 'hours') seg.hourFormat = token === 'hh' ? '12' : '24';
    segments.push(seg);

    renderedPos += width;
    cursor = match.index + token.length;
  }

  // Trailing literal after the final token.
  if (cursor < format.length) {
    const literal = format.slice(cursor);
    segments.push({
      kind: 'literal',
      token: literal,
      start: renderedPos,
      end: renderedPos + literal.length,
    });
  }

  const editable: number[] = [];
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].kind !== 'literal') editable.push(i);
  }
  // Defensive: a format with no editable token is not segment-editable.
  if (editable.length === 0) return null;
  return { segments, editable };
}

// ---------------------------------------------------------------------------
// Arithmetic helpers
// ---------------------------------------------------------------------------

const wrap = (n: number, max: number): number => ((n % max) + max) % max;
const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));

/** Number of days in the month of `d` (handles leap Februarys). */
const daysInMonth = (d: Date): number =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

/**
 * Returns a new Date with the given segment incremented (`delta` = +1 or -1).
 * Wraps at segment boundaries: year is unbounded, month 0↔11 (in place, no
 * year roll), day within the current month's length, hours-24 0↔23, hours-12
 * 1↔12, minutes/seconds 0↔59, am/pm toggles. Day is re-clamped after a
 * month/year change (Jan 31 → Feb 28/29). `isPm` is the *current* meridiem
 * when editing a 12h hour segment so we preserve it across the increment;
 * date segments ignore it.
 */
export function incrementSegmentValue(
  segment: Segment,
  currentDate: Date,
  delta: number,
  isPm: boolean
): Date {
  const next = new Date(currentDate);
  switch (segment.kind) {
    case 'year':
      // Unbounded ±1; addYears clamps Feb 29 → Feb 28 on non-leap targets.
      return addYears(next, delta);
    case 'month': {
      // In-place wrap Jan↔Dec without rolling the year, then clamp the day to
      // the new month's length (e.g. Jan 31 → Feb → day 28/29).
      const day = next.getDate();
      const m0 = wrap(next.getMonth() + delta, 12);
      next.setDate(1);
      next.setMonth(m0);
      next.setDate(Math.min(day, daysInMonth(next)));
      return next;
    }
    case 'day': {
      // Wrap within the current month's day count.
      const dim = daysInMonth(next);
      next.setDate(wrap(next.getDate() - 1 + delta, dim) + 1);
      return next;
    }
    case 'hours': {
      if (segment.hourFormat === '12') {
        const h = next.getHours();
        const displayed = h % 12 === 0 ? 12 : h % 12; // 1..12
        // Move within 1..12 and preserve the current AM/PM.
        const nextDisplayed = wrap(displayed - 1 + delta, 12) + 1;
        const next24 = isPm ? (nextDisplayed % 12) + 12 : nextDisplayed % 12;
        next.setHours(next24);
      } else {
        next.setHours(wrap(next.getHours() + delta, 24));
      }
      return next;
    }
    case 'minutes':
      next.setMinutes(wrap(next.getMinutes() + delta, 60));
      return next;
    case 'seconds':
      next.setSeconds(wrap(next.getSeconds() + delta, 60));
      return next;
    case 'ampm':
      // Toggle by shifting 12 hours in either direction.
      next.setHours((next.getHours() + 12) % 24);
      return next;
    default:
      return next;
  }
}

/**
 * Apply a buffered string of typed digits to the active segment. Returns the
 * updated Date plus an `advance` flag — `true` when the buffer is full (its
 * token width) or when the first digit alone forecloses any valid multi-digit
 * completion (e.g., first digit `3` for hours-24 since 30+ is out of range, or
 * `2` for month since there is no month 20+).
 *
 * Special cases: a leading `'0'` is held without committing for hours-12,
 * month, and day (00 isn't a valid display value for any of them) — the buffer
 * must reach `'0X'` first. Month/day writes clamp to range and re-clamp the
 * day to the month's length; year writes re-clamp the day across leap-year
 * boundaries.
 */
export function setSegmentValue(
  segment: Segment,
  currentDate: Date,
  rawDigits: string,
  isPm: boolean
): { date: Date; advance: boolean } {
  if (rawDigits.length === 0) return { date: currentDate, advance: false };
  const value = parseInt(rawDigits, 10);
  if (Number.isNaN(value)) return { date: currentDate, advance: false };
  const next = new Date(currentDate);
  switch (segment.kind) {
    case 'year': {
      // YYYY buffers 4 digits; YY buffers 2 (mapped into the 2000s).
      const full = segment.token === 'YYYY';
      const maxLen = full ? 4 : 2;
      const yr = full ? value : 2000 + (value % 100);
      // Set day to 1 before changing the year so a Feb-29 source doesn't roll
      // into March on a non-leap target; then restore the clamped day.
      const day = next.getDate();
      next.setDate(1);
      next.setFullYear(yr);
      next.setDate(Math.min(day, daysInMonth(next)));
      return { date: next, advance: rawDigits.length >= maxLen };
    }
    case 'month': {
      if (rawDigits === '0') {
        // Hold: 00 is invalid; wait for the second digit (01..09).
        return { date: currentDate, advance: false };
      }
      const clamped = clamp(value, 1, 12);
      const day = next.getDate();
      next.setDate(1);
      next.setMonth(clamped - 1);
      next.setDate(Math.min(day, daysInMonth(next)));
      // Advance when buffer is full, or first digit >=2 (no month 20+). First
      // digit 1 still waits for 10/11/12.
      const advance = rawDigits.length >= 2 || value >= 2;
      return { date: next, advance };
    }
    case 'day': {
      if (rawDigits === '0') {
        // Hold: 00 is invalid; wait for the second digit (01..09).
        return { date: currentDate, advance: false };
      }
      const clamped = clamp(value, 1, daysInMonth(next));
      next.setDate(clamped);
      // Advance when buffer is full, or first digit >=4 (no day 40+). First
      // digit 3 still waits for 30/31.
      const advance = rawDigits.length >= 2 || value >= 4;
      return { date: next, advance };
    }
    case 'hours': {
      if (segment.hourFormat === '12') {
        if (rawDigits === '0') {
          // Don't commit yet; wait for the second digit (01..09 are valid).
          return { date: currentDate, advance: false };
        }
        const clamped = clamp(value, 1, 12);
        const h24 = isPm ? (clamped % 12) + 12 : clamped % 12;
        next.setHours(h24);
        // Advance when the buffer is full, or when no valid 2-digit
        // completion starting with this digit exists. For 12h: only 0 and 1
        // can be the first of a 2-digit value (giving 01..09 and 10..12);
        // any other first digit completes the segment.
        const advance = rawDigits.length >= 2 || value >= 2;
        return { date: next, advance };
      }
      // 24h: valid range 0..23.
      const clamped = clamp(value, 0, 23);
      next.setHours(clamped);
      // Advance when buffer is full, or when first digit is 3..9 (since
      // 30..99 are all out of range). First digits 0, 1, 2 can still accept
      // a second digit.
      const advance = rawDigits.length >= 2 || value >= 3;
      return { date: next, advance };
    }
    case 'minutes': {
      const clamped = clamp(value, 0, 59);
      next.setMinutes(clamped);
      // Advance when buffer full, or first digit 6..9 (can't form 60..99).
      const advance = rawDigits.length >= 2 || value >= 6;
      return { date: next, advance };
    }
    case 'seconds': {
      const clamped = clamp(value, 0, 59);
      next.setSeconds(clamped);
      const advance = rawDigits.length >= 2 || value >= 6;
      return { date: next, advance };
    }
    default:
      return { date: currentDate, advance: false };
  }
}

/** Force the meridiem of `currentDate` to AM (isPm=false) or PM (true). */
export function setAmPm(currentDate: Date, isPm: boolean): Date {
  const next = new Date(currentDate);
  const h = next.getHours();
  if (isPm && h < 12) next.setHours(h + 12);
  if (!isPm && h >= 12) next.setHours(h - 12);
  return next;
}

/** Map a caret position into the index of the segment that contains it. */
export function segmentIndexAtCaret(
  map: SegmentMap,
  caret: number
): number | null {
  // Prefer an editable segment that strictly contains the caret; otherwise
  // the nearest editable segment by char distance.
  for (const idx of map.editable) {
    const s = map.segments[idx];
    if (caret >= s.start && caret <= s.end) return idx;
  }
  let bestIdx = map.editable[0] ?? null;
  let bestDist = Infinity;
  for (const idx of map.editable) {
    const s = map.segments[idx];
    const dist = Math.min(Math.abs(caret - s.start), Math.abs(caret - s.end));
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = idx;
    }
  }
  return bestIdx;
}
