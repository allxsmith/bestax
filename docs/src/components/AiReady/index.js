import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import { DocsIcon, SkillsIcon, McpIcon } from './icons';
import styles from './styles.module.css';

const CARDS = [
  {
    key: 'llms',
    icon: DocsIcon,
    title: 'LLM-ready docs',
    desc: 'Token-friendly, plain-text documentation a model can read in full — point Claude, Cursor, Copilot, or ChatGPT straight at it.',
    href: 'https://bestax.io/llms.txt',
    cta: 'View llms.txt',
  },
  {
    key: 'skills',
    icon: SkillsIcon,
    title: 'Agent skills',
    desc: 'Drop-in skills that teach coding agents the Bestax way — composing fields, layouts, and whole components without hand-holding.',
    href: '/docs/skills/intro',
    cta: 'Explore skills',
  },
  {
    key: 'mcp',
    icon: McpIcon,
    title: 'MCP server',
    desc: 'A Model Context Protocol endpoint so agents can query component props, variants, and live examples while they build.',
    soon: true,
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
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {children}
    </div>
  );
}

function CardInner({ card }) {
  const Icon = card.icon;
  return (
    <>
      {card.soon && <span className={styles.badge}>Coming soon</span>}
      <div className={styles.cardHeader}>
        <div
          className={clsx(styles.iconChip, card.soon && styles.iconChipSoon)}
        >
          <Icon />
        </div>
        <Heading as="h3" className={styles.cardTitle}>
          {card.title}
        </Heading>
      </div>
      <p className={styles.cardDesc}>{card.desc}</p>
      {card.cta && <span className={styles.cta}>{card.cta} →</span>}
    </>
  );
}

export default function AiReady() {
  return (
    <section className={styles.section}>
      <div className="container">
        <p className={styles.eyebrow}>AI-Ready</p>
        <Heading as="h2" className={styles.heading}>
          Bring Bestax to your AI tools
        </Heading>
        <p className={styles.subtitle}>
          Point your coding assistant at machine-readable docs and drop-in agent
          skills today — with an MCP server on the way.
        </p>
        <div className={styles.grid}>
          {CARDS.map((card, i) => (
            <FadeIn key={card.key} index={i}>
              {card.href ? (
                <Link to={card.href} className={styles.card}>
                  <CardInner card={card} />
                </Link>
              ) : (
                <div className={clsx(styles.card, styles.cardSoon)}>
                  <CardInner card={card} />
                </div>
              )}
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
