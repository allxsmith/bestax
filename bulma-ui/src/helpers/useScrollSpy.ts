import { useEffect, useRef, useState } from 'react';
import { warnOnce } from './devWarnings';
import { useLatestRef } from './useLatestRef';

/** Options for useScrollSpy. */
export interface UseScrollSpyOptions {
  /**
   * **Required.** The ids of the sections to watch, without the `#`, in the
   * order they come on the page. They're looked up when the hook mounts and
   * again when the list changes, so a section rendered later than that isn't
   * seen until the list changes too.
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
 * How long the page has to stay still before a scroll counts as over: long
 * enough to span the gap between two frames of a smooth scroll.
 */
const SETTLE_MS = 100;

/**
 * A pixel of slack at the line, for a jump that lands a fraction of a pixel
 * past it.
 */
const SLACK = 1;

/**
 * How far the observer's region reaches above the viewport and out to its
 * sides: farther than a page scrolls, so a section counts as above the line
 * however far above it is.
 */
const BEYOND = 1_000_000;

/** The page's `scroll-padding-top` in pixels, or 0 for `auto`. */
function scrollPaddingTop(): number {
  const value = getComputedStyle(document.documentElement).scrollPaddingTop;
  const number = parseFloat(value);
  if (!Number.isFinite(number)) return 0;
  return value.endsWith('%') ? (number * window.innerHeight) / 100 : number;
}

/** Whether the browser draws an element: `display: none` draws no box. */
const isDrawn = (element: Element) => element.getClientRects().length > 0;

/** The id the address bar's fragment names. */
function hashTarget(): string {
  const raw = window.location.hash.slice(1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * The `useScrollSpy` hook returns the id of the section being read: the last
 * of `ids` whose top is at or above the offset line, the last one once the
 * page is scrolled to its end, and the one a jump went to until that jump
 * settles and the reader scrolls on. `null` above the first section, on the
 * server and until the page hydrates.
 *
 * It watches the document with an `IntersectionObserver`, which runs the check
 * as a section's top crosses the line, and checks once more each time
 * scrolling stops. Where `IntersectionObserver` is missing, every scroll
 * checks. A jump is seen through the `hashchange` a link to `#id` causes, so a
 * link needs no click handler. A section that isn't on the page, or isn't
 * drawn (`display: none`), is never current, and a development build names
 * one that isn't on the page. It watches the document only: not a panel that
 * scrolls inside it, and not sections inside a shadow root, which an `#id`
 * link can't reach either.
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
    const targets = new Map<string, HTMLElement>();
    for (const id of JSON.parse(key) as string[]) {
      const element = document.getElementById(id);
      if (element) {
        targets.set(id, element);
      } else {
        warnOnce(
          `useScrollSpy:missing:${id}`,
          `[bestax-bulma] No element has the id "${id}", so its section is ` +
            'never marked current. Check the ids given to useScrollSpy, or ' +
            'the items given to TableOfContents.'
        );
      }
    }

    let line = 0;
    let observer: IntersectionObserver | undefined;
    // The section a jump went to, held current until the jump's scrolling
    // has settled and the reader scrolls again.
    let pinned: string | null = null;
    let settled = true;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    const report = (id: string | null) => {
      if (id === reportedRef.current) return;
      reportedRef.current = id;
      setActive(id);
      onActiveChangeRef.current?.(id);
    };

    const check = () => {
      if (pinned !== null) return report(pinned);
      const drawn = [...targets].filter(([, element]) => isDrawn(element));
      const { scrollY, innerHeight } = window;
      const atEnd =
        scrollY > 0 &&
        scrollY + innerHeight >= document.documentElement.scrollHeight - 1;
      let current: string | null = null;
      if (atEnd) {
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

    // The region runs from far above the viewport down to the line, so a
    // section enters it as its top passes the line on the way up and leaves
    // as it comes back down, however fast the page moves. `root: document`
    // keeps the margins in force inside a cross-origin frame too.
    const observe = () => {
      observer?.disconnect();
      line = fixedOffset ?? scrollPaddingTop();
      if (typeof IntersectionObserver === 'undefined') return;
      observer = new IntersectionObserver(check, {
        root: document,
        rootMargin: `${BEYOND}px ${BEYOND}px ${
          line + SLACK - window.innerHeight
        }px ${BEYOND}px`,
      });
      targets.forEach(element => observer!.observe(element));
    };

    // Each scroll restarts the wait, and the check runs once the page has
    // been still for a moment: that's what sees the end of the page, which no
    // section crosses the line to show.
    const waitToSettle = () => {
      settled = false;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        settled = true;
        check();
      }, SETTLE_MS);
    };

    const onScroll = () => {
      const scrolledOn = pinned !== null && settled;
      if (scrolledOn) pinned = null;
      if (scrolledOn || !observer) check();
      waitToSettle();
    };

    const onHashChange = () => {
      const id = hashTarget();
      const element = targets.get(id);
      pinned = element && isDrawn(element) ? id : null;
      check();
      waitToSettle();
    };

    const onResize = () => {
      observe();
      check();
    };

    observe();
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('hashchange', onHashChange);
    return () => {
      observer?.disconnect();
      clearTimeout(settleTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, [key, fixedOffset, onActiveChangeRef]);

  return active;
}
