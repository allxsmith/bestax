import React, { useId } from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import { useClearQueryString } from '@docusaurus/theme-common';
import { Tags, TagList, templates } from '@site/src/data/templates';
import shared from '@site/src/components/ComponentComparison/styles.module.css';
import {
  useFilteredTemplates,
  useOperator,
  useSearchName,
  useTags,
} from '../_utils';
import styles from './styles.module.css';

/** One tag's checkbox, drawn as a chip; its description is the tooltip. */
function TagCheckbox({ tag }) {
  const id = useId();
  const [tags, setTags] = useTags();
  const { label, description, color } = Tags[tag];
  const checked = tags.includes(tag);
  const toggle = () =>
    setTags(list =>
      list.includes(tag) ? list.filter(t => t !== tag) : [...list, tag]
    );
  return (
    <li>
      <input
        id={id}
        type="checkbox"
        className={clsx(shared.srOnly, styles.tagInput)}
        checked={checked}
        onChange={toggle}
        aria-describedby={`${id}-description`}
      />
      <label
        htmlFor={id}
        title={description}
        className={clsx(shared.chip, checked && shared.chipOn)}
        style={{ '--lib-color': color }}
      >
        <span className={shared.chipSwatch} aria-hidden="true" />
        {label}
      </label>
      <span id={`${id}-description`} hidden>
        {description}
      </span>
    </li>
  );
}

/** OR shows a template with any picked tag, AND only one with all of them. */
function OperatorToggle() {
  const id = useId();
  const [operator, toggle] = useOperator();
  return (
    <span>
      <input
        id={id}
        type="checkbox"
        className={clsx(shared.srOnly, styles.operatorInput)}
        checked={operator === 'AND'}
        onChange={toggle}
      />
      <label
        htmlFor={id}
        className={styles.operatorLabel}
        title="OR shows templates with any picked tag, AND only those with all of them"
      >
        <span className={shared.srOnly}>Match all picked tags</span>
        <span
          aria-hidden="true"
          className={clsx(styles.op, operator === 'OR' && styles.opOn)}
        >
          OR
        </span>
        <span
          aria-hidden="true"
          className={clsx(styles.op, operator === 'AND' && styles.opOn)}
        >
          AND
        </span>
      </label>
    </span>
  );
}

function ResultCount() {
  const shown = useFilteredTemplates().length;
  const total = templates.length;
  const noun = n => (n === 1 ? 'template' : 'templates');
  return (
    <p className={shared.resultCount} aria-live="polite">
      {shown === total
        ? `${total} ${noun(total)}`
        : `Showing ${shown} of ${total} ${noun(total)}`}
    </p>
  );
}

export default function TemplateFilters() {
  const [name, setName] = useSearchName();
  const clearAll = useClearQueryString();
  return (
    <section className="container">
      <div className={shared.filters}>
        <div className={styles.filtersHead}>
          <Heading as="h2" className={styles.filtersTitle}>
            Filters
          </Heading>
          <ResultCount />
        </div>
        <fieldset className={styles.tagSet}>
          <legend className={shared.filterLabel}>Tags</legend>
          <ul className={clsx('clean-list', shared.chips)}>
            {TagList.map(tag => (
              <TagCheckbox key={tag} tag={tag} />
            ))}
          </ul>
        </fieldset>
        <div className={shared.filterRow}>
          <label className={shared.search}>
            <span className={shared.srOnly}>
              Search templates by title, description or author
            </span>
            <input
              type="search"
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Search by title, description or author"
            />
          </label>
          <OperatorToggle />
          <button type="button" className={shared.reset} onClick={clearAll}>
            Clear All
          </button>
        </div>
      </div>
    </section>
  );
}
