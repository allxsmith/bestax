import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import { templates } from '@site/src/data/templates';
import shared from '@site/src/components/ComponentComparison/styles.module.css';
import TemplateFilters from './_components/TemplateFilters';
import TemplateCards from './_components/TemplateCards';
import styles from './_components/styles.module.css';

const TITLE = 'Templates';
const DESCRIPTION =
  'Complete sites built with bestax that open in StackBlitz, ready to run and change.';
const AWESOME = 'https://github.com/aldi/awesome-bulma-templates';
const TRACKING_ISSUE = 'https://github.com/allxsmith/bestax/issues/1118';

function Header() {
  return (
    <header className={clsx('container', styles.header)}>
      <Heading as="h1">{TITLE}</Heading>
      <p>{DESCRIPTION}</p>
      <p className={styles.credit}>
        Free Bulma templates from aldi&apos;s{' '}
        <Link href={AWESOME}>awesome-bulma-templates</Link>, rebuilt with bestax
        components. Each card credits its original author.
      </p>
    </header>
  );
}

/** While no template has landed, say so rather than show empty filters. */
function NoTemplatesYet() {
  return (
    <section className="container margin-bottom--xl">
      <div className={shared.empty}>
        <p>
          No templates are published yet. The first ports are in progress; the{' '}
          <Link href={TRACKING_ISSUE}>tracking issue</Link> lists them.
        </p>
      </div>
    </section>
  );
}

/**
 * The Templates page, modeled on the Docusaurus showcase. The data lives in
 * src/data/templates.js and each card's screenshot in static/img/templates/.
 */
export default function Templates() {
  return (
    <Layout title={TITLE} description={DESCRIPTION}>
      <main className="margin-vert--lg">
        <Header />
        {templates.length === 0 ? (
          <NoTemplatesYet />
        ) : (
          <>
            <TemplateFilters />
            <TemplateCards />
          </>
        )}
      </main>
    </Layout>
  );
}
