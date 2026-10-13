import { useEffect } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation } from '@docusaurus/router';
import Button from '@theme/CodeBlock/Buttons/Button';
import { docsOnlyNames } from '../scope';

import styles from './styles.module.css';

/**
 * "Open in StackBlitz" and "Open in CodeSandbox" for a live example.
 *
 * The project is built when the reader clicks, from the code in the editor,
 * so every live example gets the buttons and nothing is published ahead of
 * time. The builder loads on demand (see ../sandbox/open.js).
 */

/** An example that names a docs-only component cannot run in a sandbox. */
const DOCS_ONLY =
  docsOnlyNames.length > 0
    ? new RegExp(`\\b(?:${docsOnlyNames.join('|')})\\b`)
    : null;

let loading = null;
let loaded = null;

/** Loads the sandbox builder once per page, and keeps it once loaded. */
function loadSandbox() {
  loading ??= import('../sandbox/open').then(
    module => {
      loaded = module;
      return module;
    },
    error => {
      loading = null;
      throw error;
    }
  );
  return loading;
}

function warmUp() {
  loadSandbox().catch(() => {
    // A failed warm-up is retried by the click.
  });
}

function StackBlitzIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <path d="M10.797 14.182H3.635L16.728 0l-3.525 9.818h7.162L7.272 24l3.524-9.818Z" />
    </svg>
  );
}

function CodeSandboxIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <path d="M2 6l10.455-6L22.91 6 23 17.95 12.455 24 2 18V6zm2.088 2.481v4.757l3.345 1.86v3.516l3.972 2.296v-8.272L4.088 8.481zm16.739 0l-7.317 4.157v8.272l3.972-2.296V15.1l3.345-1.861V8.48zM5.134 6.601l7.303 4.144 7.32-4.18-3.871-2.197-3.41 1.945-3.43-1.968L5.133 6.6z" />
    </svg>
  );
}

const SERVICES = [
  {
    label: 'Open in StackBlitz',
    open: 'openInStackBlitz',
    Icon: StackBlitzIcon,
  },
  {
    label: 'Open in CodeSandbox',
    open: 'openInCodeSandbox',
    Icon: CodeSandboxIcon,
  },
];

export default function SandboxButtons({ code }) {
  const { siteConfig } = useDocusaurusContext();
  const { pathname } = useLocation();

  // Load the builder while the reader is idle. A click then opens the new tab
  // inside the click itself, which popup blockers allow; a tab opened after
  // waiting on a network request may be refused.
  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warmUp, { timeout: 5000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(warmUp, 2000);
    return () => window.clearTimeout(id);
  }, []);

  if (DOCS_ONLY?.test(code)) {
    return null;
  }

  const open = name => {
    const options = {
      code,
      sourceUrl: new URL(pathname, siteConfig.url).href,
      bestaxVersion: siteConfig.customFields.bestaxVersion,
    };
    if (loaded) {
      loaded[name](options);
    } else {
      loadSandbox()
        .then(module => module[name](options))
        .catch(error => {
          console.error('Could not open the example in a sandbox:', error);
        });
    }
  };

  return SERVICES.map(({ label, open: name, Icon }) => (
    <Button
      key={name}
      aria-label={label}
      title={label}
      onClick={() => open(name)}
      onFocus={warmUp}
      onPointerEnter={warmUp}
    >
      <Icon />
    </Button>
  ));
}
