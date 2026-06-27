// Metadata header for a docs "Skill Example": the skill invoked (linked to its
// SKILL.md), the prompt given to the agent, and the model + date it was generated.
// Imported by the MDX example pages under docs/skills/examples/.
import React from 'react';
import styles from './styles.module.css';

export default function ExampleMeta({ skill, skillHref, prompt, model, date }) {
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
      <div className={styles.prompt}>
        <span className={styles.label}>Prompt ▸ </span>“{prompt}”
      </div>
    </div>
  );
}
