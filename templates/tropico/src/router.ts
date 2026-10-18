import { useSyncExternalStore } from 'react';

/**
 * Where each page lives. The original is four HTML files that link to each
 * other; here they are one app, and the page is the part of the address
 * after `#`, so any static host and StackBlitz's preview serve every page
 * from index.html, with no server rewrite and no router package.
 */
export const paths = {
  home: '#/',
  fruits: '#/fruits',
  services: '#/services',
  contact: '#/contact',
} as const;

export type Page = keyof typeof paths;

const pages = Object.keys(paths) as Page[];

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/**
 * The page the address names, kept current as links change it. An address
 * that names no page, an empty one included, is the home page.
 */
export function usePage(): Page {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => ''
  );
  return pages.find(page => paths[page] === hash) ?? 'home';
}
