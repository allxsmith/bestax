import {
  buildSegmentMap,
  incrementSegmentValue,
  setSegmentValue,
  setAmPm,
  segmentIndexAtCaret,
} from '../_pickerInternals/segmentMap';

describe('buildSegmentMap', () => {
  it('parses HH:mm into hours/literal/minutes', () => {
    const map = buildSegmentMap('HH:mm');
    expect(map).not.toBeNull();
    expect(map!.segments).toEqual([
      { kind: 'hours', token: 'HH', start: 0, end: 2, hourFormat: '24' },
      { kind: 'literal', token: ':', start: 2, end: 3 },
      { kind: 'minutes', token: 'mm', start: 3, end: 5 },
    ]);
    expect(map!.editable).toEqual([0, 2]);
  });

  it('parses hh:mm A into hours/literal/minutes/literal/ampm', () => {
    const map = buildSegmentMap('hh:mm A');
    expect(map).not.toBeNull();
    expect(map!.segments.map(s => s.kind)).toEqual([
      'hours',
      'literal',
      'minutes',
      'literal',
      'ampm',
    ]);
    const hoursSeg = map!.segments[0];
    expect(hoursSeg.hourFormat).toBe('12');
    expect(hoursSeg.start).toBe(0);
    expect(hoursSeg.end).toBe(2);
    const ampmSeg = map!.segments[4];
    expect(ampmSeg.start).toBe(6);
    expect(ampmSeg.end).toBe(8);
    expect(map!.editable).toEqual([0, 2, 4]);
  });

  it('parses HH:mm:ss with three editable segments', () => {
    const map = buildSegmentMap('HH:mm:ss');
    expect(map).not.toBeNull();
    expect(map!.editable.length).toBe(3);
    expect(map!.segments[map!.editable[2]].kind).toBe('seconds');
  });

  it('parses hh:mm:ss A with four editable segments', () => {
    const map = buildSegmentMap('hh:mm:ss A');
    expect(map).not.toBeNull();
    expect(map!.editable.length).toBe(4);
    expect(map!.segments[map!.editable[3]].kind).toBe('ampm');
  });

  it('returns null for variable-width tokens', () => {
    expect(buildSegmentMap('H:m')).toBeNull();
    expect(buildSegmentMap('HH:m')).toBeNull();
    expect(buildSegmentMap('h:mm A')).toBeNull();
    expect(buildSegmentMap('HH:mm:s')).toBeNull();
  });

  it('returns null when the format contains no editable tokens', () => {
    // No token characters at all — just punctuation.
    expect(buildSegmentMap('---')).toBeNull();
  });

  it('parses YYYY-MM-DD into year/month/day with a 4-wide year', () => {
    const map = buildSegmentMap('YYYY-MM-DD');
    expect(map).not.toBeNull();
    expect(map!.segments).toEqual([
      { kind: 'year', token: 'YYYY', start: 0, end: 4 },
      { kind: 'literal', token: '-', start: 4, end: 5 },
      { kind: 'month', token: 'MM', start: 5, end: 7 },
      { kind: 'literal', token: '-', start: 7, end: 8 },
      { kind: 'day', token: 'DD', start: 8, end: 10 },
    ]);
    expect(map!.editable).toEqual([0, 2, 4]);
  });

  it('gives YYYY width 4 and YY width 2', () => {
    expect(buildSegmentMap('YYYY')!.segments[0].end).toBe(4);
    expect(buildSegmentMap('YY')!.segments[0].end).toBe(2);
  });

  it('parses DD/MM/YYYY day-first with slash literals', () => {
    const map = buildSegmentMap('DD/MM/YYYY');
    expect(map).not.toBeNull();
    expect(map!.segments.map(s => s.kind)).toEqual([
      'day',
      'literal',
      'month',
      'literal',
      'year',
    ]);
    expect(map!.segments[1].token).toBe('/');
    expect(map!.segments[0]).toMatchObject({ start: 0, end: 2 });
    expect(map!.segments[4]).toMatchObject({ start: 6, end: 10 });
  });

  it('parses combined YYYY-MM-DD HH:mm into a 5-editable map', () => {
    const map = buildSegmentMap('YYYY-MM-DD HH:mm');
    expect(map).not.toBeNull();
    expect(map!.segments.map(s => s.kind)).toEqual([
      'year',
      'literal',
      'month',
      'literal',
      'day',
      'literal',
      'hours',
      'literal',
      'minutes',
    ]);
    expect(map!.editable.length).toBe(5);
    // The literal between day and hours is the space.
    expect(map!.segments[5].token).toBe(' ');
    expect(map!.segments[6]).toMatchObject({
      kind: 'hours',
      start: 11,
      end: 13,
      hourFormat: '24',
    });
  });

  it('parses combined YYYY-MM-DD hh:mm A with a trailing meridiem', () => {
    const map = buildSegmentMap('YYYY-MM-DD hh:mm A');
    expect(map).not.toBeNull();
    expect(map!.editable.length).toBe(6);
    expect(map!.segments[map!.editable[5]].kind).toBe('ampm');
  });

  it('returns null for variable / odd-width date tokens', () => {
    expect(buildSegmentMap('YYYY-M-DD')).toBeNull();
    expect(buildSegmentMap('D/MM/YYYY')).toBeNull();
    expect(buildSegmentMap('YYY-MM-DD')).toBeNull();
    expect(buildSegmentMap('Y-MM-DD')).toBeNull();
    // One bad token poisons the whole map.
    expect(buildSegmentMap('YYYY-MM-D HH:mm')).toBeNull();
  });
});

