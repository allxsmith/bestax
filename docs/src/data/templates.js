/**
 * The Templates page's data (src/pages/templates), kept the way the Docusaurus
 * showcase keeps its sites in users.tsx.
 *
 * Each entry is one folder under templates/ at the repo root: a Bulma
 * template from aldi's awesome-bulma-templates, ported to bestax.
 * templates/CLAUDE.md is the porting guide, and scripts/templates.test.mjs
 * holds every entry to the shape below, to its folder and to its screenshot,
 * and every folder and screenshot to an entry.
 *
 * An entry:
 *
 * - `slug`: the folder's name under templates/, and the screenshot's, as
 *   static/img/templates/<slug>.jpg (`pnpm --filter @allxsmith/bestax-docs
 *   screenshot:template <slug>` writes it).
 * - `title`, `description`: the card's heading and blurb.
 * - `author`: `{ name, url }` for whoever made the original.
 * - `source`: the upstream repository, which the card credits.
 * - `sourceSha`: the upstream commit the port was made from, in full.
 * - `demo`: the upstream's live site, to check the port against. The card
 *   never links it: a card opens the bestax version.
 * - `license`: the upstream license, as an SPDX identifier from LICENSES in
 *   scripts/lib/templates.mjs. The mirror's README names it per template.
 * - `copyright`: the upstream LICENSE's copyright line, verbatim, which the
 *   template's own LICENSE has to carry.
 * - `tags`: keys of `Tags`.
 *
 * No imports, since scripts/templates.test.mjs and
 * scripts/gen-templates-repo.mjs read this file as it is.
 */

/**
 * The repository templates/ is published to, which StackBlitz imports a
 * template from: a small mirror, because importing from the monorepo clones
 * all of it. scripts/gen-templates-repo.mjs writes its tree, and
 * CONTRIBUTING.md ("The bestax-templates repository") says how it is kept.
 */
export const TEMPLATES_REPO = 'allxsmith/bestax-templates';

/** Where a template opens: its folder in the mirror, in StackBlitz, on App.tsx. */
export const stackblitzUrl = slug =>
  `https://stackblitz.com/github/${TEMPLATES_REPO}/tree/main/${slug}?file=src/App.tsx`;

/** The filters, in the order the page shows them. */
export const Tags = {
  favorite: {
    label: 'Favorite',
    description: 'Our picks to start from',
    color: '#e64980',
  },
  landing: {
    label: 'Landing page',
    description: 'A single page for a product, an app or a launch',
    color: '#1c7ed6',
  },
  form: {
    label: 'Form',
    description: 'Built around a form, such as sign-in or registration',
    color: '#0c8599',
  },
  personal: {
    label: 'Personal',
    description: 'A personal site, portfolio or CV',
    color: '#845ef7',
  },
  business: {
    label: 'Business',
    description: 'A site for a business, a shop or a service',
    color: '#5c7cfa',
  },
  event: {
    label: 'Event',
    description: 'An event, such as a wedding or a conference',
    color: '#e8590c',
  },
  multipage: {
    label: 'Multi-page',
    description: 'More than one page',
    color: '#2f9e44',
  },
  darkmode: {
    label: 'Dark mode',
    description: 'Has a dark theme or a light and dark toggle',
    color: '#868e96',
  },
  carousel: {
    label: 'Carousel',
    description: 'Includes an image carousel',
    color: '#c77700',
  },
};

export const TagList = Object.keys(Tags);

/** The templates. */
export const templates = [
  {
    slug: 'login',
    title: 'Login',
    description:
      'A sign-in page on a frosted glass card, with social login buttons and a language picker.',
    author: { name: 'aldi', url: 'https://github.com/aldi' },
    source: 'https://github.com/aldi/bulma-login-template',
    sourceSha: '4f6c09947e045152ce73bc6a184d22f42f8493e9',
    demo: 'https://aldi.github.io/bulma-login-template/',
    license: 'MIT',
    copyright: 'Copyright (c) 2026 - github.com/aldi',
    tags: ['favorite', 'form'],
  },
  {
    slug: 'coming-soon',
    title: 'Coming Soon',
    description:
      'A full-screen launch page over a misty highway, with round social buttons and an email signup.',
    author: { name: 'aldi', url: 'https://github.com/aldi' },
    source: 'https://github.com/aldi/bulma-coming-soon-template',
    sourceSha: '7a9d786fe0bc610ec174b2a0a11e994051339345',
    demo: 'https://aldi.github.io/bulma-coming-soon-template/',
    license: 'MIT',
    copyright: 'Copyright (c) 2026 - github.com/aldi',
    tags: ['landing'],
  },
];

/** Favorites first, then by title. */
function sortTemplates(list) {
  const favorite = template => (template.tags.includes('favorite') ? 0 : 1);
  return [...list].sort(
    (a, b) => favorite(a) - favorite(b) || a.title.localeCompare(b.title)
  );
}

export const sortedTemplates = sortTemplates(templates);
