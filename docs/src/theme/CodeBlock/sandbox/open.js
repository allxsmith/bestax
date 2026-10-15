import sdk from '@stackblitz/sdk';
import * as BestaxBulma from '@allxsmith/bestax-bulma';
import docsPackage from '@site/package.json';
import indexHtml from '!!raw-loader!@site/../create-bestax/templates/vite-ts/index.html';
import packageJson from '!!raw-loader!@site/../create-bestax/templates/vite-ts/package.json';
import bestaxSvg from '!!raw-loader!@site/../create-bestax/templates/vite-ts/public/bestax.svg';
import indexCss from '!!raw-loader!@site/../create-bestax/templates/vite-ts/src/index.css';
import mainTsx from '!!raw-loader!@site/../create-bestax/templates/vite-ts/src/main.tsx';
import viteEnv from '!!raw-loader!@site/../create-bestax/templates/vite-ts/src/vite-env.d.ts';
import tsconfigApp from '!!raw-loader!@site/../create-bestax/templates/vite-ts/tsconfig.app.json';
import tsconfig from '!!raw-loader!@site/../create-bestax/templates/vite-ts/tsconfig.json';
import tsconfigNode from '!!raw-loader!@site/../create-bestax/templates/vite-ts/tsconfig.node.json';
import viteConfig from '!!raw-loader!@site/../create-bestax/templates/vite-ts/vite.config.ts';
import { docsOnlyNames, reactScopeNames } from '../scope';
import { toExampleModule } from './example.mjs';
import {
  ICON_LIBRARIES,
  codesandboxFiles,
  iconLibrariesIn,
  stackblitzProject,
} from './projects.mjs';

/**
 * Opens a live example in StackBlitz or CodeSandbox.
 *
 * Loaded on demand by the sandbox buttons, so a page pays for the SDK, the
 * template and the converter only once a reader is likely to click. Nothing
 * is published ahead of time: each click builds the project from the code in
 * the editor, edits included, and hands it to the service in a new tab.
 */

/** The create-bestax `vite-ts` template, read at build time. */
const TEMPLATE = {
  'index.html': indexHtml,
  'package.json': packageJson,
  'public/bestax.svg': bestaxSvg,
  'src/index.css': indexCss,
  'src/main.tsx': mainTsx,
  'src/vite-env.d.ts': viteEnv,
  'tsconfig.app.json': tsconfigApp,
  'tsconfig.json': tsconfig,
  'tsconfig.node.json': tsconfigNode,
  'vite.config.ts': viteConfig,
};

/**
 * Read from the library, not the live scope: the scope swaps in a shadow-DOM
 * `Theme` that exists only because the preview renders inside a shadow root,
 * and a sandbox should import the real one.
 */
const LIBRARY_EXPORTS = Object.keys(BestaxBulma);

/** The icon packages at the versions the docs site itself renders with. */
function iconVersions() {
  const deps = docsPackage.dependencies;
  return Object.fromEntries(
    Object.values(ICON_LIBRARIES).map(({ package: name }) => [name, deps[name]])
  );
}

/**
 * @param {object} options
 * @param {string} options.code The editor's current code.
 * @param {string} options.sourceUrl The docs page, linked from the project.
 * @param {string} options.bestaxVersion The library release the docs build read.
 */
function prepare({ code, sourceUrl, bestaxVersion }) {
  const example = toExampleModule(code, {
    libraryExports: LIBRARY_EXPORTS,
    reactNames: reactScopeNames,
    docsOnlyNames,
    sourceUrl,
  });
  if (!example) return null;
  const pageTitle = document.title.split(' | ')[0].trim() || 'bestax';
  return {
    app: example.source,
    icons: iconLibrariesIn(code),
    template: TEMPLATE,
    versions: {
      '@allxsmith/bestax-bulma': `^${bestaxVersion}`,
      ...iconVersions(),
    },
    title: `${pageTitle} example`,
    sourceUrl,
  };
}

export function openInStackBlitz(options) {
  const input = prepare(options);
  if (!input) return;
  sdk.openProject(stackblitzProject(input), {
    newWindow: true,
    openFile: 'src/App.tsx',
  });
}

const CODESANDBOX_DEFINE =
  'https://codesandbox.io/api/v1/sandboxes/define?json=1';

/** Creates the sandbox from its files and resolves to the id CodeSandbox gives it. */
async function defineSandbox(files) {
  const response = await fetch(CODESANDBOX_DEFINE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files }),
  });
  if (!response.ok) {
    throw new Error(`CodeSandbox answered ${response.status}`);
  }
  const { sandbox_id: id } = await response.json();
  return id;
}

/**
 * The tab opens inside the click, before the request: a window opened after
 * the await would be refused as a popup. It is pointed at the sandbox once
 * CodeSandbox has created it.
 */
export function openInCodeSandbox(options) {
  const input = prepare(options);
  if (!input) return;
  const tab = window.open('', '_blank');
  if (tab) tab.opener = null;
  defineSandbox(codesandboxFiles(input)).then(
    id => {
      if (tab)
        tab.location.href = `https://codesandbox.io/s/${id}?file=/src/App.tsx`;
    },
    error => {
      tab?.close();
      console.error('Could not open the example in CodeSandbox:', error);
    }
  );
}
