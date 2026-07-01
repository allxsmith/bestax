// Metadata header for a docs "Skill Example": the skill invoked (linked to its
// SKILL.md) plus the model + date it was generated. The prompt itself is rendered
// separately as a "### Prompt" subsection + code block in each MDX page.
// Imported by the skill MDX pages under docs/skills/.
import React from 'react';
import styles from './styles.module.css';

export default function ExampleMeta({ skill, skillHref, model, date }) {
  return (
    <div className={styles.meta}>
      <div className={styles.row}>
        <span>
          <span className={styles.label}>Skill </span>
          <a href={skillHref} target="_blank" rel="noopener noreferrer">
            <code>{skill}</code>
          </a>
        </span>
        <span>
          <span className={styles.label}>Model </span>
          {model}
        </span>
        <span>
          <span className={styles.label}>Generated </span>
          {date}
        </span>
      </div>
    </div>
  );
}
