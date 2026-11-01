// INTERNAL: deliberately not exported from src/index.ts.
import type React from 'react';

/**
 * Whether a prop was given something to render: anything but `undefined`,
 * `null`, a boolean or an empty string, which React draws as nothing. A
 * component that draws a part of its own for a prop, such as EmptyState's
 * `title` or Timeline's `icon`, asks this first, so a `cond && 'Saved'` that
 * comes out `false` leaves no empty part behind.
 */
export const isGiven = (node: React.ReactNode): boolean =>
  node !== undefined &&
  node !== null &&
  typeof node !== 'boolean' &&
  node !== '';
