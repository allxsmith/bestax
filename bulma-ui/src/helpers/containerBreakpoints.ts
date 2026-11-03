// INTERNAL: not exported from src/index.ts, which re-exports Container's
// module whole, so this list lives here rather than beside the type.
//
// Every value `ContainerBreakpoint` takes, in one list, so Container's and
// Group's checks of a JavaScript caller's `breakpoint` can't drift apart.

import type { ContainerBreakpoint } from '../layout/Container';

export const CONTAINER_BREAKPOINTS: readonly ContainerBreakpoint[] = [
  'tablet',
  'desktop',
  'widescreen',
];
