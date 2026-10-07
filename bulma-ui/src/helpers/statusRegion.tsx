import React, { useEffect, useRef, useState } from 'react';

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
 * An announcement in the region.
 */
interface WrittenAnnouncement extends Announcement {
  /** The batch it was written with, which is what its clear removes. */
  batch: number;
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
 * What the region says, and what it's about to say.
 */
interface Announcements {
  /**
   * Changes whenever announcements join the wait, which restarts it. It also
   * names the batch they're written with.
   */
  key: number;
  /** Waiting to be written, in the order their items were shown. */
  waiting: Announcement[];
  /** In the region, in the order they were written. */
  written: WrittenAnnouncement[];
}

const noAnnouncements: Announcement[] = [];
const nothingWritten: WrittenAnnouncement[] = [];
const noAnnouncementsYet: Announcements = {
  key: 0,
  waiting: noAnnouncements,
  written: nothingWritten,
};

// Hides the region with inline styles rather than a class, so it needs no
// stylesheet, including the helper classes a modular Bulma build can leave
// out. Clipping it, rather than using `display` or `visibility`, keeps it in
// the accessibility tree. The declarations match the `extras-sr-only` mixin,
// plus `clip-path`, which replaces the deprecated `clip`. The negative margin
// pulls the 1px box back inside the page, so it doesn't add scrollable
// overflow. Exported for other live regions that must work without a
// stylesheet, such as a range calendar's.
export const visuallyHidden: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
};

/**
 * Works out what a status region says. Each item is announced once. Its
 * announcement is written `announceDelay` after it appears, or after the last
 * item to join it when several appear in quick succession, alongside whatever
 * the region still says. Once written, it stays for `announcementLifetime`,
 * whatever is written after it and whether or not its item goes in the
 * meantime. An item that goes before its announcement is written isn't
 * announced.
 *
 * Nothing is written in the commit that mounts the region or the item. A
 * screen reader reliably announces a polite live region whose content changes
 * after the region is already in the page, and not always one that arrives
 * with its content. By the time `describe` runs, an item's rendered text can
 * be read.
 *
 * @function useAnnouncements
 * @param items - The items to announce, in the order they were shown.
 * @param describe - The text to announce for an item, or nothing to skip it.
 *   It runs once the item is on screen, and it must keep its identity between
 *   renders (a module-level function or a `useCallback`), or every render
 *   re-checks the items.
 * @returns The announcements to render, in the order they were written.
 */
function useAnnouncements<Item extends { id: string }>(
  items: readonly Item[],
  describe: (item: Item) => string | null
): WrittenAnnouncement[] {
  // The ids of the items on screen as of the last change, every one of which
  // has been looked at for an announcement already.
  const onScreenIdsRef = useRef(new Set<string>());
  // Clears that haven't run yet. They outlive the batch that started them, so
  // they're only stopped when the region unmounts.
  const clearTimersRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const [announcements, setAnnouncements] = useState(noAnnouncementsYet);

  // Runs after the commit that puts an item on screen, which is the first
  // point its rendered text can be read.
  useEffect(() => {
    const announced = onScreenIdsRef.current;
    const appeared = items.filter(item => !announced.has(item.id));
    // Items that have gone drop out here too. Ids are never reused, so
    // forgetting them can't bring an old item back.
    onScreenIdsRef.current = new Set(items.map(item => item.id));

    const next: Announcement[] = [];
    for (const item of appeared) {
      const text = describe(item);
      if (text) next.push({ id: item.id, text });
    }
    if (next.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- an item's rendered text can only be read once it's on screen
      setAnnouncements(current => ({
        ...current,
        key: current.key + 1,
        // Announcements still waiting go out with the new ones. What's
        // already written stays put.
        waiting: [...current.waiting, ...next],
      }));
    }
  }, [items, describe]);

  // The write only touches the batch it was started for: a newer batch can
  // be set before the render that cancels this timer. Its clear is started
  // by the write itself, so it's timed from the write without waiting on a
  // render, and a newer batch arriving doesn't cut short what's written.
  const { key } = announcements;
  useEffect(() => {
    if (key === noAnnouncementsYet.key) return undefined;
    const clearTimers = clearTimersRef.current;
    const write = setTimeout(() => {
      // Whether an item is on screen is decided here, once. An item that
      // went before its announcement was due isn't announced, and one that
      // goes after keeps its announcement for the rest of its lifetime, when
      // the region holds the only copy of its text rather than a second one.
      const onScreen = onScreenIdsRef.current;
      setAnnouncements(current =>
        current.key === key
          ? {
              ...current,
              waiting: noAnnouncements,
              written: [
                ...current.written,
                ...current.waiting
                  .filter(announcement => onScreen.has(announcement.id))
                  .map(announcement => ({ ...announcement, batch: key })),
              ],
            }
          : current
      );
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-timeout -- it has to outlive this effect when a newer batch arrives, so the unmount effect below clears it
      const clear = setTimeout(() => {
        clearTimers.delete(clear);
        setAnnouncements(current => {
          const written = current.written.filter(
            announcement => announcement.batch !== key
          );
          return written.length === current.written.length
            ? current
            : { ...current, written };
        });
      }, announcementLifetime);
      clearTimers.add(clear);
    }, announceDelay);
    return () => clearTimeout(write);
  }, [key]);

  useEffect(() => {
    const clearTimers = clearTimersRef.current;
    return () => {
      clearTimers.forEach(clearTimeout);
      clearTimers.clear();
    };
  }, []);

  return announcements.written;
}

