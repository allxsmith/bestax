import React from 'react';
import OriginalCodeBlock from '@theme-init/CodeBlock';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { LiveProvider, LiveEditor, LiveError } from 'react-live';
import BrowserWindow from './BrowserWindow';
import { scope } from './scope';
import { stripModuleLines } from './sandbox/moduleLines.mjs';

/**
 * The preview's shadow root, split out of the main bundle.
 *
 * It carries the whole shadow stylesheet set (~1.1 MB of Bulma + icon CSS), so
 * keeping it behind a dynamic import means pages with no `live` fence — and the
 * shared chunk every route loads — never pay for it. It renders nothing on the
 * server regardless, since shadow roots are browser-only.
 */
const ShadowLivePreview = React.lazy(() => import('./ShadowLivePreview'));

function isLiveCodeBlock(props) {
  return !!props.live;
}

// Helper: extract title from props.metastring if props.title is not set
function extractTitleFromMeta(metastring) {
  if (typeof metastring !== 'string') return undefined;
  const match = metastring.match(/(?:^|\s)title="([^"]+)"(?:\s|$)/);
  return match ? match[1] : undefined;
}

function BrowserEditor({ title }) {
  return (
    <BrowserWindow url={title}>
      <LiveEditor
        style={{
          backgroundColor: 'var(--prism-background-color)',
          font: 'var(--ifm-code-font-size) / var(--ifm-pre-line-height) var(--ifm-font-family-monospace)',
        }}
      />
    </BrowserWindow>
  );
}

/**
 * Reports when the returned ref first comes within `rootMargin` of the
 * viewport, then stops observing — previews mount once and stay mounted.
 *
 * Degrades to "always in view" where IntersectionObserver is missing, so the
 * page behaves exactly as it did before deferral.
 */
function useInView(rootMargin = '600px') {
  const ref = React.useRef(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    if (inView) {
      return undefined;
    }
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const node = ref.current;
    if (!node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return [ref, inView];
}

/**
 * Holds a preview's place until it scrolls near the viewport.
 *
 * A page like api/form/datetime/timeinput has 42 previews; mounting all of
 * them up front means 42 react-live evaluations and 42 shadow roots before
 * first paint, when only the first two are visible. The slot keeps its own
 * height reserved (see `.live-preview-slot` in custom.css) so deferred
 * previews do not collapse the page.
 */
function DeferredShadowPreview() {
  const [ref, inView] = useInView();

  return (
    <div ref={ref} className="live-preview-slot">
      {inView && (
        <React.Suspense fallback={null}>
          <ShadowLivePreview />
        </React.Suspense>
      )}
    </div>
  );
}

export default function CodeBlockEnhancer(props) {
  const liveTitle = props.title ?? extractTitleFromMeta(props.metastring);

  if (!isLiveCodeBlock(props)) {
    return <OriginalCodeBlock {...props} />;
  }

  return (
    <LiveProvider
      code={props.children}
      scope={scope} /* other props as needed */
      transformCode={stripModuleLines}
    >
      <BrowserOnly fallback={<div className="live-preview-slot" />}>
        {() => <DeferredShadowPreview />}
      </BrowserOnly>
      <LiveError className="live-error alert alert--danger" />
      <BrowserEditor title={liveTitle} />
    </LiveProvider>
  );
}
