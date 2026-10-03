export type PickerPosition =
  'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'auto';

export type HourFormat = '12' | '24';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** The unit a date picker selects: a day, a month or a year. */
export type DateGranularity = 'day' | 'month' | 'year';

/**
 * Translatable strings used across all four pickers. Pass via the `labels`
 * prop to override defaults; consumers manage their own locale-driven mapping.
 */
export interface PickerLabels {
  // Calendar
  prevMonth?: string;
  nextMonth?: string;
  /** Month grid header: steps back a year. */
  prevYear?: string;
  /** Month grid header: steps forward a year. */
  nextYear?: string;
  chooseDate?: string;
  /** Launcher and popover name when the picker selects a month. */
  chooseMonth?: string;
  /** Launcher, popover and year list name when the picker selects a year. */
  chooseYear?: string;
  // Time spinner
  hours?: string;
  minutes?: string;
  seconds?: string;
  ampm?: string;
  increaseHours?: string;
  decreaseHours?: string;
  increaseMinutes?: string;
  decreaseMinutes?: string;
  increaseSeconds?: string;
  decreaseSeconds?: string;
  toggleAmPm?: string;
  chooseTime?: string;
  chooseDateTime?: string;
  // Footer buttons
  now?: string;
  today?: string;
  clear?: string;
  cancel?: string;
  ok?: string;
  /** Mobile footer: text link that reverts to the value at open (like iOS). */
  reset?: string;
  /** Mobile footer: aria-label for the circular checkmark commit button. */
  done?: string;
  /** DateTimeInput footer: label preceding the selected-time display. */
  time?: string;
}

export const DEFAULT_PICKER_LABELS: Required<PickerLabels> = {
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  prevYear: 'Previous year',
  nextYear: 'Next year',
  chooseDate: 'Choose date',
  chooseMonth: 'Choose month',
  chooseYear: 'Choose year',
  hours: 'hours',
  minutes: 'minutes',
  seconds: 'seconds',
  ampm: 'ampm',
  increaseHours: 'Increase hours',
  decreaseHours: 'Decrease hours',
  increaseMinutes: 'Increase minutes',
  decreaseMinutes: 'Decrease minutes',
  increaseSeconds: 'Increase seconds',
  decreaseSeconds: 'Decrease seconds',
  toggleAmPm: 'Toggle AM/PM',
  chooseTime: 'Choose time',
  chooseDateTime: 'Choose date and time',
  now: 'Now',
  today: 'Today',
  clear: 'Clear',
  cancel: 'Cancel',
  ok: 'OK',
  reset: 'Reset',
  done: 'Done',
  time: 'Time',
};

/** Merge user-supplied label overrides with the defaults. */
export const mergeLabels = (
  overrides?: PickerLabels
): Required<PickerLabels> => ({
  ...DEFAULT_PICKER_LABELS,
  ...(overrides ?? {}),
});
