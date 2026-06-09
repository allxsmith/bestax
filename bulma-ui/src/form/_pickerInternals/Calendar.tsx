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
import { DayOfWeek, PickerLabels, mergeLabels } from './pickerTypes';
import {
  addDays,
  addMonths,
  addYears,
  buildMonthGrid,
  isSameDay,
  isSameMonth,
  isWithin,
  startOfDay,
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
  /** When true, focus the cell matching `focusedDate` after each render. */
  autoFocusCell?: boolean;
  /** Optional translatable string overrides. */
  labels?: PickerLabels;
  /**
   * Inclusive `[min, max]` year range shown in the year-dropdown view.
   * Defaults to ±100 years around the focused year, clamped by `min`/`max`.
   */
  yearsRange?: [number, number];
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
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const yearGridRef = useRef<HTMLDivElement>(null);
  const { classPrefix } = useConfig();
  const t = mergeLabels(labels);
  const [view, setView] = useState<'days' | 'years'>('days');

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

  const cells = useMemo(
    () => buildMonthGrid(focusedDate, firstDayOfWeek),
    [focusedDate, firstDayOfWeek]
  );

  const isDateUnselectable = useCallback(
    (d: Date) => {
      if (!isWithin(d, min, max)) return true;
      if (shouldDisableDate?.(d)) return true;
      if (unselectableDates?.some(u => isSameDay(u, d))) return true;
      return false;
    },
    [min, max, shouldDisableDate, unselectableDates]
  );

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

  const calendarClass = usePrefixedClassNames('datepicker', {
    [`is-${color}`]: !!color,
    [`is-${size}`]: !!size,
  });
  const headerClass = usePrefixedClassNames('datepicker-header');
  const monthTriggerClass = usePrefixedClassNames('datepicker-month-trigger', {
    'is-active': view === 'years',
  });
  const monthCaretClass = usePrefixedClassNames('datepicker-month-caret');
  const navGroupClass = usePrefixedClassNames('datepicker-nav-group');
  const navPrevClass = usePrefixedClassNames('datepicker-nav-prev');
  const navNextClass = usePrefixedClassNames('datepicker-nav-next');
  const monthLabelClass = usePrefixedClassNames('datepicker-month-label');
  const dayNamesRowClass = usePrefixedClassNames('datepicker-day-names');
  const dayNameClass = usePrefixedClassNames('datepicker-day-name');
  const gridClass = usePrefixedClassNames('datepicker-grid');
  const yearsGridClass = usePrefixedClassNames('datepicker-years-grid');

  const prevMonthAnchor = addMonths(focusedDate, -1);
  const nextMonthAnchor = addMonths(focusedDate, 1);
  const prevDisabled = !!(
    min &&
    prevMonthAnchor.getTime() < startOfDay(min).getTime() &&
    isSameMonth(focusedDate, min)
  );
  const nextDisabled = !!(
    max &&
    nextMonthAnchor.getTime() > startOfDay(max).getTime() &&
    isSameMonth(focusedDate, max)
  );

  const labelId = id ? `${id}-label` : undefined;
  const monthLabel = `${computedMonthNames[focusedDate.getMonth()]} ${focusedDate.getFullYear()}`;

  const yearList = useMemo<number[]>(() => {
    const focusedYear = focusedDate.getFullYear();
    const minYear = min ? min.getFullYear() : focusedYear - 100;
    const maxYear = max ? max.getFullYear() : focusedYear + 100;
    const [lo, hi] = yearsRange ?? [minYear, maxYear];
    const start = Math.max(lo, minYear);
    const end = Math.min(hi, maxYear);
    const out: number[] = [];
    for (let y = start; y <= end; y++) out.push(y);
    return out;
  }, [focusedDate, min, max, yearsRange]);

  const handleYearSelect = useCallback(
    (year: number) => {
      const next = new Date(focusedDate);
      next.setFullYear(year);
      // Keep month/day but clamp into [min, max].
      onFocusedDateChange(next);
      setView('days');
    },
    [focusedDate, onFocusedDateChange]
  );

  useEffect(() => {
    if (view !== 'days') return;
    if (!autoFocusCell || !gridRef.current) return;
    const target = gridRef.current.querySelector<HTMLElement>(
      '[data-focused="true"]'
    );
    target?.focus();
  }, [autoFocusCell, focusedDate, view]);

  // When the year view opens, scroll the focused year into view.
  useEffect(() => {
    if (view !== 'years' || !yearGridRef.current) return;
    const sel = yearGridRef.current.querySelector<HTMLElement>(
      '[data-focused-year="true"]'
    );
    sel?.scrollIntoView({ block: 'center' });
    sel?.focus();
  }, [view]);

  const focusedYear = focusedDate.getFullYear();
  const todayYear = new Date().getFullYear();

  return (
    <div className={classNames(calendarClass, className)} id={id}>
      <div className={headerClass}>
        <button
          type="button"
          className={monthTriggerClass}
          aria-haspopup="listbox"
          aria-expanded={view === 'years'}
          onClick={() => setView(v => (v === 'years' ? 'days' : 'years'))}
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
        <div className={navGroupClass}>
          <button
            type="button"
            className={navPrevClass}
            aria-label={t.prevMonth}
            disabled={prevDisabled || view !== 'days'}
            onClick={() => onFocusedDateChange(prevMonthAnchor)}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path
                d="M10 3l-5 5 5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className={navNextClass}
            aria-label={t.nextMonth}
            disabled={nextDisabled || view !== 'days'}
            onClick={() => onFocusedDateChange(nextMonthAnchor)}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path
                d="M6 3l5 5-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {view === 'days' ? (
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
          >
            {cells.map(cell => {
              const disabled = isDateUnselectable(cell.date);
              const isSelected = !!value && isSameDay(value, cell.date);
              const isFocused = isSameDay(cell.date, focusedDate);
              const otherMonth = !cell.inCurrentMonth;
              const cellClass = prefixedClassNames(
                classPrefix,
                'datepicker-cell',
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
      ) : (
        <div
          ref={yearGridRef}
          className={yearsGridClass}
          role="listbox"
          aria-label={monthLabel}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setView('days');
            }
          }}
        >
          {yearList.map(year => {
            const isFocused = year === focusedYear;
            const isToday = year === todayYear;
            const cellCls = prefixedClassNames(
              classPrefix,
              'datepicker-year-cell',
              {
                'is-selected': isFocused,
                'is-today': isToday,
              }
            );
            return (
              <button
                key={year}
                type="button"
                role="option"
                aria-selected={isFocused}
                data-focused-year={isFocused ? 'true' : undefined}
                tabIndex={isFocused ? 0 : -1}
                className={cellCls}
                onClick={() => handleYearSelect(year)}
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