/**
 * Reads an element out roughly the way a screen reader would: its text, with
 * an element's `aria-label`, or an image's `alt`, standing in for what's
 * inside it, a break between block-level elements, and parts that are
 * `aria-hidden`, `hidden` or inline-styled `display: none` left out. It isn't
 * the full accessible name computation, so `aria-labelledby`, CSS-generated
 * content, content hidden by a stylesheet and other ways of naming or hiding
 * content aren't followed.
 *
 * @function spokenText
 * @param element - The element to read.
 * @returns Its text, with runs of whitespace collapsed and the ends trimmed.
 */
export function spokenText(element: Element): string {
  return readAloud(element).replace(/\s+/g, ' ').trim();
}

// Elements a browser displays as blocks by default, and `br`. A screen reader
// pauses between them, so their text shouldn't run into the text beside them.
// They're known by tag rather than by computed `display`, which would depend
// on a stylesheet and on layout.
const blockLevelTags = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'BR',
  'CAPTION',
  'DD',
  'DETAILS',
  'DIALOG',
  'DIV',
  'DL',
  'DT',
  'FIELDSET',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'FORM',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'HGROUP',
  'HR',
  'LEGEND',
  'LI',
  'MAIN',
  'MENU',
  'NAV',
  'OL',
  'P',
  'PRE',
  'SEARCH',
  'SECTION',
  'SUMMARY',
  'TABLE',
  'TBODY',
  'TD',
  'TFOOT',
  'TH',
  'THEAD',
  'TR',
  'UL',
]);

/**
 * Whether an element is left out of what a screen reader reads.
 *
 * @function isHidden
 * @param element - The element to check.
 * @returns True for `aria-hidden="true"`, the `hidden` attribute, and an
 *   inline `display: none`, on an HTML, SVG or any other element with an
 *   inline style.
 */
const isHidden = (element: Element): boolean =>
  element.getAttribute('aria-hidden') === 'true' ||
  element.hasAttribute('hidden') ||
  (element as Partial<ElementCSSInlineStyle>).style?.display === 'none';

/**
 * The text `spokenText` reads for an element, before its whitespace is
 * tidied.
 *
 * @function readAloud
 * @param element - The element to read.
 * @returns Its text.
 */
function readAloud(element: Element): string {
  if (isHidden(element)) return '';
  const name =
    element.getAttribute('aria-label') ||
    (element.tagName === 'IMG' ? element.getAttribute('alt') : null);
  const text =
    name ||
    Array.from(element.childNodes, child => {
      if (child instanceof Element) return readAloud(child);
      return child.nodeType === Node.TEXT_NODE ? child.textContent : '';
    }).join('');
  // A name stands in for the element's content, and a block's content stands
  // apart from what's around it, so both are padded to keep them from running
  // into the neighboring text. An inline run, like `<span>Up</span>` then
  // `<span>loaded</span>`, still reads as one word.
  return name || blockLevelTags.has(element.tagName) ? ` ${text} ` : text;
}

/**
 * Props for StatusRegion.
 */
export interface StatusRegionProps<Item extends { id: string }> {
  /** The items to announce politely, in the order they were shown. */
  items: readonly Item[];
  /**
   * The text to announce for an item, or nothing to skip it, as
   * `useAnnouncements` takes it.
   */
  describe: (item: Item) => string | null;
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

  // `role="status"` makes a region atomic unless it says otherwise, which
  // reads the whole region on every change. Each announcement is its own
  // node, and only additions are relevant by default, so with atomic off a
  // screen reader reads just what was written, and removing one announcement
  // doesn't read out the ones still there.
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      style={visuallyHidden}
    >
      {announcements.map(announcement => (
        <div key={announcement.id}>{announcement.text}</div>
      ))}
    </div>
  );
}
