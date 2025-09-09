import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import styles from './index.module.css';

// Source: docs/docs/guides/intro.md
const categories = [
  {
    heading: 'Elements',
    blurb:
      'Basic Bulma elements made available as React components for fast, consistent UIs.',
    items: [
      {
        name: 'Block',
        link: '/docs/api/elements/block',
        desc: 'Container with margin bottom. Great for consistent spacing.',
      },
      {
        name: 'Box',
        link: '/docs/api/elements/box',
        desc: 'Container with optional color/shadow.',
      },
      {
        name: 'Button',
        link: '/docs/api/elements/button',
        desc: 'The most awesome button in existence.',
      },
      {
        name: 'Buttons',
        link: '/docs/api/elements/buttons',
        desc: 'A container for grouping buttons.',
      },
      {
        name: 'Content',
        link: '/docs/api/elements/content',
        desc: 'Container for html content, great for content from services and editors.',
      },
      {
        name: 'Delete',
        link: '/docs/api/elements/delete',
        desc: 'Signify delete or close. Useful in tons of situations.',
      },
      {
        name: 'Icon',
        link: '/docs/api/elements/icon',
        desc: 'Standardized icon wrapper for Bulma/Font Awesome.',
      },
      {
        name: 'Image',
        link: '/docs/api/elements/image',
        desc: 'Container for images, fixed and responsive.',
      },
      {
        name: 'Notification',
        link: '/docs/api/elements/notification',
        desc: 'A colored block to notify.',
      },
      {
        name: 'Progress',
        link: '/docs/api/elements/progress',
        desc: 'A decent looking progress bar.',
      },
      {
        name: 'Skeleton',
        link: '/docs/api/elements/skeleton',
        desc: 'Bulma-styled skeleton loader for indicating loading state.',
      },
      {
        name: 'Table',
        link: '/docs/api/elements/table',
        desc: 'Thead, Tbody, Tfoot, Td, Th, Tr for styled tables.',
      },
      {
        name: 'Tag',
        link: '/docs/api/elements/tag',
        desc: 'Labels with colors and sizes.',
      },
      {
        name: 'Tags',
        link: '/docs/api/elements/tags',
        desc: 'Group tags together.',
      },
      {
        name: 'Title',
        link: '/docs/api/elements/title',
        desc: 'A styled title.',
      },
      {
        name: 'SubTitle',
        link: '/docs/api/elements/subtitle',
        desc: 'A styled SubTitle, goes well under a Title.',
      },
    ],
  },
  {
    heading: 'Components',
    blurb:
      'Reusable UI widgets and navigation components for building interactive applications.',
    items: [
      {
        name: 'Breadcrumb',
        link: '/docs/api/components/breadcrumb',
        desc: 'A breadcrumb to help users navigate.',
      },
      {
        name: 'Card',
        link: '/docs/api/components/card',
        desc: 'Content card with header, image, content, and footer.',
      },
      {
        name: 'Dropdown',
        link: '/docs/api/components/dropdown',
        desc: 'A dropdown menu, kinda like select, but not a select.',
      },
      {
        name: 'Menu',
        link: '/docs/api/components/menu',
        desc: 'Vertical navigation menu with nested items.',
      },
      {
        name: 'Message',
        link: '/docs/api/components/message',
        desc: 'Colored message blocks, great for emphasis.',
      },
      {
        name: 'Modal',
        link: '/docs/api/components/modal',
        desc: 'A Modal or dialog box.',
      },
      {
        name: 'Navbar',
        link: '/docs/api/components/navbar',
        desc: 'Responsive top navigation bar and items.',
      },
      {
        name: 'Pagination',
        link: '/docs/api/components/pagination',
        desc: 'A pagination bar for navigating multiple pages of results.',
      },
      {
        name: 'Panel',
        link: '/docs/api/components/panel',
        desc: 'Sidebar menu/panel with subcomponents (tabs, blocks, icons).',
      },
      {
        name: 'Tabs/Tab',
        link: '/docs/api/components/tabs',
        desc: 'Tab navigation with tab list and tab item.',
      },
    ],
  },
  {
    heading: 'Form',
    blurb:
      'Accessible, fully styled form controls and layout, supporting all Bulma modifiers.',
    items: [
      {
        name: 'Field',
        link: '/docs/api/form/field',
        desc: 'Form field wrapper with label and layout.',
      },
      {
        name: 'Control',
        link: '/docs/api/form/control',
        desc: 'Form control container (handles icons, loading, etc).',
      },
      {
        name: 'Input',
        link: '/docs/api/form/input',
        desc: 'Styled input field.',
      },
      {
        name: 'Select',
        link: '/docs/api/form/select',
        desc: 'Styled select dropdown.',
      },
      { name: 'File', link: '/docs/api/form/file', desc: 'File input.' },
      {
        name: 'Radio & Radios',
        link: '/docs/api/form/radio',
        desc: 'Radio button and grouped radios.',
      },
      {
        name: 'Checkbox & Checkboxes',
        link: '/docs/api/form/checkbox',
        desc: 'Checkbox and grouped checkboxes.',
      },
      {
        name: 'TextArea',
        link: '/docs/api/form/textarea',
        desc: 'Styled textarea field.',
      },
    ],
  },
  {
    heading: 'Layout',
    blurb: 'High-level layout primitives for structuring your app and pages.',
    items: [
      {
        name: 'Container',
        link: '/docs/api/layout/container',
        desc: 'Responsive maximum width container.',
      },
      {
        name: 'Section',
        link: '/docs/api/layout/section',
        desc: 'Page section wrapper.',
      },
      {
        name: 'Hero',
        link: '/docs/api/layout/hero',
        desc: 'Prominent hero banner (with Hero.Head, Hero.Body, Hero.Foot).',
      },
      {
        name: 'Level',
        link: '/docs/api/layout/level',
        desc: 'Horizontal alignment container and items.',
      },
      {
        name: 'Media',
        link: '/docs/api/layout/media',
        desc: 'Flexible media object for avatars/media + content.',
      },
      { name: 'Footer', link: '/docs/api/layout/footer', desc: 'Page footer.' },
    ],
  },
  {
    heading: 'Columns',
    blurb:
      'Responsive and flexible row-column layouts using Bulma’s columns system.',
    items: [
      {
        name: 'Columns',
        link: '/docs/api/columns',
        desc: 'Row container for columns.',
      },
      {
        name: 'Column',
        link: '/docs/api/columns/column',
        desc: 'Individual grid column.',
      },
    ],
  },
  {
    heading: 'Grid',
    blurb:
      'CSS Grid support, using Bulma’s new grid utilities for advanced layouts.',
    items: [
      { name: 'Grid', link: '/docs/api/grid', desc: 'CSS grid container.' },
      { name: 'Cell', link: '/docs/api/grid/cell', desc: 'CSS grid cell.' },
    ],
  },
  {
    heading: 'Helpers',
    blurb:
      'Little helpers for translating properties to Bulma classes, recommended for custom Bulma-powered components.',
    items: [
      {
        name: 'classNames',
        link: '/docs/api/helpers/classnames',
        desc: 'Our internal class name generator.',
      },
      {
        name: 'useBulmaClasses',
        link: '/docs/api/helpers/usebulmaclasses',
        desc: 'Handles the translation from property to bulma classes.',
      },
    ],
  },
];

