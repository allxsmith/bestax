import MDXComponents from '@theme-original/MDXComponents';
import PackageManagerTabs from '@site/src/components/PackageManagerTabs';

/**
 * Make PackageManagerTabs available to every docs page without an import.
 *
 * ~20 pages carry install commands, and none of the 135 `.md` files has an import
 * line today — adding one to each would put churn in exactly the diffs a reviewer
 * needs to read closely (the ones nested in numbered steps). Spreading
 * @theme-original keeps Docusaurus's own mapping intact.
 *
 * Forgetting a global registration is a loud failure — MDX throws "Expected
 * component `X` to be defined" during the SSR prerender, naming the file — so
 * this trades no safety for the reduced churn.
 */
export default {
  ...MDXComponents,
  PackageManagerTabs,
};
