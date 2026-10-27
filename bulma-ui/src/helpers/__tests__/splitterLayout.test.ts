import {
  defaultSizes,
  fitSizes,
  limitToPercent,
  pairRange,
  PaneBounds,
  primaryOf,
  primaryRange,
  resizePair,
  sameSizes,
} from '../splitterLayout';

const open = (min = 0, max = 100): PaneBounds => ({
  min,
  max,
  collapsible: false,
});
const shuttable = (min = 0, max = 100): PaneBounds => ({
  min,
  max,
  collapsible: true,
});

describe('limitToPercent', () => {
  it('has no answer for no limit, or one it cannot read', () => {
    expect(limitToPercent(undefined, 800, 16)).toBeNull();
    expect(limitToPercent('wide', 800, 16)).toBeNull();
    expect(limitToPercent('10vw', 800, 16)).toBeNull();
  });

  it('takes a number, a bare string and a % as percentages already', () => {
    expect(limitToPercent(25, null, 16)).toBe(25);
    expect(limitToPercent('25', null, 16)).toBe(25);
    expect(limitToPercent(' 12.5% ', null, 16)).toBe(12.5);
  });

  it('turns px and rem into a percentage of the length, once there is one', () => {
    expect(limitToPercent('200px', 800, 16)).toBe(25);
    expect(limitToPercent('2rem', 320, 16)).toBe(10);
    expect(limitToPercent('200px', null, 16)).toBeNull();
    expect(limitToPercent('2rem', 0, 16)).toBeNull();
  });
});

describe('defaultSizes', () => {
  it('shares what the given sizes leave among the panes without one', () => {
    expect(defaultSizes([25, undefined])).toEqual([25, 75]);
    expect(defaultSizes([20, undefined, undefined])).toEqual([20, 40, 40]);
    expect(defaultSizes([undefined, undefined])).toEqual([50, 50]);
    expect(defaultSizes([])).toEqual([]);
  });

  it('scales the given sizes to 100 when every pane has one', () => {
    expect(defaultSizes([30, 30])).toEqual([50, 50]);
    expect(defaultSizes([60, 60])).toEqual([50, 50]);
  });

  it('scales them down, leaving the others nothing, when they take more than 100', () => {
    const sizes = defaultSizes([80, 120, undefined]);
    expect(sizes[0]).toBeCloseTo(40);
    expect(sizes[1]).toBeCloseTo(60);
    expect(sizes[2]).toBe(0);
  });

  it('shares equally when every given size is zero', () => {
    expect(defaultSizes([0, 0])).toEqual([50, 50]);
  });
});

describe('fitSizes', () => {
  it('takes what a pane under its minimum needs from the nearest pane with room', () => {
    expect(fitSizes([10, 50, 40], [open(20), open(), open()])).toEqual([
      20, 40, 40,
    ]);
  });

  it('gives what a pane over its maximum has spare to the nearest pane with room', () => {
    // Both neighbours are as near; the one before comes first.
    expect(fitSizes([20, 70, 10], [open(), open(0, 50), open(0, 30)])).toEqual([
      40, 50, 10,
    ]);
  });

  it('reaches past a neighbour with no room to give', () => {
    expect(fitSizes([10, 20, 70], [open(30), open(20), open()])).toEqual([
      30, 20, 50,
    ]);
  });

  it('reaches past a neighbour with no room to take', () => {
    expect(fitSizes([70, 20, 10], [open(0, 50), open(0, 20), open()])).toEqual([
      50, 20, 30,
    ]);
  });

  it('leaves a shut pane shut', () => {
    expect(fitSizes([0, 100], [shuttable(20), open()])).toEqual([0, 100]);
  });

  it('meets limits that cannot all hold as far as they can', () => {
    expect(fitSizes([50, 50], [open(60), open(60)])).toEqual([50, 50]);
  });

  it('leaves a layout that fits alone', () => {
    const sizes = [25, 75];
    expect(fitSizes(sizes, [open(), open()])).toEqual(sizes);
  });
});

