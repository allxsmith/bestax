import { useEffect, useRef, useState } from 'react';
import { useLatestRef } from './useLatestRef';

/** Options for useScrollSpy. */
export interface UseScrollSpyOptions {
  /**
   * **Required.** The ids of the sections to watch, without the `#`, in the
   * order they come on the page. Each one is looked up each time the hook
   * checks, so an id with no element on the page is skipped until one
   * appears, and a section replaced under the same id keeps working.
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

/** The page's `scroll-padding-top` in pixels, or 0 for `auto`. */
function scrollPaddingTop(): number {
  const root = document.documentElement;
  const value = getComputedStyle(root).scrollPaddingTop;
  const number = parseFloat(value);
  if (!Number.isFinite(number)) return 0;
  // A percentage is of the page's scrollport: the viewport less a classic
  // scrollbar.
  return value.endsWith('%') ? (number * root.clientHeight) / 100 : number;
}

/**
 * The height of the viewport the reader sees the page through, less a
 * classic scrollbar: the larger of the root's `clientHeight` and the visual
 * viewport's height. The visual viewport grows when a phone hides its
 * toolbar, where the root keeps the height it had with the toolbar shown;
 * under a pinch zoom it's the smaller, and the root's stands. Its `pageTop`
 * isn't read, since Firefox can leave it behind `scrollY` for a frame after
 * it puts back the scroll position on a reload.
 */
function viewportHeight(): number {
  return Math.max(
    document.documentElement.clientHeight,
    window.visualViewport?.height ?? 0
  );
}

/** Whether the page is scrolled as far down as it goes. */
const atEnd = () =>
  window.scrollY > 0 &&
  window.scrollY + viewportHeight() >=
    document.documentElement.scrollHeight - 1;

/** Whether the browser draws an element: `display: none` draws no box. */
const isDrawn = (element: Element) => element.getClientRects().length > 0;

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
 * Whether the page was opened afresh, as by a link, rather than reloaded or
 * reached by Back or Forward, where the browser puts it back where it was.
 * Where the navigation isn't recorded (jsdom), it counts as opened afresh.
 */
function openedAfresh(): boolean {
  const [entry] = performance.getEntriesByType?.('navigation') ?? [];
  const type = (entry as PerformanceNavigationTiming | undefined)?.type;
  return type !== 'reload' && type !== 'back_forward';
}

/**
 * The link a click was on, if it's a plain click that follows it in this
 * page: the main button, no modifier key, and no `target` sending it
 * elsewhere. The path is read rather than the target, so a link inside a
 * shadow root counts.
 */
function followedLink(event: MouseEvent): HTMLAnchorElement | undefined {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return undefined;
  }
  const link = event
    .composedPath()
    .find(
      (node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement
    );
  return link && (!link.target || link.target === '_self') ? link : undefined;
}

/**
 * The `useScrollSpy` hook returns the id of the section being read: the last
 * of `ids` whose top is at or above the offset line, or the last one once the
 * page is scrolled to its end. After a jump to one of them, it's that one
 * until the reader scrolls on. `null` above the first section, on the server
 * and until the page hydrates.
 *
 * It checks once per frame while the page scrolls, and on resize. A jump is
 * a plain click on a link to one of the ids (the main button, no modifier
 * key, opening in this page), noted and never stopped, so the browser jumps
 * as it always does; and the `#id` a page opened afresh opens at. Back,
 * Forward and a reload aren't jumps. That `#id` is read once, when `ids`
 * first has some: a section rendered after that isn't held, even if the
 * page opened at it, and the reading rule marks where the page is. Once the
 * page has been still for a
 * moment, the section stays current only if it's where a jump puts it: its
 * top at the line, give or take a shift of the layout smaller than its own
 * height, or, at the end of the page, on screen below the line. Otherwise,
 * as after a flick right after the click, the reading rule takes over. The
 * next scroll after that lets it go, the browser's own included, so when
 * content loading above it makes the browser scroll to keep the reader's
 * place, the rule takes over too.
 *
 * A section that isn't drawn (`display: none`) is never current. A section
 * that moves while nothing scrolls is seen at the next scroll or resize. It
 * watches the document only: not a panel that scrolls inside it, and not
 * sections inside a shadow root, which an `#id` link can't reach either.
 * Whether a page was opened afresh is read from how the document loaded, so
 * in an app that changes routes on the client, a route change can briefly
 * mark the address bar's section until the page settles, when the reading
 * rule takes over, and after a reload a route change to an `#id` holds
 * nothing.
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
  // The section a jump went to. It belongs to the hook rather than to one run
  // of the effect, so new ids, a new offset or React's development double run
  // don't lose it, and the `#id` the page opened at is read once, when the
  // ids first include some.
  const heldRef = useRef<string | null>(null);
  const openedRef = useRef(false);
  const onActiveChangeRef = useLatestRef(onActiveChange);
  // The ids as a value, so a new array with the same ids each render doesn't
  // re-subscribe.
  const key = JSON.stringify(ids);
  const fixedOffset =
    typeof offset === 'number' && Number.isFinite(offset) ? offset : undefined;

  useEffect(() => {
    const watched = JSON.parse(key) as string[];
    let line = fixedOffset ?? scrollPaddingTop();
    let settled = true;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;

    const report = (id: string | null) => {
      if (id === reportedRef.current) return;
      reportedRef.current = id;
      setActive(id);
      onActiveChangeRef.current?.(id);
    };

    /** The element for one of the ids, if it's on the page and drawn. */
    const sectionOf = (id: string) => {
      const element = watched.includes(id) ? document.getElementById(id) : null;
      return element && isDrawn(element) ? element : null;
    };