function V1ComponentList() {
  return (
    <section className={styles.v1ListSection}>
      <div className="container">
        <Heading as="h2" className={styles.v1ListHeading}>
          New Features
        </Heading>
        <p className={styles.v1ListIntro}>
          These are brand new components found in the latest Bulma v1, and now
          available in Bestax-Bulma!
        </p>
        <div className={styles.v1List}>
          <Heading as="h3" className={styles.v1ListComponentHeading}>
            <Link to="/docs/api/elements/skeleton">Skeleton</Link>
          </Heading>
          <p>
            The{' '}
            <Link to="/docs/api/elements/skeleton">
              <strong>Skeleton</strong>
            </Link>{' '}
            component is a Bulma-styled skeleton loader for React, designed to
            visually indicate that content is loading. It provides block and
            multi-line placeholder variants, and can be used as a direct
            component or applied to compatible components using the{' '}
            <code>skeleton</code> prop or <code>useBulmaClasses</code>.
            Skeletons help improve perceived performance by showing a loading
            state before real content appears.
          </p>
          <Heading as="h3" className={styles.v1ListComponentHeading}>
            <Link to="/docs/api/grid">Grid &amp; Cell</Link>
          </Heading>
          <p>
            The{' '}
            <Link to="/docs/api/grid">
              <strong>Grid</strong>
            </Link>{' '}
            component brings Bulma&amp;s advanced CSS Grid layout to React,
            supporting both responsive and fixed grid modes, gap and column
            controls, and multiple breakpoints. Use{' '}
            <Link to="/docs/api/grid/cell">
              <strong>Cell</strong>
            </Link>{' '}
            inside a{' '}
            <Link to="/docs/api/grid">
              <strong>Grid</strong>
            </Link>{' '}
            to place individual items, control their span, and manage layout at
            a granular level. These components allow for complex, modern layouts
            with full Bulma utility support, including color, background, and
            spacing helpers.
          </p>
        </div>
      </div>
    </section>
  );
}

// Existing Features Section: h2, then h3 per category, with blurb and list
function ComponentLibrarySections() {
  return (
    <section className={styles.existingFeaturesSection}>
      <div className="container">
        <Heading as="h2" className={styles.existingFeaturesHeading}>
          Bulma Supported Components
        </Heading>
        {categories.map(cat => (
          <div key={cat.heading} className={styles.componentCategorySection}>
            <Heading as="h3" className={styles.categoryHeading}>
              {cat.heading}
            </Heading>
            <p className={styles.categoryBlurb}>{cat.blurb}</p>
            <ul className={styles.categoryList}>
              {cat.items.map(item => (
                <li key={item.name} className={styles.categoryListItem}>
                  <Link to={item.link} className={styles.categoryLink}>
                    <strong>{item.name}</strong>
                  </Link>
                  <span className={styles.categoryDesc}> – {item.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className={clsx('hero__subtitle', styles.hero__subtitle)}>
          {siteConfig.tagline}
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/guides/intro"
          >
            Getting Started
          </Link>
        </div>
      </div>
    </header>
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
        <HomepageFeatures />
        <V1ComponentList />
        <ComponentLibrarySections />
      </main>
    </Layout>
  );
}
