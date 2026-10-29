import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HiveHero from '@site/src/components/HiveHero';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import HomepageCarousel from '@site/src/components/HomepageCarousel';
import FormDemo from '@site/src/components/HomepageCarousel/FormDemo';
import CategoryCards from '@site/src/components/CategoryCards';
import GapElements from '@site/src/components/GapElements';
import EnhancedAddons from '@site/src/components/EnhancedAddons';
import PickerShowcase from '@site/src/components/PickerShowcase';
import AiReady from '@site/src/components/AiReady';
import CreateBestax from '@site/src/components/CreateBestax';
import Heading from '@theme/Heading';
import styles from './index.module.css';

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
      <HiveHero />
      <main>
        <AiReady />
        <HomepageFeatures />
        <CreateBestax />
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
