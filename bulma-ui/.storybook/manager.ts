import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

const lightTheme = create({
  base: 'light',
  brandTitle: 'Bestax Bulma',
  brandUrl: 'https://bestax.io',
  brandImage: '/img/logo.svg',
  brandTarget: '_self',
  // Control logo size
  layoutMargin: 10,
});

const darkTheme = create({
  base: 'dark',
  brandTitle: 'Bestax Bulma',
  brandUrl: 'https://bestax.io',
  brandImage: '/img/logo.svg',
  brandTarget: '_self',
  // Control logo size
  layoutMargin: 10,
});

// Detect system preference and set initial theme
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

addons.setConfig({
  theme: prefersDark ? darkTheme : lightTheme,
});
