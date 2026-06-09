import React from 'react';
import { render } from '@testing-library/react';
import { useNativeMobilePicker } from '../_pickerInternals/useNativeMobilePicker';

interface Listeners {
  [query: string]: Array<(e: { matches: boolean }) => void>;
}

function mockMatchMedia(matches: Record<string, boolean>) {
  const listeners: Listeners = {};
  const impl = (query: string): MediaQueryList => {
    return {
      matches: !!matches[query],
      media: query,
      onchange: null,
      addEventListener: (
        _type: string,
        fn: (e: { matches: boolean }) => void
      ) => {
        listeners[query] = [...(listeners[query] ?? []), fn];
      },
      removeEventListener: (
        _type: string,
        fn: (e: { matches: boolean }) => void
      ) => {
        listeners[query] = (listeners[query] ?? []).filter(l => l !== fn);
      },
      addListener: (fn: (e: { matches: boolean }) => void) => {
        listeners[query] = [...(listeners[query] ?? []), fn];
      },
      removeListener: (fn: (e: { matches: boolean }) => void) => {
        listeners[query] = (listeners[query] ?? []).filter(l => l !== fn);
      },
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  };
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: impl,
  });
}

const Probe: React.FC<{
  result: { current: ReturnType<typeof useNativeMobilePicker> | null };
  force?: boolean;
}> = ({ result, force }) => {
  const v = useNativeMobilePicker({ force });
  result.current = v;
  return null;
};

describe('useNativeMobilePicker', () => {
  it('detects coarse pointer + small viewport ⇒ shouldUseNative=true', () => {
    mockMatchMedia({
      '(pointer: coarse)': true,
      '(max-width: 768px)': true,
    });
    const result = {
      current: null as ReturnType<typeof useNativeMobilePicker> | null,
    };
    render(<Probe result={result} />);
    expect(result.current?.shouldUseNative).toBe(true);
    expect(result.current?.isCoarsePointer).toBe(true);
    expect(result.current?.isSmallViewport).toBe(true);
  });

  it('coarse pointer with large viewport ⇒ shouldUseNative=false', () => {
    mockMatchMedia({
      '(pointer: coarse)': true,
      '(max-width: 768px)': false,
    });
    const result = {
      current: null as ReturnType<typeof useNativeMobilePicker> | null,
    };
    render(<Probe result={result} />);
    expect(result.current?.shouldUseNative).toBe(false);
  });

  it('force=true overrides detection', () => {
    mockMatchMedia({
      '(pointer: coarse)': false,
      '(max-width: 768px)': false,
    });
    const result = {
      current: null as ReturnType<typeof useNativeMobilePicker> | null,
    };
    render(<Probe result={result} force={true} />);
    expect(result.current?.shouldUseNative).toBe(true);
  });

  it('force=false overrides detection', () => {
    mockMatchMedia({
      '(pointer: coarse)': true,
      '(max-width: 768px)': true,
    });
    const result = {
      current: null as ReturnType<typeof useNativeMobilePicker> | null,
    };
    render(<Probe result={result} force={false} />);
    expect(result.current?.shouldUseNative).toBe(false);
  });
});
