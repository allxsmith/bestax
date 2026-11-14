import React, {
  useCallback,
  useEffect,
  useId,
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
import { getActiveElementInTree } from '../../helpers/shadowDom';
import { visuallyHidden } from '../../helpers/statusRegion';
import { useIsHydrated } from '../../helpers/useIsHydrated';
import {
  CalendarDayState,
  DateGranularity,
  DateRangeValue,
  DayOfWeek,
  PickerLabels,
  isPopoverToggleKey,
  mergeLabels,
} from './pickerTypes';
import {
  addDays,
  addMonths,
  addYears,
  buildMonthGrid,
  canCloseRange,
  clampDate,
  FIRST_YEAR,
  floorMin,
  isDayUnselectable,
  isPeriodUnselectable,
  isSameDay,
  isSameMonth,
  makeDate,
  startOfDay,
  startOfMonth,
} from './dateUtils';
import { formatDate, getDayNames, getMonthNames } from './formatters';

/** What every calendar takes, whichever way it picks. */
interface CalendarBaseProps {
  focusedDate: Date;
  onFocusedDateChange: (d: Date) => void;
  /**
   * Earliest selectable date. One before year 1, or none, counts as the start
   * of year 1.
   */
  min?: Date;
  max?: Date;
  shouldDisableDate?: (d: Date) => boolean;
  unselectableDates?: Date[];
  firstDayOfWeek?: DayOfWeek;
  locale?: string;
  dayNames?: string[];
  monthNames?: string[];
  nearbyMonthDays?: boolean;
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  id?: string;
  /**
   * When true, the day or month grid takes focus as it renders, and again as
   * it comes back from the year list. With or without it, once a grid has
   * focus, focus follows its tab stop from cell to cell.
   */
  autoFocusCell?: boolean;
  /** Optional translatable string overrides. */
  labels?: PickerLabels;
  /**
   * Inclusive `[min, max]` year range shown in the year-dropdown view.
   * Defaults to ±100 years around the focused year, clamped by `min`/`max`
   * and never reaching below year 1.
   * At `'year'` granularity the window centres on the year focused when the
   * calendar mounted, so moving focus never reflows the list.
   */
  yearsRange?: [number, number];
  /**
   * What a selection means. `'day'` shows the day grid; `'month'` shows a
   * month grid for the focused year, with the year list one header click
   * away for jumping; `'year'` shows the year list as the selection surface.
   * A month or year cell is disabled when every day in it is, and `onSelect`
   * receives the period's first day.
   */
  granularity?: DateGranularity;
  /**
   * Disable every button the calendar draws, its days and header included,
   * as a disabled fieldset around it does, so nothing can be picked or
   * focused.
   */
  disabled?: boolean;
  /**
   * Pick nothing. Focus still moves through the dates, by key and pointer,
   * and the header still turns the month, but a click, Enter or Space selects
   * no day, month or year.
   */
  readOnly?: boolean;
  /**
   * The first month on show, which takes the month out of `focusedDate`, as
   * the public `Calendar` holds it. Any day in it reads as the month, and at
   * `'month'` granularity as its year. The day grid then shows
   * `monthsToShow` months from it, with the previous button on the first and
   * the next button on the last, and a change of month comes through
   * `onMonthChange` as well as `onFocusedDateChange`: the header's buttons
   * page by `monthsToShow`, a key that takes focus past the months on show
   * brings its month in, and the year list keeps the month and changes the
   * year. A `focusedDate` outside the months on show reads as the same day
   * of the first. Unset, the month on show is `focusedDate`'s, as the pickers
   * have it. The year view ignores it.
   */
  month?: Date;
  /** How many months the day grid shows from `month`. Without `month`, one. */
  monthsToShow?: number;
  /**
   * Called with the new first month on show, by the rules under `month`:
   * its first day, or at `'month'` granularity 1 January of the new year.
   */
  onMonthChange?: (month: Date) => void;
  /**
   * Name each day by its full date in the locale ("Tuesday, October 20,
   * 2026"), and hide the weekday row from assistive technology, since every
   * name carries its weekday. A server and a browser can spell those names
   * differently, so they're added once the page has hydrated, as the
   * weekday names are, and until then a day is named by its number.
   */
  fullDateNames?: boolean;
  /**
   * Builds a day's name from its full-date one, with `fullDateNames`.
   */
  getDayLabel?: (date: Date, label: string) => string;
  /** Draws content inside a day's button, under its number. */
  dayContent?: (date: Date, state: CalendarDayState) => React.ReactNode;
  /** Marks the day and month grids `aria-busy`, while their data loads. */
  busy?: boolean;
}

/** A calendar that picks one day, month or year. */
interface CalendarSingleProps {
  /** The selected date. */
  value: Date | null;
  /** Called with a picked date, or the first day of a picked period. */
  onSelect: (d: Date) => void;
  range?: never;
  onRangeSelect?: never;
  allowDisabledInRange?: never;
}

/** A calendar that picks a range of days. */
interface CalendarRangeProps {
  /**
   * The committed range, start first, which turns on range mode. The day grid
   * then picks two days: the first pick marks a start inside the calendar and
   * commits nothing, and the second calls `onRangeSelect` with both ends. A
   * pick that cannot end the range starts a new one instead: one before the
   * start, or one past a disabled day unless `allowDisabledInRange` is set.
   * While a start is pending the grid previews the range to the hovered day,
   * or to the focused day, and hides the committed one. A range with a start
   * and no end opens with that start pending. Escape takes back a pending pick
   * and stops there, so a popover around the calendar stays open; a pending
   * start that came from `range` is not a pick, and Escape goes on.
   */
  range: DateRangeValue;
  /** Called with both ends once the second day is picked. */
  onRangeSelect: (start: Date, end: Date) => void;
  /**
   * Let a range include days that `shouldDisableDate` or `unselectableDates`
   * disable. Its ends can still not be such days.
   */
  allowDisabledInRange?: boolean;
  /** Only the day grid picks a range. */
  granularity?: 'day';
  value?: never;
  onSelect?: never;
}

/**
 * The calendar picks one date through `value` and `onSelect`, or a range
 * through `range` and `onRangeSelect`, and its props take exactly one pair.
 */
export type CalendarProps = CalendarBaseProps &
  (CalendarSingleProps | CalendarRangeProps);

/**
 * Selects the calendar's focused cell, the one tab stop of whichever grid or
 * year list is on show, for a popover to put focus on as it opens. It runs
 * against the whole panel, so it matches only inside the grid or the list.
 */
export const CALENDAR_FOCUSED_CELL =
  '[role="grid"] [data-focused="true"], [role="listbox"] [data-focused-year="true"]';

type CalendarView = 'days' | 'months' | 'years';

const BASE_VIEW: Record<DateGranularity, CalendarView> = {
  day: 'days',
  month: 'months',
  year: 'years',
};

// Months in rows of three, so the grid is four rows deep.
const MONTH_ROWS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11],
];
const MONTHS_PER_ROW = 3;
// The year list's CSS lays it out four to a row.
const YEARS_PER_ROW = 4;

