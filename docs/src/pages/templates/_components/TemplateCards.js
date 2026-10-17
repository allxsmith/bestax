import React from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import { useClearQueryString } from '@docusaurus/theme-common';
import { sortedTemplates } from '@site/src/data/templates';
import shared from '@site/src/components/ComponentComparison/styles.module.css';
import { useFilteredTemplates, useIsFiltered } from '../_utils';
import TemplateCard from './TemplateCard';
import styles from './styles.module.css';

const favorites = sortedTemplates.filter(t => t.tags.includes('favorite'));
const others = sortedTemplates.filter(t => !t.tags.includes('favorite'));

function CardList({ heading, items }) {
  return (
    <>
      {heading}
      <ul className={clsx('clean-list', styles.grid)}>
        {items.map(template => (
          <TemplateCard key={template.slug} template={template} />
        ))}
      </ul>
    </>
  );
}

/**
 * Unfiltered, the favorites and then the rest, as the Docusaurus showcase
 * lists them; filtered, one list of the matches, or a way back when nothing
 * matches.
 */
export default function TemplateCards() {
  const filtered = useFilteredTemplates();
  const isFiltered = useIsFiltered();
  const clearAll = useClearQueryString();

  if (filtered.length === 0) {
    return (
      <section className="container margin-top--lg margin-bottom--xl">
        <div className={shared.empty}>
          <Heading as="h2">No results</Heading>
          <p>No template matches these filters.</p>
          <button type="button" className={shared.reset} onClick={clearAll}>
            Clear All
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="container margin-top--lg margin-bottom--xl">
      {isFiltered ? (
        <CardList
          heading={
            <Heading
              as="h2"
              className={clsx(shared.srOnly, styles.sectionHeading)}
            >
              Matching templates
            </Heading>
          }
          items={filtered}
        />
      ) : (
        <>
          {favorites.length > 0 && (
            <CardList
              heading={
                <Heading as="h2" className={styles.sectionHeading}>
                  Favorites
                </Heading>
              }
              items={favorites}
            />
          )}
          {others.length > 0 && (
            <CardList
              heading={
                <Heading as="h2" className={styles.sectionHeading}>
                  All templates
                </Heading>
              }
              items={others}
            />
          )}
        </>
      )}
    </section>
  );
}