describe('incrementSegmentValue', () => {
  const at = (h: number, m: number, s = 0) => {
    const d = new Date(2026, 0, 1);
    d.setHours(h, m, s, 0);
    return d;
  };

  it('increments 24h hours with wrap at 23 → 0', () => {
    const map = buildSegmentMap('HH:mm')!;
    const hoursSeg = map.segments[0];
    const next = incrementSegmentValue(hoursSeg, at(23, 0), 1, true);
    expect(next.getHours()).toBe(0);
  });

  it('decrements 24h hours with wrap at 0 → 23', () => {
    const map = buildSegmentMap('HH:mm')!;
    const next = incrementSegmentValue(map.segments[0], at(0, 0), -1, false);
    expect(next.getHours()).toBe(23);
  });

  it('increments 12h hours within 1..12 and preserves PM', () => {
    const map = buildSegmentMap('hh:mm A')!;
    const hoursSeg = map.segments[0];
    // 13 = 1 PM; +1 → 2 PM → 14
    const next = incrementSegmentValue(hoursSeg, at(13, 0), 1, true);
    expect(next.getHours()).toBe(14);
    // 23 = 11 PM; +1 → 12 PM → 12
    const next2 = incrementSegmentValue(hoursSeg, at(23, 0), 1, true);
    expect(next2.getHours()).toBe(12);
  });

  it('wraps 12h hours from 12 PM back to 1 PM', () => {
    const map = buildSegmentMap('hh:mm A')!;
    const next = incrementSegmentValue(map.segments[0], at(12, 0), 1, true);
    expect(next.getHours()).toBe(13);
  });

  it('wraps minutes 59 → 0', () => {
    const map = buildSegmentMap('HH:mm')!;
    const next = incrementSegmentValue(map.segments[2], at(10, 59), 1, false);
    expect(next.getMinutes()).toBe(0);
  });

  it('wraps seconds 0 → 59 going backward', () => {
    const map = buildSegmentMap('HH:mm:ss')!;
    const next = incrementSegmentValue(
      map.segments[4],
      at(10, 30, 0),
      -1,
      false
    );
    expect(next.getSeconds()).toBe(59);
  });

  it('toggles AM ↔ PM', () => {
    const map = buildSegmentMap('hh:mm A')!;
    const next = incrementSegmentValue(map.segments[4], at(9, 0), 1, false);
    expect(next.getHours()).toBe(21);
    const next2 = incrementSegmentValue(map.segments[4], at(21, 0), 1, true);
    expect(next2.getHours()).toBe(9);
  });

  it('returns the date unchanged for a literal segment', () => {
    const map = buildSegmentMap('HH:mm')!;
    const literal = map.segments[1]; // ':'
    const start = at(10, 30);
    const next = incrementSegmentValue(literal, start, 1, false);
    expect(next.getHours()).toBe(10);
    expect(next.getMinutes()).toBe(30);
  });
});

