import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useLocation } from '@docusaurus/router';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

/**
 * Components opens the API sidebar. Its first page is the Elements
 * index, because /docs/api is not a page.
 */
const NEXT = [
  {
    to: '/docs/guides/intro',
    label: 'Quick Start',
    detail: 'Install bestax and render a first component.',
  },
  {
    to: '/docs/category/elements',
    label: 'Components',
    detail: 'Elements, components, forms, and layout.',
  },
  {
    to: '/templates',
    label: 'Templates',
    detail: 'Bulma templates ported to bestax.',
  },
  {
    to: '/blog',
    label: 'Blog',
    detail: 'Posts about the library.',
  },
];

/**
 * A hint from the requested path. /404.html is what the build renders,
 * so this only runs in the browser, where the address is the one that
 * missed.
 */
function under(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function PathHint() {
  const { pathname } = useLocation();

  if (under(pathname, '/docs/api')) {
    return (
      <p className={styles.hint}>
        This address is under the component docs. Try{' '}
        <Link to="/docs/category/elements">the component index</Link>.
      </p>
    );
  }

  if (under(pathname, '/blog')) {
    return (
      <p className={styles.hint}>
        This address is under the blog. Try{' '}
        <Link to="/blog">the blog index</Link>.
      </p>
    );
  }

  return null;
}

function Mark() {
  const logo = useBaseUrl('/img/logo.svg');
  return (
    <div className={styles.mark}>
      <img src={logo} alt="" width={72} height={72} />
    </div>
  );
}

export default function NotFoundContent({ className }) {
  return (
    <main className={clsx('margin-vert--xl', styles.main, className)}>
      <Mark />
      <Heading as="h1" className={styles.title}>
        Page not found
      </Heading>
      <p className={styles.lead}>Nothing on bestax.io lives at this address.</p>
      <p className={styles.lead}>
        It may have moved, or the link may be out of date.
      </p>
      <BrowserOnly>{() => <PathHint />}</BrowserOnly>
      <nav className={styles.grid} aria-label="Where to go next">
        {NEXT.map(item => (
          <Link key={item.to} to={item.to} className={styles.card}>
            <span className={styles.cardLabel}>{item.label}</span>
            <span className={styles.cardDetail}>{item.detail}</span>
          </Link>
        ))}
      </nav>
      <p className={styles.search}>
        To find a page, press <kbd>Ctrl</kbd> <kbd>K</kbd>, or <kbd>⌘</kbd>{' '}
        <kbd>K</kbd> on a Mac, or use the search box in the header.
      </p>
    </main>
  );
}
