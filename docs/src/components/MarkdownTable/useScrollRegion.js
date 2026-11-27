import { useEffect, useState } from 'react';

// Layout can land a fraction of a pixel past an edge, so overflow smaller
// than this doesn't count.
const SLACK = 1;

const precedes = (node, el) =>
  node.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING;

/**
 * The text of the last heading before `el` on the page, which names the
 * section `el` sits in, and for a later table in that section, its place
 * there, so two regions in one section have different names. A heading's
 * anchor link holds only a zero-width space.
 */
function nameFor(el) {
  const doc = el.ownerDocument;
  const heading = [...doc.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .filter(node => precedes(node, el))
    .pop();
  if (!heading) return undefined;
  const name = heading.textContent.replaceAll('\u200b', '').trim();
  const earlier = [...doc.querySelectorAll('table')].filter(
    table => precedes(table, el) && precedes(heading, table)
  ).length;
  return earlier ? `${name}, table ${earlier + 1}` : name;
}

/**
 * Makes the element `ref` points at, which scrolls sideways, a region you can
 * tab to while it overflows, named after the heading it sits under, so the
 * keyboard can scroll it. The library's `useScrollRegion` does this for its
 * components, but it isn't exported, and its `ScrollArea` draws with the
 * library's stylesheet, which the site loads only in the live examples.
 *
 * It measures on the client, once the element is laid out and whenever it or
 * its first child changes size. Until then, and while nothing overflows, the
 * element renders with none of it.
 *
 * @param {import('react').RefObject<HTMLElement>} ref - The element that scrolls.
 * @returns The props to spread on that element.
 */
export default function useScrollRegion(ref) {
  const [measured, setMeasured] = useState({
    overflowing: false,
    label: undefined,
  });
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    let label;
    // An observer reports each element once as it starts watching, so this
    // measures the first layout too. The name is looked up once it's needed.
    const observer = new ResizeObserver(() => {
      const overflowing = el.scrollWidth - el.clientWidth > SLACK;
      if (overflowing && label === undefined) label = nameFor(el);
      setMeasured(prev =>
        prev.overflowing === overflowing && prev.label === label
          ? prev
          : { overflowing, label }
      );
    });
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [ref]);

  // Taking tabIndex off the focused element would drop focus to the page, so
  // one that stops overflowing stays a region until focus leaves.
  const isRegion = measured.overflowing || focused;
  return {
    role: isRegion ? 'region' : undefined,
    'aria-label': isRegion ? measured.label : undefined,
    tabIndex: isRegion ? 0 : undefined,
    onFocus: event => {
      if (event.target === event.currentTarget) setFocused(true);
    },
    onBlur: event => {
      if (event.target === event.currentTarget) setFocused(false);
    },
  };
}
