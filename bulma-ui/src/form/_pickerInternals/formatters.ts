import { numberFormatFor } from '../../helpers/localeFormat';
import { FIRST_YEAR, makeDate } from './dateUtils';
import type { DateGranularity } from './pickerTypes';

export type DateFormatOption = Intl.DateTimeFormatOptions | string;

export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';
export const DEFAULT_MONTH_FORMAT = 'YYYY-MM';
export const DEFAULT_YEAR_FORMAT = 'YYYY';
export const DEFAULT_TIME_FORMAT_24 = 'HH:mm';
export const DEFAULT_TIME_FORMAT_12 = 'hh:mm A';
export const DEFAULT_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';

const pad = (n: number, width = 2): string => String(n).padStart(width, '0');

const TOKEN_RE = /YYYY|YY|MM|M|DD|D|HH|H|hh|h|mm|m|ss|s|A|a/g;

function formatToken(d: Date, token: string): string {
  switch (token) {
    case 'YYYY':
      // Zero-pad to a fixed 4 chars so the rendered width matches the
      // segment-map width during digit-by-digit keyboard entry (and to match
      // ISO 8601), so year 19 shows as `0019`. Years >9999 keep their natural
      // width. The pickers commit no year below 1, so a minus sign reaches
      // this only from a `value` passed in.
      return pad(d.getFullYear(), 4);
    case 'YY':
      return pad(d.getFullYear() % 100);
    case 'MM':
      return pad(d.getMonth() + 1);
    case 'M':
      return String(d.getMonth() + 1);
    case 'DD':
      return pad(d.getDate());
    case 'D':
      return String(d.getDate());
    case 'HH':
      return pad(d.getHours());
    case 'H':
      return String(d.getHours());
    case 'hh': {
      const h12 = d.getHours() % 12 || 12;
      return pad(h12);
    }
    case 'h': {
      const h12 = d.getHours() % 12 || 12;
      return String(h12);
    }
    case 'mm':
      return pad(d.getMinutes());
    case 'm':
      return String(d.getMinutes());
    case 'ss':
      return pad(d.getSeconds());
    case 's':
      return String(d.getSeconds());
    case 'A':
      return d.getHours() < 12 ? 'AM' : 'PM';
    case 'a':
      return d.getHours() < 12 ? 'am' : 'pm';
    default:
      return token;
  }
}

function formatTokenString(d: Date, fmt: string): string {
  return fmt.replace(TOKEN_RE, t => formatToken(d, t));
}

function formatWithIntl(
  d: Date,
  options: Intl.DateTimeFormatOptions,
  locale?: string
): string {
  return new Intl.DateTimeFormat(locale, options).format(d);
}

export function formatDate(
  d: Date,
  fmt: DateFormatOption | undefined,
  locale?: string
): string {
  const f = fmt ?? DEFAULT_DATE_FORMAT;
  if (typeof f === 'string') return formatTokenString(d, f);
  return formatWithIntl(d, f, locale);
}

export function formatTime(
  d: Date,
  fmt: DateFormatOption | undefined,
  locale?: string
): string {
  const f = fmt ?? DEFAULT_TIME_FORMAT_24;
  if (typeof f === 'string') return formatTokenString(d, f);
  return formatWithIntl(d, f, locale);
}

export function formatDateTime(
  d: Date,
  fmt: DateFormatOption | undefined,
  locale?: string
): string {
  const f = fmt ?? DEFAULT_DATETIME_FORMAT;
  if (typeof f === 'string') return formatTokenString(d, f);
  return formatWithIntl(d, f, locale);
}

/**
 * The value as a native input and a hidden form input carry it:
 * `YYYY-MM-DD`, `YYYY-MM` or `YYYY`, the shapes `<input type="date">` and
 * `<input type="month">` use. The year is padded to four digits, as those
 * inputs require and as the `YYYY` token displays it. HTML has no such shape
 * for a year before 1, so a date then is empty, as those inputs would make it.
 */
export function toIsoValue(d: Date, granularity: DateGranularity): string {
  if (d.getFullYear() < FIRST_YEAR) return '';
  const year = pad(d.getFullYear(), 4);
  if (granularity === 'year') return year;
  const month = `${year}-${pad(d.getMonth() + 1)}`;
  return granularity === 'month' ? month : `${month}-${pad(d.getDate())}`;
}

/**
 * Read a native `type="date"` or `type="month"` value back into a Date. HTML
 * allows a year of four or more digits, as `toIsoValue` writes one past 9999.
 */
