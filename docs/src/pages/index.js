import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import HomepageCarousel from '@site/src/components/HomepageCarousel';
import FormDemo from '@site/src/components/HomepageCarousel/FormDemo';
import CategoryCards from '@site/src/components/CategoryCards';
import GapElements from '@site/src/components/GapElements';
import EnhancedAddons from '@site/src/components/EnhancedAddons';
import PickerShowcase from '@site/src/components/PickerShowcase';
import AiReady from '@site/src/components/AiReady';
import Heading from '@theme/Heading';
import {
  Skeleton,
  Grid,
  Cell,
  Notification,
  Box,
} from '@allxsmith/bestax-bulma';
import styles from './index.module.css';

const CELL_COLORS = ['primary', 'link', 'info', 'success', 'warning', 'danger'];

const v1Slides = [
  {
    key: 'skeleton',
    title: 'Skeleton',
    description:
      'Bulma-styled loading placeholders. Use the block or lines variant directly, or flip the skeleton prop on compatible components to show a loading state while real content arrives.',
    link: '/docs/api/elements/skeleton',
    linkLabel: 'Skeleton Docs',
    demo: (
      <Box style={{ maxWidth: '26rem', margin: '0 auto' }}>
        <Skeleton variant="block" style={{ height: '7rem' }} />
        <div className="mt-4">
          <Skeleton variant="lines" lines={4} />
        </div>
      </Box>
    ),
  },
  {
    key: 'grid',
    title: 'Grid',
    description:
      'Bulma’s modern CSS Grid as a React component. Set minCol and a gap, and the grid responsively fits as many columns as the space allows — no breakpoint math required.',
    link: '/docs/api/grid',
    linkLabel: 'Grid Docs',
    demo: (
      <Grid minCol={4} gap={1}>
        {Array.from({ length: 8 }, (_, i) => (
          <Cell key={i}>
            <Notification
              color={CELL_COLORS[i % CELL_COLORS.length]}
              className="has-text-centered py-3 px-2"
            >
              Cell {i + 1}
            </Notification>
          </Cell>
        ))}
      </Grid>
    ),
  },
  {
    key: 'cell',
    title: 'Cell',
    description:
      'Place individual grid items with precision. Span columns and rows, set explicit start positions, and build dashboard-style layouts with colSpan, rowSpan, colStart, and friends.',
    link: '/docs/api/grid/cell',
    linkLabel: 'Cell Docs',
    demo: (
      <Grid isFixed fixedCols={4} gap={1}>
        <Cell colSpan={2}>
          <Notification color="primary" className="py-3">
            colSpan 2
          </Notification>
        </Cell>
        <Cell>
          <Notification color="info" className="py-3">
            1
          </Notification>
        </Cell>
        <Cell rowSpan={2}>
          <Notification
            color="success"
            className="py-3"
            style={{ height: '100%' }}
          >
            rowSpan 2
          </Notification>
        </Cell>
        <Cell colStart={2} colSpan={2}>
          <Notification color="warning" className="py-3">
            colStart 2, colSpan 2
          </Notification>
        </Cell>
        <Cell>
          <Notification color="danger" className="py-3">
            2
          </Notification>
        </Cell>
        <Cell colSpan={3}>
          <Notification color="link" className="py-3">
            colSpan 3
          </Notification>
        </Cell>
      </Grid>
    ),
  },
];

