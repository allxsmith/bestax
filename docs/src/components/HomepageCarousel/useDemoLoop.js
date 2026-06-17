import { useEffect, useState } from 'react';

const CANCELLED = Symbol('cancelled');

/**
 * Scaffolding for the looping homepage demos: runs `run({ sleep })` in an
 * endless loop while the slide is active, the demo is on screen, the visitor
 * isn't hovering it, and reduced motion isn't requested. `sleep` rejects with
 * a cancellation sentinel once the loop is torn down, unwinding `run`.
 *
 * Returns { reducedMotion, hoverProps } — spread hoverProps on the wrapper
 * so hovering pauses the loop and hands the control to the visitor.
 */
export default function useDemoLoop({ active, wrapperRef, run }) {
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  // Only play while the demo is actually on screen
  useEffect(() => {
    if (!wrapperRef.current) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.4 }
    );
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [wrapperRef]);

  useEffect(() => {
    if (!active || !inView || paused || reducedMotion) return undefined;

    const token = { cancelled: false };

    const sleep = ms =>
      new Promise((resolve, reject) =>
        setTimeout(() => (token.cancelled ? reject(CANCELLED) : resolve()), ms)
      );

    const loop = async () => {
      for (;;) {
        await run({ sleep, token });
      }
    };

    loop().catch(err => {
      if (err !== CANCELLED) throw err;
    });

    return () => {
      token.cancelled = true;
    };
  }, [active, inView, paused, reducedMotion, run]);

  return {
    reducedMotion,
    hoverProps: {
      onMouseEnter: () => setPaused(true),
      onMouseLeave: () => setPaused(false),
    },
  };
}

export { CANCELLED };
