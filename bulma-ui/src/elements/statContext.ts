// INTERNAL, deliberately not exported from src/index.ts: what a Stat and its
// parts read from around them.

import { createContext } from 'react';
import type { validColors } from '../helpers/useBulmaClasses';

export interface StatScope {
  /**
   * Whether this is inside a `Stats` row, where a Stat is a `<div>` in the
   * row's `<dl>` rather than a `<dl>` of its own. A Stat sets it back to
   * `false` for its children. Those are meant to be its parts, so a Stat
   * inside a part sits in a `<dd>`, where a `<dl>` of its own is valid. A
   * Stat written straight among another's children isn't handled: it renders
   * a `<dl>` inside the other's list, which HTML doesn't allow, and Stat's
   * `children` TSDoc says not to.
   */
  row: boolean;
  /** The row's `textColor`, which each Stat in it takes unless it has its own. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** The Stat's `locale`, which a `Stat.Change` in it takes unless it has its own. */
  locale?: string;
}

export const StatScopeContext = createContext<StatScope>({ row: false });
