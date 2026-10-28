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
    name: 'Kbd',
    icon: 'kbd',
    link: '/docs/api/elements/kbd',
    desc: 'Keys and shortcuts drawn as keycaps that follow the text around them, with names for symbols like ⌘.',
  },
  {
    name: 'RingProgress',
    icon: 'ringprogress',
    link: '/docs/api/elements/ringprogress',
    desc: 'A value drawn as a ring, a progress bar or a meter, and several values around one ring in sections.',
  },
  {
    name: 'Avatar',
    icon: 'avatar',
    link: '/docs/api/components/avatar',
    desc: 'User images with automatic initials and icon fallbacks, in any size or shape.',
  },
  {
    name: 'Badge',
    icon: 'badge',
    link: '/docs/api/components/badge',
    desc: 'Corner status dots and counts overlaid on any element.',
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
    name: 'Combobox',
    icon: 'combobox',
    link: '/docs/api/form/combobox',
    desc: 'A field with a list to pick from: give it your data for a searchable select or tags, or build it from parts for a server search.',
  },
  {
    name: 'Command',
    icon: 'command',
    link: '/docs/api/components/command',
    desc: 'A search over things to do that runs the top match on Enter, inline or as a ⌘K palette.',
  },
  {
    name: 'ContextMenu',
    icon: 'contextmenu',
    link: '/docs/api/components/contextmenu',
    desc: 'Menus of actions that open where you right-click, or long press on a touch screen.',
  },
  {
    name: 'Dialog',
    icon: 'dialog',
    link: '/docs/api/components/dialog',
    desc: 'Confirmation and alert dialogs with customizable actions.',
  },
  {
    name: 'EmptyState',
    icon: 'emptystate',
    link: '/docs/api/components/emptystate',
    desc: 'What a list or a search shows when there is nothing in it, with a real heading and a way forward.',
  },
  {
    name: 'HoverCard',
    icon: 'hovercard',
    link: '/docs/api/components/hovercard',
    desc: 'Previews on links and buttons that open on hover or keyboard focus, and that the pointer can reach.',
  },
  {
    name: 'Loading',
    icon: 'loading',
    link: '/docs/api/components/loading',
    desc: 'Spinner overlays for full pages or single containers.',
  },
  {
    name: 'PinInput',
    icon: 'pininput',
    link: '/docs/api/form/pininput',
    desc: 'A one-time code or a PIN as a row of boxes, all in one real input, so paste and autofill from a text message just work.',
  },
  {
    name: 'Popover',
    icon: 'popover',
    link: '/docs/api/components/popover',
    desc: 'Click-to-open panels for filters, share options, and inline edits, anchored to their trigger.',
  },
  {
    name: 'Reveal',
    icon: 'reveal',
    link: '/docs/api/components/reveal',
    desc: 'Scroll-triggered entrance animations, solo or cascading, that respect reduced motion.',
  },
  {
    name: 'ScrollArea',
    icon: 'scrollarea',
    link: '/docs/api/components/scrollarea',
    desc: 'Content that scrolls on the native scrollbars in Bulma colors, and that a keyboard can reach.',
  },
  {
    name: 'Sidebar',
    icon: 'sidebar',
    link: '/docs/api/components/sidebar',
    desc: 'Slide-out navigation panels from either edge.',
  },
  {
    name: 'Splitter',
    icon: 'splitter',
    link: '/docs/api/layout/splitter',
    desc: 'Panes with a handle between each pair to drag or move by keyboard, and panes that collapse.',
  },
  {
    name: 'Steps',
    icon: 'steps',
    link: '/docs/api/components/steps',
    desc: 'Multi-step progress for wizards and checkouts.',
  },
  {
    name: 'Timeline',
    icon: 'timeline',
    link: '/docs/api/components/timeline',
    desc: 'Events in the order they happened, or progress that is read out as words.',
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
  {
    name: 'TreeView',
    icon: 'treeview',
    link: '/docs/api/components/treeview',
    desc: 'A tree of items you browse and pick from, like a file explorer, with checkboxes and mixed parents if you want them.',
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
