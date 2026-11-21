/**
 * The docs site's axe exemptions (#2183), read by `a11y-scan.mjs`.
 *
 * Each entry covers one axe rule on the pages it names, in both color modes
 * unless `themes` limits it, and says why: the open `issue` that will remove
 * it, or the `reason` axe is wrong there or the markup isn't ours. A page
 * pattern is a path, or a path prefix ending in `*`. With `targets`, an
 * entry covers only those elements, written exactly as the scan prints
 * them. A run reports a page pattern that covered nothing, and the fix for a
 * page removes that page from its entry.
 *
 * @type {{ rule: string, pages: string[], targets?: string[], themes?: ('light' | 'dark')[], issue?: number, reason?: string }[]}
 */
export default [
  // Contrast is unchecked on every page until #2215 settles the site's colors
  // (the footer, the code highlighting and the homepage's hero and banner
  // fail it today).
  { rule: 'color-contrast', pages: ['/*'], issue: 2215 },
  // DocSearch's button, in the navbar of every page.
  {
    rule: 'label-content-name-mismatch',
    pages: ['/*'],
    targets: ['.DocSearch'],
    issue: 2216,
  },
  // Unchecked on every page: links in running text are marked by color alone,
  // site-wide.
  { rule: 'link-in-text-block', pages: ['/*'], issue: 2203 },
  // Unchecked on the blog's pages, where every post and list shows the
  // author's social links.
  { rule: 'target-size', pages: ['/blog*'], issue: 2218 },
  // Wide tables that scroll without taking focus.
  {
    rule: 'scrollable-region-focusable',
    pages: [
      '/docs/api/components/modal',
      '/docs/api/components/panel',
      '/docs/api/components/tabs',
      '/docs/api/helpers/usebulmaclasses',
    ],
    issue: 2219,
  },

  // The library's own open issues, showing in the live examples. Most have
  // stories exempt for them in bulma-ui's stories-a11y.test.ts too.
  {
    rule: 'target-size',
    pages: ['/docs/api/components/carousel'],
    issue: 1926,
  },
  { rule: 'target-size', pages: ['/docs/api/form/slider'], issue: 2195 },
  // Label in name, in the examples.
  {
    rule: 'label-content-name-mismatch',
    pages: ['/docs/api/components/avatar'],
    issue: 2211,
  },
  {
    rule: 'label-content-name-mismatch',
    pages: [
      '/docs/api/form/datetime/calendar',
      '/docs/api/form/datetime/dateinput',
    ],
    issue: 2209,
  },
  {
    rule: 'label-content-name-mismatch',
    pages: ['/docs/api/components/treeview', '/docs/guides/library/components'],
    reason:
      "An expanded tree item contains its group of child items, as the ARIA tree pattern has it, so axe counts the children's text as text the item shows. bulma-ui's stories-a11y.test.ts exempts the TreeView stories for the same reason.",
  },
  {
    rule: 'label-content-name-mismatch',
    pages: ['/docs/api/components/command'],
    reason:
      "A Command option's name is its label, and its description and shortcut hint describe it, so axe counts text the option shows that its name leaves out on purpose. bulma-ui's stories-a11y.test.ts exempts the Command stories for the same reason.",
  },
  // Tabs.List calls Tabs.Item's links a tab list.
  ...['aria-required-children', 'listitem'].map(rule => ({
    rule,
    pages: [
      '/docs/guides/getting-started/migration/bulma-ui-2-to-3',
      '/blog/2026/07/28/bulma-3-css-framework-ai-will-never-tell-you-about-it',
    ],
    issue: 1917,
  })),
];