describe('incrementSegmentValue (date segments)', () => {
  const dmy = (y: number, mo: number, day: number) =>
    new Date(y, mo, day, 12, 0, 0, 0);
  const map = buildSegmentMap('YYYY-MM-DD')!;
  const yearSeg = map.segments[0];
  const monthSeg = map.segments[2];
  const daySeg = map.segments[4];

  it('increments / decrements the year', () => {
    expect(
      incrementSegmentValue(yearSeg, dmy(2024, 5, 7), 1, false).getFullYear()
    ).toBe(2025);
    expect(
      incrementSegmentValue(yearSeg, dmy(2024, 5, 7), -1, false).getFullYear()
    ).toBe(2023);
  });

  it('wraps the month Dec → Jan in place without rolling the year', () => {
    const next = incrementSegmentValue(monthSeg, dmy(2024, 11, 15), 1, false);
    expect(next.getMonth()).toBe(0);
    expect(next.getFullYear()).toBe(2024);
  });

  it('wraps the month Jan → Dec in place', () => {
    const next = incrementSegmentValue(monthSeg, dmy(2024, 0, 15), -1, false);
    expect(next.getMonth()).toBe(11);
    expect(next.getFullYear()).toBe(2024);
  });

  it('clamps the day when a month change shortens the month (leap Feb)', () => {
    const next = incrementSegmentValue(monthSeg, dmy(2024, 0, 31), 1, false);
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(29);
  });

  it('clamps Jan 31 → Feb 28 in a non-leap year', () => {
    const next = incrementSegmentValue(monthSeg, dmy(2023, 0, 31), 1, false);
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(28);
  });

  it('wraps the day within the current month length', () => {
    // April has 30 days.
    const next = incrementSegmentValue(daySeg, dmy(2024, 3, 30), 1, false);
    expect(next.getDate()).toBe(1);
    expect(next.getMonth()).toBe(3);
  });

  it('increments Feb 28 → 29 in a leap year', () => {
    const next = incrementSegmentValue(daySeg, dmy(2024, 1, 28), 1, false);
    expect(next.getDate()).toBe(29);
  });

  it('clamps Feb 29 → Feb 28 when the year increment lands on a non-leap year', () => {
    const next = incrementSegmentValue(yearSeg, dmy(2024, 1, 29), 1, false);
    expect(next.getFullYear()).toBe(2025);
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(28);
  });
});

describe('setSegmentValue', () => {
  const at = (h: number, m: number, s = 0) => {
    const d = new Date(2026, 0, 1);
    d.setHours(h, m, s, 0);
    return d;
  };

  it('writes a single 24h-hour digit and waits for a second when range allows', () => {
    const map = buildSegmentMap('HH:mm')!;
    const r = setSegmentValue(map.segments[0], at(0, 0), '1', false);
    expect(r.date.getHours()).toBe(1);
    expect(r.advance).toBe(false);
  });

  it('auto-advances a 24h-hour digit ≥3 since no 2-digit completion is valid', () => {
    const map = buildSegmentMap('HH:mm')!;
    const r = setSegmentValue(map.segments[0], at(0, 0), '5', false);
    expect(r.date.getHours()).toBe(5);
    expect(r.advance).toBe(true);
  });

  it('accepts a 2-digit 24h hour (clamped) and advances', () => {
    const map = buildSegmentMap('HH:mm')!;
    const r = setSegmentValue(map.segments[0], at(0, 0), '23', false);
    expect(r.date.getHours()).toBe(23);
    expect(r.advance).toBe(true);
  });

  it('holds 12h hour at 0 (no commit) until a second digit arrives', () => {
    const map = buildSegmentMap('hh:mm A')!;
    const start = at(9, 0);
    const r = setSegmentValue(map.segments[0], start, '0', false);
    expect(r.date.getHours()).toBe(9); // unchanged
    expect(r.advance).toBe(false);
    // After "05" → hour 5 (AM, since isPm=false)
    const r2 = setSegmentValue(map.segments[0], start, '05', false);
    expect(r2.date.getHours()).toBe(5);
    expect(r2.advance).toBe(true);
  });

  it('auto-advances a 12h-hour digit ≥2 with no valid completion', () => {
    const map = buildSegmentMap('hh:mm A')!;
    const r = setSegmentValue(map.segments[0], at(0, 0), '7', false);
    expect(r.date.getHours()).toBe(7);
    expect(r.advance).toBe(true);
  });

  it('preserves PM when writing a 12h hour', () => {
    const map = buildSegmentMap('hh:mm A')!;
    // 13:00 (1 PM). User types "3" → 3 PM = 15:00.
    const r = setSegmentValue(map.segments[0], at(13, 0), '3', true);
    expect(r.date.getHours()).toBe(15);
  });

  it('auto-advances minutes after digit ≥6', () => {
    const map = buildSegmentMap('HH:mm')!;
    const r = setSegmentValue(map.segments[2], at(10, 0), '7', false);
    expect(r.date.getMinutes()).toBe(7);
    expect(r.advance).toBe(true);
  });

  it('waits for a second minute digit after 0..5', () => {
    const map = buildSegmentMap('HH:mm')!;
    const r = setSegmentValue(map.segments[2], at(10, 0), '4', false);
    expect(r.date.getMinutes()).toBe(4);
    expect(r.advance).toBe(false);
  });

  it('auto-advances seconds after digit >= 6, waits after 0..5', () => {
    const map = buildSegmentMap('HH:mm:ss')!;
    const secSeg = map.segments[4];
    const fast = setSegmentValue(secSeg, at(10, 0, 0), '7', false);
    expect(fast.date.getSeconds()).toBe(7);
    expect(fast.advance).toBe(true);
    const slow = setSegmentValue(secSeg, at(10, 0, 0), '3', false);
    expect(slow.date.getSeconds()).toBe(3);
    expect(slow.advance).toBe(false);
  });

  it('returns the date unchanged for a literal segment', () => {
    const map = buildSegmentMap('HH:mm')!;
    const r = setSegmentValue(map.segments[1], at(10, 30), '5', false);
    expect(r.date.getHours()).toBe(10);
    expect(r.date.getMinutes()).toBe(30);
    expect(r.advance).toBe(false);
  });
});

