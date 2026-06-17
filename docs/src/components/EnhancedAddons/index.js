import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import ADDON_ICONS from './icons';
import styles from './styles.module.css';

const ADDONS = [
  {
    name: 'LinkButton',
    icon: 'linkbutton',
    link: '/docs/api/elements/linkbutton',
    desc: 'A button that dresses like a link — semantics of a button, look of an anchor.',
  },
  {
    name: 'Carousel',
    icon: 'carousel',
    link: '/docs/api/components/carousel',
    desc: 'Slide any content with autoplay, drag, arrows, and indicators.',
  },
  {
    name: 'Collapse',
    icon: 'collapse',
    link: '/docs/api/components/collapse',
    desc: 'Smoothly expanding panels for accordions and FAQs.',
  },
  {
    name: 'Dialog',
    icon: 'dialog',
    link: '/docs/api/components/dialog',
    desc: 'Confirmation and alert dialogs with customizable actions.',
  },
  {
    name: 'Loading',
    icon: 'loading',
    link: '/docs/api/components/loading',
    desc: 'Spinner overlays for full pages or single containers.',
  },
  {
    name: 'Sidebar',
    icon: 'sidebar',
    link: '/docs/api/components/sidebar',
    desc: 'Slide-out navigation panels from either edge.',
  },
  {
    name: 'Steps',
    icon: 'steps',
    link: '/docs/api/components/steps',
    desc: 'Multi-step progress for wizards and checkouts.',
  },
  {
    name: 'Toast',
    icon: 'toast',
    link: '/docs/api/components/toast',
    desc: 'Brief stacking notifications with a programmatic API.',
  },
  {
    name: 'Tooltip',
    icon: 'tooltip',
    link: '/docs/api/components/tooltip',
    desc: 'Hover hints in any direction and color.',
  },
];

function FadeIn({ children, index }) {
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

export default function EnhancedAddons() {
  return (
    <section className={styles.section}>
      <div className="container">
        <p className={styles.eyebrow}>Beyond Bulma</p>
        <Heading as="h2" className={styles.heading}>
          Enhanced Add-Ons
        </Heading>
        <p className={styles.subtitle}>
          Original Bestax-Bulma components that go beyond the Bulma spec — built
          with the same props, helpers, and theming as everything else.
        </p>
        <div className={styles.grid}>
          {ADDONS.map((addon, i) => {
            const Icon = ADDON_ICONS[addon.icon];
            return (
              <FadeIn key={addon.name} index={i}>
                <Link to={addon.link} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.iconChip}>
                      <Icon />
                    </div>
                    <Heading as="h3" className={styles.cardTitle}>
                      {addon.name}
                    </Heading>
                  </div>
                  <p className={styles.cardDesc}>{addon.desc}</p>
                </Link>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
