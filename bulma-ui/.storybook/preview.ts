import type { Preview } from '@storybook/react-vite';
import { create } from 'storybook/theming';
import { ACCENT } from './accent';
import { componentDescription } from './componentDescription';
// bestax's own stylesheets, compiled from the Sass entry points the package
// builds `versions/bestax-prefixed.css` and `bestax.css` from: Bulma with
// bestax's configuration, and the extras. A story shows the CSS a user
// installs, and the icon sheets load after it, as create-bestax writes them.
//
// The prefixed sheet loads first. Both sheets declare the scheme on `:root`,
// and each switches it only from its own attribute (`data-theme` for the
// plain build, `data-bestax-theme` for the prefixed one), so the later sheet's
// `:root` overrides the earlier sheet's attribute. With the plain build last,
// `data-theme`, which `Theme colorMode` writes, switches the scheme for plain
// and prefixed stories alike, and `data-bestax-theme` is the one that loses.
import '../src/scss/versions/bestax-prefixed.scss';
import '../src/scss/bestax.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@mdi/font/css/materialdesignicons.min.css';
// Ionicons v8 are web components registered via the ESM loader in
// preview-head.html (matching the docs site); no CSS import needed.
import 'material-icons/iconfont/material-icons.css';
import 'material-symbols/index.css';
// Skill-example styles (Storybook-only — NOT part of the shipped CSS bundle)
import '../src/skill-examples/profilecard.scss';

// Determine theme based on system preference
const prefersDark =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

const docsTheme = create({
  base: prefersDark ? 'dark' : 'light',
  // Text colors for better contrast
  textColor: prefersDark ? '#e4e4e4' : '#363636',
  textInverseColor: prefersDark ? '#363636' : '#ffffff',

  // The bestax accent, as the manager uses
  colorPrimary: prefersDark ? ACCENT.dark : ACCENT.light,
  colorSecondary: prefersDark ? ACCENT.dark : ACCENT.light,
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          'Quick Start',
          'Elements',
          'Components',
          'Form',
          'Columns',
          'Grid',
          'Layout',
          'Helpers',
          'Skills',
          // The Skills section opens on its Overview, then lists the
          // skills in the default order.
          ['Overview', '*'],
        ],
      },
    },
    sidebar: {
      collapsedRoots: [
        'Quick Start',
        'Elements',
        'Components',
        'Form',
        'Columns',
        'Grid',
        'Layout',
        'Helpers',
        'Skills',
      ],
    },
    docs: {
      theme: docsTheme,
      extractComponentDescription: componentDescription,
    },
    // axe checks every story once it has rendered and played, and in the
    // browser pass (`test-storybook`) a violation fails the story (#2182).
    // Only the WCAG 2.0, 2.1 and 2.2 Level A and AA rules run: axe's
    // best-practice rules expect a whole page, with landmarks and a top-level
    // heading, and a story is one component. `color-contrast` stays off until
    // #2188 settles Bulma's stock colors. A story that has to relax a rule
    // says so in its own `a11y.config.rules` and has an entry, with its issue
    // or reason, in `src/__tests__/stories-a11y.test.ts`.
    a11y: {
      test: 'error',
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
        },
        rules: { 'color-contrast': { enabled: false } },
      },
    },
  },
};

export default preview;
