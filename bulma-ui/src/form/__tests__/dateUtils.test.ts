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
  startOfPeriod,
  endOfPeriod,
  isDayUnselectable,
  isPeriodUnselectable,
  makeDate,
  floorMin,
  canCloseRange,
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

    it('keeps years below 100 rather than reading them as 19xx', () => {
      const early = new Date(2024, 1, 20, 13, 45, 30);
      early.setFullYear(19);
      expect(startOfDay(early)).toEqual(makeDate(19, 1, 20));
      expect(startOfMonth(early)).toEqual(makeDate(19, 1, 1));
      const parts = (d: Date) => [
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds(),
        d.getMilliseconds(),
      ];
      expect(parts(endOfDay(early))).toEqual([19, 1, 20, 23, 59, 59, 999]);
      expect(parts(endOfMonth(early))).toEqual([19, 1, 28, 23, 59, 59, 999]);
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

    it('addMonths clamps to the month length of a year below 100', () => {
      // Year 0 is a leap year and 1900 is not, so reading it as 1900 would
      // clamp to the 28th.
      const r = addMonths(makeDate(0, 0, 31), 1);
      expect([r.getFullYear(), r.getMonth(), r.getDate()]).toEqual([0, 1, 29]);
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

    it('lets min win when min is after max', () => {
      // Nothing is in range then, and landing on min keeps a picker's focus
      // off the years before 1 under a max before then.
      const min = makeDate(1, 0, 1);
      const max = makeDate(0, 11, 31);
      expect(clampDate(new Date(2024, 0, 15), min, max)).toEqual(min);
      expect(clampDate(makeDate(-5, 0, 1), min, max)).toEqual(min);
    });
  });

  describe('floorMin', () => {
    const yearOne = makeDate(1, 0, 1);

    it('starts at midnight on 1 January of year 1 without a min', () => {
      expect(floorMin()).toEqual(yearOne);
    });

    it('keeps a min in year 1 or later as the same object', () => {
      const firstDay = makeDate(1, 0, 1);
      const later = makeDate(1, 5, 15);
      expect(floorMin(firstDay)).toBe(firstDay);
      expect(floorMin(later)).toBe(later);
    });

    it('raises a min in year 0 or a negative year to year 1', () => {
      expect(floorMin(makeDate(0, 11, 31))).toEqual(yearOne);
      expect(floorMin(makeDate(-5, 5, 15))).toEqual(yearOne);
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

  describe('periods', () => {
    const d = new Date(2024, 5, 15, 13, 30);

    it.each([
      ['day', new Date(2024, 5, 15), new Date(2024, 5, 15, 23, 59, 59, 999)],
      ['month', new Date(2024, 5, 1), new Date(2024, 5, 30, 23, 59, 59, 999)],
      ['year', new Date(2024, 0, 1), new Date(2024, 11, 31, 23, 59, 59, 999)],
    ] as const)('startOfPeriod / endOfPeriod for a %s', (g, start, end) => {
      expect(startOfPeriod(d, g)).toEqual(start);
      expect(endOfPeriod(d, g)).toEqual(end);
    });

    it("ends a month on its own last day from the month's last day", () => {
      // From 31 January, a naive month step would overflow into March.
      expect(endOfPeriod(new Date(2024, 0, 31), 'month')).toEqual(
        new Date(2024, 0, 31, 23, 59, 59, 999)
      );
    });

    it('keeps years below 100 rather than reading them as 19xx', () => {
      const early = new Date(2024, 5, 15);
      early.setFullYear(19);
      expect(startOfPeriod(early, 'year').getFullYear()).toBe(19);
      expect(startOfPeriod(early, 'month').getFullYear()).toBe(19);
      expect(endOfPeriod(early, 'year').getFullYear()).toBe(19);
    });
  });

  describe('makeDate', () => {
    it('builds local midnight, defaulting to the first of January', () => {
      expect(makeDate(2024, 5, 15)).toEqual(new Date(2024, 5, 15));
      expect(makeDate(2024, 5)).toEqual(new Date(2024, 5, 1));
      expect(makeDate(2024)).toEqual(new Date(2024, 0, 1));
    });

    it('keeps years below 100 as given', () => {
      const d = makeDate(19, 2, 4);
      expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([19, 2, 4]);
      expect([d.getHours(), d.getMinutes()]).toEqual([0, 0]);
    });
  });

  describe('isDayUnselectable', () => {
    const day = new Date(2024, 5, 15);

    it('is false with no constraints', () => {
      expect(isDayUnselectable(day, {})).toBe(false);
    });

    it('rules out a day outside min/max', () => {
      expect(isDayUnselectable(day, { min: new Date(2024, 5, 16) })).toBe(true);
      expect(isDayUnselectable(day, { max: new Date(2024, 5, 14) })).toBe(true);
    });

    it('rules out a day the predicate or the list blocks', () => {
      expect(isDayUnselectable(day, { shouldDisableDate: () => true })).toBe(
        true
      );
      expect(
        isDayUnselectable(day, { unselectableDates: [new Date(2024, 5, 15)] })
      ).toBe(true);
      expect(
        isDayUnselectable(day, { unselectableDates: [new Date(2024, 5, 16)] })
      ).toBe(false);
    });
  });

  describe('isPeriodUnselectable', () => {
    const june = new Date(2024, 5, 20);

    it('keeps a month that has one selectable day', () => {
      // Only 30 June survives the predicate.
      expect(
        isPeriodUnselectable(june, 'month', {
          shouldDisableDate: x => x.getDate() !== 30,
        })
      ).toBe(false);
    });

    it('rules out a month whose every day is blocked', () => {
      expect(
        isPeriodUnselectable(june, 'month', { shouldDisableDate: () => true })
      ).toBe(true);
    });

    it('keeps a month that min or max cuts partway through', () => {
      expect(
        isPeriodUnselectable(june, 'month', { min: new Date(2024, 5, 29) })
      ).toBe(false);
      expect(
        isPeriodUnselectable(june, 'month', { max: new Date(2024, 5, 2) })
      ).toBe(false);
    });

    it('counts the day min falls on, whatever its time', () => {
      // On the day grid a min of 3pm rules out its own day; a month picker
      // given `min={new Date()}` on the 30th must still offer this month.
      expect(
        isPeriodUnselectable(june, 'month', {
          min: new Date(2024, 5, 30, 15, 0),
        })
      ).toBe(false);
    });

    it('reads a min or max in a year below 100 as given', () => {
      const early = makeDate(19, 5, 20);
      // A min partway through June 19 leaves the month selectable.
      expect(
        isPeriodUnselectable(early, 'month', { min: makeDate(19, 5, 10) })
      ).toBe(false);
      // A max at the end of June 19 rules out July 19.
      expect(
        isPeriodUnselectable(makeDate(19, 6, 1), 'month', {
          max: makeDate(19, 5, 30),
        })
      ).toBe(true);
    });

    it('rules out a period wholly before min or after max without a walk', () => {
      const shouldDisableDate = jest.fn(() => false);
      expect(
        isPeriodUnselectable(june, 'month', {
          min: new Date(2024, 6, 1),
          shouldDisableDate,
        })
      ).toBe(true);
      expect(
        isPeriodUnselectable(june, 'year', {
          max: new Date(2023, 11, 31),
          shouldDisableDate,
        })
      ).toBe(true);
      expect(shouldDisableDate).not.toHaveBeenCalled();
    });

    it('stops at the first selectable day', () => {
      const shouldDisableDate = jest.fn(() => false);
      isPeriodUnselectable(june, 'year', { shouldDisableDate });
      expect(shouldDisableDate).toHaveBeenCalledTimes(1);
    });

    it('rules out a year whose every day is listed as unselectable', () => {
      const leap = Array.from(
        { length: 366 },
        (_, i) => new Date(2024, 0, 1 + i)
      );
      expect(
        isPeriodUnselectable(june, 'year', { unselectableDates: leap })
      ).toBe(true);
      expect(
        isPeriodUnselectable(june, 'year', {
          unselectableDates: leap.slice(1),
        })
      ).toBe(false);
    });
  });

  describe('canCloseRange', () => {
    const june = (day: number, hours = 0) => new Date(2024, 5, day, hours);
    const weekends = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

    it('closes on the start day or after it, by day', () => {
      expect(canCloseRange(june(10), june(10), {})).toBe(true);
      expect(canCloseRange(june(10, 15), june(10, 9), {})).toBe(true);
      expect(canCloseRange(june(10), june(20), {})).toBe(true);
      expect(canCloseRange(june(10), june(9, 23), {})).toBe(false);
    });

    it('will not reach over a day the predicate or the list disables', () => {
      // Friday 14 June to Monday 17 June crosses a weekend.
      const c = { shouldDisableDate: weekends };
      expect(canCloseRange(june(14), june(17), c)).toBe(false);
      expect(canCloseRange(june(10), june(14), c)).toBe(true);
      const listed = { unselectableDates: [june(12, 8)] };
      expect(canCloseRange(june(10), june(14), listed)).toBe(false);
      expect(canCloseRange(june(12), june(14), listed)).toBe(true);
    });

    it('reaches over them when disabled days are allowed', () => {
      const c = { shouldDisableDate: weekends };
      expect(canCloseRange(june(14), june(17), c, true)).toBe(true);
      expect(canCloseRange(june(14), june(13), c, true)).toBe(false);
    });

    it('leaves the bounds to the caller', () => {
      const c = { min: june(12), max: june(12), unselectableDates: [] };
      expect(canCloseRange(june(10), june(14), c)).toBe(true);
    });
  });
});
