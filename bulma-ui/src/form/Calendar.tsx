import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { warnOnce } from '../helpers/devWarnings';
import { useControlled } from '../helpers/useControlled';
import { Calendar as CalendarGrid } from './_pickerInternals/Calendar';
import type {
  CalendarDayState,
  DateGranularity,
  DateRangeValue,
  DayOfWeek,
  PickerLabels,
} from './_pickerInternals/pickerTypes';
import {
  clampDate,
  floorMin,
  startOfDay,
  startOfMonth,
} from './_pickerInternals/dateUtils';
import {
  hasOwnDayNames,
  usePickerFirstDayOfWeek,
  usePickerLocale,
  usePickerLocaleScope,
} from './_pickerInternals/useLocaleDefaults';
import { useFieldsetDisabled } from './FormContext';
import { useAutoLabelledBy } from './useAutoLabelId';

export type { CalendarDayState };

/** How a click on a day picks: one day, or a range's start and then its end. */
export type CalendarSelectionMode = 'single' | 'range';

/**
 * What every Calendar takes. The helper props, the other attributes and the
 * `ref` land on the root `<div>`.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Forwarded to the root `<div>`.
 * @extraProp {string} [aria-label] - Names the Calendar, which makes its root a `role="group"`. Each month's grid keeps its own name, its month and year.
 * @extraProp {string} [aria-labelledby] - The ids of what names the Calendar, such as a heading above it, which makes its root a `role="group"`.
 */
interface CalendarBaseProps
  extends
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'color' | 'onChange' | 'defaultValue'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * The month on show when you hold the state: any day in it, read as the
   * month. With `monthsToShow`, the first of the months. Changing it from
   * inside only calls `onMonthChange`, and nothing moves until you pass the
   * new month. At `granularity="month"` it's read as its year, the year the
   * month grid shows, and at `"year"` it's the year the list opens on.
   */
  month?: Date;
  /**
   * The month on show to begin with, when the Calendar holds its own state.
   * Unset, it's the month of `value` (a range's start), or else today's,
   * moved inside `min` and `max`. On a server render today is the server's,
   * so give this, `month` or a picked `value` there.
   */
  defaultMonth?: Date;
  /**
   * Called with the first day of the new month on show, whenever a move takes
   * focus past the months on show: the header's buttons, a key (an arrow,
   * PageUp or PageDown, Home or End) crossing a month's edge, a click on a
   * nearby month's day, or a pick in the year list. Load that month's data
   * from here. At
   * `granularity="month"` it's called as the year on show changes, with
   * 1 January of that year, and at `"year"` it isn't called, since the list
   * shows every year.
   */
  onMonthChange?: (month: Date) => void;
  /**
   * How many months show side by side, over the day grid. They wrap to a
   * column where the width runs out, one previous and next pair moves them
   * all by this many, and the arrow keys cross from one month into the next.
   * The month grid and the year list show one panel whatever it is.
   * @defaultValue 1
   */
  monthsToShow?: number;
  /**
   * Draws content inside a day's button, under its number: a dot, a count,
   * a price. Phrasing content only, with nothing in it to click or focus.
   * Say the same thing in `getDayLabel`: a day's name is its date, so a
   * screen reader doesn't read what this draws.
   */
  dayTemplate?: (date: Date, state: CalendarDayState) => React.ReactNode;
  /**
   * Returns a day's accessible name. `label` is the default, the full date
   * in the Calendar's locale ("Tuesday, October 20, 2026"), so append to it:
   * `` (date, label) => `${label}, 3 slots left` ``. On a server-rendered
   * page the full-date names arrive once the page hydrates, as the pickers'
   * full weekday names do, and until then a day is named by its number and
   * the text `dayTemplate` draws.
   */
  getDayLabel?: (date: Date, label: string) => string;
  /**
   * The month's data is on its way. The grids are `aria-busy` and the day
   * content dims, while the days, their focus and the keys keep working.
   */
  loading?: boolean;
  /**
   * Days can be focused and read but not picked, and the grids are
   * `aria-readonly`. For a calendar that only shows things.
   */
  readOnly?: boolean;
  /**
   * Nothing can be focused or picked, and the month can't change. A
   * `<Fieldset disabled>` around it does the same.
   */
  disabled?: boolean;
  /** Stretches the grid to the width of its container (Bulma's `is-fullwidth`). */
  isFullwidth?: boolean;
  /**
   * Earliest day that can be picked. Days before it show disabled. One
   * before year 1, or none, counts as the start of year 1.
   */
  min?: Date;
  /** Latest day that can be picked. Days after it show disabled. */
  max?: Date;
  /** Rules days out, such as weekends. They show disabled and can't be picked. */
  shouldDisableDate?: (date: Date) => boolean;
  /** Days that can't be picked, matched by calendar day. Merged with `shouldDisableDate`. */
  unselectableDates?: Date[];
  /**
   * BCP-47 locale for the day and month names and the days' accessible
   * names. Unset, it's a `LocaleProvider`'s, and with neither, the runtime's.
   */
  locale?: string;
  /**
   * Day the week starts on (0 = Sunday). Unset inside a `LocaleProvider`,
   * it's the first day of the week in the Calendar's locale, and elsewhere,
   * or with seven `dayNames` of your own, Sunday.
   * @defaultValue 0
   */
  firstDayOfWeek?: DayOfWeek;
  /**
   * The seven day names, shown exactly as given from the first column, so
   * they start on the day the week does, as on `DateInput`.
   */
  dayNames?: string[];
  /** The twelve month names. */
  monthNames?: string[];
  /** Shows the dimmed days of the months before and after, to fill each week. */
  nearbyMonthDays?: boolean;
  /**
   * Bulma color for the picked days. Today and the focus ring take its
   * `-on-scheme` variant. Unset, the `--bulma-dateinput-*` variables decide,
   * and they follow `primary`.
   */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Size of the cells and their text. */
  size?: 'small' | 'medium' | 'large';
  /** The visible and accessible strings, in your app's language, as on the date pickers. */
  labels?: PickerLabels;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
}

