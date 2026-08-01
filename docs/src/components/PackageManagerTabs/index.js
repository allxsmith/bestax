import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';
import {
  PACKAGE_MANAGERS,
  DEFAULT_PACKAGE_MANAGER,
  TAB_GROUP_ID,
  renderCommand,
  unrenderPnpm,
  lintCommand,
} from './translate.mjs';
import styles from './styles.module.css';

/**
 * One install command, shown for pnpm, npm, yarn and bun.
 *
 * Authored as a plain pnpm code fence wrapped in the component:
 *
 *     <PackageManagerTabs>
 *
 *     ```bash
 *     pnpm add @allxsmith/bestax-bulma
 *     ```
 *
 *     </PackageManagerTabs>
 *
 * The fence is the single source of truth. npm, yarn and bun are derived from it
 * by translate.mjs; several lines are just several lines in the fence, and a line
 * that isn't a pnpm verb (`cd my-app`, a `#` comment) passes through unchanged.
 *
 * **Why children and not a `command` prop.** `docusaurus-plugin-llms` reads source
 * markdown to build llms.txt and the per-page .md twins, and since 0.5.0 it strips
 * PascalCase JSX tags while "keeping their inner text content". Content in a *prop*
 * is not inner text — it goes with the tag. A self-closing
 * `<PackageManagerTabs command="…" />` therefore left an empty section in every
 * artifact, silently: the site rendered fine and only the machine-readable copy
 * lost the command. Putting the fence in the children means the plugin's strip
 * removes the wrapper and leaves exactly the pnpm block behind, so the artifact is
 * correct by construction with no build step to keep in sync. See
 * rachfop/docusaurus-plugin-llms#64.
 *
 * That is also why the pnpm tab is written out rather than derived: what an agent
 * reads in llms.txt is literally the text authored here, so the default tab a
 * reader sees and the artifact an agent copies cannot drift. The assertion below
 * enforces the other half — that the derived pnpm rendering matches the fence.
 *
 * The shared `TAB_GROUP_ID` is the point of using @theme/Tabs rather than
 * hand-rolling: Docusaurus persists the choice in localStorage, so picking npm on
 * one page selects npm on every other page and in the homepage hero switcher. The
 * tab `value`s must stay exactly the PACKAGE_MANAGERS strings — Docusaurus
 * silently discards a stored value that isn't valid for the group.
 *
 * Registered globally in src/theme/MDXComponents.js, so docs pages use it without
 * an import.
 */

/**
 * Flatten MDX children to their text.
 *
 * A fenced block reaches us as an element tree (`pre` → `code` → string, through
 * whatever the theme maps those to — this site swizzles CodeBlock). Walking
 * `props.children` recursively avoids depending on that shape, so a theme upgrade
 * that adds a wrapper doesn't silently return the wrong text.
 */
function textOf(node) {
  if (node === null || node === undefined || typeof node === 'boolean')
    return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (node.props) return textOf(node.props.children);
  return '';
}

export default function PackageManagerTabs({ children }) {
  // The fence as authored, minus the trailing newline MDX leaves on a code block.
  const authored = textOf(children).replace(/\s+$/, '');

  // Throws rather than rendering something wrong, and deliberately not gated on
  // NODE_ENV: `docusaurus build` prerenders every page with NODE_ENV=production,
  // so an unconditional throw is what turns an authoring slip into a failed build
  // that names the page. A dev-only check would miss it in CI entirely — and
  // because the prerender covers every page, this can never fire in a browser on
  // a site that built successfully.
  if (!authored) {
    throw new Error(
      'PackageManagerTabs: expected a pnpm code fence as its children, e.g.\n' +
        '<PackageManagerTabs>\n\n```bash\npnpm add @allxsmith/bestax-bulma\n```\n\n</PackageManagerTabs>'
    );
  }

  // A fence delimiter reaching us as *text* means MDX didn't parse the block —
  // almost always the missing blank lines around it. Worth its own check because
  // the round trip below cannot catch it: ```bash is not a known verb, so it
  // passes through untouched on every tab and the equality still holds. The tabs
  // would then render the fence markers inside the code block, silently.
  if (/^\s*(?:```|~~~)/m.test(authored)) {
    throw new Error(
      'PackageManagerTabs: the code fence was not parsed as markdown — its\n' +
        'delimiters arrived as text. Put a blank line before and after it:\n' +
        '<PackageManagerTabs>\n\n```bash\npnpm add @allxsmith/bestax-bulma\n```\n\n</PackageManagerTabs>'
    );
  }

  // Recover the authoring vocabulary translate.mjs expects (`add foo`) from the
  // rendered pnpm form (`pnpm add foo`).
  const command = unrenderPnpm(authored);

  // The round trip has to be exact, or the other three tabs are derived from
  // something the reader never saw. This fires on a fence that isn't canonical
  // pnpm — `npm install foo`, odd spacing, a stray blank line — naming the page.
  const roundTrip = renderCommand(command, DEFAULT_PACKAGE_MANAGER);
  if (roundTrip !== authored) {
    throw new Error(
      `PackageManagerTabs: the fence is not a canonical pnpm command.\n` +
        `  authored:   ${JSON.stringify(authored)}\n` +
        `  round trip: ${JSON.stringify(roundTrip)}\n` +
        'Write the pnpm form exactly, one command per line.'
    );
  }

  if (process.env.NODE_ENV === 'development') {
    for (const warning of lintCommand(command)) {
      console.warn(`PackageManagerTabs: ${warning}`);
    }
  }

  return (
    <div className={styles.tabs}>
      <Tabs groupId={TAB_GROUP_ID} defaultValue={DEFAULT_PACKAGE_MANAGER}>
        {PACKAGE_MANAGERS.map(manager => (
          <TabItem key={manager} value={manager} label={manager}>
            <CodeBlock language="bash">
              {renderCommand(command, manager)}
            </CodeBlock>
          </TabItem>
        ))}
      </Tabs>
    </div>
  );
}
