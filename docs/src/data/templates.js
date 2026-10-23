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
  {
    slug: 'cv',
    title: 'CV',
    description:
      'A one-page CV with a full-height portrait, social profile buttons and a light and dark toggle.',
    author: { name: 'aldi', url: 'https://github.com/aldi' },
    source: 'https://github.com/aldi/bulma-cv-template',
    sourceSha: '29108ebb52030480ee40c8224d2f6f8a3587926d',
    demo: 'https://aldi.github.io/bulma-cv-template/',
    license: 'MIT',
    copyright: 'Copyright (c) 2026 - github.com/aldi',
    tags: ['personal', 'darkmode'],
  },
  {
    slug: 'event-participation',
    title: 'Event Participation',
    description:
      'An invitation where guests pick the talks they will attend from a program on a frosted gold panel, with a light and dark toggle.',
    author: { name: 'aldi', url: 'https://github.com/aldi' },
    source: 'https://github.com/aldi/bulma-event-participation-template',
    sourceSha: '836934566b51c595b76c0c7d7ef524edf593e46d',
    demo: 'https://aldi.github.io/bulma-event-participation-template/',
    license: 'MIT',
    copyright: 'Copyright (c) 2026 - github.com/aldi',
    tags: ['event', 'form', 'darkmode'],
  },
  {
    slug: 'rent',
    title: 'Rent',
    description:
      'A rental listings landing page with a search box, listing cards, and rentals by state and neighborhood.',
    author: { name: 'aldi', url: 'https://github.com/aldi' },
    source: 'https://github.com/aldi/bulma-rent-template',
    sourceSha: '3d6bff06730d7274ab11f29f9b1c663819125dab',
    demo: 'https://aldi.github.io/bulma-rent-template/',
    license: 'MIT',
    copyright: 'Copyright (c) 2020 aldi (aldi)',
    tags: ['landing', 'business'],
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
