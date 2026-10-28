import { useEffect, useState } from 'react';

/**
 * True once the element has scrolled into view, and from then on. The
 * features section starts its entrance and its demo loops on this, so nothing
 * plays out while the reader is still up in the hero.
 */
export default function useInView(ref, threshold = 0.15) {
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
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return inView;
}
