import { useEffect, useRef, useState } from 'react';
import { warnOnce } from './devWarnings';
import { useLatestRef } from './useLatestRef';

/** Options for useScrollSpy. */
export interface UseScrollSpyOptions {
  /**
   * **Required.** The ids of the sections to watch, without the `#`, in the
   * order they come on the page. Each one is looked up each time the hook
   * checks, so a section rendered late, or replaced under the same id, is
   * seen at the next scroll.
   */
  ids: string[];
  /**
   * Pixels from the viewport's top where a section counts as reached. Unset,
   * it's the page's `scroll-padding-top`, read when the hook mounts and on
   * resize, so the highlight agrees with where a jump lands under a sticky
   * header. A `scroll-padding-top` that mixes a percentage with a length in
   * `calc()` isn't read: pass `offset` then.
   */
  offset?: number;
  /** Called with the new current id when it changes, or `null` above the first section. */
  onActiveChange?: (id: string | null) => void;
}

/**
 * How long the page has to stay still before a jump counts as over: long
 * enough to span the gap between two frames of a smooth scroll.
 */
const SETTLE_MS = 100;

/**
 * A pixel of slack at the line, for a jump that lands a fraction of a pixel
 * away from it.
 */
const SLACK = 1;

/** The height of the viewport the page scrolls in, less a classic scrollbar. */
const viewportHeight = () => document.documentElement.clientHeight;

/** The page's `scroll-padding-top` in pixels, or 0 for `auto`. */
function scrollPaddingTop(): number {
  const value = getComputedStyle(document.documentElement).scrollPaddingTop;
  const number = parseFloat(value);
  if (!Number.isFinite(number)) return 0;
  return value.endsWith('%') ? (number * viewportHeight()) / 100 : number;
}

/** Whether the browser draws an element: `display: none` draws no box. */
const isDrawn = (element: Element) => element.getClientRects().length > 0;

/** Whether the page is scrolled as far down as it goes. */
const atEnd = () =>
  window.scrollY > 0 &&
  window.scrollY + viewportHeight() >=
    document.documentElement.scrollHeight - 1;

