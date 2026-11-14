import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';
import { ACCENT } from './accent';

const lightTheme = create({
  base: 'light',
  brandTitle: 'Bestax Bulma',
  brandUrl: 'https://bestax.io',
  brandImage: '/img/logo.svg',
  brandTarget: '_self',
  colorPrimary: ACCENT.light,
  colorSecondary: ACCENT.light,
});

const darkTheme = create({
  base: 'dark',
  brandTitle: 'Bestax Bulma',
  brandUrl: 'https://bestax.io',
  brandImage: '/img/logo.svg',
  brandTarget: '_self',
  colorPrimary: ACCENT.dark,
  colorSecondary: ACCENT.dark,
});

// Detect system preference and set initial theme
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

addons.setConfig({
  theme: prefersDark ? darkTheme : lightTheme,
});
