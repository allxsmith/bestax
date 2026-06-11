import {
  isSameDay,
  isSameMonth,
  isBefore,
  isAfter,
  isWithin,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addDays,
  addMonths,
  addYears,
  addHours,
  addMinutes,
  addSeconds,
  setTimeOfDay,
  getTimeOfDay,
  clampDate,
  buildMonthGrid,
  snapTimeToIncrement,
} from '../_pickerInternals/dateUtils';

describe('dateUtils', () => {
  describe('comparisons', () => {
    it('isSameDay matches same calendar day regardless of time', () => {
      const a = new Date(2024, 5, 15, 0, 0, 0);
      const b = new Date(2024, 5, 15, 23, 59, 59);
      expect(isSameDay(a, b)).toBe(true);
    });

    it('isSameDay rejects different days', () => {
      expect(isSameDay(new Date(2024, 5, 15), new Date(2024, 5, 16))).toBe(
        false
      );
    });

    it('isSameMonth matches same year+month', () => {
      expect(isSameMonth(new Date(2024, 5, 1), new Date(2024, 5, 30))).toBe(
        true
      );
      expect(isSameMonth(new Date(2024, 5, 30), new Date(2024, 6, 1))).toBe(
        false
      );
    });

    it('isBefore / isAfter', () => {
      const earlier = new Date(2024, 0, 1);
      const later = new Date(2024, 0, 2);
      expect(isBefore(earlier, later)).toBe(true);
      expect(isAfter(later, earlier)).toBe(true);
      expect(isBefore(earlier, earlier)).toBe(false);
      expect(isAfter(earlier, earlier)).toBe(false);
    });

    it('isWithin honors min and max', () => {
      const min = new Date(2024, 0, 1);
      const max = new Date(2024, 0, 31);
      expect(isWithin(new Date(2024, 0, 15), min, max)).toBe(true);
      expect(isWithin(new Date(2023, 11, 31), min, max)).toBe(false);
      expect(isWithin(new Date(2024, 1, 1), min, max)).toBe(false);
      expect(isWithin(new Date(2024, 0, 15))).toBe(true);
    });
  });

  describe('boundaries', () => {
    it('startOfDay zeros the time', () => {
      const d = startOfDay(new Date(2024, 5, 15, 13, 45, 30));
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
      expect(d.getSeconds()).toBe(0);
      expect(d.getMilliseconds()).toBe(0);
    });

    it('endOfDay sets time to 23:59:59.999', () => {
      const d = endOfDay(new Date(2024, 5, 15, 1, 0, 0));
      expect(d.getHours()).toBe(23);
      expect(d.getMinutes()).toBe(59);
      expect(d.getSeconds()).toBe(59);
      expect(d.getMilliseconds()).toBe(999);
    });

    it('startOfMonth & endOfMonth', () => {
      const start = startOfMonth(new Date(2024, 1, 20));
      expect(start.getDate()).toBe(1);
      expect(start.getMonth()).toBe(1);
      const end = endOfMonth(new Date(2024, 1, 1));
      expect(end.getDate()).toBe(29); // leap year
      const end2 = endOfMonth(new Date(2023, 1, 1));
      expect(end2.getDate()).toBe(28);
    });
  });

  describe('arithmetic', () => {
    it('addDays positive and negative', () => {
      expect(addDays(new Date(2024, 0, 1), 5).getDate()).toBe(6);
      expect(addDays(new Date(2024, 0, 1), -1).getMonth()).toBe(11);
    });

    it('addMonths handles month-overflow', () => {
      const r = addMonths(new Date(2024, 0, 31), 1);
      expect(r.getMonth()).toBe(1);
      expect(r.getDate()).toBe(29); // Feb 2024 has 29 days
    });

    it('addMonths into a non-leap year clamps to Feb 28', () => {
      const r = addMonths(new Date(2023, 0, 31), 1);
      expect(r.getMonth()).toBe(1);
      expect(r.getDate()).toBe(28);
    });

    it('addYears wraps via addMonths', () => {
      const r = addYears(new Date(2024, 1, 29), 1);
      expect(r.getFullYear()).toBe(2025);
      expect(r.getMonth()).toBe(1);
      expect(r.getDate()).toBe(28);
    });

    it('addHours / addMinutes / addSeconds', () => {
      const base = new Date(2024, 0, 1, 0, 0, 0);
      expect(addHours(base, 1).getHours()).toBe(1);
      expect(addMinutes(base, 30).getMinutes()).toBe(30);
      expect(addSeconds(base, 45).getSeconds()).toBe(45);
    });
  });

  describe('time of day', () => {
    it('setTimeOfDay merges parts onto a date', () => {
      const d = setTimeOfDay(new Date(2024, 0, 1, 0, 0, 0), {
        hours: 13,
        minutes: 45,
        seconds: 30,
      });
      expect(d.getHours()).toBe(13);
      expect(d.getMinutes()).toBe(45);
      expect(d.getSeconds()).toBe(30);
    });

    it('setTimeOfDay leaves omitted parts unchanged', () => {
      const d = setTimeOfDay(new Date(2024, 0, 1, 5, 5, 5), { hours: 9 });
      expect(d.getHours()).toBe(9);
      expect(d.getMinutes()).toBe(5);
      expect(d.getSeconds()).toBe(5);
    });

    it('setTimeOfDay leaves hours unchanged when only minutes are given', () => {
      const d = setTimeOfDay(new Date(2024, 0, 1, 5, 5, 5), { minutes: 30 });
      expect(d.getHours()).toBe(5);
      expect(d.getMinutes()).toBe(30);
      expect(d.getSeconds()).toBe(5);
    });

    it('getTimeOfDay returns hours/minutes/seconds', () => {
      const t = getTimeOfDay(new Date(2024, 0, 1, 13, 45, 30));
      expect(t).toEqual({ hours: 13, minutes: 45, seconds: 30 });
    });
  });

  describe('clampDate', () => {
    it('clamps to min when before', () => {
      const min = new Date(2024, 0, 10);
      const c = clampDate(new Date(2024, 0, 1), min);
      expect(c.getTime()).toBe(min.getTime());
    });

    it('clamps to max when after', () => {
      const max = new Date(2024, 0, 5);
      const c = clampDate(new Date(2024, 0, 31), undefined, max);
      expect(c.getTime()).toBe(max.getTime());
    });

    it('returns a fresh copy in range', () => {
      const d = new Date(2024, 0, 15);
      const c = clampDate(d);
      expect(c).not.toBe(d);
      expect(c.getTime()).toBe(d.getTime());
    });
  });

  describe('buildMonthGrid', () => {
    it('returns 42 cells', () => {
      const grid = buildMonthGrid(new Date(2024, 5, 15), 0);
      expect(grid.length).toBe(42);
    });

    it('first cell is the start of the week containing the 1st', () => {
      // June 2024: Saturday is day 6; June 1 is a Saturday → week starts Sunday May 26.
      const grid = buildMonthGrid(new Date(2024, 5, 15), 0);
      expect(grid[0].date.getDay()).toBe(0);
      expect(grid[0].date.getMonth()).toBe(4); // May
      expect(grid[0].date.getDate()).toBe(26);
    });

    it('respects firstDayOfWeek=1 (Monday)', () => {
      const grid = buildMonthGrid(new Date(2024, 5, 15), 1);
      expect(grid[0].date.getDay()).toBe(1);
    });

    it('defaults firstDayOfWeek to Sunday when omitted', () => {
      const grid = buildMonthGrid(new Date(2024, 5, 15));
      expect(grid[0].date.getDay()).toBe(0);
      expect(grid[0].date.getMonth()).toBe(4); // May 26
      expect(grid[0].date.getDate()).toBe(26);
    });

    it('marks inCurrentMonth correctly', () => {
      const grid = buildMonthGrid(new Date(2024, 5, 15), 0);
      const inMonth = grid.filter(c => c.inCurrentMonth);
      expect(inMonth.length).toBe(30); // June has 30 days
    });

    it('marks today=true for the actual today cell', () => {
      const today = new Date();
      const grid = buildMonthGrid(today, 0);
      const todayCell = grid.find(c => c.isToday);
      expect(todayCell).toBeDefined();
      expect(isSameDay(todayCell!.date, today)).toBe(true);
    });
  });

  describe('snapTimeToIncrement', () => {
    it('rounds minutes to the nearest 15-minute slot', () => {
      const r = snapTimeToIncrement(new Date(2026, 0, 1, 13, 42, 0), {
        incrementMinutes: 15,
      });
      expect(r.getHours()).toBe(13);
      expect(r.getMinutes()).toBe(45);
    });

    it('rounds minutes down when below the midpoint', () => {
      const r = snapTimeToIncrement(new Date(2026, 0, 1, 13, 7, 0), {
        incrementMinutes: 15,
      });
      expect(r.getMinutes()).toBe(0);
    });

    it('rolls hour forward on minute overflow (13:58 → 14:00 with step=15)', () => {
      const r = snapTimeToIncrement(new Date(2026, 0, 1, 13, 58, 0), {
        incrementMinutes: 15,
      });
      expect(r.getHours()).toBe(14);
      expect(r.getMinutes()).toBe(0);
    });

    it('zeros seconds when enableSeconds is false', () => {
      const r = snapTimeToIncrement(new Date(2026, 0, 1, 13, 42, 37), {});
      expect(r.getSeconds()).toBe(0);
    });

    it('snaps seconds to nearest step when enableSeconds is true', () => {
      const r = snapTimeToIncrement(new Date(2026, 0, 1, 13, 42, 37), {
        enableSeconds: true,
        incrementSeconds: 15,
      });
      expect(r.getSeconds()).toBe(30);
    });

    it('rolls minute forward on second overflow (37+ with step=10 → minute+1)', () => {
      const r = snapTimeToIncrement(new Date(2026, 0, 1, 13, 0, 56), {
        enableSeconds: true,
        incrementSeconds: 10,
      });
      expect(r.getMinutes()).toBe(1);
      expect(r.getSeconds()).toBe(0);
    });

    it('rounds hours when incrementHours > 1', () => {
      const r = snapTimeToIncrement(new Date(2026, 0, 1, 13, 0, 0), {
        incrementHours: 6,
      });
      expect(r.getHours()).toBe(12);
    });

    it('returns a copy and leaves the input untouched', () => {
      const input = new Date(2026, 0, 1, 13, 42, 37);
      const r = snapTimeToIncrement(input, { incrementMinutes: 15 });
      expect(r).not.toBe(input);
      expect(input.getMinutes()).toBe(42);
    });

    it('defaults to step-1 grids with zeroed seconds when called without options', () => {
      const r = snapTimeToIncrement(new Date(2026, 0, 1, 13, 42, 37));
      expect(r.getHours()).toBe(13);
      expect(r.getMinutes()).toBe(42);
      expect(r.getSeconds()).toBe(0);
    });
  });
});
