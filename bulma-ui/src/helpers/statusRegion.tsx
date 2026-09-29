import React, { useEffect, useRef, useState } from 'react';
import { usePrefixedClassNames } from './classNames';

/**
 * What a status region says for one of a container's items.
 */
interface Announcement {
  /** The id of the item it announces. */
  id: string;
  /** The text a screen reader reads out. */
  text: string;
}

/**
 * How long after an item appears its announcement is written, in ms. The wait
 * lets a screen reader register a region the container has only just mounted,
 * and items shown in quick succession are written, and read out, together.
 */
export const announceDelay = 100;

/**
 * How long an announcement stays in the region once written, in ms. That's
 * long enough for a screen reader to pick it up. Clearing it after keeps a
 * second copy of the item's text from sitting in the page, where someone
 * reading through the page, or a test looking the text up, would find it
 * again.
 */
export const announcementLifetime = 1000;

/**
 * The announcements for the items that appeared most recently.
 */
interface Batch {
  /** Changes whenever new announcements join, which restarts the timers. */
  key: number;
  /** What to announce, in the order the items were shown. */
  announcements: Announcement[];
  /** Whether the announcements are in the region yet. */
  written: boolean;
}

const noAnnouncements: Announcement[] = [];
const noBatch: Batch = {
  key: 0,
  announcements: noAnnouncements,
  written: false,
};

/**
 * Works out what a status region says. Each item is announced once. Its
 * announcement is written `announceDelay` after it appears, or after the last
 * item to join it when several appear in quick succession, and replaces
 * whatever the region said before. It is cleared `announcementLifetime` after
 * that, or as soon as the item goes.
 *
 * Nothing is written in the commit that mounts the region or the item. A
 * screen reader reliably announces a polite live region whose content changes
 * after the region is already in the page, and not always one that arrives
 * with its content. By the time `describe` runs, an item's rendered text can
 * be read.
 *
 * @function useAnnouncements
 * @param items - The items to announce, in the order they were shown.
 * @param describe - The text to announce for an item. It runs once the item
 *   is on screen, and it must keep its identity between renders (a
 *   module-level function or a `useCallback`), or every render re-checks the
 *   items.
 * @returns The announcements to render, in the order their items were shown.
 */
function useAnnouncements<Item extends { id: string }>(
  items: readonly Item[],
  describe: (item: Item) => string
): Announcement[] {
  // The ids of the items on screen that have been announced already.
  const announcedIdsRef = useRef(new Set<string>());
  const [batch, setBatch] = useState(noBatch);

  // Runs after the commit that puts an item on screen, which is the first
  // point its rendered text can be read.
  useEffect(() => {
    const announced = announcedIdsRef.current;
    const appeared = items.filter(item => !announced.has(item.id));
    // Items that have gone drop out here too. Ids are never reused, so
    // forgetting them can't bring an old item back.
    announcedIdsRef.current = new Set(items.map(item => item.id));

    const next = appeared
      .map(item => ({ id: item.id, text: describe(item) }))
      .filter(announcement => announcement.text !== '');
    if (next.length > 0) {
      setBatch(current => ({
        key: current.key + 1,
        // Announcements still waiting go out with the new ones. Ones already
        // written make way for them.
        announcements: current.written
          ? next
          : [...current.announcements, ...next],
        written: false,
      }));
    }
  }, [items, describe]);

  // Both timers start together, so the clear doesn't wait on a render after
  // the write.
  const { key } = batch;
  useEffect(() => {
    if (key === noBatch.key) return undefined;
    const write = setTimeout(
      () => setBatch(current => ({ ...current, written: true })),
      announceDelay
    );
    const clear = setTimeout(
      () =>
        setBatch(current => ({ ...current, announcements: noAnnouncements })),
      announceDelay + announcementLifetime
    );
    return () => {
      clearTimeout(write);
      clearTimeout(clear);
    };
  }, [key]);

  if (!batch.written) return noAnnouncements;
  const onScreen = new Set(items.map(item => item.id));
  return batch.announcements.filter(announcement =>
    onScreen.has(announcement.id)
  );
}

/**
 * Props for StatusRegion.
 */
export interface StatusRegionProps<Item extends { id: string }> {
  /** The items to announce politely, in the order they were shown. */
  items: readonly Item[];
  /** The text to announce for an item, as `useAnnouncements` takes it. */
  describe: (item: Item) => string;
}

/**
 * A visually hidden, polite `status` live region that a programmatic
 * container announces its items through. The container renders it from the
 * moment it mounts, whether or not it has anything to show, so the region is
 * already in the page when an announcement is written into it.
 *
 * The announcements are this component's own state, so writing and clearing
 * them re-renders the region and leaves the container's items alone. Each one
 * is its own keyed node, so a re-render that leaves the announcements alone
 * leaves the region's content alone too, and nothing is read out twice.
 *
 * @function StatusRegion
 * @param props - The items to announce, and the text to announce for each.
 * @returns The region.
 */
export function StatusRegion<Item extends { id: string }>({
  items,
  describe,
}: StatusRegionProps<Item>): React.ReactElement {
  const announcements = useAnnouncements(items, describe);
  const srOnly = usePrefixedClassNames('is-sr-only');

  return (
    <div className={srOnly} role="status" aria-live="polite">
      {announcements.map(announcement => (
        <div key={announcement.id}>{announcement.text}</div>
      ))}
    </div>
  );
}