describe('setSegmentValue (date segments)', () => {
  const base = (y: number, mo: number, day: number) =>
    new Date(y, mo, day, 0, 0, 0, 0);
  const map = buildSegmentMap('YYYY-MM-DD')!;
  const yearSeg = map.segments[0];
  const monthSeg = map.segments[2];
  const daySeg = map.segments[4];

  it('writes a single month digit 1 and waits (10/11/12 valid)', () => {
    const r = setSegmentValue(monthSeg, base(2024, 5, 7), '1', false);
    expect(r.date.getMonth()).toBe(0);
    expect(r.advance).toBe(false);
  });

  it('auto-advances the month after a digit >= 2', () => {
    const r = setSegmentValue(monthSeg, base(2024, 5, 7), '2', false);
    expect(r.date.getMonth()).toBe(1);
    expect(r.advance).toBe(true);
  });

  it('clamps a 2-digit month to December and advances', () => {
    const r = setSegmentValue(monthSeg, base(2024, 5, 7), '13', false);
    expect(r.date.getMonth()).toBe(11);
    expect(r.advance).toBe(true);
  });

  it('holds the month at 0 until a second digit, then commits 03 → March', () => {
    const start = base(2024, 5, 7);
    const r = setSegmentValue(monthSeg, start, '0', false);
    expect(r.date.getMonth()).toBe(5); // unchanged
    expect(r.advance).toBe(false);
    const r2 = setSegmentValue(monthSeg, start, '03', false);
    expect(r2.date.getMonth()).toBe(2);
    expect(r2.advance).toBe(true);
  });

  it('clamps the day when a month write shortens the month', () => {
    // Jan 31 → type month 2 → Feb, day clamps to 29 (leap 2024).
    const r = setSegmentValue(monthSeg, base(2024, 0, 31), '2', false);
    expect(r.date.getMonth()).toBe(1);
    expect(r.date.getDate()).toBe(29);
  });

  it('writes a single day digit 1..3 and waits', () => {
    const r = setSegmentValue(daySeg, base(2024, 5, 7), '2', false);
    expect(r.date.getDate()).toBe(2);
    expect(r.advance).toBe(false);
  });

  it('auto-advances the day after a digit >= 4', () => {
    const r = setSegmentValue(daySeg, base(2024, 5, 7), '4', false);
    expect(r.date.getDate()).toBe(4);
    expect(r.advance).toBe(true);
  });

  it('clamps a 2-digit day to the month length', () => {
    // April has 30 days; typing 31 clamps to 30.
    const r = setSegmentValue(daySeg, base(2024, 3, 15), '31', false);
    expect(r.date.getDate()).toBe(30);
    expect(r.advance).toBe(true);
  });

  it('holds the day at 0 until a second digit', () => {
    const r = setSegmentValue(daySeg, base(2024, 5, 7), '0', false);
    expect(r.date.getDate()).toBe(7); // unchanged
    expect(r.advance).toBe(false);
  });

  it('buffers four digits for a YYYY year and advances only on the fourth', () => {
    const start = base(2024, 5, 7);
    expect(setSegmentValue(yearSeg, start, '2', false).advance).toBe(false);
    expect(setSegmentValue(yearSeg, start, '20', false).advance).toBe(false);
    expect(setSegmentValue(yearSeg, start, '202', false).advance).toBe(false);
    const r = setSegmentValue(yearSeg, start, '2026', false);
    expect(r.date.getFullYear()).toBe(2026);
    expect(r.advance).toBe(true);
  });

  it('maps a YY year into the 2000s and advances on the second digit', () => {
    const yyMap = buildSegmentMap('YY-MM-DD')!;
    const r = setSegmentValue(yyMap.segments[0], base(2024, 5, 7), '24', false);
    expect(r.date.getFullYear()).toBe(2024);
    expect(r.advance).toBe(true);
  });

  it('re-clamps the day when a year write crosses a leap boundary', () => {
    // Feb 29 2024 → type year 2023 → Feb 28.
    const r = setSegmentValue(yearSeg, base(2024, 1, 29), '2023', false);
    expect(r.date.getFullYear()).toBe(2023);
    expect(r.date.getMonth()).toBe(1);
    expect(r.date.getDate()).toBe(28);
  });
});

