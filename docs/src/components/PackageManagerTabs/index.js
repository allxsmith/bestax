import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';
import {
  PACKAGE_MANAGERS,
  DEFAULT_PACKAGE_MANAGER,
  TAB_GROUP_ID,
  renderCommand,
  lintCommand,
  splitSegments,
} from './translate.mjs';
import styles from './styles.module.css';

/**
 * One install command, shown for pnpm, npm, yarn and bun.
 *
 * `command` is authored in pnpm's verb vocabulary — `add foo`, `add -D foo`,
 * `install`, `create x`, `dlx x`, `run dev` — and translate.mjs derives the other
 * three. Several lines go in one `command`, separated by `;`; segments that
 * aren't a known verb (`cd my-app`, a `#` comment) pass through unchanged. See
 * translate.mjs for why pnpm is the authoring vocabulary and the first tab.
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
export default function PackageManagerTabs({ command }) {
  // Throws rather than rendering something wrong, and deliberately not gated on
  // NODE_ENV: `docusaurus build` prerenders every page with NODE_ENV=production,
  // so an unconditional throw is what turns an authoring slip into a failed build
  // that names the page. A dev-only check would miss it in CI entirely.
  //
  // The flatten gate in flatten-llms-tabs.mjs already catches a *missing*
  // attribute — its regex requires a literal command="…", so <PackageManagerTabs />
  // survives as raw JSX and fails verifyArtifact. It cannot see command="" or
  // command=" ; ", which flatten to a silent empty ```bash fence. This closes that.
  //
  // Because the prerender covers every page, this can never fire in a browser on
  // a site that built successfully.
  if (typeof command !== 'string' || splitSegments(command).length === 0) {
    throw new Error(
      `PackageManagerTabs: \`command\` must be a non-empty string, got ${JSON.stringify(command)}. ` +
        'Author it in pnpm verb vocabulary, e.g. command="add @allxsmith/bestax-bulma".'
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