export function fromIsoValue(
  s: string,
  granularity: DateGranularity
): Date | null {
  if (granularity === 'month') {
    const m = /^(\d{4,})-(\d{2})$/.exec(s);
    return m ? makeDate(Number(m[1]), Number(m[2]) - 1) : null;
  }
  const m = /^(\d{4,})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return makeDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * Derive the hour cycle (`'12'` or `'24'`) a display format will render, from
 * its first hour token: `h`/`hh` → 12-hour with meridiem, `H`/`HH` → 24-hour.
 *
 * Returns `null` when the cycle can't be read from the format — it's an
 * `Intl.DateTimeFormat` options object (no token string), `undefined`, or has
 * no hour token — so callers fall back to the raw `hourFormat` prop. Scans with
 * the same {@link TOKEN_RE} grammar the input renders with, so the derived cycle
 * always agrees with what the field actually displays.
 */
export function hourCycleFromFormat(
  fmt: DateFormatOption | undefined
): '12' | '24' | null {
  if (typeof fmt !== 'string') return null;
  for (const [token] of fmt.matchAll(TOKEN_RE)) {
    if (token === 'H' || token === 'HH') return '24';
    if (token === 'h' || token === 'hh') return '12';
  }
  return null;
}

/**
 * Parse a date string against a token format. Returns null on mismatch.
 * For Intl-options formats parsing is the consumer's responsibility — pass
 * a custom `parse` prop on the picker.
 */
export function parseDate(
  s: string,
  fmt?: string,
  // locale arg accepted for symmetry; locale-aware parsing is not supported.
  _locale?: string
): Date | null {
  if (!s) return null;
  const format = fmt ?? DEFAULT_DATE_FORMAT;
  const parts = parseTokens(s, format);
  if (!parts) return null;
  const year = parts.year ?? new Date().getFullYear();
  const month = (parts.month ?? 1) - 1;
  const day = parts.day ?? 1;
  const hours = parts.hours ?? 0;
  const minutes = parts.minutes ?? 0;
  const seconds = parts.seconds ?? 0;
  const d = makeDate(year, month, day);
  d.setHours(hours, minutes, seconds, 0);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

export function parseTime(s: string, fmt?: string): Date | null {
  if (!s) return null;
  const format = fmt ?? DEFAULT_TIME_FORMAT_24;
  const parts = parseTokens(s, format);
  if (!parts) return null;
  const today = new Date();
  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    parts.hours ?? 0,
    parts.minutes ?? 0,
    parts.seconds ?? 0,
    0
  );
}

interface ParsedParts {
  year?: number;
  month?: number;
  day?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  meridiem?: 'am' | 'pm';
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseTokens(input: string, fmt: string): ParsedParts | null {
  const tokenOrder: string[] = [];
  let regex = '';
  let i = 0;
  while (i < fmt.length) {
    const four = fmt.slice(i, i + 4);
    const two = fmt.slice(i, i + 2);
    const one = fmt[i];
    let token: string | null = null;
    if (four === 'YYYY') token = 'YYYY';
    else if (
      two === 'YY' ||
      two === 'MM' ||
      two === 'DD' ||
      two === 'HH' ||
      two === 'hh' ||
      two === 'mm' ||
      two === 'ss'
    )
      token = two;
    else if (
      one === 'M' ||
      one === 'D' ||
      one === 'H' ||
      one === 'h' ||
      one === 'm' ||
      one === 's' ||
      one === 'A' ||
      one === 'a'
    )
      token = one;

    if (token) {
      tokenOrder.push(token);
      switch (token) {
        case 'YYYY':
          regex += '(\\d{4})';
          break;
        case 'YY':
          regex += '(\\d{2})';
          break;
        case 'MM':
        case 'DD':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
          regex += '(\\d{1,2})';
          break;
        case 'M':
        case 'D':
        case 'H':
        case 'h':
        case 'm':
        case 's':
          regex += '(\\d{1,2})';
          break;
        case 'A':
          regex += '(AM|PM)';
          break;
        case 'a':
          regex += '(am|pm)';
          break;
      }
      i += token.length;
    } else {
      regex += escapeRegExp(one);
      i += 1;
    }
  }
  const m = new RegExp('^' + regex + '$').exec(input);
  if (!m) return null;
  const out: ParsedParts = {};
  tokenOrder.forEach((token, idx) => {
    const v = m[idx + 1];
    switch (token) {
      case 'YYYY':
        out.year = Number(v);
        break;
      case 'YY':
        out.year = 2000 + Number(v);
        break;
      case 'MM':
      case 'M':
        out.month = Number(v);
        break;
      case 'DD':
      case 'D':
        out.day = Number(v);
        break;
      case 'HH':
      case 'H':
        out.hours = Number(v);
        break;
      case 'hh':
      case 'h':
        out.hours = Number(v);
        break;
      case 'mm':
      case 'm':
        out.minutes = Number(v);
        break;
      case 'ss':
      case 's':
        out.seconds = Number(v);
        break;
      case 'A':
        out.meridiem = v.toLowerCase() === 'am' ? 'am' : 'pm';
        break;
      case 'a':
        out.meridiem = v === 'am' ? 'am' : 'pm';
        break;
    }
  });
  if (out.meridiem !== undefined && out.hours !== undefined) {
    if (out.meridiem === 'pm' && out.hours < 12) out.hours += 12;
    if (out.meridiem === 'am' && out.hours === 12) out.hours = 0;
  }
  return out;
}

/** A day or a year has no grouping: 2026, not 2,026. */
const DATE_NUMBER: Intl.NumberFormatOptions = { useGrouping: false };

/**
 * Writes a number of a date or a time, a day of the month, a year or an
 * hour, in the digits `locale` writes numbers in, which are the ones it
 * writes a date in, such as ١٣ in Egyptian Arabic, with no grouping and none
 * of the words some locales put around a date's numbers, as Japanese writes
 * 13日. It pads to `minimumDigits` with the locale's zero, as a time's ٠٩.
 * A `-u-nu-` extension in the tag picks the digits. With no locale it writes
 * plain digits, as the pickers always have, rather than the runtime's, which
 * a server and a browser can disagree on.
 */
export function getDateNumberFormat(
  locale: string | undefined,
  minimumDigits = 1
): (n: number) => string {
  const plain = (n: number) => String(n).padStart(minimumDigits, '0');
  if (!locale) return plain;
  try {
    const format = numberFormatFor(
      locale,
      minimumDigits > 1
        ? { ...DATE_NUMBER, minimumIntegerDigits: minimumDigits }
        : DATE_NUMBER
    );
    return n => format.format(n);
  } catch {
    // A tag Intl refuses. The numbers stay plain rather than throw, as they
    // did before they followed the locale: a time wheel, and a calendar given
    // every name of its own, ask Intl for nothing else.
    return plain;
  }
}

/** What a 12-hour time is marked with when no locale says otherwise. */
const PLAIN_DAY_PERIODS: [string, string] = ['AM', 'PM'];

/**
 * The words `locale` marks a 12-hour time with in the morning and in the
 * afternoon, as `Intl` writes them: ص and م in Egyptian Arabic, 午前 and 午後
 * in Japanese. With no locale they're AM and PM, as the time wheels always
 * wrote them, rather than the runtime's words, which a server and a browser
 * can disagree on. So are they for a tag `Intl` refuses, and in place of a
 * word the locale's 12-hour time doesn't write.
 */
export function getDayPeriodNames(
  locale: string | undefined
): [string, string] {
  if (!locale) return PLAIN_DAY_PERIODS;
  try {
    const format = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      hour12: true,
    });
    const period = (hour: number, plain: string) =>
      format
        .formatToParts(new Date(2021, 0, 1, hour))
        .find(part => part.type === 'dayPeriod')?.value ?? plain;
    // Mid-morning and mid-afternoon, so a locale that names smaller parts
    // of the day still gives its morning and afternoon words.
    return [period(10, 'AM'), period(15, 'PM')];
  } catch {
    // A tag Intl refuses: the wheel keeps AM and PM rather than throw.
    return PLAIN_DAY_PERIODS;
  }
}

/**
 * Locale-aware day name labels in calendar order (Sunday → Saturday).
 * Caller rotates by `firstDayOfWeek`.
 */
export function getDayNames(
  locale: string | undefined,
  length: 'narrow' | 'short' | 'long' = 'short'
): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: length });
  // 2021-01-03 was a Sunday; use it as the anchor.
  const sunday = new Date(2021, 0, 3);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    out.push(fmt.format(d));
  }
  return out;
}

/**
 * Locale-aware month names, January to December, from the Gregorian calendar
 * the pickers' grid uses, whatever calendar the locale uses by default.
 */
export function getMonthNames(
  locale: string | undefined,
  length: 'short' | 'long' = 'long'
): string[] {
  const fmt = new Intl.DateTimeFormat(locale, {
    calendar: 'gregory',
    month: length,
  });
  const out: string[] = [];
  for (let i = 0; i < 12; i++) {
    out.push(fmt.format(new Date(2021, i, 1)));
  }
  return out;
}