describe('sameSizes', () => {
  it('compares to within rounding', () => {
    expect(sameSizes([25, 75], [25 + 1e-9, 75])).toBe(true);
    expect(sameSizes([25, 75], [26, 74])).toBe(false);
    expect(sameSizes([25, 75], [25, 75, 0])).toBe(false);
  });
});

describe('primaryOf', () => {
  it('is the pane before, unless only the pane after can shut', () => {
    expect(primaryOf(0, [open(), open()])).toBe(0);
    expect(primaryOf(0, [open(), shuttable()])).toBe(1);
    expect(primaryOf(0, [shuttable(), shuttable()])).toBe(0);
    expect(primaryOf(0, [shuttable(), open()])).toBe(0);
  });
});

describe('pairRange', () => {
  it('bounds the pane before by both panes’ limits', () => {
    expect(pairRange([30, 70], 0, [open(10, 60), open(20)])).toEqual({
      total: 100,
      low: 10,
      high: 60,
      shut: false,
      full: false,
    });
    expect(pairRange([30, 70], 0, [open(), open(0, 80)]).low).toBe(20);
  });

  it('lets a pane shut only when the other can take its room', () => {
    expect(pairRange([30, 70], 0, [shuttable(), open()]).shut).toBe(true);
    expect(pairRange([30, 70], 0, [shuttable(), open(0, 80)]).shut).toBe(false);
    expect(pairRange([30, 70], 0, [open(), shuttable()]).full).toBe(true);
    expect(pairRange([30, 70], 0, [open(0, 50), shuttable()]).full).toBe(false);
  });
});

describe('resizePair', () => {
  it('moves the line within both panes’ limits', () => {
    expect(resizePair([30, 70], 0, 45, [open(), open()])).toEqual([45, 55]);
    expect(resizePair([30, 70], 0, 5, [open(10), open()])).toEqual([10, 90]);
    expect(resizePair([30, 70], 0, 95, [open(), open(20)])).toEqual([80, 20]);
  });

  it('moves only the two panes beside the handle', () => {
    expect(resizePair([20, 30, 50], 1, 40, [open(), open(), open()])).toEqual([
      20, 40, 40,
    ]);
  });

  it('shuts a collapsible pane dragged below half its minimum, either side', () => {
    expect(resizePair([30, 70], 0, 9, [shuttable(20), open()])).toEqual([
      0, 100,
    ]);
    expect(resizePair([30, 70], 0, 11, [shuttable(20), open()])).toEqual([
      20, 80,
    ]);
    expect(resizePair([70, 30], 0, 92, [open(), shuttable(20)])).toEqual([
      100, 0,
    ]);
  });

  it('opens a shut pane at its minimum once dragged past half of it', () => {
    expect(resizePair([0, 100], 0, 5, [shuttable(20), open()])).toEqual([
      0, 100,
    ]);
    expect(resizePair([0, 100], 0, 12, [shuttable(20), open()])).toEqual([
      20, 80,
    ]);
  });

  it('leaves the line where it is when the limits leave it nowhere to go', () => {
    expect(resizePair([50, 50], 0, 40, [open(60), open(60)])).toEqual([50, 50]);
  });
});

describe('primaryRange', () => {
  it('gives the pane before’s value and range', () => {
    expect(primaryRange([30, 70], 0, 0, [open(10, 60), open()])).toEqual({
      now: 30,
      min: 10,
      max: 60,
    });
  });

  it('gives the pane after’s, mirrored, with zero at the bottom when it can shut', () => {
    expect(primaryRange([70, 30], 0, 1, [open(20), shuttable(10)])).toEqual({
      now: 30,
      min: 0,
      max: 80,
    });
  });

  it('runs from zero to everything the pair holds when both can shut', () => {
    expect(primaryRange([40, 60], 0, 0, [shuttable(), shuttable()])).toEqual({
      now: 40,
      min: 0,
      max: 100,
    });
  });
});
