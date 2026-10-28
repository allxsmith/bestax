import { useEffect, useState } from 'react';

/**
 * True once the element's top has come a quarter of the way up the viewport,
 * and from then on. The features section starts its entrance and its demo
 * loops on this, so nothing plays out while the reader is still up in the
 * hero.
 *
 * It watches an edge rather than a share of the element, because a section
 * taller than the screen (the stacked bento on a phone) may never have a given
 * share of itself on screen at once.
 */
export default function useInView(ref) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -25% 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return inView;
}
