// INTERNAL: deliberately not exported from src/index.ts.
//
// The arithmetic behind Splitter. Every size is a percentage of the length
// the panes share, which is the splitter's length less its handles, and a
// layout always adds up to 100.

/** What one pane may be: its limits in percent, and whether it can shut. */
export interface PaneBounds {
  min: number;
  max: number;
  collapsible: boolean;
}

/** A limit as written: a percentage, or a CSS length in px, rem or %. */
export type SplitterLimit = number | string;

// Rounding leaves sizes a hair off, so anything this close counts as equal.
const EPS = 1e-6;

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

/**
 * A limit in percent of `length` pixels. A number or a `%` is already one. A
 * `px` or `rem` length needs the length the panes share, and without it
 * there's no answer yet, so it's `null`. Anything else is `null` too.
 */
export function limitToPercent(
  limit: SplitterLimit | undefined,
  length: number | null,
  remPx: number
): number | null {
  if (limit === undefined) return null;
  if (typeof limit === 'number') return limit;
  const match = /^\s*(\d*\.?\d+)\s*(px|rem|%)?\s*$/.exec(limit);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2] ?? '%';
  if (unit === '%') return value;
  if (!length) return null;
  return ((unit === 'rem' ? value * remPx : value) / length) * 100;
}

/**
 * The sizes panes start at: each its `defaultSize`, and the ones without
 * one sharing what's left equally. When they all have one, or those that do
 * take more than 100, the given ones are scaled to fit.
 */
export function defaultSizes(defaults: (number | undefined)[]): number[] {
  const given = defaults.reduce<number>((sum, d) => sum + (d ?? 0), 0);
  const free = defaults.filter(d => d === undefined).length;
  if (free === 0 || given > 100) {
    const scale = given > 0 ? 100 / given : 0;
    return defaults.map(d =>
      d === undefined ? 0 : scale ? d * scale : 100 / defaults.length
    );
  }
  const share = (100 - given) / free;
  return defaults.map(d => (d === undefined ? share : d));
}

/** The range a pane can take in a layout: zero when it's shut. */
const rangeOf = (bound: PaneBounds, size: number) =>
  bound.collapsible && size <= EPS
    ? { low: 0, high: 0 }
    : { low: bound.min, high: bound.max };

/**
 * Moves each pane into its limits, taking what it needs from the nearest
 * panes with room to give, or giving what it has too much of to the nearest
 * with room to take. A shut pane stays shut. Limits that can't all hold are
 * met as far as they can be.
 */
export function fitSizes(sizes: number[], bounds: PaneBounds[]): number[] {
  const next = [...sizes];
  const n = next.length;
  // Nearest first, so a change stays as local as it can.
  const byDistance = (i: number) =>
    next
      .map((_, j) => j)
      .filter(j => j !== i)
      .sort((x, y) => Math.abs(x - i) - Math.abs(y - i) || x - y);
  for (let pass = 0; pass < n * 2; pass++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      const { low, high } = rangeOf(bounds[i], next[i]);
      if (next[i] < low - EPS) {
        let need = low - next[i];
        for (const j of byDistance(i)) {
          const give = Math.min(
            need,
            Math.max(0, next[j] - rangeOf(bounds[j], next[j]).low)
          );
          next[j] -= give;
          next[i] += give;
          need -= give;
          if (give > EPS) moved = true;
          if (need <= EPS) break;
        }
      } else if (next[i] > high + EPS) {
        let spare = next[i] - high;
        for (const j of byDistance(i)) {
          const take = Math.min(
            spare,
            Math.max(0, rangeOf(bounds[j], next[j]).high - next[j])
          );
          next[j] += take;
          next[i] -= take;
          spare -= take;
          if (take > EPS) moved = true;
          if (spare <= EPS) break;
        }
      }
    }
    if (!moved) break;
  }
  return next;
}

/** Whether two layouts are the same, to within rounding. */
export const sameSizes = (a: number[], b: number[]) =>
  a.length === b.length && a.every((size, i) => Math.abs(size - b[i]) <= EPS);

/**
 * The pane a handle speaks for: the one before it, unless only the one after
 * it can shut, so that Enter shuts the pane you'd expect.
 */
export const primaryOf = (handle: number, bounds: PaneBounds[]) =>
  !bounds[handle].collapsible && bounds[handle + 1].collapsible
    ? handle + 1
    : handle;

/**
 * How far the pane before handle `a`'s line can go, between the two panes
 * beside it: `low` to `high` while both stay open, and `shut` and `full`
 * when one of them can close.
 */
export function pairRange(sizes: number[], a: number, bounds: PaneBounds[]) {
  const b = a + 1;
  const total = sizes[a] + sizes[b];
  const low = Math.max(bounds[a].min, total - bounds[b].max);
  const high = Math.min(bounds[a].max, total - bounds[b].min);
  return {
    total,
    low,
    high,
    // The pane before can shut if it may and the one after can take it all.
    shut: bounds[a].collapsible && total <= bounds[b].max + EPS,
    // The pane after can shut likewise.
    full: bounds[b].collapsible && total <= bounds[a].max + EPS,
  };
}

/**
 * The layout with the line of handle `a` moved so the pane before it is
 * `target`, within both panes' limits. A collapsible pane dragged below half
 * its minimum shuts, and one that's shut opens at its minimum once dragged
 * past that point.
 */
export function resizePair(
  sizes: number[],
  a: number,
  target: number,
  bounds: PaneBounds[]
): number[] {
  const b = a + 1;
  const { total, low, high, shut, full } = pairRange(sizes, a, bounds);
  let size: number;
  if (shut && target < bounds[a].min / 2) size = 0;
  else if (full && total - target < bounds[b].min / 2) size = total;
  else if (low > high + EPS) size = sizes[a];
  else size = clamp(target, low, high);
  const next = [...sizes];
  next[a] = size;
  next[b] = total - size;
  return next;
}

/**
 * The aria value range of a handle's primary pane: zero at the bottom when
 * it can shut, everything the pair holds at the top when the other pane can.
 */
export function primaryRange(
  sizes: number[],
  a: number,
  primary: number,
  bounds: PaneBounds[]
) {
  const { total, low, high, shut, full } = pairRange(sizes, a, bounds);
  const minA = shut ? 0 : low;
  const maxA = full ? total : high;
  return primary === a
    ? { now: sizes[a], min: minA, max: maxA }
    : { now: sizes[a + 1], min: total - maxA, max: total - minA };
}
