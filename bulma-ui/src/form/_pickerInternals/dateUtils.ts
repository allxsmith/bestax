import { DateGranularity, DayOfWeek } from './pickerTypes';

export interface CalendarCell {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}

export function isAfter(a: Date, b: Date): boolean {
  return a.getTime() > b.getTime();
}

export function isWithin(d: Date, min?: Date, max?: Date): boolean {
  if (min && isBefore(d, min)) return false;
  if (max && isAfter(d, max)) return false;
  return true;
}

// The boundaries build on `makeDate` (below), so a date in years 0–99 keeps
// its year.

export function startOfDay(d: Date): Date {
  return makeDate(d.getFullYear(), d.getMonth(), d.getDate());
}

export function endOfDay(d: Date): Date {
  const r = makeDate(d.getFullYear(), d.getMonth(), d.getDate());
  r.setHours(23, 59, 59, 999);
  return r;
}

export function startOfMonth(d: Date): Date {
  return makeDate(d.getFullYear(), d.getMonth());
}

export function endOfMonth(d: Date): Date {
  // Day 0 of the next month is this month's last day.
  const r = makeDate(d.getFullYear(), d.getMonth() + 1, 0);
  r.setHours(23, 59, 59, 999);
  return r;
}

/**
 * Local midnight on `year`-`month`-`day` (`month` from 0), like the
 * `Date(y, m, d)` constructor except that years 0–99 stay as given rather than
 * turning into 1900–1999.
 */
export function makeDate(year: number, month = 0, day = 1): Date {
  const d = new Date(2000, 0, 1);
  d.setFullYear(year, month, day);
  return d;
}

/**
 * The earliest year the pickers accept. HTML's date, month and datetime-local
 * inputs hold no year below 1, so the calendar, typing and parsing stop there
 * too.
 */
export const FIRST_YEAR = 1;

/**
 * The lower bound a picker applies: `min`, raised to local midnight on
 * 1 January of {@link FIRST_YEAR} when it is earlier or absent. A `min` in
 * range comes back as the same object.
 */
export function floorMin(min?: Date): Date {
  const floor = makeDate(FIRST_YEAR);
  return min && min.getTime() >= floor.getTime() ? min : floor;
}

/**
 * First instant of the day, month or year containing `d`. Works by setters on
 * a copy rather than the `Date(y, m, d)` constructor, which reads years 0–99
 * as 1900–1999: segmented typing passes through such years on the way to a
 * four-digit one.
 */
export function startOfPeriod(d: Date, granularity: DateGranularity): Date {
  const r = new Date(d);
  if (granularity === 'year') r.setMonth(0, 1);
  else if (granularity === 'month') r.setDate(1);
  r.setHours(0, 0, 0, 0);
  return r;
}

/** Last instant of the day, month or year containing `d`. */
export function endOfPeriod(d: Date, granularity: DateGranularity): Date {
  const r = new Date(d);
  if (granularity === 'year') r.setMonth(11, 31);
  // Day 0 of the next month is this month's last day.
  else if (granularity === 'month') r.setMonth(r.getMonth() + 1, 0);
  r.setHours(23, 59, 59, 999);
  return r;
}

/** The rules that make a single calendar day unselectable. */
export interface DayConstraints {
  min?: Date;
  max?: Date;
  shouldDisableDate?: (d: Date) => boolean;
  unselectableDates?: Date[];
}

/**
 * Whether the day `d` falls outside `[min, max]` or is blocked by
 * `shouldDisableDate` / `unselectableDates`. This is the day grid's rule for a
 * disabled cell.
 */
export function isDayUnselectable(d: Date, c: DayConstraints): boolean {
  if (!isWithin(d, c.min, c.max)) return true;
  if (c.shouldDisableDate?.(d)) return true;
  if (c.unselectableDates?.some(u => isSameDay(u, d))) return true;
  return false;
}

/**
 * Whether every day of the month or year containing `d` is unselectable, so
 * the period as a whole can't be picked. Walks the period's days and stops at
 * the first selectable one. `min` and `max` count whole days here, so a `min`
 * of 3pm on a month's last day leaves that day, and so its month, selectable.
 */
export function isPeriodUnselectable(
  d: Date,
  granularity: DateGranularity,
  c: DayConstraints
): boolean {
  const days: DayConstraints = {
    ...c,
    min: c.min && startOfDay(c.min),
    max: c.max && endOfDay(c.max),
  };
  const start = startOfPeriod(d, granularity);
  const end = endOfPeriod(d, granularity).getTime();
  // A period wholly outside the bounds needs no walk.
  if (days.min && end < days.min.getTime()) return true;
  if (days.max && start.getTime() > days.max.getTime()) return true;
  for (let day = start; day.getTime() <= end; day = addDays(day, 1)) {
    if (!isDayUnselectable(day, days)) return false;
  }
  return true;
}

/**
 * The most days {@link canCloseRange} walks between a range's ends, about
 * eleven years. A span it would have to walk further is refused, so the check
 * stays cheap enough to run on every pointer move over the calendar.
 */
export const RANGE_WALK_LIMIT = 4000;