/** The id a URL fragment names, such as `#caf%C3%A9`. */
function fragmentId(hash: string): string {
  const raw = hash.slice(1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * The `useScrollSpy` hook returns the id of the section being read: the last
 * of `ids` whose top is at or above the offset line, the last one once the
 * page is scrolled to its end, and the one a jump went to while the page
 * stays where the jump put it. `null` above the first section, on the server
 * and until the page hydrates.
 *
 * It checks once per frame while the page scrolls, and on resize. A jump is
 * a link to one of the ids being followed, seen through the `hashchange` it
 * causes and a click on a link to the address bar's own section, which
 * causes none; a page that opens at `#id` counts as one too. A click is only
 * noted, never stopped, so the jump stays the browser's own. A section stays
 * current after a jump only while its top is at the line, or the page is
 * scrolled to its end with the section on screen, which is where the browser
 * puts it; so Back and Forward, which put the page back where it was, don't
 * hold the address bar's section. During a smooth jump the mark stays where
 * it was until the page arrives.
 *
 * A section that isn't on the page, or isn't drawn (`display: none`), is never
 * current, and a development build names one that isn't on the page. A
 * section that moves while nothing scrolls, as content loading above it can
 * make it, is seen at the next scroll or resize. It watches the document
 * only: not a panel that scrolls inside it, and not sections inside a shadow
 * root, which an `#id` link can't reach either.
 *
 * @function
 * @param {UseScrollSpyOptions} options - The ids to watch, the offset, and a change callback.
 * @returns {string | null} The current section's id, or `null`.
 *
 * @example
 * const current = useScrollSpy({ ids: ['profile', 'security', 'billing'] });
 */
export function useScrollSpy({
  ids,
  offset,
  onActiveChange,
}: UseScrollSpyOptions): string | null {
  const [active, setActive] = useState<string | null>(null);
  // What was last reported, kept across a re-subscribe so the same id isn't
  // reported twice.
  const reportedRef = useRef<string | null>(null);
  const onActiveChangeRef = useLatestRef(onActiveChange);
  // The ids as a value, so a new array with the same ids each render doesn't
  // re-subscribe.
  const key = JSON.stringify(ids);
  const fixedOffset =
    typeof offset === 'number' && Number.isFinite(offset) ? offset : undefined;

  useEffect(() => {
    const watched = JSON.parse(key) as string[];
    let line = fixedOffset ?? scrollPaddingTop();
    // The section a jump went to, and whether the page has been still since.
    let held: string | null = null;
    let settled = true;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;

    const report = (id: string | null) => {
      if (id === reportedRef.current) return;
      reportedRef.current = id;
      setActive(id);
      onActiveChangeRef.current?.(id);
    };

    /** The sections on the page now, in order, looked up by id. */
    const sections = () => {
      const found: [string, HTMLElement][] = [];
      for (const id of watched) {
        const element = document.getElementById(id);
        if (element) {
          found.push([id, element]);
        } else {
          warnOnce(
            `useScrollSpy:missing:${id}`,
            `[bestax-bulma] No element has the id "${id}", so its section ` +
              'is never marked current. Check the ids given to ' +
              'useScrollSpy, or the items given to TableOfContents.'
          );
        }
      }
      return found;
    };

    /**
     * Whether the page sits where a jump to `element` puts it: its top at the
     * line, or as near as the page lets it come, scrolled to its end with the
     * section on screen below the line.
     */
    const reached = (element: HTMLElement) => {
      if (!isDrawn(element)) return false;
      const { top } = element.getBoundingClientRect();
      return (
        Math.abs(top - line) <= SLACK ||
        (top > line && top < viewportHeight() && atEnd())
      );
    };

    const check = () => {
      const found = sections();
      if (held !== null) {
        const target = found.find(([id]) => id === held);
        if (target && reached(target[1])) return report(held);
        // The jump may still be on its way, so the mark stays where it is
        // until the page has been still for a moment.
        if (!settled) return;
        held = null;
      }
      let current: string | null = null;
      const drawn = found.filter(([, element]) => isDrawn(element));
      if (atEnd()) {
        // A short last section can't reach the line, so the end of the page
        // stands in for it.
        if (drawn.length) current = drawn[drawn.length - 1][0];
      } else {
        for (const [id, element] of drawn) {
          if (element.getBoundingClientRect().top <= line + SLACK) current = id;
        }
      }
      report(current);
    };

    /** Runs the check in the next frame, once however many events ask. */
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        check();
      });
    };

    /** Starts, or starts again, the wait for the page to be still. */
    const waitToSettle = () => {
      settled = false;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        settled = true;
        check();
      }, SETTLE_MS);
    };

    /** Holds the section a jump goes to, or lets go for a jump elsewhere. */
    const hold = (id: string) => {
      held = watched.includes(id) ? id : null;
      if (held !== null) waitToSettle();
      check();
    };

    const onScroll = () => {
      if (held !== null) {
        // Once the jump is over, the reader's own scroll lets it go; until
        // then, each scroll pushes the end of the jump back.
        if (settled) held = null;
        else waitToSettle();
      }
      schedule();
    };

    const onResize = () => {
      line = fixedOffset ?? scrollPaddingTop();
      schedule();
    };

    const onHashChange = () => hold(fragmentId(window.location.hash));

    // A link to the section already in the address bar jumps with no
    // `hashchange`, so a click on one is noted here. Only noted: nothing
    // stops the click, and the browser jumps as it always does. The path is
    // read rather than the target, so a link inside a shadow root counts.
    const onClick = (event: MouseEvent) => {
      const link = event
        .composedPath()
        .find(
          (node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement
        );
      if (
        link?.hash &&
        link.href.split('#')[0] === window.location.href.split('#')[0]
      ) {
        hold(fragmentId(link.hash));
      }
    };

    // A page that opens at `#id` was jumped there by the browser, unless it
    // put the page back where it was on a reload, which `reached` tells.
    hold(fragmentId(window.location.hash));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('hashchange', onHashChange);
    document.addEventListener('click', onClick, {
      capture: true,
      passive: true,
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('hashchange', onHashChange);
      document.removeEventListener('click', onClick, { capture: true });
    };
  }, [key, fixedOffset, onActiveChangeRef]);

  return active;
}
