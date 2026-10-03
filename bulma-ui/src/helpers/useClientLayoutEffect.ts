// INTERNAL: deliberately not exported from src/index.ts.
import { useEffect, useLayoutEffect } from 'react';

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server. A server
 * render runs neither, and React 18 warns about a layout effect there, so the
 * server is handed the plain one.
 */
export const useClientLayoutEffect =
  typeof document === 'undefined' ? useEffect : useLayoutEffect;