/**
 * Whether `end` can close a range that opens on `start`: it falls on `start`'s
 * day or later, and, unless `allowDisabled`, no day between the two is one
 * that `shouldDisableDate` or `unselectableDates` disables. Checking that
 * walks the days between, so with either rule set and `allowDisabled` off,
 * an `end` more than {@link RANGE_WALK_LIMIT} days after `start` is refused.
 * The ends' own constraints, `min` and `max` among them, are the caller's to
 * check. Bounds can't fall between two days inside them, so they are not
 * walked.
 */
export function canCloseRange(
  start: Date,
  end: Date,
  c: DayConstraints,
  allowDisabled = false
): boolean {
  const first = startOfDay(start);
  const last = startOfDay(end).getTime();
  if (last < first.getTime()) return false;
  if (allowDisabled) return true;
  const blocks: DayConstraints = {
    shouldDisableDate: c.shouldDisableDate,
    unselectableDates: c.unselectableDates,
  };
  if (!blocks.shouldDisableDate && !blocks.unselectableDates?.length) {
    return true;
  }
  for (
    let d = addDays(first, 1), walked = 1;
    d.getTime() < last;
    d = addDays(d, 1), walked++
  ) {
    if (walked >= RANGE_WALK_LIMIT || isDayUnselectable(d, blocks)) {
      return false;
    }
  }
  return true;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  const day = r.getDate();
  r.setDate(1);
  r.setMonth(r.getMonth() + n);
  // Clamp day to last day of new month if original day is out of range.
  const lastDay = makeDate(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(day, lastDay));
  return r;
}

export function addYears(d: Date, n: number): Date {
  return addMonths(d, n * 12);
}

export function addHours(d: Date, n: number): Date {
  const r = new Date(d);
  r.setHours(r.getHours() + n);
  return r;
}

export function addMinutes(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMinutes(r.getMinutes() + n);
  return r;
}

export function addSeconds(d: Date, n: number): Date {
  const r = new Date(d);
  r.setSeconds(r.getSeconds() + n);
  return r;
}

export function setTimeOfDay(
  d: Date,
  parts: { hours?: number; minutes?: number; seconds?: number }
): Date {
  const r = new Date(d);
  if (parts.hours !== undefined) r.setHours(parts.hours);
  if (parts.minutes !== undefined) r.setMinutes(parts.minutes);
  if (parts.seconds !== undefined) r.setSeconds(parts.seconds);
  return r;
}

export function getTimeOfDay(d: Date): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  return {
    hours: d.getHours(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
  };
}

/**
 * A copy of `d` moved into `[min, max]`. When `min` is after `max` nothing is
 * in range and `min` wins, so clamping twice gives the same date and a
 * picker's focus stays off the years before 1 under a `max` before then.
 */
export function clampDate(d: Date, min?: Date, max?: Date): Date {
  const capped = max && isAfter(d, max) ? max : d;
  return new Date(min && isBefore(capped, min) ? min : capped);
}

/**
 * Snap a Date's time-of-day to the nearest grid defined by the given
 * increment steps. Used by the "Now" button in pickers configured with
 * non-1 hour / minute / second steps so the committed time always lands on
 * a slot that exists on the wheel. Overflows roll up: e.g.
 * 13:58 with step=15 → 14:00. Seconds are zeroed when `enableSeconds` is
 * false, regardless of step.
 */
export function snapTimeToIncrement(
  d: Date,
  opts: {
    incrementHours?: number;
    incrementMinutes?: number;
    incrementSeconds?: number;
    enableSeconds?: boolean;
  } = {}
): Date {
  const {
    incrementHours = 1,
    incrementMinutes = 1,
    incrementSeconds = 1,
    enableSeconds = false,
  } = opts;
  const r = new Date(d);
  let h = r.getHours();
  let m = r.getMinutes();
  let s = enableSeconds ? r.getSeconds() : 0;

  if (enableSeconds && incrementSeconds > 1) {
    s = Math.round(s / incrementSeconds) * incrementSeconds;
    if (s >= 60) {
      s -= 60;
      m += 1;
    }
  }

  if (incrementMinutes > 1) {
    m = Math.round(m / incrementMinutes) * incrementMinutes;
    if (m >= 60) {
      m -= 60;
      h += 1;
    }
  }

  if (incrementHours > 1) {
    h = Math.round(h / incrementHours) * incrementHours;
    // setHours handles 24+ overflow naturally (rolls forward into next day).
  }

  r.setHours(h, m, s, 0);
  return r;
}

/**
 * Build a 6-week × 7-day grid (42 cells) anchored on the month containing
 * `monthAnchor`. The first cell is the start of the week containing the first
 * of the month, where the week starts on `firstDayOfWeek`.
 */
export function buildMonthGrid(
  monthAnchor: Date,
  firstDayOfWeek: DayOfWeek = 0
): CalendarCell[] {
  const monthStart = startOfMonth(monthAnchor);
  const firstWeekday = monthStart.getDay();
  const offset = (firstWeekday - firstDayOfWeek + 7) % 7;
  const gridStart = addDays(monthStart, -offset);
  const today = startOfDay(new Date());
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(gridStart, i);
    cells.push({
      date,
      inCurrentMonth: date.getMonth() === monthAnchor.getMonth(),
      isToday: isSameDay(date, today),
    });
  }
  return cells;
}
