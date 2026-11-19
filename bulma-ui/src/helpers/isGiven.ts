import type { ReactNode } from 'react';

/**
 * INTERNAL, deliberately not exported from `src/index.ts`. Whether a prop
 * was given something to render: `undefined`, `null`, a boolean and `''`
 * weren't, and `0` was, since React renders it.
 */
export const isGiven = (node: ReactNode) =>
  node !== undefined &&
  node !== null &&
  typeof node !== 'boolean' &&
  node !== '';
