// Metadata header for a "Skill Example": the skill invoked (linked to its
// SKILL.md), the prompt given to the agent, and the model + date it was generated.
// Shared by the Storybook skill-example stories.
import React from 'react';

export interface ExampleMetaProps {
  /** Skill slug, e.g. "bestax-custom-component". */
  skill: string;
  /** Link to the skill's SKILL.md. */
  skillHref: string;
  /** Natural-language request given to the agent. */
  prompt: string;
  /** Model that generated the example, e.g. "Claude Opus 4.8". */
  model: string;
  /** Date generated, e.g. "2026-06-27". */
  date: string;
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontWeight: 700,
  color: 'var(--bulma-text-weak)',
};

export const ExampleMeta: React.FC<ExampleMetaProps> = ({
  skill,
  skillHref,
  prompt,
  model,
  date,
}) => (
  <div
    style={{
      border: '1px solid var(--bulma-border)',
      borderLeft: '5px solid var(--bulma-info)',
      borderRadius: '6px',
      background: 'var(--bulma-scheme-main-bis)',
      padding: '1rem 1.25rem',
      marginBottom: '1.5rem',
    }}
  >
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.4rem 1.5rem',
        marginBottom: '0.6rem',
      }}
    >
      <span>
        <span style={labelStyle}>Skill&nbsp;</span>
        <a href={skillHref} target="_blank" rel="noopener noreferrer">
          <code>{skill}</code>
        </a>
      </span>
      <span>
        <span style={labelStyle}>Model&nbsp;</span>
        {model}
      </span>
      <span>
        <span style={labelStyle}>Generated&nbsp;</span>
        {date}
      </span>
    </div>
    <div style={{ ...labelStyle, marginBottom: '0.3rem' }}>Prompt</div>
    <pre
      style={{
        margin: 0,
        padding: '0.75rem 1rem',
        borderRadius: '4px',
        background: 'var(--bulma-scheme-main-ter)',
        color: 'var(--bulma-text-strong)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '0.9rem',
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
      }}
    >
      {prompt}
    </pre>
  </div>
);

export default ExampleMeta;
