import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import categories from '@site/src/data/componentCategories';
import CATEGORY_ICONS from './icons';
import styles from './styles.module.css';

function FadeInCard({ children, index }) {
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
      style={{ transitionDelay: `${(index % 3) * 60}ms` }}
    >
      {children}
    </div>
  );
}

export default function CategoryCards() {
  return (
    <section className={styles.section}>
      <div className="container">
        <Heading as="h2" className={styles.sectionHeading}>
          Bulma Supported Components
        </Heading>
        {categories.map((cat, i) => {
          const Icon = CATEGORY_ICONS[cat.icon];
          return (
            <FadeInCard key={cat.heading} index={i}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconChip}>
                    <Icon />
                  </div>
                  <Heading as="h3" className={styles.cardHeading}>
                    {cat.heading}
                  </Heading>
                </div>
                <p className={styles.cardBlurb}>{cat.blurb}</p>
                <div className={styles.pillRow}>
                  {cat.items.map(item => (
                    <Link
                      key={item.name}
                      to={item.link}
                      className={styles.pill}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </FadeInCard>
          );
        })}
      </div>
    </section>
  );
}