/**
 * The month grid's keyboard, after the day grid's: arrows move a month or a
 * row, Home/End go to the row's ends, PageUp/PageDown move a year. Returns
 * the months to move by and the direction to search past disabled months, or
 * `null` for a key the grid doesn't handle. `col` is the focused month's
 * column.
 */
function monthStep(key: string, col: number): [number, 1 | -1] | null {
  switch (key) {
    case 'ArrowLeft':
      return [-1, -1];
    case 'ArrowRight':
      return [1, 1];
    case 'ArrowUp':
      return [-MONTHS_PER_ROW, -1];
    case 'ArrowDown':
      return [MONTHS_PER_ROW, 1];
    case 'PageUp':
      return [-12, -1];
    case 'PageDown':
      return [12, 1];
    case 'Home':
      return [-col, 1];
    case 'End':
      return [MONTHS_PER_ROW - 1 - col, -1];
    default:
      return null;
  }
}

/**
 * Whether DOM focus should follow a grid's tab stop as it moves: focus is in
 * the grid, or fell to <body> while the grid held it last, as it does when
 * the focused cell leaves the page or becomes disabled. Focus is read in the
 * grid's own tree, so this holds inside a shadow root too.
 */
function focusFollows(grid: HTMLElement, heldLast: boolean): boolean {
  const active = getActiveElementInTree(grid);
  if (grid.contains(active)) return true;
  return heldLast && active === grid.ownerDocument.body;
}

/**
 * Focuses the tab stop, whichever of `grids` holds it. With several months
 * on show only one grid has a tab stop.
 */
function focusTabStop(grids: (HTMLElement | null)[]) {
  for (const grid of grids) {
    grid?.querySelector<HTMLElement>('[data-focused="true"]')?.focus();
  }
}

/**
 * The cell nearest index `i` that `disabled` leaves enabled, `i` itself when
 * it is. At equal distance the later cell wins. With every cell disabled it
 * stays `i`, as there is nothing to reach.
 */
function nearestEnabled(i: number, disabled: boolean[]): number {
  if (!disabled[i]) return i;
  for (let d = 1; d < disabled.length; d++) {
    if (i + d < disabled.length && !disabled[i + d]) return i + d;
    if (i - d >= 0 && !disabled[i - d]) return i - d;
  }
  return i;
}

/** The long, spoken form of a date in a range's announcement. */
const LONG_DATE: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

/**
 * The heading's month and year, in the order and words the locale writes
 * them: "November 2026" in English, "2026年11月" in Japanese. The grid is
 * Gregorian, so the heading is too, whatever calendar the locale counts its
 * years by.
 */
const MONTH_YEAR: Intl.DateTimeFormatOptions = {
  calendar: 'gregory',
  year: 'numeric',
  month: 'long',
};

/**
 * A day's name in full, with `fullDateNames`. The grid is Gregorian, so the
 * name is too, whatever calendar the locale counts its years by.
 */
const FULL_DATE: Intl.DateTimeFormatOptions = {
  calendar: 'gregory',
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

/** A month's place in a count of months, for comparing and subtracting months. */
const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();

/** Whether `dayContent` returned something that renders. */
const rendersContent = (node: React.ReactNode) =>
  node !== undefined &&
  node !== null &&
  node !== '' &&
  typeof node !== 'boolean';

/** A range's pending start: its start, when it has no end. */
const pendingStartOf = (range?: DateRangeValue): Date | null =>
  range?.[0] && !range[1] ? startOfDay(range[0]) : null;

/**
 * The day grid's cells in rows of a week. A grid owns rows and rows own
 * cells, so assistive technology can walk the grid, and the selection it
 * reports, row by row.
 */
const inWeeks = (days: React.ReactElement[], className: string) => {
  const rows: React.ReactElement[] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(
      <div key={i} role="row" className={className}>
        {days.slice(i, i + 7)}
      </div>
    );
  }
  return rows;
};

/** Sunday-first weekday names, starting from `firstDayOfWeek` instead. */
const fromFirstDay = (sundayFirst: string[], firstDayOfWeek: DayOfWeek) => [
  ...sundayFirst.slice(firstDayOfWeek),
  ...sundayFirst.slice(0, firstDayOfWeek),
];

/** A date's time, or `null` for none, for comparing ranges by value. */
const timeOf = (d: Date | null | undefined): number | null =>
  d ? d.getTime() : null;

/**
 * The year list's keyboard, as the selection surface and as navigation:
 * arrows move a year or a row, Home/End go to the list's ends. Returns the
 * year to start from and the direction to search past disabled years, or
 * `null` for a key the list doesn't handle. As navigation no year is
 * disabled, so only the year is used.
 */
function yearStep(
  key: string,
  focusedYear: number,
  years: number[]
): [number, 1 | -1] | null {
  switch (key) {
    case 'ArrowLeft':
      return [focusedYear - 1, -1];
    case 'ArrowRight':
      return [focusedYear + 1, 1];
    case 'ArrowUp':
      return [focusedYear - YEARS_PER_ROW, -1];
    case 'ArrowDown':
      return [focusedYear + YEARS_PER_ROW, 1];
    case 'Home':
      return [years[0], 1];
    case 'End':
      return [years[years.length - 1], -1];
    default:
      return null;
  }
}