describe('setAmPm', () => {
  it('converts AM hour to PM', () => {
    const d = new Date(2026, 0, 1);
    d.setHours(9, 0, 0, 0);
    expect(setAmPm(d, true).getHours()).toBe(21);
  });

  it('converts PM hour to AM', () => {
    const d = new Date(2026, 0, 1);
    d.setHours(15, 0, 0, 0);
    expect(setAmPm(d, false).getHours()).toBe(3);
  });

  it('leaves AM/PM unchanged when already correct', () => {
    const d = new Date(2026, 0, 1);
    d.setHours(9, 0, 0, 0);
    expect(setAmPm(d, false).getHours()).toBe(9);
  });
});

describe('segmentIndexAtCaret', () => {
  it('returns the segment containing the caret position', () => {
    const map = buildSegmentMap('HH:mm')!;
    expect(segmentIndexAtCaret(map, 0)).toBe(0); // hours
    expect(segmentIndexAtCaret(map, 2)).toBe(0); // hours end (inclusive)
    expect(segmentIndexAtCaret(map, 3)).toBe(2); // minutes start
    expect(segmentIndexAtCaret(map, 5)).toBe(2); // minutes end
  });

  it('returns the nearest editable segment when caret is on a literal-only spot', () => {
    const map = buildSegmentMap('hh:mm A')!;
    // Caret at position 5 (the space between mm and A) — closer to minutes (end 5)
    // than to ampm (start 6). Both are equidistant by start/end; either is fine.
    const idx = segmentIndexAtCaret(map, 5);
    expect([2, 4]).toContain(idx);
  });

  it('falls back to the nearest segment when the caret sits in a multi-char literal gap', () => {
    const map = buildSegmentMap('HH::mm')!; // two-char "::" literal
    // Caret 3 is inside the "::" gap — not within any editable [start,end].
    expect([0, 2]).toContain(segmentIndexAtCaret(map, 3));
  });

  it('maps caret positions across a combined YYYY-MM-DD HH:mm format', () => {
    const map = buildSegmentMap('YYYY-MM-DD HH:mm')!;
    // editable indices: 0 year, 2 month, 4 day, 6 hours, 8 minutes
    expect(segmentIndexAtCaret(map, 0)).toBe(0); // year start
    expect(segmentIndexAtCaret(map, 4)).toBe(0); // year end (inclusive)
    expect(segmentIndexAtCaret(map, 5)).toBe(2); // month start
    expect(segmentIndexAtCaret(map, 8)).toBe(4); // day start
    expect(segmentIndexAtCaret(map, 11)).toBe(6); // hours start
    expect(segmentIndexAtCaret(map, 14)).toBe(8); // minutes start
  });
});