/** Props for a Calendar that picks one day, or one month or year with `granularity`. */
export interface CalendarSingleProps extends CalendarBaseProps {
  /**
   * How a click, Enter or Space picks: `'single'` picks one day, and
   * `'range'` a range's start and then its end. The value's type follows it.
   * @defaultValue 'single'
   */
  selectionMode?: 'single';
  /**
   * The picked day when you hold the state, or `null` for none: a `Date`,
   * or with `selectionMode="range"` a `[start, end]` pair, start first, where
   * `[null, null]` is empty. Picking then only calls `onChange`, and nothing
   * changes until you pass the new value. With neither this nor
   * `defaultValue`, nothing shows as picked. A new value from outside
   * doesn't turn the month on show: hold `month` to show it.
   */
  value?: Date | null;
  /** The value to begin with, when the Calendar holds its own state. */
  defaultValue?: Date | null;
  /**
   * Called with what was picked: the day, typed as `DateInput`'s so one
   * handler fits both, or with `selectionMode="range"` both ends in one call,
   * start first, once the second is picked.
   */
  onChange?: (value: Date | null) => void;
  /**
   * `'month'` shows a year's months and `'year'` the year list, and a pick is
   * the first day of that month or year, as on `DateInput`. Only a Calendar
   * that picks one day takes it.
   * @defaultValue 'day'
   */
  granularity?: DateGranularity;
}

/** Props for a Calendar that picks a range. */
export interface CalendarRangeProps extends CalendarBaseProps {
  /**
   * A first pick marks the start, a second the end, and Escape drops a start
   * that has no end yet.
   */
  selectionMode: 'range';
  /** The picked range when you hold the state, start first. `[null, null]` is empty. */
  value?: DateRangeValue;
  /** The range picked to begin with, when the Calendar holds its own state. */
  defaultValue?: DateRangeValue;
  /**
   * Called once both ends are picked, in one call, start first, as
   * `DateRangeInput`'s calendar commits.
   */
  onChange?: (value: DateRangeValue) => void;
  /** Only the day grid picks a range. */
  granularity?: never;
}

