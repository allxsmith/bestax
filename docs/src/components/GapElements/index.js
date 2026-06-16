import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import { gapElements } from '@site/src/data/componentCategories';
import styles from './styles.module.css';

function FadeInChip({ children, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={clsx(styles.fadeIn, visible && styles.visible)}
      style={{ transitionDelay: `${(index % 6) * 50}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * Homepage section for the semantic HTML elements Bulma never styled, which
 * Bestax ships as React components. Presented as monospace <tag> chips to make
 * clear these fill Bulma's gaps at the raw-HTML level — deliberately distinct
 * from the pill-card and icon-card sections elsewhere on the page.
 */
export default function GapElements() {
  return (
    <section className={styles.section}>
      <div className="container">
        <p className={styles.eyebrow}>Gaps, filled</p>
        <Heading as="h2" className={styles.heading}>
          The elements Bulma skips
        </Heading>
        <p className={styles.subtitle}>
          Bulma styles its own elements but leaves everyday semantic HTML
          untouched. Bestax fills the gaps — every tag below is a real React
          component with the same Bulma helper props.
        </p>
        <div className={styles.grid}>
          {gapElements.map((el, i) => (
            <FadeInChip key={el.name} index={i}>
              <Link to={el.link} className={styles.chip}>
                <code className={styles.tag}>{el.tag}</code>
                <span className={styles.name}>{el.name}</span>
              </Link>
            </FadeInChip>
          ))}
        </div>
      </div>
    </section>
  );
}