    /**
     * Whether a section is where a jump puts it: its top at the line, give or
     * take a shift of the layout smaller than the section's own height, or,
     * at the end of the page, as near as the page lets it come, on screen
     * below the line.
     */
    const atJump = (id: string) => {
      const element = sectionOf(id);
      if (!element) return false;
      const { top, bottom, height } = element.getBoundingClientRect();
      if (top <= line + height && bottom >= line) return true;
      return top > line && top < viewportHeight() && atEnd();
    };

    const check = () => {
      if (heldRef.current !== null) return report(heldRef.current);
      const drawn: [string, HTMLElement][] = [];
      for (const id of watched) {
        const element = document.getElementById(id);
        if (element && isDrawn(element)) drawn.push([id, element]);
      }
      let current: string | null = null;
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

    /**
     * Starts, or starts again, the wait for the page to be still, when a
     * held section that isn't where a jump puts it is let go.
     */
    const waitToSettle = () => {
      settled = false;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        settled = true;
        if (heldRef.current !== null && !atJump(heldRef.current)) {
          heldRef.current = null;
        }
        check();
      }, SETTLE_MS);
    };

    /** Holds the section a jump goes to, if it's one of these on the page. */
    const hold = (id: string) => {
      if (!sectionOf(id)) return;
      heldRef.current = id;
      waitToSettle();
    };

    const onScroll = () => {
      if (heldRef.current !== null) {
        // Once the page has been still, the next scroll lets the jump go;
        // until then, each scroll pushes the end of the jump back.
        if (settled) heldRef.current = null;
        else waitToSettle();
      }
      schedule();
    };

    const onResize = () => {
      line = fixedOffset ?? scrollPaddingTop();
      schedule();
    };

    const onClick = (event: MouseEvent) => {
      const link = followedLink(event);
      if (
        link?.hash &&
        link.href.split('#')[0] === window.location.href.split('#')[0]
      ) {
        hold(fragmentId(link.hash));
        check();
      }
    };

    if (!openedRef.current) {
      // Ids built from content fetched after mount arrive later, so the read
      // waits until there are some.
      if (watched.length) {
        openedRef.current = true;
        if (openedAfresh()) hold(fragmentId(window.location.hash));
      }
    } else if (heldRef.current !== null) {
      // A jump held across new ids carries on if its section still counts.
      if (sectionOf(heldRef.current)) waitToSettle();
      else heldRef.current = null;
    }
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('click', onClick, {
      capture: true,
      passive: true,
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('click', onClick, { capture: true });
    };
  }, [key, fixedOffset, onActiveChangeRef]);

  return active;
}