/** Props for the Calendar component. */
export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

const EMPTY_RANGE: DateRangeValue = [null, null];

/** Warns once about a value whose shape doesn't fit `selectionMode`. */
function warnMismatch(given: unknown, isRange: boolean, prop: string) {
  if (given === undefined || given === null) return;
  if (isRange && !Array.isArray(given)) {
    warnOnce(
      `calendar-${prop}-not-range`,
      `[bestax-bulma] Calendar with selectionMode="range" was given a ` +
        `${prop} that isn't a [start, end] pair, so it shows nothing as ` +
        'picked. Pass [start, end], with null for a missing end.'
    );
  } else if (!isRange && !(given instanceof Date)) {
    warnOnce(
      `calendar-${prop}-not-date`,
      `[bestax-bulma] Calendar was given a ${prop} that isn't a Date, so it ` +
        'shows nothing as picked. Pass a Date, or set selectionMode="range" ' +
        'to pick a [start, end] pair.'
    );
  }
}

/**
 * The `Calendar` component shows months on the page, not behind an input,
 * where a click picks a day or a range and each day can show what's on it.
 *
 * It's the grid the date pickers draw, with no `Field`, label or hidden
 * input: a form that posts a date uses `DateInput inline` instead.
 *
 * @function
 * @param {CalendarProps} props - Props for the Calendar component.
 * @returns {JSX.Element} The rendered calendar.
 *
 * @example
 * <Calendar aria-label="Pick a day" value={day} onChange={setDay} />
 *
 * @example
 * // A stay that crosses a month's end
 * <Calendar
 *   aria-label="Your stay"
 *   selectionMode="range"
 *   monthsToShow={2}
 *   value={stay}
 *   onChange={setStay}
 * />
 */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  (props, ref) => {
    const {
      selectionMode = 'single',
      value: valueProp,
      defaultValue,
      onChange,
      granularity = 'day',
      month: monthProp,
      defaultMonth,
      onMonthChange,
      monthsToShow = 1,
      dayTemplate,
      getDayLabel,
      loading = false,
      readOnly = false,
      disabled: disabledProp,
      isFullwidth = false,
      min,
      max,
      shouldDisableDate,
      unselectableDates,
      locale: localeProp,
      firstDayOfWeek: firstDayOfWeekProp,
      dayNames,
      monthNames,
      nearbyMonthDays = true,
      color,
      size,
      labels,
      textColor,
      bgColor,
      className,
      ...props_
    } = props;
    const isRange = selectionMode === 'range';

    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props_,
    });

    // A LocaleProvider around it sets its default locale and, through that,
    // the day its week starts on, as it does for the pickers.
    const locale = usePickerLocale(localeProp);
    const localeScope = usePickerLocaleScope(localeProp, props_.dir);
    const firstDayOfWeek = usePickerFirstDayOfWeek(
      firstDayOfWeekProp,
      locale,
      hasOwnDayNames(dayNames)
    );
    const disabled = useFieldsetDisabled(disabledProp);

    warnMismatch(valueProp, isRange, 'value');
    warnMismatch(defaultValue, isRange, 'defaultValue');

    const [held, setHeld] = useControlled<Date | DateRangeValue | null>(
      valueProp,
      defaultValue ?? null
    );
    // The value in the shape the mode reads, where one that doesn't fit
    // shows nothing as picked.
    const single = !isRange && held instanceof Date ? held : null;
    const range =
      isRange && Array.isArray(held) ? (held as DateRangeValue) : EMPTY_RANGE;
    const valueStart = isRange ? (range[0] ?? range[1]) : single;

    // Nothing before year 1 is in range, as in HTML's date inputs.
    const lowerBound = useMemo(() => floorMin(min), [min]);

    const [month, setOwnMonth] = useControlled<Date>(
      monthProp,
      startOfMonth(
        defaultMonth ?? valueStart ?? clampDate(new Date(), lowerBound, max)
      )
    );

    // The day the keys move from: the value, else the month on show. The
    // grid keeps it on the months on show, so a value in another month reads
    // as the nearest day of them. The year list has no month on show, and
    // opens on the year of `month` before the value's. A new granularity
    // starts the grid over, so focus starts over too.
    const startingFocus = () =>
      clampDate(
        !isRange && granularity === 'year' ? month : (valueStart ?? month),
        lowerBound,
        max
      );
    const [focusedDate, setFocusedDate] = useState<Date>(startingFocus);
    const [focusGranularity, setFocusGranularity] = useState(granularity);
    if (focusGranularity !== granularity) {
      setFocusGranularity(granularity);
      setFocusedDate(startingFocus());
    }
    // Bounds that change after mount pull the focused day back inside them.
    useEffect(() => {
      setFocusedDate(prev => clampDate(prev, lowerBound, max));
    }, [lowerBound, max]);

    const handleMonthChange = useCallback(
      (next: Date) => {
        setOwnMonth(next);
        onMonthChange?.(next);
      },
      [setOwnMonth, onMonthChange]
    );

    // A pick is the day at midnight, as a click on its cell gives. Enter
    // hands over the focused day, which can carry a time of day.
    const handleSelect = useCallback(
      (picked: Date) => {
        const day = startOfDay(picked);
        setHeld(day);
        (onChange as CalendarSingleProps['onChange'])?.(day);
      },
      [setHeld, onChange]
    );

    const handleRangeSelect = useCallback(
      (start: Date, end: Date) => {
        const next: DateRangeValue = [start, end];
        setHeld(next);
        (onChange as CalendarRangeProps['onChange'])?.(next);
      },
      [setHeld, onChange]
    );

    const rootClass = usePrefixedClassNames('calendar', {
      'is-fullwidth': isFullwidth,
    });
    const gridId = `calendar-${useId()}`;

    // Named, the root is a group, as `DateRangeInput inline`'s is: by your
    // `aria-label` or `aria-labelledby`, else by a labeled Field around it.
    const { ariaLabelledBy } = useAutoLabelledBy({
      label: undefined,
      rendersLabel: false,
      callerProps: rest,
    });
    const named =
      !!ariaLabelledBy ||
      rest['aria-label'] !== undefined ||
      rest['aria-labelledby'] !== undefined;

    const shared = {
      id: gridId,
      focusedDate,
      onFocusedDateChange: setFocusedDate,
      month,
      monthsToShow,
      onMonthChange: handleMonthChange,
      min,
      max,
      shouldDisableDate,
      unselectableDates,
      firstDayOfWeek,
      locale,
      dayNames,
      monthNames,
      nearbyMonthDays,
      color,
      size,
      labels,
      disabled,
      readOnly,
      fullDateNames: true,
      getDayLabel,
      dayContent: dayTemplate,
      busy: loading,
    };

    return (
      <div
        role={named ? 'group' : undefined}
        aria-labelledby={ariaLabelledBy}
        {...localeScope.rootAttrs}
        {...rest}
        ref={ref}
        className={classNames(rootClass, bulmaHelperClasses, className)}
      >
        {isRange ? (
          <CalendarGrid
            {...shared}
            range={range}
            onRangeSelect={handleRangeSelect}
          />
        ) : (
          <CalendarGrid
            // A new granularity starts the grid over on its own view.
            key={granularity}
            {...shared}
            granularity={granularity}
            value={single}
            onSelect={handleSelect}
          />
        )}
      </div>
    );
  }
);

Calendar.displayName = 'Calendar';

export default Calendar;