export const Calendar: React.FC<CalendarProps> = ({
  value,
  focusedDate: focusedDateProp,
  onSelect: onSelectProp,
  onFocusedDateChange,
  min: minProp,
  max,
  shouldDisableDate,
  unselectableDates,
  firstDayOfWeek = 0,
  locale,
  dayNames,
  monthNames,
  nearbyMonthDays = true,
  color,
  size,
  className,
  id,
  autoFocusCell = false,
  labels,
  yearsRange,
  granularity = 'day',
  range,
  onRangeSelect,
  allowDisabledInRange = false,
  disabled: calendarDisabled = false,
  readOnly = false,
  month: monthProp,
  monthsToShow = 1,
  onMonthChange,
  fullDateNames = false,
  getDayLabel,
  dayContent,
  busy = false,
}) => {
  // A disabled or read-only calendar picks nothing, so its picks reach no
  // `onSelect`, and a range pick returns before it starts.
  const canPick = !calendarDisabled && !readOnly;
  const onSelect = canPick ? onSelectProp : undefined;
  // The day grids, one a month on show.
  const dayGridsRef = useRef<(HTMLDivElement | null)[]>([]);
  const monthGridRef = useRef<HTMLDivElement>(null);
  const yearGridRef = useRef<HTMLDivElement>(null);
  const { classPrefix } = useConfig();
  const t = mergeLabels(labels);
  const baseView = BASE_VIEW[granularity];
  const isDayGranularity = granularity === 'day';
  const isYearGranularity = granularity === 'year';
  const [view, setView] = useState<CalendarView>(baseView);
  // Nothing before year 1 can be picked or reached, as in HTML's date inputs.
  const min = useMemo(() => floorMin(minProp), [minProp]);

  // The month on show comes from `month` when it's given, and the day grid
  // then shows `monthsToShow` of them. The year list has no month on show.
  const lifted = !!monthProp && !isYearGranularity;
  const monthCount =
    lifted &&
    isDayGranularity &&
    monthsToShow > 1 &&
    Number.isFinite(monthsToShow)
      ? Math.floor(monthsToShow)
      : 1;
  // The first month on show (at `'month'` granularity, January of the year
  // on show), as a count of months, so a new Date each render changes
  // nothing.
  const firstShownIndex = lifted
    ? isDayGranularity
      ? monthIndex(monthProp)
      : monthProp.getFullYear() * 12
    : monthIndex(focusedDateProp);
  // Whether a day is on the page on show: in one of its months, or at
  // `'month'` granularity in its year.
  const onPage = useCallback(
    (d: Date) => {
      const offset = monthIndex(d) - firstShownIndex;
      return offset >= 0 && offset < (isDayGranularity ? monthCount : 12);
    },
    [firstShownIndex, isDayGranularity, monthCount]
  );
  // Focus stays on the page. A focused date off it, where a move asked for a
  // month that a caller holding `month` hasn't passed, or where the caller
  // moved the month away from it, reads as the nearest day on the page: its
  // first going forward and its last going back, or at `'month'` granularity
  // January or December. Once the month it asked for comes, it's on the page.
  const focusedDate = useMemo(() => {
    if (!lifted || onPage(focusedDateProp)) return focusedDateProp;
    const before = monthIndex(focusedDateProp) < firstShownIndex;
    const year = Math.floor(firstShownIndex / 12);
    const month = firstShownIndex % 12;
    if (!isDayGranularity) return makeDate(year, before ? 0 : 11);
    return before
      ? makeDate(year, month)
      : makeDate(year, month + monthCount, 0);
  }, [
    lifted,
    onPage,
    focusedDateProp,
    firstShownIndex,
    isDayGranularity,
    monthCount,
  ]);
  // The months the day grid shows, first to last.
  const shownMonths = useMemo(
    () =>
      Array.from({ length: monthCount }, (_, i) =>
        makeDate(Math.floor(firstShownIndex / 12), (firstShownIndex % 12) + i)
      ),
    [firstShownIndex, monthCount]
  );

  const customDayNames = dayNames && dayNames.length === 7 ? dayNames : null;
  const computedDayNames = useMemo(
    () =>
      customDayNames ??
      fromFirstDay(getDayNames(locale, 'short'), firstDayOfWeek),
    [customDayNames, locale, firstDayOfWeek]
  );

  // Each weekday column is named by its full weekday in the locale, so a
  // screen reader names the column as focus moves across the grid. A server
  // and a browser can spell those names differently, so they're added only
  // once the page has hydrated, and never beside day names the caller gave,
  // which name the columns themselves.
  const hydrated = useIsHydrated();
  const weekdayNames = useMemo(
    () =>
      hydrated && !customDayNames
        ? fromFirstDay(getDayNames(locale, 'long'), firstDayOfWeek)
        : null,
    [hydrated, customDayNames, locale, firstDayOfWeek]
  );

  // Each day's full name, with `fullDateNames`, which a server render leaves
  // out, as it does the full weekday names.
  const fullDateFormat = useMemo(
    () =>
      fullDateNames && hydrated
        ? new Intl.DateTimeFormat(locale, FULL_DATE)
        : null,
    [fullDateNames, hydrated, locale]
  );
  const namesInFull = !!fullDateFormat;

  const customMonthNames =
    monthNames && monthNames.length === 12 ? monthNames : null;
  const computedMonthNames = useMemo(
    () => customMonthNames ?? getMonthNames(locale, 'long'),
    [customMonthNames, locale]
  );

  // The month grid's cells are too narrow for long names, so they show the
  // short form unless the caller supplied names of their own.
  const monthCellNames = useMemo(
    () => customMonthNames ?? getMonthNames(locale, 'short'),
    [customMonthNames, locale]
  );

  // Each month's day cells.
  const shownCells = useMemo(
    () => shownMonths.map(m => buildMonthGrid(m, firstDayOfWeek)),
    [shownMonths, firstDayOfWeek]
  );
  // Their full names, written once a page rather than at every render, which
  // a range's preview asks for at every move of the pointer.
  const fullNames = useMemo(
    () =>
      fullDateFormat &&
      shownCells.map(cells => cells.map(c => fullDateFormat.format(c.date))),
    [fullDateFormat, shownCells]
  );

  const isDateUnselectable = useCallback(
    (d: Date) =>
      isDayUnselectable(d, { min, max, shouldDisableDate, unselectableDates }),
    [min, max, shouldDisableDate, unselectableDates]
  );

  // A month or year is out of reach only when every day in it is.
  const isMonthUnselectable = useCallback(
    (d: Date) =>
      isPeriodUnselectable(d, 'month', {
        min,
        max,
        shouldDisableDate,
        unselectableDates,
      }),
    [min, max, shouldDisableDate, unselectableDates]
  );
  const isYearUnselectable = useCallback(
    (year: number) =>
      isPeriodUnselectable(makeDate(year), 'year', {
        min,
        max,
        shouldDisableDate,
        unselectableDates,
      }),
    [min, max, shouldDisableDate, unselectableDates]
  );

  // The day grid's one tab stop. A disabled button can't take focus, so when
  // the focused day is disabled the stop moves to the nearest enabled day of
  // the months on show, and focusing it makes it the focused day. A nearby
  // month's day is left out, as focusing it would turn the grid to its month.
  const tabStopDay = useMemo(() => {
    const days = shownCells.flatMap(cells =>
      cells.filter(c => c.inCurrentMonth).map(c => c.date)
    );
    const at = days.findIndex(d => isSameDay(d, focusedDate));
    const i = nearestEnabled(Math.max(at, 0), days.map(isDateUnselectable));
    return days[i];
  }, [shownCells, focusedDate, isDateUnselectable]);

  // A page of months starting at `first`, kept inside `min` and `max` where
  // they leave room for a whole page. `min` wins when they don't.
  const pageFrom = useCallback(
    (first: number) => {
      const last = max ? monthIndex(max) - (monthCount - 1) : first;
      return Math.max(monthIndex(min), Math.min(first, last));
    },
    [min, max, monthCount]
  );

  // Moves focus to `d` and asks for the page whose first month is `first`, a
  // count of months, or at `'month'` granularity January of a year.
  const turnTo = useCallback(
    (first: number, d: Date) => {
      onFocusedDateChange(d);
      if (first !== firstShownIndex) {
        onMonthChange?.(makeDate(Math.floor(first / 12), first % 12));
      }
    },
    [onFocusedDateChange, firstShownIndex, onMonthChange]
  );

  // Focus moves to `d`, and with the month held here, a `d` past the page
  // brings its month in: as the first month moving forward, as the last
  // moving back, so a page holds it either way.
  const changeFocus = useCallback(
    (d: Date) => {
      if (!lifted || onPage(d)) {
        onFocusedDateChange(d);
      } else if (!isDayGranularity) {
        turnTo(d.getFullYear() * 12, d);
      } else if (monthIndex(d) < firstShownIndex) {
        turnTo(pageFrom(monthIndex(d) - (monthCount - 1)), d);
      } else {
        turnTo(pageFrom(monthIndex(d)), d);
      }
    },
    [
      lifted,
      onPage,
      onFocusedDateChange,
      isDayGranularity,
      turnTo,
      firstShownIndex,
      pageFrom,
      monthCount,
    ]
  );

  // ----- Range mode -----
  // Range props come only with the day grid.
  const rangeMode = !!range;
  const valuePending = pendingStartOf(range);

  // The start of a range being picked, which nothing outside the calendar
  // sees until its end is picked too. It starts as the range's own pending
  // start, and starts there again whenever the range changes from outside.
  const [pendingAnchor, setAnchor] = useState<Date | null>(valuePending);
  const rangeKey = `${timeOf(range?.[0])}|${timeOf(range?.[1])}`;
  const [anchorRangeKey, setAnchorRangeKey] = useState(rangeKey);
  if (anchorRangeKey !== rangeKey) {
    setAnchorRangeKey(rangeKey);
    setAnchor(valuePending);
  }
  // A calendar that picks nothing has no start pending, so it previews no
  // range and says nothing of picking an end.
  const anchor = canPick ? pendingAnchor : null;
  // The day under the pointer while a start is pending, which the preview
  // runs to ahead of the focused day.
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Whether `day` can end a range that starts on `start`. The start is
  // checked as well as the end: one the range brought, or one picked before
  // the bounds or the disabled days changed, can rule itself out.
  const canEndAt = useCallback(
    (start: Date, day: Date) =>
      !isDateUnselectable(start) &&
      !isDateUnselectable(day) &&
      canCloseRange(
        start,
        day,
        { shouldDisableDate, unselectableDates },
        allowDisabledInRange
      ),
    [
      isDateUnselectable,
      shouldDisableDate,
      unselectableDates,
      allowDisabledInRange,
    ]
  );

  // A pick in range mode: the end of the pending range when it can be one,
  // and otherwise the start of a new one.
  const pickRangeDay = useCallback(
    (picked: Date) => {
      if (!canPick) return;
      const day = startOfDay(picked);
      // The pointer is on the picked day, which the focused day now is too.
      setHoverDate(null);
      if (anchor && canEndAt(anchor, day)) {
        setAnchor(null);
        onRangeSelect?.(anchor, day);
      } else {
        setAnchor(day);
      }
    },
    [canPick, anchor, canEndAt, onRangeSelect]
  );

  // What the grid shows: while a start is pending, the range from it to the
  // hovered or focused day, when that day can end it; otherwise the
  // committed range.
  let shownStart: Date | null;
  let shownEnd: Date | null;
  if (anchor) {
    shownStart = anchor;
    const previewEnd = startOfDay(hoverDate ?? focusedDate);
    shownEnd = canEndAt(anchor, previewEnd) ? previewEnd : null;
  } else {
    shownStart = range?.[0] ? startOfDay(range[0]) : null;
    shownEnd = range?.[1] ? startOfDay(range[1]) : null;
  }
  const previewing = !!anchor;

  // Ids for the words that name a range's ends and state the whole range.
  const reactId = useId();
  const rangeIdBase = id ?? `calendar-${reactId}`;
  const rangeStartId = `${rangeIdBase}-range-start`;
  const rangeEndId = `${rangeIdBase}-range-end`;
  const rangePreviewEndId = `${rangeIdBase}-range-preview-end`;
  const rangeSummaryId = `${rangeIdBase}-range-summary`;
  // The selection in words: the pending start alone, or the committed ends.
  const selectedEnd = previewing ? null : shownEnd;
  const rangeSummary = [
    shownStart &&
      `${t.rangeStart}: ${formatDate(shownStart, LONG_DATE, locale)}`,
    selectedEnd &&
      `${t.rangeEnd}: ${formatDate(selectedEnd, LONG_DATE, locale)}`,
  ]
    .filter(Boolean)
    .join(', ');

  // Whether the grid on show holds focus, or held it last before focus went
  // nowhere: the cell that had it left the page or became disabled. A blur
  // that takes focus out of the grid, to nowhere included, is the user
  // leaving, so it clears this. A render that removes or disables the focused
  // cell sends no blur here: browsers fire none, or fire it inside React's
  // commit, where React delivers no events.
  const gridHeldFocusRef = useRef(false);
  const gridFocusHandlers = {
    onFocus: () => {
      gridHeldFocusRef.current = true;
    },
    onBlur: (e: React.FocusEvent<HTMLDivElement>) => {
      const next = e.relatedTarget as Node | null;
      if (!next || !e.currentTarget.contains(next)) {
        gridHeldFocusRef.current = false;
      }
    },
  };

  // Step from `next` by `direction` days until we hit a selectable date,
  // skipping past dates blocked by min/max, shouldDisableDate, or
  // unselectableDates. If the whole searched range is disabled, focus stays
  // put. Cap iterations to guard against pathologically empty ranges.
  const moveFocus = useCallback(
    (next: Date, direction: 1 | -1) => {
      let candidate = next;
      for (let i = 0; i < 366; i++) {
        if (candidate.getTime() < startOfDay(min).getTime()) return;
        if (max && candidate.getTime() > startOfDay(max).getTime()) return;
        if (!isDateUnselectable(candidate)) {
          changeFocus(candidate);
          return;
        }
        candidate = addDays(candidate, direction);
      }
    },
    [min, max, isDateUnselectable, changeFocus]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isPopoverToggleKey(e)) return;
      // A key takes the range preview back from the pointer.
      setHoverDate(null);
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveFocus(addDays(focusedDate, -1), -1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveFocus(addDays(focusedDate, 1), 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveFocus(addDays(focusedDate, -7), -1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveFocus(addDays(focusedDate, 7), 1);
          break;
        case 'PageUp':
          e.preventDefault();
          moveFocus(
            e.shiftKey ? addYears(focusedDate, -1) : addMonths(focusedDate, -1),
            -1
          );
          break;
        case 'PageDown':
          e.preventDefault();
          moveFocus(
            e.shiftKey ? addYears(focusedDate, 1) : addMonths(focusedDate, 1),
            1
          );
          break;
        case 'Home': {
          e.preventDefault();
          const dayOfWeek = focusedDate.getDay();
          const offset = (dayOfWeek - firstDayOfWeek + 7) % 7;
          moveFocus(addDays(focusedDate, -offset), 1);
          break;
        }
        case 'End': {
          e.preventDefault();
          const dayOfWeek = focusedDate.getDay();
          const offset = (dayOfWeek - firstDayOfWeek + 7) % 7;
          moveFocus(addDays(focusedDate, 6 - offset), -1);
          break;
        }
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isDateUnselectable(focusedDate)) break;
          if (rangeMode) pickRangeDay(focusedDate);
          else onSelect?.(focusedDate);
          break;
        case 'Escape':
          // A pending pick is taken back, and the key stops there so a
          // popover around the calendar stays open. The range's own pending
          // start is no pick, so Escape goes on to close the popover.
          if (anchor && !(valuePending && isSameDay(anchor, valuePending))) {
            e.preventDefault();
            e.stopPropagation();
            setAnchor(valuePending);
          }
          break;
      }
    },
    [
      focusedDate,
      firstDayOfWeek,
      isDateUnselectable,
      moveFocus,
      onSelect,
      rangeMode,
      pickRangeDay,
      anchor,
      valuePending,
    ]
  );

  // The month grid's counterpart to `moveFocus`: step by `direction` months
  // until a month with a selectable day turns up, stopping at the min/max
  // months. The cap guards against a range with nothing selectable.
  const moveMonthFocus = useCallback(
    (next: Date, direction: 1 | -1) => {
      let candidate = next;
      for (let i = 0; i < 120; i++) {
        const month = startOfMonth(candidate).getTime();
        if (month < startOfMonth(min).getTime()) return;
        if (max && month > startOfMonth(max).getTime()) return;
        if (!isMonthUnselectable(candidate)) {
          changeFocus(candidate);
          return;
        }
        candidate = addMonths(candidate, direction);
      }
    },
    [min, max, isMonthUnselectable, changeFocus]
  );

  const handleMonthKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isPopoverToggleKey(e)) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isMonthUnselectable(focusedDate)) {
          onSelect?.(startOfMonth(focusedDate));
        }
        return;
      }
      const step = monthStep(e.key, focusedDate.getMonth() % MONTHS_PER_ROW);
      if (!step) return;
      e.preventDefault();
      moveMonthFocus(addMonths(focusedDate, step[0]), step[1]);
    },
    [focusedDate, isMonthUnselectable, moveMonthFocus, onSelect]
  );

  const calendarClass = usePrefixedClassNames('dateinput', {
    [`is-${color}`]: !!color,
    [`is-${size}`]: !!size,
  });
  const headerClass = usePrefixedClassNames('dateinput-header');
  const monthTriggerClass = usePrefixedClassNames('dateinput-month-trigger', {
    'is-active': view === 'years',
  });
  const monthCaretClass = usePrefixedClassNames('dateinput-month-caret');
  const navGroupClass = usePrefixedClassNames('dateinput-nav-group');
  const navPrevClass = usePrefixedClassNames('dateinput-nav-prev');
  const navNextClass = usePrefixedClassNames('dateinput-nav-next');
  const monthLabelClass = usePrefixedClassNames('dateinput-month-label');
  const dayNamesRowClass = usePrefixedClassNames('dateinput-day-names');
  const dayNameClass = usePrefixedClassNames('dateinput-day-name');
  const gridClass = usePrefixedClassNames('dateinput-grid');
  const weekClass = usePrefixedClassNames('dateinput-week');
  const monthsGridClass = usePrefixedClassNames('dateinput-months-grid');
  const monthsRowClass = usePrefixedClassNames('dateinput-months-row');
  const yearsGridClass = usePrefixedClassNames('dateinput-years-grid');
  const cellContentClass = usePrefixedClassNames('dateinput-cell-content');
  const monthsClass = usePrefixedClassNames('calendar-months');

  const focusedYear = focusedDate.getFullYear();
  // The year the first month's name, and the year list it opens, go by.
  const shownYear = lifted ? Math.floor(firstShownIndex / 12) : focusedYear;
  // Today is the reader's, so it's marked only once the page has hydrated: a
  // server render and the render hydrating it mark no day, month or year,
  // and the commit after marks the browser's own. A calendar mounted after
  // hydration marks it from its first render.
  const today = hydrated ? new Date() : null;
  const todayYear = today?.getFullYear();

  // The header steps a month at a time over the day grid and a year at a
  // time over the month grid, kept inside min/max. A step is off once the
  // month or year on show holds the bound or lies past it, as picking a year
  // from the list can leave it.
  const prevAnchor = isDayGranularity
    ? addMonths(focusedDate, -1)
    : clampDate(addYears(focusedDate, -1), min, max);
  const nextAnchor = isDayGranularity
    ? addMonths(focusedDate, 1)
    : clampDate(addYears(focusedDate, 1), min, max);
  const lastShownIndex = firstShownIndex + monthCount - 1;
  const prevDisabled = isDayGranularity
    ? firstShownIndex <= monthIndex(min)
    : focusedYear <= min.getFullYear();
  const nextDisabled = isDayGranularity
    ? !!max && lastShownIndex >= monthIndex(max)
    : !!max && focusedYear >= max.getFullYear();

  // A step of the header's buttons. With the month held here, the day grid
  // turns a whole page of months and focus keeps its place on the page.
  const turnPage = (direction: 1 | -1) => {
    const anchor = direction < 0 ? prevAnchor : nextAnchor;
    if (!lifted || !isDayGranularity) {
      changeFocus(anchor);
      return;
    }
    const first = pageFrom(firstShownIndex + direction * monthCount);
    turnTo(first, addMonths(focusedDate, first - firstShownIndex));
  };

  // The ids of the words naming each month's grid: the first month's, then
  // the others' by their place.
  const labelIdFor = (i: number) =>
    id ? (i === 0 ? `${id}-label` : `${id}-label-${i}`) : undefined;
  const labelId = labelIdFor(0);
  // Over the day grid each heading names its month and year as the locale
  // writes them. Month names the caller gives have no place in that pattern,
  // which writes the month as a number in Japanese, so they keep the name, a
  // space and the year.
  const monthHeading = (d: Date) =>
    customMonthNames
      ? `${customMonthNames[d.getMonth()]} ${d.getFullYear()}`
      : formatDate(d, MONTH_YEAR, locale);
  const monthLabel = isDayGranularity
    ? monthHeading(shownMonths[0])
    : String(focusedYear);

  // As the selection surface the year list is where focus moves, so its
  // window stays centred on the year focused at mount: re-centring on every
  // move would reflow the list under the keyboard.
  const [mountYear] = useState(focusedYear);
  const windowYear = isYearGranularity ? mountYear : shownYear;

  const yearList = useMemo<number[]>(() => {
    const minYear = minProp
      ? min.getFullYear()
      : Math.max(FIRST_YEAR, windowYear - 100);
    const maxYear = max ? max.getFullYear() : windowYear + 100;
    const [lo, hi] = yearsRange ?? [minYear, maxYear];
    const start = Math.max(lo, minYear);
    const end = Math.min(hi, maxYear);
    const out: number[] = [];
    for (let y = start; y <= end; y++) out.push(y);
    return out;
  }, [windowYear, minProp, min, max, yearsRange]);

  // Only the selection surface disables years; as navigation every listed
  // year can be visited.
  const disabledYears = useMemo(
    () =>
      new Set(
        isYearGranularity ? yearList.filter(y => isYearUnselectable(y)) : []
      ),
    [isYearGranularity, yearList, isYearUnselectable]
  );
  // The year list's one tab stop, after the month grid's: when the focused
  // year is disabled the stop moves to the nearest enabled year in the list,
  // and focusing it makes it the focused year. As the selection surface a
  // year outside a non-empty list starts from the end it fell past, so the
  // list keeps a stop. As navigation it marks the current year, so a year
  // outside the list marks no option, and the stop itself follows focus.
  const tabStopYear = useMemo(() => {
    let i = yearList.indexOf(shownYear);
    if (i < 0) {
      if (!isYearGranularity || yearList.length === 0) return shownYear;
      i = shownYear < yearList[0] ? 0 : yearList.length - 1;
    }
    return yearList[
      nearestEnabled(
        i,
        yearList.map(y => disabledYears.has(y))
      )
    ];
  }, [yearList, shownYear, disabledYears, isYearGranularity]);

  // As navigation the keys move focus and leave the focused year alone, so
  // the tab stop goes to the year that last had focus while it is listed,
  // and Tab leaves the list rather than landing on the current year. It
  // starts over each time the list opens.
  const [navYear, setNavYear] = useState<number | null>(null);
  const listTabStop =
    navYear !== null && yearList.includes(navYear) ? navYear : tabStopYear;

  // Which of the focused year's months have no selectable day.
  const disabledMonths = useMemo(
    () =>
      granularity === 'month'
        ? Array.from({ length: 12 }, (_, m) =>
            isMonthUnselectable(makeDate(focusedYear, m))
          )
        : [],
    [granularity, focusedYear, isMonthUnselectable]
  );
  // The month grid's one tab stop. A disabled button can't take focus, so
  // when the focused month is disabled the stop moves to the nearest enabled
  // month, and focusing it makes it the focused month.
  const tabStopMonth = nearestEnabled(focusedDate.getMonth(), disabledMonths);

  // The year list closes back onto the grid it opened from. Focus in it goes
  // back to that grid's tab stop rather than falling to the page as the list
  // goes, which the effect below does once the grid is back.
  const returnFocusRef = useRef(false);
  const closeYearList = useCallback(() => {
    const list = yearGridRef.current;
    returnFocusRef.current =
      !!list && list.contains(getActiveElementInTree(list));
    setView(baseView);
  }, [baseView]);

  const handleYearSelect = useCallback(
    (year: number) => {
      const next = new Date(focusedDate);
      next.setFullYear(year);
      // Keep month/day. The month grid also clamps into [min, max] so its
      // focused month is never one the bounds rule out. With the month held
      // here, the page keeps its months, and focus its place, in the year
      // picked for the first month.
      if (lifted && isDayGranularity) {
        const years = year - shownYear;
        turnTo(
          pageFrom(firstShownIndex + 12 * years),
          addYears(focusedDate, years)
        );
      } else {
        changeFocus(isDayGranularity ? next : clampDate(next, min, max));
      }
      closeYearList();
    },
    [
      focusedDate,
      changeFocus,
      lifted,
      turnTo,
      pageFrom,
      firstShownIndex,
      shownYear,
      isDayGranularity,
      min,
      max,
      closeYearList,
    ]
  );

  // Picking from the year list as the selection surface: focus follows the
  // pick and `onSelect` gets the year's first day.
  const handleYearPick = useCallback(
    (year: number) => {
      onFocusedDateChange(clampDate(makeDate(year), min, max));
      onSelect?.(makeDate(year));
    },
    [min, max, onFocusedDateChange, onSelect]
  );

  // Step through the listed years from `year` by `direction`, skipping
  // disabled ones, and focus the first selectable year found.
  const moveYearFocus = useCallback(
    (year: number, direction: 1 | -1) => {
      const first = yearList[0];
      const last = yearList[yearList.length - 1];
      for (let y = year; y >= first && y <= last; y += direction) {
        if (!disabledYears.has(y)) {
          onFocusedDateChange(clampDate(makeDate(y), min, max));
          return;
        }
      }
    },
    [yearList, disabledYears, onFocusedDateChange, min, max]
  );

  const handleYearListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isPopoverToggleKey(e)) return;
      if (isYearGranularity) {
        const step = yearStep(e.key, focusedYear, yearList);
        if (!step) return;
        e.preventDefault();
        moveYearFocus(step[0], step[1]);
        return;
      }
      // As navigation, Escape returns to the grid the list was opened from.
      // It stops there, so a popover around the calendar stays open and only
      // a second Escape closes it.
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeYearList();
        return;
      }
      // The other keys move DOM focus from the year that has it and leave
      // the focused date alone. The list is centred on that date, so moving
      // it would reflow the list under the keyboard, and it would turn the
      // grid behind the list before anything is picked. Enter or Space
      // clicks the year with focus, which picks it.
      const options = Array.from(
        e.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')
      );
      const from = options.indexOf(e.target as HTMLElement);
      if (from < 0) return;
      const step = yearStep(e.key, yearList[from], yearList);
      if (!step) return;
      e.preventDefault();
      // The listed years run one apart, so a year's index is its distance
      // from the first. A step past either end finds no option.
      options[step[0] - yearList[0]]?.focus();
    },
    [isYearGranularity, closeYearList, focusedYear, yearList, moveYearFocus]
  );

  // The day or month grid takes focus as the popover opens on it, or comes
  // back to it from the year list.
  useEffect(() => {
    if (!autoFocusCell) return;
    const grids =
      view === 'days'
        ? dayGridsRef.current
        : view === 'months'
          ? [monthGridRef.current]
          : [];
    focusTabStop(grids);
  }, [autoFocusCell, view]);

  // From then on focus follows the tab stop only while the grid has it, or
  // has just lost it, so focus on a header button or a time wheel stays put.
  const tabStopDayTime = tabStopDay.getTime();
  useEffect(() => {
    if (view !== 'days') return;
    const grids = dayGridsRef.current.filter(g => !!g);
    if (!grids.some(g => focusFollows(g, gridHeldFocusRef.current))) return;
    focusTabStop(grids);
  }, [tabStopDayTime, view]);

  useEffect(() => {
    const grid = monthGridRef.current;
    if (view !== 'months' || !grid) return;
    if (!focusFollows(grid, gridHeldFocusRef.current)) return;
    focusTabStop([grid]);
  }, [focusedYear, tabStopMonth, view]);

  useEffect(() => {
    if (view === 'years' || !returnFocusRef.current) return;
    returnFocusRef.current = false;
    focusTabStop(
      view === 'days' ? dayGridsRef.current : [monthGridRef.current]
    );
  }, [view]);

  // When the year view opens as navigation, scroll the focused year into
  // view.
  useEffect(() => {
    if (view !== 'years' || isYearGranularity || !yearGridRef.current) return;
    const sel = yearGridRef.current.querySelector<HTMLElement>(
      '[data-focused-year="true"]'
    );
    sel?.scrollIntoView({ block: 'center' });
    sel?.focus();
  }, [view, isYearGranularity]);

  // As the selection surface the year list opens with the focused year in
  // its middle. It scrolls the list itself rather than calling
  // `scrollIntoView`, which would also scroll the page to an inline calendar
  // on load, and focuses that year only when the popover asks.
  useEffect(() => {
    const list = yearGridRef.current;
    if (!isYearGranularity || !list) return;
    const target = list.querySelector<HTMLElement>(
      '[data-focused-year="true"]'
    );
    if (!target) return;
    const rect = target.getBoundingClientRect();
    list.scrollTop +=
      rect.top -
      list.getBoundingClientRect().top -
      (list.clientHeight - rect.height) / 2;
    if (autoFocusCell) target.focus({ preventScroll: true });
  }, [isYearGranularity, autoFocusCell]);

  // Keyboard moves keep DOM focus on the focused year while the list has it.
  useEffect(() => {
    const list = yearGridRef.current;
    if (!isYearGranularity || !list) return;
    if (!list.contains(getActiveElementInTree(list))) return;
    list.querySelector<HTMLElement>('[data-focused-year="true"]')?.focus();
  }, [isYearGranularity, focusedYear]);

  const navArrow = (d: string) => (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const prevButton = (
    <button
      type="button"
      className={navPrevClass}
      aria-label={isDayGranularity ? t.prevMonth : t.prevYear}
      disabled={calendarDisabled || prevDisabled || view !== baseView}
      onClick={() => turnPage(-1)}
    >
      {navArrow('M10 3l-5 5 5 5')}
    </button>
  );
  const nextButton = (
    <button
      type="button"
      className={navNextClass}
      aria-label={isDayGranularity ? t.nextMonth : t.nextYear}
      disabled={calendarDisabled || nextDisabled || view !== baseView}
      onClick={() => turnPage(1)}
    >
      {navArrow('M6 3l5 5-5 5')}
    </button>
  );

  // The first month's name, which opens the year list.
  const firstLabel = isYearGranularity ? (
    // The year list is the only view, so the label opens nothing.
    <span className={monthLabelClass} id={labelId}>
      {monthLabel}
    </span>
  ) : (
    <button
      type="button"
      className={monthTriggerClass}
      aria-haspopup="listbox"
      aria-expanded={view === 'years'}
      disabled={calendarDisabled}
      onClick={() => {
        setNavYear(null);
        setView(v => (v === 'years' ? baseView : 'years'));
      }}
    >
      <span className={monthLabelClass} id={labelId} aria-live="polite">
        {monthLabel}
      </span>
      <svg
        className={monthCaretClass}
        viewBox="0 0 12 12"
        width="10"
        height="10"
        aria-hidden="true"
      >
        <path
          d="M2 4l4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  // The months on show: every one over the day grid, and only the first,
  // which holds the month grid and the year list, otherwise.
  const panelCount = view === 'days' ? monthCount : 1;

  // A month's header. The pickers' puts both buttons after the name. With
  // the month held here, the previous button comes before the first month's
  // name and the next button after the last month's.
  const header = (i: number) =>
    lifted ? (
      <div className={headerClass}>
        {i === 0 && prevButton}
        {i === 0 ? (
          firstLabel
        ) : (
          <span className={monthLabelClass} id={labelIdFor(i)}>
            {monthHeading(shownMonths[i])}
          </span>
        )}
        {i === panelCount - 1 && nextButton}
      </div>
    ) : (
      <div className={headerClass}>
        {firstLabel}
        {!isYearGranularity && (
          <div className={navGroupClass}>
            {prevButton}
            {nextButton}
          </div>
        )}
      </div>
    );

  const dayGrid = (i: number) => (
    <div
      ref={el => {
        dayGridsRef.current[i] = el;
      }}
      role="grid"
      aria-labelledby={labelIdFor(i)}
      aria-multiselectable={rangeMode || undefined}
      aria-describedby={rangeMode ? rangeSummaryId : undefined}
      aria-disabled={calendarDisabled || undefined}
      aria-readonly={readOnly || undefined}
      aria-busy={busy || undefined}
      className={gridClass}
      onKeyDown={handleKeyDown}
      onMouseLeave={anchor && !lifted ? () => setHoverDate(null) : undefined}
      {...gridFocusHandlers}
    >
      {/* The weekday names head the grid's columns, as the APG's date
          picker has them. Days named in full carry their weekday, so the
          row is hidden then, as React Aria hides it. */}
      <div
        role="row"
        className={dayNamesRowClass}
        aria-hidden={namesInFull || undefined}
      >
        {computedDayNames.map((name, col) => (
          <div
            key={col}
            role="columnheader"
            aria-label={weekdayNames?.[col]}
            className={dayNameClass}
          >
            {name}
          </div>
        ))}
      </div>
      {inWeeks(
        shownCells[i].map((cell, j) => {
          const unselectable = isDateUnselectable(cell.date);
          const disabled = calendarDisabled || unselectable;
          const time = cell.date.getTime();
          // Range mode. The range on show has its ends filled. Every day
          // of a committed range is selected, and of a preview only the
          // start.
          const isStart = time === timeOf(shownStart);
          const isEnd = time === timeOf(shownEnd);
          const inRange =
            !!shownStart &&
            !!shownEnd &&
            time > shownStart.getTime() &&
            time < shownEnd.getTime();
          // The day a pending range would end on, which isn't picked
          // yet, so its description says what picking it does.
          const isPreviewEnd = previewing && isEnd && !isStart;
          const isPreview = (previewing && inRange) || isPreviewEnd;
          const isFilled = rangeMode
            ? isStart || (isEnd && !previewing)
            : !!value && isSameDay(value, cell.date);
          const isSelected = isFilled || (rangeMode && !previewing && inRange);
          const describedBy = rangeMode
            ? [
                isStart && rangeStartId,
                isEnd && !previewing && rangeEndId,
                isPreviewEnd && rangePreviewEndId,
              ]
                .filter(Boolean)
                .join(' ') || undefined
            : undefined;
          const otherMonth = !cell.inCurrentMonth;
          // A nearby month's day can be another month's own on show, which
          // keeps the tab stop.
          const isFocused = !otherMonth && isSameDay(cell.date, tabStopDay);
          const isToday = hydrated && cell.isToday;
          const cellClass = prefixedClassNames(classPrefix, 'dateinput-cell', {
            'is-selected': isFilled,
            'is-range-start': isStart,
            'is-range-end': isEnd,
            'is-in-range': inRange,
            'is-preview': isPreview,
            'is-today': isToday,
            'is-disabled': disabled,
            'is-other-month': otherMonth,
          });
          // A nearby month's day shows dimmed, except where its own month is
          // on show beside this one, so no day shows twice.
          const cellMonth = monthIndex(cell.date);
          const display =
            !otherMonth ||
            (nearbyMonthDays &&
              (cellMonth < firstShownIndex || cellMonth > lastShownIndex));
          const fullName = fullNames?.[i][j];
          const content =
            display && dayContent
              ? dayContent(cell.date, {
                  isToday,
                  isSelected,
                  isDisabled: disabled,
                  isOutsideMonth: otherMonth,
                })
              : undefined;
          return (
            <button
              key={cell.date.toISOString()}
              type="button"
              role="gridcell"
              tabIndex={isFocused ? 0 : -1}
              aria-selected={isSelected}
              aria-disabled={disabled}
              aria-current={isToday ? 'date' : undefined}
              aria-describedby={describedBy}
              aria-label={
                fullName !== undefined && getDayLabel
                  ? getDayLabel(cell.date, fullName)
                  : fullName
              }
              data-focused={isFocused ? 'true' : undefined}
              disabled={disabled || !display}
              className={cellClass}
              onFocus={() => {
                // Reached by Tab while the focused day is disabled, or
                // by pointer: keys move on from here. A nearby month's
                // day waits for its click, which turns the grid.
                if (!otherMonth && !isSameDay(cell.date, focusedDate)) {
                  changeFocus(cell.date);
                }
              }}
              // Mouseover rather than mouseenter: browsers send it to a
              // disabled day as well, where React holds mouseenter back,
              // so the preview leaves the last enabled day behind.
              onMouseOver={anchor ? () => setHoverDate(cell.date) : undefined}
              onClick={() => {
                if (disabled) return;
                changeFocus(cell.date);
                if (rangeMode) pickRangeDay(cell.date);
                else onSelect?.(cell.date);
              }}
              style={!display ? { visibility: 'hidden' } : undefined}
            >
              {cell.date.getDate()}
              {/* Every day shown has the line, empty where the template
                  draws nothing, so the numbers line up along a row. */}
              {display && dayContent && (
                <span className={cellContentClass}>
                  {rendersContent(content) ? content : null}
                </span>
              )}
            </button>
          );
        }),
        weekClass
      )}
    </div>
  );

  const monthGrid = (
    <div
      ref={monthGridRef}
      role="grid"
      aria-labelledby={labelId}
      aria-disabled={calendarDisabled || undefined}
      aria-readonly={readOnly || undefined}
      aria-busy={busy || undefined}
      className={monthsGridClass}
      onKeyDown={handleMonthKeyDown}
      {...gridFocusHandlers}
    >
      {MONTH_ROWS.map(row => (
        <div key={row[0]} role="row" className={monthsRowClass}>
          {row.map(month => {
            const date = makeDate(focusedYear, month);
            const disabled = calendarDisabled || disabledMonths[month];
            const isSelected = !!value && isSameMonth(value, date);
            const isFocused = month === tabStopMonth;
            const isCurrent = !!today && isSameMonth(date, today);
            const cellClass = prefixedClassNames(
              classPrefix,
              'dateinput-month-cell',
              {
                'is-selected': isSelected,
                'is-today': isCurrent,
                'is-disabled': disabled,
              }
            );
            return (
              <button
                key={month}
                type="button"
                role="gridcell"
                tabIndex={isFocused ? 0 : -1}
                aria-selected={isSelected}
                aria-disabled={disabled}
                aria-current={isCurrent ? 'date' : undefined}
                aria-label={computedMonthNames[month]}
                data-focused={isFocused ? 'true' : undefined}
                disabled={disabled}
                className={cellClass}
                onFocus={() => {
                  // Reached by Tab while the focused month is disabled,
                  // or by pointer: keys move on from here.
                  if (month !== focusedDate.getMonth()) {
                    changeFocus(clampDate(date, min, max));
                  }
                }}
                onClick={() => {
                  changeFocus(clampDate(date, min, max));
                  onSelect?.(date);
                }}
              >
                {monthCellNames[month]}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  const yearListBox = (
    <div
      ref={yearGridRef}
      className={yearsGridClass}
      role="listbox"
      aria-label={isYearGranularity ? t.chooseYear : monthLabel}
      aria-disabled={calendarDisabled || undefined}
      aria-readonly={(isYearGranularity && readOnly) || undefined}
      onKeyDown={handleYearListKeyDown}
    >
      {yearList.map(year => {
        const isFocused = year === tabStopYear;
        const isToday = year === todayYear;
        // As navigation the focused year is the current one. As the
        // selection surface the value's year is selected and focus roams.
        const isSelected = isYearGranularity
          ? !!value && value.getFullYear() === year
          : isFocused;
        const disabled = calendarDisabled || disabledYears.has(year);
        const cellCls = prefixedClassNames(classPrefix, 'dateinput-year-cell', {
          'is-selected': isSelected,
          'is-today': isToday,
          'is-disabled': disabled,
        });
        return (
          <button
            key={year}
            type="button"
            role="option"
            aria-selected={isSelected}
            aria-disabled={isYearGranularity ? disabled : undefined}
            aria-current={isYearGranularity && isToday ? 'date' : undefined}
            data-focused-year={isFocused ? 'true' : undefined}
            tabIndex={year === listTabStop ? 0 : -1}
            disabled={disabled}
            className={cellCls}
            onFocus={() => {
              // As navigation, focusing a year by key or pointer only
              // moves the tab stop: nothing is committed until a year is
              // picked. As the selection surface it is reached by Tab
              // while the focused year is disabled, or by pointer, and
              // keys move on from here.
              if (!isYearGranularity) {
                setNavYear(year);
              } else if (year !== focusedYear) {
                onFocusedDateChange(clampDate(makeDate(year), min, max));
              }
            }}
            onClick={() =>
              isYearGranularity ? handleYearPick(year) : handleYearSelect(year)
            }
          >
            {year}
          </button>
        );
      })}
    </div>
  );

  const panel = (i: number) => (
    <div
      key={i}
      className={classNames(calendarClass, i === 0 ? className : undefined)}
      id={i === 0 ? id : undefined}
    >
      {header(i)}
      {view === 'days' && dayGrid(i)}
      {view === 'months' && monthGrid}
      {view === 'years' && yearListBox}

      {i === 0 && rangeMode && (
        // The words the day cells and the grid point at. The live region
        // stays mounted while the year list is open, so it is in the page
        // already when a pick changes what it says.
        <>
          <span id={rangeStartId} hidden>
            {t.rangeStart}
          </span>
          <span id={rangeEndId} hidden>
            {t.rangeEnd}
          </span>
          <span id={rangePreviewEndId} hidden>
            {t.rangePreviewEnd}
          </span>
          <div id={rangeSummaryId} aria-live="polite" style={visuallyHidden}>
            {rangeSummary}
          </div>
        </>
      )}
    </div>
  );

  // The pickers draw one month. With the month held here, each month on show
  // is a panel of its own, side by side in one row, which the pointer leaves
  // as a whole, so a range's preview holds as it crosses between months.
  return lifted ? (
    <div
      className={monthsClass}
      onMouseLeave={anchor ? () => setHoverDate(null) : undefined}
    >
      {Array.from({ length: panelCount }, (_, i) => panel(i))}
    </div>
  ) : (
    panel(0)
  );
};

Calendar.displayName = 'Calendar';

export default Calendar;