const formSlides = [
  {
    key: 'autocomplete',
    title: 'Autocomplete',
    description:
      'An input with filtered dropdown suggestions and full keyboard navigation. Watch it search — then hover to try it yourself.',
    link: '/docs/api/form/autocomplete',
    linkLabel: 'Autocomplete Docs',
    demo: ({ active }) => <FormDemo kind="autocomplete" active={active} />,
  },
  {
    key: 'switch',
    title: 'Switch',
    description:
      'Toggle switches for on/off settings in every Bulma color and size, with rounded, thin, and outlined styles.',
    link: '/docs/api/form/switch',
    linkLabel: 'Switch Docs',
    demo: ({ active }) => <FormDemo kind="switch" active={active} />,
  },
  {
    key: 'numberinput',
    title: 'Numberinput',
    description:
      'A number input with increment and decrement buttons, min/max bounds, steps, and a stepper variant.',
    link: '/docs/api/form/numberinput',
    linkLabel: 'Numberinput Docs',
    demo: ({ active }) => <FormDemo kind="number" active={active} />,
  },
  {
    key: 'slider',
    title: 'Slider',
    description:
      'A range slider with single or dual thumbs, custom steps, tooltips, and vertical orientation.',
    link: '/docs/api/form/slider',
    linkLabel: 'Slider Docs',
    demo: ({ active }) => <FormDemo kind="slider" active={active} />,
  },
  {
    key: 'rate',
    title: 'Rate',
    description:
      'Star ratings with half-star precision, custom icons and counts, and read-only display mode.',
    link: '/docs/api/form/rate',
    linkLabel: 'Rate Docs',
    demo: ({ active }) => <FormDemo kind="rate" active={active} />,
  },
  {
    key: 'taginput',
    title: 'Taginput',
    description:
      'A tag and chip input with autocomplete suggestions, configurable confirm keys, and closable tags.',
    link: '/docs/api/form/taginput',
    linkLabel: 'Taginput Docs',
    demo: ({ active }) => <FormDemo kind="tags" active={active} />,
  },
];

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  const [copied, setCopied] = React.useState(false);

  const handleCopyNpm = () => {
    navigator.clipboard.writeText('npm install @allxsmith/bestax-bulma');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // GitHub Icon SVG
  const GitHubIcon = () => (
    <svg className={styles.githubIcon} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );

  // Copy Icon SVG
  const CopyIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      style={{ marginLeft: '8px' }}
    >
      <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
      <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
    </svg>
  );

  // Check Icon SVG (for copied state)
  const CheckIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      style={{ marginLeft: '8px' }}
    >
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
    </svg>
  );

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroContentBox}>
          <div className={styles.heroLogoTitleContainer}>
            <img
              src="/img/logo.svg"
              alt="Bestax Logo"
              className={styles.heroLogo}
            />
            <Heading as="h1" className={styles.heroTitle}>
              Bestax
            </Heading>
          </div>
          <p className={clsx('hero__subtitle', styles.hero__subtitle)}>
            A Bulma React Component Library
          </p>
          <div
            className={styles.npmInstallBox}
            onClick={handleCopyNpm}
            title={copied ? 'Copied!' : 'Click to copy'}
          >
            <code>npm install @allxsmith/bestax-bulma</code>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </div>
          <div className={styles.buttons}>
            <Link
              className={clsx(
                'button button--primary button--lg',
                styles.heroPrimaryButton
              )}
              to="/docs/guides/intro"
            >
              Get Started
            </Link>
            <a
              className={clsx('button button--lg', styles.heroGithubButton)}
              href="https://github.com/allxsmith/bestax"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

function PronunciationSection() {
  return (
    <section className={styles.pronunciationSection}>
      <div className="container">
        <div className={styles.pronunciationCard}>
          <Heading as="h2" className={styles.pronunciationHeading}>
            How to Pronounce Bestax
          </Heading>
          <div className={styles.pronunciationContent}>
            <div className={styles.pronunciationMain}>
              <div className={styles.pronunciationCorrect}>
                <strong>&ldquo;bee-stacks&rdquo;</strong>
              </div>
            </div>
            <p className={styles.pronunciationExplanation}>
              The name combines <strong>&ldquo;B&rdquo;</strong> (for Bulma) +{' '}
              <strong>&ldquo;stacks&rdquo;</strong> (component stacks), creating
              a memorable name that reflects building UIs with stacked Bulma
              components.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Welcome to ${siteConfig.title}`}
      description="Build awesome websites, with Bulma and React"
    >
      <HomepageHeader />
      <main>
        <AiReady />
        <HomepageFeatures />
        <HomepageCarousel
          heading="New in Bulma v1"
          intro="Brand new components from the latest Bulma v1, available now in Bestax-Bulma — every demo below is the real component, rendered live."
          slides={v1Slides}
          alt
        />
        <CategoryCards />
        <GapElements />
        <EnhancedAddons />
        <HomepageCarousel
          heading="Advanced Form Controls"
          intro="Form controls Bulma never shipped — autocomplete, switches, sliders, ratings, and tag inputs, all speaking fluent Bulma."
          slides={formSlides}
          interval={10000}
          hasDrag={false}
          arrow
          slideMinHeight="280px"
        />
        <PickerShowcase />
        <PronunciationSection />
      </main>
    </Layout>
  );
}
