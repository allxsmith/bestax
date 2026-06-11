import {
  formatDate,
  formatTime,
  formatDateTime,
  hourCycleFromFormat,
  parseDate,
  parseTime,
  getDayNames,
  getMonthNames,
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT_24,
  DEFAULT_TIME_FORMAT_12,
} from '../_pickerInternals/formatters';

describe('formatters', () => {
  describe('formatDate (token format)', () => {
    const d = new Date(2024, 5, 7); // June 7, 2024

    it('formats default ISO-like format', () => {
      expect(formatDate(d, DEFAULT_DATE_FORMAT)).toBe('2024-06-07');
    });

    it('honors single-digit tokens', () => {
      expect(formatDate(d, 'D/M/YYYY')).toBe('7/6/2024');
    });

    it('two-digit year', () => {
      expect(formatDate(new Date(2024, 0, 1), 'YY-MM-DD')).toBe('24-01-01');
    });

    it('uses default when format is undefined', () => {
      expect(formatDate(d, undefined)).toBe('2024-06-07');
    });
  });

  describe('formatTime (token format)', () => {
    it('formats 24h', () => {
      const d = new Date(2024, 0, 1, 13, 5, 0);
      expect(formatTime(d, DEFAULT_TIME_FORMAT_24)).toBe('13:05');
    });

    it('formats 12h with AM/PM', () => {
      const am = new Date(2024, 0, 1, 9, 5, 0);
      const pm = new Date(2024, 0, 1, 21, 5, 0);
      const noon = new Date(2024, 0, 1, 12, 0, 0);
      const midnight = new Date(2024, 0, 1, 0, 0, 0);
      expect(formatTime(am, DEFAULT_TIME_FORMAT_12)).toBe('09:05 AM');
      expect(formatTime(pm, DEFAULT_TIME_FORMAT_12)).toBe('09:05 PM');
      expect(formatTime(noon, DEFAULT_TIME_FORMAT_12)).toBe('12:00 PM');
      expect(formatTime(midnight, DEFAULT_TIME_FORMAT_12)).toBe('12:00 AM');
    });

    it('handles seconds and lowercase a', () => {
      expect(formatTime(new Date(2024, 0, 1, 13, 5, 9), 'H:m:s a')).toBe(
        '13:5:9 pm'
      );
    });

    it('formats zero-padded seconds with ss', () => {
      expect(formatTime(new Date(2024, 0, 1, 13, 5, 9), 'HH:mm:ss')).toBe(
        '13:05:09'
      );
    });

    it('renders lowercase am for morning hours', () => {
      expect(formatTime(new Date(2024, 0, 1, 9, 5, 0), 'h:m a')).toBe('9:5 am');
    });

    it('renders single-digit h as 12 at noon and midnight', () => {
      expect(formatTime(new Date(2024, 0, 1, 12, 0, 0), 'h:mm A')).toBe(
        '12:00 PM'
      );
      expect(formatTime(new Date(2024, 0, 1, 0, 0, 0), 'h:mm A')).toBe(
        '12:00 AM'
      );
    });

    it('uses the 24h default when format is undefined', () => {
      expect(formatTime(new Date(2024, 0, 1, 13, 5, 0), undefined)).toBe(
        '13:05'
      );
    });

    it('accepts Intl options for locale-aware time formatting', () => {
      const out = formatTime(
        new Date(2024, 0, 1, 13, 45, 0),
        { hour: '2-digit', minute: '2-digit', hour12: false },
        'en-US'
      );
      expect(out).toMatch(/13/);
      expect(out).toMatch(/45/);
    });
  });

  describe('formatDateTime', () => {
    it('combines date and time tokens', () => {
      const d = new Date(2024, 5, 7, 13, 45);
      expect(formatDateTime(d, 'YYYY-MM-DD HH:mm')).toBe('2024-06-07 13:45');
    });

    it('accepts Intl options for locale-aware formatting', () => {
      const d = new Date(2024, 5, 7, 13, 45);
      const out = formatDate(
        d,
        { year: 'numeric', month: 'long', day: 'numeric' },
        'en-US'
      );
      expect(out).toMatch(/June/);
      expect(out).toMatch(/7/);
      expect(out).toMatch(/2024/);
    });

    it('uses the datetime default when format is undefined', () => {
      const d = new Date(2024, 5, 7, 13, 45);
      expect(formatDateTime(d, undefined)).toBe('2024-06-07 13:45');
    });

    it('accepts Intl options for locale-aware datetime formatting', () => {
      const d = new Date(2024, 5, 7, 13, 45);
      const out = formatDateTime(
        d,
        { dateStyle: 'medium', timeStyle: 'short' },
        'en-US'
      );
      expect(out).toMatch(/2024/);
      expect(out).toMatch(/45/);
    });
  });

  describe('parseDate', () => {
    it('parses default format', () => {
      const d = parseDate('2024-06-07');
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2024);
      expect(d!.getMonth()).toBe(5);
      expect(d!.getDate()).toBe(7);
    });

    it('parses custom token format', () => {
      const d = parseDate('07/06/2024', 'DD/MM/YYYY');
      expect(d!.getDate()).toBe(7);
      expect(d!.getMonth()).toBe(5);
    });

    it('returns null for malformed input', () => {
      expect(parseDate('not a date')).toBeNull();
      expect(parseDate('2024-13-01')).toBeNull(); // month out of range
      expect(parseDate('2024-02-30')).toBeNull(); // invalid Feb 30
    });

    it('accepts empty string as null', () => {
      expect(parseDate('')).toBeNull();
    });

    it('parses single-digit D and M tokens', () => {
      const d = parseDate('7/6/2024', 'D/M/YYYY');
      expect(d).not.toBeNull();
      expect(d!.getDate()).toBe(7);
      expect(d!.getMonth()).toBe(5);
      expect(d!.getFullYear()).toBe(2024);
    });

    it('maps a two-digit YY year into the 2000s', () => {
      const d = parseDate('24-06-07', 'YY-MM-DD');
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2024);
      expect(d!.getMonth()).toBe(5);
      expect(d!.getDate()).toBe(7);
    });

    it('defaults a missing year to the current year', () => {
      const d = parseDate('06/07', 'MM/DD');
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(new Date().getFullYear());
      expect(d!.getMonth()).toBe(5);
      expect(d!.getDate()).toBe(7);
    });

    it('defaults missing month and day to January 1st', () => {
      const d = parseDate('2024', 'YYYY');
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2024);
      expect(d!.getMonth()).toBe(0);
      expect(d!.getDate()).toBe(1);
    });

    it('parses combined datetime formats including seconds', () => {
      const d = parseDate('2024-06-07 13:45:30', 'YYYY-MM-DD HH:mm:ss');
      expect(d).not.toBeNull();
      expect(d!.getHours()).toBe(13);
      expect(d!.getMinutes()).toBe(45);
      expect(d!.getSeconds()).toBe(30);
    });
  });

  describe('parseTime', () => {
    it('parses 24h time', () => {
      const t = parseTime('13:45');
      expect(t!.getHours()).toBe(13);
      expect(t!.getMinutes()).toBe(45);
    });

    it('parses 12h time with PM', () => {
      const t = parseTime('09:05 PM', 'hh:mm A');
      expect(t!.getHours()).toBe(21);
      expect(t!.getMinutes()).toBe(5);
    });

    it('parses 12h midnight as 0', () => {
      const t = parseTime('12:00 AM', 'hh:mm A');
      expect(t!.getHours()).toBe(0);
    });

    it('returns null for unmatched format', () => {
      expect(parseTime('garbage')).toBeNull();
    });

    it('accepts empty string as null', () => {
      expect(parseTime('')).toBeNull();
    });

    it('parses seconds with the HH:mm:ss format', () => {
      const t = parseTime('13:45:30', 'HH:mm:ss');
      expect(t!.getSeconds()).toBe(30);
    });

    it('parses single-character time tokens', () => {
      const t = parseTime('1:2:3', 'H:m:s');
      expect(t!.getHours()).toBe(1);
      expect(t!.getMinutes()).toBe(2);
      expect(t!.getSeconds()).toBe(3);
    });

    it('defaults missing hours and minutes to zero', () => {
      const t = parseTime('42', 'ss');
      expect(t!.getHours()).toBe(0);
      expect(t!.getMinutes()).toBe(0);
      expect(t!.getSeconds()).toBe(42);
    });

    it('parses lowercase meridiem with the a token', () => {
      const pm = parseTime('9:05 pm', 'h:mm a');
      expect(pm!.getHours()).toBe(21);
      const am = parseTime('9:05 am', 'h:mm a');
      expect(am!.getHours()).toBe(9);
    });

    it('parses lowercase 12 am as midnight', () => {
      const t = parseTime('12:00 am', 'hh:mm a');
      expect(t!.getHours()).toBe(0);
    });
  });

  describe('getDayNames', () => {
    it('returns 7 day names in calendar order', () => {
      const en = getDayNames('en-US', 'short');
      expect(en.length).toBe(7);
      expect(en[0]).toMatch(/Sun/);
      expect(en[6]).toMatch(/Sat/);
    });

    it('returns localized names for ja-JP', () => {
      const ja = getDayNames('ja-JP', 'short');
      expect(ja.length).toBe(7);
      // Japanese short weekday is a single character.
      ja.forEach(name => expect(name.length).toBeGreaterThan(0));
    });

    it('defaults to the short length when length is omitted', () => {
      expect(getDayNames('en-US')).toEqual(getDayNames('en-US', 'short'));
    });
  });

  describe('getMonthNames', () => {
    it('returns 12 month names', () => {
      const months = getMonthNames('en-US', 'long');
      expect(months.length).toBe(12);
      expect(months[0]).toBe('January');
      expect(months[11]).toBe('December');
    });

    it('respects short length', () => {
      const months = getMonthNames('en-US', 'short');
      expect(months[0]).toBe('Jan');
    });

    it('defaults to the long length when length is omitted', () => {
      expect(getMonthNames('en-US')).toEqual(getMonthNames('en-US', 'long'));
    });
  });

  describe('hourCycleFromFormat', () => {
    it("returns '24' for formats with an H / HH token", () => {
      expect(hourCycleFromFormat('HH:mm')).toBe('24');
      expect(hourCycleFromFormat('HH:mm:ss')).toBe('24');
      expect(hourCycleFromFormat('YYYY-MM-DD HH:mm')).toBe('24');
      expect(hourCycleFromFormat('H:mm')).toBe('24');
    });

    it("returns '12' for formats with an h / hh token", () => {
      expect(hourCycleFromFormat('hh:mm A')).toBe('12');
      expect(hourCycleFromFormat('h:mm A')).toBe('12');
      expect(hourCycleFromFormat('YYYY-MM-DD hh:mm A')).toBe('12');
      expect(hourCycleFromFormat('hh:mm:ss A')).toBe('12');
    });

    it('keys off the first hour token encountered', () => {
      expect(hourCycleFromFormat('hh:mm A')).toBe('12');
      expect(hourCycleFromFormat('YYYY-MM-DD HH:mm:ss')).toBe('24');
    });

    it('returns null when the cycle cannot be derived from the format', () => {
      // No hour token at all.
      expect(hourCycleFromFormat('YYYY-MM-DD')).toBeNull();
      // Undefined.
      expect(hourCycleFromFormat(undefined)).toBeNull();
      // Intl options object — no token string to inspect.
      expect(
        hourCycleFromFormat({ hour: '2-digit', minute: '2-digit' })
      ).toBeNull();
      expect(hourCycleFromFormat({ timeStyle: 'short' })).toBeNull();
    });
  });
});
