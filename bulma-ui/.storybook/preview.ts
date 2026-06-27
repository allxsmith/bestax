import type { Preview } from '@storybook/react-vite';
import { create } from 'storybook/theming';
import 'bulma/css/bulma.min.css';
import 'bulma/css/versions/bulma-prefixed.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@mdi/font/css/materialdesignicons.min.css';
// Ionicons v8 are web components registered via the ESM loader in
// preview-head.html (matching the docs site); no CSS import needed.
import 'material-icons/iconfont/material-icons.css';
import 'material-symbols/index.css';
// Import extras SCSS for component styles
import '../src/scss/extras.scss';
// Skill-example styles (Storybook-only — NOT part of the shipped CSS bundle)
import '../src/skill-examples/ribbon.scss';

// Determine theme based on system preference
const prefersDark =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

const docsTheme = create({
  base: prefersDark ? 'dark' : 'light',
  // Text colors for better contrast
  textColor: prefersDark ? '#e4e4e4' : '#363636',
  textInverseColor: prefersDark ? '#363636' : '#ffffff',

  // Make sure links and text are readable
  colorPrimary: '#3273dc',
  colorSecondary: '#485fc7',
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
    },
  },
};

export default preview;
