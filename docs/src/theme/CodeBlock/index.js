import React, { useState, useEffect } from 'react';
import OriginalCodeBlock from '@theme-init/CodeBlock';
// import LiveCodeBlock from '@theme/LiveCodeBlock';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import root from 'react-shadow'; // Import from react-shadow
import { useColorMode } from '@docusaurus/theme-common';
import * as BestaxBulma from '@allxsmith/bestax-bulma';
import rawBulmaStyles from '!!raw-loader!bulma/css/bulma.min.css';
import rawFontAwesomeStyles from '!!raw-loader!@fortawesome/fontawesome-free/css/all.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import BrowserWindow from './BrowserWindow';

// Preprocess: Replace :root with :host for Shadow DOM compatibility
const bulmaStyles = rawBulmaStyles
  .replace(/:root/g, ':host')
  .replace(/@media\s*\(prefers-color-scheme:\s*dark\){/g, ':host(.dark){')
  .replace(/@media\s*\(prefers-color-scheme:\s*light\){/g, ':host(.light){');

const fontAwesomeStyles = rawFontAwesomeStyles
  .replace(/:root/g, ':host') // Fix vars like Bulma
  .replace(/url\(\.\.\/webfonts\//g, 'url(/webfonts/');

function isLiveCodeBlock(props) {
  return !!props.live;
}

// Define a transform function to remove import lines
function transformCode(code) {
  // Split into lines, filter out those starting with 'import' (after trimming whitespace),
  // and rejoin. This handles single-line imports; for multi-line, adjust if your examples use them.
  return code
    .split('\n')
    .filter(line => !line.trim().startsWith('import'))
    .join('\n');
}

// If needed, extend the scope to include your bestax-bulma components for use in live code
const scope = {
  ...BestaxBulma,
  useState,
  useEffect,
};

function BrowserEditor() {
  return (
    <BrowserWindow>
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
  const { colorMode } = useColorMode();

  return isLiveCodeBlock(props) ? (
    <LiveProvider
      code={props.children}
      scope={scope} /* other props as needed */
      transformCode={transformCode}
    >
      <root.div
        mode="open"
        className={
          colorMode === 'dark' ? ' live-preview dark' : 'live-preview light'
        }
      >
        <style>{bulmaStyles}</style>
        <style>{fontAwesomeStyles}</style>
        <LivePreview />
      </root.div>
      <LiveError className="live-error alert alert--danger" />
      <BrowserEditor />
    </LiveProvider>
  ) : (
    <OriginalCodeBlock {...props} />
  );
}
