import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// Extend Window interface for GTM
declare global {
  interface Window {
    dataLayer: any[];
  }
}

const lightTheme = create({
  base: 'light',
  brandTitle: 'Bestax Bulma',
  brandUrl: 'https://bestax.io',
  brandImage: '/logo.svg',
  brandTarget: '_self',
  // Control logo size
  layoutMargin: 10,
});

const darkTheme = create({
  base: 'dark',
  brandTitle: 'Bestax Bulma',
  brandUrl: 'https://bestax.io',
  brandImage: '/logo.svg',
  brandTarget: '_self',
  // Control logo size
  layoutMargin: 10,
});

// Detect system preference and set initial theme
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

addons.setConfig({
  theme: prefersDark ? darkTheme : lightTheme,
});

// Google Tag Manager integration
if (typeof window !== 'undefined') {
  // Load GTM script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-KKBQGEHBY7';
  document.head.appendChild(script);

  // Initialize GTM
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', 'G-KKBQGEHBY7', {
    anonymize_ip: true,
  });
}
