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
