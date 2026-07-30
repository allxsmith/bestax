import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';
import { PACKAGE_MANAGERS, renderCommand, lintCommand } from './translate.mjs';
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
 * The shared `groupId` is the point of using @theme/Tabs rather than hand-rolling:
 * Docusaurus persists the choice in localStorage, so picking npm on one page
 * selects npm on every other page and in the homepage hero switcher. The tab
 * `value`s must stay exactly the PACKAGE_MANAGERS strings — Docusaurus silently
 * discards a stored value that isn't valid for the group.
 *
 * Registered globally in src/theme/MDXComponents.js, so docs pages use it without
 * an import.
 */
export default function PackageManagerTabs({ command }) {
  if (process.env.NODE_ENV === 'development') {
    for (const warning of lintCommand(command)) {
      console.warn(`PackageManagerTabs: ${warning}`);
    }
  }

  return (
    <div className={styles.tabs}>
      <Tabs groupId="package-manager" defaultValue={PACKAGE_MANAGERS[0]}>
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
