// INTERNAL, deliberately not exported from src/index.ts: what a Stat and its
// parts read from around them.

import { createContext } from 'react';
import type { validColors } from '../helpers/useBulmaClasses';

export interface StatScope {
  /**
   * Whether this is inside a `Stats` row, where a Stat is a `<div>` in the
   * row's `<dl>` rather than a `<dl>` of its own. A Stat sets it back to
   * `false` for its parts, so a Stat inside one of them, which sits in a
   * `<dd>`, renders its own `<dl>`.
   */
  row: boolean;
  /** The row's `textColor`, which each Stat in it takes unless it has its own. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** The Stat's `locale`, which a `Stat.Change` in it takes unless it has its own. */
  locale?: string;
}

export const StatScopeContext = createContext<StatScope>({ row: false });
