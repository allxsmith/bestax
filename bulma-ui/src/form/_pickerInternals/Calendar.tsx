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
import { getActiveElementInTree } from '../../helpers/shadowDom';
import {
  DateGranularity,
  DayOfWeek,
  PickerLabels,
  mergeLabels,
} from './pickerTypes';
import {
  addDays,
  addMonths,
  addYears,
  buildMonthGrid,
  clampDate,
  isDayUnselectable,
  isPeriodUnselectable,
  isSameDay,
  isSameMonth,
  makeDate,
  startOfDay,
  startOfMonth,
} from './dateUtils';
import { getDayNames, getMonthNames } from './formatters';

export interface CalendarProps {
  value: Date | null;
  focusedDate: Date;
  onSelect: (d: Date) => void;
  onFocusedDateChange: (d: Date) => void;
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
   * Defaults to ±100 years around the focused year, clamped by `min`/`max`.
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
}

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

/**
 * The year list's keyboard when it is the selection surface: arrows move a
 * year or a row, Home/End go to the list's ends. Returns the year to start
 * from and the direction to search past disabled years, or `null` for a key
 * the list doesn't handle.
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
  focusedDate,
  onSelect,
  onFocusedDateChange,
  min,
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
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const monthGridRef = useRef<HTMLDivElement>(null);
  const yearGridRef = useRef<HTMLDivElement>(null);
  const { classPrefix } = useConfig();
  const t = mergeLabels(labels);
  const baseView = BASE_VIEW[granularity];
  const isDayGranularity = granularity === 'day';
  const isYearGranularity = granularity === 'year';
  const [view, setView] = useState<CalendarView>(baseView);

  const computedDayNames = useMemo(() => {
    if (dayNames && dayNames.length === 7) return dayNames;
    const sundayFirst = getDayNames(locale, 'short');
    return [
      ...sundayFirst.slice(firstDayOfWeek),
      ...sundayFirst.slice(0, firstDayOfWeek),
    ];
  }, [dayNames, locale, firstDayOfWeek]);

  const computedMonthNames = useMemo(() => {
    if (monthNames && monthNames.length === 12) return monthNames;
    return getMonthNames(locale, 'long');
  }, [monthNames, locale]);

  // The month grid's cells are too narrow for long names, so they show the
  // short form unless the caller supplied names of their own.
  const monthCellNames = useMemo(() => {
    if (monthNames && monthNames.length === 12) return monthNames;
    return getMonthNames(locale, 'short');
  }, [monthNames, locale]);

  const cells = useMemo(
    () => buildMonthGrid(focusedDate, firstDayOfWeek),
    [focusedDate, firstDayOfWeek]
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
  // the month on show, and focusing it makes it the focused day. A nearby
  // month's day is left out, as focusing it would turn the grid to its month.
  const tabStopDay = useMemo(() => {
    const days = cells.filter(c => c.inCurrentMonth).map(c => c.date);
    const i = nearestEnabled(
      focusedDate.getDate() - 1,
      days.map(isDateUnselectable)
    );
    return days[i];
  }, [cells, focusedDate, isDateUnselectable]);

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
        if (min && candidate.getTime() < startOfDay(min).getTime()) return;
        if (max && candidate.getTime() > startOfDay(max).getTime()) return;
        if (!isDateUnselectable(candidate)) {
          onFocusedDateChange(candidate);
          return;
        }
        candidate = addDays(candidate, direction);
      }
    },
    [min, max, isDateUnselectable, onFocusedDateChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
          if (!isDateUnselectable(focusedDate)) onSelect(focusedDate);
          break;
      }
    },
    [focusedDate, firstDayOfWeek, isDateUnselectable, moveFocus, onSelect]
  );

  // The month grid's counterpart to `moveFocus`: step by `direction` months
  // until a month with a selectable day turns up, stopping at the min/max
  // months. The cap guards against a range with nothing selectable.
  const moveMonthFocus = useCallback(
    (next: Date, direction: 1 | -1) => {
      let candidate = next;
      for (let i = 0; i < 120; i++) {
        const month = startOfMonth(candidate).getTime();
        if (min && month < startOfMonth(min).getTime()) return;
        if (max && month > startOfMonth(max).getTime()) return;
        if (!isMonthUnselectable(candidate)) {
          onFocusedDateChange(candidate);
          return;
        }
        candidate = addMonths(candidate, direction);
      }
    },
    [min, max, isMonthUnselectable, onFocusedDateChange]
  );

  const handleMonthKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isMonthUnselectable(focusedDate)) {
          onSelect(startOfMonth(focusedDate));
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
  const monthsGridClass = usePrefixedClassNames('dateinput-months-grid');
  const monthsRowClass = usePrefixedClassNames('dateinput-months-row');
  const yearsGridClass = usePrefixedClassNames('dateinput-years-grid');

  const focusedYear = focusedDate.getFullYear();
  const today = new Date();
  const todayYear = today.getFullYear();

  // The header steps a month at a time over the day grid and a year at a
  // time over the month grid, kept inside min/max.
  const prevMonthAnchor = addMonths(focusedDate, -1);
  const nextMonthAnchor = addMonths(focusedDate, 1);
  const prevAnchor = isDayGranularity
    ? prevMonthAnchor
    : clampDate(addYears(focusedDate, -1), min, max);
  const nextAnchor = isDayGranularity
    ? nextMonthAnchor
    : clampDate(addYears(focusedDate, 1), min, max);
  const prevDisabled = isDayGranularity
    ? !!(
        min &&
        prevMonthAnchor.getTime() < startOfDay(min).getTime() &&
        isSameMonth(focusedDate, min)
      )
    : !!(min && focusedYear <= min.getFullYear());
  const nextDisabled = isDayGranularity
    ? !!(
        max &&
        nextMonthAnchor.getTime() > startOfDay(max).getTime() &&
        isSameMonth(focusedDate, max)
      )
    : !!(max && focusedYear >= max.getFullYear());

  const labelId = id ? `${id}-label` : undefined;
  const monthLabel = isDayGranularity
    ? `${computedMonthNames[focusedDate.getMonth()]} ${focusedYear}`
    : String(focusedYear);

  // As the selection surface the year list is where focus moves, so its
  // window stays centred on the year focused at mount: re-centring on every
  // move would reflow the list under the keyboard.
  const [mountYear] = useState(focusedYear);
  const windowYear = isYearGranularity ? mountYear : focusedYear;

  const yearList = useMemo<number[]>(() => {
    const minYear = min ? min.getFullYear() : windowYear - 100;
    const maxYear = max ? max.getFullYear() : windowYear + 100;
    const [lo, hi] = yearsRange ?? [minYear, maxYear];
    const start = Math.max(lo, minYear);
    const end = Math.min(hi, maxYear);
    const out: number[] = [];
    for (let y = start; y <= end; y++) out.push(y);
    return out;
  }, [windowYear, min, max, yearsRange]);

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
  // and focusing it makes it the focused year. A year outside the list keeps
  // the stop, which then marks no option.
  const tabStopYear = useMemo(() => {
    const i = yearList.indexOf(focusedYear);
    if (i < 0) return focusedYear;
    return yearList[
      nearestEnabled(
        i,
        yearList.map(y => disabledYears.has(y))
      )
    ];
  }, [yearList, focusedYear, disabledYears]);

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

  const handleYearSelect = useCallback(
    (year: number) => {
      const next = new Date(focusedDate);
      next.setFullYear(year);
      // Keep month/day. The month grid also clamps into [min, max] so its
      // focused month is never one the bounds rule out.
      onFocusedDateChange(isDayGranularity ? next : clampDate(next, min, max));
      setView(baseView);
    },
    [focusedDate, onFocusedDateChange, isDayGranularity, min, max, baseView]
  );

  // Picking from the year list as the selection surface: focus follows the
  // pick and `onSelect` gets the year's first day.
  const handleYearPick = useCallback(
    (year: number) => {
      onFocusedDateChange(clampDate(makeDate(year), min, max));
      onSelect(makeDate(year));
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
    (e: React.KeyboardEvent) => {
      if (!isYearGranularity) {
        // As navigation, Escape returns to the grid the list was opened from.
        if (e.key === 'Escape') {
          e.preventDefault();
          setView(baseView);
        }
        return;
      }
      const step = yearStep(e.key, focusedYear, yearList);
      if (!step) return;
      e.preventDefault();
      moveYearFocus(step[0], step[1]);
    },
    [isYearGranularity, baseView, focusedYear, yearList, moveYearFocus]
  );

  // The day or month grid takes focus as the popover opens on it, or comes
  // back to it from the year list.
  useEffect(() => {
    if (!autoFocusCell) return;
    const grid =
      view === 'days'
        ? gridRef.current
        : view === 'months'
          ? monthGridRef.current
          : null;
    grid?.querySelector<HTMLElement>('[data-focused="true"]')?.focus();
  }, [autoFocusCell, view]);

  // From then on focus follows the tab stop only while the grid has it, or
  // has just lost it, so focus on a header button or a time wheel stays put.
  const tabStopDayTime = tabStopDay.getTime();
  useEffect(() => {
    const grid = gridRef.current;
    if (view !== 'days' || !grid) return;
    if (!focusFollows(grid, gridHeldFocusRef.current)) return;
    grid.querySelector<HTMLElement>('[data-focused="true"]')?.focus();
  }, [tabStopDayTime, view]);

  useEffect(() => {
    const grid = monthGridRef.current;
    if (view !== 'months' || !grid) return;
    if (!focusFollows(grid, gridHeldFocusRef.current)) return;
    grid.querySelector<HTMLElement>('[data-focused="true"]')?.focus();
  }, [focusedYear, tabStopMonth, view]);

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

  return (
    <div className={classNames(calendarClass, className)} id={id}>
      <div className={headerClass}>
        {isYearGranularity ? (
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
            onClick={() => setView(v => (v === 'years' ? baseView : 'years'))}
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
        )}
        {!isYearGranularity && (
          <div className={navGroupClass}>
            <button
              type="button"
              className={navPrevClass}
              aria-label={isDayGranularity ? t.prevMonth : t.prevYear}
              disabled={prevDisabled || view !== baseView}
              onClick={() => onFocusedDateChange(prevAnchor)}
            >
              {navArrow('M10 3l-5 5 5 5')}
            </button>
            <button
              type="button"
              className={navNextClass}
              aria-label={isDayGranularity ? t.nextMonth : t.nextYear}
              disabled={nextDisabled || view !== baseView}
              onClick={() => onFocusedDateChange(nextAnchor)}
            >
              {navArrow('M6 3l5 5-5 5')}
            </button>
          </div>
        )}
      </div>

      {view === 'days' && (
        <>
          <div className={dayNamesRowClass} aria-hidden="true">
            {computedDayNames.map((name, i) => (
              <div key={i} className={dayNameClass}>
                {name}
              </div>
            ))}
          </div>
          <div
            ref={gridRef}
            role="grid"
            aria-labelledby={labelId}
            className={gridClass}
            onKeyDown={handleKeyDown}
            {...gridFocusHandlers}
          >
            {cells.map(cell => {
              const disabled = isDateUnselectable(cell.date);
              const isSelected = !!value && isSameDay(value, cell.date);
              const isFocused = isSameDay(cell.date, tabStopDay);
              const otherMonth = !cell.inCurrentMonth;
              const cellClass = prefixedClassNames(
                classPrefix,
                'dateinput-cell',
                {
                  'is-selected': isSelected,
                  'is-today': cell.isToday,
                  'is-disabled': disabled,
                  'is-other-month': otherMonth,
                }
              );
              const display = !otherMonth || nearbyMonthDays;
              return (
                <button
                  key={cell.date.toISOString()}
                  type="button"
                  role="gridcell"
                  tabIndex={isFocused ? 0 : -1}
                  aria-selected={isSelected}
                  aria-disabled={disabled}
                  aria-current={cell.isToday ? 'date' : undefined}
                  data-focused={isFocused ? 'true' : undefined}
                  disabled={disabled || !display}
                  className={cellClass}
                  onFocus={() => {
                    // Reached by Tab while the focused day is disabled, or
                    // by pointer: keys move on from here. A nearby month's
                    // day waits for its click, which turns the grid.
                    if (!otherMonth && !isSameDay(cell.date, focusedDate)) {
                      onFocusedDateChange(cell.date);
                    }
                  }}
                  onClick={() => {
                    if (disabled) return;
                    onFocusedDateChange(cell.date);
                    onSelect(cell.date);
                  }}
                  style={!display ? { visibility: 'hidden' } : undefined}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>
        </>
      )}

      {view === 'months' && (
        <div
          ref={monthGridRef}
          role="grid"
          aria-labelledby={labelId}
          className={monthsGridClass}
          onKeyDown={handleMonthKeyDown}
          {...gridFocusHandlers}
        >
          {MONTH_ROWS.map(row => (
            <div key={row[0]} role="row" className={monthsRowClass}>
              {row.map(month => {
                const date = makeDate(focusedYear, month);
                const disabled = disabledMonths[month];
                const isSelected = !!value && isSameMonth(value, date);
                const isFocused = month === tabStopMonth;
                const isCurrent = isSameMonth(date, today);
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
                        onFocusedDateChange(clampDate(date, min, max));
                      }
                    }}
                    onClick={() => {
                      onFocusedDateChange(clampDate(date, min, max));
                      onSelect(date);
                    }}
                  >
                    {monthCellNames[month]}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {view === 'years' && (
        <div
          ref={yearGridRef}
          className={yearsGridClass}
          role="listbox"
          aria-label={isYearGranularity ? t.chooseYear : monthLabel}
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
            const disabled = disabledYears.has(year);
            const cellCls = prefixedClassNames(
              classPrefix,
              'dateinput-year-cell',
              {
                'is-selected': isSelected,
                'is-today': isToday,
                'is-disabled': disabled,
              }
            );
            return (
              <button
                key={year}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-disabled={isYearGranularity ? disabled : undefined}
                aria-current={isYearGranularity && isToday ? 'date' : undefined}
                data-focused-year={isFocused ? 'true' : undefined}
                tabIndex={isFocused ? 0 : -1}
                disabled={disabled}
                className={cellCls}
                onFocus={() => {
                  // Reached by Tab while the focused year is disabled, or by
                  // pointer: keys move on from here.
                  if (isYearGranularity && year !== focusedYear) {
                    onFocusedDateChange(clampDate(makeDate(year), min, max));
                  }
                }}
                onClick={() =>
                  isYearGranularity
                    ? handleYearPick(year)
                    : handleYearSelect(year)
                }
              >
                {year}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

Calendar.displayName = 'Calendar';

export default Calendar;
