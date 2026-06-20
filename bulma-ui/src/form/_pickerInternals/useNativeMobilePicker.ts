import { useEffect, useState } from 'react';

export interface NativeMobileDetect {
  isCoarsePointer: boolean;
  isSmallViewport: boolean;
  shouldUseNative: boolean;
}

export interface UseNativeMobilePickerOptions {
  smallViewportMaxPx?: number;
  /** When set, overrides detection. */
  force?: boolean;
}

export function useNativeMobilePicker(
  options: UseNativeMobilePickerOptions = {}
): NativeMobileDetect {
  const { smallViewportMaxPx = 768, force } = options;
  const [state, setState] = useState<NativeMobileDetect>({
    isCoarsePointer: false,
    isSmallViewport: false,
    shouldUseNative: force === true,
  });

  useEffect(() => {
    const isBrowser =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function';
    if (!isBrowser) return undefined;
    const coarse = window.matchMedia('(pointer: coarse)');
    const small = window.matchMedia(`(max-width: ${smallViewportMaxPx}px)`);

    const update = () => {
      const isCoarsePointer = coarse.matches;
      const isSmallViewport = small.matches;
      const shouldUseNative =
        force === true
          ? true
          : force === false
            ? false
            : isCoarsePointer && isSmallViewport;
      setState({ isCoarsePointer, isSmallViewport, shouldUseNative });
    };

    update();
    const subscribe = (mql: MediaQueryList, fn: () => void) => {
      if (mql.addEventListener) {
        // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener -- cleanup returned below and run in the effect teardown
        mql.addEventListener('change', fn);
        return () => mql.removeEventListener('change', fn);
      }
      // Older Safari fallback
      mql.addListener(fn);
      return () => mql.removeListener(fn);
    };
    const unsubCoarse = subscribe(coarse, update);
    const unsubSmall = subscribe(small, update);
    return () => {
      unsubCoarse();
      unsubSmall();
    };
  }, [smallViewportMaxPx, force]);

  return state;
}
