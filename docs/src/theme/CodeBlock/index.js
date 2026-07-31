import React, { useState, useEffect } from 'react';
import OriginalCodeBlock from '@theme-init/CodeBlock';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { LiveProvider, LiveEditor, LiveError } from 'react-live';
import * as BestaxBulma from '@allxsmith/bestax-bulma';
import { ProfileCard } from '@site/src/components/SkillExamples';
import SmartTheme from './ShadowTheme';
import BrowserWindow from './BrowserWindow';

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

// Define a transform function to remove import lines and export default statements
function transformCode(code) {
  // Split into lines, filter out those starting with 'import' or 'export default' (after trimming whitespace),
  // and rejoin. This handles single-line imports and exports; for multi-line, adjust if your examples use them.
  return code
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return (
        !trimmed.startsWith('import') && !trimmed.startsWith('export default')
      );
    })
    .join('\n');
}

// If needed, extend the scope to include your bestax-bulma components for use in live code
const scope = {
  ...BestaxBulma,
  Theme: SmartTheme, // Override with our smart Theme selector
  ProfileCard, // docs-only Skill Example component (not shipped in the library)
  React,
  useState,
  useEffect,
};

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

export default function CodeBlockEnhancer(props) {
  const liveTitle = props.title ?? extractTitleFromMeta(props.metastring);

  if (!isLiveCodeBlock(props)) {
    return <OriginalCodeBlock {...props} />;
  }

  return (
    <LiveProvider
      code={props.children}
      scope={scope} /* other props as needed */
      transformCode={transformCode}
    >
      <BrowserOnly fallback={<div className="live-preview" />}>
        {() => (
          <React.Suspense fallback={<div className="live-preview" />}>
            <ShadowLivePreview />
          </React.Suspense>
        )}
      </BrowserOnly>
      <LiveError className="live-error alert alert--danger" />
      <BrowserEditor title={liveTitle} />
    </LiveProvider>
  );
}
