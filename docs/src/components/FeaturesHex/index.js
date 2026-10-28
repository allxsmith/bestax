import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { FEATURES } from '@site/src/components/HomepageFeatures/features';
import useInView from '@site/src/components/HomepageFeatures/useInView';
import styles from './styles.module.css';

const HEX = '56,2 110,33 110,95 56,126 2,95 2,33';

/** One line-drawn icon per feature, drawn in after its hexagon. */
const ICONS = {
  bulma: [
    'M19.5 9.5A8 8 0 0 0 5.2 7.2L4 8.5',
    'M4 4.5v4h4',
    'M4.5 14.5a8 8 0 0 0 14.3 2.3l1.2-1.3',
    'M20 19.5v-4h-4',
  ],
  lightweight: ['M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2z'],
  developer: ['M8.5 7 3.5 12l5 5', 'M15.5 7l5 5-5 5', 'M13.5 4.5l-3 15'],
};

/** How long the clicked badge spins before the bento takes the section over. */
const EXIT_MS = 450;

/**
 * "Why bestax" as three hex badges that trace themselves in, linked by a
 * dotted line. Clicking a badge hands the section to the bento layout, whose
 * cards demonstrate each feature.
 */
export default function FeaturesHex({ onPick }) {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef);
  const [leaving, setLeaving] = useState(null);
  const exit = useRef(null);

  useEffect(() => () => clearTimeout(exit.current), []);

  const pick = index => {
    if (leaving !== null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onPick();
      return;
    }
    setLeaving(index);
    exit.current = setTimeout(onPick, EXIT_MS);
  };

  return (
    <section
      ref={sectionRef}
      className={clsx(
        styles.section,
        inView && styles.inView,
        leaving !== null && styles.leaving
      )}
      aria-labelledby="why-bestax-title"
    >
      <div className={styles.container}>
        <h2 id="why-bestax-title" className={styles.title}>
          Why bestax
        </h2>
        <div className={styles.columns}>
          <div className={styles.trace} aria-hidden="true">
            <span className={styles.traceLine} />
            <span className={styles.traceDot} />
          </div>
          {FEATURES.map((feature, i) => (
            <article
              key={feature.key}
              className={clsx(styles.column, leaving === i && styles.picked)}
              style={{ '--i': i }}
            >
              <button
                type="button"
                className={styles.badge}
                onClick={() => pick(i)}
                aria-label={`${feature.title}: see it in action`}
              >
                <span className={styles.halo} aria-hidden="true" />
                <svg
                  className={styles.hex}
                  viewBox="0 0 112 128"
                  aria-hidden="true"
                >
                  <g className={styles.hexShape}>
                    <polygon className={styles.hexBase} points={HEX} />
                    <polygon className={styles.hexFill} points={HEX} />
                    <polygon className={styles.hexLine} points={HEX} />
                  </g>
                  <g transform="translate(32 40) scale(2)">
                    <g className={styles.icon}>
                      {ICONS[feature.key].map(d => (
                        <path key={d} className={styles.iconPath} d={d} />
                      ))}
                    </g>
                  </g>
                </svg>
                {feature.key === 'bulma' && (
                  <span className={styles.pill} aria-hidden="true">
                    v1
                  </span>
                )}
              </button>
              <h3 className={styles.columnTitle}>{feature.title}</h3>
              <p className={styles.columnText}>{feature.description}</p>
              <div className={styles.chips}>
                {feature.chips.map(chip => (
                  <span key={chip} className={styles.chip}>
                    {chip}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
