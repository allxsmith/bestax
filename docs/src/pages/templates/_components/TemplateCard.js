import React from 'react';
import clsx from 'clsx';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Heading from '@theme/Heading';
import IconExternalLink from '@theme/Icon/ExternalLink';
import { Tags, TagList } from '@site/src/data/templates';
import shared from '@site/src/components/ComponentComparison/styles.module.css';
import { codeUrl, stackblitzUrl } from '../_utils';
import styles from './styles.module.css';

/**
 * A link to another site, in a new tab. Plain anchors rather than the SDK, so
 * a middle-click, a copied link and a page without JavaScript all work.
 */
function NewTab({ href, className, children, says = 'opens in a new tab' }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
      <span className={shared.srOnly}> ({says})</span>
    </a>
  );
}

/**
 * One template: the screenshot and title open the bestax version in
 * StackBlitz, and the footer credits the original and links the code.
 */
export default function TemplateCard({ template }) {
  const { slug, title, description, author, source, tags } = template;
  const image = useBaseUrl(`/img/templates/${slug}.jpg`);
  const stackblitz = stackblitzUrl(slug);
  const opens = 'opens StackBlitz in a new tab';
  return (
    <li className={styles.card}>
      <NewTab href={stackblitz} className={styles.shot} says={opens}>
        <img
          src={image}
          alt={`Screenshot of the ${title} template`}
          width={1280}
          height={800}
          loading="lazy"
          decoding="async"
        />
      </NewTab>
      <div className={styles.body}>
        <Heading as="h3" className={styles.title}>
          <NewTab href={stackblitz} says={opens}>
            {title}
            <IconExternalLink width={12} height={12} />
          </NewTab>
        </Heading>
        <p className={styles.description}>{description}</p>
        <ul className={clsx('clean-list', styles.tags)}>
          {TagList.filter(tag => tags.includes(tag)).map(tag => (
            <li
              key={tag}
              title={Tags[tag].description}
              style={{ '--tag-color': Tags[tag].color }}
            >
              <span className={styles.swatch} aria-hidden="true" />
              {Tags[tag].label}
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.footer}>
        <NewTab href={source}>
          Original by {author.name}
          <IconExternalLink width={11} height={11} />
        </NewTab>
        <NewTab href={codeUrl(slug)} says="on GitHub, opens in a new tab">
          Code
          <span className={shared.srOnly}> for {title}</span>
          <IconExternalLink width={11} height={11} />
        </NewTab>
      </div>
    </li>
  );
}
