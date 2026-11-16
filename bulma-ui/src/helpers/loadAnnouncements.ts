// INTERNAL: deliberately not exported from src/index.ts. What a branch that
// loads its items says in a polite live region, shared by TreeView's items
// and Cascader's columns.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLatestRef } from './useLatestRef';

/** What an open branch's load says in the live region. */
export interface LoadAnnouncement {
  /** The branch's key, so what it says next replaces this. */
  key: string;
  /** The key and the kind: the region says it once each time it appears. */
  id: string;
  kind: 'loading' | 'loaded' | 'error';
  /** The branch's name. */
  name: string;
  /** A failed load's message. */
  message: string;
}

/** Where a branch is: shut, open, or open with its load under way or failed. */
export type LoadPhase = 'closed' | 'open' | 'loading' | 'error';

const sayLoading = (name: string) => `Loading ${name}`;
const sayLoaded = (name: string) => `${name} loaded`;

/** What the component holding the live region hands its branches, and the region. */
export interface LoadRegion {
  /** What the region is saying, in the order it started saying it. */
  announcements: LoadAnnouncement[];
  /** Puts what a branch's load says in the region, or takes it out with `null`. */
  announce: (key: string, announcement: LoadAnnouncement | null) => void;
  /** The text the region reads for an announcement. */
  describe: (announcement: LoadAnnouncement) => string;
}

/**
 * The live region's side: what each branch's load is saying, and how it's
 * worded. A failed load reads out its message, and loading and loaded read
 * the branch's name through the two wordings, `Loading ${name}` and
 * `${name} loaded` by default.
 *
 * @param loadingAnnouncement - What a branch that starts loading says.
 * @param loadedAnnouncement - What it says once that load finishes.
 */
export function useLoadRegion(
  loadingAnnouncement?: (name: string) => string,
  loadedAnnouncement?: (name: string) => string
): LoadRegion {
  const [announcements, setAnnouncements] = useState<LoadAnnouncement[]>([]);
  const announce = useCallback(
    (key: string, announcement: LoadAnnouncement | null) => {
      setAnnouncements(current => {
        const others = current.filter(said => said.key !== key);
        return announcement ? [...others, announcement] : others;
      });
    },
    []
  );
  const describe = useCallback(
    ({ kind, name, message }: LoadAnnouncement) => {
      if (kind === 'error') return message;
      const say =
        kind === 'loading'
          ? (loadingAnnouncement ?? sayLoading)
          : (loadedAnnouncement ?? sayLoaded);
      return say(name);
    },
    [loadingAnnouncement, loadedAnnouncement]
  );
  return { announcements, announce, describe };
}

/**
 * A branch's side: what it says follows its row. It's loading, or it failed,
 * while the row says so, and it's loaded once the row goes with the branch
 * still open, whichever row it was, until the branch closes or loads again.
 * A closed branch says nothing, loading or not.
 *
 * @param phase - Where the branch is now.
 * @param key - The branch's key in the region.
 * @param announce - The region's `announce`, or nothing outside a region.
 * @param read - Reads the branch's name, and a failed load's message, off the
 * page once the row is there.
 */
export function useLoadPhase(
  phase: LoadPhase,
  key: string,
  announce: LoadRegion['announce'] | undefined,
  read: () => { name: string; message: string }
): void {
  const lastPhaseRef = useRef(phase);
  const readRef = useLatestRef(read);
  useEffect(() => {
    const was = lastPhaseRef.current;
    lastPhaseRef.current = phase;
    const kind =
      phase === 'loading' || phase === 'error'
        ? phase
        : phase === 'open' && (was === 'loading' || was === 'error')
          ? 'loaded'
          : null;
    if (!kind) return undefined;
    // Only a branch inside a region can be open.
    const { name, message } = readRef.current();
    announce!(key, {
      key,
      id: `${key}:${kind}`,
      kind,
      name,
      message: kind === 'error' ? message : '',
    });
    return () => announce!(key, null);
  }, [phase, announce, key, readRef]);
}
